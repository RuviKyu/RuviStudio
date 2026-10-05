/* ============================================================================
   toolbox.js — one resolver for every external tool. Search order makes the
   install PORTABLE: the base folder's own _RUNTIME comes first, so a machine
   bootstrapped by the Setup doctor needs nothing on PATH.
     1) <base>\_RUNTIME\ffmpeg\bin, <base>\_RUNTIME\python, ...\python\Scripts
     2) PATH
     3) known per-user Python installs (%LOCALAPPDATA%/%APPDATA%\Python\* \Scripts)
   ========================================================================== */
"use strict";
var fs = require("fs");
var path = require("path");
var spawnSync = require("child_process").spawnSync;

function runtimeDirs(baseDir) {
    var R = path.join(String(baseDir || ""), "_RUNTIME");
    return [path.join(R, "ffmpeg", "bin"), path.join(R, "whisper", "Scripts"), path.join(R, "python"), path.join(R, "python", "Scripts")];   // (Conductor) the app's own whisper venv first
}
function onPath(name) {
    try { var r = spawnSync(name, ["--version"], { stdio: "ignore", windowsHide: true, timeout: 8000 }); if (!r.error) return name; }
    catch (e) {}
    return null;
}
function pyScriptDirs() {
    var out = [], roots = [];
    if (process.env.LOCALAPPDATA) roots.push(path.join(process.env.LOCALAPPDATA, "Python"));
    if (process.env.APPDATA) roots.push(path.join(process.env.APPDATA, "Python"));
    for (var r = 0; r < roots.length; r++) {
        var subs = [];
        try { subs = fs.readdirSync(roots[r]); } catch (e) { continue; }
        for (var i = 0; i < subs.length; i++) out.push(path.join(roots[r], subs[i], "Scripts"));
    }
    return out;
}
/* resolve(name, baseDir) → full path | bare name (on PATH) | null */
function resolve(name, baseDir) {
    var exe = name + (process.platform === "win32" ? ".exe" : "");
    var dirs = runtimeDirs(baseDir);
    for (var d = 0; d < dirs.length; d++) {
        var cand = path.join(dirs[d], exe);
        try { if (fs.existsSync(cand)) return cand; } catch (e) {}
    }
    var p = onPath(name);
    if (p) return p;
    var pys = pyScriptDirs();
    for (d = 0; d < pys.length; d++) {
        cand = path.join(pys[d], exe);
        try { if (fs.existsSync(cand)) return cand; } catch (e2) {}
    }
    return null;
}
function pythonExe(baseDir) {
    var r = path.join(String(baseDir || ""), "_RUNTIME", "python", "python.exe");
    try { if (fs.existsSync(r)) return r; } catch (e) {}
    return onPath("python") || onPath("py");
}
/* CUDA DLLs for GPU whisper: pip's nvidia-cublas-cu12 / nvidia-cudnn-cu12 drop
   their DLLs into site-packages\nvidia\*\bin — find those dirs for the env the
   whisper tool lives in, so spawns can prepend them to PATH */
var PYQ = { at: 0, dirs: null };
function pyNvidiaBinDirs(baseDir, opts) {
    opts = opts || {};
    if (opts._pyQuery) return opts._pyQuery();
    if (PYQ.dirs && Date.now() - PYQ.at < 300000) return PYQ.dirs;
    var py = pythonExe(baseDir);
    var out = [];
    if (py) {
        try {
            var code = "import importlib.util,os,glob\n" +
                       "s=importlib.util.find_spec('nvidia')\n" +
                       "locs=list(s.submodule_search_locations) if s and s.submodule_search_locations else []\n" +
                       "ds=sorted({d for b in locs for d in glob.glob(os.path.join(b,'*','bin'))})\n" +
                       "print(chr(10).join(ds))";
            var r = spawnSync(py, ["-c", code], { windowsHide: true, timeout: 15000, encoding: "utf8" });
            if (!r.error && r.status === 0)
                out = String(r.stdout || "").split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
        } catch (e) {}
    }
    PYQ = { at: Date.now(), dirs: out };
    return out;
}
function cudaDllDirs(baseDir, opts) {
    var roots = [];
    var rtPy = path.join(String(baseDir || ""), "_RUNTIME", "python");
    roots.push(path.join(String(baseDir || ""), "_RUNTIME", "whisper", "Lib", "site-packages", "nvidia"));   // (Conductor) the app's own whisper venv
    roots.push(path.join(rtPy, "Lib", "site-packages", "nvidia"));
    var pys = pyScriptDirs();
    for (var i = 0; i < pys.length; i++)
        roots.push(path.join(path.dirname(pys[i]), "site-packages", "nvidia"));
    if (process.env.LOCALAPPDATA) {
        var progs = path.join(process.env.LOCALAPPDATA, "Programs", "Python");
        try {
            fs.readdirSync(progs).forEach(function (d) {
                roots.push(path.join(progs, d, "Lib", "site-packages", "nvidia"));
            });
        } catch (e) {}
    }
    var out = [];
    roots.forEach(function (r) {
        try {
            fs.readdirSync(r).forEach(function (pkg) {
                var b = path.join(r, pkg, "bin");
                try { if (fs.statSync(b).isDirectory()) out.push(b); } catch (e2) {}
            });
        } catch (e3) {}
    });
    if (!out.length) {
        var viaPy = pyNvidiaBinDirs(baseDir, opts);
        for (var v = 0; v < viaPy.length; v++) out.push(viaPy[v]);
    }
    return out;
}

