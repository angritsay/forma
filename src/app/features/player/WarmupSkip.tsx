/**
 * «Пропустить разминку», offered for as long as the warm-up lasts.
 *
 * It lived inside the pause overlay first — a door you had to close the room to see. Then it was
 * a chip that showed itself for six seconds and faded, on the theory that a skip button standing
 * there through a warm-up is an argument for skipping it.
 *
 * That theory was wrong about who is reading it. The person who wants this button is the one who
 * warmed up an hour ago, or who has ten minutes and is choosing to spend them on the work; they
 * do not always decide in the first six seconds, and a control that has quietly gone is not a
 * considered design, it is the app deciding it knows better. The coach's warm-up is defended by
 * being good and by being the default, not by hiding the exit.
 *
 * So it stays for the whole warm-up, and it is still in the pause overlay for whoever looks there.
 */
import { Chip } from '@/components/ui/Chip';
import { useT } from '@/app/hooks/useT';

export interface WarmupSkipProps {
  onSkip: () => void;
}

export function WarmupSkip({ onSkip }: WarmupSkipProps) {
  const { t } = useT();
  return (
    <div className="flex justify-center">
      <Chip onClick={onSkip}>{t('app.playerSkipWarmup')}</Chip>
    </div>
  );
}
