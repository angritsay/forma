/**
 * Courses the signed-in user owns (view `my_entitlements`, filtered by the auth email).
 */
import { supabase } from './client';
import { demo } from './demo/load';
import { guard, requireUser, unwrap } from './internal';
import { entitlementFromDb, type DbEntitlement } from './mappers';
import { isDemo } from './mode';
import type { Entitlement } from './types';

/** Active purchases for the current user's email, newest activation first. */
export async function listEntitlements(): Promise<Entitlement[]> {
  if (isDemo()) return (await demo()).listEntitlements();
  return guard(async () => {
    await requireUser();
    const rows = unwrap<DbEntitlement[]>(
      await supabase()
        .from('my_entitlements')
        .select('course_id, activated_at')
        .order('activated_at', { ascending: false, nullsFirst: false }),
    );
    return rows.map(entitlementFromDb);
  });
}

/** True when the current user owns the course. */
export async function hasEntitlement(courseId: string): Promise<boolean> {
  const list = await listEntitlements();
  return list.some((e) => e.courseId === courseId);
}
