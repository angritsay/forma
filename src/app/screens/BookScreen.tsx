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
 * 4:5, monochrome, with grain over it — the frame the homepage's coach section gives him on the website, and
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
 * ## Pick a time, then pay (0055)
 *
 * The owner, 29 Sep: the booking order is «pick a slot, then pay» — the slot is held for 20
 * minutes and the payment confirms it. So the offer card ends in the picker (`SlotPicker`: two
 * weeks of days, then that day's free times) and one neon action, «Забронировать и оплатить»:
 * `hold_slot`, then the same static till link as before (`payRoute` / `payHref`). While the hold
 * lives the card shows it instead of the picker — «Слот держится до 14:35», the minutes left, the
 * pay button again (Telegram may not have opened the page) and a way to give it back. The app
 * never confirms anything itself: the webhook does, and the screen asks again when the person
 * comes back to it (focus, visibility), which is when the session appears at the top.
 *
 * A hold that runs out *after* the payment page was opened is not «pick again» (0056): the money
 * may be on its way, and the webhook still confirms a hold that simply ran out while the slot is
 * free. So the card says «Оплата проверяется…», hides the picker and keeps asking until the
 * session appears (`PaymentChecking`, `holdLapse`) — a second pick here was a second payment.
 *
 * ## When something is not quite right (0058)
 *
 * - **The till was opened** is remembered past a reload (`src/lib/coach/paying.ts`), with the
 *   sessions already booked: a lapsed hold is checked even after Telegram closed the Mini App, and
 *   any new active session — a claim, the admin, another device — ends the check. The check
 *   offers the claim by order number for money paid from another address.
 * - **The same start again** too soon is «через N мин», not «заняли» (`hold_again_later`), and the
 *   picker stops offering it. The pay button stays busy for three seconds after the till opens.
 * - **A failed read** of the person's sessions says so above the offer, with «Ещё раз»; a session
 *   the coach cancelled is shown in the booked card's place; the card asks for the next session
 *   once this one ends; and it tells a client without Telegram that no reminder will come.
 * - **«Написать тренеру»** carries the time the message is about (`contextTime`).
 *
 * This replaced the Google appointment page and the «pay, then write, and he sets the time»
 * block. Without a till link for the length there is still nothing to hold a slot for, so that
 * case keeps «Написать тренеру».
 *
 * Above all of it, when there is one, stands the session the person has already booked — «вот
 * ссылка на вход, через столько то начнется, дата, время». It comes first because for the one
 * person in a hundred who has it, it is the only thing on this tab that is not an advertisement:
 * the 30/60 switch is asking them to buy something they have already bought. Everything below is
 * unchanged, because they may well want another one.
 *
 * ## A switch by person, behind a flag (design/CHANGELOG.md §23)
 *
 * With `coach_nastia` switched on for the person (0049, admin → the person page → «Функции»), the
 * tab is about one of two people at a time. The owner: «When we have this card at the top, we
 * have "Founder of Forma", "personal trainer" for Sergey, his name, his photo, and below the
 * information for him. In a similar way present information for my card. I swipe to the right and
 * the information below the card gets updated… Prices should be the same, the payment links should
 * be the same, the booking links should be different.»
 *
 * - **The cards are headers only**, one anatomy (`features/coach/CoachHeroCard.tsx`): his blue
 *   field, then her light-blue card peeking in from the right, in a `.deck-scroller` snap strip
 *   with a two-dot pager under it. Tapping a card scrolls it into view.
 * - **The card in view picks `person`.** The strip's scroll position, read once it settles
 *   (`activeFromScroll`, `src/lib/coach/person.ts`), rather than an IntersectionObserver per card:
 *   at the far end the last card never reaches a full step, and a wide screen showing both cards
 *   whole never scrolls at all — one pure function covers both, and a tap covers the second.
 * - **Everything below follows `person`.** Sergey: exactly what this tab always was. Anastasia:
 *   her figures, her text in the credentials' place, what people talk to her about, her links —
 *   and no «I watch how you move», which is his voice. Then the same offer for both (same lengths,
 *   same prices, same payment) and the picker on the person's own calendar — the card in view
 *   is the coach switch (`coaches.id` is `sergey` / `nastia`, and hers is bookable only with the
 *   same flag, 0055).
 *
 * Without the flag the DOM is what it was and `person` is always Sergey.
 */
import { clsx } from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { BrandMark } from '@/components/ui/BrandMark';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Glyph } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { l, type Locale } from '@/i18n/index';
import { getMyCoachBookings } from '@/lib/api/coachBookings';
import {
  confirmDemoHold,
  getMyHold,
  holdSlot,
  moveMyBooking,
  releaseHold,
} from '@/lib/api/coachSlots';
import { isAppError } from '@/lib/api/errors';
import { myTelegramLinked } from '@/lib/api/telegram';
import type { BookingHold, CoachBooking, SessionOption } from '@/lib/api/types';
import { deviceTimeZone, pickCancelled, pickUpcoming } from '@/lib/coach/booking';
import {
  activeIds,
  clearPaying,
  paymentLanded,
  payingState,
  readPaying,
  writePaying,
  type PayingRecord,
} from '@/lib/coach/paying';
import { clockIn, holdClock, holdDeadline, holdLapse, MOVE_CUTOFF_HOURS } from '@/lib/coach/slots';
import { isDemo } from '@/lib/api/mode';
import { COACH_TILE, courseTileVars } from '@/lib/ui/tile';
import { openExternal, telegram } from '@/lib/telegram/webapp';
import { payHref, type PayRoute, payRoute } from '@/lib/util/payment';
import { SupportSheet } from '@/app/features/support/SupportSheet';
import { splitName } from '@/app/features/profile/model';
import { Doodle } from '@/components/ui/Doodle';
import { CoachHeroCard } from '@/app/features/coach/CoachHeroCard';
import { PaymentChecking } from '@/app/features/coach/PaymentChecking';
import { SlotPicker } from '@/app/features/coach/SlotPicker';
import {
  BookingsReadError,
  CancelledSession,
  UpcomingSession,
  whenLine,
} from '@/app/features/coach/SessionCard';
import { contextTime, dateOf, holdAgainMinutes, slotErrorKey } from '@/app/features/coach/slotCopy';
import { activeFromScroll, COACH_PEOPLE, type CoachPerson } from '@/lib/coach/person';
import { externalLinkProps } from '@/app/hooks/useExternalLink';
import { useT } from '@/app/hooks/useT';
import { useFlag } from '@/app/store/flags';
import { useSession } from '@/app/store/session';
import { BOOKING, type BookingOption, type BookingOutcome } from '@content/site/booking';
import { COACH } from '@content/site/coach';
import { NASTIA, type NastiaLink } from '@content/site/nastia';
import { lavaUrl, sessionKey } from '@content/site/payments';
import { formatPrice } from '@content/site/pricing';

