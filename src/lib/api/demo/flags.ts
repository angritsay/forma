/**
 * Per-person feature flags (0049) for the demo backend: the same rules as the SQL, over the local
 * store. The demo has no admin role, so — like the rest of the demo's admin screens — the admin
 * calls are open to whoever is signed in, and a person is found among the demo's own profiles by
 * email. In practice that is the signed-in demo account, which is what lets the admin switch be
 * tried: turn a flag on for yourself and the screen behind it appears.
 *
 * A database stored before the table existed reads as «no flags» (`featureFlags` is optional).
 */
import { guard } from '../internal';
import { AppError } from '../errors';
import { delay } from './latency';
import { currentDemoUser, mutateDb, normalizeDemoEmail, readDb, type DemoDb } from './store';

const FLAG_RE = /^[a-z0-9_]{2,60}$/;

async function run<T>(fn: () => T): Promise<T> {
  await delay();
  return guard(async () => fn());
}

function requireUser() {
  const user = currentDemoUser();
  if (!user) throw new AppError('auth', 'not_signed_in');
  return user;
}

/** `profiles.email = p_email`, case-insensitively; `no_user` when nobody has that address. */
function userIdFor(db: DemoDb, email: string): string {
  const lower = normalizeDemoEmail(email);
  const profile = db.profiles.find((p) => normalizeDemoEmail(p.email) === lower);
  if (!profile) throw new AppError('not_found', 'no_user');
  return profile.id;
}

function flagsOf(db: DemoDb, userId: string): string[] {
  return (db.featureFlags ?? [])
    .filter((r) => r.userId === userId)
    .map((r) => r.flag)
    .sort();
}

/** `my_feature_flags()`. */
export async function listMyFlags(): Promise<string[]> {
  return run(() => flagsOf(readDb(), requireUser().id));
}

/** `admin_feature_flags(p_email)`. */
export async function adminFlagsFor(email: string): Promise<string[]> {
  return run(() => {
    requireUser();
    const db = readDb();
    return flagsOf(db, userIdFor(db, email));
  });
}

/** `admin_set_feature_flag(p_flag, p_email, p_on)`: the new state. */
export async function adminSetFlag(flag: string, email: string, on: boolean): Promise<boolean> {
  return run(() => {
    requireUser();
    if (!FLAG_RE.test(flag)) throw new AppError('validation', 'invalid_flag');
    return mutateDb((db) => {
      const userId = userIdFor(db, email);
      const rows = (db.featureFlags ??= []);
      const at = rows.findIndex((r) => r.flag === flag && r.userId === userId);
      if (on && at < 0) rows.push({ flag, userId });
      if (!on && at >= 0) rows.splice(at, 1);
      return on;
    });
  });
}
