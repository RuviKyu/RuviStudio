/* ============================================================================
   lib/provision.js — the app fetches its own prerequisites (no PowerShell, no
   admin): ffmpeg/ffprobe (static build) → runtime/ffmpeg/, Chrome for Testing →
   runtime/chrome/ (only when neither Chrome nor Edge is installed), and the
   puppeteer-core package (npm install, or the portable Node's npm). Reports
   progress through a status object the UI polls. Idempotent.
   ========================================================================== */
"use strict";
var fs = require("fs"), path = require("path"), os = require("os"), https = require("https"), http = require("http"), cp = require("child_process");
var UZ = require("./unzip.js");

var status = { running: false, step: "", pct: 0, msg: "", log: [], error: "", done: false };
function say(m) { status.msg = m; status.log.push(new Date().toISOString().slice(11, 19) + " " + m); if (status.log.length > 200) status.log.shift(); }

function download(u, dest, onPct, hops) {
    hops = hops || 0;
    return new Promise(function (resolve, reject) {
        if (hops > 8) return reject(new Error("too many redirects"));
        var mod = /^https:/.test(u) ? https : http;
        var req = mod.get(u, { headers: { "User-Agent": "RUVI-Conductor-Special/1.0 (provisioning)" } }, function (res) {
            if ([301, 302, 303, 307, 308].indexOf(res.statusCode) >= 0 && res.headers.location) { res.resume(); return download(new URL(res.headers.location, u).href, dest, onPct, hops + 1).then(resolve, reject); }
            if (res.statusCode !== 200) { res.resume(); return reject(new Error("HTTP " + res.statusCode + " for " + u)); }
            var total = parseInt(res.headers["content-length"] || "0", 10), got = 0, ws = fs.createWriteStream(dest + ".part");
            res.on("data", function (d) { got += d.length; if (onPct && total) onPct(Math.round(got / total * 100)); });
            res.pipe(ws); ws.on("finish", function () { ws.close(function () {
                try { var head = Buffer.alloc(16), fd = fs.openSync(dest + ".part", "r"); fs.readSync(fd, head, 0, 16, 0); fs.closeSync(fd); if (/^\s*<(!doctype|html)/i.test(head.toString("latin1"))) { fs.unlinkSync(dest + ".part"); return reject(new Error("the server answered with a web page instead of the file (rate limit or mirror down) — try again later")); } fs.renameSync(dest + ".part", dest); } catch (e) { return reject(e); }
                resolve(dest); }); }); ws.on("error", reject);
        });
        req.on("error", reject); req.setTimeout(60000, function () { req.destroy(new Error("timeout")); });
    });
}
function walk(dir, re, depth) { if (depth < 0) return ""; var names; try { names = fs.readdirSync(dir); } catch (e) { return ""; } for (var i = 0; i < names.length; i++) { var p = path.join(dir, names[i]); try { var st = fs.statSync(p); if (st.isFile() && re.test(names[i])) return p; if (st.isDirectory()) { var r = walk(p, re, depth - 1); if (r) return r; } } catch (e2) {} } return ""; }
function which(bin) { try { var r = cp.spawnSync(process.platform === "win32" ? "where" : "which", [bin], { encoding: "utf8", windowsHide: true }); if (r.status === 0) return r.stdout.trim().split(/\r?\n/)[0]; } catch (e) {} return ""; }

