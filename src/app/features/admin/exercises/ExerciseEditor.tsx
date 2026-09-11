/**
 * The exercise editor: author a movement the compiled library does not have, or mark up one it
 * does.
 *
 * The two cases are genuinely different and the form says so. An exercise generated from
 * `content/exercises` is re-seeded by 0007 on every content change, so editing its name or muscles
 * here would be undone the next time someone touches the files — those fields are shown read-only.
 * The columns the seed never writes (video, still, tags, teaching text) stay editable, because
 * that markup is the whole reason the table is writable at all.
 *
 * An exercise created here is marked `is_custom` and is nobody else's: every field is editable and
 * the seed leaves it alone.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { EQUIPMENT, MOVEMENT_PATTERNS, MUSCLE_GROUPS } from '@/content/schema';
import type { ExerciseCatalogRow, ExerciseDraft } from '@/lib/api/types';
import type { TKey } from '@/i18n/index';
import { PRIVATE_BUCKET, PUBLIC_BUCKET } from '@/lib/api/storage';
import { useT } from '@/app/hooks/useT';
import { ChipToggles, TextList } from '@/app/features/admin/forms/TextList';
import { MediaField } from '@/app/features/admin/media/MediaField';

/** Matches the id check on public.exercises. */
export const EXERCISE_ID_RE = /^[a-z0-9_]{2,60}$/;

const UNITS = ['reps', 'seconds', 'meters', 'calories'] as const;
type Unit = (typeof UNITS)[number];

const UNIT_KEY: Record<Unit, TKey> = {
  reps: 'app.exUnitReps',
  seconds: 'app.exUnitSeconds',
  meters: 'app.exUnitMeters',
  calories: 'app.exUnitCalories',
};

export interface ExerciseEditorProps {
  /** null to create; a row to edit. */
  initial: ExerciseCatalogRow | null;
  /** Course ids a video may be filed under, so its folder gates the right entitlement. */
  courseIds: readonly string[];
  saving: boolean;
  onSave: (draft: ExerciseDraft) => void;
  onCancel: () => void;
}

const ru = (list: { ru?: string; en?: string }[]): string[] =>
  list.map((v) => v.ru ?? v.en ?? '').filter((v) => v.length > 0);

