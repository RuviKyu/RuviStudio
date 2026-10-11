/* ============================================================================
   lib/upscaler.js — Ruvi's Batch Oil Upscaler, driven from the app.
   Same contract as the web UI (public/index.html of RuviKyu/comfy-oil-upscaler):
     POST <url>/api/run      { workflow, image: { name, image(base64) } } → { jobId, status }
     GET  <url>/api/status?jobId=… → { status: IN_QUEUE|IN_PROGRESS|COMPLETED|FAILED|CANCELLED|TIMED_OUT,
                                       output: { images: [{ filename, type: "base64"|"s3_url", data }] } }
   One job per image, submitted up to `parallel` at a time, polled every 2.5 s, 20 min max per image.
   Output: <base>_painted.<ext> beside the original; originals move into AI Images\_raw\ so the
   section renderer picks the painted file (001_painted.jpg matches AI IMAGE 001).
   ========================================================================== */
"use strict";
var fs = require("fs"), path = require("path"), https = require("https"), http = require("http");

var BASE_POSITIVE = "oil painting, bichu, oil painting, Impressionism", SEP = ", ";
var WORKFLOW = {
    "1": { class_type: "CheckpointLoaderSimple", _meta: { title: "Load Checkpoint" }, inputs: { ckpt_name: "oilPainting_oilPaintingV10.safetensors" } },
    "2": { class_type: "VAELoader", _meta: { title: "Load VAE" }, inputs: { vae_name: "vaeFtMse840000EmaPruned_vaeFtMse840k.safetensors" } },
    "3": { class_type: "LoraLoader", _meta: { title: "Load LoRA" }, inputs: { lora_name: "bichu-v0612.safetensors", strength_model: 0.4, strength_clip: 0.4, model: ["1", 0], clip: ["1", 1] } },
    "4": { class_type: "UpscaleModelLoader", _meta: { title: "Load Upscale Model" }, inputs: { model_name: "4x_foolhardy_Remacri.pth" } },
    "5": { class_type: "LoadImage", _meta: { title: "Load Input Image" }, inputs: { image: "input_placeholder.png" } },
    "6": { class_type: "CLIPTextEncode", _meta: { title: "Positive" }, inputs: { text: BASE_POSITIVE, clip: ["3", 1] } },
    "7": { class_type: "CLIPTextEncode", _meta: { title: "Negative" }, inputs: { text: "embedding:easynegative", clip: ["3", 1] } },
    "8": { class_type: "UltimateSDUpscale", _meta: { title: "Ultimate SD Upscale" }, inputs: { image: ["5", 0], model: ["3", 0], positive: ["6", 0], negative: ["7", 0], vae: ["2", 0], upscale_model: ["4", 0], upscale_by: 2.5, seed: 481652557693914, steps: 20, cfg: 5, sampler_name: "dpm_fast", scheduler: "karras", denoise: 0.36, mode_type: "Linear", tile_width: 512, tile_height: 512, mask_blur: 12, tile_padding: 32, seam_fix_mode: "None", seam_fix_denoise: 1, seam_fix_width: 64, seam_fix_mask_blur: 8, seam_fix_padding: 16, force_uniform_tiles: true, tiled_decode: true, batch_size: 28 } },
    "9": { class_type: "SaveImage", _meta: { title: "Save Image" }, inputs: { filename_prefix: "upscaled", images: ["8", 0] } }
};
var IMG_RE = /\.(jpe?g|png|webp)$/i, POLL_MS = 2500, MAX_MS = 20 * 60e3, WARN_BYTES = 4 * 1024 * 1024;

