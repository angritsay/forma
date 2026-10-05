/**
 * The cutter's timeline, the way CapCut draws one: the playhead stands still in the middle with
 * the time over it, and the video moves under it as a strip of frames with a ruler on top.
 *
 *  - **One finger** pauses the video and drags the strip, 1:1 at the zoom it is at; a quick flick
 *    glides on and slows down (not with «reduce motion»). A tap jumps to the time under it; a
 *    tap on a cut piece selects that piece.
 *  - **Two fingers** pinch the zoom, around the playhead. «−» and «+» do the same in steps, from
 *    the whole video across the strip (×1) to about two seconds across it.
 *  - **Cut pieces** are hatched bands with their number, the selected one in the accent colour;
 *    a start marked and not yet closed is an accent line.
 *
 * Why it is not a range input any more: on iOS a tap on a range track does nothing, and only a
 * drag that starts on the thumb moves it — and that thumb was invisible.
 *
 * It runs on Pointer Events with `touch-action: none` and pointer capture. A finger moving does
 * not re-render React: the strip is moved by a transform and the time is written straight into
 * the bubble, and the cutter is told the new time at most once a frame. What React renders —
 * ticks, frames, pieces — is only the few screens around the playhead (`drawWindow`), and changes
 * when the playhead crosses into the next screen or the zoom changes.
 *
 * The geometry is `timelineView.ts`; the frames come from a second, hidden `<video>` (below).
 */
import { clsx } from 'clsx';
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import { IconButton } from '@/components/ui/IconButton';
import { useT } from '@/app/hooks/useT';
import { cutAt, formatTimecode, type Segment } from './timeline';
import {
  clampZoom,
  drawCell,
  drawWindow,
  dragTime,
  fillOrder,
  FLING_START,
  flingVelocity,
  maxZoom,
  pinchZoom,
  pxPerSecond,
  releaseVelocity,
  rulerLabel,
  rulerSteps,
  rulerTicks,
  stepZoom,
  stripOffset,
  timeAtX,
} from './timelineView';

/** A finger that moves less than this is a tap. */
const TAP_SLOP_PX = 6;
/** Zoomed out this far, a moving finger asks for keyframes (`fastSeek`), the release for the frame. */
const FAST_SEEK_SPAN_S = 20;
/** Frames in the filmstrip, whatever the zoom, and the widest one drawn. */
const FILM_FRAMES = 40;
const FILM_MAX_WIDTH = 64;

/** The strip's rows, px: the ruler, then the frames with the pieces over them. */
const RULER_H = 20;
const FILM_TOP = 24;
const FILM_H = 48;
const STRIP_H = FILM_TOP + FILM_H + 6;

/** Diagonal hatching for a range that is cut: it must not read as free footage. */
const CUT_HATCH: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(135deg, color-mix(in srgb, currentColor 35%, transparent) 0 2px, transparent 2px 6px)',
};

export interface TimelineProps {
  now: number;
  durationS: number | null;
  fps: number | null;
  segments: readonly Segment[];
  pendingIn: number | null;
  selectedId: string | null;
  /** The video's `blob:` URL, for the filmstrip. */
  videoUrl: string | null;
  playing: boolean;
  /** A finger went down on the strip: the cutter pauses. */
  onScrubStart: () => void;
  /** Go to `t`; `fast` while a finger is still moving over a zoomed-out strip. */
  onSeek: (t: number, fast: boolean) => void;
  /** A tap on a cut piece that is not selected. */
  onSelect: (id: string) => void;
  label: string;
}

type Gesture =
  | {
      kind: 'drag';
      id: number;
      startX: number;
      startT: number;
      moved: boolean;
      samples: { x: number; at: number }[];
    }
  | { kind: 'pinch'; startDist: number; startZoom: number; dragged: boolean }
  | { kind: 'fling' };

const reducedMotion = (): boolean => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

const distance = (a: { x: number; y: number }, b: { x: number; y: number }): number =>
  Math.hypot(a.x - b.x, a.y - b.y);

