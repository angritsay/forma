/**
 * Coach / admin operations. Every call is re-checked server-side by `is_admin()`.
 */
import { supabase } from './client';
import { AppError } from './errors';
import { COURSE_ID_RE, EMAIL_RE, currentUser, guard, unwrap, unwrapVoid } from './internal';
import { purchaseFromDb, type DbPurchase } from './mappers';
import type { PurchaseFilter, PurchaseRow, PurchaseStatus } from './types';

const STATUSES: readonly PurchaseStatus[] = ['pending', 'active', 'refunded'];

/** True when the signed-in email is in `admins`; false when signed out. */
export async function isAdmin(): Promise<boolean> {
  return guard(async () => {
    const me = await currentUser();
    if (!me) return false;
    const { data, error } = await supabase().rpc('is_admin');
    if (error) throw error;
    return data === true;
  });
}

/** Purchases, newest first, optionally filtered by status and an email / course substring. */
export async function listPurchases(filter: PurchaseFilter = {}): Promise<PurchaseRow[]> {
  return guard(async () => {
    let query = supabase()
      .from('purchases')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (filter.status) query = query.eq('status', filter.status);
    // Only characters that are safe inside a PostgREST `or` filter.
    const term = (filter.search ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9@._+-]/g, '');
    if (term) query = query.or(`email.ilike.%${term}%,course_id.ilike.%${term}%`);
    const rows = unwrap<DbPurchase[]>(await query);
    return rows.map(purchaseFromDb);
  });
}

/** Activate / refund / reset a purchase (RPC `admin_set_purchase_status`). */
export async function setPurchaseStatus(id: string, status: PurchaseStatus): Promise<void> {
  return guard(async () => {
    if (!STATUSES.includes(status)) throw new AppError('validation', 'invalid_status');
    unwrapVoid(await supabase().rpc('admin_set_purchase_status', { p_id: id, p_status: status }));
  });
}

/** Grant a course to an email manually (RPC `admin_add_purchase`); returns the purchase id. */
export async function addPurchase(email: string, courseId: string, note?: string): Promise<string> {
  return guard(async () => {
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) throw new AppError('validation', 'invalid_email');
    if (!COURSE_ID_RE.test(courseId)) throw new AppError('validation', 'invalid_course');
    return unwrap<string>(
      await supabase().rpc('admin_add_purchase', {
        p_email: clean,
        p_course_id: courseId,
        p_note: note?.trim() || null,
      }),
    );
  });
}
