/**
 * The onboarding stories — what is shown between the questions and after the last one, as pure
 * data and rules. No React here, so the tap zones, the sets and the seen-marking are tested in
 * node (`stories.test.ts`); `Story.tsx` is the player and `slides/*` are the pictures.
 *
 * Owner: «После онбординга с вопросами нужно сделать в стиле сторис пояснение про приложение. Может
 * некоторые экраны замкнуть между вопросами, например про адаптивную нагрузку». So two of the
 * slides sit right after the answer they explain, and the other four come as one set before the
 * athlete goes home.
 *
 * **Every sentence on a slide is something the code does.** The per-movement comfort model and the
 * lever engine are not wired in, so the slides describe what actually runs: the start scale from
 * the level slider (`startingScale` → `computeFitnessIndex`, activity and experience only until a
 * self-test exists), exercise substitution for the named limitations and «полегче» forced in
 * pregnancy (`prescribe.ts`), the pre-workout recommendation (`recommendDifficulty`) and the
 * post-workout adjustment of ±2–10 % from the rating (`adaptScale`). Change the engine and read
 * the slide copy again.
 */
import type { StepId } from './draft';

/** Every slide there is, in the order the replay (`/intro`) shows them. */
export const STORY_IDS = ['care', 'adapt', 'path', 'player', 'club', 'coach'] as const;
export type StoryId = (typeof STORY_IDS)[number];

/**
 * Which slides follow which question. `care` explains the limitations the athlete just named;
 * `adapt` explains what the level slider feeds, and the four that follow it are the tour of the
 * product — the path, the player, the club, the coach — ending in «Начать тренироваться».
 *
 * A step with no entry here has no story after it; the wizard simply advances.
 */
export const STORY_SETS: Readonly<Partial<Record<StepId, readonly StoryId[]>>> = {
  limitations: ['care'],
  level: ['adapt', 'path', 'player', 'club', 'coach'],
};

/** The slides a completed step shows, or null when it shows none. */
export function storiesFor(step: StepId): readonly StoryId[] | null {
  return STORY_SETS[step] ?? null;
}

/**
 * How long a slide stays on its own. Seven seconds: three short lines at 17px read in about five,
 * and the visual wants a beat. Nothing under `prefers-reduced-motion` — the player then waits for
 * a tap, because a screen that changes on its own is the motion such a person asked to be spared.
 */
export const AUTO_MS = 7000;

/** A press longer than this is a hold (pause), not a tap. */
export const HOLD_MS = 280;

/** Downward travel (px) that counts as «swipe down to close». */
export const SWIPE_DOWN_PX = 80;

export type TapZone = 'back' | 'next';

/**
 * Where a tap landed. The left third goes back, everything else goes on — the split every stories
 * surface uses, so a thumb already knows it. A zero or negative width (a measurement that failed)
 * reads as «next»: going forward is the harmless mistake.
 */
export function tapZone(x: number, width: number): TapZone {
  if (!(width > 0)) return 'next';
  return x < width / 3 ? 'back' : 'next';
}

/**
 * The index a tap moves to. Unclamped on purpose: `-1` means «before the first slide» (back out
 * to the question), `count` means «past the last» (done). The player decides what each means.
 */
export function nextIndex(index: number, zone: TapZone, count: number): number {
  const i = Math.max(-1, Math.min(count, zone === 'back' ? index - 1 : index + 1));
  return i;
}

/**
 * The key a step's set is marked seen under, in `draft.seenStories`. The step id itself: one set
 * per step, and a draft that says `['limitations']` reads as what it means. A function rather than
 * the bare id so the shape can change in one place if a step ever grows a second set.
 */
export function seenKey(step: StepId): string {
  return step;
}

/** Whether the step's set has been seen (or skipped — skipping counts, nothing is lost). */
export function hasSeen(seen: readonly string[], step: StepId): boolean {
  return seen.includes(seenKey(step));
}

/** The list with the step's set marked seen; unchanged when it already was. */
export function markSeen(seen: readonly string[], step: StepId): string[] {
  return hasSeen(seen, step) ? [...seen] : [...seen, seenKey(step)];
}
