// Отбор фото: размер, дедупликация по перцептивному хешу, контакт-листы по страницам
import sharp from 'sharp'; import fs from 'fs';
const SP = process.argv[2];
const all = JSON.parse(fs.readFileSync(`${SP}/all.json`, 'utf8'));
const res = [];
for (const x of all) {
  const f = `${SP}/all/${x.id}.${x.u.split('.').pop()}`; if (!fs.existsSync(f)) continue;
  try {
    const m = await sharp(f).metadata(); const long = Math.max(m.width, m.height), short = Math.min(m.width, m.height);
    if (long < 1400 || short < 900) continue;
    const px = await sharp(f).resize(9, 8, { fit: 'fill' }).grayscale().raw().toBuffer();
    let hash = ''; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) hash += px[r * 9 + c] > px[r * 9 + c + 1] ? '1' : '0';
    const st = await sharp(f).stats();
    res.push({ ...x, f, w: m.width, h: m.height, hash, bright: Math.round((st.channels[0].mean + st.channels[1].mean + st.channels[2].mean) / 3) });
  } catch {}
}
// дедуп: хеш-расстояние < 6 — оставляем больший
const ham = (a, b) => { let d = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++; return d; };
res.sort((a, b) => b.w * b.h - a.w * a.h);
const uniq = []; for (const r of res) { const dup = uniq.find((u) => ham(u.hash, r.hash) < 6); if (dup) dup.pages = [...new Set([...dup.pages, ...r.pages])]; else uniq.push(r); }
uniq.forEach((u, i) => (u.n = i));
fs.writeFileSync(`${SP}/uniq.json`, JSON.stringify(uniq, null, 1));
console.log('big', res.length, 'uniq', uniq.length);
const T = 240, cols = 8, per = 48;
for (let p = 0; p * per < uniq.length; p++) {
  const chunk = uniq.slice(p * per, (p + 1) * per); const comps = [];
  for (const [i, m] of chunk.entries()) {
    const x = (i % cols) * T, y = Math.floor(i / cols) * T;
    comps.push({ input: await sharp(m.f).resize(T - 4, T - 34, { fit: 'cover' }).toBuffer(), left: x + 2, top: y + 2 });
    const label = `${m.n} ${m.pages[0].replace('doma_', '').slice(0, 14)} ${m.w}`;
    comps.push({ input: Buffer.from(`<svg width="${T}" height="30"><text x="4" y="21" font-size="17" font-family="Arial" fill="#000">${label}</text></svg>`), left: x, top: y + T - 32 });
  }
  await sharp({ create: { width: cols * T, height: Math.ceil(chunk.length / cols) * T, channels: 3, background: '#fff' } }).composite(comps).jpeg({ quality: 72 }).toFile(`${SP}/u${p}.jpg`);
}
