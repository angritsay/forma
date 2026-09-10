/**
 * Vendor the placeholder photographs listed in src/lib/media/photos.ts into public/photos/.
 *
 * The photo registry points at Unsplash URLs because the session that introduced photo-led
 * layouts had no network route to images.unsplash.com. A static site should not fetch its own
 * artwork from someone else's CDN at runtime, so run this once from a machine that can reach it:
 *
 *   npm run media:placeholders
 *
 * It downloads each entry, writes public/photos/<name>.jpg, and prints the `local:` lines to
 * paste into the registry. It does NOT edit the registry — setting `local` is the deliberate act
 * that says "this photo is vendored", and it should be a reviewed diff.
 *
 * None of this makes the pictures right. They are stock frames of a gym standing in for a product
 * about training at home. Replacing them with real photographs of Sergey and of people training
 * in their own flats is a separate, and more important, job.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_DIR = join(ROOT, 'public', 'photos');

/** Read the registry without a TypeScript loader: the entries are plain data. */
async function loadPhotos() {
  const { PHOTOS } = await import('../../src/lib/media/photos.ts');
  return PHOTOS;
}

async function main() {
  const photos = await loadPhotos();
  await mkdir(OUT_DIR, { recursive: true });

  const vendored = [];
  let failed = 0;

  for (const [name, photo] of Object.entries(photos)) {
    if (photo.local) {
      console.log(`[photos] ${name}: already vendored at ${photo.local}`);
      continue;
    }
    const target = `/photos/${name}.jpg`;
    try {
      const res = await fetch(photo.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bytes = Buffer.from(await res.arrayBuffer());
      await writeFile(join(OUT_DIR, `${name}.jpg`), bytes);
      console.log(`[photos] ${name}: ${(bytes.length / 1024).toFixed(0)} KB → public${target}`);
      vendored.push([name, target]);
    } catch (err) {
      failed += 1;
      console.error(`[photos] ${name}: FAILED — ${err instanceof Error ? err.message : err}`);
    }
  }

  if (vendored.length > 0) {
    console.log('\nAdd these to the matching entries in src/lib/media/photos.ts:\n');
    for (const [name, target] of vendored) console.log(`  ${name}: { …, local: '${target}' },`);
  }
  if (failed > 0) process.exitCode = 1;
}

await main();
