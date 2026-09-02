/** Transient UI state: toasts. */
import { create } from 'zustand';
import type { ToastInput, ToastItem } from '@/components/ui/Toast';

export interface UiState {
  toasts: ToastItem[];
  /** Adds a toast (max 3 visible) and returns its id. Auto-dismisses after `durationMs` (4 s). */
  showToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
}

const DEFAULT_DURATION_MS = 4000;
const MAX_TOASTS = 3;
let seq = 0;

export const useUi = create<UiState>((set, get) => ({
  toasts: [],
  showToast: (input) => {
    const id = input.id ?? `toast-${++seq}`;
    const item: ToastItem = { ...input, id };
    set((s) => ({ toasts: [...s.toasts.filter((t) => t.id !== id), item].slice(-MAX_TOASTS) }));
    const ms = input.durationMs ?? DEFAULT_DURATION_MS;
    if (ms > 0) setTimeout(() => get().dismissToast(id), ms);
    return id;
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