/* ---- ffmpeg ---------------------------------------------------------------- */
function ffmpegPaths(root) {
    var ext = process.platform === "win32" ? ".exe" : "", dir = path.join(root, "runtime", "ffmpeg");
    var ff = path.join(dir, "ffmpeg" + ext), fp = path.join(dir, "ffprobe" + ext);
    if (fs.existsSync(ff) && fs.existsSync(fp)) return { ffmpeg: ff, ffprobe: fp, via: "runtime" };
    var w1 = which("ffmpeg"), w2 = which("ffprobe"); if (w1 && w2) return { ffmpeg: w1, ffprobe: w2, via: "system" };
    return null;
}
function ensureFfmpeg(root) {
    var have = ffmpegPaths(root); if (have) return Promise.resolve(have);
    var dir = path.join(root, "runtime", "ffmpeg"); fs.mkdirSync(dir, { recursive: true });
    var plat = process.platform, arch = process.arch;
    if (plat === "win32") {
        var zip = path.join(dir, "ffmpeg.zip");
        say("ffmpeg: downloading a static build (BtbN, ~90 MB)");
        return download("https://github.com/BtbN/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-win64-gpl.zip", zip, function (p) { status.pct = p; })
            .then(function () { say("ffmpeg: unpacking"); var tmp = path.join(dir, "tmp"); UZ.extract(zip, tmp, { filter: function (rel) { return /\/bin\/ff(mpeg|probe)\.exe$/i.test(rel) || /(^|\/)ff(mpeg|probe)\.exe$/i.test(rel); } });
                var ff = walk(tmp, /^ffmpeg\.exe$/i, 5), fp = walk(tmp, /^ffprobe\.exe$/i, 5); if (!ff || !fp) throw new Error("ffmpeg.exe / ffprobe.exe not found in the archive");
                fs.copyFileSync(ff, path.join(dir, "ffmpeg.exe")); fs.copyFileSync(fp, path.join(dir, "ffprobe.exe")); fs.rmSync(tmp, { recursive: true, force: true }); fs.unlinkSync(zip); say("ffmpeg: installed into runtime\\ffmpeg"); return ffmpegPaths(root); });
    }
    if (plat === "darwin") {
        say("ffmpeg: downloading static builds (evermeet.cx)");
        var z1 = path.join(dir, "ffmpeg.zip"), z2 = path.join(dir, "ffprobe.zip");
        return download("https://evermeet.cx/ffmpeg/getrelease/zip", z1, function (p) { status.pct = p / 2; }).then(function () { return download("https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip", z2, function (p) { status.pct = 50 + p / 2; }); })
            .then(function () { UZ.extract(z1, dir, {}); UZ.extract(z2, dir, {}); fs.chmodSync(path.join(dir, "ffmpeg"), 0o755); fs.chmodSync(path.join(dir, "ffprobe"), 0o755); fs.unlinkSync(z1); fs.unlinkSync(z2); say("ffmpeg: installed"); return ffmpegPaths(root); });
    }
    // linux: static build (BtbN FFmpeg-Builds on GitHub, same source as Windows), needs tar + xz on the box
    var txz = path.join(dir, "ffmpeg.tar.xz"), a = arch === "arm64" ? "linuxarm64" : "linux64";
    say("ffmpeg: downloading a static build (BtbN, ~40 MB)");
    return download("https://github.com/BtbN/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-" + a + "-gpl.tar.xz", txz, function (p) { status.pct = p; })
        .then(function () { var tmp = path.join(dir, "tmp"); fs.mkdirSync(tmp, { recursive: true }); var r = cp.spawnSync("tar", ["-xJf", txz, "-C", tmp], { env: Object.assign({}, process.env, { PATH: (process.env.PATH || "") + ":/usr/bin:/bin:/usr/local/bin" }) }); if (r.status !== 0) throw new Error("tar failed: " + ((r.stderr || "").toString() || (r.error && r.error.message) || "").slice(0, 200));
            var ff = walk(tmp, /^ffmpeg$/, 4), fp = walk(tmp, /^ffprobe$/, 4); if (!ff || !fp) throw new Error("ffmpeg not in the archive"); fs.copyFileSync(ff, path.join(dir, "ffmpeg")); fs.copyFileSync(fp, path.join(dir, "ffprobe")); fs.chmodSync(path.join(dir, "ffmpeg"), 0o755); fs.chmodSync(path.join(dir, "ffprobe"), 0o755); fs.rmSync(tmp, { recursive: true, force: true }); fs.unlinkSync(txz); say("ffmpeg: installed"); return ffmpegPaths(root); });
}

