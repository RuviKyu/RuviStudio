/* ============================================================================
   lib/render/native.js — the special-section renderer WITHOUT a browser.
   Skia (@napi-rs/canvas, the same 2D engine Chrome uses) draws each frame of the
   FLAT world — the map fitted into the comp, the camera's pan/zoom as a 2D affine,
   pins, labels, leaders, routes, highlights, or the REF/CHAR card — into an
   oversized frame; ffmpeg's `perspective` filter applies the 3D part (the 11° table
   lean + living rock, or the card's tilt) as an exact homography whose corners are
   closed-form expressions of the frame number; then crop, edge blur, fades, NVENC.
   Every frame stays on this machine's own CPU/GPU path: no screenshots, no CDP.
   Look and maths are scene.html's (camera.js is shared).
   ========================================================================== */
"use strict";
var fs = require("fs"), path = require("path"), os = require("os"), spawn = require("child_process").spawn;
var CAM = require("./camera.js"), FF = require("../ffmpeg.js");
var CFG = CAM.CFG, SC = CAM.SC, W = CAM.W, H = CAM.H, D = CAM.PERSPECTIVE;     // D = the camera's perspective distance

function skia() { try { return require("@napi-rs/canvas"); } catch (e) { throw new Error("@napi-rs/canvas is not installed — run `npm install` in the app folder (the launcher does it)"); } }
var fontsDone = false;
function registerFonts(K) {
    if (fontsDone) return; fontsDone = true;
    var dirs = process.platform === "win32" ? [path.join(process.env.WINDIR || "C:\\Windows", "Fonts"), path.join(process.env.LOCALAPPDATA || "", "Microsoft", "Windows", "Fonts")]
        : process.platform === "darwin" ? ["/Library/Fonts", path.join(os.homedir(), "Library", "Fonts"), "/System/Library/Fonts"] : ["/usr/share/fonts", path.join(os.homedir(), ".fonts"), path.join(os.homedir(), ".local", "share", "fonts")];
    dirs.forEach(function (d) { try { K.GlobalFonts.loadFontsFromDir(d); } catch (e) {} });
    [path.join(__dirname, "fonts"), path.join(__dirname, "..", "..", "runtime", "fonts")].forEach(function (d) { try { K.GlobalFonts.loadFontsFromDir(d); } catch (e2) {} });   // the app's own fonts (Pirata One, Cinzel) travel with it
}
function fontFamily(K, wanted) { var have = {}; try { K.GlobalFonts.families.forEach(function (f) { have[String(f.family).toLowerCase()] = f.family; }); } catch (e) {} for (var i = 0; i < wanted.length; i++) { var f = have[wanted[i].toLowerCase()]; if (f) return f; } return "serif"; }

/* ---- the ffmpeg perspective expressions ------------------------------------ */
// corner (x,y) relative to the frame centre → screen offset after Rx(a)·Ry(b)·Rz(c) and the perspective divide
function cornerExpr(x, y, A, B, C, cx, cy) {
    // A, B, C: expression strings for the three angles in radians (functions of `on`)
    var x1 = "(" + x + "*cos(" + C + ")-" + y + "*sin(" + C + "))", y1 = "(" + x + "*sin(" + C + ")+" + y + "*cos(" + C + "))";
    var z2 = "(-" + x1 + "*sin(" + B + "))", x3 = "(" + x1 + "*cos(" + B + "))";
    var y3 = "(" + y1 + "*cos(" + A + ")-" + z2 + "*sin(" + A + "))", z3 = "(" + y1 + "*sin(" + A + ")+" + z2 + "*cos(" + A + "))";
    var w = "(1-" + z3 + "/" + (cornerExpr.D || D) + ")";
    return { x: "(" + cx + "+" + x3 + "/" + w + ")", y: "(" + cy + "+" + y3 + "/" + w + ")" };
}
function perspectiveFilter(FW, FH, A, B, C) {
    var cx = FW / 2, cy = FH / 2, tl = cornerExpr(-cx, -cy, A, B, C, cx, cy), tr = cornerExpr(cx, -cy, A, B, C, cx, cy), bl = cornerExpr(-cx, cy, A, B, C, cx, cy), br = cornerExpr(cx, cy, A, B, C, cx, cy);
    return "perspective=x0='" + tl.x + "':y0='" + tl.y + "':x1='" + tr.x + "':y1='" + tr.y + "':x2='" + bl.x + "':y2='" + bl.y + "':x3='" + br.x + "':y3='" + br.y + "':sense=destination:eval=frame:interpolation=cubic";
}
var RAD = Math.PI / 180;
function mapAngles(fps) {                                                   // the living camera: constant lean + slow rocking (scene.html seekMap)
    var t = "(on/" + fps + ")", E = CFG.camEnergy, tilt = (mapAngles.tilt != null) ? mapAngles.tilt : CFG.camTiltX;
    return { A: "((" + tilt + "+" + (CFG.camRotXAmp * E) + "*sin(2*PI*" + CFG.camRotXFreq + "*" + t + "))*" + RAD + ")",
             B: "((" + (CFG.camRotYAmp * E) + "*sin(2*PI*" + CFG.camRotYFreq + "*" + t + "+0.9))*" + RAD + ")",
             C: "((" + (CFG.camRotZAmp * E) + "*sin(2*PI*" + CFG.camRotZFreq + "*" + t + "+2.1))*" + RAD + ")" };
}
function keyedExpr(keys, idx, fps) {                                        // smoothstep between orientation keys (scene.html interp), as an `on` expression
    if (keys.length === 1) return "(" + keys[0].v[idx] + ")";
    var e = "(" + keys[keys.length - 1].v[idx] + ")";
    for (var i = keys.length - 1; i >= 1; i--) {
        var a = keys[i - 1], b = keys[i], f0 = a.t * fps, f1 = b.t * fps, u = "min(1,max(0,(on-" + f0 + ")/" + Math.max(1e-6, f1 - f0) + "))", ss = "(" + u + "*" + u + "*(3-2*" + u + "))";
        e = "if(lt(on," + f1 + "),(" + a.v[idx] + "+(" + (b.v[idx] - a.v[idx]) + ")*" + ss + ")," + e + ")";
    }
    return "if(lt(on," + (keys[0].t * fps) + "),(" + keys[0].v[idx] + ")," + e + ")";
}

