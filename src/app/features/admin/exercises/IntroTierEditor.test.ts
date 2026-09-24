import { describe, expect, it } from 'vitest';
import { cleanIntro, emptyIntro, introToDraft } from './IntroTierEditor';

describe('cleanIntro', () => {
  it('saves nothing when every part is empty', () => {
    expect(cleanIntro(emptyIntro())).toBeNull();
    expect(cleanIntro({ text: { ru: '   ', en: '' }, video: '  ', audio: { ru: '' } })).toBeNull();
  });

  it('keeps what was written and drops the rest', () => {
    expect(
      cleanIntro({
        text: { ru: ' Сядьте ровно ', en: '' },
        video: null,
        audio: { en: 'storage:audio/shared/lotus.intro-full.en.m4a' },
      }),
    ).toEqual({
      text: { ru: 'Сядьте ровно' },
      audio: { en: 'storage:audio/shared/lotus.intro-full.en.m4a' },
    });
    expect(
      cleanIntro({ ...emptyIntro(), video: 'storage:videos/shared/x.intro-brief.mp4' }),
    ).toEqual({ video: 'storage:videos/shared/x.intro-brief.mp4' });
  });

  it('round-trips through the draft', () => {
    const intro = {
      text: { ru: 'А', en: 'B' },
      video: 'storage:videos/shared/a.intro-full.mp4',
      audio: { ru: 'storage:audio/shared/a.intro-full.ru.m4a' },
    };
    expect(cleanIntro(introToDraft(intro))).toEqual(intro);
    expect(cleanIntro(introToDraft(null))).toBeNull();
  });
});