/* ---- puppeteer-core (npm) --------------------------------------------------- */
function hasPuppeteer(root) { try { require.resolve("puppeteer-core", { paths: [root] }); return true; } catch (e) {} try { require.resolve("puppeteer", { paths: [root] }); return true; } catch (e2) {} return false; }
function npmBin() {
    var nodeDir = path.dirname(process.execPath), cand = process.platform === "win32" ? [path.join(nodeDir, "npm.cmd"), which("npm.cmd"), which("npm")] : [path.join(nodeDir, "npm"), which("npm")];
    for (var i = 0; i < cand.length; i++) if (cand[i] && fs.existsSync(cand[i])) return cand[i];
    return "";
}
function ensurePuppeteer(root) {
    if (hasPuppeteer(root)) return Promise.resolve(true);
    var npm = npmBin(); if (!npm) return Promise.reject(new Error("npm not found next to node — run `npm install` in the app folder once"));
    say("renderer package: npm install puppeteer-core");
    return new Promise(function (resolve, reject) {
        var p = cp.spawn(npm, ["install", "--omit=dev", "--no-audit", "--no-fund", "--loglevel=error"], { cwd: root, windowsHide: true, shell: process.platform === "win32" });
        var err = ""; p.stderr.on("data", function (d) { err += d.toString(); }); p.on("error", reject);
        p.on("close", function (code) { if (code === 0 && hasPuppeteer(root)) { say("renderer package: installed"); resolve(true); } else reject(new Error("npm install failed: " + err.slice(-300))); });
    });
}

/* ---- Chrome (only when the machine has none) ------------------------------- */
function findChrome(root, cfgPath) {
    if (cfgPath && fs.existsSync(cfgPath)) return cfgPath;
    var rt = walk(path.join(root, "runtime", "chrome"), process.platform === "win32" ? /^chrome\.exe$/i : /^(chrome|Google Chrome for Testing)$/, 6); if (rt) return rt;
    var c = process.platform === "win32" ? [path.join(process.env["PROGRAMFILES"] || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"), path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"), path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"), path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Microsoft", "Edge", "Application", "msedge.exe"), path.join(process.env["PROGRAMFILES"] || "C:\\Program Files", "Microsoft", "Edge", "Application", "msedge.exe")]
        : process.platform === "darwin" ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"] : ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/snap/bin/chromium"];
    for (var i = 0; i < c.length; i++) if (c[i] && fs.existsSync(c[i])) return c[i];
    try { var pp = require("puppeteer"); var ex = pp.executablePath(); if (ex && fs.existsSync(ex)) return ex; } catch (e) {}
    return "";
}
function ensureChrome(root, cfgPath) {
    var have = findChrome(root, cfgPath); if (have) return Promise.resolve(have);
    var B; try { B = require("@puppeteer/browsers"); } catch (e) { return Promise.reject(new Error("no Chrome or Edge installed and @puppeteer/browsers is unavailable — install Google Chrome")); }
    say("browser: none installed — downloading Chrome for Testing (~150 MB)");
    var cache = path.join(root, "runtime", "chrome"); fs.mkdirSync(cache, { recursive: true });
    return B.resolveBuildId("chrome", B.detectBrowserPlatform(), "stable").then(function (buildId) {
        return B.install({ browser: "chrome", buildId: buildId, cacheDir: cache, downloadProgressCallback: function (got, total) { if (total) status.pct = Math.round(got / total * 100); } });
    }).then(function (r) { say("browser: Chrome for Testing installed"); return r.executablePath; });
}

