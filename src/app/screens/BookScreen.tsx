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
 * Nothing about him is written here. What he has behind him is `COACH.credentials`, checkable
 * facts off his profi.ru profile; the two that are numbers are lifted into figures by
 * `COACH.figures` and dropped from the list, so the same fact is never on screen twice. What the
 * session gives is `BOOKING.outcomes`, each one a restatement of a promise the offer already
 * makes. If a fact is wanted that is not in `content/site/*`, it gets asked for — it does not get
 * written.
 *
 * Neither of those two blocks has a kicker over it any more («РЕГАЛИИ», «ЧТО ЭТО ДАЁТ»), and the
 * two sections below say why. The tab also has a colour of its own now — `COACH_TILE`, on the two
 * pills and nowhere else.
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
 *
 * Above all of it, when there is one, stands the session the person has already booked — «вот
 * ссылка на вход, через столько то начнется, дата, время». It comes first because for the one
 * person in a hundred who has it, it is the only thing on this tab that is not an advertisement:
 * the 30/60 switch is asking them to buy something they have already bought. Everything below is
 * unchanged, because they may well want another one.
 */
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Glyph } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useToast } from '@/components/ui/Toast';
import { l, plural, type Locale } from '@/i18n/index';
import { getMyUpcomingBooking } from '@/lib/api/coachBookings';
import type { CoachBooking } from '@/lib/api/types';
import { describeCountdown, deviceTimeZone, type Countdown } from '@/lib/coach/booking';
import { isDemo } from '@/lib/api/mode';
import { COACH_TILE, courseTileVars } from '@/lib/ui/tile';
import { withBase } from '@/lib/util/paths';
import { openExternal } from '@/lib/telegram/webapp';
import { paymentTarget, withEmail } from '@/lib/util/payment';
import { LinkButton } from '@/app/features/courses/LinkButton';
import { splitName } from '@/app/features/profile/model';
import { useT, type Translator } from '@/app/hooks/useT';
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
   * The session already booked, and the clock the card reads from.
   *
   * `null` is the answer for almost everybody and is not an error state: nothing is booked, the
   * card is not drawn, and the screen is what it always was. A failed request lands in the same
   * place on purpose — a network blip must not put an error where a person's session would be,
   * and it must certainly not stop the offer below from rendering.
   *
   * `now` ticks only while a booking exists. Half a minute is the coarsest interval that still
   * turns «через 1 минуту» over before it becomes a lie, and the card is the only thing on the
   * screen that goes stale by sitting still.
   */
  const [booking, setBooking] = useState<CoachBooking | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    getMyUpcomingBooking()
      .then((b) => {
        if (alive) setBooking(b);
      })
      .catch(() => {
        /* Nothing booked and could-not-ask look the same here, deliberately. */
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!booking) return;
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [booking]);

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
    /*
     * `--course-tile` around the whole tab, the way the club's screen carries its orange: the tab
     * has no programme to take a colour from, so `COACH_TILE` is where its blue lives. Exactly two
     * things read it — the pills below — which is the owner's «пилюли сделай цветными» and the end
     * of it. Colour here names the tab; it does not fill anything.
     */
    <div style={courseTileVars(COACH_TILE)}>
      <Screen contentClassName="pt-4">
        <div className="flex flex-col gap-9">
          {booking ? <UpcomingSession booking={booking} now={now} /> : null}

          {/*
          The coach, as a photograph and one display line — first name at 800, surname at 200.
          Above it, in sentence case rather than as a kicker, the line the whole offer rests on:
          he is the founder as well as the coach, and «Основатель и тренер Forma» in capitals at
          kicker tracking is both too long for the slot and too loud for a fact this plain.
        */}
          <section className="flex flex-col gap-5">
            <div className="flex items-end gap-5">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="eyebrow">{l(COACH.formaRole, locale)}</span>
                {/* 1.02 → 1.2. The lockup is two lines — «Сергей» over «Титов» — and 1.02 was drawn for
                  capitals, which have no descenders; «р» drops 0.182em below the baseline and the
                  «Т» under it rises to cap height. global.css carries the measurement. */}
                <h2 className="display text-[clamp(30px,9vw,44px)] leading-[1.2] text-balance">
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
            {/* The tab's colour, and the only two things on the screen wearing it. */}
            <div className="flex flex-wrap gap-2">
              <Pill tone="course">{l(BOOKING.format, locale)}</Pill>
              <Pill tone="course">{t('app.bookLeadTimePill', { n: lead })}</Pill>
            </div>
          </section>

          {/*
           * What he has behind him. Two of the facts are numbers and are set as numbers, side by
           * side with a hairline between; the rest are sentences and stay sentences —
           * «Волгоградский государственный социально-педагогический университет…» is a fact you
           * read once, not a figure you glance at, and no amount of typography makes it one.
           *
           * **No kicker over it.** «РЕГАЛИИ» stood here and the owner took it out, and the reason it
           * was removable is that it was never carrying anything: «10 000+ персональных часов» over
           * a degree announces itself, and a label in capitals telling the reader what kind of
           * information is coming next is a table of contents for three lines. The same went for
           * «ЧТО ЭТО ДАЁТ» below.
           */}
          <section className="flex flex-col gap-4">
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
           * What an hour with him gives, as three jobs rather than three features.
           *
           * Each one is a short line you could say out loud and a couple of sentences that make it
           * concrete — the owner's «реальные jtbd написать понятным языком». The copy is in
           * `content/site/booking.ts`; what changed here is that an outcome is now two pieces of
           * text instead of one clause, so it needs a heading line and a paragraph rather than a
           * single row.
           *
           * They are still numbered rather than ticked, and the numbers still mean something: a tick
           * is a line item in a price, and these are not line items. Read down, they are also the
           * shape of the session — he looks, he sets the load, you leave with the next weeks — so
           * 01 · 02 · 03 is an order and not a decoration.
           */}
          <section>
            <ul className="flex flex-col">
              {BOOKING.outcomes.map((o, i) => (
                <li
                  key={o.title.en}
                  className="flex items-start gap-4 border-t border-border py-5 first:border-t-0 first:pt-0"
                >
                  <span className="numeral tabular w-6 shrink-0 pt-0.5 text-[15px] text-muted-2">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <p className="font-display text-[17px] leading-snug">{l(o.title, locale)}</p>
                    <p className="text-[14px] leading-relaxed text-muted">{l(o.body, locale)}</p>
                  </div>
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
    </div>
  );
}

/*
 * --- the session already booked ---------------------------------------------------------------
 *
 * Three rules this card is written around, and all three are about what is *missing* rather than
 * about what is shown.
 *
 * 1. The times are stored in UTC and shown in the **device's** zone. `booking.timezone` is the zone
 *    the person booked *in* — Calendly records it — and it is only the fallback for a browser that
 *    will not name its own. Somebody who booked from a laptop abroad and opens the Mini App at home
 *    wants their kitchen clock, not the one in the hotel.
 * 2. **The join link is often absent.** A Google Calendar booking carries no cancel or reschedule
 *    URL at all (supabase/functions/google-calendar-sync/sync.ts never sets one), and a session with
 *    a physical location carries an address instead of a link. Every control here is drawn from the
 *    field that would make it work, so a missing field removes the control rather than disabling it.
 * 3. **Nothing is booked, for almost everybody**, and that is not an empty state to design — the
 *    card simply is not rendered. `BookScreen` holds that: `booking === null` draws nothing.
 */

/** `Intl` throws on a zone name it does not know; the device's own zone is the fallback. */
function formatIn(
  locale: Locale,
  ms: number,
  options: Intl.DateTimeFormatOptions,
  timeZone: string | undefined,
): string {
  const tag = locale === 'ru' ? 'ru-RU' : 'en-GB';
  try {
    return new Intl.DateTimeFormat(tag, { ...options, timeZone }).format(ms);
  } catch {
    return new Intl.DateTimeFormat(tag, options).format(ms);
  }
}

/* h23 so a Russian clock reads «9:00» and never «9:00 AM»; `numeric` so it is not «09:00». */
const CLOCK: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hourCycle: 'h23' };

