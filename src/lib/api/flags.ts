/**
 * Per-person feature flags (0049, `feature_flags`).
 *
 * `my_feature_flags()` is `security invoker`: RLS gives the caller their own rows. The two admin
 * RPCs are `security definer` behind `is_admin()` and find the person by email the way
 * `admin_person` (0046) does; an address nobody has signed in with is `not_found` (`no_user`).
 * The known keys live in `src/lib/flags.ts`; the server stores any well-formed key.
 *
 * `set_my_feature_flag` (0052) is the one write a person makes to their own row, and it takes
 * only `club_quiet`: the switch that mutes the club's daily bot messages.
 */
import { supabase } from './client';
import { demo } from './demo/load';
import { AppError } from './errors';
import { EMAIL_RE, guard, unwrapMaybe } from './internal';
import { isDemo } from './mode';
import type { SelfFlag } from '@/lib/flags';

const FLAG_RE = /^[a-z0-9_]{2,60}$/;

function cleanEmail(email: string): string {
  const clean = email.trim().toLowerCase();
  if (!EMAIL_RE.test(clean)) throw new AppError('validation', 'invalid_email');
  return clean;
}

function cleanFlag(flag: string): string {
  const clean = flag.trim();
  if (!FLAG_RE.test(clean)) throw new AppError('validation', 'invalid_flag');
  return clean;
}

/** Keep the strings of a `text[]` answer; anything else is dropped rather than thrown on. */
export function flagsFromDb(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string');
}

/** The signed-in person's flags (RPC `my_feature_flags`). */
export async function listMyFlags(): Promise<string[]> {
  if (isDemo()) return (await demo()).listMyFlags();
  return guard(async () =>
    flagsFromDb(unwrapMaybe<unknown>(await supabase().rpc('my_feature_flags'))),
  );
}

/** Admin: the flags that are on for this address (RPC `admin_feature_flags`). */
export async function adminFlagsFor(email: string): Promise<string[]> {
  const clean = cleanEmail(email);
  if (isDemo()) return (await demo()).adminFlagsFor(clean);
  return guard(async () =>
    flagsFromDb(
      unwrapMaybe<unknown>(await supabase().rpc('admin_feature_flags', { p_email: clean })),
    ),
  );
}

/** Admin: switch a flag on or off for this address; resolves to the new state. */
export async function adminSetFlag(flag: string, email: string, on: boolean): Promise<boolean> {
  const key = cleanFlag(flag);
  const clean = cleanEmail(email);
  if (isDemo()) return (await demo()).adminSetFlag(key, clean, on);
  return guard(async () => {
    const res = unwrapMaybe<unknown>(
      await supabase().rpc('admin_set_feature_flag', { p_flag: key, p_email: clean, p_on: on }),
    );
    return res === true;
  });
}

/** Switch one of the caller's own flags (RPC `set_my_feature_flag`, 0052); resolves to the new state. */
export async function setMyFeatureFlag(flag: SelfFlag, on: boolean): Promise<boolean> {
  const key = cleanFlag(flag);
  if (isDemo()) return (await demo()).setMyFeatureFlag(key, on);
  return guard(async () => {
    const res = unwrapMaybe<unknown>(
      await supabase().rpc('set_my_feature_flag', { p_flag: key, p_on: on }),
    );
    return res === true;
  });
}