/** A hold as the screen keeps it: the server's row plus its deadline on this device's clock. */
type HeldSlot = BookingHold & { deadline: number };

export default function BookScreen() {
  const { t, locale } = useT();
  const toast = useToast();
  const profile = useSession((s) => s.profile);
  const user = useSession((s) => s.user);
  /* The owner's card beside the coach's (0049); off for everyone it was not switched on for. */
  const nastia = useFlag('coach_nastia');
  /*
   * Whose card is in view (design/CHANGELOG.md §23). Sergey until the strip says otherwise, and
   * always Sergey without the flag. `swapped` turns the fade on only once the person has actually
   * changed, so the tab does not fade in on arrival.
   */
  const [person, setPerson] = useState<CoachPerson>('sergey');
  const [swapped, setSwapped] = useState(false);
  const who: CoachPerson = nastia ? person : 'sergey';
  const [redirecting, setRedirecting] = useState(false);
  // Back from the till restores this page from the back-forward cache with the spinner still on.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setRedirecting(false);
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);
  /*
   * The payment in flight (0056, 0058): which hold the till was opened for, when, and which
   * sessions the person already had. It is not proof of a payment — nothing on a static front end
   * can be — and it is not meant to be: it is what turns a lapsed hold into «оплата проверяется»
   * instead of «выбери снова». It is kept in localStorage too (`src/lib/coach/paying.ts`), so a
   * reload, or Telegram closing the Mini App while the person pays in the browser, does not forget
   * it and invite a second payment.
   */
  const userId = user?.id ?? '';
  const [paying, setPaying] = useState<PayingRecord | null>(null);
  const payingRef = useRef<PayingRecord | null>(null);
  useEffect(() => {
    payingRef.current = paying;
  }, [paying]);
  const forgetPaying = useCallback(() => {
    clearPaying();
    payingRef.current = null;
    setPaying(null);
  }, []);
  /*
   * The till was just opened. For three seconds the pay button stays busy: Telegram takes a
   * moment to hand the page to the browser, and a second tap in that moment opened it twice.
   */
  const [payBusy, setPayBusy] = useState(false);
  const payBusyTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(payBusyTimer.current), []);

  /*
   * The session already booked, and the clock the card reads from.
   *
   * `null` is the answer for almost everybody and is not an error state: nothing is booked, the
   * card is not drawn, and the screen is what it always was. A failed request is not the same
   * answer any more (0058): somebody who has paid would read the silence as «nothing booked», so
   * `readFailed` puts one line with «Ещё раз» above the offer — and the offer still renders.
   *
   * `cancelled` is a session the coach cancelled that has not happened yet (0058): shown in the
   * booked card's place when nothing else is booked, because the bot that would have said it
   * reaches only people with Telegram.
   *
   * `now` ticks only while a booking exists. Half a minute is the coarsest interval that still
   * turns «через 1 минуту» over before it becomes a lie, and the card is the only thing on the
   * screen that goes stale by sitting still.
   */
  const [booking, setBooking] = useState<CoachBooking | null>(null);
  const [cancelled, setCancelled] = useState<CoachBooking | null>(null);
  const [readFailed, setReadFailed] = useState(false);
  /* Whether the bot can reach them about the session (0058); asked once a session exists. */
  const [tgLinked, setTgLinked] = useState<boolean | null>(null);
  /*
   * The active sessions last read: what a payment in flight is compared against. Null until a read
   * has succeeded — an empty list would make every session the person already has look new.
   */
  const knownActive = useRef<string[] | null>(null);
  const [now, setNow] = useState(() => Date.now());
  /*
   * The slot held for this person while they pay (0055), or null. Read with the booking, so a
   * reload — or coming back from the payment page — finds the countdown where it was.
   *
   * The countdown runs on this device's clock from a deadline fixed when the hold arrived
   * (`holdDeadline`), never by comparing the server's `hold_expires_at` with `Date.now()` on
   * every tick: a phone whose clock runs ahead would see the hold end early, drop it, ask again,
   * get the same live hold back and drop it again, once a round trip, until the server caught up.
   * So the same hold coming back keeps the deadline it had (and the same object, so nothing
   * re-fires), and a hold that has lapsed here is never taken back (`lapsed`), whatever the
   * server still says about it for the few seconds its clock is behind ours.
   */
  const [hold, setHold] = useState<HeldSlot | null>(null);
  const lapsed = useRef(new Set<string>());
  const adoptHold = useCallback((next: BookingHold | null) => {
    const receivedAt = Date.now();
    setHold((prev) => {
      if (!next || lapsed.current.has(next.id)) return null;
      if (prev && prev.id === next.id && prev.holdExpiresAt === next.holdExpiresAt) return prev;
      return { ...next, deadline: holdDeadline(next.holdExpiresAt, receivedAt) };
    });
  }, []);
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
    },
    [],
  );

  /*
   * A hold that ran out after the till was opened (0056): which hold, and when it lapsed here.
   * While it is set the picker is hidden and the screen asks for the session every few seconds.
   */
  const [checking, setChecking] = useState<{ id: string; since: number } | null>(null);

  /*
   * Asked on arrival and again whenever the person comes back to the tab: the payment is
   * confirmed by a webhook, not by anything here, so «back from the till» is the moment the
   * session may have appeared and the hold gone.
   *
   * All the person's sessions, not only the soonest (0058): the list says what is booked, what
   * the coach cancelled, and whether a payment in flight has landed — under the held slot's id or
   * any new one (a claim, the admin, another device). A hold read back after a reload is matched
   * with the remembered payment: the same hold is «оплата открылась», a gone one is being checked
   * from the moment it ran out, and another one means the record is about a slot left behind.
   */
  const refresh = useCallback(() => {
    getMyCoachBookings()
      .then((list) => {
        if (!alive.current) return;
        const at = Date.now();
        setBooking(pickUpcoming(list, at));
        setCancelled(pickCancelled(list, at));
        setReadFailed(false);
        knownActive.current = activeIds(list);
        const p = payingRef.current;
        if (p && paymentLanded(list, p)) {
          forgetPaying();
          setChecking(null);
        }
      })
      .catch(() => {
        if (alive.current) setReadFailed(true);
      });
    getMyHold()
      .then((h) => {
        if (!alive.current) return;
        adoptHold(h);
        const p = payingRef.current;
        if (!p) return;
        const at = Date.now();
        const state = payingState(p, h && !lapsed.current.has(h.id) ? h : null, at);
        if (state === 'stale') forgetPaying();
        else if (state !== 'holding') {
          setChecking((c) => c ?? { id: p.holdId, since: Math.min(p.deadline, at) });
        }
      })
      .catch(() => {
        /* No countdown is better than an error where the offer is. */
      });
  }, [adoptHold, forgetPaying]);

  useEffect(() => {
    refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);

  /*
   * A payment remembered from before a reload, read once the account is known (the session may
   * arrive after the first refresh) and matched against the hold and the sessions right away.
   */
  useEffect(() => {
    if (!userId) return;
    const saved = readPaying(userId, Date.now());
    payingRef.current = saved;
    setPaying(saved);
    if (saved) refresh();
  }, [userId, refresh]);

  /* Every second while a hold counts down; every half minute while only a session does. */
  useEffect(() => {
    if (!booking && !hold) return;
    const id = window.setInterval(() => setNow(Date.now()), hold ? 1_000 : 30_000);
    return () => window.clearInterval(id);
  }, [booking, hold]);

  /* The session ended while the tab sat open: the card goes, and the next one is asked for. */
  useEffect(() => {
    if (booking && Date.parse(booking.endsAt) <= now) {
      setBooking(null);
      refresh();
    }
  }, [booking, now, refresh]);

  /* Asked once there is a session to be reminded of; a failure leaves the card as it was. */
  const hasBooking = booking !== null;
  useEffect(() => {
    if (!hasBooking || tgLinked !== null) return;
    let live = true;
    void myTelegramLinked().then((linked) => {
      if (live) setTgLinked(linked);
    });
    return () => {
      live = false;
    };
  }, [hasBooking, tgLinked]);

  /*
   * Which length is showing. The first option leads because `content/site/booking.ts` orders them
   * cheapest first, and the cheaper one is the lower step in: somebody who wants the hour will
   * still find it, somebody unsure of the whole idea is looking for the half.
   *
   * Unless the link already said which: the site's «book an hour» button opens `#/book?len=hour`
   * (the same value survives sign-in — see features/entry/next.ts). Read once, as the starting
   * position only; the switch is theirs from then on. An id the offer does not carry is ignored.
   */
  const [searchParams] = useSearchParams();
  const [pick, setPick] = useState<BookingOption['id']>(() => {
    const len = searchParams.get('len');
    const asked = BOOKING.options.find((o) => o.id === len);
    return asked?.id ?? BOOKING.options[0]?.id ?? 'half';
  });
  const index = BOOKING.options.findIndex((o) => o.id === pick);
  const option = BOOKING.options[index] ?? BOOKING.options[0];

  const email = profile?.email || user?.email || '';
  const name = l(COACH.name, locale);
  const { heavy, thin } = splitName(name);
  const herName = l(NASTIA.name, locale);
  const her = splitName(herName);
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
   * The till follows the length — and once a slot is held, the *hold's* length, not whatever
   * the switch shows now: the webhook tells a session by its amount (Prodamus) or product
   * (lava.top), and half an hour paid against a held hour would leave the slot unconfirmed.
   */
  const routeFor = (o: BookingOption | undefined): PayRoute | null =>
    o ? payRoute(locale, o.paymentUrl[locale] ?? o.paymentUrl.ru, lavaUrl(sessionKey(o.id))) : null;
  const payment = routeFor(option);
  /*
   * «Написать тренеру» opens a message sheet (0042) instead of a mailto or a bare Telegram link:
   * the message lands in the owner's «Обращения» topic, which is where she and the coach look.
   * The context is in Russian whatever the app's language — the coach reads the topic in Russian.
   */
  const [writing, setWriting] = useState(false);
  const contactContext =
    (option ? option.name.ru : 'Вкладка «Тренер»') +
    (who === 'nastia' ? ` · ${NASTIA.name.ru}` : '');
  const openContact = () => setWriting(true);

  /* The credentials that are not already standing above as a figure. */
  const rest = COACH.credentials.filter((c) => !COACH.figures.some((f) => f.of === c));

  /* The two facts about the session — the same booking product whoever's card it is. */
  /*
   * How a session happens, said once above the cards rather than as two pills inside each: the
   * owner, on the strip of two, «убери про видео онлайн 15 минут до, сделай это сверху заголовком
   * просто». It is the same for both people, so it belongs to the tab, not to a card.
   */
  const sessionHeading = (
    <header className="flex flex-col gap-1">
      <h1 className="font-display text-[22px] leading-tight">{l(BOOKING.format, locale)}</h1>
      <p className="text-[15px] text-muted">{t('app.bookLeadTimePill', { n: lead })}</p>
    </header>
  );

  /*
   * The picker's state: the start picked on the card in view, and a counter that makes the picker
   * ask again (a slot someone else took, a hold that ran out, a hold given back).
   */
  const [slot, setSlot] = useState<string | null>(null);
  const [slotsKey, setSlotsKey] = useState(0);
  const [holding, setHolding] = useState(false);
  /* Said once under the picker after a hold ran out, until the next pick. */
  const [holdLapsed, setHoldLapsed] = useState(false);
  /* The picker is asking for times: nothing on screen is a pick yet, so the button waits. */
  const [slotsLoading, setSlotsLoading] = useState(true);
  const reloadSlots = () => setSlotsKey((n) => n + 1);

  /*
   * The strip: which card it rests on, read once the scroll settles. A debounce rather than every
   * frame, so the content below changes once per swipe and not back and forth mid-gesture.
   */
  const stripRef = useRef<HTMLElement>(null);
  const settle = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(settle.current), []);

  /*
   * Another card is another calendar: the time picked on the first is not a time on the second,
   * so it goes, and «Забронировать и оплатить» waits for a pick on the calendar now in view.
   */
  const choose = (next: CoachPerson) => {
    if (next === person) return;
    setPerson(next);
    setSwapped(true);
    setSlot(null);
    setHoldLapsed(false);
  };

  const onStripScroll = () => {
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      const el = stripRef.current;
      const first = el?.children[0] as HTMLElement | undefined;
      const second = el?.children[1] as HTMLElement | undefined;
      if (!el || !first || !second) return;
      const i = activeFromScroll({
        scrollLeft: el.scrollLeft,
        maxScroll: el.scrollWidth - el.clientWidth,
        step: second.offsetLeft - first.offsetLeft,
        count: el.children.length,
      });
      if (i !== null) choose(COACH_PEOPLE[i] ?? 'sergey');
    }, 90);
  };

  /* A tap on a card brings it into view and makes it the person, even where the strip cannot
     scroll because both cards fit. */
  const showCard = (next: CoachPerson, card: HTMLElement) => {
    choose(next);
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    card.scrollIntoView({ behavior: still ? 'auto' : 'smooth', inline: 'start', block: 'nearest' });
  };

  const personName = who === 'nastia' ? herName : name;
  const herLinks = NASTIA.links[locale] ?? NASTIA.links.ru;

  const lapse = checking ? holdLapse(true, checking.since, now) : null;
  /* The live hold's till was opened from here (or from before a reload, `paying`). */
  const sent = paying !== null && hold !== null && paying.holdId === hold.id;

  const clock = hold ? holdClock(hold.deadline, now) : null;
  useEffect(() => {
    if (!hold || !clock?.expired) return;
    lapsed.current.add(hold.id);
    setHold(null);
    if (sent) {
      // The record stays: a reload while the payment is checked must come back to the check.
      setChecking({ id: hold.id, since: Date.now() });
    } else {
      setHoldLapsed(true);
      setSlotsKey((n) => n + 1);
    }
    // A payment that landed in the last seconds may have made it a session: ask.
    refresh();
  }, [hold, clock?.expired, sent, refresh]);

  /*
   * While a payment is being checked: ask every ten seconds whether it landed. All the person's
   * sessions, not only the soonest — an earlier one would hide it — and not only under the held
   * slot's id (0058): a claim, the admin or another device can confirm it as a new session, and
   * any active session that was not there when the till opened is the payment. The clock ticks
   * too, so the wait ends by itself after `PAYMENT_CHECK_MINUTES`.
   */
  useEffect(() => {
    if (!checking || lapse !== 'checking') return;
    const ask = () => {
      getMyCoachBookings()
        .then((list) => {
          if (!alive.current) return;
          const known = payingRef.current?.known ?? null;
          if (paymentLanded(list, { holdId: checking.id, known })) {
            setChecking(null);
            forgetPaying();
            refresh();
          }
        })
        .catch(() => {
          /* Asked again in ten seconds. */
        });
    };
    ask();
    const id = window.setInterval(() => {
      setNow(Date.now());
      ask();
    }, 10_000);
    return () => window.clearInterval(id);
  }, [checking, lapse, refresh, forgetPaying]);

  /* «Я не платил(а)»: the picker comes back, and the lapsed slot is free to everybody again. */
  const stopChecking = () => {
    setChecking(null);
    forgetPaying();
    setSlot(null);
    reloadSlots();
  };

  /* A claim by order number confirmed the held slot (0058): the wait is over, read the session. */
  const claimed = () => {
    setChecking(null);
    forgetPaying();
    toast.show({ kind: 'success', title: t('app.claimSession') });
    refresh();
  };

  /*
   * Open the till for a held slot. In the demo there is no till: the demo's stand-in for the
   * webhook confirms the hold, so the walkthrough reaches the booked card.
   *
   * Before leaving, the payment is written down (`paying`), with the sessions already booked, so
   * a reload or a closed Mini App still knows the money may be on its way.
   */
  const payFor = async (held: BookingHold, deadline: number) => {
    if (payBusy) return;
    const route = routeFor(BOOKING.options.find((o) => o.id === held.optionId));
    // No till for the hold's length in this language: the panel offers a message instead.
    if (!route) {
      openContact();
      return;
    }
    if (isDemo()) {
      await confirmDemoHold().catch(() => false);
      toast.show({ kind: 'success', title: t('app.bookDemoPaid') });
      forgetPaying();
      refresh();
      return;
    }
    const target = payHref(route, email);
    const record: PayingRecord = {
      user: userId,
      holdId: held.id,
      sentAt: Date.now(),
      deadline,
      startsAt: held.startsAt,
      known: knownActive.current,
    };
    writePaying(record);
    payingRef.current = record;
    setPaying(record);
    setPayBusy(true);
    window.clearTimeout(payBusyTimer.current);
    payBusyTimer.current = window.setTimeout(() => {
      if (alive.current) setPayBusy(false);
    }, 3_000);
    // Inside Telegram the payment page opens in the person's own browser, not in the Mini App.
    if (openExternal(target)) return;
    setRedirecting(true);
    window.location.assign(target);
  };

  /* «Забронировать и оплатить»: hold the picked slot, then straight to the till. */
  const book = async () => {
    if (!slot || !option || !payment || holding || slotsLoading) return;
    setHolding(true);
    setHoldLapsed(false);
    try {
      const held = await holdSlot(who, option.id as SessionOption, slot);
      if (!held) {
        toast.show({ kind: 'error', title: t('app.bookHoldTaken') });
        setSlot(null);
        reloadSlots();
        return;
      }
      // A fresh pick is a fresh hold, even of a start that lapsed here before.
      lapsed.current.delete(held.id);
      const at = Date.now();
      adoptHold(held);
      setNow(at);
      await payFor(held, holdDeadline(held.holdExpiresAt, at));
    } catch (e) {
      toast.show({ kind: 'error', title: t(slotErrorKey(e), { n: holdAgainMinutes(e) }) });
      // Taken, or held by them too recently (0058, the picker stops offering it): ask again.
      if (isAppError(e) && (e.message === 'slot_taken' || e.message === 'hold_again_later')) {
        setSlot(null);
        reloadSlots();
      }
    } finally {
      setHolding(false);
    }
  };

  /* «Выбрать другое время»: the slot goes back to everybody, the picker comes back. */
  const giveBack = async () => {
    const id = hold?.id;
    setHolding(true);
    try {
      await releaseHold();
    } catch {
      /*
       * A hold that could not be released runs out on its own in minutes. Until then the server
       * still returns it, and it must not come back on the next refresh as if nothing was pressed.
       */
      if (id) lapsed.current.add(id);
    } finally {
      setHold(null);
      forgetPaying();
      setSlot(null);
      reloadSlots();
      setHolding(false);
    }
  };

  /*
   * «Написать тренеру» carries what the message is about (0058): the held slot, the one whose
   * payment is being checked, or the booked session — in Moscow time, as the coach reads it.
   */
  const aboutTime = hold
    ? contextTime('hold', hold.startsAt)
    : checking && paying
      ? contextTime('checking', paying.startsAt)
      : booking
        ? contextTime('booking', booking.startsAt)
        : '';
  const contactAbout = [contactContext, aboutTime].filter(Boolean).join(' · ');

  /* The session being moved, while the sheet is open. */
  const [moving, setMoving] = useState<CoachBooking | null>(null);

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
          {booking ? (
            <UpcomingSession
              booking={booking}
              now={now}
              telegram={tgLinked}
              inTelegram={telegram() !== null}
              onMove={() => setMoving(booking)}
              onContact={openContact}
            />
          ) : cancelled ? (
            <CancelledSession booking={cancelled} onContact={openContact} />
          ) : null}
          {readFailed ? <BookingsReadError onRetry={refresh} /> : null}

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
          {sessionHeading}
          {nastia ? (
            /*
             * With the `coach_nastia` flag (0049) the hero is a strip of two header cards: Sergey's
             * field first, the owner's light-blue card after it. The owner's rules for the strip:
             *
             *   - each card is the full width of the column, the size his single card always was;
             *   - hers shows only a sliver, ~12px, at the right edge: the gap is 4px and the page's
             *     16px gutter is where she peeks in;
             *   - both cards are the same height (`items-stretch`), whichever has more to say;
             *   - no dots under the strip — the sliver is the hint that there is a second card.
             *
             * The card in view decides what is below.
             */
            <div>
              <section
                ref={stripRef}
                aria-label={t('app.bookHeroStrip')}
                onScroll={onStripScroll}
                className="deck-scroller -mx-4 flex snap-x snap-mandatory items-stretch gap-1 overflow-x-auto scroll-px-4 px-4 md:-mx-10 md:scroll-px-10 md:px-10"
              >
                <CoachHeroCard
                  as="article"
                  tone="field"
                  locale={locale}
                  stickers={COACH.formaRoles}
                  heavy={heavy}
                  thin={thin}
                  photo={COACH.photo}
                  name={name}
                  aria-current={who === 'sergey' ? 'true' : undefined}
                  onClick={(e) => showCard('sergey', e.currentTarget)}
                  className="w-full shrink-0 cursor-pointer snap-start"
                />
                <CoachHeroCard
                  as="article"
                  tone="sky"
                  locale={locale}
                  stickers={NASTIA.roles}
                  heavy={her.heavy}
                  thin={her.thin}
                  photo={NASTIA.photo}
                  name={herName}
                  mark="heart"
                  aria-current={who === 'nastia' ? 'true' : undefined}
                  onClick={(e) => showCard('nastia', e.currentTarget)}
                  className="w-full shrink-0 cursor-pointer snap-start"
                />
              </section>
              {/* Says whose information is below once it changes; the cards do not move focus. */}
              <p aria-live="polite" className="sr-only">
                {personName}
              </p>
            </div>
          ) : (
            <CoachHeroCard
              tone="field"
              locale={locale}
              stickers={COACH.formaRoles}
              heavy={heavy}
              thin={thin}
              photo={COACH.photo}
              name={name}
            />
          )}

          {/*
           * Everything below the cards follows the card in view. Keyed by the person, so a change
           * swaps it whole with a short fade (`.fade-in`, none under reduced motion).
           */}
          <section
            key={who}
            aria-label={personName}
            className={clsx('flex flex-col gap-9', swapped && 'fade-in')}
          >
            {who === 'nastia' ? (
              <NastiaAbout locale={locale} links={herLinks} />
            ) : (
              <>
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
                          className={clsx(
                            'flex min-w-0 flex-col gap-2 py-4',
                            i === 0 ? 'pr-4' : 'pl-4',
                          )}
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
                            className="control-label inline-flex h-10 items-center gap-2 rounded-control border border-border-strong px-4 text-[13px] text-muted transition-colors duration-150 active:bg-surface-2"
                          >
                            <BrandMark kind={x.kind} size={16} className="shrink-0 text-text" />
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
                <OutcomeList outcomes={BOOKING.outcomes} tone="field" locale={locale} />
              </>
            )}

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
            {/*
             * Plain glass since the price turned neon. The owner, on the blue-tinted card with a
             * neon figure in it: «синий не вписывается тут». The tint and the blue hairline were
             * there to set the offer apart from the grey state boxes around it; the neon price and
             * the neon button do that now, and blue beside them read as a third colour competing.
             */}
            <Card level={1} className="flex flex-col gap-5">
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
                    setSlot(null);
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
                  onContact={openContact}
                  // A slot is held or its payment is being checked: this price is not the
                  // thing to act on now (0058).
                  dim={checking !== null || (hold !== null && clock !== null && !clock.expired)}
                />
              ) : null}
              {/*
               * The time, then the one action (0055). While a slot is held the hold stands here
               * instead — whichever card or length is in view, because it is the person's one hold
               * and the thing they are in the middle of. No till for this length, no picker: there
               * would be nothing to hold a slot for (`Option` offers the message instead).
               */}
              {checking && lapse && lapse !== 'expired' && !hold ? (
                <PaymentChecking
                  state={lapse}
                  onContact={openContact}
                  onDismiss={stopChecking}
                  onClaimed={claimed}
                />
              ) : hold && clock && !clock.expired ? (
                <HoldPanel
                  hold={hold}
                  left={clock.left}
                  canPay={routeFor(BOOKING.options.find((o) => o.id === hold.optionId)) !== null}
                  onContact={openContact}
                  sent={sent}
                  busy={holding || redirecting || payBusy}
                  onPay={() => void payFor(hold, hold.deadline)}
                  onRelease={() => void giveBack()}
                />
              ) : option && payment ? (
                <section className="flex flex-col gap-4 border-t border-border pt-5">
                  <span className="eyebrow">{t('app.bookPickerTitle')}</span>
                  {holdLapsed ? (
                    <p role="status" className="text-sm leading-snug text-muted">
                      {t('app.bookHoldExpired')}
                    </p>
                  ) : null}
                  <SlotPicker
                    coach={who}
                    option={option.id as SessionOption}
                    value={slot}
                    onChange={setSlot}
                    onLoading={setSlotsLoading}
                    reloadKey={slotsKey}
                    empty={
                      <Button
                        variant="secondary"
                        size="md"
                        className="self-start"
                        onClick={openContact}
                      >
                        {t('app.bookContact')}
                      </Button>
                    }
                  />
                  {/* The tab's one neon action, as the pay button always was (style A). */}
                  <Button
                    variant="action"
                    size="lg"
                    fullWidth
                    disabled={!slot || slotsLoading}
                    loading={holding}
                    onClick={() => void book()}
                  >
                    {slot
                      ? t('app.bookHoldPay', { price: formatPrice(locale, option.price) })
                      : t('app.bookPickerTitle')}
                  </Button>
                </section>
              ) : null}
            </Card>

            {/*
             * Under the offer: the rule for changes, and a way to ask before paying. It used to be
             * «Дальше» — the step after the money, a Google slot page or «write and he sets the
             * time» — and the picker above is that step now, taken before the money.
             */}
            <section className="flex flex-col gap-2 border-t border-border pt-5">
              <p className="text-xs text-muted-2">{l(BOOKING.reschedule, locale)}</p>
              {payment ? (
                <Button
                  variant="ghost"
                  size="md"
                  className="-ml-6.5 self-start"
                  onClick={openContact}
                >
                  {t('app.supportWrite')}
                </Button>
              ) : null}
            </section>
          </section>
          {moving ? (
            <MoveSheet
              booking={moving}
              onContact={() => {
                setMoving(null);
                openContact();
              }}
              onClose={() => setMoving(null)}
              onMoved={() => {
                setMoving(null);
                refresh();
              }}
            />
          ) : null}
          <SupportSheet open={writing} onClose={() => setWriting(false)} context={contactAbout} />
        </div>
      </Screen>
    </div>
  );
}

