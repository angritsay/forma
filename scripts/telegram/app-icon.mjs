#!/usr/bin/env node
/**
 * The 640×360 image BotFather asks for when a Mini App is created (`/newapp`).
 *
 * It is the card people see in a Telegram link preview and in the bot's profile, so it is the
 * brand's first frame: the same dark ground, mint glow and Unbounded wordmark as the OG cards,
 * cropped to Telegram's aspect ratio. Rendered here rather than exported by hand so it stays in
 * step with the brand and can be regenerated in a second.
 *
 *   npm run telegram:icon            → media/telegram/app-icon.png
 *   npm run telegram:icon -- --out x.png
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const FONTS_DIR = join(ROOT, 'scripts', 'seo', 'fonts');
const WIDTH = 640;
const HEIGHT = 360;

const BG = '#0B0B0D';
const TEXT = '#F5F5F7';
const MUTED = '#9A9AA3';
const GRADIENT = ['#B9F3E0', '#C9D6FF'];

const args = process.argv.slice(2);
const outArg = args.indexOf('--out');
const OUT =
  outArg >= 0 && args[outArg + 1]
    ? args[outArg + 1]
    : join(ROOT, 'media', 'telegram', 'app-icon.png');

/** Brand card: a soft mint glow behind the wordmark, tagline underneath. */
function svg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <radialGradient id="glow" cx="0.5" cy="0.1" r="0.9">
      <stop offset="0" stop-color="${GRADIENT[0]}" stop-opacity="0.30"/>
      <stop offset="0.55" stop-color="${GRADIENT[1]}" stop-opacity="0.10"/>
      <stop offset="1" stop-color="${BG}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${GRADIENT[0]}"/>
      <stop offset="1" stop-color="${GRADIENT[1]}"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG}"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
  <rect x="56" y="196" width="72" height="4" rx="2" fill="url(#rule)"/>
  <text x="56" y="168" font-family="Unbounded" font-weight="700" font-size="76" fill="${TEXT}">Forma</text>
  <text x="56" y="240" font-family="Onest" font-size="24" fill="${MUTED}">Кроссфит дома. Под тебя.</text>
  <text x="56" y="284" font-family="Onest" font-size="20" fill="${MUTED}">5 курсов · нагрузка подстраивается под тебя</text>
</svg>`;
}

function fontOptions() {
  const files = existsSync(FONTS_DIR)
    ? readdirSync(FONTS_DIR)
        .filter((f) => /\.(ttf|otf)$/i.test(f))
        .map((f) => join(FONTS_DIR, f))
    : [];
  if (files.length > 0) {
    return { fontFiles: files, loadSystemFonts: false, defaultFontFamily: 'Onest' };
  }
  console.warn('[telegram] bundled fonts not found — falling back to system fonts');
  return { loadSystemFonts: true };
}

mkdirSync(dirname(OUT), { recursive: true });
const png = new Resvg(svg(), {
  font: fontOptions(),
  fitTo: { mode: 'width', value: WIDTH },
})
  .render()
  .asPng();
writeFileSync(OUT, png);
console.log(`${OUT}  ${WIDTH}×${HEIGHT}  ${(png.length / 1024).toFixed(0)} KB`);
