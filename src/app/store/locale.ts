/**
 * UI locale: what language the app speaks, and whether the person ever said so.
 *
 * ## Two facts, not one
 *
 * `locale` is which language to render. `chosen` is whether anybody picked it — and they are not
 * the same thing, because `locale` always has a value. Without the second fact the first screen
 * could only ask «is the locale Russian?», which is true for everyone who never answered, and the
 * question would never be asked at all.
 *
 * ## Where the answer lives
 *
 * Two places, and deliberately:
 *
 * * **`localStorage`** carries it before there is an account. The language has to be picked before
 *   the sign-in screen — it *is* the sign-in screen's language — and at that moment there is
 *   nowhere on the server to write it.
 * * **`profiles.locale`** carries it afterwards. That is the durable copy: it follows the person
 *   to a new phone, and it is what the bot reads to know which language to write in.
 *
 * `session.ts` keeps them in step in both directions — it adopts `profile.locale` on sign-in and
 * writes the column when this store changes. The browser copy is a cache of the column.
 *
 * ## People who were already here
 *
 * Everyone who existed before this screen has `profiles.locale = 'ru'` — the column's default
 * since 0001_init.sql — so `adopt()` marks them settled the moment their profile loads and they
 * never meet the question. That is the owner's instruction («Те пользователи что уже нашли, им
 * можешь автоматически проставить русский») and it needs no migration: the data is already there.
 */
import { create } from 'zustand';
import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from '@/i18n/index';

export const LOCALE_STORAGE_KEY = 'forma.locale';

export interface LocaleState {
  locale: Locale;
  /** True once a person (or their profile) settled it — the first screen asks only when false. */
  chosen: boolean;
  /** A deliberate choice: remembered on this device and pushed to the profile by session.ts. */
  setLocale: (locale: Locale) => void;
  /**
   * The profile's language, on sign-in. Same effect as a choice without being one: it never
   * overwrites a pick made on this device a moment ago, on the screen before sign-in.
   */
  adopt: (locale: Locale) => void;
}

function read(): { locale: Locale; chosen: boolean } {
  try {
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(LOCALE_STORAGE_KEY) : null;
    if (isLocale(v)) return { locale: v, chosen: true };
  } catch {
    /* Private mode or a full store: ask again rather than guess. */
  }
  return { locale: DEFAULT_LOCALE, chosen: false };
}

function write(locale: Locale): void {
  try {
    localStorage?.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* The choice lives in memory for this launch; the profile is the durable copy anyway. */
  }
}

export const useLocale = create<LocaleState>()((set, get) => ({
  ...read(),
  setLocale: (locale) => {
    if (!isLocale(locale)) return;
    write(locale);
    set({ locale, chosen: true });
  },
  adopt: (locale) => {
    if (!isLocale(locale)) return;
    // A fresh pick on this device wins: the person chose English two taps ago, and the profile
    // that still says Russian is about to be updated by the subscription in session.ts.
    if (get().chosen) return;
    write(locale);
    set({ locale, chosen: true });
  },
}));

/** What the first screen and the account switch offer: the published languages, in order. */
export const OFFERED_LOCALES: readonly Locale[] = LOCALES;
