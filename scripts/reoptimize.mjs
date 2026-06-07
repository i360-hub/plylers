// Re-encode oversized hero/content webp to sane dimensions + bytes for fast LCP.
import { readdirSync, statSync, renameSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public/images');

const files = readdirSync(OUT).filter((f) => f.endsWith('.webp') && !f.endsWith('-640.webp'));
let saved = 0;
for (const f of files) {
  const p = resolve(OUT, f);
  const before = statSync(p).size;
  const meta = await sharp(p).metadata();
  // cap longest side to 1200, re-encode q72; downscale tall portraits
  const tmp = p + '.tmp';
  await sharp(p)
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 72, effort: 5 })
    .toFile(tmp);
  const after = statSync(tmp).size;
  if (after < before) { renameSync(tmp, p); saved += before - after; }
  else { renameSync(tmp, p); } // keep re-encoded anyway for consistent dims
  if (before > 200000) console.log(`  ${f}: ${(before/1024|0)}KB -> ${(after/1024|0)}KB (${meta.width}x${meta.height})`);
}
console.log(`\nTotal saved: ${(saved/1024/1024).toFixed(2)} MB`);
