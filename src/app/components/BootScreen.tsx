import { LogoLoader } from '@/components/ui/LogoLoader';
import { useT } from '@/app/hooks/useT';

/**
 * Full-height brand splash shown while the session boots or a lazy screen loads.
 *
 * The mark itself is the indicator — «FORMA» with a wave of weight running through it — with the
 * tagline as a kicker under it, set left in the content column like every other screen rather
 * than centred like a launch card. It replaced a turning circle, which was the one shape the
 * brandbook forbids and was only ever there because nothing else had been drawn; the mark also
 * carries the "loading" status for screen readers, which is why the kicker is the tagline and not
 * the word "loading" a second time.
 *
 * It grows with the viewport. On a phone the column is the phone's; from `md` up the whole screen
 * is the app's, and a 36px wordmark alone in the middle of a 1440px window reads as a page that
 * failed rather than one that is coming.
 */
export function BootScreen() {
  const { t } = useT();
  return (
    <div className="flex min-h-dvh flex-col justify-center">
      <div className="mx-auto flex w-full max-w-[480px] flex-col gap-4 px-5.5 md:max-w-[720px] md:gap-5 md:px-10">
        <LogoLoader className="text-4xl md:text-6xl lg:text-7xl" />
        {/* A sentence, not a label: the sentence-case kicker, so it is not shouted in caps. */}
        <span className="eyebrow-sentence">{t('common.tagline')}</span>
      </div>
    </div>
  );
}
