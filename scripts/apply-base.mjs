// Додає префікс до кореневих шляхів у зібраному сайті, щоб він працював у підпапці,
// наприклад на GitHub Pages: https://<user>.github.io/petman-web/.
// У коді посилання лишаються від кореня («/tsiny/»), тож локальна розробка не змінюється.
// Запуск після збірки: BASE_PATH=/petman-web node scripts/apply-base.mjs
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DIST = 'dist';
const base = (process.env.BASE_PATH ?? '').replace(/\/+$/, '');
if (!base || base === '/') {
  console.log('BASE_PATH не задано, нічого не змінюю');
  process.exit(0);
}
if (!base.startsWith('/')) throw new Error(`BASE_PATH має починатися з «/»: ${base}`);

// Кореневий шлях: починається з одного «/», але не з «//» (протокол-відносні посилання) і ще не має префікса
const prefix = (url) =>
  url.startsWith('/') && !url.startsWith('//') && url !== base && !url.startsWith(`${base}/`) ? base + url : url;

const ATTRS = ['href', 'src', 'data-src', 'action', 'poster'];
const SET_ATTRS = ['srcset', 'imagesrcset'];

const fixCss = (css) => css.replace(/url\((['"]?)(\/[^)'"]*)\1\)/g, (_, q, url) => `url(${q}${prefix(url)}${q})`);

const fixHtml = (html) => {
  html = html.replace(new RegExp(`(\\s(?:${ATTRS.join('|')})=)(["'])(/[^"']*)\\2`, 'g'), (_, a, q, url) => `${a}${q}${prefix(url)}${q}`);
  html = html.replace(new RegExp(`(\\s(?:${SET_ATTRS.join('|')})=)(["'])([^"']*)\\2`, 'g'), (_, a, q, set) => {
    const fixed = set
      .split(',')
      .map((part) => part.replace(/^(\s*)(\S+)/, (__, sp, url) => sp + prefix(url)))
      .join(',');
    return `${a}${q}${fixed}${q}`;
  });
  // Інлайнові стилі й <style>
  return html.replace(/url\((['"]?)(\/[^)'"]*)\1\)/g, (_, q, url) => `url(${q}${prefix(url)}${q})`);
};

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

let count = 0;
for await (const file of walk(DIST)) {
  const ext = path.extname(file);
  let next;
  const src = await readFile(file, 'utf8').catch(() => null);
  if (src === null) continue;
  if (ext === '.html') next = fixHtml(src);
  else if (ext === '.css') next = fixCss(src);
  else if (file.endsWith('site.webmanifest')) {
    const m = JSON.parse(src);
    m.start_url = prefix(m.start_url ?? '/');
    m.icons = (m.icons ?? []).map((icon) => ({ ...icon, src: prefix(icon.src) }));
    next = JSON.stringify(m, null, 2) + '\n';
  } else continue;
  if (next !== src) {
    await writeFile(file, next);
    count++;
  }
}
console.log(`BASE_PATH ${base}: оновлено файлів — ${count}`);
