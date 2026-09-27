/**
 * The two things a story can be about, each turned into the one shape the six layouts draw
 * (`StoryData`, `layout.ts`): a finished workout, and a day — or a week — in the club.
 *
 * The layouts were written for the workout: a kicker (the course and the date), a headline (the
 * workout's name), a row of figures, the stars, «Готово!». The club's story fits that frame
 * without touching a layout, and that is the point of building it here rather than adding a
 * seventh design: the kicker becomes «Клуб маленьких шагов · 27 сентября», the headline is what
 * was done (today's task by name, or «Неделя 2»), the figures are the day's facts — «+12
 * баллов», «день 10», «серия 4 🔥», «место #3» — and there are no stars, because the club gives
 * none. Every figure is drawn only when the API has it; nothing on the picture is invented.
 *
 * Pure: `t` and the locale are passed in, so the pictures' words are tested in node.
 */
import { formatNumber, plural, type Locale } from '@/i18n/index';
import type { Translate } from '@/app/features/player/model';
import {
  storyFigures,
  type FigureInput,
  type SessionFigure,
} from '@/app/features/player/summary/figures';
import type { StoryData } from './layout';

export interface WorkoutStoryInput extends FigureInput {
  workoutName: string;
  /** The course, or '' for a coach's own workout with none. */
  courseName: string;
  /** ISO timestamp the workout finished at. */
  completedAt: string;
  stars: number | null;
  domain: string;
}

/** «25 сентября» in the reader's language. */
export function storyDate(locale: Locale, iso: string): string {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso));
}

/** The workout's story — exactly what `ShareSheet` used to build inline. */
export function workoutStoryData(t: Translate, locale: Locale, s: WorkoutStoryInput): StoryData {
  return {
    workoutName: s.workoutName,
    courseName: s.courseName,
    date: storyDate(locale, s.completedAt),
    figures: storyFigures(t, locale, s),
    stars: s.stars,
    doneWord: t('app.summaryDone'),
    sticker: t('app.storySticker'),
    domain: s.domain,
  };
}

export interface ClubStoryInput {
  /** «Клуб маленьких шагов» — the kicker. */
  clubName: string;
  /** What was done: today's task by name, or «Неделя 2». */
  headline: string;
  /** ISO timestamp (now). */
  at: string;
  /**
   * The points: today's task's worth (`gain`, drawn «+12») or the week's total (`total`, drawn
   * «22»). Null when the task scores nothing (`rule: 'none'`) or the week is unscored.
   */
  points: number | null;
  pointsMode: 'gain' | 'total';
  /** The day of the round (`my_marathons.day_index`), or null on a recap. */
  day: number | null;
  /** The streak (`clubStreak`); 0 or null is left off the picture. */
  streak: number | null;
  /** The place in the week (`weekStandings`), or null when unranked. */
  place: number | null;
  domain: string;
}

/** The club's facts as figures, in the order they read: points, day, streak, place. */
export function clubFigures(t: Translate, locale: Locale, s: ClubStoryInput): SessionFigure[] {
  const out: SessionFigure[] = [];
  if (s.points !== null) {
    const n = formatNumber(locale, s.points);
    out.push({ value: s.pointsMode === 'gain' ? `+${n}` : n, label: t('app.clubStoryPoints') });
  }
  if (s.day !== null && s.day >= 1) {
    out.push({ value: formatNumber(locale, s.day), label: t('app.clubStoryDay') });
  }
  if (s.streak !== null && s.streak > 0) {
    out.push({ value: `${formatNumber(locale, s.streak)} 🔥`, label: t('app.clubStoryStreak') });
  }
  if (s.place !== null && s.place >= 1) {
    out.push({ value: `#${formatNumber(locale, s.place)}`, label: t('app.clubStoryPlace') });
  }
  return out;
}

export function clubStoryData(t: Translate, locale: Locale, s: ClubStoryInput): StoryData {
  return {
    workoutName: s.headline,
    courseName: s.clubName,
    date: storyDate(locale, s.at),
    figures: clubFigures(t, locale, s),
    stars: null,
    doneWord: t('app.clubStoryDone'),
    sticker: t('app.clubStorySticker'),
    domain: s.domain,
  };
}

/**
 * The line that goes with the club's picture into a chat or a caption: the club's name and the
 * same facts in words — «Клуб маленьких шагов · +12 баллов · день 10 · серия 4 🔥 · место #3».
 * The link travels beside it (`ShareSheet`'s `link`), not inside it: the chat target and the
 * story's widget carry a link of their own, and a message with the same link twice reads as a
 * bot. PR 2 makes that link the member's referral link.
 */
export function clubShareText(t: Translate, locale: Locale, s: ClubStoryInput): string {
  const facts: string[] = [];
  if (s.points !== null) {
    const n = formatNumber(locale, s.points);
    const words = pointsWord(t, locale, s.points, n);
    facts.push(s.pointsMode === 'gain' ? `+${words}` : words);
  }
  if (s.day !== null && s.day >= 1) facts.push(t('app.clubStoryDayN', { n: s.day }));
  if (s.streak !== null && s.streak > 0) facts.push(t('app.clubStoryStreakN', { n: s.streak }));
  if (s.place !== null && s.place >= 1) facts.push(t('app.clubStoryPlaceN', { n: s.place }));
  return [s.clubName, ...facts].join(' · ');
}

/** «12 баллов», with the club's own plural keys — the same three the task's pill uses. */
export function pointsWord(t: Translate, locale: Locale, n: number, formatted?: string): string {
  const value = formatted ?? formatNumber(locale, n);
  return plural(locale, n, {
    one: t('app.marathonPointsOne', { n: value }),
    few: t('app.marathonPointsFew', { n: value }),
    many: t('app.marathonPointsMany', { n: value }),
  });
}
