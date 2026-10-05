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
var http = require("http"), fs = require("fs"), path = require("path"), url = require("url"), os = require("os"), cp = require("child_process");
var HERE = __dirname, CFG_FILE = path.join(HERE, "studio.config.json");
var ST = require("./lib/structure.js"), FF = require("./lib/ffmpeg.js"), CAP = require("./lib/render/capture.js"), UZ = require("./lib/unzip.js"), D = require("./lib/studio/packetdl.js"), PV = require("./lib/provision.js"), NAV = require("./lib/studio/navdl.js");
var G = require("./lib/studio/stages/grab.js"), PK = require("./lib/studio/packet.js");   // the Adobe extension's Trello grab, vendored
var AS = require("./lib/assemble.js"), SFX = require("./lib/sfx.js"), ZIP = require("./lib/zipw.js"), UP = require("./lib/upscaler.js");

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
              letterbox: 2.0, voDb: 0, zoom: 1.22, zoomDrift: 0.06, keepParts: true, sfxLufs: -31, sfxDuckDb: 2.5 },   // AI pan: zoom 1.22 = room to move; ambience bed at -31 LUFS (clearly there, well under the voice), 2.5 dB duck under the voice   // keepParts: keep Output\parts\ (the rendered sections) so a re-run only redoes what changed; false = delete it after the final video   // final video: letterbox ratio (2.0 = 60 px bars; 2.39 = 138 px), music/voice levels, AI Ken Burns zoom                 // a section whose still has no bundle object: "defaults" = plain map framing / REF pull-out; "skip" = not ready
    download: { pace: "auto", contact: "", imgNaming: "typenum", hookOriginal: true },
    grab: { whisperModel: "", whisperDevice: "", autoInstallWhisper: true, prefetchModel: true, chatUrl: "", batched: true, batchSize: 16, computeType: "float16", shareRuntime: true, looseFiles: false },   // looseFiles false = Script\ keeps only packet.zip + the VO .mp3; shareRuntime = junction <base>\_RUNTIME\python → the app's whisper runtime for the Adobe extension   // max-speed CUDA: batched inference (16 windows per pass) in float16   // the Trello grab (RUVI Studio's stage): whisper model/device blank = the Studio's own plan (GPU + CUDA libs → distil-large-v3)   // the Navigate tab's engine one-to-one: auto pace (fast → human cadence after a 429), MAP originals / others at 3840, persistent rounds, walls, manifest. hookOriginal: the HOOK is a map now — fetch its sheet as an original like MAP (the one deliberate deviation; off = exactly 1.6.7)
    upgradeLowRes: false,                                    // (kept for the older path; the Navigate engine decides sizes itself)
    upscaler: { url: "https://comfy-oil-upscaler.vercel.app", prompt: "", parallel: 10, keepRaw: true, suffix: "_painted", channels: { BILGERATS: true, SCURVYDOGS: true, OLDWORLDPROOF: false }, workflow: null },   // channels: which channels' AI images get painted; workflow: ComfyUI node parameters edited in the UPSCALER tab (null = the bundled workflow)   // Ruvi's Batch Oil Upscaler (Vercel → RunPod): the deployment URL; originals are kept in AI Images\_raw\
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
function open(t) { try { if (process.platform === "win32") cp.spawn("cmd", ["/c", "start", "", t], { detached: true, stdio: "ignore" }).unref(); else cp.spawn(process.platform === "darwin" ? "open" : "xdg-open", [t], { detached: true, stdio: "ignore" }).unref(); } catch (e) {} }

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
    info.sfx = { cues: 0, have: 0, files: Object.keys(SFX.quickIndexes(sds).files).length, missing: [] };
    if (sfxName) { var sj = readJson(path.join(sc, sfxName), null); if (sj && sj.cues) { var ixq = SFX.quickIndexes(sds), seen = {};
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
    return info;
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
function titlesDir(ch) { var cd = path.join(config.base, ch), td = path.join(cd, TITLES); return fs.existsSync(td) ? td : cd; }
function allTitles() {
    var out = [];
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
function glog(m) { var line = new Date().toISOString().slice(11, 19) + " " + m; GLOG.push(line); if (GLOG.length > 2000) GLOG.shift(); try { fs.appendFileSync(LOGFILE, line + "\n"); } catch (e) {} }
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
function enqueue(tf, force) { if (jobs.some(function (j) { return j.titleFolder === tf && (j.state === "queued" || j.state === "running"); })) return null; var j = { id: "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), titleFolder: tf, title: path.basename(tf), state: "queued", detail: "", log: [], done: 0, total: 0, force: !!force, addedAt: new Date().toISOString() }; jobs.push(j); tick(); return j; }
function tick() {
    if (running) return; var j = jobs.filter(function (x) { return x.state === "queued"; })[0]; if (!j) return;
    running = true; j.state = "running";
    if (j.task) { current = j; j.abort = { aborted: false, soft: false };
        Promise.resolve().then(function () { return j.run(j); })
            .then(function (r) { j.state = j.abort.aborted ? "killed" : "done"; log(j, (j.abort.aborted ? "KILLED" : "DONE") + (r && r.summary ? " — " + r.summary : "")); })
            .catch(function (e) { j.state = "failed"; j.error = String(e && e.message || e); log(j, "FAILED — " + j.error); })
            .then(function () { running = false; current = null; setTimeout(tick, 200); }); return; }
    if (j.upscale) { current = j; j.abort = { aborted: false, soft: false };
        UP.runTitle(j.titleFolder, Object.assign({}, config.upscaler, { abort: j.abort, workflow: config.upscaler.workflow || null }), function (m) { log(j, m); }, function (d, t, x) { j.done = d; j.total = t; j.detail = x ? ("last: " + x) : ""; })
            .then(function (r) { if (r.cancelled) { j.state = "killed"; log(j, "KILLED — " + r.done + " painted"); } else { j.state = r.failed ? "failed" : "done"; j.error = r.failed ? (r.failed + " image(s) failed — press upscale again to retry them") : ""; log(j, (r.failed ? "FAILED — " : "DONE — ") + r.done + " painted" + (r.failed ? ", " + r.failed + " failed (left as originals; upscale again to retry)" : "") + (r.seconds ? " in " + Math.round(r.seconds) + " s" : "")); } })
            .catch(function (e) { j.state = "failed"; j.error = String(e && e.message || e); log(j, "FAILED — " + j.error); })
            .then(function () { running = false; current = null; setTimeout(tick, 200); }); return; }
    if (j.grab) { current = j; j.abort = { aborted: false, soft: false }; runGrab(j).catch(function (e) { j.state = "failed"; j.error = String(e && e.message || e); log(j, "FAILED — " + j.error); }).then(function () { running = false; current = null; setTimeout(tick, 200); }); return; }
    var parts = j.titleFolder.split(/[\\/]/), channel = channelOf(j.titleFolder), tname = (parts[parts.length - 1] || "").replace(/^\d+\.\s+/, "");
    var info = inspect(j.titleFolder, channel, 0, tname);
    current = j; j.abort = { aborted: false, soft: false };
    if (j.download) {
        Promise.resolve().then(function () { if (!info.subject) throw new Error(info.missing.join("; ")); return verifyStills(info); })
            .then(function (bad) { if (bad.length) log(j, "removed undecodable: " + bad.join(", ")); return downloadStills(j.titleFolder, info, function (m) { log(j, m); }, j); })
            .then(function () { info = inspect(j.titleFolder, channel, 0, tname); j.state = info.needDownload.length ? "failed" : "done"; j.error = info.needDownload.length ? ("still missing: " + info.needDownload.join(", ")) : ""; log(j, j.state === "done" ? ("DONE — " + info.images.have + "/" + info.images.need + " images on disk") : ("FAILED — " + j.error)); })
            .catch(function (e) { j.state = "failed"; j.error = String(e && e.message || e); log(j, "FAILED — " + j.error); })
            .then(function () { running = false; setTimeout(tick, 200); });
        return;
    }
    Promise.resolve().then(function () {
        if (!info.subject && info.packageZip) { var up = unpackPackage(j.titleFolder); log(j, "package unpacked: " + up.files + " file(s)"); info = inspect(j.titleFolder, channel, 0, tname); }
        var hard = info.missing.filter(function (m) { return !/downloaded automatically/.test(m); }); if (hard.length) throw new Error(hard.join("; "));
        return verifyStills(info).then(function (bad) {
            if (bad.length) log(j, bad.length + " image(s) on disk could not be decoded and were removed for re-download: " + bad.join(", "));
            var need = info.specials.filter(function (s) { return !s.still; }).map(function (s) { return s.name; });
            if (!need.length) { log(j, "images: all " + info.total + " on disk"); return; }
            log(j, "downloading " + need.length + " image(s) with RUVI Studio's Navigate engine (persistent rounds)");
            return downloadStills(j.titleFolder, info, function (m) { log(j, m); }, j)
                .then(function () { info = inspect(j.titleFolder, channel, 0, tname); if (info.needDownload.length) throw new Error("still missing after download: " + info.needDownload.join(", ")); });
        });
    }).then(function () {
        if (!health.ffmpeg) throw new Error("ffmpeg is not installed yet — the app is fetching it (see the banner); press RUN again when the chip is green");
        if ((config.render.engine || "native") === "chrome" && !CAP.findChrome(config.render)) throw new Error("no Chrome/Edge found yet — the app is fetching Chrome for Testing; press RUN again when the chip is green");
        if ((config.render.engine || "native") !== "chrome") { try { require("@napi-rs/canvas"); } catch (e) { throw new Error("the native renderer package (@napi-rs/canvas) is not installed yet — the app runs npm install at startup; press RUN again when the renderer chip is green"); } }
        try { fs.mkdirSync(path.join(HERE, "runtime", "tmp"), { recursive: true }); } catch (e) {}
        var todo = info.specials.filter(function (s) { return j.force || !s.done; });
        return fetchAmbience(j).then(function () { return renderParts(); });
        function renderParts() {
        // the AI sections: every AI item of the auto structure becomes a part too (native sub-pixel pan), reused by the assembler when its recipe matches
        var tRead = ST.readTitle(j.titleFolder), aiTodo = [], aiAll = [];
        if (tRead && tRead.auto) {
            var work = path.join(j.titleFolder, ST.PARTS), cfgR = Object.assign({}, AS.DEF, config.render, { encoder: encoderFor() });
            tRead.auto.items.forEach(function (it) { if (it.kind !== "AI") return; var a = ST.assetsFor(j.titleFolder, it, tRead.bd); if (!a.image) return; it._asset = a; var out = AS.segName(work, it), sig = AS.recipe(it, cfgR), old = ""; try { old = fs.readFileSync(out + ".json", "utf8"); } catch (e) {}
                var part = { ai: true, name: "AI " + ST.aiStem(it.image) + " (pan " + it.pan + ")", item: it, out: out, sig: sig, done: fs.existsSync(out) && old === sig && !j.force }; aiAll.push(part); if (!part.done) aiTodo.push(part); });
        }
        j.total = info.specials.length + aiAll.length; j.done = (info.specials.length - todo.length) + (aiAll.length - aiTodo.length);
        todo = todo.concat(aiTodo);
        if (!todo.length) { log(j, "all " + info.specials.length + " special section(s) already rendered in " + info.outBase); return; }
        return lowResStills(info).then(function (low) {
            if (!low.length) return;
            log(j, low.length + " image(s) on disk are scaled renditions (" + low.map(function (x) { return x.name + " " + x.have + "px of " + x.want; }).join(", ") + ") — fetching the originals for a sharp close-up");
            low.forEach(function (x) { try { fs.unlinkSync(x.still); } catch (e) {} });
            return downloadStills(j.titleFolder, info, function (m) { log(j, m); }, j).then(function () { info = inspect(j.titleFolder, channel, 0, tname); todo = info.specials.filter(function (s) { return j.force || !s.done; }); });
        }).then(function () {
        var nWorkers = config.render.workers | 0; if (!nWorkers) nWorkers = Math.max(1, Math.min(encoderFor() === "nvenc" ? 6 : 4, Math.floor(os.cpus().length / 2)));   // NVENC takes the encode off the CPU → up to 6 parallel sections
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
                    .then(function (r) { fs.renameSync(s.out + ".part.mp4", s.out); fs.writeFileSync(s.out + ".json", s.sig); j.done++; log(j, s.name + " ✓ " + r.frames + " frames in " + r.seconds.toFixed(0) + "s (" + (r.frames / r.seconds).toFixed(1) + " fps)"); })
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
            }).then(function (r) { fs.renameSync(s.out + ".part.mp4", s.out); j.done++; log(j, s.name + " ✓ " + r.frames + " frames in " + r.seconds.toFixed(0) + "s (" + (r.frames / r.seconds).toFixed(1) + " fps, " + (r.capture || "") + ", " + r.encoder + (r.gpu ? ", GPU " + r.gpu.replace(/^ANGLE \(/, "").replace(/\)$/, "").slice(0, 60) : "") + ") → " + s.out); writeLedger(info, s); })
              .catch(function (e) { firstErr = firstErr || e; try { fs.unlinkSync(s.out + ".part.mp4"); } catch (e2) {} })
              .then(worker);
        }
        var pool = []; for (var wI = 0; wI < nWorkers; wI++) pool.push(worker());
        return Promise.all(pool).then(function () { if (firstErr) throw firstErr; });
        });
        }
    }).then(function () { return assembleTitle(j, info); })
      .then(function (r) {
          try { var sc2 = path.join(j.titleFolder, "Script"), dn = listFiles(sc2).filter(function (x) { return /_description\.txt$/i.test(x); })[0]; if (dn) { fs.copyFileSync(path.join(sc2, dn), r.out.replace(/\.mp4$/i, ".txt")); log(j, "description → " + path.basename(r.out.replace(/\.mp4$/i, ".txt")) + " (paste into YouTube; a PINNED COMMENT line, if any, goes in as the first comment)"); } } catch (e) {}
          if (config.render.keepParts === false) { try { fs.rmSync(path.join(j.titleFolder, ST.PARTS), { recursive: true, force: true }); log(j, "parts folder removed (render.keepParts = false)"); } catch (e5) {} }
          j.state = "done"; log(j, "DONE — the whole video: " + r.out + " (" + r.duration.toFixed(1) + " s)"); })
      .catch(function (e) { var m = String(e && e.message || e); j.state = j.abort.aborted ? "killed" : (j.stopped ? "stopped" : "failed"); j.error = m; log(j, (j.abort.aborted ? "KILLED" : (j.stopped ? "STOPPED" : "FAILED")) + " — " + m); try { info.specials.forEach(function (s) { if (fs.existsSync(s.out + ".part.mp4")) fs.unlinkSync(s.out + ".part.mp4"); }); } catch (e2) {} })
      .then(function () { running = false; current = null; setTimeout(tick, 200); });
}
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
function detectEncoder() {
    if (ENC.checked) return Promise.resolve(ENC);
    var cp2 = require("child_process");
    return new Promise(function (resolve) {
        var r = cp2.spawnSync(config.ffmpeg, ["-hide_banner", "-encoders"], { encoding: "utf8", windowsHide: true });
        if (r.status !== 0 || !/h264_nvenc/.test(String(r.stdout || ""))) { ENC = { checked: true, nvenc: false, why: "this ffmpeg build has no h264_nvenc" }; return resolve(ENC); }
        var t = cp2.spawnSync(config.ffmpeg, ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=black:s=256x256:r=30:d=0.5", "-c:v", "h264_nvenc", "-preset", "p5", "-cq", "19", "-f", "null", "-"], { encoding: "utf8", windowsHide: true, timeout: 20000 });
        if (t.status === 0) { var smi = cp2.spawnSync("nvidia-smi", ["--query-gpu=name,memory.total", "--format=csv,noheader"], { encoding: "utf8", windowsHide: true }); ENC = { checked: true, nvenc: true, why: "", gpu: (smi.status === 0 ? String(smi.stdout || "").trim().split(/\r?\n/)[0] : "NVIDIA GPU") }; }
        else ENC = { checked: true, nvenc: false, why: "h264_nvenc test encode failed: " + String(t.stderr || "").trim().split(/\r?\n/).pop() };
        resolve(ENC);
    });
}
function encoderFor() { var want = config.render.encoder || "auto"; if (want === "x264") return "x264"; if (want === "nvenc") return "nvenc"; return ENC.nvenc ? "nvenc" : "x264"; }
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
    health.freesound = !!(secretsJson().freesoundKey);   // Wikimedia User-Agent policy: without a contact the client is capped at 10 requests/minute
    if (fp && (config.ffmpeg === "ffmpeg" || !fs.existsSync(config.ffmpeg))) { config.ffmpeg = fp.ffmpeg; config.ffprobe = fp.ffprobe; FF.configure(config); }
    if (health.ffmpeg && !ENC.checked) return detectEncoder().then(function () { health.encoder = ENC.nvenc ? ("h264_nvenc · " + ENC.gpu) : ("libx264 (CPU) — " + ENC.why); glog("encoder: " + health.encoder); });
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

/* ---- HTTP ------------------------------------------------------------------ */
function send(res, code, obj) { var body = typeof obj === "string" ? obj : JSON.stringify(obj); res.writeHead(code, { "Content-Type": typeof obj === "string" ? "text/plain; charset=utf-8" : "application/json; charset=utf-8", "Cache-Control": "no-store" }); res.end(body); }
function body(req) { return new Promise(function (resolve) { var c = []; req.on("data", function (d) { c.push(d); }); req.on("end", function () { try { resolve(JSON.parse(Buffer.concat(c).toString("utf8") || "{}")); } catch (e) { resolve({}); } }); }); }
var server = http.createServer(function (req, res) {
    var p = url.parse(req.url, true).pathname;
    if (req.method === "GET" && (p === "/" || p === "/index.html")) { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); return fs.createReadStream(path.join(HERE, "ui", "index.html")).pipe(res); }
    if (req.method === "GET" && p === "/api/state") return send(res, 200, { config: config, health: health, running: running, scan: lastScan, jobs: jobs.map(function (j) { var o = Object.assign({}, j); delete o.candidate; o.log = j.log.slice(-3); return o; }) });
    if (req.method === "GET" && p === "/api/titles") return send(res, 200, { output: { root: "", source: "each title's Output\\ folder" }, titles: allTitles().map(function (t) { var o = Object.assign({}, t); delete o.specials; delete o.bd; o.archived = (config.archived || []).indexOf(t.titleFolder) >= 0; o.sections = t.specials.map(function (s) { return { name: s.name, type: s.type, done: s.done, sec: Math.round((s.t1 - s.t0) / 100) / 10 }; }); return o; }) });
    if (req.method === "GET" && p === "/api/logs") return send(res, 200, { file: LOGFILE, lines: GLOG.slice(-600) });
    if (req.method === "GET" && p === "/api/upscaler/workflow") return send(res, 200, { ok: true, workflow: config.upscaler.workflow || UP.WORKFLOW, custom: !!config.upscaler.workflow, defaults: UP.WORKFLOW });
    if (req.method === "GET" && p === "/api/output") return send(res, 200, { root: "", titlesSub: TITLES, source: "title folder (Output\\)" });
    if (req.method === "GET" && /^\/api\/log\//.test(p)) { var j = jobs.filter(function (x) { return x.id === p.split("/").pop(); })[0]; return send(res, j ? 200 : 404, j ? { id: j.id, log: j.log } : { error: "no such job" }); }
    if (req.method === "POST" && p === "/api/health") return checkHealth().then(function () { send(res, 200, health); });
    if (req.method === "POST" && p === "/api/provision") { provision("requested from the UI"); return send(res, 200, { ok: true, status: PV.status() }); }
    return body(req).then(function (b) {
        if (req.method !== "POST") return send(res, 404, "not found");
        switch (p) {
            case "/api/download": { var dj = enqueueDownload(b.titleFolder); return send(res, 200, { ok: !!dj, job: dj ? dj.id : null }); }
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
            case "/api/ai/import": { return send(res, 200, importAiImages(b.titleFolder, b.from)); }
            case "/api/upscaler/workflow": { if (b.reset) { config.upscaler.workflow = null; saveCfg(config); return send(res, 200, { ok: true, workflow: UP.WORKFLOW, custom: false }); } if (b.workflow) { config.upscaler.workflow = b.workflow; saveCfg(config); return send(res, 200, { ok: true, workflow: b.workflow, custom: true }); } return send(res, 200, { ok: true, workflow: config.upscaler.workflow || UP.WORKFLOW, custom: !!config.upscaler.workflow, defaults: UP.WORKFLOW }); }
            case "/api/upscale": { var ju = enqueueUpscale(b.titleFolder); return send(res, 200, { ok: !!ju, id: ju && ju.id, skip: ju ? "" : "already queued or running" }); }
            case "/api/sfx/fetch": { var tS = ST.readTitle(b.titleFolder); if (!tS.sfx) return send(res, 400, { error: "no _sfx.json in the package yet" });
                var jS = enqueueTask("sfx", path.basename(b.titleFolder) + " · ambience", b.titleFolder, function (j) { return fetchAmbience(j).then(function () { return { summary: j.done + "/" + j.total + " sound(s) in place" }; }); });
                return send(res, 200, { ok: !!jS, queued: !!jS, skip: jS ? "" : "already queued or running" }); }
            case "/api/stop": { if (current) { current.abort.soft = true; log(current, "stop requested — finishing the current step"); if (current.dlHandle) current.dlHandle.cancel(); } return send(res, 200, { ok: !!current }); }
            case "/api/kill": { if (current) { current.abort.aborted = true; log(current, "KILL requested — aborting now"); if (current.dlHandle) current.dlHandle.cancel(); } jobs.forEach(function (x) { if (x.state === "queued") x.state = "cancelled"; }); return send(res, 200, { ok: true }); }
            case "/api/render": { var j = enqueue(b.titleFolder, !!b.force); return send(res, 200, { ok: !!j, job: j ? j.id : null }); }
            case "/api/render-all": { var arch = config.archived || []; var n = 0; allTitles().forEach(function (t) { if (t.ready && !t.finished && arch.indexOf(t.titleFolder) < 0 && (b.force || t.rendered < t.total)) { if (enqueue(t.titleFolder, !!b.force)) n++; } }); return send(res, 200, { ok: true, queued: n }); }
            case "/api/archive": { var list = (config.archived || []).filter(function (x) { return x !== b.titleFolder; }); if (b.on !== false) list.push(b.titleFolder); config.archived = list; saveCfg(config); return send(res, 200, { ok: true, archived: b.on !== false, count: list.length }); }
            case "/api/unpack": { try { var up2 = unpackPackage(b.titleFolder); return send(res, up2.ok ? 200 : 400, up2); } catch (e) { return send(res, 500, { error: e.message }); } }
            case "/api/open": if (b.path && fs.existsSync(b.path)) open(b.path); return send(res, 200, { ok: true });
            case "/api/remove": jobs = jobs.filter(function (j) { return j.id !== b.id || j.state === "running"; }); return send(res, 200, { ok: true });
            case "/api/config": { var oldBase = config.base; config = deepMerge(config, b.config || {}); saveCfg(config); config = loadCfg(); FF.configure(config); if (config.base !== oldBase) { TREE = healBase(function (m) { glog(m); }); glog("base changed: " + oldBase + " → " + config.base); whisperCheck(true); } return checkHealth().then(function () { send(res, 200, { ok: true, config: config, health: health, tree: TREE }); }); }
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
    server.listen(config.port, "127.0.0.1", function () {
        console.log("RUVI STUDIO 3.12  →  http://localhost:" + config.port);
        console.log("  tree: " + config.base + "\\<CHANNEL>\\Titles\\<n. Title>\\{Script, Hook, Maps, Reference images, Characters, AI Images, Output}  ·  ambience: <base>\\_SFX\\ (shared by every channel; a channel's own SFX\\ overrides)");
        console.log("  base: " + config.base + (health.base ? "" : "  (NOT FOUND — edit studio.config.json)"));
        console.log("  ffmpeg: " + (health.ffmpeg || "NOT FOUND — downloading a static build into runtime\\ffmpeg"));
        console.log("  engine: " + (config.render.engine || "native") + ((config.render.engine || "native") === "chrome" ? ("  chrome: " + (health.chrome || "NOT FOUND — downloading Chrome for Testing")) : "  (Skia + ffmpeg perspective — no browser needed)"));
        console.log("  puppeteer-core: " + (health.puppeteer ? "ok" : "MISSING — installing"));
        console.log("  whisper: " + (health.whisper || "not installed — building the runtime (uv → Python 3.11 → whisper-ctranslate2" + (PV.hasNvidia() ? " + CUDA 12 libs" : "") + ")"));
        if (process.argv.indexOf("--all") >= 0) allTitles().forEach(function (t) { if (t.ready && t.rendered < t.total) enqueue(t.titleFolder, false); });
    });
});
