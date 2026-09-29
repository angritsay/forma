#!/usr/bin/env node
/**
 * The raster app icons, rendered from the favicon.
 *
 * `public/favicon.svg` is the app mark and the only drawing of it. Browsers take an SVG for a tab,
 * but installing is another matter: Android's install prompt and splash screen want 192 and 512 px
 * PNGs in the manifest, and iOS ignores an SVG `apple-touch-icon` altogether and screenshots the
 * page instead. So the same file is rasterised at those three sizes rather than redrawn — the
 * colours stay whatever the favicon says (it carries the tokens; see ground-literals.test.ts), and
 * a change to the mark is one command away from every icon.
 *
 *   npm run pwa:icons   → public/icon-192.png, public/icon-512.png, public/apple-touch-icon.png
 *
 * The output is committed: the build does not run this, so the icons exist on a checkout without
 * the native resvg binary.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(HERE, '..', '..', 'public');

/*
 * The mark fills its square edge to edge and the letter sits well inside the middle 80%, so the
 * same picture serves as a maskable icon: whatever shape a launcher cuts, it cuts ground.
 * iOS rounds the corners of the 180 px one itself; nothing here pre-rounds them.
 */
const SIZES = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
];

const svg = readFileSync(join(PUBLIC, 'favicon.svg'), 'utf8');

for (const { file, size } of SIZES) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(join(PUBLIC, file), png);
  console.log(`public/${file}  ${size}×${size}  ${(png.length / 1024).toFixed(1)} KB`);
}
