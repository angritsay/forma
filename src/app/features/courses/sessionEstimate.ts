/**
 * What a day's session comes to before anyone has started it — minutes, repetitions, calories —
 * and the pills that say so.
 *
 * Three screens state the same facts about the same workout: Home's card («18 мин · 110
 * повторов»), the node preview under the name, and the difficulty sheet's three rows. They used
 * to compute them in two places and word them in three, and the owner's prototype
 * (`design/ui_kits/app-v2`) puts the identical pair of pills on Home and on the programme's cover.
 * One prescription, one estimate, one wording — so the number on Home is the number the sheet
 * offers as «Как обычно», and never a rounding away from it.
 *
 * The estimate is for the *normal* choice unless told otherwise, because that is the row the
 * sheet recommends most days and the one figure a card can honestly show for a decision not yet
 * made. Points are not here on purpose: they are the club's currency, and a workout is time
 * spent, not a score.
 */
import type { Level, Workout } from '@/content/schema';
import { formatNumber, plural } from '@/i18n/index';
import { estimateCalories, estimateTrainingDuration, workoutVolume } from '@/lib/training/estimate';
import { prescribeWorkout } from '@/lib/training/prescribe';
import type {
  DifficultyChoice,
  PrescribedWorkout,
  UserTrainingProfile,
} from '@/lib/training/types';
import type { Translator } from '@/app/hooks/useT';

export interface SessionEstimate {
  choice: DifficultyChoice;
  prescribed: PrescribedWorkout;
  durationSec: number;
  /**
   * Whole minutes of training, never below one: «0 мин» is not a session.
   *
   * The warm-up and the cool-down are not in it — `docs/COACH_RULES.md` does not count them as
   * training, and neither does the repetition figure beside this one.
   */
  minutes: number;
  /** Repetitions prescribed across the session; 0 for a workout made only of timed work. */
  reps: number;
  /** Seconds of prescribed work, rest excluded. */
  workSec: number;
  calories: number;
}

export interface SessionEstimateInput {
  profile: UserTrainingProfile;
  /** The course's load multiplier, from the engine state (`useEngineCourseState`). */
  scale: number;
  level: Level;
  weightKg?: number;
  deload?: boolean;
  /** Already done once: the prescription is the same, only the points differ. */
  repeat?: boolean;
  /** Default «как обычно». */
  choice?: DifficultyChoice;
}

export function estimateSession(workout: Workout, input: SessionEstimateInput): SessionEstimate {
  const choice = input.choice ?? 'normal';
  const prescribed = prescribeWorkout(workout, {
    profile: input.profile,
    scale: input.scale,
    choice,
    level: input.level,
    ...(input.deload !== undefined ? { deload: input.deload } : {}),
    ...(input.repeat !== undefined ? { repeat: input.repeat } : {}),
  });
  const volume = workoutVolume(prescribed);
  /*
   * Training only. The warm-up and the cool-down are roughly ten fixed minutes whichever row is
   * picked, so counting them made «Полегче» and «Посложнее» read as 13 and 14 minutes for sixty
   * per cent more work — three options that look the same next to repetitions that do not.
   */
  const durationSec = estimateTrainingDuration(prescribed).totalSec;
  return {
    choice,
    prescribed,
    durationSec,
    minutes: Math.max(1, Math.round(durationSec / 60)),
    reps: volume.reps,
    workSec: volume.workSec,
    calories: estimateCalories(prescribed, input.weightKg),
  };
}

/** «18 мин» — the length, as the prototype's pill words it: no tilde, the unit after the figure. */
export function minutesLabel(tr: Translator, minutes: number): string {
  return `${minutes} ${tr.t('common.minutesUnit')}`;
}

/** «110 повторов», or for a session of holds and timed rounds «5 мин работы». */
export function workLabel(tr: Translator, est: Pick<SessionEstimate, 'reps' | 'workSec'>): string {
  if (est.reps > 0) {
    const n = formatNumber(tr.locale, est.reps);
    return plural(tr.locale, est.reps, {
      one: tr.t('app.nodeRepsOne', { n }),
      few: tr.t('app.nodeRepsFew', { n }),
      many: tr.t('app.nodeRepsMany', { n }),
    });
  }
  return tr.t('app.nodeWorkMin', { min: Math.max(1, Math.round(est.workSec / 60)) });
}

/**
 * The pills a card or a preview shows for a session: the length and the work, and the calories
 * where the screen has room for a third. Home shows two — the prototype's «18 мин · 110
 * повторов» — because the card's bottom third also holds a name and a button.
 */
export function sessionPills(
  tr: Translator,
  est: Pick<SessionEstimate, 'minutes' | 'reps' | 'workSec' | 'calories'>,
  opts: { calories?: boolean } = {},
): string[] {
  const pills = [minutesLabel(tr, est.minutes), workLabel(tr, est)];
  if (opts.calories) pills.push(tr.t('app.nodeKcal', { n: est.calories }));
  return pills;
}
