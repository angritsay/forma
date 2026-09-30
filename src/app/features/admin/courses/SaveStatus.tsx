/**
 * The autosave's one line (0059): «Сохраняю…», «Сохранено», or «Не сохранилось» with «Повторить».
 *
 * The course editor has no Save button (`useAutosave`), so this line is the only way to know
 * whether what is on screen is what is in the database. It used to be nowhere: a failed write
 * looked exactly like a saved one.
 */
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { useT } from '@/app/hooks/useT';
import type { SaveState } from '@/app/features/admin/courses/useAutosave';

/** Two savers on one screen read as one: a failure anywhere wins, then a write in flight. */
export function combineSaveStates(...states: SaveState[]): SaveState {
  if (states.includes('error')) return 'error';
  if (states.includes('saving')) return 'saving';
  if (states.includes('saved')) return 'saved';
  return 'idle';
}

export function SaveStatus({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  const { t } = useT();
  if (state === 'idle') return null;
  if (state === 'error') {
    return (
      <div role="alert" className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-3">
        <span className="text-[13px] text-danger">{t('app.courseSaveFailed')}</span>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }
  return (
    <p
      role="status"
      aria-live="polite"
      className={clsx('pt-3 text-[13px]', state === 'saved' ? 'text-muted-2' : 'text-muted')}
    >
      {t(state === 'saving' ? 'app.courseSaving' : 'app.courseSaved')}
    </p>
  );
}