/* ---- fonts: the open ones the renderer needs, inside the app (Algerian is Windows' own and is read from Windows\Fonts) ---- */
var FONTS = [["PirataOne-Regular.ttf", "https://github.com/google/fonts/raw/main/ofl/pirataone/PirataOne-Regular.ttf"], ["Cinzel.ttf", "https://github.com/google/fonts/raw/main/ofl/cinzel/Cinzel%5Bwght%5D.ttf"]];
function ensureFonts(root) {
    var dir = path.join(root, "runtime", "fonts"); fs.mkdirSync(dir, { recursive: true }); var chain = Promise.resolve(), got = [];
    FONTS.forEach(function (f) { var dest = path.join(dir, f[0]); if (fs.existsSync(dest) && fs.statSync(dest).size > 10000) return; chain = chain.then(function () { say("fonts: fetching " + f[0]); return download(f[1], dest, null).then(function () { got.push(f[0]); }).catch(function (e) { say("fonts: " + f[0] + " not fetched (" + e.message + ") — a fallback face is used"); }); }); });
    return chain.then(function () { return got; });
}
/* ---- all of it ----------------------------------------------------------------- */
function ensureAll(root, opts) {
    opts = opts || {}; if (status.running) return Promise.resolve(status);
    status = { running: true, step: "", pct: 0, msg: "", log: [], error: "", done: false }; var result = {};
    return Promise.resolve()
        .then(function () { status.step = "ffmpeg"; status.pct = 0; return ensureFfmpeg(root); }).then(function (r) { result.ffmpeg = r; })
        .then(function () { status.step = "renderer"; status.pct = 0; return ensurePuppeteer(root); })
        .then(function () { status.step = "fonts"; status.pct = 0; return ensureFonts(root); })
        .then(function () { status.step = "browser"; status.pct = 0; return ensureChrome(root, opts.chrome); }).then(function (c) { result.chrome = c; })
        .then(function () { status.running = false; status.done = true; status.step = "done"; status.pct = 100; status.msg = "all prerequisites present"; result.status = status; return result; })
        .catch(function (e) { status.running = false; status.error = String(e && e.message || e); status.msg = "FAILED at " + status.step + ": " + status.error; say(status.msg); throw e; });
}
module.exports = { ensureAll: ensureAll, ensureFfmpeg: ensureFfmpeg, ensureChrome: ensureChrome, ensurePuppeteer: ensurePuppeteer, ffmpegPaths: ffmpegPaths, findChrome: findChrome, hasPuppeteer: hasPuppeteer, status: function () { return status; } };

/* ============================================================================
   whisper-ctranslate2 + CUDA — a self-contained Python runtime the app builds
   itself with uv (Astral's single-binary installer): <base>\_RUNTIME\python is
   the very folder RUVI Studio's toolbox looks at (pythonExe / cudaDllDirs), so
   the Studio's own Grab tab benefits too.
     runtime/uv/uv(.exe)                      uv itself (GitHub release zip/tar)
     <base>/_RUNTIME/python/                  a venv (python.exe copied to its root)
        Scripts/whisper-ctranslate2(.exe)     the tool
        Lib/site-packages/nvidia/(pkg)/bin    cuBLAS + cuDNN DLLs (pip wheels) when an NVIDIA GPU is present
   ========================================================================== */
