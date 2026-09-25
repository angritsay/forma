import { describe, expect, it } from 'vitest';
import { contrast } from '@/lib/ui/tile';
import { layoutStory, type Measure, type StoryOp } from './layout';
import { STORY_TEMPLATES, TEMPLATES } from './templates';

const measure: Measure = (text, font) => text.length * font.size * 0.6;

function textColours(ops: StoryOp[]): string[] {
  return ops.flatMap((op) => {
    if (op.kind === 'group') return textColours(op.ops);
    if (op.kind === 'text' || op.kind === 'wordmark') return [op.colour.toLowerCase()];
    return [];
  });
}

describe('story contrast', () => {
  for (const id of STORY_TEMPLATES) {
    it(`${id}: every type/fill pair reads at 4.5 or better`, () => {
      for (const [text, fill] of TEMPLATES[id].pairs) {
        expect(contrast(text, fill), `${id}: ${text} on ${fill}`).toBeGreaterThanOrEqual(4.5);
      }
    });

    it(`${id}: draws type only in colours its pairs vouch for`, () => {
      const allowed = new Set(TEMPLATES[id].pairs.map(([text]) => text.toLowerCase()));
      const ops = layoutStory(
        {
          workoutName: 'Сила',
          courseName: 'Курс',
          date: '1 мая',
          figures: [
            { value: '1', label: 'a' },
            { value: '2', label: 'b' },
            { value: '3', label: 'c' },
          ],
          stars: 1,
          doneWord: 'Готово!',
          sticker: 'Сделано',
          domain: 'forma-app.co',
        },
        id,
        measure,
      );
      for (const c of textColours(ops)) expect(allowed, `${id}: ${c}`).toContain(c);
    });
  }
});
