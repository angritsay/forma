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

/** Bottom sheet: backdrop + Esc close, focus trap, body scroll lock, safe-area padding. */
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
      <button
        type="button"
        aria-label={labels.close}
        onClick={onClose}
        className={clsx(
          'absolute inset-0 bg-black/60 transition-opacity duration-200',
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
          'relative flex max-h-[92dvh] w-full max-w-[480px] flex-col rounded-t-card border-t border-border bg-surface',
          'shadow-card outline-none transition-transform duration-250 ease-out',
          shown ? 'translate-y-0' : 'translate-y-full',
          className,
        )}
      >
        <div
          className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-pill bg-white/20"
          aria-hidden="true"
        />
        <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-3">
          {title ? (
            <h2 id={titleId} className="text-lg font-semibold">
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
          <div className="shrink-0 border-t border-border px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
            {footer}
          </div>
        ) : (
          <div className="h-[env(safe-area-inset-bottom)]" />
        )}
      </div>
    </div>,
    document.body,
  );
}
