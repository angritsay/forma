/**
 * Creators (0064, 0067): applying, the creator's own row, statement and invoices, and the owner's
 * «Авторы». Every call is an RPC; the tables are closed to clients. Admin calls are re-checked by
 * `is_admin()` on the server.
 */
import { supabase } from './client';
import { demo } from './demo/load';
import { guard, requireUser, unwrap, unwrapVoid } from './internal';
import { isDemo } from './mode';
import type {
  AdminCreator,
  CreatorApplication,
  CreatorCoach,
  CreatorInvoice,
  CreatorStatementRow,
  CreatorStatus,
  CreatorTier,
  MyCreator,
  PublicCreator,
} from './types';

/** The page address a creator chooses — the same check as `creators.slug` (0064). */
export const CREATOR_SLUG_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

const num = (v: number | string | null | undefined): number => Number(v) || 0;

interface DbCreator {
  id: string;
  slug: string;
  name: string;
  tier: CreatorTier;
  status: CreatorStatus;
  about: string | null;
  audience_url: string | null;
  followers: number | null;
  fee_pct: number | string;
  created_at: string;
  approved_at: string | null;
  courses: number;
  listed: boolean | null;
  published: number | null;
}

function creatorBase(r: DbCreator) {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    tier: r.tier,
    status: r.status,
    about: r.about,
    audienceUrl: r.audience_url,
    followers: r.followers,
    feePct: num(r.fee_pct),
    createdAt: r.created_at,
    approvedAt: r.approved_at,
    courses: num(r.courses),
    listed: r.listed !== false,
    published: num(r.published),
  };
}

interface DbStatement {
  month: string;
  currency: string;
  tier: CreatorTier;
  fee_pct: number | string;
  sales: number;
  gross: number | string;
  session_sales: number | null;
  session_gross: number | string | null;
  forma_share: number | string;
  creator_share: number | string;
  monthly_fee: number | string;
  balance: number | string;
}

function statementFromDb(r: DbStatement): CreatorStatementRow {
  return {
    month: r.month.slice(0, 10),
    currency: r.currency,
    tier: r.tier,
    feePct: num(r.fee_pct),
    sales: num(r.sales),
    gross: num(r.gross),
    sessionSales: num(r.session_sales),
    sessionGross: num(r.session_gross),
    formaShare: num(r.forma_share),
    creatorShare: num(r.creator_share),
    monthlyFee: num(r.monthly_fee),
    balance: num(r.balance),
  };
}

interface DbInvoice extends Omit<DbStatement, 'fee_pct'> {
  id: string;
  number: string;
  settled_at: string | null;
}

function invoiceFromDb(r: DbInvoice): CreatorInvoice {
  return {
    id: r.id,
    number: r.number,
    month: r.month.slice(0, 10),
    currency: r.currency,
    tier: r.tier,
    sales: num(r.sales),
    gross: num(r.gross),
    sessionSales: num(r.session_sales),
    sessionGross: num(r.session_gross),
    formaShare: num(r.forma_share),
    creatorShare: num(r.creator_share),
    monthlyFee: num(r.monthly_fee),
    balance: num(r.balance),
    settledAt: r.settled_at,
  };
}

/** The signed-in person's creator row, or null when they never applied. */
export async function getMyCreator(): Promise<MyCreator | null> {
  if (isDemo()) return (await demo()).getMyCreator();
  return guard(async () => {
    await requireUser();
    const rows = unwrap<(DbCreator & { buyers: number })[]>(await supabase().rpc('my_creator'));
    const r = rows[0];
    return r ? { ...creatorBase(r), buyers: num(r.buyers) } : null;
  });
}

/**
 * Apply, or change an application still waiting. Validation answers come back as `validation`
 * errors with the server's word: `invalid_slug`, `slug_taken`, `invalid_name`, `invalid_url`,
 * `already_creator`.
 */
export async function applyAsCreator(input: CreatorApplication): Promise<string> {
  if (isDemo()) return (await demo()).applyAsCreator(input);
  return guard(async () => {
    await requireUser();
    return unwrap<string>(
      await supabase().rpc('creator_apply', {
        p_slug: input.slug.trim().toLowerCase(),
        p_name: input.name.trim(),
        p_about: input.about?.trim() || null,
        p_audience_url: input.audienceUrl?.trim() || null,
        p_followers: input.followers ?? null,
      }),
    );
  });
}

/**
 * A Pro creator switches their «Также в Forma» listing on or off (0068). A Start creator gets
 * `start_always_listed` back: on Start the listing is part of the deal.
 */
export async function setMyListing(listed: boolean): Promise<void> {
  if (isDemo()) return (await demo()).setMyListing(listed);
  return guard(async () => {
    await requireUser();
    unwrapVoid(await supabase().rpc('creator_set_listed', { p_listed: listed }));
  });
}

interface DbPublicCreator {
  slug: string;
  name: string;
  about: string | null;
  audience_url: string | null;
  courses: string[] | null;
}

/** The anon-safe shape (0068): five fields, nothing private. */
export function publicCreatorFromDb(r: DbPublicCreator): PublicCreator {
  return {
    slug: r.slug,
    name: r.name,
    about: r.about,
    audienceUrl: r.audience_url,
    courses: r.courses ?? [],
  };
}

/**
 * The creators «Также в Forma» lists (0068, `catalogue_creators()`): open, not Forma itself, at
 * least one published course, and not a Pro creator who switched the listing off.
 */
