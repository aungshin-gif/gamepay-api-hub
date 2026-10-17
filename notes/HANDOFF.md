> **Moved 2026-10-16:** this project now lives in the `gamepay-api-hub` repo (notes under `notes/`). Paths below that say `_notes/api-gateway/` mean `notes/` here.

# API Gateway project: handoff for the next AI session

Written 2026-10-15 at the end of a long chat. **Read this whole file before doing anything.**
Also read `/CLAUDE.md` (GamePay Hub store rules): everything there still applies (reply in Burmese,
mentor tone, no PR unless the owner says "Pr", never ask for secrets, etc.).

This file contains **no secrets** and must stay that way. Keys, passwords and admin usernames are held
by the owner only. If you need one, tell the owner *where to paste it themselves*; never ask them to
post it in chat.

---

## 1. Who the owner is and how to work with them

- Burmese speaker, "vibe coder": cares about the mental model and the result, not syntax.
- Works mostly from a **tablet/phone**, sends **screenshots**, types fast with typos. Read generously.
- **Reply in Burmese**, mentor / co-founder tone. Explain the *why*. One step at a time; do not dump
  huge walls of instructions. When they are stuck, shrink the task to **one action** and ask for a screenshot.
- They get frustrated when many things go wrong in a row (this happened: Railway errors, paste bugs).
  Acknowledge it in one line, then give the single next action.
- **Be honest about uncertainty.** Say "I can't see your screen / I haven't verified this" rather than guess.
  The owner explicitly asked for "precise answers"; label guesses as guesses.
- The Claude cloud sandbox **cannot reach** Railway, the Gateway, DeepSeek or gamepayhub.shop
  (WebFetch fails with ENOTFOUND). `WebSearch` works. You cannot click the owner's dashboards for them:
  give exact steps and let them do it.
- Owner pastes secrets into screenshots by accident. Warn politely ("crop/cover the key"), and
  recommend rotating anything that appeared in chat.

## 2. The two projects

| | Project A: GamePay Hub | Project B: API Gateway (this file) |
|---|---|---|
| What | Digital-products store for Myanmar customers | Own LLM API gateway to issue limited-quota API keys |
| Where | This repo (static site on GitHub Pages + Supabase) | Railway (no code in this repo) + notes here |
| Doc | `/CLAUDE.md` | this file |

They will be linked: Project B should get a **token-usage page** on the GamePay site (see section 7).

## 3. Goal of Project B (owner's words, condensed)

1. Run **their own gateway** (new-api) so *they* can mint API keys with per-key limits.
2. Use it for themselves: a chatbot, VS Code, Termux scripts.
3. **Team project**: give each member a key worth about **1M tokens of DeepSeek flash** as a giveaway.
4. **The owner decided NOT to resell** (after reading the compliance terms and upstream terms).
   Giveaway / own use only. Do not drift back to "selling tokens" without the owner raising it.
5. Build a **web page** on a new URL: user pastes their key, sees **limit, used, left**, picks a model.
6. Produce a **PDF book** about the whole journey so another vibe coder can clone it (see `BOOK_BRIEF.md`).

## 4. Current state (verified from the owner's screenshots on 2026-10-15)

### Infrastructure
- **Railway** project named `perceptive-laughter`, deployed from the community template
  **`new-api-template`** (railway.com/deploy/new-api-template). It runs three services:
  `new-api` (the gateway), `MySQL`, `Redis`, with volumes `new-api-volume` and `mysql-volume`.
- Railway account is on a **"Limited Trial: 30 days or $5.00"** banner. Usage is billed per use;
  three services may burn the $5 faster than a single VPS would. **Not yet verified**: monthly cost.
  A usage limit should be set in Railway.
- Gateway public URL (Railway-generated): `https://new-api-production-6f0d.up.railway.app`
  (the very first deployment used `...447a...`; it was deleted and redeployed after the owner
  lost the root password). Custom domain `api.gamepayhub.shop` is **planned, not done**
  (Railway "Custom Domain" + a CNAME at Hostinger DNS).
- Gateway software: **new-api** (QuantumNous), UI shows version `v1.0.0-rc.44`. License AGPL-3.0.

### Gateway configuration
- Setup wizard done: usage mode **External operations** (multi-user, billing and quota control).
- A **root admin** exists (credentials kept by the owner). Sidebar then shows an ADMIN section:
  Channels, Models, Users, Redemption Codes, Subscriptions, System Info, Task Plugins, System Settings.
- **Compliance terms confirmed** by the owner (System Settings -> Billing & Payment -> Payment Gateway).
  This unlocked redemption codes / payment / subscription / invitation rewards. The terms include:
  lawful authorization for upstream APIs/keys, no unauthorized resale or trafficking, owner bears all
  legal responsibility. (The confirm box needs 4 text fields typed exactly; a typo "deloyment" blocked it once.)
- **Channel**: type DeepSeek, name `DeepSeek`, Base URL left empty (built in), group `default`,
  Single Key mode, models fetched with *Fetch from Upstream*: `deepseek-flash`, `deepseek-v4-pro`.
