/**
 * UI locale.
 *
 * Forma is published in Russian only (LOCALES in src/content/schema.ts), so there is nothing to
 * detect, persist or switch: the store hands out the default and `setLocale` accepts a published
 * language, ignoring anything else. It stays a store rather than a constant because the app reads
 * the locale in dozens of places, and publishing a second language should not be a refactor.
 */
import { create } from 'zustand';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/index';

export interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocale = create<LocaleState>()((set) => ({
  locale: DEFAULT_LOCALE,
  setLocale: (locale) => {
    if (isLocale(locale)) set({ locale });
  },
}));
