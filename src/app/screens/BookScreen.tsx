/**
 * Book a one-to-one session with the coach (docs/SPEC.md §9, `/book`): who he is, what the hour
 * is, the price, and one action. With a payment link configured the button hands the signed-in
 * email to the payment page (the landing order form's rule: https only, email appended); without
 * one it opens a message to the coach — a session is agreed with a person, not lost in a form.
 */
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import { l } from '@/i18n/index';
import { isDemo } from '@/lib/api/mode';
import { withBase } from '@/lib/util/paths';
import { openExternal } from '@/lib/telegram/webapp';
import { paymentTarget, withEmail } from '@/lib/util/payment';
import { TopBar } from '@/app/components/TopBar';
import { LinkButton } from '@/app/features/courses/LinkButton';
import { useT } from '@/app/hooks/useT';
import { useSession } from '@/app/store/session';
import { BOOKING } from '@content/site/booking';
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
  const price = formatPrice(locale, BOOKING.price);
  const name = l(COACH.name, locale);
  const payment = paymentTarget(BOOKING.paymentUrl[locale] ?? BOOKING.paymentUrl.ru);
  const schedule = paymentTarget(BOOKING.scheduleUrl);
  const steps = [
    t('app.bookStep1'),
    t('app.bookStep2'),
    t('app.bookStep3', { email: email || t('app.bookStep3Fallback') }),
  ];

  const pay = () => {
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
      <div className="flex flex-col gap-5 py-2">
        <section className="flex items-start gap-4 pb-1">
          {COACH.photo ? (
            <img
              src={withBase(COACH.photo)}
              alt={name}
              width={64}
              height={64}
              className="photo-mono size-16 shrink-0 rounded-control object-cover"
            />
          ) : (
            <Avatar seed={name} name={name} size={64} />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl leading-tight">{name}</p>
            <p className="mt-1 text-sm text-on-primary/80">{l(COACH.role, locale)}</p>
            <p className="mt-3 text-[15px] leading-snug">{t('app.bookLead')}</p>
          </div>
        </section>

        <div className="border-t border-border">
          <dl className="divide-y divide-border">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <dt className="text-sm text-muted">{t('app.bookFormatLabel')}</dt>
              <dd className="text-right text-[15px] font-medium">{l(BOOKING.format, locale)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <dt className="text-sm text-muted">{t('app.bookDurationLabel')}</dt>
              <dd className="tabular text-right text-[15px] font-medium">
                {t('app.bookDuration', { n: BOOKING.durationMin })}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <dt className="text-sm text-muted">{t('app.bookPriceLabel')}</dt>
              <dd className="tabular text-right text-lg font-semibold">{price}</dd>
            </div>
          </dl>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="eyebrow px-1">{t('app.bookIncludes')}</h2>
          <div className="border-t border-border pt-4">
            <ul className="flex flex-col gap-2.5">
              {BOOKING.includes.map((item) => (
                <li key={item.en} className="flex items-start gap-3 text-[15px]">
                  <Icon name="check" size={18} className="mt-0.5 shrink-0 text-accent" />
                  <span>{l(item, locale)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="eyebrow px-1">{t('app.bookHow')}</h2>
          <div className="border-t border-border pt-4">
            <ol className="flex flex-col gap-3">
              {steps.map((step, i) => (
                <li key={step} className="flex items-start gap-3 text-[15px]">
                  <span className="numeral tabular w-6 shrink-0 text-sm text-accent">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <div className="flex flex-col gap-3">
          {payment ? (
            <Button size="lg" fullWidth loading={redirecting} onClick={pay}>
              {t('app.bookPay', { price })}
            </Button>
          ) : (
            <>
              <LinkButton href={contactHref(t('app.bookTitle'))} size="lg" fullWidth external>
                {t('app.bookContact')}
              </LinkButton>
              <p className="px-1 text-center text-sm text-muted">{t('app.bookContactHint')}</p>
            </>
          )}
          {schedule ? (
            <LinkButton href={schedule.href} variant="secondary" size="lg" fullWidth external>
              {t('app.bookPickTime')}
            </LinkButton>
          ) : null}
          <p className="px-1 text-center text-xs text-muted-2">{l(BOOKING.reschedule, locale)}</p>
        </div>
      </div>
    </Screen>
  );
}
