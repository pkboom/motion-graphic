// Usage: node render.js <scene.html> [--fps 60] [--out out/name.mp4] [--still <seconds>]
// Seeks the scene to each frame's exact time, screenshots it, and pipes PNGs into ffmpeg.
// With --still, writes a single PNG at that time instead (for quick review).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { basename, extname, join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    fps: { type: 'string', default: '60' },
    out: { type: 'string' },
    still: { type: 'string' },
  },
});
const scenePath = positionals[0];
if (!scenePath) throw new Error('Usage: node render.js <scene.html> [--fps 60] [--out file.mp4] [--still <seconds>]');
const fps = Number(values.fps);
const name = basename(scenePath, '.html');

// Serve the project over HTTP so fonts, SVGs and scripts load like on a real site.
const root = resolve('.');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const server = createServer(async (req, res) => {
  try {
    const body = await readFile(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    res.writeHead(200, { 'Content-Type': types[extname(req.url)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${server.address().port}/${relative(root, resolve(scenePath))}`);
const { width, height, duration } = await page.evaluate(() => window.scene);
await page.setViewportSize({ width, height });
await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
});

async function shutdown() {
  await browser.close();
  server.close();
}

if (values.still !== undefined) {
  const t = Number(values.still);
  const out = values.out ?? `out/${name}@${t}s.png`;
  await page.evaluate((t) => window.scene.render(t), t);
  await page.screenshot({ path: out });
  await shutdown();
  console.log(`Still @ ${t}s → ${out}`);
  process.exit(0);
}

const out = values.out ?? `out/${name}.mp4`;
const ffmpeg = spawn('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', out,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const ffmpegDone = new Promise((ok, fail) =>
  ffmpeg.on('close', (code) => (code === 0 ? ok() : fail(new Error(`ffmpeg exited ${code}`)))));

const frames = Math.round(duration * fps);
for (let i = 0; i < frames; i++) {
  await page.evaluate((t) => window.scene.render(t), i / fps);
  const png = await page.screenshot({ type: 'png' });
  if (!ffmpeg.stdin.write(png)) await new Promise((r) => ffmpeg.stdin.once('drain', r));
  if (i % fps === 0) process.stdout.write(`\r${i}/${frames} frames`);
}
ffmpeg.stdin.end();
await ffmpegDone;
await shutdown();
console.log(`\rRendered ${frames} frames @ ${fps}fps → ${out}`);
