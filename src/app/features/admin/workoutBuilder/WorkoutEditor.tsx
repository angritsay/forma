/**
 * The workout builder form: a title, a description, and three sections (warm-up / main / cool-down),
 * each a list of exercises picked from the catalogue with reps-or-seconds and a rest. Produces a
 * CustomWorkoutInput for the API. Sections written here are round-based circuits; the main section
 * can repeat.
 *
 * It also has to *edit* workouts it did not write. A course imported from content brings EMOMs,
 * AMRAPs, for-time pieces and Tabatas, whose timing this form has no controls for — so every
 * section and item keeps the object it came from, and saving merges the edited fields over it
 * rather than rebuilding from the form's own state. Without that, opening a 12-minute EMOM and
 * changing one rep count would drop the twelve minutes.
 */
import { clsx } from 'clsx';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { CustomWorkoutInput } from '@/lib/api/customWorkouts';
import type { ExerciseCatalogRow } from '@/lib/api/types';
import type {
  CustomSectionKind,
  CustomWorkoutItem,
  CustomWorkoutSection,
  CustomWorkoutStructure,
} from '@/lib/training/customWorkout';
import type { ExerciseUnit } from '@/content/schema';
import { findExercise } from '@/content/catalogue';
import type { TKey } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import { ExercisePickerSheet } from './ExercisePickerSheet';

interface DraftItem {
  key: string;
  exerciseId: string;
  nameRu: string;
  unit: ExerciseUnit;
  target: number;
  perSide: boolean;
  restAfterSec: number;
  note: string;
  /** The item this was read from, so fields the form has no control for survive a save. */
  source?: CustomWorkoutItem;
}

interface DraftSection {
  kind: CustomSectionKind;
  sets: number;
  restBetweenRoundsSec: number;
  items: DraftItem[];
  /** The section this was read from; see the note at the top of the file. */
  source?: CustomWorkoutSection;
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
      source: found,
      items: (found?.items ?? []).map((it) => ({
        key: nextKey(),
        exerciseId: it.exerciseId,
        nameRu: findExercise(it.exerciseId)?.name.ru ?? it.exerciseId,
        unit: it.unit,
        target: it.target,
        perSide: it.perSide === true,
        restAfterSec: it.restAfterSec,
        note: it.note ?? '',
        source: it,
      })),
    };
  });
}

const clampInt = (v: string, lo: number, hi: number, fallback: number) => {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(lo, Math.min(hi, n));
};

/*
 * The small number boxes of a row — the amount, the rest, the rounds — drawn as the kit's field
 * one step down: 40px, --surface-2, a hairline, a white border on focus, the figure set tabular in
 * the display face so a column of them lines up. Kept small on purpose: a row holds three.
 */
