import { PageTitle } from '@/components/ui/PageTitle';
import { useT } from '@/app/hooks/useT';
import { useLocale } from '@/app/store/locale';
import type { Locale } from '@/i18n/index';
import { OptionList } from './OptionList';
import type { StepProps } from './types';

export function StepLanguage({ draft, update }: StepProps) {
  const { t } = useT();
  const setLocale = useLocale((s) => s.setLocale);
  const choose = (locale: Locale) => {
    update({ locale });
    setLocale(locale);
  };
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={t('app.onbLanguageTitle')} subtitle={t('app.onbLanguageLead')} />
      <OptionList<Locale>
        label={t('common.language')}
        value={draft.locale}
        onChange={choose}
        options={[
          { value: 'ru', label: t('common.languageRu') },
          { value: 'en', label: t('common.languageEn') },
        ]}
      />
    </div>
  );
}
