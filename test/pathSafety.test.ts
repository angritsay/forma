import { describe, expect, it } from 'vitest';
import { isSafeAssetId, isSafeFilename, resolveMediaPath } from '../src/lib/pathSafety.js';

describe('isSafeAssetId', () => {
  it('accepts sanitized PhotoKit localIdentifiers', () => {
    expect(isSafeAssetId('A1B2C3D4-E5F6-4711-9C0D-123456789ABC_L0_001')).toBe(true);
    expect(isSafeAssetId('TEST-1234_L0_001')).toBe(true);
  });

  it('rejects traversal and separator attempts', () => {
    for (const bad of ['..', '.', 'a/../b', 'a/b', 'a\\b', '', '%2e%2e', 'a.b', 'a\0b', 'a'.repeat(129)]) {
      expect(isSafeAssetId(bad), JSON.stringify(bad)).toBe(false);
    }
    expect(isSafeAssetId(42)).toBe(false);
    expect(isSafeAssetId(null)).toBe(false);
  });
});

describe('isSafeFilename', () => {
  it('accepts spec filenames', () => {
    expect(isSafeFilename('thumb.jpg')).toBe(true);
    expect(isSafeFilename('kf01.jpg')).toBe(true);
    expect(isSafeFilename('poster.jpeg')).toBe(true);
    expect(isSafeFilename('THUMB.JPG')).toBe(true);
  });

  it('rejects everything else', () => {
    for (const bad of ['thumb.png', 'foo.jpg.exe', '..jpg', '../x.jpg', 'a/b.jpg', 'thumb', '.jpg', 'a\0.jpg', `${'a'.repeat(65)}.jpg`]) {
      expect(isSafeFilename(bad), JSON.stringify(bad)).toBe(false);
    }
  });
});

describe('resolveMediaPath', () => {
  it('resolves to a path under dataDir/media', () => {
    expect(resolveMediaPath('/data', 'ASSET-1', 'thumb.jpg')).toBe('/data/media/ASSET-1/thumb.jpg');
  });

  it('throws on unsafe components', () => {
    expect(() => resolveMediaPath('/data', '..', 'thumb.jpg')).toThrow();
    expect(() => resolveMediaPath('/data', 'ASSET-1', '../thumb.jpg')).toThrow();
  });
});
