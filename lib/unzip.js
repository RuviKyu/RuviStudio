/* lib/unzip.js — RUVI Conductor · minimal ZIP reader (stored + deflate entries) so the
   writing-room package unpacks without Explorer or PowerShell. */
"use strict";
var fs = require("fs"), path = require("path"), zlib = require("zlib");
function extract(zipFile, destDir, opts) {
    opts = opts || {}; var buf = fs.readFileSync(zipFile), out = [];
    // end of central directory
    var eocd = -1; for (var i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) { if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) throw new Error("not a zip: " + path.basename(zipFile));
    var count = buf.readUInt16LE(eocd + 10), cdOff = buf.readUInt32LE(eocd + 16), p = cdOff;
    for (var e = 0; e < count; e++) {
        if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("bad central directory");
        var method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20), usize = buf.readUInt32LE(p + 24);
        var nlen = buf.readUInt16LE(p + 28), xlen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32), lho = buf.readUInt32LE(p + 42);
        var name = buf.toString("utf8", p + 46, p + 46 + nlen); p += 46 + nlen + xlen + clen;
        if (/\/$/.test(name)) continue;                              // directory entry
        var safe = name.replace(/\\/g, "/").split("/").filter(function (s) { return s && s !== ".." && s !== "."; });
        var rel = opts.flatten ? safe[safe.length - 1] : safe.join("/");
        if (opts.filter && !opts.filter(rel)) continue;
        var lnlen = buf.readUInt16LE(lho + 26), lxlen = buf.readUInt16LE(lho + 28), dataOff = lho + 30 + lnlen + lxlen;
        var data = buf.subarray(dataOff, dataOff + csize), bytes;
        if (method === 0) bytes = data; else if (method === 8) bytes = zlib.inflateRawSync(data); else throw new Error("unsupported zip method " + method + " for " + name);
        if (bytes.length !== usize) throw new Error("size mismatch for " + name);
        var dest = path.join(destDir, rel); fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, bytes); out.push(rel);
    }
    return out;
}
function list(zipFile) {
    var buf = fs.readFileSync(zipFile), names = [], eocd = -1; for (var i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) { if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) return names; var count = buf.readUInt16LE(eocd + 10), p = buf.readUInt32LE(eocd + 16);
    for (var e = 0; e < count; e++) { if (buf.readUInt32LE(p) !== 0x02014b50) break; var nlen = buf.readUInt16LE(p + 28), xlen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32); var name = buf.toString("utf8", p + 46, p + 46 + nlen); p += 46 + nlen + xlen + clen; if (!/\/$/.test(name)) names.push(name.split("/").pop()); }
    return names;
}
module.exports = { extract: extract, list: list };
