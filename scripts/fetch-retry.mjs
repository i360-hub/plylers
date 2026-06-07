import { writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/images');

const targets = [
  { base: 'https://lirp.cdn-website.com/b541ccba/dms3rep/multi/opt/glenwood-ar-arborist-harness-high-canopy-branch-removal-17411336.png', name: 'glenwood-ar-arborist-harness-high-canopy-branch-removal-17411336' },
  { base: 'https://lirp.cdn-website.com/b541ccba/dms3rep/multi/opt/glenwood-ar-arborist-harness-high-canopy-branch-removal.png', name: 'glenwood-ar-arborist-harness-high-canopy-branch-removal' },
  { base: 'https://lirp.cdn-website.com/b541ccba/dms3rep/multi/opt/pexels-photo-35385422.png', name: 'pexels-photo-35385422' },
];
const widthUrl = (base, w) => { const ext = base.split('.').pop(); return `${base.slice(0, -(ext.length + 1))}-${w}w.${ext}`; };
async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return Buffer.from(await r.arrayBuffer()); } catch {}
    await new Promise((res) => setTimeout(res, 600 * (i + 1)));
  }
  throw new Error('failed ' + url);
}
const map = JSON.parse(readFileSync(resolve(ROOT, 'discovery/analysis/image-map.json'), 'utf8'));
for (const t of targets) {
  const buf = await get(widthUrl(t.base, 1600));
  await sharp(buf).resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 78 }).toFile(resolve(OUT, `${t.name}.webp`));
  await sharp(buf).resize({ width: 640, withoutEnlargement: true }).webp({ quality: 78 }).toFile(resolve(OUT, `${t.name}-640.webp`));
  map[t.base] = `/images/${t.name}.webp`;
  console.log('  ✓', t.name);
}
writeFileSync(resolve(ROOT, 'discovery/analysis/image-map.json'), JSON.stringify(map, null, 2));
console.log('retry done');
