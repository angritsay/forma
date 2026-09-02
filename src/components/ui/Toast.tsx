/**
 * Toasts. The kit provides the presentation (<Toast>, <ToastStack>) and a context-based
 * `useToast()`; the app supplies the store behind <ToastProvider> (see app/components/Toaster).
 */
import { clsx } from 'clsx';
import { createContext, useContext, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
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

const KIND_ICON: Record<ToastKind, IconName> = { info: 'info', success: 'check', error: 'warning' };
const KIND_CLASS: Record<ToastKind, string> = {
  info: 'text-accent-2',
  success: 'text-success',
  error: 'text-danger',
};

export function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const labels = useKitLabels();
  return (
    <div
      role={toast.kind === 'error' ? 'alert' : 'status'}
      className="flex items-start gap-3 rounded-inner border border-border-strong bg-surface-3 p-4 shadow-card"
    >
      <Icon name={KIND_ICON[toast.kind]} className={clsx('mt-0.5', KIND_CLASS[toast.kind])} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-sm text-muted">{toast.description}</p>
        ) : null}
      </div>
      <IconButton
        label={labels.dismiss}
        icon="close"
        size="sm"
        variant="ghost"
        className="-mr-2 -mt-2"
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
      className="pointer-events-none fixed left-1/2 top-[calc(env(safe-area-inset-top)+12px)] z-[60] flex w-[calc(100%-32px)] max-w-[448px] -translate-x-1/2 flex-col gap-2"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
