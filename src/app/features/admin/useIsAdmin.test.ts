/**
 * A failed `is_admin()` is unknown, not «no» (0059): it is not cached, so the admin is not sent
 * home for the rest of the session over one dropped request, and a retry asks again.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const isAdmin = vi.fn<() => Promise<boolean>>();
vi.mock('@/lib/api/admin', () => ({ isAdmin: () => isAdmin() }));

const { adminCheckFailed, checkAdmin, retryAdminCheck } = await import('./useIsAdmin');

describe('checkAdmin', () => {
  beforeEach(() => isAdmin.mockReset());

  it('does not cache a failure, and answers after a retry', async () => {
    isAdmin.mockRejectedValueOnce(new Error('Failed to fetch'));
    expect(await checkAdmin('u1')).toBeNull();
    expect(adminCheckFailed('u1')).toBe(true);

    retryAdminCheck('u1');
    expect(adminCheckFailed('u1')).toBe(false);
    isAdmin.mockResolvedValueOnce(true);
    expect(await checkAdmin('u1')).toBe(true);
    expect(adminCheckFailed('u1')).toBe(false);
  });

  it('caches an answer, «no» included', async () => {
    isAdmin.mockResolvedValueOnce(false);
    expect(await checkAdmin('u2')).toBe(false);
    expect(await checkAdmin('u2')).toBe(false);
    expect(isAdmin).toHaveBeenCalledTimes(1);
  });
});
