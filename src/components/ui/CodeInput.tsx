/**
 * One-time-code input: N boxes, numeric keyboard, auto-advance, backspace to the previous box,
 * paste of the whole code, `autoComplete="one-time-code"` for iOS/Android SMS/mail suggestions.
 */
import { clsx } from 'clsx';
import {
  useEffect,
  useRef,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react';

export interface CodeInputProps {
  value: string;
  onChange: (code: string) => void;
  /** Called once when all boxes are filled. */
  onComplete?: (code: string) => void;
  length?: number;
  disabled?: boolean;
  /** Marks the boxes invalid (e.g. wrong code). */
  error?: boolean;
  autoFocus?: boolean;
  /** Accessible group name. */
  label?: string;
  className?: string;
}

const DIGITS = /\d/g;

export function CodeInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled,
  error,
  autoFocus,
  label,
  className,
}: CodeInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const completedFor = useRef<string | null>(null);
  const digits = value.replace(/\D/g, '').slice(0, length);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (digits.length === length && completedFor.current !== digits) {
      completedFor.current = digits;
      onComplete?.(digits);
    }
    if (digits.length < length) completedFor.current = null;
  }, [digits, length, onComplete]);

  const focusBox = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(length - 1, i))];
    el?.focus();
    el?.select();
  };

  const setAt = (i: number, ch: string) => {
    const arr = digits.padEnd(length, ' ').split('');
    arr[i] = ch;
    onChange(arr.join('').replace(/\s/g, ''));
  };

  const handleChange = (i: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.match(DIGITS)?.join('') ?? '';
    if (!raw) {
      setAt(i, ' ');
      return;
    }
    if (raw.length > 1) {
      // Typed/inserted several digits into one box (some keyboards do this): spread them.
      const next = (digits.slice(0, i) + raw).slice(0, length);
      onChange(next);
      focusBox(next.length >= length ? length - 1 : next.length);
      return;
    }
    const next = (digits.slice(0, i).padEnd(i, ' ') + raw + digits.slice(i + 1)).replace(/\s/g, '');
    onChange(next.slice(0, length));
    if (i < length - 1) focusBox(i + 1);
  };

  const handleKeyDown = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[i]) {
        onChange(digits.slice(0, i));
      } else if (i > 0) {
        onChange(digits.slice(0, i - 1));
        focusBox(i - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusBox(i - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusBox(i + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').match(DIGITS)?.join('') ?? '';
    if (!text) return;
    e.preventDefault();
    const next = text.slice(0, length);
    onChange(next);
    focusBox(next.length >= length ? length - 1 : next.length);
  };

  return (
    <div role="group" aria-label={label} className={clsx('flex justify-between gap-2', className)}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          value={digits[i] ?? ''}
          disabled={disabled}
          aria-label={label ? `${label} ${i + 1}` : undefined}
          aria-invalid={error || undefined}
          onChange={handleChange(i)}
          onKeyDown={handleKeyDown(i)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={clsx(
            'tabular h-14 w-full min-w-0 rounded-inner border bg-surface-2 text-center text-2xl font-semibold text-text',
            'outline-none transition-colors focus:border-primary disabled:opacity-50',
            error ? 'border-danger' : 'border-border',
          )}
        />
      ))}
    </div>
  );
}
