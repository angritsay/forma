/**
 * Animated exercise figure (SVG blueprint stick figure driven by pose sets).
 *
 *   <ExerciseFigure animation="air_squat" variant="card" tile="#F2F52D" />
 *
 * - `animation`: id from src/components/anim/poses (matches Exercise.animation). Unknown ids
 *   render the standing pose and warn once — never throw.
 * - `variant`: 'thumb' (72px, static first frame, tight crop, no tile chrome — inherits
 *              currentColor from its parent), 'card' (200px tile),
 *              'hero' (fills its container, square, tile — player background / landing).
 * - `playing`: animate (default true; 'thumb' defaults to false)
 * - `speed`: playback multiplier (default 1)
 * - `tile`: flat course tile colour behind the figure; defaults to the neutral dark surface.
 *   The figure itself is `currentColor`: `courseTileVars()` derives `--course-tile-fg` from the
 *   tile and `.hero-art` applies it, so the line is black on a programme colour and light on a
 *   dark surface without the figure knowing which it sits on.
 *
 * Playback pauses when `playing` is false, when the tab is hidden and under
 * `prefers-reduced-motion` (a mid-motion poster frame is shown instead). SSR-safe: the first
 * render is the t = 0 frame with no browser APIs touched.
 */
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { courseTileVars } from '@/lib/ui/tile';
import { getPoseSet } from './lookup';
import { DEFAULT_TILE, VIEWBOX, figureScene, poseAt, tightViewBox, type Primitive } from './rig';

export interface ExerciseFigureProps {
  animation: string;
  variant?: 'thumb' | 'card' | 'hero';
  playing?: boolean;
  speed?: number;
  tile?: string;
  className?: string;
  /** Accessible label (exercise name in the current locale). */
  label?: string;
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const MAX_FRAME_DELTA_MS = 100;

/** Square ends, sharp corners, no fill — the same stroke contract as render.ts. */
const STROKE_PROPS = {
  stroke: 'currentColor',
  fill: 'none',
  strokeLinecap: 'butt',
  strokeLinejoin: 'miter',
} as const;

function primitiveToElement(p: Primitive, key: number): ReactElement {
  const opacity = p.opacity < 1 ? p.opacity : undefined;
  switch (p.kind) {
    case 'line':
      return (
        <line
          key={key}
          x1={p.x1}
          y1={p.y1}
          x2={p.x2}
          y2={p.y2}
          strokeWidth={p.width}
          opacity={opacity}
          {...STROKE_PROPS}
        />
      );
    case 'path':
      return <path key={key} d={p.d} strokeWidth={p.width} opacity={opacity} {...STROKE_PROPS} />;
    case 'rect':
      return (
        <rect
          key={key}
          x={p.x}
          y={p.y}
          width={p.w}
          height={p.h}
          strokeWidth={p.width}
          opacity={opacity}
          {...STROKE_PROPS}
        />
      );
  }
}

export default function ExerciseFigure({
  animation,
  variant = 'card',
  playing,
  speed = 1,
  tile,
  className = '',
  label,
}: ExerciseFigureProps) {
  const set = useMemo(() => getPoseSet(animation), [animation]);
  const isThumb = variant === 'thumb';
  const shouldPlay = playing ?? !isThumb;

  // Cycle position (0..1 = one pass). The server and the first client render agree on 0.
  const [u, setU] = useState(0);
  const uRef = useRef(0);

  useEffect(() => {
    uRef.current = 0;
    setU(0);
  }, [set]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') return;
    const media =
      typeof window.matchMedia === 'function' ? window.matchMedia(REDUCED_MOTION_QUERY) : null;
    const fps = set.fps ?? 30;
    const frameMs = 1000 / fps;
    let raf = 0;
    let last = 0;
    let lastPaint = 0;
    let running = false;

    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min(now - last, MAX_FRAME_DELTA_MS);
      last = now;
      uRef.current += (dt * speed) / set.durationMs;
      if (now - lastPaint >= frameMs) {
        lastPaint = now;
        setU(uRef.current);
      }
      raf = window.requestAnimationFrame(tick);
    };
    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      lastPaint = 0;
      raf = window.requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
    };
    const sync = () => {
      const reduced = media?.matches ?? false;
      const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
      if (reduced) {
        stop();
        const poster = set.poster ?? 0.5;
        uRef.current = poster;
        setU(poster);
        return;
      }
      if (shouldPlay && !hidden) start();
      else stop();
    };

    sync();
    document.addEventListener('visibilitychange', sync);
    media?.addEventListener?.('change', sync);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', sync);
      media?.removeEventListener?.('change', sync);
    };
  }, [set, shouldPlay, speed]);

  const scene = useMemo(() => {
    const pose = poseAt(set, u);
    return figureScene(pose, set.view, { props: set.props, t: u - Math.floor(u) });
  }, [set, u]);

  const viewBox = useMemo(
    () => (isThumb ? tightViewBox(scene) : `0 0 ${VIEWBOX} ${VIEWBOX}`),
    [isThumb, scene],
  );

  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };

  if (isThumb) {
    return (
      <svg
        viewBox={viewBox}
        width={72}
        height={72}
        className={`block shrink-0 ${className}`}
        {...a11y}
      >
        {scene.map(primitiveToElement)}
      </svg>
    );
  }

  // Both tile properties from the one hex, so the ink flips with the surface (black on a
  // programme colour, light on a dark one). No radius: the tile is the brand's sharp rectangle.
  const style = courseTileVars(tile ?? DEFAULT_TILE);
  const sizeClass = variant === 'card' ? 'size-[200px]' : 'w-full aspect-square';

  return (
    <div className={`hero-art overflow-hidden ${sizeClass} ${className}`} style={style} {...a11y}>
      <svg viewBox={viewBox} width="100%" height="100%" className="block" aria-hidden="true">
        {scene.map(primitiveToElement)}
      </svg>
    </div>
  );
}
