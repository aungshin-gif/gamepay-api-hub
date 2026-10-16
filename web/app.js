(function () {
  var cfg = window.GPH_CONFIG;
  var params = new URLSearchParams(location.search);
  var MOCK = params.get("mock") === "1";
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n) { return Math.round(n).toLocaleString("en-US"); };
  var state = { key: "", data: null, models: [], ping: null, ms: {}, prev: {}, tilesShown: false, lastAt: null };
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- icons (inline SVG, drawn here so the page needs no image files) ----------
  var ICONS = {
    cube: '<path class="f" d="M12 2.8l8 4.4v9.6l-8 4.4-8-4.4V7.2z"/><path d="M12 2.8l8 4.4v9.6l-8 4.4-8-4.4V7.2z"/><path d="M4 7.2l8 4.4 8-4.4M12 11.6v9.6"/>',
    chat: '<path class="f" d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z"/><path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z"/>',
    book: '<path class="f" d="M12 7C10.4 5.5 7.6 4.7 3.5 5v13c4.1-.3 6.9.4 8.5 2z"/><path class="f" d="M12 7c1.6-1.5 4.4-2.3 8.5-2v13c-4.1-.3-6.9.4-8.5 2z"/><path d="M12 7C10.4 5.5 7.6 4.7 3.5 5v13c4.1-.3 6.9.4 8.5 2z"/><path d="M12 7c1.6-1.5 4.4-2.3 8.5-2v13c-4.1-.3-6.9.4-8.5 2z"/><path d="M6.5 9.4c1.4 0 2.7.3 3.7.9M6.5 12.6c1.4 0 2.7.3 3.7.9M17.5 9.4c-1.4 0-2.7.3-3.7.9M17.5 12.6c-1.4 0-2.7.3-3.7.9"/>',
    key: '<circle class="f" cx="8.2" cy="8.2" r="5.4"/><circle cx="8.2" cy="8.2" r="5.4"/><circle cx="8.2" cy="8.2" r="1.9"/><path d="M12.2 12.2L21 21M17 17l2.4-2.4M14.6 14.6l2-2"/>',
    eye: '<path class="f" d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    "eye-off": '<path d="M3 3l18 18"/><path d="M10.6 6.1A9.8 9.8 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 7.5A17 17 0 0 0 2 12s4 7 10 7a9.6 9.6 0 0 0 4-.9"/>',
    copy: '<rect class="f" x="9" y="9" width="11.5" height="11.5" rx="2.5"/><rect x="9" y="9" width="11.5" height="11.5" rx="2.5"/><path d="M5.5 15H5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 5 4h8a1.5 1.5 0 0 1 1.5 1.5V6"/>',
    check: '<path d="M4.5 12.5l4.8 4.8L19.5 7"/>',
    refresh: '<path d="M20 12a8 8 0 0 1-13.7 5.6M4 12a8 8 0 0 1 13.7-5.6"/><path d="M18 3.5v3.8h-3.8M6 20.5v-3.8h3.8"/>',
    clock: '<circle class="f" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
    activity: '<path d="M2.5 12h4.2l2.6-7 5 14 2.6-7h4.6"/>',
    shield: '<path class="f" d="M12 2.8l7.5 2.8v5.7c0 4.7-3.2 8.2-7.5 9.9-4.3-1.7-7.5-5.2-7.5-9.9V5.6z"/><path d="M12 2.8l7.5 2.8v5.7c0 4.7-3.2 8.2-7.5 9.9-4.3-1.7-7.5-5.2-7.5-9.9V5.6z"/><path d="M8.7 12.2l2.4 2.4 4.4-4.6"/>',
    alert: '<path class="f" d="M12 3.5l9.5 16.5h-19z"/><path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.2M12 17.3h.01"/>',
    calendar: '<rect class="f" x="3.5" y="5" width="17" height="15.5" rx="3"/><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h.01M12 14h.01M16 14h.01M8 17.4h.01M12 17.4h.01"/>',
    send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    trash: '<path class="f" d="M6 6.5l.9 12.6a2 2 0 0 0 2 1.9h6.2a2 2 0 0 0 2-1.9L18 6.5z"/><path d="M6 6.5l.9 12.6a2 2 0 0 0 2 1.9h6.2a2 2 0 0 0 2-1.9L18 6.5"/><path d="M4 6.5h16M9.5 6.5V4.6a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.9M10 11v6M14 11v6"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>',
    play: '<path d="M7 4l13 8-13 8z"/>',
    chevron: '<path d="M6 9l6 6 6-6"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    paste: '<rect class="f" x="5" y="4" width="14" height="17" rx="2.5"/><rect x="5" y="4" width="14" height="17" rx="2.5"/><rect x="9" y="2.5" width="6" height="4" rx="1.3"/><path d="M9 11.5h6M9 15.5h4"/>'
  };
  function svg(name) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || "") + "</svg>"; }
  function paintIcons(root) { (root || document).querySelectorAll("i[data-icon]").forEach(function (e) { e.outerHTML = svg(e.getAttribute("data-icon")); }); }
  function setBtnIcon(btn, name) { btn.innerHTML = svg(name); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  $("baseUrl").textContent = cfg.GATEWAY_URL + "/v1";
  $("baseUrl2").textContent = cfg.GATEWAY_URL + "/v1";
  $("mockNotice").hidden = !MOCK;
  $("snipCurl").textContent = 'curl ' + cfg.GATEWAY_URL + '/v1/chat/completions \\\n  -H "Authorization: Bearer YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"model":"deepseek-flash","messages":[{"role":"user","content":"Hello"}]}\'';
  $("snipPy").textContent = 'from openai import OpenAI\nclient = OpenAI(base_url="' + cfg.GATEWAY_URL + '/v1", api_key="YOUR_KEY")\nr = client.chat.completions.create(model="deepseek-flash",\n    messages=[{"role": "user", "content": "Hello"}])\nprint(r.choices[0].message.content)';

  // ---------- gateway access (the ONLY place that talks to the gateway) ----------
  // fetchUsage must return { name, active, limitUsd, usedUsd, expires, models[] }.
  // /api/usage/token/ is confirmed working with a real key; the billing endpoints stay as a fallback.
  var trace = [];
  function getJson(path, key) {
    return fetch(cfg.GATEWAY_URL + path, { headers: { Authorization: "Bearer " + key } }).then(function (r) {
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
      ok({ name: "demo-member", active: true, limitUsd: 1.2, usedUsd: 0.43, expires: Date.now() + 25 * 864e5, models: ["deepseek-flash", "deepseek-v4-pro", "gpt-6-luna", "gpt-5.4-nano"] }); }, 400); });
    trace = [];
    return tryTokenEndpoint(key).then(function (d) { return d || tryBillingEndpoints(key); }).then(function (d) {
      if (params.get("debug") === "1") { $("debug").hidden = false; $("debug").textContent = JSON.stringify(trace, null, 1); }
      if (!d) throw new Error(trace.some(function (t) { return t.status === 401; }) ? "BAD_KEY" : "NOT_CONFIGURED");
      return d;
    });
  }
  // OpenAI-standard model list (also used as the live ping).
  function fetchModels(key) {
    if (MOCK) return Promise.resolve({ ids: ["deepseek-flash", "deepseek-v4-pro", "gpt-6-luna", "gpt-5.4-nano"], ms: 90 + Math.round(Math.random() * 60) });
    var t0 = performance.now();
    return fetch(cfg.GATEWAY_URL + "/v1/models", { headers: { Authorization: "Bearer " + key } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return { ids: j && Array.isArray(j.data) ? j.data.map(function (m) { return m.id; }) : [], ms: Math.round(performance.now() - t0) }; })
      .catch(function () { return { ids: [], ms: null }; });
  }
  // Real speed test: one tiny chat message. Costs a few tokens. Newer OpenAI models reject max_tokens (unverified against this gateway).
  function testModel(key, model) {
    if (MOCK) return new Promise(function (ok) { setTimeout(function () { ok({ ok: true, ms: 300 + Math.round(Math.random() * 500) }); }, 500); });
    var t0 = performance.now();
    return fetch(cfg.GATEWAY_URL + "/v1/chat/completions", { method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ model: model, messages: [{ role: "user", content: "hi" }] }, providerOf(model).key === "deepseek" ? { max_tokens: 8 } : { max_completion_tokens: 16 })) })
      .then(function (r) { return { ok: r.ok, ms: Math.round(performance.now() - t0), status: r.status }; })
      .catch(function () { return { ok: false, ms: null }; });
  }

  // ---------- helpers ----------
  // Numbers tick from their old value to the new one.
  function countUp(node, to, f, from) {
    node.__a = (node.__a || 0) + 1; var id = node.__a;
    if (reduced || from === to || !isFinite(from)) { node.textContent = f(to); return; }
    var t0 = null, dur = 2200;
    (function step(t) {
      if (node.__a !== id) return; if (t0 == null) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = .5 - .5 * Math.cos(Math.PI * k); // gentle start and finish
      node.textContent = f(from + (to - from) * e); if (k < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  function tick(node, key, to, f) { countUp(node, to, f, state.prev[key] != null ? state.prev[key] : 0); state.prev[key] = to; }
  function logoImg(h, src) { var i = document.createElement("img"); i.src = src; i.alt = ""; i.height = h; i.addEventListener("error", function () { i.hidden = true; }); return i; }
  // Which company a model id belongs to. DeepSeek and OpenAI have logo files; other providers get a neutral letter badge.
  // OpenAI: GPT-5 models use the green logo; GPT-6 (and any other OpenAI model) use the white one.
  function providerOf(id) {
    id = String(id).toLowerCase();
    if (/^deepseek/.test(id)) return { key: "deepseek", name: "DeepSeek", accent: "sky", logo: "assets/deepseek.png" };
    if (/^(gpt|chatgpt|o\d|text-|davinci|codex)/.test(id)) return { key: "openai", name: "OpenAI", accent: "teal", logo: /^gpt-?5/.test(id) ? "assets/openai-green.png" : "assets/openai-white.png" };
    return { key: "other", name: "Other", accent: "violet", logo: null };
  }
  function logoFor(m, h) {
    var p = providerOf(m); if (p.logo) return logoImg(h, p.logo);
    var g = el("span", "glyph", p.name.charAt(0)); g.style.fontSize = Math.round(h * .62) + "px"; return g;
  }
  // Power level from a measured time. A model Test waits for a whole reply, so its scale is longer than the ping scale.
  // These thresholds are a rule of thumb, not an official measure.
  function powerOf(ms, kind) {
    if (ms == null) return ["Not tested", "idle"];
    var t = kind === "test" ? [3000, 8000] : [400, 1200];
    return ms <= t[0] ? ["Fast", "ok"] : ms <= t[1] ? ["Normal", "warn"] : ["Slow", "bad"];
  }
  function mstat(m) { return state.ms[m] || (state.ms[m] = { ms: null, testing: false, failed: "", in: 0, out: 0 }); }
  function pchip(m) { var pw = powerOf(mstat(m).ms, "test"), c = el("span", "pchip " + pw[1]); c.appendChild(el("i", "dot")); c.appendChild(document.createTextNode(pw[0])); return c; }
  function modelIds() { return state.models.length ? state.models : (state.data ? state.data.models : []); }
  // "Powered by": one small badge per company that has a model on this key (DeepSeek by default).
  function updatePowered() {
    var list = [], seen = {};
    modelIds().forEach(function (m) { var p = providerOf(m); if (!seen[p.key] && (cfg.POWERED_HIDE || []).indexOf(p.key) < 0) { seen[p.key] = 1; list.push(p); } });
    $("powered").hidden = !list.length; // nothing to credit until a key has been checked
    var box = $("pchips"); box.textContent = "";
    list.forEach(function (p) {
      var c = el("span", "pbadge"), lg = el("span", "plg");
      lg.appendChild(p.logo ? logoImg(22, p.logo) : el("span", "glyph", p.name.charAt(0)));
      c.appendChild(lg); c.appendChild(el("b", "", p.name)); box.appendChild(c);
    });
  }
  function fail(msg) { var e = $("error"); e.textContent = msg; e.hidden = false; }
  function two(n) { return (n < 10 ? "0" : "") + n; }

  // ---------- Models tab (the main page) ----------
  function applyModels(m) {
    state.models = m.ids; state.ping = m.ms; state.lastAt = new Date();
    var pc = $("pingChip"), pw = powerOf(m.ms, "ping");
    pc.textContent = m.ms != null ? "online · " + m.ms + " ms" : "unreachable"; pc.className = "chip" + (m.ms != null ? (pw[1] === "ok" ? "" : " " + pw[1]) : " off");
    $("liveDot").className = "livedot" + (m.ms != null ? " on" : " off");
    var t = state.lastAt;
    $("liveInfo").textContent = (modelIds().length) + " model" + (modelIds().length === 1 ? "" : "s") + " available · updated " + two(t.getHours()) + ":" + two(t.getMinutes()) + ":" + two(t.getSeconds()) + " · re-checks about every " + Math.round(cfg.LIVE_EVERY_MS / 1000) + "s";
  }
  function renderModels() {
    var box = $("modelList"), ids = modelIds(); box.textContent = ""; updatePowered();
    $("modelHint").hidden = !ids.length;
    if (!ids.length) { box.className = "list"; return; }
    box.className = "mgrid";
    ids.forEach(function (m) {
      var p = cfg.PRICES[m], info = (cfg.MODEL_INFO || {})[m] || {}, st = mstat(m);
      var d = el("div", "mbox a-" + (info.accent || providerOf(m).accent));
      var head = el("div", "mhead"); head.appendChild(el("span", "mlogo")); head.firstChild.appendChild(logoFor(m, 28)); head.appendChild(pchip(m)); d.appendChild(head);
      var mid = el("div", "mmid"); mid.appendChild(el("div", "mname", m)); mid.appendChild(el("div", "mtag", info.tag || (providerOf(m).name + (p ? "" : " · price not set")))); d.appendChild(mid);
      var io = el("div", "io");
      [["Input", p ? "$" + p.input : "--", st.in], ["Output", p ? "$" + p.output : "--", st.out]].forEach(function (r) {
        var b = el("div"); b.setAttribute("data-l", r[0]); b.setAttribute("data-s", r[0] === "Input" ? "In" : "Out"); b.appendChild(el("span", "iol", r[0])); b.appendChild(el("b", "iov", r[1] + " /1M")); b.appendChild(el("span", "ios", fmt(r[2]) + " tokens")); io.appendChild(b);
      }); d.appendChild(io);
      var foot = el("div", "mfoot"), btn = el("button", "small"), res = el("span", "ms");
      btn.type = "button"; btn.disabled = st.testing; btn.innerHTML = svg("play") + "<span>Test</span>";
      if (st.testing) res.textContent = "testing..."; else if (st.failed) { res.className = "ms bad"; res.textContent = st.failed; } else if (st.ms != null) { res.className = "ms ok"; res.textContent = st.ms + " ms"; }
      foot.appendChild(res); foot.appendChild(btn); d.appendChild(foot);
      btn.addEventListener("click", function () {
        st.testing = true; st.failed = ""; renderModels();
        testModel(state.key, m).then(function (r) {
          st.testing = false; st.ms = r.ok ? r.ms : null; st.failed = r.ok ? "" : "failed" + (r.status ? " (" + r.status + ")" : "");
          renderModels(); buildPop();
          if (r.ok) refresh(true);
        });
      });
      box.appendChild(d);
    });
  }
  // Live: re-check the model list while the page is open and visible.
  var liveTimer = null;
  function poll() {
    if (document.hidden || !state.key || !state.data) return;
    fetchModels(state.key).then(function (m) { applyModels(m); renderModels(); buildPop(); });
  }
  function startLive() { if (liveTimer) clearInterval(liveTimer); liveTimer = setInterval(poll, cfg.LIVE_EVERY_MS); }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) poll(); });

  // ---------- My key tab ----------
  function donut(node, pctLeft) {
    var R = 46, C = 2 * Math.PI * R, off = C * (1 - Math.max(0, Math.min(100, pctLeft)) / 100);
    node.classList.toggle("low", pctLeft < 15);
    node.innerHTML = '<svg viewBox="0 0 112 112"><circle class="bg" cx="56" cy="56" r="' + R + '" fill="none" stroke-width="11"/>' +
      '<circle class="fg" cx="56" cy="56" r="' + R + '" fill="none" stroke-width="11" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + C.toFixed(1) + '"/></svg><b>' + Math.round(pctLeft) + '%</b>';
    requestAnimationFrame(function () { node.querySelector(".fg").style.strokeDashoffset = off.toFixed(1); });
  }
  // One tile = one coloured box. o: { icon, label, value, sub, tone, accent, num, f, live, idx }
  function tile(o) {
    var d = el("div", "tile a-" + (o.accent || "blue") + (o.tone ? " " + o.tone : ""));
    d.innerHTML = '<span class="ti">' + svg(o.icon) + '</span><div class="tb"><div class="tl"></div><div class="tv"></div><div class="ts"></div></div>';
    d.querySelector(".tl").textContent = o.label; d.querySelector(".tv").textContent = o.value; d.querySelector(".ts").textContent = o.sub || "";
    if (o.num != null) tick(d.querySelector(".tv"), "t:" + o.label, o.num, o.f || fmt);
    if (o.live) d.classList.add("live");
    if (!state.tilesShown) { d.classList.add("enter"); d.style.setProperty("--i", o.idx || 0); }
    return d;
  }
  function renderKey(data) {
    var per = 1e6 / cfg.BASE_PRICE, limit = data.limitUsd * per, used = data.usedUsd * per, left = Math.max(limit - used, 0);
    var pct = limit > 0 ? left / limit * 100 : 0, days = data.expires ? Math.ceil((data.expires - Date.now()) / 864e5) : null;
    var okKey = data.active && !(days !== null && days <= 0);
    tick($("leftTokens"), "left", left, fmt); $("leftNote").textContent = "of " + fmt(limit) + " (counted at the flash price)";
    $("keyName").textContent = data.name || "";
    var chip = $("statusChip"); chip.textContent = okKey ? "Active" : (data.active ? "Expired" : "Disabled"); chip.classList.toggle("off", !okKey);
    donut($("donut1"), pct);
    var hb = $("heroBar"); hb.style.width = "0%"; $("heroBarWrap").setAttribute("aria-valuenow", Math.round(pct)); $("heroBarWrap").classList.toggle("low", pct < 15);
    requestAnimationFrame(function () { requestAnimationFrame(function () { hb.style.width = pct.toFixed(1) + "%"; }); });
    var box = $("tiles"); box.textContent = "";
    box.appendChild(tile({ idx: 0, live: okKey, icon: "shield", label: "Status", accent: "green", value: chip.textContent, sub: state.ping != null ? "Gateway online" : "Gateway not checked", tone: okKey ? "ok" : "bad" }));
    box.appendChild(tile({ idx: 1, icon: "activity", label: "Used", accent: "rose", num: used, value: fmt(used), sub: Math.round(limit > 0 ? used / limit * 100 : 0) + "% of limit" }));
    box.appendChild(tile({ idx: 2, icon: "calendar", label: "Expires", accent: "orange", value: days === null ? "Never" : (days <= 0 ? "Expired" : days + " days"), sub: data.expires ? new Date(data.expires).toLocaleDateString() : "No expiry date", tone: days !== null && days <= 3 ? "warn" : "" }));
    box.appendChild(tile({ idx: 3, icon: "cube", label: "Models", accent: "violet", value: String(modelIds().length), sub: "allowed for this key" }));
    state.tilesShown = true;
    $("emptyState").hidden = true; $("keyData").hidden = false;
  }

  // ---------- chat ----------
  var STORE = "gph_chat_v1", MAX_HISTORY = 12, MAX_IMAGES = 3;
  var chat = { msgs: [], ctl: null, busy: false, files: [], savedModel: "" };
  var chatEmptyEl = $("chatEmpty"); // keep a reference: Clear empties the list and puts it back
  function saveChat() { // text only. Pictures are never written to storage.
    try { localStorage.setItem(STORE, JSON.stringify({ m: $("chatModel").value, msgs: chat.msgs.slice(-40).map(function (x) { return { r: x.role, t: x.text, i: (x.images || []).length + (x.nImg || 0) }; }) })); } catch (e) {}
  }
  function bubble(kind, text, images, nImg) {
    chatEmptyEl.hidden = true;
    var d = el("div", "msg " + kind);
    if (images && images.length) { var g = el("div", "thumbs"); images.forEach(function (u) { var im = document.createElement("img"); im.src = u; im.alt = "attached picture"; g.appendChild(im); }); d.appendChild(g); }
    else if (nImg) d.appendChild(el("div", "imgnote", nImg + " picture" + (nImg > 1 ? "s" : "") + " (not saved)"));
    if (text) d.appendChild(el("span", "", text));
    $("msgs").appendChild(d); window.scrollTo({ top: document.body.scrollHeight }); return d;
  }
  function loadChat() {
    try {
      var j = JSON.parse(localStorage.getItem(STORE) || "null"); if (!j || !Array.isArray(j.msgs)) return;
      chat.savedModel = j.m || "";
      j.msgs.forEach(function (x) {
        chat.msgs.push({ role: x.r, text: x.t, images: [], nImg: x.i || 0 });
        bubble(x.r === "user" ? "user" : "bot", x.t, null, x.r === "user" ? x.i : 0);
      });
    } catch (e) {}
  }
  function fillChatModels() {
    var sel = $("chatModel"), cur = sel.value || chat.savedModel, ids = modelIds().slice();
    if (!ids.length) ids = Object.keys(cfg.PRICES);
    sel.textContent = "";
    ids.forEach(function (m) { var o = document.createElement("option"); o.value = m; o.textContent = m; sel.appendChild(o); });
    sel.value = ids.indexOf(cur) >= 0 ? cur : (ids.indexOf("deepseek-flash") >= 0 ? "deepseek-flash" : ids[0]);
    buildPop(); updateImgNote();
  }
  // Small model menu that opens right under the model button (not a full-screen sheet).
  function buildPop() {
    var sel = $("chatModel"), list = $("pop"); if (!sel.options.length) return;
    $("modelBtnName").textContent = sel.value; $("modelBtnLogo").textContent = ""; $("modelBtnLogo").appendChild(logoFor(sel.value, 18)); list.textContent = "";
    Array.prototype.forEach.call(sel.options, function (o) {
      var m = o.value, p = cfg.PRICES[m], on = m === sel.value;
      var b = el("button", "opt" + (on ? " on" : "")); b.type = "button"; b.setAttribute("role", "option"); b.setAttribute("aria-selected", on ? "true" : "false"); b.dataset.model = m;
      var lg = el("span", "olg"); lg.appendChild(logoFor(m, 20)); b.appendChild(lg);
      var tx = el("span", "otx"); tx.appendChild(el("b", "", m)); tx.appendChild(el("span", "otag", p ? "$" + p.input + " in · $" + p.output + " out" : providerOf(m).name + " · price not set")); b.appendChild(tx);
      var rt = el("span", "ort"); rt.appendChild(pchip(m)); if (on) { var ck = el("span", "ock"); ck.innerHTML = svg("check"); rt.appendChild(ck); } b.appendChild(rt);
      list.appendChild(b);
    });
  }
  function togglePop(open) {
    var pop = $("pop"), show = open == null ? pop.hidden : open; if (show) buildPop();
    pop.hidden = !show; $("modelBtn").setAttribute("aria-expanded", show ? "true" : "false");
  }
  $("modelBtn").addEventListener("click", function (e) { e.stopPropagation(); togglePop(); });
  $("pop").addEventListener("click", function (e) {
    var b = e.target.closest(".opt"); if (!b) return;
    var sel = $("chatModel"); sel.value = b.dataset.model; sel.dispatchEvent(new Event("change")); togglePop(false); $("modelBtn").focus();
  });
  document.addEventListener("click", function (e) { if (!$("pop").hidden && !$("pickwrap").contains(e.target)) togglePop(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("pop").hidden) { togglePop(false); $("modelBtn").focus(); } });
  $("chatModel").addEventListener("change", function () { buildPop(); updateImgNote(); saveChat(); });

  // pictures: shrunk in the browser, sent with the message, never stored
  function updateImgNote() { $("imgNote").hidden = !(chat.files.length && providerOf($("chatModel").value).key === "deepseek"); }
  function fileToDataUrl(file) {
    return new Promise(function (ok, bad) {
      var rd = new FileReader();
      rd.onerror = function () { bad(new Error("read")); };
      rd.onload = function () {
        var img = new Image();
        img.onerror = function () { bad(new Error("bad image")); };
        img.onload = function () {
          var k = Math.min(1, 1280 / Math.max(img.width, img.height)), c = document.createElement("canvas");
          c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
          var g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
          ok(c.toDataURL("image/jpeg", 0.82));
        };
        img.src = rd.result;
      };
      rd.readAsDataURL(file);
    });
  }
  function renderAttach() {
    var row = $("attachRow"); row.textContent = ""; row.hidden = !chat.files.length;
    chat.files.forEach(function (u, i) {
      var t = el("div", "thumb"), im = document.createElement("img"), x = el("button", "thumbx"); im.src = u; im.alt = "picture to send";
      x.type = "button"; x.setAttribute("aria-label", "Remove picture"); x.innerHTML = svg("x"); x.addEventListener("click", function () { chat.files.splice(i, 1); renderAttach(); updateImgNote(); });
      t.appendChild(im); t.appendChild(x); row.appendChild(t);
    });
    updateImgNote();
  }
  $("attachBtn").addEventListener("click", function () { $("fileInput").click(); });
  $("fileInput").addEventListener("change", function () {
    var list = Array.prototype.slice.call(this.files || []).filter(function (f) { return /^image\//.test(f.type) && f.size < 20e6; }).slice(0, MAX_IMAGES - chat.files.length);
    this.value = "";
    Promise.all(list.map(fileToDataUrl)).then(function (urls) { chat.files = chat.files.concat(urls).slice(0, MAX_IMAGES); renderAttach(); })
      .catch(function () { fail("Could not read that picture."); });
  });

  // Only the newest picture is sent as a picture; older ones become a text note, to keep token use down.
  function apiMessages() {
    var msgs = chat.msgs.slice(-MAX_HISTORY), last = -1;
    msgs.forEach(function (m, i) { if (m.images && m.images.length) last = i; });
    return msgs.map(function (m, i) {
      if (m.images && m.images.length && i === last) {
        return { role: m.role, content: [{ type: "text", text: m.text || "What is in this picture?" }].concat(m.images.map(function (u) { return { type: "image_url", image_url: { url: u } }; })) };
      }
      var t = m.text || ""; if ((m.images && m.images.length) || m.nImg) t += " [picture omitted]";
      return { role: m.role, content: t };
    });
  }
  function streamMock(onDelta, signal) {
    var words = "This is a demo reply. Connect your key to chat for real.".split(" "), i = 0;
    return new Promise(function (ok) { (function tickMock() {
      if (signal.aborted || i >= words.length) return ok({ usage: { prompt_tokens: 10, completion_tokens: 32, total_tokens: 42 } });
      onDelta({ content: (i ? " " : "") + words[i++] }); setTimeout(tickMock, 60); })(); });
  }
  function streamReal(key, model, messages, onDelta, signal) {
    return fetch(cfg.GATEWAY_URL + "/v1/chat/completions", { method: "POST", signal: signal,
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ model: model, messages: messages, stream: true, stream_options: { include_usage: true } }) })
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
  function setBusy(b) { chat.busy = b; var btn = $("chatSend"); btn.innerHTML = svg(b ? "stop" : "send"); btn.setAttribute("aria-label", b ? "Stop" : "Send"); }
  function sendChat() {
    if (chat.busy) { if (chat.ctl) chat.ctl.abort(); return; }
    var input = $("chatInput"), text = input.value.trim(), key = state.key || $("keyInput").value.trim(), imgs = chat.files.slice();
    if (!text && !imgs.length) return;
    if (!MOCK && !key) { fail("Paste your API key above first."); return; }
    $("error").hidden = true; input.value = ""; input.style.height = "auto"; chat.files = []; renderAttach();
    chat.msgs.push({ role: "user", text: text, images: imgs }); bubble("user", text, imgs);
    var bot = bubble("bot", "", null), textNode = document.createElement("span"), answer = "", started = false, model = $("chatModel").value;
    bot.innerHTML = '<span class="dots">Thinking</span>';
    chat.ctl = new AbortController(); setBusy(true);
    var onDelta = function (dl) {
      // The model's reasoning (dl.reasoning_content) is deliberately ignored: only the final answer is shown.
      if (!dl.content) return;
      if (!started) { bot.textContent = ""; bot.appendChild(textNode); started = true; }
      answer += dl.content; textNode.textContent = answer; window.scrollTo({ top: document.body.scrollHeight });
    };
    (MOCK ? streamMock(onDelta, chat.ctl.signal) : streamReal(key, model, apiMessages(), onDelta, chat.ctl.signal)).then(function (res) {
      if (!answer) { bot.textContent = "(empty reply)"; } else { chat.msgs.push({ role: "assistant", text: answer, images: [] }); }
      if (res && res.usage) { var u = res.usage, pi = u.prompt_tokens || 0, po = u.completion_tokens || 0, st = mstat(model); st.in += pi; st.out += po; renderModels();
        if (u.total_tokens) { var sm = document.createElement("small"); sm.textContent = u.total_tokens + " tokens"; bot.appendChild(sm); } }
      saveChat(); if (!MOCK) refresh(true);
    }).catch(function (err) {
      if (err.name === "AbortError") { if (answer) { chat.msgs.push({ role: "assistant", text: answer, images: [] }); saveChat(); } else { bot.remove(); chat.msgs.pop(); } return; }
      bot.className = "msg err"; bot.textContent = err.status === 401 ? "The gateway says this key is not valid."
        : err.status === 402 || err.status === 403 || /quota|balance/i.test(err.message) ? "Out of tokens or not allowed for this model. " + err.message
        : imgs.length ? "The model did not accept the picture (" + (err.message || "error") + "). Try a model that supports images."
        : "Could not get a reply (" + (err.message || "network error") + ").";
      chat.msgs.pop(); // do not keep the unanswered question in the history
    }).then(function () { chat.ctl = null; setBusy(false); });
  }
  $("chatSend").addEventListener("click", sendChat);
  $("chatInput").addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sendChat(); } });
  $("chatInput").addEventListener("input", function () { this.style.height = "auto"; this.style.height = Math.min(this.scrollHeight, 140) + "px"; });
  $("chatClear").addEventListener("click", function () {
    if (chat.ctl) chat.ctl.abort(); chat.msgs = []; chat.files = []; renderAttach();
    var m = $("msgs"); m.textContent = ""; m.appendChild(chatEmptyEl); chatEmptyEl.hidden = false;
    try { localStorage.removeItem(STORE); } catch (e) {}
  });

  // ---------- flow ----------
  function refresh(quiet) {
    var btn = $("checkBtn"), key = state.key = $("keyInput").value.trim();
    $("error").hidden = true;
    if (!MOCK && !key) { fail("Please paste your API key first."); return; }
    if (!quiet) { btn.disabled = true; btn.querySelector("span").textContent = "Checking..."; $("skel").hidden = false; $("modelList").textContent = ""; }
    fetchUsage(key).then(function (d) {
      state.data = d;
      if (quiet) { renderKey(d); return; } // after a model test or a chat only the numbers change
      // Ask for the model list first so everything is drawn once and the numbers can animate.
      return fetchModels(key).then(function (m) { applyModels(m); renderKey(d); renderModels(); fillChatModels(); startLive(); });
    }).catch(function (err) {
      state.data = null; state.models = []; updatePowered(); $("emptyState").hidden = false; $("keyData").hidden = true; $("modelList").textContent = ""; $("modelHint").hidden = true;
      fail(err.message === "BAD_KEY" ? "The gateway says this key is not valid. Check it and try again."
        : err.message === "NOT_CONFIGURED" ? "The gateway did not return info for this key. (Owner: open this page with ?debug=1.)"
        : "Could not check this key. Try again.");
    }).then(function () { $("skel").hidden = true; btn.disabled = false; btn.querySelector("span").textContent = "Check"; });
  }
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
  // Paste: read the clipboard into the key box (the browser may ask permission the first time). Does not check the key by itself.
  var PASTE_HELP = "Could not read the clipboard. Press and hold inside the key box and choose Paste.";
  $("pasteBtn").addEventListener("click", function () {
    var b = this, label = b.querySelector("span");
    if (!navigator.clipboard || !navigator.clipboard.readText) { fail(PASTE_HELP); return; }
    navigator.clipboard.readText().then(function (t) {
      t = (t || "").trim();
      if (!t) { fail("The clipboard is empty. Copy your key first."); return; }
      keyBox.value = t; $("error").hidden = true;
      label.textContent = "Pasted"; setTimeout(function () { label.textContent = "Paste"; }, 1400);
    }).catch(function () { fail(PASTE_HELP); });
  });
  // Clear: forget the key and everything that was loaded with it. Chat text on this device is left alone (use Clear chat for that).
  $("clearKeyBtn").addEventListener("click", function () {
    keyBox.value = ""; state.key = ""; state.data = null; state.models = []; state.ms = {}; state.prev = {};
    if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }
    updatePowered(); fillChatModels();
    $("emptyState").hidden = false; $("keyData").hidden = true; $("modelList").textContent = ""; $("modelHint").hidden = true; $("error").hidden = true;
    keyBox.focus();
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
  loadChat(); fillChatModels(); paintIcons();
})();
