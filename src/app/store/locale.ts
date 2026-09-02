/**
 * UI locale, persisted in localStorage under `forma.locale`.
 * On sign-in the session store adopts `profile.locale`; when a signed-in user changes the locale
 * the session store pushes it to the profile (see store/session.ts `wire()`).
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { detectLocale, type Locale } from '@/i18n/index';

export interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const LOCALE_STORAGE_KEY = 'forma.locale';

export const useLocale = create<LocaleState>()(
  persist(
    (set) => ({
      locale: detectLocale(),
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: LOCALE_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ locale: s.locale }),
    },
  ),
);
