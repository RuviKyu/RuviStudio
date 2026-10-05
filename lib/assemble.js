/* ============================================================================
   lib/assemble.js — RUVI Conductor · turns the AUTO structure + the assets on
   disk into the finished video:
     AI sub-sections   Assets\n.jpg  → Ken Burns (one of 8 pan directions, gentle
                                       zoom in/out alternating), exactly the item's length
     special sections  Renders\S001_HOOK.mov … (After Effects renders) → scaled/trimmed
     every cut         fade out to black + fade in (FADE_SEC each side)
     audio             the VO (continuous) + the ambience bed (sfx.js: the writing room's cues, balanced, faint)
   Each item is rendered to its own segment file (so a crash or a re-run only
   redoes what changed), the segments are concatenated stream-copy, and the
   audio is muxed in one final pass.
   ========================================================================== */
"use strict";
var fs = require("fs"), path = require("path");
var FF = require("./ffmpeg.js"), SFX = require("./sfx.js"), ST = require("./structure.js");

var DEF = { width: 1920, height: 1080, fps: 60, fadeSec: 0.5, crf: 18, preset: "medium", zoom: 1.22, zoomDrift: 0.06, encoder: "x264", nvencCq: 19, nvencPreset: "p5", letterbox: 2.0, voDb: 0, sfxLufs: -31, sfxDuckDb: 2.5 };

/* pan direction → the visible window's travel across the oversized image (fractions 0..1 of the free room) */
var PAN_VEC = { N: [0.5, 1, 0.5, 0], NE: [0, 1, 1, 0], E: [0, 0.5, 1, 0.5], SE: [0, 0, 1, 1], S: [0.5, 0, 0.5, 1], SW: [1, 0, 0, 1], W: [1, 0.5, 0, 0.5], NW: [1, 1, 0, 0] };

function scriptFile(dir, name, graph) { var p = path.join(dir, "filters_" + name + ".txt"); fs.writeFileSync(p, graph); return p; }   // filter graphs go through files: Windows' command line caps at 32 K
function segName(dir, it) { return it.kind === "CTA" ? path.join(dir, "cta_" + String(it.ctaIndex).padStart(2, "0") + ".mp4") : path.join(dir, "seg_" + String(it.auto).padStart(3, "0") + ".mp4"); }
/* a CTA clip (its own animation + narration): scaled/padded to the frame, the final fps, fades at both ends; its audio is kept beside it as a wav for the voice track */
function ctaSegment(file, it, cfg, out) {
    var dur = it.dur, f = Math.min(cfg.fadeSec, dur / 3), lbR = +cfg.letterbox || 0, bar = (lbR && lbR > cfg.width / cfg.height) ? Math.round((cfg.height - cfg.width / lbR) / 2 / 2) * 2 : 0, innerH = cfg.height - 2 * bar;
    // the clip is fitted INSIDE the letterbox window, so the bars never cover its QR code or text
    var vf = "scale=" + cfg.width + ":" + innerH + ":force_original_aspect_ratio=decrease,pad=" + cfg.width + ":" + cfg.height + ":(ow-iw)/2:(oh-ih)/2,fps=" + cfg.fps + ",fade=t=in:st=0:d=" + f.toFixed(3) + ",fade=t=out:st=" + Math.max(0, dur - f).toFixed(3) + ":d=" + f.toFixed(3) + ",format=yuv420p";
    return FF.ffmpeg(["-i", file, "-t", dur.toFixed(3), "-vf", vf, "-an"].concat(codec(cfg)).concat([out]))
        .then(function () { return FF.ffmpeg(["-i", file, "-t", dur.toFixed(3), "-vn", "-af", "aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,afade=t=in:st=0:d=0.15,afade=t=out:st=" + Math.max(0, dur - 0.15).toFixed(3) + ":d=0.15", out.replace(/\.mp4$/, ".wav")]); });
}
/* where a CTA goes: the start of the item nearest `pos` × the narration length — section starts are sentence ends by the writing room's rule, so the voice is never cut mid-sentence */
function placeCtas(items, ctas, totalSec) {
    var out = items.slice(), used = {}, placed = [];
    (ctas || []).forEach(function (c, k) {
        var pos = c.position != null ? c.position : (k === 0 ? 0.2 : 0.5), target = pos * totalSec, best = -1, bestD = 1e9;
        items.forEach(function (it, i) { if (i === 0) return; var d = Math.abs(it.t0 / 1000 - target); if (!used[i] && d < bestD) { bestD = d; best = i; } });
        if (best < 0) return; used[best] = true;
        var cta = { kind: "CTA", ctaIndex: k + 1, file: c.file, dur: c.durationSec, atSec: items[best].t0 / 1000, beforeAuto: items[best].auto, position: pos };
        out.splice(out.indexOf(items[best]), 0, cta); placed.push(cta);
    });
    placed.sort(function (x, y) { return x.atSec - y.atSec; });
    return { items: out, placed: placed };
}
function recipe(it, cfg) {
    var src = it.kind === "AI" ? it._asset.image : it._asset.render, st = null;
    try { st = fs.statSync(src); } catch (e) {}
    return JSON.stringify({ src: src, size: st && st.size, mtime: st && st.mtimeMs, t0: it.t0, t1: it.t1, pan: it.pan, kind: it.kind, auto: it.auto,
        fps: cfg.fps, w: cfg.width, h: cfg.height, fade: cfg.fadeSec, crf: cfg.crf, preset: cfg.preset, zoom: cfg.zoom, drift: cfg.zoomDrift, enc: cfg.encoder, cq: cfg.nvencCq, v: 3 });
}

