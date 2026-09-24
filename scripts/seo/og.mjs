#!/usr/bin/env node
/**
 * OG image generator — renders 1200×630 PNGs into public/og/ with @resvg/resvg-js:
 *   default.png, hub-<home|courses|exercises|guides>-<locale>.png, course-<id>-<locale>.png,
 *   exercise-<id>-<locale>.png, guide-<translationKey>-<locale>.png
 *
 * Usage: npm run seo:og [-- --only default,hub,course,exercise,guide] [--limit N] [--quiet]
 * Run it before `astro build` (deploy.yml does). public/og/ is git-ignored; SeoHead falls back to
 * /og/default.png for any page whose PNG is missing (see src/lib/seo/meta.ts ogImagePath).
 *
 * Content is imported straight from the TypeScript sources through scripts/seo/ts-loader.mjs;
 * if that fails (older Node) the script falls back to a regex scan of content/ (names only).
 * The tile is a flat square of the programme colour. It used to carry a drawn stick figure; the
 * movements are filmed now, and a drawing of a movement we have on video is a worse picture of it.
 */
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import {
  BODY,
  DISPLAY,
  FONTS_DIR,
  WORDMARK,
  WORDMARK_THIN,
  advanceWidth,
} from './font-metrics.mjs';
import { loadContentIndex, loadGuides } from './lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const OUT_DIR = join(ROOT, 'public', 'og');
const WIDTH = 1200;
const HEIGHT = 630;
// Published languages, mirroring LOCALES in src/content/schema.ts: a card per page that exists.
const LOCALES = ['ru', 'en'];
/*
 * Third palette (src/styles/global.css): graphite ground (#121212, design/CHANGELOG.md §16), and
 * the only colour on a content card is the programme colour of the course it advertises, on the
 * tile. Brand and hub cards, which are about no course in particular, take a neutral surface
 * rather than a colour of their own — except the default card, which is the brand's own and wears
 * the hero field (see `template`).
 */
const BRAND_TILE = '#262626';
/**
 * The five course tiles (--tile-1..5 and the dumbbells colour): the three programme colours, then
 * the two neutral course tiles. Rotated per guide cluster so hub cards vary deterministically.
 * Electric blue and bleu ciel are not here on purpose: blue belongs to the club and the coach, and
 * the light blue to the interface. The two greys are the hidden courses' identity colours as
 * stored in content and in the database (§16 kept them when the surfaces went darker), so they do
 * not follow the surface ladder — a course's tile is its own, not a surface.
 */
const TILES = ['#FF5A00', '#F4FF3F', '#FFE6D0', '#2E2E2E', '#383838'];
const COLORS = {
  bg: '#121212',
  text: '#F6F6F7',
  muted: '#B9B9C0',
  muted2: '#A6A6AE',
  /* The hero field: electric blue, white type on it (7.71), the key word in light blue (5.7). */
  field: '#2038E2',
  onField: '#FFFFFF',
  onFieldQuiet: 'rgba(255,255,255,0.86)',
  accent: '#AFE9FD',
  action: '#F4FF3F',
};

// Node prints an ExperimentalWarning for type stripping; keep every other warning.
process.removeAllListeners('warning');
process.on('warning', (w) => {
  if (w.name !== 'ExperimentalWarning') console.warn(w);
});
register('./ts-loader.mjs', import.meta.url);

const args = parseArgs(process.argv.slice(2));
const only = args.only ? new Set(String(args.only).split(',')) : null;
const limit = args.limit ? Number(args.limit) : Infinity;
const log = args.quiet ? () => {} : (/** @type {string} */ m) => console.log(m);

/** @param {string[]} argv */
function parseArgs(argv) {
  /** @type {Record<string, string | boolean>} */
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      out[key] = next;
      i++;
    } else out[key] = true;
  }
  return out;
}

/* ------------------------------------------------------------------------------------------ */
/* Data                                                                                       */
/* ------------------------------------------------------------------------------------------ */

