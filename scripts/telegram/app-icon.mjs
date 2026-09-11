#!/usr/bin/env node
/**
 * The 640×360 image BotFather asks for when a Mini App is created (`/newapp`).
 *
 * It is the card people see in a Telegram link preview and in the bot's profile, so it is the
 * brand's first frame: the same dark ground, blue glow and Manrope wordmark as the OG cards,
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
const TEXT = '#F4F4F6';
const MUTED = '#9A9AA3';
const ACCENT = '#9ECBFF';

const args = process.argv.slice(2);
const outArg = args.indexOf('--out');
const OUT =
  outArg >= 0 && args[outArg + 1]
    ? args[outArg + 1]
    : join(ROOT, 'media', 'telegram', 'app-icon.png');

/**
 * Brand card: a soft blue glow behind the wordmark, a hairline rule, tagline underneath.
 *
 * The wordmark's full stop is the accent — the one place blue appears at any size in the
 * identity — so it is drawn as its own <text> after measuring the name. The rule under it is a
 * flat 1px hairline rather than the 4px gradient bar it replaced.
 */
function svg() {
  // Measured from Manrope-ExtraBold.ttf: "FORMA" advances 3.501em, so 266.1px at 76px, less the
  // 1.5px of negative tracking applied after each of its five glyphs. Hard-coded because this
  // script does not carry the OG generator's font-metrics parser and the wordmark never changes;
  // re-measure if the face, the weight or the size does.
  const nameWidth = 258.6;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <radialGradient id="glow" cx="0.5" cy="0.1" r="0.9">
      <stop offset="0" stop-color="${ACCENT}" stop-opacity="0.22"/>
      <stop offset="0.55" stop-color="${ACCENT}" stop-opacity="0.07"/>
      <stop offset="1" stop-color="${BG}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG}"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
  <rect x="56" y="196" width="72" height="1" fill="${ACCENT}"/>
  <text x="56" y="168" font-family="Manrope" font-weight="800" font-size="76" letter-spacing="-1.5" fill="${TEXT}">FORMA</text>
  <text x="${56 + nameWidth}" y="168" font-family="Manrope" font-weight="800" font-size="76" fill="${ACCENT}">.</text>
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