/* ---- the flat world (map scenes) ------------------------------------------- */
function buildMapScene(K, spec) {
    var d = spec.data, MW = d.map_width, MH = d.map_height, fit = Math.min(W / MW, H / MH), S = { mapX: (W - MW * fit) / 2, mapY: (H - MH * fit) / 2, sizef: 1 };
    var dd = Math.sqrt(MW * fit * MW * fit + MH * fit * MH * fit) / Math.sqrt(W * W + H * H); S.sizef = Math.max(0.2, Math.min(4, dd));
    var sf = S.sizef, locs = d.locations || [];
    function cp(loc) { var x = (loc.xNorm != null ? loc.xNorm * MW : loc.x), y = (loc.yNorm != null ? loc.yNorm * MH : loc.y); return [S.mapX + x * fit, S.mapY + y * fit]; }
    var pts = locs.map(cp), diag = Math.sqrt(Math.pow(MW * fit, 2) + Math.pow(MH * fit, 2));
    var CR = CFG.clusterFrac * diag, clOf = pts.map(function () { return -1; }), clusters = [];
    pts.forEach(function (p, i) { if (clOf[i] >= 0) return; var id = clusters.length; clOf[i] = id; var mem = [i]; for (var j = i + 1; j < pts.length; j++) { if (clOf[j] >= 0) continue; if (Math.hypot(pts[j][0] - p[0], pts[j][1] - p[1]) <= CR) { clOf[j] = id; mem.push(j); } } clusters.push(mem); });
    var midX = S.mapX + MW * fit / 2, R = CFG.pinRadius * sf, NL = CFG.pinRadius * 2.7 * sf, fs = CFG.labelFontSize * sf, pins = [];
    clusters.forEach(function (mem) {
        var isCl = mem.length >= 2, cx = 0, cy = 0; mem.forEach(function (i) { cx += pts[i][0]; cy += pts[i][1]; }); cx /= mem.length; cy /= mem.length; var side = (cx < midX) ? -1 : 1;
        mem.sort(function (a, b) { return pts[a][1] - pts[b][1]; });
        mem.forEach(function (i, k) {
            var loc = locs[i], p = pts[i], t0 = (loc.timeMs || 0) / 1000 - CFG.appearLead; if (t0 < 0) t0 = 0;
            var lx, ly, align = "center"; if (isCl) { var stackH = mem.length * fs * CFG.clusterStackGap; lx = cx + side * CFG.clusterStackX * sf; ly = cy - stackH / 2 + fs * CFG.clusterStackGap * (k + 0.5); align = side > 0 ? "left" : "right"; } else { lx = p[0]; ly = p[1] - (CFG.pinRadius * 4.7 * sf + fs * 0.7 + 4 * sf); }
            var lead = null; if (isCl) { var ex = lx - side * 3 * sf, ey = ly, L = Math.hypot(ex - p[0], ey - p[1]) || 1, ux = (ex - p[0]) / L, uy = (ey - p[1]) / L, s0 = Math.min(2.5 * sf, L * 0.3); lead = [p[0] + ux * s0, p[1] + uy * s0, ex, ey]; }
            pins.push({ p: p, t0: t0, name: loc.name || "", color: loc.color || CFG.pinColor, cluster: isCl, lx: lx, ly: ly, align: align, lead: lead });
        });
    });
    var mode = String(d.render || "pins").toLowerCase(), route = null; S.routeMode = (mode === "route" || d.route === true) && locs.length >= 2;
    if ((mode === "route" || d.route === true) && locs.length >= 2) {
        var order = locs.map(function (l, i) { return i; }).sort(function (a, b) { return (locs[a].timeMs || 0) - (locs[b].timeMs || 0); }), segs = [], poly = [pts[order[0]]];
        order.forEach(function (i, k) { if (!k) return; var p = pts[i], q = pts[order[k - 1]], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, dx = p[0] - q[0], dy = p[1] - q[1], c = [mx - dy * 0.1, my + dx * 0.1];
            for (var s = 1; s <= 24; s++) { var u = s / 24, x = (1 - u) * (1 - u) * q[0] + 2 * (1 - u) * u * c[0] + u * u * p[0], y = (1 - u) * (1 - u) * q[1] + 2 * (1 - u) * u * c[1] + u * u * p[1]; poly.push([x, y]); }
            segs.push({ a: order[k - 1], b: i, t0: (locs[order[k - 1]].timeMs || 0) / 1000, t1: (locs[i].timeMs || 0) / 1000, i0: 24 * (k - 1), i1: 24 * k }); });
        var lens = [0]; for (var q2 = 1; q2 < poly.length; q2++) lens.push(lens[q2 - 1] + Math.hypot(poly[q2][0] - poly[q2 - 1][0], poly[q2][1] - poly[q2 - 1][1]));
        segs.forEach(function (sg) { sg.L0 = lens[sg.i0]; sg.L1 = lens[sg.i1]; });                          // each leg owns its own arc range, so the line draws at one steady pace leg by leg
        route = { poly: poly, lens: lens, len: lens[lens.length - 1], segs: segs };
    }
    var anyFlag = locs.some(function (l) { return l.highlight === true; }), hls = [];
    locs.forEach(function (loc, i) { if (loc.highlight === true || (mode === "highlight" && !anyFlag)) { var ip = CAM.inkPath(loc, pts[i], sf, MW, MH, fit, S.mapX, S.mapY), lens = [0]; for (var q = 1; q <= ip.length; q++) { var a = ip[q - 1], b = ip[q % ip.length]; lens.push(lens[q - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); } hls.push({ p: pts[i], t0: (loc.timeMs || 0) / 1000, ink: ip, lens: lens, len: lens[lens.length - 1] }); } });
    var keys = CAM.planCamera(pts, locs, diag, fit, MW, MH, S, spec.durationSec);
    if (route && keys.legs) route.segs.forEach(function (sg) { var leg = keys.legs.filter(function (l) { return l.a === sg.a && l.b === sg.b; })[0]; if (leg) { sg.t0 = leg.t0; sg.t1 = leg.t1; } });   // the line's leg = the camera's pan window: leaves A with the camera, arrives at B with it, same ease
    if (route && keys.pinArrive) { route.segs.forEach(function (sg, k) { var a = order[k], b = order[k + 1]; sg.t0 = keys.pinArrive[a]; sg.t1 = keys.pinArrive[b]; if (sg.t1 <= sg.t0 + 0.05) sg.t1 = sg.t0 + 0.05; }); }   // every leg draws exactly while the camera travels that leg: same start, same end, same ease
    return { S: S, fit: fit, MW: MW, MH: MH, sf: sf, R: R, NL: NL, fs: fs, pins: pins, route: route, hls: hls, keys: keys };
}
function popScale(t, t0) { var u = (t - t0) / CFG.appearDuration; if (u >= 1) return [1, 1]; if (u <= 0) return [0, 0]; var s; if (u < 0.65) { var a = u / 0.65; s = a * a * (3 - 2 * a) * CFG.popOvershoot; } else { var b = (u - 0.65) / 0.35, e2 = b * b * (3 - 2 * b); s = CFG.popOvershoot + (1 - CFG.popOvershoot) * e2; } return [s, Math.min(1, u / 0.45)]; }
function buildMips(K, img) {                                                   // [{scale:1,img}, {0.5}, {0.25}, {0.125}] — built once per section (~1 s each)
    var mips = [{ scale: 1, img: img }], cur = img, sc = 1;
    while (cur.width > 2600 && sc > 0.12) { sc /= 2; var c = K.createCanvas(Math.max(1, Math.round(img.width * sc)), Math.max(1, Math.round(img.height * sc))), x = c.getContext("2d"); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high"; x.drawImage(cur, 0, 0, c.width, c.height); mips.push({ scale: sc, img: c }); cur = c; }
    return mips;
}
function pickMip(mips, need) { var best = mips[0]; for (var i = 0; i < mips.length; i++) if (mips[i].scale >= need * 0.999) best = mips[i]; return best; }   // the smallest copy that is still ≥ the drawn scale
function drawMapFrame(ctx, sc, mapMips, bgImg, t, FW, FH, fontLabel) {
    var K = sc.keys, C = CAM.interp(K.pos, t, K.linearFirst), z = CAM.interp(K.sc, t, K.linearFirst)[0], sf = sc.sf;
    C = CAM.clampView(C, z, sc.S, sc.MW, sc.MH, sc.fit, true);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, FW, FH);
    if (bgImg) { var bs = Math.max(FW / bgImg.width, FH / bgImg.height); ctx.drawImage(bgImg, (FW - bgImg.width * bs) / 2, (FH - bgImg.height * bs) / 2, bgImg.width * bs, bgImg.height * bs); }
    // the world: comp space scaled by 1/z about the aim point C, which lands on the frame centre
    var s = 1 / z; ctx.setTransform(s, 0, 0, s, FW / 2 - C[0] * s, FH / 2 - C[1] * s);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "medium";
    var mip = pickMip(mapMips, sc.fit / z); ctx.drawImage(mip.img, 0, 0, mip.img.width, mip.img.height, sc.S.mapX, sc.S.mapY, sc.MW * sc.fit, sc.MH * sc.fit);
    // highlights: "ink" = an ink outline drawn on around the place (its traced shape when the bundle has one), then a faint wash; "glow" = the old gold ring
    sc.hls.forEach(function (h) {
        if (t < h.t0) return;
        if ((CFG.hlStyle || "ink") === "glow") { var u0 = Math.max(0, Math.min(1, (t - h.t0) / 0.6)), r = CFG.hlRadius * sf, g = ctx.createRadialGradient(h.p[0], h.p[1], 0, h.p[0], h.p[1], r); g.addColorStop(0, "rgba(255,199,64," + (0.55 * u0 * CFG.hlGlowOpacity * 2) + ")"); g.addColorStop(0.7, "rgba(255,199,64,0)"); g.addColorStop(1, "rgba(255,199,64,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(h.p[0], h.p[1], r, 0, Math.PI * 2); ctx.fill();
            var ph = ((t - h.t0) % CFG.hlPulsePeriod) / CFG.hlPulsePeriod, k = 1 + (CFG.hlPulseMax - 1) * (ph < 0.5 ? ph * 2 : 2 - ph * 2); ctx.strokeStyle = "rgba(255,199,64," + (0.9 * u0 * (1 - (k - 1) / (CFG.hlPulseMax - 1) * 0.7)) + ")"; ctx.lineWidth = CFG.hlRingW * sf; ctx.beginPath(); ctx.arc(h.p[0], h.p[1], r * k, 0, Math.PI * 2); ctx.stroke(); return; }
        var u = Math.min(1, (t - h.t0) / CFG.hlTraceDur), e = CAM.easeFoam(u), vis = h.len * e, breathe = 0.82 + 0.18 * Math.sin((t - h.t0) * 1.9);
        ctx.beginPath(); ctx.moveTo(h.ink[0][0], h.ink[0][1]);
        for (var i = 1; i <= h.ink.length; i++) { var q = h.ink[i % h.ink.length]; if (h.lens[i] <= vis) ctx.lineTo(q[0], q[1]); else { var pr = h.ink[i - 1], f = (vis - h.lens[i - 1]) / Math.max(1e-6, h.lens[i] - h.lens[i - 1]); ctx.lineTo(pr[0] + (q[0] - pr[0]) * f, pr[1] + (q[1] - pr[1]) * f); break; } }
        ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.setLineDash([]);
        ctx.strokeStyle = CFG.hlInk; ctx.lineWidth = CFG.hlInkW * sf * (u < 1 ? 1 : breathe); ctx.globalAlpha = u < 1 ? 1 : (0.75 + 0.25 * breathe); ctx.stroke();
        ctx.strokeStyle = "rgba(112,26,26,0.35)"; ctx.lineWidth = CFG.hlInkW * sf * 2.2; ctx.stroke();      // a soft second pass = the ink bleeding into the paper
        if (u >= 1) { var fu = Math.min(1, (t - h.t0 - CFG.hlTraceDur) / 0.5); ctx.globalAlpha = fu; ctx.beginPath(); h.ink.forEach(function (q2, i2) { if (i2) ctx.lineTo(q2[0], q2[1]); else ctx.moveTo(q2[0], q2[1]); }); ctx.closePath(); ctx.fillStyle = CFG.hlInkFill; ctx.fill(); }
        ctx.globalAlpha = 1;
    });
    // route (casing + dashed line) revealed pin → pin
    if (sc.route) { var r0 = sc.route, vis = routeVisible(r0, t);
        if (vis > 0) { ctx.beginPath(); ctx.moveTo(r0.poly[0][0], r0.poly[0][1]); for (var i = 1; i < r0.poly.length; i++) { if (r0.lens[i] <= vis) ctx.lineTo(r0.poly[i][0], r0.poly[i][1]); else { var f = (vis - r0.lens[i - 1]) / Math.max(1e-6, r0.lens[i] - r0.lens[i - 1]); ctx.lineTo(r0.poly[i - 1][0] + (r0.poly[i][0] - r0.poly[i - 1][0]) * f, r0.poly[i - 1][1] + (r0.poly[i][1] - r0.poly[i - 1][1]) * f); break; } }
            ctx.lineCap = "round"; if (CFG.routeCasing) { ctx.setLineDash([]); ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = CFG.routeCasingWidth * sf * 1.4; ctx.stroke(); }   // the translucent casing is off by default (3.9)
            ctx.setLineDash([CFG.routeDash * sf, CFG.routeGap * sf]); ctx.strokeStyle = CFG.routeColor; ctx.lineWidth = CFG.routeWidth * sf * 1.4; ctx.stroke(); ctx.setLineDash([]); } }
    // pins + labels (+ leaders)
    sc.pins.forEach(function (p) {
        var so = popScale(t, p.t0), s2 = so[0], o = so[1]; if (o <= 0) return;
        ctx.globalAlpha = o;
        if (p.lead) { ctx.strokeStyle = CFG.leaderColor; ctx.lineWidth = CFG.leaderWidth * sf; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(p.lead[0], p.lead[1]); ctx.lineTo(p.lead[2], p.lead[3]); ctx.stroke(); }
        ctx.save(); ctx.translate(p.p[0], p.p[1]); ctx.scale(s2, s2);
        if (p.cluster) { ctx.beginPath(); ctx.arc(0, 0, Math.max(1.5, 1 * sf), 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.fill(); ctx.lineWidth = 1.5 * sf; ctx.strokeStyle = "#000"; ctx.stroke(); }
        else { var nw = Math.max(0.8, CFG.pinRadius * 0.3) * sf, hc = -(sc.NL + sc.R); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-nw, -sc.NL); ctx.lineTo(nw, -sc.NL); ctx.closePath(); ctx.fillStyle = CFG.needleColor; ctx.fill(); ctx.lineWidth = CFG.pinStrokeW * sf * 0.6; ctx.strokeStyle = "#000"; ctx.stroke();
            ctx.beginPath(); ctx.arc(0, hc, sc.R, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.fill(); ctx.lineWidth = CFG.pinStrokeW * sf; ctx.strokeStyle = "#000"; ctx.stroke(); ctx.beginPath(); ctx.arc(-sc.R * 0.3, hc - sc.R * 0.3, sc.R * 0.28, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.fill(); }
        ctx.restore();
        ctx.save(); ctx.translate(p.lx, p.ly); ctx.scale(s2, s2); ctx.font = sc.fs + "px " + fontLabel; ctx.textAlign = p.align || "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
        ctx.shadowColor = "rgba(0,0,0,.9)"; ctx.shadowBlur = 6 * sf * 0.5; ctx.strokeStyle = "#000"; ctx.lineWidth = 1 * sf * 0.35 * 2; ctx.strokeText(p.name, 0, 0); ctx.shadowBlur = 0; ctx.fillStyle = "#fff"; ctx.fillText(p.name, 0, 0); ctx.restore();
        ctx.globalAlpha = 1;
    });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/* ---- stills (REF / CHAR): the flat layer, alpha frame ---------------------- */
function buildStillScene(K, spec, img, bgImg, fontCard) {
    var d = spec.data, kind = String(d.still_type || "").toUpperCase(), w = img.width, h = img.height, seed = parseInt((String(d.source_file || "").match(/(\d+)/) || [0, 1])[1], 10) + (kind === "CHAR" ? 100 : 0), energy = d.energy != null ? +d.energy : 1, move = String(d.move || "auto").toLowerCase();
    if (kind !== "CHAR") {
        if (move === "auto") move = (w / h < SC.tallAspect) ? "flyin_push" : "pullout";
        var F = [(d.focus && d.focus.xNorm != null ? d.focus.xNorm : 0.5) * w, (d.focus && d.focus.yNorm != null ? d.focus.yNorm : 0.5) * h], entry = String(d.entry || "").toLowerCase(); if (entry !== "left" && entry !== "right") entry = (seed % 2 ? "left" : "right");
        return { layer: img, w: w, h: h, keys: CAM.poseKeys(w, h, F, move, energy, seed, entry, spec.durationSec) };
    }
    // the CHAR card, composed once (scene.html buildStill, CHAR branch)
    var CW = SC.cardW, CH = SC.cardH, side = String(d.side || "right").toLowerCase() === "left" ? "left" : "right", tr = String(d.treatment || "auto").toLowerCase(), hasAlpha = !!spec.hasAlpha, bgk = String(d.background || "").toLowerCase();
    if (tr === "auto") tr = hasAlpha ? "cutout" : (bgk === "dark" ? "blend" : "framed"); if (tr === "cutout" && !hasAlpha) tr = bgk === "dark" ? "blend" : "framed";
    var card = K.createCanvas(CW, CH), c = card.getContext("2d"); c.fillStyle = "#0a0a0a"; c.fillRect(0, 0, CW, CH);
    if (bgImg) c.drawImage(bgImg, 0, 0, CW, CH);
    var crop = d.crop || {}, cx0 = (crop.xNorm || 0) * w, cy0 = (crop.yNorm || 0) * h, cw = (crop.wNorm != null ? crop.wNorm * w : w - cx0), ch = (crop.hNorm != null ? crop.hNorm * h : h - cy0);
    var targetH = (tr === "framed" ? SC.portraitH_frame : SC.portraitH_cut) * CH, s = targetH / ch; if (cw * s > SC.portraitMaxW * CW) s = (SC.portraitMaxW * CW) / cw;
    var dispW = cw * s, dispH = ch * s, px = (side === "right" ? SC.portraitX : 1 - SC.portraitX) * CW, py = tr === "framed" ? CH / 2 : (CH - dispH / 2), tilt = tr === "framed" ? (d.tilt != null ? +d.tilt : (side === "left" ? -SC.frameTilt : SC.frameTilt)) : 0;
    c.save(); c.translate(px, py); c.rotate(tilt * RAD);
    if (tr === "framed") { var mw = SC.frameMat * CH; c.shadowColor = "rgba(0,0,0,.6)"; c.shadowBlur = 40; c.shadowOffsetX = 12; c.shadowOffsetY = 14; c.fillStyle = "#eee3c9"; c.fillRect(-dispW / 2 - mw, -dispH / 2 - mw, dispW + 2 * mw, dispH + 2 * mw); c.shadowBlur = 0; c.shadowOffsetX = c.shadowOffsetY = 0; }
    if (tr === "blend") c.globalCompositeOperation = "lighten";
    c.drawImage(img, cx0, cy0, cw, ch, -dispW / 2, -dispH / 2, dispW, dispH); c.globalCompositeOperation = "source-over";
    if (tr === "blend") { var g = c.createLinearGradient(0, 0, 0, 0); c.strokeStyle = "rgba(10,10,10,0)"; var fe = 90 * s * Math.max(0.4, Math.min(2.5, h / 1600)); for (var i = 0; i < 6; i++) { c.strokeStyle = "rgba(10,10,10," + (0.16 - i * 0.02) + ")"; c.lineWidth = fe / 3; c.strokeRect(-dispW / 2 + i * fe / 6 - fe / 6, -dispH / 2 + i * fe / 6 - fe / 6, dispW - i * fe / 3 + fe / 3, dispH - i * fe / 3 + fe / 3); } }
    c.restore();
    var name = String(d.name || ""); if (name) { var margin = SC.cardMargin * CW, gap = SC.cardGap * CW, halfDisp = dispW / 2 + (tr === "framed" ? SC.frameMat * CH : 0), x0 = side === "right" ? margin : (px + halfDisp + gap), x1 = side === "right" ? (px - halfDisp - gap) : (CW - margin), freeW = Math.max(200, x1 - x0), lines = [name], sz = SC.cardFontSize;
        function fits(sz2, arr) { c.font = sz2 + "px " + fontCard; return arr.every(function (l) { return c.measureText(l).width <= freeW; }); }
        while (!fits(sz, lines) && sz > SC.cardFontMin) sz = Math.max(SC.cardFontMin, Math.round(sz * 0.93));
        if (!fits(sz, lines)) { var words = name.split(" "); if (words.length >= 2) { var mid = Math.ceil(words.length / 2); lines = [words.slice(0, mid).join(" "), words.slice(mid).join(" ")]; sz = SC.cardFontSize; while (!fits(sz, lines) && sz > SC.cardFontMin) sz = Math.max(SC.cardFontMin, Math.round(sz * 0.93)); } }
        c.font = sz + "px " + fontCard; c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle"; var lh = sz * 1.05, ty = SC.cardTextY * CH - (lines.length - 1) * lh / 2; lines.forEach(function (l, i) { c.fillText(l, x0 + freeW / 2, ty + i * lh); }); }
    var fxImg = (d.face && d.face.xNorm != null) ? d.face.xNorm * w : (cx0 + cw * 0.5), fyImg = (d.face && d.face.yNorm != null) ? d.face.yNorm * h : (cy0 + ch * 0.28), fx = Math.max(0, Math.min(1, (fxImg - cx0) / cw)), fy = Math.max(0, Math.min(1, (fyImg - cy0) / ch));
    var Fc = [px + (fx - 0.5) * dispW, py + (fy - 0.5) * dispH]; if (move === "auto") move = "pullout";
    return { layer: card, w: CW, h: CH, keys: CAM.poseKeys(CW, CH, Fc, move, energy, seed, "right", spec.durationSec) };
}
function drawStillFrame(ctx, st, t, FW, FH) {
    var K = st.keys, P = CAM.interp(K.pos, t), s = CAM.interp(K.sc, t)[0];
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, FW, FH);
    // the layer flat: its centre at P (comp space) → frame space offset by the margin; the 3D orientation is applied by ffmpeg
    var ox = (FW - W) / 2, oy = (FH - H) / 2; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.setTransform(s, 0, 0, s, ox + P[0] - st.w * s / 2, oy + P[1] - st.h * s / 2); ctx.drawImage(st.layer, 0, 0, st.w, st.h); ctx.setTransform(1, 0, 0, 1, 0, 0);
    // a transparent frame around the canvas: ffmpeg's perspective clamps to the edge pixels when the warp samples outside the source,
    // so the edge must be transparent (shows the backdrop) rather than image pixels (which smear into streaks)
    ctx.clearRect(0, 0, FW, 3); ctx.clearRect(0, FH - 3, FW, 3); ctx.clearRect(0, 0, 3, FH); ctx.clearRect(FW - 3, 0, 3, FH);
}

/* ---- the run ------------------------------------------------------------------ */
function renderSectionNative(o) {
    var K = skia(); registerFonts(K);
    var fontLabel = fontFamily(K, ["Algerian", "Cinzel", "Georgia", "Times New Roman"]), fontCard = fontFamily(K, ["Pirata One", "Germania One", "Old English Text MT", "Algerian", "Georgia"]);
    var fps = o.fps || 60, N = Math.max(2, Math.round(o.durationSec * fps)), onStep = o.onStep || function () {}, margin = 0.45, FW = Math.ceil(W * (1 + 2 * margin) / 2) * 2, FH = Math.ceil(H * (1 + 2 * margin) / 2) * 2;
    if (o.tableLean != null) mapAngles.tilt = +o.tableLean; if (o.perspective) cornerExpr.D = +o.perspective; if (o.hlStyle) CFG.hlStyle = o.hlStyle;
    var isStill = o.kind === "still", canvas = K.createCanvas(FW, FH), ctx = canvas.getContext("2d");
    return K.loadImage(o.imagePath).then(function (img) { return (o.bgPath ? K.loadImage(o.bgPath).catch(function () { return null; }) : Promise.resolve(null)).then(function (bg) { return [img, bg]; }); }).then(function (r) {
        var img = r[0], bg = r[1], scene, angles, alpha;
        if (isStill) { scene = buildStillScene(K, o, img, bg, fontCard); var ori = scene.keys.ori; angles = { A: "((" + keyedExpr(ori, 0, fps) + ")*" + RAD + ")", B: "((" + keyedExpr(ori, 1, fps) + ")*" + RAD + ")", C: "((" + keyedExpr(ori, 2, fps) + ")*" + RAD + ")" }; alpha = true; }
        else { if (!o.data.map_width) { o.data.map_width = img.width; o.data.map_height = img.height; } scene = buildMapScene(K, o); angles = mapAngles(fps); alpha = false; var tm = Date.now(); scene.mips = buildMips(K, img); onStep("sheet " + img.width + "x" + img.height + ", " + scene.mips.length + " mip level(s) in " + (Date.now() - tm) + " ms"); }
        // the still's rotation is about the LAYER centre, not the frame centre: shift the frame so the layer centre sits at the origin of the warp.
        // (handled by warping about the frame centre and letting the layer's own position ride along — a plane's homography is the same everywhere;
        //  the difference is only where the perspective "eye" sits: scene.html puts perspective-origin at the frame centre too.)
        onStep("native scene ready (" + (isStill ? "still" : "map") + ", " + N + " frames @ " + fps + " fps, Skia " + FW + "x" + FH + " → ffmpeg perspective" + (o.encoder === "nvenc" ? " → NVENC" : " → x264") + ")");
        var fade = (o.fadeSec != null) ? Math.min(+o.fadeSec, o.durationSec / 3) : 0;
        var persp = perspectiveFilter(FW, FH, angles.A, angles.B, angles.C), cropF = "crop=" + W + ":" + H + ":" + ((FW - W) / 2) + ":" + ((FH - H) / 2);
        var fadeF = fade > 0 ? ",fade=t=in:st=0:d=" + fade.toFixed(3) + ",fade=t=out:st=" + Math.max(0, o.durationSec - fade).toFixed(3) + ":d=" + fade.toFixed(3) : "";
        // inputs: [0] the raw frames from Skia · [1] backdrop (stills) or edge mask (maps) · [last] the narration slice
        var args = ["-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", FW + "x" + FH, "-r", String(fps), "-i", "-"], graph, nIn = 1;
        if (alpha) {
            if (o.bgPath) args = args.concat(["-loop", "1", "-framerate", String(fps), "-i", o.bgPath]); else args = args.concat(["-f", "lavfi", "-i", "color=c=black:s=" + W + "x" + H + ":r=" + fps]);
            nIn = 2; graph = "[0:v]format=gbrap," + persp + "," + cropF + ",format=rgba[layer];[1:v]scale=" + W + ":" + H + ":force_original_aspect_ratio=increase,crop=" + W + ":" + H + ",format=rgba[bg];[bg][layer]overlay=0:0:format=auto" + fadeF + ",format=yuv420p[out]";
        } else {
            graph = "[0:v]format=gbrp," + persp + "," + cropF;
            if (o.edgeBlur !== false) {
                var M = Object.assign({ edge: 5, corner: 14, edgeStart: 0.50, cornerStart: 0.72, vignette: 0.16 }, o.macro || {}), masks = macroMasks(K, o.tmpDir || os.tmpdir(), M);
                args = args.concat(["-loop", "1", "-framerate", String(fps), "-i", masks.edge, "-loop", "1", "-framerate", String(fps), "-i", masks.corner]); nIn = 3;
                graph += ",split=3[a][b][c];[b]gblur=sigma=" + M.edge + "[b1];[c]gblur=sigma=" + M.corner + "[c1];[1:v]format=gray[m1];[2:v]format=gray[m2];[a][b1][m1]maskedmerge[ab];[ab][c1][m2]maskedmerge";
                if (M.vignette > 0) graph += ",vignette=angle=" + (Math.PI / 5 * Math.min(1, M.vignette / 0.3)).toFixed(4) + ":mode=forward:eval=init";
            }
            graph += fadeF + ",format=yuv420p[out]";
        }
        var scriptPath = path.join(o.tmpDir || os.tmpdir(), "ruvi_fg_" + process.pid + "_" + Date.now() + ".txt"); fs.writeFileSync(scriptPath, graph);
        var venc = (o.encoder === "nvenc") ? ["-c:v", "h264_nvenc", "-preset", o.nvencPreset || "p5", "-tune", "hq", "-rc", "vbr", "-cq", String(o.nvencCq != null ? o.nvencCq : 19), "-b:v", "0", "-maxrate", "60M", "-bufsize", "120M", "-spatial-aq", "1", "-temporal-aq", "1", "-profile:v", "high", "-level", "4.2", "-g", String(fps * 2), "-bf", "3"]
            : ["-c:v", "libx264", "-preset", o.preset || "medium", "-crf", String(o.crf != null ? o.crf : 18), "-tune", "film", "-profile:v", "high", "-level", "4.2", "-g", String(fps * 2)];
        var hasAudio = !!(o.audio && o.audio.path); if (hasAudio) { args = args.concat(["-ss", String(o.audio.startSec || 0), "-t", String(o.durationSec), "-i", o.audio.path]); }
        args = args.concat(["-filter_complex_script", scriptPath, "-map", "[out]"]).concat(hasAudio ? ["-map", nIn + ":a", "-c:a", "aac", "-b:a", "192k"] : []).concat(venc).concat(["-r", String(fps), "-t", String(o.durationSec), "-movflags", "+faststart", o.out]);
        fs.mkdirSync(path.dirname(o.out), { recursive: true });
        var ff = spawn(FF.CFG.ffmpeg, args, { windowsHide: true }), ffErr = ""; ff.stderr.on("data", function (d) { ffErr = (ffErr + d.toString()).slice(-2000); });
        var ffClosed = new Promise(function (res, rej) { ff.on("close", function (code) { try { fs.unlinkSync(scriptPath); } catch (e) {} code === 0 ? res() : rej(new Error("ffmpeg exited " + code + ": " + ffErr.split("\n").slice(-3).join(" | "))); }); ff.on("error", rej); }); ffClosed.catch(function () {});
        var t0 = Date.now(), chain = Promise.resolve();
        function write(buf) { return new Promise(function (res) { if (!ff.stdin.write(buf)) ff.stdin.once("drain", res); else res(); }); }
        for (var f = 0; f < N; f++) (function (f) {
            chain = chain.then(function () {
                if (o.abort && o.abort.aborted) throw new Error("killed");
                var t = f / fps; if (isStill) drawStillFrame(ctx, scene, t, FW, FH); else drawMapFrame(ctx, scene, scene.mips, bg, t, FW, FH, fontLabel);
                var raw = canvas.data();                                       // straight RGBA; ffmpeg takes it as-is (no JS repack)
                if (f % Math.max(1, Math.round(fps * 5)) === 0 && f) onStep("frame " + f + "/" + N + " · " + Math.round(f / ((Date.now() - t0) / 1000)) + " fps");
                return write(raw);
            });
        })(f);
        return chain.then(function () { ff.stdin.end(); return ffClosed; }, function (e) { try { ff.stdin.destroy(); ff.kill("SIGKILL"); } catch (e2) {} try { fs.unlinkSync(o.out); } catch (e3) {} throw e; })
            .then(function () { return { out: o.out, frames: N, chrome: "none", gpu: "native (Skia + ffmpeg" + (o.encoder === "nvenc" ? " NVENC" : "") + ")", capture: "native", encoder: o.encoder === "nvenc" ? "h264_nvenc" : "libx264", seconds: (Date.now() - t0) / 1000 }; });
    });
}
/* how much of the route is drawn at time t: leg by leg, each leg eased (foam) between its two pins' times */
function routeVisible(r0, t) { var vis = 0; r0.segs.forEach(function (sg) { if (t >= sg.t1) vis = sg.L1; else if (t > sg.t0) vis = sg.L0 + (sg.L1 - sg.L0) * CAM.easeFoam((t - sg.t0) / Math.max(0.05, sg.t1 - sg.t0)); }); return vis; }
function routePoint(r0, vis) { var p = r0.poly; for (var i = 1; i < p.length; i++) { if (r0.lens[i] >= vis) { var f = (vis - r0.lens[i - 1]) / Math.max(1e-6, r0.lens[i] - r0.lens[i - 1]); return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * f, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * f]; } } return p[p.length - 1]; }
var maskCache = {};
function radialMask(K, dir, name, start, gamma) {                              // black = sharp, white = blurred; start = where (0..1 of the half-diagonal) the blur begins
    var key = name + "_" + start + "_" + gamma; if (maskCache[key] && fs.existsSync(maskCache[key])) return maskCache[key];
    var c = K.createCanvas(W, H), x = c.getContext("2d"), R = Math.hypot(W / 2, H / 2), g = x.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, R);
    g.addColorStop(0, "#000"); g.addColorStop(Math.max(0, Math.min(0.98, start)), "#000");
    for (var i = 1; i <= 8; i++) { var u = start + (1 - start) * i / 8, v = Math.round(255 * Math.pow(i / 8, gamma)); g.addColorStop(Math.min(1, u), "rgb(" + v + "," + v + "," + v + ")"); }
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    maskCache[key] = path.join(dir, "ruvi_mask_" + name + ".png"); fs.writeFileSync(maskCache[key], c.toBuffer("image/png")); return maskCache[key];
}
function macroMasks(K, dir, M) { return { edge: radialMask(K, dir, "edge", M.edgeStart, 1.2), corner: radialMask(K, dir, "corner", M.cornerStart, 1.6) }; }
/* ---- AI sections: one still, a slow push and a pan in one of 8 directions, drawn by Skia with sub-pixel transforms (no zoompan stepping) ----
   Any image size/aspect: the still is scaled to COVER the frame (never stretched), enlarged by `zoom` (1.10) so there is room to move,
   and the frame-sized window glides across that room from one side to the other along the PAN direction while the scale drifts by `zoomDrift`. */
var PAN_DIR = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0], NE: [0.7071, -0.7071], NW: [-0.7071, -0.7071], SE: [0.7071, 0.7071], SW: [-0.7071, 0.7071] };
function renderAiNative(o) {
    var K = skia(), fps = o.fps || 60, N = Math.max(2, Math.round(o.durationSec * fps)), onStep = o.onStep || function () {};
    var dir = PAN_DIR[String(o.pan || "E").toUpperCase()] || PAN_DIR.E, zoom = o.zoom || 1.10, drift = o.zoomDrift != null ? o.zoomDrift : 0.05, zoomIn = (o.zoomIn != null) ? !!o.zoomIn : true;
    var canvas = K.createCanvas(W, H), ctx = canvas.getContext("2d");
    return K.loadImage(o.imagePath).then(function (img) {
        var iw = img.width, ih = img.height, cover = Math.max(W / iw, H / ih), mips = buildMips(K, img);
        onStep("ai scene ready (" + iw + "x" + ih + ", pan " + (o.pan || "E") + ", " + N + " frames @ " + fps + " fps, Skia → " + (o.encoder === "nvenc" ? "NVENC" : "x264") + ")");
        var fade = (o.fadeSec != null) ? Math.min(+o.fadeSec, o.durationSec / 3) : 0;
        var graph = "[0:v]format=yuv420p" + (fade > 0 ? ",fade=t=in:st=0:d=" + fade.toFixed(3) + ",fade=t=out:st=" + Math.max(0, o.durationSec - fade).toFixed(3) + ":d=" + fade.toFixed(3) : "") + "[out]";
        var scriptPath = path.join(o.tmpDir || os.tmpdir(), "ruvi_ai_" + process.pid + "_" + Date.now() + ".txt"); fs.writeFileSync(scriptPath, graph);
        var venc = (o.encoder === "nvenc") ? ["-c:v", "h264_nvenc", "-preset", o.nvencPreset || "p5", "-tune", "hq", "-rc", "vbr", "-cq", String(o.nvencCq != null ? o.nvencCq : 19), "-b:v", "0", "-maxrate", "60M", "-bufsize", "120M", "-spatial-aq", "1", "-temporal-aq", "1", "-profile:v", "high", "-level", "4.2", "-g", String(fps * 2), "-bf", "3"]
            : ["-c:v", "libx264", "-preset", o.preset || "medium", "-crf", String(o.crf != null ? o.crf : 18), "-tune", "film", "-profile:v", "high", "-level", "4.2", "-g", String(fps * 2)];
        var args = ["-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", W + "x" + H, "-r", String(fps), "-i", "-", "-filter_complex_script", scriptPath, "-map", "[out]"].concat(venc).concat(["-r", String(fps), "-t", String(o.durationSec), "-movflags", "+faststart", o.out]);
        fs.mkdirSync(path.dirname(o.out), { recursive: true });
        var ff = spawn(FF.CFG.ffmpeg, args, { windowsHide: true }), ffErr = ""; ff.stderr.on("data", function (d) { ffErr = (ffErr + d.toString()).slice(-2000); });
        var ffClosed = new Promise(function (res, rej) { ff.on("close", function (code) { try { fs.unlinkSync(scriptPath); } catch (e) {} code === 0 ? res() : rej(new Error("ffmpeg exited " + code + ": " + ffErr.split("\n").slice(-3).join(" | "))); }); ff.on("error", rej); }); ffClosed.catch(function () {});
        function write(buf) { return new Promise(function (res) { if (!ff.stdin.write(buf)) ff.stdin.once("drain", res); else res(); }); }
        var t0 = Date.now(), chain = Promise.resolve();
        for (var f = 0; f < N; f++) (function (f) {
            chain = chain.then(function () {
                if (o.abort && o.abort.aborted) throw new Error("killed");
                var u = N > 1 ? f / (N - 1) : 0, e = CAM.easeFoam(u);                                       // ease in / out of the glide (foam)
                var z = zoomIn ? (zoom + drift * e) : (zoom + drift - drift * e), s = cover * z, dw = iw * s, dh = ih * s;
                var roomX = Math.max(0, (dw - W) / 2), roomY = Math.max(0, (dh - H) / 2), travel = Math.min(roomX / (Math.abs(dir[0]) || 1e9), roomY / (Math.abs(dir[1]) || 1e9), Math.max(roomX, roomY)) * 0.92;
                var cx = W / 2 - dir[0] * travel * (2 * e - 1), cy = H / 2 - dir[1] * travel * (2 * e - 1);       // the window glides from one side of the room to the other
                ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
                var mip = pickMip(mips, s); ctx.drawImage(mip.img, 0, 0, mip.img.width, mip.img.height, cx - dw / 2, cy - dh / 2, dw, dh);
                if (f % Math.max(1, Math.round(fps * 5)) === 0 && f) onStep("frame " + f + "/" + N + " · " + Math.round(f / ((Date.now() - t0) / 1000)) + " fps");
                return write(canvas.data());
            });
        })(f);
        return chain.then(function () { ff.stdin.end(); return ffClosed; }, function (e) { try { ff.stdin.destroy(); ff.kill("SIGKILL"); } catch (e2) {} try { fs.unlinkSync(o.out); } catch (e3) {} throw e; })
            .then(function () { return { out: o.out, frames: N, chrome: "none", gpu: "native (Skia AI pan" + (o.encoder === "nvenc" ? " + NVENC" : "") + ")", capture: "native", encoder: o.encoder === "nvenc" ? "h264_nvenc" : "libx264", seconds: (Date.now() - t0) / 1000 }; });
    });
}
module.exports = { renderSectionNative: renderSectionNative, renderAiNative: renderAiNative, perspectiveFilter: perspectiveFilter, mapAngles: mapAngles, PAN_DIR: PAN_DIR };
