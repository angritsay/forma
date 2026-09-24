import { describe, expect, it } from 'vitest';
import type { ExerciseCatalogRow } from '@/lib/api/types';
import { refsByExercise, refsOf, safeFileName } from './mediaUsage';

function row(id: string, patch: Partial<ExerciseCatalogRow>): ExerciseCatalogRow {
  return {
    id,
    nameRu: id,
    nameEn: null,
    shortNameRu: null,
    shortNameEn: null,
    descriptionRu: null,
    descriptionEn: null,
    howTo: [],
    cues: [],
    mistakes: [],
    breathingRu: null,
    breathingEn: null,
    primaryMuscle: null,
    muscles: [],
    pattern: null,
    equipment: [],
    level: null,
    unit: 'seconds',
    secondsPerRep: null,
    videoRu: null,
    videoEn: null,
    videoMode: 'loop',
    audioRu: null,
    audioEn: null,
    introFull: null,
    introBrief: null,
    image: null,
    tags: [],
    isTest: false,
    isCustom: true,
    ...patch,
  };
}

describe('refsOf', () => {
  it('collects every media reference of a row, intros included', () => {
    const r = row('lotus', {
      videoRu: 'storage:videos/shared/lotus.ru.mp4',
      videoEn: ' storage:videos/shared/lotus.en.mp4 ',
      audioRu: 'storage:audio/shared/lotus.ru.m4a',
      image: 'storage:images/exercises/lotus.jpg',
      introFull: {
        text: { ru: 'x' },
        video: 'storage:videos/shared/lotus.intro-full.mp4',
        audio: { en: 'storage:audio/shared/lotus.intro-full.en.m4a' },
      },
      introBrief: { audio: { ru: 'storage:audio/shared/lotus.intro-brief.ru.m4a' } },
    });
    expect(refsOf(r)).toEqual([
      'storage:videos/shared/lotus.ru.mp4',
      'storage:videos/shared/lotus.en.mp4',
      'storage:audio/shared/lotus.ru.m4a',
      'storage:images/exercises/lotus.jpg',
      'storage:videos/shared/lotus.intro-full.mp4',
      'storage:audio/shared/lotus.intro-full.en.m4a',
      'storage:audio/shared/lotus.intro-brief.ru.m4a',
    ]);
    expect(refsOf(row('bare', {}))).toEqual([]);
  });
});

describe('refsByExercise', () => {
  it('maps a reference to every exercise that uses it, once each', () => {
    const shared = 'storage:videos/shared/breath.ru.mp4';
    const map = refsByExercise([
      row('a', { videoRu: shared, videoEn: shared }),
      row('b', { introBrief: { video: shared } }),
      row('c', { image: 'storage:images/exercises/c.jpg' }),
    ]);
    expect(map.get(shared)).toEqual(['a', 'b']);
    expect(map.get('storage:images/exercises/c.jpg')).toEqual(['c']);
    expect(map.get('storage:videos/shared/nobody.mp4')).toBeUndefined();
  });
});

describe('safeFileName', () => {
  it('keeps a conventional name and tames the rest', () => {
    expect(safeFileName('lotus.ru.m4a')).toBe('lotus.ru.m4a');
    // Cyrillic collapses to dashes; what survives is still a legal key with the right extension.
    expect(safeFileName('Поза лотоса (1).M4A')).toBe('1-.m4a');
    expect(safeFileName('My Clip Final.MP4')).toBe('my-clip-final.mp4');
    expect(safeFileName('   ')).toBe('file');
    expect(safeFileName('---.mp4')).toBe('mp4');
  });
});
