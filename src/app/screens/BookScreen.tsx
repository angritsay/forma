/**
 * Book a one-to-one session with the coach (docs/SPEC.md §9, `/book`): who he is, the two lengths
 * he sells, and one action per length. With a payment link configured the button hands the
 * signed-in email to the payment page (the landing order form's rule: https only, email appended);
 * without one it opens a message to the coach — a session is agreed with a person, not lost in a
 * form, and a length whose product does not exist yet can still be offered that way.
 *
 * This is the only screen where the two lengths stand side by side. Everywhere else the offer is
 * mentioned in passing and quotes «от {the cheaper price}», because a passing mention that names
 * one of two prices is picking for the reader.
 *
 * Redrawn in the owner's prototype language: the coach's photograph, one line about what the hour
 * is, and then each length as its price — one display numeral — with one button under it. What
 * went was the labelled rows and the numbered list: «ФОРМАТ / Онлайн, по видеосвязи» is a fact,
 * so it is a pill; «КАК ЭТО РАБОТАЕТ / 01 Оплата картой / 02 Выбор времени / 03 Ссылка придёт на
 * почту» was a description of the three buttons that are already on the screen, in three times the
 * words. The price left the crosshair plate and became the figure itself — the plate was a frame
 * around a number that needs no frame at this size.
 */
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import { l } from '@/i18n/index';
import { isDemo } from '@/lib/api/mode';
import { withBase } from '@/lib/util/paths';
import { openExternal } from '@/lib/telegram/webapp';
import { paymentTarget, withEmail } from '@/lib/util/payment';
import { TopBar } from '@/app/components/TopBar';
import { LinkButton } from '@/app/features/courses/LinkButton';
import { splitName } from '@/app/features/profile/model';
import { useT } from '@/app/hooks/useT';
import { useSession } from '@/app/store/session';
import { BOOKING, type BookingOption } from '@content/site/booking';
import { BRAND } from '@content/site/brand';
import { COACH } from '@content/site/coach';
import { LINKS } from '@content/site/links';
import { formatPrice } from '@content/site/pricing';

/** Where "message the coach" goes when there is no payment page yet: Telegram if set, else mail. */
function contactHref(subject: string): string {
  const telegram = LINKS.supportTelegram || BRAND.telegram;
  if (telegram) return telegram;
  return `mailto:${LINKS.supportEmail || BRAND.contactEmail}?subject=${encodeURIComponent(subject)}`;
}

