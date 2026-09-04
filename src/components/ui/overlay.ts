/** Shared hooks for overlays (Sheet, Modal): Esc to close, focus trap, body scroll lock. */
import { useEffect, useRef, useState, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Every open overlay in mount order. Esc must close only the topmost one — without this a Sheet
 * opened from inside a Modal would tear down both at once.
 */
const escapeStack: symbol[] = [];

export function useEscape(active: boolean, onClose: () => void): void {
  // The handler is read through a ref so re-created `onClose` callbacks do not re-order the stack.
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!active) return;
    const token = Symbol('overlay');
    escapeStack.push(token);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (escapeStack[escapeStack.length - 1] !== token) return;
      e.stopPropagation();
      close.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      const i = escapeStack.lastIndexOf(token);
      if (i >= 0) escapeStack.splice(i, 1);
    };
  }, [active]);
}

/** Keeps Tab focus inside `ref` while active; restores the previously focused element after. */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    if (!container) return;
    const previous = document.activeElement as HTMLElement | null;

    // Hidden controls (a collapsed section, an element behind `display:none`) are skipped so Tab
    // never appears to stall on an invisible target.
    const focusables = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
    const initial = container.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0];
    (initial ?? container).focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const current = document.activeElement;
      if (e.shiftKey && (current === first || !container.contains(current))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      // Focus goes back to whatever opened the overlay, unless that element is gone.
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [ref, active]);
}

export function useLockBodyScroll(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}

/** Mount/enter transition helper: `shown` flips true one frame after `open` becomes true. */
export function useEnterTransition(open: boolean): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!open) {
      setShown(false);
      return;
    }
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, [open]);
  return shown;
}
