import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { sampleManifest, startTestApp, type TestApp } from './helpers.js';

let app: TestApp;
beforeEach(async () => {
  app = await startTestApp();
});
afterEach(() => app.close());

function putManifest(body: unknown, headers: Record<string, string> = {}) {
  return app.request('/api/manifest', {
    method: 'PUT',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

async function seedMediaFolder(assetId: string) {
  const dir = path.join(app.dataDir, 'media', assetId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'thumb.jpg'), 'jpeg-bytes');
}

describe('PUT /api/manifest', () => {
  it('stores a valid manifest and reports counts', async () => {
    const res = await putManifest(sampleManifest(['A-1', 'B-2']));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, groups: 1, assets: 2, pruned: [] });
    const onDisk = JSON.parse(await readFile(path.join(app.dataDir, 'manifest.json'), 'utf8'));
    expect(onDisk).toEqual(sampleManifest(['A-1', 'B-2']));
  });

  it('is idempotent on re-PUT', async () => {
    await putManifest(sampleManifest(['A-1']));
    const res = await putManifest(sampleManifest(['A-1']));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, groups: 1, assets: 1, pruned: [] });
  });

  it('prunes media folders for assets that disappeared', async () => {
    await seedMediaFolder('A-1');
    await seedMediaFolder('B-2');
    const res = await putManifest(sampleManifest(['A-1']));
    expect(await res.json()).toEqual({ ok: true, groups: 1, assets: 1, pruned: ['B-2'] });
    await expect(stat(path.join(app.dataDir, 'media', 'A-1', 'thumb.jpg'))).resolves.toBeTruthy();
    await expect(stat(path.join(app.dataDir, 'media', 'B-2'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('prunes orphan folders never referenced by any manifest', async () => {
    await seedMediaFolder('ORPHAN-9');
    const res = await putManifest(sampleManifest(['A-1']));
    expect((await res.json()).pruned).toEqual(['ORPHAN-9']);
  });

  it('rejects invalid JSON with 400', async () => {
    const res = await putManifest('{not json');
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_json' });
  });

  it('rejects an unsupported version with 400 and writes nothing', async () => {
    const res = await putManifest({ ...(sampleManifest(['A-1']) as object), version: 2 });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_manifest');
    await expect(stat(path.join(app.dataDir, 'manifest.json'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rejects a manifest containing an unsafe asset id and writes nothing', async () => {
    await seedMediaFolder('A-1');
    const res = await putManifest(sampleManifest(['../../etc/passwd']));
    expect(res.status).toBe(400);
    expect((await res.json()).detail).toContain('safe asset id');
    // nothing written, nothing pruned
    await expect(stat(path.join(app.dataDir, 'manifest.json'))).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(stat(path.join(app.dataDir, 'media', 'A-1'))).resolves.toBeTruthy();
  });

  it('rejects a non-JSON content type with 415', async () => {
    const res = await putManifest('whatever', { 'Content-Type': 'text/plain' });
    expect(res.status).toBe(415);
  });

  it('rejects an oversized manifest with 413', async () => {
    await app.close();
    app = await startTestApp({ manifestMaxBytes: 1024 });
    const res = await putManifest(sampleManifest(Array.from({ length: 50 }, (_, i) => `ASSET-${i}`)));
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: 'payload_too_large' });
  });
});
