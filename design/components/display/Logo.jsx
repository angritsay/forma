import React from 'react';
/* Логотип FORMA: Unbounded, FOR — 800, MA — 200; первая F расширена ×1.22, трекинг .05em, зазор F→O больше.
   size — кегль px; sergey — lockup «FORMA // Сергей Титов»; color наследуется. */
export function Logo({ size = 20, sergey = false, color = 'currentColor', style }) {
  const mark = (
    <span style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: size, color, letterSpacing: '.05em', lineHeight: 1, display: 'inline-flex', alignItems: 'baseline', whiteSpace: 'nowrap', ...style }}>
      <span style={{ fontWeight: 800, display: 'inline-block', transform: 'scaleX(1.22)', transformOrigin: 'left center', marginRight: '.16em' }}>F</span>
      <span style={{ fontWeight: 800 }}>OR</span>
      <span style={{ fontWeight: 200 }}>MA</span>
    </span>
  );
  if (!sergey) return mark;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '.6em', color }}>
      {mark}
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: size * .55, color: 'var(--text-3)' }}>//</span>
      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: size * .68, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-2)' }}>Сергей Титов</span>
    </span>
  );
}
