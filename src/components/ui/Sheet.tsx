import { clsx } from 'clsx';
import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from './IconButton';
import { useKitLabels } from './KitContext';
import { useEnterTransition, useEscape, useFocusTrap, useLockBodyScroll } from './overlay';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  /** Sticky footer (actions). */
  footer?: ReactNode;
  /** Accessible name when there is no visible title. */
  label?: string;
  className?: string;
}

/**
 * Bottom sheet: backdrop + Esc close, focus trap, body scroll lock, safe-area padding.
 *
 * Square-shouldered — the rounded top that marked a sheet in the previous design is gone with
 * every other radius — so what says "sheet" is the strong hairline along its top edge and the
 * short grab bar under it. It slides up over 280ms on the brand's ease-out and casts no shadow.
 */
export function Sheet({ open, onClose, title, children, footer, label, className }: SheetProps) {
  const labels = useKitLabels();
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const shown = useEnterTransition(open);
  useEscape(open, onClose);
  useFocusTrap(ref, open);
  useLockBodyScroll(open);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop: a pointer shortcut only. It is hidden from assistive tech and from the tab
          order because the sheet already exposes a real close button (and Esc). */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className={clsx(
          'absolute inset-0 bg-ink/60 transition-opacity duration-150 ease-(--ease-out)',
          shown ? 'opacity-100' : 'opacity-0',
        )}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : label}
        tabIndex={-1}
        className={clsx(
          'relative flex max-h-[92dvh] w-full max-w-[480px] flex-col border-t border-border-strong bg-surface',
          'outline-none transition-transform duration-280 ease-(--ease-out)',
          shown ? 'translate-y-0' : 'translate-y-full',
          className,
        )}
      >
        <div className="mx-auto mt-3 h-0.5 w-10 shrink-0 bg-border-strong" aria-hidden="true" />
        <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-2">
          {title ? (
            <h2 id={titleId} className="font-display text-lg">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <IconButton
            label={labels.close}
            icon="close"
            size="sm"
            variant="ghost"
            onClick={onClose}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-border px-5 pt-4 pb-[calc(var(--safe-bottom)+16px)]">
            {footer}
          </div>
        ) : (
          <div className="h-[var(--safe-bottom)]" />
        )}
      </div>
    </div>,
    document.body,
  );
}
