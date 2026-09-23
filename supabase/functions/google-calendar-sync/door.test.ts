import { describe, expect, it } from 'vitest';
import {
  ADMIN_COOLDOWN_MS,
  bearerOf,
  chooseDoor,
  coolingDown,
  CORS_HEADERS,
  isAdminJwt,
  type Fetcher,
} from './door';

describe('chooseDoor', () => {
  it('lets the schedule in with the right token, before looking at anything else', () => {
    expect(chooseDoor('s3cret', 's3cret', 'Bearer whatever')).toEqual({ kind: 'token' });
    expect(chooseDoor('s3cret', 's3cret', null)).toEqual({ kind: 'token' });
  });

  it('sends a bearer to the admin check when the token is missing or wrong', () => {
    expect(chooseDoor('s3cret', null, 'Bearer eyJ.a.b')).toEqual({
      kind: 'bearer',
      jwt: 'eyJ.a.b',
    });
    expect(chooseDoor('s3cret', 'wrong', 'bearer   eyJ.a.b ')).toEqual({
      kind: 'bearer',
      jwt: 'eyJ.a.b',
    });
  });

  /* The button must work on a project where only the Google secrets are set. */
  it('does not need GOOGLE_SYNC_TOKEN for an admin', () => {
    expect(chooseDoor(undefined, null, 'Bearer eyJ.a.b')).toEqual({
      kind: 'bearer',
      jwt: 'eyJ.a.b',
    });
    expect(chooseDoor('', '', 'Bearer eyJ.a.b').kind).toBe('bearer');
  });

  it('refuses as before when there is neither', () => {
    expect(chooseDoor('s3cret', 'wrong', null)).toEqual({
      kind: 'refuse',
      status: 403,
      body: 'bad token',
    });
    expect(chooseDoor(undefined, null, null)).toEqual({
      kind: 'refuse',
      status: 503,
      body: 'not configured',
    });
    // An empty configured token never matches an empty offer.
    expect(chooseDoor('', '', null).kind).toBe('refuse');
  });

  it('reads only a real bearer header', () => {
    expect(bearerOf('Basic abc')).toBe('');
    expect(bearerOf('Bearer')).toBe('');
    expect(bearerOf('')).toBe('');
    expect(bearerOf(null)).toBe('');
  });
});

describe('isAdminJwt', () => {
  const answering =
    (status: number, body: unknown, seen: { url?: string; init?: RequestInit } = {}): Fetcher =>
    async (url, init) => {
      seen.url = url;
      seen.init = init;
      return new Response(JSON.stringify(body), { status });
    };

  it('asks is_admin() with the caller’s own token', async () => {
    const seen: { url?: string; init?: RequestInit } = {};
    const ok = await isAdminJwt(
      'user.jwt',
      'https://p.supabase.co/',
      'anon',
      answering(200, true, seen),
    );
    expect(ok).toBe(true);
    expect(seen.url).toBe('https://p.supabase.co/rest/v1/rpc/is_admin');
    const headers = seen.init?.headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer user.jwt');
    expect(headers.apikey).toBe('anon');
  });

  it('is false for a person who is not an admin', async () => {
    expect(await isAdminJwt('user.jwt', 'https://p', 'anon', answering(200, false))).toBe(false);
  });

  /* The anon key as a bearer: is_admin() is not granted to anon, so PostgREST refuses. */
  it('is false when PostgREST refuses the token', async () => {
    expect(
      await isAdminJwt('anon.jwt', 'https://p', 'anon', answering(401, { code: 'PGRST301' })),
    ).toBe(false);
    expect(await isAdminJwt('x', 'https://p', 'anon', answering(403, true))).toBe(false);
  });

  it('is false for anything but exactly true', async () => {
    for (const body of ['true', 1, [true], { is_admin: true }, null]) {
      expect(await isAdminJwt('x', 'https://p', 'anon', answering(200, body))).toBe(false);
    }
  });

  it('is false when it cannot ask at all', async () => {
    const broken: Fetcher = async () => {
      throw new Error('network');
    };
    expect(await isAdminJwt('x', 'https://p', 'anon', broken)).toBe(false);
    expect(await isAdminJwt('', 'https://p', 'anon', answering(200, true))).toBe(false);
    expect(await isAdminJwt('x', '', 'anon', answering(200, true))).toBe(false);
    expect(await isAdminJwt('x', 'https://p', '', answering(200, true))).toBe(false);
  });
});

describe('the admin cooldown and CORS', () => {
  it('holds a second press for a while, then lets it through', () => {
    expect(coolingDown(null, 1000)).toBe(false);
    expect(coolingDown(1000, 1000 + ADMIN_COOLDOWN_MS - 1)).toBe(true);
    expect(coolingDown(1000, 1000 + ADMIN_COOLDOWN_MS)).toBe(false);
  });

  it('allows the headers supabase-js sends', () => {
    for (const h of ['authorization', 'apikey', 'x-client-info', 'content-type']) {
      expect(CORS_HEADERS['access-control-allow-headers']).toContain(h);
    }
    expect(CORS_HEADERS['access-control-allow-methods']).toContain('POST');
  });
});
