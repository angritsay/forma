import { describe, expect, it } from 'vitest';
import { defaultGrade, type GradeParams } from '@/lib/media/grade';
import {
  CLIPBOARD_KEY,
  LEGACY_CLIPBOARD_KEY,
  makeClipboard,
  parseClipboard,
  pasteChanges,
  pastePayload,
  readStoredClipboard,
  serializeClipboard,
} from './clipboard';

const warm: GradeParams = { ...defaultGrade(), exposure: 0.5, contrast: 0.2 };
const NOW = new Date('2026-10-04T10:00:00Z');

const store = (items: Record<string, string>) => ({
  getItem: (k: string) => items[k] ?? null,
});

describe('one studio clipboard', () => {
  it('copies the colour — a clamped grade and the auto switch — with where it came from', () => {
    const cb = makeClipboard(
      { grade: { ...warm, exposure: 9 }, autoEnhance: false },
      { id: 'c1', label: 'Присед' },
      NOW,
    );
    expect(cb.grade?.exposure).toBe(3);
    expect(cb.autoEnhance).toBe(false);
    expect(cb.fromClipId).toBe('c1');
    expect(cb.fromLabel).toBe('Присед');
    expect(cb.copiedAt).toBe(NOW.toISOString());
    expect(cb).not.toHaveProperty('crop');
  });

  it('spells «no grade» as null', () => {
    expect(makeClipboard({ grade: defaultGrade(), autoEnhance: true }, {}, NOW).grade).toBeNull();
  });

  it('round-trips', () => {
    const cb = makeClipboard({ grade: warm, autoEnhance: false }, { id: 'c1' }, NOW);
    expect(parseClipboard(serializeClipboard(cb))).toEqual(cb);
  });

  it('reads the old grader clipboard: its grade, the auto pass on, no crop', () => {
    const old = JSON.stringify({
      v: 1,
      grade: warm,
      crop: { x: 0.1, y: 0, w: 0.8, h: 1 },
      fromClipId: 'c9',
      fromLabel: 'Жим',
      copiedAt: NOW.toISOString(),
    });
    const cb = parseClipboard(old);
    expect(cb).toMatchObject({ grade: warm, autoEnhance: true, fromClipId: 'c9' });
    expect(cb).not.toHaveProperty('crop');
  });

  it('reads the old cutter clipboard only when it holds a grade', () => {
    expect(parseClipboard(JSON.stringify({ grade: warm }))?.grade).toEqual(warm);
    expect(parseClipboard(JSON.stringify({ crop: { x: 0, y: 0, w: 0.5, h: 1 } }))).toBeNull();
  });

  it('reads anything that is not a clipboard as empty', () => {
    expect(parseClipboard(null)).toBeNull();
    expect(parseClipboard('')).toBeNull();
    expect(parseClipboard('{not json')).toBeNull();
    expect(parseClipboard('[]')).toBeNull();
    expect(parseClipboard('{"v":99,"grade":null}')).toBeNull();
    expect(parseClipboard('{"v":2,"grade":{"exposure":"loud"}}')?.grade).toBeNull();
  });

  it('prefers the one key and falls back to the grader’s old one — the fixed divergence', () => {
    const now = serializeClipboard(makeClipboard({ grade: warm, autoEnhance: true }, {}, NOW));
    const old = JSON.stringify({ v: 1, grade: { ...defaultGrade(), contrast: -0.5 } });
    expect(readStoredClipboard(store({ [CLIPBOARD_KEY]: now }))?.grade).toEqual(warm);
    expect(readStoredClipboard(store({ [LEGACY_CLIPBOARD_KEY]: old }))?.grade?.contrast).toBe(-0.5);
    expect(
      readStoredClipboard(store({ [CLIPBOARD_KEY]: now, [LEGACY_CLIPBOARD_KEY]: old }))?.grade,
    ).toEqual(warm);
    expect(readStoredClipboard(store({}))).toBeNull();
  });

  it('pastes colour only, and knows when nothing would change', () => {
    const cb = makeClipboard({ grade: warm, autoEnhance: false }, {}, NOW);
    expect(pastePayload(cb)).toEqual({ grade: warm, autoEnhance: false });
    expect(pastePayload(cb)).not.toHaveProperty('crop');
    expect(pasteChanges({ grade: warm, autoEnhance: false }, cb)).toBe(false);
    expect(pasteChanges({ grade: warm, autoEnhance: true }, cb)).toBe(true);
    expect(pasteChanges({ grade: null, autoEnhance: false }, cb)).toBe(true);
    const none = makeClipboard({ grade: null, autoEnhance: true }, {}, NOW);
    expect(pasteChanges({ grade: defaultGrade(), autoEnhance: true }, none)).toBe(false);
  });
});
