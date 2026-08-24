import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { sampleManifest, startTestApp, type TestApp } from './helpers.js';

let app: TestApp;
beforeEach(async () => {
  app = await startTestApp();
});
afterEach(() => app.close());

describe('GET /api/selects', () => {
  it('returns the v2 default when selects.json is absent', async () => {
    const res = await app.request('/api/selects');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ version: 2, updatedAt: null, selects: [] });
  });

  it('serves an existing selects.json verbatim', async () => {
    const doc = { version: 2, updatedAt: '2026-08-24T00:00:00Z', selects: [{ groupId: 'G', assetIds: ['A-1'] }] };
    await writeFile(path.join(app.dataDir, 'selects.json'), JSON.stringify(doc));
    const res = await app.request('/api/selects');
    expect(await res.json()).toEqual(doc);
  });
});

describe('GET /api/health', () => {
  it('reports no manifest on a fresh server', async () => {
    const res = await app.request('/api/health');
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.manifest).toEqual({ present: false });
    expect(new Date(body.time).toString()).not.toBe('Invalid Date');
  });

  it('reports manifest stats once one is synced', async () => {
    await app.request('/api/manifest', {
      method: 'PUT',
      body: JSON.stringify(sampleManifest(['A-1', 'B-2'])),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await app.request('/api/health');
    const body = await res.json();
    expect(body.manifest).toEqual({
      present: true,
      generatedAt: '2026-08-24T14:02:11Z',
      groups: 1,
      assets: 2,
    });
  });
});

describe('GET /healthz', () => {
  it('is unauthenticated', async () => {
    const res = await fetch(`${app.baseUrl}/healthz`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('ok');
  });
});
