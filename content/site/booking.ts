/**
 * One-to-one session with the coach, bookable from the app and the coach card on the landing.
 *
 * This is the only place the business asks for the coach's time, and it is priced as his time:
 * the client pays for the hour, the session is agreed with a person. Nothing else in the product
 * depends on him being available, so an empty calendar costs nothing and a full one is his to fill.
 *
 * `paymentUrl` follows the course rule (docs/SETUP.md §7.1): an absolute https link per locale, the
 * signed-in email is appended as `?email=`, anything else is ignored. Without a link the app offers
 * a message to the coach instead of a payment button. `scheduleUrl` is where the client picks a slot
 * after paying (a Google Calendar appointment page, a Telegram link); optional.
 */
import type { L10n, PaymentUrl } from '@/content/schema';
import type { CoursePrice } from './pricing';

export const BOOKING = {
  /** Hide the offer everywhere without deleting the copy. */
  enabled: true,
  durationMin: 60,
  /** Same shape as a course price: the locale decides which currency is shown. */
  price: { rub: 3500, usd: 39 } as CoursePrice,
  format: { ru: 'Онлайн, по видеосвязи', en: 'Online, over video' } satisfies L10n,
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
  ] as L10n[],
  /** Shown under the button; keep it a fact the coach honours. */
  reschedule: {
    ru: 'Перенос — не позднее чем за 24 часа до занятия',
    en: 'Reschedule up to 24 hours before the session',
  } satisfies L10n,
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
  paymentUrl: { ru: 'https://payform.ru/jncx6bM/' } as PaymentUrl,
  /**
   * Slot picker the client opens after paying — a Google Calendar appointment page is enough.
   * Empty → the button is not drawn and the coach writes to the client instead, which is the
   * missing half of «оплатил → выбрал время».
   */
  scheduleUrl: '' as string,
} as const;
