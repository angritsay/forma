import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PBKDF2_ITERATIONS, reseal, seal, unlockPage, unseal } from './lib.mjs';
import { publish } from './publish.mjs';

const PAGE = '<!doctype html><title>Secret</title><p>quarterly numbers 42</p>';

/** Decrypts a payload exactly as the unlock page does in the browser. */
async function browserOpen(payload, password) {
  const bytes = (b64) => Uint8Array.from(Buffer.from(b64, 'base64'));
  const base = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: bytes(payload.s), iterations: payload.n },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytes(payload.i) },
    key,
    bytes(payload.c),
  );
  return new TextDecoder().decode(plain);
}

function site() {
  const root = mkdtempSync(join(tmpdir(), 'private-page-'));
  const dist = join(root, 'dist');
  mkdirSync(join(dist, 'guides'), { recursive: true });
  const { sealed, key } = seal(PAGE);
  const source = join(root, 'page.enc');
  writeFileSync(source, sealed);
  return { dist, key, source };
}

describe('private page', () => {
  it('seals without the plain text and opens only with its key', () => {
    const { sealed, key } = seal(PAGE);
    expect(sealed).not.toContain('quarterly');
    expect(unseal(sealed, key)).toBe(PAGE);
    expect(() => unseal(sealed, seal(PAGE).key)).toThrow(/does not open/);
  });

  it('reseals in the shape the browser decrypts, and a wrong password fails', async () => {
    const payload = reseal(PAGE, 'correct horse battery staple', 1000);
    expect(await browserOpen(payload, 'correct horse battery staple')).toBe(PAGE);
    await expect(browserOpen(payload, 'wrong')).rejects.toThrow();
  });

  it('uses the full iteration count by default and a fresh salt every time', () => {
    const a = reseal(PAGE, 'pw');
    const b = reseal(PAGE, 'pw');
    expect(a.n).toBe(PBKDF2_ITERATIONS);
    expect(a.s).not.toBe(b.s);
  });

  it('builds an unlock page that stays out of search and carries no plain text', () => {
    const html = unlockPage(reseal(PAGE, 'pw', 1000));
    expect(html).toContain('<meta name="robots" content="noindex, nofollow');
    expect(html).toContain('<meta name="referrer" content="no-referrer">');
    expect(html).not.toContain('quarterly');
    expect(html).not.toMatch(/rel="canonical"|googletagmanager|metrika/);
  });

  it('publishes into dist under the configured path', async () => {
    const { dist, key, source } = site();
    const env = {
      PRIVATE_PAGE_KEY: key,
      PRIVATE_PAGE_PASSWORD: 'a long enough passphrase',
      PRIVATE_PAGE_PATH: 'k7r2x9mq4t',
      PRIVATE_PAGE_SOURCE: source,
    };
    const logs = [];
    const file = publish({ dist, env, log: (m) => logs.push(m) });
    expect(file).toBe(join(dist, 'k7r2x9mq4t', 'index.html'));
    const html = readFileSync(file, 'utf8');
    const payload = JSON.parse(html.match(/id="payload">(.*?)<\/script>/)[1]);
    expect(await browserOpen(payload, env.PRIVATE_PAGE_PASSWORD)).toBe(PAGE);
    expect(logs.join('\n')).not.toContain('k7r2x9mq4t');
  });

  it('skips cleanly until all three settings exist', () => {
    const { dist, key } = site();
    expect(publish({ dist, env: { PRIVATE_PAGE_KEY: key }, log: () => {} })).toBeNull();
  });

  it('rejects a bad path, a path taken by the site and a wrong key', () => {
    const { dist, key, source } = site();
    const base = { PRIVATE_PAGE_PASSWORD: 'pw', PRIVATE_PAGE_SOURCE: source };
    const run = (env) => () => publish({ dist, env: { ...base, ...env }, log: () => {} });
    expect(run({ PRIVATE_PAGE_KEY: key, PRIVATE_PAGE_PATH: '../escape' })).toThrow(/one path/);
    expect(run({ PRIVATE_PAGE_KEY: key, PRIVATE_PAGE_PATH: 'Short' })).toThrow(/one path/);
    expect(run({ PRIVATE_PAGE_KEY: key, PRIVATE_PAGE_PATH: 'guides' })).toThrow(/one path/);
    mkdirSync(join(dist, 'taken-path-1'));
    expect(run({ PRIVATE_PAGE_KEY: key, PRIVATE_PAGE_PATH: 'taken-path-1' })).toThrow(/collides/);
    expect(run({ PRIVATE_PAGE_KEY: seal(PAGE).key, PRIVATE_PAGE_PATH: 'k7r2x9mq4t' })).toThrow(
      /does not open/,
    );
  });
});
