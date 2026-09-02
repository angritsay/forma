import { useMemo, type ReactNode } from 'react';
import { ToastProvider, ToastStack, type ToastApi } from '@/components/ui/Toast';
import { useUi } from '@/app/store/ui';

/** Binds the kit's toast context to the UI store and renders the stack. */
export function Toaster({ children }: { children: ReactNode }) {
  const toasts = useUi((s) => s.toasts);
  const show = useUi((s) => s.showToast);
  const dismiss = useUi((s) => s.dismissToast);
  const api = useMemo<ToastApi>(() => ({ show, dismiss }), [show, dismiss]);
  return (
    <ToastProvider api={api}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastProvider>
  );
}
