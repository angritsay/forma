import { describe, expect, it } from 'vitest';
import type { Translate } from '@/app/features/player/model';
import { t as translate } from '@/i18n/index';
import { clubFigures, clubShareText, clubStoryData, type ClubStoryInput } from './data';

const ru = ((key, params) => translate('ru', key, params)) as Translate;
const en = ((key, params) => translate('en', key, params)) as Translate;

const day: ClubStoryInput = {
  clubName: 'Клуб маленьких шагов',
  headline: 'Пятьдесят берпи за день',
  at: '2026-09-27T12:00:00Z',
  points: 15,
  pointsMode: 'gain',
  day: 10,
  streak: 4,
  place: 3,
  domain: 'forma-app.co',
};

describe('the club story', () => {
  it('draws the day as «+15 · день 10 · серия 4 🔥 · место #3»', () => {
    expect(clubFigures(ru, 'ru', day)).toEqual([
      { value: '+15', label: 'баллов' },
      { value: '10', label: 'день' },
      { value: '4 🔥', label: 'серия' },
      { value: '#3', label: 'место' },
    ]);
  });

  it('draws only the facts the API has', () => {
    const bare = { ...day, points: null, streak: 0, place: null };
    expect(clubFigures(ru, 'ru', bare)).toEqual([{ value: '10', label: 'день' }]);
    const recap = { ...day, pointsMode: 'total' as const, points: 22, day: null };
    expect(clubFigures(en, 'en', recap).map((f) => f.value)).toEqual(['22', '4 🔥', '#3']);
  });

  it('fits the layouts’ frame: the club as the kicker, the task as the headline, no stars', () => {
    const d = clubStoryData(ru, 'ru', day);
    expect(d.courseName).toBe('Клуб маленьких шагов');
    expect(d.workoutName).toBe('Пятьдесят берпи за день');
    expect(d.date).toBe('27 сентября');
    expect(d.stars).toBeNull();
    expect(d.doneWord).toBe('Шаг сделан');
    expect(d.domain).toBe('forma-app.co');
  });

  it('writes the caption with the club’s name and the facts in words', () => {
    expect(clubShareText(ru, 'ru', day)).toBe(
      'Клуб маленьких шагов · +15 баллов · день 10 · серия 4 🔥 · место #3',
    );
    expect(clubShareText(en, 'en', { ...day, points: 1, streak: null, place: null })).toBe(
      'Клуб маленьких шагов · +1 point · day 10',
    );
    // Russian plurals on the points, the same three forms the task's pill uses.
    expect(clubShareText(ru, 'ru', { ...day, points: 22, pointsMode: 'total' })).toContain(
      '22 балла',
    );
  });
});
