/**
 * Pure helpers for the person page: what a proof's state reads as, how a session is named, how
 * money is written, and which club rows the «Убрать из клуба» button acts on.
 */
import type { Locale } from '@/content/schema';
import type {
  AdminPerson,
  AdminPersonMembership,
  AdminPersonProof,
  AdminPersonSession,
} from '@/lib/api/adminPerson';
import { courseNames } from '@/app/features/player/summaryModel';

/**
 * Where a proof stands, in the coach's order of looking:
 *   rejected  struck out (voided) — it does not score
 *   waiting   sent again after a rejection and not looked at since — the only review queue
 *   accepted  the coach looked and left it standing
 *   counted   first attempt, never touched — it scores by default
 */
export type ProofState = 'rejected' | 'waiting' | 'accepted' | 'counted';

export function proofState(
  p: Pick<AdminPersonProof, 'voidedAt' | 'attempt' | 'reviewedAt'>,
): ProofState {
  if (p.voidedAt) return 'rejected';
  if (p.reviewedAt) return 'accepted';
  if (p.attempt > 1) return 'waiting';
  return 'counted';
}

/** «Курс · тренировка» for a session; a coach-built one by its own title. */
export function sessionTitle(
  s: Pick<AdminPersonSession, 'courseId' | 'nodeId' | 'workoutId' | 'customTitle'>,
  locale: Locale,
): { course: string; workout: string } {
  const names = courseNames(s.courseId, s.nodeId, s.workoutId, locale);
  return {
    course: names.course,
    workout: s.courseId === 'custom' && s.customTitle ? s.customTitle : names.workout,
  };
}

/**
 * «990 ₽», «$19». A payment without a currency predates 0043 and was Prodamus, i.e. roubles —
 * but that is a guess, so it is written as a bare number rather than claimed.
 */
export function formatMoney(
  amount: number | null,
  currency: string | null,
  locale: Locale,
): string {
  if (amount === null) return '—';
  const tag = locale === 'ru' ? 'ru-RU' : 'en-US';
  if (currency && /^[A-Z]{3}$/.test(currency)) {
    try {
      return new Intl.NumberFormat(tag, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      }).format(amount);
    } catch {
      /* An unknown code falls through to the plain number. */
    }
  }
  return new Intl.NumberFormat(tag, { maximumFractionDigits: 2 }).format(amount);
}

/** Club rows this person is still active in — what «Убрать из клуба» removes. */
export function activeClubMemberships(person: AdminPerson): AdminPersonMembership[] {
  return person.memberships.filter((m) => m.isClub && m.status === 'active');
}

/** The pair in the duo circle, if there is one: partner names, or null for «без пары». */
export function duoPartners(person: AdminPerson): AdminPersonMembership['partners'] | null {
  const duo = person.memberships.find((m) => m.isClub && !m.solo && m.status === 'active');
  if (!duo || duo.partners.length === 0) return null;
  return duo.partners;
}

/** Access to close: a live subscription, and only where the server can close it. */
export function canCloseAccess(person: AdminPerson): boolean {
  return person.canEndSubscription && person.subscription?.live === true;
}
