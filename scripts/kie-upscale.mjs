// Апскейл фото через Kie AI (Topaz Image Upscale): восстанавливает детали без генерации нового содержимого.
// Запуск: node --env-file=.env scripts/kie-upscale.mjs <outDir> <factor 2|4> <file1> [file2 ...]
// Готовые файлы пропускаются — скрипт можно перезапускать.
import fs from 'node:fs';
import path from 'node:path';

const KEY = process.env.KIE_API_KEY;
if (!KEY) throw new Error('KIE_API_KEY не задан (.env)');
const [outDir, factor = '2', ...files] = process.argv.slice(2);
if (!outDir || files.length === 0) throw new Error('usage: <outDir> <factor> <files...>');
fs.mkdirSync(outDir, { recursive: true });

const auth = { Authorization: `Bearer ${KEY}` };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function upload(file) {
  const fd = new FormData();
  fd.append('file', new Blob([fs.readFileSync(file)]), path.basename(file));
  fd.append('uploadPath', 'ecobr-upscale');
  fd.append('fileName', path.basename(file));
  const r = await fetch('https://kieai.redpandaai.co/api/file-stream-upload', { method: 'POST', headers: auth, body: fd });
  const j = await r.json();
  const url = j?.data?.downloadUrl;
  if (!url) throw new Error(`upload ${file}: ${JSON.stringify(j)}`);
  return url;
}

async function upscale(file) {
  const out = path.join(outDir, path.basename(file).replace(/\.\w+$/, '.png'));
  if (fs.existsSync(out)) return { file, skipped: true };
  const imageUrl = await upload(file);
  const r = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'topaz/image-upscale', input: { image_url: imageUrl, upscale_factor: factor } }),
  });
  const j = await r.json();
  const taskId = j?.data?.taskId;
  if (!taskId) throw new Error(`createTask ${file}: ${JSON.stringify(j)}`);
  for (let i = 0; i < 120; i++) {
    await sleep(5000);
    const s = await (await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, { headers: auth })).json();
    const st = s?.data?.state;
    if (st === 'success') {
      const url = JSON.parse(s.data.resultJson).resultUrls[0];
      const img = Buffer.from(await (await fetch(url)).arrayBuffer());
      fs.writeFileSync(out, img);
      return { file, credits: s.data.creditsConsumed, ms: s.data.costTime };
    }
    if (st === 'fail') throw new Error(`task ${file}: ${s.data.failCode} ${s.data.failMsg}`);
  }
  throw new Error(`timeout ${file}`);
}

// Не больше 4 задач одновременно (лимит API — 20 запросов за 10 с)
const queue = [...files];
const results = [];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const f = queue.shift();
      try {
        const res = await upscale(f);
        results.push(res);
        console.log('ok', path.basename(f), res.skipped ? '(skip)' : `${res.credits} cr, ${res.ms} ms`);
      } catch (e) {
        console.log('ERR', path.basename(f), e.message);
      }
    }
  }),
);
console.log('done', results.length, '/', files.length);
