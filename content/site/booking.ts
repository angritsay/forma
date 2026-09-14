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

const HALF: BookingOption = {
  id: 'half',
  name: { ru: 'Полчаса с тренером', en: 'Half an hour with the coach' },
  durationMin: 30,
  price: { rub: 2500, usd: 29 },
  /*
   * Two promises, not three: half an hour holds a technique review and the questions that come out
   * of it. Rewriting the programme is the hour's job, and promising it here would sell a session
   * that cannot deliver what it advertised.
   */
  includes: [
    {
      ru: 'Разбор техники по твоим видео или вживую',
      en: 'Technique review, from your videos or live',
    },
    {
      ru: 'Ответы на вопросы по текущей программе',
      en: 'Your questions about the programme you are on',
    },
  ],
  paymentUrl: { ru: 'https://payform.ru/9jcyga8/' },
};

const HOUR: BookingOption = {
  id: 'hour',
  name: { ru: 'Час с тренером', en: 'An hour with the coach' },
  durationMin: 60,
  price: { rub: 3500, usd: 39 },
  includes: [
    {
      ru: 'Разбор техники по твоим видео или вживую',
      en: 'Technique review, from your videos or live',
    },
    {
      ru: 'Корректировка программы под цель, оборудование и ограничения',
      en: 'Program adjusted to your goal, equipment and limitations',
    },
    {
      ru: 'Ответы на вопросы — план на следующие недели',
      en: 'Your questions — a plan for the next weeks',
    },
  ],
  paymentUrl: { ru: 'https://payform.ru/cpcygbP/' },
};

export const BOOKING = {
  /** Hide the offer everywhere without deleting the copy. */
  enabled: true,
  /** Cheapest first — the booking screen shows them in this order. */
  options: [HALF, HOUR] as readonly BookingOption[],
  format: { ru: 'Онлайн, по видеосвязи', en: 'Online, over video' } satisfies L10n,
  /** Shown under the button; keep it a fact the coach honours. */
  reschedule: {
    ru: 'Перенос — не позднее чем за 24 часа до занятия',
    en: 'Reschedule up to 24 hours before the session',
  } satisfies L10n,
  /**
   * Slot picker the client opens after paying — a Google Calendar appointment page is enough.
   * Empty → the button is not drawn and the coach writes to the client instead, which is the
   * missing half of «оплатил → выбрал время».
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
