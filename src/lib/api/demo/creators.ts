/**
 * Demo double of creators (0064).
 *
 * The demo account is the coach and an admin, so it sees both sides: it can apply as a creator in
 * «Кабинет автора» and open itself in «Авторы». The rows live in their own browser-local key next
 * to the demo database rather than inside it, so the demo's stored shape does not change. The demo
 * takes no money (it has no payments journal, `adminPayments.ts`), so statements and invoices are
 * empty, exactly as the server would answer for a creator with no sales yet.
 *
 * The «Также в Forma» catalogue (0066) is empty here: the demo has no other creators, and its own
 * creator's courses are assignments without a published course behind them.
 */
import { AppError } from '../errors';
import type { CreatorChange } from '../creators';
import { guard } from '../internal';
import type {
  AdminCreator,
  CreatorApplication,
  CreatorInvoice,
  CreatorStatementRow,
  MyCreator,
  PublicCreator,
} from '../types';
import { delay } from './latency';
import { currentDemoUser, defaultStorage } from './store';

const KEY = 'forma.demo.creators';
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
const RESERVED = new Set(['forma', 'admin', 'app', 'api', 'www', 'creators', 'creator', 'club']);

interface Row extends Omit<AdminCreator, 'courses' | 'openBalance' | 'listed' | 'published'> {
  courses: string[];
  /** Absent on rows stored before 0066: listed. */
  listed?: boolean;
}

function house(): Row {
  return {
    id: 'demo-house',
    slug: 'forma',
    name: 'Forma',
    tier: 'pro',
    status: 'active',
    about: null,
    audienceUrl: null,
    followers: null,
    feePct: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    approvedAt: '2026-01-01T00:00:00.000Z',
    ownerEmail: null,
    house: true,
    courses: [],
  };
}

function read(): Row[] {
  try {
    const raw = defaultStorage().getItem(KEY);
    const rows = raw ? (JSON.parse(raw) as Row[]) : [];
    return rows.some((r) => r.house) ? rows : [house(), ...rows];
  } catch {
    return [house()];
  }
}

function write(rows: Row[]): void {
  try {
    defaultStorage().setItem(KEY, JSON.stringify(rows));
  } catch {
    /* Storage refused: the change lasts as long as this screen. */
  }
}

async function run<T>(fn: (email: string) => T): Promise<T> {
  await delay();
  return guard(async () => {
    const user = currentDemoUser();
    if (!user) throw new AppError('auth', 'not_signed_in');
    return fn(user.email.toLowerCase());
  });
}

function mine(rows: Row[], email: string): Row | undefined {
  return rows.find((r) => r.ownerEmail?.toLowerCase() === email);
}

export async function getMyCreator(): Promise<MyCreator | null> {
  return run((email) => {
    const r = mine(read(), email);
    if (!r) return null;
    const { ownerEmail: _o, house: _h, courses, listed, ...rest } = r;
    return { ...rest, courses: courses.length, buyers: 0, listed: listed !== false, published: 0 };
  });
}

export async function applyAsCreator(input: CreatorApplication): Promise<string> {
  return run((email) => {
    const rows = read();
    const slug = input.slug.trim().toLowerCase();
    const name = input.name.trim();
    if (!SLUG_RE.test(slug) || RESERVED.has(slug)) throw new AppError('validation', 'invalid_slug');
    if (name.length < 2 || name.length > 60) throw new AppError('validation', 'invalid_name');
    const url = input.audienceUrl?.trim() || null;
    if (url && !/^https:\/\//.test(url)) throw new AppError('validation', 'invalid_url');
    const own = mine(rows, email);
    if (own && (own.status === 'active' || own.status === 'paused')) {
      throw new AppError('validation', 'already_creator');
    }
    if (rows.some((r) => r.slug === slug && r !== own)) {
      throw new AppError('validation', 'slug_taken');
    }
    const fields = {
      slug,
      name,
      about: input.about?.trim() || null,
      audienceUrl: url,
      followers: input.followers ?? null,
      status: 'applied' as const,
    };
    if (own) {
      Object.assign(own, fields);
      write(rows);
      return own.id;
    }
    const row: Row = {
      ...fields,
      id: `demo-creator-${Date.now()}`,
      tier: 'start',
      feePct: 0,
      createdAt: new Date().toISOString(),
      approvedAt: null,
      ownerEmail: email,
      house: false,
      courses: [],
    };
    write([...rows, row]);
    return row.id;
  });
}

export async function setMyListing(listed: boolean): Promise<void> {
  return run((email) => {
    const rows = read();
    const own = mine(rows, email);
    if (!own) throw new AppError('validation', 'not_creator');
    if (!listed && own.tier !== 'pro') throw new AppError('validation', 'start_always_listed');
    own.listed = listed;
    write(rows);
  });
}

export async function listCatalogueCreators(): Promise<PublicCreator[]> {
  await delay();
  return [];
}

export async function listMyStatement(_months = 12): Promise<CreatorStatementRow[]> {
  return run((email) => {
    if (!mine(read(), email)) throw new AppError('validation', 'not_creator');
    return [];
  });
}

export async function listMyInvoices(): Promise<CreatorInvoice[]> {
  return run(() => []);
}

export async function listCreators(): Promise<AdminCreator[]> {
  return run(() =>
    read()
      .map(({ courses, listed, ...r }) => ({
        ...r,
        courses: courses.length,
        openBalance: 0,
        listed: listed !== false,
        published: 0,
      }))
      .sort(
        (a, b) =>
          Number(b.status === 'applied') - Number(a.status === 'applied') ||
          Number(b.house) - Number(a.house) ||
          b.createdAt.localeCompare(a.createdAt),
      ),
  );
}

export async function setCreator(id: string, change: CreatorChange): Promise<void> {
  return run(() => {
    const rows = read();
    const r = rows.find((x) => x.id === id);
    if (!r) throw new AppError('not_found', 'not_found');
    if (r.house) throw new AppError('validation', 'house_creator');
    if (change.status) r.status = change.status;
    if (change.tier) r.tier = change.tier;
    if (change.feePct !== undefined) r.feePct = change.feePct;
    if (change.listed === false && r.tier !== 'pro') {
      throw new AppError('validation', 'start_always_listed');
    }
    if (change.listed !== undefined) r.listed = change.listed;
    if (r.status === 'active' && !r.approvedAt) r.approvedAt = new Date().toISOString();
    write(rows);
  });
}

export async function assignCourse(courseId: string, creatorId: string | null): Promise<void> {
  return run(() => {
    const rows = read();
    for (const r of rows) r.courses = r.courses.filter((c) => c !== courseId);
    if (creatorId) {
      const r = rows.find((x) => x.id === creatorId && !x.house);
      if (!r) throw new AppError('not_found', 'not_found');
      r.courses.push(courseId);
    }
    write(rows);
  });
}

export async function listCreatorStatement(
  _id: string,
  _months = 12,
): Promise<CreatorStatementRow[]> {
  return run(() => []);
}

export async function listCreatorInvoices(_id: string): Promise<CreatorInvoice[]> {
  return run(() => []);
}

export async function settleInvoice(_id: string, _settled: boolean): Promise<void> {
  return run(() => {
    throw new AppError('not_found', 'not_found');
  });
}

export async function closeCreatorMonth(_month?: string): Promise<number> {
  return run(() => 0);
}
