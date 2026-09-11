import { clsx } from 'clsx';
import { useMemo } from 'react';
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

/**
 * The result: the index as the screen's one big number inside the kit's ring, what the level
 * means as a paragraph under a hairline, and the five components as a numbered, ruled list with
 * a 4px bar each. No course is in scope yet, so the ring and the bars are white.
 */
export function StepResult({ draft }: StepProps) {
  const { t } = useT();
  const profile = useMemo(() => draftToTrainingProfile(draft), [draft]);
  const assessment = useMemo(() => (profile ? computeFitnessIndex(profile) : null), [profile]);

  if (!assessment) return null;

  const missing = new Set(assessment.missing ?? []);
  const levelName = t(LEVEL_LABEL[assessment.level]);

  return (
    <div className="flex flex-col gap-8">
      <PageTitle
        eyebrow={t('app.onbResultEyebrow')}
        title={t('app.onbResultLevel', { n: assessment.level, name: levelName })}
      />
      <RingProgress
        value={assessment.index / 100}
        size={180}
        stroke={8}
        label={t('app.onbResultEyebrow')}
        valueText={`${assessment.index} / 100`}
      >
        <span className="display text-7xl">{assessment.index}</span>
        <span className="eyebrow mt-1">{t('app.onbIndexOutOf')}</span>
      </RingProgress>
      <p className="hairline pt-5 text-[15px] leading-relaxed">
        {t(LEVEL_MEANING[assessment.level])}
      </p>
      <section className="flex flex-col gap-3">
        <h2 className="eyebrow">{t('app.onbResultComponents')}</h2>
        <ul className="flex flex-col border-b border-border">
          {COMPONENT_ORDER.map((c, i) => {
            const value = assessment.components[c];
            const imputed = missing.has(c);
            return (
              <li
                key={c}
                className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-t border-border py-3"
              >
                <span className="numeral text-sm text-muted-2">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className={clsx('text-sm', imputed && 'text-muted')}>
                  {t(COMPONENT_LABEL[c])}
                  {imputed ? ` · ${t('app.onbTestSkipped')}` : ''}
                </span>
                <span className="numeral tabular text-sm">{value}</span>
                {/*
                 * A skipped test is scored from the rest, so its bar is drawn at half strength:
                 * the same white, honestly fainter.
                 */}
                <ProgressBar
                  value={value / 100}
                  tone="primary"
                  label={t(COMPONENT_LABEL[c])}
                  className={clsx('col-span-2 col-start-2', imputed && 'opacity-50')}
                />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