var os = require("os");
/* probe the machine once: CPU threads, RAM, NVIDIA GPU + VRAM, CUDA libs */
function detectSpecs(baseDir, opts) {
    opts = opts || {};
    var s = { threads: 0, ramGb: 0, gpuName: null, vramGb: 0, cudaLibs: false };
    try { s.threads = (os.cpus() || []).length; } catch (e) {}
    try { s.ramGb = Math.round(os.totalmem() / (1024 * 1024 * 1024)); } catch (e2) {}
    s.cudaLibs = cudaDllDirs(baseDir).length > 0;
    var smi = opts.smi || function () {
        var r = spawnSync("nvidia-smi", ["--query-gpu=name,memory.total", "--format=csv,noheader,nounits"],
                          { windowsHide: true, timeout: 10000, encoding: "utf8" });
        return (!r.error && r.status === 0) ? String(r.stdout || "") : "";
    };
    try {
        var line = String(smi()).split(/\r?\n/)[0].trim();
        if (line) {
            var parts = line.split(",");
            s.gpuName = parts[0].trim();
            s.vramGb = Math.round((parseInt(parts[1], 10) || 0) / 1024 * 10) / 10;
        }
    } catch (e3) {}
    return s;
}
/* pure: specs → the strongest safe whisper configuration */
function autoWhisperProfile(s) {
    var threads = Math.min(Math.max(s.threads || 4, 2), 16);
    if (s.gpuName && s.cudaLibs && s.vramGb >= 2.5) {
        var model = s.vramGb >= 4 ? "distil-large-v3" : "small";
        return { device: "cuda", model: model, threads: threads,
                 why: s.gpuName + " " + s.vramGb + "GB · CUDA libs ok" };
    }
    var cpuModel = (threads >= 12 && (s.ramGb || 0) >= 16) ? "small" : "base";
    return { device: "cpu", model: cpuModel, threads: threads,
             wantGpuLibs: !!(s.gpuName && !s.cudaLibs),
             why: (s.gpuName ? s.gpuName + " found but CUDA libs missing — " : "no NVIDIA GPU — ") +
                  threads + " CPU threads" };
}

/* free gigabytes on the volume holding p (statfs when available, PS fallback) */
function diskFreeGb(p) {
    try {
        var st = fs.statfsSync ? fs.statfsSync(p) : null;
        if (st) return Math.round(st.bavail * st.bsize / 1e9 * 10) / 10;
    } catch (e) {}
    try {
        var drive = path.resolve(p).slice(0, 2);
        var r = spawnSync("powershell", ["-NoProfile", "-Command",
            "(Get-PSDrive " + drive.replace(":", "") + ").Free"], { windowsHide: true, timeout: 15000, encoding: "utf8" });
        var n = parseInt(String(r.stdout || "").trim(), 10);
        if (isFinite(n)) return Math.round(n / 1e9 * 10) / 10;
    } catch (e2) {}
    try {   // last resort: parse "dir" (en-US "bytes free" — nightly showed free=null on this host)
        var drive3 = path.resolve(p).slice(0, 2);
        var r3 = spawnSync("cmd", ["/c", "dir", drive3 + "\\"], { windowsHide: true, timeout: 15000, encoding: "utf8" });
        var m3 = String(r3.stdout || "").match(/([\d,\.]+)\s+bytes free/i);
        if (m3) {
            var n3 = parseInt(m3[1].replace(/[,\.]/g, ""), 10);
            if (isFinite(n3)) return Math.round(n3 / 1e9 * 10) / 10;
        }
    } catch (e3) {}
    return null;
}
function verCmp(a, b) {                                        // 1 if a>b, -1 if a<b, 0 equal
    var pa = String(a).split("."), pb = String(b).split(".");
    for (var i = 0; i < 3; i++) {
        var x = parseInt(pa[i] || 0, 10), y = parseInt(pb[i] || 0, 10);
        if (x !== y) return x > y ? 1 : -1;
    }
    return 0;
}
/* what a title is waiting on — chips for the Start rows + process-all-ready */
function titleReadiness(titleFolder) {
    var r = { pkg: false, maps: false, allmaps: false, srt: false };
    var sd = path.join(titleFolder, "Script");
    try {
        fs.readdirSync(sd).forEach(function (f) {
            if (/_manifest\.json$/i.test(f) || /_package\.zip$/i.test(f)) r.pkg = true;
            if (/_word_level\.srt$/i.test(f)) r.srt = true;
        });
    } catch (e) {}
    try {
        fs.readdirSync(titleFolder).forEach(function (f) {
            if (/_manifest\.json$/i.test(f)) r.pkg = true;
            if (/_word_level\.srt$/i.test(f)) r.srt = true;
        });
    } catch (e2) {}
    try {
        fs.readdirSync(path.join(titleFolder, "Maps")).forEach(function (f) {
            if (/\.(png|jpe?g|webp|tiff?)$/i.test(f)) r.maps = true;
            if (/_all(maps|animations)\.json$/i.test(f)) r.allmaps = true;   // (1.6.x) _allanimations.json; legacy _allmaps.json still counts
        });
    } catch (e3) {}
    return r;
}
module.exports = { verCmp: verCmp, titleReadiness: titleReadiness, diskFreeGb: diskFreeGb, resolve: resolve, pythonExe: pythonExe, runtimeDirs: runtimeDirs, cudaDllDirs: cudaDllDirs, cudaDllDirsFromPython: pyNvidiaBinDirs,
                   detectSpecs: detectSpecs, autoWhisperProfile: autoWhisperProfile };
