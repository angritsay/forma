/** `t()` / `l()` bound to the current UI locale. */
import { useMemo } from 'react';
import { l as pickL10n, t as translate, type Locale, type TKey, type TParams } from '@/i18n/index';
import type { L10n } from '@/content/schema';
import { useLocale } from '@/app/store/locale';

export interface Translator {
  locale: Locale;
  t: (key: TKey, params?: TParams) => string;
  l: (value: L10n | null | undefined) => string;
}

export function useT(): Translator {
  const locale = useLocale((s) => s.locale);
  return useMemo(
    () => ({
      locale,
      t: (key, params) => translate(locale, key, params),
      l: (value) => pickL10n(value, locale),
    }),
    [locale],
  );
}
