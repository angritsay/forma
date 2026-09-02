import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { PageTitle } from '@/components/ui/PageTitle';
import { useT } from '@/app/hooks/useT';
import { useCountdown } from '@/app/hooks/useTimer';
import { parseIntField, REPS_MAX } from './draft';
import { TimerDisplay } from './TimerDisplay';
import type { StepProps } from './types';

const SQUAT_TIMER_SEC = 60;

export function StepTestSquats({ draft, update }: StepProps) {
  const { t } = useT();
  const timer = useCountdown(SQUAT_TIMER_SEC);

  const setReps = (value: string) =>
    update({
      tests: { ...draft.tests, squats60s: parseIntField(value, REPS_MAX) },
      skipped: { ...draft.skipped, squats: false },
    });

  const status = timer.done
    ? t('app.onbTimerDone')
    : timer.running
      ? t('app.onbSquatsCounting')
      : t('app.onbTimerReady');

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        eyebrow={t('app.onbTestsEyebrow', { n: 2 })}
        title={t('app.onbSquatsTitle')}
        subtitle={t('app.onbSquatsLead')}
      />
      <TimerDisplay seconds={timer.remainingSec} done={timer.done} status={status}>
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
        {!timer.done && timer.remainingSec !== SQUAT_TIMER_SEC ? (
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
        label={t('app.onbSquatsInput')}
        hint={t('app.onbSquatsInputHint')}
        placeholder="0"
        autoFocus={timer.done}
        value={draft.tests.squats60s ?? ''}
        onChange={(e) => setReps(e.target.value)}
      />
    </div>
  );
}
