import React from 'react';
import { Icon } from './Icon.jsx';
const SIZES = { sm: { h: 40, px: 18, fs: 12 }, md: { h: 48, px: 26, fs: 13 }, lg: { h: 56, px: 32, fs: 13 } };
export function Button({ variant = 'primary', size = 'md', icon, fullWidth, disabled, children, onClick, style }) {
  const s = SIZES[size] || SIZES.md;
  const [press, setPress] = React.useState(false);
  const variants = {
    primary: { background: 'var(--accent)', color: 'var(--text-on-accent)', border: 'none' },
    secondary: { background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-2)' },
    ghost: { background: 'transparent', color: 'var(--text-2)', border: 'none' },
    danger: { background: 'transparent', color: 'var(--error)', border: '1px solid var(--border-2)' },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      onPointerDown={() => setPress(true)} onPointerUp={() => setPress(false)} onPointerLeave={() => setPress(false)}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: s.h, padding: `0 ${s.px}px`, borderRadius: 'var(--r-btn)', cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'var(--font-body)', fontSize: s.fs, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', whiteSpace: 'nowrap',
        width: fullWidth ? '100%' : undefined, opacity: disabled ? .4 : 1,
        transform: press && !disabled ? 'scale(.98)' : 'none', transition: 'transform var(--dur-fast) var(--ease-out), opacity var(--dur-fast)',
        ...variants[variant], ...style }}>
      {icon ? <Icon name={icon} size={s.fs + 3} /> : null}{children}
    </button>
  );
}
