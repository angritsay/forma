/**
 * «Превью», the studio's last step: each clip the way the athlete will see it, framed by hand, and
 * «Отправить в обработку».
 *
 * Side by side, for the clip chosen in the strip above them:
 *
 *  - **the workout card** — the markup of `PlanBlocks`' `PlanItem` (a 4:3 picture covered from the
 *    clip, the target large, the name small), with the target in the exercise's unit;
 *  - **the player** — a phone-sized copy of the player's screen at 390 × 844, scaled to fit: the
 *    stage of `PLAYER_STAGE` (under the clock's band when there is one, 120 px into the glass
 *    panel), the clip full-width and lifted by `.player-art-lift`'s −11.5 %, and in it `BigClock`
 *    «0:40» for a timed exercise (`unit: 'seconds'`, the plank) or the `Stepper` count «12» for a
 *    rep exercise (the squat). The phone layout is drawn whatever the admin's screen: the classes
 *    of `layout.ts` switch to the desktop player at `md`, which this copy must not follow.
 *
 * Both are the same picture — the auto pass and the grade through WebGL, played the way the play
 * mode says (`FramedClip`). Dragging the player's picture moves it, a pinch, the wheel or the
 * slider zooms it; the frame is always the player's 9:16 (`framing.ts`), stored as the clip's crop
 * when a gesture ends, and that crop is what the worker renders.
 */
import { clsx } from 'clsx';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { useToast } from '@/components/ui/Toast';
import { cropToDb, saveMediaClip, type MediaClip } from '@/lib/api/mediaStudio';
import type { Crop } from '@/lib/media/crop';
import { useT } from '@/app/hooks/useT';
import { BigClock } from '@/app/features/player/BigClock';
import { Stepper } from '@/app/features/player/Stepper';
import { StepHeading } from '@/app/features/player/steps/StepHeading';
import { useAutoParams } from './grade/autoSample';
import { ClipStatusChip } from './grade/ClipStatus';
import type { Size } from './grade/previewGeometry';
import { isBusy, isRetryable, isUnsent } from './grade/selection';
import { PLAYBACK_KEYS, studioErrorTitle, workerErrorText } from './grade/studioErrors';
import { clipDuration, previewWindow } from './grade/time';
import { useQueueActions } from './grade/useQueueActions';
import { useRawSource } from './grade/useRawSource';
import { previewPlayback, stillDefault } from './playMode';
import { FramedClip, type FramedProblem } from './preview/FramedClip';
import {
  cropFromFraming,
  DEFAULT_FRAMING,
  framingFromCrop,
  MAX_ZOOM,
  MIN_ZOOM,
  panFraming,
  zoomFraming,
  type Framing,
} from './preview/framing';

/** The phone the player is drawn on, CSS pixels (an iPhone 14/15). */
const PHONE = { w: 390, h: 844 } as const;
/** The header row, the clock's band under it, the glass panel at the foot and how far the stage
 * runs under it (`PLAYER_STAGE`: 120 px). Measured off the player on that phone. */
const HEADER_H = 56;
const BAND_H = 112;
const PANEL_H = 300;
const PANEL_OVERLAP = 120;
/** The targets the preview shows: a typical work interval and a typical set. */
const SAMPLE_SECONDS = 40;
const SAMPLE_REPS = 12;

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

export interface PreviewStepProps {
  clips: readonly MediaClip[];
  activeId: string | null;
  onActive: (clipId: string) => void;
  onSaved: (clip: MediaClip) => void;
  onReload: () => void;
}