export function Timeline({
  now,
  durationS,
  fps,
  segments,
  pendingIn,
  selectedId,
  videoUrl,
  playing,
  onScrubStart,
  onSeek,
  onSelect,
  label,
}: TimelineProps) {
  const { t } = useT();
  const strip = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);

  const [width, setWidth] = useState(0);
  const [zoomWanted, setZoom] = useState(1);
  const d = durationS && durationS > 0 ? durationS : 0;
  const zMax = maxZoom(d || null);
  const zoom = clampZoom(zoomWanted, zMax);
  const pps = pxPerSecond(width, d || null, zoom);
  const span = pps > 0 ? width / pps : 0;
  const fast = span >= FAST_SEEK_SPAN_S;

  // What the strip shows now: the cutter's time, or the finger's while one is down.
  const viewT = useRef(now);
  const gesture = useRef<Gesture | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const [cell, setCell] = useState(0);
  const cellRef = useRef(0);
  // The filmstrip waits while she scrubs or plays: one video decoding at a time on a phone.
  const busy = useRef(false);
  busy.current = playing || gesture.current !== null;

  // --- measuring ---------------------------------------------------------------------------

  useLayoutEffect(() => {
    const el = strip.current;
    if (!el) return;
    setWidth(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // --- drawing the playhead's time -----------------------------------------------------------

  /** Moves the strip under the playhead and writes the time: no React render. */
  const show = useCallback(
    (time: number) => {
      viewT.current = time;
      const el = layer.current;
      if (el) el.style.transform = `translate3d(${stripOffset(width, time, pps)}px,0,0)`;
      if (bubble.current) bubble.current.textContent = formatTimecode(time);
      const c = drawCell(time, span);
      if (c !== cellRef.current) {
        cellRef.current = c;
        setCell(c);
      }
    },
    [width, pps, span],
  );

  // The cutter's time drives the strip, except while a finger (or its fling) does.
  useLayoutEffect(() => {
    show(gesture.current ? viewT.current : now);
  }, [now, show]);

  // --- telling the cutter, once a frame ------------------------------------------------------

  const seekRaf = useRef(0);
  const seekWanted = useRef<{ t: number; fast: boolean } | null>(null);
  const onSeekRef = useRef(onSeek);
  onSeekRef.current = onSeek;

  const seekSoon = useCallback((time: number, isFast: boolean) => {
    seekWanted.current = { t: time, fast: isFast };
    if (seekRaf.current) return;
    seekRaf.current = requestAnimationFrame(() => {
      seekRaf.current = 0;
      const w = seekWanted.current;
      seekWanted.current = null;
      if (w) onSeekRef.current(w.t, w.fast);
    });
  }, []);

  const seekNow = useCallback((time: number) => {
    if (seekRaf.current) cancelAnimationFrame(seekRaf.current);
    seekRaf.current = 0;
    seekWanted.current = null;
    onSeekRef.current(time, false);
  }, []);

  // --- fling -----------------------------------------------------------------------------------

  const flingRaf = useRef(0);
  const stopFling = useCallback(() => {
    if (flingRaf.current) cancelAnimationFrame(flingRaf.current);
    flingRaf.current = 0;
  }, []);

  const fling = (v0: number) => {
    gesture.current = { kind: 'fling' };
    busy.current = true;
    let v = v0;
    let last = performance.now();
    const step = (ts: number) => {
      const dt = Math.max(0, ts - last);
      last = ts;
      const next = dragTime(viewT.current, v * dt, pps, d);
      v = flingVelocity(v, dt);
      show(next);
      if (v === 0 || next <= 0 || next >= d) {
        flingRaf.current = 0;
        gesture.current = null;
        busy.current = playing;
        seekNow(next);
        return;
      }
      seekSoon(next, fast);
      flingRaf.current = requestAnimationFrame(step);
    };
    flingRaf.current = requestAnimationFrame(step);
  };

  // Gone mid-gesture: nothing may run on after the strip.
  useEffect(
    () => () => {
      stopFling();
      if (seekRaf.current) cancelAnimationFrame(seekRaf.current);
    },
    [stopFling],
  );

  // --- the page must not zoom or scroll under the strip ------------------------------------

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const zMaxRef = useRef(zMax);
  zMaxRef.current = zMax;

  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    // `touch-action: none` covers most of it; iOS still starts its own page pinch (`gesture*`)
    // and Telegram its swipe unless the touch moves are cancelled. Non-passive, or the cancel
    // is ignored. Cancelling a move never cancels the pointer events this strip runs on.
    const stopTouch = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
    };
    const stopGesture = (e: Event) => e.preventDefault();
    // A trackpad pinch on a computer arrives as a wheel with Ctrl held.
    let wheel = 0;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      wheel += e.deltaY;
      if (Math.abs(wheel) < 40) return;
      const dir = wheel < 0 ? 1 : -1;
      wheel = 0;
      setZoom(stepZoom(zoomRef.current, dir, zMaxRef.current));
    };
    el.addEventListener('touchmove', stopTouch, { passive: false });
    el.addEventListener('gesturestart', stopGesture, { passive: false });
    el.addEventListener('gesturechange', stopGesture, { passive: false });
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('touchmove', stopTouch);
      el.removeEventListener('gesturestart', stopGesture);
      el.removeEventListener('gesturechange', stopGesture);
      el.removeEventListener('wheel', onWheel);
    };
  }, []);

  // --- pointers ----------------------------------------------------------------------------------

  const startDrag = (id: number, x: number, at: number, moved: boolean) => {
    gesture.current = {
      kind: 'drag',
      id,
      startX: x,
      startT: viewT.current,
      moved,
      samples: [{ x, at }],
    };
    busy.current = true;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!d || pps <= 0) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // An old engine: the moves still arrive while the finger stays on the strip.
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    stopFling();
    if (pointers.current.size === 1) {
      onScrubStart();
      startDrag(e.pointerId, e.clientX, e.timeStamp, false);
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const g = gesture.current;
      gesture.current = {
        kind: 'pinch',
        startDist: Math.max(1, distance(a!, b!)),
        startZoom: zoomRef.current,
        dragged: (g?.kind === 'drag' && g.moved) || (g?.kind === 'pinch' && g.dragged),
      };
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const p = pointers.current.get(e.pointerId);
    if (!p) return;
    p.x = e.clientX;
    p.y = e.clientY;
    const g = gesture.current;
    if (!g) return;
    if (g.kind === 'pinch') {
      if (pointers.current.size < 2) return;
      const [a, b] = [...pointers.current.values()];
      const next = pinchZoom(g.startZoom, distance(a!, b!) / g.startDist, zMax);
      if (next !== zoomRef.current) setZoom(next);
      return;
    }
    if (g.kind !== 'drag' || g.id !== e.pointerId) return;
    const dx = e.clientX - g.startX;
    if (!g.moved && Math.abs(dx) < TAP_SLOP_PX) return;
    g.moved = true;
    g.samples.push({ x: e.clientX, at: e.timeStamp });
    if (g.samples.length > 8) g.samples.shift();
    const next = dragTime(g.startT, dx, pps, d);
    show(next);
    seekSoon(next, fast);
  };

  const endPointer = (e: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    if (!pointers.current.delete(e.pointerId)) return;
    const g = gesture.current;
    if (!g) return;
    if (g.kind === 'pinch') {
      // One finger left on the strip carries on as a drag from where the strip is now.
      const rest = [...pointers.current.entries()][0];
      if (rest) startDrag(rest[0], rest[1].x, e.timeStamp, true);
      else {
        gesture.current = null;
        busy.current = playing;
        // A drag before the pinch may have left the picture on a keyframe: land on the frame.
        if (g.dragged) seekNow(viewT.current);
      }
      return;
    }
    if (g.kind !== 'drag' || g.id !== e.pointerId) return;
    gesture.current = null;
    busy.current = playing;
    if (!g.moved && !cancelled) {
      const rect = e.currentTarget.getBoundingClientRect();
      const at = timeAtX(e.clientX - rect.left, width, viewT.current, pps, d);
      const piece = cutAt(segments, at);
      if (piece && piece.id !== selectedId) {
        onSelect(piece.id);
        return;
      }
      show(at);
      seekNow(at);
      return;
    }
    const v = releaseVelocity(g.samples);
    if (!cancelled && Math.abs(v) >= FLING_START && !reducedMotion()) {
      fling(v);
      return;
    }
    seekNow(viewT.current);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      setZoom(stepZoom(zoom, 1, zMax));
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      setZoom(stepZoom(zoom, -1, zMax));
    }
  };

  // --- render ------------------------------------------------------------------------------------

  const frames = useFilmstrip(videoUrl, d || null, busy);
  const win = drawWindow(cell, span);

  return (
    <div className="flex flex-col gap-1.5">
      <div
        ref={strip}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={Math.round(d * 10) / 10}
        aria-valuenow={Math.round(now * 10) / 10}
        aria-valuetext={formatTimecode(now)}
        aria-disabled={d === 0 || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endPointer(e, false)}
        onPointerCancel={(e) => endPointer(e, true)}
        onLostPointerCapture={(e) => endPointer(e, true)}
        onKeyDown={onKeyDown}
        onContextMenu={(e) => e.preventDefault()}
        className={clsx(
          'relative w-full cursor-grab touch-none overflow-hidden bg-surface-2 select-none active:cursor-grabbing',
          '[-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]',
          d === 0 && 'opacity-50',
        )}
        style={{ height: STRIP_H }}
      >
        <div
          ref={layer}
          className="pointer-events-none absolute top-0 left-0 h-full w-0"
          style={{ willChange: 'transform' }}
        >
          {pps > 0 ? (
            <StripLayers
              pps={pps}
              from={win.from}
              to={win.to}
              durationS={d}
              fps={fps}
              segments={segments}
              pendingIn={pendingIn}
              selectedId={selectedId}
              frames={frames}
              cutWord={t('app.studioCutBand')}
            />
          ) : null}
        </div>

        {/* The playhead: still, in the middle, with the time over it. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
          style={{ top: RULER_H - 2 }}
        />
        <span
          ref={bubble}
          aria-hidden="true"
          className="tabular pointer-events-none absolute top-0.5 left-1/2 -translate-x-1/2 rounded-[4px] bg-text px-1.5 py-px font-mono text-[11px] leading-[15px] text-bg"
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] text-muted-2">{t('app.studioZoomHint')}</span>
        <div className="flex items-center gap-1">
          <IconButton
            size="sm"
            variant="ghost"
            label={t('app.studioZoomOut')}
            icon={<span className="text-[18px] leading-none font-medium">−</span>}
            disabled={zoom <= 1}
            onClick={() => setZoom(stepZoom(zoom, -1, zMax))}
          />
          <span className="tabular min-w-[3.5rem] text-center text-[12px] text-muted">
            {t('app.studioZoomLevel', { z: zoom })}
          </span>
          <IconButton
            size="sm"
            variant="ghost"
            label={t('app.studioZoomIn')}
            icon={<span className="text-[18px] leading-none font-medium">+</span>}
            disabled={zoom >= zMax}
            onClick={() => setZoom(stepZoom(zoom, 1, zMax))}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * What moves under the playhead: the ruler, the frames and the cut pieces, all placed at
 * `time × pps` from time 0, and only between `from` and `to`. Memoised: the props hold still
 * while a finger moves, so a drag does not render this at all.
 */
const StripLayers = memo(function StripLayers({
  pps,
  from,
  to,
  durationS,
  fps,
  segments,
  pendingIn,
  selectedId,
  frames,
  cutWord,
}: {
  pps: number;
  from: number;
  to: number;
  durationS: number;
  fps: number | null;
  segments: readonly Segment[];
  pendingIn: number | null;
  selectedId: string | null;
  frames: readonly (string | null)[];
  cutWord: string;
}) {
  const lo = Math.max(0, from);
  const hi = Math.min(durationS, to);
  const steps = rulerSteps(pps, fps);
  const ticks = rulerTicks(lo, hi, steps, durationS);
  const slot = durationS / FILM_FRAMES;
  const firstSlot = Math.max(0, Math.floor(lo / slot));
  const lastSlot = Math.min(FILM_FRAMES - 1, Math.floor(hi / slot));
  const x = (time: number) => time * pps;

  const slots = [];
  for (let i = firstSlot; i <= lastSlot && hi > lo; i++) {
    const a = Math.max(lo, i * slot);
    const b = Math.min(hi, (i + 1) * slot);
    const src = frames[i];
    slots.push(
      <span
        key={i}
        className="absolute bg-surface-3"
        style={{
          top: FILM_TOP,
          height: FILM_H,
          left: x(a),
          width: Math.max(0, x(b) - x(a)),
          backgroundImage: src ? `url(${src})` : undefined,
          backgroundSize: 'auto 100%',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'center',
        }}
      />,
    );
  }

  return (
    <>
      {slots}
      {ticks.map((tick) => (
        <span
          key={tick.t.toFixed(4)}
          className={clsx('absolute w-px', tick.major ? 'bg-muted' : 'bg-muted-2/60')}
          style={{
            left: x(tick.t),
            top: tick.major ? RULER_H - 9 : RULER_H - 5,
            height: tick.major ? 9 : 5,
          }}
        />
      ))}
      {ticks
        .filter((tick) => tick.major)
        .map((tick) => (
          <span
            key={`l${tick.t.toFixed(4)}`}
            className="tabular absolute top-0.5 font-mono text-[10px] leading-none text-muted-2"
            style={{ left: x(tick.t) + 3 }}
          >
            {rulerLabel(tick.t, steps.major)}
          </span>
        ))}
      {segments.map((s, i) => {
        if (s.endS <= lo || s.startS >= hi) return null;
        const a = Math.max(lo, s.startS);
        const b = Math.min(hi, s.endS);
        return (
          <span
            key={s.id}
            className={clsx(
              'absolute flex items-center overflow-hidden px-1 text-[10px] leading-none whitespace-nowrap',
              s.startS >= lo && 'border-l-2',
              s.endS <= hi && 'border-r-2',
              s.id === selectedId
                ? 'border-accent bg-accent/55 text-ink'
                : s.upload === 'done'
                  ? 'border-success bg-success/35 text-text'
                  : 'border-text/60 bg-bg/55 text-text',
            )}
            style={{
              ...CUT_HATCH,
              top: FILM_TOP,
              height: FILM_H,
              left: x(a),
              width: Math.max(0, x(b) - x(a)),
            }}
          >
            <span className="truncate rounded-[3px] bg-bg/70 px-1 py-0.5 font-medium">
              {i + 1} · {cutWord}
            </span>
          </span>
        );
      })}
      {pendingIn !== null && pendingIn >= lo && pendingIn <= hi ? (
        <span
          className="absolute w-0.5 bg-accent"
          style={{ left: x(pendingIn) - 1, top: FILM_TOP - 4, height: FILM_H + 8 }}
        />
      ) : null}
    </>
  );
});

// --- the filmstrip -----------------------------------------------------------------------------

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Resolves true on `event`, false after `ms` or on `error`. */
function once(el: HTMLVideoElement, event: string, ms: number): Promise<boolean> {
  return new Promise((resolve) => {
    const done = (ok: boolean) => {
      clearTimeout(timer);
      el.removeEventListener(event, onOk);
      el.removeEventListener('error', onErr);
      resolve(ok);
    };
    const onOk = () => done(true);
    const onErr = () => done(false);
    const timer = setTimeout(() => done(false), ms);
    el.addEventListener(event, onOk);
    el.addEventListener('error', onErr);
  });
}

type FrameVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: () => void) => number;
};

