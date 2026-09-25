import { describe, expect, it } from 'vitest';
import { COLOUR, GRAD_WARM_STOPS } from '@/lib/ui/semantic';
import { contrast } from '@/lib/ui/tile';
import { tabItems } from './BottomNav';
import { TAB_SEAT, tabSeat } from './tabSeat';

const TEXT = 4.5;

describe('the tab seat colours', () => {
  it('gives every tab, the admin seat included, its own entry', () => {
    for (const item of tabItems(true)) expect(TAB_SEAT[item.to], item.to).toBeDefined();
  });

  it('reads the active word at ≥ 4.5 on every solid seat', () => {
    expect(contrast(COLOUR.ink, COLOUR.action)).toBeGreaterThanOrEqual(TEXT);
    expect(contrast('#ffffff', COLOUR.coachField)).toBeGreaterThanOrEqual(TEXT);
    expect(contrast(COLOUR.text, COLOUR.surface3)).toBeGreaterThanOrEqual(TEXT);
  });

  it('reads ink on every stop of the club gradient', () => {
    for (const stop of GRAD_WARM_STOPS) {
      expect(contrast(COLOUR.ink, stop), stop).toBeGreaterThanOrEqual(TEXT);
    }
  });

  it('keeps the club free of neon', () => {
    expect(tabSeat('/marathon').seat).toBe('bg-warm');
    expect(tabSeat('/marathon').seat).not.toBe('bg-action');
  });

  it('falls back to the electric blue for an unknown seat', () => {
    expect(tabSeat('/nowhere').seat).toBe('bg-field');
    expect(tabSeat(undefined).ink).toBe('text-on-field');
  });
});
