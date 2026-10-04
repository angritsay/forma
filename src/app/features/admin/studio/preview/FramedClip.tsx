/**
 * One clip as the player will show it: the raw piece through the auto pass and the grade (one
 * LUT, `studioLut`, the WebGL renderer of the colour step), sampled from the 9:16 crop, in a
 * 9:16 canvas. The same picture is copied into the card's canvas after every draw (`mirror`), so the
 * card and the player cost one decoder and one WebGL context between them.
 *
 * - **Framing:** a drag on `dragArea` moves the picture, two fingers pinch it, a mouse wheel zooms
 *   it (`framing.ts`); the parent holds the framing and saves it when a gesture ends.
 * - **Playback** follows the play mode (`playMode.ts`): round and round, once and held on the last
 *   frame (with «Ещё раз»), or held on the chosen still frame.
 * - Without WebGL2 the picture is not drawn here: the line under it says so, and the render still
 *   applies everything.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import { studioLut, type AutoParams } from '@/lib/media/autoEnhance';
import type { Crop } from '@/lib/media/crop';
import type { GradeParams } from '@/lib/media/grade';
import { GradeRenderer } from '../grade/glPreview';
import { backingSize, cropUniform, type Size } from '../grade/previewGeometry';
import { mediaErrorProblem, type PlaybackProblem } from '../grade/studioErrors';
import { wrapTime, type PlayWindow } from '../grade/time';
import type { PreviewPlayback } from '../playMode';

type VideoWithFrames = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: () => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

export type FramedProblem = PlaybackProblem | 'nogl';

export interface FramedClipProps {
  src: string | null;
  win: PlayWindow;
  grade: GradeParams | null;
  auto: AutoParams | null;
  crop: Crop | null;
  playback: PreviewPlayback;
  /** Seconds into the clip for `hold`. */
  stillAt: number;
  /** Bumped to play a `once` clip again. */
  replay: number;
  /** The card's canvas: a copy of every frame drawn, covered to its own shape. */
  mirror?: RefObject<HTMLCanvasElement | null>;
  /** The element the drag, pinch and wheel are read from (the player's stage). */
  dragArea: RefObject<HTMLElement | null>;
  onVideoSize: (size: Size) => void;
  /** A drag moved by `dx`, `dy` CSS pixels over a frame drawn `box`; `scale` — a pinch or wheel. */
  onGesture: (g: { dx: number; dy: number; scale: number; box: Size }) => void;
  /** A gesture ended: save. */
  onGestureEnd: () => void;
  onProblem: (p: FramedProblem | null) => void;
  /** The video ended in `once` (and holds). */
  onEnded?: () => void;
  className?: string;
  canvasStyle?: CSSProperties;
}

/** Draw `from` into `to` the way `object-fit: cover` would, centred. */
function coverCopy(from: HTMLCanvasElement, to: HTMLCanvasElement): void {
  const ctx = to.getContext('2d');
  if (!ctx || from.width === 0 || from.height === 0) return;
  const rect = to.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(rect.width * dpr));
  const h = Math.max(1, Math.round(rect.height * dpr));
  if (to.width !== w) to.width = w;
  if (to.height !== h) to.height = h;
  const scale = Math.max(w / from.width, h / from.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(from, (from.width - sw) / 2, (from.height - sh) / 2, sw, sh, 0, 0, w, h);
}

