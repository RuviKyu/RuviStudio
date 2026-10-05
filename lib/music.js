/* ============================================================================
   lib/music.js — RUVI Conductor · background music, the way Premiere's Remix
   tool does it: the track is cut and re-joined ONLY on bar lines, jumps land
   on musically similar bars, every jump is a short beat-length crossfade, the
   real intro opens the video and the real ending closes it, and the result is
   exactly as long as the video. (Video_Music.md is the contract.)

   Three jobs:
     analyze(file)          → the MUSIC PROFILE (bpm, beat/bar grid, bar energies,
                              sections) that the writing room maps its cuts on
     plan(profile, target)  → a CUT LIST (segments of source bars → destination
                              time) from either the writing room's explicit
                              segments ("cuts" mode) or its brief ("brief" mode)
     render(file, plan, out)→ the remixed music as a WAV (ffmpeg atrim/acrossfade
                              chain + volume automation), ready for the mix
   ========================================================================== */
"use strict";
var FF = require("./ffmpeg.js");

/* ---- 1. analysis ------------------------------------------------------- */
function analyze(file, opts) {
    opts = opts || {};
    var rate = 22050, hop = 512;
    return FF.decodePcm(file, rate).then(function (pcm) {
        var x = pcm.samples, n = x.length, nf = Math.floor(n / hop);
        if (nf < 40) throw new Error("track too short to analyse");
        // frame energy (RMS) + onset envelope (half-wave rectified log-energy difference)
        var rms = new Float32Array(nf), on = new Float32Array(nf), prev = 0;
        for (var f = 0; f < nf; f++) {
            var s = 0, o = f * hop;
            for (var k = 0; k < hop; k++) { var v = x[o + k]; s += v * v; }
            rms[f] = Math.sqrt(s / hop);
            var le = Math.log(1e-6 + rms[f]); on[f] = Math.max(0, le - prev); prev = le;
        }
        // light smoothing of the onset envelope
        var sm = new Float32Array(nf);
        for (f = 0; f < nf; f++) { var a = 0, c = 0; for (k = -1; k <= 1; k++) { if (f + k >= 0 && f + k < nf) { a += on[f + k]; c++; } } sm[f] = a / c; }
        var fps = rate / hop;                                   // frames per second (43.07)
        // tempo: autocorrelation over 60–200 BPM, mild preference for 80–160
        var minLag = Math.round(fps * 60 / 200), maxLag = Math.round(fps * 60 / 60), best = 0, bestLag = 0;
        var mean = 0; for (f = 0; f < nf; f++) mean += sm[f]; mean /= nf;
        for (var lag = minLag; lag <= maxLag; lag++) {
            var acc = 0; for (f = lag; f < nf; f++) acc += (sm[f] - mean) * (sm[f - lag] - mean);
            var bpm = fps * 60 / lag, w = (bpm >= 80 && bpm <= 160) ? 1 : 0.8;
            acc *= w; if (acc > best) { best = acc; bestLag = lag; }
        }
        if (!bestLag) throw new Error("no tempo found");
        var beat = bestLag / fps;                                // seconds per beat
        var bpmOut = 60 / beat;
        // beat phase: comb over one period
        var period = bestLag, bestPh = 0, bestSum = -1;
        for (var ph = 0; ph < period; ph++) { var sum = 0, cnt = 0; for (f = ph; f < nf; f += period) { sum += sm[f]; cnt++; } sum /= Math.max(1, cnt); if (sum > bestSum) { bestSum = sum; bestPh = ph; } }
        var firstBeat = bestPh / fps;
        var beats = []; for (var t = firstBeat; t < n / rate; t += beat) beats.push(t);
        // downbeat: which of the 4 phases carries the strongest onsets
        var bpb = opts.beatsPerBar || 4, dbBest = 0, dbSum = -1;
        for (var d = 0; d < bpb; d++) { var ss = 0, cc = 0; for (var b = d; b < beats.length; b += bpb) { var fr = Math.round(beats[b] * fps); if (fr < nf) { ss += sm[fr]; cc++; } } ss /= Math.max(1, cc); if (ss > dbSum) { dbSum = ss; dbBest = d; } }
        // chroma per bar: energy at the 12 pitch classes over 4 octaves (C3..B6) by Goertzel on a 2048-sample window at each beat
        var PC = []; for (var pcI = 0; pcI < 48; pcI++) PC.push(130.81 * Math.pow(2, pcI / 12));
        function chromaAt(sample) { var N = 2048, cz = new Float64Array(12); if (sample + N > n) sample = Math.max(0, n - N); for (var q = 0; q < 48; q++) { var w = 2 * Math.PI * PC[q] / rate, cw = 2 * Math.cos(w), s0 = 0, s1 = 0, s2 = 0; for (var i = 0; i < N; i++) { var hann = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N); s0 = hann * x[sample + i] + cw * s1 - s2; s2 = s1; s1 = s0; } cz[q % 12] += Math.sqrt(Math.max(0, s1 * s1 + s2 * s2 - cw * s1 * s2)); } var tot = 0; for (q = 0; q < 12; q++) tot += cz[q]; for (q = 0; q < 12; q++) cz[q] = tot ? +(cz[q] / tot).toFixed(3) : 0; return Array.prototype.slice.call(cz); }
        var bars = [], sumChroma = new Float64Array(12);
        for (b = dbBest; b + bpb <= beats.length; b += bpb) {
            var t0 = beats[b], t1 = beats[b] + beat * bpb, f0 = Math.round(t0 * fps), f1 = Math.min(nf, Math.round(t1 * fps)), e = 0, m = 0, tr = 0;
            for (f = f0; f < f1; f++) { e += rms[f] * rms[f]; m++; if (sm[f] > 0.12) tr++; }
            var ch = chromaAt(Math.round(t0 * rate)), ch2 = chromaAt(Math.round((t0 + beat * 2) * rate)), cr = []; for (var q2 = 0; q2 < 12; q2++) { cr.push(+((ch[q2] + ch2[q2]) / 2).toFixed(3)); sumChroma[q2] += cr[q2]; }
            bars.push({ n: bars.length, t0: +t0.toFixed(4), t1: +t1.toFixed(4), db: +(10 * Math.log10(1e-9 + e / Math.max(1, m))).toFixed(2), tr: tr, chroma: cr });
        }
        // key estimate: Krumhansl profiles against the mean chroma
        var KP_MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88], KP_MIN = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17], NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"], keyBest = "", keyScore = -1e9;
        function corr(a, b, rot) { var ma = 0, mb = 0; for (var i = 0; i < 12; i++) { ma += a[i]; mb += b[i]; } ma /= 12; mb /= 12; var num = 0, da = 0, dbb = 0; for (i = 0; i < 12; i++) { var av = a[(i + rot) % 12] - ma, bv = b[i] - mb; num += av * bv; da += av * av; dbb += bv * bv; } return num / Math.sqrt(1e-9 + da * dbb); }
        for (var rot = 0; rot < 12; rot++) { var cM = corr(Array.from(sumChroma), KP_MAJ, rot), cm = corr(Array.from(sumChroma), KP_MIN, rot); if (cM > keyScore) { keyScore = cM; keyBest = NAMES[rot] + " major"; } if (cm > keyScore) { keyScore = cm; keyBest = NAMES[rot] + " minor"; } }
        if (!bars.length) throw new Error("no bars");
        // sections: cut where the bar energy steps by > 3 dB vs the previous 4-bar mean; min 4 bars
        var sections = [], start = 0;
        for (b = 4; b < bars.length; b++) {
            var pm = 0; for (k = b - 4; k < b; k++) pm += bars[k].db; pm /= 4;
            if (Math.abs(bars[b].db - pm) > 3 && b - start >= 4) { sections.push({ from: start, to: b - 1 }); start = b; }
        }
        sections.push({ from: start, to: bars.length - 1 });
        var maxDb = -999; sections.forEach(function (sc) { var e2 = 0; for (b = sc.from; b <= sc.to; b++) e2 += bars[b].db; sc.db = +(e2 / (sc.to - sc.from + 1)).toFixed(2); if (sc.db > maxDb) maxDb = sc.db; });
        sections.forEach(function (sc, i) {
            sc.name = i === 0 ? "intro" : (i === sections.length - 1 ? "outro" : (sc.db >= maxDb - 1.5 ? "peak" : (sc.db < maxDb - 8 ? "breakdown" : "body")));
            sc.bars = sc.to - sc.from + 1;
        });
        // energy label, mood tags, safe cut points (bars where a jump lands cleanly: on a section boundary or a quiet bar before a loud one)
        var allDb = bars.map(function (bq) { return bq.db; }).sort(function (a2, b2) { return a2 - b2; }), medDb = allDb[Math.floor(allDb.length / 2)], loud = allDb[Math.floor(allDb.length * 0.9)], dyn = loud - allDb[Math.floor(allDb.length * 0.1)];
        var trMean = bars.reduce(function (a2, bq) { return a2 + bq.tr; }, 0) / Math.max(1, bars.length), minor = /minor/.test(keyBest);
        var energy = bpmOut >= 125 && trMean > 6 ? "high" : (bpmOut <= 85 && trMean < 4 ? "low" : "medium");
        var mood = []; if (minor) mood.push("dark", "mysterious"); else mood.push("warm", "hopeful"); if (energy === "low") mood.push("calm", "ambient", "sleep"); if (energy === "high") mood.push("driving", "tense"); if (dyn > 12) mood.push("dramatic"); if (bpmOut < 95 && minor) mood.push("melancholic"); if (trMean < 2.5) mood.push("drone");
        var cuts = []; sections.forEach(function (sc) { cuts.push(sc.from); }); for (b = 1; b < bars.length - 1; b++) { if (bars[b].db < medDb - 2 && bars[b + 1].db > bars[b].db + 2 && cuts.indexOf(b + 1) < 0) cuts.push(b + 1); } cuts.sort(function (a2, b2) { return a2 - b2; });
        return {
            file: require("path").basename(file), durationSec: +(n / rate).toFixed(3), duration: +(n / rate).toFixed(3), bpm: +bpmOut.toFixed(2), beatSec: +beat.toFixed(5),
            barSec: +(beat * bpb).toFixed(5), beatsPerBar: bpb, firstBeatSec: +firstBeat.toFixed(4), key: keyBest, energy: energy, energyLabel: energy, mood: mood, dynamicRangeDb: +dyn.toFixed(1), safeCuts: cuts, bars: bars, sections: sections
        };
    });
}

