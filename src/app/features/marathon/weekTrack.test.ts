import { describe, expect, it } from 'vitest';
import { weekTrack } from './weekTrack';

const states = (tiles: ReturnType<typeof weekTrack>) => tiles.map((t) => t.state);

describe('weekTrack', () => {
  it('runs Monday to Sunday around today, with the four past-or-present states', () => {
    // 2026-09-30 is a Wednesday.
    const tiles = weekTrack({ days: ['2026-09-28', '2026-09-30'], today: '2026-09-30' });
    expect(tiles.map((t) => t.iso)).toEqual([
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ]);
    expect(states(tiles)).toEqual([
      'done',
      'missed',
      'today-done',
      'future',
      'future',
      'future',
      'future',
    ]);
    expect(tiles.map((t) => t.label)).toEqual(['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']);
    expect(tiles.map((t) => t.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('marks today hollow until the proof is in', () => {
    const tiles = weekTrack({ days: ['2026-09-29'], today: '2026-09-30' });
    expect(tiles[2]?.state).toBe('today');
    expect(tiles[1]?.state).toBe('done');
  });

  it('puts a Sunday at the end of a Monday-first week, and first of a Sunday-first one', () => {
    // 2026-10-04 is a Sunday.
    const monday = weekTrack({ days: [], today: '2026-10-04' });
    expect(monday[0]?.iso).toBe('2026-09-28');
    expect(monday[6]).toMatchObject({ iso: '2026-10-04', state: 'today' });
    const sunday = weekTrack({ days: [], today: '2026-10-04', weekStart: 'sunday' });
    expect(sunday[0]).toMatchObject({ iso: '2026-10-04', state: 'today' });
    expect(sunday[6]?.iso).toBe('2026-10-10');
  });

  it('treats unloaded days as nothing done yet, and ignores days outside the week', () => {
    const tiles = weekTrack({ days: null, today: '2026-09-28' });
    expect(states(tiles)).toEqual([
      'today',
      'future',
      'future',
      'future',
      'future',
      'future',
      'future',
    ]);
    const stray = weekTrack({ days: ['2026-09-20', '2026-10-09'], today: '2026-09-28' });
    expect(states(stray)).toEqual(states(tiles));
  });

  it('takes the labels it is given', () => {
    const labels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    expect(weekTrack({ days: [], today: '2026-09-30', labels }).map((t) => t.label)).toEqual(
      labels,
    );
  });
});
