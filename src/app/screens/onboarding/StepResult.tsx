import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { PageTitle } from '@/components/ui/PageTitle';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { RingProgress } from '@/components/ui/RingProgress';
import { useT } from '@/app/hooks/useT';
import { computeFitnessIndex } from '@/lib/training/assessment';
import type { FitnessComponent } from '@/lib/training/types';
import { draftToTrainingProfile } from './draft';
import { COMPONENT_LABEL, LEVEL_LABEL, LEVEL_MEANING } from './labels';
import type { StepProps } from './types';

const COMPONENT_ORDER: readonly FitnessComponent[] = [
  'pushups',
  'squats',
  'plank',
  'activity',
  'experience',
];

export function StepResult({ draft }: StepProps) {
  const { t } = useT();
  const profile = useMemo(() => draftToTrainingProfile(draft), [draft]);
  const assessment = useMemo(() => (profile ? computeFitnessIndex(profile) : null), [profile]);

  if (!assessment) return null;

  const missing = new Set(assessment.missing ?? []);
  const levelName = t(LEVEL_LABEL[assessment.level]);

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        eyebrow={t('app.onbResultEyebrow')}
        title={t('app.onbResultLevel', { n: assessment.level, name: levelName })}
        align="center"
      />
      <div className="flex justify-center">
        <RingProgress
          value={assessment.index / 100}
          size={200}
          stroke={14}
          label={t('app.onbResultEyebrow')}
          valueText={`${assessment.index} / 100`}
        >
          <span className="tabular text-6xl font-bold leading-none">{assessment.index}</span>
          <span className="mt-1 text-sm text-muted">{t('app.onbIndexOutOf')}</span>
        </RingProgress>
      </div>
      <Card gradient>
        <p className="text-[15px] font-medium leading-relaxed">
          {t(LEVEL_MEANING[assessment.level])}
        </p>
      </Card>
      <Card level={2} className="flex flex-col gap-4">
        <h2 className="eyebrow">{t('app.onbResultComponents')}</h2>
        <ul className="flex flex-col gap-3">
          {COMPONENT_ORDER.map((c) => {
            const value = assessment.components[c];
            const imputed = missing.has(c);
            return (
              <li key={c} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className={imputed ? 'text-muted' : undefined}>
                    {t(COMPONENT_LABEL[c])}
                    {imputed ? ` · ${t('app.onbTestSkipped')}` : ''}
                  </span>
                  <span className="tabular font-semibold">{value}</span>
                </div>
                <ProgressBar
                  value={value / 100}
                  size="sm"
                  tone={imputed ? 'primary' : 'accent'}
                  label={t(COMPONENT_LABEL[c])}
                />
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
