/** One row on Home for the coach's hour: his face, what it is, the price — tap to book. */
import { Avatar } from '@/components/ui/Avatar';
import { Glyph } from '@/components/ui/Icon';
import { l } from '@/i18n/index';
import { withBase } from '@/lib/util/paths';
import { useT } from '@/app/hooks/useT';
import { BOOKING } from '@content/site/booking';
import { COACH } from '@content/site/coach';
import { formatPrice } from '@content/site/pricing';

export interface BookCardProps {
  onOpen: () => void;
}

export function BookCard({ onOpen }: BookCardProps) {
  const { t, locale } = useT();
  const name = l(COACH.name, locale);
  return (
    /*
     * The coach's hour, as a ruled row. His photograph is square-cropped and monochrome rather
     * than a circular avatar: a round portrait is the one shape in the app that reads as "your
     * account", and this is the one person on the screen who is not the user.
     */
    <button
      type="button"
      onClick={onOpen}
      className="mt-6 flex w-full items-center gap-4 border-t border-border py-5 text-left"
      aria-label={t('app.homeBookTitle')}
    >
      {COACH.photo ? (
        <img
          src={withBase(COACH.photo)}
          alt=""
          width={56}
          height={56}
          className="photo-mono size-14 shrink-0 rounded-control object-cover"
        />
      ) : (
        <Avatar seed={name} name={name} size={56} />
      )}
      <span className="min-w-0 flex-1">
        <span className="font-display block text-[15px] leading-[1.24]">
          {t('app.homeBookTitle')}
        </span>
        <span className="mt-1 block text-sm text-muted">
          {t('app.homeBookText', {
            name,
            duration: BOOKING.durationMin,
            price: formatPrice(locale, BOOKING.price),
          })}
        </span>
      </span>
      <Glyph size={16} className="shrink-0 text-muted-2">
        ›
      </Glyph>
    </button>
  );
}
