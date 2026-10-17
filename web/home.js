// Start page extras: the GamePay "brain cell" network picture, count-up stats and featured model cards.
// Self-contained on purpose (no gateway calls, no keys). Settings come from config.js: NET_NODES, FEATURED_MODELS, START_MODELS, PRICES.
(function () {
  "use strict";
  var cfg = window.GPH_CONFIG || {};
  var reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function onStart() { return document.body.getAttribute("data-tab") === "start"; }

  // ---------- network picture: nodes sit on a slowly turning sphere, joined to the core by curved gradient lines ----------
  function initNet() {
    var box = $("net"), cv = $("netCv"), holder = $("netNodes"); if (!box || !cv || !holder) return;
    var ctx = cv.getContext("2d"), logos = cfg.NET_NODES || [], total = Math.max(14, logos.length + 8), nodes = [], w = 0, h = 0, dpr = 1, raf = 0, running = false, visible = true;
    var gold = Math.PI * (3 - Math.sqrt(5)), logoAt = {};
    logos.forEach(function (l, k) { logoAt[Math.floor((k + 0.5) * total / logos.length)] = l; });
    for (var i = 0; i < total; i++) {
      var y = 1 - (i + 0.5) * 2 / total, r = Math.sqrt(1 - y * y), th = i * gold, l = logoAt[i], d;
      if (l) { d = el("span", "nn"); var im = document.createElement("img"); im.src = l.logo; im.alt = ""; im.height = 24; im.addEventListener("error", function () { this.hidden = true; }); d.appendChild(im); if (l.name) d.title = l.name; }
      else d = el("span", "nd");
      holder.appendChild(d);
      nodes.push({ x: Math.cos(th) * r, y: y, z: Math.sin(th) * r, el: d, big: !!l, ph: i * 0.137, sx: 0, sy: 0, dz: 0 });
    }
    function size() {
      w = box.clientWidth; h = box.clientHeight; dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + "px"; cv.style.height = h + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw(t) {
      if (!w || !h) return;
      var a = reduce ? 0.7 : t * 0.00022, tilt = 0.38, ca = Math.cos(a), sa = Math.sin(a), ct = Math.cos(tilt), st = Math.sin(tilt);
      var cx = w / 2, cy = h / 2, rx = w * 0.40, ry = h * 0.41; ctx.clearRect(0, 0, w, h);
      nodes.forEach(function (n) {
        var x1 = n.x * ca + n.z * sa, z1 = -n.x * sa + n.z * ca, y1 = n.y * ct - z1 * st, z2 = n.y * st + z1 * ct, s = 1 / (1 - z2 * 0.28);
        n.sx = cx + x1 * rx * s; n.sy = cy + y1 * ry * s; n.dz = (z2 + 1) / 2; n.sc = s;
      });
      nodes.slice().sort(function (p, q) { return p.dz - q.dz; }).forEach(function (n, idx) {
        var mx = (cx + n.sx) / 2, my = (cy + n.sy) / 2, dx = n.sx - cx, dy = n.sy - cy, len = Math.sqrt(dx * dx + dy * dy) || 1, bend = (idx % 2 ? 1 : -1) * len * 0.18;
        var qx = mx - dy / len * bend, qy = my + dx / len * bend, al = 0.16 + 0.5 * n.dz;
        var g = ctx.createLinearGradient(cx, cy, n.sx, n.sy);
        g.addColorStop(0, "rgba(77,107,254," + al + ")"); g.addColorStop(0.55, "rgba(139,108,240," + al + ")"); g.addColorStop(1, "rgba(45,212,191," + al + ")");
        ctx.strokeStyle = g; ctx.lineWidth = n.big ? 1.8 : 1.1; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.quadraticCurveTo(qx, qy, n.sx, n.sy); ctx.stroke();
        if (!reduce) { // a small light travelling out along the line
          var p = ((t * 0.00035) + n.ph) % 1, u = 1 - p, px = u * u * cx + 2 * u * p * qx + p * p * n.sx, py = u * u * cy + 2 * u * p * qy + p * p * n.sy;
          ctx.fillStyle = "rgba(77,107,254," + (0.35 + 0.5 * n.dz) + ")"; ctx.beginPath(); ctx.arc(px, py, n.big ? 2.6 : 2, 0, 6.2832); ctx.fill();
        }
        n.el.style.transform = "translate3d(" + (n.sx - cx).toFixed(1) + "px," + (n.sy - cy).toFixed(1) + "px,0) scale(" + (0.62 + 0.5 * n.dz).toFixed(3) + ")";
        n.el.style.opacity = (0.4 + 0.6 * n.dz).toFixed(2); n.el.style.zIndex = String(Math.round(n.dz * 100));
      });
    }
    function loop(t) { if (!running) return; if (!visible || document.hidden || !onStart()) { running = false; return; } draw(t); raf = requestAnimationFrame(loop); }
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

  // ---------- top bar button (Telegram), same contact as the Start page button ----------
  function initCta() { var a = $("navCta"); if (a && cfg.SUPPORT_TELEGRAM) { a.href = "https://t.me/" + cfg.SUPPORT_TELEGRAM; a.hidden = false; } }

  initCta(); initFeatured(); initStats(); initNet();
})();
