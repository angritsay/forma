import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestApp, type TestApp } from './helpers.js';

let app: TestApp;
beforeAll(async () => {
  app = await startTestApp();
});
afterAll(() => app.close());

function putMedia(assetId: string, filename: string, body: BodyInit) {
  return app.request(`/api/media/${assetId}/${filename}`, {
    method: 'PUT',
    body,
    headers: { 'Content-Type': 'application/octet-stream' },
  });
}

describe('PUT /api/media/:assetId/:filename', () => {
  it('roundtrips bytes to disk', async () => {
    const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
    const res = await putMedia('ASSET-1_L0_001', 'thumb.jpg', bytes);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, bytes: bytes.length });
    const onDisk = await readFile(path.join(app.dataDir, 'media', 'ASSET-1_L0_001', 'thumb.jpg'));
    expect(onDisk.equals(bytes)).toBe(true);
  });

  it('overwrites on duplicate upload', async () => {
    await putMedia('ASSET-1_L0_001', 'kf01.jpg', 'first');
    const res = await putMedia('ASSET-1_L0_001', 'kf01.jpg', 'second!');
    expect(res.status).toBe(200);
    const onDisk = await readFile(path.join(app.dataDir, 'media', 'ASSET-1_L0_001', 'kf01.jpg'), 'utf8');
    expect(onDisk).toBe('second!');
  });

  it('rejects an empty body', async () => {
    const res = await app.request('/api/media/ASSET-2/thumb.jpg', { method: 'PUT' });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'empty_body' });
  });

  it('rejects an oversized body with 413', async () => {
    const small = await startTestApp({ mediaMaxBytes: 8 });
    try {
      const res = await small.request('/api/media/ASSET-3/thumb.jpg', {
        method: 'PUT',
        body: Buffer.alloc(64, 1),
        headers: { 'Content-Type': 'application/octet-stream' },
      });
      expect(res.status).toBe(413);
    } finally {
      await small.close();
    }
  });

  it('rejects traversal attempts and leaves the filesystem untouched', async () => {
    const attempts = [
      '/api/media/..%2F..%2Fescape/thumb.jpg',
      '/api/media/ASSET-1/..%2Fescape.jpg',
      '/api/media/%2e%2e/thumb.jpg',
      '/api/media/ASSET-1/thumb.png',
      '/api/media/ASSET.1/thumb.jpg',
    ];
    for (const url of attempts) {
      const res = await app.request(url, { method: 'PUT', body: 'x' });
      expect([400, 404]).toContain(res.status);
    }
    await expect(stat(path.join(app.dataDir, 'escape'))).rejects.toMatchObject({ code: 'ENOENT' });
    const mediaRoot = await readdir(path.join(app.dataDir, 'media'));
    expect(mediaRoot.sort()).toEqual(['ASSET-1_L0_001']);
  });
});
