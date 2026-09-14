// «Пересъёмка» фото через Kie AI (Nano Banana Pro): тот же дом и ракурс 1 в 1, лучше свет, резкость и детализация.
// Запуск: node --env-file=.env scripts/kie-rephoto.mjs <outDir> <resolution 1K|2K|4K> <file1> [file2 ...]
// Готовые файлы пропускаются.
import fs from 'node:fs';
import path from 'node:path';

const KEY = process.env.KIE_API_KEY;
if (!KEY) throw new Error('KIE_API_KEY не задан (.env)');
const [outDir, resolution = '2K', ...files] = process.argv.slice(2);
if (!outDir || files.length === 0) throw new Error('usage: <outDir> <resolution> <files...>');
fs.mkdirSync(outDir, { recursive: true });

export const PROMPT = `Re-photograph this exact scene as a high-end professional architectural and hospitality photograph.
STRICT: keep everything identical to the reference — the same building, shape, proportions, materials, colors, windows, doors,
curtains, furniture, decor, deck, paths, fences, every tree and its position, and the exact same camera angle and framing.
Do not add, remove, move or restyle any object. Do not add people, animals, text or logos.
Only improve photographic quality: tack-sharp focus across the frame, fine natural detail in wood grain, leaves, bark and fabric,
clean noise-free rendering without compression artifacts, ${process.env.LIGHT === 'golden' ? 'golden hour: warm low sun filtering through the trees with gentle rim light, soft warm glow of lamps inside the windows, rich but natural colors, subtle atmospheric depth,' : 'soft natural warm light,'} balanced exposure with detail in shadows and sky,
true-to-life colors. Photorealistic, shot on a full-frame camera with a sharp prime lens.`;

const auth = { Authorization: `Bearer ${KEY}` };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function upload(file) {
  const fd = new FormData();
  fd.append('file', new Blob([fs.readFileSync(file)]), path.basename(file));
  fd.append('uploadPath', 'ecobr-rephoto');
  fd.append('fileName', path.basename(file));
  const j = await (await fetch('https://kieai.redpandaai.co/api/file-stream-upload', { method: 'POST', headers: auth, body: fd })).json();
  if (!j?.data?.downloadUrl) throw new Error(`upload ${file}: ${JSON.stringify(j)}`);
  return j.data.downloadUrl;
}

async function rephoto(file) {
  const out = path.join(outDir, path.basename(file).replace(/\.\w+$/, '.jpg'));
  if (fs.existsSync(out)) return { skipped: true };
  const url = await upload(file);
  const j = await (
    await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nano-banana-pro',
        input: { prompt: PROMPT, image_input: [url], aspect_ratio: 'auto', resolution, output_format: 'jpg' },
      }),
    })
  ).json();
  const taskId = j?.data?.taskId;
  if (!taskId) throw new Error(`createTask ${file}: ${JSON.stringify(j)}`);
  for (let i = 0; i < 120; i++) {
    await sleep(6000);
    const s = await (await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, { headers: auth })).json();
    if (s?.data?.state === 'success') {
      const res = JSON.parse(s.data.resultJson).resultUrls[0];
      fs.writeFileSync(out, Buffer.from(await (await fetch(res)).arrayBuffer()));
      return { credits: s.data.creditsConsumed };
    }
    if (s?.data?.state === 'fail') throw new Error(`task ${file}: ${s.data.failCode} ${s.data.failMsg}`);
  }
  throw new Error(`timeout ${file}`);
}

const queue = [...files];
await Promise.all(
  Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const f = queue.shift();
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const r = await rephoto(f);
          console.log('ok', path.basename(f), r.skipped ? '(skip)' : `${r.credits} cr`);
          break;
        } catch (e) {
          console.log(attempt === 2 ? 'ERR' : 'retry', path.basename(f), e.message);
        }
      }
    }
  }),
);
