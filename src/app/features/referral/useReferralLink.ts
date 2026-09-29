/**
 * The member's own referral link (0051) for a share, fetched the first time the sheet opens.
 *
 * Every share carries it — the club's day and recap (`ClubShare`) and the finished workout
 * (`ShareButton`). The workout story went out with the plain app link, so a friend who came from
 * it earned the inviter nothing (audit item 9). The plain link (`appLink`) stands in until the
 * code arrives, or if it never does: a share must not wait on a second request. The code is also
 * cached for the site (`rememberMyRef`), whose invite links then carry it too.
 */
import { useEffect, useState } from 'react';
import { getMyReferralCode } from '@/lib/api/referral';
import { rememberMyRef } from '@/lib/referral/mine';
import { useT } from '@/app/hooks/useT';
import { appLink } from '@/app/features/share/appLink';
import { useSession } from '@/app/store/session';
import { referralUrl } from './link';

export function useReferralLink(open: boolean): string {
  const { locale } = useT();
  const displayName = useSession((s) => s.profile?.displayName ?? null);
  const [link, setLink] = useState<string>(() => appLink());
  useEffect(() => {
    if (!open) return;
    let alive = true;
    getMyReferralCode()
      .then((code) => {
        if (!alive || !code) return;
        rememberMyRef(code, displayName);
        setLink(referralUrl(code, displayName, locale));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [open, displayName, locale]);
  return link;
}
