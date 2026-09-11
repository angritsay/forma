/**
 * One day of a course.
 *
 * This is the centre of the authoring flow: choose what kind of day it is, write what it is for,
 * attach a picture, and — for a training day — either pick a workout already in the library or
 * build a new one on the spot. Picking from the library is what makes the library worth having:
 * a flow written once is dropped into every course that uses it.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PUBLIC_BUCKET } from '@/lib/api/storage';
import type { AdminCourseDayPatch, AdminCourseDayRow, CourseDayKind } from '@/lib/api/types';
import type { CustomWorkoutSummary } from '@/lib/api/types';
import type { TKey } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import { TextList } from '@/app/features/admin/forms/TextList';
import { MediaField } from '@/app/features/admin/media/MediaField';
import { WorkoutPickerSheet } from './WorkoutPickerSheet';

const KINDS: CourseDayKind[] = ['workout', 'rest', 'test', 'benchmark', 'milestone'];

const KIND_KEY: Record<CourseDayKind, TKey> = {
  workout: 'app.dayKindWorkout',
  rest: 'app.dayKindRest',
  test: 'app.dayKindTest',
  benchmark: 'app.dayKindBenchmark',
  milestone: 'app.dayKindMilestone',
};

/** The kinds that play a workout. Mirrors the check constraint on admin_course_days. */
export const TRAINING_KINDS: readonly CourseDayKind[] = ['workout', 'test', 'benchmark'];

export interface DayEditorProps {
  courseSlugId: string;
  day: AdminCourseDayRow;
  /** The workout this day plays, when it has one. */
  workout: CustomWorkoutSummary | null;
  onPatch: (patch: AdminCourseDayPatch) => void;
  onBuildNewWorkout: () => void;
  onEditWorkout: (workoutId: string) => void;
  onDelete: () => void;
}

export function DayEditor({
  courseSlugId,
  day,
  workout,
  onPatch,
  onBuildNewWorkout,
  onEditWorkout,
  onDelete,
}: DayEditorProps) {
  const { t } = useT();
  const [picking, setPicking] = useState(false);
  const [week, setWeek] = useState(String(day.week));
  const [dayNo, setDayNo] = useState(String(day.day));
  const [steps, setSteps] = useState(String(day.stepsGoal ?? 8000));

  const content = day.content;
  const isTraining = TRAINING_KINDS.includes(day.kind);

  const setContent = (patch: Partial<typeof content>) =>
    onPatch({ content: { ...content, ...patch } });

  /*
   * Changing a day's kind must clear the workout when the new kind cannot have one, or the write
   * is rejected by admin_course_days_workout_required. Doing it here rather than letting the
   * database complain keeps the editor from ever showing an error the coach cannot act on.
   */
  const setKind = (kind: CourseDayKind) =>
    onPatch(TRAINING_KINDS.includes(kind) ? { kind } : { kind, customWorkoutId: null });

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Select<CourseDayKind>
          label={t('app.dayKind')}
          value={day.kind}
          onChange={setKind}
          options={KINDS.map((k) => ({ value: k, label: t(KIND_KEY[k]) }))}
        />
        <Input
          label={t('app.dayWeek')}
          type="number"
          inputMode="numeric"
          min={1}
          max={16}
          value={week}
          onChange={(e) => setWeek(e.target.value)}
          onBlur={() => onPatch({ week: Math.max(1, Math.min(16, Number(week) || 1)) })}
        />
        <Input
          label={t('app.dayNumber')}
          hint={t('app.dayNumberHint')}
          type="number"
          inputMode="numeric"
          min={1}
          max={7}
          value={dayNo}
          onChange={(e) => setDayNo(e.target.value)}
          onBlur={() => onPatch({ day: Math.max(1, Math.min(7, Number(dayNo) || 1)) })}
        />
      </div>

      <Input
        label={t('app.dayTitle')}
        value={content.title?.ru ?? ''}
        onChange={(e) => setContent({ title: { ru: e.target.value } })}
      />
      <Input
        label={t('app.daySubtitle')}
        hint={t('app.daySubtitleHint')}
        value={content.subtitle?.ru ?? ''}
        onChange={(e) => setContent({ subtitle: { ru: e.target.value } })}
      />
      <TextList
        label={t('app.dayBody')}
        hint={t('app.dayBodyHint')}
        values={(content.body ?? []).map((v) => v.ru ?? '')}
        onChange={(values) => setContent({ body: values.map((v) => ({ ru: v })) })}
        placeholder={t('app.courseParagraph')}
      />

      {isTraining ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted">{t('app.dayWorkout')}</span>
          {workout ? (
            <div className="flex flex-wrap items-center gap-3 rounded-inner border border-border p-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{workout.title}</span>
                <span className="tabular mt-0.5 block text-xs text-muted">
                  {workout.estSec
                    ? t('app.nodeDuration', { min: Math.max(1, Math.round(workout.estSec / 60)) })
                    : null}
                </span>
              </span>
              <Button variant="secondary" onClick={() => onEditWorkout(workout.id)}>
                {t('app.builderEditBtn')}
              </Button>
              <Button variant="ghost" onClick={() => setPicking(true)}>
                {t('app.dayChangeWorkout')}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-inner border border-dashed border-border p-4">
              <p className="text-sm text-muted">{t('app.dayNoWorkout')}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  icon={<Icon name="search" size={16} />}
                  onClick={() => setPicking(true)}
                >
                  {t('app.dayPickWorkout')}
                </Button>
                <Button
                  variant="secondary"
                  icon={<Icon name="plus" size={16} />}
                  onClick={onBuildNewWorkout}
                >
                  {t('app.dayBuildWorkout')}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {day.kind === 'rest' ? (
        <Input
          label={t('app.dayStepsGoal')}
          hint={t('app.dayStepsGoalHint')}
          type="number"
          inputMode="numeric"
          min={1000}
          max={50000}
          step={500}
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          onBlur={() =>
            onPatch({ stepsGoal: Math.max(1000, Math.min(50000, Number(steps) || 8000)) })
          }
        />
      ) : null}

      {isTraining ? (
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={day.deload}
            onChange={(e) => onPatch({ deload: e.target.checked })}
          />
          {t('app.dayDeload')}
        </label>
      ) : null}

      <MediaField
        label={t('app.dayImage')}
        hint={t('app.dayImageHint')}
        value={content.image ?? null}
        onChange={(image) => setContent({ image })}
        bucket={PUBLIC_BUCKET}
        pathBase={`courses/${courseSlugId}/${day.nodeId}`}
        accept="image/*"
        maxBytes={8 * 1024 * 1024}
      />

      <Button variant="ghost" icon={<Icon name="close" size={16} />} onClick={onDelete}>
        {t('app.dayDelete')}
      </Button>

      <WorkoutPickerSheet
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(w) => {
          onPatch({ customWorkoutId: w.id });
          setPicking(false);
        }}
      />
    </div>
  );
}
