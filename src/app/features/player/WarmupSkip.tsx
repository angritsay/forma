/**
 * «Пропустить разминку», offered on the screen and then gone.
 *
 * The way out of the warm-up lived only inside the pause overlay, which means it could not be
 * found without first stopping the session — a door you have to close the room to see. It is
 * still there, for whoever looks later; this is the same door, shown once, at the moment it is
 * worth showing: the first seconds of the first movement, when somebody who warmed up an hour ago
 * is deciding whether to sit through it again.
 *
 * Then it fades out on its own. A skip button that stays on screen through a warm-up is an
 * argument for skipping it, every second, and the coach's warm-up is the part of the session he
 * is least willing to lose.
 */
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { Chip } from '@/components/ui/Chip';
import { useT } from '@/app/hooks/useT';

/** How long it stays. Long enough to read and reach, short enough not to nag. */
const VISIBLE_MS = 6000;

export interface WarmupSkipProps {
  onSkip: () => void;
}

export function WarmupSkip({ onSkip }: WarmupSkipProps) {
  const { t } = useT();
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setGone(true), VISIBLE_MS);
    return () => clearTimeout(id);
  }, []);

  return (
    <div
      className={clsx(
        'flex justify-center transition-opacity duration-700 ease-(--ease-out)',
        gone && 'pointer-events-none opacity-0',
      )}
      // Out of the tab order once it has faded, so it is not a control nobody can see.
      aria-hidden={gone}
      inert={gone}
    >
      <Chip onClick={onSkip}>{t('app.playerSkipWarmup')}</Chip>
    </div>
  );
}