function uvBin(root) { var d = path.join(root, "runtime", "uv"), ex = process.platform === "win32" ? "uv.exe" : "uv"; var p = walk(d, new RegExp("^" + ex + "$"), 3); if (p) return p; var w = which("uv"); return w || ""; }
function ensureUv(root) {
    var have = uvBin(root); if (have) return Promise.resolve(have);
    var d = path.join(root, "runtime", "uv"); fs.mkdirSync(d, { recursive: true });
    var plat = process.platform, arch = process.arch;
    var name = plat === "win32" ? "uv-x86_64-pc-windows-msvc.zip" : plat === "darwin" ? (arch === "arm64" ? "uv-aarch64-apple-darwin.tar.gz" : "uv-x86_64-apple-darwin.tar.gz") : (arch === "arm64" ? "uv-aarch64-unknown-linux-gnu.tar.gz" : "uv-x86_64-unknown-linux-gnu.tar.gz");
    var dest = path.join(d, name); say("uv: downloading " + name);
    return download("https://github.com/astral-sh/uv/releases/latest/download/" + name, dest, function (p) { status.pct = p; }).then(function () {
        if (/\.zip$/.test(name)) UZ.extract(dest, d, {}); else { var r = cp.spawnSync("tar", ["-xzf", dest, "-C", d, "--strip-components=1"], { env: Object.assign({}, process.env, { PATH: (process.env.PATH || "") + ":/usr/bin:/bin" }) }); if (r.status !== 0) throw new Error("tar failed for uv"); }
        try { fs.unlinkSync(dest); } catch (e) {}
        var b = uvBin(root); if (!b) throw new Error("uv did not unpack"); try { fs.chmodSync(b, 0o755); } catch (e2) {} return b;
    });
}
/* the app's OWN whisper environment: <base>/_RUNTIME/whisper — always a uv venv (uv pip works), never the Studio's
   portable Python. RUVI Studio's toolbox is pointed at it through a junction of the nvidia package into
   <base>/_RUNTIME/python/Lib/site-packages (when that runtime exists) and, in this app, through the patched toolbox. */