export function FramedClip({
  src,
  win,
  grade,
  auto,
  crop,
  playback,
  stillAt,
  replay,
  mirror,
  dragArea,
  onVideoSize,
  onGesture,
  onGestureEnd,
  onProblem,
  onEnded,
  className,
  canvasStyle,
}: FramedClipProps) {
  const video = useRef<VideoWithFrames>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<GradeRenderer | null>(null);
  const [videoSize, setVideoSize] = useState<Size>({ w: 0, h: 0 });
  const [glOk, setGlOk] = useState(true);

  const lut = useMemo(() => studioLut(grade, auto), [grade, auto]);
  const uniform = useMemo(() => cropUniform(crop, true), [crop]);

  // Live values for the loop and the listeners, which are set up once per video.
  const live = useRef({ uniform, win, playback, stillAt, onVideoSize, onProblem, onEnded });
  live.current = { uniform, win, playback, stillAt, onVideoSize, onProblem, onEnded };

  const draw = useCallback(
    (upload: boolean) => {
      const r = renderer.current;
      const c = canvas.current;
      if (!r || !c) return;
      if (r.isContextLost()) {
        setGlOk(false);
        return;
      }
      const result = r.draw(video.current, { crop: live.current.uniform, bypass: false }, upload);
      if (result === 'tainted') {
        setGlOk(false);
        return;
      }
      if (result === 'drawn' && mirror?.current) coverCopy(c, mirror.current);
    },
    [mirror],
  );

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const r = GradeRenderer.create(el);
    if (!r) {
      setGlOk(false);
      return;
    }
    renderer.current = r;
    return () => {
      r.dispose();
      renderer.current = null;
    };
  }, []);

  useEffect(() => onProblem(glOk ? null : 'nogl'), [glOk, onProblem]);

  useEffect(() => {
    renderer.current?.setLut(lut);
    draw(false);
  }, [lut, draw]);

  // The backing store follows the box; the crop or the size changed: redraw.
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const box = { w: entry.contentRect.width, h: entry.contentRect.height };
      const content =
        videoSize.w > 0 ? { w: videoSize.w * uniform[2], h: videoSize.h * uniform[3] } : box;
      const b = backingSize(box, window.devicePixelRatio, content);
      if (el.width !== b.w) el.width = b.w;
      if (el.height !== b.h) el.height = b.h;
      draw(false);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [draw, uniform, videoSize]);

  useEffect(() => draw(false), [uniform, draw]);

  // The frame loop and the play mode.
  useEffect(() => {
    const v = video.current;
    if (!v || !src) return;
    let handle = 0;
    let raf = 0;
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      const { win: w, playback: mode } = live.current;
      if (mode === 'loop') {
        const want = wrapTime(v.currentTime, w);
        if (want !== v.currentTime) v.currentTime = want;
      } else if (mode === 'once' && v.currentTime >= w.to - 1 / 120) {
        v.pause();
        live.current.onEnded?.();
      }
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
      const { win: w, playback: mode, stillAt: at } = live.current;
      v.currentTime = mode === 'hold' ? w.from + at : w.from;
    };
    const onPlay = () => {
      if (!v.requestVideoFrameCallback) raf = requestAnimationFrame(onRaf);
    };
    const onEnd = () => {
      if (live.current.playback === 'loop') {
        v.currentTime = live.current.win.from;
        void v.play().catch(() => undefined);
      } else live.current.onEnded?.();
    };
    const onSeeked = () => draw(true);
    const onError = () => live.current.onProblem(mediaErrorProblem(v.error?.code));
    if (v.requestVideoFrameCallback) handle = v.requestVideoFrameCallback(onFrame);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('loadeddata', onSeeked);
    v.addEventListener('play', onPlay);
    v.addEventListener('ended', onEnd);
    v.addEventListener('seeked', onSeeked);
    v.addEventListener('error', onError);
    if (v.readyState >= 1) onMeta();
    return () => {
      stopped = true;
      if (handle && v.cancelVideoFrameCallback) v.cancelVideoFrameCallback(handle);
      if (raf) cancelAnimationFrame(raf);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('loadeddata', onSeeked);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('ended', onEnd);
      v.removeEventListener('seeked', onSeeked);
      v.removeEventListener('error', onError);
    };
  }, [src, draw]);

  // Start, restart or hold as the mode says.
  useEffect(() => {
    const v = video.current;
    if (!v || !src || v.readyState < 1) return;
    if (playback === 'hold') {
      v.pause();
      v.currentTime = win.from + stillAt;
      return;
    }
    v.currentTime = win.from;
    void v.play().catch(() => undefined);
  }, [src, playback, stillAt, replay, win.from, videoSize.w]);

  // Release the decoder when the clip goes: a WebView keeps a detached video playing.
  useEffect(() => {
    const v = video.current;
    return () => {
      if (!v) return;
      v.pause();
      v.removeAttribute('src');
      v.load();
    };
  }, []);

  // Drag, pinch and wheel on the stage.
  const gesture = useRef({ onGesture, onGestureEnd });
  gesture.current = { onGesture, onGestureEnd };
  useEffect(() => {
    const area = dragArea.current;
    if (!area) return;
    const points = new Map<number, { x: number; y: number }>();
    let spread = 0;
    const box = (): Size => {
      const r = canvas.current?.getBoundingClientRect();
      return { w: r?.width ?? 0, h: r?.height ?? 0 };
    };
    const distance = () => {
      const [a, b] = [...points.values()];
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    };
    const down = (e: PointerEvent) => {
      area.setPointerCapture(e.pointerId);
      points.set(e.pointerId, { x: e.clientX, y: e.clientY });
      spread = distance();
    };
    const move = (e: PointerEvent) => {
      const was = points.get(e.pointerId);
      if (!was) return;
      points.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (points.size >= 2) {
        const d = distance();
        if (spread > 0 && d > 0)
          gesture.current.onGesture({ dx: 0, dy: 0, scale: d / spread, box: box() });
        spread = d;
      } else {
        gesture.current.onGesture({
          dx: e.clientX - was.x,
          dy: e.clientY - was.y,
          scale: 1,
          box: box(),
        });
      }
    };
    const up = (e: PointerEvent) => {
      if (!points.delete(e.pointerId)) return;
      spread = distance();
      if (points.size === 0) gesture.current.onGestureEnd();
    };
    let wheelTimer = 0;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      gesture.current.onGesture({ dx: 0, dy: 0, scale: Math.exp(-e.deltaY / 400), box: box() });
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => gesture.current.onGestureEnd(), 400);
    };
    area.addEventListener('pointerdown', down);
    area.addEventListener('pointermove', move);
    area.addEventListener('pointerup', up);
    area.addEventListener('pointercancel', up);
    area.addEventListener('wheel', wheel, { passive: false });
    return () => {
      window.clearTimeout(wheelTimer);
      area.removeEventListener('pointerdown', down);
      area.removeEventListener('pointermove', move);
      area.removeEventListener('pointerup', up);
      area.removeEventListener('pointercancel', up);
      area.removeEventListener('wheel', wheel);
    };
  }, [dragArea]);

  return (
    <>
      <video
        ref={video}
        src={src ?? undefined}
        crossOrigin="anonymous"
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 h-px w-px opacity-0"
      />
      <canvas ref={canvas} className={className} style={canvasStyle} />
    </>
  );
}
