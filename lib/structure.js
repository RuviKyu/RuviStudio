/* ============================================================================
   lib/structure.js — RUVI Conductor · reads the writing-room files the way the
   Studio engines do:
     • the FULL breakdown          [Subject]_breakdown.txt   (sections, types, TIMECODEs, links)
     • the AUTO video structure    [Subject]_auto_video_structure.txt (Video_AutoStructure.md)
   and exposes the timeline the assembler plays: special sections (HOOK/MAP/REF/CHAR,
   rendered by After Effects) and AI sub-sections (Ken Burns on Assets\n.jpg).
   Pure functions; no I/O except readTitle().
   ========================================================================== */
"use strict";
var fs = require("fs"), path = require("path");

var SECTION_HDR = /^SECTION\s+(\d+)\s*\|\s*(\d+)\s*words\s*\|\s*(.+?)\s*$/;
var TIMECODE = /TIMECODE:\s*(\d\d):(\d\d):(\d\d)\.(\d{3})\s*(?:→|->)\s*(\d\d):(\d\d):(\d\d)\.(\d{3})/;
var AUTO_HDR = /^AUTO\s+(\d+)\s*\|\s*(.+?)\s*$/;

function ms(h, m, s, f) { return ((Number(h) * 60 + Number(m)) * 60 + Number(s)) * 1000 + Number(f); }
function hms(t) { t = Math.max(0, Math.round(t)); var f = t % 1000, s = Math.floor(t / 1000) % 60, m = Math.floor(t / 60000) % 60, h = Math.floor(t / 3600000); function p(n, w) { return String(n).padStart(w || 2, "0"); } return p(h) + ":" + p(m) + ":" + p(s) + "." + p(f, 3); }
function baseType(label) { return String(label || "").split(/\s+/)[0].toUpperCase(); }

/* ---- the FULL breakdown ------------------------------------------------- */
function parseBreakdown(text) {
    var lines = String(text).split(/\r?\n/), secs = [], cur = null, header = { channel: "", suffix: "", title: "" };
    for (var i = 0; i < lines.length; i++) {
        var l = lines[i], m = SECTION_HDR.exec(l);
        if (m) { cur = { num: +m[1], words: +m[2], label: m[3], type: baseType(m[3]), t0: null, t1: null, script: "", mapSubject: "", link: "", lines: [] }; secs.push(cur); continue; }
        if (!cur) {
            if (/^CHANNEL:\s*/.test(l)) header.channel = l.replace(/^CHANNEL:\s*/, "").trim();
            else if (/^STYLE SUFFIX:\s*/.test(l)) header.suffix = l.replace(/^STYLE SUFFIX:\s*/, "").trim().replace(/^"|"$/g, "");
            else if (/^HISTORY MAPS CHANNELS\s+—\s+/.test(l)) header.title = l.replace(/^HISTORY MAPS CHANNELS\s+—\s+/, "").trim();
            continue;
        }
        cur.lines.push(l);
        var t = TIMECODE.exec(l);
        if (t) { cur.t0 = ms(t[1], t[2], t[3], t[4]); cur.t1 = ms(t[5], t[6], t[7], t[8]); continue; }
        if (/^MAP SUBJECT:/.test(l)) cur.mapSubject = l.replace(/^MAP SUBJECT:\s*/, "").trim();
        var lk = /^\s*(LINK|REF\/MAP LINK 1|REFERENCE):\s*(\S+)/.exec(l);
        if (lk && !cur.link) cur.link = lk[2];
    }
    // SCRIPT paragraph: from the line after "SCRIPT:" to the first blank line (MAP SUBJECT excluded)
    secs.forEach(function (s) {
        var k = s.lines.indexOf("SCRIPT:"); if (k < 0) return;
        var out = [];
        for (var j = k + 1; j < s.lines.length; j++) { var ln = s.lines[j]; if (!ln.trim() || /^MAP SUBJECT:/.test(ln)) break; out.push(ln); }
        s.script = out.join("\n");
    });
    // type-ordinal file names (HOOK 1 / MAP n / REF n / CHAR n), the Studio's canonical asset names
    var cnt = { MAP: 0, REF: 0, CHAR: 0 };
    secs.forEach(function (s) {
        if (s.type === "HOOK") s.ordinal = 1;
        else if (cnt[s.type] != null) { cnt[s.type]++; s.ordinal = cnt[s.type]; }
        s.assetStem = (s.type === "AI") ? "" : (s.type + " " + s.ordinal);
    });
    return { header: header, sections: secs, durationMs: secs.length ? secs[secs.length - 1].t1 : 0 };
}

