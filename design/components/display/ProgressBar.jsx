import React from 'react';
export function ProgressBar({ value = 0, tone = 'accent', height = 4, label, fillColor, style }) {
  const fill = fillColor || `var(--${tone})`;
  return (
    <div style={{ width: '100%', ...style }}>
      {label ? <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontFamily: 'var(--font-body)', fontSize: 13 }}>
        <span style={{ color: 'var(--text-2)' }}>{label}</span><span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{Math.round(value)}%</span>
      </div> : null}
      <div style={{ height, borderRadius: 0, background: 'var(--surface-3)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: '100%', background: fill, transition: 'width var(--dur-med) var(--ease-out)' }} />
      </div>
    </div>
  );
}
