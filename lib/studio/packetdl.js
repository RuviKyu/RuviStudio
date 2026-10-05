/* packetdl.js — RUVI Studio (1.3.7)
   Consumes the Claude project's *_download_links.txt ("SAVE AS | URL" lines)
   and downloads every asset into the title's SOURCE section folders
   (Hook / Maps / Reference images / Characters) with the panel's polite-client
   discipline: Retry-After honored, 429/503 backed off (4 attempts), one quick
   retry on transient drops, rate-limit WALL (Retry-After > 45 s) stops the
   batch with advice, scaled renditions per the Navigate size setting with an
   automatic original fallback, .part -> rename atomic writes, and
   skip-if-already-on-disk (the SAVE AS names are canonical). */
"use strict";

var fs = require("fs");
var path = require("path");
var urlmod = require("url");

var FOLDER = { HOOK: "Hook", MAP: "Maps", REF: "Reference images", CHAR: "Characters" };
var DIRECT_RE = /\.(jpe?g|png|gif|webp|svg|tiff?)(\?|#|$)/i;

function folderFor(type) { return FOLDER[String(type || "").toUpperCase()] || null; }

/* ---- parse "SAVE AS | URL   (optional note)" ------------------------------ */
function parseDownloadLinks(text) {
    var jobs = [], manual = [];
    var lines = String(text || "").split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
        var ln = lines[i].trim();
        if (!ln || ln.charAt(0) === "#") continue;
        var bar = ln.indexOf("|");
        if (bar < 0) continue;
        var saveAs = ln.slice(0, bar).trim();
        var rest = ln.slice(bar + 1).trim();
        var url = rest.split(/\s+/)[0] || "";
        var note = rest.slice(url.length).trim().replace(/^\(|\)$/g, "").trim();
        var type = (saveAs.match(/^([A-Za-z]+)/) || [])[1] || "";
        var entry = { saveAs: saveAs, type: type.toUpperCase(), url: url, note: note };
        if (!/^https?:\/\//i.test(url) || !DIRECT_RE.test(url) || !folderFor(entry.type)) manual.push(entry);
        else jobs.push(entry);
    }
    return { jobs: jobs, manual: manual };
}

/* ---- find the links file for a title folder ------------------------------- */
function findLinksFile(titleFolder) {
    var spots = [path.join(titleFolder, "Script"), titleFolder];
    for (var i = 0; i < spots.length; i++) {
        try {
            var names = fs.readdirSync(spots[i]);
            for (var j = 0; j < names.length; j++)
                if (/_download_links\.txt$/i.test(names[j])) return path.join(spots[i], names[j]);
        } catch (e) {}
    }
    return null;
}

/* (1.6.3) WIKIMEDIA MEDIA-API COMPLIANCE.
   Since Jan-Mar 2026 (T414805) upload.wikimedia.org REJECTS directly-constructed
   thumbnails that are not one of the standard steps: first (Jan 2026) with HTTP 429
   "Use thumbnail steps listed on https://w.wiki/GHai" - a 429 that is NOT rate
   limiting - and, as of Sep 2026, with HTTP 400 "Use thumbnail sizes listed on ...".
   The old 4096px / 2560px renditions were both non-standard, so every scaled
   download failed and silently fell back to the FULL ORIGINAL (20-120 MB scans),
   which is what made runs slow and tripped the media limits. Every
   requested width now snaps UP to the next standard step (capped at 3840).
   The User-Agent carries a contact (URL or e-mail) as the Wikimedia User-Agent
   policy demands - without one the 2026 API limits put a client in the
   "unidentified: 10 requests/minute" bucket instead of 200/minute. */
var STD_STEPS = [20, 40, 60, 120, 250, 330, 500, 960, 1280, 1920, 3840];
function snapStep(px) {
    px = px | 0; if (!px) return 0;
    for (var i = 0; i < STD_STEPS.length; i++) if (STD_STEPS[i] >= px) return STD_STEPS[i];
    return STD_STEPS[STD_STEPS.length - 1];
}
var STUDIO_VER = "1.6.8";
function uaFor(contact) {
    var c = String(contact || "").trim();
    if (!/[@\/]/.test(c)) c = "contact not set - add it in Navigate > Images; " + (c || "RUVI Studio operator");
    var nv = ""; try { nv = " Node.js/" + process.versions.node; } catch (e) {}
    return "RUVIStudio/" + STUDIO_VER + " (" + c + ")" + nv;
}
var BAD_SIZE_RE = /thumbnail (steps|sizes)|w\.wiki\/GHai/i;   // today a 400, earlier a 429 - both carry this text

/* ---- scaled renditions (same rules as Navigate 1.3.6; standard steps since 1.6.3) ---- */
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
    return null;
}
function extOf(u) { var m = /(\.[A-Za-z0-9]{2,5})(?:\?|#|$)/.exec(String(u).split("/").pop() || ""); return m ? m[1].toLowerCase() : ""; }

/* ---- downloader (ported 1:1 from Navigate's NODE_DL block) ----------------- */
var RL_WALL_MS = 45000;
function _retryAfterMs(h) {
    if (!h) return 0;
    var s = String(h).trim(), n = parseInt(s, 10);
    if (isFinite(n) && /^\d+$/.test(s)) return Math.min(n, 600) * 1000;
    var d = Date.parse(s);
    if (isFinite(d)) return Math.max(0, Math.min((d - Date.now()) / 1000, 600)) * 1000;
    return 0;
}
function nodeDownloadTo(url, dest, cb, onWait, contact) {
    var part = dest + ".part";
    var attempt = 0, MAX_RL = 6, netRetried = false;
    var BACKOFF = [3000, 8000, 20000, 45000, 90000];        // (1.6.8) escalating floors: a 1 s Retry-After after a burst is not enough
    function schedule(ms, label) { if (onWait) { try { onWait(ms, attempt, label); } catch (ew) {} } setTimeout(once, ms); }
    function settle(ok, err, info) {
        info = info || {};
        if (!ok) {
            var sc = info.status | 0;
            if ((sc === 429 || sc === 503) && !info.badSize && attempt < MAX_RL) {
                var ra = info.retryAfterMs || 0;
                if (ra > RL_WALL_MS) { cb(false, "rate-limited (HTTP " + sc + ") \u2014 the server asks for a ~" + Math.round(ra / 1000) + " s pause", info); return; }
                schedule(Math.max(ra, (BACKOFF[attempt - 1] || 90000)) + Math.floor(Math.random() * 500), "HTTP " + sc);
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
            var mod;
            try { mod = /^https:/i.test(u) ? require("https") : require("http"); }
            catch (e1) { finish(false, "Node https unavailable: " + e1); return; }
            var req;
            try {
                req = mod.get(u, {
                    headers: {
                        "User-Agent": uaFor(contact),
                        "Accept": "image/*,*/*;q=0.8"
                    }
                }, function (res) {
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
                            if (sc === 429 && BAD_SIZE_RE.test(body) && /\/thumb\/.*\d+px-/i.test(String(u))) {   // (1.6.8) a size refusal can only happen on a constructed THUMBNAIL url; Wikimedia's plain rate-limit page mentions thumbnail sizes too
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


/* ---- (1.6.5) HEAL FROM THE FOLDER TREE ------------------------------------
   Before anything is downloaded, look through the title's folder tree for files
   that already ARE the wanted assets and put a copy under the canonical name in
   the canonical section folder. Matches, best first:
     1. the canonical name itself ("MAP 4.jpg" / "map4" / "map_4") anywhere in the tree
        - e.g. saved into Script\ or the wrong section folder by hand;
     2. a per-section alias the panel used to write ("S009_MAP1…", "S009_MAP1.jpg");
     3. the Commons file name of the link ("1830_Plan_of_Ancient_Rome…jpg", with
        %xx decoded and underscores/spaces either way) - browser saves, "original" naming;
     4. another section's canonical file with the SAME link (a shared plate).
   A file already in place is left alone ("present"); anything found elsewhere is
   COPIED (never moved) - the original stays where the user put it. Only when
   nothing matches does the asset go to the network. Folders that are not sources
   (Premiere caches / auto-saves / renders / dot-folders / _STAGING) are skipped and
   the walk stops 4 levels down. */
var HEAL_SKIP_DIR = /^(\.|_staging$|node_modules$|adobe premiere pro|premiere pro|media cache|auto-save|renders?$|exports?$|output$|proxies$|peak files$)/i;
var IMG_EXT_RE = /\.(jpe?g|png|gif|webp|tiff?|bmp)$/i;
function walkTree(root, maxDepth) {
    var out = [];
    function walk(dir, depth) {
        var names; try { names = fs.readdirSync(dir); } catch (e) { return; }
        for (var i = 0; i < names.length; i++) {
            var nm = names[i], p = path.join(dir, nm), st;
            try { st = fs.statSync(p); } catch (e2) { continue; }
            if (st.isDirectory()) { if (depth < maxDepth && !HEAL_SKIP_DIR.test(nm)) walk(p, depth + 1); }
            else if (IMG_EXT_RE.test(nm) && st.size > 0) out.push({ path: p, dir: dir, name: nm, size: st.size });
        }
    }
    walk(root, 0);
    return out;
}
function stemLower(name) { return String(name).replace(/\.[a-z0-9]{2,5}$/i, "").toLowerCase(); }
function nameVariants(stem) {                       // "MAP 4" -> map 4 / map4 / map_4 / map-4
    var s = String(stem).toLowerCase().trim(), m = /^([a-z]+)\s*[ _-]?\s*(\d+)$/.exec(s);
    if (!m) return [s];
    return [m[1] + " " + m[2], m[1] + m[2], m[1] + "_" + m[2], m[1] + "-" + m[2]];
}
function commonsStems(url) {                        // file name of the link, decoded, both separators
    var clean = String(url || "").split("#")[0].split("?")[0];
    var last = clean.split("/").pop() || "";
    if (/\/thumb\//i.test(clean)) { var parts = clean.split("/"); last = parts[parts.length - 2] || last; }   // thumb URL -> the file name segment
    var dec = last; try { dec = decodeURIComponent(last); } catch (e) {}
    var a = stemLower(dec), b = a.replace(/_/g, " "), c = a.replace(/ /g, "_");
    var out = [];
    for (var i = 0, arr = [a, b, c]; i < arr.length; i++) if (arr[i] && out.indexOf(arr[i]) < 0) out.push(arr[i]);
    return out;
}
function healTree(titleFolder, jobs, opts) {
    opts = opts || {};
    var files = walkTree(titleFolder, opts.maxDepth || 4);
    var byUrl = {}, report = { healed: [], present: [], missing: [], scanned: files.length };
    var i, j, k;
    for (i = 0; i < jobs.length; i++) { var u = String(jobs[i].url || "").split("#")[0].split("?")[0]; (byUrl[u] = byUrl[u] || []).push(jobs[i]); }
    function canonicalOf(job) {
        var sub = folderFor(job.type); if (!sub) return null;
        var stem = job.saveAs.replace(/\.[A-Za-z0-9]{2,5}$/, "");
        var dir = path.join(titleFolder, sub), have = [];
        try { have = fs.readdirSync(dir); } catch (e) {}
        for (var h = 0; h < have.length; h++) {
            var n = have[h].toLowerCase();
            if (n === job.saveAs.toLowerCase() || n.indexOf(stem.toLowerCase() + ".") === 0) return path.join(dir, have[h]);
        }
        return null;
    }
    var canon = {};
    for (i = 0; i < jobs.length; i++) canon[jobs[i].saveAs] = canonicalOf(jobs[i]);
    for (i = 0; i < jobs.length; i++) {
        var job = jobs[i];
        if (canon[job.saveAs]) { report.present.push(job.saveAs); continue; }
        var sub = folderFor(job.type); if (!sub) { report.missing.push(job.saveAs); continue; }
        var stem = job.saveAs.replace(/\.[A-Za-z0-9]{2,5}$/, "");
        var wantStems = nameVariants(stem), aliases = [];
        for (k = 0; k < (job.aliases || []).length; k++) aliases.push(String(job.aliases[k]).toLowerCase());
        var cstems = commonsStems(job.url);
        var best = null, bestScore = 0;
        for (j = 0; j < files.length; j++) {
            var f = files[j], st = stemLower(f.name), sc = 0;
            if (wantStems.indexOf(st) >= 0) sc = 6;
            else { for (k = 0; k < aliases.length && !sc; k++) if (st === aliases[k] || st.indexOf(aliases[k] + "__") === 0 || st.indexOf(aliases[k] + " ") === 0) sc = 5; }
            if (!sc && cstems.indexOf(st) >= 0) sc = 4;
            if (!sc) { for (k = 0; k < wantStems.length; k++) if (st.indexOf(wantStems[k] + " (") === 0) { sc = 3; break; } }
            if (sc > bestScore) { bestScore = sc; best = f; }
        }
        if (!best) {                                                                   // 4. a shared plate: another section's canonical file with the same link
            var u2 = String(job.url || "").split("#")[0].split("?")[0], group = byUrl[u2] || [];
            for (k = 0; k < group.length; k++) if (group[k] !== job && canon[group[k].saveAs]) { best = { path: canon[group[k].saveAs], name: path.basename(canon[group[k].saveAs]) }; bestScore = 2; break; }
        }
        if (!best) { report.missing.push(job.saveAs); continue; }
        var ext = (/\.[A-Za-z0-9]{2,5}$/.exec(best.name) || [".jpg"])[0].toLowerCase();
        var dest = path.join(titleFolder, sub, stem + ext);
        try {
            fs.mkdirSync(path.join(titleFolder, sub), { recursive: true });
            fs.copyFileSync(best.path, dest);
            canon[job.saveAs] = dest;
            report.healed.push({ saveAs: job.saveAs, from: best.path, how: ["", "", "shared plate", "numbered copy", "Commons file name", "old section name", "canonical name"][bestScore] });
        } catch (eC) { report.missing.push(job.saveAs); }
    }
    return report;
}

/* ---- the batch ------------------------------------------------------------ */
/* run({ titleFolder, linksFile?, sizePx?, gapMs? }, onStep, done)
   done({ ok, skipped, failed:[{saveAs,err}], manual:[entries], stoppedAtWall, linksFile, total }) */
function run(opts, onStep, done) {
    var step = onStep || function () {};
    var linksFile = opts.linksFile || findLinksFile(opts.titleFolder);
    if (!linksFile) { done({ error: "no *_download_links.txt found in Script\\ or the title folder" }); return; }
    var parsed;
    try { parsed = parseDownloadLinks(fs.readFileSync(linksFile, "utf8")); }
    catch (e) { done({ error: "couldn't read " + linksFile + ": " + (e && e.message || e) }); return; }
    var jobs = parsed.jobs, sizePx = snapStep(opts.sizePx == null ? 3840 : opts.sizePx);   // (1.6.3) standard steps only
    var contact = opts.contact || "";
    var heal = { healed: [], present: [], missing: [] };
    if (opts.heal !== false) {                                                         // (1.6.5) first: what is already in the folder tree?
        try { heal = healTree(opts.titleFolder, jobs, {}); } catch (eH) { heal = { healed: [], present: [], missing: [], error: String(eH) }; }
        for (var hh = 0; hh < heal.healed.length; hh++) step("healed " + heal.healed[hh].saveAs + " \u2190 " + heal.healed[hh].from + " (" + heal.healed[hh].how + ")");
        if (heal.healed.length || heal.present.length) step("folder tree: " + heal.present.length + " already in place, " + heal.healed.length + " healed from elsewhere, " + heal.missing.length + " to download");
    }
    var gap = (opts.gapMs | 0) || 350;
    var i = 0, ok = 0, skipped = 0, copied = 0, failed = [], stoppedAtWall = false, rlRow = 0, cooled = false;
    var doneByUrl = {};                                   // (1.6.4) url -> file saved this run: shared plates are copied, not re-downloaded

    function destFor(job, usedUrl) {
        var sub = folderFor(job.type);
        var stem = job.saveAs.replace(/\.[A-Za-z0-9]{2,5}$/, "");
        var ext = extOf(usedUrl) || extOf(job.saveAs) || ".jpg";
        return path.join(opts.titleFolder, sub, stem + ext);
    }
    function next() {
        if (i >= jobs.length) {
            done({ ok: ok, copied: copied, healed: heal.healed.length, skipped: skipped, failed: failed, manual: parsed.manual, stoppedAtWall: stoppedAtWall, linksFile: linksFile, total: jobs.length });
            return;
        }
        var job = jobs[i++];
        var sub = folderFor(job.type);
        try { fs.mkdirSync(path.join(opts.titleFolder, sub), { recursive: true }); } catch (e0) {}
        // canonical names -> plain existence check is the dedupe
        var stem = job.saveAs.replace(/\.[A-Za-z0-9]{2,5}$/, "");
        var already = null;
        try {
            var have = fs.readdirSync(path.join(opts.titleFolder, sub));
            for (var h = 0; h < have.length; h++)
                if (have[h].toLowerCase() === job.saveAs.toLowerCase() || have[h].toLowerCase().indexOf(stem.toLowerCase() + ".") === 0) { already = have[h]; break; }
        } catch (e1) {}
        if (already) { skipped++; step("[" + i + "/" + jobs.length + "] " + job.saveAs + " \u2014 already on disk"); setTimeout(next, 10); return; }

        var scaled = scaledUrl(job.url, sizePx);
        var urlKey = String(job.url).split("#")[0].split("?")[0];
        if (doneByUrl[urlKey] && fs.existsSync(doneByUrl[urlKey])) {                                   // (1.6.4) same sheet as an earlier job -> local copy
            var cdest = destFor(job, doneByUrl[urlKey]);
            try { fs.copyFileSync(doneByUrl[urlKey], cdest); ok++; copied++; step("[" + i + "/" + jobs.length + "] " + job.saveAs + " \u2713 (copied from " + path.basename(doneByUrl[urlKey]) + " \u2014 shared plate)"); }
            catch (eC) { failed.push({ saveAs: job.saveAs, err: "couldn't copy " + path.basename(doneByUrl[urlKey]) + ": " + (eC && eC.message || eC) }); step("[" + i + "/" + jobs.length + "] " + job.saveAs + " FAILED \u2014 copy"); }
            setTimeout(next, 10); return;
        }
        function onWait(ms, att, label) { step("[" + i + "/" + jobs.length + "] " + job.saveAs + " \u00b7 " + label + " \u2014 retrying in " + Math.ceil(ms / 1000) + " s (attempt " + (att + 1) + "/6)"); }
        function finish(okv, err, info, usedDest) {
            if (okv) { ok++; if (usedDest) doneByUrl[urlKey] = usedDest; step("[" + i + "/" + jobs.length + "] " + job.saveAs + " \u2713"); }
            else {
                failed.push({ saveAs: job.saveAs, err: err });
                if (info && (info.retryAfterMs || 0) > RL_WALL_MS) {
                    stoppedAtWall = true;
                    step("rate-limit WALL (server asks ~" + Math.round(info.retryAfterMs / 1000) + " s) \u2014 stopping; press again in ~10 min, saved files are skipped");
                    i = jobs.length;                       // don't probe the rest
                }
                else step("[" + i + "/" + jobs.length + "] " + job.saveAs + " FAILED \u2014 " + err);
            }
            if (info && (info.rateLimited || info.status === 429 || info.status === 503)) { gap = 2500; rlRow++; } else if (okv) rlRow = 0;
            if (!okv && rlRow >= 3 && !cooled) {                   // (1.6.8) three rate-limited failures in a row: one 90 s cool-down, then continue
                cooled = true; rlRow = 0; step("rate limited three times in a row \u2014 cooling down for 90 s, then continuing"); gap = 90000;
            }
            setTimeout(next, gap);
        }
        step("[" + i + "/" + jobs.length + "] " + job.saveAs + (scaled ? " (\u2264" + sizePx + "px)" : ""));
        var dOrig = destFor(job, job.url), dScaled = scaled ? destFor(job, scaled) : null;
        if (!scaled) { nodeDownloadTo(job.url, dOrig, function (okv, err, info) { finish(okv, err, info, dOrig); }, onWait, contact); return; }
        nodeDownloadTo(scaled, dScaled, function (okv, err, info) {
            if (!okv && info && (info.status === 404 || info.status === 400 || info.badSize)) {
                nodeDownloadTo(job.url, dOrig, function (okv2, err2, info2) { finish(okv2, err2, info2, dOrig); }, onWait, contact);   // rendition unavailable / size refused -> original
                return;
            }
            finish(okv, err, info, dScaled);
        }, onWait, contact);
    }
    step("links file: " + linksFile + " \u2014 " + jobs.length + " downloadable, " + parsed.manual.length + " manual");
    next();
}

/* ---- browser-handoff support (the literal "works in Chrome" engine) ------- */
function withDownloadParam(u) {
    var s2 = String(u || "");
    if (!/upload\.wikimedia\.org|\/wiki\/Special:FilePath\//i.test(s2)) return s2;
    if (/[?&]download(\b|=|$)/i.test(s2)) return s2;
    return s2 + (s2.indexOf("?") >= 0 ? "&" : "?") + "download";
}
/* which SAVE-AS names are not on disk yet (same existence rule as run()) */
function missingJobs(titleFolder, linksFile) {
    linksFile = linksFile || findLinksFile(titleFolder);
    if (!linksFile) return { error: "no *_download_links.txt found in Script\\ or the title folder" };
    var parsed;
    try { parsed = parseDownloadLinks(fs.readFileSync(linksFile, "utf8")); }
    catch (e) { return { error: "couldn't read " + linksFile + ": " + (e && e.message || e) }; }
    var missing = [];
    for (var i = 0; i < parsed.jobs.length; i++) {
        var job = parsed.jobs[i], sub = folderFor(job.type);
        var stem = job.saveAs.replace(/\.[A-Za-z0-9]{2,5}$/, "").toLowerCase();
        var found = false;
        try {
            var have = fs.readdirSync(path.join(titleFolder, sub));
            for (var h = 0; h < have.length; h++) {
                var n = have[h].toLowerCase();
                if (n === job.saveAs.toLowerCase() || n.indexOf(stem + ".") === 0) { found = true; break; }
            }
        } catch (e1) {}
        if (!found) missing.push(job);
    }
    return { missing: missing, manual: parsed.manual, linksFile: linksFile, total: parsed.jobs.length };
}

module.exports = { healTree: healTree, walkTree: walkTree, snapStep: snapStep, uaFor: uaFor, parseDownloadLinks: parseDownloadLinks, findLinksFile: findLinksFile, folderFor: folderFor, scaledUrl: scaledUrl, run: run, missingJobs: missingJobs, withDownloadParam: withDownloadParam, FOLDER: FOLDER };
