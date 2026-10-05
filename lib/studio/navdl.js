/* ============================================================================
   lib/studio/navdl.js — RUVI Studio 1.6.7's Navigate "DOWNLOAD ALL IMAGES" engine,
   ported ONE-TO-ONE from ppro/client/apps/navigate/js/app.js (the NODE_DL, SCALED_DL,
   PACE, RL_PLAN and ROUNDS blocks, collectDownloadJobs, downloadAll, healFromTree,
   matchImageForSection, the saved-links manifest). Only the host glue differs:
   Node fs instead of window.cep.fs, callbacks instead of DOM status/buttons.
   Every constant, message, decision and order of operations is the Studio's.

   downloadAll(ctx, hooks) → handle { cancel() }
     ctx   { titleFolder, bd (sections with .sec .type .typeNum .links[] .char), dlPace,
             dlContact, dlAlts, imgNaming, healTree (packetdl.healTree), sizeForType? }
     hooks { status(text, level), button(text), note(text), done(summary) }
   ========================================================================== */
"use strict";
var fs = require("fs"), path = require("path"), urlmod = require("url");

var SAVE_FOLDER = { HOOK: "Hook", MAP: "Maps", REF: "Reference images", CHAR: "Characters", AI: "Assets" };
var IMG_EXT = { jpg: 1, jpeg: 1, png: 1, webp: 1, gif: 1, bmp: 1, tif: 1, tiff: 1, avif: 1, jfif: 1 };
function isImageFile(name) { var m = /\.([A-Za-z0-9]+)$/.exec(String(name)); return !!(m && IMG_EXT[m[1].toLowerCase()]); }
function pad2(n) { n = +n; return (n < 10 ? "0" : "") + n; }
function secId(n) { return "S" + pad2(n); }
function sepOf(p) { return String(p).indexOf("\\") >= 0 ? "\\" : "/"; }
function joinPath(dir, name) { return dir + sepOf(dir) + name; }
function sanitizeName(s) { return String(s).replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, " ").trim(); }
function decodeMaybe(s) { try { return decodeURIComponent(s); } catch (e) { return s; } }
function commonsFile(url) { var m = String(url).match(/commons\.wikimedia\.org\/wiki\/(?:File|Image):(.+)$/i); return m ? m[1] : null; }
function directImg(url) { return /\.(jpe?g|png|gif|webp|svg|tiff?)(\?|$)/i.test(String(url)); }
function fullImageUrl(url) {
    var cf = commonsFile(url); if (cf) return "https://commons.wikimedia.org/wiki/Special:FilePath/" + cf;
    if (directImg(url)) return url;
    return null; // archive details pages aren't a single downloadable file
}
function fileExtOf(name) { var m = /\.[a-z0-9]{2,5}$/i.exec(String(name)); return m ? m[0].toLowerCase() : ""; }
function listDir(p) { try { return fs.readdirSync(p); } catch (e) { return null; } }
function fileExists(p) { try { fs.statSync(p); return true; } catch (e) { return false; } }
function dirNamesLower(folder) { var arr = folder ? (listDir(folder) || []) : []; var m = {}; for (var i = 0; i < arr.length; i++) m[String(arr[i]).toLowerCase()] = 1; return m; }
function uniqueName(fname, used) {
    var key = fname.toLowerCase();
    if (!used[key]) { used[key] = 1; return fname; }
    var dot = fname.lastIndexOf("."), stem = dot > 0 ? fname.slice(0, dot) : fname, ext = dot > 0 ? fname.slice(dot) : "";
    for (var n = 2; n < 1000; n++) { var c = stem + " (" + n + ")" + ext, ck = c.toLowerCase(); if (!used[ck]) { used[ck] = 1; return c; } }
    used[key] = 1; return fname;
}
function localCopy(src, dest) { try { fs.copyFileSync(src, dest); return true; } catch (e0) { return false; } }

