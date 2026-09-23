/**
 * Font metrics for the SVG cards this repository renders with resvg — the OG cards
 * (scripts/seo/og.mjs) and the Telegram Mini App card (scripts/telegram/app-icon.mjs). resvg lays
 * text out but cannot tell a script where a word ends, so both measure with the same faces they
 * draw with, from scripts/seo/fonts.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const FONTS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'fonts');

/**
 * Bundled OG faces, all baked latin+cyrillic so one file covers a Russian card.
 *
 * Display is Unbounded, in capitals, at three weights: 600 for the headline, 800 and 200 for the
 * wordmark's «FOR» and «MA». resvg picks a face by `font-weight`, so each weight is a separate
 * static instance (cut from Google's variable file with fontTools; see fonts/OFL-Unbounded.txt).
 * The keys below are for the metrics parser only — to the renderer every Unbounded file declares
 * the same family name and differs by weight.
 */
export const DISPLAY = 'Unbounded';
export const BODY = 'Onest';
export const WORDMARK = 'Unbounded800';
export const WORDMARK_THIN = 'Unbounded200';
const FONT_FILES = {
  [DISPLAY]: 'Unbounded-SemiBold.ttf',
  [WORDMARK]: 'Unbounded-ExtraBold.ttf',
  [WORDMARK_THIN]: 'Unbounded-ExtraLight.ttf',
  [BODY]: 'Onest-Regular.ttf',
};

/** @type {Map<string, {upem: number, cmap: Map<number, number>, hmtx: number[], fallback: number}>} */
const METRICS = new Map();

/**
 * Minimal TrueType reader: enough of `head`, `hhea`, `hmtx` and `cmap` to sum advance widths.
 * Kept inline rather than pulling in fontkit — the site build must not grow a dependency for a
 * few hundred lines of table parsing, and these two files never change without this script.
 * @param {string} family
 */
function metrics(family) {
  const cached = METRICS.get(family);
  if (cached) return cached;
  const buf = readFileSync(join(FONTS_DIR, FONT_FILES[family]));
  const u16 = (/** @type {number} */ o) => buf.readUInt16BE(o);
  const u32 = (/** @type {number} */ o) => buf.readUInt32BE(o);

  /** @type {Record<string, number>} */
  const tables = {};
  for (let i = 0, n = u16(4); i < n; i++) {
    const rec = 12 + i * 16;
    tables[buf.toString('ascii', rec, rec + 4)] = u32(rec + 8);
  }
  const upem = u16(tables.head + 18);
  const numHMetrics = u16(tables.hhea + 34);
  /** @type {number[]} */
  const hmtx = [];
  for (let i = 0; i < numHMetrics; i++) hmtx.push(u16(tables.hmtx + i * 4));

  // Pick a Unicode subtable: prefer format 12 (full range), else format 4 (BMP).
  const cmap = new Map();
  let best = 0;
  for (let i = 0, n = u16(tables.cmap + 2); i < n; i++) {
    const rec = tables.cmap + 4 + i * 8;
    const platform = u16(rec);
    const encoding = u16(rec + 2);
    const sub = tables.cmap + u32(rec + 4);
    const unicode = platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10));
    if (unicode && (best === 0 || u16(sub) === 12)) best = sub;
  }
  const format = u16(best);
  if (format === 12) {
    for (let g = 0, n = u32(best + 12); g < n; g++) {
      const rec = best + 16 + g * 12;
      const start = u32(rec);
      const end = u32(rec + 4);
      const startGlyph = u32(rec + 8);
      for (let cp = start; cp <= end; cp++) cmap.set(cp, startGlyph + (cp - start));
    }
  } else if (format === 4) {
    const segX2 = u16(best + 6);
    const ends = best + 14;
    const starts = ends + segX2 + 2;
    const deltas = starts + segX2;
    const ranges = deltas + segX2;
    for (let s2 = 0; s2 < segX2; s2 += 2) {
      const end = u16(ends + s2);
      const start = u16(starts + s2);
      const delta = buf.readInt16BE(deltas + s2);
      const rangeOffset = u16(ranges + s2);
      for (let cp = start; cp <= end && cp !== 0xffff; cp++) {
        let glyph;
        if (rangeOffset === 0) glyph = (cp + delta) & 0xffff;
        else {
          const at = ranges + s2 + rangeOffset + (cp - start) * 2;
          if (at + 1 >= buf.length) continue;
          const raw = u16(at);
          glyph = raw === 0 ? 0 : (raw + delta) & 0xffff;
        }
        if (glyph) cmap.set(cp, glyph);
      }
    }
  }
  // Space is the safest stand-in for a codepoint this face does not carry.
  const fallback = hmtx[cmap.get(0x20) ?? 0] ?? upem / 2;
  const m = { upem, cmap, hmtx, fallback };
  METRICS.set(family, m);
  return m;
}

/**
 * Advance width of `text` in em units (multiply by font size for pixels).
 * @param {string} text
 * @param {string} family
 */
export function advanceWidth(text, family) {
  const { upem, cmap, hmtx, fallback } = metrics(family);
  let total = 0;
  for (const ch of text) {
    const glyph = cmap.get(ch.codePointAt(0) ?? 0);
    const adv = glyph === undefined ? fallback : (hmtx[glyph] ?? hmtx[hmtx.length - 1] ?? fallback);
    total += adv;
  }
  return total / upem;
}
