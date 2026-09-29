import { describe, expect, it } from 'vitest';
import { parseInviteCopy } from './shareHome';

describe('parseInviteCopy', () => {
  const full = {
    when: 'a',
    whenTomorrow: 'b',
    whenToday: 'c',
    whenSoon: 'd',
    soonLabel: 'e',
    text: 'f {when} {url}',
    refLine: 'g',
  };

  it('reads the templates a button carries', () => {
    expect(parseInviteCopy(JSON.stringify(full))).toEqual(full);
  });

  it('refuses anything missing, mistyped or not JSON', () => {
    expect(parseInviteCopy(undefined)).toBeNull();
    expect(parseInviteCopy('{')).toBeNull();
    expect(parseInviteCopy(JSON.stringify({ ...full, text: 1 }))).toBeNull();
    const partial = Object.fromEntries(Object.entries(full).filter(([k]) => k !== 'refLine'));
    expect(parseInviteCopy(JSON.stringify(partial))).toBeNull();
  });
});
