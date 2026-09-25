import { describe, expect, it } from 'vitest';
import {
  MD_CLOCK_SLOT,
  PLAYER_BAND,
  PLAYER_COLUMN,
  PLAYER_HEADER_ROW,
  PLAYER_PANEL,
  PLAYER_STAGE,
} from './layout';

const md = (classes: string) =>
  classes
    .split(/\s+/)
    .filter((c) => c.startsWith('md:'))
    .map((c) => c.slice(3));

/*
 * The desktop player is a fixed grid (layout.ts): the owner asked for the buttons, the clock and
 * the rep count to stop jumping between steps, and for the clip to stop sitting in a corner. These
 * hold the class strings that make that true, so a later edit cannot quietly undo it.
 */
describe('desktop player layout', () => {
  it('centres the clip in the area left of the column', () => {
    expect(md(PLAYER_STAGE)).toContain('justify-center');
    expect(PLAYER_STAGE).toContain('items-center');
  });

  it('ends the stage exactly where the column begins', () => {
    expect(md(PLAYER_COLUMN)).toContain('w-95');
    expect(md(PLAYER_STAGE)).toContain('right-95');
    expect(md(PLAYER_BAND)).toContain('w-95');
    expect(md(PLAYER_HEADER_ROW)).toContain('mr-95');
  });

  it('does not tie the stage to the clock band on desktop', () => {
    expect(md(PLAYER_STAGE).some((c) => c.startsWith('top-['))).toBe(true);
    expect(md(PLAYER_STAGE).join(' ')).not.toContain('--player-top-h');
  });

  it('starts the panel at a fixed height instead of centring it', () => {
    expect(md(PLAYER_PANEL)).not.toContain('justify-center');
    expect(md(PLAYER_PANEL)).toContain('justify-start');
  });

  it('reserves the same clock slot in the band and in the panel', () => {
    // h-44 is 11rem: the band's height and the panel's top padding have to agree.
    expect(MD_CLOCK_SLOT).toBe('md:h-44');
    expect(PLAYER_BAND).toContain(MD_CLOCK_SLOT);
    expect(md(PLAYER_PANEL)).toContain('pt-[calc(var(--safe-top)+56px+11rem)]');
  });
});
