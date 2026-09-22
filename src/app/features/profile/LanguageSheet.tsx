import { Glyph } from '@/components/ui/Icon';
import { ListRow } from '@/components/ui/ListRow';
import { Sheet } from '@/components/ui/Sheet';
import { useT } from '@/app/hooks/useT';
import { useLocale } from '@/app/store/locale';
import { LANGUAGE_NAME, LOCALES } from '@/i18n/index';

export interface LanguageSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Changing the language after the first screen.
 *
 * No save button and no busy state, unlike the name and the equipment beside it: picking a
 * language is not a form that can fail. The store takes it immediately, the whole app re-renders
 * in the new language under the sheet, and `session.ts` writes `profiles.locale` in the
 * background — if that write fails the app is still in the right language and the next profile
 * save carries it. Waiting on a spinner to find out whether one word may change would be a worse
 * trade than the one case it guards.
 *
 * Because of that the sheet closes on the pick: the answer is visible behind it — the sheet's own
 * title has already changed — and leaving it open would ask the question a second time.
 *
 * Each language is named in itself, from the same constant the first screen uses. A person
 * looking for English in a Russian app is looking for the word «English».
 */
export function LanguageSheet({ open, onClose }: LanguageSheetProps) {
  const { t } = useT();
  const current = useLocale((s) => s.locale);
  const setLocale = useLocale((s) => s.setLocale);

  return (
    <Sheet open={open} onClose={onClose} title={t('app.languageSheetTitle')}>
      <ul className="-mx-6 border-y border-border md:-mx-8">
        {LOCALES.map((loc) => (
          <li key={loc}>
            <ListRow
              title={<span lang={loc}>{LANGUAGE_NAME[loc]}</span>}
              onClick={() => {
                setLocale(loc);
                onClose();
              }}
              trailing={loc === current ? <Glyph size={16}>✓</Glyph> : null}
            />
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
