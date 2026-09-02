import { PageTitle } from '@/components/ui/PageTitle';
import { useT } from '@/app/hooks/useT';
import type { SessionTime } from '@/lib/training/types';
import { SESSION_TIMES } from './draft';
import { SESSION_TIME_DESC } from './labels';
import { OptionList } from './OptionList';
import type { StepProps } from './types';

export function StepTime({ draft, update }: StepProps) {
  const { t } = useT();
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={t('app.onbTimeTitle')} subtitle={t('app.onbTimeLead')} />
      <OptionList<SessionTime>
        label={t('app.onbTimeTitle')}
        value={draft.timePerSessionMin}
        onChange={(timePerSessionMin) => update({ timePerSessionMin })}
        options={SESSION_TIMES.map((m) => ({
          value: m,
          label: t('common.minutesShort', { n: m }),
          description: t(SESSION_TIME_DESC[m]),
        }))}
      />
    </div>
  );
}