/* ---- the AUTO video structure ------------------------------------------ */
/* Grammar (Video_AutoStructure.md):
   ----------------------------------------
   AUTO 003 | from SECTION 2 (AI 1) | part 1/2 | AI IMAGE 1
   ----------------------------------------
   TIMECODE: 00:00:27.550 → 00:00:41.200 (13.65s)
   PAN: NE
   PROMPT:
   <one prompt>

   Special sections keep their identity:
   AUTO 001 | SECTION 1 (HOOK) | RENDER: S001_HOOK
*/
var PANS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
function parseAutoStructure(text) {
    var lines = String(text).split(/\r?\n/), items = [], cur = null, meta = {};
    for (var i = 0; i < lines.length; i++) {
        var l = lines[i], m = AUTO_HDR.exec(l);
        if (m) {
            var rest = m[2], it = { auto: +m[1], kind: "", section: null, part: "", image: null, render: "", pan: "", t0: null, t1: null, prompt: "" };
            var f = /from\s+SECTION\s+(\d+)\s*\((AI)\s*(\d+)?\)\s*\|\s*part\s+(\d+)\/(\d+)\s*\|\s*AI IMAGE\s+(\d+)/i.exec(rest);
            var g = /SECTION\s+(\d+)\s*\((HOOK|MAP|REF|CHAR)(?:\s+\d+)?\)\s*\|\s*RENDER:\s*(\S+)/i.exec(rest);
            if (f) { it.kind = "AI"; it.section = +f[1]; it.part = f[4] + "/" + f[5]; it.image = +f[6]; }
            else if (g) { it.kind = g[2].toUpperCase(); it.section = +g[1]; it.render = g[3]; }
            else it.kind = "?";
            cur = it; items.push(it); continue;
        }
        if (!cur) {
            var mm = /^([A-Z ]+):\s*(.+)$/.exec(l); if (mm) meta[mm[1].trim()] = mm[2].trim();
            continue;
        }
        var t = TIMECODE.exec(l);
        if (t) { cur.t0 = ms(t[1], t[2], t[3], t[4]); cur.t1 = ms(t[5], t[6], t[7], t[8]); continue; }
        if (/^PAN:/.test(l)) { cur.pan = l.replace(/^PAN:\s*/, "").trim().toUpperCase(); continue; }
        if (l === "PROMPT:") { var out = []; for (var j = i + 1; j < lines.length; j++) { if (AUTO_HDR.test(lines[j]) || /^-{10,}$/.test(lines[j]) && AUTO_HDR.test(lines[j + 1] || "")) break; out.push(lines[j]); } cur.prompt = out.join("\n").replace(/\n{2,}$/, "").trim(); }
    }
    return { meta: meta, items: items, durationMs: items.length ? items[items.length - 1].t1 : 0 };
}

