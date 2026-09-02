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
 * The exercise/course figure comes from src/components/anim/render.ts (figureSvgString) when the
 * animation area has shipped it, else from src/components/anim/figures.json, else it is omitted.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { loadContentIndex, loadGuides } from './lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const OUT_DIR = join(ROOT, 'public', 'og');
const FONTS_DIR = join(HERE, 'fonts');
const WIDTH = 1200;
const HEIGHT = 630;
const LOCALES = ['ru', 'en'];
const BRAND_GRADIENT = ['#B9F3E0', '#C9D6FF'];
/** Pastel pairs for guide cards (rotated per cluster so hubs look varied but deterministic). */
const PASTELS = [
  ['#B9F3E0', '#C9D6FF'],
  ['#FFD6C2', '#D9C9FF'],
  ['#FFF1B8', '#B9F3E0'],
  ['#C9D6FF', '#FFC9E0'],
  ['#D9C9FF', '#FFD6C2'],
  ['#C2F0FF', '#D6FFC9'],
];
const COLORS = {
  bg: '#0B0B0D',
  text: '#F5F5F7',
  muted: '#9A9AA3',
  muted2: '#6B6B73',
  ink: '#0B0B0D',
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

/**
 * Returns a function (animationId) → standalone SVG string | null.
 */
async function loadFigureRenderer() {
  try {
    const mod = await import('../../src/components/anim/render.ts');
    if (typeof mod.figureSvgString === 'function') {
      log('[og] figure renderer: src/components/anim/render.ts');
      return (/** @type {string} */ id) => {
        try {
          return mod.figureSvgString(id, 0.35, { size: 320, background: false });
        } catch {
          return null;
        }
      };
    }
  } catch (err) {
    log(`[og] figure renderer unavailable (${errMessage(err).split('\n')[0]})`);
  }
  const json = join(ROOT, 'src', 'components', 'anim', 'figures.json');
  if (existsSync(json)) {
    /** @type {Record<string, string>} */
    const map = JSON.parse(readFileSync(json, 'utf8'));
    log('[og] figure renderer: src/components/anim/figures.json');
    return (/** @type {string} */ id) => map[id] ?? null;
  }
  log('[og] no figure renderer found — cards are rendered without the athlete figure');
  return () => null;
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
 * Greedy word wrap using an average glyph width (Playfair italic ≈ 0.5em, Manrope ≈ 0.57em;
 * Cyrillic runs a little wider).
 * @param {string} text
 * @param {number} fontSize
 * @param {number} maxWidth
 * @param {number} ratio
 */
function wrap(text, fontSize, maxWidth, ratio) {
  const cyr = /[Ѐ-ӿ]/.test(text) ? 1.06 : 1;
  const width = (/** @type {string} */ s) => [...s].length * fontSize * ratio * cyr;
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
 * @param {number} ratio
 */
function fitText(text, sizes, maxWidth, maxLines, ratio) {
  for (const size of sizes) {
    const lines = wrap(text, size, maxWidth, ratio);
    if (lines.length <= maxLines) return { size, lines };
  }
  const size = sizes[sizes.length - 1];
  const lines = wrap(text, size, maxWidth, ratio).slice(0, maxLines);
  const last = lines[maxLines - 1];
  if (last) lines[maxLines - 1] = `${last.replace(/[\s,;:–—-]+$/, '')}…`;
  return { size, lines };
}

/**
 * Turn a standalone SVG string into a nested <svg> placed inside the tile.
 * @param {string} svg
 * @param {number} x
 * @param {number} y
 * @param {number} size
 */
function embedFigure(svg, x, y, size) {
  const open = svg.match(/<svg\b[^>]*>/i);
  if (!open) return '';
  const vb = open[0].match(/viewBox="([^"]+)"/i)?.[1] ?? '0 0 200 200';
  const inner = svg.slice(open.index + open[0].length).replace(/<\/svg>\s*$/i, '');
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${vb}">${inner}</svg>`;
}

/**
 * @param {{ eyebrow: string, title: string, subtitle: string, gradient: string[], figureSvg: string | null, brand: string, host: string, big?: boolean }} c
 */
function template(c) {
  const margin = 80;
  const tile = { x: 720, y: 105, size: 420, r: 48 };
  const textWidth = tile.x - margin - 56;
  const title = fitText(
    c.title,
    c.big ? [120, 100] : [64, 56, 48, 42, 36],
    textWidth,
    c.big ? 1 : 3,
    0.5,
  );
  const subtitle = c.subtitle
    ? fitText(c.subtitle, [26, 24, 22], textWidth, 3, 0.55)
    : { size: 26, lines: [] };
  const titleLineHeight = title.size * 1.08;
  const eyebrowY = 150;
  let y = c.eyebrow ? 216 : 190;
  const titleTspans = title.lines
    .map(
      (line, i) =>
        `<tspan x="${margin}" y="${(y + i * titleLineHeight).toFixed(1)}">${esc(line)}</tspan>`,
    )
    .join('');
  y += title.lines.length * titleLineHeight + 18;
  const subtitleTspans = subtitle.lines
    .map(
      (line, i) =>
        `<tspan x="${margin}" y="${(y + i * subtitle.size * 1.4).toFixed(1)}">${esc(line)}</tspan>`,
    )
    .join('');
  const figure = c.figureSvg
    ? embedFigure(c.figureSvg, tile.x + 50, tile.y + 50, tile.size - 100)
    : '';
  const [g1, g2] = c.gradient;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${g1}"/>
      <stop offset="1" stop-color="${g2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.5" r="0.6">
      <stop offset="0" stop-color="${g1}" stop-opacity="0.18"/>
      <stop offset="1" stop-color="${g1}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.bg}"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
  <rect x="${tile.x}" y="${tile.y}" width="${tile.size}" height="${tile.size}" rx="${tile.r}" fill="url(#tile)"/>
  ${figure}
  ${c.eyebrow ? `<text x="${margin}" y="${eyebrowY}" font-family="Manrope" font-size="22" letter-spacing="2.2" fill="${COLORS.muted}">${esc(c.eyebrow.toUpperCase())}</text>` : ''}
  <text font-family="Playfair Display" font-style="italic" font-size="${title.size}" fill="${COLORS.text}">${titleTspans}</text>
  <text font-family="Manrope" font-size="${subtitle.size}" fill="${COLORS.muted}">${subtitleTspans}</text>
  <text x="${margin}" y="${HEIGHT - 62}" font-family="Playfair Display" font-style="italic" font-size="36" fill="${COLORS.text}">${esc(c.brand)}</text>
  <text x="${margin + c.brand.length * 20 + 20}" y="${HEIGHT - 62}" font-family="Manrope" font-size="20" fill="${COLORS.muted2}">${esc(c.host)}</text>
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
  /** @type {{ file: string, kind: string, card: Parameters<typeof template>[0] & { animation?: string } }[]} */
  const jobs = [];
  const brand = labels.ru.brand ?? 'Forma';
  const exerciseById = new Map(content.exercises.map((e) => [e.id, e]));
  const courseGradientForExercise = new Map();
  const courseFigure = new Map();
  for (const course of content.courses) {
    for (const w of course.workouts ?? []) {
      for (const b of w.blocks ?? []) {
        for (const it of b.items ?? []) {
          if (!courseGradientForExercise.has(it.exerciseId))
            courseGradientForExercise.set(it.exerciseId, course.gradient);
          if (!courseFigure.has(course.id))
            courseFigure.set(course.id, exerciseById.get(it.exerciseId)?.animation);
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
      subtitle: `${labels.ru.tagline} ${labels.en.tagline}`,
      gradient: BRAND_GRADIENT,
      figureSvg: null,
      brand,
      host,
      big: true,
      animation: 'burpee',
    },
  });

  for (const locale of LOCALES) {
    const L = labels[locale];
    const hubs = [
      ['home', brand, L.tagline, 'air_squat'],
      ['courses', L.coursesHubTitle ?? '', L.coursesHubDescription ?? '', 'db_thruster'],
      ['exercises', L.exercisesHubH1 ?? '', L.exercisesHubDescription ?? '', 'burpee'],
      ['guides', L.guidesHubH1 ?? '', L.guidesHubDescription ?? '', 'kb_swing'],
    ];
    for (const [id, title, subtitle, animation] of hubs) {
      jobs.push({
        file: `hub-${id}-${locale}.png`,
        kind: 'hub',
        card: {
          eyebrow: '',
          title,
          subtitle,
          gradient: BRAND_GRADIENT,
          figureSvg: null,
          brand,
          host,
          animation,
        },
      });
    }
    for (const course of content.courses) {
      jobs.push({
        file: `course-${course.id}-${locale}.png`,
        kind: 'course',
        card: {
          eyebrow: L.ogCourse ?? '',
          title: pick(course.name, locale),
          subtitle: pick(course.tagline, locale),
          gradient: Array.isArray(course.gradient) ? course.gradient : BRAND_GRADIENT,
          figureSvg: null,
          brand,
          host,
          animation: courseFigure.get(course.id),
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
          gradient: courseGradientForExercise.get(ex.id) ?? BRAND_GRADIENT,
          figureSvg: null,
          brand,
          host,
          animation: ex.animation,
        },
      });
    }
  }

  const guides = loadGuides(ROOT).filter((g) => g.data.draft !== true);
  const clusterIndex = new Map();
  for (const g of guides) {
    const L = labels[g.locale];
    const cluster = String(g.data.cluster ?? '');
    if (!clusterIndex.has(cluster)) clusterIndex.set(cluster, clusterIndex.size);
    const clusterTitle = L[`cluster_${cluster}_title`] ?? cluster;
    const key = String(g.data.translationKey ?? g.slug);
    const related = Array.isArray(g.data.relatedExercises) ? g.data.relatedExercises : [];
    jobs.push({
      file: `guide-${key}-${g.locale}.png`,
      kind: 'guide',
      card: {
        eyebrow: `${L.ogGuide ?? ''} · ${clusterTitle}`,
        title: String(g.data.h1 ?? g.data.title ?? ''),
        subtitle: String(g.data.description ?? ''),
        gradient: PASTELS[clusterIndex.get(cluster) % PASTELS.length],
        figureSvg: null,
        brand,
        host,
        animation: exerciseById.get(String(related[0] ?? ''))?.animation,
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
    return { fontFiles: files, loadSystemFonts: false, defaultFontFamily: 'Manrope' };
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
  const [content, labels, figureOf] = await Promise.all([
    loadContent(),
    loadLabels(),
    loadFigureRenderer(),
  ]);
  log(
    `[og] content: ${content.exercises.length} exercises, ${content.courses.length} courses (${content.source})`,
  );
  const font = fontOptions();
  mkdirSync(OUT_DIR, { recursive: true });

  let jobs = buildJobs(content, labels, host);
  if (only) jobs = jobs.filter((j) => only.has(j.kind));
  jobs = jobs.slice(0, limit);

  let written = 0;
  let figures = 0;
  for (const job of jobs) {
    const figureSvg = job.card.animation ? figureOf(job.card.animation) : null;
    if (figureSvg) figures++;
    const svg = template({ ...job.card, figureSvg });
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
    `[og] wrote ${written}/${jobs.length} images (${figures} with a figure) to public/og in ${secs}s` +
      (pruned ? `, removed ${pruned} stale` : ''),
  );
}

main().catch((err) => {
  console.error(`[og] ${errMessage(err)}`);
  process.exit(1);
});
