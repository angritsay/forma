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

/**
 * One reason to book, written the way the person would say it to themselves.
 *
 * Two parts, because a job-to-be-done has two: the thing that happens (`title`) and what it
 * actually looks like (`body`). One line trying to carry both is how the old version ended up as
 * «Нагрузку ставит под тело, которое перед ним: цель, оборудование, ограничения» — accurate,
 * compressed, and read by nobody.
 */
export interface BookingOutcome {
  /** The job itself, as a short clause. Set at reading size, not as a kicker. */
  title: L10n;
  /** What it means in practice: one or two sentences in the words a person uses. */
  body: L10n;
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
 * And what the extra half-hour buys on top of that. Written once, here, and appended to the half's
 * list to make the hour's — so the two can never drift into claiming different things.
 *
 * The booking screen used to show *only* this part under «60», headed «Сверх 30 минут», with the
 * price gap beside the price. The owner struck those texts, so the screen prints the hour's whole
 * four-line list instead. This constant stays because it is still what composes that list.
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
   * **Rewritten on the owner's instruction**, and the instruction is worth keeping in front of
   * whoever edits this next: «перепиши понятным языком, типо тренер может скорректировать технику
   * выполнения для достижения максимального результата без травмы. Ну то есть реальные jtbd
   * написать понятным языком». The old three lines were each a single compressed clause with a
   * colon in it — the register of a specification, not of somebody explaining why they would pay.
   * These are the same three facts said out loud, with the concrete detail that makes them mean
   * something: not «разбор техники» but which mistake he is looking at.
   *
   * Not one of them is a new claim. The first is `HALF_INCLUDES[0]`, the second `HOUR_ADDS[0]`
   * plus the conditioning work in `COACH.bio`, the third `HALF_INCLUDES[1]` and `HOUR_ADDS[1]`.
   *
   * **Where the line is on «без травмы».** The first outcome says bad technique costs results and
   * eventually hurts, which is the reason technique coaching exists and is said about training in
   * general — it is not a promise that a session prevents injury, and it is certainly not a claim
   * that any Forma programme is safe for a particular back. That distinction is the same one
   * `content/site/coach.ts` draws in its header, and it is the one that has to hold: everything
   * here is about what happens *in the session*, which is the only thing the product controls.
   */
  outcomes: [
    {
      title: {
        ru: 'Кто-то наконец смотрит, как ты делаешь',
        en: 'Somebody finally watches you do it',
      },
      body: {
        ru: 'Ты показываешь упражнение, он видит круглую спину или колено, уходящее внутрь, и правит на месте. Кривая техника сначала забирает результат, а потом начинает болеть — и сам по видео в интернете ты этого не поймаешь.',
        en: 'You do the movement, he sees the rounded back or the knee caving in, and fixes it on the spot. Bad technique takes your results first and starts to hurt later — and you will not catch it yourself from a video online.',
      },
    },
    {
      title: {
        ru: 'Нагрузку считают под тебя, а не под всех',
        en: 'The load is worked out for you, not for everyone',
      },
      body: {
        ru: 'Не «делай двадцать приседаний», а сколько, как часто и с чем именно тебе — под твою цель, под то, что есть дома, и под то, что пока не получается или болит.',
        en: 'Not "do twenty squats", but how many, how often and with what — for your goal, the kit you actually have at home, and whatever does not work or aches yet.',
      },
    },
    {
      title: {
        ru: 'Уходишь с ответом, что делать дальше',
        en: 'You leave knowing what comes next',
      },
      body: {
        ru: 'Вопросы, которые копились месяц, закрываются за один разговор, и дальше ты знаешь не только сегодняшнюю тренировку, а что добавить и когда прибавлять в ближайшие недели.',
        en: 'A month of questions gets answered in one conversation, and you come away knowing more than today’s session: what to add and when to push in the weeks ahead.',
      },
    },
  ] as readonly BookingOutcome[],
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