/* ---- validation (mirrors auto_structure_lint.py) ----------------------- */
function validateAuto(auto, bd, opts) {
    opts = opts || {}; var E = [], W = [];
    var items = auto.items, minS = (opts.minAiSec || 10) * 1000, maxS = (opts.maxAiSec || 20) * 1000;
    var expectImg = 1, prevPan = "";
    items.forEach(function (it, i) {
        var id = "AUTO " + String(it.auto).padStart(3, "0");
        if (it.kind === "?") E.push(id + ": unreadable header");
        if (it.t0 == null || it.t1 == null) E.push(id + ": missing TIMECODE");
        if (i && items[i - 1].t1 != null && it.t0 != null && Math.abs(items[i - 1].t1 - it.t0) > 1) E.push(id + ": gap/overlap with the previous item");
        if (it.kind === "AI") {
            var d = it.t1 - it.t0;
            if (d < minS - 500 || d > maxS + 2500) W.push(id + ": AI sub-section is " + (d / 1000).toFixed(2) + "s (want " + opts.minAiSec + "–" + opts.maxAiSec + "; a whole ~20 s section may run to 22.5)");
            if (PANS.indexOf(it.pan) < 0) E.push(id + ": PAN must be one of " + PANS.join("/"));
            if (it.pan && it.pan === prevPan) E.push(id + ": same PAN as the previous AI sub-section");
            prevPan = it.pan;
            if (it.image !== expectImg) E.push(id + ": AI IMAGE " + it.image + " (expected " + expectImg + " — images are numbered in running order)");
            expectImg = Math.max(expectImg, (it.image || 0) + 1);
            if (!it.prompt) E.push(id + ": missing PROMPT");
            else if (bd && bd.header.suffix && it.prompt.indexOf(bd.header.suffix) < 0) E.push(id + ": PROMPT does not end with the channel STYLE SUFFIX");
        } else if (it.kind !== "?") {
            prevPan = "";
            var sec = bd && bd.sections.filter(function (s) { return s.num === it.section; })[0];
            if (!sec) E.push(id + ": SECTION " + it.section + " is not in the breakdown");
            else {
                if (sec.type !== it.kind) E.push(id + ": type " + it.kind + " but SECTION " + it.section + " is " + sec.type);
                if (sec.t0 != null && (Math.abs(sec.t0 - it.t0) > 1 || Math.abs(sec.t1 - it.t1) > 1)) E.push(id + ": TIMECODE differs from the breakdown's SECTION " + it.section);
                var want = "S" + String(sec.num).padStart(3, "0") + "_" + sec.type + (sec.type === "HOOK" ? "" : sec.ordinal);
                if (it.render !== want) E.push(id + ": RENDER must be " + want);
            }
        }
    });
    if (bd) {
        // every breakdown AI section must be fully covered by its parts; every special present once
        bd.sections.forEach(function (s) {
            var parts = items.filter(function (it) { return it.section === s.num; });
            if (!parts.length) { E.push("SECTION " + s.num + " (" + s.type + ") has no AUTO item"); return; }
            if (s.type === "AI") {
                var t0 = Math.min.apply(null, parts.map(function (p) { return p.t0; })), t1 = Math.max.apply(null, parts.map(function (p) { return p.t1; }));
                if (Math.abs(t0 - s.t0) > 1 || Math.abs(t1 - s.t1) > 1) E.push("SECTION " + s.num + " (AI): its parts do not cover its TIMECODE exactly");
            } else if (parts.length !== 1) E.push("SECTION " + s.num + " (" + s.type + ") appears " + parts.length + " times");
        });
        if (auto.durationMs && bd.durationMs && Math.abs(auto.durationMs - bd.durationMs) > 1) E.push("AUTO structure ends at " + hms(auto.durationMs) + " but the breakdown ends at " + hms(bd.durationMs));
    }
    return { errors: E, warnings: W, aiImages: items.filter(function (it) { return it.kind === "AI"; }).length };
}

