/**
 * Today's tasks: the short list of things that are asked of the athlete besides the session.
 *
 * There is normally one — «напиши, сколько ты сегодня прошёл» — and sometimes two, when the
 * assessment was postponed at sign-up and is waiting to be done. That is the whole point of the
 * shape: a list that is usually one line long, set as a ruled row rather than as a card, so it
 * cannot grow into a second screen of its own.
 *
 * A finished task is not removed. It is ticked, because "done" is information on a screen whose
 * only question is what is left today, and a row that vanishes reads as a row that never existed.
 */
import { clsx } from 'clsx';
import { Glyph } from '@/components/ui/Icon';
import { useT } from '@/app/hooks/useT';

export interface TodayTask {
  key: string;
  label: string;
  /** One quiet line under the label: what has been logged so far, what the task costs. */
  hint?: string;
  done?: boolean;
  onOpen: () => void;
}

export function TodayTasks({ items }: { items: readonly TodayTask[] }) {
  const { t } = useT();
  if (items.length === 0) return null;
  return (
    <section className="border-t border-border pt-7">
      <h2 className="eyebrow">{t('app.homeTasksTitle')}</h2>
      <ul className="mt-4 flex flex-col border-b border-border">
        {items.map((item, i) => (
          <li key={item.key} className="border-t border-border">
            <button
              type="button"
              onClick={item.onOpen}
              className="flex w-full items-center gap-4 py-4.5 text-left transition-colors duration-150 ease-(--ease-out) hover:bg-surface-2"
            >
              <span className="numeral w-8 shrink-0 text-sm text-muted-2">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1">
                <span className={clsx('block text-[15px]', item.done && 'text-muted')}>
                  {item.label}
                </span>
                {item.hint ? (
                  <span className="mt-0.5 block text-[13px] text-muted-2">{item.hint}</span>
                ) : null}
              </span>
              <Glyph size={14} className="shrink-0 text-muted-2">
                {item.done ? '✓' : '→'}
              </Glyph>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
