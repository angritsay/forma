/**
 * «Нарезка»: the long workout video in, one uploaded piece per exercise out.
 *
 * 1. She picks the video. It plays from a local `blob:` URL; nothing big leaves the phone.
 * 2. She marks each exercise with «Начало» and «Конец» (I / O on a computer), frame-accurate with
 *    the ±1 frame and ±1 s steps. Tapping a piece selects it; the marks then move its edges.
 * 3. Each piece gets its exercise (search, or a new one by name) and, if needed, a crop frame.
 * 4. «Загрузить» cuts each piece by stream copy (`remux.ts`), uploads it over TUS
 *    (`rawUpload.ts`) and registers the clip (`addMediaClip`), one piece at a time, with progress
 *    per piece. A dropped connection resumes; a failed piece says why and offers a retry.
 *
 * The marks are kept per file in localStorage (`cutDraft.ts`): picking the same video again after
 * a reload brings them back, with the same clip ids, so uploads resume onto the same objects.
 *
 * The time and segment rules are `timeline.ts`; the keyframe plan is `cutPlan.ts`; the order of
 * one upload is `pipeline.ts`. This file wires them to a `<video>` and to the screen.
 */
import { clsx } from 'clsx';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useToast } from '@/components/ui/Toast';
import { formatBytes } from '@/i18n/index';
import {
  addMediaClip,
  deleteMediaClip,
  RAW_FILE_SIZE_LIMIT,
  rawClipPath,
  saveMediaClip,
  saveMediaSource,
  type MediaClipPatch,
} from '@/lib/api/mediaStudio';
import { UploadAbortedError, uploadRawPiece } from '@/lib/api/rawUpload';
import type { Crop } from '@/lib/media/crop';
import { adminErrorTitle } from '@/app/features/admin/adminError';
import { useWakeLock } from '@/app/features/player/useWakeLock';
import { useT } from '@/app/hooks/useT';
import { CropSheet } from './CropSheet';
import {
  draftKey,
  parseDraft,
  PIECE_EXT,
  serializeDraft,
  titleFromFileName,
  type FileIdentity,
} from './cutDraft';
import { ExerciseSheet, type PickedExercise } from './ExerciseSheet';
import { THUMB_WIDTH } from './limits';
import { runSegment } from './pipeline';
import { openSource, type SourceInfo, type SourceReader } from './remux';
import { cutterActionForKey, type CutterAction } from './shortcuts';
import { STUDIO_GRADE_PATH } from './StudioOverview';
import {
  clampTime,
  formatTimecode,
  markIn,
  markOut,
  pendingUploads,
  segmentAt,
  segmentSeconds,
  stepFrame,
  stepSeconds,
  type MarkResult,
  type MarkState,
  type Segment,
  type SegmentUploadState,
} from './timeline';
import {
  classifyUploadError,
  isRetryable,
  UPLOAD_ERROR_KEY,
  type UploadErrorKind,
} from './uploadErrors';

const EMPTY_MARKS: MarkState = { segments: [], pendingIn: null, selectedId: null };

const PROBLEM_KEY = {
  too_short: 'app.studioProblemTooShort',
  too_long: 'app.studioProblemTooLong',
  reversed: 'app.studioProblemReversed',
  locked: 'app.studioProblemLocked',
  no_in: 'app.studioProblemNoIn',
} as const;

const newId = (): string => crypto.randomUUID();

function identityOf(f: File): FileIdentity {
  return { name: f.name, size: f.size, lastModified: f.lastModified };
}

/** A small JPEG of what the video shows now, or null (not decoded yet, or the canvas refused). */
function captureThumb(v: HTMLVideoElement | null): string | null {
  if (!v || v.readyState < 2 || !v.videoWidth || !v.videoHeight) return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = THUMB_WIDTH;
    canvas.height = Math.round((THUMB_WIDTH * v.videoHeight) / v.videoWidth);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch {
    return null;
  }
}

function readStore(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStore(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage full or blocked: the marks still hold for this visit.
  }
}

