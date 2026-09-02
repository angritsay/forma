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

describe('icon set', () => {
  it('contains every required icon with path data', () => {
    for (const name of REQUIRED) {
      expect(ICON_NAMES, name).toContain(name);
      const def = ICONS[name];
      expect(Boolean(def.d || def.fill), `${name} has no path`).toBe(true);
    }
  });

  it('has no empty definitions', () => {
    for (const name of ICON_NAMES) {
      const def = ICONS[name];
      for (const d of [def.d, def.fill]) {
        if (d !== undefined) expect(d.trim().length, name).toBeGreaterThan(0);
      }
    }
  });
});
