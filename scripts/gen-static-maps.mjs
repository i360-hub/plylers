// Generate self-hosted static map images by stitching OpenStreetMap tiles.
// Keyless, build-time only (no runtime third-party calls). OSM attribution baked in.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/images');
mkdirSync(OUT, { recursive: true });
const maps = JSON.parse(readFileSync(resolve(ROOT, 'src/data/maps.json'), 'utf8'));
const UA = 'PlylersTreeServiceStaticMap/1.0 (+https://www.plylerstreeservice.com; info@plylerstreeservice.com)';

const W = 1200, H = 460;
const lon2x = (lon, z) => ((lon + 180) / 360) * 2 ** z;
const lat2y = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z;
};

async function tile(z, x, y) {
  const n = 2 ** z;
  x = ((x % n) + n) % n;
  if (y < 0 || y >= n) return null;
  const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(url, { headers: { 'User-Agent': UA } }); if (r.ok) return Buffer.from(await r.arrayBuffer()); } catch {}
    await new Promise((res) => setTimeout(res, 400 * (i + 1)));
  }
  return null;
}

const pinSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
    <path d="M20 2C11 2 4 9 4 18c0 11 16 32 16 32s16-21 16-32C36 9 29 2 20 2z" fill="#2e7d46" stroke="#fff" stroke-width="2.5"/>
    <circle cx="20" cy="18" r="6" fill="#fff"/>
  </svg>`);
const attrSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect x="${W - 232}" y="${H - 24}" width="232" height="24" fill="rgba(255,255,255,0.78)"/>
    <text x="${W - 8}" y="${H - 8}" font-family="Arial, sans-serif" font-size="12" fill="#333" text-anchor="end">© OpenStreetMap contributors</text>
  </svg>`);

async function genOne(slug, lat, lon, z) {
  const cx = lon2x(lon, z) * 256, cy = lat2y(lat, z) * 256;
  const left = cx - W / 2, top = cy - H / 2;
  const tx0 = Math.floor(left / 256), ty0 = Math.floor(top / 256);
  const tx1 = Math.floor((left + W) / 256), ty1 = Math.floor((top + H) / 256);
  const composites = [];
  for (let tx = tx0; tx <= tx1; tx++) {
    for (let ty = ty0; ty <= ty1; ty++) {
      const buf = await tile(z, tx, ty);
      if (!buf) continue;
      composites.push({ input: buf, left: Math.round(tx * 256 - left), top: Math.round(ty * 256 - top) });
    }
  }
  if (!composites.length) { console.log('  ✗ no tiles for', slug); return; }
  const base = sharp({ create: { width: W, height: H, channels: 3, background: '#e8eef0' } });
  let img = await base.composite(composites).png().toBuffer();
  img = await sharp(img).composite([
    { input: pinSvg, left: Math.round(W / 2 - 20), top: Math.round(H / 2 - 50) },
    { input: attrSvg, left: 0, top: 0 },
  ]).webp({ quality: 80 }).toBuffer();
  const name = `map-${slug.replace(/^\//, '').replace(/\/$/, '') || 'service-area'}`;
  writeFileSync(resolve(OUT, `${name}.webp`), img);
  console.log(`  ✓ ${name}.webp (${(img.length / 1024 | 0)}KB)  @ ${lat},${lon} z${z}`);
}

const ONLY = process.argv[2]; // optional: only this slug
for (const [slug, url] of Object.entries(maps)) {
  if (ONLY && slug !== ONLY) continue;
  const m = url.match(/!2d(-?\d+\.?\d*)!3d(-?\d+\.?\d*)/);
  if (!m) { console.log('  ? no center in', slug); continue; }
  const lon = parseFloat(m[1]), lat = parseFloat(m[2]);
  const z = slug === '/' ? 9 : 11; // home = wider county view
  await genOne(slug, lat, lon, z);
}
console.log('done');