/* ---- 2. planning -------------------------------------------------------- */
/* plan(profile, targetSec, remix) → { segments:[{srcStart,srcEnd,dstStart,dstEnd,xfade}], gain:{...}, totalSec }
   remix.mode === "cuts"  : the writing room's explicit bar segments [{fromBar,toBar}] in play order
   remix.mode === "brief" : the writing room's musical brief (anchors / bed / ending) → automatic bar walk */
function chromaSim(a, b) { if (!a || !b) return 1; var num = 0, da = 0, db = 0; for (var i = 0; i < 12; i++) { num += a[i] * b[i]; da += a[i] * a[i]; db += b[i] * b[i]; } return num / Math.sqrt(1e-9 + da * db); }
function plan(profile, targetSec, remix) {
    remix = remix || {}; var bars = profile.bars, barSec = profile.barSec, beat = profile.beatSec;
    var xf = Math.max(0.05, Math.min(2, (remix.crossfadeBeats != null ? remix.crossfadeBeats : 1) * beat));
    var order = [];                                          // list of {from,to} bar runs in play order
    if (remix.mode === "cuts" && Array.isArray(remix.segments) && remix.segments.length) {
        remix.segments.forEach(function (s) { order.push({ from: Math.max(0, s.fromBar | 0), to: Math.min(bars.length - 1, s.toBar | 0) }); });
    } else {
        // brief mode: real intro → body walk (loop the sections between intro and outro, jumping on similar energy) → real outro at the end
        var secs = profile.sections, intro = secs[0], outro = secs[secs.length - 1];
        var body = secs.slice(1, -1); if (!body.length) body = [intro];
        var outroBars = Math.min(outro.bars, Math.max(2, remix.outroBars || Math.min(8, outro.bars)));
        var need = targetSec - xf;                              // every join costs one crossfade of overlap
        var runs = [{ from: intro.from, to: intro.to }], len = (intro.bars) * barSec;
        var outroLen = outroBars * barSec, bi = 0, guard = 0;
        // the body walk picks, at every jump, the body section whose first bar best matches the bar it leaves: similar loudness
        // AND similar chroma (harmony), never the section just played twice in a row when another fits — the Remix feel
        var bars = profile.bars || [], lastIdx = -1;
        function fit(fromBar, toBar) { var a = bars[fromBar], b = bars[toBar]; if (!a || !b) return 0; var dbPen = Math.min(1, Math.abs(a.db - b.db) / 8), h = chromaSim(a.chroma, b.chroma); return (1 - dbPen) * 0.5 + h * 0.5; }
        while (len + outroLen < need && guard++ < 10000) {
            var last = runs[runs.length - 1], sc = null, bestF = -1;
            for (var ci = 0; ci < body.length; ci++) { var cand = body[ci], f2 = fit(last.to, cand.from) + (ci === lastIdx && body.length > 1 ? -0.25 : 0) + (ci === (lastIdx + 1) % body.length ? 0.08 : 0); if (f2 > bestF) { bestF = f2; sc = cand; lastIdx = ci; } }
            if (!sc) sc = body[bi % body.length]; bi++;
            var room = need - outroLen - len, take = Math.min(sc.bars, Math.max(1, Math.floor(room / barSec)));
            if (take <= 0) break;
            runs.push({ from: sc.from, to: sc.from + take - 1 }); len += take * barSec - xf;
        }
        runs.push({ from: outro.to - outroBars + 1, to: outro.to });
        order = runs;
    }
    // merge consecutive runs that are contiguous in the source (no jump → no crossfade)
    var merged = [];
    order.forEach(function (r) { var last = merged[merged.length - 1]; if (last && r.from === last.to + 1) last.to = r.to; else merged.push({ from: r.from, to: r.to }); });
    var segs = [], dst = 0;
    merged.forEach(function (r, i) {
        var s0 = bars[r.from].t0, s1 = bars[r.to].t1, d = s1 - s0, x = i ? xf : 0;
        segs.push({ fromBar: r.from, toBar: r.to, srcStart: +s0.toFixed(4), srcEnd: +s1.toFixed(4), xfade: +x.toFixed(4), dstStart: +(dst - x).toFixed(4), dstEnd: +(dst - x + d).toFixed(4) });
        dst = dst - x + d;
    });
    // land exactly on the target: trim/extend the LAST segment's end (the ending fade covers a small overrun)
    var over = dst - targetSec;
    if (segs.length) { var L = segs[segs.length - 1]; if (over > 0 && over < (L.srcEnd - L.srcStart) - 1) { L.srcEnd = +(L.srcEnd - over).toFixed(4); L.dstEnd = +(L.dstEnd - over).toFixed(4); dst = targetSec; } }
    return {
        mode: remix.mode || "brief", targetSec: +targetSec.toFixed(3), totalSec: +dst.toFixed(3), crossfadeSec: +xf.toFixed(4),
        bedDb: (remix.bedDb != null ? remix.bedDb : -18), duck: Array.isArray(remix.duck) ? remix.duck : [],
        fadeInSec: (remix.fadeInSec != null ? remix.fadeInSec : 1.5), fadeOutSec: (remix.fadeOutSec != null ? remix.fadeOutSec : 3),
        segments: segs
    };
}

