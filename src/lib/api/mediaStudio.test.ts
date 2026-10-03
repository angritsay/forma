import { describe, expect, it, vi } from 'vitest';
import { defaultGrade } from '@/lib/media/grade';
import type * as Latency from './demo/latency';
import {
  addMediaClip,
  clipPatchToDb,
  cropToDb,
  gradeToDb,
  mediaClipFromDb,
  mediaSourceFromDb,
  pasteMediaSettings,
  queueMediaClips,
  rawClipPath,
  saveMediaSource,
  type DbMediaClip,
} from './mediaStudio';

vi.mock('./demo/latency', async (importOriginal) => ({
  ...(await importOriginal<typeof Latency>()),
  delay: () => Promise.resolve(),
}));

const SRC = '0b6c1a52-1d8e-4a51-9a3e-2f5b7c9d0e11';
const CLIP = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

const dbClip = (over: Partial<DbMediaClip> = {}): DbMediaClip => ({
  id: CLIP,
  source_id: SRC,
  exercise_id: 'air_squat',
  exercise_name: 'Присед',
  exercise_has_video: true,
  raw_path: `${SRC}/${CLIP}.mp4`,
  raw_offset_s: '0.40',
  start_s: '12.5',
  end_s: 30,
  crop: { x: 0.1, y: 0, w: 0.8, h: 1 },
  grade: { exposure: 0.5, curves: { master: [[0.5, 0.6]] } },
  grade_version: 1,
  status: 'queued',
  error: null,
  attempts: '1',
  rendered_at: null,
  created_at: '2026-10-03T10:00:00Z',
  updated_at: '2026-10-03T10:01:00Z',
  ...over,
});

describe('rawClipPath', () => {
  it('is <source>/<clip>.<ext>, lower case', () => {
    expect(rawClipPath(SRC.toUpperCase(), CLIP, '.MOV')).toBe(`${SRC}/${CLIP}.mov`);
    expect(rawClipPath(SRC, CLIP)).toBe(`${SRC}/${CLIP}.mp4`);
  });

  it('refuses anything that is not two ids and a plain extension', () => {
    expect(() => rawClipPath('../x', CLIP)).toThrow('invalid_raw_path');
    expect(() => rawClipPath(SRC, CLIP, 'mp4/../../a')).toThrow('invalid_raw_path');
    expect(() => rawClipPath(SRC, 'not-a-uuid')).toThrow('invalid_raw_path');
  });
});

describe('mappers', () => {
  it('reads a clip: numeric strings to numbers, grade and crop clamped', () => {
    const c = mediaClipFromDb(dbClip());
    expect(c.rawOffsetS).toBe(0.4);
    expect(c.startS).toBe(12.5);
    expect(c.endS).toBe(30);
    expect(c.attempts).toBe(1);
    expect(c.crop).toEqual({ x: 0.1, y: 0, w: 0.8, h: 1 });
    expect(c.grade).toEqual({
      ...defaultGrade(),
      exposure: 0.5,
      curves: { master: [[0.5, 0.6]], r: [], g: [], b: [] },
    });
    expect(c.status).toBe('queued');
    expect(c.exerciseHasVideo).toBe(true);
  });

  it('reads missing and unknown values safely', () => {
    const c = mediaClipFromDb(
      dbClip({
        grade: null,
        crop: 'junk',
        status: 'exploded',
        exercise_id: '',
        exercise_has_video: null,
        grade_version: null,
      }),
    );
    expect(c.grade).toBeNull();
    expect(c.crop).toBeNull();
    expect(c.status).toBe('draft');
    expect(c.exerciseId).toBeNull();
    expect(c.exerciseHasVideo).toBe(false);
    expect(c.gradeVersion).toBe(1);
  });

  it('reads a source with its counts', () => {
    expect(
      mediaSourceFromDb({
        id: SRC,
        title: null,
        file_name: '',
        duration_s: '1800.5',
        created_at: '2026-10-03T10:00:00Z',
        clips: '4',
        done: 1,
        queued: null,
        failed: '1',
      }),
    ).toEqual({
      id: SRC,
      title: '',
      fileName: null,
      durationS: 1800.5,
      createdAt: '2026-10-03T10:00:00Z',
      clips: 4,
      done: 1,
      queued: 0,
      failed: 1,
    });
  });

  it('stores «no grade» and «whole frame» as null', () => {
    expect(gradeToDb(defaultGrade())).toBeNull();
    expect(gradeToDb(null)).toBeNull();
    expect(gradeToDb({ ...defaultGrade(), contrast: 9 })).toMatchObject({ contrast: 1 });
    expect(cropToDb({ x: 0, y: 0, w: 1, h: 1 })).toBeNull();
    expect(cropToDb({ x: 0.9, y: 0, w: 0.5, h: 1 })).toEqual({ x: 0.5, y: 0, w: 0.5, h: 1 });
  });

  it('sends only the keys being changed, with the grade version', () => {
    expect(clipPatchToDb({})).toEqual({});
    expect(clipPatchToDb({ exerciseId: '' })).toEqual({ exercise_id: null });
    expect(clipPatchToDb({ crop: null })).toEqual({ crop: null });
    expect(clipPatchToDb({ grade: { ...defaultGrade(), exposure: 1 } })).toEqual({
      grade: { ...defaultGrade(), exposure: 1 },
      grade_version: 1,
    });
  });
});

describe('client-side checks', () => {
  it('refuses a bad span or path before calling anything', async () => {
    const base = {
      id: CLIP,
      sourceId: SRC,
      rawPath: `${SRC}/${CLIP}.mp4`,
      rawOffsetS: 0.3,
      startS: 10,
      endS: 20,
    };
    await expect(addMediaClip({ ...base, endS: 10 })).rejects.toMatchObject({
      code: 'validation',
      message: 'invalid_span',
    });
    await expect(addMediaClip({ ...base, endS: 1000 })).rejects.toMatchObject({
      message: 'invalid_span',
    });
    await expect(addMediaClip({ ...base, rawPath: '../a.mp4' })).rejects.toMatchObject({
      message: 'invalid_raw_path',
    });
    await expect(saveMediaSource({ id: 'nope' })).rejects.toMatchObject({ message: 'invalid_id' });
  });

  it('does nothing for an empty selection', async () => {
    expect(await queueMediaClips([])).toBe(0);
    expect(await pasteMediaSettings([CLIP], {})).toBe(0);
  });
});
