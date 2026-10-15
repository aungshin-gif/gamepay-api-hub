(function () {
  var cfg = window.GPH_CONFIG;
  var params = new URLSearchParams(location.search);
  var MOCK = params.get("mock") === "1";
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n) { return Math.round(n).toLocaleString("en-US"); };
  var usd = function (n) { return "$" + n.toFixed(n < 10 ? 3 : 2); };
  var state = { key: "", data: null, models: [], ping: null, speed: null, speedSrc: "" };

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
      body: JSON.stringify({ model: model, messages: [{ role: "user", content: "hi" }], max_tokens: 8 }) })
      .then(function (r) { return { ok: r.ok, ms: Math.round(performance.now() - t0), status: r.status }; })
      .catch(function () { return { ok: false, ms: null }; });
  }

  // ---------- rendering ----------
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
  function tile(icon, label, value, sub, tone, meterPct) {
    var d = document.createElement("div"); d.className = "tile" + (tone ? " " + tone : "");
    d.innerHTML = '<span class="ti">' + svg(icon) + '</span><div><div class="tl"></div><div class="tv"></div><div class="ts"></div></div>';
    d.querySelector(".tl").textContent = label; d.querySelector(".tv").textContent = value; d.querySelector(".ts").textContent = sub || "";
    if (meterPct != null) { var m = document.createElement("div"); m.className = "meter"; m.innerHTML = "<i></i>"; m.firstChild.style.width = Math.max(0, Math.min(100, meterPct)) + "%"; d.querySelector("div").appendChild(m); }
    return d;
  }
  // Power = how fast the gateway answers. Source is the last model Test if there is one, otherwise the gateway ping.
  // Thresholds are a simple rule of thumb, not an official measure.
  function renderTiles() {
    var data = state.data, box = $("tiles"); if (!data) return; box.textContent = "";
    var per = 1e6 / cfg.BASE_PRICE, limit = data.limitUsd * per, used = data.usedUsd * per, left = Math.max(limit - used, 0);
    var leftUsd = Math.max(data.limitUsd - data.usedUsd, 0), pctUsed = limit > 0 ? used / limit * 100 : 0;
    var days = data.expires ? Math.ceil((data.expires - Date.now()) / 864e5) : null;
    box.appendChild(tile("shield", "Status", data.active ? (days !== null && days <= 0 ? "Expired" : "Active") : "Disabled",
      state.ping != null ? "Gateway online" : "Gateway not checked", data.active && !(days !== null && days <= 0) ? "ok" : "bad"));
    var sp = state.speed != null ? state.speed : state.ping;
    var lvl = sp == null ? ["--", "", "No data yet"] : sp <= 400 ? ["Fast", "ok"] : sp <= 1200 ? ["Normal", "warn"] : ["Slow", "bad"];
    box.appendChild(tile("power", "Power", lvl[0], sp == null ? "Run a model test" : sp + " ms (" + (state.speedSrc || "gateway ping") + ")", lvl[1]));
    box.appendChild(tile("zap", "Tokens left", fmt(left), "of " + fmt(limit), "", limit > 0 ? left / limit * 100 : 0));
    box.appendChild(tile("activity", "Tokens used", fmt(used), Math.round(pctUsed) + "% of limit", "", pctUsed));
    box.appendChild(tile("coin", "Credit left", usd(leftUsd), "of " + usd(data.limitUsd)));
    box.appendChild(tile("calendar", "Expires", days === null ? "Never" : (days <= 0 ? "Expired" : days + " days"), data.expires ? new Date(data.expires).toLocaleDateString() : "No expiry date", days !== null && days <= 3 ? "warn" : ""));
    box.appendChild(tile("cube", "Models", String(state.models.length || data.models.length), "allowed for this key"));
    box.appendChild(tile("clock", "Price (flash)", "$" + cfg.PRICES["deepseek-flash"].input, "per 1M tokens"));
  }
  function renderOverview(data) {
    var per = 1e6 / cfg.BASE_PRICE, limit = data.limitUsd * per, used = data.usedUsd * per, left = Math.max(limit - used, 0);
    var leftUsd = Math.max(data.limitUsd - data.usedUsd, 0), pct = limit > 0 ? left / limit * 100 : 0;
    $("leftTokens").textContent = fmt(left); $("limitTokens").textContent = fmt(limit); $("usedTokens").textContent = fmt(used);
    $("leftUsd").textContent = "(about " + usd(leftUsd) + " of credit)";
    $("expires").textContent = data.expires ? new Date(data.expires).toLocaleDateString() : "Never";
    $("keyName").textContent = data.name || "";
    var chip = $("statusChip"); chip.textContent = data.active ? "Active" : "Disabled"; chip.classList.toggle("off", !data.active);
    donut($("donut1"), pct); renderTiles();
    $("emptyState").hidden = true; $("overviewData").hidden = false;
    // credit tab
    $("creditEmpty").hidden = true; $("creditData").hidden = false;
    $("creditUsd").textContent = usd(leftUsd); $("creditPct").textContent = Math.round(pct) + "% of " + usd(data.limitUsd) + " left";
    donut($("donut2"), pct); $("lowWarn").hidden = pct >= 15;
    var rw = $("runway"); rw.textContent = "";
    Object.keys(cfg.PRICES).forEach(function (m) {
      var p = cfg.PRICES[m], hi = leftUsd / Math.min(p.input, p.output) * 1e6, lo = leftUsd / Math.max(p.input, p.output) * 1e6;
      item(rw, m, "$" + p.input + " in / $" + p.output + " out per 1M tokens", null);
      var sub = rw.lastChild.querySelector(".sub"); sub.textContent += " · about " + (Math.round(lo) === Math.round(hi) ? fmt(lo) : fmt(lo) + " to " + fmt(hi)) + " tokens";
    });
  }
  function renderModels() {
    var box = $("modelList"); box.textContent = "";
    var ids = state.models.length ? state.models : (state.data ? state.data.models : []);
    if (!ids.length) { box.innerHTML = '<p class="muted">No models returned for this key.</p>'; return; }
    ids.forEach(function (m) {
      var p = cfg.PRICES[m], btn = document.createElement("button"), ms = document.createElement("span"), wrap = document.createElement("div");
      btn.type = "button"; btn.className = "small"; btn.innerHTML = svg("play") + "<span>Test</span>";
      ms.className = "ms"; wrap.className = "right"; wrap.appendChild(ms); wrap.appendChild(btn);
      item(box, m, p ? "$" + p.input + " in / $" + p.output + " out per 1M tokens" : "Price not listed", wrap);
      btn.addEventListener("click", function () {
        btn.disabled = true; ms.className = "ms"; ms.textContent = "testing...";
        testModel(state.key, m).then(function (r) {
          ms.className = "ms " + (r.ok ? "ok" : "bad"); ms.textContent = r.ok ? r.ms + " ms" : "failed" + (r.status ? " (" + r.status + ")" : "");
          btn.disabled = false; if (r.ok) { state.speed = r.ms; state.speedSrc = "model test"; refresh(true); }
        });
      });
    });
  }
  function fail(msg) { var e = $("error"); e.textContent = msg; e.hidden = false; }

  // ---------- flow ----------
  function refresh(quiet) {
    var btn = $("checkBtn"), key = state.key = $("keyInput").value.trim();
    $("error").hidden = true;
    if (!MOCK && !key) { fail("Please paste your API key first."); return; }
    if (!quiet) { btn.disabled = true; btn.querySelector("span").textContent = "Checking..."; }
    fetchUsage(key).then(function (d) {
      state.data = d; renderOverview(d);
      if (quiet) return; // after a model test only the numbers change; keep the test results on screen
      return fetchModels(key).then(function (m) {
        state.models = m.ids; state.ping = m.ms; renderTiles(); var pc = $("pingChip");
        pc.textContent = m.ms != null ? "gateway " + m.ms + " ms" : "gateway unreachable"; pc.className = "chip" + (m.ms != null ? "" : " off");
        renderModels();
      });
    }).catch(function (err) {
      state.data = null; $("emptyState").hidden = false; $("overviewData").hidden = true; $("creditEmpty").hidden = false; $("creditData").hidden = true;
      fail(err.message === "BAD_KEY" ? "The gateway says this key is not valid. Check it and try again."
        : err.message === "NOT_CONFIGURED" ? "The gateway did not return balance info for this key. (Owner: open this page with ?debug=1.)"
        : "Could not check this key. Try again.");
    }).then(function () { btn.disabled = false; btn.querySelector("span").textContent = "Check"; });
  }
  $("checkBtn").addEventListener("click", function () { refresh(false); });
  $("keyInput").addEventListener("keydown", function (e) { if (e.key === "Enter") refresh(false); });
  $("toggleKey").addEventListener("click", function () {
    var i = $("keyInput"), show = i.type === "password"; i.type = show ? "text" : "password"; setBtnIcon(this, show ? "eye-off" : "eye");
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