/**
 * The countdown, said out loud.
 *
 * `describeCountdown` returns `{ kind: 'tomorrow', hour: 9, minute: 0 }` and refuses to build the
 * sentence itself, which is what lets the Russian be Russian: three plural forms for минуты, часы
 * and дни, and a «завтра в 9:00» that is a calendar fact rather than an arithmetic one.
 */
function countdownLine(countdown: Countdown, { t, locale }: Translator): string {
  switch (countdown.kind) {
    case 'live':
      return t('app.bookLive');
    case 'minutes':
      return plural(locale, countdown.minutes, {
        one: t('app.bookInMinutesOne', { n: countdown.minutes }),
        few: t('app.bookInMinutesFew', { n: countdown.minutes }),
        many: t('app.bookInMinutesMany', { n: countdown.minutes }),
      });
    case 'hours':
      return plural(locale, countdown.hours, {
        one: t('app.bookInHoursOne', { n: countdown.hours }),
        few: t('app.bookInHoursFew', { n: countdown.hours }),
        many: t('app.bookInHoursMany', { n: countdown.hours }),
      });
    case 'tomorrow':
      // Built from the shape rather than from the instant: these two numbers are already the
      // wall-clock reading in the zone the day boundary was decided in.
      return t('app.bookTomorrowAt', {
        time: `${countdown.hour}:${String(countdown.minute).padStart(2, '0')}`,
      });
    case 'later':
      return plural(locale, countdown.days, {
        one: t('app.bookInDaysOne', { n: countdown.days }),
        few: t('app.bookInDaysFew', { n: countdown.days }),
        many: t('app.bookInDaysMany', { n: countdown.days }),
      });
    default:
      return '';
  }
}

