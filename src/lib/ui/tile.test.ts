/**
 * The palette's contrast promises, enforced.
 *
 * global.css and tile.ts state every ratio in prose. Prose does not fail a build, and the third
 * palette put two fills (Portland orange, bleu ciel) on exactly the kind of edge the old lightness
 * cutoff got wrong. These tests are where the promises live.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  APP_BG,
  COACH_TILE,
  contrast,
  GAME_TILE,
  INK_ON_DARK,
  INK_ON_LIGHT,
  isLightTile,
  tileAccent,
  tileInk,
} from './tile';

const css = readFileSync(new URL('../../styles/global.css', import.meta.url), 'utf8');
const token = (name: string) =>
  new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(css)?.[1]?.toLowerCase();

describe('tileInk', () => {
  /*
   * The regression this module was rewritten for. The old cutoff (luminance > 0.35) gave Portland
   * orange white ink — 3.13:1 on the beginners' own course.
   */
  it('puts dark ink on Portland orange', () => {
    expect(tileInk('#ff5a00')).toBe(INK_ON_LIGHT);
    expect(contrast(INK_ON_LIGHT, '#ff5a00')).toBeGreaterThanOrEqual(4.5);
  });

  it('clears AA on every fill of the palette', () => {
    const fills = [
      '#ff5a00',
      '#f4ff3f',
      '#ffe6d0',
      '#afe9fd',
      '#2038e2',
      '#007bff',
      '#2e2e2e',
      '#383838',
    ];
    for (const fill of fills) {
      expect(contrast(tileInk(fill), fill), fill).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('still reads an unmigrated hex from the database correctly', () => {
    // The admin's course builder stores its own tile; old rows keep old colours until migrated.
    for (const old of ['#9feff7', '#f8a050', '#1a2634', '#e0f89a']) {
      expect(contrast(tileInk(old), old), old).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('agrees with isLightTile', () => {
    expect(isLightTile('#ff5a00')).toBe(true);
    expect(isLightTile('#2038e2')).toBe(false);
  });
});

describe('tileAccent', () => {
  it('is the fill itself when the fill reads on charcoal', () => {
    for (const fill of ['#ff5a00', '#f4ff3f', '#ffe6d0']) {
      expect(tileAccent(fill)).toBe(fill);
      expect(contrast(fill, APP_BG), fill).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('hands the two blues over to the light blue', () => {
    expect(tileAccent('#2038e2')).toBe('#afe9fd');
    expect(tileAccent('#007bff')).toBe('#afe9fd');
    expect(contrast('#afe9fd', APP_BG)).toBeGreaterThanOrEqual(4.5);
  });

  it('gives nothing for a neutral dark surface, so the caller uses white', () => {
    expect(tileAccent('#2e2e2e')).toBeUndefined();
  });
});

describe('GAME_TILE', () => {
  it('carries white ink, and never serves as type on the ground', () => {
    expect(tileInk(GAME_TILE)).toBe(INK_ON_DARK);
    expect(contrast(tileInk(GAME_TILE), GAME_TILE)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(GAME_TILE, APP_BG)).toBeLessThan(4.5);
    expect(tileAccent(GAME_TILE)).toBe('#afe9fd');
  });

  it('is the same colour as --course-marathon in global.css', () => {
    // The constant paints React, the token paints CSS, and nothing but this links them.
    expect(token('course-marathon')).toBe(GAME_TILE.toLowerCase());
  });

  it('has an ink variant dark enough to read on white', () => {
    const ink = token('course-marathon-ink');
    expect(ink).toBeDefined();
    expect(contrast(ink!, '#ffffff')).toBeGreaterThanOrEqual(5.3);
  });
});

describe('COACH_TILE', () => {
  it('takes the dark ink, and body text on it is legal', () => {
    expect(tileInk(COACH_TILE)).toBe(INK_ON_LIGHT);
    expect(contrast(INK_ON_LIGHT, COACH_TILE)).toBeGreaterThanOrEqual(4.5);
  });

  /*
   * As type on the ground it is large-only: at least 3:1, below 4.5. If either edge of that window
   * moves, BookScreen's typography — the big price in ciel — has to be looked at again.
   */
  it('sits in the large-type-only window on charcoal', () => {
    const c = contrast(COACH_TILE, APP_BG);
    expect(c).toBeGreaterThanOrEqual(3);
    expect(c).toBeLessThan(4.5);
  });
});

describe('global.css tokens', () => {
  it('keeps the ground charcoal and the triplet in step with it', () => {
    expect(token('bg')).toBe(APP_BG);
    expect(/--bg-rgb:\s*26,\s*26,\s*26\s*;/.test(css)).toBe(true);
  });

  it('keeps the ink tokens in step with tile.ts', () => {
    expect(token('ink')).toBe(INK_ON_LIGHT);
    expect(token('tile-fg')).toBe(INK_ON_LIGHT);
  });

  it('gives every section colour an ink variant that reads on white', () => {
    for (const name of ['beginners', 'dumbbells', 'yoga', 'marathon']) {
      const ink = token(`course-${name}-ink`);
      expect(ink, name).toBeDefined();
      expect(contrast(ink!, '#ffffff'), name).toBeGreaterThanOrEqual(5.3);
    }
  });

  it('keeps both muted greys AA on the lightest surface', () => {
    for (const name of ['muted', 'muted-2']) {
      expect(contrast(token(name)!, token('surface-3')!), name).toBeGreaterThanOrEqual(4.5);
    }
  });
});
