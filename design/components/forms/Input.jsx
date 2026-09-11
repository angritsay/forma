import React from 'react';
export function Input({ label, hint, error, style, inputStyle, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  const border = error ? 'var(--error)' : focus ? 'var(--blue)' : 'var(--border-1)';
  return (
    <label style={{ display: 'grid', gap: 6, fontFamily: 'var(--font-body)', ...style }}>
      {label ? <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{label}</span> : null}
      <input {...rest} onFocus={e => { setFocus(true); rest.onFocus && rest.onFocus(e); }} onBlur={e => { setFocus(false); rest.onBlur && rest.onBlur(e); }}
        style={{ height: 48, padding: '0 16px', borderRadius: 'var(--r-input)', background: 'var(--surface-input)',
          border: `1px solid ${border}`, outline: 'none', color: 'var(--text-1)', fontFamily: 'var(--font-body)', fontSize: 15,
          boxShadow: focus && !error ? 'var(--glow-blue)' : 'none', transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)', ...inputStyle }} />
      {error ? <span style={{ fontSize: 12, color: 'var(--error)' }}>{error}</span>
        : hint ? <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{hint}</span> : null}
    </label>
  );
}
