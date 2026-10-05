/* ============================================================================
   lib/render/capture.js — RUVI Conductor · renders a special section (HOOK / MAP /
   REF / CHAR) with headless Chrome: scene.html builds the scene from the bundle
   object, the page is stepped frame by frame (window.seek(t)), every frame is
   screenshotted and piped into ffmpeg → Renders\S###_TYPE#.mp4. No Adobe apps.

   Chrome: config.chrome (path) → the `puppeteer` package's Chrome (if installed
   next to the Conductor) → the system Chrome/Edge (Windows/macOS/Linux paths).
   ========================================================================== */
"use strict";
var fs = require("fs"), path = require("path"), os = require("os"), spawn = require("child_process").spawn;
var FF = require("../ffmpeg.js");

function findChrome(cfg) {
    if (cfg && cfg.chrome && fs.existsSync(cfg.chrome)) return { path: cfg.chrome, via: "config" };
    var rt = walkFor(path.join(__dirname, "..", "..", "runtime", "chrome"), process.platform === "win32" ? /^chrome\.exe$/i : /^(chrome|Google Chrome for Testing)$/, 6);
    if (rt) return { path: rt, via: "runtime" };
    try { var pp = require("puppeteer"); var ex = pp.executablePath(); if (ex && fs.existsSync(ex)) return { path: ex, via: "puppeteer" }; } catch (e) {}
    var cands = process.platform === "win32" ? [
        path.join(process.env["PROGRAMFILES"] || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
        path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
        path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
        path.join(process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)", "Microsoft", "Edge", "Application", "msedge.exe"),
        path.join(process.env["PROGRAMFILES"] || "C:\\Program Files", "Microsoft", "Edge", "Application", "msedge.exe")
    ] : process.platform === "darwin" ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"]
        : ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/snap/bin/chromium"];
    for (var i = 0; i < cands.length; i++) if (cands[i] && fs.existsSync(cands[i])) return { path: cands[i], via: "system" };
    return null;
}
function walkFor(dir, re, depth) {
    if (depth < 0) return ""; var names; try { names = fs.readdirSync(dir); } catch (e) { return ""; }
    for (var i = 0; i < names.length; i++) { var p = path.join(dir, names[i]); try { var st = fs.statSync(p); if (st.isFile() && re.test(names[i])) return p; if (st.isDirectory()) { var r = walkFor(p, re, depth - 1); if (r) return r; } } catch (e2) {} }
    return "";
}
function puppeteerLib() { try { return require("puppeteer-core"); } catch (e) {} try { return require("puppeteer"); } catch (e2) {} return null; }
function fileUrl(p) { p = path.resolve(p).replace(/\\/g, "/"); return "file://" + (p[0] === "/" ? "" : "/") + encodeURI(p).replace(/#/g, "%23"); }

/* renderSection({ kind, data, durationSec, fps, width, height, imagePath, bgPath, out, jpegQuality, fadeSec?, audio?{path,startSec}, onStep }) → Promise<{out, frames}> */
function renderSection(o) {
    var lib = puppeteerLib(); if (!lib) return Promise.reject(new Error("puppeteer-core not found — run `npm install` in the conductor folder"));
    var chrome = findChrome(o.chromeCfg); if (!chrome) return Promise.reject(new Error("no Chrome/Edge found — install Google Chrome or set \"chrome\" in conductor.config.json"));
    var W = o.width || 1920, H = o.height || 1080, fps = o.fps || 30, N = Math.max(2, Math.round(o.durationSec * fps)), onStep = o.onStep || function () {};
    var browser = null, ff = null, ffErr = "", gpuName = "";
    // GPU compositing stays ON where a display driver exists (Windows / macOS); Linux servers get software rendering
    var args = ["--no-sandbox", "--hide-scrollbars", "--force-device-scale-factor=1", "--disable-dev-shm-usage", "--allow-file-access-from-files", "--font-render-hinting=none"];
    if (process.platform === "linux" || (o.chromeCfg && o.chromeCfg.softwareGpu)) args.push("--disable-gpu");
    else {                                                                                            // the GPU composites, rasterises and runs the 2D canvas (Windows: ANGLE on Direct3D 11; macOS: Metal)
        args.push("--enable-gpu", "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--enable-zero-copy", "--enable-accelerated-2d-canvas", "--use-gl=angle");
        args.push(process.platform === "win32" ? "--use-angle=d3d11" : "--use-angle=metal");
    }
    return lib.launch({ executablePath: chrome.path, headless: true, args: args })
        .then(function (b) { browser = b; try { if (o.onBrowser && b.process()) o.onBrowser(b.process().pid); } catch (e) {} return b.newPage(); })
        .then(function (page) {
            return page.setViewport({ width: W, height: H, deviceScaleFactor: 1 }).then(function () { return page.goto(fileUrl(path.join(__dirname, "scene.html")), { waitUntil: "load" }); })
                .then(function () {
                    var spec = { kind: o.kind === "still" ? "still" : "map", data: o.data, durationSec: o.durationSec, mapUrl: fileUrl(o.imagePath), imageUrl: fileUrl(o.imagePath), bgUrl: o.bgPath ? fileUrl(o.bgPath) : "", imageWidth: o.imageWidth || 0, imageHeight: o.imageHeight || 0, hasAlpha: !!o.hasAlpha, edgeBlur: o.edgeBlur !== false };
                    return page.evaluate(function (sp) { return window.buildScene(sp); }, spec);
                })
                .then(function (info) {
                    return page.evaluate(function () { try { var gl = document.createElement("canvas").getContext("webgl"); var d = gl.getExtension("WEBGL_debug_renderer_info"); return gl.getParameter(d.UNMASKED_RENDERER_WEBGL); } catch (e) { return "unknown"; } })
                        .then(function (gpu) { info = info || {}; info.gpu = gpu; return info; }, function () { return info; });
                })
                .then(function (info) {
                    gpuName = info && info.gpu || "";
                    onStep("scene ready (" + (info && info.kind) + ", " + N + " frames @ " + fps + " fps, Chrome via " + chrome.via + ", GPU: " + (gpuName || "unknown") + ")");
                    fs.mkdirSync(path.dirname(o.out), { recursive: true });
                    // (Special 1.0) optional fade to black at both ends and the VO slice as the section's audio
                    var fade = (o.fadeSec != null) ? Math.min(+o.fadeSec, o.durationSec / 3) : 0;
                    var vf = fade > 0 ? ["-vf", "fade=t=in:st=0:d=" + fade.toFixed(3) + ",fade=t=out:st=" + Math.max(0, o.durationSec - fade).toFixed(3) + ":d=" + fade.toFixed(3)] : [];
                    var args = ["-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(fps), "-i", "-"];
                    if (o.audio && o.audio.path) args = args.concat(["-ss", String(o.audio.startSec || 0), "-t", String(o.durationSec), "-i", o.audio.path]);
                    var venc = (o.encoder === "nvenc")
                        ? ["-c:v", "h264_nvenc", "-preset", o.nvencPreset || "p5", "-tune", "hq", "-rc", "vbr", "-cq", String(o.nvencCq != null ? o.nvencCq : 19), "-b:v", "0", "-maxrate", "60M", "-bufsize", "120M", "-spatial-aq", "1", "-temporal-aq", "1", "-profile:v", "high", "-level", "4.2", "-g", String(fps * 2), "-bf", "3", "-pix_fmt", "yuv420p"]
                        : ["-c:v", "libx264", "-preset", o.preset || "medium", "-crf", String(o.crf != null ? o.crf : 18), "-tune", "film", "-profile:v", "high", "-level", "4.2", "-g", String(fps * 2), "-pix_fmt", "yuv420p"];
                    args = args.concat(["-map", "0:v"]).concat(o.audio && o.audio.path ? ["-map", "1:a", "-c:a", "aac", "-b:a", "192k"] : []).concat(vf)
                        .concat(venc).concat(["-r", String(fps), "-t", String(o.durationSec), "-movflags", "+faststart", o.out]);
                    ff = spawn(FF.CFG.ffmpeg, args, { windowsHide: true }); ff.stderr.on("data", function (d) { ffErr = (ffErr + d.toString()).slice(-2000); });
                    var ffClosed = new Promise(function (res, rej) { ff.on("close", function (code) { code === 0 ? res() : rej(new Error("ffmpeg exited " + code + ": " + ffErr.split("\n").slice(-3).join(" "))); }); ff.on("error", rej); });
                    ffClosed.catch(function () {});               // a kill rejects this later than the frame loop — never let it become an unhandled rejection
                    var q = o.jpegQuality || 96, chain = Promise.resolve(), t0 = Date.now();
                    function write(buf) { return new Promise(function (res) { if (!ff.stdin.write(buf)) ff.stdin.once("drain", res); else res(); }); }
                    var useCast = o.capture !== "screenshot" && o.frameFormat !== "png", cdp = null, waiter = null, castFrames = 0, fallbacks = 0;
                    function grabScreenshot() { return page.screenshot(o.frameFormat === "png" ? { type: "png", encoding: "binary", clip: { x: 0, y: 0, width: W, height: H } } : { type: "jpeg", quality: q, encoding: "binary", clip: { x: 0, y: 0, width: W, height: H } }); }
                    var setup = Promise.resolve();
                    if (useCast) {
                        // CDP screencast: the compositor hands us each frame it draws (JPEG made on Chrome's own thread) instead of a
                        // synchronous surface read-back per frame — measured ~1.7x faster per worker and it scales across workers.
                        setup = page.createCDPSession().then(function (s) {
                            cdp = s;
                            cdp.on("Page.screencastFrame", function (ev) { castFrames++; cdp.send("Page.screencastFrameAck", { sessionId: ev.sessionId }).catch(function () {}); if (waiter) { var w = waiter; waiter = null; w(Buffer.from(ev.data, "base64")); } });
                            return cdp.send("Page.startScreencast", { format: "jpeg", quality: Math.min(q, 95), maxWidth: W, maxHeight: H, everyNthFrame: 1 });
                        }).then(function () { return page.evaluate(function () { var d = document.getElementById("poke"); if (!d) { d = document.createElement("div"); d.id = "poke"; d.style.cssText = "position:fixed;left:0;top:0;width:2px;height:2px;background:#000;opacity:0.02;pointer-events:none;z-index:99"; document.body.appendChild(d); } }); })
                          .then(function () { return new Promise(function (r) { setTimeout(r, 120); }); }).then(function () { waiter = null; });
                    }
                    function grabCast(f) {
                        var pending = new Promise(function (res) { waiter = res; });
                        return page.evaluate(function (t, f) { var r = window.seek(t); var d = document.getElementById("poke"); if (d) d.style.transform = "translate(0," + ((f % 2) * 0.5) + "px)"; return r; }, f / fps)
                            .then(function () { return Promise.race([pending, new Promise(function (res) { setTimeout(function () { res(null); }, 700); })]); })
                            .then(function (buf) { if (buf) return buf; waiter = null; fallbacks++; return grabScreenshot(); });   // no compositor frame within 700 ms (nothing changed on screen) → one screenshot instead
                    }
                    for (var f = 0; f < N; f++) (function (f) {
                        chain = chain.then(function () { if (o.abort && o.abort.aborted) throw new Error("killed"); if (useCast) return grabCast(f); return page.evaluate(function (t) { return window.seek(t); }, f / fps).then(grabScreenshot); })
                            .then(function (buf) { if (f % Math.max(1, Math.round(fps * 5)) === 0 && f) onStep("frame " + f + "/" + N + " · " + Math.round(f / ((Date.now() - t0) / 1000)) + " fps"); return write(buf); });
                    })(f);
                    return setup.then(function () { return chain; }).then(function () { ff.stdin.end(); if (cdp) return cdp.send("Page.stopScreencast").catch(function () {}).then(function () { return ffClosed; }); return ffClosed; })
                        .then(function () { return { out: o.out, frames: N, chrome: chrome.via, gpu: gpuName, capture: useCast ? ("screencast" + (fallbacks ? " (+" + fallbacks + " screenshot fallbacks)" : "")) : "screenshot", encoder: o.encoder === "nvenc" ? "h264_nvenc" : "libx264", seconds: (Date.now() - t0) / 1000 }; });
                });
        })
        .then(function (r) { return browser.close().then(function () { return r; }); }, function (e) { try { if (ff) { ff.stdin.destroy(); ff.kill("SIGKILL"); } } catch (e2) {} try { fs.unlinkSync(o.out); } catch (e3) {} return (browser ? browser.close() : Promise.resolve()).then(function () { throw e; }, function () { throw e; }); });
}
/* renderSectionThreaded(opts) — same contract as renderSection, but runs in a worker thread */
function renderSectionThreaded(o) {
    var wt = require("worker_threads");
    return new Promise(function (resolve, reject) {
        var opts = Object.assign({}, o); delete opts.onStep; delete opts.abort; delete opts.onBrowser;
        var w = new wt.Worker(path.join(__dirname, "worker.js"), { workerData: { opts: opts, ffCfg: { ffmpeg: FF.CFG.ffmpeg, ffprobe: FF.CFG.ffprobe } } }), pid = 0, settled = false;
        var poll = setInterval(function () { if (o.abort && o.abort.aborted) { try { w.postMessage({ kill: true }); } catch (e) {} setTimeout(function () { if (!settled) { try { if (pid) process.kill(pid); } catch (e2) {} try { w.terminate(); } catch (e3) {} } }, 1500); clearInterval(poll); } }, 250);
        w.on("message", function (m) { if (m.step && o.onStep) o.onStep(m.step); if (m.pid) pid = m.pid; if (m.done) { settled = true; clearInterval(poll); resolve(m.done); } if (m.error) { settled = true; clearInterval(poll); reject(new Error(m.error)); } });
        w.on("error", function (e) { settled = true; clearInterval(poll); reject(e); });
        w.on("exit", function (code) { if (!settled) { settled = true; clearInterval(poll); reject(new Error(o.abort && o.abort.aborted ? "killed" : ("render thread exited " + code))); } });
    });
}
function renderAny(o) { if (o.kind === "ai") return require("./native.js").renderAiNative(o); if (o.engine === "chrome") return renderSection(o); return require("./native.js").renderSectionNative(o); }
module.exports = { renderSection: renderSection, renderAny: renderAny, renderSectionThreaded: renderSectionThreaded, findChrome: findChrome, fileUrl: fileUrl };
