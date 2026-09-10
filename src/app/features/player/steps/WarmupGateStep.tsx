import { Button } from '@/components/ui/Button';
import { useT } from '@/app/hooks/useT';

export interface WarmupGateStepProps {
  onGo: () => void;
  onSkip: () => void;
}

/** "Сначала разомнёмся?" — the first thing a session asks. One tap starts, the other skips. */
export function WarmupGateStep({ onGo, onSkip }: WarmupGateStepProps) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-4xl">{t('app.playerGateTitle')}</h2>
        <p className="text-[15px] text-muted">{t('app.playerGateBody')}</p>
      </div>
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