- **Model pricing** (Models -> model -> Pricing tab -> **Expression** tab, Visual editor, tier `base`, per token, USD per 1M):
  - `deepseek-flash`: **Input 1.2 / Output 1.2** (uniform on purpose, see section 5)
  - `deepseek-v4-pro`: **Input 1.32 / Output 3.96** (DeepSeek peak prices)
  - Cache price fields left off (cache hits are billed at the normal input price: safer).
  - Do **not** use the "Per-token (deprecated)" tab.
  - Before pricing was set, unpriced models showed a placeholder **Input 75 / Output 75 USD per 1M**
    and Playground said "Model Price Not Configured".
- Quota unit: **$1 = 500,000 quota units**. The root user started with a large default balance
  ($200 shown; now $209.97 after the owner redeemed a $10 code to test redemption).
  That balance is an internal ledger number, **not real money**.
- Redemption code system tested: admin created a code ("Karinas", $10), redeemed it in Wallet. Works.
  "Online topup" (Epay/Stripe/...) is not configured and not needed.

### DeepSeek side (real money)
- Account topped up **$2.00** with the owner's Visa card (works from Myanmar). Balance about **$1.99**.
- "Balance alert" is **disabled** (should be enabled).
- Usage dashboard lags **up to 5 minutes**. Verified: Gateway and DeepSeek counts matched
  (3 requests / 1,239 tokens at the time of checking).
- Official DeepSeek prices seen on `api-docs.deepseek.com/quick_start/pricing` (USD per 1M tokens):

| | flash off-peak | flash **peak** | pro off-peak | pro **peak** |
|---|---|---|---|---|
| input, cache hit | 0.003 | 0.006 | 0.022 | 0.044 |
| input, cache miss | 0.15 | **0.3** | 0.66 | **1.32** |
| output | 0.6 | **1.2** | 1.98 | **3.96** |

  Off-peak is half of peak. Peak = 01:00-04:00 and 06:00-10:00 UTC, Mon-Fri, excluding Chinese
  public holidays (= 07:30-10:30 and 12:30-16:30 Myanmar time). Model name to use is `deepseek-flash`
  (legacy `deepseek-v4-flash` still accepted). flash defaults to **thinking mode**: reasoning tokens are
  billed as output (a "hi" used 35 completion tokens, 25 of them reasoning). Prices change; re-check the page.

### Tested end to end
- Gateway Playground (uses the logged-in session; **needs no API key**, which is why deleting the key did not stop it).
- Termux `curl` against `/v1/chat/completions` with a capped test key: worked, 66 tokens.
- A small **Python chat script that shells out to curl** (`chat.py`, full source in `BOOK_BRIEF.md`) works:
  67 tokens = $0.000080; 1,186 tokens = $0.001423, which matches 1.2 $/M. Plain Python `urllib` failed
  with `IncompleteRead` against the Railway edge; using `curl` fixed it.

## 5. Key concepts the owner now understands (keep explanations consistent)

Three limits stack; **the smallest wins**:

```
(1) DeepSeek real balance   <- the only real money, the true ceiling
(2) Gateway user balance    <- internal ledger per user (root = ~$200 default; admin can edit)
(3) Per-API-key quota       <- what we give each member
```

- Playground / UI uses the **user session** and spends the **user balance**. External apps use an
  **API key** and spend the key quota (and the user balance behind it).
- Gateway deducts at **our configured price**, not DeepSeek's. Quota = tokens x price. We price at
  DeepSeek's *peak* price so we never lose money; off-peak and cache hits leave a cushion.
- **"1M tokens" giveaway**: Gateway limits are in dollars. Setting flash input = output = 1.2 makes
  **quota $1.2 = exactly 1M tokens (input+output)**; $0.6 = 500K; $3.6 = 3M.
  Worst case real cost is $1.2 per 1M (all output, peak); typical is less. Downside: input-heavy users burn quota faster than true cost.
- Credit = a wallet so many users can share one upstream key without overspending. For one owner it is invisible.
- Per-member keys beat handing out the DeepSeek key: DeepSeek per-key spend caps were **not found**
  (unverified), the Gateway gives caps, revocation, per-key logs, and hides the upstream key.
- Without a Gateway the owner alone could just put the DeepSeek key straight into VS Code.
  The Gateway is worth it only for distributing limited access to others.

## 6. Create API Key form (seen 2026-10-15)

Fields: **Name**, **Group** (pick `default`), **Expiration Time** (Never / 1M / 1 Day / 1H / date),
**Quantity** (creates several keys with random suffixes), **Quota (USD)** (default 10 - change it!),
**Unlimited Quota** toggle (leave off), collapsed **Advanced Settings** (access restrictions; contents
**not yet inspected**, likely model limits and IP rules). For a 1M-token member key: Quota **1.2**,
model limit `deepseek-flash` only (so they cannot use the 3x pricier pro), optional expiry.
Member needs: Base URL `https://<gateway>/v1`, the key, model `deepseek-flash`.

## 7. Next steps, in priority order

