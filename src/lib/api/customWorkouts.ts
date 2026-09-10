/**
 * Coach-built ("custom") workouts: composed in the admin panel, handed out by a share link or by
 * assigning to a person's email, and played through the normal player.
 *
 * Admin calls write `public.custom_workouts` / `public.assigned_workouts` (RLS: is_admin()).
 * A person reads their own through `my_custom_workouts`, and a share link resolves through the
 * `get_shared_custom_workout` RPC so shared workouts are never enumerable.
 */
import {
  buildPrescribedFromCustom,
  type CustomWorkoutStructure,
} from '@/lib/training/customWorkout';
import { supabase } from './client';
import { demo } from './demo/load';
import { currentUser, guard, unwrap, unwrapMaybe, unwrapVoid } from './internal';
import { isDemo } from './mode';
import type {
  AssignedWorkoutRow,
  CustomWorkoutRow,
  CustomWorkoutSummary,
  WorkoutAssigneeRow,
} from './types';

export interface CustomWorkoutInput {
  title: string;
  description?: string | null;
  structure: CustomWorkoutStructure;
}

interface DbCustomWorkout {
  id: string;
  short_id: string;
  title: string;
  description: string | null;
  structure: unknown;
  est_sec: number | null;
  points: number | null;
  share_token: string | null;
  created_at: string;
  updated_at: string;
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const TOKEN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';

function randomFrom(alphabet: string, length: number): string {
  const out: string[] = [];
  const cryptoObj = typeof crypto !== 'undefined' ? crypto : undefined;
  if (cryptoObj?.getRandomValues) {
    const buf = new Uint32Array(length);
    cryptoObj.getRandomValues(buf);
    for (let i = 0; i < length; i += 1) out.push(alphabet[buf[i]! % alphabet.length]!);
  } else {
    for (let i = 0; i < length; i += 1)
      out.push(alphabet[Math.floor(Math.random() * alphabet.length)]!);
  }
  return out.join('');
}

const newShortId = () => `cw_${randomFrom(ALPHABET, 12)}`;
const newShareToken = () => randomFrom(TOKEN_ALPHABET, 32);

function summaryFromDb(r: DbCustomWorkout): CustomWorkoutSummary {
  return {
    id: r.id,
    shortId: r.short_id,
    title: r.title,
    description: r.description,
    estSec: r.est_sec,
    points: r.points,
    shareToken: r.share_token,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowFromDb(r: DbCustomWorkout): CustomWorkoutRow {
  return { ...summaryFromDb(r), structure: r.structure };
}

/** Derived fields stored alongside the structure so lists need not recompute them. */
function derived(structure: CustomWorkoutStructure): { est_sec: number; points: number } {
  const p = buildPrescribedFromCustom('cw_preview', structure);
  return { est_sec: p.estimatedSec, points: p.points };
}

// --- admin ------------------------------------------------------------------

/** All coach-built workouts, newest first (admin). */
export async function listCustomWorkouts(): Promise<CustomWorkoutSummary[]> {
  if (isDemo()) return (await demo()).listCustomWorkouts();
  return guard(async () => {
    const rows = unwrap<DbCustomWorkout[]>(
      await supabase()
        .from('custom_workouts')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false }),
    );
    return rows.map(summaryFromDb);
  });
}

/** One custom workout with its full structure (admin). */
export async function getCustomWorkout(id: string): Promise<CustomWorkoutRow> {
  if (isDemo()) return (await demo()).getCustomWorkout(id);
  return guard(async () => {
    const row = unwrap<DbCustomWorkout>(
      await supabase().from('custom_workouts').select('*').eq('id', id).single(),
    );
    return rowFromDb(row);
  });
}

/** Create a custom workout (admin). Generates a session-safe short id, retrying once on collision. */
export async function createCustomWorkout(input: CustomWorkoutInput): Promise<CustomWorkoutRow> {
  if (isDemo()) return (await demo()).createCustomWorkout(input);
  return guard(async () => {
    const me = await currentUser();
    const { est_sec, points } = derived(input.structure);
    const base = {
      author_id: me?.id ?? null,
      title: input.title,
      description: input.description ?? null,
      structure: input.structure,
      est_sec,
      points,
    };
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const res = await supabase()
        .from('custom_workouts')
        .insert({ ...base, short_id: newShortId() })
        .select('*')
        .single();
      if (!res.error) return rowFromDb(res.data as DbCustomWorkout);
      // 23505 = unique_violation on short_id; try one more id before giving up.
      if (res.error.code !== '23505' || attempt === 1)
        return rowFromDb(unwrap<DbCustomWorkout>(res));
    }
    throw new Error('unreachable');
  });
}

