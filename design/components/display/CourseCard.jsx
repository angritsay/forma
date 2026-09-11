import React from 'react';
import { Badge } from './Badge.jsx';
import { ProgressBar } from './ProgressBar.jsx';
/* Карточка курса: плитка цвета программы + чёрная фигурка + мета. tile: 1=новичкам(жёлтый), 2=йога(голубой), 3=марафон(оранжевый) */
export function CourseCard({ title, meta, tile = 1, figureSrc, badge, badgeTone = 'neutral', progress, onClick, style }) {
  return (
    <div onClick={onClick} style={{ background: 'var(--surface-card)', borderRadius: 0, overflow: 'hidden',
      border: '1px solid var(--border-1)', cursor: onClick ? 'pointer' : 'default', ...style }}>
      <div style={{ background: `var(--tile-${tile})`, height: 132, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {figureSrc ? <img src={figureSrc} alt="" style={{ height: '72%', filter: tile >= 4 ? 'invert(1)' : 'none' }} /> : null}
        {badge ? <Badge tone={badgeTone} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(15,15,17,.85)', color: '#fff', border: 'none' }}>{badge}</Badge> : null}
      </div>
      <div style={{ padding: 16, display: 'grid', gap: 8 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, textTransform: 'uppercase', color: 'var(--text-1)', lineHeight: 1.3 }}>{title}</div>
        {meta ? <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-3)' }}>{meta}</div> : null}
        {progress != null ? <ProgressBar value={progress} height={4} /> : null}
      </div>
    </div>
  );
}
