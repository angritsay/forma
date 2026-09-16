/**
 * What today's card says when a workout was left unfinished.
 *
 * Home used to show two workout buttons at once: a «ПРОДОЛЖИТЬ» strip for the abandoned session
 * and, right under it, today's cover card offering «НАЧАТЬ». The owner's verdict: «не может быть
 * такого состояния что и продолжить тренировку и начать курс. На главном экране всегда должна быть
 * только одна кнопка тренировки». She is right, and not only about the clutter — the two buttons
 * disagree about what the athlete is doing today, and the screen has no way to say which of them
 * it means.
 *
 * So there is one card. When a session is open it *is* the card: same photograph, same shape, with
 * the unfinished workout's words and one button that goes back to it. When there is none, the card
 * is today's session as before. This module is the first half of that — pure, so the choice is
 * testable without a screen — and `HomeScreen` is the second.
 */
import type { Locale } from '@/i18n/index';
import { stepTitle, type Translate } from '@/app/features/player/model';
import type { ActiveWorkoutState } from '@/app/store/activeWorkout';
import { activeWorkoutPath } from '@/app/store/activeWorkout';

/** The slice of the player store this reads. Narrow on purpose: it is all the choice needs. */
export type ResumeSlice = Pick<
  ActiveWorkoutState,
  'session' | 'finishedAt' | 'steps' | 'stepIndex'
>;

export interface ResumeCard {
  /** Where the button goes: back into the player, or on to the summary that still needs saving. */
  path: string;
  /** The course the unfinished session belongs to, so tapping the picture opens the right path. */
  courseId: string;
  /** A finished-but-unsaved session is not resumed, it is saved — different kicker, different verb. */
  finished: boolean;
  /** i18n key for the kicker. */
  eyebrowKey: 'app.homeResumeEyebrow' | 'app.homeResumeFinishedEyebrow';
  /** i18n key for the button. */
  ctaKey: 'app.homeResumeCta' | 'app.homeResumeSave';
  /**
   * The movement it stopped on, already formatted — «Приседания» — or `''` when there is nothing
   * to name. A finished session has nothing left to name: it needs saving, not resuming.
   */
  stoppedOn: string;
}

/**
 * The resume state of today's card, or `null` when today's card is just today's session.
 *
 * `activeWorkoutPath` is the single judge of whether a session is resumable at all, so this cannot
 * offer a button the player would refuse — the bug the old two-component arrangement kept
 * reintroducing, where the strip and the screen each decided for themselves.
 */
export function resumeCard(s: ResumeSlice, t: Translate, locale: Locale): ResumeCard | null {
  const { session, finishedAt } = s;
  if (!session) return null;
  const path = activeWorkoutPath({ session, finishedAt });
  if (!path) return null;

  const finished = finishedAt !== null;
  const step = s.steps[s.stepIndex];
  return {
    path,
    courseId: session.courseId,
    finished,
    eyebrowKey: finished ? 'app.homeResumeFinishedEyebrow' : 'app.homeResumeEyebrow',
    ctaKey: finished ? 'app.homeResumeSave' : 'app.homeResumeCta',
    stoppedOn: !finished && step ? stepTitle(t, locale, step, session.prescribed) : '',
  };
}
