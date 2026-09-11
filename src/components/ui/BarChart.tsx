/**
 * Single-series bar chart in plain SVG (steps per day, points per week…).
 * Monochrome: thin square bars anchored to a hairline baseline, the highlighted bar (today) in
 * full white and the rest at 40%, values in text tokens; per-bar hover/focus reveals the value,
 * highlighted bars show it always. No colour — a chart reports, it does not belong to a course.
 */
import { clsx } from 'clsx';
import { useId, useState } from 'react';

export interface BarDatum {
  label: string;
  value: number;
  /** Emphasized bar (today / current week). */
  highlight?: boolean;
}

export interface BarChartProps {
  data: readonly BarDatum[];
  /** Fixed scale maximum; defaults to max(value, goal). */
  max?: number;
  /** Horizontal reference line (e.g. steps goal). */
  goal?: number;
  goalLabel?: string;
  /** Plot height in px. Default 140. */
  height?: number;
  formatValue?: (v: number) => string;
  /** Accessible description of the chart. */
  ariaLabel: string;
  className?: string;
}

const LABEL_H = 20;
const VALUE_H = 18;

export function BarChart({
  data,
  max,
  goal,
  goalLabel,
  height = 140,
  formatValue = (v) => String(v),
  ariaLabel,
  className,
}: BarChartProps) {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  const n = Math.max(1, data.length);
  const width = 320;
  const gap = 2;
  const slot = width / n;
  const barW = Math.max(6, Math.min(28, slot - gap * 2 - 4));
  const plotH = height - LABEL_H - VALUE_H;
  const scaleMax = Math.max(1, max ?? Math.max(goal ?? 0, ...data.map((d) => d.value)));
  const y = (v: number) => VALUE_H + plotH - (Math.min(v, scaleMax) / scaleMax) * plotH;
  const baseline = VALUE_H + plotH;
  const summary = data.map((d) => `${d.label}: ${formatValue(d.value)}`).join(', ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      // `group`, not `img`: an `img` hides its subtree, which would silence the per-bar labels
      // while leaving the bars in the tab order.
      role="group"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-desc`}
      className={clsx('block overflow-visible select-none', className)}
      onMouseLeave={() => setActive(null)}
    >
      <title id={`${id}-title`}>{ariaLabel}</title>
      <desc id={`${id}-desc`}>{summary}</desc>
      <line
        x1={0}
        x2={width}
        y1={baseline}
        y2={baseline}
        className="stroke-border"
        strokeWidth={1}
      />
      {goal !== undefined && goal > 0 ? (
        <g>
          <line
            x1={0}
            x2={width}
            y1={y(goal)}
            y2={y(goal)}
            className="stroke-muted"
            strokeWidth={1}
            strokeDasharray="3 4"
          />
          {goalLabel ? (
            <text x={width} y={y(goal) - 4} textAnchor="end" className="fill-muted text-[10px]">
              {goalLabel}
            </text>
          ) : null}
        </g>
      ) : null}
      {data.map((d, i) => {
        const cx = slot * i + slot / 2;
        const top = y(d.value);
        const h = Math.max(0, baseline - top);
        const showValue = d.highlight || active === i;
        return (
          <g
            key={i}
            tabIndex={0}
            // `listitem` needs a list parent; each bar is a named graphic instead. The focus ring
            // comes from the global :focus-visible rule — never suppress it here.
            role="img"
            aria-label={`${d.label}: ${formatValue(d.value)}`}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
          >
            {/* Hit target larger than the mark. */}
            <rect x={slot * i} y={0} width={slot} height={height} fill="transparent" />
            {h > 0 ? (
              /* A plain rect: square shoulders, like every other shape in the system. */
              <rect
                x={cx - barW / 2}
                y={top}
                width={barW}
                height={h}
                className={clsx(
                  'transition-opacity',
                  d.highlight ? 'fill-primary' : 'fill-text/40',
                  active === i && 'opacity-100',
                )}
              />
            ) : (
              <rect
                x={cx - barW / 2}
                y={baseline - 2}
                width={barW}
                height={2}
                className="fill-border-strong"
              />
            )}
            {showValue ? (
              <text
                x={cx}
                y={Math.max(10, top - 6)}
                textAnchor="middle"
                className="tabular fill-text text-[11px] font-semibold"
              >
                {formatValue(d.value)}
              </text>
            ) : null}
            <text
              x={cx}
              y={height - 5}
              textAnchor="middle"
              className={clsx(
                'text-[11px]',
                d.highlight ? 'fill-text font-semibold' : 'fill-muted',
              )}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
