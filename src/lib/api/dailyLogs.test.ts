import { describe, expect, it } from 'vitest';
import { stepProofPath } from './dailyLogs';

/*
 * The shape is load-bearing: the storage policy in migration 0012 reads the second folder of the
 * path and compares it to the caller, so a path built any other way is refused by the database
 * rather than silently landing somewhere it should not.
 */
describe('stepProofPath', () => {
  const user = '00000000-0000-0000-0000-0000000000aa';

  it('files one object per day under the owner', () => {
    expect(stepProofPath(user, '2026-09-12', 'jpg')).toBe(`steps/${user}/2026-09-12.jpg`);
    // Same day twice is the same path, so a second screenshot replaces the first.
    expect(stepProofPath(user, '2026-09-12', 'png')).toBe(`steps/${user}/2026-09-12.png`);
  });

  it('refuses to let an extension become part of the path', () => {
    expect(stepProofPath(user, '2026-09-12', '../../etc/passwd')).toBe(
      `steps/${user}/2026-09-12.jpg`,
    );
    expect(stepProofPath(user, '2026-09-12', '')).toBe(`steps/${user}/2026-09-12.jpg`);
    expect(stepProofPath(user, '2026-09-12', 'JPG')).toBe(`steps/${user}/2026-09-12.jpg`);
  });
});
