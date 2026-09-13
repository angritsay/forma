import { describe, expect, it } from 'vitest';
import { PATH_COLUMNS, pathColumn } from './PathView';

describe('pathColumn', () => {
  it('winds out to both edges and back', () => {
    expect([0, 1, 2, 3, 4, 5].map(pathColumn)).toEqual([1, 2, 3, 4, 3, 2]);
  });

  it('repeats, so a course of any length keeps the same wave', () => {
    expect([6, 7, 8, 9, 10, 11].map(pathColumn)).toEqual([1, 2, 3, 4, 3, 2]);
  });

  it('never leaves the grid, so a stop always has room for its name beside it', () => {
    for (let i = 0; i < 120; i++) {
      const col = pathColumn(i);
      expect(col).toBeGreaterThanOrEqual(1);
      expect(col).toBeLessThanOrEqual(PATH_COLUMNS);
    }
  });

  it('never turns two days in a row into the same column', () => {
    for (let i = 0; i < 120; i++) expect(pathColumn(i)).not.toBe(pathColumn(i + 1));
  });
});
