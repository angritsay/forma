/**
 * «Тренер» — the third tab (docs/SPEC.md §9): who he is, what an hour with *him* gives, the two
 * lengths as a switch, and one action that ends in a time rather than in a paid button.
 *
 * It used to be a page reached from a card on Home, and it was written like one: a title bar with
 * a way back, the two lengths, a price. As a tab it has to hold its own seat, so the owner's brief
 * for it is three things — «Нужно написать его регалии и что тренировки именно с ним дадут.
 * Переключатель выбора длительности и нужно обязательно посветить что тренировка за 60 минут даст
 * по сравнению с 30.» This screen is those three, in that order, under the one line that makes the
 * offer what it is: he is not a coach the product hired, he is the founder of it.
 *
 * Nothing about him is written here. The regalia are `COACH.credentials`, six checkable facts off
 * his profi.ru profile; the two that are numbers are lifted into figures by `COACH.figures` and
 * dropped from the list, so the same fact is never on screen twice. What the session gives is
 * `BOOKING.outcomes`, each line a restatement of a promise the offer already makes. If a fact is
 * wanted that is not in `content/site/*`, it gets asked for — it does not get written.
 *
 * The hour's case for itself is the delta and only the delta. `HOUR.includes` contains the half's
 * two promises plus its own two, and printing all four again under «60» would make the reader do
 * the diffing; on 60 the screen says «всё из 30 минут» once and then the two lines that are new,
 * with the price difference beside them.
 *
 * Booking «хоть за 15 минут» is honest about which half of it exists. Paying is a real link;
 * choosing the time is `BOOKING.scheduleUrl`, which is still empty, so the step after payment says
 * outright that the coach sets the time in a message. The day that URL is filled the same block
 * becomes the slot page and nothing else on the screen moves.
 */
import { clsx } from 'clsx';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useToast } from '@/components/ui/Toast';
import { l } from '@/i18n/index';
import { isDemo } from '@/lib/api/mode';
import { withBase } from '@/lib/util/paths';
import { openExternal } from '@/lib/telegram/webapp';
import { paymentTarget, withEmail } from '@/lib/util/payment';
import { LinkButton } from '@/app/features/courses/LinkButton';
import { splitName } from '@/app/features/profile/model';
import { useT } from '@/app/hooks/useT';
import { useSession } from '@/app/store/session';
import { BOOKING, type BookingOption } from '@content/site/booking';
import { BRAND } from '@content/site/brand';
import { COACH } from '@content/site/coach';
import { LINKS } from '@content/site/links';
import { formatPrice, type CoursePrice } from '@content/site/pricing';

