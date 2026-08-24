import fs from 'node:fs/promises';
import path from 'node:path';
import type { Config } from '../config.js';
import type { Manifest } from '../types.js';
import { ensureDir, writeFileAtomic } from './fsUtils.js';
import { isSafeAssetId } from './pathSafety.js';

export class ManifestValidationError extends Error {}

function fail(msg: string): never {
  throw new ManifestValidationError(msg);
}

/** Structural validation of an incoming manifest. Rejecting unsafe asset ids
 *  here is part of the security model: no manifest on disk can ever feed a
 *  hostile string into a later filesystem operation. */
export function validateManifest(body: unknown): Manifest {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) fail('manifest must be a JSON object');
  const m = body as Record<string, unknown>;
  if (m.version !== 1) throw new ManifestValidationError('unsupported manifest version');
  if (typeof m.generatedAt !== 'string') fail('generatedAt must be a string');
  if (typeof m.device !== 'string') fail('device must be a string');
  if (!Array.isArray(m.groups)) fail('groups must be an array');
  for (const [gi, group] of m.groups.entries()) {
    if (typeof group !== 'object' || group === null) fail(`groups[${gi}] must be an object`);
    const g = group as Record<string, unknown>;
    if (typeof g.id !== 'string' || g.id.length === 0) fail(`groups[${gi}].id must be a non-empty string`);
    if (!Array.isArray(g.assets)) fail(`groups[${gi}].assets must be an array`);
    for (const [ai, asset] of g.assets.entries()) {
      if (typeof asset !== 'object' || asset === null) fail(`groups[${gi}].assets[${ai}] must be an object`);
      const a = asset as Record<string, unknown>;
      if (!isSafeAssetId(a.id)) fail(`groups[${gi}].assets[${ai}].id is not a safe asset id`);
    }
  }
  return body as Manifest;
}

export function collectAssetIds(manifest: Manifest): Set<string> {
  const ids = new Set<string>();
  for (const group of manifest.groups) {
    for (const asset of group.assets) ids.add(asset.id);
  }
  return ids;
}

export class ManifestStore {
  private readonly manifestPath: string;
  private readonly mediaRoot: string;
  // Serializes manifest writes + prunes; a single-user service needs no more.
  private opChain: Promise<unknown> = Promise.resolve();

  constructor(config: Pick<Config, 'dataDir'>) {
    this.manifestPath = path.join(config.dataDir, 'manifest.json');
    this.mediaRoot = path.join(config.dataDir, 'media');
  }

  private run<T>(op: () => Promise<T>): Promise<T> {
    const next = this.opChain.then(op, op);
    this.opChain = next.catch(() => undefined);
    return next;
  }

  async read(): Promise<Manifest | null> {
    try {
      return JSON.parse(await fs.readFile(this.manifestPath, 'utf8')) as Manifest;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }

  /** Replace the manifest atomically, then prune media folders for assets no
   *  longer referenced. Prunes against what is on disk (not the old manifest):
   *  a strict superset of the old-vs-new diff that also heals orphans left by
   *  crashed or aborted syncs. Returns the pruned asset ids. */
  replaceAndPrune(manifest: Manifest): Promise<string[]> {
    return this.run(async () => {
      await writeFileAtomic(this.manifestPath, JSON.stringify(manifest, null, 2));
      return this.pruneMedia(collectAssetIds(manifest));
    });
  }

  private async pruneMedia(keepIds: Set<string>): Promise<string[]> {
    await ensureDir(this.mediaRoot);
    const entries = await fs.readdir(this.mediaRoot, { withFileTypes: true });
    const pruned: string[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || keepIds.has(entry.name)) continue;
      // Deletion candidates come only from readdir, never from manifest
      // strings; the allowlist re-check is defense in depth before rm -rf.
      if (!isSafeAssetId(entry.name)) {
        console.warn(`prune: skipping unexpected entry in media root: ${JSON.stringify(entry.name)}`);
        continue;
      }
      await fs.rm(path.join(this.mediaRoot, entry.name), { recursive: true, force: true });
      pruned.push(entry.name);
    }
    return pruned.sort();
  }
}