/** The decoded frame is there to draw: a frame callback where the browser has one, else a beat. */
function framePainted(v: FrameVideo): Promise<void> {
  if (typeof v.requestVideoFrameCallback !== 'function') return sleep(50);
  return Promise.race([
    new Promise<void>((r) => v.requestVideoFrameCallback!(() => r())),
    sleep(150),
  ]);
}

/**
 * {@link FILM_FRAMES} small frames spread over the video, made by a second, hidden `<video>` on
 * the same `blob:` URL seeking from one to the next and drawing each into a canvas no wider than
 * {@link FILM_MAX_WIDTH}. Each is a small JPEG data URL (a few KB); the hidden video lets go of
 * the file as soon as the strip is done, and on unmount.
 *
 * It never holds anything up: it starts after the main video has had a moment, waits while
 * `busy` (a finger on the strip, or playback — a phone decodes one video at a time well), and
 * hands the frames over a few at a time. A phone that will not seek a hidden video (iOS has been
 * known to) gets no frames: the strip is plain, and works the same.
 */
function useFilmstrip(
  url: string | null,
  durationS: number | null,
  busy: RefObject<boolean>,
): (string | null)[] {
  const [frames, setFrames] = useState<(string | null)[]>([]);

  useEffect(() => {
    setFrames([]);
    if (!url || !durationS || !(durationS > 0) || typeof document === 'undefined') return;
    let cancelled = false;
    const v = document.createElement('video') as FrameVideo;
    v.muted = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('muted', '');
    v.setAttribute('aria-hidden', 'true');
    v.preload = 'auto';
    Object.assign(v.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      width: '2px',
      height: '2px',
      opacity: '0',
      pointerEvents: 'none',
    });
    let canvas: HTMLCanvasElement | null = document.createElement('canvas');
    const out: (string | null)[] = new Array<string | null>(FILM_FRAMES).fill(null);
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      try {
        v.pause();
        v.removeAttribute('src');
        v.load();
      } catch {
        // Already gone.
      }
      v.remove();
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
        canvas = null;
      }
    };

    const run = async () => {
      // The video on screen goes first.
      await sleep(800);
      if (cancelled) return;
      // In the page, though invisible: some engines will not decode a video that is not.
      document.body.appendChild(v);
      v.src = url;
      v.load();
      if (v.readyState < 1 && !(await once(v, 'loadedmetadata', 8000))) return;
      if (cancelled || !v.videoWidth || !v.videoHeight || !canvas) return;
      const w = Math.min(FILM_MAX_WIDTH, v.videoWidth);
      const h = Math.max(1, Math.round((w * v.videoHeight) / v.videoWidth));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      let made = 0;
      let failedInARow = 0;
      for (const i of fillOrder(FILM_FRAMES)) {
        while (busy.current && !cancelled) await sleep(250);
        if (cancelled || !canvas) return;
        const at = Math.min(durationS - 0.05, ((i + 0.5) * durationS) / FILM_FRAMES);
        const landed = once(v, 'seeked', 3000);
        try {
          v.currentTime = Math.max(0, at);
        } catch {
          return;
        }
        let ok = await landed;
        if (ok && v.readyState < 2) ok = await once(v, 'loadeddata', 1500);
        if (cancelled) return;
        if (ok) {
          await framePainted(v);
          if (cancelled || !canvas) return;
          try {
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(v, 0, 0, w, h);
            // Nothing drawn (the frame was not there) leaves the canvas see-through.
            const px = ctx.getImageData(w >> 1, h >> 1, 1, 1).data;
            ok = (px[3] ?? 0) > 0;
            if (ok) out[i] = canvas.toDataURL('image/jpeg', 0.6);
          } catch {
            return;
          }
        }
        if (!ok) {
          failedInARow++;
          // The first frame failing means this phone will not do it; three in a row, the same.
          if (made === 0 || failedInARow >= 3) return;
          continue;
        }
        failedInARow = 0;
        made++;
        if (made % 5 === 0) setFrames([...out]);
        // Let the page breathe between frames.
        await sleep(16);
      }
    };

    void run()
      .catch(() => undefined)
      .finally(() => {
        release();
        // Whatever was made, even when the phone gave up part way.
        if (!cancelled && out.some(Boolean)) setFrames([...out]);
      });
    return () => {
      cancelled = true;
      release();
    };
  }, [url, durationS, busy]);

  return frames;
}
