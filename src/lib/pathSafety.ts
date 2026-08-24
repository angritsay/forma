import path from 'node:path';

// assetId is a PhotoKit localIdentifier with "/" replaced by "_": hex, dashes,
// underscores. No dots are allowed at all, so "." / ".." are unrepresentable.
const ASSET_ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

// Media filenames: thumb.jpg, kf01.jpg … — one extension dot, jpeg only.
const FILENAME_RE = /^[A-Za-z0-9_-]{1,64}\.jpe?g$/i;

export function isSafeAssetId(s: unknown): s is string {
  return typeof s === 'string' && ASSET_ID_RE.test(s);
}

export function isSafeFilename(s: unknown): s is string {
  return typeof s === 'string' && FILENAME_RE.test(s);
}

/** Join dataDir/media/assetId/filename with a containment assert on top of the
 *  allowlist validation — the result must stay under dataDir/media. */
export function resolveMediaPath(dataDir: string, assetId: string, filename: string): string {
  if (!isSafeAssetId(assetId) || !isSafeFilename(filename)) {
    throw new Error('unsafe media path components');
  }
  const mediaRoot = path.resolve(dataDir, 'media');
  const resolved = path.resolve(mediaRoot, assetId, filename);
  if (!resolved.startsWith(mediaRoot + path.sep)) {
    throw new Error('media path escapes media root');
  }
  return resolved;
}
