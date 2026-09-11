/**
 * Pure helpers for the Admin screen: filter → API filter, allowed status transitions, course
 * names and the optimistic row update after a status change.
 */
import { findCourse } from '@/content/catalogue';
import type { Locale } from '@/content/schema';
import type {
  PurchaseFilter,
  PurchaseRow,
  PurchaseStatus,
  SubscriptionFilter,
  SubscriptionStatus,
} from '@/lib/api/types';

export const STATUS_FILTERS = ['all', 'pending', 'active', 'refunded'] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const SEARCH_DEBOUNCE_MS = 300;

/** Filter for `listPurchases` (an empty search and the "all" status are omitted). */
export function purchaseFilter(status: StatusFilter, search: string): PurchaseFilter {
  const filter: PurchaseFilter = {};
  if (status !== 'all') filter.status = status;
  const term = search.trim();
  if (term) filter.search = term;
  return filter;
}

/** Actions a coach can take from a status: activate pending / refunded rows, refund active ones. */
export function nextStatuses(status: PurchaseStatus): PurchaseStatus[] {
  switch (status) {
    case 'pending':
      return ['active'];
    case 'active':
      return ['refunded'];
    case 'refunded':
      return ['active'];
  }
}

export function courseName(courseId: string, locale: Locale): string {
  const course = findCourse(courseId);
  return course ? course.name[locale] : courseId;
}

/** Rows with one purchase moved to `status` (mirrors what `admin_set_purchase_status` stores). */
export function withStatus(
  rows: readonly PurchaseRow[],
  id: string,
  status: PurchaseStatus,
  nowIso: string,
): PurchaseRow[] {
  return rows.map((r) => {
    if (r.id !== id) return r;
    return {
      ...r,
      status,
      activatedAt: status === 'active' ? (r.activatedAt ?? nowIso) : r.activatedAt,
      updatedAt: nowIso,
    };
  });
}

export const SUB_STATUS_FILTERS = ['all', 'pending', 'active', 'cancelled'] as const;
export type SubStatusFilter = (typeof SUB_STATUS_FILTERS)[number];

/** Filter for `listSubscriptions`; same shape as the purchases one. */
export function subscriptionFilter(status: SubStatusFilter, search: string): SubscriptionFilter {
  const filter: SubscriptionFilter = {};
  if (status !== 'all') filter.status = status as SubscriptionStatus;
  const term = search.trim();
  if (term) filter.search = term;
  return filter;
}
