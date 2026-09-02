import { clsx } from 'clsx';
import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { useKitLabels } from './KitContext';
import { useEnterTransition, useEscape, useFocusTrap, useLockBodyScroll } from './overlay';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  onConfirm?: () => void;
  /** Styles the confirm button as destructive. */
  danger?: boolean;
  loading?: boolean;
  className?: string;
}

/** Centered confirm dialog. Esc/backdrop close; focus trapped; initial focus on Cancel. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  danger,
  loading,
  className,
}: ModalProps) {
  const labels = useKitLabels();
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const shown = useEnterTransition(open);
  useEscape(open, onClose);
  useFocusTrap(ref, open);
  useLockBodyScroll(open);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={clsx(
          'relative w-full max-w-[400px] rounded-card border border-border bg-surface-2 p-6 shadow-card outline-none',
          'transition-[opacity,transform] duration-200',
          shown ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          className,
        )}
      >
        <h2 id={titleId} className="text-xl font-semibold">
          {title}
        </h2>
        {description ? (
          <p id={descId} className="mt-2 text-[15px] text-muted">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-6 flex flex-col gap-2">
          {onConfirm ? (
            <Button
              variant={danger ? 'danger' : 'primary'}
              size="lg"
              fullWidth
              loading={loading}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          ) : null}
          <Button variant="ghost" size="lg" fullWidth onClick={onClose} data-autofocus>
            {cancelLabel ?? labels.close}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
