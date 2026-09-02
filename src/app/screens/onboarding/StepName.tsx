import { Input } from '@/components/ui/Input';
import { PageTitle } from '@/components/ui/PageTitle';
import { useT } from '@/app/hooks/useT';
import { NAME_MAX } from './draft';
import type { StepProps } from './types';

export function StepName({ draft, update, next }: StepProps) {
  const { t } = useT();
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if ((draft.displayName ?? '').trim()) next();
      }}
    >
      <PageTitle title={t('app.onbNameTitle')} subtitle={t('app.onbNameLead')} />
      <Input
        name="displayName"
        autoComplete="given-name"
        autoFocus
        maxLength={NAME_MAX}
        placeholder={t('app.onbNamePlaceholder')}
        value={draft.displayName ?? ''}
        onChange={(e) => update({ displayName: e.target.value.slice(0, NAME_MAX) })}
        enterKeyHint="next"
      />
    </form>
  );
}
