import { describe, expect, it } from 'vitest';
import { BOOKING } from '@content/site/booking';
import { NASTIA } from '@content/site/nastia';
import { DOODLE_KINDS } from '@/content/schema';
import { DOODLES } from './Doodle';

describe('Doodle', () => {
  it('draws every kind the content may name', () => {
    for (const kind of DOODLE_KINDS) {
      expect(DOODLES[kind].length).toBeGreaterThan(0);
      for (const d of DOODLES[kind]) expect(d).toMatch(/^M[\d.\s]/);
    }
  });

  it('gives each of the coach tab’s points a glyph, different within a person', () => {
    for (const list of [BOOKING.outcomes, NASTIA.outcomes]) {
      expect(list).toHaveLength(3);
      const kinds = list.map((o) => o.doodle);
      for (const k of kinds) expect(DOODLE_KINDS).toContain(k);
      expect(new Set(kinds).size).toBe(kinds.length);
    }
  });
});
