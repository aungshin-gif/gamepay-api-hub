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
  // The real per-key endpoint is NOT verified yet (see notes/HANDOFF.md section 7, item 7).
  // Until the owner confirms one with curl, the real branch fails loudly instead of guessing.
  function fetchUsage(key) {
    if (MOCK) {
      return new Promise(function (ok) {
        setTimeout(function () {
          ok({ name: "demo-member", active: true, limitUsd: 1.2, usedUsd: 0.43,
               expires: null, models: ["deepseek-flash"] });
        }, 500);
      });
    }
    return Promise.reject(new Error("NOT_CONFIGURED"));
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
      fail(err.message === "NOT_CONFIGURED"
        ? "This page is not connected to the gateway yet (owner still needs to confirm the balance endpoint). Try ?mock=1 to preview."
        : "Could not check this key. Check it and try again.");
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
