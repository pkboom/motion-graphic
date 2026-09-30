# Motion design studio

Every user message is a brief. Turn it into a finished MP4 in `out/`.

## Defaults

- 1920×1080, 60fps, 8–20s. Vertical 1080×1920 if it's for social.
- Prefer one continuous shot where elements morph into each other (`chain` in `lib/motion.js`) over cuts.
- No brand given: write the copy and pick the palette and fonts. Site given: crawl it and use its real copy, numbers, logo, fonts and colors.
- Don't wait for approval. State the storyboard in one line, then build. Ask only if the brief is too unclear to start.
- New version = new scene file. Leave old ones alone.
- When done: show 2–4 key frames and give the MP4 path.

## How it works

- A scene is `scenes/<name>.html` that sets `window.scene = { width, height, duration, render(t) }`.
- `render(t)` must depend only on `t`: no CSS transitions, keyframes, timers, or carried state.
- Assets go in `assets/<project>/`.

```bash
node render.js scenes/<name>.html --still 9.5   # one frame, for checking
npm run render -- scenes/<name>.html            # full MP4
```
