import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loopIds, readExerciseSources } from './site-loop-ids.mjs';

describe('loopIds', () => {
  it('reads the shared Russian clip of each exercise, unique and sorted', () => {
    const a = `{ id: 'push_up', video: { ru: 'storage:videos/shared/push_up.ru.mp4' } }`;
    const b = `{
      id: 'air_squat',
      video: {
        ru: "storage:videos/shared/air_squat.ru.mp4",
      },
    }, { id: 'push_up', video: { ru: 'storage:videos/shared/push_up.ru.mp4' } }`;
    expect(loopIds([a, b])).toEqual(['air_squat', 'push_up']);
  });

  it('ignores course-gated clips, other languages, comments and unsafe names', () => {
    const code = [
      `video: { ru: 'storage:videos/start/air_squat.ru.mp4' }`,
      `video: { en: 'storage:videos/shared/lunge.en.mp4' }`,
      `// see storage:videos/shared/<id>.ru.mp4`,
      `poster: 'storage:videos/shared/plank.ru.mp4'`,
      `video: { ru: 'storage:videos/shared/../x.ru.mp4' }`,
      `video: { ru: 'storage:videos/shared/a b.ru.mp4' }`,
      `video: { ru: 'storage:videos/shared/Push.ru.mp4' }`,
    ].join('\n');
    expect(loopIds([code])).toEqual([]);
  });

  it('finds every filmed movement in the real catalogue', () => {
    const dir = fileURLToPath(new URL('../../content/exercises/', import.meta.url));
    const ids = loopIds(readExerciseSources(dir));
    expect(ids.length).toBeGreaterThanOrEqual(20);
    expect(ids).toContain('air_squat');
    expect(ids).toContain('push_up');
    for (const id of ids) expect(id).toMatch(/^[a-z0-9_]+$/);
  });
});
