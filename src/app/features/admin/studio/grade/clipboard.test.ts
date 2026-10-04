import { describe, expect, it } from 'vitest';
import { defaultGrade, type GradeParams } from '@/lib/media/grade';
import {
  makeClipboard,
  mergePaste,
  parseClipboard,
  pasteChanges,
  pastePayload,
  serializeClipboard,
} from './clipboard';

const warm: GradeParams = { ...defaultGrade(), exposure: 0.5, contrast: 0.2 };
const crop = { x: 0.1, y: 0, w: 0.8, h: 1 };
const NOW = new Date('2026-10-04T10:00:00Z');

describe('makeClipboard', () => {
  it('keeps a clamped grade and crop with where they came from', () => {
    const cb = makeClipboard({ ...warm, exposure: 9 }, crop, { id: 'c1', label: 'Присед' }, NOW);
    expect(cb.grade?.exposure).toBe(3);
    expect(cb.crop).toEqual(crop);
    expect(cb.fromClipId).toBe('c1');
    expect(cb.fromLabel).toBe('Присед');
    expect(cb.copiedAt).toBe(NOW.toISOString());
  });

  it('spells «no grade» and «whole frame» as null', () => {
    const cb = makeClipboard(defaultGrade(), { x: 0, y: 0, w: 1, h: 1 }, {}, NOW);
    expect(cb.grade).toBeNull();
    expect(cb.crop).toBeNull();
    expect(cb.fromClipId).toBeNull();
  });
});

describe('serialize / parse', () => {
  it('round-trips', () => {
    const cb = makeClipboard(warm, crop, { id: 'c1', label: 'Присед' }, NOW);
    expect(parseClipboard(serializeClipboard(cb))).toEqual(cb);
  });

  it('reads anything that is not a clipboard as empty', () => {
    expect(parseClipboard(null)).toBeNull();
    expect(parseClipboard('')).toBeNull();
    expect(parseClipboard('{not json')).toBeNull();
    expect(parseClipboard('[]')).toBeNull();
    expect(parseClipboard('{"v":99,"grade":null}')).toBeNull();
  });

  it('clamps a hand-edited value instead of trusting it', () => {
    const raw = JSON.stringify({
      v: 1,
      grade: { exposure: 50, curves: { master: [[2, -1]] } },
      crop: { x: -1, y: 0, w: 3, h: 0.5 },
      fromClipId: 7,
      copiedAt: '',
    });
    const cb = parseClipboard(raw)!;
    expect(cb.grade?.exposure).toBe(3);
    expect(cb.grade?.curves.master).toEqual([[1, 0]]);
    expect(cb.crop).toEqual({ x: 0, y: 0, w: 1, h: 0.5 });
    expect(cb.fromClipId).toBeNull();
    expect(cb.copiedAt).toBe(new Date(0).toISOString());
  });
});

describe('pastePayload', () => {
  const cb = makeClipboard(warm, null, {}, NOW);

  it('carries only the chosen halves, null included', () => {
    expect(pastePayload(cb, { colour: true, crop: false })).toEqual({ grade: cb.grade });
    expect(pastePayload(cb, { colour: false, crop: true })).toEqual({ crop: null });
    expect(pastePayload(cb, { colour: true, crop: true })).toEqual({ grade: cb.grade, crop: null });
  });

  it('is null when nothing is chosen', () => {
    expect(pastePayload(cb, { colour: false, crop: false })).toBeNull();
  });
});

describe('mergePaste / pasteChanges', () => {
  const cb = makeClipboard(warm, crop, {}, NOW);
  const current = { grade: null, crop: { x: 0, y: 0.2, w: 1, h: 0.6 } };

  it('replaces the chosen halves and keeps the rest', () => {
    expect(mergePaste(current, cb, { colour: true, crop: false })).toEqual({
      grade: cb.grade,
      crop: current.crop,
    });
    expect(mergePaste(current, cb, { colour: false, crop: true })).toEqual({
      grade: null,
      crop,
    });
  });

  it('says whether anything would change', () => {
    expect(pasteChanges(current, cb, { colour: true, crop: false })).toBe(true);
    expect(pasteChanges({ grade: cb.grade, crop }, cb, { colour: true, crop: true })).toBe(false);
    // An identity grade on the clip is the same as none.
    const none = makeClipboard(null, null, {}, NOW);
    expect(
      pasteChanges({ grade: defaultGrade(), crop: null }, none, { colour: true, crop: true }),
    ).toBe(false);
  });
});
