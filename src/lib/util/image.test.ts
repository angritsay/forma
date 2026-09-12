import { describe, expect, it } from 'vitest';
import { extensionFor } from './image';

describe('extensionFor', () => {
  it('names the common image types', () => {
    expect(extensionFor(new Blob([], { type: 'image/jpeg' }))).toBe('jpg');
    expect(extensionFor(new Blob([], { type: 'image/png' }))).toBe('png');
    expect(extensionFor(new Blob([], { type: 'image/webp' }))).toBe('webp');
    // What an iPhone hands over when the camera roll has not converted it.
    expect(extensionFor(new Blob([], { type: 'image/HEIC' }))).toBe('heic');
  });

  it('falls back rather than inventing an extension', () => {
    expect(extensionFor(new Blob([], { type: '' }))).toBe('jpg');
    expect(extensionFor(new Blob([], { type: 'application/octet-stream' }))).toBe('jpg');
  });
});