export function PreviewStep({ clips, activeId, onActive, onSaved, onReload }: PreviewStepProps) {
  const { t } = useT();
  const active = clips.find((c) => c.id === activeId) ?? clips[0] ?? null;
  const actions = useQueueActions(clips, onReload);
  const queueable = clips.filter(isUnsent);
  const failed = clips.filter(isRetryable);
  const index = active ? clips.indexOf(active) : -1;

  return (
    <div className="flex flex-col gap-4 py-4">
      <p className="text-[15px] text-muted">{t('app.studioPreviewLead')}</p>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ol className="flex gap-2 pb-1">
          {clips.map((c, i) => (
            <li key={c.id} className="shrink-0">
              <button
                type="button"
                aria-current={c.id === active?.id ? 'true' : undefined}
                onClick={() => onActive(c.id)}
                className={clsx(
                  'flex max-w-[180px] flex-col items-start gap-0.5 rounded-control border px-3 py-2 text-left',
                  c.id === active?.id ? 'border-accent bg-surface-2' : 'border-border',
                )}
              >
                <span className="numeral tabular text-[11px] text-muted-2">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="w-full truncate text-[13px] font-medium">
                  {c.exerciseName ?? c.exerciseId}
                </span>
                <ClipStatusChip status={c.status} />
              </button>
            </li>
          ))}
        </ol>
      </div>

      {active ? (
        <ClipPreview
          key={active.id}
          clip={active}
          onSaved={onSaved}
          prevId={index > 0 ? clips[index - 1]!.id : null}
          nextId={index < clips.length - 1 ? clips[index + 1]!.id : null}
          onGo={onActive}
          onRetry={() => actions.retry([active.id])}
          retrying={actions.busy}
        />
      ) : null}

      <div className="sticky bottom-[var(--nav-inset,0px)] z-10 -mx-4 flex flex-col gap-2 border-t border-border bg-bg px-4 pt-3 pb-[calc(var(--safe-bottom)+16px)] sm:mx-0 sm:px-0">
        <Button
          fullWidth
          loading={actions.busy}
          disabled={queueable.length === 0}
          onClick={() => actions.queue(queueable.map((c) => c.id))}
        >
          {queueable.length > 0
            ? t('app.studioSendAll', { n: queueable.length })
            : t('app.studioSendNothing')}
        </Button>
        {failed.length > 0 ? (
          <Button
            fullWidth
            variant="secondary"
            loading={actions.busy}
            onClick={() => actions.retry(failed.map((c) => c.id))}
          >
            {t('app.studioRetryN', { n: failed.length })}
          </Button>
        ) : null}
      </div>
      {actions.dialog}
    </div>
  );
}

