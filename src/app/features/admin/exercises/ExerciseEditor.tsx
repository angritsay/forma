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
 *
 * Media — the clip and how it plays, the spoken name, the explanations (0048) — is markup on
 * both kinds of row: it is what the seed never writes, and on a seeded movement it is the whole
 * point of opening this form. It is saved unconditionally.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { EQUIPMENT, MOVEMENT_PATTERNS, MUSCLE_GROUPS, type VideoMode } from '@/content/schema';
import type { ExerciseCatalogRow, ExerciseDraft } from '@/lib/api/types';
import type { TKey } from '@/i18n/index';
import { AUDIO_BUCKET, PRIVATE_BUCKET, PUBLIC_BUCKET } from '@/lib/api/storage';
import { pick, put } from '@/app/features/admin/adminLocale';
import { LangTabs, useEditingLocale } from '@/app/features/admin/LangTabs';
import { useT } from '@/app/hooks/useT';
import { ChipToggles, TextList } from '@/app/features/admin/forms/TextList';
import { MediaField } from '@/app/features/admin/media/MediaField';
import {
  cleanIntro,
  INTRO_AUDIO_MAX_BYTES,
  introToDraft,
  IntroTierEditor,
} from '@/app/features/admin/exercises/IntroTierEditor';

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

/** Оба языка списка целиком: длина общая, третий пункт по-английски — перевод третьего русского. */
type Pair = { ru?: string; en?: string };
const pairs = (list: Pair[]): Pair[] => list.filter((v) => (v.ru ?? v.en ?? '').length > 0);

