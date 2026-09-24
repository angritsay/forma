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
 * two sections below say why.
 *
 * ## The colour, and where it goes now
 *
 * The tab has a colour of its own — `COACH_TILE`, the blue in `src/lib/ui/tile.ts`. It used to
 * paint the two pills at the top and nothing else, on the argument that colour here *names* the
 * tab rather than fills anything. The owner's brief moved it: «сделай её более визуальной и
 * привлекательной + добавь цвета в элементы связанные с покупкой».
 *
 * So the blue now runs down the screen on exactly the things that lead to paying, and on nothing
 * else: the two pills, the 01 · 02 · 03 of what the session gives, then the offer itself — the
 * card's edge and its faint tint, the price, the ticks in «Что входит», and the button. Everything
 * factual stays monochrome. That is the whole rule, and it is what keeps the colour meaning
 * something: his degree and his 10 000 hours are not for sale, so they are not blue.
 *
 * The club's screen already worked this way — an orange lockup, an orange «Вступить за 666 ₽ / мес»
 * — so this is the two selling tabs speaking one language rather than a new idea. `Button` grew a
 * `course` variant for it, which is the club's hand-built bar turned into a part of the kit.
 *
 * **The third palette re-cast it** (global.css header, style A). The coach himself is the screen's
 * blue hero field — role as a white sticker, surname as the light-blue key word, the session facts
 * as white outlined pills. Bleu ciel (`COACH_TILE`) is the tab's *tag*: the length as a ciel pill on
 * the offer, the card's tint and edge, the big price, and the numerals and ticks as the light-blue
 * accent. The pay button is the neon, the screen's one action.
 *
 * On the graphite ground (design/CHANGELOG.md §16) ciel reads as small type — 4.71, where it was
 * 4.37 on charcoal and large-type only — so `tileAccent(COACH_TILE)` is ciel itself now and
 * `text-course-accent` under this screen's `courseTileVars` resolves to it. The big price never
 * depended on that (see `Option`); the numerals keep the light blue by naming `text-accent`
 * directly, because that is what they mean, not because ciel would fail.
 *
 * ## And the photograph
 *
 * 4:5, monochrome, with grain over it — the frame `CoachCard.astro` gives him on the website, and
 * the treatment every photograph in this product gets. It replaces a 120px circle, which was the
 * one piece of imagery on the tab and was reading as an avatar in a settings row. The source is
 * only 240×240 (`content/site/coach.ts` says so and asks for a larger one), so it is held at 128px
 * wide: the crop is taken from the middle and the grain covers what the upscale costs.
 *
 * Each length says what it is and what is in it, and nothing about the other one. It used to be
 * built as a comparison — «+1 000 ₽ к 30 минутам» beside the price, «Всё из 30 минут», and a kicker
 * «Сверх 30 минут» over the two lines the hour adds — and the owner struck the first two by name.
 * The third could not stand alone, so the whole apparatus went and the hour simply prints its four
 * lines. The switch is what compares them, which is what a switch is for.
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
import { Card } from '@/components/ui/Card';
import { HeroField, KeyWord } from '@/components/ui/HeroField';
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
import { payHref, type PayRoute, payRoute, paymentTarget } from '@/lib/util/payment';
import { LinkButton } from '@/app/features/courses/LinkButton';
import { SupportSheet } from '@/app/features/support/SupportSheet';
import { splitName } from '@/app/features/profile/model';
import { externalLinkProps } from '@/app/hooks/useExternalLink';
import { useT, type Translator } from '@/app/hooks/useT';
import { useSession } from '@/app/store/session';
import { BOOKING, type BookingOption } from '@content/site/booking';
import { COACH } from '@content/site/coach';
import { lavaUrl, sessionKey } from '@content/site/payments';
import { formatPrice } from '@content/site/pricing';

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

  const email = profile?.email || user?.email || '';
  const name = l(COACH.name, locale);
  const { heavy, thin } = splitName(name);
  /*
   * The slot page for the length that is selected, falling back to the shared one.
   *
   * It reads from `option` rather than from `BOOKING` because a Google Calendar appointment
   * schedule carries a single duration: half an hour and an hour are two pages. Reading the shared
   * field alone would have sent somebody who paid for an hour to the half-hour's booking page.
   */
  const schedule = paymentTarget(option?.scheduleUrl || BOOKING.scheduleUrl);
  const lead = BOOKING.leadTimeMin;
  /*
   * Занятие продаётся теми же двумя кассами, что и всё остальное: рубли — в Prodamus, остальное —
   * в lava.top по ключу из `content/site/payments.ts`. Второго адреса здесь не было вовсе, и это
   * был не пробел в тексте, а закрытая дверь: `payRoute` без него отдавал `null`, и человек с
   * нерублёвой картой не мог купить час с тренером никак.
   *
   * Товара на длительность может и не быть — тогда `lavaUrl` отвечает `null`, и кнопка честно
   * уступает место предложению написать тренеру. Заводится это в кабинете, а не здесь, так что
   * появление третьей длительности правки экрана не потребует.
   *
   * `schedule` выше это не касается: там не касса, а страница выбора времени в Google Calendar, и
   * она никому ничего не продаёт.
   */
  const payment = option
    ? payRoute(
        locale,
        option.paymentUrl[locale] ?? option.paymentUrl.ru,
        lavaUrl(sessionKey(option.id)),
      )
    : null;
  /*
   * «Написать тренеру» opens a message sheet (0042) instead of a mailto or a bare Telegram link:
   * the message lands in the owner's «Обращения» topic, which is where she and the coach look.
   * The context is in Russian whatever the app's language — the coach reads the topic in Russian.
   */
  const [writing, setWriting] = useState(false);
  const contactContext = option ? option.name.ru : 'Вкладка «Тренер»';
  const openContact = () => setWriting(true);

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
    const target = payHref(payment, email);
    setSent(true);
    // Inside Telegram the payment page opens in the person's own browser, not in the Mini App.
    if (openExternal(target)) return;
    setRedirecting(true);
    window.location.assign(target);
  };

  return (
    /*
     * `--course-tile` around the whole tab, the way the club's screen carries its orange: the tab
     * has no programme to take a colour from, so `COACH_TILE` is where its blue lives. Set once
     * here, so the offer card's tint reads `--course-tile` and the hex is never typed on a screen.
     * Type says what it means instead (the semantic colour map, global.css header): the price is
     * the coach's `text-ciel`, the marks and numerals the light-blue `text-accent`.
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
          {/*
            The coach is the screen's blue hero field (style A, global.css header): his role as a
            white sticker, his name with the surname as the field's key word over a neon swoosh, and
            the two facts about the session as white outlined pills. The tab's own bleu ciel is a
            tag further down, on the offer — a section colour is a tag, never a field.
          */}
          <HeroField as="section" className="flex flex-col gap-5">
            <div className="flex items-end gap-5">
              <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
                <Pill tone="white" tilt="right" className="origin-left">
                  {l(COACH.formaRole, locale)}
                </Pill>
                {/* 1.02 → 1.2. The lockup is two lines — «Сергей» over «Титов» — and 1.02 was drawn for
                  capitals, which have no descenders; «р» drops 0.182em below the baseline and the
                  «Т» under it rises to cap height. global.css carries the measurement. */}
                <h2 className="display text-[clamp(30px,9vw,44px)] leading-[1.2] text-balance">
                  {heavy}
                  {thin ? (
                    <>
                      {' '}
                      <KeyWord className="t-thin" swooshTone="action">
                        {thin}
                      </KeyWord>
                    </>
                  ) : null}
                </h2>
              </div>
              {/*
                The website's frame for him, not an avatar: 4:5, monochrome, grain over it. The
                grain is a sibling element rather than an `::after` on the frame for the reason
                global.css gives — it has to sit between the image and anything laid on top of it.
              */}
              {COACH.photo ? (
                <div className="relative w-28 shrink-0 overflow-hidden rounded-inner bg-surface">
                  <img
                    src={withBase(COACH.photo)}
                    alt={name}
                    width={256}
                    height={320}
                    className="photo-mono block aspect-[4/5] w-full object-cover"
                  />
                  <div className="photo-grain" aria-hidden="true" />
                </div>
              ) : (
                <Avatar seed={name} name={name} size={112} />
              )}
            </div>
            {/* Facts about the session, so outlined: the one filled thing on the tab is its
                neon button. */}
            <div className="flex flex-wrap gap-2">
              <Pill tone="ghost">{l(BOOKING.format, locale)}</Pill>
              <Pill tone="ghost">{t('app.bookLeadTimePill', { n: lead })}</Pill>
            </div>
          </HeroField>

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
            {/*
             * Where to find him, under what he has behind him rather than next to the pills above.
             * The pills say what the session is; these say where the person is, and the credentials
             * are the block that question belongs to.
             *
             * `externalLinkProps` and not a bare `href`: inside Telegram a top-level navigation out
             * of the Mini App either does nothing or replaces the app with a website the customer
             * cannot get back from, so Telegram is asked to open the address outside instead. On the
             * web the anchor behaves normally. Every link out of this app goes through that hook.
             */}
            {COACH.links.length > 0 ? (
              <ul className="flex flex-wrap gap-2 pt-1">
                {COACH.links.map((x) => (
                  <li key={x.url}>
                    <a
                      {...externalLinkProps(x.url)}
                      rel="me noopener noreferrer"
                      className="control-label inline-flex h-10 items-center rounded-control border border-border-strong px-4 text-[13px] text-muted transition-colors duration-150 active:bg-surface-2"
                    >
                      {x.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
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
                  {/* The first of the blue things. These three lines are the argument for the
                      price below them, so they are where the offer starts and where its colour
                      starts; the credentials above stay grey because they are not for sale. */}
                  <span className="numeral tabular w-6 shrink-0 pt-0.5 text-[15px] text-accent">
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
           *
           * ## Why it sits on a card, and why the switch is small
           *
           * The owner: «этот блок нужно сделать внутри плашки а переключатель по времени сделать
           * компактнее». Both halves are the same observation. The switch, the price, what is
           * included and the button are one object — pick a length, see its price, buy it — and on
           * flat ground they read as four unrelated things stacked between two essays. A surface
           * under them says where the offer starts and stops.
           *
           * **Filled rather than outlined, and that is the distinction on this screen.** The two
           * other cards here — the booked session at the top, and «Дальше» once payment has opened
           * — are hairline boxes with no fill, and they are both *states*: something that is true
           * right now and will not be true later. The offer is always there, so it gets the
           * surface. `level={1}`, because `design/README.md` reads the levels as a stack
           * (bg-0 → surface-1 → surface-2) rather than as emphasis, and this card sits directly on
           * the background.
           *
           * The switch stops being `fullWidth` for the reason she circled: stretched across the
           * column, «30 мин» floated in the middle of a cell twice as wide as the words, and two
           * cells of mostly empty white are what made it read as the loudest control on the screen
           * instead of a small choice before the price. Sized to its own labels it is a setting,
           * which is what it is.
           */}
          {/*
           * The offer's own edge and ground, in the tab's colour.
           *
           * Both are set inline rather than by class, and that is not a shortcut. `level={1}` is
           * `.glass-card`, whose hairline is a `border` shorthand in the components layer; a
           * Tailwind class passed through `className` sets the same property, so which one wins is
           * decided by where the two happen to land in the stylesheet — not by the order they are
           * written here. An inline declaration has no such argument to lose.
           *
           * The tint goes through `--glass-overlay` rather than `background`, because a solid
           * `background` would have replaced the glass band and kept the blur — the cost of the
           * material with none of it showing. The overlay is a flat 6% of the blue laid over the
           * band (global.css), and 45% of it on the hairline: enough that the card reads as a
           * different kind of object from the two glass boxes above and below it (both of which
           * are *states*, and both stay grey), and far too little to be a fill. The text on it is
           * the app's own, unchanged, so nothing here needs re-measuring for contrast — a 6% tint
           * moves the ground by about one surface level.
           */}
          <Card
            level={1}
            className="flex flex-col gap-5"
            style={
              {
                '--glass-overlay': 'color-mix(in oklab, var(--course-tile) 6%, transparent)',
                borderColor: 'color-mix(in oklab, var(--course-tile) 45%, transparent)',
              } as React.CSSProperties
            }
          >
            {BOOKING.options.length > 1 ? (
              <SegmentedControl
                size="sm"
                /*
                 * `self-start` is not decoration. `SegmentedControl` is an `inline-flex` box, but
                 * inside a flex column `align-items: stretch` still stretches it, and only the box
                 * stretches — the cells stay the width of their own labels. Dropping `fullWidth`
                 * without this drew the frame across the whole card with «30 мин | 60 мин» hugging
                 * the left and half the box empty, which is worse than the stretched version it
                 * replaced. Measured, not guessed: frame 300px, cells 73 + 74.
                 */
                className="self-start"
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
                payment={payment}
                redirecting={redirecting}
                onPay={pay}
                onContact={openContact}
              />
            ) : null}
          </Card>

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
                ? 'glass-card flex flex-col gap-3 rounded-card p-5'
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
              <Button
                variant={sent ? 'primary' : 'secondary'}
                size="lg"
                fullWidth
                onClick={openContact}
              >
                {t('app.bookContact')}
              </Button>
            ) : null}
            <p className="text-xs text-muted-2">{l(BOOKING.reschedule, locale)}</p>
            {/* With a slot page and a till both in place nothing above offers a way to ask, and a
                question before paying is exactly when one is needed. Quiet, so it is not a
                second action. */}
            {schedule && payment ? (
              <Button variant="ghost" size="md" className="self-start" onClick={openContact}>
                {t('app.supportWrite')}
              </Button>
            ) : null}
          </section>
          <SupportSheet open={writing} onClose={() => setWriting(false)} context={contactContext} />
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
    <section className="glass-card flex flex-col gap-4 rounded-card p-5">
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
 * **It used to be a comparison and is not any more.** The hour showed the price gap beside the
 * price («+1 000 ₽ к 30 минутам»), one muted «Всё из 30 минут», and then a kicker «Сверх 30 минут»
 * over the two lines the hour adds. The owner struck the first two by name, and the third had
 * nothing left to stand on — a list headed «what this adds» only means anything next to a statement
 * of what it adds *to*.
 *
 * So each length now simply says what it is: the price, and everything in it. The hour's list is
 * four lines instead of two, which is the honest answer to «что я получу за 3 500 ₽» and needs no
 * arithmetic from the reader. The switch above is what lets the two be compared, and it always was.
 */
function Option({
  option,
  payment,
  redirecting,
  onPay,
  onContact,
}: {
  option: BookingOption;
  payment: PayRoute | null;
  redirecting: boolean;
  onPay: () => void;
  onContact: () => void;
}) {
  const { t, locale } = useT();
  const price = formatPrice(locale, option.price);

  return (
    <article className="flex flex-col gap-4">
      {/* The coach's section tag: the length in bleu ciel with its measured ink (4.75). */}
      <Pill tone="ciel" className="self-start">
        {t('app.bookDuration', { n: option.durationMin })}
      </Pill>
      {/* The price in the tab's bleu ciel — the loudest thing on the screen, and the thing that
          says what kind of screen it is. Ciel on the graphite ground is 4.71 — body-text legal —
          and tile.test.ts pins that floor; the figure still never drops below 34px, because it is
          a price and not a sentence. It was 4.37 on charcoal and large type only, which is why
          the small facts of this screen took `text-accent`; they keep the light blue because it
          is what they mean, the interface accent rather than the coach's tag. */}
      <p className="display tabular text-[clamp(34px,11vw,48px)] leading-none text-ciel">{price}</p>

      <div className="flex flex-col gap-3">
        <span className="eyebrow">{t('app.bookIncludes')}</span>
        <ul className="flex flex-col border-t border-border">
          {option.includes.map((item) => (
            <li
              key={item.en}
              className="flex items-start gap-3 border-t border-border py-2.5 text-[15px] leading-snug first:border-t-0 first:pt-3"
            >
              {/* The tick takes the colour and the line stays white: a blue list would be a
                  block of coloured body copy, which is a different thing from a list with its
                  marks picked out. */}
              <Glyph size={14} className="mt-1 text-accent">
                ✓
              </Glyph>
              <span>{l(item, locale)}</span>
            </li>
          ))}
        </ul>
      </div>

      {payment ? (
        /* The one button on the tab that takes money, and the tab's one neon action (style A,
           global.css header). The «Выбрать время» below it stays a grey secondary on purpose: it
           is the step *after* the money, and two filled bars on one screen would make neither of
           them the action. */
        <Button variant="action" size="lg" fullWidth loading={redirecting} onClick={onPay}>
          {t('app.bookPay', { price })}
        </Button>
      ) : (
        <>
          <Button variant="action" size="lg" fullWidth onClick={onContact}>
            {t('app.bookContact')}
          </Button>
          <p className="text-sm text-muted">{t('app.bookContactHint')}</p>
        </>
      )}
    </article>
  );
}
