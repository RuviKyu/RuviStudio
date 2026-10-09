/* ============================================================================
   lib/imagegen.js — the AI images straight from Google's OFFICIAL Gemini API
   (the Nano Banana family: gemini-2.5-flash-image, gemini-3-pro-image-preview, newer ids via listModels).
   One generateContent request per missing image, a few at a time, retried with backoff on 429 / 5xx /
   network trouble; a prompt the safety filter blocks is reported (not retried) so the prompt can be edited.
   The key is the user's own (AI Studio) and lives in <base>\_SECRETS\secrets.json as "geminiKey".
     POST https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent
       { contents:[{ parts:[{ text }] }], generationConfig:{ responseModalities:["IMAGE"], imageConfig:{ aspectRatio, imageSize } } }
     → candidates[0].content.parts[].inlineData { mimeType, data }   (imageSize only on the Pro / 3.x models)
   ========================================================================== */
"use strict";
var fs = require("fs"), path = require("path"), https = require("https"), http = require("http");

var DEFAULT_BASE = "https://generativelanguage.googleapis.com/v1beta";
var KNOWN_MODELS = [
    { id: "gemini-3-pro-image-preview", label: "Nano Banana Pro (gemini-3-pro-image-preview) · 1K/2K/4K · best quality", sizes: true },
    { id: "gemini-2.5-flash-image", label: "Nano Banana (gemini-2.5-flash-image) · 1K · cheapest", sizes: false }
];
function supportsSize(model) { return !/2\.5-flash-image/.test(String(model || "")); }

function request(method, u, body, headers, timeoutMs) {
    return new Promise(function (resolve, reject) {
        var mod = /^https:/.test(u) ? https : http, data = body != null ? Buffer.from(JSON.stringify(body)) : null;
        var req = mod.request(u, { method: method, headers: Object.assign({ "User-Agent": "RuviStudio (imagegen)", "Accept": "application/json" }, data ? { "Content-Type": "application/json", "Content-Length": data.length } : {}, headers || {}) }, function (res) {
            var chunks = []; res.on("data", function (c) { chunks.push(c); }); res.on("end", function () { var txt = Buffer.concat(chunks).toString("utf8"), j = null; try { j = JSON.parse(txt); } catch (e) {} resolve({ status: res.statusCode, headers: res.headers, json: j, text: txt }); });
        });
        req.on("error", reject); req.setTimeout(timeoutMs || 180000, function () { req.destroy(new Error("timeout after " + Math.round((timeoutMs || 180000) / 1000) + " s")); });
        if (data) req.write(data); req.end();
    });
}

