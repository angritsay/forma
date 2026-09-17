import { beforeAll, describe, expect, it } from 'vitest';
import {
  ASSERTION_TTL_SECONDS,
  buildAssertion,
  decodePkcs8,
  fetchAccessToken,
  normalizePrivateKey,
  SCOPE,
  TOKEN_ENDPOINT,
  type Fetcher,
} from './auth';

/**
 * A throwaway RSA key pair, generated here rather than checked in — this repository is public and
 * a private key in it would be a private key in it, test or not. The public half verifies that the
 * assertion this module signs is a real RS256 JWT rather than a plausible-looking string.
 */
let pem = '';
let publicKey: CryptoKey;

function pemEncode(der: ArrayBuffer): string {
  const bytes = new Uint8Array(der);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const body = btoa(binary).replace(/(.{64})/g, '$1\n');
  return `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----\n`;
}

function decodeSegment(segment: string): unknown {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(
    new TextDecoder().decode(Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))),
  );
}

beforeAll(async () => {
  const pair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  );
  pem = pemEncode(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
  publicKey = pair.publicKey;
});

describe('normalizePrivateKey', () => {
  it('unescapes the newlines a secret store turns into two characters', () => {
    const escaped = '-----BEGIN PRIVATE KEY-----\\nAAAA\\n-----END PRIVATE KEY-----';
    expect(normalizePrivateKey(escaped)).toBe(
      '-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----',
    );
  });

  it('strips the quotes a copy out of the service account JSON brings along', () => {
    expect(
      normalizePrivateKey('"-----BEGIN PRIVATE KEY-----\\nAA\\n-----END PRIVATE KEY-----"'),
    ).toMatch(/^-----BEGIN PRIVATE KEY-----\n/);
  });

  it('leaves a key that already has real newlines alone', () => {
    const plain = '-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----';
    expect(normalizePrivateKey(plain)).toBe(plain);
  });
});

describe('decodePkcs8', () => {
  it('refuses something that is not a PKCS#8 block', () => {
    expect(() => decodePkcs8('not a key')).toThrow(/PKCS#8/);
    expect(() =>
      decodePkcs8('-----BEGIN RSA PRIVATE KEY-----\nAA\n-----END RSA PRIVATE KEY-----'),
    ).toThrow();
  });

  it('reads a key whose newlines arrived escaped', () => {
    expect(decodePkcs8(pem.replace(/\n/g, '\\n')).byteLength).toBeGreaterThan(100);
  });
});

describe('buildAssertion', () => {
  const now = Date.parse('2026-03-11T12:00:00Z');

  it('asks for the narrowest scope that can read an event', () => {
    expect(SCOPE).toBe('https://www.googleapis.com/auth/calendar.events.readonly');
  });

  it('is an RS256 JWT the public half of the key verifies', async () => {
    const assertion = await buildAssertion('sync@project.iam.gserviceaccount.com', pem, now);
    const [header, claims, signature] = assertion.split('.');

    expect(decodeSegment(header!)).toEqual({ alg: 'RS256', typ: 'JWT' });
    expect(decodeSegment(claims!)).toEqual({
      iss: 'sync@project.iam.gserviceaccount.com',
      scope: SCOPE,
      aud: TOKEN_ENDPOINT,
      iat: now / 1000,
      exp: now / 1000 + ASSERTION_TTL_SECONDS,
    });

    const verified = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      Uint8Array.from(atob(signature!.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
        c.charCodeAt(0),
      ),
      new TextEncoder().encode(`${header}.${claims}`),
    );
    expect(verified).toBe(true);
  });

  it('signs the same claims whether the key arrived escaped or not', async () => {
    const plain = await buildAssertion('sync@project.iam.gserviceaccount.com', pem, now);
    const escaped = await buildAssertion(
      'sync@project.iam.gserviceaccount.com',
      pem.replace(/\n/g, '\\n'),
      now,
    );
    expect(escaped).toBe(plain);
  });
});

describe('fetchAccessToken', () => {
  const ok: Fetcher = async (url, init) => {
    expect(url).toBe(TOKEN_ENDPOINT);
    const body = new URLSearchParams(String(init.body));
    expect(body.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
    expect(body.get('assertion')?.split('.')).toHaveLength(3);
    return new Response(JSON.stringify({ access_token: 'ya29.test', expires_in: 3599 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  it('posts the assertion and returns the token', async () => {
    expect(await fetchAccessToken('sync@project.iam.gserviceaccount.com', pem, ok)).toBe(
      'ya29.test',
    );
  });

  it('says the status and nothing about the key when Google refuses', async () => {
    const refused: Fetcher = async () => new Response('{"error":"invalid_grant"}', { status: 400 });
    await expect(
      fetchAccessToken('sync@project.iam.gserviceaccount.com', pem, refused),
    ).rejects.toThrow('google token endpoint answered 400');
  });

  it('refuses a 200 with no token in it', async () => {
    const empty: Fetcher = async () => new Response('{}', { status: 200 });
    await expect(
      fetchAccessToken('sync@project.iam.gserviceaccount.com', pem, empty),
    ).rejects.toThrow(/no access_token/);
  });

  it('never puts the private key in the error it throws', async () => {
    const refused: Fetcher = async () => new Response('nope', { status: 401 });
    await expect(
      fetchAccessToken('sync@project.iam.gserviceaccount.com', pem, refused),
    ).rejects.toThrow(/^(?!.*PRIVATE KEY).*$/s);
  });
});
