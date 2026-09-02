import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { PageTitle } from '@/components/ui/PageTitle';
import { useT } from '@/app/hooks/useT';
import { useStopwatch } from '@/app/hooks/useTimer';
import { parseIntField, PLANK_MAX_SEC } from './draft';
import { TimerDisplay } from './TimerDisplay';
import type { StepProps } from './types';

export function StepTestPlank({ draft, update }: StepProps) {
  const { t } = useT();
  const watch = useStopwatch();

  const setSeconds = (plankSec: number | undefined) =>
    update({
      tests: { ...draft.tests, plankSec },
      skipped: { ...draft.skipped, plank: false },
    });

  const stop = () => {
    const ms = watch.stop();
    setSeconds(Math.min(PLANK_MAX_SEC, Math.round(ms / 1000)));
  };

  const status = watch.running
    ? t('app.onbPlankHolding')
    : watch.elapsedMs > 0
      ? t('app.onbPlankRecorded', { s: Math.round(watch.elapsedMs / 1000) })
      : t('app.onbTimerReady');

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        eyebrow={t('app.onbTestsEyebrow', { n: 3 })}
        title={t('app.onbPlankTitle')}
        subtitle={t('app.onbPlankLead')}
      />
      <TimerDisplay
        seconds={watch.elapsedSec}
        status={status}
        done={!watch.running && watch.elapsedMs > 0}
      >
        {watch.running ? (
          <Button variant="danger" size="lg" onClick={stop} icon={<Icon name="pause" size={18} />}>
            {t('app.onbTimerStop')}
          </Button>
        ) : (
          <Button size="lg" onClick={watch.start} icon={<Icon name="play" size={18} />}>
            {watch.elapsedMs > 0 ? t('common.continue') : t('common.start')}
          </Button>
        )}
        {!watch.running && watch.elapsedMs > 0 ? (
          <Button
            variant="ghost"
            onClick={() => {
              watch.reset();
              setSeconds(undefined);
            }}
          >
            {t('app.onbTimerReset')}
          </Button>
        ) : null}
      </TimerDisplay>
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        max={PLANK_MAX_SEC}
        label={t('app.onbPlankInput')}
        hint={t('app.onbSquatsInputHint')}
        placeholder="0"
        value={draft.tests.plankSec ?? ''}
        onChange={(e) => setSeconds(parseIntField(e.target.value, PLANK_MAX_SEC))}
      />
    </div>
  );
}