1. **Security clean-up** (nothing leaks until these are done):
   - A DeepSeek key appeared in a screenshot early on. The owner said they re-created keys; **verify**
     on DeepSeek's API keys page that only the key used by the Channel remains (use the *Last used* column).
   - A Gateway test key (capped at $1.2) was pasted into chat. **Delete it** and issue real member keys fresh.
   - Check **System Settings -> Authentication**: disable open public sign-up if members do not need accounts
     (an accidental self sign-up once created a normal user "ID 2" instead of root).
   - Enable 2FA under "Security & Access" if available. Keep the root password in a password manager.
2. DeepSeek: **enable Balance alert**; top up before handing out keys (keys issued x $1.2 worst case must stay under the balance).
3. Check Gateway **Usage Logs** vs DeepSeek Usage match for a fresh test (was already matching once).
4. Inspect **Advanced Settings** on Create API Key; issue **one** member key, test it, then the rest.
5. Set a **Railway usage limit** and watch the $5 trial; decide Railway vs a small VPS (2 GB RAM is probably
   enough but new-api publishes no minimum; unverified).
6. Optional: custom domain `api.gamepayhub.shop`.
7. **Token usage page** (owner's wish): user enters their key, page shows limit / used / left, with a bar.
   - **Unverified and must be tested first**: whether new-api lets a plain API key read its own balance.
     Candidates seen only from memory, not confirmed: `GET /api/usage/token/` and
     `GET /v1/dashboard/billing/subscription` + `/v1/dashboard/billing/usage`. Give the owner a `curl` to try in Termux.
     Some gateways require an *admin* token for balance lookups; **never put an admin token in a public web page.**
   - If a per-key endpoint works, a static page on the GamePay site (GitHub Pages) can call it from the browser
     (check CORS). If it needs an admin token, the page needs a tiny server-side proxy instead (e.g. a Supabase Edge
     Function holding the secret). Use the GamePay design language (see `/CLAUDE.md`).
   - Owner idea: user picks a model, enters an "access key", and sees remaining quota decrease as they use it.
8. Other providers (OpenAI etc.) are possible as extra Channels. **Reselling/trading keys breaks OpenAI's
   Services Agreement** (sections about account resale and API-key trading); Myanmar was listed as a supported
   country when checked. Owner is not reselling, but still advise reading each provider's terms.
9. The PDF book: see `BOOK_BRIEF.md`.

## 8. Where to keep things (the owner asked "one repo or two?")

Recommendation given: keep the API-project notes **in this repo** (`_notes/api-gateway/`) because the
GamePay `CLAUDE.md` is auto-loaded by every session and the usage page will live on the same domain,
so relative links keep working. Two caveats:
- GitHub Pages publishes this whole repo from `mainu` (Jekyll, source `./`). Jekyll **skips folders that start with
  `_`**, so `_notes/` is not served on the website; the repo itself may still be public, so never commit secrets.
- Anything outside `_notes/` (including a `.md` in the root) is published. `/CLAUDE.md` itself is probably public already.
If the usage page grows into a real app (backend, build step), move it to its own repo/subdomain and keep notes here.

## 9. Mistakes and gotchas already hit (do not repeat)

- Pasted `cat > chat.py` into the **running** chat prompt (`You:`): it became chat input. Only paste at `~ $`.
- Termux single-line paste sometimes inserts `[200~ ... ~` and breaks the command: type short commands by hand.
- Plain Python `urllib` hit `IncompleteRead` on the Railway edge; shelling out to `curl` works.
- Compliance confirm box: four fields must match exactly; one-letter typo blocks it.
- Logging in with **Sign up** instead of **Login** created a normal user (ID 2) and hid the ADMIN menu.
- Deploying a deleted project's old `/new/template/...` URL gives Railway's "Oh No! the train derailed"; start fresh from the dashboard.
- Saving `Input 0 / Output 0` would make a model free. Never save a pricing form with zeros.
- Do not save pricing from the deprecated Per-token tab (its Completion price toggle is off and shows default $15).
- Asking the AI inside chat "how do I switch models?" does nothing; model is set by the client (`MODEL` in `chat.py`, or the model picker).
- Quota in `chat.py` cost line is hard-coded 1.2 and wrong for the pro model.

## 10. Open questions for the owner (ask once, early)

- Did they already delete the old DeepSeek key and the Gateway test key?
- How many team members, and what quota each (300K / 500K / 1M)?
- Railway trial vs staying on Railway after the trial?
- Which "template" meaning for the book (Railway template, prompt templates, CLAUDE.md memory file, or all)?

---

## Update 2026-10-16: dashboard direction (read this before changing `web/`)

- **Credit / redeem / top-up were removed from the dashboard on the owner's decision** ("it made everything messy"). The page is now a
  **live model-status page + chat + key viewer**. Accounts, codes and key creation, if wanted later, are done in the Gateway's own
  console (new-api has Wallet / Redemption Codes / API keys). A custom account system (e.g. Supabase + an Edge Function holding a
  gateway admin token) was discussed and judged big and risky; nothing was built. The gateway admin API for changing a key's quota
  was never verified.
- `web/` pages: **Models** (default: live gateway ping, one square box per model with Power / Input / Output / Test), **Chat**
  (streaming, small model menu under the button, picture upload, text history kept in `localStorage` on the device only,
  pictures never stored), **My key** (tokens left, status, expiry), **Guide**.
- Facts confirmed with the real gateway: `/api/usage/token/` works with a key; `/v1/models` works; chat streaming works; CORS is open.
- Not verified: pictures with DeepSeek models (may not be supported), OpenAI models through the gateway (no channel yet; their
  prices must be set in the gateway and in `web/config.js` `PRICES`), `max_completion_tokens` for the Test button on non-DeepSeek models.
- The chat hides the model's reasoning (`reasoning_content`) on purpose; those tokens are still billed.


---

## Update 2026-10-16 (late): state of `web/` and how to continue

**Live site**: https://aungshin-gif.github.io/gamepay-api-hub/ (GitHub Pages, deploys from `main`, root `index.html` redirects to `web/`).
Repo is public on purpose (free Pages). **Never commit keys, passwords, admin tokens or the gateway admin login.**

**What `web/` is now**: a key-based, read-mostly dashboard + chat for the gateway. No accounts, no credit, no redeem.
- Tabs in this order: **My key** (default) · **Chat** · **Models** · **Guide**.
- **Models**: live ping (re-check about every 60 s), two-column grid of model boxes (square at 481px and up, grow to fit content on phones), Power / Input / Output / Test.
- **Chat**: streaming; reasoning hidden; small model menu under the button; up to 3 pictures (shrunk in the browser, only the newest picture is sent, never stored); chat text saved in `localStorage` only; Clear deletes it.
- **Powered by**: top-right on phones, hidden until a key is checked, one badge per provider on that key, providers listed in `POWERED_HIDE` (now `openai`) are skipped.
- Settings live in `web/config.js` (gateway URL, prices, model tags, `POWERED_HIDE`, `LIVE_EVERY_MS`). Gateway calls are only in `web/app.js` (`fetchUsage`, `fetchModels`, `testModel`, `streamReal`).
- Demo with fake numbers: add `?mock=1`. Debug trace of gateway answers: `?debug=1`.

**Confirmed with the real gateway**: `/api/usage/token/`, `/v1/models`, chat streaming, open CORS.
**Not verified (do not assume)**: pictures with DeepSeek models; any OpenAI channel (none exists; prices unset); `max_completion_tokens` in the Test call for non-DeepSeek models; the gateway's redeem / wallet URL (owner could not find Redeem in a test account); gateway admin API for changing a key's quota; DeepSeek's resale terms (page could not be opened); a per-model usage / uptime history (would need a log endpoint or server-side storage).

**Decisions already made by the owner**
- Credit / redeem / top-up were removed ("it made everything messy"). Members are not given accounts on this page. If wanted later, accounts, codes and key creation use the **gateway's own console** (new-api), not a custom system.
- Not reselling. Giveaway / own use. Re-read OpenAI's and DeepSeek's terms before changing that.
- The owner asked for: no AI reasoning shown, no OpenAI badge, My key first, Models third, two model boxes side by side on phones, flat (not glossy) buttons.

**Still open for the owner**: security clean-up (old DeepSeek key, the test key pasted in chat, close public sign-up, 2FA, DeepSeek balance alert), Railway usage limit, optional custom domain, an OpenAI channel + prices, an OpenAI logo file if wanted (none supplied).

**Working notes for the next AI**
- "Pr and merge (ur self)" = open a PR into `main` and squash-merge it. Without "Pr", only commit and push.
- Before restarting the branch from `main`, run `git log origin/main..HEAD` and make sure nothing unmerged is lost (a reset once dropped a commit; it was recovered with `git cherry-pick`).
- Push with `--force-with-lease=<branch>:<sha-from-ls-remote>` because the branch is reset after each squash merge. The stop hook may say "unpushed" when the local remote-tracking ref is missing: confirm `git ls-remote` equals `HEAD`, then `git update-ref refs/remotes/origin/<branch> HEAD`. The hook can take over 40 s; give it 110 s.
- Test with Playwright (in `/opt/node-tools`, Chromium in `/opt/pw-browsers`) against `python3 -m http.server`, stubbing the gateway with `page.route`. Test at 320, 390, 600 and 820 px, look at the screenshots, and say what could not be checked (real-device look, frame rate, Myanmar font: the sandbox has none).
- **Reply in Burmese, always, including when answering automated task notifications** (a few replies once slipped into Japanese by mistake).

## Update 2026-10-16 (OpenAI logos)

- Owner supplied two OpenAI logo files; they are in `web/assets/` as `openai-white.png` (black mark on white) and `openai-green.png` (white mark on green tile), resized to 160 px.
- `providerOf()` in `web/app.js`: model ids starting `gpt-5` / `gpt5` get the green logo; every other OpenAI id (GPT-6, o-series, etc.) gets the white one. The mapping is a guess from the owner's words ("6 -> white, 5 -> green"), so ask if it should change.
- Logos show in the Models boxes, the Chat model menu and the picker. The header "Powered by" badge still hides OpenAI (`POWERED_HIDE`), as the owner asked earlier.
- Demo mode (`?mock=1`) now lists `gpt-6-luna` and `gpt-5.4-nano` so the logos can be previewed. No OpenAI prices were added; set them in the gateway and `PRICES` once a channel exists (never zero).
- Checked with Playwright at 390 and 820 px in demo mode: logos load, no console errors. Not checked: real device look, and real OpenAI model ids from the gateway (no channel yet).

## Update 2026-10-16 (key buttons and button texture)

- **My key** card now has a second row: **Paste** (reads the clipboard into the key box, needs the browser's clipboard permission, does not check the key by itself), **Clear** (empties the key box, stops the live ping, hides the key data and model boxes; chat text on the device is kept) and **Check**. The "Check" label is no longer hidden on phones.
- All buttons got a matte, soft-touch look (faint top light, thin darker bottom edge, soft shadow, pressed buttons sink in). It is still not glossy, in line with the earlier "flat, not glossy" request; tell the owner if they want it flatter or richer.
- Checked with Playwright (demo mode) at 320, 390 and 820 px: paste, clear, empty clipboard message, no console errors, no horizontal scroll. Not checked: real clipboard permission prompt on the owner's tablet, real device look.

## Update 2026-10-16 (icons)

- Icons in `web/app.js` (`ICONS`) were redrawn as soft two-tone icons: a faint filled shape (class `f`, styled in `styles.css` as `svg.ic .f`) under a clean 1.8 px outline. Redrawn: key, eye, copy, check, refresh, clock, shield, alert, calendar, activity, cube, trash, paste. Others (chat, book, image, send, stop, play, chevron, x, eye-off) are unchanged.
- The key icon next to "Your API key" is larger and blue. Checked at 320/390 px in demo mode (no overflow, no console errors); real device look not checked.
- Also redrawn the same way: the Guide book icon (open book with text lines) and the Chat bubble, so all four nav icons match.
- The key icon itself was redesigned (round bow with a ring, diagonal shaft, two teeth). Owner asked for a different key shape, not just new styling; ask if they want another shape (for example an upright classic key).

## Update 2026-10-16 (slower status animations)

- Owner asked for slower, calmer status animations. Count-up numbers now take 2.2 s with a gentle sine ease (`countUp` in `web/app.js`); the ring fills in 2 s, the token bar in 2.2 s, the tiles rise in 1.1 s one after another (160 ms apart), the bar's shimmer loop is 5 s and the "live" pulses are 3.6 to 4 s. All in `web/styles.css`. Tab switching and button presses were not slowed. Reduced-motion users still get no animation.
- Checked in demo mode by sampling the numbers over time (smooth 0.4 s to 2.8 s). Not checked: how it feels on the real tablet; say if it should be slower or faster.

## Update 2026-10-16 (Chat tab layout, 3D intro, tap highlight)

- The key box ("Your API key" card) is now hidden on the **Chat** tab (`body[data-tab="chat"] #keyCard` in `web/styles.css`; the tab name is set by `showTab()` in `web/app.js`). Chat moves to the top. If no key has been entered, Chat shows a short note with an "Open My key" button (`#chatNeedKey`) and does not send.
- New intro card at the top of Chat: a slow 3D gyroscope made of three gradient-line rings (pure CSS, `.orbit`), diagonal gradient lines in the background, a moving gradient line under the text, and two chips "DeepSeek" and "OpenAI" (text: "Chat supports"). Animations switch off for reduced-motion users.
- The big blue rectangle that flashed behind tapped buttons on the tablet was the browser's tap highlight. Fixed with `-webkit-tap-highlight-color: transparent` on `*`. Keyboard focus rings are unchanged.
- Checked in demo and real (no key) mode at 390 px: no console errors, no horizontal scroll. Not checked on the real tablet.
- Gateway now lists GPT models (`gpt-5.3-codex`, `gpt-5.5-pro`, `gpt-5.6-luna`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-6-luna`, `sora-2-pro`). Their prices were NOT set in the gateway or in `web/config.js` when this was written. Plan agreed in chat: charge OpenAI list price (same idea as DeepSeek peak price), set in the gateway first, then copy the same numbers into `PRICES` here. Do not guess numbers; get them from the owner or the official OpenAI pricing page (not reachable from the sandbox). `sora-2-pro` is a video model, not token-priced: remove it from member keys.

## Update 2026-10-16 (Start page)

- New default tab **Start** (landing page, first in the nav): dark hero with slow-moving code lines behind it (`.codebg`, built in `codeRain()` in `web/app.js`), "Get started" button (opens My key) and a **Telegram support** button (`SUPPORT_TELEGRAM` in `web/config.js`, shown only when set). The key box is hidden on Start and Chat.
- **Models** boxes: DeepSeek and OpenAI. Tapping one opens a pop-up sheet listing the models in `START_MODELS` (`web/config.js`) with copy buttons and prices from `PRICES` ("price: ask the owner" when unset). The OpenAI list there is a guess at what to advertise (it includes premium models); edit it freely. Names only: what a key can really use is decided in the gateway.
- **Works with** boxes: VS Code, Terminal, Python, Chat apps, OpenHands, Your own app. Each opens a sheet with Base URL, model and a copy-ready command. VS Code and chat-app steps are generic on purpose (menu names differ); OpenHands steps are the ones the owner verified.
- Checked with Playwright (demo mode) at 320, 390 and 820 px: sheets open and close (button, Escape, backdrop), copy works, Get started goes to My key, no overflow, no console errors. Not checked on the real tablet.

## Update 2026-10-16 (picture mode in Chat)

- Owner could not make pictures: Chat calls `/v1/chat/completions`, which only returns text (the model gave an image prompt and said it cannot draw). The gateway Models list at the time had no image model (only GPT chat models and `sora-2-pro`, a video model).
- Added a **Chat | Picture** switch inside the Chat card. It appears only when the checked key's model list contains an id matching `/image|dall-?e/i` (`imageModelIds()` in `web/app.js`), so nothing changes until an image model is added in the gateway and allowed on the key. Picture mode sends `POST /v1/images/generations` with `{model, prompt, n:1}` plus `size` only when the owner picks "Square 1024", and shows either a base64 picture or a URL, with a Save link. It does not send `response_format` (some models reject it).
- NOT verified against the real gateway: whether it exposes the images endpoint with this key, the model id, the price, and the real answer shape. Tested only with a stubbed gateway (success, 403 quota, 400 error) and demo mode (`?mock=1` now lists `gpt-image-1`). Image prices are not in `PRICES`; set them in the gateway first (never zero).

## Update 2026-10-16 (compact Models tab, model kinds)

- **Models tab redesigned** after the owner showed a status page they liked (`api.mwapi.dev/monitor`): compact cards (two per row, three from 760 px) with logo, status pill, name, Input/Output price boxes, tokens used and a small Test button. The Live status card now has Endpoint ping, Availability and Checks plus a strip of the last 60 gateway checks. **Honest limit:** the history is kept in this browser (`localStorage` key `gph_ping_hist`, only timestamps and ms, no key) and grows only while the page is open, so "Availability" is for this device, not a 7-day server-side uptime. A real server-side history would need something that checks on a schedule and stores results (for example a scheduled GitHub Action writing a JSON file); not built.
- **Model kinds** (`kindOf()` in `web/app.js`): text models go in the chat box and get a Test button; `image`/`dall-e` models are used only in Chat > Picture; `sora`/`video` models are shown but cannot be used here. `sora*` and `dall-e*` now count as OpenAI (they showed as "Other" and put an "Other" badge in the header).
- The owner added `gpt-4.1-mini`, `gpt-image-1-mini` and `sora-2-pro` to the key. The Picture mode (see the earlier update) therefore appears for that key once this is deployed. Not yet tried against the real gateway: the real images answer, the price, and whether `size` is accepted.
- `START_MODELS.openai` in `web/config.js` now starts with `gpt-4.1-mini` and `gpt-image-1-mini`. OpenAI prices are still unset.

## Update 2026-10-16 (copy buttons)

- Every chat message (yours and the model's, also after a reload) now has a small copy button in its top-right corner (`addCopy()` in `web/app.js`). It copies only the message text, not the token count or pictures. The Picture pane has a **Copy prompt** button next to "Create picture". Checked in demo mode at 320 and 390 px (clipboard contents verified, no console errors); the real tablet's clipboard behaviour was not checked.

---

## START HERE (written 2026-10-16, end of a very long session; read this before anything else)

**Who and how**: the owner works only from a Xiaomi Pad 7 tablet (no laptop, no Termux), sends screenshots, wants answers in Burmese, one step at a time, and wants honesty about what was not verified. Never ask for keys or passwords in chat; two keys already appeared in screenshots (confirm they are revoked in the gateway). "Pr" = open a PR into `main`; "Pr and merge" = also squash-merge it. The repo is public.

**What exists (all live on `main` once PR #15 is merged)**
- Dashboard `web/` at https://aungshin-gif.github.io/gamepay-api-hub/ . Tabs: **Start** (landing: code background, DeepSeek/OpenAI boxes with model pop-ups, "Works with" boxes, Telegram support `@angsthtun`), **My key** (Paste / Clear / Check, tokens left), **Chat** (Chat | Picture switch, copy buttons), **Models** (compact cards, last-60 check history kept in the browser), **Guide**.
- Settings live in `web/config.js` (gateway URL, `PRICES`, `MODEL_INFO`, `START_MODELS`, `SUPPORT_TELEGRAM`). Gateway calls are only in `web/app.js` (`fetchUsage`, `fetchModels`, `testModel`, `streamReal`, `createPicture`). `kindOf()` decides text / image / video models. Demo: `?mock=1`; debug: `?debug=1`.
- Gateway: new-api on Railway (`https://new-api-production-6f0d.up.railway.app`). DeepSeek priced and working. The owner added an OpenAI channel; their key lists `gpt-4.1-mini`, `gpt-image-1-mini`, `sora-2-pro` (an admin key also showed `gpt-5.3-codex`, `gpt-5.5-pro`, `gpt-5.6-*`, `gpt-6-*`). OpenAI credit of $5 was bought (it only worked without a VPN, with the card region as Myanmar).
- Tried and dropped: Codespaces + VS Code + Cline (too messy on a tablet). Working: OpenHands Cloud with an LLM profile (Custom Model `openai/<model>`, Base URL `<gateway>/v1`, gateway key).

**Not verified (do not claim they work)**: Picture mode against the real gateway (endpoint answer, `size`, price); the real tablet's look/feel and clipboard prompt; any OpenAI price (not set in the gateway or in `PRICES`); that gateway sign-up is really closed (owner was doing it); a server-side uptime history (the dashboard's history is per browser).

**Open items, most important first**
1. Confirm the keys that appeared in screenshots are revoked; close gateway sign-up (keep login on); 2FA; DeepSeek balance alert.
2. Railway trial credit was about $4.75 / 29 days on 2026-10-16: decide the plan before it ends (the whole gateway stops otherwise).
3. Set OpenAI prices in the gateway first (Models -> model -> Pricing -> Expression, per token, USD per 1M, never zero), then copy the same numbers into `PRICES`. Official OpenAI prices could not be fetched from the sandbox; the owner must supply them. Remove `sora-2-pro`, `gpt-5.5-pro`, `gpt-6-astra` from member keys.
4. Test Picture mode with the owner's own key and a tiny prompt; check the image price first.
5. Custom domain `api.gamepayhub.shop` (Railway Custom Domain + a DNS CNAME), then change `GATEWAY_URL` only after it works.
6. Optional ideas the owner liked: Burmese language toggle, a real server-side uptime history, more "Works with" guides.

**Git and testing gotchas**
- After every squash-merge the branch has the old commits, so the next PR conflicts. What works without force-push (force-push and `git checkout -B` resets were denied by the permission classifier): `git merge origin/main`, then `git checkout --ours` the conflicted files (the branch already contains everything main has), `git add`, commit, and check that `git diff origin/main HEAD` shows only the new work. Then open the PR and squash-merge with `expectedHeadSha` set to the full 40-character SHA.
- Test with Playwright from `/opt/node-tools` (Chromium in `/opt/pw-browsers`, launch with `executablePath: '/opt/pw-browsers/chromium'`) against `python3 -m http.server`; stub the gateway with `page.route`; check 320, 390 and 820 px for horizontal overflow and console errors. Do not use `pkill -f <pattern>` in the same shell command line (it matches and kills your own shell). The sandbox cannot reach Railway, the gateway, DeepSeek, OpenAI or most websites.
- A CSS class called `warn` already exists for notices; do not reuse it for new widgets (the history bars did and overflowed).

## Update 2026-10-17 (custom domain)

- Custom domain **`api.gamepayhub.shop`** is set up: Railway `new-api` service (port 8080) with a CNAME `api` and a TXT `_railway-verify.api` record added at Hostinger DNS. The owner reported Railway shows it as ready.
- `GATEWAY_URL` in `web/config.js` was switched to `https://api.gamepayhub.shop` after the owner opened `https://api.gamepayhub.shop/v1/models` in a browser and saw a JSON answer. The old Railway address (`...up.railway.app`) still works; do not delete it.
- Railway's trial only allows one custom domain, so the "custom domain limit" banner is expected. No upgrade was needed.
- Not verified from the sandbox (it cannot reach the gateway): CORS and chat streaming through the new domain from the dashboard. Check with a real key after the switch.

## Update 2026-10-18 (Main page redesign, step 1 of the OpenRouter-style plan)

- Owner direction: OpenRouter-like structure, **wide / horizontal** (tablet landscape), **glass + light + soft blue**, nice animation, no login system. The Start page now has: hero (headline + the GamePay "brain cell" network), count-up stats, 4 feature cards, Featured models (cards with prices from `PRICES`), Providers, Works with, 3 steps.
- Layout: from 700px wide a **top bar** replaces the bottom nav and the old left sidebar (CSS block at the end of `web/styles.css`, "Main page redesign"). Under 700px the bottom nav stays. Main width is 1180px; Chat / My key / Guide are capped at 900px.
- New file `web/home.js` (self-contained): network picture (canvas lines + DOM logo nodes on a turning sphere, curved gradient lines, travelling lights; pauses off-screen / on other tabs; static for reduced motion), stats, featured cards, top-bar "Get a key" (Telegram) button.
- Settings in `web/config.js`: `NET_NODES` (logos around the core; **only DeepSeek and OpenAI logos exist so far; the owner will send more**; the other nodes are plain decorative dots), `FEATURED_MODELS`.
- Not done yet (next steps): Models catalog page in the OpenRouter style (filters on the side, one row per model with context and prices), Docs/Guide polish, footer. Prices for OpenAI models are still unset ("price: ask").
- Checked with Playwright (demo mode) at 390, 820 and 1280 px: no console errors, no horizontal scroll. Not checked on the real tablet (look, frame rate of the network animation).
- (2026-10-18, later) The Start hero picture was redrawn as a 3D glass **neuron** (no GamePay logo in the middle, on the owner's request): soma sphere with a glowing nucleus, two orbit rings, tapered branches with twigs, travelling signals, logo nodes at the branch tips. All in `initNet()` in `web/home.js` (canvas, glow sprites cached for speed, DPR capped at 1.5). Logos added by the owner: `anthropic.png`, `xai.png`, `qwen.png` (cropped to the mark) and `provider-blue.png` (blue scribble "m", **provider name not known yet, ask the owner**). `NET_NODES` entries with `tile: true` render as rounded squares. These providers are decoration only: the gateway still serves DeepSeek and OpenAI; do not list the others as available.
- Not verified: real-device frame rate (headless Chromium without a GPU measured ~25 fps, so a real tablet should be better but it was not tested).
- (2026-10-18, evenness pass) Logos around the neuron are now **identical tiles** (56px, 46px on phones, same corner radius) placed **evenly every 60 degrees** on a ring that only sways a little (decor dots still turn in 3D). Tile images are `web/assets/net-*.png` (192px, mark centred on a white rounded square; Anthropic keeps its tan tile). To add a provider: make a 192px tile the same way and add it to `NET_NODES` (the ring spaces itself by the count). Top bar padding now uses the same column maths as `.main` so the left logo, the right "Get a key" button and all cards share the same left/right edges (measured at 390, 820, 1280, 1500 px). Canvas DPR cap is 2.

## Update 2026-10-18 (How it works diagram)

- New Start section **"How it works"**: your tools -> GamePay gateway -> models, joined by gradient lines with moving lights (idea from the LiteLLM / Vercel AI Gateway diagrams the owner showed). Built in `initFlow()` in `web/home.js`, styled at the end of `web/styles.css`. Wide screens go left to right, phones top to bottom. The lines are redrawn on resize.
- The tool tiles and provider tiles **click the old hidden buttons** (`#platBoxes .plb`, `#provBoxes .pbx`), so the existing set-up sheets and model pop-ups still work. The old "Providers" and "Works with" sections on Start are now `hidden` (remove the `hidden` attributes in `web/index.html` to bring them back). The tool list and icons still come from `PLATS` in `web/app.js`; add a platform there and it appears in the diagram.
- The tool icons are **generic glyphs on coloured tiles, not brand logos**. Only OpenHands was really tested by the owner (see the earlier update); the other tools use the standard OpenAI-compatible Base URL + key steps and are not individually verified. Ask the owner which tools they have actually tested before claiming more, and for real logo files if they want brand icons.
- The models column shows only DeepSeek and OpenAI (the providers the gateway really serves) plus a dashed "More / can be added" tile.
- (2026-10-18, later) xAI and Qwen logos are in the diagram's Models column as **dimmed "Soon / not connected" tiles** (`MODEL_SOON` in `web/config.js`), because no channel serves them yet. When a channel exists, remove the entry from `MODEL_SOON`, list its models in `START_MODELS`, and add a normal tile (logo in `LOGO` in `initFlow()`). The diagram uses the 3-column layout only from 980px; narrower screens stack top to bottom (the 3-column version overflowed between 700 and 820px). Connector positions use `offsetLeft/Top` so the entrance animation does not shift them.

## Update 2026-10-18 (smoothness pass; How it works always horizontal)

- Owner reported the site felt heavy on the tablet. Measured in headless Chromium (no GPU, so only the ratio matters): idle 27 -> 60 fps at 1280px and 15 -> 60 fps at 820px; scrolling 23 -> 60 and 12 -> 60. What changed: removed every `backdrop-filter` (10 places; backgrounds are now near-solid), hid the two animated `filter: blur(60px)` page blobs, stopped endless animations (hero gradient text, steps glow/line flow, gateway row sweeps), removed the SVG moving dots in the diagram (dashes only run while it is on screen), and lightened the neuron (8 decor nodes instead of 12, 20 dust dots instead of 42, 2 twigs per branch, 14 branch segments, 48 ring points, canvas DPR cap 1.25, drawn at ~30 fps). Do not bring back full-page blur layers or endless animations without re-measuring (`perf.js`-style fps check with Playwright).
- **How it works** stays left to right from 600px up (compact on tablets held upright; 3 columns of tools from 980px). Below 600px (phones) it still stacks top to bottom. GamePay gateway box texts shortened ("One key", "Token balance", "Live status", "Chat + pictures"); the dimmed Soon tiles show only name + badge; tool label "Your own app" shows as "Your app" in the diagram.
- Not verified on the real tablet; the owner should say if it still feels heavy (next candidates: lower the neuron to a static image, drop shadows).

## Update 2026-10-18 (logos orbit under glass; clearer lines; new GamePay box)

- Brain cell picture: the provider logos are no longer fixed. They sit evenly (every 60 degrees) on a **tilted orbit that turns round the cell** (`G1` group in `initNet()`: rotate about Z, then tilt about X, plus a slight sway), with a faint orbit track ring. Logos at the back are smaller, softer and hidden behind the cell; logos are 44px (38px on phones), translucent. The whole picture sits **under a pane of glass** (`.net` is a rounded glass panel, `.netglass` adds a sheen and a slow glare that moves with a transform only).
- Diagram: connector lines are thicker (3px), with a soft glow underlay, bigger end ports and a stronger dash flow. The GamePay box was redesigned: gradient border, logo tile + "GamePay / API gateway" + green Live chip, four icon rows (key, wallet, pulse, chat; inline SVG paths in `home.js`).
- Perf re-checked after these additions: still 60 fps idle and while scrolling in headless Chromium (1280 and 820px).