/* ---- per-title state (what the panel kept in `state`) ---------------------- */
function Ctx(o) {
    this.titleFolder = o.titleFolder; this.bd = o.bd; this.dlPace = o.dlPace || "auto"; this.dlContact = o.dlContact || "";
    this.dlAlts = !!o.dlAlts; this.imgNaming = o.imgNaming || "typenum"; this.healTree = o.healTree || null; this.sizeForType = o.sizeForType || null;
}
Ctx.prototype.bdBySec = function (sec) { for (var i = 0; i < this.bd.sections.length; i++) if (this.bd.sections[i].sec === sec) return this.bd.sections[i]; return null; };
Ctx.prototype.typeOrdinal = function (sec) {
    var b = this.bdBySec(sec); if (!b) return "";
    var n = 0;
    for (var i = 0; i < this.bd.sections.length; i++) { var s = this.bd.sections[i]; if (s.type !== b.type) continue; n++; if (s.sec === sec) return String(n); }
    return "";
};
Ctx.prototype.destFolderFor = function (type) { return this.titleFolder + sepOf(this.titleFolder) + (SAVE_FOLDER[type] || "Reference images"); };
Ctx.prototype.buildFileName = function (sec, link, fullUrl) {
    var b = this.bdBySec(sec) || {}, t = b.type || "", num = b.typeNum || this.typeOrdinal(sec) || "";
    var cf = commonsFile(link.url);
    var orig = sanitizeName(cf ? decodeMaybe(cf) : decodeMaybe((String(fullUrl).split("?")[0].split(/[\\/]/).pop()) || "image"));
    var e0 = fileExtOf(orig), ext = e0 || ".jpg";
    var stem = e0 ? orig.slice(0, orig.length - e0.length) : orig; if (!stem) stem = "image";
    var fmt = this.imgNaming || "full", nm;
    if (fmt === "sectype") nm = secId(sec) + "_" + t + num;
    else if (fmt === "typenum") nm = (t || "IMG") + (num ? " " + num : "");
    else if (fmt === "original") nm = stem;
    else nm = secId(sec) + "_" + t + num + "__" + stem;
    return sanitizeName(nm) + ext;
};
Ctx.prototype.charFolderImage = function (name) {
    if (!this.titleFolder || !name) return null;
    var folder = this.destFolderFor("CHAR"), entries = listDir(folder) || [];
    var IMGRE = /\.(jpe?g|png|webp|gif|bmp|tiff?|avif|jfif)$/i;
    function norm(s) { return String(s).toLowerCase().replace(/\.[a-z0-9]{2,5}$/, "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim(); }
    var nn = norm(name); if (!nn) return null;
    var toks = nn.split(" "), best = null, bestScore = 0;
    for (var k = 0; k < entries.length; k++) {
        if (!IMGRE.test(entries[k])) continue;
        var sn = norm(entries[k]), score = 0;
        if (sn === nn) score = 3;
        else if (sn.indexOf(nn) >= 0) score = 2;
        else { var w = sn.split(" "), all = toks.length > 0; for (var t = 0; t < toks.length; t++) { if (w.indexOf(toks[t]) < 0) { all = false; break; } } if (all) score = 1; }
        if (score > bestScore) { bestScore = score; best = entries[k]; }
    }
    return best ? (folder + sepOf(folder) + best) : null;
};
Ctx.prototype.matchImageForSection = function (o, files, folder) {
    var t = String(o.type || "").toLowerCase(), n = String(o.typeNum || this.typeOrdinal(o.sec) || "").toLowerCase();
    var sid = secId(o.sec).toLowerCase();
    function stemOf(f) { return String(f).replace(/\.[a-z0-9]{2,5}$/i, "").toLowerCase(); }
    var bases = n ? [t + " " + n, t + n, t + "_" + n] : [t, t + " 1", t + "1"];
    var best = null, bestScore = 0;
    for (var i = 0; i < files.length; i++) {
        if (!isImageFile(files[i])) continue;
        var st = stemOf(files[i]), sc = 0;
        if (st.indexOf(sid + "_") === 0) {
            var after = st.slice(sid.length + 1);
            sc = (!n || after.indexOf(t + n) === 0 || after.indexOf(t + " " + n) === 0 || after.indexOf(t + "_" + n) === 0) ? 6 : 5;
        }
        if (!sc) for (var b = 0; b < bases.length; b++) {
            if (st === bases[b]) { sc = 4; break; }
            if (st.indexOf(bases[b] + " (") === 0) { sc = 3; break; }
        }
        if (sc > bestScore || (sc && sc === bestScore && best && files[i].toLowerCase() < best.toLowerCase())) { bestScore = sc; best = files[i]; }
    }
    if (best) return joinPath(folder, best);
    if (o.type === "CHAR" && o.char && o.char.name) { var p = this.charFolderImage(o.char.name); if (p) return p; }
    return null;
};

/* ---- NODE_DL (nodeDownloadTo) ---------------------------------------------- */
function _retryAfterMs(h) {
    if (!h) return 0;
    var s = String(h).trim(), n = parseInt(s, 10);
    if (isFinite(n) && /^\d+$/.test(s)) return Math.min(n, 600) * 1000;
    var d = Date.parse(s);
    if (isFinite(d)) return Math.max(0, Math.min((d - Date.now()) / 1000, 600)) * 1000;
    return 0;
}
var STD_STEPS = [20, 40, 60, 120, 250, 330, 500, 960, 1280, 1920, 3840];
function snapStep(px) {
    px = px | 0; if (!px) return 0;
    for (var i = 0; i < STD_STEPS.length; i++) if (STD_STEPS[i] >= px) return STD_STEPS[i];
    return STD_STEPS[STD_STEPS.length - 1];
}
var STUDIO_VER = "1.6.3";
function uaFor(contact) {
    var c = String(contact || "").trim();
    if (!/[@\/]/.test(c)) c = "contact not set - add it in Navigate > Images; " + (c || "RUVI Studio operator");
    var nv = ""; try { nv = " Node.js/" + process.versions.node; } catch (e) {}
    return "RUVIStudio/" + STUDIO_VER + " (" + c + ")" + nv;
}
var BAD_SIZE_RE = /thumbnail (steps|sizes)|w\.wiki\/GHai/i;   // today a 400, earlier a 429 - both carry this text
function scaledUrl(url, px) {
    px = snapStep(px);
    if (!px || !url) return null;
    if (/\/wiki\/Special:FilePath\//i.test(url))
        return url + (url.indexOf("?") >= 0 ? "&" : "?") + "width=" + px;
    var clean = String(url).split("#")[0].split("?")[0];
    var m = /^(https?:\/\/upload\.wikimedia\.org\/[^\/]+\/[^\/]+)\/(thumb\/)?([0-9a-f])\/([0-9a-f]{2})\/([^\/?#]+?)(\/\d+px-[^\/?#]+)?$/i.exec(clean);
    if (!m) return null;
    var name = m[5];
    if (/\.(jpe?g|png|gif|webp)$/i.test(name))
        return m[1] + "/thumb/" + m[3] + "/" + m[4] + "/" + name + "/" + px + "px-" + name;
    if (/\.svg$/i.test(name))
        return m[1] + "/thumb/" + m[3] + "/" + m[4] + "/" + name + "/" + px + "px-" + name + ".png";
    return null;   // tif / pdf / video etc: thumb names aren't constructible — use the original
}
function nodeDownloadTo(url, dest, cb, onWait, contact) {
    var part = dest + ".part";
    var attempt = 0, MAX_RL = 4, netRetried = false;
    var BACKOFF = [2000, 6000, 15000];   // waits before attempts 2..4 when no Retry-After
    function schedule(ms, label) {
        if (onWait) { try { onWait(ms, attempt, label); } catch (ew) {} }
        setTimeout(once, ms);
    }
    function settle(ok, err, info) {
        info = info || {};
        if (!ok) {
            var sc = info.status | 0;
            if ((sc === 429 || sc === 503) && !info.badSize && attempt < MAX_RL) {
                var ra = info.retryAfterMs || 0;
                if (ra > 45000) {
                    cb(false, "rate-limited (HTTP " + sc + ") \u2014 the server asks for a ~" + Math.round(ra / 1000) + " s pause; run it again in a few minutes (already-saved files are skipped)", info);
                    return;
                }
                schedule(ra || (BACKOFF[attempt - 1] || 15000) + Math.floor(Math.random() * 500), "HTTP " + sc);
                return;
            }
            if (info.transient && !netRetried) { netRetried = true; schedule(3000, "network drop"); return; }
        }
        cb(ok, err || null, info);
    }
    function once() {
        attempt++;
        var done = false;
        function finish(ok, err, info) {
            if (done) return; done = true;
            if (!ok) { try { fs.unlinkSync(part); } catch (eu) {} }
            settle(ok, err, info);
        }
        function hop(u, left) {
            var mod = /^https:/i.test(u) ? require("https") : require("http");
            var req;
            try {
                req = mod.get(u, { headers: { "User-Agent": uaFor(contact), "Accept": "image/*,*/*;q=0.8" } }, function (res) {
                    var sc = res.statusCode || 0;
                    if (sc >= 300 && sc < 400 && res.headers.location) {
                        res.resume();
                        if (left <= 0) { finish(false, "too many redirects"); return; }
                        var nx; try { nx = urlmod.resolve(u, res.headers.location); } catch (e2) { nx = res.headers.location; }
                        hop(nx, left - 1); return;
                    }
                    if (sc === 429 || sc === 503) {
                        var ra = _retryAfterMs(res.headers["retry-after"]), body = "";
                        res.setEncoding("utf8");
                        res.on("data", function (c) { if (body.length < 4096) body += c; });
                        res.on("end", function () {
                            if (sc === 429 && BAD_SIZE_RE.test(body)) {        // (1.6.3) not a rate limit: a non-standard thumbnail size was refused
                                finish(false, "HTTP 429 - non-standard thumbnail size refused by Wikimedia", { status: sc, badSize: true });
                                return;
                            }
                            finish(false, "HTTP " + sc + (sc === 429 ? " (rate limited)" : ""), { status: sc, retryAfterMs: ra, rateLimited: true });
                        });
                        res.on("error", function () { finish(false, "HTTP " + sc, { status: sc, retryAfterMs: ra, rateLimited: true }); });
                        return;
                    }
                    if (sc < 200 || sc >= 300) { res.resume(); finish(false, "HTTP " + sc, { status: sc }); return; }
                    var ct = String(res.headers["content-type"] || "");
                    if (ct.indexOf("text/html") === 0) { res.resume(); finish(false, "got an HTML page, not a file (HTTP " + sc + ")", { status: sc }); return; }
                    var out;
                    try { out = fs.createWriteStream(part); }
                    catch (e3) { res.resume(); finish(false, "couldn't write the file (" + e3 + ")"); return; }
                    var got = 0;
                    res.on("data", function (c) { got += c.length; });
                    res.on("aborted", function () { try { out.destroy(); } catch (ea) {} finish(false, "network error: connection dropped mid-download", { transient: true }); });
                    res.on("error", function (e4) { try { out.destroy(); } catch (ed) {} finish(false, "network error: " + (e4 && e4.message || e4), { transient: true }); });
                    out.on("error", function (e5) { try { res.destroy(); } catch (er) {} finish(false, "couldn't write the file (" + (e5 && e5.message || e5) + ")"); });
                    out.on("finish", function () {
                        if (done) return;
                        if (!got) { finish(false, "empty response", { status: sc }); return; }
                        try { if (fs.existsSync(dest)) fs.unlinkSync(dest); fs.renameSync(part, dest); }
                        catch (e6) { finish(false, "couldn't finalize the file (" + (e6 && e6.message || e6) + ")"); return; }
                        finish(true, null, { status: sc });
                    });
                    res.pipe(out);
                });
            } catch (e7) { finish(false, String(e7)); return; }
            req.setTimeout(30000, function () { try { req.destroy(new Error("timeout")); } catch (et) {} finish(false, "timed out after 30 s of silence", { transient: true }); });
            req.on("error", function (e8) { finish(false, "network error: " + (e8 && e8.message || e8), { transient: true }); });
        }
        hop(url, 5);
    }
    once();
}
/* ---- SCALED_DL ------------------------------------------------------------- */
// (1.6.6) fixed per-type sizes, no picker: MAP originals (the AE camera zooms into them),
// every other still at the 3840 standard step (10-50x smaller, plenty for 1080p).
function sizeForType(type) { return type === "MAP" ? 0 : 3840; }
function downloadSized(fullUrl, makeDest, cb, onWait, sizePx, contact) {
    var scaled = scaledUrl(fullUrl, sizePx);
    function original(prevErr) { nodeDownloadTo(fullUrl, makeDest(fullUrl), function (ok, err, info) { cb(ok, err, info, fullUrl); }, onWait, contact); }
    if (!scaled) { original(); return; }
    nodeDownloadTo(scaled, makeDest(scaled), function (ok, err, info) {
        if (!ok && info && (info.status === 404 || info.status === 400 || info.badSize)) { original(err); return; }   // no such rendition / refused size -> original
        cb(ok, err, info, scaled);
    }, onWait, contact);
}

/* ---- saved-links manifest (_saved_links.json in the title folder) ----------- */
function savedManifestPath(ctx) { return ctx.titleFolder ? (ctx.titleFolder + sepOf(ctx.titleFolder) + "_saved_links.json") : ""; }
function readSavedManifest(ctx) { var p = savedManifestPath(ctx); if (!p) return { urls: {} }; try { var d = JSON.parse(fs.readFileSync(p, "utf8")); if (d && d.urls) return d; } catch (e) {} return { urls: {} }; }
function writeSavedManifest(ctx, m) { var p = savedManifestPath(ctx); if (!p) return; try { fs.writeFileSync(p, JSON.stringify(m)); } catch (e) {} }
function recordSaved(ctx, url, folder, fname, sec) { var m = readSavedManifest(ctx); m.urls[String(url)] = { file: fname, folder: folder, sec: sec, at: Date.now() }; writeSavedManifest(ctx, m); }

/* ---- (1.6.5) heal from the folder tree ------------------------------------- */
function healFromTree(ctx) {
    var rep = { healed: [], present: [], missing: [] };
    if (!ctx.healTree || !ctx.titleFolder || !ctx.bd) return rep;
    try {
        var wanted = [];
        for (var i = 0; i < ctx.bd.sections.length; i++) {
            var s = ctx.bd.sections[i], ty = String(s.type || "").toUpperCase();
            if (!SAVE_FOLDER[ty] || ty === "AI") continue;
            var links = s.links || [], full = "";
            for (var j = 0; j < links.length && !full; j++) full = fullImageUrl(links[j].url) || "";
            if (!full) continue;
            var n = String(s.typeNum || ctx.typeOrdinal(s.sec) || "1"), ext = fileExtOf(String(full).split("?")[0]) || ".jpg";
            var sid = secId(s.sec).toLowerCase();
            wanted.push({ saveAs: ty + " " + n + ext, type: ty, url: full, aliases: [sid + "_" + ty.toLowerCase() + n, sid + "_" + ty.toLowerCase() + " " + n, sid] });
        }
        if (wanted.length) rep = ctx.healTree(ctx.titleFolder, wanted, {});
    } catch (e) { rep.error = String(e); }
    return rep;
}
function collectDownloadJobs(ctx) {
    var jobs = [], skipped = 0, alts = !!ctx.dlAlts;
    if (!ctx.bd) return { jobs: jobs, skipped: 0 };
    var healRep = healFromTree(ctx);
    var man = readSavedManifest(ctx);
    var cFolders = {}, cEntries = {};
    function ownImage(s) {
        var ty = s.type; if (!cEntries[ty]) { cFolders[ty] = ctx.destFolderFor(ty); cEntries[ty] = listDir(cFolders[ty]) || []; }
        return ctx.matchImageForSection(s, cEntries[ty], cFolders[ty]);
    }
    for (var i = 0; i < ctx.bd.sections.length; i++) {
        var s = ctx.bd.sections[i], links = s.links || [];
        var dl = [];
        for (var j = 0; j < links.length; j++) { var full = fullImageUrl(links[j].url); if (full) dl.push({ link: links[j], full: full }); }
        if (!dl.length) continue;
        var take = alts ? dl : [dl[0]];
        for (var k = 0; k < take.length; k++) {
            var rec = man.urls[String(take[k].link.url)];
            var recPath = (rec && rec.file) ? joinPath(rec.folder || ctx.destFolderFor(s.type), rec.file) : "";
            var recOk = !!(recPath && fileExists(recPath));
            if (!alts) {
                if (ownImage(s)) { skipped++; continue; }                                            // this section's own file is on disk
                if (recOk && (rec.sec == null || rec.sec !== s.sec)) {                            // same file saved for another section -> copy it
                    jobs.push({ sec: s.sec, type: s.type, link: take[k].link, full: take[k].full, copyFrom: recPath }); continue;
                }
            } else if (recOk) { skipped++; continue; }
            jobs.push({ sec: s.sec, type: s.type, link: take[k].link, full: take[k].full });
        }
    }
    return { jobs: jobs, skipped: skipped, healed: healRep.healed.length, healError: healRep.error || "" };
}

/* ---- PACE / RL_PLAN / ROUNDS ------------------------------------------------ */
var PACE_MS = { auto: 350, fast: 350, steady: 2000, human: 10000 };
function paceGapMs(mode) { var base = PACE_MS[mode] || PACE_MS.auto; return mode === "human" ? base + Math.floor(Math.random() * base * 0.4) : base; }
var RL_WALL_MS = 45000, RL_MAX_AUTOWAIT_MS = 900000, RL_MAX_WALLS = 2, RL_WAIT_PAD_MS = 5000;
function rlWaitPlan(retryAfterMs, wallsSoFar) {
    if (!(retryAfterMs > RL_WALL_MS)) return { action: "none" };
    if (wallsSoFar >= RL_MAX_WALLS) return { action: "stop", reason: "persisted" };
    if (retryAfterMs > RL_MAX_AUTOWAIT_MS) return { action: "stop", reason: "toolong" };
    return { action: "wait", waitMs: retryAfterMs + RL_WAIT_PAD_MS };
}
var PERMANENT_RE = /HTTP 4(0\d|1\d|2[0-8])\b|HTML page|couldn't write|couldn't finalize|empty response|too many redirects|Node (modules|https) unavailable|couldn't copy/i;
function isPermanentFailure(err) { return PERMANENT_RE.test(String(err || "")); }
function roundPauseMs(round, progressed) { if (progressed) return 5000; var ladder = [15000, 30000, 60000, 120000, 300000]; return ladder[Math.min(ladder.length - 1, Math.max(0, round - 1))]; }
function mmss(msLeft) { var t = Math.max(0, Math.ceil(msLeft / 1000)), m = Math.floor(t / 60), sec = t % 60; return m + ":" + (sec < 10 ? "0" : "") + sec; }

/* ---- downloadAll: the persistent-rounds run (1.6.6) -------------------------- */
function downloadAll(ctxIn, hooks) {
    var ctx = ctxIn instanceof Ctx ? ctxIn : new Ctx(ctxIn);
    hooks = hooks || {}; var status = hooks.status || function () {}, button = hooks.button || function () {}, note = hooks.note || function () {}, doneCb = hooks.done || function () {};
    var bulk = { dl: false, cancel: false, dryRounds: 0, permanent: {}, rlTimer: null, rlTick: null, abortWait: null }, old = "Download all images";
    var sizeFor = ctx.sizeForType || sizeForType;
    function run(roundNo) {
        var round = roundNo || 1, dryRounds = bulk.dryRounds || 0;
        if (round === 1) { bulk.dryRounds = 0; dryRounds = 0; bulk.permanent = {}; }
        if (!ctx.bd) { status("Load a breakdown first \u2014 the links live in it.", "warn"); doneCb({ ok: false }); return; }
        var col = collectDownloadJobs(ctx), jobs = col.jobs;
        var permanentSkipped = 0;
        if (bulk.permanent) jobs = jobs.filter(function (j) { if (bulk.permanent[j.full]) { permanentSkipped++; return false; } return true; });
        if (!jobs.length && permanentSkipped) {
            status("Everything downloadable is in place \u2014 " + permanentSkipped + " link" + (permanentSkipped === 1 ? "" : "s") + " failed permanently (bad link / not a file) and won't be retried.", "warn");
            doneCb({ ok: true, permanent: permanentSkipped, skipped: col.skipped, healed: col.healed }); return;
        }
        if (!jobs.length) {
            status(col.skipped ? ("Nothing new \u2014 " + col.skipped + " section images" + " already in place" + (col.healed ? " (" + col.healed + " healed from elsewhere in the folder tree)" : "") + ".") : "No direct image links in this breakdown.", "good");
            note(""); doneCb({ ok: true, skipped: col.skipped, healed: col.healed }); return;
        }
        bulk.dl = true; bulk.cancel = false;
        var ok = 0, fail = 0, copied = 0, failMsgs = [], i = 0;
        var gap = paceGapMs(ctx.dlPace), sawRL = false;
        var walls = 0, wallStopped = false;
        var failErrs = [];
        note("");
        function fin() {
            bulk.dl = false; button(old);
            var bits = [(round > 1 ? "Round " + round + ": " : "") + "Downloaded " + (ok - copied) + " / " + jobs.length + " into the section folders"];
            if (copied) bits.push(copied + " copied from a shared plate already on disk");
            if (col.healed) bits.push(col.healed + " healed from elsewhere in the folder tree");
            if (col.skipped) bits.push(col.skipped + " already in place");
            if (fail) bits.push(fail + " failed");
            if (permanentSkipped) bits.push(permanentSkipped + " permanent (not retried)");
            if (bulk.cancel && !wallStopped) bits.push("cancelled");
            var tail = (fail && failMsgs.length) ? (" \u2014 first: " + failMsgs[0]) : "";
            var transient = 0, permanent = 0, fi;
            for (fi = 0; fi < failErrs.length; fi++) { if (isPermanentFailure(failErrs[fi])) permanent++; else transient++; }
            var userCancelled = bulk.cancel && !wallStopped;
            if (transient > 0 && !userCancelled) {
                var progressed = ok > 0;
                bulk.dryRounds = progressed ? 0 : (dryRounds + 1);
                var pause = roundPauseMs(bulk.dryRounds, progressed);
                if (wallStopped) pause = Math.max(pause, 60000);
                status(bits.join(" \u00b7 ") + "." + tail + " \u2014 " + transient + " to retry, next round in " + mmss(pause) + ".", ok ? "warn" : "bad");
                note("Persistent mode: rounds continue until every image is in place (permanent failures such as 404s are not retried). Click the button to stop.");
                var until = Date.now() + pause;
                bulk.dl = true;
                function paint() { button("Round " + (round + 1) + " in " + mmss(until - Date.now()) + "\u2026 (click to stop)"); }
                paint();
                bulk.rlTick = setInterval(paint, 1000);
                bulk.rlTimer = setTimeout(function () { leaveWait(); bulk.dl = false; bulk.cancel = false; run(round + 1); }, pause);
                bulk.abortWait = function () { leaveWait(); bulk.dl = false; bulk.cancel = false; button(old); status("Stopped after round " + round + " \u2014 " + transient + " image" + (transient === 1 ? "" : "s") + " still missing; press Download all to resume (files in place are skipped).", "warn"); doneCb({ ok: false, stopped: true, missing: transient, round: round }); };
                return;
            }
            if (fail && permanent && !transient) tail += " \u2014 remaining failures are permanent (bad links / files), not retried";
            status(bits.join(" \u00b7 ") + "." + tail, fail ? (ok ? "warn" : "bad") : "good");
            var advice = "";
            if (fail && wallStopped) advice = "Stopped at Wikimedia's rate-limit wall (shared/tethered IPs hit it fastest) \u2014 wait ~10 minutes and press Download all again; saved files are skipped.  \u00b7  ";
            else if (fail && sawRL) advice = "Wikimedia is rate-limiting this connection (shared/tethered IPs hit it fastest) \u2014 wait a minute and press Download all again; saved files are skipped.  \u00b7  ";
            if (advice || failMsgs.length) note(advice + (failMsgs.length ? "Failed: " + failMsgs.slice(0, 4).join("  \u00b7  ") + (failMsgs.length > 4 ? " \u2026" : "") : ""));
            doneCb({ ok: !fail, ok_count: ok, copied: copied, fail: fail, permanent: permanent, wallStopped: wallStopped, sawRL: sawRL, failMsgs: failMsgs, round: round, skipped: col.skipped, healed: col.healed });
        }
        function leaveWait() { if (bulk.rlTimer) clearTimeout(bulk.rlTimer); if (bulk.rlTick) clearInterval(bulk.rlTick); bulk.rlTimer = bulk.rlTick = bulk.abortWait = null; }
        function enterWait(waitMs) {
            var until = Date.now() + waitMs, left = jobs.length - i;
            status("Rate-limit wall \u2014 the server asked for a ~" + Math.round((waitMs - RL_WAIT_PAD_MS) / 1000) + " s pause. " + ok + " downloaded so far; the remaining " + left + " resume automatically when it lifts.", "warn");
            function paint() { button("Rate-limited \u2014 resuming in " + mmss(until - Date.now()) + "\u2026 (click to cancel)"); }
            paint();
            bulk.rlTick = setInterval(paint, 1000);
            bulk.rlTimer = setTimeout(function () { leaveWait(); status("Rate-limit pause over \u2014 resuming downloads\u2026", "busy"); next(); }, waitMs);
            bulk.abortWait = function () { leaveWait(); bulk.cancel = true; fin(); };
        }
        function next() {
            if (bulk.cancel || i >= jobs.length) { leaveWait(); fin(); return; }
            var j = jobs[i++];
            button("Downloading " + i + " / " + jobs.length + "\u2026 (click to cancel)");
            var folder = ctx.destFolderFor(j.type);
            try { fs.mkdirSync(folder, { recursive: true }); } catch (e) {}
            var fname = "";
            function makeDest(u) { fname = uniqueName(ctx.buildFileName(j.sec, j.link, u), dirNamesLower(folder)); return joinPath(folder, fname); }
            if (j.copyFrom) {
                var cdest = makeDest(j.copyFrom);
                status(secId(j.sec) + " \u00b7 " + j.type + " \u2192 " + (SAVE_FOLDER[j.type] || "") + "\\" + fname + " (copied from " + String(j.copyFrom).split(/[\\/]/).pop() + ")", "busy");
                if (localCopy(j.copyFrom, cdest)) { ok++; copied++; recordSaved(ctx, j.link.url, folder, fname, j.sec); }
                else { fail++; var ce = "couldn't copy " + String(j.copyFrom).split(/[\\/]/).pop(); failMsgs.push(secId(j.sec) + ": " + ce); failErrs.push(ce); bulk.permanent[j.full] = true; }
                setTimeout(next, 10); return;
            }
            var szJ = sizeFor(j.type);
            status(secId(j.sec) + " \u00b7 " + j.type + " \u2192 " + (SAVE_FOLDER[j.type] || "") + "\\" + (szJ ? "(\u2264" + szJ + "px) " : "(original) ") + "\u2026", "busy");
            downloadSized(j.full, makeDest, function (okv, err, info) {
                if (info && (info.rateLimited || info.status === 429 || info.status === 503)) { sawRL = true; gap = Math.max(gap, paceGapMs("human")); }
                if (!okv) {
                    var plan = rlWaitPlan((info && info.retryAfterMs) || 0, walls);
                    if (plan.action === "wait") { walls++; i--; enterWait(plan.waitMs); return; }
                    if (plan.action === "stop") {
                        fail++; failMsgs.push(secId(j.sec) + ": " + err); failErrs.push(err);
                        if (isPermanentFailure(err)) bulk.permanent[j.full] = true;
                        wallStopped = true; bulk.cancel = true;
                        setTimeout(next, 0); return;
                    }
                }
                if (okv) { ok++; recordSaved(ctx, j.link.url, folder, fname, j.sec); }
                else { fail++; failMsgs.push(secId(j.sec) + ": " + err); failErrs.push(err); if (isPermanentFailure(err)) bulk.permanent[j.full] = true; }
                setTimeout(next, (ctx.dlPace === "human" || gap >= PACE_MS.human) ? Math.max(gap, paceGapMs("human")) : gap);
            }, function (ms, att, label) {
                sawRL = true; gap = Math.max(gap, paceGapMs("human"));
                status(secId(j.sec) + " \u00b7 " + label + " \u2014 retrying in " + Math.ceil(ms / 1000) + " s (attempt " + (att + 1) + "/4)\u2026", "busy");
            }, szJ, ctx.dlContact);
        }
        next();
    }
    run(1);
    return { cancel: function () { if (bulk.abortWait) { bulk.abortWait(); return; } bulk.cancel = true; button("Cancelling\u2026"); } };
}


/* ---- Navigate's parseBreakdown, verbatim (sections with sec/type/typeNum/links/char) ---- */
function tcToSec(t) { var p = String(t).split(":").map(parseFloat); if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2]; if (p.length === 2) return p[0] * 60 + p[1]; return p[0] || 0; }
function parseBreakdown(raw) {
    raw = String(raw).replace(/\r/g, "");
    var headerRe = /^SECTION\s+(\d+)\s*\|\s*(\d+)\s*words\s*\|\s*([A-Za-z]+)(?:[ \t]+(\d+))?(?:[ \t]*[-\u2013\u2014][ \t]*(.+?))?[ \t]*$/gm;
    var heads = [], m;
    while ((m = headerRe.exec(raw))) heads.push({ idx: m.index, end: headerRe.lastIndex, sec: +m[1], words: +m[2], type: m[3].toUpperCase(), typeNum: m[4] || "", label: (m[5] || "").trim() });
    var sections = [];
    for (var i = 0; i < heads.length; i++) {
        var h = heads[i];
        var block = raw.slice(h.end, i + 1 < heads.length ? heads[i + 1].idx : raw.length);
        var tc = block.match(/TIMECODE:\s*([0-9:.]+)\s*(?:\u2192|->)\s*([0-9:.]+)\s*\|\s*DURATION:\s*([0-9.]+)\s*s/);
        var startSec = tc ? tcToSec(tc[1]) : 0, endSec = tc ? tcToSec(tc[2]) : 0, dur = tc ? parseFloat(tc[3]) : (endSec - startSec);
        var sa = block.match(/STARTS AT:\s*"([^"]*)"/);
        var script = "";
        var si = block.search(/^SCRIPT:\s*$/m);
        if (si >= 0) {
            var after = block.slice(si).replace(/^SCRIPT:\s*\n?/, "");
            var lines = after.split("\n"), buf = [];
            var stop = /^\s*(VIDEO LINK|LINK|REF\/MAP LINK|ALT LINK|-ALTERNATIVE-|PROMPT\s+\d+:|CHARACTER INTRODUCTION:|BORN:|DIED:|ROLE:|REFERENCE:)/i;
            for (var L = 0; L < lines.length; L++) { if (stop.test(lines[L])) break; buf.push(lines[L]); }
            script = buf.join("\n").trim();
        }
        var ch = null, cim = block.match(/^CHARACTER INTRODUCTION:\s*(.+)$/m);
        if (cim) {
            var born = (block.match(/^BORN:\s*(.+)$/m) || [])[1] || "";
            var died = (block.match(/^DIED:\s*(.+)$/m) || [])[1] || "";
            var roleM = block.match(/^ROLE:\s*([\s\S]*?)(?=\n(?:REFERENCE:|-ALTERNATIVE-|PROMPT\s+\d+:)|\n----|$)/m);
            var role = roleM ? roleM[1].replace(/\s+/g, " ").trim() : "";
            var ageM = died.match(/\(age\s+(\d+)\)/);
            ch = { name: cim[1].trim(), born: born.trim(), died: died.trim(), age: ageM ? +ageM[1] : null, role: role };
        }
        var links = [], linkRe = /^[ \t]*(VIDEO LINK|REF\/MAP LINK\s*\d*|ALT LINK\s*\d*|REFERENCE|LINK):\s*(\[[^\]\n]*\]|\S+)[ \t]*$/gm, lm;
        var TAG_RE = /\[((?:VERIFIED|NOT FOUND|UNCONFIRMED|FOUND)[^\]]*)\]/;
        while ((lm = linkRe.exec(block))) {
            var label = lm[1].replace(/\s+/g, " ").trim(), url = lm[2];
            var rest = block.slice(linkRe.lastIndex);
            var dm = rest.match(/^([\s\S]*?)(?=\n[ \t]*(?:VIDEO LINK|REF\/MAP LINK|ALT LINK|REFERENCE|LINK)\s*:|\n-ALTERNATIVE-|\n[ \t]*PROMPT\s+\d|\n[ \t]*\n|$)/);
            var desc = dm ? dm[1].replace(/\s+/g, " ").trim() : "";
            var tagM = desc.match(TAG_RE);
            links.push({ label: label, url: url, tag: tagM ? tagM[1].trim() : "", desc: desc.replace(TAG_RE, "").replace(/\s+/g, " ").trim() });
        }
        var prompts = [], pr = /PROMPT\s+(\d+):[ \t]*(\|[^\n|]*\|)?[ \t]*\n?([\s\S]*?)(?=\n\s*PROMPT\s+\d+:|\n----|\nSECTION\s+\d+\s*\||$)/g, pm;
        while ((pm = pr.exec(block))) prompts.push({ n: +pm[1], label: pm[2] ? pm[2].replace(/^\||\|$/g, "").trim() : "", text: pm[3].trim() });
        sections.push({ sec: h.sec, words: h.words, type: h.type, typeNum: h.typeNum, label: h.label || "", startSec: startSec, endSec: endSec, dur: dur, startsAt: sa ? sa[1] : "", script: script, links: links, prompts: prompts, char: ch });
    }
    return { sections: sections };
}

/* ---- the same engine for ANY list of URLs (the ambience sounds): nodeDownloadTo per file (Retry-After, backoff ladder, .part),
        auto pace → human cadence after any 429, rate-limit walls honoured, persistent rounds with the pause ladder,
        permanent failures (404 / not a file) never retried. jobs: [{ url, dest, label }]. Resolves { ok, done, fail, permanent, results } */
function downloadUrls(jobs, hooks) {
    hooks = hooks || {}; var log = hooks.log || function () {}, contact = hooks.contact || "", pace = hooks.pace || "auto", maxRounds = hooks.maxRounds || 12;
    var permanent = {}, results = {}, cancelled = function () { return !!(hooks.abort && hooks.abort.aborted); };
    return new Promise(function (resolve) {
        function run(round, dryRounds) {
            var todo = jobs.filter(function (j) { return !results[j.url] && !permanent[j.url] && !fileExists(j.dest); });
            if (!todo.length) return resolve({ ok: !Object.keys(permanent).length, done: Object.keys(results).length, fail: 0, permanent: Object.keys(permanent).length, results: results });
            var i = 0, ok = 0, fail = 0, walls = 0, gap = paceGapMs(pace), sawRL = false, wallStopped = false;
            function finishRound() {
                var left = jobs.filter(function (j) { return !results[j.url] && !permanent[j.url] && !fileExists(j.dest); }).length;
                if (!left || cancelled()) return resolve({ ok: !Object.keys(permanent).length && !left, done: Object.keys(results).length, fail: left, permanent: Object.keys(permanent).length, results: results, cancelled: cancelled() });
                var progressed = ok > 0, dry = progressed ? 0 : dryRounds + 1; if (dry >= maxRounds) return resolve({ ok: false, done: Object.keys(results).length, fail: left, permanent: Object.keys(permanent).length, results: results, gaveUp: true });
                var pause = roundPauseMs(dry, progressed); if (wallStopped) pause = Math.max(pause, 60000);
                log("sfx: round " + round + " — " + ok + " fetched, " + left + " left; next round in " + mmss(pause) + (wallStopped ? " (rate-limit wall)" : ""));
                setTimeout(function () { run(round + 1, dry); }, pause);
            }
            function next() {
                if (cancelled()) return finishRound();
                if (i >= todo.length) return finishRound();
                var j = todo[i++];
                nodeDownloadTo(j.url, j.dest, function (okv, err, info) {
                    if (info && (info.rateLimited || info.status === 429 || info.status === 503)) { sawRL = true; gap = Math.max(gap, paceGapMs("human")); }
                    if (!okv && info && info.rateLimited) {
                        var plan = rlWaitPlan((info && info.retryAfterMs) || 0, walls);
                        if (plan.action === "wait") { walls++; i--; log("sfx: rate-limit wall — pausing " + mmss(plan.waitMs) + " (the server asked)"); return setTimeout(next, plan.waitMs); }
                        wallStopped = true; return finishRound();
                    }
                    if (okv) { ok++; results[j.url] = j.dest; log("sfx: fetched " + (j.label || j.dest.split(/[\\/]/).pop())); }
                    else { fail++; if (isPermanentFailure(err)) { permanent[j.url] = String(err); log("sfx: " + (j.label || j.url) + " — permanent failure (" + err + "), not retried"); } else log("sfx: " + (j.label || j.url) + " — " + err + " (will retry)"); }
                    setTimeout(next, (pace === "human" || gap >= PACE_MS.human) ? Math.max(gap, paceGapMs("human")) : gap);
                }, function (ms, attempt, label) { if (ms > 3000) log("sfx: " + (j.label || "") + " waiting " + mmss(ms) + " (" + (label || "retry") + ")"); }, contact);
            }
            next();
        }
        run(1, 0);
    });
}
module.exports = { downloadUrls: downloadUrls, parseBreakdown: parseBreakdown, downloadAll: downloadAll, collectDownloadJobs: collectDownloadJobs, Ctx: Ctx, fullImageUrl: fullImageUrl, sizeForType: sizeForType, SAVE_FOLDER: SAVE_FOLDER, matchImageForSection: function (ctx, o, files, folder) { return ctx.matchImageForSection(o, files, folder); }, nodeDownloadTo: nodeDownloadTo, downloadSized: downloadSized, rlWaitPlan: rlWaitPlan, roundPauseMs: roundPauseMs, isPermanentFailure: isPermanentFailure };