/** Where "message the coach" goes: Telegram if set, else mail. */
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
  /*
   * Whether the payment page has been opened from here. It is not proof of a payment — nothing on
   * a static front end can be — and it is not meant to be: it is what turns the step after the
   * money from a line of small print into the thing the screen is now asking for.
   */
  const [sent, setSent] = useState(false);

  /*
   * Which length is showing. The first option leads because `content/site/booking.ts` orders them
   * cheapest first, and the cheaper one is the lower step in: somebody who wants the hour will
   * still find it, somebody unsure of the whole idea is looking for the half.
   */
  const [pick, setPick] = useState<BookingOption['id']>(BOOKING.options[0]?.id ?? 'half');
  const index = BOOKING.options.findIndex((o) => o.id === pick);
  const option = BOOKING.options[index] ?? BOOKING.options[0];
  /* The length this one is being compared against: the step below it on the switch. */
  const previous = index > 0 ? BOOKING.options[index - 1] : undefined;

  const email = profile?.email || user?.email || '';
  const name = l(COACH.name, locale);
  const { heavy, thin } = splitName(name);
  const schedule = paymentTarget(BOOKING.scheduleUrl);
  const lead = BOOKING.leadTimeMin;
  const payment = option ? paymentTarget(option.paymentUrl[locale] ?? option.paymentUrl.ru) : null;
  const contact = contactHref(option ? l(option.name, locale) : name);

  /* The credentials that are not already standing above as a figure. */
  const rest = COACH.credentials.filter((c) => !COACH.figures.some((f) => f.of === c));

  const pay = () => {
    if (!payment) return;
    // A demo account never reaches a real payment page — but it does reach the step after it,
    // which is the half of this screen worth looking at.
    if (isDemo()) {
      toast.show({ kind: 'info', title: t('app.bookDemoNote') });
      setSent(true);
      return;
    }
    const target = withEmail(payment, email);
    setSent(true);
    // Inside Telegram the payment page opens in the person's own browser, not in the Mini App.
    if (openExternal(target)) return;
    setRedirecting(true);
    window.location.assign(target);
  };

  return (
    <Screen contentClassName="pt-4">
      <div className="flex flex-col gap-9">
        {/*
          The coach, as a photograph and one display line — first name at 800, surname at 200.
          Above it, in sentence case rather than as a kicker, the line the whole offer rests on:
          he is the founder as well as the coach, and «Основатель и тренер Forma» in capitals at
          kicker tracking is both too long for the slot and too loud for a fact this plain.
        */}
        <section className="flex flex-col gap-5">
          <div className="flex items-end gap-5">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="eyebrow-sentence">{l(COACH.formaRole, locale)}</span>
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
          <div className="flex flex-wrap gap-2">
            <Pill>{l(BOOKING.format, locale)}</Pill>
            <Pill>{t('app.bookLeadTimePill', { n: lead })}</Pill>
          </div>
        </section>

        {/*
         * The regalia. Two of them are numbers and are set as numbers, side by side with a
         * hairline between; the other four are sentences and stay sentences — «Волгоградский
         * государственный социально-педагогический университет…» is a fact you read once, not a
         * figure you glance at, and no amount of typography makes it one.
         */}
        <section className="flex flex-col gap-4">
          <span className="eyebrow">{t('app.bookCredentials')}</span>
          {COACH.figures.length > 0 ? (
            <div className="grid grid-cols-2 divide-x divide-border border-y border-border">
              {COACH.figures.map((f, i) => (
                <div
                  key={f.value}
                  className={clsx('flex min-w-0 flex-col gap-2 py-4', i === 0 ? 'pr-4' : 'pl-4')}
                >
                  <span className="numeral tabular text-[clamp(26px,8vw,34px)] leading-none">
                    {f.value}
                  </span>
                  <span className="eyebrow">{l(f.label, locale)}</span>
                </div>
              ))}
            </div>
          ) : null}
          <ul className="flex flex-col">
            {rest.map((c) => (
              <li
                key={c.en}
                className="border-t border-border py-2.5 text-[14px] leading-snug first:border-t-0 first:pt-0 text-muted"
              >
                {l(c, locale)}
              </li>
            ))}
          </ul>
        </section>

        {/*
         * What an hour with him gives, as three lines. They are numbered rather than ticked: a tick
         * is a thing included in a price, and these are not line items — they are what the money is
         * actually for, and the money is below.
         */}
        <section className="flex flex-col gap-4">
          <span className="eyebrow">{t('app.bookOutcomes')}</span>
          <ul className="flex flex-col">
            {BOOKING.outcomes.map((o, i) => (
              <li key={o.en} className="flex items-start gap-4 border-t border-border py-3.5">
                <span className="numeral w-6 shrink-0 text-[15px] text-muted-2">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[15px] leading-snug">{l(o, locale)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/*
         * The lengths as a switch over one block, not as two blocks stacked.
         *
         * They used to stand one under the other, each with its own price, its own list and its own
         * button, on the argument that a picker makes the person choose twice. The owner's verdict
         * overrules it: «нужно сделать не разные карточки а переключение по продолжительности
         * сессии. Чтобы проще и компактнее было». She is right about the shape — the two blocks are
         * the same four things twice, and on a 390px phone the second one starts below the fold, so
         * «two prices side by side» was never what the screen actually showed.
         *
         * The segment is the duration, because that is what is being chosen. The price follows it
         * and is not on the switch: a switch whose cells carry prices is asking to be read as the
         * cheaper and the dearer rather than as the shorter and the longer.
         */}
        <section className="flex flex-col gap-6">
          {BOOKING.options.length > 1 ? (
            <SegmentedControl
              fullWidth
              label={t('app.bookLengthLabel')}
              value={pick}
              onChange={(next) => {
                setPick(next);
                setSent(false);
              }}
              options={BOOKING.options.map((o) => ({
                value: o.id,
                label: t('app.bookDuration', { n: o.durationMin }),
              }))}
            />
          ) : null}
          {option ? (
            <Option
              option={option}
              previous={previous}
              payment={payment}
              redirecting={redirecting}
              onPay={pay}
              contactHref={contact}
            />
          ) : null}
        </section>

        {/*
         * The step after the money, which is the one the offer was missing.
         *
         * «Оплатил → выбрал время» only has a second half when `BOOKING.scheduleUrl` is set. Until
         * it is, this block says what actually happens — the coach sets the time in a message —
         * rather than leaving a paid button as the last thing on the screen. Either way it is one
         * sentence and one button, and it sharpens once payment has been opened from here.
         */}
        <section
          className={
            sent
              ? 'flex flex-col gap-3 rounded-card border border-border-strong p-5'
              : 'flex flex-col gap-3 border-t border-border pt-5'
          }
        >
          <span className="eyebrow">{t('app.bookNext')}</span>
          {/* Not in demo: there the toast has just said there was no payment page to open. */}
          {sent && !isDemo() ? (
            <p className="text-[15px] leading-snug">{t('app.bookPaidNote')}</p>
          ) : null}
          <p className="text-sm leading-snug text-muted">
            {schedule
              ? t('app.bookNextSchedule', { n: lead })
              : t('app.bookNextContact', { n: lead })}
          </p>
          {schedule ? (
            <LinkButton
              href={schedule.href}
              variant={sent ? 'primary' : 'secondary'}
              size="lg"
              fullWidth
              external
            >
              {t('app.bookPickTime')}
            </LinkButton>
          ) : payment ? (
            <LinkButton
              href={contact}
              variant={sent ? 'primary' : 'secondary'}
              size="lg"
              fullWidth
              external
            >
              {t('app.bookContact')}
            </LinkButton>
          ) : null}
          <p className="text-xs text-muted-2">{l(BOOKING.reschedule, locale)}</p>
        </section>
      </div>
    </Screen>
  );
}

/**
 * One length, as a block: its price as the figure, what the money buys, and the one action.
 *
 * On the cheapest length that is simply its list. On any longer one it is the difference and only
 * the difference — one muted line saying everything below is included, then what this length adds,
 * with what it costs extra set beside the price. That is the owner's «обязательно посветить что
 * тренировка за 60 минут даст по сравнению с 30»: the comparison is the argument, and a second
 * list of four that happens to contain the first two makes the reader find it themselves.
 */
function Option({
  option,
  previous,
  payment,
  redirecting,
  onPay,
  contactHref,
}: {
  option: BookingOption;
  previous: BookingOption | undefined;
  payment: URL | null;
  redirecting: boolean;
  onPay: () => void;
  contactHref: string;
}) {
  const { t, locale } = useT();
  const price = formatPrice(locale, option.price);
  const adds = option.adds ?? [];
  const delta = previous && adds.length > 0 ? previous : undefined;
  const extra: CoursePrice | undefined = delta
    ? { rub: option.price.rub - delta.price.rub, usd: option.price.usd - delta.price.usd }
    : undefined;
  const shown = delta ? adds : option.includes;

  return (
    <article className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className="display tabular text-[clamp(34px,11vw,48px)] leading-none">{price}</p>
        {delta && extra ? (
          <p className="text-sm text-muted">
            {t('app.bookPriceDelta', {
              price: formatPrice(locale, extra),
              n: delta.durationMin,
            })}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        {/*
         * The shorter length is settled first and in one muted line, and only then does the
         * kicker say that what follows is extra. The other order — «СВЕРХ 30 МИНУТ» and then
         * «Всё из 30 минут» under it — reads as a contradiction for as long as it takes to work
         * out that the second line is not part of the first.
         */}
        {delta ? (
          <p className="flex items-center gap-3 text-[13px] text-muted-2">
            <Glyph size={12}>✓</Glyph>
            {t('app.bookIncludesPrev', { n: delta.durationMin })}
          </p>
        ) : null}
        <span className="eyebrow">
          {delta ? t('app.bookAdds', { n: delta.durationMin }) : t('app.bookIncludes')}
        </span>
        <ul className="flex flex-col border-t border-border">
          {shown.map((item) => (
            <li
              key={item.en}
              className="flex items-start gap-3 border-t border-border py-2.5 text-[15px] leading-snug first:border-t-0 first:pt-3"
            >
              <Glyph size={14} className="mt-1 text-muted">
                {delta ? '+' : '✓'}
              </Glyph>
              <span>{l(item, locale)}</span>
            </li>
          ))}
        </ul>
      </div>

      {payment ? (
        <Button size="lg" fullWidth loading={redirecting} onClick={onPay}>
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
