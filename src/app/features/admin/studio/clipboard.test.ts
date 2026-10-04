import { describe, expect, it } from 'vitest';
import { defaultGrade } from '@/lib/media/grade';
import { hasCrop, hasGrade, mergeClipboard, parseClipboard, toPaste } from './clipboard';

const crop = { x: 0.1, y: 0.1, w: 0.5, h: 0.6 };
const grade = { ...defaultGrade(), exposure: 0.5 };

describe('studio clipboard', () => {
  it('keeps the half a new copy does not carry', () => {
    const a = mergeClipboard({}, { grade });
    const b = mergeClipboard(a, { crop });
    expect(b.grade).toEqual(grade);
    expect(b.crop).toEqual(crop);
  });

  it('replaces the half a new copy carries, including with «none»', () => {
    const a = mergeClipboard({ grade, crop }, { crop: null });
    expect(a.crop).toBeNull();
    expect(hasCrop(a)).toBe(true);
    expect(a.grade).toEqual(grade);
  });

  it('pastes only the ticked halves that are on the clipboard', () => {
    expect(toPaste({ crop }, { grade: true, crop: true })).toEqual({ crop });
    expect(toPaste({ crop, grade }, { grade: true, crop: false })).toEqual({ grade });
    expect(toPaste({ crop }, { grade: true, crop: false })).toBeNull();
    expect(toPaste({}, { grade: true, crop: true })).toBeNull();
  });

  it('pastes a copied «whole frame» as a clear', () => {
    expect(toPaste({ crop: null }, { grade: false, crop: true })).toEqual({ crop: null });
  });

  it('reads back what it stored, clamped', () => {
    const text = JSON.stringify({ grade, crop: { x: -1, y: 0.2, w: 0.5, h: 2 } });
    const c = parseClipboard(text);
    expect(hasGrade(c)).toBe(true);
    expect(c.crop).toEqual({ x: 0, y: 0, w: 0.5, h: 1 });
  });

  it('treats junk as an empty clipboard', () => {
    expect(parseClipboard(null)).toEqual({});
    expect(parseClipboard('{nope')).toEqual({});
    expect(parseClipboard('[1,2]')).toEqual({});
    expect(parseClipboard('"text"')).toEqual({});
  });
});
