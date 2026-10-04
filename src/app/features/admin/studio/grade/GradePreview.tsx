/**
 * The raw clip, graded live: a hidden `<video>` decodes, a WebGL2 canvas draws each frame through
 * the grade's LUT (`glPreview.ts`), and the crop frame sits on top while it is being edited.
 *
 * - **Frames:** `requestVideoFrameCallback` where the browser has it (every decoded frame, no
 *   more), `requestAnimationFrame` while playing where it does not (older iOS WebViews). A slider
 *   moved on a paused clip redraws the last frame without touching the video.
 * - **The clip, not the piece:** the uploaded piece starts at a keyframe before the mark. The
 *   player shows and loops only `previewWindow(...)`, the span the worker will cut (`time.ts`).
 * - **Crop:** applied in the picture (the canvas samples only the crop) except while the «Кадр»
 *   tab is open, when the whole frame is drawn and the frame overlay is shown over it.
 * - **Without WebGL2** (or a lost context, or a video that will not hand its pixels over), the
 *   plain video is shown, cropped with CSS, under an honest line: the colour is not previewed here,
 *   but it is saved and the render applies it all the same.
 */
import { clsx } from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Spinner } from '@/components/ui/Spinner';
import type { Crop } from '@/lib/media/crop';
import { defaultGrade, gradeToLut, type GradeParams } from '@/lib/media/grade';
import { useT } from '@/app/hooks/useT';
import { CropOverlay } from './CropOverlay';
import { GradeRenderer } from './glPreview';
import { backingSize, cropUniform, fitInside, shownPixels, type Size } from './previewGeometry';
import { mediaErrorProblem, PLAYBACK_KEYS, type PlaybackProblem } from './studioErrors';
import { clipTime, formatClock, wrapTime, type PlayWindow } from './time';

type VideoWithFrames = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: () => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

/** Why the colour is not on screen even though the video plays. */
type GlProblem = 'unsupported' | 'lost' | 'tainted';

export interface GradePreviewProps {
  /** A playable URL for the raw piece, or null while it is being signed / when it cannot be. */
  src: string | null;
  /** Why there is no `src`, when there is none for good. */
  problem: PlaybackProblem | null;
  win: PlayWindow;
  grade: GradeParams | null;
  crop: Crop | null;
  /** The crop tab is open: draw the whole frame and the editable overlay. */
  editingCrop: boolean;
  onCropChange: (crop: Crop | null) => void;
  /** Normalised `w / h` the crop keeps, or null. */
  cropRatio: number | null;
  /** The video's displayed pixel size, once known (for aspect presets). */
  onVideoSize: (size: Size) => void;
  /**
   * Sign the piece again. A signed URL expires; a video that stalls on a network error after a
   * long pause is usually that, and reloading the same URL would fail the same way.
   */
  onRetrySource?: () => void;
  readOnly?: boolean;
}

