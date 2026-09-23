/**
 * Who may start a sync: the schedule with its token, or an admin from the app (0045).
 *
 * Pure functions, no `Deno`, so the rules are tested rather than discovered in production.
 *
 * THE TWO KEYS
 * ------------
 *   - `GOOGLE_SYNC_TOKEN` in `?token=` or `x-sync-token` — the schedule in
 *     `.github/workflows/calendar-sync.yml`. Unchanged.
 *   - `Authorization: Bearer <the signed-in person's JWT>` — the «Синхронизировать сейчас» button on
 *     the admin's «Записи» screen. The function is deployed with `--no-verify-jwt`, so the platform
 *     checks nothing here; the token is checked by asking PostgREST `is_admin()` **with that token**.
 *     That is the same rule every admin RPC uses (the verified, confirmed email in `admins`), decided
 *     by the database rather than restated here, and a forged or expired token simply fails there.
 *
 * supabase-js sends the project's anon key as a bearer when nobody is signed in. `is_admin()` is not
 * granted to `anon`, so that answers with an error and the door stays shut.
 *
 * The token is tried first, so the schedule never pays for a round trip to PostgREST.
 */

export type Door =
  | { kind: 'token' }
  | { kind: 'bearer'; jwt: string }
  | { kind: 'refuse'; status: 403 | 503; body: string };

/** The bearer token in an `Authorization` header, or ''. */
export function bearerOf(header: string | null): string {
  const value = (header ?? '').trim();
  return /^bearer\s+/i.test(value) ? value.replace(/^bearer\s+/i, '').trim() : '';
}

/**
 * Which key the request carries.
 *
 * Without `GOOGLE_SYNC_TOKEN` the schedule's door stays shut (503, as before), but an admin can still
 * come in: the button should work on a project where only the Google secrets are set.
 */
export function chooseDoor(
  syncToken: string | undefined,
  offeredToken: string | null,
  authorization: string | null,
): Door {
  if (syncToken && offeredToken !== null && offeredToken === syncToken) return { kind: 'token' };
  const jwt = bearerOf(authorization);
  if (jwt) return { kind: 'bearer', jwt };
  if (!syncToken) return { kind: 'refuse', status: 503, body: 'not configured' };
  return { kind: 'refuse', status: 403, body: 'bad token' };
}

export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

/**
 * True only when PostgREST, asked with this very JWT, says `is_admin()` is `true`. Every other
 * outcome — an error, a refusal, a network failure, a body that is not exactly `true` — is false.
 */
export async function isAdminJwt(
  jwt: string,
  supabaseUrl: string,
  anonKey: string,
  fetchImpl: Fetcher,
): Promise<boolean> {
  if (!jwt || !supabaseUrl || !anonKey) return false;
  try {
    const res = await fetchImpl(`${supabaseUrl.replace(/\/+$/, '')}/rest/v1/rpc/is_admin`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${jwt}`,
        'content-type': 'application/json',
      },
      body: '{}',
    });
    if (!res.ok) return false;
    return (await res.json()) === true;
  } catch {
    return false;
  }
}

/**
 * A pause between two syncs started from the app, per function instance. Best effort — instances
 * are not shared — and enough for its job: a double tap, or a button pressed while the last run is
 * still going, should not read the calendar twice.
 */
export const ADMIN_COOLDOWN_MS = 30_000;

export function coolingDown(lastRunAt: number | null, now: number): boolean {
  return lastRunAt !== null && now - lastRunAt < ADMIN_COOLDOWN_MS;
}

/**
 * The browser asks first (`OPTIONS`) because the app sends `authorization` and supabase-js adds
 * `apikey` and `x-client-info`. The same headers as `link-telegram/cors.ts`.
 */
export const CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers':
    'authorization, content-type, apikey, x-client-info, x-sync-token',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-max-age': '86400',
};
