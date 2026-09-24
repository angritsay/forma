/**
 * The coach's explanation before an exercise: who gets which one, and when.
 *
 * The owner's rule, for the yoga course first: «Перед определенными упражнениями должны быть
 * пояснения. Причем первый раз подробно, два последующих коротко». So an exercise may carry two
 * explanations, written and recorded in the admin panel (`Exercise.introFull`, `introBrief`), and
 * which one a person sees depends only on how many times they have already seen one:
 *
 *   0 views     → the full one
 *   1–2 views   → the brief one
 *   3 and more  → nothing, the exercise starts at once
 *
 * **Only what exists is shown.** The coach may write only one of the two. With just the full one
 * it is shown the first time and never again; with just the brief one it is shown the first three
 * times. There is no promoting a brief explanation into the full slot or the reverse beyond that:
 * the count is the same count either way, and three meetings is where the explaining stops.
 *
 * **Decided once per session.** `introTiersFor` reads the counts when the workout starts and the
 * answer is written onto the prescription (`PrescribedWorkout.intros`). The player's steps are
 * rebuilt from the prescription in several places and results are keyed by step index, so the
 * tier must not change under a running or finished session — a view counted mid-workout would
 * otherwise remove the very step the athlete is standing on.
 *
 * Pure: the counts come in as a map, the exercise lookup defaults to the catalogue and is
 * injectable for tests.
 */
import type { ExerciseIntro } from '@/content/schema';
import { findExercise } from '@/content/catalogue';
import type { ExerciseLookup, IntroTier, PrescribedWorkout } from './types';

/** How many times the brief explanation follows the full one. */
export const INTRO_BRIEF_TIMES = 2;

/** The tier for a person who has seen this exercise's explanation `views` times, if both exist. */
export function introTier(views: number): IntroTier | null {
  const n = Number.isFinite(views) ? Math.max(0, Math.floor(views)) : 0;
  if (n === 0) return 'full';
  if (n <= INTRO_BRIEF_TIMES) return 'brief';
  return null;
}

function hasText(value: { ru?: string; en?: string } | undefined): boolean {
  return !!value && Object.values(value).some((s) => typeof s === 'string' && s.trim() !== '');
}

/**
 * Whether an explanation carries anything to show: words in any language, a clip, or a recording
 * in any language. An empty object — the admin opened the editor and saved nothing — is none.
 */
export function introExists(intro: ExerciseIntro | null | undefined): boolean {
  if (!intro) return false;
  if (hasText(intro.text)) return true;
  if (typeof intro.video === 'string' && intro.video.trim() !== '') return true;
  return hasText(intro.audio);
}

/** The tier this exercise opens with after `views` views, counting only the tiers it has. */
export function introTierFor(
  ex: { introFull?: ExerciseIntro; introBrief?: ExerciseIntro } | undefined,
  views: number,
): IntroTier | null {
  if (!ex) return null;
  const full = introExists(ex.introFull);
  const brief = introExists(ex.introBrief);
  const tier = introTier(views);
  if (tier === null) return null;
  if (full && brief) return tier;
  if (full) return tier === 'full' ? 'full' : null;
  if (brief) return 'brief';
  return null;
}

/**
 * The explanation each exercise of this session opens with, for a person with these view counts.
 *
 * Every movement done as a set of its own counts, the warm-up's included. A board of several
 * movements at once — an AMRAP or a for-time piece of more than one — does not: the athlete does
 * them in turns against one clock, and stopping the clock's first round for an explanation of one
 * of them is not the coach's intent. The same rule decides whether such a piece says a name
 * (`stepVoiceRef`). A movement that appears in several blocks is decided once, at its first.
 *
 * Keyed by the id actually done: a movement substituted for a limitation is a different movement,
 * with explanations (or none) of its own.
 */
export function introTiersFor(
  p: PrescribedWorkout,
  views: Readonly<Record<string, number>>,
  lookup: ExerciseLookup = findExercise,
): Record<string, IntroTier> {
  const out: Record<string, IntroTier> = {};
  const decided = new Set<string>();
  for (const block of p.blocks) {
    const board = block.format === 'amrap' || block.format === 'fortime';
    if (board && block.items.length !== 1) continue;
    for (const item of block.items) {
      const id = item.exerciseId;
      if (decided.has(id)) continue;
      decided.add(id);
      const tier = introTierFor(lookup(id), views[id] ?? 0);
      if (tier) out[id] = tier;
    }
  }
  return out;
}
