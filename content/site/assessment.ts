/**
 * The onboarding assessment: five movements, one minute each, about ten minutes in all.
 *
 * The coach's first rule about day one is «никаких максимумов» (docs/COACH_RULES.md): no max
 * push-up test, no max squats, no five-minute plank. The onboarding used to ask for exactly those
 * three, one screen each, each screen a heading, a lead, a timer and a number field — and the two
 * that matter most were max efforts on a body that has not trained yet.
 *
 * So it is one set now, and the instruction is the opposite of a test: count what you do in a
 * minute at a pace that is comfortable, and stop when the technique goes. The window is a cap, not
 * a target. A beginner reaches the end of what they can do inside it, so their number is the same
 * number a max-effort protocol would have produced, without asking for a max effort; a stronger
 * athlete is cut off by the clock and is under-reported, which lowers the starting load — the safe
 * direction, and the one the coach asks for.
 *
 * Three of the five feed the fitness index (docs/TRAINING_SCIENCE.md §2) through `maps`; the air
 * squat is its own protocol exactly (reps in 60 s). The other two are recorded as personal records
 * under `benchmarkKey`, so nothing here is asked for and then thrown away — they show up in the
 * records list and are the baseline the same five movements are re-measured against later.
 *
 * The plank is deliberately not among them: a plank is a hold, not a count, and a *maximum* hold is
 * the very thing the rule above forbids. The index scores its plank component from the rest when it
 * is missing, which is what that mechanism is for.
 *
 * Editing this list: every `exerciseId` must exist in `content/exercises/` (a test enforces it),
 * every `benchmarkKey` must match `[a-z0-9_]{2,60}`, and the order is the order they are performed.
 */
export interface AssessmentMove {
  /** Exercise id from the library — its clip, its name and its how-to are shown. */
  exerciseId: string;
  /** The work window, seconds. */
  seconds: number;
  /** Which field of the training profile's `tests` the count becomes. */
  maps?: 'pushups' | 'squats60s';
  /** Personal-record key for a movement the fitness index does not read. */
  benchmarkKey?: string;
  /**
   * Offer «с колен». Push-ups only: the index scores full and knee push-ups against different
   * tables, so which one was done is part of the answer rather than a detail.
   */
  kneeOption?: boolean;
}

/** One minute per movement. */
export const ASSESSMENT_WORK_SEC = 60;

/** Roughly how long the whole thing takes, including reading each movement and resting after it. */
export const ASSESSMENT_TOTAL_MIN = 10;

export const ASSESSMENT_MOVES: readonly AssessmentMove[] = [
  { exerciseId: 'air_squat', seconds: ASSESSMENT_WORK_SEC, maps: 'squats60s' },
  { exerciseId: 'push_up', seconds: ASSESSMENT_WORK_SEC, maps: 'pushups', kneeOption: true },
  { exerciseId: 'sit_up', seconds: ASSESSMENT_WORK_SEC, benchmarkKey: 'situps_60s' },
  { exerciseId: 'reverse_lunge', seconds: ASSESSMENT_WORK_SEC, benchmarkKey: 'lunges_60s' },
  { exerciseId: 'glute_bridge', seconds: ASSESSMENT_WORK_SEC, benchmarkKey: 'glute_bridge_60s' },
];
