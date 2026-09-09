/**
 * Prodamus notification verification, runtime-neutral (Web Crypto only) so the same code runs in
 * the Edge Function and in the Node test suite.
 *
 * Prodamus signs every notification with HMAC-SHA256 over the posted fields and sends the hex
 * digest in the `Sign` header. Its reference implementation (the PHP `Hmac` class) prepares the
 * data before hashing: nested arrays are sorted by key at every level, every scalar is turned
 * into a string, and the result is JSON-encoded with unescaped unicode and slashes. The function
 * below reproduces that preparation; `signatureMatches()` compares in constant time.
 *
 * Verify the first real notification against this (docs/SETUP.md §7.4): if the digest differs,
 * the notification is rejected with 403 and logged — nothing is ever activated on a mismatch.
 */

export type FormValue = string | FormTree;
export interface FormTree {
  [key: string]: FormValue;
}

/** `products[0][name]=Sub` → { products: { 0: { name: 'Sub' } } }, the way PHP parses a form. */
export function parseForm(params: URLSearchParams): FormTree {
  const tree: FormTree = {};
  for (const [rawKey, value] of params) {
    const path = rawKey.replace(/\]/g, '').split('[');
    let node: FormTree = tree;
    for (let i = 0; i < path.length - 1; i++) {
      const seg = path[i]!;
      const next = node[seg];
      if (typeof next !== 'object') {
        const fresh: FormTree = {};
        node[seg] = fresh;
        node = fresh;
      } else {
        node = next;
      }
    }
    node[path[path.length - 1]!] = value;
  }
  return tree;
}

/** Sorted keys at every level, scalars as strings — the shape Prodamus hashes. */
export function canonicalize(value: FormValue): FormValue {
  if (typeof value !== 'object') return String(value);
  const out: FormTree = {};
  for (const key of Object.keys(value).sort()) out[key] = canonicalize(value[key]!);
  return out;
}

/** JSON as PHP's json_encode(JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) would write it. */
export function encode(value: FormValue): string {
  return JSON.stringify(canonicalize(value));
}

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sign(data: FormTree, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(encode(data))));
}

/** Constant-time comparison of two hex digests. */
export function signatureMatches(expected: string, received: string | null): boolean {
  if (!received || received.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ received.charCodeAt(i);
  }
  return diff === 0;
}

/** The plan a payment buys, decided by its amount: the prices in content/site/plans.ts. */
export function planForAmount(
  sum: string | undefined,
  prices: { monthly: number; annual: number },
): 'monthly' | 'annual' | null {
  const amount = Number.parseFloat(sum ?? '');
  if (!Number.isFinite(amount)) return null;
  if (Math.abs(amount - prices.monthly) < 0.5) return 'monthly';
  if (Math.abs(amount - prices.annual) < 0.5) return 'annual';
  return null;
}

function str(v: FormValue | undefined): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

export interface Payment {
  email: string;
  sum: string | undefined;
  status: string | undefined;
  /** The provider's order id, for idempotency. */
  ref: string;
}

/** The fields the webhook acts on; null when the notification is not a paid order. */
export function readPayment(data: FormTree): Payment | null {
  const email = str(data.customer_email)?.trim().toLowerCase();
  if (!email) return null;
  const ref = str(data.order_id) ?? str(data.order_num) ?? '';
  return { email, sum: str(data.sum), status: str(data.payment_status), ref };
}
