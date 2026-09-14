import { chromium } from 'playwright-core';
const SP = process.argv[2]; const pages = process.argv.slice(3);
const browser = await chromium.launch({ channel: 'chrome' });
for (const spec of pages) {
  const [path, name, vw, vh] = spec.split('|');
  const ctx = await browser.newContext({ viewport: { width: +vw, height: +vh }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:4321' + path, { waitUntil: 'networkidle' });
  // прокрутка, чтобы догрузились lazy-картинки
  for (let y = 0; y < await p.evaluate(() => document.body.scrollHeight); y += 600) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(60); }
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
  await p.screenshot({ path: `${SP}/${name}.png`, fullPage: true });
  await ctx.close();
}
await browser.close();
import sharp from 'sharp';
for (const spec of pages) {
  const [, name, vw] = spec.split('|');
  const f = `${SP}/${name}.png`; const m = await sharp(f).metadata();
  const step = +vw > 800 ? 1800 : 2400, scale = +vw > 800 ? 0.55 : 0.7; let i = 0;
  for (let y = 0; y < m.height; y += step) await sharp(f).extract({ left: 0, top: y, width: m.width, height: Math.min(step, m.height - y) }).resize(Math.round(m.width * scale)).jpeg({ quality: 75 }).toFile(`${SP}/${name}-${i++}.jpg`);
  console.log(name, m.height, i);
}