function kenBurns(image, it, cfg, out) {
    var dur = (it.t1 - it.t0) / 1000, N = Math.max(2, Math.round(dur * cfg.fps));
    var v = PAN_VEC[it.pan] || PAN_VEC.E, zoomIn = (it.auto % 2 === 0);
    var z = zoomIn ? ("(" + cfg.zoom + "+" + cfg.zoomDrift + "*on/" + (N - 1) + ")") : ("(" + (cfg.zoom + cfg.zoomDrift) + "-" + cfg.zoomDrift + "*on/" + (N - 1) + ")");
    var px = "(" + v[0] + "+(" + (v[2] - v[0]) + ")*on/" + (N - 1) + ")", py = "(" + v[1] + "+(" + (v[3] - v[1]) + ")*on/" + (N - 1) + ")";
    // scale the still to a canvas a little larger than the frame, then pan/zoom the frame-sized window over it
    var cw = Math.round(cfg.width * 1.25), ch = Math.round(cfg.height * 1.25);
    var vf = "scale=" + cw + ":" + ch + ":force_original_aspect_ratio=increase,crop=" + cw + ":" + ch + ",setsar=1,"
        + "zoompan=z='" + z + "':x='(iw-iw/zoom)*" + px + "':y='(ih-ih/zoom)*" + py + "':d=" + N + ":s=" + cfg.width + "x" + cfg.height + ":fps=" + cfg.fps + ","
        + fades(dur, cfg) + ",format=yuv420p";
    // one input frame; zoompan itself emits N frames for it (never -loop here: each looped frame would restart the move)
    return FF.ffmpeg(["-i", image, "-vf", vf, "-frames:v", String(N), "-an"].concat(codec(cfg)).concat([out]));
}
function special(render, it, cfg, out) {
    var dur = (it.t1 - it.t0) / 1000;
    var vf = "scale=" + cfg.width + ":" + cfg.height + ":force_original_aspect_ratio=decrease,pad=" + cfg.width + ":" + cfg.height + ":(ow-iw)/2:(oh-ih)/2,setsar=1,fps=" + cfg.fps + ",tpad=stop_mode=clone:stop_duration=" + dur.toFixed(3) + "," + fades(dur, cfg) + ",format=yuv420p";
    return FF.ffmpeg(["-i", render, "-t", dur.toFixed(3), "-vf", vf, "-an"].concat(codec(cfg)).concat([out]));
}
function fades(dur, cfg) { var f = Math.min(cfg.fadeSec, dur / 3); return "fade=t=in:st=0:d=" + f.toFixed(3) + ",fade=t=out:st=" + Math.max(0, dur - f).toFixed(3) + ":d=" + f.toFixed(3); }
function codec(cfg) {
    var v = cfg.encoder === "nvenc" ? ["-c:v", "h264_nvenc", "-preset", cfg.nvencPreset || "p5", "-tune", "hq", "-rc", "vbr", "-cq", String(cfg.nvencCq != null ? cfg.nvencCq : 19), "-b:v", "0", "-maxrate", "60M", "-bufsize", "120M", "-spatial-aq", "1", "-temporal-aq", "1", "-profile:v", "high", "-bf", "3"]
                                   : ["-c:v", "libx264", "-preset", cfg.preset, "-crf", String(cfg.crf), "-tune", "film", "-profile:v", "high"];
    return v.concat(["-pix_fmt", "yuv420p", "-r", String(cfg.fps), "-g", String(cfg.fps * 2), "-movflags", "+faststart"]);
}
/* the cinematic letterbox: black bars so the picture reads as `ratio`:1 (2.0 → 60 px bars on 1080p; 2.39 → 138 px) */
function letterboxFilter(cfg) { var r = +cfg.letterbox || 0; if (!r || r <= cfg.width / cfg.height) return ""; var bar = Math.round((cfg.height - cfg.width / r) / 2 / 2) * 2; return "drawbox=x=0:y=0:w=iw:h=" + bar + ":color=black:t=fill,drawbox=x=0:y=ih-" + bar + ":w=iw:h=" + bar + ":color=black:t=fill"; }

