/**
 * How many times this person has seen each exercise's explanation (0048,
 * `exercise_intro_views`).
 *
 * The count decides which explanation the next session opens an exercise with — the full one the
 * first time, the brief one the next two, none after (`src/lib/training/intro.ts`). It lives on the
 * server so it follows the person across devices; the player keeps a local mirror as well
 * (`src/app/features/player/introViews.ts`), so a start never waits on this and an offline view is
 * not forgotten.
 *
 * Both RPCs are `security invoker` for `authenticated`: RLS scopes them to the caller's own rows.
 */
import { supabase } from './client';
import { demo } from './demo/load';
import { guard, unwrapMaybe } from './internal';
import { isDemo } from './mode';

/** Views per exercise id, for the signed-in person. Exercises never seen are absent. */
export async function listMyIntroViews(): Promise<Record<string, number>> {
  if (isDemo()) return (await demo()).listMyIntroViews();
  return guard(async () => {
    const rows = unwrapMaybe<{ exercise_id: string; views: number }[]>(
      await supabase().rpc('my_exercise_intro_views'),
    );
    const out: Record<string, number> = {};
    for (const r of rows ?? []) {
      const n = Number(r.views);
      if (typeof r.exercise_id === 'string' && Number.isFinite(n)) out[r.exercise_id] = n;
    }
    return out;
  });
}

/** Count one more view of this exercise's explanation; resolves to the new total. */
export async function markIntroSeen(exerciseId: string): Promise<number> {
  if (isDemo()) return (await demo()).markIntroSeen(exerciseId);
  return guard(async () => {
    const n = unwrapMaybe<number>(
      await supabase().rpc('mark_exercise_intro_seen', { p_exercise_id: exerciseId }),
    );
    return Number(n ?? 0);
  });
}
