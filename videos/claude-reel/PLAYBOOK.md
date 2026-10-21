# Claude reel: how this video was made (playbook for an AI assistant)

Purpose: if you are an AI model and the owner hands you this file, you should be able to make a **new explainer video in the same style** (a different topic, product or model) without starting from zero. Read it fully, then follow "How to reproduce".

This file was written from the real working session. Anything marked **(unverified)** was not confirmed. The video was only ever checked through still frames and file metadata, never watched end to end, and it has no audio.

---

## 1. What the video is

- A ~41 s explainer about "Claude" (an unofficial fan-made video, the ending says so).
- Style: soft 3D intro, sci-fi 3D scenes for the AI topics, a dark-glass chat UI, a data-analysis benchmark stage, and a **neo-brutalist last page only**.
- Final spec of the latest version (v19): 3840x2160, 90 fps, 40.8 s, H.264, plus a 1080p copy. Earlier versions were 1280x720 at 60 fps.
- Scene list (global seconds in `BOUNDS`):

| # | Scene | Time | Notes |
|---|-------|------|-------|
| 1 | Intro, big 3D logo | 0 - 2.6 | Higgsfield studio backdrop, 3D logo flips in, orbit ring and glass orbs, kinetic title |
| 2 | Claude Code | 2.6 - 6.0 | AI-city backdrop, glass terminal types a command, a 3D claw pet walks on the window |
| 3 | Thinking | 6.0 - 9.4 | 4K AI-chamber backdrop, a real perspective-3D neural sphere drawn in code |
| 4 | Reasoning | 9.4 - 12.8 | 4K glass-corridor backdrop, orbiting glass-layer stack, a light pulse climbs it |
| 5 | Chat | 12.8 - 31.8 | UHD dark glass chat, zoom-in model picker, "+" menu, file picker, send, reply |
| 6 | Benchmark | 31.8 - 35.8 | Data-analysis stage, one panel per model, 3D bars |
| 7 | Profile card | 35.8 - 39.0 | Neo-brutalist card, light to dark wipe, letter tiles |
| 8 | End | 39.0 - 40.8 | THANKS letter tiles, confetti, spinning logo, iris close |

## 2. The core idea: one HTML page that can draw any moment

- Each version is a single file `vNN-anim.html` with a `<canvas>`. It exposes `window.draw(t)` (draw the frame at time `t` seconds) and `window.DUR`.
- The page is **deterministic**: the same `t` always gives the same picture. There is no real-time clock. That makes rendering and previewing simple.
- Rendering = a Node script (`render-vNN.js`) that opens the page in headless Chromium with Playwright, calls `draw(t)` for every frame, screenshots it to `frames/f_00000.jpg ...`, then `ffmpeg` joins the frames.
- Preview mode (`node render-vNN.js preview`) writes a few stills at chosen times. **Always look at stills before a long render.** This caught almost every bug.

### Supersampling and fps (v19)
- `FPS` is a constant in the page (90). `?ss=3` makes the canvas internal size 3x (3840x2160) while all drawing code still uses 1280x720 logical units. `reset()` sets the transform to `SS`.
- When copying one canvas onto another, draw it at logical size (`drawImage(cA,0,0,W,H)`) and multiply `ctx.filter` blur radii by `SS`.
- Render time is about 0.14 s per frame at 1080p and 0.6 s per frame at 4K. 3672 frames at 4K is about 35 minutes. Run it in the background as **one `&&` chain** (`render && ffmpeg`), not a detached subshell, or you will not be notified.
- ffmpeg: `-framerate 90 -i frames/f_%05d.jpg -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart`. A 1080p copy can come from the same frames with a `scale=1920:1080` filter, no second render.

## 3. Techniques that mattered

