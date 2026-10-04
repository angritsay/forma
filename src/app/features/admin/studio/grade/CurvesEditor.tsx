/**
 * The tone curves: one square, four curves (all channels together, then red, green, blue).
 *
 * Touch where there is no point to add one there; drag a point to move it; pull it out of the
 * square, double-tap it, or select it and press «Удалить точку» to take it away. The line drawn is
 * `curveFunction` from `src/lib/media/grade.ts`, sampled — the very function the LUT is built
 * from, so the curve on screen is the curve in the render. Points never pass each other on x
 * (`curveEdit.ts`), so the curve stays a function and monotone where the points rise.
 */
import { clsx } from 'clsx';
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import {
  CURVE_CHANNELS,
  type CurveChannel,
  type CurvePoint,
  type GradeCurves,
} from '@/lib/media/grade';
import { useT } from '@/app/hooks/useT';
import { addPoint, curvePath, movePoint, nearestPoint, removePoint } from './curveEdit';

const SIZE = 100;
/** How far outside the square a point is dragged before letting go removes it. */
const REMOVE_BEYOND = 0.12;
/** The finger's reach for grabbing a point, CSS pixels. */
const GRAB_PX = 22;

const STROKE: Record<CurveChannel, string> = {
  master: 'var(--text)',
  r: '#e5484d',
  g: '#30a46c',
  b: '#3e7bfa',
};

interface Drag {
  pointer: number;
  index: number;
  out: boolean;
}

export interface CurvesEditorProps {
  curves: GradeCurves;
  onChange: (curves: GradeCurves) => void;
  disabled?: boolean;
}

export function CurvesEditor({ curves, onChange, disabled }: CurvesEditorProps) {
  const { t } = useT();
  const [channel, setChannel] = useState<CurveChannel>('master');
  const [selected, setSelected] = useState(-1);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const lastTap = useRef<{ index: number; at: number }>({ index: -1, at: 0 });
  const points = curves[channel];

  const set = (next: CurvePoint[]) => onChange({ ...curves, [channel]: next });

  const toUnit = (e: PointerEvent<SVGSVGElement>) => {
    const r = svg.current?.getBoundingClientRect();
    if (!r || r.width === 0 || r.height === 0) return null;
    return {
      x: (e.clientX - r.left) / r.width,
      y: 1 - (e.clientY - r.top) / r.height,
      rx: GRAB_PX / r.width,
      ry: GRAB_PX / r.height,
    };
  };

  const down = (e: PointerEvent<SVGSVGElement>) => {
    if (disabled || drag.current) return;
    const u = toUnit(e);
    if (!u) return;
    e.preventDefault();
    let index = nearestPoint(points, u.x, u.y, u.rx, u.ry);
    if (index >= 0) {
      // A second tap on the same point within 350 ms removes it (the desktop double-click too).
      const now = performance.now();
      if (lastTap.current.index === index && now - lastTap.current.at < 350) {
        set(removePoint(points, index));
        setSelected(-1);
        lastTap.current = { index: -1, at: 0 };
        return;
      }
      lastTap.current = { index, at: now };
    } else {
      const added = addPoint(points, u.x, u.y);
      if (added.index < 0) return;
      index = added.index;
      set(added.points);
      lastTap.current = { index, at: performance.now() };
    }
    setSelected(index);
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { pointer: e.pointerId, index, out: false };
  };

  const moveTo = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    const u = toUnit(e);
    if (!u) return;
    d.out =
      u.x < -REMOVE_BEYOND ||
      u.x > 1 + REMOVE_BEYOND ||
      u.y < -REMOVE_BEYOND ||
      u.y > 1 + REMOVE_BEYOND;
    const moved = movePoint(points, d.index, u.x, u.y);
    if (moved.index >= 0) set(moved.points);
  };

  const up = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d || d.pointer !== e.pointerId) return;
    drag.current = null;
    if (d.out) {
      set(removePoint(points, d.index));
      setSelected(-1);
    }
  };

  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (disabled || selected < 0 || selected >= points.length) return;
    const p = points[selected]!;
    const step = e.shiftKey ? 0.05 : 0.01;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      set(removePoint(points, selected));
      setSelected(-1);
      return;
    }
    const d = delta[e.key];
    if (!d) return;
    e.preventDefault();
    set(movePoint(points, selected, p[0] + d[0], p[1] + d[1]).points);
  };

  const switchChannel = (ch: CurveChannel) => {
    setChannel(ch);
    setSelected(-1);
  };

  const labels: Record<CurveChannel, string> = {
    master: t('app.studioCurveMaster'),
    r: t('app.studioCurveRed'),
    g: t('app.studioCurveGreen'),
    b: t('app.studioCurveBlue'),
  };

  return (
    <div className="flex flex-col gap-3">
      <SegmentedControl<CurveChannel>
        label={t('app.studioCurveChannel')}
        value={channel}
        onChange={switchChannel}
        fullWidth
        size="sm"
        options={CURVE_CHANNELS.map((ch) => ({ value: ch, label: labels[ch] }))}
      />
      <div className="mx-auto w-full max-w-[360px]">
        <svg
          ref={svg}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="application"
          tabIndex={disabled ? -1 : 0}
          aria-label={t('app.studioCurveArea', { channel: labels[channel] })}
          onPointerDown={down}
          onPointerMove={moveTo}
          onPointerUp={up}
          onPointerCancel={up}
          onKeyDown={onKey}
          className={clsx(
            'block aspect-square w-full touch-none overflow-visible rounded-control border border-border bg-surface-2 outline-none focus-visible:border-accent',
            disabled ? 'opacity-50' : 'cursor-crosshair',
          )}
        >
          {[25, 50, 75].map((v) => (
            <g key={v} stroke="var(--border)" strokeWidth={0.4}>
              <line x1={v} y1={0} x2={v} y2={SIZE} />
              <line x1={0} y1={v} x2={SIZE} y2={v} />
            </g>
          ))}
          <line
            x1={0}
            y1={SIZE}
            x2={SIZE}
            y2={0}
            stroke="var(--border-strong)"
            strokeWidth={0.4}
            strokeDasharray="2 2"
          />
          {/* The other channels, faint, so a colour cast reads at a glance. */}
          {CURVE_CHANNELS.filter((ch) => ch !== channel && curves[ch].length > 0).map((ch) => (
            <path
              key={ch}
              d={curvePath(curves[ch], SIZE)}
              fill="none"
              stroke={STROKE[ch]}
              strokeOpacity={0.35}
              strokeWidth={0.8}
            />
          ))}
          <path
            d={curvePath(points, SIZE)}
            fill="none"
            stroke={STROKE[channel]}
            strokeWidth={1.4}
          />
          {points.map(([x, y], i) => (
            <circle
              key={i}
              cx={x * SIZE}
              cy={(1 - y) * SIZE}
              r={i === selected ? 3.2 : 2.4}
              fill={i === selected ? STROKE[channel] : 'var(--bg)'}
              stroke={STROKE[channel]}
              strokeWidth={1}
            />
          ))}
        </svg>
      </div>
      <p className="text-[13px] text-muted">{t('app.studioCurveHint')}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={disabled || selected < 0 || selected >= points.length}
          onClick={() => {
            set(removePoint(points, selected));
            setSelected(-1);
          }}
        >
          {t('app.studioCurveRemovePoint')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={disabled || points.length === 0}
          onClick={() => {
            set([]);
            setSelected(-1);
          }}
        >
          {t('app.studioCurveReset', { channel: labels[channel] })}
        </Button>
      </div>
    </div>
  );
}
