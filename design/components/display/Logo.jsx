import React from 'react';
/* Логотип FORMA: Unbounded, FOR — 800, MA — 200; первая F расширена ×1.22, трекинг .05em, зазор F→O больше.
   size — кегль px; color наследуется. Знак всегда один, без имени тренера (CHANGELOG §25). */
export function Logo({ size = 20, color = 'currentColor', style }) {
  return (
    <span style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: size, color, letterSpacing: '.05em', lineHeight: 1, display: 'inline-flex', alignItems: 'baseline', whiteSpace: 'nowrap', ...style }}>
      <span style={{ fontWeight: 800, display: 'inline-block', transform: 'scaleX(1.22)', transformOrigin: 'left center', marginRight: '.16em' }}>F</span>
      <span style={{ fontWeight: 800 }}>OR</span>
      <span style={{ fontWeight: 200 }}>MA</span>
    </span>
  );
}
