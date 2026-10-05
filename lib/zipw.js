/* lib/zipw.js — a minimal ZIP writer (deflate, pure Node): write(outPath, [{name, data}]) → bytes written */
"use strict";
var fs = require("fs"), zlib = require("zlib");
var CRC = (function () { var t = new Int32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c; } return t; })();
function crc32(buf) { var c = -1; for (var i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function dosTime(d) { return ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xFFFF; }
function dosDate(d) { return (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF; }
function write(outPath, files) {
    var parts = [], central = [], off = 0, now = new Date(), t = dosTime(now), dd = dosDate(now);
    files.forEach(function (f) {
        var name = Buffer.from(String(f.name).replace(/\\/g, "/"), "utf8"), data = Buffer.isBuffer(f.data) ? f.data : Buffer.from(String(f.data), "utf8");
        var comp = zlib.deflateRawSync(data, { level: 9 }), method = 8; if (comp.length >= data.length) { comp = data; method = 0; }
        var crc = crc32(data), lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(method, 8); lh.writeUInt16LE(t, 10); lh.writeUInt16LE(dd, 12); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(name.length, 26); lh.writeUInt16LE(0, 28);
        var ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(method, 10); ch.writeUInt16LE(t, 12); ch.writeUInt16LE(dd, 14); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(name.length, 28); ch.writeUInt16LE(0, 30); ch.writeUInt16LE(0, 32); ch.writeUInt16LE(0, 34); ch.writeUInt16LE(0, 36); ch.writeUInt32LE(0, 38); ch.writeUInt32LE(off, 42);
        parts.push(lh, name, comp); central.push(ch, name); off += lh.length + name.length + comp.length;
    });
    var cdSize = central.reduce(function (a, b) { return a + b.length; }, 0), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(0, 4); end.writeUInt16LE(0, 6); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(cdSize, 12); end.writeUInt32LE(off, 16); end.writeUInt16LE(0, 20);
    var all = Buffer.concat(parts.concat(central, [end])); fs.writeFileSync(outPath, all); return all.length;
}
module.exports = { write: write, crc32: crc32 };
