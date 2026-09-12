/** Small shared pieces of the marathon admin, kept out of the screens so both can use them. */
import type { TKey } from '@/i18n/index';
import type { MarathonStatus } from '@/lib/api/types';

/** Same rule as `marathons.slug` in SQL; the server re-validates anyway. */
export const MARATHON_SLUG_RE = /^[a-z0-9_]{2,40}$/;

export function statusKey(status: MarathonStatus): TKey {
  switch (status) {
    case 'draft':
      return 'app.mAdminStatusDraft';
    case 'active':
      return 'app.mAdminStatusActive';
    case 'finished':
      return 'app.mAdminStatusFinished';
    case 'archived':
      return 'app.mAdminStatusArchived';
  }
}
