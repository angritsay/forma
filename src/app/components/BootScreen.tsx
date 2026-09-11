import { Logo } from '@/components/ui/Logo';
import { Spinner } from '@/components/ui/Spinner';
import { useT } from '@/app/hooks/useT';

/**
 * Full-height brand splash shown while the session boots or a lazy screen loads.
 *
 * The wordmark, the tagline as a kicker under it, and the kit spinner — set left in the phone
 * column like every other screen, not centred like a launch card. The spinner is the one
 * circle that is allowed to turn here; it also carries the "loading" status for screen readers,
 * which is why the kicker is the tagline and not the word "loading" a second time.
 */
export function BootScreen() {
  const { t } = useT();
  return (
    <div className="flex min-h-dvh flex-col justify-center">
      <div className="mx-auto flex w-full max-w-[480px] flex-col gap-4 px-5.5">
        <Logo className="text-4xl" />
        {/* A sentence, not a label: the sentence-case kicker, so it is not shouted in caps. */}
        <span className="eyebrow-sentence">{t('common.tagline')}</span>
        <Spinner size={16} className="mt-2 text-muted" />
      </div>
    </div>
  );
}