export async function listCatalogueCreators(): Promise<PublicCreator[]> {
  if (isDemo()) return (await demo()).listCatalogueCreators();
  return guard(async () => {
    const rows = unwrap<DbPublicCreator[]>(await supabase().rpc('catalogue_creators'));
    return rows.map(publicCreatorFromDb);
  });
}

/** The creator's own statement: per month and currency, newest first. */
export async function listMyStatement(months = 12): Promise<CreatorStatementRow[]> {
  if (isDemo()) return (await demo()).listMyStatement(months);
  return guard(async () => {
    const rows = unwrap<DbStatement[]>(
      await supabase().rpc('my_creator_statement', { p_months: months }),
    );
    return rows.map(statementFromDb);
  });
}

/** The creator's closed months. */
export async function listMyInvoices(): Promise<CreatorInvoice[]> {
  if (isDemo()) return (await demo()).listMyInvoices();
  return guard(async () => {
    const rows = unwrap<DbInvoice[]>(await supabase().rpc('my_creator_invoices'));
    return rows.map(invoiceFromDb);
  });
}

// --- the owner's side --------------------------------------------------------

interface DbAdminCreator extends DbCreator {
  owner_email: string | null;
  house: boolean;
  open_balance: number | string;
}

/** Every creator: applications first, then the house row, then the rest by date. */
export async function listCreators(): Promise<AdminCreator[]> {
  if (isDemo()) return (await demo()).listCreators();
  return guard(async () => {
    const rows = unwrap<DbAdminCreator[]>(await supabase().rpc('admin_creators'));
    return rows.map((r) => ({
      ...creatorBase(r),
      ownerEmail: r.owner_email,
      house: r.house,
      openBalance: num(r.open_balance),
    }));
  });
}

export interface CreatorChange {
  status?: CreatorStatus;
  tier?: CreatorTier;
  feePct?: number;
  /** The catalogue listing; switching it off is refused for Start (`start_always_listed`). */
  listed?: boolean;
  /**
   * The first month (`YYYY-MM-01`) a plan change applies to (0067). Omitted: the current Moscow
   * month. Months before it keep the plan they were on.
   */
  fromMonth?: string;
}

/** Open, pause or decline; move between tiers; set the processor's fee; list or unlist. */
export async function setCreator(id: string, change: CreatorChange): Promise<void> {
  if (isDemo()) return (await demo()).setCreator(id, change);
  return guard(async () => {
    unwrapVoid(
      await supabase().rpc('admin_set_creator', {
        p_id: id,
        p_status: change.status ?? null,
        p_tier: change.tier ?? null,
        p_fee_pct: change.feePct ?? null,
        p_listed: change.listed ?? null,
        p_from_month: change.fromMonth ?? null,
      }),
    );
  });
}

/** A course to a creator, or back to Forma with `null`. */
export async function assignCourse(courseId: string, creatorId: string | null): Promise<void> {
  if (isDemo()) return (await demo()).assignCourse(courseId, creatorId);
  return guard(async () => {
    unwrapVoid(
      await supabase().rpc('admin_assign_course', { p_course: courseId, p_creator: creatorId }),
    );
  });
}

interface DbCreatorCoach {
  id: string;
  name: string;
  name_en: string | null;
  active: boolean;
  creator_id: string | null;
}

/** Every coach and whose they are (0067). */
export async function listCreatorCoaches(): Promise<CreatorCoach[]> {
  if (isDemo()) return (await demo()).listCreatorCoaches();
  return guard(async () => {
    const rows = unwrap<DbCreatorCoach[]>(await supabase().rpc('admin_creator_coaches'));
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      nameEn: r.name_en,
      active: r.active,
      creatorId: r.creator_id,
    }));
  });
}

/**
 * A coach to a creator, or back to Forma with `null` (0067). Their paid sessions then count in
 * the creator's statement at the plan's sessions share.
 */
export async function assignCoach(coachId: string, creatorId: string | null): Promise<void> {
  if (isDemo()) return (await demo()).assignCoach(coachId, creatorId);
  return guard(async () => {
    unwrapVoid(
      await supabase().rpc('admin_assign_coach', { p_coach: coachId, p_creator: creatorId }),
    );
  });
}

export async function listCreatorStatement(
  id: string,
  months = 12,
): Promise<CreatorStatementRow[]> {
  if (isDemo()) return (await demo()).listCreatorStatement(id, months);
  return guard(async () => {
    const rows = unwrap<DbStatement[]>(
      await supabase().rpc('admin_creator_statement', { p_id: id, p_months: months }),
    );
    return rows.map(statementFromDb);
  });
}

export async function listCreatorInvoices(id: string): Promise<CreatorInvoice[]> {
  if (isDemo()) return (await demo()).listCreatorInvoices(id);
  return guard(async () => {
    const rows = unwrap<DbInvoice[]>(await supabase().rpc('admin_creator_invoices', { p_id: id }));
    return rows.map(invoiceFromDb);
  });
}

/** Mark an invoice settled (the money moved), or open again. */
export async function settleInvoice(id: string, settled: boolean): Promise<void> {
  if (isDemo()) return (await demo()).settleInvoice(id, settled);
  return guard(async () => {
    unwrapVoid(await supabase().rpc('admin_settle_invoice', { p_id: id, p_settled: settled }));
  });
}

/** Close last month (or `month`) for every open creator; how many invoices were written. */
export async function closeCreatorMonth(month?: string): Promise<number> {
  if (isDemo()) return (await demo()).closeCreatorMonth(month);
  return guard(async () =>
    num(
      unwrap<number>(await supabase().rpc('admin_close_creator_month', { p_month: month ?? null })),
    ),
  );
}
