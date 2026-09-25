/**
 * Draws a story on a canvas and hands back the PNG.
 *
 * The layout is decided in `layout.ts`; this file only paints: the template's background (a solid,
 * a CSS-angled gradient, graphite grain), then each operation. The fonts are the app's own, already
 * bundled (`@fontsource-variable/unbounded`, `…/onest`) — a canvas does not wait for a face the way
 * a page does, so every weight used is loaded explicitly first, against the actual strings so the
 * Cyrillic subset comes down too.
 */
import {
  layoutStory,
  STORY_H,
  STORY_W,
  TEMPLATES,
  WORDMARK,
  wordmarkAdvances,
  type FontSpec,
  type Measure,
  type StoryData,
  type StoryOp,
} from './layout';
import type { StoryBackground, StoryTemplateId } from './templates';

const FAMILY: Readonly<Record<FontSpec['face'], string>> = {
  display: '"Unbounded Variable", "Unbounded", sans-serif',
  body: '"Onest Variable", "Onest", sans-serif',
};

export function fontString(f: FontSpec): string {
  return `${f.weight} ${f.size}px ${FAMILY[f.face]}`;
}

/** Every face the layouts use, loaded for the strings that will be drawn. */
export async function loadStoryFonts(sample: string): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  const text = `${sample} FORMA 0123456789%`;
  const faces = [
    '800 100px "Unbounded Variable"',
    '200 100px "Unbounded Variable"',
    '600 40px "Onest Variable"',
    '500 40px "Onest Variable"',
  ];
  await Promise.all(faces.map((f) => document.fonts.load(f, text).catch(() => [])));
}

/** A CSS `linear-gradient(<angle>deg, …)` over the whole frame, the way a browser draws one. */
function gradient(
  ctx: CanvasRenderingContext2D,
  bg: Extract<StoryBackground, { kind: 'gradient' }>,
) {
  const a = (bg.angle * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const half = (Math.abs(STORY_W * dx) + Math.abs(STORY_H * dy)) / 2;
  const cx = STORY_W / 2;
  const cy = STORY_H / 2;
  const g = ctx.createLinearGradient(
    cx - dx * half,
    cy - dy * half,
    cx + dx * half,
    cy + dy * half,
  );
  for (const [offset, colour] of bg.stops) g.addColorStop(offset, colour);
  return g;
}

/** Deterministic noise (mulberry32), so a template's grain is the same on every render. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function grain(ctx: CanvasRenderingContext2D): void {
  const tile = document.createElement('canvas');
  tile.width = 256;
  tile.height = 256;
  const g = tile.getContext('2d');
  if (!g) return;
  const img = g.createImageData(256, 256);
  const rand = rng(24);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rand() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = Math.floor(rand() * 22);
  }
  g.putImageData(img, 0, 0);
  const pattern = ctx.createPattern(tile, 'repeat');
  if (!pattern) return;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, STORY_W, STORY_H);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function draw(ctx: CanvasRenderingContext2D, op: StoryOp, measure: Measure): void {
  switch (op.kind) {
    case 'text':
      ctx.font = fontString(op.font);
      ctx.fillStyle = op.colour;
      ctx.textAlign = op.align;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(op.text, op.x, op.y);
      return;
    case 'rect':
      ctx.fillStyle = op.fill;
      if (op.r > 0) {
        roundRect(ctx, op.x, op.y, op.w, op.h, op.r);
        ctx.fill();
      } else {
        ctx.fillRect(op.x, op.y, op.w, op.h);
      }
      return;
    case 'swoosh': {
      // `Swoosh.tsx`: M3 10 C 45 3, 100 2, 147 8 in a 150×14 box, stretched to the word.
      const sx = op.w / 150;
      const sy = op.h / 14;
      const p = (x: number, y: number) => [op.x + x * sx, op.y + y * sy] as const;
      ctx.beginPath();
      ctx.moveTo(...p(3, 10));
      ctx.bezierCurveTo(...p(45, 3), ...p(100, 2), ...p(147, 8));
      ctx.strokeStyle = op.colour;
      ctx.lineWidth = op.width;
      ctx.lineCap = 'round';
      ctx.stroke();
      return;
    }
    case 'star':
      star(ctx, op.cx, op.cy, op.r);
      if (op.filled) {
        ctx.fillStyle = op.colour;
        ctx.fill();
      } else {
        ctx.strokeStyle = op.colour;
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
      return;
    case 'wordmark': {
      const { x: xs } = wordmarkAdvances(op.size, measure);
      ctx.fillStyle = op.colour;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      WORDMARK.forEach(([letter, weight, scale], i) => {
        ctx.font = fontString({ face: 'display', weight, size: op.size });
        ctx.save();
        ctx.translate(op.x + (xs[i] ?? 0), op.y);
        ctx.scale(scale, 1);
        ctx.fillText(letter, 0, 0);
        ctx.restore();
      });
      return;
    }
    case 'group':
      ctx.save();
      ctx.translate(op.cx, op.cy);
      ctx.rotate((op.angle * Math.PI) / 180);
      for (const child of op.ops) draw(ctx, child, measure);
      ctx.restore();
      return;
  }
}

/** A `measure` backed by a canvas context. */
export function canvasMeasure(ctx: CanvasRenderingContext2D): Measure {
  return (text, font) => {
    ctx.font = fontString(font);
    return ctx.measureText(text).width;
  };
}

/** Paint one story onto `canvas` (resized to 1080×1920). */
export function paintStory(canvas: HTMLCanvasElement, data: StoryData, id: StoryTemplateId): void {
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unavailable');
  const template = TEMPLATES[id];
  const bg = template.background;
  ctx.fillStyle = bg.kind === 'solid' ? bg.colour : gradient(ctx, bg);
  ctx.fillRect(0, 0, STORY_W, STORY_H);
  if (template.grain) grain(ctx);
  const measure = canvasMeasure(ctx);
  for (const op of layoutStory(data, id, measure)) draw(ctx, op, measure);
}

/** Render a story to a PNG blob. */
export async function renderStory(data: StoryData, id: StoryTemplateId): Promise<Blob> {
  await loadStoryFonts(
    [data.workoutName, data.courseName, data.date, data.doneWord, data.sticker, data.domain]
      .concat(data.figures.map((f) => `${f.value} ${f.label}`))
      .join(' '),
  );
  const canvas = document.createElement('canvas');
  paintStory(canvas, data, id);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('encode_failed'))),
      'image/png',
    );
  });
}