function request(method, u, body, headers) {
    return new Promise(function (resolve, reject) {
        var mod = /^https:/.test(u) ? https : http, data = body != null ? Buffer.from(JSON.stringify(body)) : null;
        var req = mod.request(u, { method: method, headers: Object.assign({ "User-Agent": "RuviStudio/3.5 (upscaler)", "Accept": "application/json" }, data ? { "Content-Type": "application/json", "Content-Length": data.length } : {}, headers || {}) }, function (res) {
            var b = ""; res.setEncoding("utf8"); res.on("data", function (c) { b += c; }); res.on("end", function () { var j = null; try { j = JSON.parse(b); } catch (e) {} resolve({ status: res.statusCode, json: j, text: b }); });
        });
        req.on("error", reject); req.setTimeout(120000, function () { req.destroy(new Error("timeout")); }); if (data) req.write(data); req.end();
    });
}
function fetchBinary(u, dest, hops) {
    hops = hops || 0;
    return new Promise(function (resolve, reject) {
        if (hops > 6) return reject(new Error("too many redirects"));
        var mod = /^https:/.test(u) ? https : http;
        mod.get(u, { headers: { "User-Agent": "RuviStudio/3.5 (upscaler)" } }, function (res) {
            if ([301, 302, 303, 307, 308].indexOf(res.statusCode) >= 0 && res.headers.location) { res.resume(); return fetchBinary(new URL(res.headers.location, u).href, dest, hops + 1).then(resolve, reject); }
            if (res.statusCode !== 200) { res.resume(); return reject(new Error("HTTP " + res.statusCode)); }
            var ws = fs.createWriteStream(dest + ".part"); res.pipe(ws); ws.on("finish", function () { ws.close(function () { fs.renameSync(dest + ".part", dest); resolve(dest); }); }); ws.on("error", reject);
        }).on("error", reject);
    });
}
function sanitize(name) { var dot = name.lastIndexOf("."), ext = dot >= 0 ? name.slice(dot) : ".png", base = (dot >= 0 ? name.slice(0, dot) : name).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 48) || "image"; return { base: base, ext: ext.replace(/[^a-zA-Z0-9.]/g, "") || ".png" }; }
function baseNoExt(n) { var i = n.lastIndexOf("."); return i > 0 ? n.slice(0, i) : n; }
function extOf(s) { var m = /\.([A-Za-z0-9]+)(?:[?#]|$)/.exec(s || ""); return m ? ("." + m[1].toLowerCase()) : ""; }
function buildWorkflow(safeName, userPrompt, custom) {
    var wf = JSON.parse(JSON.stringify(custom && custom["8"] ? custom : WORKFLOW)), base = (wf["6"] && wf["6"].inputs && wf["6"].inputs.text) || BASE_POSITIVE;
    wf["5"].inputs.image = safeName; wf["6"].inputs.text = userPrompt ? (userPrompt + SEP + base) : base; wf["8"].inputs.seed = Math.floor(Math.random() * 1e15); return wf;
}

/* the originals of a title: AI images that are not already painted (their painted twin missing) */
function plan(titleFolder, suffix) {
    var dir = path.join(titleFolder, "AI Images"), names; try { names = fs.readdirSync(dir); } catch (e) { return { dir: dir, todo: [], painted: 0, raw: 0 }; }
    var imgs = names.filter(function (n) { return IMG_RE.test(n); }), painted = imgs.filter(function (n) { return baseNoExt(n).endsWith(suffix); }), paintedBases = {};
    painted.forEach(function (n) { paintedBases[baseNoExt(n).slice(0, -suffix.length)] = 1; });
    var todo = imgs.filter(function (n) { return !baseNoExt(n).endsWith(suffix) && !paintedBases[baseNoExt(n)]; }).sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true }); });
    return { dir: dir, todo: todo, painted: painted.length, raw: imgs.length - painted.length };
}

