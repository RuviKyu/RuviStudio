#!/usr/bin/env node
/* tools/setup.js — writes tool paths into studio.config.json (used by the launchers).
   node tools/setup.js --ffmpeg <path> --ffprobe <path> --chrome <path> [--base <folder>]   → prints the port */
"use strict";
var fs = require("fs"), path = require("path");
var file = path.join(__dirname, "..", "studio.config.json"), cfg = {};
try { cfg = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) {}
var a = process.argv.slice(2), opt = {};
for (var i = 0; i < a.length; i += 2) if (/^--/.test(a[i])) opt[a[i].slice(2)] = a[i + 1];
if (opt.ffmpeg) cfg.ffmpeg = opt.ffmpeg;
if (opt.ffprobe) cfg.ffprobe = opt.ffprobe;
if (opt.chrome) { cfg.render = cfg.render || {}; cfg.render.chrome = opt.chrome; }
if (opt.base) cfg.base = opt.base;
if (!cfg.port) cfg.port = 4710;
fs.writeFileSync(file, JSON.stringify(cfg, null, 2));
process.stdout.write(String(cfg.port));
