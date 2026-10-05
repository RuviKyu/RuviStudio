/* lib/ffmpeg.js — RUVI Conductor · thin promise wrappers around ffmpeg / ffprobe.
   FFMPEG / FFPROBE paths come from the config (default: on PATH). */
"use strict";
var spawn = require("child_process").spawn;
var CFG = { ffmpeg: "ffmpeg", ffprobe: "ffprobe" };
function configure(o) { if (o && o.ffmpeg) CFG.ffmpeg = o.ffmpeg; if (o && o.ffprobe) CFG.ffprobe = o.ffprobe; }

function run(bin, args, opts) {
    opts = opts || {};
    return new Promise(function (resolve, reject) {
        var p = spawn(bin, args, { windowsHide: true }), out = [], err = [], errTail = "";
        if (opts.stdin) { opts.stdin.on("error", function () {}); }
        p.stdout.on("data", function (d) { if (opts.collect) out.push(d); if (opts.onStdout) opts.onStdout(d); });
        p.stderr.on("data", function (d) { var s = d.toString(); errTail = (errTail + s).slice(-4000); if (opts.onStderr) opts.onStderr(s); });
        p.on("error", function (e) { reject(new Error(bin + ": " + e.message)); });
        p.on("close", function (code) {
            if (code === 0) resolve({ code: code, stdout: opts.collect ? Buffer.concat(out) : null, stderr: errTail });
            else reject(new Error(bin + " exited " + code + (opts.quiet ? "" : ("\n" + errTail.split("\n").slice(-6).join("\n")))));
        });
    });
}
function ffmpeg(args, opts) { return run(CFG.ffmpeg, ["-hide_banner", "-loglevel", (opts && opts.loglevel) || "error", "-y"].concat(args), opts); }
function ffprobeJson(file) {
    return run(CFG.ffprobe, ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", file], { collect: true })
        .then(function (r) { try { return JSON.parse(r.stdout.toString("utf8")); } catch (e) { return {}; } });
}
function probe(file) {
    return ffprobeJson(file).then(function (j) {
        var v = (j.streams || []).filter(function (s) { return s.codec_type === "video"; })[0];
        var a = (j.streams || []).filter(function (s) { return s.codec_type === "audio"; })[0];
        var dur = parseFloat((j.format && j.format.duration) || (v && v.duration) || (a && a.duration) || 0) || 0;
        var fps = 0; if (v && v.r_frame_rate) { var q = v.r_frame_rate.split("/"); fps = q.length === 2 ? (+q[0] / +q[1]) : +q[0]; }
        return { duration: dur, width: v ? +v.width : 0, height: v ? +v.height : 0, fps: fps, hasVideo: !!v, hasAudio: !!a, codec: v ? v.codec_name : "", pixFmt: v ? (v.pix_fmt || "") : "" };
    });
}
/* decode any audio file to mono float samples at `rate` Hz (for analysis) */
function decodePcm(file, rate) {
    rate = rate || 22050;
    return run(CFG.ffmpeg, ["-hide_banner", "-loglevel", "error", "-i", file, "-vn", "-ac", "1", "-ar", String(rate), "-f", "f32le", "-"], { collect: true })
        .then(function (r) { var b = r.stdout; var f = new Float32Array(b.buffer, b.byteOffset, Math.floor(b.length / 4)); return { rate: rate, samples: f }; });
}
function which(bin) { return run(process.platform === "win32" ? "where" : "which", [bin], { collect: true, quiet: true }).then(function (r) { return r.stdout.toString().trim().split(/\r?\n/)[0]; }).catch(function () { return ""; }); }
module.exports = { configure: configure, ffmpeg: ffmpeg, probe: probe, ffprobeJson: ffprobeJson, decodePcm: decodePcm, which: which, CFG: CFG };
