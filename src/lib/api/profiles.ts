/**
 * Profile of the signed-in user (table `profiles`, own row only).
 */
import type { User } from '@supabase/supabase-js';
import { supabase } from './client';
import { demo } from './demo/load';
import { currentUser, guard, requireUser, unwrap, unwrapMaybe } from './internal';
import { isDemo } from './mode';
import { profileFromDb, profilePatchToDb, type DbProfile } from './mappers';
import type { Profile, ProfilePatch } from './types';

// Convenience for callers importing the profile types next to the functions.
export type { Profile, ProfilePatch } from './types';

const COLUMNS = '*';

function nameFromMetadata(user: User): string | null {
  const meta: Record<string, unknown> = user.user_metadata ?? {};
  const name = meta.name ?? meta.full_name;
  return typeof name === 'string' && name.trim() ? name.trim() : null;
}

/** Current user's profile; null when signed out. Creates the row if the auth trigger did not. */
export async function getProfile(): Promise<Profile | null> {
  if (isDemo()) return (await demo()).getProfile();
  return guard(async () => {
    const me = await currentUser();
    if (!me) return null;
    const db = supabase();

    const existing = unwrapMaybe<DbProfile>(
      await db.from('profiles').select(COLUMNS).eq('id', me.id).maybeSingle(),
    );
    if (existing) return profileFromDb(existing);

    // Fallback for users created before the auth trigger existed (RLS: id/email must be ours).
    const {
      data: { user },
    } = await db.auth.getUser();
    const inserted = await db
      .from('profiles')
      .insert({ id: me.id, email: me.email, display_name: user ? nameFromMetadata(user) : null })
      .select(COLUMNS)
      .single();

    // Lost the race against the trigger: the row exists now, read it.
    if (inserted.error && inserted.error.code === '23505') {
      return profileFromDb(
        unwrap<DbProfile>(await db.from('profiles').select(COLUMNS).eq('id', me.id).single()),
      );
    }
    return profileFromDb(unwrap<DbProfile>(inserted));
  });
}

/** Update the current user's profile (email and id are never writable). */
export async function updateProfile(patch: ProfilePatch): Promise<Profile> {
  if (isDemo()) return (await demo()).updateProfile(patch);
  return guard(async () => {
    const me = await requireUser();
    const dbPatch = profilePatchToDb(patch);
    if (Object.keys(dbPatch).length === 0) {
      const row = unwrap<DbProfile>(
        await supabase().from('profiles').select(COLUMNS).eq('id', me.id).single(),
      );
      return profileFromDb(row);
    }
    const row = unwrap<DbProfile>(
      await supabase().from('profiles').update(dbPatch).eq('id', me.id).select(COLUMNS).single(),
    );
    return profileFromDb(row);
  });
}