/* ---- the Studio's folder tree ------------------------------------------- */
var FOLDER = { HOOK: "Hook", MAP: "Maps", REF: "Reference images", CHAR: "Characters", AI: "AI Images" };   // AI Images\001.jpg … (one per 20-s AI section, in order)
var PARTS = path.join("Output", "parts");                                                                 // rendered section parts live here; the finished video in Output\
function findFile(dir, stem, exts) {
    var names; try { names = fs.readdirSync(dir); } catch (e) { return ""; }
    var want = String(stem).toLowerCase();
    for (var i = 0; i < names.length; i++) {
        var n = names[i], m = /^(.*)\.([a-z0-9]{2,5})$/i.exec(n);
        if (!m) continue;
        if (m[1].toLowerCase() === want && (!exts || exts.indexOf(m[2].toLowerCase()) >= 0)) return path.join(dir, n);
    }
    return "";
}
function readTitle(titleFolder) {
    var script = path.join(titleFolder, "Script"), names = [];
    try { names = fs.readdirSync(script); } catch (e) { return { error: "no Script folder in " + titleFolder }; }
    function pick(re) { var hits = names.filter(function (n) { return re.test(n); }); return hits.length ? path.join(script, hits.sort()[0]) : ""; }
    var bdPath = pick(/_breakdown\.txt$/i) || pick(/breakdown.*\.txt$/i);
    var autoPath = pick(/_auto_video_structure\.txt$/i);
    var remixPath = pick(/_music_remix\.json$/i), sfxPath = pick(/_sfx\.json$/i);
    var subject = bdPath ? path.basename(bdPath).replace(/_breakdown\.txt$/i, "") : "";
    var out = { titleFolder: titleFolder, subject: subject, breakdownPath: bdPath, autoPath: autoPath, remixPath: remixPath, sfxPath: sfxPath, voPath: "", bd: null, auto: null, remix: null, sfx: null, errors: [] };
    if (!bdPath) { out.errors.push("no FULL breakdown in Script\\"); return out; }
    out.bd = parseBreakdown(fs.readFileSync(bdPath, "utf8"));
    var mp3 = names.filter(function (n) { return /\.mp3$/i.test(n); }).map(function (n) { return path.join(script, n); }).sort(function (a, b) { return fs.statSync(b).size - fs.statSync(a).size; });
    out.voPath = mp3[0] || "";
    if (autoPath) out.auto = parseAutoStructure(fs.readFileSync(autoPath, "utf8"));
    else out.errors.push("no " + subject + "_auto_video_structure.txt in Script\\ (Video_AutoStructure.md)");
    if (remixPath) { try { out.remix = JSON.parse(fs.readFileSync(remixPath, "utf8")); } catch (e2) { out.errors.push("music remix JSON unreadable: " + e2.message); } }
    if (sfxPath) { try { out.sfx = JSON.parse(fs.readFileSync(sfxPath, "utf8")); } catch (e3) { out.errors.push("ambience JSON unreadable: " + e3.message); } }
    return out;
}
function aiStem(n) { return String(n).padStart(3, "0"); }
/* "001_painted.jpg", "001-upscaled.png", "001 (2).jpg": the three-digit index followed by a non-digit — bulk tools and upscalers add suffixes */
function findPrefixed(dir, stem, exts) {
    var names; try { names = fs.readdirSync(dir); } catch (e) { return ""; }
    var re = new RegExp("^" + stem + "(?![0-9]).*\\.(" + exts.join("|") + ")$", "i"), hits = names.filter(function (n) { return re.test(n); }).sort();
    return hits.length ? path.join(dir, hits[0]) : "";
}
function assetsFor(titleFolder, item, bd) {
    if (item.kind === "AI") { var d = path.join(titleFolder, FOLDER.AI); return { image: findFile(d, aiStem(item.image), ["jpg", "jpeg", "png", "webp"]) || findPrefixed(d, aiStem(item.image), ["jpg", "jpeg", "png", "webp"]) || findFile(d, String(item.image), ["jpg", "jpeg", "png", "webp"]) }; }
    var renders = path.join(titleFolder, PARTS);
    return { render: findFile(renders, item.render, ["mov", "mp4", "avi", "mkv"]), still: findFile(path.join(titleFolder, FOLDER[item.kind]), item.kind + " " + (bd ? (bd.sections.filter(function (s) { return s.num === item.section; })[0] || {}).ordinal : ""), null) };
}

module.exports = { parseBreakdown: parseBreakdown, parseAutoStructure: parseAutoStructure, validateAuto: validateAuto, readTitle: readTitle, assetsFor: assetsFor, findFile: findFile, aiStem: aiStem, FOLDER: FOLDER, PARTS: PARTS, PANS: PANS, hms: hms };
