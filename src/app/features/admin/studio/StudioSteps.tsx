/**
 * The studio's stepper: «Нарезка · Названия · Цвет · Превью» for one filmed video. A step that is
 * not open yet (`flow.ts`) is shown but cannot be pressed, with the reason under the row.
 */
import { clsx } from 'clsx';
import type { MediaClip } from '@/lib/api/mediaStudio';
import type { TKey } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import { openSteps, STUDIO_STEPS, type StudioStep } from './flow';

const LABEL: Record<StudioStep, TKey> = {
  cut: 'app.studioStepCut',
  name: 'app.studioStepName',
  color: 'app.studioStepColor',
  preview: 'app.studioStepPreview',
};

export interface StudioStepsProps {
  current: StudioStep;
  clips: readonly Pick<MediaClip, 'exerciseId' | 'status'>[];
  onGo: (step: StudioStep) => void;
}

export function StudioSteps({ current, clips, onGo }: StudioStepsProps) {
  const { t } = useT();
  const open = openSteps(clips);
  const closedNext = STUDIO_STEPS.find((s) => !open[s]);
  return (
    <nav aria-label={t('app.studioStepsLabel')} className="flex flex-col gap-1.5 pt-3">
      <ol className="grid grid-cols-4 gap-1">
        {STUDIO_STEPS.map((step, i) => {
          const active = step === current;
          return (
            <li key={step} className="min-w-0">
              <button
                type="button"
                disabled={!open[step]}
                aria-current={active ? 'step' : undefined}
                onClick={() => onGo(step)}
                className={clsx(
                  'flex w-full flex-col items-start gap-0.5 border-t-2 pt-1.5 text-left transition-colors duration-150 ease-(--ease-out) disabled:opacity-40',
                  active ? 'border-accent text-text' : 'border-border text-muted hover:text-text',
                )}
              >
                <span className="numeral tabular text-[11px] text-muted-2">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="truncate text-[13px] font-medium">{t(LABEL[step])}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {closedNext ? (
        <p className="text-[12px] text-muted-2">
          {closedNext === 'name' ? t('app.studioStepNameClosed') : t('app.studioStepColorClosed')}
        </p>
      ) : null}
    </nav>
  );
}
