import { Button } from '@/components/ui/Button';
import { useT } from '@/app/hooks/useT';
import { DisplayTitle } from '@/app/features/home/DisplayTitle';

export interface WarmupGateStepProps {
  onGo: () => void;
  onSkip: () => void;
}

/** "Сначала разомнёмся?" — the first thing a session asks. One tap starts, the other skips. */
export function WarmupGateStep({ onGo, onSkip }: WarmupGateStepProps) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-6">
      <DisplayTitle as="h2" text={t('app.playerGateTitle')} className="text-4xl" />
      <div className="flex flex-col gap-2">
        <Button size="lg" fullWidth onClick={onGo} data-autofocus>
          {t('app.playerGo')}
        </Button>
        <Button variant="ghost" fullWidth onClick={onSkip}>
          {t('app.playerGateSkip')}
        </Button>
      </div>
    </div>
  );
}
