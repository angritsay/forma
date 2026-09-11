import React from 'react';
/* Иконки «Формы»: ПО УМОЛЧАНИЮ НЕ ИСПОЛЬЗУЮТСЯ.
   Иерархия: 1) типографские/кодовые знаки (→ ✓ × 01 [ ] // ›_ 12′) обычным текстом;
   2) если знак не читается — Phosphor FILL, минимально и мелко. Нужен <script src="https://unpkg.com/@phosphor-icons/web"></script>. */
const ALIAS = { zap: 'lightning', map: 'path', home: 'house', dumbbell: 'barbell', 'trending-up': 'trend-up', 'chevron-left': 'caret-left', 'chevron-right': 'caret-right', 'message-circle': 'chat-circle', settings: 'gear', 'bar-chart': 'chart-bar' };
export function Icon({ name, size = 14, color = 'currentColor', weight = 'fill', style }) {
  const n = ALIAS[name] || name;
  const cls = weight === 'regular' ? `ph ph-${n}` : `ph-${weight} ph-${n}`;
  return <i className={cls} aria-hidden="true" style={{ fontSize: size, color, lineHeight: 1, display: 'inline-flex', flex: 'none', ...style }} />;
}
/* Типографский «глиф» — предпочтительная замена иконке. <Glyph>→</Glyph>, <Glyph>01</Glyph>, <Glyph>✓</Glyph> */
export function Glyph({ children, size = 12, color = 'currentColor', style }) {
  return <span aria-hidden="true" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: size, lineHeight: 1, color, textTransform: 'uppercase', display: 'inline-flex', flex: 'none', ...style }}>{children}</span>;
}
