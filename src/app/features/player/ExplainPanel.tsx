import { clsx } from 'clsx';
import { useRef, useState } from 'react';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { useT } from '@/app/hooks/useT';
import type { TKey } from '@/i18n/index';
import type { PrescribedItem } from '@/lib/training/types';
import { contraindicationsFor, findExercise, limitationLabel } from './model';

type Tab = 'technique' | 'muscles' | 'cautions';

const TABS: { id: Tab; key: TKey }[] = [
  { id: 'technique', key: 'app.playerTabTechnique' },
  { id: 'muscles', key: 'app.playerTabMuscles' },
  { id: 'cautions', key: 'app.playerTabCautions' },
];

/** Swipe distance (px) that opens or closes the details. */
const SWIPE_PX = 40;

export interface ExplainPanelProps {
  exerciseId: string;
  item: PrescribedItem;
}

/**
 * What the coach would say about a movement, kept out of the way: the video does the explaining,
 * and the words wait behind a handle. A tap or an upward swipe opens three tabs — technique,
 * muscles, cautions — and a downward swipe puts them away again.
 */
export function ExplainPanel({ exerciseId, item }: ExplainPanelProps) {
  const { t, l } = useT();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('technique');
  const touchY = useRef<number | null>(null);
  const exercise = findExercise(exerciseId);
  if (!exercise) return null;

  const onTouchStart = (e: React.TouchEvent) => {
    touchY.current = e.touches[0]?.clientY ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchY.current;
    touchY.current = null;
    const end = e.changedTouches[0]?.clientY;
    if (start === null || end === undefined) return;
    const dy = end - start;
    if (dy < -SWIPE_PX) setOpen(true);
    else if (dy > SWIPE_PX) setOpen(false);
  };

  const cautions = contraindicationsFor(exercise, item.loadLabel);

  return (
    <div className="flex flex-col gap-3" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mx-auto flex items-center gap-1.5 rounded-pill bg-white/5 px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-white/10"
      >
        <Icon name={open ? 'minus' : 'plus'} size={14} />
        {t(open ? 'app.playerDetailsHide' : 'app.playerDetails')}
      </button>

      {open ? (
        <div className="flex flex-col gap-3">
          <div role="tablist" className="flex gap-1.5">
            {TABS.map((x) => (
              <button
                key={x.id}
                type="button"
                role="tab"
                aria-selected={tab === x.id}
                onClick={() => setTab(x.id)}
                className={clsx(
                  'flex-1 rounded-pill px-2 py-1.5 text-xs font-semibold transition-colors',
                  tab === x.id ? 'bg-accent text-on-primary' : 'bg-white/5 text-muted',
                )}
              >
                {t(x.key)}
              </button>
            ))}
          </div>

          {tab === 'technique' ? (
            <div className="flex flex-col gap-2">
              <ol className="flex flex-col gap-2">
                {exercise.howTo.map((line, i) => (
                  <li key={i} className="flex gap-3 rounded-inner bg-surface-2 px-4 py-3">
                    <span className="tabular shrink-0 font-semibold text-accent">{i + 1}</span>
                    <span className="text-[15px]">{l(line)}</span>
                  </li>
                ))}
              </ol>
              {exercise.cues.length > 0 ? (
                <ul className="flex flex-col gap-1.5 px-1 text-sm text-muted">
                  {exercise.cues.slice(0, 3).map((cue, i) => (
                    <li key={i} className="flex gap-2">
                      <span aria-hidden="true">•</span>
                      <span>{l(cue)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {tab === 'muscles' ? (
            <div className="flex flex-wrap gap-2">
              {exercise.muscles.map((m) => (
                <Chip key={m}>{t(`seo.muscle_${m}` as TKey)}</Chip>
              ))}
            </div>
          ) : null}

          {tab === 'cautions' ? (
            cautions.length > 0 ? (
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted">{t('app.playerCautionsLead')}</span>
                <div className="flex flex-wrap gap-2">
                  {cautions.map((lim) => (
                    <Chip key={lim} tone="warning">
                      {limitationLabel(t, lim)}
                    </Chip>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">{t('app.playerCautionsNone')}</p>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
