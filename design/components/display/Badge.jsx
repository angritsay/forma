import React from 'react';
const TONES = {
  neutral: { bg: 'transparent', fg: 'var(--text-1)', border: '1px solid var(--border-2)' },
  inverse: { bg: 'var(--accent)', fg: 'var(--text-on-accent)', border: 'none' },
  marathon: { bg: 'var(--course-marathon)', fg: 'var(--text-on-course)', border: 'none' },
  yoga: { bg: 'var(--course-yoga)', fg: 'var(--text-on-course)', border: 'none' },
  beginners: { bg: 'var(--course-beginners)', fg: 'var(--text-on-course)', border: 'none' },
  success: { bg: 'transparent', fg: 'var(--success)', border: '1px solid var(--border-2)' },
  warning: { bg: 'transparent', fg: 'var(--warning)', border: '1px solid var(--border-2)' },
  error: { bg: 'transparent', fg: 'var(--error)', border: '1px solid var(--border-2)' },
  blue: { bg: 'var(--course-yoga)', fg: 'var(--text-on-course)', border: 'none' }, // легаси
};
export function Badge({ tone = 'neutral', children, style }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', height: 24, padding: '0 10px', borderRadius: 0,
      background: t.bg, color: t.fg, border: t.border, fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', whiteSpace: 'nowrap', ...style }}>
      {children}
    </span>
  );
}
