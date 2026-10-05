/* lib/render/worker.js — one section render in its own worker thread: the CDP frame traffic (a JSON
   message with a base64 JPEG per frame) is parsed on this thread, so N parallel sections cost N
   threads instead of queueing on the app's single main thread. */
"use strict";
var wt = require("worker_threads"), CAP = require("./capture.js"), NAT = require("./native.js"), FF = require("../ffmpeg.js");
var o = wt.workerData; FF.configure(o.ffCfg || {});
var abort = { aborted: false };
wt.parentPort.on("message", function (m) { if (m && m.kill) abort.aborted = true; });
(o.opts.kind === "ai" ? NAT.renderAiNative : (o.opts.engine === "chrome" ? CAP.renderSection : NAT.renderSectionNative))(Object.assign({}, o.opts, { abort: abort, onStep: function (m) { wt.parentPort.postMessage({ step: m }); }, onBrowser: function (pid) { wt.parentPort.postMessage({ pid: pid }); } }))
    .then(function (r) { wt.parentPort.postMessage({ done: r }); })
    .catch(function (e) { wt.parentPort.postMessage({ error: String(e && e.message || e) }); });
