// Готує зображення для сайту: assets-src/ -> public/img/ (AVIF + WebP у кількох ширинах)
// і пише маніфест src/data/images.json, з якого компонент <Img> бере розміри.
// Запуск: node scripts/build-images.mjs
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'assets-src';
const OUT = 'public/img';

/** name -> { file, widths, trim?, extract? } */
const jobs = {
  'dog-lab': { file: 'dog-hero.png', widths: [640, 1000, 1500], trim: true },
  'cat-tabby': { file: 'cat-tabby.png', widths: [480, 900], trim: true },
  'dog-golden': { file: 'dog-golden.png', widths: [480, 900], trim: true },
  'team-viktoriia': { file: 'team-viktoriia.png', widths: [420, 840], trim: true },
  'team-vlada': { file: 'team-vlada.png', widths: [420, 840], trim: true },
  'team-olha': { file: 'team-olha.png', widths: [420, 840], trim: true },
  'team-stepan': { file: 'team-stepan.png', widths: [420, 840], trim: true },
  'svc-therapy': { file: 'svc-therapy.jpg', widths: [480, 930] },
  'svc-vaccination': { file: 'svc-vaccination.jpg', widths: [480, 930] },
  'svc-dentistry': { file: 'svc-dentistry.jpg', widths: [480, 930] },
  'svc-lab': { file: 'svc-lab.jpg', widths: [480, 930] },
  'svc-surgery': { file: 'svc-surgery.jpg', widths: [480, 930] },
  'svc-checkup': { file: 'svc-checkup.jpg', widths: [640, 1280] },
  'clinic-reception': { file: 'clinic-reception.jpg', widths: [480, 960] },
  'clinic-cat': { file: 'clinic-cat.jpg', widths: [480, 960] },
  'logo-mark': {
    file: 'logo-original.png',
    widths: [96, 192],
    extract: { left: 151, top: 345, width: 1116, height: 840 },
  },
};

await mkdir(OUT, { recursive: true });
const manifest = {};

for (const [name, job] of Object.entries(jobs)) {
  let base = sharp(path.join(SRC, job.file));
  if (job.extract) base = base.extract(job.extract);
  if (job.trim) base = base.trim({ threshold: 8 });
  const buf = await base.png().toBuffer();
  const meta = await sharp(buf).metadata();
  // Не збільшуємо зображення понад оригінал: завеликі ширини зводимо до ширини джерела
  const widths = [...new Set(job.widths.map((w) => Math.min(w, meta.width)))];

  for (const w of widths) {
    const resized = sharp(buf).resize({ width: w });
    await resized.clone().webp({ quality: 80, alphaQuality: 90, effort: 5 }).toFile(`${OUT}/${name}-${w}.webp`);
    await resized.clone().avif({ quality: 55, effort: 5 }).toFile(`${OUT}/${name}-${w}.avif`);
  }
  manifest[name] = { width: meta.width, height: meta.height, widths };
  console.log(name, meta.width + 'x' + meta.height, widths.join(','));
}

// Соцмережева картка 1200x630: суцільний помаранчевий фон + собака
const og = await sharp(path.join(SRC, 'dog-hero.png')).trim({ threshold: 8 }).resize({ height: 600 }).toBuffer();
const ogMeta = await sharp(og).metadata();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#D2460A' } })
  .composite([{ input: og, left: 1200 - ogMeta.width, top: 30 }])
  .jpeg({ quality: 86 })
  .toFile('public/og.jpg');

// Іконки
const mark = sharp(path.join(SRC, 'logo-original.png')).extract(jobs['logo-mark'].extract);
const icon = async (size, file) => {
  const inner = await mark.clone().resize({ width: Math.round(size * 0.82), height: Math.round(size * 0.82), fit: 'contain', background: '#ffffff' }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 3, background: '#ffffff' } })
    .composite([{ input: inner, gravity: 'center' }])
    .png()
    .toFile(file);
};
await icon(180, 'public/apple-touch-icon.png');
await icon(48, 'public/favicon.png');
await icon(512, 'public/icon-512.png');

await writeFile('src/data/images.json', JSON.stringify(manifest, null, 2) + '\n');
console.log('done');
