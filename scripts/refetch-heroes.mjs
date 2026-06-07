// Re-fetch all hero images from the CDN at the largest available resolution and
// re-encode at high quality (q82). Fixes thumbnails that got used full-bleed.
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/images');
const map = JSON.parse(readFileSync(resolve(ROOT, 'discovery/analysis/image-map.json'), 'utf8'));
// reverse: local file -> CDN base URL
const local2base = {};
for (const [base, local] of Object.entries(map)) local2base[local.replace('/images/', '').replace(/\.webp$/, '')] = base;

const heroes = [
  'arkadelphia-ar-bucket-truck-dead-tree-removal-residential',
  'arkadelphia-ar-hazardous-leaning-pine-tree-before-removal',
  'arkadelphia-ar-large-oak-overhanging-residential-home-sunset',
  'arkadelphia-ar-large-tree-risk-assessment-backyard-deck',
  'arkadelphia-ar-storm-damage-uprooted-oak-tree-removal',
  'glenwood-ar-arborist-harness-high-canopy-branch-removal',
  'glenwood-ar-large-tree-felling-chainsaw-professional',
  'hot-springs-ar-arborist-climbing-aerial-tree-work',
  'hot-springs-ar-gated-property-entrance-stump-removal',
  'hot-springs-ar-residential-tree-removal-wood-chip-cleanup',
  'malvern-ar-large-mature-oak-tree-assessment-commercial',
  'malvern-ar-stump-grinding-land-clearing-skid-steer',
];
const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'Referer': 'https://www.plylerstreeservice.com/' };
const widthUrl = (base, w) => { const ext = base.split('.').pop(); return `${base.slice(0, -(ext.length + 1))}-${w}w.${ext}`; };

async function fetchBuf(url) {
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(url, { headers: UA }); if (r.ok) return Buffer.from(await r.arrayBuffer()); } catch {}
    await new Promise((res) => setTimeout(res, 500 * (i + 1)));
  }
  return null;
}

for (const name of heroes) {
  const base = local2base[name];
  if (!base) { console.log('✗ no base for', name); continue; }
  // try widths largest-first; pick the first that decodes to >= 1100px wide (or the biggest we get)
  let best = null, bestW = 0;
  for (const w of [1920, 1600, 1280, 1024]) {
    const buf = await fetchBuf(widthUrl(base, w));
    if (!buf) continue;
    try {
      const meta = await sharp(buf).metadata();
      if (meta.width > bestW) { best = buf; bestW = meta.width; }
      if (meta.width >= 1500) break; // good enough
    } catch {}
  }
  if (!best) { console.log('✗ fetch failed', name); continue; }
  await sharp(best).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(resolve(OUT, `${name}.webp`));
  await sharp(best).resize({ width: 640, withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(resolve(OUT, `${name}-640.webp`));
  const m = await sharp(resolve(OUT, `${name}.webp`)).metadata();
  console.log(`✓ ${name}  src=${bestW}px -> ${m.width}x${m.height} ${(statSync(resolve(OUT, `${name}.webp`)).size / 1024 | 0)}KB`);
}

// home hero: clean landscape crop from the malvern oak source, q82, no blur
{
  const base = local2base['malvern-ar-large-mature-oak-tree-assessment-commercial'];
  let buf = null;
  for (const w of [1920, 1600]) { buf = await fetchBuf(widthUrl(base, w)); if (buf) break; }
  if (buf) {
    await sharp(buf).resize({ width: 1600, height: 900, fit: 'cover', position: 'attention' }).webp({ quality: 80, effort: 5 }).toFile(resolve(OUT, 'hero-home.webp'));
    const m = await sharp(resolve(OUT, 'hero-home.webp')).metadata();
    console.log(`✓ hero-home  -> ${m.width}x${m.height} ${(statSync(resolve(OUT, 'hero-home.webp')).size / 1024 | 0)}KB`);
  }
}
console.log('done');