/* ---- 3. rendering ------------------------------------------------------- */
/* render(file, planObj, outWav) → the remixed, levelled music, exactly plan.totalSec long */
function render(file, P, outWav) {
    var segs = P.segments, parts = [], chain = [];
    segs.forEach(function (s, i) {
        parts.push("[0:a]atrim=start=" + s.srcStart + ":end=" + s.srcEnd + ",asetpts=PTS-STARTPTS,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[s" + i + "]");
    });
    var cur = "[s0]";
    for (var i = 1; i < segs.length; i++) {
        var out = (i === segs.length - 1) ? "[j]" : "[c" + i + "]";
        chain.push(cur + "[s" + i + "]acrossfade=d=" + segs[i].xfade + ":c1=tri:c2=tri" + out);
        cur = out;
    }
    if (segs.length === 1) chain.push("[s0]acopy[j]");
    // level: bed gain, ducks (video-time windows, dB), fade in / out
    var vol = "volume=" + P.bedDb + "dB";
    var duckExpr = "";
    (P.duck || []).forEach(function (d) { duckExpr += "+if(between(t," + (d.fromSec || 0) + "," + (d.toSec || 0) + ")," + (Math.pow(10, (d.db || -6) / 20) - 1).toFixed(4) + ",0)"; });
    var level = duckExpr ? ("volume='(1" + duckExpr + ")':eval=frame") : "anull";
    var fades = "afade=t=in:st=0:d=" + P.fadeInSec + ",afade=t=out:st=" + Math.max(0, P.totalSec - P.fadeOutSec).toFixed(3) + ":d=" + P.fadeOutSec;
    var graph = parts.concat(chain).concat(["[j]" + vol + "," + level + "," + fades + ",atrim=end=" + P.totalSec.toFixed(3) + "[out]"]).join(";\n");
    // a long remix is hundreds of segments: the graph goes through a script file (a command line of that size fails on Windows with ENAMETOOLONG)
    var script = outWav + ".filters.txt"; require("fs").writeFileSync(script, graph);
    return FF.ffmpeg(["-i", file, "-filter_complex_script", script, "-map", "[out]", "-c:a", "pcm_s16le", outWav]).then(function () { try { require("fs").unlinkSync(script); } catch (e) {} return outWav; });
}

