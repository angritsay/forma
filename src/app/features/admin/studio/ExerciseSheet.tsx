/**
 * «Какое это упражнение?»: search the whole exercise base, or type a name that is not there and
 * create the exercise on the spot (`createExercise`, id made from the name — `exerciseId.ts`).
 *
 * A new exercise is created «На повторы» or «На время» — its `unit`, which decides whether the
 * player counts reps or runs a timer, and so what the «Превью» step shows. Every existing row says
 * which it is.
 *
 * Unlike the workout builder's picker this offers every exercise, filmed or not: the cutter is
 * where an unfilmed one gets its video. One that already has a video is marked, because labelling
 * a clip with it means the render will replace that video.
 */
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { createExercise, listExerciseCatalog } from '@/lib/api/exercises';
import type { ExerciseCatalogRow } from '@/lib/api/types';
import { LoadingBlock } from '@/app/components/LoadingBlock';
import { adminErrorTitle } from '@/app/features/admin/adminError';
import { useT } from '@/app/hooks/useT';
import { exerciseIdFromName } from './exerciseId';
import { unitLabel } from './unitLabel';

export interface PickedExercise {
  id: string;
  name: string;
  unit: ExerciseCatalogRow['unit'];
}

/** The units a new exercise can be created with here: the two the preview tells apart. */
type NewUnit = 'reps' | 'seconds';

export interface ExerciseSheetProps {
  open: boolean;
  onClose: () => void;
  /** Null clears the label. */
  onPick: (exercise: PickedExercise | null) => void;
  /** Show «Без упражнения» (the piece has a label to clear). */
  canClear: boolean;
  onToast: (kind: 'success' | 'error', title: string) => void;
}

let cache: ExerciseCatalogRow[] | null = null;

export function ExerciseSheet({ open, onClose, onPick, canClear, onToast }: ExerciseSheetProps) {
  const tr = useT();
  const { t, locale } = tr;
  const [rows, setRows] = useState<ExerciseCatalogRow[]>(cache ?? []);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(cache ? 'ready' : 'loading');
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!open || cache) return;
    let alive = true;
    setStatus('loading');
    listExerciseCatalog()
      .then((all) => {
        cache = all;
        if (alive) {
          setRows(all);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (alive) setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, [open, attempt]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const nameOf = (e: ExerciseCatalogRow) => (locale === 'en' && e.nameEn ? e.nameEn : e.nameRu);

  const q = query.trim();
  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (e) =>
        e.nameRu.toLowerCase().includes(needle) ||
        (e.nameEn ?? '').toLowerCase().includes(needle) ||
        e.id.includes(needle),
    );
  }, [rows, q]);

  const exact = rows.some(
    (e) => e.nameRu.toLowerCase() === q.toLowerCase() || e.id === q.toLowerCase(),
  );
  const newId = q ? exerciseIdFromName(q, new Set(rows.map((e) => e.id))) : null;

  const create = async (unit: NewUnit) => {
    if (!newId) {
      onToast('error', t('app.studioExerciseNameShort'));
      return;
    }
    setCreating(true);
    try {
      const row = await createExercise({ id: newId, nameRu: q, unit });
      cache = [...(cache ?? rows), row];
      setRows(cache);
      onToast('success', t('app.studioExerciseCreated', { name: row.nameRu }));
      onPick({ id: row.id, name: row.nameRu, unit: row.unit });
    } catch (e) {
      onToast('error', adminErrorTitle(tr, e, 'app.studioExerciseCreateError'));
    } finally {
      setCreating(false);
    }
  };

  const rowClass =
    'flex w-full items-center gap-3 border-t border-border py-3 text-left transition-colors duration-150 ease-(--ease-out) hover:bg-surface-2 active:bg-surface-3 disabled:opacity-50';

  return (
    <Sheet open={open} onClose={onClose} title={t('app.studioExerciseSheetTitle')}>
      <div className="flex flex-col gap-3">
        <Input
          type="search"
          autoComplete="off"
          spellCheck={false}
          aria-label={t('app.studioExerciseSearch')}
          placeholder={t('app.studioExerciseSearch')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {status === 'loading' ? (
          <LoadingBlock />
        ) : status === 'error' ? (
          <div className="flex flex-col items-start gap-2 py-4">
            <p className="text-[15px] text-muted">{t('app.exLoadError')}</p>
            <button
              type="button"
              className="text-[15px] font-medium underline"
              onClick={() => setAttempt((n) => n + 1)}
            >
              {t('common.retry')}
            </button>
          </div>
        ) : (
          <ul className="flex max-h-[55dvh] flex-col overflow-y-auto">
            {q && !exact ? (
              <li className="flex flex-col gap-2 border-t border-border py-3">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-medium">
                      {t('app.studioExerciseCreate', { name: q })}
                    </span>
                    <span className="text-[13px] text-muted">
                      {newId ? t('app.studioExerciseCreateHint') : t('app.studioExerciseNameShort')}
                    </span>
                  </span>
                  <Glyph size={16} className="shrink-0 text-muted-2">
                    +
                  </Glyph>
                </span>
                {/* The unit is asked here, not later: the preview is a timer or a count by it. */}
                <span className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!newId}
                    loading={creating}
                    onClick={() => void create('reps')}
                  >
                    {t('app.studioUnitReps')}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!newId}
                    loading={creating}
                    onClick={() => void create('seconds')}
                  >
                    {t('app.studioUnitSeconds')}
                  </Button>
                </span>
              </li>
            ) : null}
            {canClear && !q ? (
              <li>
                <button type="button" onClick={() => onPick(null)} className={rowClass}>
                  <span className="flex-1 text-[15px] text-muted">{t('app.studioNoLabel')}</span>
                </button>
              </li>
            ) : null}
            {filtered.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onPick({ id: e.id, name: e.nameRu, unit: e.unit })}
                  className={rowClass}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-medium">{nameOf(e)}</span>
                    <span className="truncate font-mono text-[12px] text-muted-2">
                      {e.id} · {t(unitLabel(e.unit))}
                      {e.videoRu ? ` · ${t('app.studioExerciseHasVideo')}` : ''}
                    </span>
                  </span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && !q ? (
              <li className="border-t border-border py-6 text-[15px] text-muted">
                {t('app.builderNoMatches')}
              </li>
            ) : null}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
