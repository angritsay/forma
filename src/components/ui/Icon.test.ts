import { describe, expect, it } from 'vitest';
import { ICON_NAMES, ICONS } from './Icon';

/** The set the ui-shell brief requires. */
const REQUIRED = [
  'home',
  'courses',
  'stats',
  'profile',
  'back',
  'close',
  'play',
  'pause',
  'next',
  'prev',
  'check',
  'lock',
  'flame',
  'steps',
  'clock',
  'bolt',
  'trophy',
  'chevron',
  'plus',
  'minus',
  'settings',
  'globe',
  'logout',
  'search',
  'info',
  'warning',
  'edit',
  'star',
  'calendar',
  'refresh',
] as const;

/**
 * The marks the brandbook sets as type rather than draws (design system CHANGELOG §5). A caller
 * asking for `back` must get an arrow character, not an SVG that looks like one.
 */
const GLYPHS = {
  back: '←',
  close: '×',
  next: '›',
  prev: '‹',
  check: '✓',
  chevron: '›',
  plus: '+',
  minus: '−',
} as const;

describe('icon set', () => {
  it('contains every required name, drawn as a glyph or as path data', () => {
    for (const name of REQUIRED) {
      expect(ICON_NAMES, name).toContain(name);
      const def = ICONS[name];
      expect(Boolean(def.glyph || def.d || def.fill), `${name} has no drawing`).toBe(true);
    }
  });

  it('sets navigation and confirmation as typographic glyphs, with no SVG left behind', () => {
    for (const [name, glyph] of Object.entries(GLYPHS) as [keyof typeof GLYPHS, string][]) {
      const def = ICONS[name];
      expect(def.glyph, name).toBe(glyph);
      // One name, one rendering: a glyph mark must not also carry path data.
      expect(def.d ?? def.fill, `${name} still has path data`).toBeUndefined();
    }
  });

  it('keeps play and pause as filled shapes', () => {
    for (const name of ['play', 'pause'] as const) {
      expect(ICONS[name].fill, name).toBeTruthy();
      expect(ICONS[name].glyph, name).toBeUndefined();
    }
  });

  it('has no empty definitions', () => {
    for (const name of ICON_NAMES) {
      const def = ICONS[name];
      for (const part of [def.glyph, def.d, def.fill]) {
        if (part !== undefined) expect(part.trim().length, name).toBeGreaterThan(0);
      }
    }
  });
});
