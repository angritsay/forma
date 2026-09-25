/**
 * Where everything on a story goes, computed without a canvas.
 *
 * `layoutStory` turns the session's facts and a template into a flat list of drawing operations;
 * `render.ts` only executes them. Text is measured through an injected `measure`, so the wrapping,
 * the fitting and the safe zones are unit-tested in node with a fake one.
 *
 * The frame is 1080×1920. Instagram and Telegram lay their own chrome over a story — the account
 * row at the top, the reply field at the bottom — so nothing that has to be read sits in the top
 * 250px or the bottom 300px (`SAFE_TOP`, `SAFE_BOTTOM`); only colour and decoration go there.
 * Side margins are 96px.
 *
 * Type: the workout's name in Unbounded 800, at most three lines, as large as it fits; the figures
 * in Unbounded 800; every label in Onest. The line height of a block of the display face is 1.2
 * (global.css `.display`) — any name may arrive, and a «у» on one line has to clear a «Ё» on the
 * next. The wordmark is drawn the way `Logo.tsx` draws it: F stretched ×1.22 at 800, OR at 800, MA
 * at 200, tracked .05em.
 */
import type { SessionFigure } from '@/app/features/player/summary/figures';
import { COLOUR } from '@/lib/ui/semantic';
import { TEMPLATES, type StoryTemplateId } from './templates';

export const STORY_W = 1080;
export const STORY_H = 1920;
export const MARGIN = 96;
export const SAFE_TOP = 250;
export const SAFE_BOTTOM = STORY_H - 300;
const CONTENT_W = STORY_W - MARGIN * 2;
const WHITE = '#ffffff';

export interface FontSpec {
  face: 'display' | 'body';
  weight: number;
  size: number;
}

/** The width of `text` set in `font`. The canvas's `measureText` in the app, a fake in tests. */
export type Measure = (text: string, font: FontSpec) => number;

export interface StoryData {
  workoutName: string;
  /** The course, or '' for a coach's own workout with none. */
  courseName: string;
  /** Already formatted («25 сентября»). */
  date: string;
  /** Three or four, from `storyFigures`. */
  figures: readonly SessionFigure[];
  /** 0..3, or null on a day that earns none. */
  stars: number | null;
  /** «Готово!» */
  doneWord: string;
  /** «Сделано» — the graphite template's sticker. */
  sticker: string;
  /** «forma-app.co» */
  domain: string;
}

export type Align = 'left' | 'center' | 'right';

export type StoryOp =
  | {
      kind: 'text';
      text: string;
      x: number;
      /** Alphabetic baseline. */
      y: number;
      font: FontSpec;
      colour: string;
      align: Align;
    }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; r: number; fill: string }
  | { kind: 'swoosh'; x: number; y: number; w: number; h: number; colour: string; width: number }
  | { kind: 'star'; cx: number; cy: number; r: number; colour: string; filled: boolean }
  | { kind: 'wordmark'; x: number; y: number; size: number; colour: string }
  /** Children drawn with the origin moved to (cx, cy) and turned by `angle` degrees. */
  | { kind: 'group'; cx: number; cy: number; angle: number; ops: StoryOp[] };

export function display(weight: number, size: number): FontSpec {
  return { face: 'display', weight, size };
}

export function body(weight: number, size: number): FontSpec {
  return { face: 'body', weight, size };
}

/* ---------------------------------------------------------------------------------------------
 * Text fitting
 * ------------------------------------------------------------------------------------------- */

