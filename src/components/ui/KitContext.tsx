/**
 * Localized labels the kit needs for its own controls (close buttons, spinners…).
 * The app provides them from i18n through <KitProvider>; components fall back to EN so the
 * kit stays usable in isolation.
 */
import { createContext, useContext, type ReactNode } from 'react';

export interface KitLabels {
  /** aria-label of close buttons in Sheet/Modal. */
  close: string;
  /** aria-label of the dismiss button on a toast. */
  dismiss: string;
  /** Accessible text of loading spinners. */
  loading: string;
}

const DEFAULT_LABELS: KitLabels = { close: 'Close', dismiss: 'Dismiss', loading: 'Loading' };

const KitContext = createContext<KitLabels>(DEFAULT_LABELS);

export function KitProvider({ labels, children }: { labels: KitLabels; children: ReactNode }) {
  return <KitContext.Provider value={labels}>{children}</KitContext.Provider>;
}

export function useKitLabels(): KitLabels {
  return useContext(KitContext);
}
