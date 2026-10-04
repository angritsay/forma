/**
 * One clip's colour, on the «Цвет» step: the live preview on top, then «Авто-улучшение» and two
 * tabs of manual controls under it («Свет» — the five sliders, «Кривые»), and the clipboard.
 *
 * The automatic pass (`src/lib/media/autoEnhance.ts`) is on by default; her manual grade applies on
 * top of it, and «Держи, чтобы увидеть как снято» shows the clip with neither. Framing is not here:
 * it is set on «Превью», against the card and the player.
 *
 * Nothing is sent until «Сохранить» (or a step to another clip, which saves first). The editor holds
 * the grade as full parameters; `gradeToDb` turns «no change» back into null when comparing and
 * saving, so moving a slider and back is not an edit.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { gradeToDb, saveMediaClip, type MediaClip } from '@/lib/api/mediaStudio';
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
import { makeClipboard, pasteChanges } from '../clipboard';
import { useStudioClipboard } from '../clipboardStore';
import { useAutoParams } from './autoSample';
import { ClipStatusChip } from './ClipStatus';
import { CurvesEditor } from './CurvesEditor';
import { formatSlider, SLIDER_STEP, snapSlider } from './gradeFormat';
import { GradePreview } from './GradePreview';
import { isBusy } from './selection';
import { studioErrorTitle } from './studioErrors';
import { formatSpan, previewWindow } from './time';
import { useRawSource } from './useRawSource';

type EditorTab = 'light' | 'curves';

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
  onDirtyChange: (dirty: boolean) => void;
}

export function GradeEditor({
  clip,
  prevId,
  nextId,
  onGo,
  onSaved,
  onDirtyChange,
}: GradeEditorProps) {
  const tr = useT();
  const { t } = tr;
  const toast = useToast();
  const clipboard = useStudioClipboard((s) => s.clipboard);
  const copyToClipboard = useStudioClipboard((s) => s.copy);

  const [grade, setGrade] = useState<GradeParams>(() => clip.grade ?? defaultGrade());
  const [autoOn, setAutoOn] = useState(clip.autoEnhance);
  const [tab, setTab] = useState<EditorTab>('light');
  const [saving, setSaving] = useState(false);

  const source = useRawSource(clip.rawPath);
  const win = useMemo(() => previewWindow(clip), [clip]);
  const auto = useAutoParams(clip, source.src, win, autoOn);

  const readOnly = isBusy(clip);
  const dirty = !same(gradeToDb(grade), gradeToDb(clip.grade)) || autoOn !== clip.autoEnhance;

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  /*
   * A new version of the clip from the server (a save, a paste from the list) resets the editor.
   * Keyed on the version, not on the objects: a reload that changed nothing hands over equal but
   * new objects, and that must not throw away what is being edited.
   */
  useEffect(() => {
    setGrade(clip.grade ?? defaultGrade());
    setAutoOn(clip.autoEnhance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip.id, clip.updatedAt]);

  const setSlider = (key: GradeSlider, value: number) =>
    setGrade((g) => ({ ...g, [key]: snapSlider(key, value) }));
  const setCurves = (curves: GradeCurves) => setGrade((g) => clampGrade({ ...g, curves }));

  const save = useCallback(async (): Promise<boolean> => {
    if (!dirty) return true;
    setSaving(true);
    try {
      const next = await saveMediaClip(clip.id, {
        grade: gradeToDb(grade),
        autoEnhance: autoOn,
      });
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
  }, [autoOn, clip.id, clip.status, dirty, grade, onSaved, t, toast, tr]);

  const go = async (id: string | null) => {
    if (!id) return;
    if (dirty && !(await save())) return;
    onGo(id);
  };

  const copy = () => {
    copyToClipboard(
      makeClipboard(
        { grade: gradeToDb(grade), autoEnhance: autoOn },
        { id: clip.id, label: clip.exerciseName ?? clip.exerciseId },
      ),
    );
    toast.show({
      kind: 'success',
      title: t('app.studioCopied'),
      description: t('app.studioCopiedHint'),
    });
  };

  const pasteHere = () => {
    if (!clipboard) return;
    if (!pasteChanges({ grade: gradeToDb(grade), autoEnhance: autoOn }, clipboard)) {
      toast.show({ kind: 'info', title: t('app.studioPasteSame') });
      return;
    }
    setGrade(clipboard.grade ?? defaultGrade());
    setAutoOn(clipboard.autoEnhance);
    toast.show({ kind: 'info', title: t('app.studioPastedHere') });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <ClipStatusChip status={clip.status} />
        <span className="numeral tabular text-[13px] text-muted">{formatSpan(clip)}</span>
      </div>

      <GradePreview
        src={source.src}
        problem={source.problem}
        win={win}
        grade={grade}
        auto={auto.params}
        crop={clip.crop}
        onRetrySource={source.retry}
      />
      {source.problem === 'sign' || source.problem === 'network' ? (
        <Button size="sm" variant="ghost" onClick={source.retry}>
          {t('common.retry')}
        </Button>
      ) : null}

      {readOnly ? (
        <p role="status" className="text-[13px] text-warning">
          {t('app.studioNoteRendering')}
        </p>
      ) : null}

      <div className="flex flex-col gap-1 rounded-control border border-border p-3">
        <Switch
          checked={autoOn}
          onChange={setAutoOn}
          disabled={readOnly}
          label={t('app.studioAutoEnhance')}
        />
        <p className="text-[13px] text-muted" aria-live="polite">
          {!autoOn
            ? t('app.studioAutoOffHint')
            : auto.state === 'working'
              ? t('app.studioAutoWorking')
              : auto.state === 'failed'
                ? t('app.studioAutoFailed')
                : t('app.studioAutoHint')}
        </p>
      </div>

      <Tabs<EditorTab>
        variant="fill"
        label={t('app.studioEditorTabs')}
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'light', label: t('app.studioTabLight') },
          { id: 'curves', label: t('app.studioTabCurves') },
        ]}
      />

      {tab === 'light' ? (
        <div className="flex flex-col gap-5">
          {GRADE_SLIDERS.map((key) => (
            <div key={key} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-semibold text-muted">{t(SLIDER_LABEL[key])}</span>
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
      ) : (
        <CurvesEditor curves={grade.curves} onChange={setCurves} disabled={readOnly} />
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={copy}>
          {t('app.studioCopy')}
        </Button>
        <Button size="sm" variant="secondary" disabled={!clipboard || readOnly} onClick={pasteHere}>
          {t('app.studioPasteHere')}
        </Button>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <Button
          fullWidth
          loading={saving}
          disabled={!dirty || readOnly}
          onClick={() => void save()}
        >
          {dirty ? t('common.save') : t('app.studioSavedState')}
        </Button>
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
  );
}
