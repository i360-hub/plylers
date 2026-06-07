// Download all live CDN images, optimize to responsive WebP, save to public/images.
// Logo kept as transparent PNG (+ webp). Produces image-map.json (base URL -> local file).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '..');
const OUT = resolve(ROOT, 'public/images');
mkdirSync(OUT, { recursive: true });

const manifest = JSON.parse(readFileSync(resolve(ROOT, 'discovery/analysis/image_manifest.json'), 'utf8'));
const bases = [...new Set(Object.values(manifest).flat())];

function slugify(base) {
  let seg = base.split('/opt/').pop() || base.split('/').pop();
  seg = decodeURIComponent(seg).replace(/\.[a-z0-9]+$/i, '');
  seg = seg.replace(/[+_\s]+/g, '-').replace(/[^a-z0-9-]/gi, '').replace(/-+/g, '-').toLowerCase();
  return seg;
}
function widthUrl(base, w) {
  const ext = base.split('.').pop();
  const stem = base.slice(0, -(ext.length + 1));
  return `${stem}-${w}w.${ext}`;
}
async function fetchBuf(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

const map = {};
let ok = 0, fail = 0;

for (const base of bases) {
  let name = slugify(base);
  const isLogo = /logo/.test(name);
  if (isLogo) name = 'plylers-tree-service-logo';
  try {
    const buf = await fetchBuf(widthUrl(base, 1600));
    if (isLogo) {
      // transparent PNG, trimmed/padded sensibly; also a webp
      await sharp(buf).resize({ width: 600, withoutEnlargement: true }).png({ quality: 90 }).toFile(resolve(OUT, `${name}.png`));
      await sharp(buf).resize({ width: 600, withoutEnlargement: true }).webp({ quality: 90 }).toFile(resolve(OUT, `${name}.webp`));
      map[base] = `/images/${name}.png`;
    } else {
      // photo: 1280 + 640 webp
      await sharp(buf).resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 78 }).toFile(resolve(OUT, `${name}.webp`));
      await sharp(buf).resize({ width: 640, withoutEnlargement: true }).webp({ quality: 78 }).toFile(resolve(OUT, `${name}-640.webp`));
      map[base] = `/images/${name}.webp`;
    }
    ok++;
    process.stdout.write(`  ✓ ${name}\n`);
  } catch (e) {
    fail++;
    process.stdout.write(`  ✗ ${name}  (${e.message})\n`);
  }
}

// favicon
try {
  const fav = await fetchBuf('https://irp.cdn-website.com/b541ccba/dms3rep/multi/favicon+image.png');
  await sharp(fav).resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toFile(resolve(OUT, 'favicon.png'));
  await sharp(fav).resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } }).png().toFile(resolve(OUT, 'favicon-32.png'));
  console.log('  ✓ favicon.png');
} catch (e) { console.log('  ✗ favicon', e.message); }

writeFileSync(resolve(ROOT, 'discovery/analysis/image-map.json'), JSON.stringify(map, null, 2));
console.log(`\nDone: ${ok} ok, ${fail} failed. Map -> discovery/analysis/image-map.json`);
