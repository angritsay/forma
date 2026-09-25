import { describe, expect, it } from 'vitest';
import { doneFigures, storyFigures } from '@/app/features/player/summary/figures';
import type { Translate } from '@/app/features/player/model';
import {
  fitHeadline,
  layoutStory,
  MARGIN,
  SAFE_BOTTOM,
  SAFE_TOP,
  STORY_W,
  wordmarkAdvances,
  wrapText,
  display,
  type Measure,
  type StoryData,
  type StoryOp,
} from './layout';
import { nextTemplate, pickTemplate, STORY_TEMPLATES } from './templates';

/** Every glyph 0.6 of the size wide — near enough to Unbounded's average for layout tests. */
const measure: Measure = (text, font) => text.length * font.size * 0.6;
const t = ((key: string) => key) as Translate;

const base: StoryData = {
  workoutName: 'Приседания и выпады: сила ног',
  courseName: 'Форма с нуля',
  date: '25 сентября',
  figures: [
    { value: '34', label: 'Минут' },
    { value: '186', label: 'Повторов' },
    { value: '245', label: 'Ккал' },
    { value: '120', label: 'Очков' },
  ],
  stars: 2,
  doneWord: 'Готово!',
  sticker: 'Сделано',
  domain: 'forma-app.co',
};

describe('template choice', () => {
  it('is stable for a session', () => {
    expect(pickTemplate('a1b2c3')).toBe(pickTemplate('a1b2c3'));
    expect(STORY_TEMPLATES).toContain(pickTemplate(undefined));
  });

  it('spreads sessions over all six', () => {
    const seen = new Set(Array.from({ length: 200 }, (_, i) => pickTemplate(`session-${i}`)));
    expect(seen.size).toBe(STORY_TEMPLATES.length);
  });

  it('«Другой вариант» walks every template and comes back', () => {
    let id = pickTemplate('x');
    const seen = new Set([id]);
    for (let i = 0; i < STORY_TEMPLATES.length - 1; i += 1) {
      id = nextTemplate(id);
      seen.add(id);
    }
    expect(seen.size).toBe(STORY_TEMPLATES.length);
    expect(nextTemplate(id)).toBe(pickTemplate('x'));
  });
});

describe('figures', () => {
  const s = { durationSec: 34 * 60, calories: 245, completion: 0.9, reps: 186 };

  it('says what the poster says: minutes, reps, kcal', () => {
    expect(doneFigures(t, 'ru', s).map((f) => f.label)).toEqual([
      'app.summaryMinutes',
      'app.summaryReps',
      'app.summaryKcal',
    ]);
  });

  it('puts completion in the reps slot on a day with none', () => {
    const f = doneFigures(t, 'ru', { ...s, reps: null });
    expect(f[1]).toEqual({ value: '90%', label: 'app.summaryCompletion' });
  });

  it('adds points only when there are some', () => {
    expect(storyFigures(t, 'ru', { ...s, points: 0 })).toHaveLength(3);
    const withPoints = storyFigures(t, 'ru', { ...s, points: 120 });
    expect(withPoints).toHaveLength(4);
    expect(withPoints[3]).toEqual({ value: '120', label: 'app.storyPoints' });
  });
});

describe('text fitting', () => {
  const font = display(800, 100); // 60px a glyph

  it('wraps greedily on spaces', () => {
    const r = wrapText('аа бб вв гг', 360, font, measure, 3);
    expect(r).toEqual({ lines: ['аа бб', 'вв гг'], overflow: false });
  });

  it('cuts what does not fit the last line with an ellipsis', () => {
    const r = wrapText('аа бб вв гг дд ее жж', 360, font, measure, 2);
    expect(r.overflow).toBe(true);
    expect(r.lines).toHaveLength(2);
    expect(r.lines[1]?.endsWith('…')).toBe(true);
    for (const line of r.lines) expect(measure(line, font)).toBeLessThanOrEqual(360);
  });

  it('cuts a single word wider than the line', () => {
    const r = wrapText('оченьдлинноеслово', 360, font, measure, 3);
    expect(r.lines).toHaveLength(1);
    expect(measure(r.lines[0] ?? '', font)).toBeLessThanOrEqual(360);
  });

  it('shrinks the name until it fits three lines', () => {
    const short = fitHeadline('Сила', 888, measure, { max: 120, min: 60, maxLines: 3 });
    expect(short.size).toBe(120);
    const long = fitHeadline('Бёрпи, отжимания, скалолаз и очень длинное название', 888, measure, {
      max: 120,
      min: 60,
      maxLines: 3,
    });
    expect(long.size).toBeLessThan(120);
    expect(long.lines.length).toBeLessThanOrEqual(3);
  });

  it('spaces the wordmark like the CSS: .05em tracking, .16em after the F', () => {
    const { x } = wordmarkAdvances(100, measure);
    expect(x[1]).toBeCloseTo(60 + 5 + 16);
    expect(x[2]).toBeCloseTo((x[1] ?? 0) + 60 + 5);
  });
});

/** Flatten groups into absolute text positions (rotation ignored: stickers tilt a few degrees). */
function texts(ops: StoryOp[], dx = 0, dy = 0): { text: string; x: number; y: number }[] {
  return ops.flatMap((op) => {
    if (op.kind === 'group') return texts(op.ops, dx + op.cx, dy + op.cy);
    if (op.kind === 'text') return [{ text: op.text, x: op.x + dx, y: op.y + dy }];
    if (op.kind === 'wordmark') return [{ text: 'FORMA', x: op.x + dx, y: op.y + dy }];
    return [];
  });
}

describe('every layout', () => {
  const variants: StoryData[] = [
    base,
    { ...base, stars: null, figures: base.figures.slice(0, 3) },
    {
      ...base,
      courseName: '',
      workoutName: 'Бёрпи, отжимания, скалолаз и очень длинное название тренировки от тренера',
      stars: 3,
    },
  ];

  for (const id of STORY_TEMPLATES) {
    it(`${id}: keeps every word inside the safe zones and the frame`, () => {
      for (const d of variants) {
        const all = texts(layoutStory(d, id, measure));
        expect(all.length).toBeGreaterThan(5);
        for (const item of all) {
          // A baseline sits below the top safe line and no lower than the bottom one.
          expect(item.y, `${id} «${item.text}»`).toBeGreaterThan(SAFE_TOP);
          expect(item.y, `${id} «${item.text}»`).toBeLessThanOrEqual(SAFE_BOTTOM);
          expect(item.x).toBeGreaterThanOrEqual(MARGIN - 40);
          expect(item.x).toBeLessThanOrEqual(STORY_W - MARGIN + 40);
        }
        // The name, every figure and the mark are all there.
        const strings = all.map((a) => a.text).join(' ');
        for (const f of d.figures) expect(strings).toContain(f.value);
        expect(strings).toContain('FORMA');
        expect(strings).toContain('forma-app.co');
      }
    });
  }
});
