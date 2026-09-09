/** One row on Home for the coach's hour: his face, what it is, the price — tap to book. */
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
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
    <Card onClick={onOpen} className="flex items-center gap-4" aria-label={t('app.homeBookTitle')}>
      {COACH.photo ? (
        <img
          src={withBase(COACH.photo)}
          alt=""
          width={56}
          height={56}
          className="size-14 shrink-0 rounded-pill object-cover"
        />
      ) : (
        <Avatar seed={name} name={name} size={56} />
      )}
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[15px] font-semibold">{t('app.homeBookTitle')}</span>
        <span className="mt-0.5 block text-sm text-muted">
          {t('app.homeBookText', {
            name,
            duration: BOOKING.durationMin,
            price: formatPrice(locale, BOOKING.price),
          })}
        </span>
      </span>
      <Icon name="chevron" size={18} className="shrink-0 text-muted" />
    </Card>
  );
}
