/**
 * One clip's colour and frame: the live preview on top, three tabs of controls under it
 * («Свет» — the five sliders, «Кривые», «Кадр»), and the clipboard and queue around them.
 *
 * Nothing is sent until «Сохранить» (or a queue, which saves first). The editor holds the grade
 * as full parameters and the crop as a rectangle; `gradeToDb` / `cropToDb` turn «no change» back
 * into null when comparing and saving, so moving a slider and back is not an edit.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Slider } from '@/components/ui/Slider';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { isNetworkError } from '@/lib/api/errors';
import {
  cropToDb,
  gradeToDb,
  RAW_BUCKET,
  saveMediaClip,
  type MediaClip,
} from '@/lib/api/mediaStudio';
import { isDemo } from '@/lib/api/mode';
import { resolveMediaUrl } from '@/lib/api/storage';
import type { Crop } from '@/lib/media/crop';
import {
  clampGrade,
  defaultGrade,
  GRADE_LIMITS,
  GRADE_SLIDERS,
  type GradeCurves,
  type GradeParams,
  type GradeSlider,
} from '@/lib/media/grade';
import type { TKey } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import { makeClipboard, mergePaste, pasteChanges, type PasteChoice } from './clipboard';
import { useStudioClipboard } from './clipboardStore';
import { ClipStatusChip } from './ClipStatus';
import {
  aspectRatio,
  CROP_ASPECTS,
  cropPixels,
  fitAspect,
  matchAspect,
  normalisedRatio,
  type CropAspect,
} from './cropEdit';
import { CurvesEditor } from './CurvesEditor';
import { formatSlider, SLIDER_STEP, snapSlider } from './gradeFormat';
import { GradePreview } from './GradePreview';
import { PasteSheet } from './PasteSheet';
import type { Size } from './previewGeometry';
import { isBusy, isQueueable } from './selection';
import { studioErrorTitle, workerErrorText, type PlaybackProblem } from './studioErrors';
import { formatSpan, previewWindow } from './time';
import { useQueueActions } from './useQueueActions';

type EditorTab = 'light' | 'curves' | 'frame';

const SLIDER_LABEL: Record<GradeSlider, TKey> = {
  exposure: 'app.studioExposure',
  contrast: 'app.studioContrast',
  brightness: 'app.studioBrightness',
  whites: 'app.studioWhites',
  blacks: 'app.studioBlacks',
};

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

export interface GradeEditorProps {
  clip: MediaClip;
  /** The clip's neighbours in its shoot, in order, for «Предыдущий» / «Следующий». */
  prevId: string | null;
  nextId: string | null;
  onGo: (clipId: string) => void;
  onSaved: (clip: MediaClip) => void;
  onReload: () => void;
  onDirtyChange: (dirty: boolean) => void;
}

