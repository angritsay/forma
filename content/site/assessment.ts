/**
 * The assessment: five movements, a number for each, about three minutes in all.
 *
 * **It is no longer part of signing up.** It was the seventh step of the onboarding wizard until
 * the owner moved it out: «особенно оттуда убрать тестирование. Мы тестирование через пару
 * тренировок будем спрашивать». It is now its own screen (`/assessment`), offered by a banner
 * after the second completed workout (`src/app/features/assessment`). Nothing about the five
 * movements changed with the move; what changed is that the person answering has trained twice
 * with the coach's cues before they are asked, which is the difference between an estimate and a
 * guess.
 *
 * The coach's first rule about day one is «никаких максимумов» (docs/COACH_RULES.md). That rule
 * survived two rounds of this screen. The first asked for max push-ups, max squats and a max plank,
 * one screen each — three max efforts on a body that has not trained yet. The second replaced them
 * with a minute per movement at a comfortable pace, which was gentler but still a performance: a
 * ring draining on screen, a horn at zero, a wake lock, and a person on a mat being timed.
 *
 * The owner cut the last of it: «убери таймер в онбординге совсем. Нам нужно просто чтобы он
 * лайтово прошли и поделились примерно сколько раз они могут сделать не умирая». So nothing is
 * timed and nothing is performed. Each movement is its clip, its name, and one question — roughly
 * how many of these can you do without going to failure — and the answer is whatever the athlete
 * says it is.
 *
 * **What that does to the fitness index, honestly.** Three of the five feed it
 * (docs/TRAINING_SCIENCE.md §2); the other two are personal records under `benchmarkKey`. Two of
 * the three get *closer* to what their tables expect: `pushups` is documented as max consecutive
 * push-ups and the minute was only ever a proxy for it, and `PLANK_ANCHORS` run to 180 seconds
 * while the minute capped every answer at 60 — a strong plank could not be reported at all. The
 * third, `squats60s`, is the one that loosens: its anchors were built for reps in sixty seconds
 * and now read a self-reported comfortable set, which for most people runs a little higher. The
 * field keeps its name because renaming it would migrate stored profiles for no reader's benefit,
 * and the loosening is written down here rather than left to be discovered. Task #41 — the coach's
 * own ranges as data — is where the tables stop being borrowed and this stops mattering.
 *
 * A self-reported number is also the honest shape of the question. The minute never measured
 * anything the athlete did not choose either: they set the pace and stopped when the technique
 * went. All that is gone is the clock watching them do it.
 *
 * Editing this list: every `exerciseId` must exist in `content/exercises/` (a test enforces it),
 * every `benchmarkKey` must match `[a-z0-9_]{2,60}`, and the order is the order they are asked.
 */
export interface AssessmentMove {
  /** Exercise id from the library — its clip, its name and its how-to are shown. */
  exerciseId: string;
  /**
   * What the athlete reports: a count of repetitions, or a hold in seconds. Both are estimates
   * they give, not measurements the screen takes.
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

/**
 * Roughly how long it takes to watch five clips and answer five questions. Nothing is performed on
 * the screen, so this is reading time, not training time.
 */
export const ASSESSMENT_TOTAL_MIN = 3;

export const ASSESSMENT_MOVES: readonly AssessmentMove[] = [
  { exerciseId: 'air_squat', metric: 'reps', maps: 'squats60s' },
  {
    exerciseId: 'push_up',
    metric: 'reps',
    maps: 'pushups',
    kneeExerciseId: 'knee_push_up',
  },
  {
    exerciseId: 'sit_up',
    metric: 'reps',
    benchmarkKey: 'situps_60s',
  },
  {
    exerciseId: 'reverse_lunge',
    metric: 'reps',
    benchmarkKey: 'lunges_60s',
  },
  { exerciseId: 'plank', metric: 'seconds', maps: 'plankSec' },
];
