/* lib/render/camera.js — the camera and pose maths of scene.html, shared by the Chrome renderer and the
   native (Skia) renderer. Pure functions; copied verbatim from scene.html's script (keep them in step). */
"use strict";
var W = 1920, H = 1080, PERSPECTIVE = 2200;   // the camera's perspective distance (CSS px); smaller = stronger lean
  var CFG = { // mirrors the After Effects engine's CONFIG (only what renders)
    pinRadius: 4, pinColor: "#d92121", pinStroke: "#000", pinStrokeW: 1.5, needleColor: "#3d3d45",
    clusterFrac: 0.02, clusterStackX: 46, clusterStackGap: 1.55, camClusterZoom: 0.16, camLabelAllow: 70, camMinMove: 1.0,
    labelFontSize: 11, labelClusterX: 54, leaderColor: "rgba(26,26,26,.72)", leaderWidth: 1.2,
    appearDuration: 0.5, appearLead: 0.3, popOvershoot: 1.07,
    routeColor: "#000", routeWidth: 1, routeCasingWidth: 2, routeDash: 3, routeGap: 5,
    hlColor: "rgba(255,199,64,1)", hlRadius: 12, hlGlowOpacity: 0.5, hlRingW: 1, hlPulseMax: 1.85, hlPulsePeriod: 1.6,
    routeCasing: false,   // the translucent casing under the route line (off: just the dashed ink line)
    hlStyle: "ink", hlInk: "rgba(112,26,26,0.92)", hlInkFill: "rgba(190,60,40,0.10)", hlInkW: 1.5, hlTraceDur: 0.7, hlInkRadius: 16,   // "ink": a hand-drawn ink circle (or the traced shape) drawn on around the place; "glow": the old gold ring
    camZoomEnd: 0.21, camPinSafe: 0.74, startRevealMinLead: 0.4, startRevealRate: 0.06, startRevealMinFrac: 0.15, rushZoomSens: 0.5,   // the opening approach: any lead ≥ 0.4 s gets one eased move onto the first pin (rate × lead, at least 15 % of the view, at most 38 % of the sheet)
    panMaxScreenSpeed: 0.55, panLateMax: 1.0,   // between places: one eased pan at constant zoom, leaving at the pin's time; peak speed ≤ 0.55 screen widths/s, else the camera arrives up to 1 s late
    idleZoomAfter: 5.0, idleZoomPct: 2.5, idleZoomMax: 2.2,
    camTiltX: 17, camRotXAmp: 6, camRotXFreq: 0.045, camRotYAmp: 5, camRotYFreq: 0.070, camRotZAmp: 4, camRotZFreq: 0.060, camEnergy: 1
  };
  /* ---------- keyframe interpolation (AE easy-ease / flow ≈ smoothstep between keys) ---------- */
  function easeFoam(u) { return u * u * u * (u * (u * 6 - 15) + 10); }   // quintic smootherstep: starts and stops like foam settling, no kink anywhere (AE easy-ease, stronger)
  function interp(keys, t, linearFirst) {
    if (!keys.length) return null; if (t <= keys[0].t) return keys[0].v.slice(); if (t >= keys[keys.length - 1].t) return keys[keys.length - 1].v.slice();
    for (var i = 1; i < keys.length; i++) if (t <= keys[i].t) {
      var a = keys[i - 1], b = keys[i], u = (t - a.t) / Math.max(1e-6, b.t - a.t);
      var e = (linearFirst && i === 1) ? (1 - Math.pow(1 - u, 2)) : easeFoam(u);               // opening travel: ease-out only (already at cruise speed)
      var v = []; for (var k = 0; k < a.v.length; k++) v.push(a.v[k] + (b.v[k] - a.v[k]) * e); return v;
    }
    return keys[keys.length - 1].v.slice();
  }


  /* planCamera(pts, locs, mapDiag, fit, MW, MH, S, dur) — S = { mapX, mapY, sizef }; returns { pos, sc, linearFirst } */
  /* the travel camera — ported from buildAutoCamera (comp-space maths) */
  function planCamera(pts, locs, mapDiag, fit, MW, MH, S, dur) {
    var compW = W, compH = H, mapL = S.mapX, mapR = S.mapX + MW * fit, mapT = S.mapY, mapB = S.mapY + MH * fit, sf = S.sizef;
    var mapFit = Math.max((mapR - mapL) / compW, (mapB - mapT) / compH), capWide = mapFit * 1.10;
    var idleCap = Math.min(CFG.camZoomEnd * CFG.idleZoomMax, capWide); if (idleCap < CFG.camZoomEnd) idleCap = CFG.camZoomEnd;
    var ts = locs.map(function (l) { return (l.timeMs || 0) / 1000; }), tEnd = dur;
    if (!pts.length) return { pos: [{ t: 0, v: [compW / 2, compH / 2] }], sc: [{ t: 0, v: [mapFit] }], linearFirst: false };
    var CR = CFG.clusterFrac * mapDiag, midX = (mapL + mapR) / 2, cof = pts.map(function () { return -1; }), cmem = [];
    pts.forEach(function (p, a) { if (cof[a] >= 0) return; var gid = cmem.length; cof[a] = gid; var mm = [a]; for (var b = a + 1; b < pts.length; b++) { if (cof[b] >= 0) continue; if (Math.hypot(pts[b][0] - p[0], pts[b][1] - p[1]) <= CR) { cof[b] = gid; mm.push(b); } } cmem.push(mm); });
    var sCx = [], sCy = [], sZ = [], sT = [];
    cmem.forEach(function (mm) {
      var mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9, t0g = 1e18; mm.forEach(function (q) { var P = pts[q]; mnx = Math.min(mnx, P[0]); mxx = Math.max(mxx, P[0]); mny = Math.min(mny, P[1]); mxy = Math.max(mxy, P[1]); t0g = Math.min(t0g, ts[q]); });
      var pcx = (mnx + mxx) / 2, pcy = (mny + mxy) / 2, cxg, cyg, zg;
      if (mm.length >= 2) { var side = (pcx < midX) ? -1 : 1, hwl = CFG.camLabelAllow * sf / 2, lblCx = pcx + side * CFG.clusterStackX * sf, stackH = mm.length * CFG.labelFontSize * CFG.clusterStackGap * sf;
        var fLx = Math.min(mnx, lblCx - hwl), fRx = Math.max(mxx, lblCx + hwl), fTy = Math.min(mny, pcy - stackH / 2 - CFG.labelFontSize * sf), fBy = Math.max(mxy, pcy + stackH / 2 + CFG.labelFontSize * sf);
        cxg = (fLx + fRx) / 2; cyg = (fTy + fBy) / 2; zg = Math.max((fRx - fLx) / (compW * CFG.camPinSafe), (fBy - fTy) / (compH * CFG.camPinSafe)); if (zg < CFG.camClusterZoom) zg = CFG.camClusterZoom; if (zg > capWide) zg = capWide; }
      else { cxg = pcx; cyg = pcy; zg = CFG.camZoomEnd; var vpad = CFG.labelFontSize * 2.4 * sf, zNeed = vpad * 2 / (compH * CFG.camPinSafe); if (zNeed > zg) zg = zNeed; if (zg > capWide) zg = capWide; }
      sCx.push(cxg); sCy.push(cyg); sZ.push(zg); sT.push(t0g);
    });
    var ord = sT.map(function (t, i) { return i; }).sort(function (p, q) { return sT[p] - sT[q]; }), G = ord.length;
    var sens = CFG.rushZoomSens, rushThr = (sens <= 0.02) ? 1e9 : ((1.05 - sens) * 0.09 + 0.008);
    var pos = [], sc = [];
    function keyP(t, C, z) { var Q = clampView(C, z != null ? z : CFG.camZoomEnd, S, MW, MH, fit, false); pos.push({ t: t, v: [Q[0], Q[1]] }); } function keyS(t, z) { sc.push({ t: t, v: [z] }); }
    var f0 = ord[0], t1 = sT[f0]; if (t1 < 0.08) t1 = 0.08; var lead = t1, revealOn = false;
    if (lead >= CFG.startRevealMinLead) {
      var ax, ay, al; if (G > 1) { ax = sCx[f0] - sCx[ord[1]]; ay = sCy[f0] - sCy[ord[1]]; al = Math.hypot(ax, ay); if (al < 0.5) { ax = 1; ay = -0.55; al = Math.hypot(ax, ay); } }
      else { ax = (mapL + mapR) / 2 - sCx[f0]; ay = (mapT + mapB) / 2 - sCy[f0]; al = Math.hypot(ax, ay); if (al < mapDiag * 0.04) { ax = 1; ay = -0.55; al = Math.hypot(ax, ay); } }
      // the opening: the camera is always on its way to the first place — one eased approach filling the whole lead (frame 0 → first pin)
      // from a point up the sheet in the direction away from the next place (or towards the map centre); never stagnant at the open
      var ux = ax / al, uy = ay / al, viewW = compW * sZ[f0], d0 = CFG.startRevealRate * viewW * lead, dMax = mapDiag * 0.38; if (d0 > dMax) d0 = dMax; var dMin = viewW * CFG.startRevealMinFrac; if (d0 < dMin) d0 = dMin;
      var P0 = [sCx[f0], sCy[f0]], cands = [[ux, uy], [-uy, ux], [uy, -ux]]; var mc = [(mapL + mapR) / 2 - P0[0], (mapT + mapB) / 2 - P0[1]], ml = Math.hypot(mc[0], mc[1]) || 1; cands.push([mc[0] / ml, mc[1] / ml]);
      var best = null, bestD = -1; cands.forEach(function (u) { var Q = clampView([P0[0] + u[0] * d0, P0[1] + u[1] * d0], sZ[f0], S, MW, MH, fit, false), dd = Math.hypot(Q[0] - P0[0], Q[1] - P0[1]); if (dd > bestD) { bestD = dd; best = Q; } });
      if (bestD < 2) best = P0;
      keyP(0, best, sZ[f0]); keyS(0, sZ[f0]); keyP(t1, P0, sZ[f0]); keyS(t1, sZ[f0]); revealOn = false;             // ease in at frame 0, ease out onto the pin
    } else { keyP(t1, [sCx[f0], sCy[f0]], sZ[f0]); keyS(t1, sZ[f0]); }
    var tArr = [t1], prevT = t1;
    for (var gA = 1; gA < G; gA++) { var tA = sT[ord[gA]]; if (tA < prevT + CFG.camMinMove) tA = prevT + CFG.camMinMove; if (tA > tEnd) tA = tEnd; tArr.push(tA); prevT = tA; }
    var idleFrom = tArr[G - 1];
    // between places: leave at the pin's time, arrive at the next pin's time, one smooth (easy-ease) pan at constant zoom — the AE keyframes.
    // when that would be too fast the arrival slips (never the departure), up to panLateMax seconds; the next move then starts from the late arrival.
    var arrive = tArr.slice(), legs = [];
    for (var gH = 1; gH < G; gH++) {
      var aI = ord[gH - 1], bI = ord[gH], tA = arrive[gH - 1], tB = tArr[gH], zA = sZ[aI], zB = sZ[bI];
      var dist = Math.hypot(sCx[bI] - sCx[aI], sCy[bI] - sCy[aI]), zMove = Math.max(zA, zB), vMax = CFG.panMaxScreenSpeed * compW * zMove;   // comp px/s at this zoom
      var tNeed = vMax > 0 ? 1.5 * dist / vMax : 0;                                                                  // a smoothstep peaks at 1.5x its average speed
      var gap = Math.max(0.05, tB - tA), late = Math.max(0, Math.min(CFG.panLateMax, tNeed - gap));
      var tArrive = tB + late; if (gH + 1 < G && tArrive > tArr[gH + 1] - 0.2) tArrive = Math.max(tB, tArr[gH + 1] - 0.2); if (tArrive > tEnd) tArrive = tEnd;
      arrive[gH] = tArrive; legs.push({ a: aI, b: bI, t0: tA, t1: tArrive });
      keyP(tA, [sCx[aI], sCy[aI]], zA); keyS(tA, zA); keyP(tArrive, [sCx[bI], sCy[bI]], zB); keyS(tArrive, zB);
    }
    idleFrom = arrive[G - 1];
    var park = tEnd - tArr[G - 1];
    if (park > CFG.idleZoomAfter) { var grow = tEnd - idleFrom; if (grow > 0.5) { var zPark = sZ[ord[G - 1]] * (1 + (CFG.idleZoomPct / 100) * grow); if (zPark > idleCap) zPark = idleCap; if (zPark > sZ[ord[G - 1]] + 0.002) keyS(tEnd, zPark); } }
    pos.sort(function (a, b) { return a.t - b.t; }); sc.sort(function (a, b) { return a.t - b.t; });
    var pinArrive = pts.map(function (p, i) { var g = cof[i], k = ord.indexOf(g); return k >= 0 && typeof arrive !== "undefined" && arrive[k] != null ? arrive[k] : (k >= 0 ? tArr[k] : ts[i]); });
    return { legs: legs, pos: pos, sc: sc, linearFirst: revealOn, pinArrive: pinArrive };
  }

  var SC = { cardW: 2752, cardH: 1534, cardFontSize: 300, cardFontMin: 150, cardTextY: 0.45, cardMargin: 0.05, cardGap: 0.03, portraitH_cut: 0.93, portraitH_frame: 0.82, portraitX: 0.75, portraitMaxW: 0.48, frameTilt: 3, frameMat: 0.011, zoomMin: 2.2, zoomMax: 3.8, tiltX: [25, 40], tiltY: [0, 22], tiltZ: [12, 24], landAt: 3.0, landScale: 0.6, flyScale: 1.35, tallAspect: 1.0 };
  function srand(seed) { var s = (seed * 9301 + 49297) % 233280; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  function rng(r, a, b) { return a + (b - a) * r(); }
  function poseKeys(w, h, F, move, energy, seed, entrySide, dur) {
    var r = srand(seed * 7 + 13), en = energy > 0 ? energy : 1, cx = w / 2, cy = h / 2, sCover = Math.max(W / w, H / h), tEnd = Math.max(0.02, dur - 1 / 60);
    function centredOn(s) { var px = W / 2 - (F[0] - cx) * s, py = H / 2 - (F[1] - cy) * s, hw = w * s / 2, hh = h * s / 2, xmin = W - hw, xmax = hw, ymin = H - hh, ymax = hh; if (xmin > xmax) px = W / 2; else px = Math.max(xmin, Math.min(xmax, px)); if (ymin > ymax) py = H / 2; else py = Math.max(ymin, Math.min(ymax, py)); return [px, py]; }
    var tiltX = -rng(r, SC.tiltX[0], SC.tiltX[1]) * en, tiltY = rng(r, SC.tiltY[0], SC.tiltY[1]) * en * (r() < 0.5 ? -1 : 1), tiltZ = rng(r, SC.tiltZ[0], SC.tiltZ[1]) * en * (r() < 0.5 ? -1 : 1);
    var pos = [], sc = [], ori = [];
    if (move === "flyin_push") { var sContain = Math.min(W / w, H / h), sLand = sContain * SC.landScale, s0 = sLand * SC.flyScale, tLand = Math.min(SC.landAt, Math.max(0.6, dur * 0.15)), x0 = entrySide === "left" ? -(w * s0 / 2) - 40 : W + (w * s0 / 2) + 40, y0 = H / 2 + rng(r, -200, 300);
      pos.push({ t: 0, v: [x0, y0] }, { t: tLand, v: [W / 2, H / 2] }, { t: tEnd, v: centredOn(sCover) }); sc.push({ t: 0, v: [s0] }, { t: tLand, v: [sLand] }, { t: tEnd, v: [sCover] }); ori.push({ t: 0, v: [tiltX * 0.6, tiltY, tiltZ] }, { t: tLand, v: [0, 0, 0] }, { t: tEnd, v: [0, 0, 0] }); }
    else { var Z = 1 + (rng(r, SC.zoomMin, SC.zoomMax) - 1) * en, sStart = sCover * Z; pos.push({ t: 0, v: [W / 2 - (F[0] - cx) * sStart, H / 2 - (F[1] - cy) * sStart] }, { t: tEnd, v: [W / 2, H / 2] }); sc.push({ t: 0, v: [sStart] }, { t: tEnd, v: [sCover] }); ori.push({ t: 0, v: [tiltX, tiltY, tiltZ] }, { t: tEnd, v: [0, 0, 0] }); }
    return { pos: pos, sc: sc, ori: ori };
  }

/* an ink-drawn outline: the traced shape when the location has one, else a slightly irregular circle */
function inkPath(loc, p, sf, MW, MH, fit, mapX, mapY) {
    var pts = [];
    var shape = (loc.shapeNorm && loc.shapeNorm.length >= 3) ? loc.shapeNorm.map(function (v) { return [mapX + v[0] * MW * fit, mapY + v[1] * MH * fit]; })
              : (loc.shape && loc.shape.length >= 3) ? loc.shape.map(function (v) { return [mapX + v[0] * fit, mapY + v[1] * fit]; }) : null;
    if (shape) { // resample the polygon so the reveal runs evenly, and give it a faint hand wobble
        var n = 72, per = [], tot = 0; for (var i = 0; i < shape.length; i++) { var a = shape[i], b = shape[(i + 1) % shape.length]; var L = Math.hypot(b[0] - a[0], b[1] - a[1]); per.push(L); tot += L; }
        var seed = 7; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 - 0.5; }
        var acc = 0, k = 0; for (var s2 = 0; s2 < n; s2++) { var d = tot * s2 / n; while (k < shape.length - 1 && acc + per[k] < d) { acc += per[k]; k++; } var a2 = shape[k], b2 = shape[(k + 1) % shape.length], u = per[k] ? (d - acc) / per[k] : 0; pts.push([a2[0] + (b2[0] - a2[0]) * u + rnd() * 0.6 * sf, a2[1] + (b2[1] - a2[1]) * u + rnd() * 0.6 * sf]); }
        return pts;
    }
    var r = CFG.hlInkRadius * sf, seed2 = 11; function rnd2() { seed2 = (seed2 * 9301 + 49297) % 233280; return seed2 / 233280 - 0.5; }
    var n2 = 48, wob = []; for (var w = 0; w < 6; w++) wob.push(rnd2() * 0.12);
    for (var q = 0; q < n2; q++) { var ang = -Math.PI * 0.62 + Math.PI * 2 * q / n2, rr = r * (1 + wob[q % 6] * 0.5 + wob[(q + 1) % 6] * 0.5 + Math.sin(ang * 3) * 0.03); pts.push([p[0] + Math.cos(ang) * rr * 1.08, p[1] + Math.sin(ang) * rr * 0.92]); }
    return pts;
}
/* keep the framed rectangle on the sheet: when the view is smaller than the map in a dimension, the centre stays inside; when it is larger, the sheet is centred */
function clampView(C, z, S, MW, MH, fit, soft) {
    var hw = W * z / 2, hh = H * z / 2, L = S.mapX, R = S.mapX + MW * fit, T = S.mapY, B = S.mapY + MH * fit, x = C[0], y = C[1];
    if (R - L >= 2 * hw) x = Math.max(L + hw, Math.min(R - hw, x)); else if (!soft) x = (L + R) / 2;
    if (B - T >= 2 * hh) y = Math.max(T + hh, Math.min(B - hh, y)); else if (!soft) y = (T + B) / 2;
    return [x, y];
}
module.exports = { easeFoam: easeFoam, clampView: clampView, inkPath: inkPath, PERSPECTIVE: PERSPECTIVE, CFG: CFG, SC: SC, W: W, H: H, interp: interp, planCamera: planCamera, poseKeys: poseKeys, srand: srand, rng: rng };