1. **AI draws the blank 3D stage, code draws everything exact.** Image generators misspell text and numbers. So Higgsfield makes UI with **empty slots** (no text), and the page draws all text, numbers, icons, cursors and animation on top at measured positions.
2. **Measure, do not guess.** Transparent assets are cropped by their alpha bounding box (`GBB`). Slot positions were measured on a coordinate grid overlay, then written as constants (for example row centres of a menu, tile centres of a file picker). A helper `gPt(key,cx,cy,scale,x,y)` maps image coordinates to screen coordinates, so a cursor can land exactly on a slot.
3. **Camera zoom inside a scene** (used for the model picker): a keyframe list `[time, zoom, focusX, focusY]`, eased, with the view clamped so it never shows outside the frame.
4. **Real perspective 3D in code** when a flat image looks "like a cartoon": project points with `s = F/(F - z*R)`, rotate with yaw/pitch, depth-sort, draw with additive blending. Used for the neural sphere (Fibonacci points + near-neighbour edges + travelling signals) and the layer stack. Put these over an **empty** AI-generated environment, not over an image that already contains the object (that double-draws it).
5. **Transitions**: each scene is drawn to an offscreen canvas, then cross-zoomed with blur. Camera drift per scene is a small zoom range in `CAM`.
6. **Finishing**: colour grade, vignette, bloom, film grain per frame. The last two scenes skip them.
7. **Typography**: letter-by-letter "kinetic" titles, typing effects with a caret, streamed reply text.
8. **Neo-brutalism** (hard borders, hard offset shadows, flat colour, ticker marquee) is used **only** on the last page. The owner rejected it for the rest of the video.

## 4. Assets (not stored in the repo, you must regenerate them)

The repo is **public**. The generated images and the owner's photo are not committed. The page expects a folder `hf/` next to it. Missing images fall back to a plain dark fill.

| File | What | Size / mode |
|------|------|-------------|
| `intro.png` | Peach studio backdrop with glass ribbons and bubbles, empty centre | 3840x2160 |
| `code2.png` | AI data-analysis city at night, calm lower centre | 3840x2160 |
| `think.png` | Empty circular AI chamber, rings, glass pillars | 3840x2160 |
| `reason.png` | Empty glass corridor, cyan and amber light | 3840x2160 |
| `bench_env.png` | Dark analytics arena, glossy floor | 3840x2160 |
| `uchat.png` | Dark glass chat window, blank (plus button, input bar, empty model slot, send button) | 3840x2160, transparent |
| `umenu.png` | Tall glass menu, 4 empty rows with round sockets | 2480x3312, transparent |
| `uplus.png` | Small glass popup, 3 empty rows | 3312x2480, transparent |
| `upick.png` | Glass file browser: path bar, 4 sidebar items, 3x2 empty tiles, 2 buttons | 3840x2160, transparent |
| `spark3d.png` | 3D orange asterisk logo (cropped to its alpha box) | transparent |
| `mascot.png` | 3D voxel pixel mascot used as the chat icon | transparent |
| `pet_cut.png` | 3D claw pet | transparent |
| `profile_l.png`, `profile_d.png` | Neo-brutalist profile card, light and dark | 1344x752, transparent |
| `spark_official.png` | The owner's own supplied logo image, background removed | 512 px |
| `avatar.jpg` | The owner's own supplied photo, square crop | 512 px, **never commit** |

Image tool used: Higgsfield MCP `generate_image`, model `gpt_image_2_5`, `quality: "high"`, `resolution: "4k"`, `background: "transparent"` for UI parts, aspect ratio set per asset. Cost at the time: a 4K "high" image was about 4.25 credits, a 2K one about 1-2. Check cost first with `get_cost: true`.

### Prompts that worked (shortened; keep "no text, no letters, no logos")
- **Chat window:** "3D render of a premium dark sci-fi glass chat window UI floating, front view: smoked translucent glass rounded panel with a thin warm orange rim light, a slim title bar with three small round dots at the left, a very large empty message area, at the bottom a wide rounded input bar with a round glass plus-button socket at the far left, an empty pill-shaped model-selector slot near the right end, and a round glowing orange send button. No text."
- **Menu / popup / file picker:** same material words, then the exact layout ("exactly four equal horizontal empty rows, each with an empty round dark socket at the left"; "a clean 3 by 2 grid of six empty rounded square thumbnail tiles"). Counting words are honoured well, so state exact counts.
- **Environments:** "EMPTY ... seen from the centre ... the centre of the frame is open and empty for a hero object". Without that sentence the model paints the hero object into the picture.
- **Mascot / logo:** describe the shape in words (body, eyes, arms, legs, colour hex). Colour was given as `#d97757`.

## 5. Chat scene recipe (the most detailed scene)

