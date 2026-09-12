/**
 * Where the signed-in session is kept, so that signing in lasts weeks instead of one launch.
 *
 * The symptom this exists for: inside the Telegram Mini App the app asked for an emailed code on
 * every single open. Nothing in the app signs anyone out — `persistSession` and `autoRefreshToken`
 * were on the whole time — but Supabase keeps the session in `localStorage`, and a Telegram webview
 * is not a browser tab you come back to. The client evicts its webview storage when it feels like
 * it, and on iOS that is close enough to "every launch" that the refresh token was simply never
 * there to refresh.
 *
 * Telegram's answer to exactly this is `CloudStorage`: per-user, per-bot, held on their servers,
 * and it survives the webview being cleared, the app being killed, even a reinstall. So inside
 * Telegram the session is written to both — `localStorage` as the fast path, CloudStorage as the
 * copy that is still there tomorrow — and read back from CloudStorage whenever localStorage has
 * come up empty.
 *
 * On the open web nothing changes: `localStorage`, as before.
 *
 * Two things about CloudStorage shape the code:
 *   - it is callback-based, so every operation is wrapped in a promise (supabase-js accepts an
 *     async storage adapter);
 *   - a value is capped at 4096 characters, and a Supabase session with a long JWT and a user
 *     object goes past that, so values are split across `<key>_0`, `<key>_1`, … with a small
 *     header at `<key>` saying how many there are.
 *
 * Writes are deliberately not awaited by the caller: supabase-js calls `setItem` on every token
 * refresh, and making a round trip to Telegram's servers part of that path would put a network
 * hop in front of the app's own requests. A write that loses the race is corrected by the next
 * refresh; a write that fails leaves the previous session in place, which is the safe direction.
 */
import { telegram } from '@/lib/telegram/webapp';

/** Telegram's own cap is 4096; the margin leaves room for the chunk suffix and any escaping. */
const CHUNK = 3800;
/** Header value for a chunked entry: `chunks:<n>`. Anything else is a plain single value. */
const CHUNK_PREFIX = 'chunks:';
/** CloudStorage keys must match /^[A-Za-z0-9_-]{1,128}$/ — `forma.auth` has a dot in it. */
const safeKey = (key: string) => key.replace(/[^A-Za-z0-9_-]/g, '_');

interface AsyncStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

function localStore(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    /* Blocked (private mode, embedded webview with storage off). */
    return null;
  }
}

function cloud() {
  return telegram()?.CloudStorage ?? null;
}

function cloudGet(key: string): Promise<string | null> {
  const api = cloud();
  if (!api) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      api.getItem(key, (err, value) => resolve(err || !value ? null : value));
    } catch {
      resolve(null);
    }
  });
}

function cloudSet(key: string, value: string): Promise<void> {
  const api = cloud();
  if (!api) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      api.setItem(key, value, () => resolve());
    } catch {
      resolve();
    }
  });
}

function cloudRemove(key: string): Promise<void> {
  const api = cloud();
  if (!api) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      api.removeItem(key, () => resolve());
    } catch {
      resolve();
    }
  });
}

/** Read a value that may have been split across several keys. */
async function cloudGetChunked(key: string): Promise<string | null> {
  const head = await cloudGet(key);
  if (head === null) return null;
  if (!head.startsWith(CHUNK_PREFIX)) return head;
  const count = Number(head.slice(CHUNK_PREFIX.length));
  if (!Number.isInteger(count) || count < 1 || count > 32) return null;
  const parts = await Promise.all(Array.from({ length: count }, (_, i) => cloudGet(`${key}_${i}`)));
  // A missing piece means a half-written or half-evicted value; treat the whole thing as absent
  // rather than handing supabase-js a truncated JSON blob it would throw on.
  return parts.every((p) => p !== null) ? parts.join('') : null;
}

/** How many pieces the value currently at `key` was split into; 0 when it was not split. */
function chunkCount(head: string | null): number {
  if (!head?.startsWith(CHUNK_PREFIX)) return 0;
  const count = Number(head.slice(CHUNK_PREFIX.length));
  return Number.isInteger(count) && count > 0 && count <= 32 ? count : 0;
}

/**
 * Drop the pieces of whatever is stored at `key` now.
 *
 * Always from the header's own count, never from the count about to be written: a session that
 * shrinks — a shorter JWT, or a chunked value replaced by a plain one — would otherwise leave its
 * tail behind, and those keys are never read again while still spending the 1024-key budget.
 */
async function clearChunks(key: string, head: string | null): Promise<void> {
  const count = chunkCount(head);
  if (count === 0) return;
  await Promise.all(Array.from({ length: count }, (_, i) => cloudRemove(`${key}_${i}`)));
}

/** Write a value, splitting it when it is too long for one CloudStorage entry. */
async function cloudSetChunked(key: string, value: string): Promise<void> {
  const previous = await cloudGet(key);
  if (value.length <= CHUNK) {
    await cloudSet(key, value);
    await clearChunks(key, previous);
    return;
  }
  const parts: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK) parts.push(value.slice(i, i + CHUNK));
  await Promise.all(parts.map((part, i) => cloudSet(`${key}_${i}`, part)));
  // The header last: until it is written the old value is still the readable one, so a write that
  // dies halfway leaves the previous session intact rather than a half of the new one.
  await cloudSet(key, `${CHUNK_PREFIX}${parts.length}`);
  const stale = chunkCount(previous) - parts.length;
  if (stale > 0) {
    await Promise.all(
      Array.from({ length: stale }, (_, i) => cloudRemove(`${key}_${parts.length + i}`)),
    );
  }
}

async function cloudRemoveChunked(key: string): Promise<void> {
  const head = await cloudGet(key);
  await cloudRemove(key);
  await clearChunks(key, head);
}

/**
 * The storage supabase-js writes the session to.
 *
 * Outside Telegram this is `localStorage` and nothing else. Inside it, localStorage is still the
 * first place read — it is synchronous and usually warm within a single run of the app — and
 * CloudStorage is the fallback that makes the session outlive the webview.
 */
export function sessionStorageAdapter(): AsyncStorage {
  return {
    async getItem(key) {
      const local = localStore()?.getItem(key) ?? null;
      if (local !== null) return local;
      if (!cloud()) return null;
      const remote = await cloudGetChunked(safeKey(key));
      // Put it back where the synchronous path will find it for the rest of this run.
      if (remote !== null) {
        try {
          localStore()?.setItem(key, remote);
        } catch {
          /* Storage full or blocked: the cloud copy is still the one that matters. */
        }
      }
      return remote;
    },

    setItem(key, value) {
      try {
        localStore()?.setItem(key, value);
      } catch {
        /* ignore */
      }
      // Not awaited on purpose — see the note at the top of this file.
      void cloudSetChunked(safeKey(key), value);
    },

    removeItem(key) {
      try {
        localStore()?.removeItem(key);
      } catch {
        /* ignore */
      }
      void cloudRemoveChunked(safeKey(key));
    },
  };
}

/** Exported for the test; the chunking is the part with arithmetic in it. */
export const __test = { CHUNK, CHUNK_PREFIX, safeKey };
