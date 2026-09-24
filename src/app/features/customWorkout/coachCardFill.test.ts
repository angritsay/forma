import { describe, expect, it } from 'vitest';
import { COACH_CARD_FILLS, COLOUR } from '@/lib/ui/semantic';
import { contrast, tileInk } from '@/lib/ui/tile';
import { coachCardFill } from './coachCardFill';

describe('coachCardFill', () => {
  it('starts on ciel — the coach’s colour — and a single card is always ciel', () => {
    expect(coachCardFill(0).name).toBe('ciel');
    expect(coachCardFill(0).hex).toBe(COLOUR.coachField);
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

  it('sets its type at ≥ 4.5:1 on every fill, in the colour tileInk() would pick', () => {
    for (const fill of COACH_CARD_FILLS) {
      expect(contrast(fill.ink, fill.hex), fill.name).toBeGreaterThanOrEqual(4.5);
    }
    // White on the deep ciel; ink on orange and neon — the measured winner on each (§19).
    expect(tileInk(COLOUR.coachField)).not.toBe(COLOUR.ink);
    expect(tileInk(COLOUR.effort)).toBe(COLOUR.ink);
    expect(tileInk(COLOUR.action)).toBe(COLOUR.ink);
  });

  it('never puts black type on the ciel card again (it read as 4.75 and did not read at all)', () => {
    const ciel = coachCardFill(0);
    expect(ciel.textClass).toBe('text-paper');
    expect(contrast('#ffffff', ciel.hex)).toBeGreaterThanOrEqual(5);
  });

  it('paints with the utilities the semantic map lists as saturated', () => {
    expect(COACH_CARD_FILLS.map((f) => f.className)).toEqual([
      'bg-ciel-deep',
      'bg-orange',
      'bg-action',
    ]);
  });
});