var APP_ROOT = path.resolve(__dirname, "..");                                   // the app folder: every runtime piece lives under <app>\runtime\
function whisperDir(base) { return path.join(APP_ROOT, "runtime", "whisper"); }   // (self-contained) the venv travels with the app; `base` is kept in the signatures for compatibility
function cpythonDir() { return path.join(APP_ROOT, "runtime", "cpython"); }
function runtimePython(base) { var d = whisperDir(base); var p = process.platform === "win32" ? path.join(d, "Scripts", "python.exe") : path.join(d, "bin", "python3"); return fs.existsSync(p) ? p : ""; }
function whisperBin(base) { var d = whisperDir(base); var p = process.platform === "win32" ? path.join(d, "Scripts", "whisper-ctranslate2.exe") : path.join(d, "bin", "whisper-ctranslate2"); if (fs.existsSync(p)) return p; return which("whisper-ctranslate2") || ""; }
function sitePackages(base) { var d = whisperDir(base); if (process.platform === "win32") return path.join(d, "Lib", "site-packages"); try { var libs = fs.readdirSync(path.join(d, "lib")).filter(function (x) { return /^python3/.test(x); }); if (libs.length) return path.join(d, "lib", libs[0], "site-packages"); } catch (e) {} return ""; }
function cudaDirs(base) { var sp = sitePackages(base), out = []; if (!sp) return out; var nv = path.join(sp, "nvidia"); try { fs.readdirSync(nv).forEach(function (pkg) { var b = path.join(nv, pkg, process.platform === "win32" ? "bin" : "lib"); try { if (fs.statSync(b).isDirectory()) out.push(b); } catch (e) {} }); } catch (e2) {} return out; }
function whisperEnvPath(base) { var d = whisperDir(base), bins = [process.platform === "win32" ? path.join(d, "Scripts") : path.join(d, "bin")].concat(cudaDirs(base)); return bins.filter(function (p) { return fs.existsSync(p); }); }
function hasNvidia() { if (process.env.RUVI_FAKE_GPU) return process.env.RUVI_FAKE_GPU; try { var r = cp.spawnSync("nvidia-smi", ["--query-gpu=name,memory.total", "--format=csv,noheader"], { encoding: "utf8", windowsHide: true, timeout: 8000 }); if (r.status === 0) return String(r.stdout || "").trim().split(/\r?\n/)[0]; } catch (e) {} return ""; }
function runTool(bin, args, onLine, env) {
    return new Promise(function (resolve, reject) {
        var p = cp.spawn(bin, args, { windowsHide: true, env: Object.assign({}, process.env, env || {}) }), tail = "";
        function feed(d) { var s = d.toString(); tail = (tail + s).slice(-1500); s.split(/\r?\n/).forEach(function (l) { if (l.trim() && onLine) onLine(l.trim()); }); }
        p.stdout.on("data", feed); p.stderr.on("data", feed); p.on("error", reject);
        p.on("close", function (code) { code === 0 ? resolve(tail) : reject(new Error(path.basename(bin) + " exited " + code + ": " + tail.split(/\r?\n/).slice(-3).join(" | "))); });
    });
}
/* does ctranslate2 in this environment see a CUDA device? (the DLLs must be on PATH for the probe) */
function cudaProbe(base) {
    var py = runtimePython(base); if (!py) return { devices: 0, error: "no python" };
    var pk = "PATH"; for (var k in process.env) if (String(k).toUpperCase() === "PATH") { pk = k; break; }
    var env = Object.assign({}, process.env); env[pk] = whisperEnvPath(base).join(path.delimiter) + path.delimiter + (env[pk] || "");
    var r = cp.spawnSync(py, ["-c", "import ctranslate2;print(ctranslate2.get_cuda_device_count())"], { encoding: "utf8", windowsHide: true, timeout: 60000, env: env });
    if (r.status !== 0) return { devices: 0, error: String(r.stderr || "").trim().split(/\r?\n/).pop() };
    return { devices: parseInt(String(r.stdout || "0").trim(), 10) || 0, error: "" };
}
/* let RUVI Studio's own Grab tab see the CUDA libs too: a junction/symlink of the nvidia package into its runtime's site-packages */
function shareRuntimeWithStudio(base) {
    var d = whisperDir(base), link = path.join(base, "_RUNTIME", "python"); if (!fs.existsSync(path.join(d, "pyvenv.cfg"))) return "";
    try { fs.mkdirSync(path.dirname(link), { recursive: true }); var st = null; try { st = fs.lstatSync(link); } catch (e) {}
        if (st && st.isSymbolicLink()) { if (fs.readlinkSync(link) === d) return link; fs.unlinkSync(link); } else if (st) return "";   // a real folder of the Studio's own stays untouched
        fs.symlinkSync(d, link, "junction"); return link; } catch (e2) { return ""; }
}
function shareCudaWithStudio(base) {
    var sp = sitePackages(base), src = sp ? path.join(sp, "nvidia") : ""; if (!src || !fs.existsSync(src)) return "";
    var studio = path.join(base, "_RUNTIME", "python", "Lib", "site-packages"); if (!fs.existsSync(studio)) return "";
    var dst = path.join(studio, "nvidia"); if (fs.existsSync(dst)) return "";
    try { fs.symlinkSync(src, dst, "junction"); return dst; } catch (e) { return ""; }
}
/* the venv records its base CPython by absolute path (pyvenv.cfg `home`, and bin symlinks on Linux); when the app folder moves,
   point it at the CPython that moved with it — a one-second fix instead of a rebuild */