export function ExerciseEditor({
  initial,
  courseIds,
  saving,
  onSave,
  onCancel,
}: ExerciseEditorProps) {
  const { t } = useT();
  const isNew = initial === null;
  // Новое упражнение заводится по-русски: русское название обязательно, и переводить пока нечего.
  const editing = useEditingLocale(isNew);
  // A seeded row's descriptive fields are owned by content/exercises and re-seeded by 0007.
  const ownFields = isNew || initial.isCustom;

  const [id, setId] = useState(initial?.id ?? '');
  const [nameRu, setNameRu] = useState(initial?.nameRu ?? '');
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? '');
  const [shortNameRu, setShortNameRu] = useState(initial?.shortNameRu ?? '');
  const [shortNameEn, setShortNameEn] = useState(initial?.shortNameEn ?? '');
  const [descriptionRu, setDescriptionRu] = useState(initial?.descriptionRu ?? '');
  const [descriptionEn, setDescriptionEn] = useState(initial?.descriptionEn ?? '');
  const [unit, setUnit] = useState<Unit>(initial?.unit ?? 'seconds');
  const [secondsPerRep, setSecondsPerRep] = useState(String(initial?.secondsPerRep ?? 3));
  const [level, setLevel] = useState(String(initial?.level ?? 1));
  const [primaryMuscle, setPrimaryMuscle] = useState(initial?.primaryMuscle ?? MUSCLE_GROUPS[0]);
  const [muscles, setMuscles] = useState<string[]>(initial?.muscles ?? []);
  const [pattern, setPattern] = useState(initial?.pattern ?? 'mobility');
  const [equipment, setEquipment] = useState<string[]>(initial?.equipment ?? ['none']);
  const [howTo, setHowTo] = useState<Pair[]>(pairs(initial?.howTo ?? []));
  const [cues, setCues] = useState<Pair[]>(pairs(initial?.cues ?? []));
  const [mistakes, setMistakes] = useState<Pair[]>(pairs(initial?.mistakes ?? []));
  const [breathingRu, setBreathingRu] = useState(initial?.breathingRu ?? '');
  const [breathingEn, setBreathingEn] = useState(initial?.breathingEn ?? '');
  const [videoRu, setVideoRu] = useState<string | null>(initial?.videoRu ?? null);
  const [videoEn, setVideoEn] = useState<string | null>(initial?.videoEn ?? null);
  const [videoMode, setVideoMode] = useState<VideoMode>(initial?.videoMode ?? 'loop');
  const [audioRu, setAudioRu] = useState<string | null>(initial?.audioRu ?? null);
  const [audioEn, setAudioEn] = useState<string | null>(initial?.audioEn ?? null);
  const [introFull, setIntroFull] = useState(() => introToDraft(initial?.introFull));
  const [introBrief, setIntroBrief] = useState(() => introToDraft(initial?.introBrief));
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
    /*
     * Обе половины как есть. Раньше английская была копией русской — и «что ещё не переведено»
     * после этого было не узнать: русский текст в английской колонке неотличим от перевода.
     * Пустая половина стирается, чтобы подстановка сработала.
     */
    const clean = (list: Pair[]) =>
      list
        .map((v) => ({
          ...(v.ru?.trim() ? { ru: v.ru.trim() } : {}),
          ...(v.en?.trim() ? { en: v.en.trim() } : {}),
        }))
        .filter((v) => v.ru || v.en);
    const draft: ExerciseDraft = {
      id: isNew ? id : initial.id,
      nameRu: nameRu.trim(),
      howTo: clean(howTo),
      cues: clean(cues),
      mistakes: clean(mistakes),
      breathingRu: breathingRu.trim() || null,
      breathingEn: breathingEn.trim() || null,
      videoRu,
      videoEn,
      videoMode,
      audioRu,
      audioEn,
      introFull: cleanIntro(introFull),
      introBrief: cleanIntro(introBrief),
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
        shortNameEn: shortNameEn.trim() || null,
        descriptionRu: descriptionRu.trim() || null,
        descriptionEn: descriptionEn.trim() || null,
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
  /** What names every file of this exercise; a new one without an id yet gets a placeholder. */
  const fileId = (isNew ? id : initial.id) || 'exercise';

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
            {/*
              Короткое имя стоит в полоске упражнений на карточке дня — самом узком месте в
              приложении, и потому единственном, где длинное английское слово заметно хуже
              короткого. Поле рядом с русским, а не под переключателем ниже: имя и его перевод
              здесь уже показаны парой (exNameRu / exNameEn), и короткое имя — та же пара.
            */}
            <Input
              label={t('app.exShortNameEn')}
              placeholder={shortNameRu}
              value={shortNameEn}
              onChange={(e) => setShortNameEn(e.target.value)}
            />
          </>
        ) : null}
      </div>

      {/* «Пишем на»: поля ниже показывают ту половину, а в подсказке стоит вторая. */}
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">{t('app.adminEditingLanguage')}</span>
        <LangTabs locked={isNew} />
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
            placeholder={editing === 'en' ? descriptionRu : descriptionEn}
            value={editing === 'en' ? descriptionEn : descriptionRu}
            onChange={(e) =>
              (editing === 'en' ? setDescriptionEn : setDescriptionRu)(e.target.value)
            }
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

      {/*
       * Списки правятся по одному языку за раз, и длина у них общая: третий пункт по-английски —
       * перевод третьего русского. Поэтому значение накладывается на существующую пару по
       * индексу, а не заменяет список.
       */}
      <TextList
        label={t('app.exHowTo')}
        hint={t('app.exHowToHint')}
        values={howTo.map((v) => pick(v, editing))}
        onChange={(v) => setHowTo(v.map((x, i) => put(howTo[i], editing, x)))}
        placeholder={t('app.exHowToPlaceholder')}
      />
      <TextList
        label={t('app.exCues')}
        values={cues.map((v) => pick(v, editing))}
        onChange={(v) => setCues(v.map((x, i) => put(cues[i], editing, x)))}
        placeholder={t('app.exCuesPlaceholder')}
      />
      <TextList
        label={t('app.exMistakes')}
        values={mistakes.map((v) => pick(v, editing))}
        onChange={(v) => setMistakes(v.map((x, i) => put(mistakes[i], editing, x)))}
        placeholder={t('app.exMistakesPlaceholder')}
      />
      <Input
        label={t('app.exBreathing')}
        placeholder={editing === 'en' ? breathingRu : breathingEn}
        value={editing === 'en' ? breathingEn : breathingRu}
        onChange={(e) => (editing === 'en' ? setBreathingEn : setBreathingRu)(e.target.value)}
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
            pathBase={`${videoFolder}/${fileId}.ru`}
            accept="video/*"
          />
          {/*
           * The English clip is rarely a different file — a movement looks the same in any
           * language — but a clip with a spoken cue in it is, and the player picks by locale.
           */}
          <MediaField
            label={t('app.exVideoEn')}
            hint={t('app.exVideoEnHint')}
            value={videoEn}
            onChange={setVideoEn}
            bucket={PRIVATE_BUCKET}
            pathBase={`${videoFolder}/${fileId}.en`}
            accept="video/*"
          />
        </div>
        <MediaField
          label={t('app.exImage')}
          hint={t('app.exImageHint')}
          value={image}
          onChange={setImage}
          bucket={PUBLIC_BUCKET}
          pathBase={`exercises/${fileId}`}
          accept="image/*"
          maxBytes={8 * 1024 * 1024}
        />
      </div>

      {/*
       * Loop or fit. A movement that is repeated loops; a pose that is entered once and held is
       * slowed to the step and holds its last frame, so the person is not shown sitting down into
       * it again every eight seconds. The switch is the only thing here that is not a file.
       */}
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-muted">{t('app.exVideoMode')}</span>
        <SegmentedControl<VideoMode>
          className="self-start"
          size="sm"
          label={t('app.exVideoMode')}
          value={videoMode}
          onChange={setVideoMode}
          options={[
            { value: 'loop', label: t('app.exVideoModeLoop') },
            { value: 'fit', label: t('app.exVideoModeFit') },
          ]}
        />
        <p className="text-[13px] text-muted-2">{t('app.exVideoModeHint')}</p>
      </div>

      {/* The name, spoken: one recording per language, under `shared/` — a name is not paid content. */}
      <div className="flex flex-col gap-3">
        <span className="eyebrow">{t('app.exAudioSection')}</span>
        <p className="text-[13px] text-muted-2">{t('app.exAudioHint')}</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <MediaField
            label={t('app.exAudioRu')}
            value={audioRu}
            onChange={setAudioRu}
            bucket={AUDIO_BUCKET}
            pathBase={`shared/${fileId}.ru`}
            accept="audio/*"
            maxBytes={INTRO_AUDIO_MAX_BYTES}
          />
          <MediaField
            label={t('app.exAudioEn')}
            value={audioEn}
            onChange={setAudioEn}
            bucket={AUDIO_BUCKET}
            pathBase={`shared/${fileId}.en`}
            accept="audio/*"
            maxBytes={INTRO_AUDIO_MAX_BYTES}
          />
        </div>
      </div>

      {/* Explanations: the full one the first time, the brief one twice more, then nothing. */}
      <div className="flex flex-col gap-5 border-t border-border pt-5">
        <div className="flex flex-col gap-1">
          <span className="eyebrow">{t('app.exIntroSection')}</span>
          <p className="text-[13px] text-muted-2">{t('app.exIntroSectionHint')}</p>
        </div>
        <IntroTierEditor
          tier="full"
          title={t('app.exIntroFull')}
          exerciseId={fileId}
          editing={editing}
          value={introFull}
          onChange={setIntroFull}
        />
        <IntroTierEditor
          tier="brief"
          title={t('app.exIntroBrief')}
          exerciseId={fileId}
          editing={editing}
          value={introBrief}
          onChange={setIntroBrief}
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
