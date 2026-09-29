/**
 * «Поделиться» from the club: a small ghost button that opens the share sheet on the club's own
 * story — today's task by name with «+12», the day, the streak and the place, or the week's
 * recap with the week's points (`clubStoryData`, `story/data.ts`).
 *
 * The owner's loop ends in pride — «поделиться» is the last verb in her brief — and the workout
 * summary already had the picture and the six designs for it. The club borrows them whole: same
 * sheet, same targets, same templates, its own facts. A ghost button and not the gradient: the
 * card's one gradient button is the one that delivers the task, and sharing is what you do
 * after, not instead.
 *
 * The caption is the club's name, the same facts in words and **the member's referral link**
 * (0051): whoever taps it and pays gives both of them a month. The code is fetched the first
 * time the sheet opens and the plain app link stands in until it arrives, or if it never does —
 * a share must not wait on a second request. The code is also cached for the site
 * (`rememberMyRef`, `src/lib/referral/mine.ts`), whose invite links then carry it too.
 */
import { useEffect, useMemo, useState } from 'react';
import { getMyReferralCode } from '@/lib/api/referral';
import { referralUrl } from '@/app/features/referral/link';
import { useSession } from '@/app/store/session';
import { rememberMyRef } from '@/lib/referral/mine';
import { Button } from '@/components/ui/Button';
import { useT } from '@/app/hooks/useT';
import { appLink } from '@/app/features/share/appLink';
import { ShareSheet } from '@/app/features/share/ShareSheet';
import { clubShareText, clubStoryData, type ClubStoryInput } from '@/app/features/share/story/data';
import { BRAND } from '@content/site/brand';

export interface ClubShareProps {
  /** Picks the design: the task id for a day, `marathonId:week` for a recap. */
  seed: string;
  headline: string;
  points: number | null;
  pointsMode: ClubStoryInput['pointsMode'];
  day: number | null;
  streak: number | null;
  place: number | null;
  className?: string;
}

export function ClubShare({
  seed,
  headline,
  points,
  pointsMode,
  day,
  streak,
  place,
  className,
}: ClubShareProps) {
  const { t, locale } = useT();
  const [open, setOpen] = useState(false);
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
  // The date is fixed when the button mounts, so the picture does not change under the sheet.
  const [at] = useState(() => new Date().toISOString());
  const input = useMemo<ClubStoryInput>(
    () => ({
      clubName: t('app.marathonTitle'),
      headline,
      at,
      points,
      pointsMode,
      day,
      streak,
      place,
      domain: BRAND.domain,
    }),
    [t, at, headline, points, pointsMode, day, streak, place],
  );
  const data = useMemo(() => clubStoryData(t, locale, input), [t, locale, input]);
  const text = useMemo(() => clubShareText(t, locale, input), [t, locale, input]);
  return (
    <>
      <Button variant="ghost" size="sm" className={className} onClick={() => setOpen(true)}>
        {t('app.summaryShare')}
      </Button>
      <ShareSheet
        open={open}
        onClose={() => setOpen(false)}
        data={data}
        text={text}
        link={link}
        seed={seed}
      />
    </>
  );
}
