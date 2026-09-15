/**
 * The onboarding assessment: five movements, one minute each, about ten minutes in all.
 *
 * The coach's first rule about day one is «никаких максимумов» (docs/COACH_RULES.md): no max
 * push-up test, no max squats, no five-minute plank. The onboarding used to ask for exactly those
 * three, one screen each, each screen a heading, a lead, a timer and a number field — and all three
 * were max efforts on a body that has not trained yet.
 *
 * So it is one set now, and the instruction is the opposite of a test: do what you do in a minute at
 * a pace that is comfortable, and stop when the technique goes. A screen before the first movement
 * says why in the athlete's own interest — a number squeezed out today is a programme that is too
 * heavy tomorrow — because this is the one instruction the whole thing depends on, and an
 * instruction that arrives beside a running clock is an instruction nobody reads.
 *
 * The minute is a cap, not a target. A beginner reaches the end of what they can do inside it, so
 * their number is the same number a max-effort protocol would have produced, without asking for a
 * max effort; a stronger athlete is cut off by the clock and is under-reported, which lowers the
 * starting load — the safe direction, and the one the coach asks for.
 *
 * Three of the five feed the fitness index (docs/TRAINING_SCIENCE.md §2) through `maps`; the air
 * squat is its own protocol exactly (reps in 60 s). The other two are recorded as personal records
 * under `benchmarkKey`, so nothing here is asked for and then thrown away — they show up in the
 * records list and are the baseline the same five movements are re-measured against later.
 *
 * The plank is the one measured in seconds rather than counts (`metric`), so it is the one movement
 * that can end before the clock does: the athlete stops when the back stops being straight and the
 * screen records how long that took. Its window is the same minute as everything else, which caps
 * the component it feeds — that cap is the point, not a rounding error, since the alternative is
 * the maximum hold the rule above rules out.
 *
 * Editing this list: every `exerciseId` must exist in `content/exercises/` (a test enforces it),
 * every `benchmarkKey` must match `[a-z0-9_]{2,60}`, and the order is the order they are performed.
 */
export interface AssessmentMove {
  /** Exercise id from the library — its clip, its name and its how-to are shown. */
  exerciseId: string;
  /** The work window, seconds. */
  seconds: number;
  /**
   * What the athlete reports. `reps` is a count made during the window; `seconds` is a hold, which
   * the athlete ends themselves and the screen times for them.
   */
  metric: 'reps' | 'seconds';
  /** Which field of the training profile's `tests` the number becomes. */
  maps?: 'pushups' | 'squats60s' | 'plankSec';
  /** Personal-record key for a movement the fitness index does not read. */
  benchmarkKey?: string;
  /**
   * Offer «с колен», and the movement to show when it is taken.
   *
   * Push-ups only: the index scores full and knee push-ups against different tables, so which one
   * was done is part of the answer rather than a detail. It carries the id rather than a flag
   * because the screen has to show the movement the athlete is actually doing — a clip of full
   * push-ups over the words «отжимания с колен» is the app asking for one thing and demonstrating
   * another, in the one minute where getting the number right decides the next eight weeks.
   */
  kneeExerciseId?: string;
}

/** One minute per movement. */
export const ASSESSMENT_WORK_SEC = 60;

/** Roughly how long the whole thing takes, including reading each movement and resting after it. */
export const ASSESSMENT_TOTAL_MIN = 10;

export const ASSESSMENT_MOVES: readonly AssessmentMove[] = [
  { exerciseId: 'air_squat', seconds: ASSESSMENT_WORK_SEC, metric: 'reps', maps: 'squats60s' },
  {
    exerciseId: 'push_up',
    seconds: ASSESSMENT_WORK_SEC,
    metric: 'reps',
    maps: 'pushups',
    kneeExerciseId: 'knee_push_up',
  },
  {
    exerciseId: 'sit_up',
    seconds: ASSESSMENT_WORK_SEC,
    metric: 'reps',
    benchmarkKey: 'situps_60s',
  },
  {
    exerciseId: 'reverse_lunge',
    seconds: ASSESSMENT_WORK_SEC,
    metric: 'reps',
    benchmarkKey: 'lunges_60s',
  },
  { exerciseId: 'plank', seconds: ASSESSMENT_WORK_SEC, metric: 'seconds', maps: 'plankSec' },
];
