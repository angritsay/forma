import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sampleManifest, startTestApp, type TestApp } from './helpers.js';

let app: TestApp;
beforeAll(async () => {
  app = await startTestApp();
});
afterAll(() => app.close());

const endpoints: Array<[string, string, RequestInit]> = [
  ['GET', '/api/health', {}],
  ['GET', '/api/selects', {}],
  ['PUT', '/api/manifest', { body: JSON.stringify(sampleManifest(['A-1'])), headers: { 'Content-Type': 'application/json' } }],
  ['PUT', '/api/media/A-1/thumb.jpg', { body: 'xx' }],
];

describe('bearer auth on /api/*', () => {
  it.each(endpoints)('%s %s → 401 without a token', async (method, path, init) => {
    const res = await fetch(app.baseUrl + path, { ...init, method });
    expect(res.status).toBe(401);
    expect(res.headers.get('www-authenticate')).toBe('Bearer');
    expect(await res.json()).toEqual({ error: 'unauthorized' });
  });

  it.each(endpoints)('%s %s → 401 with a wrong token', async (method, path, init) => {
    const res = await fetch(app.baseUrl + path, {
      ...init,
      method,
      headers: { ...(init.headers as Record<string, string>), Authorization: 'Bearer wrong-token-0123456789' },
    });
    expect(res.status).toBe(401);
  });

  it('rejects a malformed Authorization header', async () => {
    const res = await fetch(`${app.baseUrl}/api/health`, { headers: { Authorization: 'Basic abc' } });
    expect(res.status).toBe(401);
  });

  it('accepts the correct token', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
  });
});