export function ExerciseEditor({
  initial,
  courseIds,
  saving,
  onSave,
  onCancel,
}: ExerciseEditorProps) {
  const { t } = useT();
  const isNew = initial === null;
  // A seeded row's descriptive fields are owned by content/exercises and re-seeded by 0007.
  const ownFields = isNew || initial.isCustom;

  const [id, setId] = useState(initial?.id ?? '');
  const [nameRu, setNameRu] = useState(initial?.nameRu ?? '');
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? '');
  const [shortNameRu, setShortNameRu] = useState(initial?.shortNameRu ?? '');
  const [descriptionRu, setDescriptionRu] = useState(initial?.descriptionRu ?? '');
  const [unit, setUnit] = useState<Unit>(initial?.unit ?? 'seconds');
  const [secondsPerRep, setSecondsPerRep] = useState(String(initial?.secondsPerRep ?? 3));
  const [level, setLevel] = useState(String(initial?.level ?? 1));
  const [primaryMuscle, setPrimaryMuscle] = useState(initial?.primaryMuscle ?? MUSCLE_GROUPS[0]);
  const [muscles, setMuscles] = useState<string[]>(initial?.muscles ?? []);
  const [pattern, setPattern] = useState(initial?.pattern ?? 'mobility');
  const [equipment, setEquipment] = useState<string[]>(initial?.equipment ?? ['none']);
  const [howTo, setHowTo] = useState<string[]>(ru(initial?.howTo ?? []));
  const [cues, setCues] = useState<string[]>(ru(initial?.cues ?? []));
  const [mistakes, setMistakes] = useState<string[]>(ru(initial?.mistakes ?? []));
  const [breathingRu, setBreathingRu] = useState(initial?.breathingRu ?? '');
  const [videoRu, setVideoRu] = useState<string | null>(initial?.videoRu ?? null);
  const [image, setImage] = useState<string | null>(initial?.image ?? null);
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));
  /*
   * Which folder of the private bucket a video goes in, because that is what gates it:
   * `videos/<course_id>/…` needs an active purchase of that course, `videos/shared/…` only a
   * sign-in (0003_storage.sql). A pose from a paid course belongs under the course.
   */
  const [videoFolder, setVideoFolder] = useState('shared');

  const idError = isNew && id !== '' && !EXERCISE_ID_RE.test(id) ? t('app.exIdInvalid') : undefined;
  const canSave = !saving && nameRu.trim().length > 0 && (!isNew || (id.length > 0 && !idError));

  const save = () => {
    const pairs = (list: string[]) =>
      list
        .map((v) => v.trim())
        .filter(Boolean)
        .map((v) => ({ ru: v, en: v }));
    const draft: ExerciseDraft = {
      id: isNew ? id : initial.id,
      nameRu: nameRu.trim(),
      howTo: pairs(howTo),
      cues: pairs(cues),
      mistakes: pairs(mistakes),
      breathingRu: breathingRu.trim() || null,
      videoRu,
      image,
      tags: tags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    if (ownFields) {
      Object.assign(draft, {
        nameEn: nameEn.trim() || null,
        shortNameRu: shortNameRu.trim() || null,
        descriptionRu: descriptionRu.trim() || null,
        unit,
        secondsPerRep: unit === 'reps' ? Number(secondsPerRep) || 3 : null,
        level: Number(level) || 1,
        primaryMuscle,
        muscles: muscles.length > 0 ? muscles : [primaryMuscle],
        pattern,
        equipment: equipment.length > 0 ? equipment : ['none'],
      } satisfies Partial<ExerciseDraft>);
    }
    onSave(draft);
  };

  const folderOptions = [
    { value: 'shared', label: t('app.exVideoFolderShared') },
    ...courseIds.map((c) => ({ value: c, label: c })),
  ];

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="grid gap-4 lg:grid-cols-2">
        {isNew ? (
          <Input
            label={t('app.exId')}
            placeholder="yoga_downward_dog"
            hint={t('app.exIdHint')}
            error={idError}
            value={id}
            autoCapitalize="none"
            spellCheck={false}
            onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
          />
        ) : null}
        <Input
          label={t('app.exNameRu')}
          value={nameRu}
          disabled={!ownFields}
          onChange={(e) => setNameRu(e.target.value)}
        />
        {ownFields ? (
          <>
            <Input
              label={t('app.exNameEn')}
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
            />
            <Input
              label={t('app.exShortName')}
              hint={t('app.exShortNameHint')}
              value={shortNameRu}
              onChange={(e) => setShortNameRu(e.target.value)}
            />
          </>
        ) : null}
      </div>

      {!ownFields ? (
        /* A notice is a ruled line of text, not a callout box. */
        <p className="border-y border-border py-3 text-[15px] text-muted">
          {t('app.exSeededNotice')}
        </p>
      ) : null}

      {ownFields ? (
        <>
          <Textarea
            label={t('app.exDescription')}
            hint={t('app.exDescriptionHint')}
            rows={4}
            value={descriptionRu}
            onChange={(e) => setDescriptionRu(e.target.value)}
          />
          <div className="grid gap-4 lg:grid-cols-3">
            <Select<Unit>
              label={t('app.exUnit')}
              hint={t('app.exUnitHint')}
              value={unit}
              onChange={setUnit}
              options={UNITS.map((u) => ({ value: u, label: t(UNIT_KEY[u]) }))}
            />
            {unit === 'reps' ? (
              <Input
                label={t('app.exSecondsPerRep')}
                type="number"
                inputMode="decimal"
                min={0.5}
                max={30}
                step={0.5}
                value={secondsPerRep}
                onChange={(e) => setSecondsPerRep(e.target.value)}
              />
            ) : null}
            <Select
              label={t('app.exLevel')}
              value={level}
              onChange={setLevel}
              options={[
                { value: '1', label: t('app.exLevel1') },
                { value: '2', label: t('app.exLevel2') },
                { value: '3', label: t('app.exLevel3') },
              ]}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Select
              label={t('app.exPrimaryMuscle')}
              value={primaryMuscle}
              onChange={setPrimaryMuscle}
              options={MUSCLE_GROUPS.map((m) => ({ value: m, label: m }))}
            />
            <Select
              label={t('app.exPattern')}
              value={pattern}
              onChange={setPattern}
              options={MOVEMENT_PATTERNS.map((p) => ({ value: p, label: p }))}
            />
          </div>
          <ChipToggles
            label={t('app.exMuscles')}
            options={MUSCLE_GROUPS}
            selected={muscles}
            onChange={setMuscles}
          />
          <ChipToggles
            label={t('app.exEquipment')}
            options={EQUIPMENT}
            selected={equipment}
            onChange={setEquipment}
          />
        </>
      ) : null}

      <TextList
        label={t('app.exHowTo')}
        hint={t('app.exHowToHint')}
        values={howTo}
        onChange={setHowTo}
        placeholder={t('app.exHowToPlaceholder')}
      />
      <TextList
        label={t('app.exCues')}
        values={cues}
        onChange={setCues}
        placeholder={t('app.exCuesPlaceholder')}
      />
      <TextList
        label={t('app.exMistakes')}
        values={mistakes}
        onChange={setMistakes}
        placeholder={t('app.exMistakesPlaceholder')}
      />
      <Input
        label={t('app.exBreathing')}
        value={breathingRu}
        onChange={(e) => setBreathingRu(e.target.value)}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <Select
            label={t('app.exVideoFolder')}
            hint={t('app.exVideoFolderHint')}
            value={videoFolder}
            onChange={setVideoFolder}
            options={folderOptions}
          />
          <MediaField
            label={t('app.exVideo')}
            hint={t('app.exVideoHint')}
            value={videoRu}
            onChange={setVideoRu}
            bucket={PRIVATE_BUCKET}
            pathBase={`${videoFolder}/${(isNew ? id : initial.id) || 'exercise'}.ru`}
            accept="video/*"
          />
        </div>
        <MediaField
          label={t('app.exImage')}
          hint={t('app.exImageHint')}
          value={image}
          onChange={setImage}
          bucket={PUBLIC_BUCKET}
          pathBase={`exercises/${(isNew ? id : initial.id) || 'exercise'}`}
          accept="image/*"
          maxBytes={8 * 1024 * 1024}
        />
      </div>

      <Input
        label={t('app.exTags')}
        hint={t('app.exTagsHint')}
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      {/* The one white button on the screen is Save; Cancel is text beside it. */}
      <div className="flex gap-2 border-t border-border pt-5">
        <Button variant="ghost" fullWidth onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button fullWidth loading={saving} disabled={!canSave} onClick={save}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
}
