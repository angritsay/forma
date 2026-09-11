/**
 * The workout builder form: a title, a description, and three sections (warm-up / main / cool-down),
 * each a list of exercises picked from the catalogue with reps-or-seconds and a rest. Produces a
 * CustomWorkoutInput for the API. v1 sections are round-based circuits; the main section can repeat.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { CustomWorkoutInput } from '@/lib/api/customWorkouts';
import type { ExerciseCatalogRow } from '@/lib/api/types';
import type { CustomSectionKind, CustomWorkoutStructure } from '@/lib/training/customWorkout';
import { EXERCISE_BY_ID } from '@/content/registry';
import type { TKey } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import { ExercisePickerSheet } from './ExercisePickerSheet';

interface DraftItem {
  key: string;
  exerciseId: string;
  nameRu: string;
  unit: 'reps' | 'seconds';
  target: number;
  perSide: boolean;
  restAfterSec: number;
  note: string;
}

interface DraftSection {
  kind: CustomSectionKind;
  sets: number;
  restBetweenRoundsSec: number;
  items: DraftItem[];
}

export interface WorkoutEditorProps {
  initialTitle?: string;
  initialDescription?: string | null;
  initialStructure?: CustomWorkoutStructure;
  saving: boolean;
  onSave: (input: CustomWorkoutInput) => void;
  onCancel: () => void;
}

const KINDS: CustomSectionKind[] = ['warmup', 'main', 'cooldown'];
const SECTION_KEY: Record<CustomSectionKind, TKey> = {
  warmup: 'app.playerSectionWarmup',
  main: 'app.playerSectionMain',
  cooldown: 'app.playerSectionCooldown',
};

let counter = 0;
const nextKey = () => `it_${(counter += 1)}`;

function emptySections(initial?: CustomWorkoutStructure): DraftSection[] {
  return KINDS.map((kind) => {
    const found = initial?.sections.find((s) => s.kind === kind);
    return {
      kind,
      sets: found?.sets ?? 1,
      restBetweenRoundsSec: found?.restBetweenRoundsSec ?? (kind === 'main' ? 60 : 0),
      items: (found?.items ?? []).map((it) => ({
        key: nextKey(),
        exerciseId: it.exerciseId,
        nameRu: EXERCISE_BY_ID.get(it.exerciseId)?.name.ru ?? it.exerciseId,
        unit: it.unit,
        target: it.target,
        perSide: it.perSide === true,
        restAfterSec: it.restAfterSec,
        note: it.note ?? '',
      })),
    };
  });
}

const clampInt = (v: string, lo: number, hi: number, fallback: number) => {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(lo, Math.min(hi, n));
};

export function WorkoutEditor({
  initialTitle = '',
  initialDescription = '',
  initialStructure,
  saving,
  onSave,
  onCancel,
}: WorkoutEditorProps) {
  const { t } = useT();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? '');
  const [sections, setSections] = useState<DraftSection[]>(() => emptySections(initialStructure));
  const [pickerFor, setPickerFor] = useState<CustomSectionKind | null>(null);

  const totalItems = sections.reduce((n, s) => n + s.items.length, 0);
  const canSave = title.trim().length > 0 && totalItems > 0 && !saving;

  const updateSection = (kind: CustomSectionKind, patch: Partial<DraftSection>) =>
    setSections((prev) => prev.map((s) => (s.kind === kind ? { ...s, ...patch } : s)));

  const updateItem = (kind: CustomSectionKind, key: string, patch: Partial<DraftItem>) =>
    setSections((prev) =>
      prev.map((s) =>
        s.kind === kind
          ? { ...s, items: s.items.map((it) => (it.key === key ? { ...it, ...patch } : it)) }
          : s,
      ),
    );

  const removeItem = (kind: CustomSectionKind, key: string) =>
    setSections((prev) =>
      prev.map((s) =>
        s.kind === kind ? { ...s, items: s.items.filter((it) => it.key !== key) } : s,
      ),
    );

  const moveItem = (kind: CustomSectionKind, key: string, dir: -1 | 1) =>
    setSections((prev) =>
      prev.map((s) => {
        if (s.kind !== kind) return s;
        const i = s.items.findIndex((it) => it.key === key);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= s.items.length) return s;
        const items = [...s.items];
        [items[i]!, items[j]!] = [items[j]!, items[i]!];
        return { ...s, items };
      }),
    );

  const addExercise = (kind: CustomSectionKind, ex: ExerciseCatalogRow) => {
    const unit: 'reps' | 'seconds' = ex.unit === 'seconds' ? 'seconds' : 'reps';
    const item: DraftItem = {
      key: nextKey(),
      exerciseId: ex.id,
      nameRu: ex.nameRu,
      unit,
      target: unit === 'seconds' ? 30 : 10,
      perSide: false,
      restAfterSec: 0,
      note: '',
    };
    setSections((prev) =>
      prev.map((s) => (s.kind === kind ? { ...s, items: [...s.items, item] } : s)),
    );
    setPickerFor(null);
  };

  const save = () => {
    const structure: CustomWorkoutStructure = {
      sections: sections
        .filter((s) => s.items.length > 0)
        .map((s) => ({
          kind: s.kind,
          format: 'circuit',
          sets: s.kind === 'main' ? Math.max(1, s.sets) : 1,
          restBetweenRoundsSec: s.kind === 'main' ? Math.max(0, s.restBetweenRoundsSec) : 0,
          items: s.items.map((it) => ({
            exerciseId: it.exerciseId,
            unit: it.unit,
            target: Math.max(1, it.target),
            ...(it.perSide ? { perSide: true } : {}),
            restAfterSec: Math.max(0, it.restAfterSec),
            ...(it.note.trim() ? { note: it.note.trim() } : {}),
          })),
        })),
    };
    onSave({ title: title.trim(), description: description.trim() || null, structure });
  };

  return (
    <div className="flex flex-col gap-5 py-2">
      <div className="flex flex-col gap-3 lg:flex-row">
        <Input
          wrapperClassName="lg:flex-1"
          aria-label={t('app.builderTitle')}
          placeholder={t('app.builderTitlePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          wrapperClassName="lg:flex-[2]"
          aria-label={t('app.builderDescription')}
          placeholder={t('app.builderDescriptionPlaceholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {sections.map((section) => (
        <section
          key={section.kind}
          className="flex flex-col gap-3 border-t border-border pt-4 pb-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg">{t(SECTION_KEY[section.kind])}</h3>
            {section.kind === 'main' ? (
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-muted">
                  {t('app.builderRounds')}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={20}
                    value={section.sets}
                    onChange={(e) =>
                      updateSection('main', { sets: clampInt(e.target.value, 1, 20, 1) })
                    }
                    className="tabular w-14 rounded-control border border-border bg-transparent px-2 py-1 text-center text-text"
                  />
                </label>
              </div>
            ) : null}
          </div>

          {section.items.length === 0 ? (
            <p className="text-sm text-muted">{t('app.builderSectionEmpty')}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {section.items.map((it, i) => (
                <li
                  key={it.key}
                  className="flex flex-col gap-2 rounded-inner border border-border p-3 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center lg:gap-4"
                >
                  <div className="flex items-center justify-between gap-2 lg:contents">
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium">
                      {it.nameRu}
                    </span>
                    <div className="flex shrink-0 items-center gap-1 lg:order-3">
                      <IconButton
                        size="sm"
                        variant="ghost"
                        label={t('app.builderMoveUp')}
                        icon={<Icon name="chevron" size={16} className="-rotate-90" />}
                        disabled={i === 0}
                        onClick={() => moveItem(section.kind, it.key, -1)}
                      />
                      <IconButton
                        size="sm"
                        variant="ghost"
                        label={t('app.builderMoveDown')}
                        icon={<Icon name="chevron" size={16} className="rotate-90" />}
                        disabled={i === section.items.length - 1}
                        onClick={() => moveItem(section.kind, it.key, 1)}
                      />
                      <IconButton
                        size="sm"
                        variant="ghost"
                        label={t('app.builderRemove')}
                        icon={<Icon name="close" size={16} />}
                        onClick={() => removeItem(section.kind, it.key)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:order-2 lg:flex-nowrap">
                    <SegmentedControl<'reps' | 'seconds'>
                      value={it.unit}
                      onChange={(unit) => updateItem(section.kind, it.key, { unit })}
                      options={[
                        { value: 'reps', label: t('app.builderUnitReps') },
                        { value: 'seconds', label: t('app.builderUnitSeconds') },
                      ]}
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={999}
                      value={it.target}
                      aria-label={t('app.builderAmount')}
                      onChange={(e) =>
                        updateItem(section.kind, it.key, {
                          target: clampInt(e.target.value, 1, 999, 1),
                        })
                      }
                      className="tabular w-16 rounded-control border border-border bg-transparent px-2 py-1.5 text-center text-text"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-muted">
                      <input
                        type="checkbox"
                        checked={it.perSide}
                        onChange={(e) =>
                          updateItem(section.kind, it.key, { perSide: e.target.checked })
                        }
                      />
                      {t('app.builderPerSide')}
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-muted">
                      {t('app.builderRest')}
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={600}
                        value={it.restAfterSec}
                        onChange={(e) =>
                          updateItem(section.kind, it.key, {
                            restAfterSec: clampInt(e.target.value, 0, 600, 0),
                          })
                        }
                        className="tabular w-16 rounded-control border border-border bg-transparent px-2 py-1.5 text-center text-text"
                      />
                    </label>
                  </div>

                  <Input
                    aria-label={t('app.builderNote')}
                    placeholder={t('app.builderNotePlaceholder')}
                    value={it.note}
                    onChange={(e) => updateItem(section.kind, it.key, { note: e.target.value })}
                  />
                </li>
              ))}
            </ul>
          )}

          <Button
            variant="ghost"
            icon={<Icon name="plus" size={16} />}
            onClick={() => setPickerFor(section.kind)}
          >
            {t('app.builderAddExercise')}
          </Button>
        </section>
      ))}

      <div className="flex gap-2">
        <Button variant="ghost" fullWidth onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button fullWidth loading={saving} disabled={!canSave} onClick={save}>
          {t('common.save')}
        </Button>
      </div>

      <ExercisePickerSheet
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        onPick={(ex) => pickerFor && addExercise(pickerFor, ex)}
      />
    </div>
  );
}