export function GradePreview({
  src,
  problem,
  win,
  grade,
  crop,
  editingCrop,
  onCropChange,
  cropRatio,
  onVideoSize,
  onRetrySource,
  readOnly,
}: GradePreviewProps) {
  const { t } = useT();
  const room = useRef<HTMLDivElement>(null);
  const video = useRef<VideoWithFrames>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<GradeRenderer | null>(null);
  const [roomSize, setRoomSize] = useState<Size>({ w: 0, h: 0 });
  const [videoSize, setVideoSize] = useState<Size>({ w: 0, h: 0 });
  const [glProblem, setGlProblem] = useState<GlProblem | null>(null);
  const [playProblem, setPlayProblem] = useState<PlaybackProblem | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [bypass, setBypass] = useState(false);
  const [now, setNow] = useState(win.from);
  const [glKey, setGlKey] = useState(0);

  const lut = useMemo(() => gradeToLut(grade ?? defaultGrade()), [grade]);
  const applyCrop = !editingCrop;
  const uniform = useMemo(() => cropUniform(crop, applyCrop), [crop, applyCrop]);

  // What is drawn decides the box: the crop's aspect, or the frame's while the crop is edited.
  const content = videoSize.w > 0 ? shownPixels(videoSize, crop, applyCrop) : { w: 16, h: 9 };
  const box = fitInside(content, roomSize);

  // Live values for the frame loop, which is set up once per video.
  const live = useRef({ uniform, bypass, win, onVideoSize });
  live.current = { uniform, bypass, win, onVideoSize };

  const draw = useCallback((upload: boolean) => {
    const r = renderer.current;
    if (!r) return;
    if (r.isContextLost()) {
      setGlProblem('lost');
      return;
    }
    const result = r.draw(
      video.current,
      { crop: live.current.uniform, bypass: live.current.bypass },
      upload,
    );
    if (result === 'tainted') setGlProblem('tainted');
  }, []);

  // The room the preview may take: the container's width and at most 45% of the screen height.
  useEffect(() => {
    const el = room.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const w = entry.contentRect.width;
      const h = Math.max(160, Math.round(window.innerHeight * 0.45));
      setRoomSize({ w, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The renderer: once per canvas, again after a lost context is retried.
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const r = GradeRenderer.create(el);
    if (!r) {
      setGlProblem('unsupported');
      return;
    }
    renderer.current = r;
    setGlProblem(null);
    const lost = (e: Event) => {
      e.preventDefault();
      setGlProblem('lost');
    };
    el.addEventListener('webglcontextlost', lost);
    return () => {
      el.removeEventListener('webglcontextlost', lost);
      r.dispose();
      renderer.current = null;
    };
  }, [glKey]);

  // A new grade: upload the LUT and redraw the frame on screen.
  useEffect(() => {
    const r = renderer.current;
    if (!r || glProblem) return;
    r.setLut(lut);
    draw(false);
  }, [lut, glProblem, glKey, draw]);

  // Crop or before/after changed: redraw. The backing store follows the box.
  useEffect(() => {
    const el = canvas.current;
    if (el && box.w > 0 && box.h > 0) {
      const b = backingSize(box, window.devicePixelRatio, content);
      if (el.width !== b.w) el.width = b.w;
      if (el.height !== b.h) el.height = b.h;
    }
    draw(false);
    // `content` follows from the same inputs as `box`; `glKey` is a new canvas (300×150) to size.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box.w, box.h, uniform, bypass, draw, glKey]);

  // A new source: reset the player state.
  useEffect(() => {
    setReady(false);
    setPlaying(false);
    setPlayProblem(null);
  }, [src]);

  // The frame loop.
  useEffect(() => {
    const v = video.current;
    if (!v || !src) return;
    let handle = 0;
    let raf = 0;
    let stopped = false;

    const tick = () => {
      if (stopped) return;
      const w = live.current.win;
      const want = wrapTime(v.currentTime, w);
      if (want !== v.currentTime) v.currentTime = want;
      // The clock reads tenths: re-render the controls ten times a second, not every frame.
      setNow((prev) => (Math.abs(prev - v.currentTime) >= 0.1 ? v.currentTime : prev));
      draw(true);
    };
    const onFrame = () => {
      tick();
      if (!stopped && v.requestVideoFrameCallback) handle = v.requestVideoFrameCallback(onFrame);
    };
    const onRaf = () => {
      tick();
      if (!stopped && !v.paused) raf = requestAnimationFrame(onRaf);
    };

    const onMeta = () => {
      const size = { w: v.videoWidth, h: v.videoHeight };
      setVideoSize(size);
      live.current.onVideoSize(size);
      v.currentTime = live.current.win.from;
      /*
       * iOS WebViews load metadata but no picture until something plays. A muted inline play
       * and an immediate pause bring the first frame in; a refusal leaves the play button.
       */
      if (v.readyState < 2) {
        v.play()
          .then(() => v.pause())
          .catch(() => undefined);
      }
    };
    const onData = () => {
      setReady(true);
      draw(true);
    };
    const onPlay = () => {
      setPlaying(true);
      if (!v.requestVideoFrameCallback) raf = requestAnimationFrame(onRaf);
    };
    const onPause = () => setPlaying(false);
    /*
     * The piece usually ends where the clip does, so the last frame sits less than the slack
     * before `win.to` and the wrap in `tick` never fires: the video just ends. Loop from here.
     */
    const onEnded = () => {
      v.currentTime = live.current.win.from;
      v.play().catch(() => setPlaying(false));
    };
    const onSeeked = () => {
      setNow(v.currentTime);
      draw(true);
    };
    const onError = () => setPlayProblem(mediaErrorProblem(v.error?.code));

    if (v.requestVideoFrameCallback) handle = v.requestVideoFrameCallback(onFrame);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('loadeddata', onData);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onEnded);
    v.addEventListener('seeked', onSeeked);
    v.addEventListener('timeupdate', onSeeked);
    v.addEventListener('error', onError);
    // A cached piece can be ready before the listeners are: catch up.
    if (v.readyState >= 1) onMeta();
    if (v.readyState >= 2) onData();
    return () => {
      stopped = true;
      if (handle && v.cancelVideoFrameCallback) v.cancelVideoFrameCallback(handle);
      if (raf) cancelAnimationFrame(raf);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('loadeddata', onData);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ended', onEnded);
      v.removeEventListener('seeked', onSeeked);
      v.removeEventListener('timeupdate', onSeeked);
      v.removeEventListener('error', onError);
    };
  }, [src, draw, glKey]);

  /*
   * Stop and release the decoder when the screen goes away: a WebView keeps playing a detached
   * video, and iOS holds a decoded HEVC piece in memory until its source is dropped.
   */
  useEffect(() => {
    const v = video.current;
    return () => {
      if (!v) return;
      v.pause();
      v.removeAttribute('src');
      v.load();
    };
  }, []);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => setPlaying(false));
    } else {
      v.pause();
    }
  };

  const seek = (clipSeconds: number) => {
    const v = video.current;
    if (!v) return;
    v.currentTime = Math.min(win.to - 0.01, Math.max(win.from, win.from + clipSeconds));
  };

  const shownProblem = problem ?? playProblem;
  const useGl = glProblem === null;
  const duration = Math.max(0, win.to - win.from);

  // Without the canvas the video itself is shown, scaled and shifted so only the crop is visible.
  const cssCrop: CSSProperties | undefined =
    !useGl && applyCrop && crop
      ? {
          position: 'absolute',
          width: `${100 / crop.w}%`,
          height: `${100 / crop.h}%`,
          left: `${(-crop.x / crop.w) * 100}%`,
          top: `${(-crop.y / crop.h) * 100}%`,
          maxWidth: 'none',
        }
      : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div ref={room} className="flex w-full justify-center">
        <div
          className="relative overflow-hidden rounded-control bg-ink"
          style={{ width: box.w || '100%', height: box.h || 220 }}
        >
          <video
            ref={video}
            src={src ?? undefined}
            crossOrigin="anonymous"
            muted
            playsInline
            preload="auto"
            aria-hidden={useGl}
            className={clsx(
              useGl
                ? 'pointer-events-none absolute left-0 top-0 h-px w-px opacity-0'
                : cssCrop
                  ? ''
                  : 'absolute inset-0 h-full w-full object-contain',
            )}
            style={cssCrop}
          />
          <canvas
            ref={canvas}
            key={glKey}
            className={clsx('absolute inset-0 h-full w-full', !useGl && 'hidden')}
            aria-label={t('app.studioPreviewLabel')}
            role="img"
          />
          {editingCrop && videoSize.w > 0 ? (
            <CropOverlay
              crop={crop}
              onChange={onCropChange}
              ratio={cropRatio}
              disabled={readOnly}
            />
          ) : null}
          {shownProblem ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-[14px] text-white">
              <span>{t(PLAYBACK_KEYS[shownProblem])}</span>
              {playProblem === 'network' && !problem ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setPlayProblem(null);
                    if (onRetrySource) onRetrySource();
                    else video.current?.load();
                  }}
                >
                  {t('common.retry')}
                </Button>
              ) : null}
            </div>
          ) : !src || !ready ? (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <Spinner size={20} />
            </div>
          ) : null}
          {bypass ? (
            <span className="absolute left-2 top-2 rounded-control bg-ink/70 px-2 py-0.5 text-[12px] text-white">
              {t('app.studioBefore')}
            </span>
          ) : null}
        </div>
      </div>

      {glProblem ? (
        <div role="status" className="flex flex-wrap items-center gap-2 text-[13px] text-warning">
          <span>
            {t(
              glProblem === 'unsupported'
                ? 'app.studioGlUnsupported'
                : glProblem === 'tainted'
                  ? 'app.studioGlTainted'
                  : 'app.studioGlLost',
            )}
          </span>
          {glProblem === 'lost' ? (
            <Button size="sm" variant="ghost" onClick={() => setGlKey((k) => k + 1)}>
              {t('common.retry')}
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <IconButton
          label={playing ? t('app.studioPause') : t('app.studioPlay')}
          icon={playing ? 'pause' : 'play'}
          variant="ghost"
          disabled={!ready || shownProblem !== null}
          onClick={toggle}
        />
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.01}
          value={clipTime(now, win)}
          disabled={!ready || shownProblem !== null}
          aria-label={t('app.studioScrub')}
          aria-valuetext={formatClock(clipTime(now, win))}
          onChange={(e) => seek(Number(e.target.value))}
          className="h-8 min-w-0 flex-1 accent-[var(--accent)]"
        />
        <span className="numeral tabular w-[92px] shrink-0 text-right text-[13px] text-muted">
          {formatClock(clipTime(now, win))} / {formatClock(duration)}
        </span>
      </div>
      {useGl ? (
        <Button
          variant="secondary"
          size="sm"
          disabled={!ready}
          aria-pressed={bypass}
          // Held, not toggled: the eye compares best when the picture flips back by itself.
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setBypass(true);
          }}
          onPointerUp={() => setBypass(false)}
          onPointerCancel={() => setBypass(false)}
          onPointerLeave={() => setBypass(false)}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              setBypass(true);
            }
          }}
          onKeyUp={() => setBypass(false)}
          onContextMenu={(e) => e.preventDefault()}
          className="select-none [-webkit-touch-callout:none]"
        >
          {t('app.studioHoldBefore')}
        </Button>
      ) : null}
    </div>
  );
}
