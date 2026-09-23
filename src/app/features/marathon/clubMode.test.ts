import { describe, expect, it } from 'vitest';
import { boardPath, clubFor, clubModeOf } from './clubMode';

describe('club mode', () => {
  it('reads only an explicit duo', () => {
    expect(clubModeOf('duo')).toBe('duo');
    expect(clubModeOf('solo')).toBe('solo');
    expect(clubModeOf(null)).toBe('solo');
  });

  it('picks the duo club only in duo mode and only when it exists', () => {
    const state = { soloClub: 'solo', duoClub: 'duo', marathon: 'solo' };
    expect(clubFor(state, 'duo')).toBe('duo');
    expect(clubFor(state, 'solo')).toBe('solo');
    expect(clubFor({ ...state, duoClub: null }, 'duo')).toBe('solo');
    expect(clubFor({ soloClub: null, duoClub: null, marathon: 'cohort' }, 'solo')).toBe('cohort');
  });

  it('the board link carries the mode', () => {
    expect(boardPath('duo')).toBe('/marathon/board?mode=duo');
    expect(boardPath('solo')).toBe('/marathon/board');
  });
});