/* explicit-cut validation for the writing room's file (mirrors music_remix_check.py) */
function validateRemix(remix, profile, targetSec) {
    var E = [];
    if (!remix || typeof remix !== "object") return ["remix file is not an object"];
    if (["cuts", "brief"].indexOf(remix.mode) < 0) E.push("mode must be cuts|brief");
    if (remix.mode === "cuts") {
        if (!Array.isArray(remix.segments) || !remix.segments.length) E.push("cuts mode needs segments[]");
        else remix.segments.forEach(function (s, i) {
            if (!(s.fromBar >= 0 && s.toBar >= s.fromBar)) E.push("segment " + i + ": fromBar/toBar");
            if (profile && s.toBar >= profile.bars.length) E.push("segment " + i + ": toBar beyond the track (" + profile.bars.length + " bars)");
        });
        if (profile && targetSec) { var p = plan(profile, targetSec, remix); if (Math.abs(p.totalSec - targetSec) > 2) E.push("segments play " + p.totalSec + "s but the video is " + targetSec + "s (±2 s)"); }
    }
    if (remix.bedDb != null && !(remix.bedDb <= 0 && remix.bedDb >= -40)) E.push("bedDb must be between -40 and 0");
    (remix.duck || []).forEach(function (d, i) { if (!(d.fromSec >= 0 && d.toSec > d.fromSec)) E.push("duck " + i + ": fromSec/toSec"); });
    return E;
}

