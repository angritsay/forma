import path from 'node:path';
import fs from 'node:fs/promises';
import express, { Router } from 'express';
import type { Config } from '../config.js';
import { requireSyncToken } from '../middleware/auth.js';
import { ensureDir, writeFileAtomic } from '../lib/fsUtils.js';
import { isSafeAssetId, isSafeFilename, resolveMediaPath } from '../lib/pathSafety.js';
import { collectAssetIds, ManifestStore, ManifestValidationError, validateManifest } from '../lib/manifestStore.js';

const SELECTS_DEFAULT = { version: 2, updatedAt: null, selects: [] };

export function buildApiRouter(config: Config): Router {
  const router = Router();
  const store = new ManifestStore(config);

  router.use(requireSyncToken(config));

  router.put(
    '/manifest',
    express.json({ limit: config.manifestMaxBytes, type: 'application/json' }),
    async (req, res) => {
      // express.json leaves the body untouched for other content types.
      if (!req.is('application/json')) {
        res.status(415).json({ error: 'unsupported_media_type' });
        return;
      }
      let manifest;
      try {
        manifest = validateManifest(req.body);
      } catch (err) {
        if (err instanceof ManifestValidationError) {
          res.status(400).json({ error: 'invalid_manifest', detail: err.message });
          return;
        }
        throw err;
      }
      const pruned = await store.replaceAndPrune(manifest);
      res.json({
        ok: true,
        groups: manifest.groups.length,
        assets: collectAssetIds(manifest).size,
        pruned,
      });
    },
  );

  router.put(
    '/media/:assetId/:filename',
    express.raw({ type: () => true, limit: config.mediaMaxBytes }),
    async (req, res) => {
      const { assetId, filename } = req.params;
      if (!isSafeAssetId(assetId) || !isSafeFilename(filename)) {
        res.status(400).json({ error: 'invalid_path' });
        return;
      }
      const body = req.body as unknown;
      if (!Buffer.isBuffer(body) || body.length === 0) {
        res.status(400).json({ error: 'empty_body' });
        return;
      }
      const filePath = resolveMediaPath(config.dataDir, assetId, filename);
      await ensureDir(path.dirname(filePath));
      await writeFileAtomic(filePath, body);
      res.json({ ok: true, bytes: body.length });
    },
  );

  router.get('/selects', async (_req, res) => {
    try {
      const raw = await fs.readFile(path.join(config.dataDir, 'selects.json'));
      res.type('application/json').send(raw);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      res.json(SELECTS_DEFAULT);
    }
  });

  router.get('/health', async (_req, res) => {
    const manifest = await store.read();
    res.json({
      ok: true,
      time: new Date().toISOString(),
      manifest: manifest
        ? {
            present: true,
            generatedAt: manifest.generatedAt,
            groups: manifest.groups.length,
            assets: collectAssetIds(manifest).size,
          }
        : { present: false },
    });
  });

  return router;
}
