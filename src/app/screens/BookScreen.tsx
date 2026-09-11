/**
 * Book a one-to-one session with the coach (docs/SPEC.md §9, `/book`): who he is, what the hour
 * is, the price, and one action. With a payment link configured the button hands the signed-in
 * email to the payment page (the landing order form's rule: https only, email appended); without
 * one it opens a message to the coach — a session is agreed with a person, not lost in a form.
 */
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
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
  const { heavy, thin } = splitName(name);
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
      <div className="flex flex-col gap-6 pt-5">
        {/*
          The coach as the screen's one display line — first name at 800, surname at 200 — under
          his role as the kicker, with the monochrome portrait beside it. The lead reads on after.
        */}
        <section className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="eyebrow">{l(COACH.role, locale)}</span>
              <h2 className="display text-5xl text-balance">
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
                width={72}
                height={72}
                className="photo-mono size-18 shrink-0 object-cover"
              />
            ) : (
              <Avatar seed={name} name={name} size={72} />
            )}
          </div>
          <p className="max-w-[40ch] text-[15px] leading-relaxed text-muted">{t('app.bookLead')}</p>
        </section>

        {/* The facts, ruled: format and duration as hairline rows, the price on the crosshair plate. */}
        <dl className="flex flex-col">
          <div className="flex items-center justify-between gap-3 border-t border-border py-3">
            <dt className="eyebrow">{t('app.bookFormatLabel')}</dt>
            <dd className="text-right text-[15px] font-medium">{l(BOOKING.format, locale)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-y border-border py-3">
            <dt className="eyebrow">{t('app.bookDurationLabel')}</dt>
            <dd className="numeral tabular text-right text-[15px]">
              {t('app.bookDuration', { n: BOOKING.durationMin })}
            </dd>
          </div>
          {/*
            One key fact per screen gets the plate: the price. No course is in scope here, so the
            ticks fall back to white — the plate says "this is the number" without a colour.
          */}
          <div className="plate-target mt-4 flex items-baseline justify-between gap-3 px-4 py-4">
            <span className="plate-ticks" aria-hidden="true" />
            <dt className="eyebrow">{t('app.bookPriceLabel')}</dt>
            <dd className="display tabular text-right text-4xl">{price}</dd>
          </div>
        </dl>

        <section className="flex flex-col gap-3">
          <h3 className="eyebrow">{t('app.bookIncludes')}</h3>
          <ul className="flex flex-col border-t border-border">
            {BOOKING.includes.map((item) => (
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
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="eyebrow">{t('app.bookHow')}</h3>
          <ol className="flex flex-col gap-3 border-t border-border pt-4">
            {steps.map((step, i) => (
              <li key={step} className="flex items-start gap-3 text-[15px]">
                <span className="numeral tabular w-7 shrink-0 pt-0.5 text-sm text-muted-2">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
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
              <p className="text-sm text-muted">{t('app.bookContactHint')}</p>
            </>
          )}
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
