import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { PageTitle } from '@/components/ui/PageTitle';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useT } from '@/app/hooks/useT';
import { useCountdown } from '@/app/hooks/useTimer';
import { parseIntField, REPS_MAX } from './draft';
import { TimerDisplay } from './TimerDisplay';
import type { StepProps } from './types';

const PUSHUP_TIMER_SEC = 120;

type Mode = 'full' | 'knees';

export function StepTestPushups({ draft, update }: StepProps) {
  const { t } = useT();
  const timer = useCountdown(PUSHUP_TIMER_SEC);
  const mode: Mode = draft.tests.pushupsOnKnees ? 'knees' : 'full';

  const setReps = (value: string) =>
    update({
      tests: { ...draft.tests, pushups: parseIntField(value, REPS_MAX) },
      skipped: { ...draft.skipped, pushups: false },
    });

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        eyebrow={t('app.onbTestsEyebrow', { n: 1 })}
        title={t('app.onbPushupsTitle')}
        subtitle={t('app.onbPushupsLead')}
      />
      <SegmentedControl<Mode>
        fullWidth
        label={t('app.onbPushupsTitle')}
        value={mode}
        onChange={(m) => update({ tests: { ...draft.tests, pushupsOnKnees: m === 'knees' } })}
        options={[
          { value: 'full', label: t('app.onbPushupsFull') },
          { value: 'knees', label: t('app.onbPushupsKnees') },
        ]}
      />
      <TimerDisplay
        seconds={timer.remainingSec}
        done={timer.done}
        status={timer.done ? t('app.onbTimerDone') : t('app.onbTimerOptional')}
      >
        {timer.running ? (
          <Button variant="secondary" onClick={timer.pause} icon={<Icon name="pause" size={18} />}>
            {t('app.onbTimerPause')}
          </Button>
        ) : (
          <Button
            variant={timer.done ? 'secondary' : 'primary'}
            onClick={timer.done ? timer.restart : timer.start}
            icon={<Icon name={timer.done ? 'refresh' : 'play'} size={18} />}
          >
            {timer.done ? t('app.onbTimerReset') : t('common.start')}
          </Button>
        )}
        {!timer.done && timer.remainingSec !== PUSHUP_TIMER_SEC ? (
          <Button variant="ghost" onClick={timer.reset}>
            {t('app.onbTimerReset')}
          </Button>
        ) : null}
      </TimerDisplay>
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        max={REPS_MAX}
        label={t('app.onbPushupsInput')}
        placeholder="0"
        value={draft.tests.pushups ?? ''}
        onChange={(e) => setReps(e.target.value)}
      />
    </div>
  );
}