export default function BookScreen() {
  const { t, locale } = useT();
  const toast = useToast();
  const profile = useSession((s) => s.profile);
  const user = useSession((s) => s.user);
  const [redirecting, setRedirecting] = useState(false);

  const email = profile?.email || user?.email || '';
  const name = l(COACH.name, locale);
  const { heavy, thin } = splitName(name);
  const schedule = paymentTarget(BOOKING.scheduleUrl);

  const pay = (payment: ReturnType<typeof paymentTarget>) => {
    if (!payment) return;
    // A demo account never reaches a real payment page.
    if (isDemo()) {
      toast.show({ kind: 'info', title: t('app.bookDemoNote') });
      return;
    }
    const target = withEmail(payment, email);
    // Inside Telegram the payment page opens in the person's own browser, not in the Mini App.
    if (openExternal(target)) return;
    setRedirecting(true);
    window.location.assign(target);
  };

  return (
    <Screen header={<TopBar back title={t('app.bookTitle')} />}>
      <div className="flex flex-col gap-8 pt-5">
        {/*
          The coach, as a photograph and one display line — first name at 800, surname at 200 —
          under his role as the kicker. The portrait is the largest the source allows (it is
          240x240 in `content/site/coach.ts`): a person is what is being bought here, and at 72px
          he was a thumbnail beside his own name. Then the one line about what the session is, and
          the one fact both lengths share as a pill.
        */}
        <section className="flex flex-col gap-5">
          <div className="flex items-end gap-5">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="eyebrow">{l(COACH.role, locale)}</span>
              <h2 className="display text-[clamp(30px,9vw,44px)] leading-[1.02] text-balance">
                {heavy}
                {thin ? (
                  <>
                    {' '}
                    <span className="t-thin">{thin}</span>
                  </>
                ) : null}
              </h2>
            </div>
            {COACH.photo ? (
              <img
                src={withBase(COACH.photo)}
                alt={name}
                width={120}
                height={120}
                className="photo-mono size-30 shrink-0 rounded-pill object-cover"
              />
            ) : (
              <Avatar seed={name} name={name} size={120} />
            )}
          </div>
          <p className="max-w-[40ch] text-[15px] leading-relaxed text-muted">{t('app.bookLead')}</p>
          <Pill className="self-start">{l(BOOKING.format, locale)}</Pill>
        </section>

        {/*
         * The two lengths as two blocks, cheapest first. Each carries its own price, its own list
         * of what fits in it, and its own button — a shared button with a length picker above it
         * would make the person choose twice and read the price of the thing they did not pick.
         */}
        <section className="flex flex-col gap-9">
          {BOOKING.options.map((option) => (
            <Option
              key={option.id}
              option={option}
              redirecting={redirecting}
              onPay={pay}
              contactHref={contactHref(l(option.name, locale))}
            />
          ))}
        </section>

        <div className="flex flex-col gap-3 border-t border-border pt-5">
          {schedule ? (
            <LinkButton href={schedule.href} variant="secondary" size="lg" fullWidth external>
              {t('app.bookPickTime')}
            </LinkButton>
          ) : null}
          <p className="text-xs text-muted-2">{l(BOOKING.reschedule, locale)}</p>
        </div>
      </div>
    </Screen>
  );
}

/**
 * One length, as a block: its name and duration, its price as the figure, what fits in it, and the
 * one action.
 *
 * The price is set at display size because it is what the person came to find out, and the two are
 * set identically — the person is comparing, and a price that is set differently from the other is
 * a price being argued for rather than stated. The duration became a pill: it is a fact about the
 * session and not a control, which is the whole of that distinction (`components/ui/Pill.tsx`).
 *
 * What fits in the length stays a list rather than becoming pills. These are the promises the
 * money buys — «Корректировка программы под цель, оборудование и ограничения» is fifty characters
 * and a pill would ellipsise it, which on a paid screen means hiding what is being sold.
 */
function Option({
  option,
  redirecting,
  onPay,
  contactHref,
}: {
  option: BookingOption;
  redirecting: boolean;
  onPay: (payment: ReturnType<typeof paymentTarget>) => void;
  contactHref: string;
}) {
  const { t, locale } = useT();
  const price = formatPrice(locale, option.price);
  const payment = paymentTarget(option.paymentUrl[locale] ?? option.paymentUrl.ru);

  return (
    <article className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <h4 className="font-display min-w-0 truncate text-lg leading-[1.24]">
          {l(option.name, locale)}
        </h4>
        <Pill>{t('app.bookDuration', { n: option.durationMin })}</Pill>
      </div>

      <p className="display tabular text-[clamp(34px,11vw,48px)] leading-none">{price}</p>

      <ul className="flex flex-col border-t border-border">
        {option.includes.map((item) => (
          <li
            key={item.en}
            className="flex items-start gap-3 border-t border-border py-2.5 text-[15px] first:border-t-0 first:pt-3"
          >
            <Glyph size={14} className="mt-1 text-muted">
              ✓
            </Glyph>
            <span>{l(item, locale)}</span>
          </li>
        ))}
      </ul>

      {payment ? (
        <Button size="lg" fullWidth loading={redirecting} onClick={() => onPay(payment)}>
          {t('app.bookPay', { price })}
        </Button>
      ) : (
        <>
          <LinkButton href={contactHref} size="lg" fullWidth external>
            {t('app.bookContact')}
          </LinkButton>
          <p className="text-sm text-muted">{t('app.bookContactHint')}</p>
        </>
      )}
    </article>
  );
}
