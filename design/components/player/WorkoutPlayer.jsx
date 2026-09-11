import React from 'react';
import { Icon } from '../actions/Icon.jsx'; // play/pause — легитимная Phosphor fill
import { ProgressBar } from '../display/ProgressBar.jsx';
const PHASES = { explain: { label: 'Объяснили' }, do: { label: 'Делаем' }, rest: { label: 'Отдыхаем' } };
/* Плеер тренировки: фаза, таймер, прогресс, управление. courseColor — цвет программы (var(--course-*)) */
export function WorkoutPlayer({ phase = 'explain', exercise, timer, progress = 0, playing, courseColor = 'var(--accent)', onToggle, onPrev, onNext, style }) {
  const p = PHASES[phase] || PHASES.explain;
  const ctl = { width: 52, height: 52, borderRadius: 0, border: '1px solid var(--border-2)', background: 'transparent', color: 'var(--text-1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  return (
    <div style={{ background: 'var(--surface-1)', borderRadius: 0, padding: 20, display: 'grid', gap: 14, border: '1px solid var(--border-1)', ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.18em', color: phase === 'do' ? courseColor : 'var(--text-3)' }}>{p.label}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>{timer}</span>
      </div>
      {exercise ? <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: 'var(--text-2)' }}>{exercise}</div> : null}
      <ProgressBar value={progress} height={4} fillColor={courseColor} />
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
        <button onClick={onPrev} style={{ ...ctl, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>‹</button>
        <button onClick={onToggle} style={{ ...ctl, width: 64, height: 64, background: 'var(--accent)', color: 'var(--text-on-accent)', border: 'none' }}>
          <Icon name={playing ? 'pause' : 'play'} size={18} /></button>
        <button onClick={onNext} style={{ ...ctl, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>›</button>
      </div>
    </div>
  );
}
