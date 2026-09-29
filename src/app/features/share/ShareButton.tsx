/**
 * The quiet second line under «К пути →» on the summary. It used to share a line of text; now it
 * opens the share sheet with the story picture (`ShareSheet`).
 *
 * The picture's facts are built here (`workoutStoryData`) rather than in the sheet, which draws
 * whatever it is handed — the club shares through the same sheet with its own facts. The link
 * that travels with it is the athlete's referral link (`useReferralLink`), as the club's is: a
 * friend who comes from a workout post earns the inviter the same +30 days.
 */
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useT } from '@/app/hooks/useT';
import { useReferralLink } from '@/app/features/referral/useReferralLink';
import { shareText } from '@/app/features/player/summaryModel';
import type { SessionSummary } from '@/lib/training/types';
import { BRAND } from '@content/site/brand';
import { ShareSheet } from './ShareSheet';
import { workoutStoryData } from './story/data';

export interface ShareButtonProps {
  summary: SessionSummary;
  workoutName: string;
  courseName: string;
  stars: number | null;
  reps: number | null;
}

export function ShareButton({ summary, workoutName, courseName, stars, reps }: ShareButtonProps) {
  const { t, locale } = useT();
  const [open, setOpen] = useState(false);
  const link = useReferralLink(open);
  const data = useMemo(
    () =>
      workoutStoryData(t, locale, {
        workoutName,
        courseName,
        completedAt: summary.completedAt,
        durationSec: summary.durationSec,
        calories: summary.calories,
        completion: summary.completion,
        reps,
        points: summary.points,
        stars,
        domain: BRAND.domain,
      }),
    [t, locale, workoutName, courseName, summary, reps, stars],
  );
  return (
    <>
      <Button variant="ghost" size="sm" fullWidth onClick={() => setOpen(true)}>
        {t('app.summaryShare')}
      </Button>
      <ShareSheet
        open={open}
        onClose={() => setOpen(false)}
        data={data}
        text={shareText(t, workoutName, summary)}
        link={link}
        seed={summary.sessionId ?? summary.completedAt}
      />
    </>
  );
}