/** Update a custom workout's title, description or structure (admin). */
export async function updateCustomWorkout(
  id: string,
  input: CustomWorkoutInput,
): Promise<CustomWorkoutRow> {
  if (isDemo()) return (await demo()).updateCustomWorkout(id, input);
  return guard(async () => {
    const { est_sec, points } = derived(input.structure);
    const row = unwrap<DbCustomWorkout>(
      await supabase()
        .from('custom_workouts')
        .update({
          title: input.title,
          description: input.description ?? null,
          structure: input.structure,
          est_sec,
          points,
        })
        .eq('id', id)
        .select('*')
        .single(),
    );
    return rowFromDb(row);
  });
}

/** Delete a custom workout and its assignments (admin). */
export async function deleteCustomWorkout(id: string): Promise<void> {
  if (isDemo()) return (await demo()).deleteCustomWorkout(id);
  return guard(async () => {
    unwrapVoid(await supabase().from('custom_workouts').delete().eq('id', id));
  });
}

/** Turn the share link on (returns the token) or off (admin). */
export async function setCustomWorkoutShare(id: string, enabled: boolean): Promise<string | null> {
  if (isDemo()) return (await demo()).setCustomWorkoutShare(id, enabled);
  return guard(async () => {
    const token = enabled ? newShareToken() : null;
    const row = unwrap<DbCustomWorkout>(
      await supabase()
        .from('custom_workouts')
        .update({ share_token: token })
        .eq('id', id)
        .select('share_token')
        .single(),
    );
    return row.share_token;
  });
}

/** Who a custom workout is assigned to (admin). */
export async function listWorkoutAssignees(workoutId: string): Promise<WorkoutAssigneeRow[]> {
  if (isDemo()) return (await demo()).listWorkoutAssignees(workoutId);
  return guard(async () => {
    const rows = unwrap<{ email: string; note: string | null; created_at: string }[]>(
      await supabase()
        .from('assigned_workouts')
        .select('email, note, created_at')
        .eq('custom_workout_id', workoutId)
        .order('created_at', { ascending: false }),
    );
    return rows.map((r) => ({ email: r.email, note: r.note, createdAt: r.created_at }));
  });
}

/** Grant a custom workout to an email (admin). */
export async function assignCustomWorkout(
  workoutId: string,
  email: string,
  note?: string,
): Promise<void> {
  if (isDemo()) return (await demo()).assignCustomWorkout(workoutId, email, note);
  return guard(async () => {
    unwrapVoid(
      await supabase().rpc('admin_assign_custom_workout', {
        p_workout: workoutId,
        p_email: email,
        p_note: note ?? null,
      }),
    );
  });
}

/** Revoke a custom workout from an email (admin). */
export async function unassignCustomWorkout(workoutId: string, email: string): Promise<void> {
  if (isDemo()) return (await demo()).unassignCustomWorkout(workoutId, email);
  return guard(async () => {
    unwrapVoid(
      await supabase().rpc('admin_unassign_custom_workout', {
        p_workout: workoutId,
        p_email: email,
      }),
    );
  });
}

// --- the person ------------------------------------------------------------

/** Custom workouts assigned to the signed-in user, newest first. */
export async function listMyAssignedWorkouts(): Promise<AssignedWorkoutRow[]> {
  if (isDemo()) return (await demo()).listMyAssignedWorkouts();
  return guard(async () => {
    const rows = unwrap<
      {
        id: string;
        short_id: string;
        title: string;
        description: string | null;
        structure: unknown;
        est_sec: number | null;
        points: number | null;
        assigned_at: string;
      }[]
    >(
      await supabase()
        .from('my_custom_workouts')
        .select('*')
        .order('assigned_at', { ascending: false }),
    );
    return rows.map((r) => ({
      id: r.id,
      shortId: r.short_id,
      title: r.title,
      description: r.description,
      structure: r.structure,
      estSec: r.est_sec,
      points: r.points,
      assignedAt: r.assigned_at,
    }));
  });
}

/** Resolve a share link to its workout, or null when the token is unknown / archived. */
export async function getSharedCustomWorkout(token: string): Promise<AssignedWorkoutRow | null> {
  if (isDemo()) return (await demo()).getSharedCustomWorkout(token);
  return guard(async () => {
    const rows = unwrapMaybe<
      {
        id: string;
        short_id: string;
        title: string;
        description: string | null;
        structure: unknown;
        est_sec: number | null;
        points: number | null;
      }[]
    >(await supabase().rpc('get_shared_custom_workout', { p_token: token }));
    const r = rows?.[0];
    if (!r) return null;
    return {
      id: r.id,
      shortId: r.short_id,
      title: r.title,
      description: r.description,
      structure: r.structure,
      estSec: r.est_sec,
      points: r.points,
      assignedAt: '',
    };
  });
}
