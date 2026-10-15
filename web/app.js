(function () {
  var cfg = window.GPH_CONFIG;
  var params = new URLSearchParams(location.search);
  var MOCK = params.get("mock") === "1";
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n) { return Math.round(n).toLocaleString("en-US"); };
  var usd = function (n) { return "$" + n.toFixed(n < 10 ? 3 : 2); };
  var state = { key: "", data: null, models: [], ping: null, speed: null, speedSrc: "", sess: { in: 0, out: 0 }, ms: {}, prev: {}, tilesShown: false };

  // ---------- icons (inline SVG, drawn here so the page needs no image files) ----------
  var ICONS = {
    home: '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    cube: '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 12l9-5M12 12v10M12 12L3 7"/>',
    wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2"/><path d="M16 14h2"/>',
    book: '<path d="M4 5a1 1 0 0 1 1-1h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H5a1 1 0 0 1-1-1z"/><path d="M20 5a1 1 0 0 0-1-1h-6M20 5v12a1 1 0 0 1-1 1h-6"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    "eye-off": '<path d="M3 3l18 18"/><path d="M10.6 6.1A9.8 9.8 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 7.5A17 17 0 0 0 2 12s4 7 10 7a9.6 9.6 0 0 0 4-.9"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    check: '<path d="M4 12l5 5L20 6"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>',
    zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
    chat: '<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z"/>',
    power: '<path d="M12 2v9"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5c0-1 1-1.5 2.5-1.5s2.5.6 2.5 1.7c0 2.2-5 1.2-5 3.6 0 1.1 1 1.7 2.5 1.7s2.5-.6 2.5-1.5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
    chevron: '<path d="M6 9l6 6 6-6"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    download: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 20h16"/>',
    upload: '<path d="M12 21V9"/><path d="M7 14l5-5 5 5"/><path d="M4 4h16"/>',
    play: '<path d="M7 4l13 8-13 8z"/>'
  };
  function svg(name) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || "") + "</svg>"; }
  function paintIcons(root) {
    (root || document).querySelectorAll("i[data-icon]").forEach(function (el) { el.outerHTML = svg(el.getAttribute("data-icon")); });
  }
  function setBtnIcon(btn, name) { btn.innerHTML = svg(name); }

  $("baseUrl").textContent = cfg.GATEWAY_URL + "/v1";
  $("baseUrl2").textContent = cfg.GATEWAY_URL + "/v1";
  $("mockNotice").hidden = !MOCK;
  $("snipCurl").textContent = 'curl ' + cfg.GATEWAY_URL + '/v1/chat/completions \\\n  -H "Authorization: Bearer YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"model":"deepseek-flash","messages":[{"role":"user","content":"Hello"}]}\'';
  $("snipPy").textContent = 'from openai import OpenAI\nclient = OpenAI(base_url="' + cfg.GATEWAY_URL + '/v1", api_key="YOUR_KEY")\nr = client.chat.completions.create(model="deepseek-flash",\n    messages=[{"role": "user", "content": "Hello"}])\nprint(r.choices[0].message.content)';
  if (cfg.CONTACT_URL) { var c = $("contactBtn"); c.href = cfg.CONTACT_URL; c.hidden = false; }

  // ---------- gateway access (the ONLY place that talks to the gateway) ----------
  // fetchUsage must return { name, active, limitUsd, usedUsd, expires, models[] }.
  // /api/usage/token/ is confirmed working with a real key. The billing endpoints stay as a fallback.
  var trace = [];
  function getJson(path, key) {
    return fetch(cfg.GATEWAY_URL + path, { headers: { Authorization: "Bearer " + key } })
      .then(function (r) {
        return r.text().then(function (t) {
          var j = null; try { j = JSON.parse(t); } catch (e) {}
          trace.push({ path: path, status: r.status, fields: j && typeof j === "object" ? Object.keys(j.data && typeof j.data === "object" ? j.data : j) : "not JSON" });
          return { ok: r.ok, json: j };
        });
      }, function () { trace.push({ path: path, status: "network/CORS error" }); return { ok: false, json: null }; });
  }
  function tryTokenEndpoint(key) {
    return getJson("/api/usage/token/", key).then(function (r) {
      var d = r.ok && r.json && r.json.data;
      if (!d || typeof d.total_granted !== "number" || typeof d.total_used !== "number") return null;
      return { name: d.name, active: true, limitUsd: d.total_granted / cfg.QUOTA_PER_USD, usedUsd: d.total_used / cfg.QUOTA_PER_USD,
               expires: d.expires_at > 0 ? d.expires_at * 1000 : null,
               models: Array.isArray(d.model_limits) ? d.model_limits : (d.model_limits ? Object.keys(d.model_limits) : []) };
    });
  }
  function tryBillingEndpoints(key) {
    return getJson("/v1/dashboard/billing/subscription", key).then(function (sub) {
      var j = sub.json, limit = sub.ok && j ? (j.hard_limit_usd != null ? j.hard_limit_usd : j.system_hard_limit_usd) : null;
      if (typeof limit !== "number") return null;
      return getJson("/v1/dashboard/billing/usage", key).then(function (u) {
        if (!u.ok || !u.json || typeof u.json.total_usage !== "number") return null;
        return { name: "", active: true, limitUsd: limit, usedUsd: u.json.total_usage / 100, expires: null, models: [] };
      });
    });
  }
  function fetchUsage(key) {
    if (MOCK) return new Promise(function (ok) { setTimeout(function () {
      ok({ name: "demo-member", active: true, limitUsd: 1.2, usedUsd: 0.43, expires: Date.now() + 25 * 864e5, models: ["deepseek-flash", "deepseek-v4-pro"] }); }, 400); });
    trace = [];
    return tryTokenEndpoint(key).then(function (d) { return d || tryBillingEndpoints(key); }).then(function (d) {
      if (params.get("debug") === "1") { $("debug").hidden = false; $("debug").textContent = JSON.stringify(trace, null, 1); }
      if (!d) throw new Error(trace.some(function (t) { return t.status === 401; }) ? "BAD_KEY" : "NOT_CONFIGURED");
      return d;
    });
  }
  // OpenAI-standard model list. Falls back to the key's own model list if the call fails.
  function fetchModels(key) {
    if (MOCK) return Promise.resolve({ ids: ["deepseek-flash", "deepseek-v4-pro"], ms: 120 });
    var t0 = performance.now();
    return fetch(cfg.GATEWAY_URL + "/v1/models", { headers: { Authorization: "Bearer " + key } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return { ids: j && Array.isArray(j.data) ? j.data.map(function (m) { return m.id; }) : [], ms: Math.round(performance.now() - t0) }; })
      .catch(function () { return { ids: [], ms: null }; });
  }
  // Real speed test: one tiny chat message. Costs a few tokens.
  function testModel(key, model) {
    if (MOCK) return new Promise(function (ok) { setTimeout(function () { ok({ ok: true, ms: 300 + Math.round(Math.random() * 500) }); }, 500); });
    var t0 = performance.now();
    return fetch(cfg.GATEWAY_URL + "/v1/chat/completions", { method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ model: model, messages: [{ role: "user", content: "hi" }] }, providerOf(model).key === "deepseek" ? { max_tokens: 8 } : { max_completion_tokens: 16 })) })
      .then(function (r) { return { ok: r.ok, ms: Math.round(performance.now() - t0), status: r.status }; })
      .catch(function () { return { ok: false, ms: null }; });
  }

  // ---------- rendering ----------
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Numbers tick from their old value to the new one (so after a chat they count up instead of jumping).
  function countUp(el, to, f, from) {
    el.__a = (el.__a || 0) + 1; var id = el.__a;
    if (reduced || from === to || !isFinite(from)) { el.textContent = f(to); return; }
    var t0 = null, dur = 900;
    (function step(t) {
      if (el.__a !== id) return; if (t0 == null) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = f(from + (to - from) * e); if (k < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  function tick(el, key, to, f) { countUp(el, to, f, state.prev[key] != null ? state.prev[key] : 0); state.prev[key] = to; }
  function donut(el, pctLeft) {
    var R = 46, C = 2 * Math.PI * R, off = C * (1 - Math.max(0, Math.min(100, pctLeft)) / 100);
    el.classList.toggle("low", pctLeft < 15);
    el.innerHTML = '<svg viewBox="0 0 112 112"><circle class="bg" cx="56" cy="56" r="' + R + '" fill="none" stroke-width="11"/>' +
      '<circle class="fg" cx="56" cy="56" r="' + R + '" fill="none" stroke-width="11" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + C.toFixed(1) + '"/></svg><b>' + Math.round(pctLeft) + '%</b>';
    requestAnimationFrame(function () { el.querySelector(".fg").style.strokeDashoffset = off.toFixed(1); });
  }
  function item(parent, title, sub, right) {
    var d = document.createElement("div"); d.className = "item";
    var b = document.createElement("b"); b.textContent = title; d.appendChild(b);
    if (right) d.appendChild(right);
    if (sub) { var s = document.createElement("span"); s.className = "sub"; s.textContent = sub; d.appendChild(s); }
    parent.appendChild(d); return b;
  }
  // One tile = one coloured box. o: { icon, label, value, sub, tone, meter, accent, wide, full }
  function tile(o) {
    var d = document.createElement("div"); d.className = "tile a-" + (o.accent || "blue") + (o.tone ? " " + o.tone : "") + (o.wide ? " wide" : "") + (o.full ? " full" : "");
    d.innerHTML = '<span class="ti">' + svg(o.icon) + '</span><div class="tb"><div class="tl"></div><div class="tv"></div><div class="ts"></div></div>';
    d.querySelector(".tl").textContent = o.label; d.querySelector(".tv").textContent = o.value; d.querySelector(".ts").textContent = o.sub || "";
    if (o.meter != null) { var m = document.createElement("div"); m.className = "meter"; m.innerHTML = "<i></i>"; var fill = m.firstChild; fill.style.width = "0%"; d.querySelector(".tb").appendChild(m);
      requestAnimationFrame(function () { requestAnimationFrame(function () { fill.style.width = Math.max(0, Math.min(100, o.meter)) + "%"; }); }); }
    if (o.num != null) tick(d.querySelector(".tv"), "t:" + o.label, o.num, o.f || fmt);
    if (o.live) d.classList.add("live");
    if (!state.tilesShown) { d.classList.add("enter"); d.style.setProperty("--i", o.idx || 0); }
    return d;
  }
  // Power = how fast the gateway answers. Source is the last model Test if there is one, otherwise the gateway ping.
  // Thresholds are a simple rule of thumb, not an official measure.
  // Input / Output = tokens used in the Chat tab during this visit (from the gateway's usage numbers), with the price per 1M.
  function renderTiles() {
    var data = state.data, box = $("tiles"); if (!data) return; box.textContent = "";
    var per = 1e6 / cfg.BASE_PRICE, limit = data.limitUsd * per, used = data.usedUsd * per;
    var leftUsd = Math.max(data.limitUsd - data.usedUsd, 0), pctUsed = limit > 0 ? used / limit * 100 : 0;
    var days = data.expires ? Math.ceil((data.expires - Date.now()) / 864e5) : null;
    var okKey = data.active && !(days !== null && days <= 0);
    var sp = state.speed != null ? state.speed : state.ping, kind = state.speed != null ? "test" : "ping";
    var lvl = powerOf(sp, kind), cap = kind === "test" ? 8000 : 2000;
    var pr = cfg.PRICES[$("chatModel").value] || cfg.PRICES["deepseek-flash"];
    box.appendChild(tile({ idx: 0, live: okKey && data.active, icon: "shield", label: "Status", accent: "green", value: data.active ? (days !== null && days <= 0 ? "Expired" : "Active") : "Disabled",
      sub: state.ping != null ? "Gateway online" : "Gateway not checked", tone: okKey ? "ok" : "bad" }));
    box.appendChild(tile({ idx: 1, icon: "power", label: "Power", accent: "amber", value: lvl[0] === "Not tested" ? "--" : lvl[0], tone: lvl[1] === "idle" ? "" : lvl[1],
      sub: sp == null ? "Run a model test" : sp + " ms (" + (state.speedSrc || "gateway ping") + ")", meter: sp == null ? null : 100 - Math.min(sp, cap) / cap * 100 }));
    box.appendChild(tile({ idx: 2, num: leftUsd, f: usd, icon: "coin", label: "Credit left", accent: "sky", wide: true, value: usd(leftUsd), sub: "of " + usd(data.limitUsd) + " total", meter: data.limitUsd > 0 ? leftUsd / data.limitUsd * 100 : 0 }));
    box.appendChild(tile({ idx: 3, num: state.sess.in, icon: "download", label: "Input", accent: "teal", value: fmt(state.sess.in), sub: "tokens this visit · $" + pr.input + "/1M" }));
    box.appendChild(tile({ idx: 4, num: state.sess.out, icon: "upload", label: "Output", accent: "indigo", value: fmt(state.sess.out), sub: "tokens this visit · $" + pr.output + "/1M" }));
    box.appendChild(tile({ idx: 5, num: used, icon: "activity", label: "Used", accent: "rose", value: fmt(used), sub: Math.round(pctUsed) + "% of " + fmt(limit) }));
    box.appendChild(tile({ idx: 6, icon: "calendar", label: "Expires", accent: "orange", value: days === null ? "Never" : (days <= 0 ? "Expired" : days + " days"),
      sub: data.expires ? new Date(data.expires).toLocaleDateString() : "No expiry date", tone: days !== null && days <= 3 ? "warn" : "" }));
    var ids = state.models.length ? state.models : data.models;
    state.tilesShown = state.tilesShown; // (set below once the whole set is built)
    box.appendChild(tile({ idx: 7, icon: "cube", label: "Models", accent: "violet", full: true, value: String(ids.length), sub: ids.join("  ·  ") }));
    state.tilesShown = true;
  }
  function renderOverview(data) {
    var per = 1e6 / cfg.BASE_PRICE, limit = data.limitUsd * per, used = data.usedUsd * per, left = Math.max(limit - used, 0);
    var leftUsd = Math.max(data.limitUsd - data.usedUsd, 0), pct = limit > 0 ? left / limit * 100 : 0;
    tick($("leftTokens"), "left", left, fmt); $("limitTokens").textContent = fmt(limit); $("usedTokens").textContent = fmt(used);
    $("leftUsd").textContent = "(about " + usd(leftUsd) + " of credit)";
    $("expires").textContent = data.expires ? new Date(data.expires).toLocaleDateString() : "Never";
    $("keyName").textContent = data.name || "";
    var chip = $("statusChip"); chip.textContent = data.active ? "Active" : "Disabled"; chip.classList.toggle("off", !data.active);
    donut($("donut1"), pct); renderTiles();
    var hb = $("heroBar"); hb.style.width = "0%"; $("heroBarWrap").setAttribute("aria-valuenow", Math.round(pct)); $("heroBarWrap").classList.toggle("low", pct < 15);
    requestAnimationFrame(function () { requestAnimationFrame(function () { hb.style.width = pct.toFixed(1) + "%"; }); });
    $("emptyState").hidden = true; $("overviewData").hidden = false;
    // credit tab
    $("creditEmpty").hidden = true; $("creditData").hidden = false;
    tick($("creditUsd"), "credit", leftUsd, usd); $("creditPct").textContent = Math.round(pct) + "% of " + usd(data.limitUsd) + " left";
    donut($("donut2"), pct); $("lowWarn").hidden = pct >= 15;
    var rw = $("runway"); rw.textContent = "";
    Object.keys(cfg.PRICES).forEach(function (m) {
      var p = cfg.PRICES[m], hi = leftUsd / Math.min(p.input, p.output) * 1e6, lo = leftUsd / Math.max(p.input, p.output) * 1e6;
      item(rw, m, "$" + p.input + " in / $" + p.output + " out per 1M tokens", null);
      var sub = rw.lastChild.querySelector(".sub"); sub.textContent += " · about " + (Math.round(lo) === Math.round(hi) ? fmt(lo) : fmt(lo) + " to " + fmt(hi)) + " tokens";
    });
  }
  // Power level from a measured time. A model Test waits for a whole reply, so its scale is longer than the gateway ping scale.
  // These thresholds are a rule of thumb, not an official measure.
  function powerOf(ms, kind) {
    if (ms == null) return ["Not tested", "idle"];
    var t = kind === "test" ? [3000, 8000] : [400, 1200];
    return ms <= t[0] ? ["Fast", "ok"] : ms <= t[1] ? ["Normal", "warn"] : ["Slow", "bad"];
  }
  function mstat(m) { return state.ms[m] || (state.ms[m] = { ms: null, testing: false, failed: "", in: 0, out: 0 }); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function logoImg(h, src) { var i = document.createElement("img"); i.src = src; i.alt = ""; i.height = h; i.addEventListener("error", function () { i.hidden = true; }); return i; }
  // Which company a model id belongs to. Only DeepSeek has a logo file; other providers get a neutral letter badge.
  function providerOf(id) {
    id = String(id).toLowerCase();
    if (/^deepseek/.test(id)) return { key: "deepseek", name: "DeepSeek", accent: "sky", logo: "assets/deepseek.png" };
    if (/^(gpt|chatgpt|o\d|text-|davinci|codex)/.test(id)) return { key: "openai", name: "OpenAI", accent: "teal", logo: null };
    return { key: "other", name: "Other", accent: "violet", logo: null };
  }
  function logoFor(m, h) {
    var p = providerOf(m); if (p.logo) return logoImg(h, p.logo);
    var g = el("span", "glyph", p.name.charAt(0)); g.style.fontSize = Math.round(h * .62) + "px"; return g;
  }
  function updatePowered() {
    var names = [], hasDs = false;
    modelIds().forEach(function (m) { var p = providerOf(m); if (names.indexOf(p.name) < 0) names.push(p.name); if (p.key === "deepseek") hasDs = true; });
    if (!names.length) { names = ["DeepSeek"]; hasDs = true; }
    $("poweredNames").textContent = names.join(" · "); $("dsLogo").style.display = hasDs ? "" : "none";
  }
  function pchip(m) { var pw = powerOf(mstat(m).ms, "test"), c = el("span", "pchip " + pw[1]); c.appendChild(el("i", "dot")); c.appendChild(document.createTextNode(pw[0])); return c; }
  function modelIds() { return state.models.length ? state.models : (state.data ? state.data.models : []); }
  function renderModels() {
    var box = $("modelList"), ids = modelIds(); box.textContent = ""; updatePowered();
    if (!ids.length) { box.className = "list"; box.appendChild(el("p", "muted", "Check your key first.")); return; }
    box.className = "mgrid";
    ids.forEach(function (m) {
      var p = cfg.PRICES[m], info = (cfg.MODEL_INFO || {})[m] || {}, st = mstat(m);
      var d = el("div", "mbox a-" + (info.accent || providerOf(m).accent));
      var head = el("div", "mhead"); head.appendChild(el("span", "mlogo")); head.firstChild.appendChild(logoFor(m, 28)); head.appendChild(pchip(m)); d.appendChild(head);
      var mid = el("div", "mmid"); mid.appendChild(el("div", "mname", m)); mid.appendChild(el("div", "mtag", info.tag || (providerOf(m).name + (p ? "" : " · price not set")))); d.appendChild(mid);
      var io = el("div", "io");
      [["Input", p ? "$" + p.input : "--", st.in], ["Output", p ? "$" + p.output : "--", st.out]].forEach(function (r) {
        var b = el("div"); b.appendChild(el("span", "iol", r[0])); b.appendChild(el("b", "iov", r[1] + " /1M")); b.appendChild(el("span", "ios", fmt(r[2]) + " tokens")); io.appendChild(b);
      }); d.appendChild(io);
      var foot = el("div", "mfoot"), btn = el("button", "small"), res = el("span", "ms");
      btn.type = "button"; btn.disabled = st.testing; btn.innerHTML = svg("play") + "<span>Test</span>";
      if (st.testing) res.textContent = "testing..."; else if (st.failed) { res.className = "ms bad"; res.textContent = st.failed; } else if (st.ms != null) { res.className = "ms ok"; res.textContent = st.ms + " ms"; }
      foot.appendChild(res); foot.appendChild(btn); d.appendChild(foot);
      btn.addEventListener("click", function () {
        st.testing = true; st.failed = ""; renderModels();
        testModel(state.key, m).then(function (r) {
          st.testing = false; st.ms = r.ok ? r.ms : null; st.failed = r.ok ? "" : "failed" + (r.status ? " (" + r.status + ")" : "");
          if (r.ok) { state.speed = r.ms; state.speedSrc = "model test"; refresh(true); }
          renderModels(); buildSheet(); renderTiles();
        });
      });
      box.appendChild(d);
    });
  }
  function fail(msg) { var e = $("error"); e.textContent = msg; e.hidden = false; }

  // ---------- flow ----------
  function refresh(quiet) {
    var btn = $("checkBtn"), key = state.key = $("keyInput").value.trim();
    $("error").hidden = true;
    if (!MOCK && !key) { fail("Please paste your API key first."); return; }
    if (!quiet) { btn.disabled = true; btn.querySelector("span").textContent = "Checking..."; $("skel").hidden = false; $("emptyState").hidden = true; $("overviewData").hidden = true; }
    fetchUsage(key).then(function (d) {
      state.data = d;
      if (quiet) { renderOverview(d); return; } // after a model test / chat only the numbers change; keep what is on screen
      // Ask for the model list first so the whole overview (including the Status tile) is drawn once and the numbers can animate.
      return fetchModels(key).then(function (m) {
        state.models = m.ids; state.ping = m.ms; var pc = $("pingChip");
        pc.textContent = m.ms != null ? "gateway " + m.ms + " ms" : "gateway unreachable"; pc.className = "chip" + (m.ms != null ? "" : " off");
        renderOverview(d); renderModels(); fillChatModels();
      });
    }).catch(function (err) {
      state.data = null; $("emptyState").hidden = false; $("overviewData").hidden = true; $("creditEmpty").hidden = false; $("creditData").hidden = true;
      fail(err.message === "BAD_KEY" ? "The gateway says this key is not valid. Check it and try again."
        : err.message === "NOT_CONFIGURED" ? "The gateway did not return balance info for this key. (Owner: open this page with ?debug=1.)"
        : "Could not check this key. Try again.");
    }).then(function () { $("skel").hidden = true; btn.disabled = false; btn.querySelector("span").textContent = "Check"; });
  }

  // ---------- chat ----------
  var chat = { msgs: [], ctl: null, busy: false };
  var chatEmptyEl = $("chatEmpty"); // keep a reference: Clear empties the list and puts it back
  var MAX_HISTORY = 12; // only the last messages are sent, to keep token use in check
  function fillChatModels() {
    var sel = $("chatModel"), cur = sel.value, ids = modelIds().slice();
    if (!ids.length) ids = Object.keys(cfg.PRICES);
    sel.textContent = "";
    ids.forEach(function (m) { var o = document.createElement("option"); o.value = m; o.textContent = m; sel.appendChild(o); });
    sel.value = ids.indexOf(cur) >= 0 ? cur : (ids.indexOf("deepseek-flash") >= 0 ? "deepseek-flash" : ids[0]);
    buildSheet();
  }
  // Model picker: a bottom sheet on phones, a centred card on wide screens. The hidden <select> keeps the chosen value.
  function buildSheet() {
    var sel = $("chatModel"), list = $("sheetList"); if (!sel.options.length) return;
    $("modelBtnName").textContent = sel.value; $("modelBtnLogo").textContent = ""; $("modelBtnLogo").appendChild(logoFor(sel.value, 20)); list.textContent = "";
    Array.prototype.forEach.call(sel.options, function (o) {
      var m = o.value, p = cfg.PRICES[m], info = (cfg.MODEL_INFO || {})[m] || {}, on = m === sel.value;
      var b = el("button", "opt a-" + (info.accent || providerOf(m).accent) + (on ? " on" : "")); b.type = "button"; b.setAttribute("role", "option"); b.setAttribute("aria-selected", on ? "true" : "false"); b.dataset.model = m;
      var lg = el("span", "olg"); lg.appendChild(logoFor(m, 26)); b.appendChild(lg);
      var tx = el("span", "otx"); tx.appendChild(el("b", "", m)); tx.appendChild(el("span", "otag", (info.tag || providerOf(m).name) + (p ? "  ·  $" + p.input + " in / $" + p.output + " out" : "  ·  price not set"))); b.appendChild(tx);
      var rt = el("span", "ort"); rt.appendChild(pchip(m)); if (on) { var ck = el("span", "ock"); ck.innerHTML = svg("check"); rt.appendChild(ck); } b.appendChild(rt);
      list.appendChild(b);
    });
  }
  var sheetOpener = null;
  function openSheet() { buildSheet(); $("sheet").hidden = false; $("modelBtn").setAttribute("aria-expanded", "true"); sheetOpener = document.activeElement;
    var on = $("sheetList").querySelector(".opt.on") || $("sheetList").firstChild; if (on) on.focus(); }
  function closeSheet() { $("sheet").hidden = true; $("modelBtn").setAttribute("aria-expanded", "false"); if (sheetOpener && sheetOpener.focus) sheetOpener.focus(); }
  $("modelBtn").addEventListener("click", openSheet);
  $("sheetClose").addEventListener("click", closeSheet);
  $("sheetBack").addEventListener("click", closeSheet);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("sheet").hidden) closeSheet(); });
  $("sheetList").addEventListener("click", function (e) {
    var b = e.target.closest(".opt"); if (!b) return;
    var sel = $("chatModel"); sel.value = b.dataset.model; sel.dispatchEvent(new Event("change")); buildSheet(); closeSheet();
  });
  function bubble(kind, text) {
    chatEmptyEl.hidden = true;
    var d = document.createElement("div"); d.className = "msg " + kind; d.textContent = text; $("msgs").appendChild(d);
    window.scrollTo({ top: document.body.scrollHeight }); return d;
  }
  function setBusy(b) {
    chat.busy = b; var btn = $("chatSend"); btn.innerHTML = svg(b ? "stop" : "send"); btn.setAttribute("aria-label", b ? "Stop" : "Send");
  }
  function streamMock(onDelta, signal) {
    var words = "This is a demo reply. Connect your key to chat with DeepSeek for real.".split(" "), i = 0;
    return new Promise(function (ok) { (function tick() {
      if (signal.aborted || i >= words.length) return ok({ usage: { prompt_tokens: 10, completion_tokens: 32, total_tokens: 42 } });
      onDelta({ content: (i ? " " : "") + words[i++] }); setTimeout(tick, 60); })(); });
  }
  function streamReal(key, model, history, onDelta, signal) {
    return fetch(cfg.GATEWAY_URL + "/v1/chat/completions", { method: "POST", signal: signal,
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ model: model, messages: history, stream: true, stream_options: { include_usage: true } }) })
      .then(function (r) {
        if (!r.ok) return r.text().then(function (t) { var m = ""; try { m = JSON.parse(t).error.message || ""; } catch (e) {} var err = new Error(m || ("HTTP " + r.status)); err.status = r.status; throw err; });
        var reader = r.body.getReader(), dec = new TextDecoder(), buf = "", usage = null;
        return (function pump() {
          return reader.read().then(function (x) {
            if (x.done) return { usage: usage };
            buf += dec.decode(x.value, { stream: true });
            var lines = buf.split("\n"); buf = lines.pop();
            lines.forEach(function (ln) {
              ln = ln.trim(); if (ln.indexOf("data:") !== 0) return; var p = ln.slice(5).trim(); if (p === "[DONE]") return;
              try { var j = JSON.parse(p); if (j.usage) usage = j.usage; var dl = j.choices && j.choices[0] && j.choices[0].delta; if (dl) onDelta(dl); } catch (e) {}
            });
            return pump();
          });
        })();
      });
  }
  function sendChat() {
    if (chat.busy) { if (chat.ctl) chat.ctl.abort(); return; }
    var input = $("chatInput"), text = input.value.trim(), key = state.key || $("keyInput").value.trim();
    if (!text) return;
    if (!MOCK && !key) { fail("Paste your API key above first."); return; }
    $("error").hidden = true; input.value = ""; input.style.height = "auto";
    chat.msgs.push({ role: "user", content: text }); bubble("user", text);
    var bot = bubble("bot", ""), think = null, textNode = document.createElement("span"), answer = "";
    bot.innerHTML = '<span class="dots">Thinking</span>'; var started = false;
    chat.ctl = new AbortController(); setBusy(true);
    var onDelta = function (dl) {
      // The model's reasoning (dl.reasoning_content) is deliberately ignored: only the final answer is shown.
      if (!dl.content) return;
      if (!started) { bot.textContent = ""; bot.appendChild(textNode); started = true; }
      answer += dl.content; textNode.textContent = answer;
      window.scrollTo({ top: document.body.scrollHeight });
    };
    var history = chat.msgs.slice(-MAX_HISTORY), model = $("chatModel").value;
    (MOCK ? streamMock(onDelta, chat.ctl.signal) : streamReal(key, model, history, onDelta, chat.ctl.signal)).then(function (res) {
      if (!answer) { bot.textContent = "(empty reply)"; } else { chat.msgs.push({ role: "assistant", content: answer }); }
      if (res && res.usage) { var u = res.usage, pi = u.prompt_tokens || 0, po = u.completion_tokens || 0; state.sess.in += pi; state.sess.out += po; var ms_ = mstat(model); ms_.in += pi; ms_.out += po; renderModels(); buildSheet(); }
      if (res && res.usage && res.usage.total_tokens) { var sm = document.createElement("small"); sm.textContent = res.usage.total_tokens + " tokens"; bot.appendChild(sm); }
      if (!MOCK) refresh(true);
    }).catch(function (err) {
      if (err.name === "AbortError") { if (answer) chat.msgs.push({ role: "assistant", content: answer }); else { bot.remove(); chat.msgs.pop(); } return; }
      bot.className = "msg err"; bot.textContent = err.status === 401 ? "The gateway says this key is not valid."
        : err.status === 402 || err.status === 403 || /quota|balance/i.test(err.message) ? "Out of credit or not allowed for this model. " + err.message
        : "Could not get a reply (" + (err.message || "network error") + ").";
      chat.msgs.pop(); // do not keep the unanswered question in the history
    }).then(function () { chat.ctl = null; setBusy(false); });
  }
  $("chatSend").addEventListener("click", sendChat);
  $("chatInput").addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sendChat(); } });
  $("chatInput").addEventListener("input", function () { this.style.height = "auto"; this.style.height = Math.min(this.scrollHeight, 140) + "px"; });
  $("chatClear").addEventListener("click", function () {
    if (chat.ctl) chat.ctl.abort(); chat.msgs = []; var m = $("msgs"); m.textContent = ""; m.appendChild(chatEmptyEl); chatEmptyEl.hidden = false;
  });
  fillChatModels();
  $("chatModel").addEventListener("change", function () { renderTiles(); $("modelBtnName").textContent = $("chatModel").value; });
  $("checkBtn").addEventListener("click", function () { refresh(false); });
  $("keyInput").addEventListener("keydown", function (e) { if (e.key === "Enter") refresh(false); });
  // A password-type field makes the browser offer to save the key as a password. Where CSS can mask a text field instead, use that.
  var keyBox = $("keyInput"), canMask = window.CSS && CSS.supports && CSS.supports("-webkit-text-security", "disc");
  if (canMask) { keyBox.type = "text"; keyBox.classList.add("masked"); }
  $("toggleKey").addEventListener("click", function () {
    var show;
    if (canMask) { show = keyBox.classList.contains("masked"); keyBox.classList.toggle("masked", !show); }
    else { show = keyBox.type === "password"; keyBox.type = show ? "text" : "password"; }
    setBtnIcon(this, show ? "eye-off" : "eye");
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copy],[data-copytext]"); if (!b) return;
    var text = b.hasAttribute("data-copy") ? $(b.getAttribute("data-copy")).textContent : b.getAttribute("data-copytext");
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () {
      setBtnIcon(b, "check"); setTimeout(function () { setBtnIcon(b, "copy"); }, 1400);
    }).catch(function () { b.textContent = "!"; });
  });
  $("nav").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-tab]"); if (!b) return;
    document.querySelectorAll(".nav button").forEach(function (x) { x.classList.toggle("on", x === b); });
    document.querySelectorAll(".panel").forEach(function (p) { p.classList.toggle("on", p.id === "tab-" + b.getAttribute("data-tab")); });
    window.scrollTo(0, 0);
  });
  var dl = $("dsLogo"); dl.addEventListener("error", function () { dl.hidden = true; });
  if (dl.complete && dl.naturalWidth === 0) dl.hidden = true; // the error may have fired before this script ran
  paintIcons();
})();