/**
 * What stands under Anastasia's card when it is in view (design/CHANGELOG.md §23) — Sergey's
 * blocks in the same styles and the same order, filled with hers: two figures as his are, her text
 * where his credentials are, her links for the app's language, and then her three things, numbered
 * like his. What people talk to her about used to be a row of tags; the owner took them out and it
 * is the third of the three now.
 */
function NastiaAbout({ locale, links }: { locale: Locale; links: readonly NastiaLink[] }) {
  return (
    <>
      <section className="flex flex-col gap-4">
        <div className="grid grid-cols-2 divide-x divide-border border-y border-border">
          {NASTIA.facts.map((f, i) => (
            <div
              key={f.figure}
              className={clsx('flex min-w-0 flex-col gap-2 py-4', i === 0 ? 'pr-4' : 'pl-4')}
            >
              <span className="numeral tabular text-[clamp(26px,8vw,34px)] leading-none">
                {f.figure}
              </span>
              <span className="eyebrow">{l(f.caption, locale)}</span>
            </div>
          ))}
        </div>
        <p className="text-[14px] leading-snug text-muted">{l(NASTIA.bio, locale)}</p>
        {/* The same chips as his links, and through `externalLinkProps` for the same reason. */}
        {links.length > 0 ? (
          <ul className="flex flex-wrap gap-2 pt-1">
            {links.map((x) => (
              <li key={x.url}>
                <a
                  {...externalLinkProps(x.url)}
                  rel="noopener noreferrer"
                  className="control-label inline-flex h-10 items-center gap-2 rounded-control border border-border-strong px-4 text-[13px] text-muted transition-colors duration-150 active:bg-surface-2"
                >
                  <BrandMark kind={x.kind} size={16} className="shrink-0 text-text" />
                  {x.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
      <OutcomeList outcomes={NASTIA.outcomes} tone="sky" locale={locale} />
    </>
  );
}

/**
 * What an hour gives, as three numbered jobs — his from `BOOKING.outcomes`, hers from
 * `NASTIA.outcomes`. One component so the two people's lists can never drift apart in style.
 *
 * Each job has a drawn glyph on a tile in the person's colour — the owner: «надо добавить визуал и
 * у меня, и у Серёжи, и больше воздуха». The glyphs are in the swoosh's stroke (`Doodle`), so the
 * list reads as the same hand as the cards above it: his tile is his card's electric blue with the
 * doodle in the swoosh's neon, hers is her light blue with the doodle in his blue, like her heart.
 *
 * Still numbered, and the numbers still mean something: read down, the three are the shape of the
 * session, so 01 · 02 · 03 is an order and not a decoration. They are small now and sit over the
 * title, because the tile is what the eye lands on first.
 */
const OUTCOME_TILE = {
  field: 'bg-field text-action',
  sky: 'bg-accent text-field',
} as const;

function OutcomeList({
  outcomes,
  tone,
  locale,
}: {
  outcomes: readonly BookingOutcome[];
  tone: keyof typeof OUTCOME_TILE;
  locale: Locale;
}) {
  return (
    <section className="pt-2">
      <ul className="flex flex-col">
        {outcomes.map((o, i) => (
          <li
            key={o.title.en}
            className="flex items-start gap-5 border-t border-border py-7 first:border-t-0 first:pt-0 last:pb-0"
          >
            <span
              aria-hidden="true"
              className={clsx(
                'flex size-14 shrink-0 items-center justify-center rounded-tile',
                OUTCOME_TILE[tone],
              )}
            >
              <Doodle kind={o.doodle} className="size-8" />
            </span>
            <div className="flex min-w-0 flex-col gap-2">
              <span className="numeral tabular text-[13px] leading-none text-accent">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="font-display text-[17px] leading-snug">{l(o.title, locale)}</p>
              <p className="text-[14px] leading-relaxed text-muted">{l(o.body, locale)}</p>
            </div>
          </li>
        ))}
      </ul>
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
/** What the shortest session includes; anything a longer one lists beyond it is an extra. */
const BASE_INCLUDES = new Set((BOOKING.options[0]?.includes ?? []).map((item) => item.en));

function Option({
  option,
  payment,
  onContact,
  dim = false,
}: {
  option: BookingOption;
  payment: PayRoute | null;
  onContact: () => void;
  /** The price steps back while a hold or a payment check is the thing in progress (0058). */
  dim?: boolean;
}) {
  const { t, locale } = useT();
  const price = formatPrice(locale, option.price);

  return (
    <article className="flex flex-col gap-4">
      {/* No length tag here any more: it said «30 мин» right under the switch that already says
          it, in a blue the owner took out of this block («синий не вписывается тут»). */}
      {/* The price in neon — the owner: «сделай блок жёлтым, я имею в виду цифры». It was the
          tab's bleu ciel; the figure is what this block is for, and neon is the colour of the one
          thing to act on (the pay button under it is the same neon). 17.3 on the graphite ground.
          The length above keeps the coach's ciel tag, so the tab still says whose it is. */}
      <p
        className={clsx(
          'display tabular text-[clamp(34px,11vw,48px)] leading-none transition-colors duration-150',
          dim ? 'text-muted-2' : 'text-action',
        )}
      >
        {price}
      </p>

      <div className="flex flex-col gap-3">
        <span className="eyebrow">{t('app.bookIncludes')}</span>
        <ul className="flex flex-col border-t border-border">
          {option.includes.map((item) => {
            /* What the longer session adds over the shortest one — the owner: «нужно допы
               подчеркнуть оранжевым, но не текст». Orange is effort, «more» (the semantic map), and
               it lands on the tick only: the words stay white like every other line. */
            const extra = !BASE_INCLUDES.has(item.en);
            return (
              <li
                key={item.en}
                className="flex items-start gap-3 border-t border-border py-2.5 text-[15px] leading-snug first:border-t-0 first:pt-3"
              >
                {/* The tick takes the colour and the line stays white: a blue list would be a
                  block of coloured body copy, which is a different thing from a list with its
                  marks picked out. */}
                <Glyph size={14} className={clsx('mt-1', extra ? 'text-orange' : 'text-accent')}>
                  {extra ? '+' : '✓'}
                </Glyph>
                <span>{l(item, locale)}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* With a till, the action is the picker's «Забронировать и оплатить» under this block
          (0055): time first, then money. Without one there is nothing to hold a slot for, and the
          action is a message to the coach. */}
      {payment ? null : (
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

/**
 * The slot held while the person pays (0055) — in the offer card, in the picker's place.
 *
 * What is held and until when, as the owner put it («Слот держится до 14:35»), with the minutes
 * and seconds left beside it in the light blue of progress; then the pay button again, because
 * inside Telegram the till opens in another app and may simply not have; then a quiet way to give
 * the slot back. The hold is the person's one, whichever card or length is in view, so it names
 * its own coach, length and price rather than borrowing the switch's.
 */
function HoldPanel({
  hold,
  left,
  canPay,
  onContact,
  sent,
  busy,
  onPay,
  onRelease,
}: {
  hold: HeldSlot;
  left: string;
  /**
   * The hold's length has a till in this language. It may not — a hold made in one language and
   * looked at in another — and then the pay button would do nothing, so a message stands in.
   */
  canPay: boolean;
  onContact: () => void;
  sent: boolean;
  busy: boolean;
  onPay: () => void;
  onRelease: () => void;
}) {
  const { t, locale } = useT();
  const zone = deviceTimeZone();
  const option = BOOKING.options.find((o) => o.id === hold.optionId);
  const coach = hold.coachId === 'nastia' ? l(NASTIA.name, locale) : l(COACH.name, locale);
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-5">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="font-display text-[17px] leading-snug">
            {t('app.bookHoldUntil', { time: clockIn(hold.deadline, zone) })}
          </span>
          <span className="tabular text-[13px] text-accent">{t('app.bookHoldLeft', { left })}</span>
        </div>
        <p className="tabular text-[13px] leading-snug text-muted">
          {[
            coach,
            dateOf(hold.startsAt, locale, zone),
            `${clockIn(hold.startsAt, zone)} – ${clockIn(hold.endsAt, zone)}`,
            option ? t('app.bookDuration', { n: option.durationMin }) : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      {sent && !isDemo() ? (
        <p className="text-[15px] leading-snug">{t('app.bookPaidNote')}</p>
      ) : (
        <p className="text-sm leading-snug text-muted">{t('app.bookHoldNote')}</p>
      )}
      {option && canPay ? (
        <Button variant="action" size="lg" fullWidth loading={busy} onClick={onPay}>
          {t('app.bookPay', { price: formatPrice(locale, option.price) })}
        </Button>
      ) : (
        <Button variant="secondary" size="lg" fullWidth disabled={busy} onClick={onContact}>
          {t('app.bookContact')}
        </Button>
      )}
      <Button
        variant="ghost"
        size="md"
        className="-ml-6.5 self-start"
        disabled={busy}
        onClick={onRelease}
      >
        {t('app.bookHoldRelease')}
      </Button>
    </section>
  );
}

/**
 * «Перенести» (0055): the same picker on the session's own calendar and length, and one button
 * that names the new time. `move_my_booking` checks the 24 hours again — the sheet may have sat
 * open across the line — and a refusal says what to do instead.
 *
 * Since 0056 the picker asks for slots with this session ignored (`p_ignore_booking`), so it can
 * move half an hour over its own old time, and only from 24 hours ahead — the rule that decides
 * whether «Перенести» is shown at all holds for the new time too. Two weeks with nothing free end
 * in «Написать тренеру», as on the tab.
 */
function MoveSheet({
  booking,
  onContact,
  onClose,
  onMoved,
}: {
  booking: CoachBooking;
  onContact: () => void;
  onClose: () => void;
  onMoved: () => void;
}) {
  const tr = useT();
  const { t } = tr;
  const toast = useToast();
  const zone = deviceTimeZone() ?? booking.timezone ?? undefined;
  const [slot, setSlot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const option: SessionOption =
    booking.optionId ?? (booking.durationMinutes > 30 ? 'hour' : 'half');

  const move = async () => {
    if (!slot) return;
    setBusy(true);
    try {
      await moveMyBooking(booking.id, slot);
      toast.show({ kind: 'success', title: t('app.bookMoveDone') });
      onMoved();
    } catch (e) {
      toast.show({ kind: 'error', title: t(slotErrorKey(e)) });
      /*
       * Each refusal has its own next step (0058). Too late: the sheet has nothing left to offer.
       * The session changed under it (moved or cancelled by the coach): close and read it again.
       * No connection or signed out: the pick stays, to try again as it was. A taken slot: the
       * times are asked for again.
       */
      const code = isAppError(e) ? e.message : '';
      if (code === 'too_late') onClose();
      else if (code === 'not_found') onMoved();
      else if (!isAppError(e) || (e.code !== 'network' && e.code !== 'auth')) {
        setSlot(null);
        setReload((n) => n + 1);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('app.bookMoveTitle')}
      footer={
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!slot}
          loading={busy}
          onClick={() => void move()}
        >
          {slot
            ? t('app.bookMoveConfirm', {
                time: `${dateOf(slot, tr.locale, zone)}, ${clockIn(slot, zone)}`,
              })
            : t('app.bookPickerTitle')}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <p className="tabular text-[13px] text-muted">
          {t('app.bookMoveNow', { when: whenLine(tr, booking.startsAt, booking.endsAt, zone) })}
        </p>
        {booking.coachId ? (
          <SlotPicker
            coach={booking.coachId}
            option={option}
            value={slot}
            onChange={setSlot}
            reloadKey={reload}
            ignore={booking.id}
            leadMs={MOVE_CUTOFF_HOURS * 3_600_000}
            empty={
              <Button variant="secondary" size="md" className="self-start" onClick={onContact}>
                {t('app.bookContact')}
              </Button>
            }
          />
        ) : null}
      </div>
    </Sheet>
  );
}
