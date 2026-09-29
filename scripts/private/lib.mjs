/**
 * A private page on the public site: published by direct link only, readable only with a password.
 *
 * The repository is public and so is everything GitHub Pages serves, and Pages cannot check a
 * password on a server. So the page is encrypted twice over, and its plain HTML never touches git:
 *
 *   1. `seal`   — once, wherever the plain file is: AES-256-GCM under a random 256-bit key. Only the
 *                 result (`private/*.enc`) is committed; the key goes to the owner, who stores it
 *                 as the GitHub secret PRIVATE_PAGE_KEY. Without the key the file is noise.
 *   2. `reseal` — on every deploy: open the sealed file with the key and encrypt the page again
 *                 under the password (secret PRIVATE_PAGE_PASSWORD), PBKDF2-SHA256 → AES-256-GCM,
 *                 fresh salt and IV each time. `unlockPage` wraps that in a small HTML page which
 *                 derives the same key in the browser with Web Crypto and swaps the page in.
 *
 * What protects the page is the password alone: the published ciphertext can be attacked offline,
 * so the password should be a long passphrase — PBKDF2 at 600 000 iterations only slows guessing.
 */
import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from 'node:crypto';

const SEALED_HEADER = 'forma-private-page v1';
const IV_BYTES = 12;
const TAG_BYTES = 16;
const SALT_BYTES = 16;
export const PBKDF2_ITERATIONS = 600_000;

/** One path segment, long enough not to be guessed by walking common words. */
export const PATH_RE = /^[a-z0-9][a-z0-9-]{7,63}$/;

/** @param {Buffer} key @param {Buffer} plain */
function gcmEncrypt(key, plain) {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(plain), cipher.final(), cipher.getAuthTag()]);
  return { iv, body };
}

/** @param {Buffer} key @param {Buffer} iv @param {Buffer} body ciphertext followed by the GCM tag */
function gcmDecrypt(key, iv, body) {
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(body.subarray(body.length - TAG_BYTES));
  return Buffer.concat([
    decipher.update(body.subarray(0, body.length - TAG_BYTES)),
    decipher.final(),
  ]);
}

/** @param {string} b64 */
function decodeKey(b64) {
  const key = Buffer.from(b64.trim(), 'base64url');
  if (key.length !== 32) throw new Error('PRIVATE_PAGE_KEY must be 32 bytes, base64url-encoded');
  return key;
}

/**
 * Encrypts a page under a fresh random key.
 * @param {string} html
 * @returns {{ sealed: string, key: string }} the file to commit and the key to keep out of git
 */
export function seal(html) {
  const key = randomBytes(32);
  const { iv, body } = gcmEncrypt(key, Buffer.from(html, 'utf8'));
  const sealed = `${SEALED_HEADER}\n${Buffer.concat([iv, body]).toString('base64')}\n`;
  return { sealed, key: key.toString('base64url') };
}

/**
 * Opens a sealed file. Throws on a wrong key or a damaged file (the GCM tag check).
 * @param {string} sealed @param {string} keyB64
 */
export function unseal(sealed, keyB64) {
  const [header, payload] = sealed.trim().split('\n');
  if (header !== SEALED_HEADER || !payload) throw new Error('Not a sealed private page');
  const raw = Buffer.from(payload, 'base64');
  try {
    return gcmDecrypt(
      decodeKey(keyB64),
      raw.subarray(0, IV_BYTES),
      raw.subarray(IV_BYTES),
    ).toString('utf8');
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('PRIVATE_PAGE_KEY')) throw err;
    throw new Error('PRIVATE_PAGE_KEY does not open this sealed page', { cause: err });
  }
}

/**
 * @typedef {{ v: 1, n: number, s: string, i: string, c: string }} Payload
 *   n — PBKDF2 iterations, s — salt, i — IV, c — ciphertext + tag; all base64
 */

/**
 * Encrypts a page under a password, in the shape the unlock page decrypts.
 * @param {string} html @param {string} password
 * @returns {Payload}
 */
