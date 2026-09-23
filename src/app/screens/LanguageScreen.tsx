import { HeroField, KeyTitle } from '@/components/ui/HeroField';
import { Logo } from '@/components/ui/Logo';
import { LANGUAGE_NAME, LOCALES, t } from '@/i18n/index';
import { useLocale } from '@/app/store/locale';

/**
 * The first screen: which language.
 *
 * ## Why it comes before the sign-in
 *
 * The sign-in screen has words on it. So does the e-mail it sends. Asking afterwards would mean
 * the first two things a person reads are in a language they may not have, and the question would
 * arrive after the moment it could have helped.
 *
 * ## Why this screen is not localized
 *
 * Every other screen asks the store what language to speak. This one cannot — it is the screen
 * that decides. So it says everything twice: each language names *itself*, in itself
 * (`LANGUAGE_NAME`, which is not a dictionary lookup precisely because a lookup would need a
 * locale), and the one line of instruction appears in both. Someone who reads neither still sees
 * two plates with two scripts on them, which is enough to choose from.
 *
 * ## What one tap does
 *
 * Sets it, and that is the whole screen — no confirm button, because there is nothing to confirm
 * and no second question coming. The answer is kept forever (`src/app/store/locale.ts`: this
 * device now, the profile as soon as there is one) and can be changed later in the account, which
 * is the promise the line under the plates makes so that the choice does not feel final.
 */
export default function LanguageScreen() {
  const setLocale = useLocale((s) => s.setLocale);

  return (
    /*
     * Centred, not pushed to the bottom edge the way the sign-in screen is. That screen sits low
     * because a film is playing behind it and the space above the form is the picture; here there
     * is nothing behind, and the same composition leaves two thirds of a black screen empty above
     * the question, which reads as a page that has not finished loading.
     */
    <main className="flex min-h-dvh flex-col justify-center px-6 pt-[var(--safe-top)] pb-[calc(var(--safe-bottom)+28px)] text-paper">
      <div className="flex flex-col items-center gap-10">
        <Logo className="text-[15px]" />

        {/*
         * The question and the answers are the screen's one blue field (style A, global.css
         * header): this is the thing happening here, and the only thing. The plates on it are the
         * field's secondary button — white with the field's blue for words (7.71) — two of them,
         * equal, because neither language is *the* action.
         *
         * Both languages of the question, stacked, the second one quieter — not because English
         * matters less but because two lines of equal weight read as a heading and a subheading,
         * and this is one sentence said twice. The order follows LOCALES, so the default language
         * leads, and it carries the key word.
         */}
        <HeroField padding="lg" className="flex w-full flex-col gap-7">
          <div className="flex flex-col items-center gap-1 text-center">
            {LOCALES.map((loc, i) => (
              <p
                key={loc}
                lang={loc}
                className={i === 0 ? 'font-display text-lg' : 'text-[15px] text-on-field/85'}
              >
                {i === 0 ? (
                  <KeyTitle text={t(loc, 'app.languageTitle')} />
                ) : (
                  t(loc, 'app.languageTitle')
                )}
              </p>
            ))}
          </div>

          <div className="flex w-full flex-col gap-3">
            {LOCALES.map((loc) => (
              <button
                key={loc}
                type="button"
                lang={loc}
                onClick={() => setLocale(loc)}
                className="flex min-h-14 w-full items-center justify-center rounded-control bg-paper px-4 text-[17px] font-semibold text-field transition-[opacity,transform] duration-150 ease-(--ease-out) hover:opacity-90 active:scale-[0.99]"
              >
                {LANGUAGE_NAME[loc]}
              </button>
            ))}
          </div>
        </HeroField>

        {/*
         * Also in both, and on one line rather than two: this is a reassurance, not an
         * instruction. The choice looks final — it is the first thing the app asks and it has no
         * back button — and a person who thinks they are committing forever hesitates over a
         * question that does not deserve it.
         */}
        <p className="text-center text-[12px] leading-snug text-paper/55">
          {LOCALES.map((loc) => t(loc, 'app.languageChangeLater')).join(' · ')}
        </p>
      </div>
    </main>
  );
}
