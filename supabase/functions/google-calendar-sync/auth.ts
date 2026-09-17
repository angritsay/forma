/**
 * Google service-account authentication, with Web Crypto only so the same code runs in the Edge
 * Function and in the Node test suite.
 *
 * WHY A SERVICE ACCOUNT AND NOT AN OAUTH REFRESH TOKEN
 * ----------------------------------------------------
 * A service account is a robot with its own address, and a Google Calendar can be shared with an
 * address. So the coach opens Calendar → his calendar → «Поделиться с отдельными пользователями» →
 * pastes the service account's address with "See all event details", and from that moment this
 * function can read that calendar and nothing else. No consent screen, no browser, nothing that
 * expires. Domain-wide delegation is a different mechanism entirely — it needs a Google Workspace
 * admin console, which a personal @gmail.com account does not have — and it is not used here.
 *
 * One consequence worth knowing: a calendar shared with a service account does not show up in
 * `calendarList.list()`. The calendar id has to be configured (it is the coach's own address for
 * his primary calendar), and `events.list` called against it directly. That is what `index.ts`
 * does, and why there is a `GOOGLE_CALENDAR_ID` secret at all.
 *
 * THE FLOW
 * --------
 * Sign a short-lived JWT with the service account's private key, POST it to Google's token
 * endpoint as a `urn:ietf:params:oauth:grant-type:jwt-bearer` assertion, get an access token back.
 * The scope asked for is the narrowest one that can read events:
 * `https://www.googleapis.com/auth/calendar.events.readonly` — "View events on all your calendars"
 * (Calendar API v3 discovery document, revision 20260826). Not `calendar`, which can also delete
 * them.
 *
 * THE KEY IS A SECRET AND ONLY EVER A SECRET. It lives in `GOOGLE_SA_PRIVATE_KEY` on Supabase. It
 * is never in this repository, which is public, and nothing here logs it, logs a token, or puts
 * either in an error message.
 */

export const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

/** The narrowest scope that can read an event's attendees and its Meet link. */
export const SCOPE = 'https://www.googleapis.com/auth/calendar.events.readonly';

/** Google's maximum assertion lifetime. */
export const ASSERTION_TTL_SECONDS = 3600;

function base64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeJson(value: unknown): string {
  return base64url(new TextEncoder().encode(JSON.stringify(value)));
}

/**
 * The PEM as it survives a round trip through a secret store. A private key pasted into a
 * dashboard field, or lifted out of the service account's JSON, usually arrives with its newlines
 * escaped as the two characters `\` and `n`; sometimes it arrives wrapped in quotes as well. Both
 * are repaired here rather than being left to fail as "invalid key" an hour later.
 */
export function normalizePrivateKey(pem: string): string {
  return pem
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\r/g, '')
    .replace(/\\n/g, '\n')
    .trim();
}

/** The DER bytes inside a `-----BEGIN PRIVATE KEY-----` block. Throws when there is no block. */
export function decodePkcs8(pem: string): Uint8Array {
  const match = normalizePrivateKey(pem).match(
    /-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----/,
  );
  if (!match) throw new Error('private key is not a PKCS#8 PEM block');
  const binary = atob(match[1]!.replace(/\s+/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importKey(pem: string): Promise<CryptoKey> {
  const der = decodePkcs8(pem);
  return crypto.subtle.importKey(
    'pkcs8',
    der.buffer.slice(der.byteOffset, der.byteOffset + der.byteLength) as ArrayBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

/**
 * The signed assertion: `{"alg":"RS256","typ":"JWT"}.{iss,scope,aud,exp,iat}.<signature>`.
 * Exported for the tests, which sign one with a throwaway key and verify it with the public half.
 */
export async function buildAssertion(
  clientEmail: string,
  privateKeyPem: string,
  now: number = Date.now(),
  scope: string = SCOPE,
): Promise<string> {
  const issuedAt = Math.floor(now / 1000);
  const header = encodeJson({ alg: 'RS256', typ: 'JWT' });
  const claims = encodeJson({
    iss: clientEmail,
    scope,
    aud: TOKEN_ENDPOINT,
    iat: issuedAt,
    exp: issuedAt + ASSERTION_TTL_SECONDS,
  });
  const signingInput = `${header}.${claims}`;
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    await importKey(privateKeyPem),
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${base64url(new Uint8Array(signature))}`;
}

export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

/**
 * An access token, or a thrown error whose message says what went wrong and never what the key or
 * the token is. Google's error bodies are short and do not contain the assertion, but they are not
 * repeated here either: the status code is the diagnosis.
 */
export async function fetchAccessToken(
  clientEmail: string,
  privateKeyPem: string,
  fetchImpl: Fetcher,
  now: number = Date.now(),
): Promise<string> {
  const assertion = await buildAssertion(clientEmail, privateKeyPem, now);
  const response = await fetchImpl(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  });
  if (!response.ok) {
    throw new Error(`google token endpoint answered ${response.status}`);
  }
  const body: unknown = await response.json();
  const token =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>).access_token
      : null;
  if (typeof token !== 'string' || token === '') {
    throw new Error('google token endpoint returned no access_token');
  }
  return token;
}
