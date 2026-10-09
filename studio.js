#!/usr/bin/env node
/* ============================================================================
   RUVI Conductor SPECIAL 1.0 — the special sections only, as their own app.
   No Premiere, no After Effects. For every READY title under the base folder it
   renders each HOOK / MAP / REF / CHAR section from its still + its object in
   [Subject]_allanimations.json (the same map and stills engines the Conductor
   uses, in headless Chrome), with the standard black fade in / fade out and the
   narration slice as audio, and drops the MP4 into the Render tab's folders:
       <out>\Hook Section\  <out>\Map Section\  <out>\Reference Image Sections\  <out>\Character Sections\
   where <out> is the title folder itself (default) or <outputRoot>\<CHANNEL>\Titles\<title>\.
   READY = the package is unpacked in Script\ (stamped FULL breakdown) + the
   bundle is in Maps\ or Script\ + every special still is on disk (missing stills
   are downloaded first from [Subject]_download_links.txt).
   Run:  node special.js       then open  http://localhost:4713
   ========================================================================== */
"use strict";
var http = require("http"), fs = require("fs"), path = require("path"), os = require("os"), cp = require("child_process");
var HERE = __dirname, CFG_FILE = path.join(HERE, "studio.config.json");
var ST = require("./lib/structure.js"), FF = require("./lib/ffmpeg.js"), CAP = require("./lib/render/capture.js"), UZ = require("./lib/unzip.js"), D = require("./lib/studio/packetdl.js"), PV = require("./lib/provision.js"), NAV = require("./lib/studio/navdl.js");
var G = require("./lib/studio/stages/grab.js"), PK = require("./lib/studio/packet.js");   // the Adobe extension's Trello grab, vendored
var AS = require("./lib/assemble.js"), SFX = require("./lib/sfx.js"), ZIP = require("./lib/zipw.js"), UP = require("./lib/upscaler.js"), IG = require("./lib/imagegen.js");

