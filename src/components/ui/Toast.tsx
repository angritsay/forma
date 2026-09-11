/**
 * Toasts. The kit provides the presentation (<Toast>, <ToastStack>) and a context-based
 * `useToast()`; the app supplies the store behind <ToastProvider> (see app/components/Toaster).
 */
import { clsx } from 'clsx';
import { createContext, useContext, type ReactNode } from 'react';
import { Glyph } from './Icon';
import { IconButton } from './IconButton';
import { useKitLabels } from './KitContext';

export type ToastKind = 'info' | 'success' | 'error';

export interface ToastItem {
  id: string;
  kind: ToastKind;
  title: ReactNode;
  description?: ReactNode;
  /** Auto-dismiss delay; 0 keeps the toast until dismissed. */
  durationMs?: number;
}

export type ToastInput = Omit<ToastItem, 'id'> & { id?: string };

export interface ToastApi {
  show: (toast: ToastInput) => string;
  dismiss: (id: string) => void;
}

const noop: ToastApi = { show: () => '', dismiss: () => undefined };
const ToastContext = createContext<ToastApi>(noop);

export function ToastProvider({ api, children }: { api: ToastApi; children: ReactNode }) {
  return <ToastContext.Provider value={api}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastApi {
  return useContext(ToastContext);
}

/*
 * The mark is a typographic glyph, not an icon: a tick for done, a cross for failed, `//` for a
 * plain notice — the brand's own punctuation. The semantic colour sits on the glyph alone; the
 * rest of the toast is monochrome.
 */
const KIND_GLYPH: Record<ToastKind, string> = { info: '//', success: '✓', error: '×' };
const KIND_CLASS: Record<ToastKind, string> = {
  info: 'text-muted',
  success: 'text-success',
  error: 'text-danger',
};

export function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const labels = useKitLabels();
  return (
    <div
      role={toast.kind === 'error' ? 'alert' : 'status'}
      className="flex items-start gap-3 rounded-card border border-border-strong bg-surface-3 p-4"
    >
      <Glyph size={14} className={clsx('mt-1', KIND_CLASS[toast.kind])}>
        {KIND_GLYPH[toast.kind]}
      </Glyph>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-[13px] text-muted">{toast.description}</p>
        ) : null}
      </div>
      <IconButton
        label={labels.dismiss}
        icon="close"
        size="sm"
        variant="ghost"
        className="-mt-2 -mr-2"
        onClick={() => onDismiss(toast.id)}
      />
    </div>
  );
}

/** Fixed viewport at the top of the app frame. */
export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: readonly ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-[calc(var(--safe-top)+12px)] left-1/2 z-[60] flex w-[calc(100%-32px)] max-w-[448px] -translate-x-1/2 flex-col gap-2"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
