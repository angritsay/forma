import { useRef, useState } from 'react';
import { Chip } from '@/components/ui/Chip';
import { Glyph } from '@/components/ui/Icon';
import { Tabs, tabPanelId } from '@/components/ui/Tabs';
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
      {/* The handle is a word with a glyph, not a pill: + to open, − to close. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="control-label tap-target-y mx-auto flex items-center gap-2 text-[11px] text-muted transition-colors duration-150 ease-(--ease-out) hover:text-text"
      >
        <Glyph size={14}>{open ? '−' : '+'}</Glyph>
        {t(open ? 'app.playerDetailsHide' : 'app.playerDetails')}
      </button>

      {open ? (
        <div className="flex flex-col gap-3">
          <Tabs
            variant="fill"
            tabs={TABS.map((x) => ({ id: x.id, label: t(x.key) }))}
            value={tab}
            onChange={setTab}
          />

          <div id={tabPanelId(tab)} role="tabpanel" aria-labelledby={`tab-${tab}`}>
            {tab === 'technique' ? (
              <div className="flex flex-col gap-2">
                {/* Numbered and ruled — 01/02/03 down the left, the step beside it. */}
                <ol className="flex flex-col">
                  {exercise.howTo.map((line, i) => (
                    <li
                      key={i}
                      className="flex gap-3.5 border-t border-border py-3 first:border-t-0"
                    >
                      <span className="numeral tabular w-6 shrink-0 text-sm text-muted">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[15px]">{l(line)}</span>
                    </li>
                  ))}
                </ol>
                {exercise.cues.length > 0 ? (
                  <ul className="flex flex-col gap-1.5 border-t border-border pt-3 text-sm text-muted">
                    {exercise.cues.slice(0, 3).map((cue, i) => (
                      <li key={i} className="flex gap-2">
                        <Glyph size={12} className="mt-1 shrink-0 text-muted-2">
                          ›
                        </Glyph>
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
        </div>
      ) : null}
    </div>
  );
}
