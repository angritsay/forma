import { mkdtemp, rm } from 'node:fs/promises';
import type { Server } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildApp } from '../src/app.js';
import type { Config } from '../src/config.js';

export const TEST_TOKEN = 'test-token-0123456789abcdef';

export interface TestApp {
  config: Config;
  dataDir: string;
  baseUrl: string;
  close(): Promise<void>;
  /** fetch with the sync token attached (override with headers.Authorization). */
  request(pathname: string, init?: RequestInit): Promise<Response>;
}

export async function startTestApp(overrides: Partial<Config> = {}): Promise<TestApp> {
  const dataDir = await mkdtemp(path.join(tmpdir(), 'rolls-test-'));
  const config: Config = {
    syncToken: TEST_TOKEN,
    dataDir,
    port: 0,
    host: '127.0.0.1',
    manifestMaxBytes: 20 * 1024 * 1024,
    mediaMaxBytes: 10 * 1024 * 1024,
    ...overrides,
  };
  const app = buildApp(config);
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('no server address');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    config,
    dataDir,
    baseUrl,
    async close() {
      await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
      await rm(dataDir, { recursive: true, force: true });
    },
    request(pathname, init = {}) {
      return fetch(baseUrl + pathname, {
        ...init,
        headers: { Authorization: `Bearer ${TEST_TOKEN}`, ...(init.headers as Record<string, string> | undefined) },
      });
    },
  };
}

export function sampleManifest(assetIds: string[]): unknown {
  return {
    version: 1,
    generatedAt: '2026-08-24T14:02:11Z',
    device: 'Test-iPhone',
    settings: { gapMinutes: 45, distanceKm: 3 },
    groups: [
      {
        id: '7C9E6679-7425-40DE-944B-E07FC1F90AE7',
        status: 'closed',
        name: 'Test group',
        tags: ['test'],
        startedAt: '2026-08-20T17:31:04Z',
        endedAt: '2026-08-20T18:12:40Z',
        location: { lat: -8.7185, lon: 115.1686, place: 'Jimbaran, Bali' },
        assets: assetIds.map((id, i) => ({
          id,
          cloudId: null,
          type: 'photo',
          creationDate: `2026-08-20T17:3${i}:04Z`,
          duration: 0,
          width: 1080,
          height: 1920,
          favorite: false,
          flags: { delete: false, hidden: false, claudePick: false },
          files: ['thumb.jpg'],
        })),
      },
    ],
  };
}
