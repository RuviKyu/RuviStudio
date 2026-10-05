/* ============================================================================
   lib/sfx.js — the ambience beds (replaces the music bed).
   The writing room plans CUES in [Subject]_sfx.json: which ambience (by words:
   "ocean waves shore", "medieval market crowd", "jungle night insects"), which
   sections it covers, how faint relative to the bed target, and a note.
   This module:
     resolve   — a sound for each cue: first a file already in <CHANNEL>\SFX\ whose
                 tags match the words (nothing is downloaded twice), else Freesound
                 (CC0, ≥ minSec long, the Freesound API key from _SECRETS\secrets.json),
                 else the bundled Commons catalog; downloaded files are cached in SFX\
     analyze   — duration + integrated loudness (LUFS) per file, cached in SFX\_index.json,
                 so every sound can be balanced to the same faint target
     render    — the bed: for every cue a SLICE of the long file (a start offset chosen
                 so the slice fits; a short file plays once, never looped on repeat),
                 gain to the target, fade in / out, laid on the narration timeline, gaps
                 inserted where the CTAs sit, summed, limited; written as a wav
   ========================================================================== */
"use strict";
var fs = require("fs"), path = require("path"), https = require("https"), http = require("http"), spawn = require("child_process").spawn;
var FF = require("./ffmpeg.js");

