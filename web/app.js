(function () {
  var cfg = window.GPH_CONFIG;
  var params = new URLSearchParams(location.search);
  var MOCK = params.get("mock") === "1";
  var $ = function (id) { return document.getElementById(id); };
  var fmt = function (n) { return Math.round(n).toLocaleString("en-US"); };

  $("baseUrl").textContent = cfg.GATEWAY_URL + "/v1";
  $("mockNotice").hidden = !MOCK;

  // ---- The ONLY place that talks to the gateway. -------------------------------------------
  // Must return { name, active, limitUsd, usedUsd, expires, models[] }.
  // The gateway's per-key balance endpoints are NOT verified yet (notes/HANDOFF.md section 7, item 7).
  // So the real branch tries the candidates below in order and remembers what each one answered
  // (status + field names, never the key) so the owner can see which one works: open the page with ?debug=1.
  var QUOTA_PER_USD = 500000; // new-api: $1 = 500,000 quota units (HANDOFF section 4)
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

  // Candidate A: GET /api/usage/token/  -> { data: { total_granted, total_used, ... } } in quota units
  function tryTokenEndpoint(key) {
    return getJson("/api/usage/token/", key).then(function (r) {
      var d = r.ok && r.json && r.json.data;
      if (!d || typeof d.total_granted !== "number" || typeof d.total_used !== "number") return null;
      return { name: d.name, active: true, limitUsd: d.total_granted / QUOTA_PER_USD,
               usedUsd: d.total_used / QUOTA_PER_USD,
               expires: d.expires_at > 0 ? d.expires_at * 1000 : null,
               models: Array.isArray(d.model_limits) ? d.model_limits : (d.model_limits ? Object.keys(d.model_limits) : []) };
    });
  }

  // Candidate B: OpenAI-style billing: subscription (limit in USD) + usage (total_usage in cents)
  function tryBillingEndpoints(key) {
    return getJson("/v1/dashboard/billing/subscription", key).then(function (sub) {
      var j = sub.json;
      var limit = sub.ok && j ? (j.hard_limit_usd != null ? j.hard_limit_usd : j.system_hard_limit_usd) : null;
      if (typeof limit !== "number") return null;
      return getJson("/v1/dashboard/billing/usage", key).then(function (u) {
        if (!u.ok || !u.json || typeof u.json.total_usage !== "number") return null;
        return { name: "", active: true, limitUsd: limit, usedUsd: u.json.total_usage / 100, expires: null, models: [] };
      });
    });
  }

  function fetchUsage(key) {
    if (MOCK) {
      return new Promise(function (ok) {
        setTimeout(function () {
          ok({ name: "demo-member", active: true, limitUsd: 1.2, usedUsd: 0.43,
               expires: null, models: ["deepseek-flash"] });
        }, 500);
      });
    }
    trace = [];
    return tryTokenEndpoint(key)
      .then(function (d) { return d || tryBillingEndpoints(key); })
      .then(function (d) {
        showTrace(key);
        if (!d) throw new Error(trace.some(function (t) { return t.status === 401; }) ? "BAD_KEY" : "NOT_CONFIGURED");
        return d;
      });
  }

  // Debug panel (?debug=1): shows which endpoint answered with which status. The key itself is never printed.
  function showTrace() {
    if (params.get("debug") !== "1") return;
    var box = $("debug"); box.hidden = false; box.textContent = JSON.stringify(trace, null, 1);
  }
  // -------------------------------------------------------------------------------------------

  function show(data) {
    var perUsd = 1e6 / cfg.USD_PER_MILLION_TOKENS;
    var limit = data.limitUsd * perUsd, used = data.usedUsd * perUsd;
    var left = Math.max(limit - used, 0);
    var pctLeft = limit > 0 ? (left / limit) * 100 : 0;
    $("leftTokens").textContent = fmt(left);
    $("limitTokens").textContent = fmt(limit);
    $("usedTokens").textContent = fmt(used);
    $("expires").textContent = data.expires ? new Date(data.expires).toLocaleDateString() : "Never";
    $("keyName").textContent = data.name || "";
    var chip = $("statusChip");
    chip.textContent = data.active ? "Active" : "Disabled";
    chip.classList.toggle("off", !data.active);
    $("barFill").style.width = pctLeft.toFixed(1) + "%";
    $("bar").classList.toggle("low", pctLeft < 15);
    $("bar").setAttribute("aria-valuenow", pctLeft.toFixed(0));
    var m = $("models"); m.textContent = "";
    (data.models || []).forEach(function (name) {
      var s = document.createElement("span"); s.textContent = name; m.appendChild(s);
    });
    $("result").hidden = false;
  }

  function fail(msg) { var e = $("error"); e.textContent = msg; e.hidden = false; $("result").hidden = true; }

  $("checkBtn").addEventListener("click", function () {
    var btn = this, key = $("keyInput").value.trim();
    $("error").hidden = true;
    if (!MOCK && !key) { fail("Please paste your API key first."); return; }
    btn.disabled = true; btn.textContent = "Checking...";
    fetchUsage(key).then(show).catch(function (err) {
      fail(err.message === "BAD_KEY" ? "The gateway says this key is not valid. Check it and try again."
        : err.message === "NOT_CONFIGURED"
        ? "The gateway did not return balance info for this key. (Owner: open this page with ?debug=1 to see what it answered.)"
        : "Could not check this key. Try again.");
    }).then(function () { btn.disabled = false; btn.textContent = "Check usage"; });
  });

  $("toggleKey").addEventListener("click", function () {
    var i = $("keyInput"), show = i.type === "password";
    i.type = show ? "text" : "password"; this.textContent = show ? "Hide" : "Show";
  });
  $("copyBase").addEventListener("click", function () {
    var b = this;
    (navigator.clipboard ? navigator.clipboard.writeText($("baseUrl").textContent) : Promise.reject())
      .then(function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1500); })
      .catch(function () { b.textContent = "Copy failed"; });
  });
})();
