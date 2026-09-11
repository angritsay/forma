import React from 'react';
import { Icon } from '../actions/Icon.jsx';
/* Таб-бар Mini App: типографская иерархия — активный пункт крупный (Unbounded), остальные мелкие капс-лейблы. Без иконок. Всё прижато влево. */
export function TabBar({ items = [], activeIndex = 0, onChange, style }) {
  return (
    <nav style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 24, padding: '0 22px',
      background: 'rgba(15,15,17,.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      borderTop: '1px solid var(--border-1)', minHeight: 56, ...style }}>
      {items.map((it, i) => {
        const active = i === activeIndex;
        return (
          <button key={it.label} onClick={() => onChange && onChange(i)}
            style={{ display: 'flex', alignItems: 'center', padding: 0, minHeight: 44,
              background: 'none', border: 'none', cursor: 'pointer',
              color: active ? 'var(--text-1)' : 'var(--text-3)', transition: 'color var(--dur-fast)' }}>
            {active
              ? <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, textTransform: 'uppercase', letterSpacing: '.01em' }}>{it.label}</span>
              : <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase' }}>{it.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}
