import { describe, expect, it } from 'vitest';
import { COACH_CARD_FILLS, COLOUR } from '@/lib/ui/semantic';
import { contrast, tileInk } from '@/lib/ui/tile';
import { coachCardFill } from './coachCardFill';

describe('coachCardFill', () => {
  it('starts on ciel — the coach’s colour — and a single card is always ciel', () => {
    expect(coachCardFill(0).name).toBe('ciel');
    expect(coachCardFill(0).hex).toBe(COLOUR.coach);
  });

  it('cycles ciel → orange → neon by index and wraps', () => {
    expect([0, 1, 2, 3, 4, 5].map((i) => coachCardFill(i).name)).toEqual([
      'ciel',
      'orange',
      'neon',
      'ciel',
      'orange',
      'neon',
    ]);
  });

  it('never throws on a bad index', () => {
    expect(coachCardFill(-1).name).toBe('ciel');
    expect(coachCardFill(Number.NaN).name).toBe('ciel');
    expect(coachCardFill(2.9).name).toBe('neon');
  });

  it('takes ink #111111 on every fill at ≥ 4.5:1, and tileInk() agrees', () => {
    for (const fill of COACH_CARD_FILLS) {
      expect(contrast(COLOUR.ink, fill.hex), fill.name).toBeGreaterThanOrEqual(4.5);
      expect(tileInk(fill.hex), fill.name).toBe(COLOUR.ink);
    }
  });

  it('paints with the utilities the semantic map lists as saturated', () => {
    expect(COACH_CARD_FILLS.map((f) => f.className)).toEqual(['bg-ciel', 'bg-orange', 'bg-action']);
  });
});