/** Cut `text` to fit `maxWidth`, ending in «…». Returns it whole when it already fits. */
export function ellipsize(text: string, maxWidth: number, font: FontSpec, measure: Measure) {
  if (measure(text, font) <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && measure(`${cut.trimEnd()}…`, font) > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

/**
 * Greedy word wrap into at most `maxLines`. Whatever does not fit the last line is cut with «…»,
 * and a single word wider than the line is cut the same way.
 */
export function wrapText(
  text: string,
  maxWidth: number,
  font: FontSpec,
  measure: Measure,
  maxLines: number,
): { lines: string[]; overflow: boolean } {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let overflow = false;
  let line = '';
  for (let i = 0; i < words.length; i += 1) {
    const word = words[i] ?? '';
    const candidate = line ? `${line} ${word}` : word;
    if (measure(candidate, font) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) {
      lines.push(line);
      line = word;
    } else {
      line = word;
    }
    if (lines.length === maxLines) {
      overflow = true;
      line = '';
      break;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    overflow = true;
  }
  const out = lines.map((l) => {
    if (measure(l, font) > maxWidth) overflow = true;
    return ellipsize(l, maxWidth, font, measure);
  });
  if (overflow && out.length === maxLines) {
    const last = out[maxLines - 1] ?? '';
    if (!last.endsWith('…')) out[maxLines - 1] = ellipsize(`${last}…`, maxWidth, font, measure);
  }
  return { lines: out, overflow };
}

/**
 * The largest size (stepping down by 4px from `max` to `min`) at which the name wraps into
 * `maxLines` without being cut. At `min` it is wrapped and cut, rather than shrunk further — a
 * story is read at arm's length.
 */
export function fitHeadline(
  text: string,
  maxWidth: number,
  measure: Measure,
  opts: { max: number; min: number; maxLines: number; weight?: number },
): { size: number; lines: string[] } {
  const weight = opts.weight ?? 800;
  for (let size = opts.max; size >= opts.min; size -= 4) {
    const r = wrapText(text, maxWidth, display(weight, size), measure, opts.maxLines);
    if (!r.overflow) return { size, lines: r.lines };
  }
  const r = wrapText(text, maxWidth, display(weight, opts.min), measure, opts.maxLines);
  return { size: opts.min, lines: r.lines };
}

/** The largest size, up to `max`, at which one line of display type fits `maxWidth`. */
export function fitLine(text: string, maxWidth: number, measure: Measure, max: number, min = 40) {
  for (let size = max; size > min; size -= 4) {
    if (measure(text, display(800, size)) <= maxWidth) return size;
  }
  return min;
}

/* ---------------------------------------------------------------------------------------------
 * The wordmark
 * ------------------------------------------------------------------------------------------- */

/** The wordmark's letters as `Logo.tsx` sets them: [letter, weight, horizontal scale]. */
export const WORDMARK: readonly (readonly [string, number, number])[] = [
  ['F', 800, 1.22],
  ['O', 800, 1],
  ['R', 800, 1],
  ['M', 200, 1],
  ['A', 200, 1],
];

/**
 * Pen positions for each letter. Letter spacing is .05em after every letter; the F takes a
 * further .16em (its margin in global.css) and its ×1.22 stretch is drawn into that gap, as the
 * CSS transform does, rather than pushing the rest along.
 */
export function wordmarkAdvances(size: number, measure: Measure): { x: number[]; width: number } {
  const xs: number[] = [];
  let x = 0;
  for (const [i, [letter, weight]] of WORDMARK.entries()) {
    xs.push(x);
    x += measure(letter, display(weight, size)) + 0.05 * size + (i === 0 ? 0.16 * size : 0);
  }
  return { x: xs, width: x - 0.05 * size };
}

/* ---------------------------------------------------------------------------------------------
 * Shared pieces
 * ------------------------------------------------------------------------------------------- */

const KICKER = body(600, 40);
const LABEL = body(600, 36);
const FOOT_Y = SAFE_BOTTOM - 24;
const WORDMARK_SIZE = 72;

function kickerText(d: StoryData): string {
  return d.courseName ? `${d.courseName} · ${d.date}` : d.date;
}

function kicker(d: StoryData, y: number, colour: string, measure: Measure, width = CONTENT_W) {
  return {
    kind: 'text',
    text: ellipsize(kickerText(d), width, KICKER, measure),
    x: MARGIN,
    y,
    font: KICKER,
    colour,
    align: 'left',
  } satisfies StoryOp;
}

/** Headline lines from a top edge; returns the ops and the y of the last baseline. */
function headline(
  lines: string[],
  size: number,
  top: number,
  colour: string,
  x = MARGIN,
  align: Align = 'left',
): { ops: StoryOp[]; bottom: number } {
  const lh = Math.round(size * 1.2);
  const ops: StoryOp[] = lines.map((text, i) => ({
    kind: 'text',
    text,
    x,
    // The first baseline sits one cap-height-and-a-bit below the top edge.
    y: Math.round(top + size * 0.95 + i * lh),
    font: display(800, size),
    colour,
    align,
  }));
  return { ops, bottom: Math.round(top + size * 0.95 + (lines.length - 1) * lh) };
}

/** Three stars, left to right from (x, cy); filled up to the rounded count. */
function stars(n: number, x: number, cy: number, colour: string, r = 34): StoryOp[] {
  const full = Math.max(0, Math.min(3, Math.round(n)));
  return [0, 1, 2].map((i) => ({
    kind: 'star',
    cx: x + r + i * (r * 2 + 18),
    cy,
    r,
    colour,
    filled: i < full,
  }));
}

function footer(d: StoryData, colour: string, measure: Measure, y = FOOT_Y): StoryOp[] {
  const domain = body(500, 30);
  return [
    { kind: 'wordmark', x: MARGIN, y, size: WORDMARK_SIZE, colour },
    {
      kind: 'text',
      text: ellipsize(d.domain, 360, domain, measure),
      x: STORY_W - MARGIN,
      y,
      font: domain,
      colour,
      align: 'right',
    },
  ];
}

/** A row of figures across `width` from `x`: value over label, centred in equal columns. */
function figureRow(
  figures: readonly SessionFigure[],
  x: number,
  width: number,
  valueY: number,
  valueColour: string,
  labelColour: string,
  measure: Measure,
  maxValue = 108,
): StoryOp[] {
  const col = width / figures.length;
  const size = Math.min(
    ...figures.map((f) => fitLine(f.value, col - 24, measure, maxValue)),
    maxValue,
  );
  return figures.flatMap((f, i) => {
    const cx = Math.round(x + col * i + col / 2);
    return [
      {
        kind: 'text',
        text: f.value,
        x: cx,
        y: valueY,
        font: display(800, size),
        colour: valueColour,
        align: 'center',
      },
      {
        kind: 'text',
        text: ellipsize(f.label, col - 16, LABEL, measure),
        x: cx,
        y: valueY + 72,
        font: LABEL,
        colour: labelColour,
        align: 'center',
      },
    ] satisfies StoryOp[];
  });
}

/* ---------------------------------------------------------------------------------------------
 * The six layouts
 * ------------------------------------------------------------------------------------------- */

function fieldLayout(d: StoryData, m: Measure): StoryOp[] {
  const ops: StoryOp[] = [kicker(d, SAFE_TOP + 80, WHITE, m)];
  // «Готово!» — the key word, light blue, with the neon swoosh under it: the poster, as a story.
  const doneSize = fitLine(d.doneWord, CONTENT_W, m, 176);
  const doneY = SAFE_TOP + 110 + Math.round(doneSize * 0.95);
  const doneW = Math.min(CONTENT_W, m(d.doneWord, display(800, doneSize)));
  ops.push({
    kind: 'text',
    text: d.doneWord,
    x: MARGIN,
    y: doneY,
    font: display(800, doneSize),
    colour: COLOUR.accent,
    align: 'left',
  });
  ops.push({
    kind: 'swoosh',
    x: MARGIN,
    y: doneY + 22,
    w: doneW,
    h: 34,
    colour: COLOUR.action,
    width: 12,
  });
  const name = fitHeadline(d.workoutName, CONTENT_W, m, { max: 92, min: 60, maxLines: 3 });
  const head = headline(name.lines, name.size, doneY + 100, WHITE);
  ops.push(...head.ops);
  if (d.stars !== null) ops.push(...stars(d.stars, MARGIN, head.bottom + 100, COLOUR.accent));

  // The figures on a rule, as `DonePoster` sets them.
  const ruleY = SAFE_BOTTOM - 420;
  ops.push({ kind: 'rect', x: MARGIN, y: ruleY, w: CONTENT_W, h: 3, r: 0, fill: WHITE });
  ops.push(...figureRow(d.figures, MARGIN, CONTENT_W, ruleY + 170, WHITE, WHITE, m, 120));
  ops.push(...footer(d, WHITE, m));
  return ops;
}

function neonLayout(d: StoryData, m: Measure): StoryOp[] {
  const ink = COLOUR.ink;
  const ops: StoryOp[] = [kicker(d, SAFE_TOP + 80, ink, m)];
  const name = fitHeadline(d.workoutName, CONTENT_W, m, { max: 100, min: 64, maxLines: 3 });
  const head = headline(name.lines, name.size, SAFE_TOP + 124, ink);
  ops.push(...head.ops);
  let y = head.bottom;
  if (d.stars !== null) {
    ops.push(...stars(d.stars, MARGIN, y + 96, ink));
    y += 130;
  }

  // One figure the size of the picture: the minutes. The rest in a row under it.
  const [hero, ...rest] = d.figures;
  if (hero) {
    // Its baseline no lower than 1180, so the label clears the rule; its top below the stars.
    const heroY = 1180;
    const room = Math.floor((heroY - y - 80) / 0.74);
    const size = Math.min(fitLine(hero.value, CONTENT_W, m, 460), room);
    ops.push({
      kind: 'text',
      text: hero.value,
      x: MARGIN - Math.round(size * 0.04),
      y: heroY,
      font: display(800, size),
      colour: ink,
      align: 'left',
    });
    ops.push({
      kind: 'text',
      text: ellipsize(hero.label, CONTENT_W, body(600, 48), m),
      x: MARGIN,
      y: heroY + 76,
      font: body(600, 48),
      colour: ink,
      align: 'left',
    });
  }
  const ruleY = SAFE_BOTTOM - 330;
  ops.push({ kind: 'rect', x: MARGIN, y: ruleY, w: CONTENT_W, h: 4, r: 0, fill: ink });
  ops.push(...figureRow(rest, MARGIN, CONTENT_W, ruleY + 124, ink, ink, m, 96));
  ops.push(...footer(d, ink, m));
  return ops;
}

function warmLayout(d: StoryData, m: Measure): StoryOp[] {
  const ink = COLOUR.ink;
  const ops: StoryOp[] = [kicker(d, SAFE_TOP + 80, ink, m)];
  const name = fitHeadline(d.workoutName, CONTENT_W, m, { max: 116, min: 68, maxLines: 3 });
  const head = headline(name.lines, name.size, SAFE_TOP + 124, ink);
  ops.push(...head.ops);
  let headBottom = head.bottom;
  if (d.stars !== null) {
    ops.push(...stars(d.stars, MARGIN, head.bottom + 96, ink));
    headBottom += 124;
  }

  // The figures as a ruled list from the foot up: value left, label right, a hairline between.
  const listBottom = SAFE_BOTTOM - 150;
  const n = Math.max(1, d.figures.length);
  const rowH = Math.min(168, Math.floor((listBottom - headBottom - 64) / n));
  const top = listBottom - rowH * d.figures.length;
  const labelFont = body(600, 44);
  d.figures.forEach((f, i) => {
    const rowTop = top + i * rowH;
    ops.push({ kind: 'rect', x: MARGIN, y: rowTop, w: CONTENT_W, h: 3, r: 0, fill: ink });
    const size = fitLine(f.value, CONTENT_W * 0.6, m, Math.round(rowH * 0.71));
    ops.push({
      kind: 'text',
      text: f.value,
      x: MARGIN,
      y: rowTop + Math.round(rowH * 0.76),
      font: display(800, size),
      colour: ink,
      align: 'left',
    });
    ops.push({
      kind: 'text',
      text: ellipsize(f.label, CONTENT_W * 0.36, labelFont, m),
      x: STORY_W - MARGIN,
      y: rowTop + Math.round(rowH * 0.74),
      font: labelFont,
      colour: ink,
      align: 'right',
    });
  });
  ops.push({ kind: 'rect', x: MARGIN, y: listBottom, w: CONTENT_W, h: 3, r: 0, fill: ink });
  ops.push(...footer(d, ink, m));
  return ops;
}

function crossroadsLayout(d: StoryData, m: Measure): StoryOp[] {
  const ink = COLOUR.ink;
  const ops: StoryOp[] = [kicker(d, SAFE_TOP + 80, ink, m)];
  /*
   * Ink only above y ≈ 1060: below that, at the right edge, the gradient passes orange on its way
   * to the electric blue, where ink stops reading. The name gets at most three lines at 96px so
   * the header always ends above that line, and the plate starts right after it.
   */
  const name = fitHeadline(d.workoutName, CONTENT_W, m, { max: 96, min: 60, maxLines: 3 });
  const head = headline(name.lines, name.size, SAFE_TOP + 124, ink);
  ops.push(...head.ops);
  let bottom = head.bottom;
  if (d.stars !== null) {
    ops.push(...stars(d.stars, MARGIN, bottom + 96, ink));
    bottom += 124;
  }

  const plateX = 56;
  const plateW = STORY_W - plateX * 2;
  const plateTop = Math.min(Math.max(bottom + 80, 1020), 1060);
  const plateBottom = SAFE_BOTTOM + 60;
  ops.push({
    kind: 'rect',
    x: plateX,
    y: plateTop,
    w: plateW,
    h: plateBottom - plateTop,
    r: 56,
    fill: COLOUR.ground,
  });
  ops.push({
    kind: 'text',
    text: ellipsize(d.doneWord, CONTENT_W, display(800, 64), m),
    x: MARGIN,
    y: plateTop + 120,
    font: display(800, 64),
    colour: COLOUR.accent,
    align: 'left',
  });
  const figs = d.figures;
  ops.push(...figureRow(figs, MARGIN, CONTENT_W, plateTop + 300, WHITE, COLOUR.accent, m, 104));
  ops.push(...footer(d, WHITE, m, plateBottom - 76));
  return ops;
}

function effortLayout(d: StoryData, m: Measure): StoryOp[] {
  const ink = COLOUR.ink;
  const ops: StoryOp[] = [kicker(d, SAFE_TOP + 80, ink, m)];
  const name = fitHeadline(d.workoutName, CONTENT_W, m, { max: 108, min: 64, maxLines: 3 });
  const head = headline(name.lines, name.size, SAFE_TOP + 124, ink);
  ops.push(...head.ops);
  let headBottom = head.bottom;
  if (d.stars !== null) {
    ops.push(...stars(d.stars, MARGIN, head.bottom + 96, ink));
    headBottom += 124;
  }

  // Stickers: each figure a pill, tilted, alternating sides — slapped on, not typeset.
  const fills = [
    { fill: ink, text: WHITE },
    { fill: WHITE, text: ink },
    { fill: COLOUR.action, text: ink },
    { fill: ink, text: WHITE },
  ];
  const angles = [-6, 5, -4, 6];
  const gap = 40;
  const stackBottom = SAFE_BOTTOM - 150;
  const n = Math.max(1, d.figures.length);
  // As tall as 164px, shorter when a long name and four figures have to share the frame.
  const pillH = Math.min(164, Math.floor((stackBottom - headBottom - 90 - (n - 1) * gap) / n));
  const k = pillH / 164;
  const valueFont = display(800, Math.round(96 * k));
  const labelFont = body(600, Math.round(46 * k));
  const pad = Math.round(64 * k);
  const stackTop = stackBottom - d.figures.length * pillH - (d.figures.length - 1) * gap;
  d.figures.forEach((f, i) => {
    const valueW = m(f.value, valueFont);
    const label = ellipsize(f.label, 320, labelFont, m);
    const labelW = m(label, labelFont);
    const w = Math.min(CONTENT_W - 40, pad + valueW + 28 + labelW + pad);
    const left = i % 2 === 0 ? MARGIN + 12 : STORY_W - MARGIN - 12 - w;
    const cy = stackTop + i * (pillH + gap) + pillH / 2;
    const cx = left + w / 2;
    const style = fills[i % fills.length] ?? { fill: ink, text: WHITE };
    ops.push({
      kind: 'group',
      cx,
      cy,
      angle: angles[i % angles.length] ?? 0,
      ops: [
        { kind: 'rect', x: -w / 2, y: -pillH / 2, w, h: pillH, r: pillH / 2, fill: style.fill },
        {
          kind: 'text',
          text: f.value,
          x: -w / 2 + pad,
          y: Math.round(34 * k),
          font: valueFont,
          colour: style.text,
          align: 'left',
        },
        {
          kind: 'text',
          text: label,
          x: -w / 2 + pad + valueW + 28,
          y: Math.round(30 * k),
          font: labelFont,
          colour: style.text,
          align: 'left',
        },
      ],
    });
  });
  ops.push(...footer(d, ink, m));
  return ops;
}

function graphiteLayout(d: StoryData, m: Measure): StoryOp[] {
  const ops: StoryOp[] = [kicker(d, SAFE_TOP + 80, WHITE, m)];
  const name = fitHeadline(d.workoutName, CONTENT_W, m, { max: 112, min: 64, maxLines: 3 });
  const head = headline(name.lines, name.size, SAFE_TOP + 124, WHITE);
  ops.push(...head.ops);
  if (d.stars !== null) ops.push(...stars(d.stars, MARGIN, head.bottom + 96, COLOUR.accent));

  // A two-column grid of light-blue figures, label over value, from the foot up.
  const cols = 2;
  const rows = Math.ceil(d.figures.length / cols);
  const cellW = CONTENT_W / cols;
  const cellH = 250;
  const gridTop = SAFE_BOTTOM - 150 - rows * cellH;

  // The sticker, tilted, slapped on the right just above the figures — beside the stars, under
  // the name (whose last baseline is at most ~800 while the grid starts at 970 or lower).
  const stickerFont = display(800, 52);
  const sw = Math.min(CONTENT_W / 2, m(d.sticker, stickerFont) + 80);
  ops.push({
    kind: 'group',
    cx: STORY_W - MARGIN - sw / 2,
    cy: gridTop - 76,
    angle: -8,
    ops: [
      { kind: 'rect', x: -sw / 2, y: -52, w: sw, h: 104, r: 52, fill: COLOUR.action },
      {
        kind: 'text',
        text: ellipsize(d.sticker, sw - 48, stickerFont, m),
        x: 0,
        y: 19,
        font: stickerFont,
        colour: COLOUR.ink,
        align: 'center',
      },
    ],
  });
  d.figures.forEach((f, i) => {
    const x = MARGIN + (i % cols) * cellW;
    const top = gridTop + Math.floor(i / cols) * cellH;
    ops.push({
      kind: 'text',
      text: ellipsize(f.label, cellW - 32, LABEL, m),
      x,
      y: top + 40,
      font: LABEL,
      colour: WHITE,
      align: 'left',
    });
    ops.push({
      kind: 'text',
      text: f.value,
      x: x - 4,
      y: top + 190,
      font: display(800, fitLine(f.value, cellW - 32, m, 150)),
      colour: COLOUR.accent,
      align: 'left',
    });
  });
  ops.push(...footer(d, WHITE, m));
  return ops;
}

const LAYOUTS: Readonly<Record<StoryTemplateId, (d: StoryData, m: Measure) => StoryOp[]>> = {
  field: fieldLayout,
  neon: neonLayout,
  warm: warmLayout,
  crossroads: crossroadsLayout,
  effort: effortLayout,
  graphite: graphiteLayout,
};

/** Every drawing operation for one story, background excluded (`TEMPLATES[id].background`). */
export function layoutStory(d: StoryData, id: StoryTemplateId, measure: Measure): StoryOp[] {
  return LAYOUTS[id](d, measure);
}

export { TEMPLATES };
