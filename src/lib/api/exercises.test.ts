import { describe, expect, it } from 'vitest';
import { introFromDb } from './exercises';

/**
 * `intro_full` / `intro_brief` are jsonb columns anyone with the admin role can write, and a
 * player step is drawn from what comes back — so the reader has to be the one that is strict.
 */
describe('introFromDb', () => {
  it('turns anything that is not an intro into null', () => {
    expect(introFromDb(null)).toBeNull();
    expect(introFromDb(undefined)).toBeNull();
    expect(introFromDb('storage:videos/shared/x.mp4')).toBeNull();
    expect(introFromDb(42)).toBeNull();
    expect(introFromDb([])).toBeNull();
    expect(introFromDb({})).toBeNull();
    expect(introFromDb({ text: 'plain string', video: 7, audio: ['a'] })).toBeNull();
    expect(introFromDb({ text: { ru: '' }, video: '' })).toBeNull();
  });

  it('keeps a whole intro and strips what it does not know', () => {
    expect(
      introFromDb({
        text: { ru: 'Сядьте ровно', en: 'Sit up straight', de: 'nein' },
        video: 'storage:videos/shared/lotus.intro-full.mp4',
        audio: { ru: 'storage:audio/shared/lotus.intro-full.ru.m4a' },
        extra: true,
      }),
    ).toEqual({
      text: { ru: 'Сядьте ровно', en: 'Sit up straight' },
      video: 'storage:videos/shared/lotus.intro-full.mp4',
      audio: { ru: 'storage:audio/shared/lotus.intro-full.ru.m4a' },
    });
  });

  it('keeps one half of a pair on its own', () => {
    expect(introFromDb({ text: { en: 'Only English' } })).toEqual({ text: { en: 'Only English' } });
    expect(introFromDb({ audio: { ru: 'storage:audio/shared/a.ru.m4a', en: 3 } })).toEqual({
      audio: { ru: 'storage:audio/shared/a.ru.m4a' },
    });
    expect(introFromDb({ video: 'https://example.com/clip.mp4' })).toEqual({
      video: 'https://example.com/clip.mp4',
    });
  });
});