/**
 * The booked session, as the owner listed it: «вот ссылка на вход, через столько то начнется,
 * дата, время» — in that order of loudness, the countdown as the figure and the date under it.
 *
 * No glass and no photograph: a hairline card on the flat ground, so the buttons in it are
 * rectangles at `--r-control` and not pills (design/CHANGELOG.md §13).
 */
function UpcomingSession({ booking, now }: { booking: CoachBooking; now: number }) {
  const tr = useT();
  const { t, locale } = tr;
  const zone = deviceTimeZone() ?? booking.timezone ?? undefined;
  const countdown = describeCountdown(booking.startsAt, booking.endsAt, now, zone);

  // The session ended while the tab sat open. The fetch will not run again until the screen is
  // remounted, so the tick is what takes the card away.
  if (countdown.kind === 'past') return null;

  const starts = Date.parse(booking.startsAt);
  const ends = Date.parse(booking.endsAt);
  const when = t('app.bookWhen', {
    date: formatIn(locale, starts, { day: 'numeric', month: 'long' }, zone),
    from: formatIn(locale, starts, CLOCK, zone),
    to: formatIn(locale, ends, CLOCK, zone),
    dur: t('app.bookDuration', { n: booking.durationMinutes }),
  });

  return (
    <section className="flex flex-col gap-4 rounded-card border border-border-strong p-5">
      <div className="flex flex-col gap-2">
        <span className="eyebrow">{t('app.bookUpcoming')}</span>
        {/* 1.2, as the lockup above: «идёт сейчас» and «через 2 часа» both drop a descender. */}
        <p className="display text-[clamp(26px,7.5vw,34px)] leading-[1.2] text-balance">
          {countdownLine(countdown, tr)}
        </p>
        <p className="tabular text-[13px] leading-snug text-muted">{when}</p>
      </div>

      {booking.joinUrl ? (
        <LinkButton href={booking.joinUrl} size="lg" fullWidth external>
          {t('app.bookJoin')}
        </LinkButton>
      ) : booking.locationText ? (
        <p className="text-[15px] leading-snug">
          {t('app.bookPlace', { place: booking.locationText })}
        </p>
      ) : (
        <p className="text-[13px] leading-snug text-muted-2">{t('app.bookNoLink')}</p>
      )}

      {/* Both of these are Calendly's; a Google Calendar booking has neither, and then there is no
          row at all. `-ml-4.5` pulls the first ghost label back onto the card's own left edge. */}
      {booking.rescheduleUrl || booking.cancelUrl ? (
        <div className="-mb-2 -ml-4.5 flex flex-wrap items-center">
          {booking.rescheduleUrl ? (
            <LinkButton href={booking.rescheduleUrl} variant="ghost" size="sm" external>
              {t('app.bookMove')}
            </LinkButton>
          ) : null}
          {booking.cancelUrl ? (
            <LinkButton href={booking.cancelUrl} variant="ghost" size="sm" external>
              {t('app.bookCancel')}
            </LinkButton>
          ) : null}
        </div>
      ) : null}
    </section>
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