/* the models this key can use for images (name, display name, methods) — so a newer Nano Banana shows up without an app update */
function listModels(key, base) {
    return request("GET", (base || DEFAULT_BASE) + "/models?pageSize=200", null, { "x-goog-api-key": key }, 30000).then(function (r) {
        if (r.status !== 200 || !r.json) throw new Error("models: HTTP " + r.status + " " + ((r.json && r.json.error && r.json.error.message) || r.text.slice(0, 160)));
        var all = (r.json.models || []).map(function (m) { return { id: String(m.name || "").replace(/^models\//, ""), name: m.displayName || "", methods: m.supportedGenerationMethods || [], desc: m.description || "" }; });
        var img = all.filter(function (m) { return /image/i.test(m.id) && m.methods.indexOf("generateContent") >= 0 && !/embedding|veo|tts|audio|live/i.test(m.id); });
        return { image: img, all: all.length };
    });
}

/* one image. resolves { ok:true, bytes, mime } | { ok:false, blocked:true, reason } | rejects on a retryable / fatal error (err.retryable) */
function generateOne(opts) {
    var model = opts.model || KNOWN_MODELS[0].id, cfg = { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: opts.aspectRatio || "16:9" } };
    if (opts.imageSize && supportsSize(model)) cfg.imageConfig.imageSize = opts.imageSize;
    var body = { contents: [{ parts: [{ text: opts.prompt }] }], generationConfig: cfg };
    return request("POST", (opts.base || DEFAULT_BASE) + "/models/" + encodeURIComponent(model) + ":generateContent", body, { "x-goog-api-key": opts.key }, opts.timeoutMs || 180000).then(function (r) {
        if (r.status !== 200) {
            var msg = (r.json && r.json.error && r.json.error.message) || r.text.slice(0, 200) || ("HTTP " + r.status), e = new Error("HTTP " + r.status + ": " + msg);
            e.status = r.status; e.retryable = r.status === 429 || r.status >= 500 || r.status === 408; e.retryAfter = +(r.headers["retry-after"] || 0) || 0;
            if (r.status === 400 && /API key|api_key/i.test(msg)) e.fatal = true;
            if (r.status === 403 || r.status === 401) e.fatal = true;
            if (r.status === 404) e.fatal = true;   // the model id does not exist for this key
            throw e;
        }
        var j = r.json || {}, pf = j.promptFeedback || {}, cand = (j.candidates || [])[0] || {}, parts = (cand.content && cand.content.parts) || [];
        var img = parts.filter(function (p) { return p.inlineData && p.inlineData.data; })[0];
        if (img) return { ok: true, bytes: Buffer.from(img.inlineData.data, "base64"), mime: img.inlineData.mimeType || "image/png" };
        var reason = pf.blockReason || cand.finishReason || "", txt = parts.filter(function (p) { return p.text; }).map(function (p) { return p.text; }).join(" ").slice(0, 200);
        if (/SAFETY|PROHIBITED|BLOCK|RECITATION|IMAGE_/i.test(reason) || pf.blockReason) return { ok: false, blocked: true, reason: reason + (txt ? " — " + txt : "") };
        var e2 = new Error("no image in the response" + (reason ? " (" + reason + ")" : "") + (txt ? ": " + txt : "")); e2.retryable = true; throw e2;
    });
}

function extFor(mime) { return /jpe?g/i.test(mime) ? ".jpg" : /webp/i.test(mime) ? ".webp" : ".png"; }
function sleep(ms, abort) { return new Promise(function (res) { var left = ms; (function tick() { if (abort && abort.aborted) return res(); if (left <= 0) return res(); var step = Math.min(1000, left); left -= step; setTimeout(tick, step); })(); }); }

/* items: [{ image: 7, stem: "007", prompt }] (the missing ones). opts: { key, model, imageSize, aspectRatio, parallel, retries, dir, abort, base }
   log(msg); progress(done, total, lastName). Resolves { done, failed, blocked:[{stem, reason}], errors:[{stem, error}], cancelled, seconds } */
function runItems(items, opts, log, progress) {
    var parallel = Math.max(1, Math.min(8, opts.parallel | 0 || 2)), retries = opts.retries == null ? 4 : (opts.retries | 0), dir = opts.dir, started = Date.now();
    var done = 0, failed = 0, blocked = [], errors = [], idx = 0, active = 0, fatal = null, finished = 0;
    fs.mkdirSync(dir, { recursive: true });
    log("generate: " + items.length + " image(s) with " + (opts.model || KNOWN_MODELS[0].id) + " · " + (opts.aspectRatio || "16:9") + (supportsSize(opts.model) && opts.imageSize ? " · " + opts.imageSize : "") + " · " + parallel + " at a time");
    function one(it) {
        var attempt = 0;
        function go() {
            attempt++;
            return generateOne({ key: opts.key, model: opts.model, prompt: it.prompt, aspectRatio: opts.aspectRatio, imageSize: opts.imageSize, base: opts.base, timeoutMs: opts.timeoutMs }).then(function (r) {
                if (r.blocked) { blocked.push({ stem: it.stem, reason: r.reason }); log("generate: " + it.stem + " ✗ blocked by the safety filter (" + r.reason.slice(0, 120) + ") — edit the prompt and run again"); return; }
                if (r.bytes.length < 2048) throw Object.assign(new Error("tiny image (" + r.bytes.length + " bytes)"), { retryable: true });
                var dest = path.join(dir, it.stem + extFor(r.mime)), tmp = dest + ".part"; fs.writeFileSync(tmp, r.bytes); fs.renameSync(tmp, dest);
                done++; log("generate: " + it.stem + " ✓ " + (r.bytes.length / 1024).toFixed(0) + " KB (" + ((Date.now() - started) / 1000).toFixed(0) + " s in)");
            }, function (e) {
                if (opts.abort && opts.abort.aborted) throw e;
                if (e.fatal) { fatal = fatal || e; throw e; }
                if ((e.retryable || /ECONN|ETIMEDOUT|EAI_AGAIN|socket|timeout/i.test(e.message)) && attempt <= retries) {
                    var wait = e.retryAfter ? e.retryAfter * 1000 : Math.min(120000, 5000 * Math.pow(3, attempt - 1));
                    log("generate: " + it.stem + " retry " + attempt + "/" + retries + " in " + Math.round(wait / 1000) + " s — " + e.message.slice(0, 120));
                    return sleep(wait, opts.abort).then(function () { if (opts.abort && opts.abort.aborted) throw new Error("killed"); return go(); });
                }
                throw e;
            });
        }
        return go();
    }
    return new Promise(function (resolve) {
        function next() {
            if ((opts.abort && opts.abort.aborted) || fatal) { if (!active) resolve({ done: done, failed: failed + (items.length - finished - (fatal ? 0 : 0)), blocked: blocked, errors: errors, cancelled: !!(opts.abort && opts.abort.aborted), fatal: fatal ? fatal.message : "", seconds: (Date.now() - started) / 1000 }); return; }
            if (idx >= items.length) { if (!active) resolve({ done: done, failed: failed, blocked: blocked, errors: errors, seconds: (Date.now() - started) / 1000 }); return; }
            var it = items[idx++]; active++;
            one(it).then(function () {}, function (e) { failed++; errors.push({ stem: it.stem, error: e.message }); if (!e.fatal) log("generate: " + it.stem + " ✗ " + e.message.slice(0, 160)); })
                .then(function () { active--; finished++; if (progress) progress(done + failed + blocked.length, items.length, it.stem); next(); });
            if (active < parallel) next();
        }
        if (progress) progress(0, items.length, "");
        next();
    });
}
module.exports = { listModels: listModels, generateOne: generateOne, runItems: runItems, KNOWN_MODELS: KNOWN_MODELS, supportsSize: supportsSize, DEFAULT_BASE: DEFAULT_BASE };