async function loadContent() {
  try {
    const [ex, co] = await Promise.all([
      import('../../content/exercises/index.ts'),
      import('../../content/courses/index.ts'),
    ]);
    const exercises = Array.isArray(ex.EXERCISES) ? ex.EXERCISES : [];
    const courses = Array.isArray(co.COURSES)
      ? [...co.COURSES].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      : [];
    return { exercises, courses, source: 'typescript' };
  } catch (err) {
    console.warn(
      `[og] could not import content TypeScript (${errMessage(err)}); using a regex scan`,
    );
    const idx = loadContentIndex(ROOT);
    return {
      exercises: [...idx.exercises.values()].map((e) => ({ id: e.id, name: e.name, slug: e.slug })),
      courses: [...idx.courses.values()].map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
      source: 'scan',
    };
  }
}

async function loadLabels() {
  /** @type {Record<string, Record<string, string>>} */
  const labels = {};
  for (const locale of LOCALES) {
    try {
      const [{ seo }, { common }] = await Promise.all([
        import(`../../src/i18n/${locale}/seo.ts`),
        import(`../../src/i18n/${locale}/common.ts`),
      ]);
      labels[locale] = { ...seo, tagline: common.tagline, brand: common.brand };
    } catch (err) {
      console.warn(
        `[og] could not import i18n for ${locale} (${errMessage(err)}); using minimal labels`,
      );
      labels[locale] =
        locale === 'ru'
          ? {
              ogExercise: 'Упражнение',
              ogCourse: 'Курс',
              ogGuide: 'Гайд',
              tagline: 'Кроссфит дома. Под тебя.',
              brand: 'Forma',
            }
          : {
              ogExercise: 'Exercise',
              ogCourse: 'Course',
              ogGuide: 'Guide',
              tagline: 'Home CrossFit that adapts to you.',
              brand: 'Forma',
            };
    }
  }
  return labels;
}

/** @param {unknown} err */
function errMessage(err) {
  return err instanceof Error ? err.message : String(err);
}

/* ------------------------------------------------------------------------------------------ */
/* SVG template                                                                               */
/* ------------------------------------------------------------------------------------------ */

/** @param {string} s */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Greedy word wrap measured against the real font, not an average glyph width.
 *
 * The previous heuristic multiplied character count by a per-family ratio and nudged Cyrillic by
 * a flat 1.06, which under-measured Russian by well over 10% — so RU titles were sized and broken
 * as if they were narrower than they render, and overflowed the card.
 *
 * @param {string} text
 * @param {number} fontSize
 * @param {number} maxWidth
 * @param {string} family — key into ADVANCES, so each face is measured with its own metrics
 */