export function Cutter() {
  const tr = useT();
  const { t } = tr;
  const toast = useToast();
  const navigate = useNavigate();

  const fileInput = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const reader = useRef<SourceReader | null>(null);
  const abort = useRef<AbortController | null>(null);
  // Set synchronously, unlike `uploading`: a second tap in the same frame must not start a run.
  const running = useRef(false);
  // Which pick is current: a slow open of an earlier file must not take over a later one.
  const pickSeq = useRef(0);
  // The last run stopped for want of signal: it starts again by itself when the signal is back.
  const resumeOnline = useRef(false);
  // The last stored draft (without its time), so progress ticks do not rewrite localStorage.
  const lastDraft = useRef('');

  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [info, setInfo] = useState<SourceInfo | null>(null);
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<UploadErrorKind | null>(null);
  const [playbackError, setPlaybackError] = useState(false);

  const [sourceId, setSourceId] = useState<string>(newId);
  const [title, setTitle] = useState('');
  const [marks, setMarks] = useState<MarkState>(EMPTY_MARKS);
  // The upload loop reads the pieces as they are now, not as they were when it started.
  const marksRef = useRef(marks);
  marksRef.current = marks;
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const pendingThumb = useRef<string | null>(null);
  const [problem, setProblem] = useState<MarkResult['problem']>(null);

  const [now, setNow] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [labelFor, setLabelFor] = useState<string | null>(null);
  const [cropFor, setCropFor] = useState<string | null>(null);
  const [removeFor, setRemoveFor] = useState<string | null>(null);

  const durationS = info?.durationS ?? null;
  const fps = info?.fps ?? null;
  const segments = marks.segments;
  const selected = segments.find((s) => s.id === marks.selectedId) ?? null;
  const toUpload = useMemo(() => pendingUploads(segments), [segments]);
  const sheetOpen = labelFor !== null || cropFor !== null || removeFor !== null;

  useWakeLock(uploading);

  // --- the file ---------------------------------------------------------------------------

  // Free the blob URL and the reader when the file changes or the screen goes.
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);
  useEffect(() => {
    return () => {
      abort.current?.abort();
      reader.current?.dispose();
      reader.current = null;
    };
  }, []);

  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || running.current) return;
    const seq = ++pickSeq.current;
    reader.current?.dispose();
    reader.current = null;
    resumeOnline.current = false;
    setFile(f);
    setInfo(null);
    setOpenError(null);
    setPlaybackError(false);
    setProblem(null);
    setThumbs({});
    setNow(0);
    setVideoUrl(URL.createObjectURL(f));

    const draft = parseDraft(readStore(draftKey(identityOf(f))), Date.now());
    if (draft) {
      setSourceId(draft.sourceId);
      setTitle(draft.title || titleFromFileName(f.name));
      setMarks({ segments: draft.segments, pendingIn: null, selectedId: null });
      if (draft.segments.length > 0)
        toast.show({ kind: 'info', title: t('app.studioDraftRestored') });
    } else {
      setSourceId(newId());
      setTitle(titleFromFileName(f.name));
      setMarks(EMPTY_MARKS);
    }

    setOpening(true);
    try {
      const r = await openSource(f);
      if (seq !== pickSeq.current) {
        r.dispose();
        return;
      }
      reader.current = r;
      setInfo(r.info);
    } catch (err) {
      if (seq === pickSeq.current) setOpenError(classifyUploadError(err, navigator.onLine));
    } finally {
      if (seq === pickSeq.current) setOpening(false);
    }
  };

  // Keep the draft as she works.
  useEffect(() => {
    if (!file) return;
    const key = draftKey(identityOf(file));
    const same = `${key}\n${serializeDraft({ sourceId, title, segments, savedAt: 0 })}`;
    if (same === lastDraft.current) return;
    lastDraft.current = same;
    writeStore(key, serializeDraft({ sourceId, title, segments, savedAt: Date.now() }));
  }, [file, sourceId, title, segments]);

  // --- the player ---------------------------------------------------------------------------

  const seek = useCallback(
    (t0: number) => {
      const v = video.current;
      const target = clampTime(
        t0,
        durationS ?? (v && Number.isFinite(v.duration) ? v.duration : null),
      );
      if (v) {
        try {
          v.currentTime = target;
        } catch {
          // Not seekable yet.
        }
      }
      setNow(target);
    },
    [durationS],
  );

  // The readout follows the picture smoothly while it plays (timeupdate is only ~4 Hz).
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      const v = video.current;
      if (v) setNow(v.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const togglePlay = useCallback(() => {
    const v = video.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => undefined);
    else v.pause();
  }, []);

  // --- marks ----------------------------------------------------------------------------------

  const applyMark = useCallback((result: MarkResult) => {
    setProblem(result.problem);
    setMarks(result.state);
  }, []);

  const doMarkIn = useCallback(() => {
    const at = video.current?.currentTime ?? now;
    const result = markIn(marks, at);
    if (!result.problem) {
      const thumb = captureThumb(video.current);
      if (marks.selectedId && thumb) setThumbs((m) => ({ ...m, [marks.selectedId!]: thumb }));
      else pendingThumb.current = thumb;
    }
    applyMark(result);
  }, [marks, now, applyMark]);

  const doMarkOut = useCallback(() => {
    const at = video.current?.currentTime ?? now;
    const result = markOut(marks, at, newId);
    if (!result.problem && !marks.selectedId && result.state.selectedId) {
      const id = result.state.selectedId;
      const thumb = pendingThumb.current;
      pendingThumb.current = null;
      if (thumb) setThumbs((m) => ({ ...m, [id]: thumb }));
      video.current?.pause();
    }
    applyMark(result);
  }, [marks, now, applyMark]);

  const run = useCallback(
    (action: CutterAction) => {
      switch (action) {
        case 'mark_in':
          return doMarkIn();
        case 'mark_out':
          return doMarkOut();
        case 'toggle_play':
          return togglePlay();
        case 'frame_back':
          video.current?.pause();
          return seek(stepFrame(video.current?.currentTime ?? now, fps, -1, durationS));
        case 'frame_forward':
          video.current?.pause();
          return seek(stepFrame(video.current?.currentTime ?? now, fps, 1, durationS));
        case 'second_back':
          return seek(stepSeconds(video.current?.currentTime ?? now, -1, durationS));
        case 'second_forward':
          return seek(stepSeconds(video.current?.currentTime ?? now, 1, durationS));
      }
    },
    [doMarkIn, doMarkOut, togglePlay, seek, now, fps, durationS],
  );

  // Desktop keys. Off while a sheet is open: there the keys are the sheet's.
  useEffect(() => {
    if (!videoUrl || sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const action = cutterActionForKey({
        key: e.key,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        altKey: e.altKey,
        targetTag: target?.tagName ?? null,
        targetEditable: target?.isContentEditable ?? false,
      });
      if (!action) return;
      e.preventDefault();
      run(action);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [videoUrl, sheetOpen, run]);

  // Leaving mid-upload loses the piece in flight (it resumes later, but she should know).
  useEffect(() => {
    if (!uploading) return;
    const onBefore = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBefore);
    return () => window.removeEventListener('beforeunload', onBefore);
  }, [uploading]);

  const select = (s: Segment) => {
    setProblem(null);
    if (marks.selectedId === s.id) {
      setMarks((m) => ({ ...m, selectedId: null }));
      return;
    }
    setMarks((m) => ({ ...m, selectedId: s.id, pendingIn: null }));
    video.current?.pause();
    seek(s.startS);
  };

  // --- piece edits ------------------------------------------------------------------------------

  const patchSegment = useCallback((id: string, patch: Partial<Segment>) => {
    setMarks((m) => ({
      ...m,
      segments: m.segments.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, []);

  /** A label or frame: local until the piece is uploaded, then saved on the clip at once. */
  const editSegment = async (seg: Segment, local: Partial<Segment>, server: MediaClipPatch) => {
    if (seg.upload !== 'done') {
      patchSegment(seg.id, local);
      return;
    }
    try {
      await saveMediaClip(seg.id, server);
      patchSegment(seg.id, local);
      toast.show({ kind: 'success', title: t('app.studioSaved') });
    } catch (e) {
      const kind = classifyUploadError(e, navigator.onLine);
      toast.show({
        kind: 'error',
        title:
          kind === 'busy'
            ? t(UPLOAD_ERROR_KEY.busy)
            : kind === 'offline'
              ? t('common.errorOffline')
              : adminErrorTitle(tr, e, 'app.studioSaveError'),
      });
    }
  };

  const onPickExercise = (picked: PickedExercise | null) => {
    const seg = segments.find((s) => s.id === labelFor);
    setLabelFor(null);
    if (!seg) return;
    void editSegment(
      seg,
      { exerciseId: picked?.id ?? null, exerciseName: picked?.name ?? null },
      { exerciseId: picked?.id ?? null },
    );
  };

  const onSaveCrop = (crop: Crop | null) => {
    const seg = segments.find((s) => s.id === cropFor);
    if (!seg) return;
    void editSegment(seg, { crop }, { crop });
  };

  const removeSegment = async () => {
    const seg = segments.find((s) => s.id === removeFor);
    setRemoveFor(null);
    if (!seg) return;
    if (seg.upload === 'done') {
      try {
        await deleteMediaClip({ id: seg.id, rawPath: rawClipPath(sourceId, seg.id, PIECE_EXT) });
      } catch (e) {
        toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.studioSaveError') });
        return;
      }
    }
    setMarks((m) => ({
      ...m,
      segments: m.segments.filter((s) => s.id !== seg.id),
      selectedId: m.selectedId === seg.id ? null : m.selectedId,
    }));
  };

  const saveTitle = async () => {
    // The source row exists once a piece is uploaded; before that the title rides on the draft.
    if (!segments.some((s) => s.upload === 'done')) return;
    try {
      await saveMediaSource({ id: sourceId, title: title.trim() });
    } catch (e) {
      toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.studioSaveError') });
    }
  };

  // --- upload ---------------------------------------------------------------------------------

  /** `only`: one piece (its retry); `afterOffline`: the pieces the lost signal stopped, and new ones. */
  const upload = async (only?: string, afterOffline = false) => {
    const r = reader.current;
    if (!r || !file || running.current) return;
    const pending = pendingUploads(marksRef.current.segments);
    const queue = only
      ? pending.filter((s) => s.id === only)
      : afterOffline
        ? pending.filter((s) => s.upload !== 'error' || s.error === 'offline')
        : pending;
    if (queue.length === 0) return;
    running.current = true;
    resumeOnline.current = false;
    const ctrl = new AbortController();
    abort.current = ctrl;
    setUploading(true);
    video.current?.pause();
    // Edges are not edited while pieces upload; new pieces can still be marked.
    setMarks((m) => ({ ...m, selectedId: null }));
    let failed = 0;
    let stoppedBy: UploadErrorKind | null = null;
    try {
      await saveMediaSource({
        id: sourceId,
        title: title.trim() || titleFromFileName(file.name),
        fileName: file.name,
        durationS: Math.round(r.info.durationS * 1000) / 1000,
      });
    } catch (e) {
      const kind = classifyUploadError(e, navigator.onLine);
      for (const s of queue) patchSegment(s.id, { upload: 'error', error: kind, progress: 0 });
      resumeOnline.current = kind === 'offline';
      running.current = false;
      setUploading(false);
      abort.current = null;
      return;
    }

    for (const queued of queue) {
      if (ctrl.signal.aborted) break;
      const seg = marksRef.current.segments.find((x) => x.id === queued.id);
      if (!seg || seg.upload === 'done') continue;
      if (stoppedBy) {
        patchSegment(seg.id, { upload: 'error', error: stoppedBy, progress: 0 });
        failed++;
        continue;
      }
      patchSegment(seg.id, { upload: 'cutting', progress: 0, error: null });
      // One re-render per whole percent, not one per network progress event.
      let shown = '';
      try {
        await runSegment(
          seg,
          sourceId,
          {
            durationS: r.info.durationS,
            keyframeAt: (t0) => r.keyframeAt(t0),
            cut: (plan, onP, signal) => r.cut(plan, onP, signal),
            upload: (input) => uploadRawPiece(input),
            register: (input) => addMediaClip(input),
            sourceBytes: file.size,
            latest: (id) => marksRef.current.segments.find((x) => x.id === id) ?? null,
          },
          (state: SegmentUploadState, progress: number) => {
            const step = `${state}:${Math.floor(progress * 100)}`;
            if (step === shown) return;
            shown = step;
            patchSegment(seg.id, { upload: state, progress });
          },
          ctrl.signal,
        );
      } catch (e) {
        if (ctrl.signal.aborted || e instanceof UploadAbortedError) {
          patchSegment(seg.id, { upload: 'idle', progress: 0, error: null });
          break;
        }
        const kind = classifyUploadError(e, navigator.onLine);
        patchSegment(seg.id, { upload: 'error', error: kind, progress: 0 });
        failed++;
        // Without signal or access the next pieces fail the same way: stop asking.
        if (kind === 'offline' || kind === 'permission') stoppedBy = kind;
      }
    }

    abort.current = null;
    running.current = false;
    setUploading(false);
    if (ctrl.signal.aborted) return;
    resumeOnline.current = stoppedBy === 'offline';
    toast.show(
      failed === 0
        ? { kind: 'success', title: t('app.studioUploadAllDone') }
        : { kind: 'error', title: t('app.studioUploadSomeFailed') },
    );
  };

  const stop = () => abort.current?.abort();

  // Back online after a run that stopped for want of signal: carry on without a tap. The TUS
  // uploads resume from the last chunk the server has.
  const uploadRef = useRef(upload);
  uploadRef.current = upload;
  useEffect(() => {
    const onOnline = () => {
      if (!resumeOnline.current || running.current) return;
      resumeOnline.current = false;
      void uploadRef.current(undefined, true);
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  // --- render ---------------------------------------------------------------------------------

  if (!file) {
    return (
      <>
        <EmptyState
          className="py-12"
          title={t('app.studioPickTitle')}
          description={t('app.studioPickBody')}
          action={
            <Button onClick={() => fileInput.current?.click()}>{t('app.studioPickButton')}</Button>
          }
        />
        <p className="mx-auto max-w-md pb-8 text-center text-[13px] text-muted-2">
          {t('app.studioPickQualityHint')}
        </p>
        <FileInput ref={fileInput} onPick={pick} />
      </>
    );
  }

  const under = segmentAt(segments, now);
  const hint: ReactNode = problem
    ? t(PROBLEM_KEY[problem])
    : selected
      ? t('app.studioSelectedHint')
      : marks.pendingIn !== null
        ? t('app.studioPendingIn', { time: formatTimecode(marks.pendingIn) })
        : t('app.studioMarkHint');
  const frameAspect = info && info.height > 0 ? info.width / info.height : 16 / 9;
  const cropSeg = segments.find((s) => s.id === cropFor) ?? null;
  const labelSeg = segments.find((s) => s.id === labelFor) ?? null;
  const removeSeg = segments.find((s) => s.id === removeFor) ?? null;
  const allDone = segments.length > 0 && toUpload.length === 0;

  return (
    <div className="flex flex-col gap-4 pt-4 lg:flex-row lg:items-start lg:gap-8">
      <div className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-[calc(var(--safe-top)+72px)] lg:flex-[3]">
        <div className="flex items-end gap-2">
          <Input
            wrapperClassName="min-w-0 flex-1"
            label={t('app.studioSourceTitleLabel')}
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => void saveTitle()}
          />
          <Button
            variant="ghost"
            size="sm"
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
          >
            {t('app.studioPickAnother')}
          </Button>
        </div>

        {info ? (
          <p className="tabular text-[13px] text-muted-2">
            {t('app.studioSourceInfo', {
              w: info.width,
              h: info.height,
              fps: Math.round(info.fps * 100) / 100,
              size: formatBytes(file.size),
            })}
          </p>
        ) : null}

        <div className="relative overflow-hidden bg-black">
          {videoUrl ? (
            <video
              ref={video}
              src={videoUrl}
              playsInline
              muted
              preload="auto"
              className="mx-auto block max-h-[45dvh] w-full object-contain lg:max-h-[60dvh]"
              onPlay={() => setPlaying(true)}
              onPause={() => {
                setPlaying(false);
                if (video.current) setNow(video.current.currentTime);
              }}
              onSeeked={() => video.current && setNow(video.current.currentTime)}
              onTimeUpdate={() => !playing && video.current && setNow(video.current.currentTime)}
              onError={() => setPlaybackError(true)}
              onClick={togglePlay}
            />
          ) : null}
          {opening ? (
            <p className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 text-[13px] text-white">
              {t('app.studioOpening')}
            </p>
          ) : null}
        </div>

        {openError ? (
          <p role="alert" className="text-[14px] text-danger">
            {openError === 'offline'
              ? t('common.errorOffline')
              : t(UPLOAD_ERROR_KEY[openError], { limit: formatBytes(RAW_FILE_SIZE_LIMIT) })}
          </p>
        ) : null}
        {playbackError ? (
          <p role="alert" className="text-[14px] text-danger">
            {t('app.studioPlaybackError')}
          </p>
        ) : null}

        <Scrubber
          now={now}
          durationS={durationS}
          segments={segments}
          pendingIn={marks.pendingIn}
          selectedId={marks.selectedId}
          onSeek={seek}
          label={t('app.studioScrubber')}
        />

        <div className="flex items-center justify-between gap-2">
          <span className="tabular font-mono text-[14px]">
            {formatTimecode(now)}
            <span className="text-muted-2"> / {durationS ? formatTimecode(durationS) : '—'}</span>
          </span>
          <div className="flex items-center gap-1">
            <IconButton
              size="sm"
              variant="ghost"
              label={t('app.studioSecondBack')}
              icon={<span className="text-[12px] font-medium">−1s</span>}
              onClick={() => run('second_back')}
            />
            <IconButton
              size="sm"
              variant="ghost"
              label={t('app.studioFrameBack')}
              icon="prev"
              onClick={() => run('frame_back')}
            />
            <IconButton
              size="md"
              variant="surface"
              label={playing ? t('app.studioPause') : t('app.studioPlay')}
              icon={playing ? 'pause' : 'play'}
              onClick={togglePlay}
            />
            <IconButton
              size="sm"
              variant="ghost"
              label={t('app.studioFrameForward')}
              icon="next"
              onClick={() => run('frame_forward')}
            />
            <IconButton
              size="sm"
              variant="ghost"
              label={t('app.studioSecondForward')}
              icon={<span className="text-[12px] font-medium">+1s</span>}
              onClick={() => run('second_forward')}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={marks.pendingIn !== null && !selected ? 'secondary' : 'primary'}
            disabled={!info}
            onClick={doMarkIn}
          >
            {t('app.studioMarkIn')}
          </Button>
          <Button
            variant={marks.pendingIn !== null || selected ? 'primary' : 'secondary'}
            disabled={!info}
            onClick={doMarkOut}
          >
            {t('app.studioMarkOut')}
          </Button>
        </div>
        <p
          className={clsx('text-[14px]', problem ? 'text-danger' : 'text-muted')}
          aria-live="polite"
        >
          {hint}
          {selected ? (
            <>
              {' '}
              <button
                type="button"
                className="font-medium text-text underline"
                onClick={() => setMarks((m) => ({ ...m, selectedId: null }))}
              >
                {t('app.studioDeselect')}
              </button>
            </>
          ) : null}
        </p>
        <p className="hidden text-[13px] text-muted-2 lg:block">{t('app.studioShortcutsHint')}</p>
      </div>

      <section className="flex min-w-0 flex-col gap-2 lg:flex-[2]" aria-labelledby="cut-pieces">
        <h2 id="cut-pieces" className="eyebrow text-muted-2">
          {t('app.studioSegmentsTitle')}
          {segments.length > 0 ? ` · ${segments.length}` : ''}
        </h2>
        {segments.length === 0 ? (
          <p className="py-4 text-[15px] text-muted">{t('app.studioSegmentsEmpty')}</p>
        ) : (
          <ol className="flex flex-col">
            {segments.map((s, i) => (
              <SegmentRow
                key={s.id}
                index={i}
                seg={s}
                thumb={thumbs[s.id] ?? null}
                selected={s.id === marks.selectedId}
                playing={under?.id === s.id}
                busy={uploading}
                onSelect={() => select(s)}
                onLabel={() => setLabelFor(s.id)}
                onCrop={() => setCropFor(s.id)}
                onRemove={() => setRemoveFor(s.id)}
                onRetry={() => void upload(s.id)}
              />
            ))}
          </ol>
        )}

        <div className="sticky bottom-[var(--nav-inset,0px)] z-10 -mx-4 flex flex-col gap-2 bg-bg px-4 pt-3 pb-[calc(var(--safe-bottom)+16px)] sm:mx-0 sm:px-0">
          {uploading ? (
            <>
              <p className="text-[13px] text-muted">{t('app.studioKeepOpen')}</p>
              <Button variant="secondary" fullWidth onClick={stop}>
                {t('app.studioUploadStop')}
              </Button>
            </>
          ) : allDone ? (
            <Button fullWidth onClick={() => navigate(STUDIO_GRADE_PATH)}>
              {t('app.studioUploadNext')}
            </Button>
          ) : (
            <Button
              fullWidth
              disabled={!info || toUpload.length === 0}
              onClick={() => void upload()}
            >
              {t('app.studioUpload', { n: toUpload.length })}
            </Button>
          )}
        </div>
      </section>

      <FileInput ref={fileInput} onPick={pick} />

      <ExerciseSheet
        open={labelSeg !== null}
        onClose={() => setLabelFor(null)}
        onPick={onPickExercise}
        canClear={Boolean(labelSeg?.exerciseId)}
        onToast={(kind, msg) => toast.show({ kind, title: msg })}
      />
      <CropSheet
        open={cropSeg !== null}
        onClose={() => setCropFor(null)}
        videoUrl={videoUrl}
        atS={cropSeg?.startS ?? 0}
        frameAspect={frameAspect}
        crop={cropSeg?.crop ?? null}
        onSave={onSaveCrop}
        onToast={(msg) => toast.show({ kind: 'info', title: msg })}
      />
      <Modal
        open={removeSeg !== null}
        onClose={() => setRemoveFor(null)}
        title={t('app.studioRemoveTitle')}
        description={
          removeSeg?.upload === 'done'
            ? t('app.studioRemoveUploadedBody')
            : t('app.studioRemoveBody')
        }
        confirmLabel={t('app.studioSegmentRemove')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => void removeSegment()}
      />
    </div>
  );
}

function FileInput({
  ref,
  onPick,
}: {
  ref: Ref<HTMLInputElement>;
  onPick: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
}) {
  return (
    <input
      ref={ref}
      type="file"
      // `video/*` opens the gallery on a phone; the extensions catch a desktop that types files
      // by extension only.
      accept="video/*,.mp4,.mov,.m4v"
      hidden
      aria-hidden="true"
      tabIndex={-1}
      onChange={(e) => void onPick(e)}
    />
  );
}

/**
 * The scrubber: a range input over a strip that draws the marked pieces, the pending start and
 * the playhead, so where the next exercise begins is visible at a glance.
 */
function Scrubber({
  now,
  durationS,
  segments,
  pendingIn,
  selectedId,
  onSeek,
  label,
}: {
  now: number;
  durationS: number | null;
  segments: readonly Segment[];
  pendingIn: number | null;
  selectedId: string | null;
  onSeek: (t: number) => void;
  label: string;
}) {
  const d = durationS && durationS > 0 ? durationS : 0;
  const pct = (v: number) => (d > 0 ? `${Math.min(100, Math.max(0, (v / d) * 100))}%` : '0%');
  return (
    <div className="relative h-11">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 bg-surface-3">
        {segments.map((s) => (
          <span
            key={s.id}
            className={clsx(
              'absolute inset-y-0',
              s.id === selectedId
                ? 'bg-accent'
                : s.upload === 'done'
                  ? 'bg-success/70'
                  : 'bg-text/40',
            )}
            style={{ left: pct(s.startS), width: `calc(${pct(s.endS)} - ${pct(s.startS)})` }}
          />
        ))}
        {pendingIn !== null ? (
          <span className="absolute -inset-y-1 w-0.5 bg-accent" style={{ left: pct(pendingIn) }} />
        ) : null}
        <span className="absolute -inset-y-2 w-0.5 bg-text" style={{ left: pct(now) }} />
      </div>
      <input
        type="range"
        aria-label={label}
        min={0}
        max={d || 1}
        step={0.01}
        value={Math.min(now, d || 1)}
        disabled={d === 0}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}

const STATE_KEY = {
  idle: 'app.studioStateIdle',
  cutting: 'app.studioStateCutting',
  uploading: 'app.studioStateUploading',
  registering: 'app.studioStateRegistering',
  done: 'app.studioStateDone',
  error: 'app.studioStateError',
} as const;

function SegmentRow({
  index,
  seg,
  thumb,
  selected,
  playing,
  busy,
  onSelect,
  onLabel,
  onCrop,
  onRemove,
  onRetry,
}: {
  index: number;
  seg: Segment;
  thumb: string | null;
  selected: boolean;
  playing: boolean;
  busy: boolean;
  onSelect: () => void;
  onLabel: () => void;
  onCrop: () => void;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const { t } = useT();
  const working =
    seg.upload === 'cutting' || seg.upload === 'uploading' || seg.upload === 'registering';
  const kind = (seg.error as UploadErrorKind | null) ?? null;
  const pct = Math.round(seg.progress * 100);
  return (
    <li
      className={clsx(
        'flex flex-col gap-2 border-t border-border py-3',
        selected && 'bg-surface-2',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        disabled={busy}
        className="flex items-center gap-3 px-1 text-left"
      >
        <span className="numeral tabular w-6 shrink-0 text-[13px] text-muted-2">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="relative h-12 w-20 shrink-0 overflow-hidden bg-surface-3">
          {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : null}
          {playing ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent" /> : null}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span
            className={clsx(
              'truncate text-[15px]',
              seg.exerciseName ? 'font-medium' : 'text-muted',
            )}
          >
            {seg.exerciseName ?? seg.exerciseId ?? t('app.studioNoLabel')}
          </span>
          <span className="tabular text-[13px] text-muted-2">
            {t('app.studioClipSpan', {
              start: formatTimecode(seg.startS),
              end: formatTimecode(seg.endS),
              len: segmentSeconds(seg),
            })}
          </span>
        </span>
        <Chip
          size="sm"
          tone={
            seg.upload === 'done'
              ? 'success'
              : seg.upload === 'error'
                ? 'danger'
                : working
                  ? 'accent'
                  : 'default'
          }
          className="shrink-0"
        >
          {t(STATE_KEY[seg.upload], { pct })}
        </Chip>
      </button>

      {working ? (
        <ProgressBar
          value={seg.upload === 'registering' ? 100 : pct}
          size="sm"
          tone="accent"
          label={t(STATE_KEY[seg.upload], { pct })}
          className="mx-1"
        />
      ) : null}

      {seg.upload === 'error' && kind ? (
        <div className="flex items-start gap-2 px-1">
          <p role="alert" className="min-w-0 flex-1 text-[13px] text-danger">
            {t(UPLOAD_ERROR_KEY[kind] ?? 'app.studioErrServer', {
              limit: formatBytes(RAW_FILE_SIZE_LIMIT),
            })}
          </p>
          {isRetryable(kind) ? (
            <Button size="sm" variant="secondary" disabled={busy} onClick={onRetry}>
              {t('common.retry')}
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1.5 px-1">
        <Chip size="sm" onClick={onLabel} disabled={working}>
          {t('app.studioSegmentLabel')}
        </Chip>
        <Chip size="sm" onClick={onCrop} disabled={working}>
          {t('app.studioSegmentCrop')}:{' '}
          {seg.crop ? t('app.studioCropSet') : t('app.studioCropFull')}
        </Chip>
        <Chip size="sm" tone="danger" onClick={onRemove} disabled={working || busy}>
          {t('app.studioSegmentRemove')}
        </Chip>
      </div>
    </li>
  );
}
