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
        { value: 'ru', label: t('app.navLocaleRu') },
        { value: 'en', label: t('app.navLocaleEn') },
      ]}
    />
  );
}