function wrap(text, fontSize, maxWidth, family) {
  const width = (/** @type {string} */ s) => advanceWidth(s, family) * fontSize;
  /** @type {string[]} */
  const lines = [];
  let cur = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = cur ? `${cur} ${word}` : word;
    if (width(next) <= maxWidth || !cur) cur = next;
    else {
      lines.push(cur);
      cur = word;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * Pick the largest font size whose wrapped text fits in `maxLines`.
 * @param {string} text
 * @param {number[]} sizes
 * @param {number} maxWidth
 * @param {number} maxLines
 * @param {string} family
 */
function fitText(text, sizes, maxWidth, maxLines, family) {
  for (const size of sizes) {
    const lines = wrap(text, size, maxWidth, family);
    if (lines.length <= maxLines) return { size, lines };
  }
  const size = sizes[sizes.length - 1];
  const lines = wrap(text, size, maxWidth, family).slice(0, maxLines);
  const last = lines[maxLines - 1];
  if (last) lines[maxLines - 1] = `${last.replace(/[\s,;:–—-]+$/, '')}…`;
  return { size, lines };
}

/**
 * A card: graphite ground, the words on the left, the programme colour as a square on the right.
 *
 * With `field`, the card is the site's hero instead (Style A, global.css header): the whole card
 * is an electric-blue field inset from the edge, white type on it, the title's last word in the
 * brand's light blue with a hand-drawn neon swoosh under it, and no tile — the field is the colour.
 * Only the default card wears it: one field per screen, and the default is the brand's own screen.
 *
 * @param {{ eyebrow: string, title: string, subtitle: string, tile: string, brand: string, host: string, big?: boolean, field?: boolean }} c
 */
function template(c) {
  const field = c.field === true;
  const margin = field ? 104 : 80;
  // The tile is a sharp square: a colour swatch, not a card.
  const tile = { x: 720, y: 105, size: 420, r: 0 };
  const textWidth = field ? WIDTH - margin * 2 : tile.x - margin - 56;
  const ink = field
    ? { title: COLORS.onField, body: COLORS.onFieldQuiet, quiet: COLORS.onFieldQuiet }
    : { title: COLORS.text, body: COLORS.muted, quiet: COLORS.muted2 };
  /*
   * The headline is Unbounded, drawn exactly as the title is written — sentence case, and no
   * `toUpperCase()`. That call was here for as long as `.font-display` uppercased; the owner
   * retired capitals across the whole product, and a share card that still shouts is the
   * product's own preview disagreeing with the page behind it.
   *
   * Unbounded is wide — a Russian title takes half again the width it took in Manrope — hence
   * the modest size ladder: the fit picks the largest step that still wraps within three lines.
   * Sentence case sets about a quarter narrower, so the same string now reaches a larger step on
   * the ladder. That is the trade, not a regression: the ladder is unchanged and the measurement
   * decides, so a title that needed 32px in capitals gets 40 and still fits the same box.
   */
  const titleText = c.title;
  const title = fitText(
    titleText,
    c.big ? [96, 80] : [52, 46, 40, 36, 32],
    textWidth,
    c.big ? 1 : 3,
    DISPLAY,
  );
  /*
   * 1.08 → 1.2, and this one is a collision rather than a preference. 1.08 was drawn for
   * capitals, which have no descenders but the tails of Д, Ц and Щ, and it cleared Й's breve
   * above them with a little to spare. Add lowercase and Unbounded SemiBold's Cyrillic ink runs
   * -0.181em (у) to +0.987em (Ё) — 1.168em — so at 1.08 a у would be drawn inside the line below
   * it. 1.2 restores about the margin the capitals had. The subtitle's budget is measured down
   * from where the title ends, so it follows this number on its own.
   */
  const titleLineHeight = title.size * 1.2;
  /*
   * The kicker sits on one line at 20px. It is drawn as written and tracked 0.2 — the SVG
   * equivalent of `.eyebrow`'s 0.01em — where it used to be uppercased and tracked 3.6 (0.18em).
   * Both went together: wide tracking is what makes a row of capitals scannable and what pulls
   * lowercase apart.
   */
  const eyebrowY = 150;
  let y = c.eyebrow ? 216 : 190;
  const titleTop = y;
  const lastLine = title.lines.length - 1;
  /*
   * On the field the title's last word is the key word: light blue, a neon swoosh under it. The
   * split is on the last line only — the swoosh underlines one word, never a wrapped phrase.
   */
  const keyAt = field ? (title.lines[lastLine] ?? '').lastIndexOf(' ') + 1 : -1;
  const titleTspans = title.lines
    .map((line, i) => {
      const at = `x="${margin}" y="${(y + i * titleLineHeight).toFixed(1)}"`;
      if (i !== lastLine || keyAt < 0) return `<tspan ${at}>${esc(line)}</tspan>`;
      const head = line.slice(0, keyAt);
      return `<tspan ${at}>${esc(head)}<tspan fill="${COLORS.accent}">${esc(line.slice(keyAt))}</tspan></tspan>`;
    })
    .join('');
  let swoosh = '';
  if (field) {
    const line = title.lines[lastLine] ?? '';
    const x0 = margin + advanceWidth(line.slice(0, keyAt), DISPLAY) * title.size;
    const x1 = margin + advanceWidth(line, DISPLAY) * title.size;
    const base = titleTop + lastLine * titleLineHeight + title.size * 0.3;
    const w = x1 - x0;
    const sw = Math.max(5, title.size * 0.08);
    swoosh = `<path d="M${(x0 + 2).toFixed(1)} ${(base + sw).toFixed(1)} C${(x0 + w * 0.3).toFixed(1)} ${(base - sw * 0.4).toFixed(1)} ${(x0 + w * 0.68).toFixed(1)} ${(base - sw * 0.6).toFixed(1)} ${(x1 - 2).toFixed(1)} ${(base + sw * 0.3).toFixed(1)}" stroke="${COLORS.action}" stroke-width="${sw.toFixed(1)}" fill="none" stroke-linecap="round"/>`;
  }
  y += title.lines.length * titleLineHeight + (field ? 40 : 18);
  /*
   * How many subtitle lines actually fit above the wordmark.
   *
   * The subtitle was capped at a flat three lines wherever the title happened to leave it, which
   * on a three-line title put its last descender within a few pixels of the wordmark's cap
   * height — legible on its own, cramped in a Telegram preview. The budget is measured instead:
   * from the subtitle's first baseline down to the wordmark's cap line, less 20px of air.
   */
  const wordmarkCapY = HEIGHT - 62 - 36;
  const subtitleBudget = wordmarkCapY - 20 - y;
  const maxSubtitleLines = Math.max(1, Math.min(3, Math.floor(subtitleBudget / (26 * 1.4)) + 1));
  const subtitle = c.subtitle
    ? fitText(c.subtitle, [26, 24, 22], textWidth, maxSubtitleLines, BODY)
    : { size: 26, lines: [] };
  const subtitleTspans = subtitle.lines
    .map(
      (line, i) =>
        `<tspan x="${margin}" y="${(y + i * subtitle.size * 1.4).toFixed(1)}">${esc(line)}</tspan>`,
    )
    .join('');
  /*
   * The wordmark: «FOR» at 800 and «MA» at 200, the first F stretched ×1.22 with a wider gap
   * after it — the same three pieces as src/components/ui/Logo.tsx. Each piece is measured
   * against its own face so the next one starts where the last one ends; the F is drawn in its
   * own <text> because a <tspan> cannot carry the scale. No full stop: it went with the blue.
   */
  const wmSize = 36;
  const wmY = HEIGHT - 62;
  const wmTracking = wmSize * 0.05;
  const fWidth = advanceWidth('F', WORDMARK) * wmSize * 1.22 + wmSize * 0.16;
  const orWidth = (advanceWidth('OR', WORDMARK) + 0.05 * 2) * wmSize;
  const maWidth = (advanceWidth('MA', WORDMARK_THIN) + 0.05 * 2) * wmSize;
  const wordmarkWidth = fWidth + orWidth + maWidth;
  const wordmark = `
  <g fill="${ink.title}" font-family="Unbounded" font-size="${wmSize}">
    <text x="0" y="${wmY}" font-weight="800" transform="translate(${margin} 0) scale(1.22 1)">F</text>
    <text x="${(margin + fWidth).toFixed(1)}" y="${wmY}" font-weight="800" letter-spacing="${wmTracking}">OR</text>
    <text x="${(margin + fWidth + orWidth).toFixed(1)}" y="${wmY}" font-weight="200" letter-spacing="${wmTracking}">MA</text>
  </g>`;
  const inset = 36;
  const ground = field
    ? `<rect x="${inset}" y="${inset}" width="${WIDTH - inset * 2}" height="${HEIGHT - inset * 2}" rx="40" fill="${COLORS.field}"/>`
    : `<rect x="${tile.x}" y="${tile.y}" width="${tile.size}" height="${tile.size}" fill="${c.tile}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.bg}"/>
  ${ground}
  ${c.eyebrow ? `<text x="${margin}" y="${eyebrowY}" font-family="Onest" font-size="20" letter-spacing="0.2" fill="${ink.body}">${esc(c.eyebrow)}</text>` : ''}
  <text font-family="Unbounded" font-weight="600" font-size="${title.size}" fill="${ink.title}">${titleTspans}</text>${swoosh}
  <text font-family="Onest" font-size="${subtitle.size}" fill="${ink.body}">${subtitleTspans}</text>${wordmark}
  <text x="${(margin + wordmarkWidth + 26).toFixed(1)}" y="${wmY}" font-family="Onest" font-size="20" fill="${ink.quiet}">${esc(c.host)}</text>
</svg>`;
}

/* ------------------------------------------------------------------------------------------ */
/* Jobs                                                                                       */
/* ------------------------------------------------------------------------------------------ */

/** @param {{ ru?: string, en?: string } | string | undefined} v @param {string} locale */
function pick(v, locale) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return v[locale] ?? v.ru ?? v.en ?? '';
}

/** @param {string} text */
function firstSentence(text) {
  const m = text
    .replace(/\s+/g, ' ')
    .trim()
    .match(/^[^.!?…]+[.!?…]+/);
  return (m ? m[0] : text).trim();
}

/**
 * @param {Awaited<ReturnType<typeof loadContent>>} content
 * @param {Record<string, Record<string, string>>} labels
 * @param {string} host
 */
function buildJobs(content, labels, host) {
  /** @type {{ file: string, kind: string, card: Parameters<typeof template>[0] }[]} */
  const jobs = [];
  const brand = labels.ru.brand ?? 'Forma';
  /*
   * Only courses on sale get a card: a card is an invitation to a page, and a course held back
   * has none. The tile map below still walks every course, so an exercise that only appears in a
   * held-back course keeps a sensible tile on its own card.
   */
  const liveCourses = content.courses.filter((c) => c.published !== false);
  const courseTileForExercise = new Map();
  for (const course of content.courses) {
    for (const w of course.workouts ?? []) {
      for (const b of w.blocks ?? []) {
        for (const it of b.items ?? []) {
          if (!courseTileForExercise.has(it.exerciseId))
            courseTileForExercise.set(it.exerciseId, course.tile);
        }
      }
    }
  }

  jobs.push({
    file: 'default.png',
    kind: 'default',
    card: {
      eyebrow: '',
      title: brand,
      subtitle: LOCALES.map((loc) => labels[loc].tagline).join(' '),
      tile: BRAND_TILE,
      brand,
      host,
      big: true,
      field: true,
    },
  });

  for (const locale of LOCALES) {
    const L = labels[locale];
    const hubs = [
      ['home', brand, L.tagline],
      ['courses', L.coursesHubTitle ?? '', L.coursesHubDescription ?? ''],
      ['exercises', L.exercisesHubH1 ?? '', L.exercisesHubDescription ?? ''],
      ['guides', L.guidesHubH1 ?? '', L.guidesHubDescription ?? ''],
    ];
    for (const [id, title, subtitle] of hubs) {
      jobs.push({
        file: `hub-${id}-${locale}.png`,
        kind: 'hub',
        card: {
          eyebrow: '',
          title,
          subtitle,
          tile: BRAND_TILE,
          brand,
          host,
        },
      });
    }
    for (const course of liveCourses) {
      jobs.push({
        file: `course-${course.id}-${locale}.png`,
        kind: 'course',
        card: {
          eyebrow: L.ogCourse ?? '',
          title: pick(course.name, locale),
          subtitle: pick(course.tagline, locale),
          tile: typeof course.tile === 'string' ? course.tile : BRAND_TILE,
          brand,
          host,
        },
      });
    }
    for (const ex of content.exercises) {
      jobs.push({
        file: `exercise-${ex.id}-${locale}.png`,
        kind: 'exercise',
        card: {
          eyebrow: L.ogExercise ?? '',
          title: pick(ex.name, locale),
          subtitle: firstSentence(pick(ex.description, locale)),
          tile: courseTileForExercise.get(ex.id) ?? BRAND_TILE,
          brand,
          host,
        },
      });
    }
  }

  // Unpublished languages have no page, so they get no card: labels only cover LOCALES.
  const guides = loadGuides(ROOT).filter(
    (g) => g.data.draft !== true && LOCALES.includes(g.locale),
  );
  const clusterIndex = new Map();
  for (const g of guides) {
    const L = labels[g.locale];
    const cluster = String(g.data.cluster ?? '');
    if (!clusterIndex.has(cluster)) clusterIndex.set(cluster, clusterIndex.size);
    const clusterTitle = L[`cluster_${cluster}_title`] ?? cluster;
    const key = String(g.data.translationKey ?? g.slug);
    jobs.push({
      file: `guide-${key}-${g.locale}.png`,
      kind: 'guide',
      card: {
        eyebrow: `${L.ogGuide ?? ''} · ${clusterTitle}`,
        title: String(g.data.h1 ?? g.data.title ?? ''),
        subtitle: String(g.data.description ?? ''),
        tile: TILES[clusterIndex.get(cluster) % TILES.length],
        brand,
        host,
      },
    });
  }
  return jobs;
}

/* ------------------------------------------------------------------------------------------ */
/* Main                                                                                       */
/* ------------------------------------------------------------------------------------------ */

function fontOptions() {
  const files = existsSync(FONTS_DIR)
    ? readdirSync(FONTS_DIR)
        .filter((f) => /\.(ttf|otf)$/i.test(f))
        .map((f) => join(FONTS_DIR, f))
    : [];
  if (files.length > 0)
    return { fontFiles: files, loadSystemFonts: false, defaultFontFamily: 'Onest' };
  console.warn(
    '[og] bundled fonts not found in scripts/seo/fonts — falling back to system fonts (text may differ)',
  );
  return { loadSystemFonts: true };
}

async function main() {
  const started = Date.now();
  const siteUrl = (process.env.SITE_URL ?? '').replace(/\/$/, '');
  let host = '';
  try {
    host = siteUrl ? new URL(siteUrl).host : '';
  } catch {
    host = '';
  }
  const [content, labels] = await Promise.all([loadContent(), loadLabels()]);
  log(
    `[og] content: ${content.exercises.length} exercises, ${content.courses.length} courses (${content.source})`,
  );
  const font = fontOptions();
  mkdirSync(OUT_DIR, { recursive: true });

  let jobs = buildJobs(content, labels, host);
  if (only) jobs = jobs.filter((j) => only.has(j.kind));
  jobs = jobs.slice(0, limit);

  let written = 0;
  for (const job of jobs) {
    const svg = template(job.card);
    try {
      const png = new Resvg(svg, { font, fitTo: { mode: 'width', value: WIDTH } }).render().asPng();
      writeFileSync(join(OUT_DIR, job.file), png);
      written++;
    } catch (err) {
      console.error(`[og] failed to render ${job.file}: ${errMessage(err)}`);
      process.exitCode = 1;
    }
  }
  // A full run owns public/og: drop cards for content that no longer exists (renamed ids,
  // unpublished guides) so a stale PNG can never be picked up by ogImagePath().
  let pruned = 0;
  if (!only && limit === Infinity && process.exitCode !== 1) {
    const expected = new Set(jobs.map((j) => j.file));
    for (const f of readdirSync(OUT_DIR)) {
      if (/\.png$/i.test(f) && !expected.has(f)) {
        rmSync(join(OUT_DIR, f));
        pruned++;
      }
    }
  }
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  log(
    `[og] wrote ${written}/${jobs.length} images to public/og in ${secs}s` +
      (pruned ? `, removed ${pruned} stale` : ''),
  );
}

main().catch((err) => {
  console.error(`[og] ${errMessage(err)}`);
  process.exit(1);
});
