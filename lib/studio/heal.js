/* ============================================================================
   heal.js — RUVI Studio's self-healing layer (Premiere suite port). Philosophy: "missing" is a
   condition to repair, not report. Folders are recreated, the Background
   backplate is restored from known fallbacks, corrupt state files are
   quarantined (.corrupt-<ts>) and rebuilt fresh, and a secrets template is
   scaffolded so setup mistakes are visible instead of silent.
   Active healing (auto-acquire / auto-whisper) is wired in app.js off the
   heal flags queue.validate computes.
   ========================================================================== */
"use strict";
var fs = require("fs");
var path = require("path");

var TITLE_SUBS = ["Script", "Project", "Assets", "Reference images", "Hook", "Maps", "Characters", "_LOGS"];

function mk(p) { try { fs.mkdirSync(p, { recursive: true }); return true; } catch (e) { return false; } }

/* recreate any missing per-title folders; returns the list it healed */
function healTitleTree(titleFolder) {
    var healed = [];
    if (!titleFolder) return healed;
    for (var i = 0; i < TITLE_SUBS.length; i++) {
        var p = path.join(titleFolder, TITLE_SUBS[i]);
        if (!fs.existsSync(p) && mk(p)) healed.push(TITLE_SUBS[i]);
    }
    return healed;
}

/* base scaffolding + a secrets template (never touches a real secrets.json) */
function healBase(cfg) {
    var healed = [];
    var dirs = [cfg.paths.stateDir, cfg.paths.logsDir,
                path.join(cfg.baseDir, "_STAGING"), path.dirname(cfg.paths.secretsFile)];
    for (var i = 0; i < dirs.length; i++)
        if (dirs[i] && !fs.existsSync(dirs[i]) && mk(dirs[i])) healed.push(path.basename(dirs[i]));
    try {
        var tpl = path.join(path.dirname(cfg.paths.secretsFile), "secrets.template.json");
        if (!fs.existsSync(cfg.paths.secretsFile) && !fs.existsSync(tpl)) {
            fs.writeFileSync(tpl, JSON.stringify({
                trelloKey: "", trelloToken: "(read-only scope)", boardId: "",
                rcloneRemote: "", acquireUserAgent: "RUVI/1.0 (contact: you@example.com)"
            }, null, 2));
            healed.push("secrets.template.json");
        }
    } catch (e) {}
    return healed;
}

/* Background.png: extension assets is the home; if it's gone, restore it from
   the sibling Maps panel or any title's Assets copy. */
function healBackground(extDir, cfg) {
    var home = path.join(String(extDir), "assets", "Background.png");
    try { if (fs.existsSync(home) && fs.statSync(home).size > 10000) return { ok: true, healed: false }; } catch (e) {}
    var cands = [];
    try {
        var cepRoot = path.dirname(String(extDir));
        fs.readdirSync(cepRoot).forEach(function (d) {
            cands.push(path.join(cepRoot, d, "assets", "Background.png"));
        });
    } catch (e2) {}
    try {
        fs.readdirSync(cfg.baseDir).forEach(function (ch) {
            if (/^_/.test(ch)) return;
            var chDir = path.join(cfg.baseDir, ch);
            var titles = [];
            try { titles = fs.readdirSync(chDir); } catch (e3) { return; }
            for (var i = 0; i < Math.min(titles.length, 6); i++)
                cands.push(path.join(chDir, titles[i], "Assets", "Background.png"));
        });
    } catch (e4) {}
    for (var c = 0; c < cands.length; c++) {
        try {
            if (cands[c] !== home && fs.existsSync(cands[c]) && fs.statSync(cands[c]).size > 10000) {
                mk(path.dirname(home));
                fs.copyFileSync(cands[c], home);
                return { ok: true, healed: true, from: cands[c] };
            }
        } catch (e5) {}
    }
    return { ok: false, healed: false };
}

/* tolerant JSON read: a corrupt file is renamed .corrupt-<ts> and treated as
   absent, so one bad byte never bricks the panel */
function safeReadJson(file, fallback) {
    var raw = null;
    try { raw = fs.readFileSync(file, "utf8"); } catch (e) { return { obj: fallback, healed: false, existed: false }; }
    try { return { obj: JSON.parse(raw), healed: false, existed: true }; }
    catch (e2) {
        var bak = file + ".corrupt-" + new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
        try { fs.renameSync(file, bak); } catch (e3) {}
        return { obj: fallback, healed: true, existed: true, backedUpTo: bak };
    }
}

/* word-level files live in Script\ — move any root-placed ones there (the
   pre-0.12.2 home), so old titles migrate themselves on the next touch */
function relocateWordFiles(titleFolder) {
    var moved = [];
    var scriptDir = path.join(titleFolder, "Script");
    var names = [];
    try { names = fs.readdirSync(titleFolder); } catch (e) { return moved; }
    names.forEach(function (n) {
        if (!/(_word_level\.srt|_words\.json)$/i.test(n)) return;
        try {
            mk(scriptDir);
            var dst = path.join(scriptDir, n);
            if (!fs.existsSync(dst)) fs.renameSync(path.join(titleFolder, n), dst);
            else fs.unlinkSync(path.join(titleFolder, n));
            moved.push(n);
        } catch (e2) {}
    });
    return moved;
}

