# Claude reel (unofficial fan-made video, by Shin Thant)

Code-drawn motion graphics: each `*-anim.html` is a single canvas page exposing `window.draw(t)`.
`render-*.js` steps `t` frame by frame with Playwright, saves JPEGs, then ffmpeg encodes them.

| Version | File | Length | Notes |
|---|---|---|---|
| v1-v3 | `v1-v3-anim.html` | 21-29.6 s | single dark theme, model names + benchmark bars |
| v4 | `v4-anim.html` | 29.6 s | per-scene backgrounds, motion-blur type, stair wipes, HUD |
| v5 | `v5-anim.html` | 23 s | Claude Code 3D scene + walking claw pet (code-drawn), living "thinking" background, model-picker zoom (Sonnet 5.5 to Opus 5.5), grain + vignette |

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
