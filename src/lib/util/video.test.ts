import { describe, expect, it } from 'vitest';
import { extensionFor, isVideoFile, MAX_VIDEO_BYTES } from './image';

/**
 * The video half of the proof upload.
 *
 * Kept in its own file because `image.test.ts` is about shrinking a photograph, and the whole
 * point of these is that a clip is the case where shrinking is not available: a browser cannot
 * re-encode video, so everything here is about recognising one and refusing an oversized one.
 */
const blob = (type: string, size = 10): Blob => new Blob([new Uint8Array(size)], { type });

describe('isVideoFile', () => {
  it('reads the picker’s media type, whatever the case', () => {
    expect(isVideoFile(blob('video/mp4'))).toBe(true);
    expect(isVideoFile(blob('VIDEO/QUICKTIME'))).toBe(true);
    expect(isVideoFile(blob('video/webm'))).toBe(true);
  });

  it('treats a picture, and anything unlabelled, as not a video', () => {
    // The safe way round: `downscaleImage` refuses politely on anything it cannot decode, whereas
    // a photograph mistaken for a clip would skip the shrink and upload at full size.
    expect(isVideoFile(blob('image/jpeg'))).toBe(false);
    expect(isVideoFile(blob(''))).toBe(false);
    expect(isVideoFile(blob('application/octet-stream'))).toBe(false);
  });
});

describe('extensionFor', () => {
  it('gives a clip an extension the coach’s feed can recognise', () => {
    // `ProofMedia.isVideoRef` reads exactly these off the stored path to decide on a player.
    expect(extensionFor(blob('video/mp4'))).toBe('mp4');
    expect(extensionFor(blob('video/quicktime'))).toBe('mov');
    expect(extensionFor(blob('video/webm'))).toBe('webm');
  });

  it('still maps the image types, and falls back for anything else', () => {
    expect(extensionFor(blob('image/jpeg'))).toBe('jpg');
    expect(extensionFor(blob('image/png'))).toBe('png');
    expect(extensionFor(blob('video/x-matroska'), 'mkv')).toBe('mkv');
  });
});

describe('MAX_VIDEO_BYTES', () => {
  it('is 25 MB — about twenty seconds of phone video', () => {
    expect(MAX_VIDEO_BYTES).toBe(25 * 1024 * 1024);
    // A guard on the direction of any future edit: the cap exists because the demo store inlines
    // proofs and the real one pays per gigabyte. Raising it past a phone's minute of 1080p would
    // put a single proof above both.
    expect(MAX_VIDEO_BYTES).toBeLessThan(100 * 1024 * 1024);
  });
});
