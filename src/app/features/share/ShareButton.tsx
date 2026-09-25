/**
 * The quiet second line under «К пути →» on the summary. It used to share a line of text; now it
 * opens the share sheet with the story picture (`ShareSheet`).
 */
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useT } from '@/app/hooks/useT';
import type { SessionSummary } from '@/lib/training/types';
import { ShareSheet } from './ShareSheet';

export interface ShareButtonProps {
  summary: SessionSummary;
  workoutName: string;
  courseName: string;
  stars: number | null;
  reps: number | null;
}

export function ShareButton(props: ShareButtonProps) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" fullWidth onClick={() => setOpen(true)}>
        {t('app.summaryShare')}
      </Button>
      <ShareSheet open={open} onClose={() => setOpen(false)} {...props} />
    </>
  );
}