Timeline (local seconds): window pops in 0-0.6; greeting types; camera zooms to the model chip and a menu pops over it; the highlight glides Sonnet, Fable, then Opus, click ring, check badge with particle burst, chip flips to the new name; camera moves to "+"; popup; "Upload a file"; file picker pops over a dimmed chat; cursor picks one file tile, selected state and tick; Open; the chosen picture flies into an attachment tray; camera zooms on the input; text types in; send; the user bubble (photo + text) pops in; three typing dots; the reply streams letter by letter.

Building blocks: `camAt(t)` keyframes, `S4_cursor(t)` waypoints (`[time,x,y]`, eased), click rings at listed times, `coverImg()` for photo crops, `fakeThumb()` for code-drawn placeholder thumbnails.

## 6. How to reproduce for a new topic

1. Copy `vNN-anim.html` and `render-vNN.js`. Rename.
2. Decide the scene list and timings; edit `BOUNDS`, `NAMES`, `SCENES`, `CAM`, `DUR`.
3. For each scene generate an **empty** backdrop (and blank UI parts if needed). Say "centre empty" and "no text" in every prompt. Download from the result URL into `hf/`.
4. Measure assets: alpha bounding box with Pillow, slot positions with a grid. Put them into constants.
5. Write scene functions `S1(t)...`. Draw text and numbers in code only.
6. Run `node render-vNN.js preview`, look at the stills, fix, repeat.
7. Run the full render in the background, then encode, then check duration, frame rate and size with `ffprobe`.
8. Never present numbers you did not verify as facts (see section 8).

## 7. Mistakes already made (do not repeat)

- Applied neo-brutalism to the whole video when only the last page was wanted. Re-read scope instructions.
- A scene looked low quality because its backdrop was only 1344 px wide, and it was a flat picture with glow on top. Fix: 4K backdrop plus real 3D drawn in code.
- Asked the image model to draw the same object that code also drew. It doubled. Ask for an empty environment.
- `re.sub` with `\u` escapes in a replacement string fails in Python. Use a lambda, or a plain `str.replace` with an assertion that the match count is exactly 1.
- A detached subshell `( ... ) &` returns immediately, so no completion notice arrives. Use one `&&` chain with the tool's background option.
- Do not use `pkill -f`. Use `pgrep -x node` and `pkill -x node`.
- The Higgsfield `jobs_wait` tool takes `jobs: [{job_id, index}]` and `timeout_seconds` (max 15). Poll again if it times out.
- Uploading a local reference image to Higgsfield was blocked by the session network policy (upload host). Do not try to route around it. Describe the shape in words, or use the supplied image directly in code.

## 8. Safety, privacy and honesty rules

- **Public repo:** never commit keys, passwords, admin usernames, tokens, or the owner's photo.
- A photo of a real person is used only because the owner supplied it as their own picture. Do not identify anyone from a face. The scripted reply is a plain reaction to the owner's sentence.
- The profile card (name, plan, price, e-mail, region) is **sample data typed by the owner**, labelled "Sample profile · demo data". Do not present it as a real billing record.
- The benchmark figures were third-party or vendor reported and **not verified** against the official system card. The chart shows a caption saying so. No data exists for one of the listed models, so it is not charted.
- The end card says "Unofficial fan-made video · Claude is a product of Anthropic". Keep a note like that.
- Do not claim the video was watched or tested on a device. Say what was actually checked.

## 9. Owner preferences (for the assistant that works with this owner)

- Reply in **Burmese**, mentor / co-founder tone, one step at a time, short.
- The owner works from a phone or tablet and sends screenshots. Read typos generously.
- Never ask them to paste secrets into chat.
- Do not open a pull request unless they say "Pr". "Pr and merge" means open a PR into `main` and squash-merge it.
- They prefer: no big name or monogram on screen (only a small watermark), a different 3D background per scene, dark UI for the chat, official logo beside model names, and polished natural English in all on-screen text.

## 10. Files in this folder

- `vNN-anim.html`: the page for each version (v1 to v19). `v12-neo-experiment-anim.html` is an unwanted all-neo experiment kept for reference.
- `render-*.js`: the matching Playwright render scripts.
- `README.md`: version table with what changed in each version.
- `PLAYBOOK.md`: this file.