var DEF = { targetLufs: -31, ceilingLufs: -26, fadeIn: 2.0, fadeOut: 2.5, minSec: 45, loopMinSec: 40, duckDb: 2.5, breathDb: 1.5, breathSec: 100 };
function slug(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function words(s) { return slug(s).split(" ").filter(function (w) { return w.length > 2 && ["the", "and", "with", "sound", "sounds", "ambience", "ambient", "loop", "sfx"].indexOf(w) < 0; }); }
function listFiles(d) { try { return fs.readdirSync(d); } catch (e) { return []; } }
function readJson(p, dflt) { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch (e) { return dflt; } }
var AUDIO_RE = /\.(mp3|wav|ogg|oga|flac|m4a|aac|opus)$/i;

/* ---- the SFX folder index: file → tags, duration, lufs -------------------- */
function indexPath(dir) { return path.join(dir, "_index.json"); }
function loadIndex(dir) { var ix = readJson(indexPath(dir), { files: {} }); if (!ix.files) ix.files = {}; return ix; }
function saveIndex(dir, ix) { try { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(indexPath(dir), JSON.stringify(ix, null, 1)); } catch (e) {} }
function measure(file) {
    // integrated loudness (LUFS) and duration via ffmpeg's ebur128 — the balancing reference for every sound
    return new Promise(function (resolve) {
        var p = spawn(FF.CFG.ffmpeg, ["-hide_banner", "-nostats", "-i", file, "-filter_complex", "ebur128=peak=true", "-f", "null", "-"], { windowsHide: true }), err = "";
        p.stderr.on("data", function (d) { err = (err + d.toString()).slice(-20000); }); p.on("error", function () { resolve(null); });
        p.on("close", function () { var m = /Integrated loudness:[\s\S]*?I:\s*(-?[\d.]+) LUFS/.exec(err), tp = /True peak:[\s\S]*?Peak:\s*(-?[\d.]+) dBFS/.exec(err); FF.probe(file).then(function (pi) { resolve({ lufs: m ? +m[1] : null, truePeak: tp ? +tp[1] : null, duration: pi.duration || 0 }); }, function () { resolve({ lufs: m ? +m[1] : null, truePeak: tp ? +tp[1] : null, duration: 0 }); }); });
    });
}
function analyzeDir(dir, log) {
    var ix = loadIndex(dir), chain = Promise.resolve(), changed = false;
    listFiles(dir).filter(function (f) { return AUDIO_RE.test(f); }).forEach(function (f) {
        chain = chain.then(function () {
            var fp = path.join(dir, f), st = fs.statSync(fp), rec = ix.files[f];
            if (rec && rec.size === st.size && rec.mtimeMs === st.mtimeMs && rec.lufs != null) return;
            if (log) log("sfx: measuring " + f);
            return measure(fp).then(function (m) { ix.files[f] = Object.assign({}, rec || {}, { size: st.size, mtimeMs: st.mtimeMs, duration: m ? m.duration : 0, lufs: m ? m.lufs : null, truePeak: m ? m.truePeak : null, tags: (rec && rec.tags) || words(f.replace(AUDIO_RE, "")) }); changed = true; });
        });
    });
    Object.keys(ix.files).forEach(function (f) { if (!fs.existsSync(path.join(dir, f))) { delete ix.files[f]; changed = true; } });
    return chain.then(function () { if (changed) saveIndex(dir, ix); return ix; });
}
/* several folders as one library: the first folder wins on a name clash (a channel's own SFX\ overrides the shared _SFX\) */
function analyzeDirs(dirs, log) { var merged = { files: {} }, chain = Promise.resolve(); dirs.filter(Boolean).forEach(function (d) { chain = chain.then(function () { return analyzeDir(d, log).then(function (ix) { Object.keys(ix.files).forEach(function (f) { if (!merged.files[f]) merged.files[f] = Object.assign({ dir: d }, ix.files[f]); }); }); }); }); return chain.then(function () { return merged; }); }
function quickIndexes(dirs) { var merged = { files: {} }; dirs.filter(Boolean).forEach(function (d) { var ix = quickIndex(d); Object.keys(ix.files).forEach(function (f) { if (!merged.files[f]) merged.files[f] = Object.assign({ dir: d }, ix.files[f]); }); }); return merged; }
function catalogDirs(dirs) { var out = [], seen = {}; dirs.filter(Boolean).forEach(function (d) { catalog(d).forEach(function (e) { if (seen[e.file]) return; seen[e.file] = 1; e.folder = path.basename(d); out.push(e); }); }); return out; }
/* the catalogue the writing room sees: file, seconds, tags, licence/credit */
function quickIndex(dir) { var ix = loadIndex(dir); Object.keys(ix.files).forEach(function (f) { if (!fs.existsSync(path.join(dir, f))) delete ix.files[f]; }); listFiles(dir).filter(function (f) { return AUDIO_RE.test(f); }).forEach(function (f) { if (!ix.files[f]) ix.files[f] = { tags: words(f.replace(AUDIO_RE, "")), duration: 999, unmeasured: true }; }); return ix; }
function catalog(dir) { var ix = loadIndex(dir), out = []; Object.keys(ix.files).sort().forEach(function (f) { var r = ix.files[f]; out.push({ file: f, seconds: Math.round(r.duration || 0), tags: r.tags || [], license: r.license || "", credit: r.credit || "", source: r.source || "" }); }); return out; }

/* ---- resolving a cue to a file ------------------------------------------- */
function scoreTags(want, have) { var h = {}; (have || []).forEach(function (t) { h[t] = 1; }); var hit = 0; want.forEach(function (w) { if (h[w]) hit++; else if ((have || []).some(function (t) { return t.indexOf(w) === 0 || w.indexOf(t) === 0; })) hit += 0.6; }); return want.length ? hit / want.length : 0; }
function localMatch(dir, ix, want, minSec) {
    var best = null, bs = 0;
    Object.keys(ix.files).forEach(function (f) { var r = ix.files[f], s = scoreTags(want, r.tags); if (s >= 0.5 && (r.duration || 0) >= Math.min(minSec, 20) && (s > bs || (s === bs && (r.duration || 0) > (best ? ix.files[best].duration : 0)))) { bs = s; best = f; } });
    return best ? { file: best, score: bs } : null;
}
/* every fetch goes through the image engine (lib/studio/navdl.js): identical pacing, 429 handling, walls, rounds, User-Agent */
function download(u, dest, hooks) {
    var NAV = require("./studio/navdl.js");
    return NAV.downloadUrls([{ url: u, dest: dest, label: path.basename(dest) }], hooks || {}).then(function (r) { if (r.results[u] || fs.existsSync(dest)) return dest; throw new Error(r.permanent ? "permanent failure (bad link or not a file)" : (r.gaveUp ? "gave up after repeated rounds" : (r.cancelled ? "cancelled" : "not fetched"))); });
}
function httpJson(u, headers) {
    return new Promise(function (resolve, reject) {
        https.get(u, { headers: Object.assign({ "User-Agent": "RuviStudio/3.4 (ambience)" }, headers || {}) }, function (res) { var b = ""; res.setEncoding("utf8"); res.on("data", function (c) { b += c; }); res.on("end", function () { if (res.statusCode !== 200) return reject(new Error("HTTP " + res.statusCode + " " + b.slice(0, 120))); try { resolve(JSON.parse(b)); } catch (e) { reject(e); } }); }).on("error", reject);
    });
}
/* Freesound: CC0 sounds that match the words. The text search ANDs every word, so "archive room clock ticking paper" finds nothing as
   written; the search degrades on its own: all words → minus the last → the first two → the most distinctive word + "ambience" →
   that word alone, and the length floor relaxes 45 → 20 → 10 s on the later tries. Returns the hit and the words it matched on. */
var GENERIC = ["ambience", "ambient", "sound", "sounds", "loop", "noise", "distant", "night", "day", "old", "room", "wooden", "heavy", "soft", "light"];
function freesoundSearch(key, q, minSec) {
    var filter = encodeURIComponent('license:"Creative Commons 0" duration:[' + minSec + ' TO 3600]');
    var u = "https://freesound.org/apiv2/search/text/?query=" + encodeURIComponent(q) + "&filter=" + filter + "&fields=id,name,duration,avg_rating,num_ratings,license,username,previews,tags&sort=rating_desc&page_size=15&token=" + key;
    return httpJson(u).then(function (r) { return (r.results || []).filter(function (s) { return s.previews && (s.previews["preview-hq-mp3"] || s.previews["preview-lq-mp3"]); }); });
}
function freesoundFind(key, want, minSec) {
    var variants = [], w = want.slice(); if (w.length) variants.push(w.join(" "));
    if (w.length > 2) variants.push(w.slice(0, -1).join(" ")); if (w.length > 2) variants.push(w.slice(0, 2).join(" "));
    var distinct = w.filter(function (x) { return GENERIC.indexOf(x) < 0; }).sort(function (a, b) { return b.length - a.length; })[0] || w[0];
    if (distinct) { variants.push(distinct + " ambience"); variants.push(distinct); }
    var tries = []; variants.forEach(function (q, i) { tries.push({ q: q, min: i < 2 ? minSec : (i < 4 ? Math.min(minSec, 20) : 10) }); });
    var seen = {}; tries = tries.filter(function (t) { var k = t.q + "|" + t.min; if (seen[k]) return false; seen[k] = 1; return true; });
    var chain = Promise.resolve(null);
    tries.forEach(function (t) { chain = chain.then(function (hit) { if (hit) return hit; return freesoundSearch(key, t.q, t.min).then(function (list) {
        if (!list.length) return null;
        list.sort(function (a, b) { return (scoreTags(want, (b.tags || []).concat(words(b.name))) * 2 + Math.min(1, (b.duration || 0) / 600) + (b.avg_rating || 0) / 5) - (scoreTags(want, (a.tags || []).concat(words(a.name))) * 2 + Math.min(1, (a.duration || 0) / 600) + (a.avg_rating || 0) / 5); });
        var s = list[0]; return { url: s.previews["preview-hq-mp3"] || s.previews["preview-lq-mp3"], name: "fs" + s.id + " " + slug(s.name).replace(/ /g, "_").slice(0, 50) + ".mp3", license: s.license, credit: s.username + " (Freesound #" + s.id + ")", source: "freesound (" + t.q + ")", duration: s.duration, tags: want.concat(words(s.name)) };
    }); }); });
    return chain;
}
function resolveCue(opts, cue, ix) {
    // opts: { dir, freesoundKey, catalog (bundled commons list), minSec, log }
    var want = words(cue.sound), log = opts.log || function () {}, minSec = opts.minSec || DEF.minSec;
    if (cue.file && ix.files[cue.file]) return Promise.resolve({ file: cue.file });
    var local = localMatch(opts.dir, ix, want, minSec) || localMatch(opts.dir, ix, want, 3); if (local) return Promise.resolve({ file: local.file });   // a short local match still beats nothing (it plays once)
    var tries = Promise.resolve(null);
    if (cue.url) tries = tries.then(function () { var name = slug(path.basename(cue.url).replace(/\.[a-z0-9]+$/i, "")).replace(/ /g, "_").slice(0, 60) + (path.extname(cue.url) || ".mp3"); return { url: cue.url, name: name, license: cue.license || "", credit: cue.credit || "", source: "cue", tags: want }; });
    if (opts.freesoundKey) tries = tries.then(function (h) { return h || freesoundFind(opts.freesoundKey, want, minSec).catch(function (e) { log("sfx: freesound: " + e.message); return null; }); });
    var FALLBACK = [[/sea|ocean|wave|surf|shore|beach|swell|lapping/, "ocean waves"], [/harbou?r|dock|port|gull/, "harbour seagulls"], [/ship|rigging|sail|hull|deck|oar/, "wooden ship creaking"], [/jungle|insect|frog|cricket/, "jungle insects"], [/forest|wood|birds|leaves/, "forest birds"], [/wind|blizzard|storm|tundra|arctic/, "wind"], [/rain|drizzle/, "rain"], [/thunder/, "thunder"], [/fire|campfire|crackl/, "fire crackling"], [/cave|drip|echo|cavern/, "cave"], [/river|stream|brook|creek/, "river"], [/lake|water/, "lake water"], [/market|crowd|village|town|street|voices|murmur|tavern|inn/, "crowd murmur"], [/church|cathedral|hall|stone|interior/, "church interior"], [/clock|archive|paper|room/, "room tone clock"], [/horse|cart|cobble/, "horse cart"], [/train|steam/, "steam train"], [/cannon|battle|musket|sword|fight/, "battle"], [/snow|ice/, "wind snow"], [/desert|sand/, "desert wind"]];
    if (opts.freesoundKey) tries = tries.then(function (h) { if (h) return h; var fb = FALLBACK.filter(function (f) { return f[0].test(want.join(" ")); })[0]; if (!fb) return null; log("sfx: \u201c" + cue.sound + "\u201d — nothing specific; falling back to \u201c" + fb[1] + "\u201d"); return freesoundFind(opts.freesoundKey, words(fb[1]), 20).catch(function () { return null; }); });
    tries = tries.then(function (h) { if (h) return h; var c = (opts.catalog || []).map(function (e) { return { e: e, s: scoreTags(want, e.tags || []) }; }).filter(function (x) { return x.s >= 0.5; }).sort(function (a, b) { return b.s - a.s; })[0]; return c ? { url: c.e.url, name: c.e.file, license: c.e.license, credit: c.e.credit, source: "commons", tags: c.e.tags } : null; });
    return tries.then(function (h) {
        if (!h) { log("sfx: nothing found for \u201c" + cue.sound + "\u201d" + (opts.freesoundKey ? " on Freesound even with simpler words — drop a long recording into SFX\\ with those words in its name" : " — add a Freesound key (secrets.json: freesoundKey) or drop a recording into SFX\\ with those words in its name")); return null; }
        var dest = path.join(opts.dir, h.name); if (fs.existsSync(dest)) return { file: h.name };
        log("sfx: fetching \u201c" + cue.sound + "\u201d ← " + h.source + " · " + h.name);
        return download(h.url, dest, { log: log, contact: opts.contact, abort: opts.abort }).then(function () { var own = loadIndex(opts.dir); own.files[h.name] = { tags: h.tags, license: h.license || "", credit: h.credit || "", source: h.source, url: h.url }; saveIndex(opts.dir, own); ix.files[h.name] = Object.assign({ dir: opts.dir }, own.files[h.name]); return { file: h.name }; })
            .catch(function (e) { log("sfx: download failed for \u201c" + cue.sound + "\u201d: " + e.message); return null; });
    });
}

/* ---- the bed ------------------------------------------------------------- */
function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
/* cues (narration ms) → the timeline with the CTA gaps: a cue spanning an insert point is split, the gap left silent */
function mapToTimeline(fromMs, toMs, inserts) {
    var segs = [], a = fromMs, shift = 0, list = (inserts || []).slice().sort(function (x, y) { return x.atMs - y.atMs; });
    list.forEach(function (ins) { if (ins.atMs <= a) { shift += ins.durationMs; return; } if (ins.atMs >= toMs) return; segs.push({ start: a + shift, end: ins.atMs + shift }); a = ins.atMs; shift += ins.durationMs; });
    segs.push({ start: a + shift, end: toMs + shift }); return segs.filter(function (s) { return s.end - s.start > 500; });
}
function renderBed(opts, cues, outWav) {
    // opts: { dir, ix, totalSec, inserts, targetLufs, ceilingLufs, fadeIn, fadeOut, loopMinSec, log }
    var P = Object.assign({}, DEF, opts), log = P.log || function () {}, inputs = [], filters = [], mixIn = [], n = 0, placed = [];
    cues.forEach(function (c, ci) {
        if (!c.file) return; var rec = P.ix.files[c.file]; if (!rec) return;
        var fp = path.join(rec.dir || P.dir, c.file), dur = rec.duration || 0, lufs = (rec.lufs != null) ? rec.lufs : -23;
        var gain = (P.targetLufs + (c.level != null ? +c.level : 0)) - lufs; if (gain > 20) gain = 20;   // never boost a quiet file into noise
        var segs = mapToTimeline(c.fromMs, c.toMs, P.inserts);
        segs.forEach(function (sg, si) {
            var need = (sg.end - sg.start) / 1000, fi = Math.min(P.fadeIn, need / 3), fo = Math.min(P.fadeOut, need / 3);
            var off = 0, play = need;
            if (dur >= need + 2) off = (hashStr(c.file + "|" + ci + "|" + si) % Math.max(1, Math.floor(dur - need - 1)));                // a different slice of the long file every time
            else if (dur >= P.loopMinSec) { off = 0; play = need; }                                                                          // long enough to loop: looped with its own crossfade below
            else { play = Math.min(dur, need); }                                                                                             // a short sound plays ONCE, never repeated
            var idx = inputs.length; inputs.push(fp);
            var chainF = "[" + idx + ":a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo";
            if (dur >= P.loopMinSec && dur < need + 2) chainF += ",aloop=loop=-1:size=" + Math.round(dur * 48000 * 0.985) + ",atrim=0:" + play.toFixed(3);
            else chainF += ",atrim=" + off.toFixed(3) + ":" + (off + play).toFixed(3);
            chainF += ",asetpts=PTS-STARTPTS,volume=" + gain.toFixed(2) + "dB,afade=t=in:st=0:d=" + fi.toFixed(2) + ",afade=t=out:st=" + Math.max(0, play - fo).toFixed(3) + ":d=" + fo.toFixed(2) + ",adelay=" + Math.round(sg.start) + "|" + Math.round(sg.start) + "[c" + n + "]";
            filters.push(chainF); mixIn.push("[c" + n + "]"); n++;
            placed.push({ sound: c.sound, file: c.file, startSec: +(sg.start / 1000).toFixed(2), seconds: +play.toFixed(2), offsetSec: +off.toFixed(1), gainDb: +gain.toFixed(1), level: c.level || 0 });
        });
    });
    if (!n) return Promise.resolve({ wav: "", placed: [] });
    var breath = (P.breathDb > 0) ? ",volume='" + (1 - Math.pow(10, -P.breathDb / 20)).toFixed(4) + "*sin(2*PI*t/" + (P.breathSec || 100) + ")+1':eval=frame" : "";   // the bed breathes: a slow ±breathDb swell so an hour-long run never sits flat
    var graph = filters.join(";\n") + ";\n" + mixIn.join("") + "amix=inputs=" + n + ":duration=longest:dropout_transition=0:normalize=0" + breath + ",alimiter=limit=" + Math.pow(10, (P.ceilingLufs + 6) / 20).toFixed(4) + ":level=false,atrim=0:" + P.totalSec.toFixed(3) + ",apad=whole_dur=" + P.totalSec.toFixed(3) + "[out]";
    var script = outWav + ".filters.txt"; fs.writeFileSync(script, graph);
    var args = []; inputs.forEach(function (f) { args.push("-i", f); });
    args = args.concat(["-filter_complex_script", script, "-map", "[out]", "-c:a", "pcm_s16le", outWav]);
    log("sfx: " + n + " slice(s) from " + inputs.length + " file(s) → bed at " + P.targetLufs + " LUFS");
    return FF.ffmpeg(args).then(function () { try { fs.unlinkSync(script); } catch (e) {} return { wav: outWav, placed: placed }; });
}

/* ---- cues from the writing room's json + the breakdown -------------------- */
function cuesFromJson(sfx, bd) {
    // each cue names sections (from/to, "S03" or 3) or times; section ranges become ms from the breakdown
    var out = [], secs = (bd && bd.sections) || [];
    function secByNum(x) { var k = parseInt(String(x).replace(/^S0*/i, ""), 10); return secs.filter(function (s) { return s.num === k || s.sec === k; })[0]; }
    (sfx.cues || []).forEach(function (c) {
        var fromMs = c.fromMs, toMs = c.toMs;
        if (fromMs == null && c.from != null) { var a = secByNum(c.from); if (a) fromMs = a.t0 != null ? a.t0 : Math.round((a.startSec || 0) * 1000); }
        if (toMs == null && c.to != null) { var b = secByNum(c.to); if (b) toMs = b.t1 != null ? b.t1 : Math.round((b.endSec || 0) * 1000); }
        if (fromMs == null || toMs == null || toMs <= fromMs) return;
        out.push({ sound: c.sound || c.name || "", url: c.url, file: c.file, license: c.license, credit: c.credit, level: c.level, fromMs: fromMs, toMs: toMs, note: c.note });
    });
    return out;
}
module.exports = { DEF: DEF, words: words, localMatch: localMatch, quickIndex: quickIndex, analyzeDirs: analyzeDirs, quickIndexes: quickIndexes, catalogDirs: catalogDirs, analyzeDir: analyzeDir, loadIndex: loadIndex, saveIndex: saveIndex, catalog: catalog, resolveCue: resolveCue, renderBed: renderBed, cuesFromJson: cuesFromJson, mapToTimeline: mapToTimeline, measure: measure };