export function reseal(html, password, iterations = PBKDF2_ITERATIONS) {
  const salt = randomBytes(SALT_BYTES);
  const key = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
  const { iv, body } = gcmEncrypt(key, Buffer.from(html, 'utf8'));
  return {
    v: 1,
    n: iterations,
    s: salt.toString('base64'),
    i: iv.toString('base64'),
    c: body.toString('base64'),
  };
}

/**
 * The published page: a password form and the encrypted payload, nothing else. No canonical, no
 * analytics, no links, and every robots directive that keeps it out of search and previews.
 * @param {Payload} payload
 */
export function unlockPage(payload) {
  // Base64 and digits only, so the JSON cannot close the <script> it sits in.
  const data = JSON.stringify(payload);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
<meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
<meta name="referrer" content="no-referrer">
<meta name="color-scheme" content="dark">
<title>Forma</title>
<style>
  :root { --bg: #121212; --surface: #1c1c1c; --line: #303030; --ink: #f6f6f7; --muted: #93939d;
    --sky: #afe9fd; --neon: #f4ff3f; --orange: #ff5a00; }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body { margin: 0; background: var(--bg); color: var(--ink);
    font: 16px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif;
    display: grid; place-items: center; padding: 16px; }
  form { width: 100%; max-width: 360px; background: var(--surface); border-radius: 24px;
    padding: 28px 24px 24px; display: grid; gap: 14px; }
  h1 { margin: 0 0 4px; font-size: 22px; line-height: 1.2; font-weight: 700; letter-spacing: -0.01em; }
  label { font-size: 14px; color: var(--muted); }
  input { width: 100%; font: inherit; color: var(--ink); background: var(--bg);
    border: 1px solid var(--line); border-radius: 14px; padding: 12px 14px; }
  input:focus-visible, button:focus-visible { outline: 2px solid var(--sky); outline-offset: 2px; }
  button { font: inherit; font-weight: 600; color: #121212; background: var(--neon); border: 0;
    border-radius: 999px; padding: 12px 18px; cursor: pointer; }
  button[disabled] { opacity: .6; cursor: progress; }
  .error { min-height: 1.5em; margin: 0; font-size: 14px; color: var(--orange); }
</style>
</head>
<body>
<form id="unlock" autocomplete="off">
  <h1>Private page</h1>
  <label for="pw">Password</label>
  <input id="pw" type="password" autocomplete="current-password" required autofocus>
  <button type="submit">Open</button>
  <p class="error" id="err" role="alert"></p>
</form>
<script type="application/json" id="payload">${data}</script>
<script>
(() => {
  const p = JSON.parse(document.getElementById('payload').textContent);
  const bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  // A derived key is remembered for this tab only, so a reload does not ask again. It is tied to
  // the salt, which changes on every deploy, so a key from an older build is simply ignored.
  const slot = 'forma-private-key:' + p.s;
  const store = {
    get() { try { return sessionStorage.getItem(slot); } catch { return null; } },
    set(v) { try { sessionStorage.setItem(slot, v); } catch { /* private mode */ } },
  };

  async function derive(password) {
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', hash: 'SHA-256', salt: bytes(p.s), iterations: p.n },
      base, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
  }

  async function open(key) {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(p.i) }, key, bytes(p.c));
    const html = new TextDecoder().decode(plain);
    store.set(b64(await crypto.subtle.exportKey('raw', key)));
    document.open();
    document.write(html);
    document.close();
  }

  const saved = store.get();
  if (saved) {
    crypto.subtle.importKey('raw', bytes(saved), 'AES-GCM', true, ['decrypt']).then(open).catch(() => {});
  }

  const form = document.getElementById('unlock');
  const err = document.getElementById('err');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = form.querySelector('button');
    button.disabled = true;
    err.textContent = '';
    try {
      await open(await derive(document.getElementById('pw').value));
    } catch {
      err.textContent = 'Wrong password';
      button.disabled = false;
    }
  });
})();
</script>
</body>
</html>
`;
}
