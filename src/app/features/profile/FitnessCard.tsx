import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RingProgress } from '@/components/ui/RingProgress';
import { useT } from '@/app/hooks/useT';
import { LEVEL_LABEL } from '@/app/screens/onboarding/labels';
import type { Fitness } from './model';

export interface FitnessCardProps {
  fitness: Fitness | null;
  onRetake: () => void;
  onSetup: () => void;
}

/** Fitness index ring, training level and the "retake tests" entry point. */
export function FitnessCard({ fitness, onRetake, onSetup }: FitnessCardProps) {
  const { t } = useT();
  if (!fitness) {
    return (
      <Card level={2} className="flex flex-col gap-3">
        <p className="text-[15px] text-muted">{t('app.profileFitnessMissing')}</p>
        <Button variant="secondary" onClick={onSetup}>
          {t('app.profileFitnessSetup')}
        </Button>
      </Card>
    );
  }
  return (
    <Card level={2} className="flex items-center gap-4">
      <RingProgress
        value={fitness.index / 100}
        size={72}
        stroke={8}
        label={t('app.profileFitnessEyebrow')}
        valueText={`${fitness.index} / 100`}
      >
        <span className="tabular text-lg font-bold leading-none">{fitness.index}</span>
      </RingProgress>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-col">
          <span className="eyebrow">{t('app.profileFitnessEyebrow')}</span>
          <span className="text-[15px] font-semibold">
            {t('app.profileFitnessLevel', {
              n: fitness.level,
              name: t(LEVEL_LABEL[fitness.level]),
            })}
          </span>
        </div>
        <Button variant="secondary" className="self-start" onClick={onRetake}>
          {t('app.profileRetakeTests')}
        </Button>
      </div>
    </Card>
  );
}