process.on("unhandledRejection", function (e) { try { glog("unhandled rejection: " + (e && e.stack || e)); } catch (e2) {} });
process.on("uncaughtException", function (e) { try { glog("uncaught exception: " + (e && e.stack || e)); } catch (e2) {} });
var OUT_FOLDER = { HOOK: "Hook Section", MAP: "Map Section", REF: "Reference Image Sections", CHAR: "Character Sections" };   // (legacy Render-tab names)
var TITLES = "Titles", SFX_DIR = "SFX", MUSIC_DIR = "Music";     // <base>\<CHANNEL>\Titles\<n. Title>\  ·  <base>\<CHANNEL>\SFX\ (ambience cache)  ·  Music\ is discontinued (left untouched)
var TITLE_FOLDERS = ["Assets", "Characters", "Hook", "Maps", "Project", "Reference images", "Script", "AI Images", "Output"];
var DEFAULT_CFG = {
    base: process.platform === "win32" ? "C:\\RUVISTUDIO" : path.join(os.homedir(), "RUVISTUDIO"),
    naming: "name",                                          // part files in Output\parts\: S005_MAP1.mp4
    port: 4710, ffmpeg: "ffmpeg", ffprobe: "ffprobe",
    render: { fps: 60, crf: 16, preset: "medium", fadeSec: 0.5, edgeBlur: true, frameFormat: "jpeg", jpegQuality: 96, chrome: "", width: 1920, height: 1080, audio: true,
              missingObjects: "defaults", workers: 0,     // workers 0 = automatic (half the CPU cores, 1..4): sections render in parallel, each in its own Chrome + ffmpeg
              encoder: "auto", nvencCq: 19, nvencPreset: "p5",     // auto = NVIDIA NVENC (h264_nvenc, constant quality 19) when the card + driver + ffmpeg build support it, else libx264 on the CPU
              capture: "screencast", threads: true,                  // (chrome engine only) screencast = frames from the compositor; screenshot = the 1.4 path. threads = each section in its own worker thread
              engine: "native",                                       // native = Skia + ffmpeg perspective (no browser, ~10-20x faster) · chrome = the headless-Chrome renderer
              tableLean: 17, perspective: 2200, hlStyle: "ink",        // the sheet's lean back on the table (°), the camera's perspective distance, the highlight style (ink | glow)
              macro: "normal",                                        // macro-lens finish on maps: off | light | normal | strong (soft edges, softer corners, light vignette)
              letterbox: 2.0, voDb: 0, zoom: 1.22, zoomDrift: 0.06, keepParts: true, sfxLufs: -31, sfxUnderVoiceDb: 26, sfxDuckDb: 2.5 },   // sfxUnderVoiceDb: the bed sits 26 dB under the measured voice (barely there)   // AI pan: zoom 1.22 = room to move; ambience bed at -31 LUFS (clearly there, well under the voice), 2.5 dB duck under the voice   // keepParts: keep Output\parts\ (the rendered sections) so a re-run only redoes what changed; false = delete it after the final video   // final video: letterbox ratio (2.0 = 60 px bars; 2.39 = 138 px), music/voice levels, AI Ken Burns zoom                 // a section whose still has no bundle object: "defaults" = plain map framing / REF pull-out; "skip" = not ready
    download: { pace: "auto", contact: "", imgNaming: "typenum", hookOriginal: true },
    grab: { whisperModel: "", whisperDevice: "", autoInstallWhisper: true, prefetchModel: true, chatUrl: "", batched: true, batchSize: 16, computeType: "float16", shareRuntime: true, looseFiles: false },   // looseFiles false = Script\ keeps only packet.zip + the VO .mp3; shareRuntime = junction <base>\_RUNTIME\python → the app's whisper runtime for the Adobe extension   // max-speed CUDA: batched inference (16 windows per pass) in float16   // the Trello grab (RUVI Studio's stage): whisper model/device blank = the Studio's own plan (GPU + CUDA libs → distil-large-v3)   // the Navigate tab's engine one-to-one: auto pace (fast → human cadence after a 429), MAP originals / others at 3840, persistent rounds, walls, manifest. hookOriginal: the HOOK is a map now — fetch its sheet as an original like MAP (the one deliberate deviation; off = exactly 1.6.7)
    upgradeLowRes: false,                                    // (kept for the older path; the Navigate engine decides sizes itself)
    upscaler: { url: "https://comfy-oil-upscaler.vercel.app", prompt: "", parallel: 10, keepRaw: true, suffix: "_painted", channels: { BILGERATS: true, SCURVYDOGS: true, OLDWORLDPROOF: false }, workflow: null },   // channels: which channels' AI images get painted; workflow: ComfyUI node parameters edited in the UPSCALER tab (null = the bundled workflow)   // Ruvi's Batch Oil Upscaler (Vercel → RunPod): the deployment URL; originals are kept in AI Images\_raw\
    imagegen: { enabled: true, model: "gemini-3-pro-image-preview", imageSize: "2K", aspectRatio: "16:9", parallel: 2, retries: 4, channels: {} },   // the AI images from Google's official Gemini API (key: _SECRETS\secrets.json "geminiKey"); channels: {NAME:false} switches a channel off
    turboflow: { dir: "", watch: true },                     // the TurboFlow bridge: the extension's download folder (blank = <home>\Downloads\turboflow); numbered files are filed into the title's AI Images\ by the batch the prompts panel recorded
    archived: [],                                            // title folders set aside by hand (archive button): they leave the to-do list and "run all" never picks them
    cta: { enabled: true, positions: [0.2, 0.5], byChannel: {} }   // CTA inserts: <CHANNEL>\CTA\* in name order, CTA n at positions[n-1] of the narration (a channel key in byChannel overrides, e.g. {"OLDWORLDPROOF": [0.25, 0.6]}); a channel with no CTA folder/files gets none
};
function deepMerge(a, b) { Object.keys(b || {}).forEach(function (k) { if (b[k] && typeof b[k] === "object" && !Array.isArray(b[k])) a[k] = deepMerge(a[k] || {}, b[k]); else a[k] = b[k]; }); return a; }
function loadCfg() {
    var c = {}; try { c = JSON.parse(fs.readFileSync(CFG_FILE, "utf8")); } catch (e) {}
    var m = deepMerge(JSON.parse(JSON.stringify(DEFAULT_CFG)), c);
    var ext = process.platform === "win32" ? ".exe" : "", rtff = path.join(HERE, "runtime", "ffmpeg", "ffmpeg" + ext), rtfp = path.join(HERE, "runtime", "ffmpeg", "ffprobe" + ext);
    if ((!m.ffmpeg || m.ffmpeg === "ffmpeg") && fs.existsSync(rtff)) m.ffmpeg = rtff;
    if ((!m.ffprobe || m.ffprobe === "ffprobe") && fs.existsSync(rtfp)) m.ffprobe = rtfp;
    return m;
}
function saveCfg(c) { fs.writeFileSync(CFG_FILE, JSON.stringify(c, null, 2)); }
var config = loadCfg(); if (!fs.existsSync(CFG_FILE)) saveCfg(config); FF.configure(config);
function listFiles(d) { try { return fs.readdirSync(d); } catch (e) { return []; } }
function readJson(f, d) { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return d; } }
function norm(x) { return String(x).toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/[ _\-]+/g, ""); }
function sanitize(s) { return String(s).replace(/[\\/:*?"<>|]/g, "_").replace(/\s+$/, ""); }
/* ---- images: the same downloader as the Adobe extension (lib/studio/packetdl.js, byte-identical to
   RUVI Studio 1.6.7's) — heal from the folder tree, shared plates copied, standard Wikimedia thumbnail
   steps, policy User-Agent, Retry-After. It reads [Subject]_download_links.txt; when the package has
   none, the list is generated from the breakdown's own section links (as the Navigate tab does). ---- */
var crypto = require("crypto");
function directUrl(u) {
    u = String(u || "").trim(); if (!u) return "";
    var m = /^https?:\/\/commons\.wikimedia\.org\/wiki\/File:(.+)$/i.exec(u) || /^https?:\/\/commons\.wikimedia\.org\/w\/index\.php\?title=File:([^&]+)/i.exec(u);
    if (m) { var name = decodeURIComponent(m[1]).replace(/ /g, "_"); var h = crypto.createHash("md5").update(name, "utf8").digest("hex"); return "https://upload.wikimedia.org/wikipedia/commons/" + h[0] + "/" + h.slice(0, 2) + "/" + encodeURIComponent(name).replace(/%2C/g, ",").replace(/%28/g, "(").replace(/%29/g, ")"); }
    return u.split("#")[0].split("?")[0];
}
function ensureLinksFile(tf, subject, bd) {
    var sc = path.join(tf, "Script"), have = listFiles(sc).filter(function (x) { return /_download_links\.txt$/i.test(x); })[0] || listFiles(tf).filter(function (x) { return /_download_links\.txt$/i.test(x); })[0];
    if (have) return { path: path.join(fs.existsSync(path.join(sc, have)) ? sc : tf, have), generated: false };
    var lines = ["# generated by Ruvi Studio from " + subject + "_breakdown.txt (the package carried no _download_links.txt)", "# SAVE AS | URL"], n = 0;
    bd.sections.forEach(function (s) {
        if (s.type === "AI" || !ST.FOLDER[s.type] || !s.link) return;
        var direct = directUrl(s.link); if (!/^https?:\/\/upload\.wikimedia\.org\//i.test(direct)) { lines.push("# " + s.assetStem + " | " + s.link + "   (not a Wikimedia file URL — download by hand)"); return; }
        var ext = (/\.([a-z0-9]{2,5})$/i.exec(direct.split("/").pop()) || [0, "jpg"])[1].toLowerCase(); if (ext === "jpeg") ext = "jpg";
        lines.push(s.assetStem + "." + ext + " | " + direct + "?download"); n++;
    });
    var out = path.join(sc, subject + "_download_links.txt"); fs.writeFileSync(out, lines.join("\n") + "\n");
    return { path: out, generated: true, count: n };
}
function verifyStills(info) {
    // a still that exists but cannot be decoded (0 bytes, a half download, an HTML error page saved as .jpg) is removed so the downloader fetches it again
    var chain = Promise.resolve(), bad = [];
    info.specials.forEach(function (s) {
        if (!s.still) return;
        chain = chain.then(function () { var st = fs.statSync(s.still); if (st.size < 1024) throw new Error("tiny"); return FF.probe(s.still).then(function (pi) { if (!pi.width || !pi.height) throw new Error("undecodable"); }); })
            .catch(function () { bad.push(path.basename(s.still)); try { fs.unlinkSync(s.still); } catch (e) {} s.still = ""; });
    });
    return chain.then(function () { return bad; });
}
/* the same Commons file is often already on disk in ANOTHER title of the channel (shared plates, recurring portraits):
   every sibling title's _download_links.txt maps URL → its canonical file; a hit is copied instead of downloaded */
function crossTitleHeal(tf, info, log) {
    var chan = path.dirname(tf), lf = ensureLinksFile(tf, info.subject, info.bd), wantByUrl = {}, copied = 0;
    (D.parseDownloadLinks(fs.readFileSync(lf.path, "utf8")).jobs || []).forEach(function (j) { wantByUrl[String(j.url).split("#")[0].split("?")[0]] = j; });
    var need = {}; info.specials.forEach(function (s) { if (!s.still) need[s.assetStem || (s.type + " " + (s.type === "HOOK" ? 1 : s.ordinal))] = s; });
    if (!Object.keys(need).length) return 0;
    listFiles(chan).forEach(function (t) {
        var other = path.join(chan, t); if (other === tf || !fs.existsSync(path.join(other, "Script"))) return;
        listFiles(path.join(other, "Script")).filter(function (x) { return /_download_links\.txt$/i.test(x); }).forEach(function (x) {
            var jobs = D.parseDownloadLinks(fs.readFileSync(path.join(other, "Script", x), "utf8")).jobs || [];
            jobs.forEach(function (oj) {
                var u = String(oj.url).split("#")[0].split("?")[0], mine = wantByUrl[u]; if (!mine) return;
                var stemMine = mine.saveAs.replace(/\.[a-z0-9]+$/i, ""); if (!need[stemMine]) return;
                var src = ST.findFile(path.join(other, D.folderFor(oj.type) || ST.FOLDER[oj.type] || ""), oj.saveAs.replace(/\.[a-z0-9]+$/i, ""), null); if (!src) return;
                try { if (fs.statSync(src).size < 1024) return; var dstDir = path.join(tf, ST.FOLDER[mine.type]); fs.mkdirSync(dstDir, { recursive: true }); var dst = path.join(dstDir, stemMine + path.extname(src).toLowerCase()); fs.copyFileSync(src, dst); copied++; delete need[stemMine]; log("copied " + path.basename(dst) + " from “" + t + "” (same Commons file)"); } catch (e) {}
            });
        });
    });
    return copied;
}
function lowResStills(info) {
    // stills the bundle describes as larger than the file on disk (a 3840 rendition of a 9000-px sheet): fetch the original
    var out = [], memF = path.join(info.titleFolder, "Script", "_upgraded.json"), mem = readJson(memF, {});
    if (!config.upgradeLowRes) return Promise.resolve(out);
    var chain = Promise.resolve();
    info.specials.forEach(function (s) {
        if (!s.still || !s.obj || s.obj._default) return;
        if (mem[s.name]) return;                                   // one attempt per section, remembered in Script\_upgraded.json
        var want = s.obj._still ? (s.obj.image_width || 0) : (s.obj.map_width || 0); if (!want) return;
        chain = chain.then(function () { return FF.probe(s.still).then(function (pi) { if (pi.width && pi.width < want * 0.92) { out.push({ still: s.still, have: pi.width, want: want, name: s.name }); } }).catch(function () {}); });
    });
    return chain.then(function () { out.forEach(function (x) { mem[x.name] = { have: x.have, want: x.want, at: new Date().toISOString() }; }); if (out.length) try { fs.writeFileSync(memF, JSON.stringify(mem, null, 1)); } catch (e) {} return out; });
}
function downloadStills(tf, info, log, jobRef) {
    // ONE-TO-ONE: RUVI Studio 1.6.7's Navigate "Download all images" engine (lib/studio/navdl.js) — the breakdown's own
    // section links, heal from the folder tree, shared plates copied, _saved_links.json manifest, auto pace that drops to
    // human cadence after any 429, rate-limit walls waited out, persistent rounds until every image is in place.
    var c = crossTitleHeal(tf, info, log); if (c) log(c + " image(s) copied from other titles in the channel");
    var bd = NAV.parseBreakdown(fs.readFileSync(info.breakdownPath, "utf8"));
    var sizeFor = config.download.hookOriginal ? function (ty) { return (ty === "MAP" || ty === "HOOK") ? 0 : 3840; } : NAV.sizeForType;
    return new Promise(function (res, rej) {
        var lastStatus = "";
        var h = NAV.downloadAll({ titleFolder: tf, bd: bd, dlPace: config.download.pace || "auto", dlContact: config.download.contact, imgNaming: config.download.imgNaming || "typenum", healTree: D.healTree, sizeForType: sizeFor }, {
            status: function (m) { if (m !== lastStatus) { lastStatus = m; log(m); } },
            button: function (m) { if (jobRef) jobRef.detail = m; },
            note: function (m) { if (m) log(m); },
            done: function (sum) {
                if (jobRef) jobRef.dlHandle = null;
                if (sum.stopped) return rej(new Error("download stopped — " + sum.missing + " image(s) still missing; press run to resume"));
                if (sum.ok === false && sum.fail) return rej(new Error((sum.wallStopped ? "stopped at Wikimedia's rate-limit wall — wait ~10 minutes and press run again" : ("downloads failed: " + (sum.failMsgs || []).slice(0, 4).join("  ·  ")))));
                res(sum);
            }
        });
        if (jobRef) jobRef.dlHandle = h;
    });
}
/* RUVI Studio's Render tab keeps its Destination in %APPDATA%\SectionRenderer\settings.json (root, titlesSub, naming);
   the shared save-root also lives in %APPDATA%\N8NHistorySuite\suite.json. Used when outputRoot is blank. */
function studioRenderSettings() {
    var ud = process.platform === "win32" ? (process.env.APPDATA || "") : (process.platform === "darwin" ? path.join(os.homedir(), "Library", "Application Support") : path.join(os.homedir(), ".config"));
    var out = { root: "", titlesSub: "", naming: "", source: "" };
    var r = readJson(path.join(ud, "SectionRenderer", "settings.json"), null);
    if (r) { out.root = r.root || ""; out.titlesSub = r.titlesSub || ""; out.naming = r.naming || ""; out.source = "SectionRenderer/settings.json"; }
    if (!out.root) { var su = readJson(path.join(ud, "N8NHistorySuite", "suite.json"), null); if (su && (su.saveRoot || su.root)) { out.root = su.saveRoot || su.root; out.source = "N8NHistorySuite/suite.json"; } }
    return out;
}
function effectiveOutput() {
    if (config.outputRoot) return { root: config.outputRoot, titlesSub: config.titlesSub || "Titles", source: "settings" };
    var st = studioRenderSettings(); if (st.root) return { root: st.root, titlesSub: st.titlesSub || config.titlesSub || "Titles", source: "RUVI Studio " + st.source };
    return { root: "", titlesSub: "", source: "title folder" };
}
/* unpack the writing room's package into Script\ and place the animation bundle into Maps\ as well (the Adobe extension reads it there) */
function unpackPackage(tf) {
    var sc = path.join(tf, "Script"), zip = listFiles(sc).filter(function (x) { return /_package\.zip$/i.test(x); })[0]; if (!zip) return { ok: false, error: "no *_package.zip in Script\\" };
    var files = UZ.extract(path.join(sc, zip), sc, { flatten: true, filter: function (r) { return !/\.zip$/i.test(r); } }), maps = path.join(tf, "Maps"); fs.mkdirSync(maps, { recursive: true });
    files.filter(function (f) { return /_all(animations|maps)\.json$/i.test(f); }).forEach(function (f) { try { fs.copyFileSync(path.join(sc, path.basename(f)), path.join(maps, path.basename(f))); } catch (e) {} });
    return { ok: true, files: files.length, zip: zip };
}
function open(t) {
    try {
        var isDir = false; try { isDir = fs.statSync(t).isDirectory(); } catch (e) {}
        if (process.platform === "win32") cp.spawn(isDir ? "explorer.exe" : "rundll32.exe", isDir ? [t] : ["url.dll,FileProtocolHandler", t], { detached: true, stdio: "ignore", windowsHide: true }).unref();   // no cmd.exe in between: & ^ | in a title name are just characters
        else cp.spawn(process.platform === "darwin" ? "open" : "xdg-open", [t], { detached: true, stdio: "ignore" }).unref();
    } catch (e) {}
}
/* /api/open may only open what the UI shows: folders and plain files under the base folder or the app's runtime\ (never an executable) */
var OPEN_EXT = /\.(txt|md|json|csv|srt|log|mp4|mov|mkv|m4v|mp3|wav|ogg|jpe?g|png|webp|pdf|docx|zip)$/i;
function openAllowed(t) {
    if (!t || typeof t !== "string") return false;
    var abs = path.resolve(t), roots = [path.resolve(config.base), path.resolve(HERE, "runtime"), path.resolve(HERE, "updates"), path.resolve(tfDir())], inside = roots.some(function (r) { var a = process.platform === "win32" ? abs.toLowerCase() : abs, b = process.platform === "win32" ? r.toLowerCase() : r; return a === b || a.indexOf(b + path.sep) === 0; });
    if (!inside) return false;
    try { var st = fs.statSync(abs); return st.isDirectory() || (st.isFile() && OPEN_EXT.test(abs)); } catch (e) { return false; }
}

/* ---- a title: what it has, what it needs ---------------------------------- */
function inspect(tf, channel, n, titleName) {
    var sc = path.join(tf, "Script"), names = listFiles(sc);
    var info = { titleFolder: tf, channel: channel, n: n, title: titleName, subject: "", ready: false, missing: [], specials: [], rendered: 0, packageZip: names.filter(function (x) { return /_package\.zip$/i.test(x); })[0] || "", outBase: tf, defaulted: 0, packet: names.filter(function (x) { return /^packet.*\.zip$/i.test(x); })[0] || "" };
    var bdName = names.filter(function (x) { return /_breakdown\.txt$/i.test(x) && !/_special_breakdown|_original/i.test(x); })[0];
    if (!bdName) { info.missing.push(info.packageZip ? "package not unpacked (press Unpack)" : "no package from the writing room in Script\\"); return info; }
    info.subject = bdName.replace(/_breakdown\.txt$/i, ""); info.breakdownPath = path.join(sc, bdName);
    var bd; try { bd = ST.parseBreakdown(fs.readFileSync(path.join(sc, bdName), "utf8")); } catch (e) { info.missing.push("breakdown unreadable"); return info; }
    if (bd.sections.some(function (s) { return s.t0 == null; })) info.missing.push("breakdown not stamped (TIMECODE pending)");
    var bundlePath = ""; [sc, path.join(tf, "Maps")].forEach(function (d) { if (bundlePath) return; var b = listFiles(d).filter(function (x) { return /_all(animations|maps)\.json$/i.test(x); })[0]; if (b) bundlePath = path.join(d, b); });
    if (!bundlePath) info.missing.push("no " + info.subject + "_allanimations.json in Maps\\ or Script\\");
    var bundle = bundlePath ? readJson(bundlePath, null) : null; if (bundlePath && !bundle) info.missing.push("bundle unreadable");
    var objs = bundle ? [].concat(bundle.maps || [], (bundle.stills || []).map(function (o) { o._still = true; return o; })) : [];
    var voPath = ""; names.filter(function (x) { return /\.mp3$/i.test(x); }).forEach(function (x) { var p = path.join(sc, x); if (!voPath || fs.statSync(p).size > fs.statSync(voPath).size) voPath = p; });
    if (!voPath && config.render.audio) info.missing.push("no VO .mp3 in Script\\ (needed for the sections' audio)");
    var tot = 0, cnt = 0, noStill = [], noObj = [], useDefaults = config.render.missingObjects !== "skip";
    bd.sections.forEach(function (s, i) {
        if (s.type === "AI" || !OUT_FOLDER[s.type]) return; tot++;
        var name = "S" + String(s.num).padStart(3, "0") + "_" + s.type + (s.type === "HOOK" ? "" : s.ordinal);
        var still = ST.findFile(path.join(tf, ST.FOLDER[s.type]), s.assetStem, null);
        var obj = objs.filter(function (o) { return o && o.source_file && norm(o.source_file) === norm(s.assetStem); })[0] || null, defaulted = false;
        if (!obj && useDefaults) {                     // pre-r9 bundles (no HOOK map object, no stills): animate with the engine defaults
            defaulted = true;
            obj = (s.type === "HOOK" || s.type === "MAP") ? { _default: true, map_name: s.assetStem, source_file: s.assetStem + ".jpg", render: "pins", locations: [], time_base: "comp_local" }
                                                       : { _default: true, _still: true, still_type: "REF", source_file: s.assetStem + ".jpg", focus: { xNorm: 0.5, yNorm: 0.45 }, move: "auto", time_base: "comp_local" };
        }
        var out = path.join(tf, ST.PARTS, name + ".mp4");
        var have = (fs.existsSync(out) && fs.statSync(out).size > 50000) ? out : "", done = !!have; if (done) info.rendered++;
        if (!still) noStill.push(s.assetStem); if (!obj) noObj.push(s.assetStem); if (defaulted) info.defaulted = (info.defaulted || 0) + 1;
        info.specials.push({ num: s.num, type: s.type, ordinal: s.ordinal, name: name, t0: s.t0, t1: s.t1, still: still, obj: obj, out: out, have: have, done: done, defaulted: defaulted });
    });
    info.total = tot;
    if (noObj.length) info.missing.push("no bundle object for " + noObj.join(", ") + " (Settings → missing objects = defaults to animate them anyway)");
    info.needDownload = noStill;
    if (noStill.length) info.missing.push(noStill.length + " image(s) not on disk (" + noStill.slice(0, 4).join(", ") + (noStill.length > 4 ? "…" : "") + ") — downloaded automatically before rendering");
    info.voPath = voPath; info.bundlePath = bundlePath; info.bd = bd;
    info.images = { have: tot - noStill.length, need: tot, linksFile: !!(listFiles(sc).concat(listFiles(tf)).some(function (x) { return /_download_links\.txt$/i.test(x); })) };
    var autoName = names.filter(function (x) { return /_auto_video_structure\.txt$/i.test(x); })[0]; info.ai = { have: 0, need: 0 };
    try { var up = UP.plan(tf, config.upscaler.suffix || "_painted"), chOn = !(config.upscaler.channels && config.upscaler.channels[chanFolder(channel)] === false); info.upscale = { raw: up.todo.length, painted: up.painted, enabled: chOn }; } catch (eU) { info.upscale = { raw: 0, painted: 0, enabled: true }; }
    if (!autoName) info.missing.push("no " + info.subject + "_auto_video_structure.txt in Script\\ (the package is incomplete)");
    else { try { var auto = ST.parseAutoStructure(fs.readFileSync(path.join(sc, autoName), "utf8")), aiItems = auto.items.filter(function (x) { return x.kind === "AI"; }), haveAi = 0, missAi = [];
        aiItems.forEach(function (x) { var f = ST.assetsFor(tf, x, bd).image; if (f) haveAi++; else missAi.push(ST.aiStem(x.image)); });
        info.ai = { have: haveAi, need: aiItems.length, missing: missAi }; info.durationMs = auto.durationMs;
        if (missAi.length) info.missing.push("AI images: " + haveAi + "/" + aiItems.length + " in AI Images\\ (missing " + missAi.slice(0, 5).join(", ") + (missAi.length > 5 ? "…" : "") + ") — generate them from " + info.subject + "_ai_prompts.txt");
    } catch (e3) { info.missing.push("auto structure unreadable: " + e3.message); } }
    var sfxName = names.filter(function (x) { return /_sfx\.json$/i.test(x); })[0], sd = sfxDir(channel), sds = sfxDirs(channel);
    info.sfx = { cues: 0, have: 0, files: Object.keys(qix(sds).files).length, missing: [] };
    if (sfxName) { var sj = readJson(path.join(sc, sfxName), null); if (sj && sj.cues) { var ixq = qix(sds), seen = {};
        sj.cues.forEach(function (c) { var key = String(c.sound || "").toLowerCase(); if (seen[key]) return; seen[key] = 1; info.sfx.cues++; var w = SFX.words(c.sound); var hit = (c.file && ixq.files[c.file]) || SFX.localMatch(sd, ixq, w, 45) || SFX.localMatch(sd, ixq, w, 3); if (hit) info.sfx.have++; else info.sfx.missing.push(c.sound); }); } }
    if (info.sfx.missing.length) info.notes = (info.notes || []).concat(["ambience to fetch at run: " + info.sfx.missing.length + " sound(s) (" + info.sfx.missing.slice(0, 3).join(", ") + (info.sfx.missing.length > 3 ? "…" : "") + ") — the sfx button fetches them now"]);
    info.finalPath = path.join(tf, "Output", sanitize(path.basename(tf)) + ".mp4");
    var prName = names.filter(function (x) { return /_ai_prompts\.txt$/i.test(x); })[0]; info.promptsPath = prName ? path.join(sc, prName) : "";
    info.final = fs.existsSync(info.finalPath) && fs.statSync(info.finalPath).size > 500000;
    try { if (fs.existsSync(info.finalPath + ".part.mp4")) fs.unlinkSync(info.finalPath + ".part.mp4"); } catch (e6) {}
    if (info.final) { var fd = finalDurationCache(info.finalPath); if (fd != null && info.durationMs) { var expect = info.durationMs / 1000 + (info.ctaSeconds || 0); if (fd < expect - 2) { info.final = false; info.missing.push("the file in Output\\ is incomplete (" + fd.toFixed(1) + " s of " + expect.toFixed(1) + " s) — run again to finish it"); } } }
    info.ready = info.missing.every(function (m) { return /downloaded automatically/.test(m); });
    info.finished = info.final;
    if (!bd.sections.some(function (s) { return s.type !== "AI" && s.link; }) && !info.images.linksFile && noStill.length) { info.missing.push("no download links (neither _download_links.txt nor section links in the breakdown)"); info.ready = false; }
    // the AI parts (one per AI item, recipe-matched like renderParts does) — so the render stage counts every part, not only the specials
    info.aiParts = { have: 0, need: 0 };
    if (autoName && info.ai && info.ai.need) { try { var tR = ST.readTitle(tf); if (tR && tR.auto) { var workP = path.join(tf, ST.PARTS), cfgP = Object.assign({}, AS.DEF, config.render, { encoder: encoderFor() });
        tR.auto.items.forEach(function (it) { if (it.kind !== "AI") return; info.aiParts.need++; var a = ST.assetsFor(tf, it, tR.bd); if (!a.image) return; it._asset = a; var outP = AS.segName(workP, it), oldP = ""; try { oldP = fs.readFileSync(outP + ".json", "utf8"); } catch (e) {} if (fs.existsSync(outP) && oldP === AS.recipe(it, cfgP)) info.aiParts.have++; }); } } catch (eP) {} }
    buildPlan(info, channel);
    return info;
}
/* THE CHECKLIST — what RUN will do for this title, stage by stage (the UI shows it on every row and in the detail):
     upscale (painted channels only) → images (section stills) → ambience → render (every part) → final (the whole video)
   state: done · todo (will run) · running · skip (not for this channel / nothing to do) · blocked (RUN refuses until fixed) */
function paintedChannel(channel) { var m = config.upscaler && config.upscaler.channels; return !(m && m[chanFolder(channel)] === false); }
function genChannel(channel) { var c = config.imagegen || {}; return c.enabled !== false && !(c.channels && c.channels[chanFolder(channel)] === false); }
function genState(tf) { return readJson(path.join(tf, "Script", "_imagegen.json"), { images: {} }); }
function saveGenState(tf, st) { try { fs.writeFileSync(path.join(tf, "Script", "_imagegen.json"), JSON.stringify(st, null, 1)); } catch (e) {} }
function buildPlan(info, channel) {
    var plan = [], chOn = paintedChannel(channel), up = info.upscale || { raw: 0, painted: 0 }, urlOk = /^https?:\/\//.test(String((config.upscaler || {}).url || ""));
    var aiNeed = info.ai ? info.ai.need : 0, aiMiss = (info.ai && info.ai.missing) ? info.ai.missing.length : 0, genOn = genChannel(channel), hasKey = !!secretsJson().geminiKey, genCan = false;
    var gst = aiMiss ? genState(info.titleFolder) : { images: {} }, blockedStems = aiMiss ? info.ai.missing.filter(function (st) { return gst.images[st] && gst.images[st].blocked; }) : [], tfb = aiMiss ? tfBatchInfo(info.titleFolder) : null;
    if (!aiNeed) plan.push({ key: "generate", label: "generate", state: "skip", detail: "no AI sections" });
    else if (!aiMiss) plan.push({ key: "generate", label: "generate", state: "done", detail: aiNeed + " AI image(s) in AI Images\\", have: aiNeed, need: aiNeed });
    else if (genOn && hasKey && blockedStems.length === aiMiss) plan.push({ key: "generate", label: "generate", state: "blocked", detail: blockedStems.length + " prompt(s) blocked by Gemini's safety filter (" + blockedStems.slice(0, 4).join(", ") + (blockedStems.length > 4 ? "…" : "") + ") — edit them in the prompts panel", have: aiNeed - aiMiss, need: aiNeed });
    else if (genOn && hasKey) { genCan = true; plan.push({ key: "generate", label: "generate", state: "todo", detail: (aiMiss - blockedStems.length) + " image(s) to generate with " + (config.imagegen.model || IG.KNOWN_MODELS[0].id) + (blockedStems.length ? " (" + blockedStems.length + " blocked prompt(s) need editing)" : "") + (tfb && tfb.pending.length ? " · TurboFlow batch " + tfb.received + "/" + tfb.total + " received" : ""), have: aiNeed - aiMiss, need: aiNeed }); }
    else plan.push({ key: "generate", label: "generate", state: "blocked", detail: aiMiss + " AI image(s) missing — " + (tfb && tfb.pending.length ? "TurboFlow batch " + tfb.received + "/" + tfb.total + " received; " : "") + (genOn ? "add \"geminiKey\" to _SECRETS\\secrets.json for automatic generation, or " : "") + "generate them with the prompts panel (copy for TurboFlow → files land in AI Images\\ by themselves)", have: aiNeed - aiMiss, need: aiNeed });
    var aiBlocksRender = aiMiss && !genCan;
    if (!chOn) plan.push({ key: "upscale", label: "upscale", state: "skip", detail: "AI images are not painted on " + channel + " (Settings → upscaler → channels)" });
    else if (!aiNeed) plan.push({ key: "upscale", label: "upscale", state: "skip", detail: "no AI sections" });
    else if (!up.raw && up.painted) plan.push({ key: "upscale", label: "upscale", state: "done", detail: up.painted + " painted" + (aiMiss ? " · " + aiMiss + " image(s) still missing" : ""), have: up.painted, need: up.painted });
    else if (!up.raw) plan.push({ key: "upscale", label: "upscale", state: "todo", detail: "no AI images in AI Images\\ yet", have: 0, need: aiNeed });
    else if (!urlOk) plan.push({ key: "upscale", label: "upscale", state: "blocked", detail: up.raw + " raw image(s) and no upscaler URL — set it in Settings → upscaler, or untick " + channel + " there", have: up.painted, need: up.painted + up.raw });
    else plan.push({ key: "upscale", label: "upscale", state: "todo", detail: up.raw + " raw image(s) → painted (" + up.painted + " already painted)", have: up.painted, need: up.painted + up.raw });
    var im = info.images || { have: 0, need: 0 }, noLinks = (info.missing || []).some(function (m) { return /^no download links/.test(m); });
    if (!im.need) plan.push({ key: "images", label: "images", state: "skip", detail: "no HOOK / MAP / REF / CHAR sections" });
    else if (im.have >= im.need) plan.push({ key: "images", label: "images", state: "done", detail: im.need + " section still(s) on disk", have: im.have, need: im.need });
    else if (noLinks) plan.push({ key: "images", label: "images", state: "blocked", detail: (im.need - im.have) + " still(s) missing and no links to fetch them", have: im.have, need: im.need });
    else plan.push({ key: "images", label: "images", state: "todo", detail: (im.need - im.have) + " still(s) to fetch from Wikimedia", have: im.have, need: im.need });
    var sf = info.sfx || { cues: 0, have: 0, missing: [] };
    if (!sf.cues) plan.push({ key: "ambience", label: "ambience", state: "skip", detail: "no ambience cues in the package (silent bed)" });
    else if (!sf.missing.length) plan.push({ key: "ambience", label: "ambience", state: "done", detail: sf.cues + " sound(s) cached", have: sf.have, need: sf.cues });
    else plan.push({ key: "ambience", label: "ambience", state: "todo", detail: sf.missing.length + " sound(s) to fetch" + (secretsJson().freesoundKey ? "" : " (no Freesound key — cached + bundled sounds only)"), have: sf.have, need: sf.cues });
    var partsHave = (info.rendered || 0) + ((info.aiParts || {}).have || 0), partsNeed = (info.total || 0) + ((info.aiParts || {}).need || 0);
    var hard = (info.missing || []).filter(function (m) { return !/downloaded automatically/.test(m) && !/^AI images:/.test(m) && !/^no download links/.test(m); });
    if (hard.length) plan.push({ key: "render", label: "render", state: "blocked", detail: hard[0], have: partsHave, need: partsNeed });
    else if (aiBlocksRender) plan.push({ key: "render", label: "render", state: "pending", detail: "after the AI images", have: partsHave, need: partsNeed });
    else if (partsNeed && partsHave >= partsNeed) plan.push({ key: "render", label: "render", state: "done", detail: partsNeed + " part(s) rendered", have: partsHave, need: partsNeed });
    else plan.push({ key: "render", label: "render", state: "todo", detail: (partsNeed - partsHave) + " of " + partsNeed + " part(s) to render" + (chOn && up.raw ? " (after the upscale: painted images re-render their parts)" : ""), have: partsHave, need: partsNeed });
    if (hard.length || aiBlocksRender) plan.push({ key: "final", label: "final", state: "pending", detail: "after the render" });
    else if (info.final) plan.push({ key: "final", label: "final", state: "done", detail: "Output\\" + path.basename(info.finalPath || "") });
    else plan.push({ key: "final", label: "final", state: "todo", detail: "assemble the whole video (fades, CTAs, letterbox, voice + ambience)" });
    info.plan = plan; info.blockers = plan.filter(function (x) { return x.state === "blocked"; }).map(function (x) { return x.label + ": " + x.detail; });
    info.willRun = plan.filter(function (x) { return x.state === "todo"; }).map(function (x) { return x.key; });
    // READY = RUN can start: nothing blocked, and no missing piece other than what RUN fetches / generates itself
    var hardOther = (info.missing || []).filter(function (m) { return !/downloaded automatically/.test(m) && !/^AI images:/.test(m) && !/^no download links/.test(m); });
    info.ready = !info.blockers.length && !hardOther.length && !!info.subject;
}
function outBaseFor(tf, channel, titleName) { var eo = effectiveOutput(); if (!eo.root) return tf; return path.join(eo.root, channel, eo.titlesSub || "", path.basename(tf)); }
var NAMINGS = ["name", "typenum", "num"];
function fileNameFor(s, naming) { return naming === "typenum" ? (s.type + " " + (s.type === "HOOK" ? 1 : s.ordinal)) : (naming === "num" ? String(s.type === "HOOK" ? 1 : s.ordinal) : ("S" + String(s.num).padStart(3, "0") + "_" + s.type + (s.type === "HOOK" ? "" : s.ordinal))); }
/* a section counts as rendered when ANY naming of it exists in its output folder (or in _section_renders\), with a real size */
function existingRender(outBase, s) {
    var dirs = [path.join(outBase, OUT_FOLDER[s.type]), path.join(outBase, "_section_renders"), path.join(outBase, "_section_renders", OUT_FOLDER[s.type])];
    for (var d = 0; d < dirs.length; d++) for (var n = 0; n < NAMINGS.length; n++) {
        var f = path.join(dirs[d], sanitize(fileNameFor(s, NAMINGS[n])) + ".mp4");
        try { if (fs.existsSync(f) && fs.statSync(f).size > 50000) return f; } catch (e) {}
    }
    return "";
}
function underBase(tf) { try { var a = path.resolve(tf), r = path.resolve(config.base); if (process.platform === "win32") { a = a.toLowerCase(); r = r.toLowerCase(); } return a.indexOf(r + path.sep) === 0 && fs.statSync(path.resolve(tf)).isDirectory(); } catch (e) { return false; } }
function titlesDir(ch) { var cd = path.join(config.base, ch), td = path.join(cd, TITLES); return fs.existsSync(td) ? td : cd; }
var TITLES_CACHE = { at: 0, list: null, ttl: 4000 }, SLOW_SCAN_AT = 0;
function invalidateTitles() { TITLES_CACHE.at = 0; TITLES_CACHE.list = null; }
function allTitles() {
    if (TITLES_CACHE.list && Date.now() - TITLES_CACHE.at < TITLES_CACHE.ttl) return TITLES_CACHE.list;
    var t0 = Date.now(), out = allTitlesScan(), ms = Date.now() - t0; TITLES_CACHE.list = out; TITLES_CACHE.at = Date.now(); TITLES_CACHE.ms = ms;
    if (ms > 1500 && Date.now() - SLOW_SCAN_AT > 600000) { SLOW_SCAN_AT = Date.now(); glog("the title scan took " + (ms / 1000).toFixed(1) + " s for " + out.length + " title(s)" + (/My Drive|Google Drive|OneDrive|Dropbox/i.test(config.base) ? " — the base is on a synced drive; mark the CHANNELS folder 'Available offline' so metadata does not come from the cloud" : "")); }
    return out;
}
var QIX = {};
function qix(dirs) { var k = dirs.join("|"); if (!QIX[k]) QIX[k] = SFX.quickIndexes(dirs); return QIX[k]; }
function allTitlesScan() {
    QIX = {}; var out = [];
    listFiles(config.base).forEach(function (ch) {
        if (/^_/.test(ch)) return; var cd = path.join(config.base, ch); try { if (!fs.statSync(cd).isDirectory()) return; } catch (e) { return; }
        var td = titlesDir(ch);
        listFiles(td).forEach(function (t) { var m = /^(\d+)\.\s+(.+)$/.exec(t); if (!m) return; try { out.push(inspect(path.join(td, t), ch, +m[1], m[2])); } catch (e) {} });
    });
    return out.sort(function (a, b) { return (b.ready - a.ready) || a.channel.localeCompare(b.channel) || a.n - b.n; });
}
function channelOf(tf) { var p = path.dirname(tf); if (path.basename(p) === TITLES) p = path.dirname(p); return path.basename(p); }
function musicDir(ch) { return path.join(config.base, chanFolder(ch), MUSIC_DIR); }
function sfxShared() { return path.join(config.base, "_SFX"); }                                                       // ONE library for every channel (downloads land here)
function sfxDir(ch) { return sfxShared(); }
function sfxDirs(ch) { var own = path.join(config.base, chanFolder(ch), SFX_DIR); return (fs.existsSync(own) && listFiles(own).some(function (f) { return /\.(mp3|wav|ogg|oga|flac|m4a|aac|opus)$/i.test(f); })) ? [own, sfxShared()] : [sfxShared()]; }   // a channel's own SFX\ (if it has files) overrides the shared one
function secretsJson() { try { return JSON.parse(String(fs.readFileSync(path.join(config.base, "_SECRETS", "secrets.json"), "utf8")).replace(/^\uFEFF/, "")) || {}; } catch (e) { return {}; } }
function grabOpts(extra) { return Object.assign({ baseDir: config.base, secrets: secretsJson(), channelDir: function (marker) { var d = path.join(config.base, chanFolder(marker), TITLES); try { fs.mkdirSync(d, { recursive: true }); } catch (e) {} return d; } }, extra || {}); }
/* channel names: the Trello marker / suffix-file name has spaces ("BILGE RATS"); the folder on disk has none ("BILGERATS") */
function chanFolder(marker) { return String(marker || "").replace(/\s+/g, ""); }
function suffixFilePath() { return path.join(config.base, "_RUVI PROJECT FILES", "Channel_Prompt_Suffixes.txt"); }
function suffixMarkers() { var out = []; try { String(fs.readFileSync(suffixFilePath(), "utf8")).split(/\r?\n/).forEach(function (l) { var m = /^CHANNELS:\s*(.+)$/.exec(l); if (m) (m[1].match(/\[([^\]]+)\]/g) || []).forEach(function (x) { out.push(x.slice(1, -1).trim()); }); }); } catch (e) {} return out; }
/* the channel's bed target from its block in Channel_Prompt_Suffixes.txt (AMBIENCE_LUFS: -31), else the Settings value */
function channelAmbienceLufs(folder) {
    try { var want = chanFolder(folder).toLowerCase(), lines = String(fs.readFileSync(suffixFilePath(), "utf8")).split(/\r?\n/), inBlock = false;
        for (var i = 0; i < lines.length; i++) { var m = /^CHANNELS:\s*(.+)$/.exec(lines[i]); if (m) { inBlock = (m[1].match(/\[([^\]]+)\]/g) || []).some(function (x) { return chanFolder(x.slice(1, -1)).toLowerCase() === want; }); continue; }
            if (inBlock) { var k = /^AMBIENCE_LUFS:\s*(-?\d+(?:\.\d+)?)/.exec(lines[i]); if (k) return +k[1]; } }
    } catch (e) {} return null;
}
function chanMarker(folder) { var f = chanFolder(folder).toLowerCase(), hit = suffixMarkers().filter(function (m) { return chanFolder(m).toLowerCase() === f; })[0]; return hit || folder; }
/* ---- the base tree: everything a fresh root needs is created or healed (folders and files) ---- */
function healBase(log) {
    log = log || function () {}; var rep = { created: [], files: [], migrated: [], titlesHealed: 0, warnings: [] }, b = config.base;
    function mk(d, label) { if (!fs.existsSync(d)) { try { fs.mkdirSync(d, { recursive: true }); rep.created.push(label || d); } catch (e) { rep.warnings.push("cannot create " + d + ": " + e.message); } } }
    mk(b, "base"); mk(path.join(b, "_SECRETS"), "_SECRETS"); mk(path.join(b, "_RUVI PROJECT FILES"), "_RUVI PROJECT FILES"); mk(path.join(b, "_RUNTIME"), "_RUNTIME"); mk(path.join(b, "_SFX"), "_SFX");
    // migrate: sounds that channels fetched into their own SFX\ folders move into the shared _SFX\ (a file already there stays; the channel copy is removed)
    listFiles(b).forEach(function (ch) { if (/^_/.test(ch)) return; var own = path.join(b, ch, SFX_DIR); if (!fs.existsSync(own)) return; listFiles(own).forEach(function (f) { if (!/\.(mp3|wav|ogg|oga|flac|m4a|aac|opus)$/i.test(f)) return; var to = path.join(b, "_SFX", f); try { if (!fs.existsSync(to)) fs.renameSync(path.join(own, f), to); else fs.unlinkSync(path.join(own, f)); rep.migrated.push("_SFX\\" + f); } catch (e) {} }); try { var oi = path.join(own, "_index.json"); if (fs.existsSync(oi) && !listFiles(own).some(function (f) { return /\.(mp3|wav|ogg|oga|flac|m4a|aac|opus)$/i.test(f); })) fs.unlinkSync(oi); } catch (e2) {} });
    var sec = path.join(b, "_SECRETS", "secrets.json");
    if (!fs.existsSync(sec)) { try { fs.writeFileSync(sec, JSON.stringify({ trelloKey: "", trelloToken: "", boardId: "", _note: "fill in the Trello API key, token and board id — the grab needs them" }, null, 2)); rep.files.push("_SECRETS\\secrets.json (template — fill in the Trello key, token and board id)"); } catch (e) { rep.warnings.push("cannot write secrets.json: " + e.message); } }
    else { var sj = secretsJson(); if (!sj.trelloKey || !sj.trelloToken || !sj.boardId) rep.warnings.push("_SECRETS\\secrets.json has empty fields (trelloKey / trelloToken / boardId) — the Trello grab cannot run until they are filled"); }
    var sf = suffixFilePath(), bundled = path.join(HERE, "assets", "Channel_Prompt_Suffixes.txt");
    if (!fs.existsSync(sf) && fs.existsSync(bundled)) { try { fs.copyFileSync(bundled, sf); rep.files.push("_RUVI PROJECT FILES\\Channel_Prompt_Suffixes.txt (r16, from the app)"); } catch (e) { rep.warnings.push("cannot write the suffix file: " + e.message); } }
    else if (fs.existsSync(sf) && fs.existsSync(bundled)) { try { var have = (String(fs.readFileSync(sf, "utf8")).match(/PROMPT-SET REVISION\s+(\S+)/) || [])[1], want = (String(fs.readFileSync(bundled, "utf8")).match(/PROMPT-SET REVISION\s+(\S+)/) || [])[1]; if (have && want && have !== want) rep.warnings.push("Channel_Prompt_Suffixes.txt is " + have + " but this app ships " + want + " — replace it with the Project's current file"); } catch (e) {} }
    var markers = suffixMarkers(); if (!markers.length) markers = ["BILGE RATS", "SCURVY DOGS", "OLDWORLDPROOF"];
    markers.forEach(function (m) {
        var cd = path.join(b, chanFolder(m)); mk(cd, chanFolder(m)); mk(path.join(cd, TITLES), chanFolder(m) + "\\" + TITLES);  mk(path.join(cd, "CTA"), chanFolder(m) + "\\CTA"); mk(path.join(cd, "CTA"), chanFolder(m) + "\\CTA");
        listFiles(cd).forEach(function (t) { if (!/^\d+\.\s/.test(t)) return; var from = path.join(cd, t), to = path.join(cd, TITLES, t); try { if (fs.statSync(from).isDirectory() && !fs.existsSync(to)) { fs.renameSync(from, to); rep.migrated.push(chanFolder(m) + "\\" + t); } } catch (e) { rep.warnings.push("cannot move " + t + " into Titles: " + e.message); } });
    });
    listFiles(b).forEach(function (ch) { if (/^_/.test(ch)) return; var td = path.join(b, ch, TITLES); if (!fs.existsSync(td)) return; listFiles(td).forEach(function (t) { if (!/^\d+\.\s/.test(t)) return; var r = healTitleTree(path.join(td, t)); if (r.created.length) rep.titlesHealed++; }); });
    var msg = "base tree: " + (rep.created.length ? "+" + rep.created.length + " folder(s) (" + rep.created.slice(0, 6).join(", ") + (rep.created.length > 6 ? "…" : "") + ")" : "all folders present") + (rep.files.length ? " · files: " + rep.files.join(", ") : "") + (rep.migrated.length ? " · moved into Titles: " + rep.migrated.length : "") + (rep.titlesHealed ? " · " + rep.titlesHealed + " title tree(s) healed" : "");
    log(msg); rep.warnings.forEach(function (w) { log("warning: " + w); }); rep.message = msg; return rep;
}

/* ---- the render queue --------------------------------------------------- */
var jobs = [], running = false, health = {}, current = null, GLOG = [];
var LOGDIR = path.join(HERE, "runtime", "logs"); try { fs.mkdirSync(LOGDIR, { recursive: true }); } catch (e) {}
var LOGFILE = path.join(LOGDIR, "special-" + new Date().toISOString().slice(0, 10) + ".log");
var GLOG_SEQ = 0;
function glog(m) { var line = new Date().toISOString().slice(11, 19) + " " + m; GLOG.push(line); GLOG_SEQ++; if (GLOG.length > 3000) GLOG.shift(); try { fs.appendFileSync(LOGFILE, line + "\n"); } catch (e) {} }
function log(j, m) { j.log.push(new Date().toISOString().slice(11, 19) + " " + m); if (j.log.length > 400) j.log = j.log.slice(-400); j.detail = m; glog("[" + j.title.slice(0, 40) + "] " + m); }
function enqueueDownload(tf) {
    if (jobs.some(function (j) { return j.titleFolder === tf && (j.state === "queued" || j.state === "running"); })) return null;
    var j = { id: "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), titleFolder: tf, title: path.basename(tf) + " · images", state: "queued", detail: "", log: [], done: 0, total: 0, download: true, addedAt: new Date().toISOString() }; jobs.push(j); tick(); return j;
}
/* a generic queued task (ambience fetch, packet refresh, sound indexing): runs after whatever is running, shows in the bar like any job */
function enqueueTask(kind, title, tf, fn) {
    if (tf && jobs.some(function (j) { return j.titleFolder === tf && j.task === kind && (j.state === "queued" || j.state === "running"); })) return null;
    if (!tf && jobs.some(function (j) { return j.task === kind && (j.state === "queued" || j.state === "running"); })) return null;
    var j = { id: "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), titleFolder: tf || "", title: title, state: "queued", detail: "", log: [], done: 0, total: 0, task: kind, run: fn, addedAt: new Date().toISOString() }; jobs.push(j); tick(); return j;
}
function enqueueUpscale(tf) {
    if (jobs.some(function (j) { return j.titleFolder === tf && (j.state === "queued" || j.state === "running"); })) return null;
    var j = { id: "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), titleFolder: tf, title: path.basename(tf) + " · upscale", state: "queued", detail: "", log: [], done: 0, total: 0, upscale: true, addedAt: new Date().toISOString() }; jobs.push(j); tick(); return j;
}
/* a job's stage board (the Queue card draws it): setStage(j, key, state[, done, total]) */
function setStage(j, key, state, done, total) {
    if (!j.stages) j.stages = [];
    var st = j.stages.filter(function (x) { return x.key === key; })[0]; if (!st) { st = { key: key, state: "todo", done: 0, total: 0 }; j.stages.push(st); }
    st.state = state; if (done != null) st.done = done; if (total != null) st.total = total;
    if (state === "running") { j.stage = key; if (!st.startedAt) st.startedAt = Date.now(); }
    if (state === "done" || state === "failed") st.endedAt = Date.now();
    var run = j.stages.filter(function (x) { return x.state === "running"; });
    j.progress = run.map(function (x) { return x.key + (x.total ? " " + x.done + "/" + x.total : ""); }).join(" · ");
}
function enqueue(tf, force) { if (jobs.some(function (j) { return j.titleFolder === tf && (j.state === "queued" || j.state === "running"); })) return null; var j = { id: "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), titleFolder: tf, title: path.basename(tf), state: "queued", detail: "", log: [], done: 0, total: 0, force: !!force, addedAt: new Date().toISOString() }; jobs.push(j); tick(); return j; }
function tick() {
    if (running) return; var j = jobs.filter(function (x) { return x.state === "queued"; })[0]; if (!j) return;
    running = true; j.state = "running"; j.startedAt = Date.now();
    if (j.task) { current = j; j.abort = { aborted: false, soft: false };
        Promise.resolve().then(function () { return j.run(j); })
            .then(function (r) { j.state = j.abort.aborted ? "killed" : "done"; log(j, (j.abort.aborted ? "KILLED" : "DONE") + (r && r.summary ? " — " + r.summary : "")); })
            .catch(function (e) { j.state = "failed"; j.error = String(e && e.message || e); log(j, "FAILED — " + j.error); })
            .then(function () { running = false; current = null; invalidateTitles(); setTimeout(tick, 200); }); return; }
    if (j.upscale) { current = j; j.abort = { aborted: false, soft: false };
        UP.runTitle(j.titleFolder, Object.assign({}, config.upscaler, { abort: j.abort, workflow: config.upscaler.workflow || null }), function (m) { log(j, m); }, function (d, t, x) { j.done = d; j.total = t; j.detail = x ? ("last: " + x) : ""; })
            .then(function (r) { if (r.cancelled) { j.state = "killed"; log(j, "KILLED — " + r.done + " painted"); } else { j.state = r.failed ? "failed" : "done"; j.error = r.failed ? (r.failed + " image(s) failed — press upscale again to retry them") : ""; log(j, (r.failed ? "FAILED — " : "DONE — ") + r.done + " painted" + (r.failed ? ", " + r.failed + " failed (left as originals; upscale again to retry)" : "") + (r.seconds ? " in " + Math.round(r.seconds) + " s" : "")); } })
            .catch(function (e) { j.state = "failed"; j.error = String(e && e.message || e); log(j, "FAILED — " + j.error); })
            .then(function () { running = false; current = null; invalidateTitles(); setTimeout(tick, 200); }); return; }
    if (j.grab) { current = j; j.abort = { aborted: false, soft: false }; runGrab(j).catch(function (e) { j.state = "failed"; j.error = String(e && e.message || e); log(j, "FAILED — " + j.error); }).then(function () { running = false; current = null; setTimeout(tick, 200); }); return; }
    var parts = j.titleFolder.split(/[\\/]/), channel = channelOf(j.titleFolder), tname = (parts[parts.length - 1] || "").replace(/^\d+\.\s+/, "");
    var info = inspect(j.titleFolder, channel, 0, tname);
    current = j; j.abort = { aborted: false, soft: false };
    if (j.download) {
        Promise.resolve().then(function () { if (!info.subject) throw new Error(info.missing.join("; ")); return verifyStills(info); })
            .then(function (bad) { if (bad.length) log(j, "removed undecodable: " + bad.join(", ")); return downloadStills(j.titleFolder, info, function (m) { log(j, m); }, j); })
            .then(function () { info = inspect(j.titleFolder, channel, 0, tname); j.state = info.needDownload.length ? "failed" : "done"; j.error = info.needDownload.length ? ("still missing: " + info.needDownload.join(", ")) : ""; log(j, j.state === "done" ? ("DONE — " + info.images.have + "/" + info.images.need + " images on disk") : ("FAILED — " + j.error)); })
            .catch(function (e) { j.state = "failed"; j.error = String(e && e.message || e); log(j, "FAILED — " + j.error); })
            .then(function () { running = false; invalidateTitles(); setTimeout(tick, 200); });
        return;
    }
    Promise.resolve().then(function () {
        if (!info.subject && info.packageZip) { var up = unpackPackage(j.titleFolder); log(j, "package unpacked: " + up.files + " file(s)"); info = inspect(j.titleFolder, channel, 0, tname); }
        // fail FAST, before any minute is spent: the package, the AI images, the tools
        var hard = info.missing.filter(function (m) { return !/downloaded automatically/.test(m) && !/^AI images:/.test(m) && !/^no download links/.test(m); }); if (hard.length) throw new Error(hard.join("; "));
        if (!health.ffmpeg) throw new Error("ffmpeg is not installed yet — the app is fetching it (see the banner); press RUN again when the chip is green");
        if ((config.render.engine || "native") === "chrome" && !CAP.findChrome(config.render)) throw new Error("no Chrome/Edge found yet — the app is fetching Chrome for Testing; press RUN again when the chip is green");
        if ((config.render.engine || "native") !== "chrome") { try { require("@napi-rs/canvas"); } catch (e) { throw new Error("the native renderer package (@napi-rs/canvas) is not installed yet — the app runs npm install at startup; press RUN again when the renderer chip is green"); } }
        try { fs.mkdirSync(path.join(HERE, "runtime", "tmp"), { recursive: true }); } catch (e) {}
        var blocked = (info.plan || []).filter(function (x) { return x.state === "blocked"; }); if (blocked.length) throw new Error(blocked.map(function (x) { return x.label + ": " + x.detail; }).join("; "));
        (info.plan || []).forEach(function (x) { setStage(j, x.key, x.state === "todo" ? "todo" : x.state, x.have || 0, x.need || 0); });
        log(j, "plan: " + (info.plan || []).map(function (x) { return x.label + " " + (x.state === "todo" ? "→ run" : x.state); }).join(" · "));
        // STAGE generate → upscale runs beside STAGE images → ambience: Gemini / RunPod and Wikimedia / Freesound are different resources
        return bothOrStop(j, generateStage(j, channel).then(function () { return upscaleStage(j, channel); }), stillsStage().then(function () { return ambienceStage(); }));
        function stillsStage() {
            if (!info.total) { setStage(j, "images", "skip"); return Promise.resolve(); }
            setStage(j, "images", "running", info.images.have, info.images.need);
            return verifyStills(info).then(function (bad) {
                if (bad.length) log(j, bad.length + " image(s) on disk could not be decoded and were removed for re-download: " + bad.join(", "));
                var need = info.specials.filter(function (s) { return !s.still; }).map(function (s) { return s.name; });
                if (!need.length) { log(j, "images: all " + info.total + " on disk"); setStage(j, "images", "done", info.total, info.total); return; }
                log(j, "images: downloading " + need.length + " still(s) with RUVI Studio's Navigate engine (persistent rounds)");
                function dl() { return downloadStills(j.titleFolder, info, function (m) { log(j, m); var mm = /(\d+)\s*\/\s*(\d+)/.exec(m); if (mm) setStage(j, "images", "running", +mm[1], +mm[2]); }, j); }
                var waited = false;
                function attempt() {
                    return dl().catch(function (e) {
                        if (/rate-limit wall/.test(String(e && e.message)) && !waited && !j.abort.aborted && !j.abort.soft) {
                            waited = true; log(j, "images: Wikimedia's rate-limit wall — waiting 10 minutes, then resuming automatically (the upscale keeps running)"); j.detail = "images: waiting out the rate-limit wall (10 min)";
                            return new Promise(function (res, rej) { var left = 600; (function tickW() { if (j.abort.aborted) return rej(new Error("killed")); if (left <= 0) return res(); left -= 5; setTimeout(tickW, 5000); })(); }).then(function () { info = inspect(j.titleFolder, channel, 0, tname); return dl(); });
                        }
                        throw e;
                    });
                }
                return attempt().then(function () { info = inspect(j.titleFolder, channel, 0, tname); if (info.needDownload.length) throw new Error("still missing after download: " + info.needDownload.join(", ")); setStage(j, "images", "done", info.images.have, info.images.need); });
            });
        }
        function ambienceStage() {
            var tA = ST.readTitle(j.titleFolder); if (!tA || !tA.sfx) { setStage(j, "ambience", "skip"); return fetchAmbience(j); }
            setStage(j, "ambience", "running"); return fetchAmbience(j).then(function () { setStage(j, "ambience", "done"); });
        }
    }).then(function () {
        var todo = info.specials.filter(function (s) { return j.force || !s.done; });
        info = inspect(j.titleFolder, channel, 0, tname); todo = info.specials.filter(function (s) { return j.force || !s.done; });   // painted images changed recipes; stills arrived
        setStage(j, "render", "running", 0, 0);
        return renderParts().then(function () { setStage(j, "render", "done", j.total, j.total); });
        function renderParts() {
        // the AI sections: every AI item of the auto structure becomes a part too (native sub-pixel pan), reused by the assembler when its recipe matches
        var tRead = ST.readTitle(j.titleFolder), aiTodo = [], aiAll = [];
        if (tRead && tRead.auto) {
            var work = path.join(j.titleFolder, ST.PARTS), cfgR = Object.assign({}, AS.DEF, config.render, { encoder: encoderFor() });
            tRead.auto.items.forEach(function (it) { if (it.kind !== "AI") return; var a = ST.assetsFor(j.titleFolder, it, tRead.bd); if (!a.image) return; it._asset = a; var out = AS.segName(work, it), sig = AS.recipe(it, cfgR), old = ""; try { old = fs.readFileSync(out + ".json", "utf8"); } catch (e) {}
                var part = { ai: true, name: "AI " + ST.aiStem(it.image) + " (pan " + it.pan + ")", item: it, out: out, sig: sig, done: fs.existsSync(out) && old === sig && !j.force }; aiAll.push(part); if (!part.done) aiTodo.push(part); });
        }
        j.total = info.specials.length + aiAll.length; j.done = (info.specials.length - todo.length) + (aiAll.length - aiTodo.length); setStage(j, "render", "running", j.done, j.total); j._renderStage = true;
        todo = todo.concat(aiTodo);
        if (!todo.length) { log(j, "all " + info.specials.length + " special section(s) already rendered in " + info.outBase); return; }
        return lowResStills(info).then(function (low) {
            if (!low.length) return;
            log(j, low.length + " image(s) on disk are scaled renditions (" + low.map(function (x) { return x.name + " " + x.have + "px of " + x.want; }).join(", ") + ") — fetching the originals for a sharp close-up");
            low.forEach(function (x) { try { fs.unlinkSync(x.still); } catch (e) {} });
            return downloadStills(j.titleFolder, info, function (m) { log(j, m); }, j).then(function () { info = inspect(j.titleFolder, channel, 0, tname); todo = info.specials.filter(function (s) { return j.force || !s.done; }); });
        }).then(function () {
        var nWorkers = config.render.workers | 0; if (!nWorkers) { var encW = encoderFor(), ramGb = os.totalmem() / 1073741824; nWorkers = Math.max(1, Math.min(encW === "nvenc" ? 6 : (encW === "x264" ? 3 : 4), Math.floor(os.cpus().length / 2), Math.max(1, Math.floor(ramGb / 2.5)))); }   // NVENC takes the encode off the CPU → up to 6 parallel sections
        if ((config.render.engine || "native") !== "chrome") log(j, "engine: native (Skia + ffmpeg perspective" + (encoderFor() === "nvenc" ? " + NVENC" : "") + ") — no browser");
        nWorkers = Math.min(nWorkers, todo.length); if (nWorkers > 1) log(j, "rendering " + todo.length + " section(s) with " + nWorkers + " parallel workers");
        var queue = todo.slice(), firstErr = null;
        function worker() {
            var s = queue.shift(); if (!s) return Promise.resolve();
            if (j.abort.aborted) { firstErr = firstErr || new Error("killed"); return Promise.resolve(); }
            if (j.abort.soft) { j.stopped = true; firstErr = firstErr || new Error("stopped after " + j.done + "/" + j.total + " section(s) — press run to continue"); return Promise.resolve(); }
            fs.mkdirSync(path.dirname(s.out), { recursive: true });
            if (s.ai) {   // an AI section part
                var it = s.item, durA = (it.t1 - it.t0) / 1000;
                return (config.render.threads === false ? CAP.renderAny : CAP.renderSectionThreaded)({ kind: "ai", engine: "native", tmpDir: path.join(HERE, "runtime", "tmp"), imagePath: it._asset.image, pan: it.pan, zoomIn: (it.auto % 2 === 0), durationSec: durA, fps: config.render.fps, zoom: config.render.zoom, zoomDrift: config.render.zoomDrift, fadeSec: config.render.fadeSec,
                        out: s.out + ".part.mp4", preset: config.render.preset, crf: config.render.crf, encoder: encoderFor(), nvencCq: config.render.nvencCq, nvencPreset: config.render.nvencPreset, abort: j.abort,
                        onStep: function (m) { if (/^frame /.test(m)) { j.detail = s.name + ": " + m; } else log(j, s.name + ": " + m); } })
                    .then(function (r) { fs.renameSync(s.out + ".part.mp4", s.out); fs.writeFileSync(s.out + ".json", s.sig); j.done++; setStage(j, "render", "running", j.done, j.total); log(j, s.name + " ✓ " + r.frames + " frames in " + r.seconds.toFixed(0) + "s (" + (r.frames / r.seconds).toFixed(1) + " fps)"); })
                    .catch(function (e) { firstErr = firstErr || e; try { fs.unlinkSync(s.out + ".part.mp4"); } catch (e2) {} })
                    .then(worker);
            }
            var dur = (s.t1 - s.t0) / 1000; log(j, "render " + s.name + " (" + (s.obj._still ? "still" : "map") + ", " + dur.toFixed(1) + "s)");
            return FF.probe(s.still).then(function (pi) {
                var alpha = /a$|rgba|bgra|argb|abgr|pal8/i.test(String(pi.pixFmt || "")) || /\.png$/i.test(s.still);
                if (s.obj._default && !s.obj._still) { s.obj.map_width = pi.width; s.obj.map_height = pi.height; }
                if (s.obj._default) log(j, s.name + ": no bundle object — default animation (" + (s.obj._still ? "pull-out on the centre" : "whole sheet, living camera") + ")");
                return (config.render.threads === false ? CAP.renderAny : CAP.renderSectionThreaded)({ engine: config.render.engine || "native", tmpDir: path.join(HERE, "runtime", "tmp"), tableLean: config.render.tableLean, perspective: config.render.perspective, hlStyle: config.render.hlStyle, macro: MACRO[config.render.macro] || MACRO.normal, kind: s.obj._still ? "still" : "map", data: s.obj, durationSec: dur, fps: config.render.fps, width: config.render.width, height: config.render.height, imagePath: s.still, imageWidth: pi.width, imageHeight: pi.height, hasAlpha: alpha, capture: config.render.capture || "screencast",
                    bgPath: path.join(HERE, "lib", "render", "Background.png"), out: s.out + ".part.mp4", preset: config.render.preset, crf: config.render.crf, frameFormat: config.render.frameFormat || "jpeg", jpegQuality: config.render.jpegQuality, edgeBlur: config.render.edgeBlur !== false && config.render.macro !== "off", chromeCfg: config.render,
                    fadeSec: config.render.fadeSec, audio: (config.render.audio && info.voPath) ? { path: info.voPath, startSec: s.t0 / 1000 } : null, abort: j.abort,
                    encoder: encoderFor(), nvencCq: config.render.nvencCq, nvencPreset: config.render.nvencPreset,
                    onStep: function (m) { if (/^frame /.test(m)) { j.detail = s.name + ": " + m; } else log(j, s.name + ": " + m); } });
            }).then(function (r) { fs.renameSync(s.out + ".part.mp4", s.out); j.done++; setStage(j, "render", "running", j.done, j.total); log(j, s.name + " ✓ " + r.frames + " frames in " + r.seconds.toFixed(0) + "s (" + (r.frames / r.seconds).toFixed(1) + " fps, " + (r.capture || "") + ", " + r.encoder + (r.gpu ? ", GPU " + r.gpu.replace(/^ANGLE \(/, "").replace(/\)$/, "").slice(0, 60) : "") + ") → " + s.out); writeLedger(info, s); })
              .catch(function (e) { firstErr = firstErr || e; try { fs.unlinkSync(s.out + ".part.mp4"); } catch (e2) {} })
              .then(worker);
        }
        var pool = []; for (var wI = 0; wI < nWorkers; wI++) pool.push(worker());
        return Promise.all(pool).then(function () { if (firstErr) throw firstErr; });
        });
        }
    }).then(function () { setStage(j, "final", "running"); return assembleTitle(j, info); })
      .then(function (r) { setStage(j, "final", "done");
          try { var sc2 = path.join(j.titleFolder, "Script"), dn = listFiles(sc2).filter(function (x) { return /_description\.txt$/i.test(x); })[0]; if (dn) { fs.copyFileSync(path.join(sc2, dn), r.out.replace(/\.mp4$/i, ".txt")); log(j, "description → " + path.basename(r.out.replace(/\.mp4$/i, ".txt")) + " (paste into YouTube; a PINNED COMMENT line, if any, goes in as the first comment)"); } } catch (e) {}
          if (config.render.keepParts === false) { try { fs.rmSync(path.join(j.titleFolder, ST.PARTS), { recursive: true, force: true }); log(j, "parts folder removed (render.keepParts = false)"); } catch (e5) {} }
          j.state = "done"; log(j, "DONE — the whole video: " + r.out + " (" + r.duration.toFixed(1) + " s)"); })
      .catch(function (e) { var m = String(e && e.message || e); if (j.siblingStop) j.stopped = false; j.state = j.abort.aborted ? "killed" : (j.stopped ? "stopped" : "failed"); j.error = m; (j.stages || []).forEach(function (x) { if (x.state === "running") x.state = j.abort.aborted || j.stopped ? "stopped" : "failed"; }); j.progress = ""; log(j, (j.abort.aborted ? "KILLED" : (j.stopped ? "STOPPED" : "FAILED")) + " — " + m); try { info.specials.forEach(function (s) { if (fs.existsSync(s.out + ".part.mp4")) fs.unlinkSync(s.out + ".part.mp4"); }); } catch (e2) {} })
      .then(function () { running = false; current = null; invalidateTitles(); pruneJobs(); setTimeout(tick, 200); });
}
/* the list of jobs never grows past 60 finished ones (the UI's clear removes them earlier) */
function pruneJobs() { var fin = jobs.filter(function (x) { return x.state !== "running" && x.state !== "queued"; }); if (fin.length > 60) { var drop = fin.slice(0, fin.length - 60); jobs = jobs.filter(function (x) { return drop.indexOf(x) < 0; }); } }
/* the channel's CTA clips: <base>\<CHANNEL>\CTA\*.mp4|mov|mkv in name order (CTA 1 …, CTA 2 …) with their durations */
var CTA_SECONDS = {};
function ctaClipsFor(ch) {
    if (config.cta && config.cta.enabled === false) return Promise.resolve([]);
    var d = path.join(config.base, chanFolder(ch), "CTA"), files = listFiles(d).filter(function (x) { return /\.(mp4|mov|mkv|m4v)$/i.test(x); }).sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true }); });
    var pos = (config.cta && config.cta.byChannel && config.cta.byChannel[chanFolder(ch)]) || (config.cta && config.cta.positions) || [0.2, 0.5], chain = Promise.resolve(), out = [];
    files.forEach(function (f, i) { chain = chain.then(function () { return FF.probe(path.join(d, f)).then(function (p) { out.push({ file: path.join(d, f), durationSec: p.duration, position: pos[i] != null ? pos[i] : null }); }).catch(function () {}); }); });
    return chain.then(function () { return out.filter(function (c) { return c.position != null && c.durationSec > 0; }); });
}
/* what the packet tells the writing room about the inserts: positions, clips, seconds (the remix must cover narration + these) */
function ctaMeta(ch) { return ctaClipsFor(ch).then(function (clips) { CTA_SECONDS[chanFolder(ch)] = clips.reduce(function (s, c) { return s + (c.durationSec || 0); }, 0); return { channel: chanMarker(ch), folder: path.join(config.base, chanFolder(ch), "CTA"), positions: (config.cta && config.cta.byChannel && config.cta.byChannel[chanFolder(ch)]) || (config.cta && config.cta.positions) || [0.2, 0.5], clips: clips.map(function (c, i) { return { index: i + 1, file: path.basename(c.file), seconds: +c.durationSec.toFixed(2), position: c.position }; }), totalSeconds: +clips.reduce(function (s, c) { return s + c.durationSec; }, 0).toFixed(2), rule: "CTA n is inserted at the section start nearest position n of the narration; the narration pauses, the music runs through; final length = narration + totalSeconds" }; }); }
/* the AI images of a title, one row per AI IMAGE n: present on disk or missing, with the section and the prompt — for the UI's prompts panel (copy for TurboFlow-style bulk tools) */
function aiPrompts(titleFolder) {
    var t = ST.readTitle(titleFolder); if (t.error) return { ok: false, error: t.error };
    if (!t.auto) return { ok: false, error: (t.errors || []).join("; ") || "no auto structure" };
    var items = t.auto.items.filter(function (x) { return x.kind === "AI"; }).map(function (x) {
        var f = ST.assetsFor(titleFolder, x, t.bd).image;
        return { image: x.image, stem: ST.aiStem(x.image), section: x.section, auto: x.auto, present: !!f, file: f ? path.basename(f) : "", prompt: x.prompt || "", t0: x.t0, t1: x.t1, pan: x.pan || "" };
    });
    var missing = items.filter(function (x) { return !x.present; }).map(function (x) { return x.stem; }), gst = genState(titleFolder), ch = channelOf(titleFolder);
    items.forEach(function (x) { var g = gst.images[x.stem]; if (g) { x.blocked = !!g.blocked; x.reason = g.reason || ""; x.error = g.error || ""; x.attempts = g.attempts || 0; } });
    return { ok: true, subject: t.subject, folder: path.join(titleFolder, ST.FOLDER.AI), promptsPath: t.autoPath ? t.autoPath.replace(/_auto_video_structure\.txt$/i, "_ai_prompts.txt") : "", need: items.length, have: items.length - missing.length, missing: missing, items: items,
             gen: { enabled: genChannel(ch), key: !!secretsJson().geminiKey, model: (config.imagegen || {}).model || IG.KNOWN_MODELS[0].id, lastRun: gst.lastRun || "", generated: gst.generated || 0 }, turboflow: tfBatchInfo(titleFolder), tfDir: tfDir() };
}
/* the ambience sounds of a title, fetched ahead of the render: every cue resolved against <CHANNEL>\SFX\, the missing ones downloaded now */
function fetchAmbience(j) {
    var t = ST.readTitle(j.titleFolder); if (!t || !t.sfx || !t.bd) { log(j, "ambience: no _sfx.json in the package — the bed will be silent"); return Promise.resolve(); }
    var ch = channelOf(j.titleFolder), sd = sfxDir(ch), sds = sfxDirs(ch), cues = SFX.cuesFromJson(t.sfx, t.bd), seen = {}, uniq = cues.filter(function (c) { var k = String(c.sound).toLowerCase(); if (seen[k]) return false; seen[k] = 1; return true; });
    var key = secretsJson().freesoundKey || "", cat = readJson(path.join(HERE, "assets", "sfx_catalog.json"), []);
    log(j, "ambience: " + uniq.length + " sound(s) for " + cues.length + " cue(s)" + (key ? "" : " — no Freesound key in secrets.json: only cached sounds and the bundled Commons set can be used"));
    return SFX.analyzeDirs(sds, function (m) { log(j, m); }).then(function (ix) {
        var seq = Promise.resolve(), got = 0, missing = [];
        if (j.task === "sfx") { j.total = uniq.length; j.done = 0; }
        uniq.forEach(function (c) { seq = seq.then(function () { if (j.abort.aborted) return; j.detail = "\u201c" + c.sound + "\u201d"; return SFX.resolveCue({ dir: sd, freesoundKey: key, catalog: cat, log: function (m) { log(j, m); }, contact: config.download.contact, abort: j.abort }, c, ix).then(function (r) { if (r && r.file) got++; else missing.push(c.sound); if (j.task === "sfx") j.done++; }); }); });
        return seq.then(function () { return SFX.analyzeDirs(sds, function (m) { log(j, m); }); }).then(function () { log(j, "ambience: " + got + "/" + uniq.length + " sound(s) in place" + (missing.length ? " — not found: " + missing.join(", ") + (key ? "" : " (add a free Freesound API key as \"freesoundKey\" in _SECRETS\\secrets.json)") : "")); });
    });
}
/* two stage chains in parallel: the first failure stops the other one (the download handle is cancelled, the upscale stops after
   the image in flight) and the run fails with that error once both have settled — nothing keeps running into the next job */
function bothOrStop(j, pa, pb) {
    var firstErr = null;
    function guard(p) { return p.then(function (v) { return { ok: true, v: v }; }, function (e) { if (!firstErr) { firstErr = e; if (!j.abort.aborted) { j.abort.soft = true; j.siblingStop = true; } if (j.dlHandle) { try { j.dlHandle.cancel(); } catch (e2) {} } } return { ok: false, e: e }; }); }
    return Promise.all([guard(pa), guard(pb)]).then(function () { if (firstErr) throw firstErr; });
}
/* STAGE generate: the missing AI images straight from the Gemini API (lib/imagegen.js). Blocked prompts and exhausted retries
   stop the run with the list, so the prompt can be edited (prompts panel) or the key / quota looked at. */
function genItems(tf) {
    var t = ST.readTitle(tf); if (!t || !t.auto) return [];
    return t.auto.items.filter(function (x) { return x.kind === "AI"; }).map(function (x) { return { image: x.image, stem: ST.aiStem(x.image), prompt: x.prompt || "", section: x.section, present: !!ST.assetsFor(tf, x, t.bd).image }; });
}
function generateStage(j, channel, only) {
    var items = genItems(j.titleFolder), missing = items.filter(function (x) { return !x.present && (!only || only.indexOf(x.stem) >= 0); });
    if (!items.length) { setStage(j, "generate", "skip"); return Promise.resolve(); }
    if (!missing.length) { setStage(j, "generate", "done", items.length, items.length); return Promise.resolve(); }
    var key = secretsJson().geminiKey || "";
    if (!genChannel(channel)) return Promise.reject(new Error("generate: " + missing.length + " AI image(s) missing and automatic generation is off for " + channel + " — generate them with the prompts panel (TurboFlow) or enable Gemini generation in Settings"));
    if (!key) return Promise.reject(new Error("generate: " + missing.length + " AI image(s) missing and no \"geminiKey\" in _SECRETS\\secrets.json — add your AI Studio key, or generate them with the prompts panel (TurboFlow)"));
    var gst = genState(j.titleFolder), todo = missing.filter(function (x) { return !(gst.images[x.stem] && gst.images[x.stem].blocked); }), blockedBefore = missing.length - todo.length;
    if (!todo.length) return Promise.reject(new Error("generate: " + blockedBefore + " prompt(s) are blocked by the safety filter — edit them in the prompts panel, then RUN again"));
    var emptyP = todo.filter(function (x) { return !x.prompt.trim(); }); if (emptyP.length) return Promise.reject(new Error("generate: no prompt for " + emptyP.map(function (x) { return x.stem; }).join(", ") + " in the auto structure"));
    setStage(j, "generate", "running", items.length - missing.length, items.length);
    var cfg = config.imagegen || {}, base = items.length - missing.length;
    return IG.runItems(todo, { key: key, model: cfg.model || IG.KNOWN_MODELS[0].id, imageSize: cfg.imageSize || "2K", aspectRatio: cfg.aspectRatio || "16:9", parallel: cfg.parallel || 2, retries: cfg.retries == null ? 4 : cfg.retries, dir: path.join(j.titleFolder, ST.FOLDER.AI), abort: j.abort },
        function (m) { log(j, m); }, function (d, t, x) { setStage(j, "generate", "running", base + d, base + t); if (x) j.detail = "generate: " + x; })
    .then(function (r) {
        var st = genState(j.titleFolder); todo.forEach(function (x) { st.images[x.stem] = Object.assign(st.images[x.stem] || {}, { attempts: ((st.images[x.stem] || {}).attempts || 0) + 1, at: new Date().toISOString(), blocked: false, error: "" }); });
        (r.blocked || []).forEach(function (b) { st.images[b.stem] = Object.assign(st.images[b.stem] || {}, { blocked: true, reason: b.reason }); });
        (r.errors || []).forEach(function (e) { st.images[e.stem] = Object.assign(st.images[e.stem] || {}, { error: e.error }); });
        st.model = cfg.model || IG.KNOWN_MODELS[0].id; st.lastRun = new Date().toISOString(); st.generated = (st.generated || 0) + r.done; saveGenState(j.titleFolder, st); invalidateTitles();
        if (r.cancelled || j.abort.aborted) throw new Error("killed");
        var left = genItems(j.titleFolder).filter(function (x) { return !x.present; });
        if (r.fatal) throw new Error("generate: " + r.fatal + " — check the key in _SECRETS\\secrets.json and the model id in Settings");
        if (left.length) throw new Error("generate: " + r.done + " image(s) made, " + left.length + " still missing — " + ((r.blocked || []).length ? (r.blocked.length + " blocked by the safety filter (" + r.blocked.map(function (b) { return b.stem; }).join(", ") + "): edit those prompts in the prompts panel; " ) : "") + ((r.errors || []).length ? r.errors.length + " failed after retries (" + r.errors.slice(0, 3).map(function (e) { return e.stem + ": " + e.error.slice(0, 60); }).join("; ") + ") — RUN again retries them" : ""));
        setStage(j, "generate", "done", items.length, items.length); log(j, "generate: done — " + r.done + " image(s) in " + Math.round(r.seconds) + " s");
    });
}
/* edit one AI prompt in place: the auto structure (txt + json twin) and the ai_prompts files follow; a blocked mark is cleared */
function editPrompt(tf, image, prompt) {
    var t = ST.readTitle(tf); if (!t || !t.autoPath) return { ok: false, error: "no auto structure" };
    prompt = String(prompt || "").replace(/\r?\n/g, " ").trim(); if (prompt.length < 20) return { ok: false, error: "the prompt is too short" };
    var lines = fs.readFileSync(t.autoPath, "utf8").split(/\r?\n/), hdr = new RegExp("^AUTO\\s+\\d+\\s*\\|.*AI IMAGE\\s+" + (+image) + "\\s*$"), i0 = -1;
    for (var i = 0; i < lines.length; i++) if (hdr.test(lines[i])) { i0 = i; break; }
    if (i0 < 0) return { ok: false, error: "AI IMAGE " + image + " not in the auto structure" };
    var pi = -1; for (var k = i0 + 1; k < lines.length; k++) { if (/^AUTO\s+\d+\s*\|/.test(lines[k])) break; if (lines[k] === "PROMPT:") { pi = k; break; } }
    if (pi < 0) return { ok: false, error: "no PROMPT: line for AI IMAGE " + image };
    var end = pi + 1; while (end < lines.length && lines[end].trim() !== "" && !/^-{10,}$/.test(lines[end]) && !/^AUTO\s+\d+\s*\|/.test(lines[end])) end++;
    lines.splice(pi + 1, end - (pi + 1), prompt); fs.writeFileSync(t.autoPath, lines.join("\n"));
    var jp = t.autoPath.replace(/\.txt$/i, ".json"); try { var jj = readJson(jp, null); if (jj && jj.items) { jj.items.forEach(function (it) { if (it.kind === "AI" && it.image === +image) it.prompt = prompt; }); if (jj.aiImages) jj.aiImages.forEach(function (ai) { if ((ai.image || ai.index) === +image) ai.prompt = prompt; }); fs.writeFileSync(jp, JSON.stringify(jj, null, 1)); } } catch (e) {}
    try { var t2 = ST.readTitle(tf), pr = t2.auto.items.filter(function (x) { return x.kind === "AI"; }).map(function (x) { return x.prompt.replace(/\s+/g, " ").trim(); }), pp = listFiles(path.join(tf, "Script")).filter(function (n) { return /_ai_prompts\.txt$/i.test(n); })[0]; if (pp) fs.writeFileSync(path.join(tf, "Script", pp), pr.join("\n") + "\n"); var pc = listFiles(path.join(tf, "Script")).filter(function (n) { return /_ai_prompts\.csv$/i.test(n); })[0]; if (pc) fs.writeFileSync(path.join(tf, "Script", pc), "index,file,prompt\r\n" + t2.auto.items.filter(function (x) { return x.kind === "AI"; }).map(function (x) { return x.image + "," + ST.aiStem(x.image) + ".jpg,\"" + x.prompt.replace(/\s+/g, " ").trim().replace(/"/g, "\"\"") + "\""; }).join("\r\n") + "\r\n"); } catch (e) {}
    var st = genState(tf); if (st.images[ST.aiStem(image)]) { st.images[ST.aiStem(image)].blocked = false; st.images[ST.aiStem(image)].reason = ""; st.images[ST.aiStem(image)].edited = new Date().toISOString(); saveGenState(tf, st); }
    invalidateTitles(); glog("prompt " + ST.aiStem(image) + " edited in " + path.basename(tf)); return { ok: true, image: +image, prompt: prompt };
}
/* ---- the TurboFlow bridge: the prompts panel's "copy" records WHICH images the pasted list stands for (TurboFlow numbers a pasted
   list 001, 002 … from the top), and the watcher files the extension's numbered downloads into the title's AI Images\ by that map ---- */
function tfDir() { return (config.turboflow && config.turboflow.dir) || path.join(os.homedir(), "Downloads", "turboflow"); }
function tfBatchPath(tf) { return path.join(tf, "Script", "_turboflow_batch.json"); }
function tfBatchInfo(tf) { var b = readJson(tfBatchPath(tf), null); if (!b || !b.map) return null; var pending = Object.keys(b.map).filter(function (k) { return !b.received || !b.received[k]; }); return { at: b.at, total: Object.keys(b.map).length, received: Object.keys(b.map).length - pending.length, pending: pending, map: b.map, dir: b.dir || tfDir() }; }
function tfPendingElsewhere(tf) {
    var hits = [];
    try { listFiles(config.base).forEach(function (ch) { if (/^_/.test(ch)) return; var td = titlesDir(ch); listFiles(td).forEach(function (t) { if (!/^\d+\.\s/.test(t)) return; var o = path.join(td, t); if (o === tf) return; var b = tfBatchInfo(o); if (b && b.pending.length) hits.push({ title: t, received: b.received, total: b.total }); }); }); } catch (e) {}
    return hits;
}
function tfRecordBatch(tf, images) {
    var items = genItems(tf), stems = items.map(function (x) { return x.stem; }), list = (images || []).map(function (i) { return typeof i === "number" ? ST.aiStem(i) : String(i); }).filter(function (st) { return stems.indexOf(st) >= 0; });
    if (!list.length) return { ok: false, error: "no images in the batch" };
    var other = tfPendingElsewhere(tf); if (other.length) return { ok: false, error: "TurboFlow numbers every batch from 001, so only one title can wait for its files: \"" + other[0].title + "\" still expects " + (other[0].total - other[0].received) + " — let it finish or press clear in its prompts panel" };
    var map = {}; list.forEach(function (st, k) { map[String(k + 1).padStart(3, "0")] = st; });
    var rec = { at: new Date().toISOString(), dir: tfDir(), map: map, received: {}, note: "TurboFlow numbers the pasted prompts from 001; this map says which AI image each number stands for" };
    try { fs.writeFileSync(tfBatchPath(tf), JSON.stringify(rec, null, 1)); } catch (e) { return { ok: false, error: e.message }; }
    invalidateTitles(); glog("TurboFlow batch recorded for " + path.basename(tf) + ": " + list.length + " prompt(s) (" + list.slice(0, 5).join(", ") + (list.length > 5 ? "…" : "") + ") — watching " + rec.dir);
    return { ok: true, total: list.length, dir: rec.dir };
}
function tfImport(tf, logf) {
    logf = logf || glog; var b = readJson(tfBatchPath(tf), null); if (!b || !b.map) return { ok: false, error: "no TurboFlow batch recorded — press copy in the prompts panel first" };
    var dir = b.dir || tfDir(), names; try { names = fs.readdirSync(dir); } catch (e) { return { ok: false, error: "TurboFlow folder not found: " + dir }; }
    var since = Date.parse(b.at) - 60000, moved = 0, got = [], dst = path.join(tf, ST.FOLDER.AI); fs.mkdirSync(dst, { recursive: true }); b.received = b.received || {};
    Object.keys(b.map).forEach(function (num) {
        if (b.received[num]) return;
        var cands = names.filter(function (n) { var m = /^(\d{3})([a-z]?)\.(png|jpe?g|webp)$/i.exec(n); return m && m[1] === num; }).sort();   // 001.png first, then 001b.png …
        for (var i = 0; i < cands.length; i++) {
            var f = path.join(dir, cands[i]), st; try { st = fs.statSync(f); } catch (e) { continue; }
            if (st.mtimeMs < since || st.size < 10240) continue;
            try { var probe = fs.openSync(f, "r+"); fs.closeSync(probe); } catch (e) { continue; }   // still being written by Chrome
            var stem = b.map[num], target = path.join(dst, stem + path.extname(f).toLowerCase().replace("jpeg", "jpg"));
            if (ST.findFile(dst, stem, null)) { b.received[num] = cands[i]; break; }   // already there (a manual copy)
            try { fs.renameSync(f, target); } catch (e) { try { fs.copyFileSync(f, target); fs.unlinkSync(f); } catch (e2) { logf("TurboFlow: cannot move " + cands[i] + " — " + e2.message); continue; } }
            b.received[num] = cands[i]; moved++; got.push(num + " → " + stem); break;
        }
    });
    try { fs.writeFileSync(tfBatchPath(tf), JSON.stringify(b, null, 1)); } catch (e) {}
    var pending = Object.keys(b.map).filter(function (k) { return !b.received[k]; });
    if (moved) { invalidateTitles(); logf("TurboFlow: " + moved + " image(s) filed into AI Images\\ (" + got.slice(0, 6).join(", ") + (got.length > 6 ? "…" : "") + ") — " + (pending.length ? pending.length + " still expected" : "batch complete")); }
    if (!pending.length) { try { fs.renameSync(tfBatchPath(tf), tfBatchPath(tf).replace(/\.json$/, ".done.json")); } catch (e) {} }
    return { ok: true, moved: moved, pending: pending.length, total: Object.keys(b.map).length };
}
function tfWatchTick() {
    if (!(config.turboflow && config.turboflow.watch !== false)) return;
    try { listFiles(config.base).forEach(function (ch) { if (/^_/.test(ch)) return; var td = titlesDir(ch); listFiles(td).forEach(function (t) { if (!/^\d+\.\s/.test(t)) return; var tf = path.join(td, t); if (fs.existsSync(tfBatchPath(tf))) tfImport(tf, glog); }); }); } catch (e) {}
}
setInterval(tfWatchTick, 10000);
/* the upscaler deployment must answer at all before a run spends minutes on it (any HTTP status counts; only a dead host fails) */
function probeUpscaler(u) {
    return new Promise(function (resolve, reject) {
        var mod = /^https:/.test(u) ? require("https") : require("http"), done = false;
        var req = mod.request(u, { method: "GET", headers: { "User-Agent": "RuviStudio (upscaler probe)" } }, function (res) { res.resume(); if (!done) { done = true; resolve(res.statusCode); } });
        req.on("error", function (e) { if (!done) { done = true; reject(new Error("upscale: the upscaler at " + u + " does not answer (" + e.message + ") — check the Vercel deployment / your connection, or untick the channel under 'channels that get painted'")); } });
        req.setTimeout(12000, function () { req.destroy(new Error("timeout")); }); req.end();
    });
}
/* a painted file that cannot be decoded (a half-written download) is removed so the next run paints it again */
function verifyPainted(tf, suffix, logf) {
    var dir = path.join(tf, ST.FOLDER.AI), names = listFiles(dir).filter(function (n) { return /\.(jpe?g|png|webp)$/i.test(n) && new RegExp(suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(_\\d+)?\\.[a-z]+$", "i").test(n); }), chain = Promise.resolve(), bad = 0;
    names.forEach(function (n) { var f = path.join(dir, n); chain = chain.then(function () { if (fs.statSync(f).size < 10240) throw new Error("tiny"); return FF.probe(f).then(function (pi) { if (!pi.width) throw new Error("undecodable"); }); }).catch(function () { bad++; try { fs.unlinkSync(f); } catch (e) {} var raw = path.join(dir, "_raw", n.replace(new RegExp(suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(_\\d+)?(\\.[a-z]+)$", "i"), "$2")); try { if (fs.existsSync(raw)) fs.renameSync(raw, path.join(dir, path.basename(raw))); } catch (e2) {} logf("upscale: " + n + " could not be decoded — removed (its original is back in AI Images\\ for the next run)"); }); });
    return chain.then(function () { return bad; });
}
/* STAGE upscale: the channel's raw AI images → painted (Ruvi's oil upscaler), inside RUN. Failed images are retried once;
   anything still raw stops the run (a half-painted video is the wrong look) — press RUN again to retry just those. */
function upscaleStage(j, channel) {
    if (!paintedChannel(channel)) { setStage(j, "upscale", "skip"); return Promise.resolve(); }
    var suffix = config.upscaler.suffix || "_painted", P = UP.plan(j.titleFolder, suffix);
    if (!P.todo.length) { setStage(j, "upscale", P.painted ? "done" : "skip", P.painted, P.painted); log(j, "upscale: nothing raw in AI Images\\ (" + P.painted + " painted)"); return Promise.resolve(); }
    if (!/^https?:\/\//.test(String(config.upscaler.url || ""))) return Promise.reject(new Error("upscale: set the upscaler URL in Settings → upscaler (or untick " + channel + " under 'channels that get painted')"));
    var attempt = 0, base = P.painted, softAbort = { get aborted() { return j.abort.aborted || j.abort.soft; } };
    setStage(j, "upscale", "running", 0, P.todo.length);
    return probeUpscaler(config.upscaler.url).then(go);
    function go() {
        attempt++;
        return UP.runTitle(j.titleFolder, Object.assign({}, config.upscaler, { abort: softAbort, workflow: config.upscaler.workflow || null }), function (m) { log(j, m); },
            function (d, t, x) { setStage(j, "upscale", "running", base + d, base + t); if (x) j.detail = "upscale: " + x; })
        .then(function (r) {
            if (j.abort.aborted) throw new Error("killed");
            if (r.cancelled && j.abort.soft) { j.stopped = true; throw new Error("stopped after " + r.done + " painted image(s) — press RUN to continue"); }
            return verifyPainted(j.titleFolder, suffix, function (m) { log(j, m); }).then(function (bad) { if (bad) r.failed += bad; return r; });
        }).then(function (r) {
            if (r.failed && attempt < 2) { log(j, "upscale: " + r.failed + " image(s) failed — retrying them once"); base += r.done; return go(); }
            if (r.failed) throw new Error("upscale: " + r.failed + " image(s) could not be painted (they stay raw in AI Images\\) — press RUN to retry them, or check the upscaler service");
            var P2 = UP.plan(j.titleFolder, suffix); setStage(j, "upscale", "done", P2.painted, P2.painted); log(j, "upscale: done — " + P2.painted + " painted" + (r.seconds ? " in " + Math.round(r.seconds / 60) + " min" : ""));
        });
    }
    return go();
}
/* the whole video: the AI and special parts, fades at every cut, the CTAs, letterbox, VO + the ambience bed */
function assembleTitle(j, info) {
    var t = ST.readTitle(j.titleFolder); if (t.error || !t.auto) throw new Error(t.error || (t.errors || []).join("; ") || "auto structure missing");
    if (info.ai && info.ai.missing && info.ai.missing.length) throw new Error("AI images incomplete (" + info.ai.have + "/" + info.ai.need + ") — generate " + info.ai.missing.slice(0, 4).join(", ") + (info.ai.missing.length > 4 ? "…" : "") + " into AI Images\\ and press run again");
    var ch = channelOf(j.titleFolder);
    return ctaClipsFor(ch).then(function (ctas) {
        var opts = Object.assign({}, config.render, { encoder: encoderFor(), fps: config.render.fps, outName: sanitize(path.basename(j.titleFolder)), force: !!j.force, ctas: ctas, sfxDir: sfxDir(ch), sfxDirs: sfxDirs(ch), freesoundKey: secretsJson().freesoundKey || "", sfxCatalog: readJson(path.join(HERE, "assets", "sfx_catalog.json"), []), sfxLufs: (channelAmbienceLufs(ch) != null ? channelAmbienceLufs(ch) : config.render.sfxLufs), sfxDuckDb: config.render.sfxDuckDb, sfxUnderVoiceDb: config.render.sfxUnderVoiceDb, contact: config.download.contact, abort: j.abort });
        log(j, "assembling: " + t.auto.items.length + " item(s), " + (t.auto.durationMs / 1000).toFixed(1) + " s" + (ctas.length ? " + " + ctas.length + " CTA(s)" : "") + ", " + opts.fps + " fps, letterbox " + opts.letterbox + ":1, ambience cues " + ((t.sfx && t.sfx.cues) ? t.sfx.cues.length : 0) + ", bed " + (opts.sfxUnderVoiceDb != null ? opts.sfxUnderVoiceDb : 18) + " dB under the voice (ceiling " + opts.sfxLufs + " LUFS)");
        return AS.assemble(t, opts, function (m) { if (/^segment .* kept/.test(m)) return; log(j, m); j.detail = m; });
    }).then(function (r) { r.warnings.forEach(function (w) { log(j, "warning: " + w); }); return r; });
}
/* the Render tab's ledger (_section_renders.json in the output base): Navigate's ✓ chips and n8n read it — keep it in step */
function writeLedger(info, s) {
    try {
        var f = path.join(info.outBase, "_section_renders.json"), old = readJson(f, null), items = (old && old.items) ? old.items.slice() : [], key = s.name.toUpperCase(), found = false;
        var item = { name: s.name, type: s.type, folder: OUT_FOLDER[s.type], file: s.out, status: "ok", error: "", by: "Ruvi Studio" };
        for (var i = 0; i < items.length; i++) if (String(items[i].name).toUpperCase() === key) { items[i] = item; found = true; }
        if (!found) items.push(item);
        fs.writeFileSync(f, JSON.stringify({ generatedAt: new Date().toISOString(), channel: info.channel, title: path.basename(info.titleFolder), base: info.outBase, items: items }, null, 2));
    } catch (e) {}
}
/* NVENC: the ffmpeg build must list h264_nvenc AND a test encode must succeed (that proves the NVIDIA driver is there) */
var ENC = { checked: false, nvenc: false, why: "", gpu: "" };
/* the hardware encoder ladder — a test encode decides, never the GPU name: NVENC (NVIDIA) → Quick Sync (Intel) → AMF (AMD) →
   VideoToolbox (Apple) → libx264 on the CPU. On a machine with an NVIDIA card nothing changes: NVENC is probed first. */
var HW_LADDER = process.platform === "darwin"
    ? [{ id: "videotoolbox", codec: "h264_videotoolbox", args: ["-q:v", "60"], label: "VideoToolbox (Apple)" }, { id: "nvenc", codec: "h264_nvenc", args: ["-preset", "p5", "-cq", "19"], label: "NVENC" }]
    : [{ id: "nvenc", codec: "h264_nvenc", args: ["-preset", "p5", "-cq", "19"], label: "NVENC" }, { id: "qsv", codec: "h264_qsv", args: ["-global_quality", "19"], label: "Quick Sync (Intel)" }, { id: "amf", codec: "h264_amf", args: ["-quality", "quality"], label: "AMF (AMD)" }];
function detectEncoder() {
    if (ENC.checked) return Promise.resolve(ENC);
    var cp2 = require("child_process");
    return new Promise(function (resolve) {
        var r = cp2.spawnSync(config.ffmpeg, ["-hide_banner", "-encoders"], { encoding: "utf8", windowsHide: true }), list = String(r.stdout || ""), tried = [];
        if (r.status !== 0) { ENC = { checked: true, nvenc: false, hw: "", why: "ffmpeg -encoders failed" }; return resolve(ENC); }
        for (var i = 0; i < HW_LADDER.length; i++) {
            var h = HW_LADDER[i]; if (list.indexOf(h.codec) < 0) { tried.push(h.label + ": not in this ffmpeg build"); continue; }
            var t = cp2.spawnSync(config.ffmpeg, ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=black:s=256x256:r=30:d=0.5", "-c:v", h.codec].concat(h.args, ["-f", "null", "-"]), { encoding: "utf8", windowsHide: true, timeout: 30000 });
            if (t.status === 0) {
                var gpu = "";
                if (h.id === "nvenc") { var smi = cp2.spawnSync("nvidia-smi", ["--query-gpu=name,memory.total", "--format=csv,noheader"], { encoding: "utf8", windowsHide: true }); gpu = smi.status === 0 ? String(smi.stdout || "").trim().split(/\r?\n/)[0] : "NVIDIA GPU"; }
                else gpu = h.label;
                ENC = { checked: true, nvenc: h.id === "nvenc", hw: h.id, codec: h.codec, gpu: gpu, why: "" }; return resolve(ENC);
            }
            tried.push(h.label + ": test encode failed (" + String(t.stderr || "").trim().split(/\r?\n/).pop().slice(0, 80) + ")");
        }
        ENC = { checked: true, nvenc: false, hw: "", why: tried.join("; ") || "no hardware encoder" }; resolve(ENC);
    });
}
function encoderFor() { var want = config.render.encoder || "auto"; if (want === "x264") return "x264"; if (["nvenc", "qsv", "amf", "videotoolbox"].indexOf(want) >= 0) return want; return ENC.hw || "x264"; }
/* ---- the Trello grab (RUVI Studio's Grab stage, one-to-one; whisper from the app-built runtime) ---- */
var lastScan = null, whisperInfo = { tool: "", plan: null, checkedAt: 0 };
function whisperOnPath() {
    var bins = PV.whisperEnvPath(config.base); if (!bins.length) return;
    var pk = "PATH"; for (var k in process.env) if (String(k).toUpperCase() === "PATH") { pk = k; break; }
    var cur = process.env[pk] || ""; var add = bins.filter(function (b) { return cur.indexOf(b) < 0; }); if (add.length) process.env[pk] = add.join(path.delimiter) + path.delimiter + cur;
}
function whisperCheck(force) {
    if (!force && Date.now() - whisperInfo.checkedAt < 30000) return whisperInfo;
    whisperOnPath(); whisperInfo.tool = PV.whisperBin(config.base) || (G.resolveTool("whisper-ctranslate2") || "");
    try { whisperInfo.plan = G.whisperPlan(config.base, config.grab.whisperModel || "auto", config.grab.whisperDevice || "auto", true); } catch (e) { whisperInfo.plan = null; }
    whisperInfo.gpu = PV.hasNvidia(); whisperInfo.cuda = PV.cudaDirs(config.base).length > 0; whisperInfo.checkedAt = Date.now();
    if (force && whisperInfo.gpu && whisperInfo.cuda && PV.runtimePython(config.base)) { var pr = PV.cudaProbe(config.base); whisperInfo.cudaDevices = pr.devices; whisperInfo.cudaError = pr.error; }
    return whisperInfo;
}
function provisionWhisper(reason) {
    if (PV.status().running) return Promise.resolve(PV.status());
    glog("whisper: provisioning" + (reason ? " (" + reason + ")" : ""));
    var st = PV.status(); st.running = true; st.step = "uv"; st.pct = 0; st.error = ""; st.done = false;
    return PV.ensureWhisper(HERE, config.base, { prefetchModel: false }).then(function (r) {
        whisperCheck(true);
        if (config.grab.shareRuntime !== false) { var lk = PV.shareRuntimeWithStudio(config.base); if (lk) glog("whisper: runtime shared with the Adobe extension at " + lk); }
        if (config.grab.prefetchModel && whisperInfo.plan && whisperInfo.plan.model) return PV.ensureWhisper(HERE, config.base, { prefetchModel: whisperInfo.plan.model }).then(function () { return r; });
        return r;
    }).then(function (r) { var st2 = PV.status(); st2.running = false; st2.done = true; st2.step = "done"; st2.pct = 100; st2.msg = "whisper ready: " + r.tool + (r.cuda ? " · CUDA libs installed" : (r.gpu ? " · CUDA libs missing" : " · CPU")); glog(st2.msg); whisperCheck(true); })
      .catch(function (e) { var st3 = PV.status(); st3.running = false; st3.error = String(e && e.message || e); st3.msg = "whisper install failed: " + st3.error; glog(st3.msg); });
}
function healTitleTree(tf) { var created = []; TITLE_FOLDERS.forEach(function (f) { var d = path.join(tf, f); if (!fs.existsSync(d)) { try { fs.mkdirSync(d, { recursive: true }); created.push(f); } catch (e) {} } }); return { ok: true, dir: tf, created: created }; }
/* the ambience library of a channel: <CHANNEL>\SFX\ measured (duration, loudness, tags) and listed for the writing room */
function sfxLibrary(ch, log) {
    var sd = sfxDir(ch), sds = sfxDirs(ch); try { fs.mkdirSync(sd, { recursive: true }); } catch (e) {}
    return SFX.analyzeDirs(sds, log).then(function (ix) { var cat = SFX.catalogDirs(sds); return { index: { channel: ch, generatedAt: new Date().toISOString(), target_lufs: config.render.sfxLufs, sounds: cat, bundled: readJson(path.join(HERE, "assets", "sfx_catalog.json"), []).map(function (e) { return { file: e.file, seconds: e.seconds, tags: e.tags, license: e.license, source: "commons" }; }) }, count: cat.length }; });
}
/* the packet zip: everything the writing room needs in one small file (README, script, word-level SRT, suffix file, the channel's ambience catalogue + CTA metadata) */
function writePacketZip(tf, chan, lib, cta) {
    var sc = path.join(tf, "Script"), names = listFiles(sc), files = [];
    function add(name, from) { if (from && fs.existsSync(from)) files.push({ name: name, data: fs.readFileSync(from) }); }
    add("00_README_FOR_CLAUDE.md", path.join(sc, "00_README_FOR_CLAUDE.md"));
    names.filter(function (x) { return /\.docx$/i.test(x); }).forEach(function (x) { add(x, path.join(sc, x)); });
    names.filter(function (x) { return /_word_level\.srt$/i.test(x) || /_words\.json$/i.test(x) || /\.srt$/i.test(x); }).forEach(function (x) { add(x, path.join(sc, x)); });
    add("Channel_Prompt_Suffixes.txt", path.join(sc, "Channel_Prompt_Suffixes.txt"));
    var cover = listFiles(tf).filter(function (x) { return /^Cover\./i.test(x); })[0]; if (cover) add(cover, path.join(tf, cover));
    if (lib && lib.index) files.push({ name: "_sfx_catalog.json", data: Buffer.from(JSON.stringify(lib.index, null, 1)) });
    if (cta) files.push({ name: "_cta.json", data: Buffer.from(JSON.stringify(cta, null, 1)) });
    if (!files.length) return { ok: false, error: "nothing to pack" };
    var out = path.join(sc, "packet.zip"); try { var bytes = ZIP.write(out, files); } catch (e) { return { ok: false, error: String(e.message || e) }; }
    var removed = [];
    if (config.grab.looseFiles === false) {   // the zip is the record: the loose duplicates go (the VO .mp3 stays — the render needs it; the cover stays in the title root)
        files.forEach(function (f) { var p = path.join(sc, f.name); if (/^(_sfx_catalog\.json|_cta\.json)$/.test(f.name) || /^Cover\./i.test(f.name)) return; try { if (fs.existsSync(p)) { fs.unlinkSync(p); removed.push(f.name); } } catch (e2) {} });
    }
    return { ok: true, path: out, bytes: bytes, files: files.map(function (f) { return f.name; }), removed: removed };
}
/* before a re-grab: put the zip's docx / SRT / words back loose so the Studio's stage skips the downloads and whisper; they are cleaned again after */
function restoreFromPacket(tf) {
    var sc = path.join(tf, "Script"), pz = listFiles(sc).filter(function (x) { return /^packet.*\.zip$/i.test(x); })[0]; if (!pz) return [];
    try { return UZ.extract(path.join(sc, pz), sc, { flatten: true, filter: function (r) { return /\.(docx?|rtf|srt|json)$/i.test(r) && !/^(_sfx_catalog|_cta)\.json$/i.test(r) && !fs.existsSync(path.join(sc, r)); } }); } catch (e) { return []; }
}
function enqueueGrab(cands) {
    var n = 0;
    cands.forEach(function (c) { if (jobs.some(function (j) { return j.grab && j.cardId === c.cardId && (j.state === "queued" || j.state === "running"); })) return; jobs.push({ id: "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), grab: true, cardId: c.cardId, candidate: c, title: (c.number ? c.number + ". " : "") + c.title + " · grab", channel: c.channel, titleFolder: c.existingFolder ? path.join(config.base, c.channel, c.existingFolder) : "", state: "queued", detail: "", log: [], done: 0, total: 0, addedAt: new Date().toISOString() }); n++; });
    tick(); return n;
}
/* the Studio's grab builds <baseDir>\<CHANNEL>\<n. Title>; our titles live one level deeper, so the grab is given a base whose <CHANNEL> entry IS the Titles folder (a junction) */
var GRAB_SHIM = path.join(HERE, "runtime", "grabbase");                       // (self-contained) under the app folder, not the system temp
function grabBase(ch) {
    try { fs.mkdirSync(GRAB_SHIM, { recursive: true }); var link = path.join(GRAB_SHIM, ch), target = path.join(config.base, chanFolder(ch), TITLES); fs.mkdirSync(target, { recursive: true });
        var st = null; try { st = fs.lstatSync(link); } catch (e) {}
        if (st && st.isSymbolicLink() && fs.readlinkSync(link) === target) return GRAB_SHIM;
        if (st) fs.rmSync(link, { recursive: true, force: true });
        fs.symlinkSync(target, link, "junction"); return GRAB_SHIM;
    } catch (e) { return config.base; }
}
function runGrab(j) {
    whisperOnPath(); var c = j.candidate;
    if (PV.runtimePython(config.base) && !PV.runtimeHealthy(config.base)) { log(j, "whisper runtime cannot start its Python — rebuilding it before the grab (one-time, ~1 min + downloads)"); return provisionWhisper("grab: broken runtime").then(function () { whisperOnPath(); return runGrab2(j); }); }
    return runGrab2(j);
}
function runGrab2(j) {
    var c = j.candidate;
    if (c.existingFolder) { var tf0 = path.join(titlesDir(chanFolder(c.channel)), c.existingFolder); var back = restoreFromPacket(tf0); if (back.length) log(j, "restored from packet.zip for the re-grab: " + back.join(", ")); }
    process.env.RUVI_WHISPER_BATCHED = config.grab.batched === false ? "0" : "1"; process.env.RUVI_WHISPER_BATCH = String(config.grab.batchSize || 16); process.env.RUVI_WHISPER_COMPUTE = config.grab.computeType || "float16";
    log(j, "grab started" + (whisperInfo.tool ? "" : " (whisper-ctranslate2 not installed — the word-level SRT will be skipped)"));
    return G.run(grabOpts({ candidate: c, whisperModel: config.grab.whisperModel || undefined, whisperDevice: config.grab.whisperDevice || undefined }), function (m) { log(j, String(m)); })
        .then(function (r) {
            (r.warnings || []).forEach(function (w) { log(j, "warning: " + w); });
            j.titleFolder = r.folder || j.titleFolder; if (!j.titleFolder) throw new Error("grab reported no folder");
            log(j, "saved: " + (r.saved || []).join(", "));
            var ht = healTitleTree(j.titleFolder); if (ht.created.length) log(j, "title tree: +" + ht.created.join(", "));
            var chan = channelOf(j.titleFolder);
            return sfxLibrary(chan, function (m) { log(j, m); }).then(function (lib) { return ctaMeta(chan).then(function (cta) { return [lib, cta]; }); }).then(function (lc) {
                var lib = lc[0], cta = lc[1];
                var pr = PK.ensure({ titleFolder: j.titleFolder, baseDir: config.base, channel: chanMarker(chan), force: true });
                log(j, pr && pr.ok ? ("packet: " + (pr.written || pr.message || "README + suffix file in Script\\")) : ("packet: " + (pr && (pr.skip || pr.error) || "not written")));
                if (cta.clips.length) log(j, "CTA: " + cta.clips.map(function (c) { return c.file + " @ " + Math.round(c.position * 100) + "% (" + c.seconds + " s)"; }).join(", ")); else log(j, "CTA: none in " + cta.folder);
                var z = writePacketZip(j.titleFolder, chan, lib, cta); log(j, z.ok ? ("packet zip: " + path.basename(z.path) + " (" + Math.round(z.bytes / 1024) + " KB, " + z.files.length + " files)" + (z.removed && z.removed.length ? " · loose copies removed: " + z.removed.length : "")) : ("packet zip: " + z.error));
                var h = G.titleHealth(j.titleFolder); j.state = (h.docx && h.srt) ? "done" : "failed"; j.error = j.state === "done" ? "" : ("missing " + (!h.docx ? "docx " : "") + (!h.srt ? "word-level SRT" : ""));
                log(j, j.state === "done" ? "DONE — drop Script\\" + path.basename(z.path || "packet.zip") + " into the writing-room chat" : ("FAILED — " + j.error));
                if (j.state === "done" && config.grab.chatUrl) open(config.grab.chatUrl);
            });
        });
}
var TREE = { message: "", warnings: [] };
var MACRO = { light: { edge: 3, corner: 9, edgeStart: 0.56, cornerStart: 0.78, vignette: 0.10 }, normal: { edge: 5, corner: 14, edgeStart: 0.50, cornerStart: 0.72, vignette: 0.16 }, strong: { edge: 7, corner: 20, edgeStart: 0.42, cornerStart: 0.66, vignette: 0.24 } };
/* the grab's scan sees every channel through the junction base, so existing titles under Titles\ are recognised as existing */
function grabBaseAll() { var ms = suffixMarkers(); listFiles(config.base).forEach(function (ch) { if (!/^_/.test(ch) && fs.existsSync(path.join(config.base, ch)) && fs.statSync(path.join(config.base, ch)).isDirectory()) grabBase(chanMarker(ch)); }); ms.forEach(function (m) { grabBase(m); }); ["_SECRETS", "_RUVI PROJECT FILES", "_RUNTIME"].forEach(function (d) { var link = path.join(GRAB_SHIM, d), target = path.join(config.base, d); try { if (fs.existsSync(target) && !fs.existsSync(link)) fs.symlinkSync(target, link, "junction"); } catch (e) {} }); return fs.existsSync(path.join(GRAB_SHIM, "_SECRETS")) ? GRAB_SHIM : config.base; }
/* AI images from a bulk tool's download folder: the files are taken in name order (TurboFlow and friends number their downloads) and renamed 001.jpg … */
function importAiImages(tf, from) {
    if (!from || !fs.existsSync(from)) return { ok: false, error: "folder not found: " + from };
    var files = listFiles(from).filter(function (x) { return /\.(jpe?g|png|webp)$/i.test(x); }).sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true }); });
    if (!files.length) return { ok: false, error: "no images in " + from };
    var dst = path.join(tf, ST.FOLDER.AI); fs.mkdirSync(dst, { recursive: true }); var n = 0;
    files.forEach(function (f, i) { var ext = path.extname(f).toLowerCase().replace("jpeg", "jpg"); fs.copyFileSync(path.join(from, f), path.join(dst, ST.aiStem(i + 1) + ext)); n++; });
    return { ok: true, imported: n, into: dst };
}
/* the finished video's duration, probed once per file size/mtime */
var FD_CACHE = {};
function finalDurationCache(p) { try { var st = fs.statSync(p), key = p + "|" + st.size + "|" + st.mtimeMs; if (FD_CACHE[key] != null) return FD_CACHE[key]; var r = require("child_process").spawnSync(config.ffprobe, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], { encoding: "utf8", windowsHide: true, timeout: 20000 }); var d = parseFloat(String(r.stdout || "").trim()); FD_CACHE[key] = isFinite(d) ? d : null; return FD_CACHE[key]; } catch (e) { return null; } }
function checkHealth() {
    health.base = fs.existsSync(config.base);
    health.secrets = fs.existsSync(path.join(config.base, "_SECRETS", "secrets.json")); health.suffixFile = fs.existsSync(path.join(config.base, "_RUVI PROJECT FILES", "Channel_Prompt_Suffixes.txt"));
    var wi = whisperCheck(false); health.whisper = wi.tool ? ((wi.plan ? (wi.plan.device + " · " + wi.plan.model) : "ready") + (wi.gpu ? " · " + wi.gpu : "") + (wi.cudaDevices != null ? (wi.cudaDevices ? " · CUDA ok" : " · CUDA libs present but no device seen") : "")) : ""; health.whisperGpu = wi.gpu; health.whisperCuda = wi.cuda; var ch = CAP.findChrome(config.render); health.chrome = ch ? ch.path : ""; health.puppeteer = PV.hasPuppeteer(HERE);
    health.engine = config.render.engine || "native"; health.native = false; try { require.resolve("@napi-rs/canvas", { paths: [HERE] }); health.native = true; } catch (e) {}
    var fp = PV.ffmpegPaths(HERE); health.ffmpeg = fp ? fp.ffmpeg : ""; health.provision = PV.status();
    health.encoder = ENC.checked ? (ENC.nvenc ? ("h264_nvenc · " + ENC.gpu) : ("libx264 (CPU) — " + ENC.why)) : "checking";
    health.tree = TREE; health.channels = listFiles(config.base).filter(function (x) { return !/^_/.test(x) && fs.existsSync(path.join(config.base, x)) && fs.statSync(path.join(config.base, x)).isDirectory(); }).map(function (ch) { return { name: ch, titles: listFiles(titlesDir(ch)).filter(function (t) { return /^\d+\.\s/.test(t); }).length, sfx: Object.keys(SFX.quickIndexes(sfxDirs(ch)).files).length }; });
    health.contact = /[@\/]/.test(String(config.download.contact || ""));
    health.freesound = !!(secretsJson().freesoundKey); health.gemini = !!(secretsJson().geminiKey); health.turboflowDir = fs.existsSync(tfDir());   // Wikimedia User-Agent policy: without a contact the client is capped at 10 requests/minute
    if (fp && (config.ffmpeg === "ffmpeg" || !fs.existsSync(config.ffmpeg))) { config.ffmpeg = fp.ffmpeg; config.ffprobe = fp.ffprobe; FF.configure(config); }
    if (health.ffmpeg && !ENC.checked) return detectEncoder().then(function () { health.encoder = ENC.hw ? (ENC.codec + " · " + ENC.gpu) : ("libx264 (CPU) — " + ENC.why); glog("encoder: " + health.encoder); });
    return Promise.resolve();
}
function provision(reason) {
    // the app fetches its own prerequisites (ffmpeg, the renderer package, a browser when none is installed)
    if (PV.status().running) return Promise.resolve(PV.status());
    console.log("provisioning prerequisites" + (reason ? " (" + reason + ")" : ""));
    return PV.ensureAll(HERE, { chrome: config.render.chrome, needChrome: (config.render.engine || "native") === "chrome" }).then(function (r) {
        if (r.ffmpeg) { config.ffmpeg = r.ffmpeg.ffmpeg; config.ffprobe = r.ffmpeg.ffprobe; }
        if (r.chrome && !config.render.chrome) config.render.chrome = r.chrome;
        saveCfg(config); FF.configure(config); return checkHealth();
    }).catch(function (e) { console.log("provisioning: " + e.message); return checkHealth(); });
}

var SYS_CACHE = { at: 0, info: null };
function systemInfo() {
    if (SYS_CACHE.info && Date.now() - SYS_CACHE.at < 30000) return SYS_CACHE.info;
    var free = null; try { var st = fs.statfsSync(config.base); free = Math.round(st.bavail * st.bsize / 1073741824); } catch (e) {}
    var info = { platform: process.platform + " " + os.release() + " " + process.arch, node: process.version, cpus: os.cpus().length, cpu: (os.cpus()[0] || {}).model || "", ramGb: Math.round(os.totalmem() / 1073741824), freeGb: free, encoder: ENC.hw ? ENC.codec + " · " + ENC.gpu : "libx264 (CPU)", workers: (function () { var w = config.render.workers | 0; if (w) return w; var encW = encoderFor(), ramGb = os.totalmem() / 1073741824; return Math.max(1, Math.min(encW === "nvenc" ? 6 : (encW === "x264" ? 3 : 4), Math.floor(os.cpus().length / 2), Math.max(1, Math.floor(ramGb / 2.5)))); })(), scanMs: TITLES_CACHE.ms || 0, synced: /My Drive|Google Drive|OneDrive|Dropbox/i.test(config.base) };
    SYS_CACHE = { at: Date.now(), info: info }; return info;
}
/* ---- the in-app updater: drop a RuviStudio_*_update.zip into updates\ (or the app folder, its parent, or Downloads),
   press UPDATE in the header: the zip is unpacked over the app (a backup of every replaced file goes to runtime\backup\<stamp>\),
   the change is committed and pushed with git when the folder is a repository, and the server restarts itself. ---- */
var PKG = readJson(path.join(HERE, "package.json"), { version: "?" }), BOOT_TS = Date.now(), UPD_DIR = path.join(HERE, "updates"), UPD_CACHE = { at: 0, info: null }, UPD_BUSY = false;
try { fs.mkdirSync(path.join(UPD_DIR, "applied"), { recursive: true }); } catch (e) {}
try { if (!fs.existsSync(path.join(UPD_DIR, "README.txt"))) fs.writeFileSync(path.join(UPD_DIR, "README.txt"), "Drop RuviStudio_<version>_update.zip files here and press UPDATE in Ruvi Studio's header.\r\nApplied zips move into applied\\. The app also looks in its own folder, the folder above it and your Downloads folder.\r\n"); } catch (e) {}
function updateCheck(force) {
    if (!force && UPD_CACHE.info && Date.now() - UPD_CACHE.at < 20000) return UPD_CACHE.info;
    var dirs = [UPD_DIR, HERE, path.dirname(HERE), path.join(os.homedir(), "Downloads")], cands = [], seen = {};
    dirs.forEach(function (d) { listFiles(d).forEach(function (n) { if (!/^RuviStudio_.*update\.zip$/i.test(n)) return; var f = path.join(d, n); if (seen[f.toLowerCase()]) return; seen[f.toLowerCase()] = 1; try { var st = fs.statSync(f); if (st.isFile() && st.size > 200) cands.push({ file: f, name: n, dir: d, mtime: st.mtimeMs, size: st.size }); } catch (e) {} }); });
    cands.sort(function (a, b) { return b.mtime - a.mtime; });
    var info = { current: PKG.version, candidates: cands.slice(0, 6), latest: cands[0] || null, dropDir: UPD_DIR, last: readJson(path.join(HERE, "runtime", "last_update.json"), null), busy: UPD_BUSY };
    if (info.latest) { try { info.latest.version = zipVersion(info.latest.file); info.latest.kind = zipKind(info.latest.file); } catch (e) { info.latest.error = e.message; } }
    UPD_CACHE = { at: Date.now(), info: info }; return info;
}
function cmpVer(a, b) { var x = String(a).split(".").map(Number), y = String(b).split(".").map(Number); for (var i = 0; i < 3; i++) { var d = (x[i] || 0) - (y[i] || 0); if (d) return d; } return 0; }
function zipKind(zip) { var names = UZ.list(zip).map(function (n) { return n.replace(/\\/g, "/"); }), app = names.some(function (n) { return /^(studio\.js|package\.json|ui\/index\.html|lib\/.+)$/.test(n); }), wr = names.some(function (n) { return /^writing-room\//.test(n); }); return app && wr ? "app + writing room" : app ? "app" : wr ? "writing room" : ""; }
function zipVersion(zip) {
    var names = UZ.list(zip).map(function (n) { return n.replace(/\\/g, "/"); }); if (names.indexOf("package.json") < 0) return "";
    var tmp = path.join(HERE, "runtime", "tmp", "updv_" + Date.now()); UZ.extract(zip, tmp, { filter: function (r) { return r === "package.json"; } });
    var v = (readJson(path.join(tmp, "package.json"), {}) || {}).version || ""; try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {} return v;
}
function runGit(args, log) {
    return new Promise(function (resolve) {
        var out = "", err = ""; var pr;
        try { pr = cp.spawn("git", args, { cwd: HERE, windowsHide: true }); } catch (e) { return resolve({ ok: false, out: "", err: e.message, missing: true }); }
        var to = setTimeout(function () { try { pr.kill(); } catch (e) {} }, 120000);
        pr.stdout.on("data", function (d) { out += d; }); pr.stderr.on("data", function (d) { err += d; });
        pr.on("error", function (e) { clearTimeout(to); resolve({ ok: false, out: out, err: e.message, missing: e.code === "ENOENT" }); });
        pr.on("close", function (code) { clearTimeout(to); var lines = err.trim().split("\n").filter(Boolean), why = lines.filter(function (l) { return /fatal:|error:/i.test(l); })[0] || lines.slice(-1)[0] || ""; log("git " + args.join(" ") + (code === 0 ? " ✓" : " ✗ (" + code + ")") + (why ? " — " + why.slice(0, 160) : "")); resolve({ ok: code === 0, out: out, err: err, why: why }); });
    });
}
function applyUpdate(file, opts) {
    opts = opts || {}; var log = opts.log || glog;
    return Promise.resolve().then(function () {
        if (UPD_BUSY) throw new Error("an update is already being applied");
        if (running) throw new Error("the queue is busy — let it finish (or kill it) before updating");
        var info = updateCheck(true), cand = (info.candidates || []).filter(function (c) { return c.file === file; })[0] || info.latest;
        if (!cand) throw new Error("no RuviStudio_*_update.zip found in " + UPD_DIR + ", the app folder, its parent or Downloads");
        UPD_BUSY = true; UPD_CACHE.at = 0;
        var stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19), staging = path.join(HERE, "runtime", "tmp", "update_" + stamp), backup = path.join(HERE, "runtime", "backup", stamp);
        log("update: unpacking " + cand.name);
        var files = UZ.extract(cand.file, staging, { filter: function (r) { return !/^(node_modules|runtime|\.git)\//.test(r) && r !== "studio.config.json" && !/^RuviStudio\//.test(r); } });
        if (!files.length) throw new Error(cand.name + " has no usable files (a zip with the app folder inside it? the paths must start at studio.js / ui / lib / writing-room)");
        var kind = zipKind(cand.file); if (!kind) throw new Error(cand.name + " is not a Ruvi Studio update zip (no studio.js / package.json / ui / lib / writing-room inside)");
        var zv = cand.version || zipVersion(cand.file); if (zv && cmpVer(zv, PKG.version) < 0 && !opts.force) { try { fs.rmSync(staging, { recursive: true, force: true }); } catch (e) {} throw new Error(cand.name + " carries version " + zv + ", older than the running " + PKG.version + " — move that zip away (or apply it with force)"); }
        var replaced = 0, added = 0;
        files.forEach(function (rel) {
            var src = path.join(staging, rel), dst = path.join(HERE, rel), abs = path.resolve(dst); if (abs.indexOf(path.resolve(HERE) + path.sep) !== 0) return;
            if (fs.existsSync(dst)) { var bk = path.join(backup, rel); fs.mkdirSync(path.dirname(bk), { recursive: true }); fs.copyFileSync(dst, bk); replaced++; } else added++;
            fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst);
        });
        try { fs.rmSync(staging, { recursive: true, force: true }); } catch (e) {}
        var newVersion = (readJson(path.join(HERE, "package.json"), {}) || {}).version || PKG.version;
        log("update: " + files.length + " file(s) applied (" + replaced + " replaced, " + added + " new) — backup of the replaced ones in runtime\\backup\\" + stamp + " · version " + PKG.version + " → " + newVersion);
        var dest = path.join(UPD_DIR, "applied", cand.name); try { if (fs.existsSync(dest)) fs.unlinkSync(dest); fs.renameSync(cand.file, dest); } catch (e) { try { fs.copyFileSync(cand.file, dest); fs.unlinkSync(cand.file); } catch (e2) { log("update: could not move the zip into updates\\applied\\ (" + e2.message + ")"); } }
        var rec = { zip: cand.name, from: PKG.version, to: newVersion, at: new Date().toISOString(), files: files.length, backup: backup, kind: kind, git: null };
        var gitChain = Promise.resolve(null);
        if (fs.existsSync(path.join(HERE, ".git")) && opts.git !== false) {
            gitChain = runGit(["add", "-A"], log).then(function (r) {
                if (r.missing) return { skipped: "git is not installed — run sync.bat later" };
                return runGit(["commit", "-m", "update: " + cand.name + " (" + PKG.version + " → " + newVersion + ")"], log).then(function (c) {
                    if (!c.ok) { var why = (c.err + c.out).trim().split("\n").filter(Boolean).slice(-1)[0] || ""; if (/nothing to commit/i.test(c.out + c.err)) why = "nothing to commit"; if (/auto-detect email|user\.name|user\.email|identity/i.test(c.err)) why += " — set git config user.name / user.email (publish.ps1 asks for them)"; return { committed: false, pushed: false, note: "commit failed: " + why.slice(0, 160) + " — run sync.bat later" }; }
                    return runGit(["pull", "--rebase", "origin", "main"], log).then(function () { return runGit(["push", "origin", "main"], log); }).then(function (pu) { return { committed: true, pushed: pu.ok, note: pu.ok ? "committed and pushed to GitHub" : "committed; push failed (" + (pu.why || "").slice(0, 120) + ") — run sync.bat later" }; });
                });
            });
        } else gitChain = Promise.resolve({ skipped: fs.existsSync(path.join(HERE, ".git")) ? "git disabled" : "not a git repository (run publish.ps1 once to connect GitHub)" });
        return gitChain.then(function (g) { rec.git = g; try { fs.mkdirSync(path.join(HERE, "runtime"), { recursive: true }); fs.writeFileSync(path.join(HERE, "runtime", "last_update.json"), JSON.stringify(rec, null, 2)); } catch (e) {} UPD_BUSY = false; UPD_CACHE.at = 0; if (opts.restart !== false) restartSelf("update applied: " + cand.name); return rec; });
    }).catch(function (e) { UPD_BUSY = false; UPD_CACHE.at = 0; throw e; });
}
function restartSelf(why) {
    glog("restarting — " + why);
    setTimeout(function () {
        try { server.close(); } catch (e) {}
        try {
            var args = [path.join(HERE, "studio.js")].concat(process.argv.slice(2)), child;
            if (process.platform === "win32") { var q = function (x) { return "'" + String(x).replace(/'/g, "''") + "'"; }; child = cp.spawn("powershell.exe", ["-NoProfile", "-WindowStyle", "Hidden", "-Command", "Start-Process -FilePath " + q(process.execPath) + " -ArgumentList " + q(args.map(function (a) { return '"' + a + '"'; }).join(" ")) + " -WorkingDirectory " + q(HERE)], { detached: true, stdio: "ignore", windowsHide: true }); }
            else { var outFd = fs.openSync(path.join(LOGDIR, "studio-console.log"), "a"); child = cp.spawn(process.execPath, args, { cwd: HERE, detached: true, stdio: ["ignore", outFd, outFd] }); }
            child.unref();
        } catch (e) { glog("restart failed to spawn: " + e.message + " — start the app again by hand"); }
        setTimeout(function () { process.exit(0); }, 400);
    }, 600);
}

/* ---- HTTP ------------------------------------------------------------------ */
function send(res, code, obj) { var body = typeof obj === "string" ? obj : JSON.stringify(obj); res.writeHead(code, Object.assign({ "Content-Type": typeof obj === "string" ? "text/plain; charset=utf-8" : "application/json; charset=utf-8" }, SEC_HEADERS)); res.end(body); }
var BODY_MAX = 4 * 1024 * 1024;
function body(req) { return new Promise(function (resolve) { var c = [], n = 0, over = false; req.on("data", function (d) { n += d.length; if (n > BODY_MAX) { over = true; c = []; return; } c.push(d); }); req.on("end", function () { if (over) return resolve({}); try { resolve(JSON.parse(Buffer.concat(c).toString("utf8") || "{}")); } catch (e) { resolve({}); } }); req.on("error", function () { resolve({}); }); }); }
/* the API is for the page the app serves, on this machine, and nothing else:
   · Host must be the loopback name the app listens on (a DNS-rebinding page arrives with its own host)
   · Origin, when a browser sends one, must be the app's own (a cross-site page sends its origin, or none for "no-cors" posts — those are refused too, see Sec-Fetch-Site)
   · Sec-Fetch-Site, when present, must be same-origin / none (a cross-site fetch says cross-site)
   · POST bodies must be application/json (a simple cross-site form or text/plain post cannot pass) */
function localOnly(req) {
    var host = String(req.headers.host || "").toLowerCase().replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
    if (["localhost", "127.0.0.1", "::1"].indexOf(host) < 0) return "host " + (req.headers.host || "(none)") + " is not the app's loopback name";
    var origin = req.headers.origin; if (origin) { var o; try { o = new URL(origin); } catch (e) { return "bad origin"; } if (["localhost", "127.0.0.1", "[::1]"].indexOf(o.hostname.toLowerCase()) < 0) return "cross-site origin " + origin; }
    var sfs = String(req.headers["sec-fetch-site"] || "").toLowerCase(); if (sfs && sfs !== "same-origin" && sfs !== "none") return "cross-site request (" + sfs + ")";
    var verified = sfs === "same-origin" || (origin && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(origin));   // the browser vouched for the page itself
    if (req.method === "POST" && !verified && !/^application\/json/i.test(String(req.headers["content-type"] || ""))) return "POST bodies must be application/json";
    return "";
}
var SEC_HEADERS = { "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "X-Frame-Options": "DENY", "Cache-Control": "no-store" };
var server = http.createServer(function (req, res) {
    var p; try { p = new URL(req.url, "http://localhost").pathname; } catch (e) { p = "/"; }
    if (req.method === "GET" && (p === "/" || p === "/index.html")) { res.writeHead(200, Object.assign({ "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self'; frame-src https: http://localhost:* http://127.0.0.1:*; base-uri 'none'; form-action 'none'" }, SEC_HEADERS)); return fs.createReadStream(path.join(HERE, "ui", "index.html")).pipe(res); }
    if (/^\/api\//.test(p)) { var deny = localOnly(req); if (deny) { glog("refused " + req.method + " " + p + " — " + deny); return send(res, 403, { error: "refused: " + deny }); } }
    if (req.method === "OPTIONS") { res.writeHead(204, SEC_HEADERS); return res.end(); }
    if (req.method === "GET" && p === "/api/state") return send(res, 200, { config: config, health: health, running: running, scan: lastScan, boot: BOOT_TS, version: PKG.version, update: updateCheck(false), system: systemInfo(), jobs: jobs.map(function (j) { var o = Object.assign({}, j); delete o.candidate; o.log = j.log.slice(-3); return o; }) });
    if (req.method === "GET" && p === "/api/titles") return send(res, 200, { output: { root: "", source: "each title's Output\\ folder" }, titles: allTitles().map(function (t) { var o = Object.assign({}, t); delete o.specials; delete o.bd; o.archived = (config.archived || []).indexOf(t.titleFolder) >= 0; o.sections = t.specials.map(function (s) { return { name: s.name, type: s.type, done: s.done, sec: Math.round((s.t1 - s.t0) / 100) / 10 }; }); return o; }) });
    if (req.method === "GET" && p === "/api/logs") {   // ?after=<seq> returns only the lines logged since that sequence number (the drawer tails every 2 s)
        var qs = new URL(req.url, "http://localhost").searchParams, after = +(qs.get("after") || 0), first = GLOG_SEQ - GLOG.length;   // sequence number of GLOG[0]
        if (!after || after < first || after > GLOG_SEQ) return send(res, 200, { file: LOGFILE, seq: GLOG_SEQ, lines: GLOG.slice(-1500), reset: true });
        return send(res, 200, { file: LOGFILE, seq: GLOG_SEQ, lines: GLOG.slice(after - first) });
    }
    if (req.method === "GET" && p === "/api/upscaler/workflow") return send(res, 200, { ok: true, workflow: config.upscaler.workflow || UP.WORKFLOW, custom: !!config.upscaler.workflow, defaults: UP.WORKFLOW });
    if (req.method === "GET" && p === "/api/output") return send(res, 200, { root: "", titlesSub: TITLES, source: "title folder (Output\\)" });
    if (req.method === "GET" && /^\/api\/log\//.test(p)) { var j = jobs.filter(function (x) { return x.id === p.split("/").pop(); })[0]; return send(res, j ? 200 : 404, j ? { id: j.id, log: j.log } : { error: "no such job" }); }
    if (req.method === "POST" && p === "/api/health") return checkHealth().then(function () { send(res, 200, health); });
    if (req.method === "POST" && p === "/api/provision") { provision("requested from the UI"); return send(res, 200, { ok: true, status: PV.status() }); }
    return body(req).then(function (b) {
        if (b && typeof b.titleFolder === "string" && !underBase(b.titleFolder)) return send(res, 400, { ok: false, error: "titleFolder is not a title under the base folder" });
        if (req.method !== "POST") return send(res, 404, "not found");
        switch (p) {
            case "/api/download": { var dj = enqueueDownload(b.titleFolder); return send(res, 200, { ok: !!dj, job: dj ? dj.id : null, skip: dj ? "" : "already queued or running" }); }
            case "/api/titles/refresh": { invalidateTitles(); return send(res, 200, { ok: true }); }
            case "/api/update/check": { return send(res, 200, { ok: true, update: updateCheck(true) }); }
            case "/api/update/apply": { return applyUpdate(b.file, { restart: b.restart !== false, git: b.git !== false, force: !!b.force, log: glog }).then(function (rec) { send(res, 200, { ok: true, applied: rec, restarting: b.restart !== false }); }, function (e) { send(res, 400, { ok: false, error: e.message }); }); }
            case "/api/restart": { if (running) return send(res, 400, { ok: false, error: "the queue is busy" }); send(res, 200, { ok: true }); return restartSelf("requested from the UI"); }
            case "/api/grab/scan": return G.scan(grabOpts()).then(function (r) { if (r.ok) { r.scannedAt = new Date().toISOString(); r.candidates = (r.candidates || []).map(function (c) { c.queued = jobs.some(function (j) { return j.grab && j.cardId === c.cardId && (j.state === "queued" || j.state === "running"); }); return c; }); lastScan = r; } send(res, 200, r); }).catch(function (e) { send(res, 200, { ok: false, error: String(e && e.message || e) }); });
            case "/api/_debug_scan": if (process.env.RUVI_DEBUG !== "1") return send(res, 404, "not found"); lastScan = b; return send(res, 200, { ok: true });
            case "/api/grab/run": { if (!lastScan) return send(res, 400, { error: "scan the board first" }); var ids = b.cardIds || []; return send(res, 200, { ok: true, queued: enqueueGrab(lastScan.candidates.filter(function (c) { return ids.indexOf(c.cardId) >= 0; })) }); }
            case "/api/grab/all": { if (!lastScan) return send(res, 400, { error: "scan the board first" }); return send(res, 200, { ok: true, queued: enqueueGrab(lastScan.candidates.filter(function (c) { return c.state !== "ok"; })) }); }
            case "/api/grab/whisper": { provisionWhisper("requested from the UI"); return send(res, 200, { ok: true }); }
            case "/api/grab/output-tree": { var done = 0, created = 0; allTitles().forEach(function (t) { var r2 = healTitleTree(t.titleFolder); done++; created += (r2.created || []).length; }); return send(res, 200, { ok: true, titles: done, foldersCreated: created }); }
            case "/api/sfx/index": { var jI = enqueueTask("index", "ambience · measure library", "", function (j) { var chs = listFiles(config.base).filter(function (x) { return !/^_/.test(x) && fs.existsSync(path.join(config.base, x, TITLES)); }), chainM = Promise.resolve(), outM = {}; j.total = chs.length || 1; j.done = 0; chs.forEach(function (ch) { chainM = chainM.then(function () { j.detail = ch; return sfxLibrary(ch, function (m) { log(j, m); }).then(function (r) { outM[ch] = r.count; j.done++; }); }); }); return chainM.then(function () { return { summary: Object.keys(outM).map(function (k) { return k + ": " + outM[k] + " sound(s)"; }).join(" · ") }; }); }); return send(res, 200, { ok: !!jI, queued: !!jI, channels: {}, skip: jI ? "" : "already queued or running" }); }
            case "/api/packet": { var chP = channelOf(b.titleFolder); restoreFromPacket(b.titleFolder); return sfxLibrary(chP, function (m) { glog(m); }).then(function (lib) { return ctaMeta(chP).then(function (cta) { PK.ensure({ titleFolder: b.titleFolder, baseDir: config.base, channel: chanMarker(chP), force: true }); send(res, 200, writePacketZip(b.titleFolder, chP, lib, cta)); }); }); }
            case "/api/refresh-packets": {                                   // every grabbed title: a fresh packet.zip with the current ambience catalogue, CTA metadata and README — as a queued job
                var jR = enqueueTask("refresh", "packets · refresh", "", function (j) {
                    var all = allTitles().filter(function (t) { return t.packet || listFiles(path.join(t.titleFolder, "Script")).some(function (x) { return /\.docx$/i.test(x); }); }), byCh = {}, chainR = Promise.resolve(), n = 0;
                    all.forEach(function (t) { (byCh[t.channel] = byCh[t.channel] || []).push(t); }); j.total = all.length; j.done = 0;
                    Object.keys(byCh).forEach(function (ch) { chainR = chainR.then(function () { if (j.abort.aborted) return; j.detail = ch + " · measuring the library"; return sfxLibrary(ch, function (m) { log(j, m); }).then(function (lib) { return ctaMeta(ch).then(function (cta) {
                        byCh[ch].forEach(function (t) { if (j.abort.aborted) return; j.detail = path.basename(t.titleFolder); try { restoreFromPacket(t.titleFolder); PK.ensure({ titleFolder: t.titleFolder, baseDir: config.base, channel: chanMarker(ch), force: true }); var z = writePacketZip(t.titleFolder, ch, lib, cta); if (z.ok) n++; else log(j, path.basename(t.titleFolder) + ": " + z.error); } catch (e) { log(j, path.basename(t.titleFolder) + ": " + e.message); } j.done++; });
                        log(j, "packets refreshed for " + ch + ": " + byCh[ch].length + " title(s) · ambience " + (lib.count || 0) + " sound(s) · CTA " + cta.clips.length + " clip(s)"); }); }); }); });
                    return chainR.then(function () { return { summary: n + " packet(s) refreshed across " + Object.keys(byCh).join(", ") }; });
                });
                return send(res, 200, { ok: !!jR, queued: !!jR, skip: jR ? "" : "already queued or running" }); }
            case "/api/heal-base": { TREE = healBase(function (m) { glog(m); }); return send(res, 200, { ok: true, report: TREE }); }
            case "/api/ai/import": { invalidateTitles(); return send(res, 200, importAiImages(b.titleFolder, b.from)); }
            case "/api/ai/prompts": { return send(res, 200, aiPrompts(b.titleFolder)); }
            case "/api/ai/prompt": { return send(res, 200, editPrompt(b.titleFolder, b.image, b.prompt)); }
            case "/api/imagegen/models": { var kM = secretsJson().geminiKey; if (!kM) return send(res, 400, { ok: false, error: "no geminiKey in _SECRETS\\secrets.json" }); return IG.listModels(kM).then(function (r) { send(res, 200, { ok: true, models: r.image, known: IG.KNOWN_MODELS, total: r.all }); }, function (e) { send(res, 400, { ok: false, error: e.message }); }); }
            case "/api/imagegen/run": { var chG = channelOf(b.titleFolder), onlyG = Array.isArray(b.only) && b.only.length ? b.only : null;
                var jG = enqueueTask("generate", path.basename(b.titleFolder) + " · generate", b.titleFolder, function (j) { return generateStage(j, chG, onlyG).then(function () { return { summary: "AI images complete" }; }); });
                return send(res, 200, { ok: !!jG, queued: !!jG, skip: jG ? "" : "already queued or running" }); }
            case "/api/tf/batch": { return send(res, 200, tfRecordBatch(b.titleFolder, b.images)); }
            case "/api/tf/import": { return send(res, 200, tfImport(b.titleFolder, glog)); }
            case "/api/tf/clear": { try { fs.unlinkSync(tfBatchPath(b.titleFolder)); } catch (e) {} invalidateTitles(); return send(res, 200, { ok: true }); }
            case "/api/upscaler/workflow": { if (b.reset) { config.upscaler.workflow = null; saveCfg(config); return send(res, 200, { ok: true, workflow: UP.WORKFLOW, custom: false }); } if (b.workflow) { config.upscaler.workflow = b.workflow; saveCfg(config); return send(res, 200, { ok: true, workflow: b.workflow, custom: true }); } return send(res, 200, { ok: true, workflow: config.upscaler.workflow || UP.WORKFLOW, custom: !!config.upscaler.workflow, defaults: UP.WORKFLOW }); }
            case "/api/upscale": { var ju = enqueueUpscale(b.titleFolder); return send(res, 200, { ok: !!ju, id: ju && ju.id, skip: ju ? "" : "already queued or running" }); }
            case "/api/sfx/fetch": { var tS = ST.readTitle(b.titleFolder); if (!tS.sfx) return send(res, 400, { error: "no _sfx.json in the package yet" });
                var jS = enqueueTask("sfx", path.basename(b.titleFolder) + " · ambience", b.titleFolder, function (j) { return fetchAmbience(j).then(function () { return { summary: j.done + "/" + j.total + " sound(s) in place" }; }); });
                return send(res, 200, { ok: !!jS, queued: !!jS, skip: jS ? "" : "already queued or running" }); }
            case "/api/stop": { if (current) { current.abort.soft = true; log(current, "stop requested — finishing the current step"); if (current.dlHandle) current.dlHandle.cancel(); } return send(res, 200, { ok: !!current }); }
            case "/api/kill": { if (current) { current.abort.aborted = true; log(current, "KILL requested — aborting now"); if (current.dlHandle) current.dlHandle.cancel(); } jobs.forEach(function (x) { if (x.state === "queued") x.state = "cancelled"; }); return send(res, 200, { ok: true }); }
            case "/api/render": { invalidateTitles(); var j = enqueue(b.titleFolder, !!b.force); return send(res, 200, { ok: !!j, job: j ? j.id : null, skip: j ? "" : "already queued or running" }); }
            case "/api/render-all": { var arch = config.archived || []; var n = 0; allTitles().forEach(function (t) { if (t.ready && !t.finished && arch.indexOf(t.titleFolder) < 0 && (b.force || !t.finished)) { if (enqueue(t.titleFolder, !!b.force)) n++; } }); return send(res, 200, { ok: true, queued: n }); }
            case "/api/archive": { var list = (config.archived || []).filter(function (x) { return x !== b.titleFolder; }); if (b.on !== false) list.push(b.titleFolder); config.archived = list; saveCfg(config); invalidateTitles(); return send(res, 200, { ok: true, archived: b.on !== false, count: list.length }); }
            case "/api/unpack": { try { invalidateTitles(); var up2 = unpackPackage(b.titleFolder); return send(res, up2.ok ? 200 : 400, up2); } catch (e) { return send(res, 500, { error: e.message }); } }
            case "/api/open": { var okO = openAllowed(b.path); if (okO) open(path.resolve(b.path)); return send(res, okO ? 200 : 403, { ok: okO, error: okO ? "" : "only folders and plain files under the base folder can be opened" }); }
            case "/api/remove": jobs = jobs.filter(function (j) { return j.id !== b.id || j.state === "running"; }); return send(res, 200, { ok: true });
            case "/api/config": { var oldBase = config.base; if (b.config && b.config.render) { var rr = b.config.render; ["sfxUnderVoiceDb", "sfxLufs", "fps", "crf", "nvencCq", "fadeSec", "tableLean", "workers"].forEach(function (k) { if (k in rr && (rr[k] === "" || rr[k] == null || !isFinite(+rr[k]))) delete rr[k]; }); if (rr.sfxUnderVoiceDb != null && (+rr.sfxUnderVoiceDb < 6 || +rr.sfxUnderVoiceDb > 40)) rr.sfxUnderVoiceDb = 26; } config = deepMerge(config, b.config || {}); saveCfg(config); config = loadCfg(); FF.configure(config); invalidateTitles(); if (config.base !== oldBase) { TREE = healBase(function (m) { glog(m); }); glog("base changed: " + oldBase + " → " + config.base); whisperCheck(true); } return checkHealth().then(function () { send(res, 200, { ok: true, config: config, health: health, tree: TREE }); }); }
            default: return send(res, 404, "not found");
        }
    });
});
TREE = healBase(function (m) { console.log("  " + m); });
checkHealth().then(function () {
    var needTools = !health.ffmpeg || !health.puppeteer || !health.native || ((config.render.engine || "native") === "chrome" && !health.chrome);
    var chainP = needTools ? provision("startup: " + [!health.ffmpeg ? "ffmpeg" : "", !health.puppeteer ? "renderer package" : "", !health.chrome ? "browser" : ""].filter(Boolean).join(", ") + " missing") : Promise.resolve();
    chainP.then(function () {
        if (!config.grab.autoInstallWhisper || !health.base) return;
        var wi = whisperCheck(true), broken = !!PV.runtimePython(config.base) && !PV.runtimeHealthy(config.base);
        if (broken) return provisionWhisper("startup: the whisper runtime cannot start its Python (base interpreter moved) — rebuilding");
        if (!wi.tool || (wi.gpu && !wi.cuda)) return provisionWhisper("startup: " + (wi.tool ? "CUDA libraries for " + wi.gpu : "whisper-ctranslate2 missing"));
    });
    var listenTries = 0;
    server.on("error", function (e) { if (e && e.code === "EADDRINUSE" && listenTries++ < 60) { if (listenTries === 1) console.log("port " + config.port + " is busy — waiting for the previous Ruvi Studio to exit…"); return setTimeout(function () { server.listen(config.port, "127.0.0.1"); }, 500); } console.log("server error: " + (e && e.message)); });
    server.once("listening", function () {
        console.log("RUVI STUDIO " + (PKG.version || "3.14") + "  →  http://localhost:" + config.port);
        console.log("  tree: " + config.base + "\\<CHANNEL>\\Titles\\<n. Title>\\{Script, Hook, Maps, Reference images, Characters, AI Images, Output}  ·  ambience: <base>\\_SFX\\ (shared by every channel; a channel's own SFX\\ overrides)");
        console.log("  base: " + config.base + (health.base ? "" : "  (NOT FOUND — edit studio.config.json)"));
        console.log("  ffmpeg: " + (health.ffmpeg || "NOT FOUND — downloading a static build into runtime\\ffmpeg"));
        console.log("  engine: " + (config.render.engine || "native") + ((config.render.engine || "native") === "chrome" ? ("  chrome: " + (health.chrome || "NOT FOUND — downloading Chrome for Testing")) : "  (Skia + ffmpeg perspective — no browser needed)"));
        console.log("  puppeteer-core: " + (health.puppeteer ? "ok" : "MISSING — installing"));
        console.log("  whisper: " + (health.whisper || "not installed — building the runtime (uv → Python 3.11 → whisper-ctranslate2" + (PV.hasNvidia() ? " + CUDA 12 libs" : "") + ")"));
        if (process.argv.indexOf("--all") >= 0) allTitles().forEach(function (t) { if (t.ready && t.rendered < t.total) enqueue(t.titleFolder, false); });
        var lu = readJson(path.join(HERE, "runtime", "last_update.json"), null); if (lu && lu.at && Date.now() - Date.parse(lu.at) < 120000) console.log("  updated: " + lu.zip + " (" + lu.from + " → " + lu.to + ")" + (lu.git && lu.git.note ? " · " + lu.git.note : ""));
    });
    server.listen(config.port, "127.0.0.1");
});
