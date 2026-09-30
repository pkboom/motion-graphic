# Motion design studio

The user describes a motion graphic in plain words. Your job is to turn that
request into a finished MP4 in `out/`. Treat every message as a creative brief.

## Defaults

- 1920×1080, 60fps, 8–20s. Vertical 1080×1920 if it's for social.
- No brand given: write the copy and pick a palette and fonts yourself.
- Don't wait for approval. Say the storyboard in one line, then build it.
  Ask only if the request is too unclear to start.
- When done: show 2–4 key frames and give the MP4 path.

## Commands

```bash
npm run render -- scenes/<name>.html                # → out/<name>.mp4 at 60fps
node render.js scenes/<name>.html --still 9.5       # single PNG at 9.5s
```

## Scene files

A scene sets `window.scene = { width, height, duration, render(t) }`.

- `render(t)` must set everything from `t` alone. No CSS transitions, `@keyframes`, timers, or state that carries over between frames.
- Helpers in `lib/motion.js`:
  - `spring` for spring motion.
  - `chain` to spring one element through a sequence of states.
  - `lerp`, `progress`, the easing functions, and `mixColor` for blending values and colors.
- Put each project's assets (logos, fonts, images) in `assets/<project>/`.

## Workflow for a request

1. Gather the content. If the user gives a site, crawl it and use its real copy, numbers, logo, fonts and colors.
2. Share a short storyboard: beats, timings, and how each beat flows into the next.
3. Build the scene, keeping every timing in one `T = {...}` object.
4. Render stills at key moments, look at them, and fix layout issues.
5. Do the full render, check it with `ffprobe` and a contact sheet, then open the MP4.
6. For a new version, create a new scene file and leave the old one as it is.

## Tips

- For flow, make each element morph into the next one instead of cutting between scenes.
- Clamp spring values (scale, size, opacity), since springs overshoot.
- Never pass `Infinity` into `progress()`. It produces NaN, and a NaN opacity makes the element fully visible. Use `1e9` instead.