/* heal extension-less files in Script\ (Trello display-name grabs): sniff the
   bytes and give them their real extension so health checks can see them */
function fixScriptExtensions(titleFolder) {
    var fixed = [];
    var sd = path.join(titleFolder, "Script");
    var names = [];
    try { names = fs.readdirSync(sd); } catch (e) { return fixed; }
    names.forEach(function (n) {
        if (/\.[a-z0-9]{2,5}$/i.test(n)) return;                     // already has an extension
        var f = path.join(sd, n);
        try {
            if (!fs.statSync(f).isFile()) return;
            var fd = fs.openSync(f, "r");
            var buf = Buffer.alloc(4096);
            var got = fs.readSync(fd, buf, 0, 4096, 0);
            fs.closeSync(fd);
            var head = buf.slice(0, got);
            var ext = null;
            if (head[0] === 0x50 && head[1] === 0x4B)                  // PK zip container
                ext = head.indexOf("word/") >= 0 ? ".docx" : ".zip";
            else if (head.slice(0, 3).toString() === "ID3" || (head[0] === 0xFF && (head[1] & 0xE0) === 0xE0))
                ext = ".mp3";
            else if (head[0] === 0x89 && head.slice(1, 4).toString() === "PNG") ext = ".png";
            else if (head[0] === 0xFF && head[1] === 0xD8) ext = ".jpg";
            else if (head.slice(0, 5).toString() === "{\\rtf") ext = ".rtf";
            if (!ext) return;
            var dst = f + ext;
            if (!fs.existsSync(dst)) { fs.renameSync(f, dst); fixed.push(n + " → " + n + ext); }
        } catch (e2) {}
    });
    return fixed;
}

/* copy the backplate INTO the title so saved .aep files never reference the
   extension folder (which gets renamed/replaced on updates — the source of the
   "1 file is missing" nags on old projects) */
function ensureTitleBackground(titleFolder, extDir) {
    var dst = path.join(titleFolder, "Assets", "Background.png");
    try { if (fs.existsSync(dst) && fs.statSync(dst).size > 10000) return { ok: true, copied: false }; } catch (e) {}
    var src = path.join(String(extDir || ""), "assets", "Background.png");
    try {
        if (fs.existsSync(src) && fs.statSync(src).size > 10000) {
            mk(path.dirname(dst));
            fs.copyFileSync(src, dst);
            return { ok: true, copied: true };
        }
    } catch (e2) {}
    return { ok: false, copied: false };
}

/* package artifacts belong in Script\ — sweep strays from the title root
   (Explorer-extracted zips land there). Ledgers (_saved_links, _ingest_state,
   _pipeline_state) and Cover stay put. Same-size twins in Script\ dedupe. */
function sweepPackageFiles(titleFolder) {
    var moved = [];
    var scriptDir = path.join(titleFolder, "Script");
    var names = [];
    try { names = fs.readdirSync(titleFolder); } catch (e) { return moved; }
    names.forEach(function (n) {
        var f = path.join(titleFolder, n);
        try { if (!fs.statSync(f).isFile()) return; } catch (e0) { return; }
        if (/^_/.test(n)) return;                                    // ledgers stay
        var go = false;
        if (/\.(md|srt)$/i.test(n)) go = true;
        else if (/_manifest\.json$/i.test(n) || /_words\.json$/i.test(n)) go = true;
        else if (/_package\.zip$/i.test(n)) go = true;
        else if (/^Channel_Prompt_Suffixes\.txt$/i.test(n)) go = true;
        else if (/\.txt$/i.test(n)) {
            try { go = /^SECTION\s+\d+\s*\|/m.test(fs.readFileSync(f, "utf8")); } catch (e1) {}
        }
        if (!go) return;
        try {
            mk(scriptDir);
            var dst = path.join(scriptDir, n);
            if (fs.existsSync(dst)) {
                var same = false;
                try { same = fs.statSync(dst).size === fs.statSync(f).size; } catch (e2) {}
                if (same) { fs.unlinkSync(f); moved.push(n + " (duplicate removed)"); return; }
                dst = path.join(scriptDir, n.replace(/(\.[^.]+)$/, "_root$1"));
            }
            fs.renameSync(f, dst);
            moved.push(n);
        } catch (e3) {}
    });
    return moved;
}

module.exports = { sweepPackageFiles: sweepPackageFiles, ensureTitleBackground: ensureTitleBackground, fixScriptExtensions: fixScriptExtensions, relocateWordFiles: relocateWordFiles, healTitleTree: healTitleTree, healBase: healBase,
                   healBackground: healBackground, safeReadJson: safeReadJson,
                   TITLE_SUBS: TITLE_SUBS };
