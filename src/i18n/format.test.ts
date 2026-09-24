import { describe, expect, it } from 'vitest';
import { formatBytes } from './index';

describe('formatBytes', () => {
  it('writes a size the way a file manager does', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(840)).toBe('840 B');
    expect(formatBytes(12 * 1024)).toBe('12 KB');
    expect(formatBytes(1.4 * 1024 * 1024)).toBe('1.4 MB');
    expect(formatBytes(64 * 1024 * 1024)).toBe('64 MB');
    expect(formatBytes(2.1 * 1024 * 1024 * 1024)).toBe('2.1 GB');
  });

  it('shows a dash for a size Storage did not report', () => {
    expect(formatBytes(Number.NaN)).toBe('—');
    expect(formatBytes(-1)).toBe('—');
  });
});
