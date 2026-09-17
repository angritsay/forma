import { Input } from '@/components/ui/Input';
import { useT } from '@/app/hooks/useT';
import { NAME_MAX } from './draft';
import { Question } from './Question';
import type { StepProps } from './types';

/**
 * The question and the field. «Это имя будет видно в рейтинге» went: a name is a name.
 *
 * «ТВОЁ имя» rather than «Как тебя называть?» — the designer's note, and the shorter line is also
 * the one the display device is built for: the first word heavy, the rest light.
 */
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
      <Question text={t('app.onbNameTitle')} />
      <Input
        name="displayName"
        autoComplete="given-name"
        autoFocus
        maxLength={NAME_MAX}
        aria-label={t('app.onbNameTitle')}
        placeholder={t('app.onbNamePlaceholder')}
        value={draft.displayName ?? ''}
        onChange={(e) => update({ displayName: e.target.value.slice(0, NAME_MAX) })}
        enterKeyHint="next"
      />
    </form>
  );
}
