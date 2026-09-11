import React from 'react';
export function Chip({ active, icon, children, onClick, style }) {
  return (
    <button onClick={onClick}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px',
        borderRadius: 'var(--r-btn)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase',
        background: active ? 'var(--accent)' : 'var(--surface-3)',
        color: active ? 'var(--text-on-accent)' : 'var(--text-2)',
        border: '1px solid ' + (active ? 'transparent' : 'var(--border-1)'),
        transition: 'background var(--dur-fast), color var(--dur-fast)', whiteSpace: 'nowrap', ...style }}>
      {icon ? <span style={{ fontSize: 12 }}>{icon}</span> : null}{children}
    </button>
  );
}
