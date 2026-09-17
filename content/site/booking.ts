/**
 * One-to-one sessions with the coach, bookable from the app and the coach card on the landing.
 *
 * This is the only place the business asks for the coach's time, and it is priced as his time:
 * the client pays for the session, the slot is agreed with a person. Nothing else in the product
 * depends on him being available, so an empty calendar costs nothing and a full one is his to fill.
 *
 * There are two lengths, because the two reasons people ask for him are different sizes. Half an
 * hour is «посмотри, правильно ли я делаю»; an hour is that plus the programme and the plan. Every
 * surface that only mentions the offer in passing says «от {the cheaper price}» and leaves the
 * choice to the booking screen, which is the only place the two can be compared.
 *
 * `paymentUrl` follows the course rule (docs/SETUP.md §7.1): an absolute https link per locale, the
 * signed-in email is appended as `?email=`, anything else is ignored. An option without a link
 * offers a message to the coach instead of a payment button, so the half-hour can be published
 * before its product exists. `scheduleUrl` is where the client picks a slot after paying (a Google
 * Calendar appointment page, a Telegram link); optional, and shared by both lengths.
 */
import type { L10n, PaymentUrl } from '@/content/schema';
import type { CoursePrice } from './pricing';

export interface BookingOption {
  /** Stable key: the React key, and how the two are told apart anywhere else. */
  id: 'hour' | 'half';
  name: L10n;
  durationMin: number;
  /** Same shape as a course price: the locale decides which currency is shown. */
  price: CoursePrice;
  /** What fits in this length. Kept per option: half an hour cannot hold three promises. */
  includes: readonly L10n[];
  /**
   * What this length adds over the one before it in `options`, and nothing that is already there.
   *
   * The owner's instruction about this screen is «нужно обязательно посветить что тренировка за 60
   * минут даст по сравнению с 30» — the comparison is the argument, so it is content rather than
   * something the screen works out. Printing the longer option's full list again would make the
   * reader diff two lists to find the two lines that differ; this is those two lines. Undefined on
   * the cheapest option, which has nothing to be compared against.
   */
  adds?: readonly L10n[];
  /**
   * Payment page per locale. Empty until it exists.
   *
   * It must be a link to a **product with the price locked on the processor's side** — on Prodamus,
   * a payment link made from a product or tariff, not the shop's open form. Nothing here sends an
   * amount: the app appends the customer's email and nothing else, on purpose, because this site is
   * static and public and a price carried in a URL is a price the payer can edit. If the page this
   * opens shows a «сумма» field the customer can type into, the link is the wrong one and the app's
   * «Оплатить 3 500 ₽» button is writing a cheque the payment page will not honour. See
   * docs/SETUP.md §7.1 and §7.3.
   */
  paymentUrl: PaymentUrl;
}

/*
 * Two promises, not three: half an hour holds a technique review and the questions that come out
 * of it. Rewriting the programme is the hour's job, and promising it here would sell a session
 * that cannot deliver what it advertised.
 */
const HALF_INCLUDES: readonly L10n[] = [
  {
    ru: 'Разбор техники по твоим видео или вживую',
    en: 'Technique review, from your videos or live',
  },
  {
    ru: 'Ответы на вопросы по текущей программе',
    en: 'Your questions about the programme you are on',
  },
];

/*
 * And what the extra half-hour buys on top of that — the hour's whole case for itself. Written
 * once, here: the hour's own `includes` is this list appended to the half's, so the two can never
 * drift into claiming different things, and the screen shows only this part when the switch moves
 * to 60.
 */
const HOUR_ADDS: readonly L10n[] = [
  {
    ru: 'Корректировка программы под цель, оборудование и ограничения',
    en: 'Program adjusted to your goal, equipment and limitations',
  },
  {
    ru: 'План на следующие недели, а не только на сегодня',
    en: 'A plan for the next weeks, not only for today',
  },
];

const HALF: BookingOption = {
  id: 'half',
  name: { ru: 'Полчаса с тренером', en: 'Half an hour with the coach' },
  durationMin: 30,
  price: { rub: 2500, usd: 29 },
  includes: HALF_INCLUDES,
  paymentUrl: { ru: 'https://payform.ru/9jcyga8/' },
};

const HOUR: BookingOption = {
  id: 'hour',
  name: { ru: 'Час с тренером', en: 'An hour with the coach' },
  durationMin: 60,
  price: { rub: 3500, usd: 39 },
  includes: [...HALF_INCLUDES, ...HOUR_ADDS],
  adds: HOUR_ADDS,
  paymentUrl: { ru: 'https://payform.ru/cpcygbP/' },
};

export const BOOKING = {
  /** Hide the offer everywhere without deleting the copy. */
  enabled: true,
  /** Cheapest first — the booking screen shows them in this order. */
  options: [HALF, HOUR] as readonly BookingOption[],
  format: { ru: 'Онлайн, по видеосвязи', en: 'Online, over video' } satisfies L10n,
  /**
   * What an hour with *him* gives, as against an hour with a coach.
   *
   * Three lines, and not one of them is a new claim: the first is `HALF_INCLUDES[0]` said as an
   * outcome, the second is `HOUR_ADDS[0]` plus the conditioning work in `COACH.bio`, the third is
   * the direction both lengths end with (`HALF_INCLUDES[1]`, `HOUR_ADDS[1]`). No numbers, no
   * results, no promises about anybody's body — everything here is about what happens in the
   * session, which is the only thing the product controls.
   */
  outcomes: [
    {
      ru: 'Технику смотрит человек: видит, как ты двигаешься, и правит на месте',
      en: 'A person watches your technique: sees how you move and fixes it there and then',
    },
    {
      ru: 'Нагрузку ставит под тело, которое перед ним: цель, оборудование, ограничения',
      en: 'Load set for the body in front of him: your goal, your equipment, your limits',
    },
    {
      ru: 'После занятия понятно, что делать в следующие недели',
      en: 'You leave knowing what to do in the weeks after',
    },
  ] as readonly L10n[],
  /**
   * How close to the start a session can still be taken, in minutes.
   *
   * The owner's own promise — «забронировать тренировку хоть за 15 минут до тренировки прямо с
   * черешки» — and the number the screen quotes. It is honoured by whichever half of the flow is
   * live: the slot page below when there is one, the coach answering when there is not. Raise it
   * the day that stops being true rather than letting the screen keep the old figure.
   */
  leadTimeMin: 15,
  /** Shown under the button; keep it a fact the coach honours. */
  reschedule: {
    ru: 'Перенос — не позднее чем за 24 часа до занятия',
    en: 'Reschedule up to 24 hours before the session',
  } satisfies L10n,
  /**
   * Slot picker the client opens after paying — a Google Calendar appointment page is enough.
   *
   * Empty → the button is not drawn and the coach agrees the time in a message instead, which is
   * the missing half of «оплатил → выбрал время». The booking screen states that outright rather
   * than ending on a paid button with nothing after it: pay, then write, and he sets the time.
   * Filled, the same screen offers the slot page as the step straight after payment and the
   * «хоть за {leadTimeMin} минут» promise stops depending on him being at his phone.
   */
  scheduleUrl: '' as string,
} as const;

/**
 * The price every passing mention of the offer quotes, as «от …».
 *
 * Derived rather than written down: a third length, or a change to either price, must never leave
 * the landing page advertising a number nothing is sold at.
 */
export function bookingFromPrice(): CoursePrice {
  const first = BOOKING.options[0];
  if (!first) return { rub: 0, usd: 0 };
  return BOOKING.options.reduce((min, o) => (o.price.rub < min.price.rub ? o : min), first).price;
}
