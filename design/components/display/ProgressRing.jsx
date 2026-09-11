import React from 'react';
export function ProgressRing({ value = 0, size = 72, strokeWidth = 6, tone = 'blue', children, style }) {
  const r = (size - strokeWidth) / 2, c = 2 * Math.PI * r;
  const v = Math.min(100, Math.max(0, value));
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none', ...style }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`var(--${tone})`} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)}
          style={{ transition: 'stroke-dashoffset var(--dur-med) var(--ease-out)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: size / 4.2, color: 'var(--text-1)' }}>
        {children ?? `${Math.round(v)}%`}
      </div>
    </div>
  );
}