function ClipPreview({
  clip,
  prevId,
  nextId,
  onGo,
  onSaved,
  onRetry,
  retrying,
}: {
  clip: MediaClip;
  prevId: string | null;
  nextId: string | null;
  onGo: (id: string) => void;
  onSaved: (clip: MediaClip) => void;
  onRetry: () => void;
  retrying: boolean;
}) {
  const tr = useT();
  const { t } = tr;
  const toast = useToast();
  const source = useRawSource(clip.rawPath);
  const win = useMemo(() => previewWindow(clip), [clip]);
  const auto = useAutoParams(clip, source.src, win);
  const mirror = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [video, setVideo] = useState<Size>({ w: 0, h: 0 });
  const [framing, setFraming] = useState<Framing>(DEFAULT_FRAMING);
  const [problem, setProblem] = useState<FramedProblem | null>(null);
  const [replay, setReplay] = useState(0);
  const [ended, setEnded] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = isBusy(clip);

  const crop: Crop | null = useMemo(
    () => (video.w > 0 ? cropFromFraming(framing, video.w, video.h) : clip.crop),
    [clip.crop, framing, video],
  );
  const dirty = video.w > 0 && !same(cropToDb(crop), cropToDb(clip.crop));
  const playback = previewPlayback(clip.playMode);
  const stillAt = clip.stillAtS ?? stillDefault(clipDuration(clip));
  const timed = clip.exerciseUnit === 'seconds';

  const onVideoSize = useCallback(
    (size: Size) => {
      setVideo(size);
      setFraming(framingFromCrop(clip.crop, size.w, size.h));
    },
    [clip.crop],
  );

  // The latest framing for the save at the end of a gesture (state is a render behind).
  const latest = useRef({ crop, dirty });
  latest.current = { crop, dirty };

  const [saveTick, setSaveTick] = useState(0);
  // One save at a time: a gesture that ends while one is out saves again after it, so an older
  // answer never lands last and puts back a framing she has already moved on from.
  const inflight = useRef(false);
  const again = useRef(false);
  const save = useCallback(async () => {
    if (inflight.current) {
      again.current = true;
      return;
    }
    const { crop: c, dirty: d } = latest.current;
    if (!d || busy) return;
    inflight.current = true;
    setSaving(true);
    try {
      onSaved(await saveMediaClip(clip.id, { crop: c }));
    } catch (e) {
      again.current = false;
      toast.show({ kind: 'error', title: studioErrorTitle(tr, e, 'app.studioSaveError') });
    } finally {
      inflight.current = false;
      setSaving(false);
      if (again.current) {
        again.current = false;
        setSaveTick((n) => n + 1);
      }
    }
  }, [busy, clip.id, onSaved, toast, tr]);

  const onGesture = useCallback(
    (g: { dx: number; dy: number; scale: number; box: Size }) => {
      if (busy || video.w === 0) return;
      setFraming((f) => {
        let next = f;
        if (g.scale !== 1) next = zoomFraming(next, next.zoom * g.scale, video.w, video.h);
        if (g.dx !== 0 || g.dy !== 0) {
          next = panFraming(next, g.dx, g.dy, g.box.w, g.box.h, video.w, video.h);
        }
        return next;
      });
    },
    [busy, video],
  );

  const onProblem = useCallback((p: FramedProblem | null) => setProblem(p), []);

  // A gesture's save runs after the render that holds its last framing.
  useEffect(() => {
    if (saveTick > 0) void save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveTick]);
  const onGestureEnd = useCallback(() => setSaveTick((n) => n + 1), []);

  useEffect(() => setEnded(false), [replay, playback]);

  const shownProblem: FramedProblem | null = source.problem ?? problem;
  const worker = clip.status === 'failed' ? workerErrorText(clip.error) : null;
  const name = clip.exerciseName ?? clip.exerciseId ?? '';
  const unit = clip.exerciseUnit ?? 'reps';
  const target = timed ? SAMPLE_SECONDS : SAMPLE_REPS;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-center gap-6">
        {/* The card in the workout (PlanBlocks' PlanItem): a 4:3 picture, the target, the name. */}
        <figure className="flex w-[165px] flex-col gap-2">
          <figcaption className="eyebrow text-muted-2">{t('app.studioPreviewCard')}</figcaption>
          <div className="flex flex-col gap-2.5">
            <span className="relative isolate flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-tile bg-surface-2">
              <canvas ref={mirror} className="absolute inset-0 size-full" />
            </span>
            <span className="flex flex-col gap-1 px-0.5">
              <span className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="numeral tabular text-[28px] leading-none">{target}</span>
                <span className="text-xs text-muted">{t(`training.${unit}`)}</span>
              </span>
              <span className="line-clamp-2 text-sm leading-snug font-medium">{name}</span>
            </span>
          </div>
        </figure>

        <figure className="flex w-[260px] max-w-full flex-col gap-2">
          <figcaption className="eyebrow text-muted-2">{t('app.studioPreviewPlayer')}</figcaption>
          <PhoneFrame>
            <div
              ref={stage}
              className={clsx(
                'absolute inset-x-0 flex touch-none items-center overflow-hidden select-none',
                busy ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing',
              )}
              style={{
                top: timed ? HEADER_H + BAND_H : 0,
                bottom: PANEL_H - PANEL_OVERLAP,
              }}
              aria-label={t('app.studioFrameDrag')}
              role="img"
            >
              <FramedClip
                src={source.src}
                win={win}
                grade={clip.grade}
                auto={auto.params}
                crop={crop}
                playback={playback}
                stillAt={stillAt}
                replay={replay}
                mirror={mirror}
                dragArea={stage}
                onVideoSize={onVideoSize}
                onGesture={onGesture}
                onGestureEnd={onGestureEnd}
                onProblem={onProblem}
                onEnded={() => setEnded(true)}
                className="player-art-lift block aspect-[9/16] w-full"
                // The lift as on a phone: `.player-art-lift` drops it from `md`, by the viewport.
                canvasStyle={{ '--art-lift': '-11.5%' } as CSSProperties}
              />
            </div>
            {timed ? (
              <div
                className="glass-bar-top glass-sheer pointer-events-none absolute inset-x-0 px-6 pt-2 pb-4 text-paper"
                style={{ top: HEADER_H, height: BAND_H }}
              >
                <BigClock seconds={SAMPLE_SECONDS} />
              </div>
            ) : null}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0"
              style={{ height: PANEL_H }}
            >
              <div className="glass-bar glass-sheer absolute inset-0" />
              <div className="relative flex flex-col gap-4 px-6 pt-6">
                <StepHeading title={name} />
                {timed ? null : (
                  <Stepper
                    value={SAMPLE_REPS}
                    onChange={() => undefined}
                    unit={t(`training.${unit}`)}
                    decreaseLabel={t('app.playerDecrease')}
                    increaseLabel={t('app.playerIncrease')}
                  />
                )}
                <Button variant="action" size="lg" fullWidth tabIndex={-1}>
                  {t('app.playerDone')}
                </Button>
              </div>
            </div>
          </PhoneFrame>
        </figure>
      </div>

      {shownProblem ? (
        <p role="status" className="text-center text-[13px] text-warning">
          {shownProblem === 'nogl' ? t('app.studioGlUnsupported') : t(PLAYBACK_KEYS[shownProblem])}
        </p>
      ) : null}
      {auto.state === 'working' ? (
        <p className="text-center text-[13px] text-muted">{t('app.studioAutoWorking')}</p>
      ) : null}

      <div className="mx-auto flex w-full max-w-md flex-col gap-3">
        {/* The slider is a gesture too: saved when it is let go, like a drag or a pinch. */}
        <div
          className="flex flex-col gap-1"
          onPointerUp={onGestureEnd}
          onKeyUp={onGestureEnd}
          onBlur={onGestureEnd}
        >
          <span className="flex items-baseline justify-between text-[13px] text-muted">
            <span>{t('app.studioZoom')}</span>
            <span className="numeral tabular">×{framing.zoom.toFixed(2)}</span>
          </span>
          <Slider
            value={framing.zoom}
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            disabled={busy || video.w === 0}
            ariaLabel={t('app.studioZoom')}
            valueText={`×${framing.zoom.toFixed(2)}`}
            onChange={(z) => setFraming((f) => zoomFraming(f, z, video.w, video.h))}
          />
        </div>
        <p className="text-[13px] text-muted">{t('app.studioFrameHint')}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            loading={saving}
            disabled={!dirty || busy}
            onClick={() => void save()}
          >
            {dirty ? t('app.studioFrameSave') : t('app.studioSavedState')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy || video.w === 0}
            onClick={() => {
              setFraming(DEFAULT_FRAMING);
              setSaveTick((n) => n + 1);
            }}
          >
            {t('app.studioFrameCentre')}
          </Button>
          {playback === 'once' ? (
            <Button
              size="sm"
              variant="ghost"
              disabled={!ended}
              onClick={() => setReplay((n) => n + 1)}
            >
              {t('app.studioReplay')}
            </Button>
          ) : null}
        </div>
        <p className="text-[13px] text-muted">
          {t(
            clip.playMode === 'once'
              ? 'app.studioPreviewOnce'
              : clip.playMode === 'still'
                ? 'app.studioPreviewStill'
                : 'app.studioPreviewLoop',
          )}
        </p>
        {busy ? <p className="text-[13px] text-warning">{t('app.studioNoteRendering')}</p> : null}
        {worker ? (
          <div className="flex flex-col gap-1 rounded-control border border-border-strong p-3 text-[13px]">
            <p className="text-danger">{t(worker.key)}</p>
            {worker.detail ? (
              <p className="font-mono text-[12px] break-words text-muted">{worker.detail}</p>
            ) : null}
            <div>
              <Button size="sm" variant="secondary" loading={retrying} onClick={onRetry}>
                {t('app.studioRetry')}
              </Button>
            </div>
          </div>
        ) : null}
        <div className="flex justify-between gap-2">
          <Button
            size="sm"
            variant="ghost"
            disabled={!prevId}
            onClick={() => prevId && onGo(prevId)}
          >
            {t('app.studioPrev')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={!nextId}
            onClick={() => nextId && onGo(nextId)}
          >
            {t('app.studioNext')}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * The phone the player is drawn on: a 390 × 844 box laid out in real pixels, scaled to the width it
 * has, so every size inside it is the player's own.
 */
function PhoneFrame({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(260 / PHONE.w);
  useEffect(() => {
    const el = outer.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => {
      if (e && e.contentRect.width > 0) setScale(e.contentRect.width / PHONE.w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div
      ref={outer}
      className="relative w-full overflow-hidden rounded-[24px] border border-border bg-bg"
      style={{ height: PHONE.h * scale }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left text-paper"
        style={{ width: PHONE.w, height: PHONE.h, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