/* upscale a title's AI images. opts: { url, prompt, parallel, suffix, keepRaw, abort }; log(msg); progress(done, total, detail) */
function runTitle(titleFolder, opts, log, progress) {
    var url = String(opts.url || "").replace(/\/+$/, ""), suffix = opts.suffix || "_painted", parallel = Math.max(1, Math.min(12, opts.parallel | 0 || 4));
    if (!/^https?:\/\//.test(url)) return Promise.reject(new Error("set the upscaler URL in Settings (your Vercel deployment, e.g. https://ruvi-upscaler.vercel.app)"));
    var P = plan(titleFolder, suffix), dir = P.dir, items = P.todo.map(function (n) { var s = sanitize(n); return { name: n, safeName: "f" + Math.random().toString(36).slice(2, 9) + "_" + s.base + s.ext, outBase: baseNoExt(n), file: path.join(dir, n), status: "queued" }; });
    if (!items.length) { log("upscaler: nothing to do — " + P.painted + " painted, no raw originals in AI Images\\"); return Promise.resolve({ done: 0, failed: 0, skipped: true }); }
    log("upscaler: " + items.length + " image(s) → " + url + " (" + parallel + " at a time)" + (opts.prompt ? " · prompt: " + opts.prompt : ""));
    var rawDir = path.join(dir, "_raw"); fs.mkdirSync(rawDir, { recursive: true });
    var done = 0, failed = 0, active = 0, idx = 0, started = Date.now();
    // COLD START: RunPod's serverless workers need a minute or three to wake; while they do, the Vercel function answers the
    // submit with "timeout" (its own 10-s limit) or a 5xx. Those are not failures of the image — the submit is retried with a
    // growing wait for up to warmupSec, and the FIRST image goes alone as a warm-up gate so ten submits do not all die at once.
    var warmupMs = Math.max(30, +opts.warmupSec || 300) * 1000, submitRetries = Math.max(1, +opts.submitRetries || 6), warmed = false, fill = function () {};
    function openGate() { if (warmed) return; warmed = true; log("upscaler: the workers are up — " + parallel + " image(s) at a time from here"); fill(); }
    function coldErr(e) { var m = String(e && e.message || e); return /timeout|timed out|ETIMEDOUT|ECONNRESET|ECONNREFUSED|EAI_AGAIN|socket hang up|HTTP (5\d\d|429|408)|cold|starting|throttl|no workers|in queue|FUNCTION_INVOCATION_TIMEOUT|gateway/i.test(m); }
    function sleep(ms) { return new Promise(function (res) { var left = ms; (function t() { if (opts.abort && opts.abort.aborted) return res(); if (left <= 0) return res(); var step = Math.min(1000, left); left -= step; setTimeout(t, step); })(); }); }
    function submit(it, b64) {
        var attempt = 0, t0 = Date.now();
        function go() {
            attempt++;
            return request("POST", url + "/api/run", { workflow: buildWorkflow(it.safeName, opts.prompt || "", opts.workflow), image: { name: it.safeName, image: b64 } }).then(function (r) {
                if (r.status !== 200 || !r.json || !r.json.jobId) throw new Error((r.json && r.json.error) || ("submit HTTP " + r.status + " " + String(r.text || "").slice(0, 120)));
                return r;
            }).catch(function (e) {
                if (opts.abort && opts.abort.aborted) throw e;
                var waited = Date.now() - t0, retry = coldErr(e) && attempt < submitRetries && waited < warmupMs;
                if (!retry) throw e;
                var wait = Math.min(60000, 5000 * Math.pow(2, attempt - 1));
                log("upscaler: " + it.name + " submit " + String(e.message).slice(0, 60) + " — " + (warmed ? "retrying" : "the workers are still waking up; retrying") + " in " + Math.round(wait / 1000) + " s (" + attempt + "/" + submitRetries + ")");
                return sleep(wait).then(function () { if (opts.abort && opts.abort.aborted) throw new Error("killed"); return go(); });
            });
        }
        return go();
    }
    function one(it) {
        var size = fs.statSync(it.file).size; if (size > WARN_BYTES) log("upscaler: " + it.name + " is " + (size / 1048576).toFixed(1) + " MB — over the ~4 MB request limit, it may be refused");
        var b64 = fs.readFileSync(it.file).toString("base64");
        return submit(it, b64).then(function (r) {
            openGate();
            it.jobId = r.json.jobId; it.status = "running"; it.t0 = Date.now();
            return new Promise(function (resolve, reject) {
                (function tick() {
                    if (opts.abort && opts.abort.aborted) return reject(new Error("killed"));
                    if (Date.now() - it.t0 > MAX_MS) return reject(new Error("timeout after 20 min"));
                    setTimeout(function () {
                        request("GET", url + "/api/status?jobId=" + encodeURIComponent(it.jobId)).then(function (s) {
                            var st = String((s.json && s.json.status) || "").toUpperCase();
                            if (st === "COMPLETED") {
                                var imgs = (s.json.output && Array.isArray(s.json.output.images)) ? s.json.output.images : []; if (!imgs.length) return reject(new Error("no image in output"));
                                var seq = Promise.resolve(), written = [];
                                imgs.forEach(function (im, k) {
                                    var outExt = extOf(im.filename) || extOf(im.data) || ".png", nm = it.outBase + suffix + (imgs.length > 1 ? "_" + (k + 1) : "") + outExt, dest = path.join(dir, nm);
                                    seq = seq.then(function () { if (im.type === "s3_url" || /^https?:\/\//.test(im.data || "")) return fetchBinary(im.data, dest); var raw = (im.data || "").indexOf(",") >= 0 ? im.data.split(",")[1] : im.data; fs.writeFileSync(dest, Buffer.from(raw, "base64")); }).then(function () { written.push(nm); });
                                });
                                return seq.then(function () { if (opts.keepRaw !== false) { try { fs.renameSync(it.file, path.join(rawDir, it.name)); } catch (e) {} } else { try { fs.unlinkSync(it.file); } catch (e2) {} } resolve(written); }, reject);
                            }
                            if (["FAILED", "CANCELLED", "TIMED_OUT"].indexOf(st) >= 0) return reject(new Error((s.json && (s.json.error || (s.json.output && s.json.output.error))) || st));
                            if (s.status >= 400 && s.status !== 404) log("upscaler: " + it.name + " status HTTP " + s.status + " (still polling)");
                            tick();
                        }, function (e) { log("upscaler: " + it.name + " poll error " + e.message + " (retrying)"); tick(); });
                    }, POLL_MS);
                })();
            });
        });
    }
    log("upscaler: waking the workers with the first image (a cold RunPod start can take 1–3 min; the rest follow once it is accepted)");
    return new Promise(function (resolve) {
        var passes = 0;
        function finish() {
            var casualties = items.filter(function (x) { return x.status === "failed" && x.cold; });
            if (casualties.length && passes < 1 && !(opts.abort && opts.abort.aborted)) {   // whatever died while the workers were waking gets one more go now that they are warm
                passes++; log("upscaler: second pass for " + casualties.length + " image(s) that failed during the warm-up");
                casualties.forEach(function (x) { x.status = "pending"; x.cold = false; failed--; });
                items = items.filter(function (x) { return x.status !== "pending"; }).concat(casualties); idx = items.length - casualties.length; next(); return;
            }
            resolve({ done: done, failed: failed, seconds: (Date.now() - started) / 1000 });
        }
        fill = function () { while (warmed && active < parallel && idx < items.length && !(opts.abort && opts.abort.aborted)) next(); };
        function next() {
            if (opts.abort && opts.abort.aborted) { if (!active) resolve({ done: done, failed: failed, cancelled: true }); return; }
            if (idx >= items.length) { if (!active) finish(); return; }
            if (!warmed && active >= 1) return;   // the warm-up gate: one image in flight until the service accepts a job
            var it = items[idx++]; active++;
            one(it).then(function (written) { done++; it.status = "done"; log("upscaler: " + it.name + " ✓ " + written.join(", ") + " (" + ((Date.now() - it.t0) / 1000).toFixed(0) + " s)"); }, function (e) { failed++; it.status = "failed"; it.cold = !warmed || coldErr(e); if (!warmed) openGate(); log("upscaler: " + it.name + " ✗ " + e.message); })
                .then(function () { active--; if (progress) progress(done + failed, items.length, it.name); next(); fill(); });
            if (active < parallel) next();
        }
        if (progress) progress(0, items.length, "");
        next();
    });
}
module.exports = { plan: plan, runTitle: runTitle, buildWorkflow: buildWorkflow, WORKFLOW: WORKFLOW };