/* ---- 4. the library index ----------------------------------------------------
   <lib>\_library_index.json — one small JSON for the whole music folder: every track's
   profile (bpm, bars, sections, loudness curve) + free "mood" tags you add by hand.
   This is the file to give the writing room instead of the audio: it is a few KB per
   track, never the MP3s. Tracks are analysed once and re-analysed only when the file
   changes (size + mtime). */
function indexLibrary(libDir, opts) {
    var fs = require("fs"), path = require("path"), file = path.join(libDir, "_library_index.json"), old = {}, out = { library: libDir, indexedAt: "", tracks: [] };
    try { old = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) {}
    var oldBy = {}; (old.tracks || []).forEach(function (t) { oldBy[t.file] = t; });
    var names = []; try { names = fs.readdirSync(libDir).filter(function (n) { return /\.(mp3|wav|m4a|flac|aac|ogg)$/i.test(n); }).sort(); } catch (e) { return Promise.reject(new Error("music library not found: " + libDir)); }
    var chain = Promise.resolve(), log = (opts && opts.onStep) || function () {};
    names.forEach(function (n) {
        chain = chain.then(function () {
            var st = fs.statSync(path.join(libDir, n)), prev = oldBy[n];
            if (prev && prev.size === st.size && prev.mtime === st.mtimeMs && prev.profile) { out.tracks.push(prev); return; }
            log("analysing " + n);
            return analyze(path.join(libDir, n)).then(function (prof) {
                var curve = []; var step = Math.max(1, Math.floor(prof.bars.length / 48)); for (var i = 0; i < prof.bars.length; i += step) curve.push(prof.bars[i].db);
                out.tracks.push({ file: n, size: st.size, mtime: st.mtimeMs, tags: (prev && prev.tags) || [], mood: (prev && prev.mood) || "",
                    profile: { durationSec: prof.durationSec, bpm: prof.bpm, beatSec: prof.beatSec, barSec: prof.barSec, beatsPerBar: prof.beatsPerBar, bars: prof.bars.length, sections: prof.sections, loudnessCurveDb: curve } });
            }).catch(function (e) { out.tracks.push({ file: n, size: st.size, mtime: st.mtimeMs, error: String(e && e.message || e), tags: (prev && prev.tags) || [] }); });
        });
    });
    return chain.then(function () { out.indexedAt = new Date().toISOString(); fs.writeFileSync(file, JSON.stringify(out, null, 1)); return out; });
}
module.exports = { analyze: analyze, plan: plan, render: render, validateRemix: validateRemix, indexLibrary: indexLibrary };
