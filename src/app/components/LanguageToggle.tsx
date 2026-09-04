import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useT } from '@/app/hooks/useT';
import { useLocale } from '@/app/store/locale';
import type { Locale } from '@/i18n/index';

/** Compact RU/EN switch bound to the locale store. */
export function LanguageToggle({ className }: { className?: string }) {
  const { t, locale } = useT();
  const setLocale = useLocale((s) => s.setLocale);
  return (
    <SegmentedControl<Locale>
      size="sm"
      label={t('common.language')}
      value={locale}
      onChange={setLocale}
      className={className}
      options={[
        // `lang` marks each code as being in the language it selects, so screen readers switch
        // voice for it — the same contract as the landing's hreflang/lang switcher.
        { value: 'ru', label: <span lang="ru">{t('app.navLocaleRu')}</span> },
        { value: 'en', label: <span lang="en">{t('app.navLocaleEn')}</span> },
      ]}
    />
  );
}
