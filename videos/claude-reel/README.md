# Claude reel (unofficial fan-made video, by Shin Thant)

Code-drawn motion graphics: each `*-anim.html` is a single canvas page exposing `window.draw(t)`.
`render-*.js` steps `t` frame by frame with Playwright, saves JPEGs, then ffmpeg encodes them.

| Version | File | Length | Notes |
|---|---|---|---|
| v1-v3 | `v1-v3-anim.html` | 21-29.6 s | single dark theme, model names + benchmark bars |
| v4 | `v4-anim.html` | 29.6 s | per-scene backgrounds, motion-blur type, stair wipes, HUD |
| v5 | `v5-anim.html` | 23 s | Claude Code 3D scene + walking claw pet (code-drawn), living "thinking" background, model-picker zoom (Sonnet 5.5 to Opus 5.5), grain + vignette |
| v6 | `v6-anim.html` | 23 s | v5 + Higgsfield 3D assets: cut-out claw pet, 3D Claude Code background, 3D benchmark-bar clip; numbers and text still drawn in code |
| v7-v9 | `v9-anim.html` | 23 s @ 60 fps | per-text Higgsfield 3D backdrops (intro, Claude Code, thinking, chat, closing), cross-zoom transitions, dolly moves, Claude Code icon in the title and model picker, closing wax-seal monogram "ST" (no full name). `?wm=0` hides the corner mark |
| v10 | `v10-anim.html` | 23 s @ 60 fps | v9 + 3D Higgsfield spark logo intro (flip-in, float, contact shadow, sheen, orbiting glass spheres) and the same logo replacing the blue icons |
| v11 | `v11-anim.html` | 23 s @ 60 fps | one backdrop per text (Claude Code: AI data-analysis hall; Thinking: neural sculpture; Reasoning: stacked glass model layers), profile-card ending on a Higgsfield 3D glass card, no large monogram. `?sample=0` hides the sample caption, `?wm=0` the corner mark |
| v13 | `v13-anim.html` | 23 s @ 60 fps | v11 sci-fi 3D scenes + a neo-brutalist last page only (Higgsfield 3D profile card in light and dark, letter-tile title, light/dark toggle). `v12-neo-experiment-anim.html` is the all-neo version that was NOT wanted, kept only for reference |
| v14 | `v14-anim.html` | 23 s @ 60 fps | v13 with a Higgsfield dark-glass chat window and model dropdown (Sonnet 5.5, Fable 5.1, Opus 5.5, Claude Code; Opus gets picked) and a data-analysis benchmark stage with code-animated 3D bars |
| v15 | `v15-anim.html` | 25 s @ 60 fps | v14 + the benchmark split into one panel per model (Opus 5.5 / Sonnet 5.5, VS chip, lead badges) and an animated ending (confetti, spinning logo, THANKS letter tiles, iris close) |
| v16 | `v16-anim.html` | 25 s @ 60 fps | v15 with the owner-supplied Claude logo (`hf/spark_official.png`, background removed, shape and colour untouched) beside every model name; the ending carries a small "Unofficial fan-made video" note |
| v17 | `v17-anim.html` | 39.2 s @ 60 fps | Chat scene rebuilt at UHD (4K Higgsfield glass assets), larger window, camera zoom-in on the model picker (Sonnet 5.5 -> Fable 5.1 -> Opus 5.5), then "+" -> file picker -> photo chosen -> typed message -> send -> streamed reply. The five other picker thumbnails are code-drawn gradients, not real photos. Output is still 1280x720 |
| v18 | `v17-anim.html` (same file, updated) | 40.8 s @ 60 fps | v17 plus UHD (4K) sci-fi backdrops for Thinking and Reasoning with code-drawn HUD (rotating rings, orbiting nodes, scan line, a light pulse climbing the glass stack), 3.4 s each, and polished English ("Taking a moment to work it out", "Understand the question") |

## Render

```bash
node render-v5.js all            # writes frames/f_0000.jpg ...   (use `preview` for stills)
ffmpeg -framerate 30 -i frames/f_%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart out.mp4
```

The render scripts expect Playwright at `/opt/node-tools/node_modules/playwright` and Chromium at
`/opt/pw-browsers/chromium` (the cloud session image). Adjust the two paths elsewhere.
Change the `anim*.html` filename inside the script to match the version.

## Notes

- Benchmark numbers (SWE-Bench Pro/Multilingual/Multimodal) come from third-party summaries of vendor
  reports, not Anthropic's own page. Verify against the system card before publishing.
- The pet is drawn in code. A 3D Higgsfield image can replace it once the image host is allowed.
- No keys or tokens live here.

- v6 needs three Higgsfield assets next to the page (not stored in the repo): `hf/pet_cut.png` (pet with transparent background), `hf/bg3d.png`, and `hf/bench/b_0001.jpg ...` (frames of the 3D bar clip, 30 fps, 1280x720). Without them the scenes fall back to the code-drawn versions.

- v9 assets (not in the repo, fetched from Higgsfield): `hf/intro.png`, `code.png`, `think.png`, `chat.png`, `close.png`, `seal.png` (cut out), `claude-code-256.png`, `pet_cut.png`, `bench/b_0001.jpg...`. Each scene falls back to a plain dark fill if its image is missing.
- v10 also needs `hf/spark.png` (the Higgsfield 3D logo, cut out). The reference-image upload to Higgsfield was blocked by the session network policy, so the logo was generated from a text description and only approximates the original rays.
- v11 needs `hf/code2.png`, `reason.png`, `card.png` (blank 3D glass card) and `avatar.jpg` (the owner's profile photo, not stored here). The card's text is sample data typed by the owner; the "Sample profile" caption is on by default so it cannot be mistaken for a real billing record.
- v13 also needs `hf/profile_l.png` and `hf/profile_d.png` (blank neo-brutalist 3D card, transparent background; the dark one was generated from the light one as a reference so the layout matches). v12 additionally uses chat/menu/term/stats/think_nb/stack_nb assets.
- v14 also needs `hf/chat_glass.png`, `hf/menu_glass.png` (transparent dark glass UI) and `hf/bench_env.png` (data-analysis stage, opaque). No Fable 5.1 benchmark numbers are available, so the chart only compares Opus 5.5 and Sonnet 5.5.
- v17 also needs `hf/uchat.png`, `umenu.png`, `uplus.png`, `upick.png` (4K transparent dark-glass UI, blank, generated with gpt_image_2_5 quality high, about 4.25 credits each) and `hf/avatar.jpg` (the owner's photo, not stored here).
- v18 also needs `hf/think.png` and `hf/reason.png` replaced by the 4K versions (3840x2160, opaque, generated with gpt_image_2_5 quality high, about 4.25 credits each), and `hf/mascot.png` (3D pixel mascot, transparent).
