// Видео из фото через Kie AI (Kling 3.0 image-to-video) — для живого первого экрана.
// Запуск: node --env-file=.env scripts/kie-video.mjs <image> <out.mp4> "<prompt>" [aspect 16:9|9:16]
import fs from 'node:fs';
import path from 'node:path';

const KEY = process.env.KIE_API_KEY;
if (!KEY) throw new Error('KIE_API_KEY не задан (.env)');
const [image, out, prompt, aspect = '16:9'] = process.argv.slice(2);
if (!image || !out || !prompt) throw new Error('usage: <image> <out.mp4> <prompt> [aspect]');
const auth = { Authorization: `Bearer ${KEY}` };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fd = new FormData();
fd.append('file', new Blob([fs.readFileSync(image)]), path.basename(image));
fd.append('uploadPath', 'ecobr-video');
fd.append('fileName', path.basename(image));
const up = await (await fetch('https://kieai.redpandaai.co/api/file-stream-upload', { method: 'POST', headers: auth, body: fd })).json();
const url = up?.data?.downloadUrl;
if (!url) throw new Error(`upload: ${JSON.stringify(up)}`);

const task = await (
  await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'kling-3.0/video',
      input: { prompt, image_urls: [url], sound: false, duration: '5', aspect_ratio: aspect, mode: 'std', multi_shots: false, multi_prompt: [], kling_elements: [] },
    }),
  })
).json();
const taskId = task?.data?.taskId;
if (!taskId) throw new Error(`createTask: ${JSON.stringify(task)}`);
console.log('task', taskId);

for (let i = 0; i < 150; i++) {
  await sleep(10000);
  const s = await (await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, { headers: auth })).json();
  const st = s?.data?.state;
  if (st === 'success') {
    const res = JSON.parse(s.data.resultJson).resultUrls[0];
    fs.writeFileSync(out, Buffer.from(await (await fetch(res)).arrayBuffer()));
    console.log('ok', out, 'credits', s.data.creditsConsumed);
    process.exit(0);
  }
  if (st === 'fail') throw new Error(`fail: ${s.data.failCode} ${s.data.failMsg}`);
}
throw new Error('timeout');
