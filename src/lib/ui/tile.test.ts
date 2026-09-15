/**
 * The challenge's colour, guarded.
 *
 * Two promises are made about `GAME_TILE` in prose — that the cover keeps black type, and that the
 * CSS token and the TypeScript constant are the same colour. Prose does not fail a build, and both
 * promises are one careless character away from being broken: the hex sits 0.003 above the
 * luminance at which the ink flips, and it is written down in two files that nothing links.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GAME_TILE, isLightTile, luminance, tileInk } from './tile';

/** WCAG contrast between two opaque colours. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const GROUND = '#0f0f11';

describe('GAME_TILE', () => {
  it('stays light enough to keep black type on the challenge cover', () => {
    // The cliff. Below 0.35 `tileInk` returns the light ink and the cover becomes a dark panel with
    // white type — a different screen, and never something to discover from a screenshot.
    expect(isLightTile(GAME_TILE)).toBe(true);
    expect(luminance(GAME_TILE)).toBeGreaterThan(0.35);
    expect(tileInk(GAME_TILE)).toBe('#0f0f11');
  });

  it('carries its ink and reads as a label on the dark ground', () => {
    // Both directions of the same hue: black type *on* the tile (the cover, the day numeral) and
    // the tile *as* type on the near-black ground (the kicker, the board's prize label).
    expect(contrast(GAME_TILE, tileInk(GAME_TILE))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(GAME_TILE, GROUND)).toBeGreaterThanOrEqual(4.5);
  });

  it('is the same colour as --course-marathon in global.css', () => {
    // The coupling test. The constant paints React, the token paints CSS, and nothing but this
    // links them: a colour changed in one file and not the other splits the challenge in half —
    // an orange cover above an orange-of-a-different-orange progress strip.
    const css = readFileSync(new URL('../../styles/global.css', import.meta.url), 'utf8');
    const token = /--course-marathon:\s*(#[0-9a-fA-F]{6})\s*;/.exec(css)?.[1];
    expect(token?.toLowerCase()).toBe(GAME_TILE.toLowerCase());
  });

  it('has a paper ink variant dark enough to read on white', () => {
    // `--course-marathon-ink` is the same hue darkened for text on the profile's white ground.
    // global.css states the contract as «each ≥ 5.3:1»; this is that sentence, enforced.
    const css = readFileSync(new URL('../../styles/global.css', import.meta.url), 'utf8');
    const ink = /--course-marathon-ink:\s*(#[0-9a-fA-F]{6})\s*;/.exec(css)?.[1];
    expect(ink).toBeDefined();
    expect(contrast(ink!, '#ffffff')).toBeGreaterThanOrEqual(5.3);
  });
});