const NUM_INPUT =
  'numeral tabular h-10 w-16 border border-border bg-surface-2 text-center text-[15px] text-text outline-none transition-colors duration-150 ease-(--ease-out) focus:border-primary';

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
    /*
     * Merge over the source rather than rebuild. Only the fields this form actually shows are
     * overwritten; a section's format, its EMOM minutes or AMRAP length, an item's load — anything
     * that came from an imported course and has no control here — is carried through untouched.
     */
    const structure: CustomWorkoutStructure = {
      sections: sections
        .filter((s) => s.items.length > 0)
        .map((s) => ({
          ...s.source,
          kind: s.kind,
          format: s.source?.format ?? 'circuit',
          sets: s.kind === 'main' ? Math.max(1, s.sets) : (s.source?.sets ?? 1),
          restBetweenRoundsSec:
            s.kind === 'main'
              ? Math.max(0, s.restBetweenRoundsSec)
              : (s.source?.restBetweenRoundsSec ?? 0),
          items: s.items.map((it) => ({
            ...it.source,
            exerciseId: it.exerciseId,
            unit: it.unit,
            target: Math.max(1, it.target),
            ...(it.perSide ? { perSide: true } : { perSide: undefined }),
            restAfterSec: Math.max(0, it.restAfterSec),
            ...(it.note.trim() ? { note: it.note.trim() } : { note: undefined }),
          })),
        })),
    };
    onSave({ title: title.trim(), description: description.trim() || null, structure });
  };

  return (
    <div className="flex flex-col gap-6 py-2">
      {/*
       * Visible labels, not just `aria-label`. These two carried a placeholder alone, which
       * disappears the moment you type — so a half-filled form stopped saying which field was
       * which, and the rest of the builder labels everything.
       */}
      <div className="flex flex-col gap-3 lg:flex-row">
        <Input
          wrapperClassName="lg:flex-1"
          label={t('app.builderTitle')}
          placeholder={t('app.builderTitlePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          wrapperClassName="lg:flex-[2]"
          label={t('app.builderDescription')}
          placeholder={t('app.builderDescriptionPlaceholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {sections.map((section, sectionNo) => (
        <section key={section.kind} className="flex flex-col gap-3 border-t border-border pt-4">
          {/*
           * A block header is a kicker — the section's number and name in capitals — the way the
           * player announces «01 РАЗМИНКА». The rounds control sits on the same line for the main
           * block, which is the only one that repeats.
           */}
          <div className="flex items-center justify-between gap-3">
            <h3 className="eyebrow flex items-center gap-2">
              <span className="numeral tabular">{String(sectionNo + 1).padStart(2, '0')}</span>
              {t(SECTION_KEY[section.kind])}
            </h3>
            {section.kind === 'main' ? (
              <label className="flex items-center gap-2 text-[13px] text-muted">
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
                  className={clsx(NUM_INPUT, 'w-14')}
                />
              </label>
            ) : null}
          </div>

          {section.items.length === 0 ? (
            <p className="text-[15px] text-muted">{t('app.builderSectionEmpty')}</p>
          ) : (
            <ul className="flex flex-col">
              {section.items.map((it, i) => (
                /*
                 * A row is ruled off from the one above by a hairline and led by its number; the
                 * name, the unit switch and the amounts follow, the note last. On a wide screen
                 * the same pieces spread across one line.
                 */
                <li
                  key={it.key}
                  className="flex gap-3 border-t border-border py-3 first:border-t-0 first:pt-0"
                >
                  <span className="numeral tabular w-6 shrink-0 pt-2.5 text-[13px] text-muted-2">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-2 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center lg:gap-4">
                    <div className="flex items-center justify-between gap-2 lg:contents">
                      <span className="min-w-0 flex-1 truncate pt-2 text-[15px] font-medium lg:pt-0">
                        {it.nameRu}
                      </span>
                      <div className="flex shrink-0 items-center lg:order-3">
                        {/*
                         * Reordering is two angle glyphs turned upright — ‹ up, › down — and the
                         * cross removes; all three are punctuation in muted grey, not icons.
                         */}
                        <IconButton
                          size="sm"
                          variant="ghost"
                          label={t('app.builderMoveUp')}
                          icon={
                            <Glyph size={16} className="rotate-90">
                              ‹
                            </Glyph>
                          }
                          disabled={i === 0}
                          className="text-muted-2 hover:text-text"
                          onClick={() => moveItem(section.kind, it.key, -1)}
                        />
                        <IconButton
                          size="sm"
                          variant="ghost"
                          label={t('app.builderMoveDown')}
                          icon={
                            <Glyph size={16} className="rotate-90">
                              ›
                            </Glyph>
                          }
                          disabled={i === section.items.length - 1}
                          className="text-muted-2 hover:text-text"
                          onClick={() => moveItem(section.kind, it.key, 1)}
                        />
                        <IconButton
                          size="sm"
                          variant="ghost"
                          label={t('app.builderRemove')}
                          icon="close"
                          className="text-muted-2 hover:text-text"
                          onClick={() => removeItem(section.kind, it.key)}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:order-2 lg:flex-nowrap">
                      {/*
                       * Metres and calories exist in the content model and arrive with an imported
                       * course, but nothing this builder writes uses them, and a control with four
                       * choices to serve two is worse for the two. Such an item shows its unit as a
                       * label and keeps it; the amount stays editable.
                       */}
                      {it.unit === 'reps' || it.unit === 'seconds' ? (
                        <SegmentedControl<'reps' | 'seconds'>
                          value={it.unit}
                          onChange={(unit) => updateItem(section.kind, it.key, { unit })}
                          options={[
                            { value: 'reps', label: t('app.builderUnitReps') },
                            { value: 'seconds', label: t('app.builderUnitSeconds') },
                          ]}
                        />
                      ) : (
                        <span className="control-label text-[12px] text-muted">
                          {t(it.unit === 'meters' ? 'app.exUnitMeters' : 'app.exUnitCalories')}
                        </span>
                      )}
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
                        className={NUM_INPUT}
                      />
                      <label className="tap-target-y flex items-center gap-2 text-[13px] text-muted">
                        <input
                          type="checkbox"
                          className="size-4 accent-primary"
                          checked={it.perSide}
                          onChange={(e) =>
                            updateItem(section.kind, it.key, { perSide: e.target.checked })
                          }
                        />
                        {t('app.builderPerSide')}
                      </label>
                      <label className="flex items-center gap-2 text-[13px] text-muted">
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
                          className={NUM_INPUT}
                        />
                      </label>
                    </div>

                    <Input
                      aria-label={t('app.builderNote')}
                      placeholder={t('app.builderNotePlaceholder')}
                      value={it.note}
                      onChange={(e) => updateItem(section.kind, it.key, { note: e.target.value })}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            icon={<Glyph size={14}>+</Glyph>}
            onClick={() => setPickerFor(section.kind)}
          >
            {t('app.builderAddExercise')}
          </Button>
        </section>
      ))}

      {/* The one white button on the screen is Save; Cancel is text beside it. */}
      <div className="flex gap-2 border-t border-border pt-5">
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
