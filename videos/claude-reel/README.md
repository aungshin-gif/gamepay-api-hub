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