export function GradeEditor({
  clip,
  prevId,
  nextId,
  onGo,
  onSaved,
  onReload,
  onDirtyChange,
}: GradeEditorProps) {
  const tr = useT();
  const { t } = tr;
  const toast = useToast();
  const clipboard = useStudioClipboard((s) => s.clipboard);
  const copyToClipboard = useStudioClipboard((s) => s.copy);

  const [grade, setGrade] = useState<GradeParams>(() => clip.grade ?? defaultGrade());
  const [crop, setCrop] = useState<Crop | null>(clip.crop);
  const [tab, setTab] = useState<EditorTab>('light');
  const [aspect, setAspect] = useState<CropAspect>('free');
  const [videoSize, setVideoSize] = useState<Size>({ w: 0, h: 0 });
  const [src, setSrc] = useState<string | null>(null);
  const [problem, setProblem] = useState<PlaybackProblem | null>(null);
  const [signTry, setSignTry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [pasting, setPasting] = useState(false);

  const readOnly = isBusy(clip);
  const savedGrade = gradeToDb(clip.grade);
  const savedCrop = cropToDb(clip.crop);
  const dirty = !same(gradeToDb(grade), savedGrade) || !same(cropToDb(crop), savedCrop);

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  /*
   * A new version of the clip from the server (a save, a paste from the grid) resets the editor.
   * Keyed on the version, not on the objects: a reload that changed nothing hands over equal but
   * new objects, and that must not throw away what is being edited.
   */
  useEffect(() => {
    setGrade(clip.grade ?? defaultGrade());
    setCrop(clip.crop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip.id, clip.updatedAt]);

  // Sign the raw piece. The demo has no buckets; a refusal is a permission or a missing file.
  useEffect(() => {
    let alive = true;
    setSrc(null);
    setProblem(null);
    if (isDemo()) {
      setProblem('demo');
      return;
    }
    resolveMediaUrl(`storage:${RAW_BUCKET}/${clip.rawPath}`)
      .then((url) => {
        if (!alive) return;
        if (url) setSrc(url);
        else setProblem('sign');
      })
      .catch((e: unknown) => {
        if (alive) setProblem(isNetworkError(e) ? 'network' : 'sign');
      });
    return () => {
      alive = false;
    };
  }, [clip.rawPath, signTry]);

  const win = useMemo(() => previewWindow(clip), [clip]);

  const onVideoSize = useCallback(
    (size: Size) => {
      setVideoSize(size);
      setAspect(matchAspect(clip.crop, size.w, size.h));
    },
    [clip.crop],
  );

  const ratio = useMemo(() => {
    const px = aspectRatio(aspect);
    return px === null || videoSize.w === 0 ? null : normalisedRatio(px, videoSize.w, videoSize.h);
  }, [aspect, videoSize]);

  const setSlider = (key: GradeSlider, value: number) =>
    setGrade((g) => ({ ...g, [key]: snapSlider(key, value) }));
  const setCurves = (curves: GradeCurves) => setGrade((g) => clampGrade({ ...g, curves }));

  const chooseAspect = (a: CropAspect) => {
    setAspect(a);
    if (videoSize.w > 0) setCrop(fitAspect(crop, aspectRatio(a), videoSize.w, videoSize.h));
  };

  const save = useCallback(async (): Promise<boolean> => {
    if (!dirty) return true;
    setSaving(true);
    try {
      const next = await saveMediaClip(clip.id, { grade: gradeToDb(grade), crop: cropToDb(crop) });
      onSaved(next);
      toast.show({
        kind: 'success',
        title: t('app.studioSaved'),
        description: clip.status === 'done' ? t('app.studioSavedWasDone') : undefined,
      });
      return true;
    } catch (e) {
      toast.show({ kind: 'error', title: studioErrorTitle(tr, e, 'app.studioSaveError') });
      return false;
    } finally {
      setSaving(false);
    }
  }, [clip.id, clip.status, crop, dirty, grade, onSaved, t, toast, tr]);

  const actions = useQueueActions([clip], onReload, save);

  const go = async (id: string | null) => {
    if (!id) return;
    if (dirty && !(await save())) return;
    onGo(id);
  };

  const copy = () => {
    copyToClipboard(
      makeClipboard(gradeToDb(grade), cropToDb(crop), {
        id: clip.id,
        label: clip.exerciseName ?? clip.exerciseId,
      }),
    );
    toast.show({
      kind: 'success',
      title: t('app.studioCopied'),
      description: t('app.studioCopiedHint'),
    });
  };

  const paste = (choice: PasteChoice) => {
    setPasting(false);
    if (!clipboard) return;
    const current = { grade: gradeToDb(grade), crop: cropToDb(crop) };
    if (!pasteChanges(current, clipboard, choice)) {
      toast.show({ kind: 'info', title: t('app.studioPasteSame') });
      return;
    }
    const next = mergePaste(current, clipboard, choice);
    setGrade(next.grade ?? defaultGrade());
    setCrop(next.crop);
    if (videoSize.w > 0) setAspect(matchAspect(next.crop, videoSize.w, videoSize.h));
    toast.show({ kind: 'info', title: t('app.studioPastedHere') });
  };

  const worker = clip.status === 'failed' ? workerErrorText(clip.error) : null;
  const [cropW, cropH] = videoSize.w > 0 ? cropPixels(crop, videoSize.w, videoSize.h) : [0, 0];
  const aspectLabels: Record<CropAspect, string> = {
    free: t('app.studioAspectFree'),
    '9:16': '9:16',
    '4:3': '4:3',
    '1:1': '1:1',
  };

  return (
    <div className="flex flex-col gap-4 py-4 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)] lg:items-start lg:gap-8">
      <div className="flex flex-col gap-3 lg:sticky lg:top-20">
        <div className="flex flex-wrap items-center gap-2">
          <ClipStatusChip status={clip.status} />
          <span className="numeral tabular text-[13px] text-muted">{formatSpan(clip)}</span>
        </div>

        <GradePreview
          src={src}
          problem={problem}
          win={win}
          grade={grade}
          crop={crop}
          editingCrop={tab === 'frame'}
          onCropChange={setCrop}
          cropRatio={ratio}
          onVideoSize={onVideoSize}
          readOnly={readOnly}
        />
        {problem === 'sign' || problem === 'network' ? (
          <Button size="sm" variant="ghost" onClick={() => setSignTry((n) => n + 1)}>
            {t('common.retry')}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        {/* What she needs to know about this clip before touching it. */}
        <div className="flex flex-col gap-2 text-[13px]" role="status">
          {readOnly ? <p className="text-warning">{t('app.studioNoteRendering')}</p> : null}
          {clip.status === 'queued' ? (
            <p className="text-muted">{t('app.studioNoteQueued')}</p>
          ) : null}
          {clip.status === 'done' ? <p className="text-muted">{t('app.studioNoteDone')}</p> : null}
          {!clip.exerciseId ? (
            <p className="text-warning">{t('app.studioNoteUnlabelled')}</p>
          ) : null}
          {clip.exerciseHasVideo && clip.status !== 'done' && clip.exerciseId ? (
            <p className="text-muted">{t('app.studioNoteReplaces')}</p>
          ) : null}
          {worker ? (
            <div className="flex flex-col gap-1 rounded-control border border-border-strong p-3">
              <p className="text-danger">{t(worker.key)}</p>
              {worker.detail ? (
                <p className="font-mono text-[12px] break-words text-muted">{worker.detail}</p>
              ) : null}
              <div>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={actions.busy}
                  onClick={() => actions.retry([clip.id])}
                >
                  {t('app.studioRetry')}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={copy}>
            {t('app.studioCopy')}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={!clipboard || readOnly}
            onClick={() => setPasting(true)}
          >
            {t('app.studioPaste')}
          </Button>
        </div>

        <Tabs<EditorTab>
          variant="fill"
          label={t('app.studioEditorTabs')}
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'light', label: t('app.studioTabLight') },
            { id: 'curves', label: t('app.studioTabCurves') },
            { id: 'frame', label: t('app.studioTabFrame') },
          ]}
        />

        {tab === 'light' ? (
          <div className="flex flex-col gap-5">
            {GRADE_SLIDERS.map((key) => (
              <div key={key} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] font-semibold text-muted">
                    {t(SLIDER_LABEL[key])}
                  </span>
                  <button
                    type="button"
                    className="numeral tabular text-[14px] text-text disabled:opacity-50"
                    disabled={readOnly || grade[key] === 0}
                    title={t('app.studioSliderReset')}
                    aria-label={t('app.studioSliderResetOne', { name: t(SLIDER_LABEL[key]) })}
                    onClick={() => setSlider(key, 0)}
                  >
                    {formatSlider(key, grade[key])}
                  </button>
                </div>
                <Slider
                  value={grade[key]}
                  min={GRADE_LIMITS[key].min}
                  max={GRADE_LIMITS[key].max}
                  step={SLIDER_STEP[key]}
                  disabled={readOnly}
                  ariaLabel={t(SLIDER_LABEL[key])}
                  valueText={formatSlider(key, grade[key])}
                  onChange={(v) => setSlider(key, v)}
                />
              </div>
            ))}
            <p className="text-[13px] text-muted">{t('app.studioSliderHint')}</p>
            <div>
              <Button
                size="sm"
                variant="ghost"
                disabled={readOnly || gradeToDb(grade) === null}
                onClick={() => setGrade(defaultGrade())}
              >
                {t('app.studioResetColour')}
              </Button>
            </div>
          </div>
        ) : tab === 'curves' ? (
          <CurvesEditor curves={grade.curves} onChange={setCurves} disabled={readOnly} />
        ) : (
          <div className="flex flex-col gap-3">
            <SegmentedControl<CropAspect>
              label={t('app.studioAspect')}
              value={aspect}
              onChange={chooseAspect}
              fullWidth
              size="sm"
              options={CROP_ASPECTS.map((a) => ({
                value: a,
                label: aspectLabels[a],
                disabled: readOnly || videoSize.w === 0,
              }))}
            />
            <p className="text-[13px] text-muted">
              {videoSize.w > 0
                ? t('app.studioCropSize', { w: cropW, h: cropH })
                : t('app.studioCropWaiting')}
            </p>
            <p className="text-[13px] text-muted">{t('app.studioCropHint')}</p>
            <div>
              <Button
                size="sm"
                variant="ghost"
                disabled={readOnly || crop === null}
                onClick={() => {
                  setCrop(null);
                  setAspect('free');
                }}
              >
                {t('app.studioCropFull')}
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <div className="flex gap-2">
            <Button
              className="flex-1"
              loading={saving}
              disabled={!dirty || readOnly}
              onClick={() => void save()}
            >
              {dirty ? t('common.save') : t('app.studioSavedState')}
            </Button>
            <Button
              className="flex-1"
              variant="secondary"
              loading={actions.busy}
              disabled={readOnly || !isQueueable(clip)}
              onClick={() => actions.queue([clip.id])}
            >
              {clip.status === 'queued' ? t('app.studioStatusQueued') : t('app.studioQueueOne')}
            </Button>
          </div>
          <div className="flex justify-between gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={!prevId || saving}
              onClick={() => void go(prevId)}
            >
              {t('app.studioPrev')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={!nextId || saving}
              onClick={() => void go(nextId)}
            >
              {dirty ? t('app.studioSaveNext') : t('app.studioNext')}
            </Button>
          </div>
        </div>
      </div>

      <PasteSheet
        open={pasting}
        onClose={() => setPasting(false)}
        clipboard={clipboard}
        count={null}
        onPaste={paste}
      />
      {actions.dialog}
    </div>
  );
}
