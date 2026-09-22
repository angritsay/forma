import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { DEFAULT_LOCALE, LANGUAGE_NAME, LOCALES } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import { useAdminLocale } from './adminLocale';

export interface LangTabsProps {
  /**
   * Ещё нечего переводить: запись только создаётся.
   *
   * Тогда переключателя нет вовсе, и вместо него одна строка про то, почему. Без этого можно
   * было попасть в ловушку: переключатель остался на английском с прошлого раза, тренер заводит
   * новое упражнение, печатает английское название — а «Сохранить» не нажимается, потому что
   * обязательным было русское, и русское поле он в глаза не видел.
   */
  locked?: boolean;
  className?: string;
}

/**
 * «Русский | English» над формой: на каком языке тренер сейчас печатает.
 *
 * Стоит первым на экране, до полей, потому что отвечает на вопрос, который возникает раньше всех
 * остальных: «а куда я сейчас пишу». Внутри форм он не повторяется — состояние одно на всю
 * админку (`adminLocale.ts`), и вторая такая полоска в середине экрана читалась бы как ещё один
 * переключатель, у которого своя память.
 *
 * Названия языков — на самих языках, из того же места, что на первом экране приложения. Здесь это
 * даже нужнее: в форме, где вперемешку русские подписи и английский текст, «English» находится
 * глазами, а «Английский» надо прочитать.
 *
 * Пропадает целиком, если язык один: продукт снова стал одноязычным — и переключать нечего.
 */
export function LangTabs({ locked, className }: LangTabsProps) {
  const { t } = useT();
  const editing = useAdminLocale((s) => s.editing);
  const setEditing = useAdminLocale((s) => s.setEditing);

  if (LOCALES.length < 2) return null;
  if (locked) return <span className="text-[13px] text-muted-2">{t('app.adminRussianFirst')}</span>;

  return (
    <SegmentedControl
      className={className}
      size="sm"
      label={t('app.adminEditingLanguage')}
      value={editing}
      onChange={setEditing}
      options={LOCALES.map((loc) => ({
        value: loc,
        label: <span lang={loc}>{LANGUAGE_NAME[loc]}</span>,
      }))}
    />
  );
}

/**
 * Язык, на котором форма сейчас печатает, с учётом блокировки.
 *
 * Отдельным хуком, потому что блокировка должна действовать на поля, а не только на вид
 * переключателя: `LangTabs` можно спрятать, а поля продолжат показывать английскую половину —
 * и получится ровно та ловушка, ради которой блокировка и заводилась.
 */
export function useEditingLocale(locked?: boolean) {
  const editing = useAdminLocale((s) => s.editing);
  return locked ? DEFAULT_LOCALE : editing;
}
