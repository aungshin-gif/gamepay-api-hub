// Start page extras: the GamePay "brain cell" network picture, count-up stats and featured model cards.
// Self-contained on purpose (no gateway calls, no keys). Settings come from config.js: NET_NODES, FEATURED_MODELS, START_MODELS, PRICES.
(function () {
  "use strict";
  var cfg = window.GPH_CONFIG || {};
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function onStart() { return document.body.getAttribute("data-tab") === "start"; }

  // ---------- the "brain cell": a glass neuron (soma + glowing nucleus + orbit rings) whose branches reach the provider logos ----------
  // Everything is real 3D (rotate, tilt, perspective) drawn on one canvas; the logos are DOM nodes placed at the branch tips.
  function initNet() {
    var box = $("net"), cv = $("netCv"), holder = $("netNodes"); if (!box || !cv || !holder) return;
    var ctx = cv.getContext("2d"), logos = cfg.NET_NODES || [], DECOR = 8, total = logos.length + DECOR, w = 0, h = 0, dpr = 1, raf = 0, running = false, visible = true, lastT = 0;
    function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function nrm(v) { var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
    function crs(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
    function add(a, b, k) { return [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k]; }
    function lerp(a, b, u) { return a + (b - a) * u; }
    function mix(c0, c1, u) { return [lerp(c0[0], c1[0], u), lerp(c0[1], c1[1], u), lerp(c0[2], c1[2], u)]; }
    var BLUE = [77, 107, 254], VIOLET = [139, 108, 240], TEAL = [45, 212, 191];
    function ramp(u) { return u < 0.55 ? mix(BLUE, VIOLET, u / 0.55) : mix(VIOLET, TEAL, (u - 0.55) / 0.45); }
    var R = rng(11), SR = 0.27, N = 14, RN = 48, gold = Math.PI * (3 - Math.sqrt(5)), logoAt = {}, nodes = [], dust = [], organelles = [], bumps = [], rings = [];
    for (var i = 0; i < total; i++) {
      var fixed = i < logos.length, j = i - logos.length, y = 1 - (j + 0.5) * 2 / DECOR, rr = Math.sqrt(1 - y * y), th = j * gold, l = fixed ? logos[i] : null, phi = -Math.PI / 2 + i * 6.2832 / Math.max(1, logos.length);
      var d = fixed ? [Math.cos(phi), Math.sin(phi), 0] : [Math.cos(th) * rr, y, Math.sin(th) * rr], de;
      if (l) { de = el("span", "nn"); var im = document.createElement("img"); im.src = l.logo; im.alt = ""; im.height = 24; im.addEventListener("error", function () { this.hidden = true; }); de.appendChild(im); if (l.name) de.title = l.name; }
      else de = el("span", "nd");
      holder.appendChild(de);
      // one branch: a cubic curve from the soma surface to the node, bent a little so it looks grown, not drawn
      var up = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], u1 = nrm(crs(d, up)), u2 = crs(d, u1), k1 = fixed ? (i % 2 ? 0.2 : -0.2) : R() - 0.5, k2 = fixed ? 0.1 : R() - 0.5;
      var p0 = [d[0] * SR, d[1] * SR, d[2] * SR], p3 = [d[0] * 0.97, d[1] * 0.97, d[2] * 0.97];
      var p1 = add(add([d[0] * 0.47, d[1] * 0.47, d[2] * 0.47], u1, k1 * 0.55), u2, k2 * 0.35), p2 = add(add([d[0] * 0.74, d[1] * 0.74, d[2] * 0.74], u1, -k1 * 0.4), u2, k2 * 0.5), pts = [];
      for (var s = 0; s <= N; s++) { var u = s / N, v = 1 - u; pts.push([v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1], v * v * v * p0[2] + 3 * v * v * u * p1[2] + 3 * v * u * u * p2[2] + u * u * u * p3[2]]); }
      var twigs = []; [0.4, 0.72].forEach(function (tt, q) {
        var ix = Math.round(tt * N), a0 = pts[ix], tg = nrm([pts[ix + 1][0] - pts[ix - 1][0], pts[ix + 1][1] - pts[ix - 1][1], pts[ix + 1][2] - pts[ix - 1][2]]), sd = nrm(crs(tg, [R() - 0.5, R() - 0.5, R() - 0.5])), sg = (q + i) % 2 ? 1 : -1, ln = 0.1 + R() * 0.07;
        var m = add(add(a0, tg, 0.05), sd, 0.04 * sg), e = add(add(a0, tg, 0.075), sd, ln * sg), tp = [];
        for (var s2 = 0; s2 <= 6; s2++) { var uu = s2 / 6, vv = 1 - uu; tp.push([vv * vv * a0[0] + 2 * vv * uu * m[0] + uu * uu * e[0], vv * vv * a0[1] + 2 * vv * uu * m[1] + uu * uu * e[1], vv * vv * a0[2] + 2 * vv * uu * m[2] + uu * uu * e[2]]); }
        twigs.push(tp);
      });
      nodes.push({ pts: pts, twigs: twigs, el: de, big: !!l, fixed: fixed, g: null, ph: i * 0.137 + R() * 0.2, flash: 0, sx: 0, sy: 0, dz: 0, bz: 0 });
    }
    for (var q = 0; q < 20; q++) { var dd = nrm([R() - 0.5, R() - 0.5, R() - 0.5]), rd = 0.35 + R() * 0.85; dust.push({ p: [dd[0] * rd, dd[1] * rd, dd[2] * rd], s: 0.8 + R() * 1.4, ph: R() * 6.28 }); }
    for (var q2 = 0; q2 < 14; q2++) { var d2 = nrm([R() - 0.5, R() - 0.5, R() - 0.5]), r2 = SR * (0.2 + R() * 0.62); organelles.push({ p: [d2[0] * r2, d2[1] * r2, d2[2] * r2], s: 0.8 + R() * 1.6 }); }
    for (var q3 = 0; q3 < 11; q3++) { var d3 = nrm([R() - 0.5, R() - 0.5, R() - 0.5]); bumps.push({ p: [d3[0] * SR, d3[1] * SR, d3[2] * SR], s: 0.05 + R() * 0.05 }); }
    [[1.15, 0, 0.42], [0.5, 0.95, 0.5]].forEach(function (o) { // two orbit rings round the soma, tilted differently
      var pr = [], c1 = Math.cos(o[0]), s1 = Math.sin(o[0]), c2 = Math.cos(o[1]), s2b = Math.sin(o[1]);
      for (var s3 = 0; s3 <= RN; s3++) { var an = s3 / RN * 6.2832, x = Math.cos(an) * o[2], z = Math.sin(an) * o[2], y1 = -z * s1, z1 = z * c1, x2 = x * c2 - y1 * s2b, y2 = x * s2b + y1 * c2; pr.push([x2, y2, z1]); }
      rings.push({ pts: pr, bead: R() * 6.28 });
    });

    (function () { var tr = []; for (var s4 = 0; s4 <= RN; s4++) { var a4 = s4 / RN * 6.2832; tr.push([Math.cos(a4) * 0.97, Math.sin(a4) * 0.97, 0]); } rings.push({ pts: tr, g: null, orbit: true, bead: 0 }); })();
    function size() { w = box.clientWidth; h = box.clientHeight; dpr = Math.min(window.devicePixelRatio || 1, 1.25); cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + "px"; cv.style.height = h + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    var cx, cy, rx, ry, r0, G0 = { ca: 1, sa: 0, ct: 1, st: 0 }, G1 = { cz: 1, sz: 0, ca: 1, sa: 0, ct: 1, st: 0 };
    function P(p, g) { g = g || G0; var px = p[0], py = p[1]; if (g.cz !== undefined) { px = p[0] * g.cz - p[1] * g.sz; py = p[0] * g.sz + p[1] * g.cz; } var x1 = px * g.ca + p[2] * g.sa, z1 = -px * g.sa + p[2] * g.ca, y2 = py * g.ct - z1 * g.st, z2 = py * g.st + z1 * g.ct, s = 1 / (1 - z2 * 0.28); return [cx + x1 * rx * s, cy + y2 * ry * s, z2, s]; }
    function rgba(c, a) { return "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + "," + a.toFixed(3) + ")"; }
    var sprites = {};
    function sprite(c) { var k = (Math.round(c[0] / 16) * 16) + "," + (Math.round(c[1] / 16) * 16) + "," + (Math.round(c[2] / 16) * 16); if (sprites[k]) return sprites[k]; var s = document.createElement("canvas"); s.width = s.height = 64; var g = s.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(" + k + ",1)"); gr.addColorStop(1, "rgba(" + k + ",0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); sprites[k] = s; return s; }
    function glowDot(x, y, r, c, a) { ctx.globalAlpha = Math.max(0, Math.min(1, a)); ctx.drawImage(sprite(c), x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1; }
    var BG = [236, 241, 255];
    function strokeSeg(a, b, u, wd, al, front) {
      var c = mix(BG, front ? mix(ramp(u), [255, 255, 255], 0.1) : ramp(u), Math.min(1, al));
      ctx.lineCap = "round"; ctx.strokeStyle = "rgb(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + ")"; ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    function branchPass(n, pr, front) {
      ctx.lineCap = "round"; ctx.strokeStyle = "rgba(124,108,240,.10)"; ctx.lineWidth = (n.big ? 11 : 7) * pr[N][3]; ctx.beginPath(); // soft glow: one stroke, so it never double-darkens
      for (var g = 0; g < pr.length - 1; g++) { if (((pr[g][2] + pr[g + 1][2]) / 2 >= 0) === front) { ctx.moveTo(pr[g][0], pr[g][1]); ctx.lineTo(pr[g + 1][0], pr[g + 1][1]); } }
      ctx.stroke();
      for (var s = 0; s < pr.length - 1; s++) {
        var a = pr[s], b = pr[s + 1], zm = (a[2] + b[2]) / 2; if ((zm >= 0) !== front) continue;
        var u = s / N, dz = (zm + 1) / 2, wd = lerp(n.big ? 4.2 : 3, n.big ? 1.3 : 1, u) * (0.55 + 0.6 * dz) * ((a[3] + b[3]) / 2);
        strokeSeg(a, b, u, wd, 0.2 + 0.72 * dz, front);
      }
      n.twigs.forEach(function (tp) {
        var tpr = tp.map(function (p) { return P(p, n.g); });
        for (var s2 = 0; s2 < tpr.length - 1; s2++) { var a2 = tpr[s2], b2 = tpr[s2 + 1], z2 = (a2[2] + b2[2]) / 2; if ((z2 >= 0) !== front) continue; strokeSeg(a2, b2, 0.4 + s2 / 14, lerp(1.5, 0.6, s2 / 6) * a2[3], 0.14 + 0.5 * (z2 + 1) / 2, front); }
        var e = tpr[tpr.length - 1]; if ((e[2] >= 0) === front) glowDot(e[0], e[1], 3.2 * e[3], TEAL, 0.25 + 0.5 * (e[2] + 1) / 2);
      });
    }
    function ringPass(rg, front, t) {
      var pr = rg.pts.map(function (p) { return P(p, rg.orbit ? G1 : G0); });
      for (var s = 0; s < pr.length - 1; s++) { var a = pr[s], b = pr[s + 1], zm = (a[2] + b[2]) / 2; if ((zm >= 0) !== front) continue; strokeSeg(a, b, s / RN, (rg.orbit ? 1.7 : 1.1) * a[3], rg.orbit ? 0.22 + 0.4 * (zm + 1) / 2 : 0.16 + 0.55 * (zm + 1) / 2, front); }
      if (rg.orbit) return; var bi = ((t * 0.0006 + rg.bead) % 6.2832) / 6.2832 * RN, i0 = Math.floor(bi) % RN, bp = pr[i0]; if ((bp[2] >= 0) === front) glowDot(bp[0], bp[1], 6 * bp[3], VIOLET, 0.45 + 0.4 * (bp[2] + 1) / 2);
    }
    function soma(t, front) {
      var pulse = 1 + 0.03 * Math.sin(t * 0.0016), rr = r0 * pulse;
      if (!front) {
        glowDot(cx, cy, r0 * 3, [110, 140, 255], 0.3); // aura
        var g = ctx.createRadialGradient(cx - rr * 0.34, cy - rr * 0.4, rr * 0.08, cx, cy, rr); // glass body
        g.addColorStop(0, "rgba(255,255,255,.98)"); g.addColorStop(0.3, "rgba(222,232,255,.95)"); g.addColorStop(0.68, "rgba(148,172,255,.9)"); g.addColorStop(1, "rgba(122,102,236,.94)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 6.2832); ctx.fill();
        organelles.forEach(function (o) { var q = P(o.p), al = 0.16 + 0.4 * (q[2] + 1) / 2; ctx.fillStyle = rgba(q[2] > 0 ? [74, 96, 238] : [120, 140, 250], al); ctx.beginPath(); ctx.arc(q[0], q[1], o.s * q[3], 0, 6.2832); ctx.fill(); });
        var nuc = 0.42 + 0.05 * Math.sin(t * 0.0023); glowDot(cx, cy, rr * (nuc + 0.5), BLUE, 0.55); // nucleus
        var ng = ctx.createRadialGradient(cx - rr * 0.05, cy - rr * 0.07, 0, cx, cy, rr * nuc); ng.addColorStop(0, "rgba(255,255,255,1)"); ng.addColorStop(0.35, "rgba(120,170,255,.95)"); ng.addColorStop(1, "rgba(77,107,254,.9)");
        ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(cx, cy, rr * nuc, 0, 6.2832); ctx.fill();
        bumps.forEach(function (b) { var q = P(b.p); if (q[2] < 0.05) return; var br = b.s * Math.min(rx, ry) * q[3]; glowDot(q[0], q[1], br * 1.5, [255, 255, 255], 0.55); ctx.fillStyle = "rgba(120,140,250,.28)"; ctx.beginPath(); ctx.arc(q[0] + br * 0.15, q[1] + br * 0.2, br * 0.7, 0, 6.2832); ctx.fill(); });
        ctx.save(); ctx.translate(cx - rr * 0.36, cy - rr * 0.46); ctx.rotate(-0.55); var hg = ctx.createRadialGradient(0, 0, 0, 0, 0, rr * 0.5); hg.addColorStop(0, "rgba(255,255,255,.9)"); hg.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = hg; ctx.scale(1, 0.55); ctx.beginPath(); ctx.arc(0, 0, rr * 0.5, 0, 6.2832); ctx.fill(); ctx.restore(); // specular
        ctx.strokeStyle = "rgba(45,212,191,.42)"; ctx.lineWidth = Math.max(1.5, rr * 0.05); ctx.beginPath(); ctx.arc(cx, cy, rr * 0.93, 0.15 * Math.PI, 0.72 * Math.PI); ctx.stroke(); // rim light
        ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 6.2832); ctx.stroke();
      }
    }
    function draw(t) {
      if (!w || !h) return;
      var a = reduce ? 0.7 : t * 0.00022, tilt = 0.34 + (reduce ? 0 : 0.07 * Math.sin(t * 0.0004));
      var th1 = reduce ? 0.6 : t * 0.00021, aS = 0.22 + (reduce ? 0 : 0.1 * Math.sin(t * 0.0003)), otilt = 1.02; G1.cz = Math.cos(th1); G1.sz = Math.sin(th1); G1.ca = Math.cos(aS); G1.sa = Math.sin(aS); G1.ct = Math.cos(otilt); G1.st = Math.sin(otilt); G0.ca = Math.cos(a); G0.sa = Math.sin(a); G0.ct = Math.cos(tilt); G0.st = Math.sin(tilt); cx = w / 2; cy = h / 2; rx = ry = Math.min(w, h) * 0.405; r0 = rx * SR;
      ctx.clearRect(0, 0, w, h);
      dust.forEach(function (d) { var q = P(d.p), tw = reduce ? 1 : 0.6 + 0.4 * Math.sin(t * 0.002 + d.ph); ctx.fillStyle = rgba(q[2] > 0 ? BLUE : TEAL, (0.12 + 0.3 * (q[2] + 1) / 2) * tw); ctx.beginPath(); ctx.arc(q[0], q[1], d.s * q[3], 0, 6.2832); ctx.fill(); });
      var order = nodes.map(function (n) { n.g = n.fixed ? G1 : G0; n.pr = n.pts.map(function (p) { return P(p, n.g); }); var e = n.pr[N]; n.sx = e[0]; n.sy = e[1]; n.dz = (e[2] + 1) / 2; n.bz = e[2]; n.sc = e[3]; return n; }).sort(function (p, q) { return p.dz - q.dz; });
      rings.forEach(function (rg) { ringPass(rg, false, t); });
      order.forEach(function (n) { branchPass(n, n.pr, false); });
      soma(t, false);
      order.forEach(function (n) { branchPass(n, n.pr, true); });
      rings.forEach(function (rg) { ringPass(rg, true, t); });
      order.forEach(function (n) { // tip glow, travelling signal, DOM logo
        var bulb = 7 + 12 * n.flash; glowDot(n.sx, n.sy, bulb * n.sc, VIOLET, 0.22 + 0.5 * n.flash + 0.2 * n.dz);
        if (!reduce) {
          var p = ((t * 0.00028) + n.ph) % 1, fi = p * N, i0 = Math.min(N - 1, Math.floor(fi)), fr = fi - i0, A = n.pr[i0], B = n.pr[i0 + 1];
          for (var k = 0; k < 4; k++) { var pk = p - k * 0.025; if (pk < 0) break; var fk = pk * N, ik = Math.min(N - 1, Math.floor(fk)), qa = n.pr[ik], qb = n.pr[ik + 1], fk2 = fk - ik; glowDot(lerp(qa[0], qb[0], fk2), lerp(qa[1], qb[1], fk2), (7 - k * 1.3) * n.sc, ramp(pk), (0.85 - k * 0.2) * (0.35 + 0.65 * n.dz)); }
          if (p > 0.95) n.flash = 1; else n.flash = Math.max(0, n.flash - 0.025);
        }
        var behind = n.bz < 0 && Math.sqrt((n.sx - cx) * (n.sx - cx) + (n.sy - cy) * (n.sy - cy)) < r0 * 1.15, op = behind ? 0 : (n.fixed ? 0.5 + 0.45 * n.dz : 0.6 + 0.4 * n.dz);
        n.el.style.transform = "translate3d(" + (n.sx - cx).toFixed(1) + "px," + (n.sy - cy).toFixed(1) + "px,0) scale(" + (n.fixed ? 0.78 + 0.26 * n.dz : 0.8 + 0.4 * n.dz).toFixed(3) + ")"; n.el.style.opacity = op.toFixed(2); n.el.style.zIndex = String(Math.round(n.dz * 100));
      });
    }
    function loop(t) { if (!running) return; if (!visible || document.hidden || !onStart()) { running = false; return; } if (t - lastT >= 30) { lastT = t; draw(t); } raf = requestAnimationFrame(loop); } // about 30 frames a second is plenty and keeps a tablet cool
    function kick() { if (reduce) { size(); draw(0); return; } if (!running && visible && !document.hidden && onStart()) { running = true; raf = requestAnimationFrame(loop); } }
    size(); draw(0);
    if ("ResizeObserver" in window) new ResizeObserver(function () { size(); draw(performance.now()); kick(); }).observe(box); else window.addEventListener("resize", function () { size(); kick(); });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; kick(); }).observe(box);
    document.addEventListener("visibilitychange", kick);
    document.getElementById("nav").addEventListener("click", function () { setTimeout(kick, 60); });
    kick();
  }

  // ---------- stats: count up once when they scroll into view ----------
  function initStats() {
    var box = $("stats2"); if (!box) return;
    var sm = cfg.START_MODELS || {}, seen = {}, count = 0;
    Object.keys(sm).forEach(function (k) { (sm[k] || []).forEach(function (m) { if (!seen[m.id]) { seen[m.id] = 1; count++; } }); });
    var vals = { models: [count, ""], providers: [Object.keys(sm).length, ""], live: [Math.round((cfg.LIVE_EVERY_MS || 60000) / 1000), " s"], key: [1, ""] };
    var cells = box.querySelectorAll("[data-stat]");
    function paint(f) { cells.forEach(function (c) { var v = vals[c.getAttribute("data-stat")]; if (v) c.textContent = Math.round(v[0] * f) + v[1]; }); }
    paint(reduce ? 1 : 0);
    if (reduce || !("IntersectionObserver" in window)) { paint(1); return; }
    var io = new IntersectionObserver(function (es) {
      if (!es.some(function (e) { return e.isIntersecting; })) return; io.disconnect();
      var t0 = performance.now(); (function step(t) { var k = Math.min(1, (t - t0) / 1600); paint(1 - Math.pow(1 - k, 3)); if (k < 1) requestAnimationFrame(step); })(t0);
    }, { threshold: 0.4 });
    io.observe(box);
  }

  // ---------- featured model cards ----------
  function providerOf(id) {
    id = String(id).toLowerCase();
    if (/^deepseek/.test(id)) return { name: "DeepSeek", logo: "assets/deepseek.png" };
    if (/^(gpt|chatgpt|o\d|dall-?e|sora)/.test(id)) return { name: "OpenAI", logo: /^gpt-?5/.test(id) ? "assets/openai-green.png" : "assets/openai-white.png" };
    return { name: "Other", logo: null };
  }
  function tagOf(id) { var info = (cfg.MODEL_INFO || {})[id]; if (info && info.tag) return info.tag; var sm = cfg.START_MODELS || {}, out = ""; Object.keys(sm).forEach(function (k) { (sm[k] || []).forEach(function (m) { if (m.id === id) out = m.tag; }); }); return out; }
  function goTab(name) { var b = document.querySelector('#nav [data-tab="' + name + '"]'); if (b) b.click(); }
  function initFeatured() {
    var row = $("featRow"); if (!row) return;
    (cfg.FEATURED_MODELS || []).forEach(function (id) {
      var p = providerOf(id), pr = (cfg.PRICES || {})[id], c = el("button", "feat"); c.type = "button";
      var head = el("div", "fhead"), lg = el("span", "flogo"); if (p.logo) { var im = document.createElement("img"); im.src = p.logo; im.alt = ""; im.height = 26; lg.appendChild(im); } else lg.textContent = p.name.charAt(0);
      var tx = el("div", "ftx"); tx.appendChild(el("b", "", id)); tx.appendChild(el("span", "muted", "by " + p.name)); head.appendChild(lg); head.appendChild(tx); c.appendChild(head);
      var tg = tagOf(id); if (tg) c.appendChild(el("span", "ftag", tg));
      var io = el("div", "fio");
      [["Input", pr ? "$" + pr.input + " / 1M" : "price: ask"], ["Output", pr ? "$" + pr.output + " / 1M" : "price: ask"]].forEach(function (r) { var d = el("div"); d.appendChild(el("span", "iol", r[0])); d.appendChild(el("b", "", r[1])); io.appendChild(d); });
      c.appendChild(io); c.addEventListener("click", function () { goTab("models"); }); row.appendChild(c);
    });
    var all = $("featAll"); if (all) all.addEventListener("click", function () { goTab("models"); });
  }


  // ---------- "How it works": your tools -> GamePay gateway -> models, joined by animated lines (like the LiteLLM / Vercel diagrams) ----------
  function initFlow() {
    var box = $("flow"); if (!box) return;
    var NS = "http://www.w3.org/2000/svg", plats = [].slice.call(document.querySelectorAll("#platBoxes .plb")), provs = [].slice.call(document.querySelectorAll("#provBoxes .pbx")), sm = cfg.START_MODELS || {};
    var LOGO = { deepseek: "assets/net-deepseek.png", openai: "assets/net-openai.png" };
    function grp(cls, label) { var g = el("div", "fgrp " + cls); g.appendChild(el("span", "fglabel", label)); return g; }
    // left: the tools (icons and settings come from the existing "Works with" buttons, so the set-up sheets keep working)
    var tools = grp("ftools", "Your tools"), tg = el("div", "ftiles");
    plats.forEach(function (b, i) {
      var t = el("button", "ft t" + (i % 6)), ic = el("span", "fti"), sv = b.querySelector(".pli svg"), nm = b.querySelector(".plt b");
      var LG = { "VS Code": "assets/tool-vscode.svg", "Terminal": "assets/tool-terminal.svg", "Python": "assets/tool-python.svg", "OpenHands": "assets/tool-openhands.svg" }, nmt = nm ? nm.textContent : "";
      t.type = "button";
      if (LG[nmt]) { var li = document.createElement("img"); li.src = LG[nmt]; li.alt = ""; ic.classList.add("logo"); ic.appendChild(li); } else if (sv) ic.innerHTML = sv.outerHTML; // real logo where we have one, plain glyph otherwise
      t.appendChild(ic); t.appendChild(el("b", "", nmt.replace("Your own app", "Your app"))); t.addEventListener("click", function () { b.click(); }); tg.appendChild(t);
    });
    tools.appendChild(tg);
    // middle: the gateway
    var ICO = { key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16.5 6.5l3 3"/>', wallet: '<path d="M4 8V6a2 2 0 0 1 2-2h11v4"/><rect x="3" y="8" width="18" height="12" rx="2.5"/><circle cx="16.5" cy="14" r="1.3"/>', pulse: '<path d="M3 12h4l2.5-6.5 4 13 2.5-6.5H21"/>', chat: '<path d="M4 5h16v11H10l-6 4z"/>' };
    function ico(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICO[k] + '</svg>'; }
    var gw = el("div", "fgw"), top = el("div", "fgtop"), gl = el("span", "fglogo"), gim = document.createElement("img"); gim.src = "assets/logo-192.png"; gim.alt = ""; gl.appendChild(gim); top.appendChild(gl);
    var gt = el("span", "fgttl"); gt.appendChild(el("b", "", "GamePay")); gt.appendChild(el("span", "", "API gateway")); top.appendChild(gt);
    var live = el("span", "fglive"); live.appendChild(el("i", "fgdot")); live.appendChild(document.createTextNode("Live")); top.appendChild(live); gw.appendChild(top); gw.appendChild(el("i", "fgdiv"));
    [["key", "One key"], ["wallet", "Token balance"], ["pulse", "Live status"], ["chat", "Chat + pictures"]].forEach(function (r, i) {
      var row = el("div", "fgr g" + i), ic = el("span", "fgi"); ic.innerHTML = ico(r[0]); row.appendChild(ic); row.appendChild(el("span", "", r[1])); gw.appendChild(row);
    });
    // right: providers that really answer through this gateway
    var models = grp("fmodels", "Models"), mg = el("div", "fmlist");
    provs.forEach(function (b) {
      var nm = (b.querySelector(".pbt b") || {}).textContent || "", key = nm.toLowerCase(), cnt = (sm[key] || []).length, t = el("button", "fm"); t.type = "button";
      var im = document.createElement("img"); im.src = LOGO[key] || ""; im.alt = ""; if (!LOGO[key]) im.hidden = true; t.appendChild(im);
      var tx = el("span", "fmt"); tx.appendChild(el("b", "", nm)); tx.appendChild(el("span", "", cnt + " models")); t.appendChild(tx); t.addEventListener("click", function () { b.click(); }); mg.appendChild(t);
    });
    (cfg.MODEL_SOON || []).forEach(function (m) { // not connected yet: dimmed, not clickable
      var t = el("div", "fm soon"), im = document.createElement("img"); im.src = m.logo; im.alt = ""; t.appendChild(im);
      var tx = el("span", "fmt"); tx.appendChild(el("b", "", m.name)); t.appendChild(tx); t.appendChild(el("span", "fsoon", "Soon")); mg.appendChild(t);
    });
    var more = el("div", "fm more"); more.appendChild(el("span", "fplus", "+")); var mt = el("span", "fmt"); mt.appendChild(el("b", "", "More")); mt.appendChild(el("span", "", "can be added")); more.appendChild(mt); if (!(cfg.MODEL_SOON || []).length) mg.appendChild(more);
    models.appendChild(mg);
    var svg = document.createElementNS(NS, "svg"); svg.setAttribute("class", "flowsvg"); svg.setAttribute("aria-hidden", "true");
    box.appendChild(svg); box.appendChild(tools); box.appendChild(gw); box.appendChild(models);

    function rect(e) { return { l: e.offsetLeft, r: e.offsetLeft + e.offsetWidth, t: e.offsetTop, b: e.offsetTop + e.offsetHeight, w: e.offsetWidth, h: e.offsetHeight }; } // layout position: not moved by the entrance animation
    function node(tag, attrs) { var e = document.createElementNS(NS, tag); Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }
    function draw() {
      var W = box.clientWidth, H = box.clientHeight; if (!W || !H) return;
      var A = rect(tools), G = rect(gw), M = rect(models), horiz = G.l > A.r + 24;
      svg.setAttribute("viewBox", "0 0 " + W + " " + H); svg.textContent = "";
      var defs = node("defs", {}), lgd = node("linearGradient", { id: "flowg", gradientUnits: "userSpaceOnUse", x1: 0, y1: 0, x2: horiz ? W : 0, y2: horiz ? 0 : H });
      [["0", "#4d6bfe"], ["0.55", "#8b6cf0"], ["1", "#14b8a6"]].forEach(function (s) { lgd.appendChild(node("stop", { offset: s[0], "stop-color": s[1] })); }); defs.appendChild(lgd); svg.appendChild(defs);
      function link(a, b, k) {
        [[0.2, 0.3], [0.5, 0.5], [0.8, 0.7]].forEach(function (f, i) {
          var x1, y1, x2, y2, d;
          if (horiz) { x1 = a.r; y1 = a.t + a.h * f[k ? 1 : 0]; x2 = b.l; y2 = b.t + b.h * f[k ? 0 : 1]; var xm = (x1 + x2) / 2; d = "M" + x1 + " " + y1 + " C" + xm + " " + y1 + " " + xm + " " + y2 + " " + x2 + " " + y2; }
          else { x1 = a.l + a.w * f[k ? 1 : 0]; y1 = a.b; x2 = b.l + b.w * f[k ? 0 : 1]; y2 = b.t; var ym = (y1 + y2) / 2; d = "M" + x1 + " " + y1 + " C" + x1 + " " + ym + " " + x2 + " " + ym + " " + x2 + " " + y2; }
          svg.appendChild(node("path", { d: d, fill: "none", stroke: "url(#flowg)", "stroke-width": 3, "stroke-linecap": "round", opacity: 0.85 }));
          svg.appendChild(node("path", { d: d, fill: "none", stroke: "url(#flowg)", "stroke-width": 9, "stroke-linecap": "round", opacity: 0.14 }));
          if (!reduce) svg.appendChild(node("path", { d: d, fill: "none", stroke: "url(#flowg)", "stroke-width": 3.6, "stroke-linecap": "round", "class": "flowp" }));
          [[x1, y1], [x2, y2]].forEach(function (p) { svg.appendChild(node("circle", { cx: p[0], cy: p[1], r: 5.6, fill: "#fff", stroke: "url(#flowg)", "stroke-width": 2.6 })); });
        });
      }
      link(A, G, 0); link(G, M, 1);
    }
    draw();
    if ("ResizeObserver" in window) new ResizeObserver(draw).observe(box); else window.addEventListener("resize", draw);
    window.addEventListener("load", draw); if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    if (reduce || !("IntersectionObserver" in window)) { box.classList.add("in"); return; }
    new IntersectionObserver(function (es) { box.classList.toggle("live", es[0].isIntersecting); }).observe(box); // dashes only run while the diagram is on screen
    var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { box.classList.add("in"); io.disconnect(); } }, { threshold: 0.25 }); io.observe(box);
  }


  // ---------- "Works with": two rows of tool chips that drift in opposite directions ----------
  function initTools() {
    var box = $("marq"); if (!box) return;
    var list = cfg.TOOL_STRIP || [], sheets = {};
    [].slice.call(document.querySelectorAll("#platBoxes .plb")).forEach(function (b) { var n = b.querySelector(".plt b"); if (n) sheets[n.textContent] = b; });
    function chip(it, hidden) {
      var open = it.sheet && sheets[it.sheet], c = el(open ? "button" : "span", "chip2" + (it.tested ? " ok" : "") + (open ? " tap" : "")), lg = el("span", "c2l"), im = document.createElement("img");
      im.src = it.logo; im.alt = ""; lg.appendChild(im); if (it.tested) lg.appendChild(el("i", "c2ok", "✓")); c.appendChild(lg); c.appendChild(el("b", "", it.name));
      if (open) { c.type = "button"; c.addEventListener("click", function () { sheets[it.sheet].click(); }); }
      if (hidden) { c.setAttribute("aria-hidden", "true"); c.tabIndex = -1; }
      return c;
    }
    [list.filter(function (_, i) { return i % 2 === 0; }), list.filter(function (_, i) { return i % 2 === 1; })].forEach(function (items, ri) {
      var row = el("div", "mrow2 r" + ri), track = el("div", "mtrack");
      for (var rep = 0; rep < 4; rep++) items.forEach(function (it) { track.appendChild(chip(it, rep > 0)); }); // 4 copies; the track slides by one copy, so the loop has no gap
      row.appendChild(track); box.appendChild(row);
    });
    if (reduce || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (es) { box.classList.toggle("live", es[0].isIntersecting); }).observe(box); // only moves while on screen
  }

  // ---------- top bar button (Telegram), same contact as the Start page button ----------
  function initCta() { var a = $("navCta"); if (a && cfg.SUPPORT_TELEGRAM) { a.href = "https://t.me/" + cfg.SUPPORT_TELEGRAM; a.hidden = false; } }

  initCta(); initFeatured(); initStats(); initNet(); initFlow(); initTools();
})();
