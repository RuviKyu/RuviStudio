/* ============================================================================
   stages/grab.js — RUVI Studio (Premiere suite) Trello intake, ported
   verbatim from the AE Studio panel (the Grab tab engine). READ-ONLY Trello:
   nothing on the board is ever moved, commented, or written — only GETs and
   attachment downloads. Flow: scan() previews what would be created (marker
   cards like "[OLDWORLDPROOF]" split each list into channel runs; cards under
   a marker belong to that channel); run() creates the numbered title tree,
   downloads the docx/mp3/cover, and produces the word-level SRT via
   whisper-ctranslate2 (word JSON kept beside it). Everything injectable for
   tests: api(), download(), whisper().
   ========================================================================== */
"use strict";
var fs = require("fs");
var path = require("path");
var https = require("https");
var spawnSync = require("child_process").spawnSync;

var SUBFOLDERS = ["Script", "Project", "Assets", "Reference images", "Hook", "Maps", "Characters"];

function sanitize(s) { return String(s || "").replace(/[\\/:*?"<>|\u2013\u2014]/g, "-").replace(/\s+/g, " ").trim().replace(/[. ]+$/, ""); }
// (1.4.6) Windows silently strips trailing dots/spaces from paths, so a folder
// created WITH one (a title ending in a period) becomes a ghost Explorer can
// neither open nor delete. sanitize() now strips them at creation; normName()
// makes matching tolerant of legacy ghosts; healFolderNames() renames the
// ghosts themselves through the \\?\ long-path form (which bypasses the
// stripping), after which they behave like any normal folder.
function normName(s) { return String(s || "").replace(/[. ]+$/, "").toLowerCase(); }
function winLong(p) {
    if (process.platform !== "win32") return p;
    var b = String(p).replace(/\//g, "\\");
    return /^\\\\\?\\/.test(b) ? b : "\\\\?\\" + b;
}
function healFolderNames(baseDir) {
    var healed = [], skipped = [];
    function healIn(dir) {
        var names;
        try { names = fs.readdirSync(dir); } catch (e) { return []; }
        var out = [];
        for (var i = 0; i < names.length; i++) {
            var n = names[i];
            if (!/[. ]+$/.test(n)) { out.push(n); continue; }
            var clean = n.replace(/[. ]+$/, "");
            var from = path.join(dir, n), to = path.join(dir, clean);
            if (!clean || fs.existsSync(to)) { skipped.push({ from: from, why: clean ? "a folder with the clean name already exists — merge by hand" : "name is only dots/spaces" }); out.push(n); continue; }
            try { fs.renameSync(winLong(from), winLong(to)); healed.push({ from: n, to: clean, dir: dir }); out.push(clean); }
            catch (e2) { skipped.push({ from: from, why: String(e2 && e2.message || e2) }); out.push(n); }
        }
        return out;
    }
    var channels = healIn(baseDir);                       // channel level
    for (var c = 0; c < channels.length; c++) {
        var chDir = (opts.channelDir ? opts.channelDir(channels[c]) : path.join(baseDir, channels[c]));
        try { if (fs.statSync(chDir).isDirectory() && !/^[_.]/.test(channels[c])) healIn(chDir); } catch (e) {}
    }
    return { healed: healed, skipped: skipped };
}
function stripNum(s) { return String(s).replace(/^\d+\.\s*/, ""); }
function readSecrets(baseDir) {
    try { return JSON.parse(fs.readFileSync(path.join(baseDir, "_SECRETS", "secrets.json"), "utf8")); }
    catch (e) { return null; }
}

// ---- Trello (GET only) -----------------------------------------------------
function trelloApi(sec) {
    return function (pathname, query) {
        return new Promise(function (resolve) {
            var q = (query ? query + "&" : "") + "key=" + sec.trelloKey + "&token=" + sec.trelloToken;
            var rq = https.request({ hostname: "api.trello.com", path: "/1" + pathname + "?" + q, method: "GET" }, function (r) {
                var b = "";
                r.on("data", function (c) { b += c; });
                r.on("end", function () { try { resolve({ code: r.statusCode, body: JSON.parse(b) }); } catch (e) { resolve({ code: r.statusCode, body: b }); } });
            });
            rq.on("error", function (e) { resolve({ code: 0, body: String(e) }); });
            rq.setTimeout(20000, function () { rq.destroy(); resolve({ code: 0, body: "timeout" }); });
            rq.end();
        });
    };
}
function trelloDownload(sec) {
    return function (url, dest) {
        return new Promise(function (resolve) {
            function go(u, hops) {
                var rq = https.get(u, { headers: {
                    "Authorization": 'OAuth oauth_consumer_key="' + sec.trelloKey + '", oauth_token="' + sec.trelloToken + '"',
                    "User-Agent": "RUVI-Grab/1.0"
                } }, function (r) {
                    if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location && hops < 5) { r.resume(); return go(r.headers.location, hops + 1); }
                    if (r.statusCode !== 200) { r.resume(); return resolve("HTTP " + r.statusCode); }
                    try { fs.mkdirSync(path.dirname(dest), { recursive: true }); } catch (e) {}
                    var w = fs.createWriteStream(dest + ".part");
                    r.pipe(w);
                    w.on("close", function () {
                        try { fs.renameSync(dest + ".part", dest); resolve(null); }
                        catch (e2) { resolve(String(e2.message)); }
                    });
                    w.on("error", function (e3) { resolve("write: " + e3.message); });
                });
                rq.on("error", function (e4) { resolve(String(e4.message)); });
                rq.setTimeout(120000, function () { rq.destroy(); resolve("timeout"); });
            }
            go(url, 0);
        });
    };
}

// ---- whisper ---------------------------------------------------------------
function resolveTool(name) {
    try { var r = spawnSync(name, ["--version"], { stdio: "ignore", windowsHide: true }); if (!r.error) return name; } catch (e) {}
    var roots = [];
    if (process.env.LOCALAPPDATA) roots.push(path.join(process.env.LOCALAPPDATA, "Python"));
    if (process.env.APPDATA) roots.push(path.join(process.env.APPDATA, "Python"));
    for (var r2 = 0; r2 < roots.length; r2++) {
        var subs = [];
        try { subs = fs.readdirSync(roots[r2]); } catch (e2) { continue; }
        for (var i = 0; i < subs.length; i++) {
            var cand = path.join(roots[r2], subs[i], "Scripts", name + ".exe");
            try { if (fs.existsSync(cand)) return cand; } catch (e3) {}
        }
    }
    return null;
}
function pad(n, w) { n = String(n); while (n.length < w) n = "0" + n; return n; }
function srtTime(sec) {
    var ms = Math.round(sec * 1000);
    return pad(Math.floor(ms / 3600000), 2) + ":" + pad(Math.floor(ms / 60000) % 60, 2) + ":" +
           pad(Math.floor(ms / 1000) % 60, 2) + "," + pad(ms % 1000, 3);
}
// one cue per word — the format Structure/Cartographer timing already consume
function buildWordSrt(words) {
    var out = [], n = 1;
    for (var i = 0; i < words.length; i++) {
        var w = words[i];
        if (!w || typeof w.start !== "number" || typeof w.end !== "number") continue;
        out.push(String(n++));
        out.push(srtTime(w.start) + " --> " + srtTime(w.end));
        out.push(String(w.word == null ? "" : w.word).replace(/^\s+|\s+$/g, ""));
        out.push("");
    }
    return out.join("\n");
}
/* args for one whisper attempt; exported so the panel's heal loop matches */
function whisperArgs(mp3Path, outDir, model, device, threads) {
    var a = [mp3Path, "--model", model || "base", "--output_dir", outDir,
             "--output_format", "json", "--word_timestamps", "True"];
    a.push("--vad_filter", "True");                            // skip long silences (sleep VOs)
    if (device === "cuda") {
        a.push("--device", "cuda", "--compute_type", process.env.RUVI_WHISPER_COMPUTE || "float16");
        if (process.env.RUVI_WHISPER_BATCHED === "1") a.push("--batched", "True", "--batch_size", process.env.RUVI_WHISPER_BATCH || "16");   // (Conductor) batched pipeline: several 30 s windows per forward pass
    }
    else a.push("--device", "cpu", "--compute_type", "int8", "--threads", String(threads || 16));
    return a;
}
var PLAN_CACHE = { at: 0, plan: null, key: "" };
/* resolve the concrete whisper plan: explicit settings win, "auto" asks the machine */
function whisperPlan(baseDir, modelSetting, deviceSetting, force) {
    var key = String(modelSetting || "auto") + "|" + String(deviceSetting || "auto");
    if (!force && PLAN_CACHE.plan && PLAN_CACHE.key === key && Date.now() - PLAN_CACHE.at < 60000) return PLAN_CACHE.plan;
    var Toolbox2 = require("../toolbox.js");
    var prof = Toolbox2.autoWhisperProfile(Toolbox2.detectSpecs(baseDir));
    var plan = {
        model: (!modelSetting || modelSetting === "auto") ? prof.model : modelSetting,
        device: (!deviceSetting || deviceSetting === "auto") ? prof.device : deviceSetting,
        threads: prof.threads,
        wantGpuLibs: prof.wantGpuLibs || false,
        why: prof.why
    };
    PLAN_CACHE = { at: Date.now(), plan: plan, key: key };
    return plan;
}
function whisperEnv(baseDir, baseEnv) {
    var src = baseEnv || process.env;
    var env = {};
    for (var k in src) env[k] = src[k];
    try {
        var Toolbox2 = require("../toolbox.js");
        var dirs = Toolbox2.cudaDllDirs(baseDir);
        if (dirs.length) {
            // Windows env keys are case-insensitive ("Path"): prepend onto the
            // EXISTING key — creating a second "PATH" lets the crippled copy
            // win the dedupe and breaks tool resolution (the ENOENT bug)
            var pk = "PATH";
            for (var k2 in env) if (String(k2).toUpperCase() === "PATH") { pk = k2; break; }
            env[pk] = dirs.join(";") + ";" + (env[pk] || "");
        }
    } catch (e) {}
    return env;
}
/* async whisper with live telemetry: onTick(sec, device) every ~5s,
   onNote(line) with whisper's own stderr tail (model downloads show here).
   Tries CUDA first (device auto/cuda), falls back to tuned CPU. Injectable
   spawner for tests via opts2._spawn. */
var UV_ERR = { "-4058": "ENOENT — file or executable not found", "-4048": "EPERM — permission denied",
               "-4064": "ENFILE", "-4092": "EACCES — access denied" };
function decodeExit(code) {
    if (code < 0) return code + (UV_ERR[String(code)] ? " (" + UV_ERR[String(code)] + ")" : "");
    var u = code >>> 0;
    if (u === 0xC0000135) return "0xC0000135 (a required DLL failed to load)";
    if (u === 0xC0000005) return "0xC0000005 (access violation — usually incompatible CUDA kernels)";
    return u > 0xFFFF ? "0x" + u.toString(16).toUpperCase() : String(code);
}
var WHISPER_GATE = Promise.resolve();                          // GPU mutex: one transcription at a time
function runWhisperAsync(mp3Path, outDir, model, opts2, cb) {
    var release;
    var turn = new Promise(function (r) { release = r; });
    var prev = WHISPER_GATE;
    WHISPER_GATE = WHISPER_GATE.then(function () { return turn; });
    prev.then(function () { runWhisperNow(mp3Path, outDir, model, opts2, function (res) { release(); cb(res); }); });
}
function runWhisperNow(mp3Path, outDir, model, opts2, cb) {
    opts2 = opts2 || {};
    var spawner = opts2._spawn || require("child_process").spawn;
    var tool = opts2._tool || resolveTool("whisper-ctranslate2");
    if (!tool) return cb({ ok: false, error: "whisper-ctranslate2 not found (PATH or Python Scripts)" });
    var env = whisperEnv(opts2.baseDir);
    var t0 = Date.now(), noteTail = "";
    function attempt(device, nextRaw, viaModule) {
        var settled = false;
        function next(code, tail9) { if (settled) return; settled = true; nextRaw(code, tail9); }
        var child, tail = "";
        var Toolbox3 = require("../toolbox.js");
        var argsW = whisperArgs(mp3Path, outDir, model, device, opts2.threads);
        var exe = tool, argv = argsW;
        if (viaModule) {
            var py2 = opts2._py || Toolbox3.pythonExe(opts2.baseDir);
            if (!py2) return next(-1, "no python for module retry");
            exe = py2; argv = ["-m", "whisper_ctranslate2"].concat(argsW);
        }
        try { child = spawner(exe, argv, { windowsHide: true, env: env }); }
        catch (eS) { return next(-1, String(eS.message || eS)); }
        var tick = setInterval(function () {
            if (opts2.onTick) opts2.onTick(Math.round((Date.now() - t0) / 1000), device);
        }, 5000);
        if (child.stderr) child.stderr.on("data", function (d) {
            tail = (tail + d).slice(-500);
            var lines = String(d).split(/\r|\n/).filter(function (l) { return l.trim(); });
            if (lines.length) {
                noteTail = lines[lines.length - 1].slice(0, 90);
                if (opts2.onNote) opts2.onNote(noteTail);
            }
        });
        if (child.stdout) child.stdout.on("data", function () {});
        var killer = setTimeout(function () { try { child.kill(); } catch (eK) {} }, 90 * 60 * 1000);
        child.on("error", function (eE) {
            clearInterval(tick); clearTimeout(killer);
            if (!viaModule && /ENOENT/i.test(String(eE.code || eE.message || ""))) {
                if (opts2.onNote) opts2.onNote("whisper exe not reachable from this process — retrying as python -m whisper_ctranslate2");
                return attempt(device, next, true);
            }
            next(-1, String(eE.message || eE));
        });
        child.on("close", function (code) {
            clearInterval(tick); clearTimeout(killer);
            if (!viaModule && code === -4058) {
                if (opts2.onNote) opts2.onNote("whisper exe not reachable (ENOENT) — retrying as python -m whisper_ctranslate2");
                return attempt(device, next, true);
            }
            next(code, tail);
        });
    }
    function done(used, code, tail3) {
        if (code !== 0) return cb({ ok: false, error: "whisper exit " + decodeExit(code) +
            ((tail3 || noteTail) ? " · " + String(tail3 || noteTail).split(/\r?\n/).filter(Boolean).slice(-2).join(" · ").slice(0, 180) : "") });
        var stem = path.basename(mp3Path).replace(/\.[^.]+$/, "");
        var jsonPath = path.join(outDir, stem + ".json");
        if (!fs.existsSync(jsonPath)) return cb({ ok: false, error: "whisper produced no json" });
        cb({ ok: true, jsonPath: jsonPath, device: used, seconds: Math.round((Date.now() - t0) / 1000) });
    }
    var device = opts2.device || "auto";
    function fmtExit(code) { return decodeExit(code); }
    if (device === "auto" || device === "cuda") {
        attempt("cuda", function (code, tail2) {
            if (code === 0) return done("cuda", 0);
            var brief = String(tail2 || "").split(/\r?\n/).filter(function (l) { return l.trim(); }).slice(-2).join(" · ").slice(0, 160);
            if (opts2.onNote) {
                opts2.onNote("CUDA failed (exit " + fmtExit(code) + ")" + (brief ? ": " + brief : " — likely an old ctranslate2 without Blackwell kernels"));
                opts2.onNote("fix: press Install on the GPU-libs row (now also upgrades ctranslate2/faster-whisper)" +
                             ((device === "cuda") ? "" : " — retrying on CPU (" + (opts2.threads || 16) + " threads)"));
            }
            if (device === "cuda") return done("cuda", code, tail2);
            attempt("cpu", function (code2) { done("cpu", code2); });
        });
    } else attempt("cpu", function (code) { done("cpu", code); });
}
function defaultWhisper(mp3Path, outDir, model, opts2) {
    opts2 = opts2 || {};
    var tool = resolveTool("whisper-ctranslate2");
    if (!tool) return { ok: false, error: "whisper-ctranslate2 not found (PATH or Python Scripts)" };
    var device = opts2.device || "auto";
    var env = whisperEnv(opts2.baseDir);
    var used = "cpu", r;
    if (device === "auto" || device === "cuda") {
        r = spawnSync(tool, whisperArgs(mp3Path, outDir, model, "cuda"),
                      { windowsHide: true, stdio: "ignore", env: env, timeout: 60 * 60 * 1000 });
        if (r.status === 0) used = "cuda";
        else if (device === "cuda") return { ok: false, error: "whisper (cuda) exit " + r.status + " — install the GPU libs from Settings, or set device to auto/cpu" };
    }
    if (used !== "cuda") {
        r = spawnSync(tool, whisperArgs(mp3Path, outDir, model, "cpu", opts2.threads),
                      { windowsHide: true, stdio: "ignore", env: env, timeout: 60 * 60 * 1000 });
    }
    if (r.status !== 0) return { ok: false, error: "whisper exit " + r.status };
    var stem = path.basename(mp3Path).replace(/\.[^.]+$/, "");
    var jsonPath = path.join(outDir, stem + ".json");
    if (!fs.existsSync(jsonPath)) return { ok: false, error: "whisper produced no json" };
    return { ok: true, jsonPath: jsonPath, device: used };
}
function wordsFromWhisperJson(jsonPath) {
    var d = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    var words = [], segs = d.segments || [];
    for (var s = 0; s < segs.length; s++) {
        var ws = segs[s].words || [];
        for (var w = 0; w < ws.length; w++) words.push({ word: ws[w].word, start: ws[w].start, end: ws[w].end });
    }
    return words;
}

// ---- scan: preview what a grab would create --------------------------------
/* Trello attachment display names often lack the extension; infer one from
   the URL, else from the kind, so on-disk names are always detectable */
function attSaveName(a) {
    var n = sanitize(a.name);
    if (/\.[a-z0-9]{2,5}$/i.test(n)) return n;
    var um = String(a.url || "").match(/\.([a-z0-9]{2,5})(?:[?#]|$)/i);
    if (um) return n + "." + um[1].toLowerCase();
    var kind = classifyAttachment(a.name);
    return n + (kind === "audio" ? ".mp3" : kind === "cover" ? ".png" : ".docx");
}
function classifyAttachment(name) {
    if (/\.(docx?|rtf)$/i.test(name)) return "script";
    if (/\.(mp3|wav|m4a|aac)$/i.test(name)) return "audio";
    if (/\.(png|jpe?g|webp)$/i.test(name)) return "cover";
    if (/\.zip$/i.test(name)) return "script";
    return "script";
}
// Numbering: "continue" (default) — the next new title takes max + 1, so the order on disk
// stays the order of production; "fill-gaps" (the 1.4.7 behaviour) reuses a freed number.
// usedNumbers() reads the disk truth once per channel — from the channel's TITLES folder
// (the same resolver the scan uses), never from the channel root.
function usedNumbers(chDir) {
    var used = {}, names = [];
    try { names = fs.readdirSync(chDir); } catch (e) {}
    for (var i = 0; i < names.length; i++) {
        var m = names[i].match(/^(\d+)\./);
        if (m) used[+m[1]] = true;
    }
    return used;
}
function pickNumber(used, mode) {
    var n = 1;
    if (mode === "fill-gaps") { while (used[n]) n++; return n; }
    Object.keys(used).forEach(function (k) { if (used[k] && +k >= n) n = +k + 1; });   // continue: max + 1
    return n;
}
function nextNumber(chDir, mode) { return pickNumber(usedNumbers(chDir), mode); }
/* assignNumbers(baseDir, candidates): forced numbers claim their slot first,
   then every unnumbered new title takes the lowest free number in its
   channel — a shared per-channel used-set (seeded from disk) guarantees two
   new titles in one scan can never collide with each other or with existing
   folders sitting past a gap. */
function assignNumbers(baseDir, candidates, channelDir, mode) {
    var chanUsed = {};
    function usedFor(channel) {
        if (!chanUsed[channel]) chanUsed[channel] = usedNumbers(channelDir ? channelDir(channel) : path.join(baseDir, channel));
        return chanUsed[channel];
    }
    candidates.forEach(function (c) {
        if (c.exists) {
            var m = /^(\d+)\./.exec(c.existingFolder || "");
            if (m) usedFor(c.channel)[+m[1]] = true;
            return;
        }
        if (c.numForced != null) { c.number = c.numForced; usedFor(c.channel)[c.numForced] = true; }
    });
    candidates.forEach(function (c) {
        if (c.exists || c.number != null) return;
        var u = usedFor(c.channel), n = pickNumber(u, mode);
        u[n] = true;
        c.number = n;
    });
}
/* scan(opts) → Promise {ok, channels:[...], candidates:[{channel,title,number,exists,cardId,attachments:[{name,kind}]}], warnings} */
function scan(opts) {
    var heal = { healed: [], skipped: [] };
    try { heal = healFolderNames(opts.baseDir); } catch (eH) {}
    var baseDir = opts.baseDir;
    var sec = opts.secrets || readSecrets(baseDir);
    if (!sec || !sec.trelloKey || !sec.trelloToken || !sec.boardId)
        return Promise.resolve({ ok: false, error: "secrets.json needs trelloKey / trelloToken / boardId" });
    var api = opts.api || trelloApi(sec);
    var warnings = [], candidates = [], channels = {};
    return api("/boards/" + sec.boardId + "/lists", "fields=name,pos&cards=none").then(function (rl) {
        if (rl.code !== 200 || !Array.isArray(rl.body)) return { ok: false, error: "Trello lists: HTTP " + rl.code };
        var lists = rl.body.slice().sort(function (a, b) { return a.pos - b.pos; });
        return api("/boards/" + sec.boardId + "/cards", "fields=name,pos,idList").then(function (rc) {
            if (rc.code !== 200 || !Array.isArray(rc.body)) return { ok: false, error: "Trello cards: HTTP " + rc.code };
            var byList = {};
            rc.body.forEach(function (c) { (byList[c.idList] = byList[c.idList] || []).push(c); });
            // STRICT scope (user 2026-08-07, from the live board): only cards
            // sitting UNDER a marker card named "{CHANNEL} Automation Integration ⬇"
            // are candidates (arrow optional, [brackets] tolerated, case-insensitive;
            // a bare "[CHANNEL]" card still works as a legacy marker). Everything
            // outside a marker — MATERIALS READY, CLIPS-READY, all workflow lists —
            // is silently ignored and only counted.
            var MARKER_RE = /^\s*\[?(.+?)\]?\s+A(?:utom|nim)ation\s+Integration\s*(?:\u2B07\uFE0F?)?\s*$/i;
            var LEGACY_RE = /^\s*\[(.+)\]\s*$/;
            var ignored = 0;
            lists.forEach(function (L) {
                var cards = (byList[L.id] || []).sort(function (a, b) { return a.pos - b.pos; });
                var current = null;
                cards.forEach(function (c) {
                    var nm = String(c.name);
                    var mk = nm.match(MARKER_RE) || nm.match(LEGACY_RE);
                    if (mk) { current = mk[1].trim(); channels[current] = 1; return; }
                    if (!current) { ignored++; return; }
                    var rest = nm, numForced = null;
                    var nM = rest.match(/^\s*(\d+)\.\s*(.+)$/);
                    if (nM) { numForced = +nM[1]; rest = nM[2]; }
                    var title = sanitize(rest);
                    if (!title) { ignored++; return; }
                    var chDir = (opts.channelDir ? opts.channelDir(current) : path.join(baseDir, current));
                    var existingFolder = null, names = [];
                    try { names = fs.readdirSync(chDir); } catch (e) {}
                    for (var i = 0; i < names.length; i++)
                        if (normName(stripNum(names[i])) === normName(title)) { existingFolder = names[i]; break; }
                    var health = null, state = "new";
                    if (existingFolder) {
                        health = titleHealth(path.join(chDir, existingFolder));
                        state = (health.docx && health.srt && health.mp3) ? "ok" : "partial";
                    }
                    candidates.push({ channel: current, title: title, cardId: c.id,
                                      exists: !!existingFolder, existingFolder: existingFolder,
                                      state: state, health: health, numForced: numForced, pos: c.pos });
                });
            });
            if (ignored) warnings.push(ignored + " card(s) outside any Automation Integration marker — ignored (drag a card below the marker to automate it)");
            // attachments for everything not complete on disk: new titles need
            // them to grab, INCOMPLETE ones need them to heal on re-grab
            var fresh = candidates.filter(function (c) { return c.state !== "ok"; });
            var i2 = 0;
            function nextAtt() {
                if (i2 >= fresh.length) {
                    // assign numbers per channel in board order, from the TITLES folder the scan itself read (continue = max + 1)
                    assignNumbers(baseDir, candidates, opts.channelDir, opts.numbering || "continue");
                    heal.healed.forEach(function (h) { warnings.push("healed folder name: \u201c" + h.from + "\u201d \u2192 \u201c" + h.to + "\u201d (trailing dot/space \u2014 Windows ghost)"); });
                    heal.skipped.forEach(function (h) { warnings.push("ghost folder NOT healed: " + h.from + " \u2014 " + h.why); });
                    return { ok: true, channels: Object.keys(channels), candidates: candidates, warnings: warnings, healed: heal.healed };
                }
                var c2 = fresh[i2++];
                return api("/cards/" + c2.cardId + "/attachments", "fields=name,url,mimeType").then(function (ra) {
                    c2.attachments = [];
                    if (ra.code === 200 && Array.isArray(ra.body))
                        ra.body.forEach(function (a) { c2.attachments.push({ name: a.name, url: a.url, kind: classifyAttachment(a.name) }); });
                    else warnings.push(c2.title + ": attachments HTTP " + ra.code);
                    return nextAtt();
                });
            }
            return nextAtt();
        });
    });
}

/* run(opts, onStep) → Promise {ok, folder, saved:[], srt, warnings}
   opts: {baseDir, candidate, secrets?, download?, whisper?, whisperModel?} */
/* what a grabbed title should contain — drives the INCOMPLETE state + healing re-grab */
function titleHealth(tDir) {
    var h = { docx: false, mp3: false, srt: false, cover: false };
    var root = [], script = [];
    try { root = fs.readdirSync(tDir); } catch (e) {}
    try { script = fs.readdirSync(path.join(tDir, "Script")); } catch (e2) {}
    // (Ruvi Studio) the packet zip holds the docx and the word SRT when the loose copies were cleaned away
    var inZip = []; try { var pz = script.filter(function (f) { return /^packet.*\.zip$/i.test(f); })[0]; if (pz) { var UZl; try { UZl = require("../../unzip.js"); } catch (e0) { UZl = require("../unzip.js"); } inZip = UZl.list(path.join(tDir, "Script", pz)); } } catch (ez) {}
    h.docx = script.concat(inZip).some(function (f) { return /\.(docx?|rtf)$/i.test(f); });
    h.mp3 = script.some(function (f) { return /\.mp3$/i.test(f); }) || root.some(function (f) { return /\.mp3$/i.test(f); });
    h.srt = root.concat(script, inZip).some(function (f) { return /_word_level\.srt$/i.test(f); });
    h.cover = root.some(function (f) { return /^Cover\./i.test(f); });
    return h;
}

function run(opts, onStep) {
    var step = onStep || function () {};
    var baseDir = opts.baseDir, c = opts.candidate;
    var sec = opts.secrets || readSecrets(baseDir);
    var dl = opts.download || (sec ? trelloDownload(sec) : null);
    var whisper = opts.whisper || defaultWhisper;
    var warnings = [], saved = [];
    var folderName = (c.existingFolder || (c.number + ". " + c.title)).replace(/[. ]+$/, "");   // heal in place: never re-number an existing title; never mint a Windows ghost
    var displayName = folderName;
    var tDir = path.join(opts.channelDir ? opts.channelDir(c.channel) : path.join(baseDir, c.channel), folderName);
    for (var i = 0; i < SUBFOLDERS.length; i++)
        try { fs.mkdirSync(path.join(tDir, SUBFOLDERS[i]), { recursive: true }); } catch (e) {}
    try {
        var Heal2 = require("../heal.js");
        var fx = Heal2.fixScriptExtensions(tDir);
        if (fx.length) warnings.push("healed name(s): " + fx.join(", "));
    } catch (eFx) {}
    var atts = c.attachments || [];
    var k = 0, mp3Path = null;
    function nextDl() {
        if (k >= atts.length) return afterDl();
        var a = atts[k++];
        var saveAs = attSaveName(a);
        var dest = a.kind === "cover" ? path.join(tDir, "Cover" + (saveAs.match(/\.[^.]+$/) || [".png"])[0])
                                      : path.join(tDir, "Script", saveAs);
        try { if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
            saved.push(path.relative(tDir, dest) + " (kept)");
            if (a.kind === "audio" && /\.mp3$/i.test(dest)) mp3Path = dest;
            return nextDl();
        } } catch (eKp) {}
        step("downloading " + a.name);
        if (!dl) { warnings.push("no downloader (secrets missing?) — skipped " + a.name); return nextDl(); }
        return dl(a.url, dest).then(function (err) {
            if (err) warnings.push(a.name + ": " + err);
            else {
                saved.push(path.relative(tDir, dest));
                if (a.kind === "audio" && /\.mp3$/i.test(dest)) mp3Path = dest;
            }
            return nextDl();
        });
    }
    function afterDl() {
        var haveSrt = false;
        try {
            haveSrt = fs.readdirSync(tDir).concat(fs.readdirSync(path.join(tDir, "Script")))
                        .some(function (f) { return /_word_level\.srt$/i.test(f); });
        } catch (eHs) {}
        if (haveSrt) { step("word SRT already present — whisper skipped"); return finish(); }
        if (!mp3Path) { warnings.push("no mp3 attachment — word SRT skipped (add the VO later and re-grab or run whisper by hand)"); return finish(); }
        // a previous crashed pass may have left the whisper json behind — reuse
        // it instead of paying for transcription again
        var stemPre = path.basename(mp3Path).replace(/\.[^.]+$/, "");
        var preJson = path.join(tDir, "Script", stemPre + ".json");
        if (fs.existsSync(preJson)) {
            step("found existing whisper json — skipping transcription");
            return afterWhisper({ ok: true, jsonPath: preJson, device: "reused" });
        }
        var wplan = whisperPlan(baseDir, opts.whisperModel, opts.whisperDevice);
        step("whisper starting: " + wplan.device + " · " + wplan.model + " (" + wplan.why + ") — first run may download the model");
        if (opts.whisper) {                                   // injected sync stub (tests)
            var w = opts.whisper(mp3Path, path.join(tDir, "Script"), wplan.model,
                                 { device: wplan.device === "cuda" ? "auto" : "cpu", baseDir: baseDir, threads: wplan.threads });
            return afterWhisper(w);
        }
        runWhisperAsync(mp3Path, path.join(tDir, "Script"), wplan.model,
            { device: wplan.device === "cuda" ? "auto" : "cpu", baseDir: baseDir, threads: wplan.threads,
              onTick: function (sec, dev) {
                  var mm = Math.floor(sec / 60), ss = ("0" + (sec % 60)).slice(-2);
                  step("whisper " + dev + " · " + wplan.model + " — " + mm + ":" + ss + " elapsed");
              },
              onNote: function (line) { step("whisper: " + line); } },
            afterWhisper);
        return;
        function afterWhisper(w) {
        try {
            if (w.device) step("whisper done on " + w.device + (w.seconds ? " in " + Math.floor(w.seconds / 60) + ":" + ("0" + (w.seconds % 60)).slice(-2) : ""));
            if (!w.ok) { warnings.push("whisper: " + w.error); step("whisper failed: " + w.error); return finish(); }
            var words = wordsFromWhisperJson(w.jsonPath);
            var stem = path.basename(mp3Path).replace(/\.[^.]+$/, "");
            var scriptDirW = path.join(tDir, "Script");
            fs.writeFileSync(path.join(scriptDirW, stem + "_word_level.srt"), buildWordSrt(words));
            try { fs.renameSync(w.jsonPath, path.join(scriptDirW, stem + "_words.json")); } catch (eR) {}
            saved.push("Script\\" + stem + "_word_level.srt");
            step("word SRT written (" + words.length + " words)");
        } catch (e2) {
            warnings.push("word SRT build failed: " + (e2 && e2.message || e2));
            step("SRT step failed: " + (e2 && e2.message || e2));
        }
        return finish();
        }
    }
    var resolveRun = null, finished = false;
    function finish() {
        if (finished) return; finished = true;
        resolveRun({ ok: true, folder: tDir, saved: saved, warnings: warnings });
    }
    return new Promise(function (res) {
        resolveRun = res;
        Promise.resolve().then(nextDl).catch(function (eChain) {
            warnings.push("grab chain error: " + (eChain && eChain.message || eChain));
            finish();
        });
    });
}


// ---- folder-tree builders (Grab tab "Folder tools") ------------------------
/* buildTitleTree(dir) → {ok, created:[], existed:[]} — the standard per-title
   source tree (Script/Project/Assets/Reference images/Hook/Maps/Characters)
   inside ANY selected folder. Idempotent: existing folders are left alone. */
function buildTitleTree(dir) {
    var created = [], existed = [];
    if (!dir) return { ok: false, error: "no folder selected" };
    for (var i = 0; i < SUBFOLDERS.length; i++) {
        var p = path.join(dir, SUBFOLDERS[i]);
        try {
            if (fs.existsSync(p)) { existed.push(SUBFOLDERS[i]); continue; }
            fs.mkdirSync(p, { recursive: true });
            created.push(SUBFOLDERS[i]);
        } catch (e) { return { ok: false, error: SUBFOLDERS[i] + ": " + (e && e.message || e), created: created, existed: existed }; }
    }
    return { ok: true, created: created, existed: existed };
}
/* the Render tab's per-type destination folders — where rendered section clips land */
var OUTPUT_FOLDERS = ["Hook Section", "Map Section", "Reference Image Sections", "Character Sections"];
/* buildOutputTree(dir, folders?) → same contract as buildTitleTree, but builds
   the RENDER OUTPUT structure in a selected output folder. Callers may pass a
   custom folder list (e.g. the Render tab's live mapping). */
function buildOutputTree(dir, folders) {
    var list = (folders && folders.length) ? folders : OUTPUT_FOLDERS;
    var created = [], existed = [];
    if (!dir) return { ok: false, error: "no folder selected" };
    for (var i = 0; i < list.length; i++) {
        if (!list[i]) continue;                                  // blank mapping (AI) = skipped type
        var p = path.join(dir, list[i]);
        try {
            if (fs.existsSync(p)) { existed.push(list[i]); continue; }
            fs.mkdirSync(p, { recursive: true });
            created.push(list[i]);
        } catch (e) { return { ok: false, error: list[i] + ": " + (e && e.message || e), created: created, existed: existed }; }
    }
    return { ok: true, created: created, existed: existed };
}

module.exports = { healFolderNames: healFolderNames, normName: normName, buildTitleTree: buildTitleTree, buildOutputTree: buildOutputTree, OUTPUT_FOLDERS: OUTPUT_FOLDERS, decodeExit: decodeExit, runWhisperAsync: runWhisperAsync, whisperPlan: whisperPlan, whisperArgs: whisperArgs, whisperEnv: whisperEnv, attSaveName: attSaveName, scan: scan, run: run, titleHealth: titleHealth, buildWordSrt: buildWordSrt, wordsFromWhisperJson: wordsFromWhisperJson, resolveTool: resolveTool,
                   classifyAttachment: classifyAttachment, nextNumber: nextNumber, usedNumbers: usedNumbers, assignNumbers: assignNumbers, sanitize: sanitize, SUBFOLDERS: SUBFOLDERS };
