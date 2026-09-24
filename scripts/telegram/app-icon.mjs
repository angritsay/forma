#!/usr/bin/env node
/**
 * The 640×360 image BotFather asks for when a Mini App is created (`/newapp`).
 *
 * It is the card people see in a Telegram link preview and in the bot's profile, so it is the
 * brand's first frame: the graphite ground, the Unbounded wordmark and the brand's light blue —
 * the same faces and tokens as the OG cards (scripts/seo/og.mjs, src/styles/global.css), cropped
 * to Telegram's aspect ratio. Rendered here rather than exported by hand so it stays in step with
 * the brand and can be regenerated in a second.
 *
 *   npm run telegram:icon            → media/telegram/app-icon.png
 *   npm run telegram:icon -- --out x.png
 *
 * After regenerating, the image has to be uploaded to BotFather by hand (`/myapps` → the app →
 * Edit Photo); nothing here can push it.
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { BODY, FONTS_DIR, WORDMARK, WORDMARK_THIN, advanceWidth } from '../seo/font-metrics.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const WIDTH = 640;
const HEIGHT = 360;

// Tokens from src/styles/global.css, as literals: an SVG handed to resvg has no custom properties.
const BG = '#121212';
const TEXT = '#F6F6F7';
const MUTED = '#B9B9C0';
const ACCENT = '#AFE9FD';

const args = process.argv.slice(2);
const outArg = args.indexOf('--out');
const OUT =
  outArg >= 0 && args[outArg + 1]
    ? args[outArg + 1]
    : join(ROOT, 'media', 'telegram', 'app-icon.png');

/**
 * Brand card: the wordmark with a light-blue swoosh under it, the tagline with its key words in
 * the same light blue, and what is inside the app in the quiet grey.
 *
 * The wordmark is the one in src/components/ui/Logo.tsx — «FOR» at 800, «MA» at 200, the F
 * stretched ×1.22 with a wider gap after it — measured piece by piece against the faces it is
 * drawn in, like the OG cards' wordmark. The swoosh is the site's hand-drawn underline; on graphite
 * it is light blue rather than the neon it wears on a blue field, because this card has no action.
 */
function svg() {
  const x = 56;
  const size = 64;
  const y = 164;
  const tracking = size * 0.05;
  const fWidth = advanceWidth('F', WORDMARK) * size * 1.22 + size * 0.16;
  const orWidth = (advanceWidth('OR', WORDMARK) + 0.05 * 2) * size;
  const maWidth = (advanceWidth('MA', WORDMARK_THIN) + 0.05 * 2) * size;
  const markWidth = fWidth + orWidth + maWidth - tracking;
  const lineY = y + 26;
  const head = 'Кроссфит дома. ';
  const headWidth = advanceWidth(head, BODY) * 26;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG}"/>
  <g fill="${TEXT}" font-family="Unbounded" font-size="${size}">
    <text x="0" y="${y}" font-weight="800" transform="translate(${x} 0) scale(1.22 1)">F</text>
    <text x="${(x + fWidth).toFixed(1)}" y="${y}" font-weight="800" letter-spacing="${tracking}">OR</text>
    <text x="${(x + fWidth + orWidth).toFixed(1)}" y="${y}" font-weight="200" letter-spacing="${tracking}">MA</text>
  </g>
  <path d="M${x + 2} ${lineY + 5} C${(x + markWidth * 0.3).toFixed(1)} ${lineY - 2} ${(x + markWidth * 0.7).toFixed(1)} ${lineY - 3} ${(x + markWidth - 2).toFixed(1)} ${lineY + 2}" stroke="${ACCENT}" stroke-width="6" fill="none" stroke-linecap="round"/>
  <text x="${x}" y="252" font-family="Onest" font-size="26" fill="${TEXT}">${head}<tspan x="${(x + headWidth).toFixed(1)}" fill="${ACCENT}">Под тебя.</tspan></text>
  <text x="${x}" y="292" font-family="Onest" font-size="20" fill="${MUTED}">Курсы · клуб · тренер — в Telegram</text>
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