function relocateRuntime(base) {
    var d = whisperDir(base), cfg = path.join(d, "pyvenv.cfg"); if (!fs.existsSync(cfg)) return false;
    var cp0 = walk(cpythonDir(), process.platform === "win32" ? /^python\.exe$/i : /^python3(\.\d+)?$/, 4); if (!cp0) return false;
    var home = path.dirname(cp0), txt = fs.readFileSync(cfg, "utf8"), fixed = txt.replace(/^home\s*=.*$/m, "home = " + home);
    if (fixed !== txt) fs.writeFileSync(cfg, fixed);
    // the venv's scripts carry an absolute shebang / interpreter path to the OLD venv location: rewrite it (uv's Windows .exe trampolines find python.exe beside themselves and need nothing)
    var binDir = process.platform === "win32" ? path.join(d, "Scripts") : path.join(d, "bin");
    try { fs.readdirSync(binDir).forEach(function (n) { var f = path.join(binDir, n); try { var st = fs.lstatSync(f); if (!st.isFile() || st.size > 2000000) return; } catch (e) { return; }
        var buf = fs.readFileSync(f); if (buf[0] !== 0x23 || buf[1] !== 0x21) return;                      // not a '#!' script
        var nl = buf.indexOf(10); if (nl < 0) return; var line = buf.slice(0, nl).toString("utf8"), i = line.indexOf("runtime" + path.sep + "whisper"); if (i < 0) i = line.indexOf("runtime/whisper");
        if (i < 0) return; var rest = line.slice(i + ("runtime/whisper").length), newLine = "#!" + path.join(d, rest.replace(/^[\\/]/, ""));
        if (newLine !== line) fs.writeFileSync(f, Buffer.concat([Buffer.from(newLine, "utf8"), buf.slice(nl)])); }); } catch (e4) {}
    if (process.platform !== "win32") { var bin = path.join(d, "bin"); ["python", "python3"].forEach(function (n) { var l = path.join(bin, n); try { var st = fs.lstatSync(l); if (st.isSymbolicLink()) { fs.unlinkSync(l); fs.symlinkSync(cp0, l); } } catch (e) {} }); try { var v = fs.readdirSync(bin).filter(function (n) { return /^python3\.\d+$/.test(n); })[0]; if (v) { var l2 = path.join(bin, v); try { fs.unlinkSync(l2); } catch (e2) {} fs.symlinkSync(cp0, l2); } } catch (e3) {} }
    return true;
}
function runtimeHealthy(base) {
    var py = runtimePython(base); if (!py) return false;
    try { var r = cp.spawnSync(py, ["-c", "import sys; print(sys.version_info[0])"], { encoding: "utf8", windowsHide: true, timeout: 20000 }); return r.status === 0 && /^3/.test(String(r.stdout || "").trim()); } catch (e) { return false; }
}
function ensureWhisper(root, base, opts) {
    opts = opts || {}; var gpu = hasNvidia(), pyDir = whisperDir(base);
    // a venv whose base CPython lived under an old app folder cannot start ("uv trampoline failed to spawn Python child process:
    // entity not found") — detect it and rebuild from scratch; the base CPython now lives under <base>\_RUNTIME, not the app folder
    if (fs.existsSync(path.join(pyDir, "pyvenv.cfg")) && !runtimeHealthy(base)) {
        try { if (relocateRuntime(base) && runtimeHealthy(base)) say("whisper: runtime re-pointed at the CPython that moved with the app"); } catch (e0) {}
    }
    if (fs.existsSync(path.join(pyDir, "pyvenv.cfg")) && !runtimeHealthy(base)) {
        say("whisper: the existing runtime at " + pyDir + " cannot start its Python — rebuilding it");
        try { fs.rmSync(pyDir, { recursive: true, force: true }); } catch (e) { try { fs.renameSync(pyDir, pyDir + ".broken-" + Date.now()); } catch (e2) {} }
    }
    var haveTool = whisperBin(base), haveCuda = cudaDirs(base).length > 0;
    if (haveTool && runtimePython(base) && (!gpu || haveCuda || opts.skipCuda) && !opts.prefetchModel) return Promise.resolve({ tool: haveTool, python: runtimePython(base), gpu: gpu, cuda: haveCuda, probe: gpu && haveCuda ? cudaProbe(base) : null });
    var uv;
    return ensureUv(root).then(function (u) { uv = u; status.step = "python"; status.pct = 0; say("python: CPython 3.11 via uv (managed, no admin)"); fs.mkdirSync(path.dirname(pyDir), { recursive: true });
        var env = { UV_PYTHON_INSTALL_DIR: cpythonDir(), UV_CACHE_DIR: path.join(APP_ROOT, "runtime", "uv-cache") };
        return runTool(uv, ["python", "install", "3.11"], function (l) { status.msg = "python: " + l.slice(0, 120); }, env).then(function () { return env; });
    }).then(function (env) {
        if (runtimePython(base)) return env;
        say("python: creating the whisper environment in " + pyDir);
        return runTool(uv, ["venv", pyDir, "--python", "3.11", "--seed"], function (l) { status.msg = "venv: " + l.slice(0, 120); }, env).then(function () { return env; });
    }).then(function (env) {
        var py = runtimePython(base); if (!py) throw new Error("python runtime missing after venv");
        if (haveTool && runtimePython(base) && (!gpu || haveCuda || opts.skipCuda)) return env;                  // only the model prefetch was asked for
        var pkgs = ["whisper-ctranslate2"]; if (gpu && !opts.skipCuda) pkgs.push("nvidia-cublas-cu12", "nvidia-cudnn-cu12");
        status.step = "whisper"; status.pct = 0; say("whisper: installing " + pkgs.join(", ") + (gpu ? " (NVIDIA " + gpu + " → CUDA 12 wheels, ~1 GB)" : " (CPU)"));
        return runTool(uv, ["pip", "install", "--python", py, "--upgrade"].concat(pkgs), function (l) { status.msg = "pip: " + l.slice(0, 120); if (/Downloading|Installing/.test(l)) say("pip: " + l.slice(0, 100)); }, env).then(function () { return env; });
    }).then(function () {
        var tool = whisperBin(base); if (!tool) throw new Error("whisper-ctranslate2 not found after install");
        var probe = (gpu && !opts.skipCuda) ? cudaProbe(base) : null;
        say("whisper: " + tool + (gpu ? (" · CUDA libs: " + cudaDirs(base).length + " dir(s) · ctranslate2 sees " + (probe ? probe.devices : 0) + " CUDA device(s)" + (probe && probe.error ? " (" + probe.error.slice(0, 120) + ")" : "")) : " · CPU"));
        var shared = shareCudaWithStudio(base); if (shared) say("whisper: CUDA libs shared with RUVI Studio's runtime (" + shared + ")");
        if (opts.prefetchModel) {
            status.step = "model"; status.pct = 0; say("whisper: prefetching the model " + opts.prefetchModel + " (first grab would otherwise wait for it)");
            var py = runtimePython(base), pk = "PATH"; for (var k in process.env) if (String(k).toUpperCase() === "PATH") { pk = k; break; }
            var env2 = {}; env2[pk] = whisperEnvPath(base).join(path.delimiter) + path.delimiter + (process.env[pk] || "");
            return runTool(py, ["-c", "from faster_whisper import WhisperModel; WhisperModel('" + opts.prefetchModel + "', device='cpu', compute_type='int8'); print('model ready')"], function (l) { status.msg = "model: " + l.slice(0, 120); }, env2).then(function () { say("whisper: model ready"); return { tool: tool, python: py, gpu: gpu, cuda: cudaDirs(base).length > 0, probe: probe }; });
        }
        return { tool: tool, python: runtimePython(base), gpu: gpu, cuda: cudaDirs(base).length > 0, probe: probe };
    });
}
module.exports.runtimeHealthy = runtimeHealthy; module.exports.relocateRuntime = relocateRuntime; module.exports.shareRuntimeWithStudio = shareRuntimeWithStudio; module.exports.APP_ROOT = APP_ROOT; module.exports.ensureFonts = ensureFonts; module.exports.ensureUv = ensureUv; module.exports.ensureWhisper = ensureWhisper; module.exports.whisperBin = whisperBin; module.exports.runtimePython = runtimePython; module.exports.hasNvidia = hasNvidia; module.exports.cudaDirs = cudaDirs; module.exports.whisperEnvPath = whisperEnvPath; module.exports.cudaProbe = cudaProbe; module.exports.whisperDir = whisperDir;