/* assemble(title, opts, onStep) → { out, warnings } */
function assemble(title, opts, onStep) {
    opts = Object.assign({}, DEF, opts || {}); onStep = onStep || function () {};
    var bd = title.bd, auto = title.auto, items = auto.items, tf = title.titleFolder;
    var work = path.join(tf, ST.PARTS); fs.mkdirSync(work, { recursive: true });
    var warnings = [], missing = [];
    items.forEach(function (it) {
        var a = ST.assetsFor(tf, it, bd);
        if (it.kind === "AI" && !a.image) missing.push("AI IMAGE " + ST.aiStem(it.image) + " (AI Images\\" + ST.aiStem(it.image) + ".jpg)");
        if (it.kind !== "AI" && it.kind !== "?" && !a.render) missing.push(it.render + " (Output\\parts\\)");
        it._asset = a;
    });
    if (missing.length) return Promise.reject(new Error("missing assets: " + missing.slice(0, 8).join(", ") + (missing.length > 8 ? " …+" + (missing.length - 8) : "")));
    if (!title.voPath) return Promise.reject(new Error("no VO .mp3 in Script\\"));
    var voTotal = auto.durationMs / 1000, cp = placeCtas(items, opts.ctas || [], voTotal), placedCtas = cp.placed; items = cp.items;
    var total = voTotal + placedCtas.reduce(function (s, c) { return s + c.dur; }, 0);
    placedCtas.forEach(function (c) { onStep("CTA " + c.ctaIndex + " (" + path.basename(c.file) + ", " + c.dur.toFixed(1) + " s) at " + Math.round(c.position * 100) + "% → before item " + c.beforeAuto + ", " + c.atSec.toFixed(1) + " s into the narration"); });
    // 1) segments
    var chain = Promise.resolve(), done = 0;
    items.forEach(function (it) {
        chain = chain.then(function () {
            var out = segName(work, it), need = it.kind === "CTA" ? it.dur : (it.t1 - it.t0) / 1000, sig = it.kind === "CTA" ? JSON.stringify({ cta: it.file, dur: it.dur, fps: opts.fps, enc: opts.encoder, cq: opts.nvencCq, fade: opts.fadeSec, v: 1 }) : recipe(it, opts), sigFile = out + ".json";
            // a segment is reused only when its recipe (source file size+mtime, window, pan, fps, codec settings) is unchanged
            if (fs.existsSync(out) && !opts.force) {
                var old = ""; try { old = fs.readFileSync(sigFile, "utf8"); } catch (e) {}
                if (old === sig) { done++; onStep("segment " + (it.kind === "AI" ? ("AI image " + it.image) : (it.kind === "CTA" ? ("CTA " + it.ctaIndex) : it.render)) + " kept"); return; }
            }
            onStep("segment " + (++done) + "/" + items.length + " · " + (it.kind === "AI" ? ("AI image " + it.image + " · pan " + it.pan) : (it.kind === "CTA" ? ("CTA " + it.ctaIndex) : it.render)));
            return (it.kind === "AI" ? kenBurns(it._asset.image, it, opts, out) : (it.kind === "CTA" ? ctaSegment(it.file, it, opts, out) : special(it._asset.render, it, opts, out)))
                .then(function () { fs.writeFileSync(sigFile, sig); });
        });
    });
    // 2) the segment list (the final pass concatenates, letterboxes and encodes in one go)
    var listFile = path.join(work, "segments.txt");
    chain = chain.then(function () { fs.writeFileSync(listFile, items.map(function (it) { return "file '" + segName(work, it).replace(/\\/g, "/").replace(/'/g, "'\\''") + "'"; }).join("\n") + "\n"); });
    // 2b) the voice track: the VO, paused at every CTA while the CTA's own narration plays — one wav the music is ducked under
    var voiceWav = path.join(work, "voice.wav");
    chain = chain.then(function () {
        var pieces = [], cursor = 0;
        placedCtas.forEach(function (c) { if (c.atSec > cursor + 0.01) pieces.push({ vo: [cursor, c.atSec] }); pieces.push({ file: segName(work, c).replace(/\.mp4$/, ".wav") }); cursor = c.atSec; });
        if (voTotal > cursor + 0.01) pieces.push({ vo: [cursor, voTotal] });
        var args = ["-i", title.voPath], graph = "", labels = [], nIn = 1;
        pieces.forEach(function (p, i) {
            if (p.vo) graph += "[0:a]atrim=" + p.vo[0].toFixed(3) + ":" + p.vo[1].toFixed(3) + ",asetpts=PTS-STARTPTS,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[p" + i + "];";
            else { args.push("-i", p.file); graph += "[" + nIn + ":a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[p" + i + "];"; nIn++; }
            labels.push("[p" + i + "]");
        });
        graph += labels.join("") + "concat=n=" + pieces.length + ":v=0:a=1[voice]";
        return FF.ffmpeg(args.concat(["-filter_complex_script", scriptFile(work, "voice", graph), "-map", "[voice]", "-t", total.toFixed(3), voiceWav]));
    });
    // 3) the ambience bed: the writing room's cues (sections → ms), each resolved to a long recording in <CHANNEL>\SFX\ (downloaded once),
    //    balanced to one faint target, sliced, faded, paused where the CTAs sit, summed and limited
    var musicWav = "";
    chain = chain.then(function () {
        var cues = SFX.cuesFromJson(title.sfx || {}, title.bd); if (!cues.length) { warnings.push("no ambience cues (" + (title.subject || "") + "_sfx.json) — silent bed"); return; }
        var sdir = opts.sfxDir; if (!sdir) { warnings.push("no SFX folder for the channel — silent bed"); return; }
        var inserts = placedCtas.map(function (c) { return { atMs: Math.round(c.atSec * 1000), durationMs: Math.round(c.dur * 1000) }; });
        return SFX.measure(title.voPath).then(function (vm) {
            var voL = vm && vm.lufs != null ? vm.lufs : -18, under = (opts.sfxUnderVoiceDb != null ? +opts.sfxUnderVoiceDb : 18), rel = voL - under, cap = (opts.sfxLufs != null ? +opts.sfxLufs : -34);
            opts._bedLufs = Math.min(rel, cap); onStep("ambience: voice " + voL.toFixed(1) + " LUFS → bed " + opts._bedLufs.toFixed(1) + " LUFS (" + under + " dB under the voice" + (rel > cap ? ", ceiling " + cap : "") + ")");
            return SFX.analyzeDirs(opts.sfxDirs || [sdir], onStep);
        }).then(function (ix) {
            var seq = Promise.resolve();
            cues.forEach(function (c) { seq = seq.then(function () { return SFX.resolveCue({ dir: sdir, freesoundKey: opts.freesoundKey, catalog: opts.sfxCatalog, log: onStep, contact: opts.contact, abort: opts.abort }, c, ix).then(function (r) { c.file = r && r.file; if (!c.file) warnings.push("ambience not found: " + c.sound); }); }); });
            return seq.then(function () { return SFX.analyzeDirs(opts.sfxDirs || [sdir], onStep); }).then(function (ix2) {
                musicWav = path.join(work, "ambience_bed.wav");
                return SFX.renderBed({ dir: sdir, ix: ix2, totalSec: total, inserts: inserts, targetLufs: opts._bedLufs, log: onStep }, cues, musicWav).then(function (r) { if (!r.wav) { musicWav = ""; return; } fs.writeFileSync(path.join(work, "ambience_plan.json"), JSON.stringify({ cues: cues, placed: r.placed }, null, 1)); onStep("ambience: " + r.placed.length + " slice(s) placed"); });
            });
        });
    });
    // 4) final pass: concat → letterbox → encode, with the VO (+ the music bed, ducked under the voice) muxed in
    var outName = (opts.outName || title.subject || "video") + ".mp4", out = path.join(tf, "Output", outName);
    chain = chain.then(function () {
        onStep("final: concat + letterbox + " + (opts.encoder === "nvenc" ? "NVENC" : "x264") + " @ " + opts.fps + " fps");
        var args = ["-f", "concat", "-safe", "0", "-i", listFile, "-i", voiceWav], lb = letterboxFilter(opts);
        var graph = "[0:v]" + (lb ? lb + "," : "") + "format=yuv420p[v];[1:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=" + ((opts.voDb != null) ? opts.voDb : 0) + "dB[vo];";
        if (musicWav) { args.push("-i", musicWav); graph += "[2:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[mu0];[vo]asplit=2[voa][vob];[mu0][vob]sidechaincompress=threshold=0.08:ratio=" + (1 + (opts.sfxDuckDb || 2.5) / 2).toFixed(2) + ":attack=60:release=900:makeup=1[mu];[voa][mu]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[mix]"; }
        else graph += "[vo]anull[mix]";
        args = args.concat(["-filter_complex_script", scriptFile(work, "final", graph), "-map", "[v]", "-map", "[mix]"]).concat(codec(opts)).concat(["-c:a", "aac", "-b:a", "192k", "-t", total.toFixed(3), out + ".part.mp4"]);
        try { fs.unlinkSync(out); } catch (e0) {}
        return FF.ffmpeg(args).then(function () { fs.renameSync(out + ".part.mp4", out); }, function (e) { try { fs.unlinkSync(out + ".part.mp4"); } catch (e1) {} throw e; });   // the whole video appears only when it is complete
    }).then(function () { return FF.probe(out); }).then(function (p) {
        if (Math.abs(p.duration - total) > 1) warnings.push("final duration " + p.duration.toFixed(2) + "s vs structure " + total.toFixed(2) + "s");
        return { out: out, duration: p.duration, warnings: warnings, ctas: placedCtas };
    });
    return chain;
}
module.exports = { recipe: recipe, segName: segName, assemble: assemble, kenBurns: kenBurns, DEF: DEF, PAN_VEC: PAN_VEC };
