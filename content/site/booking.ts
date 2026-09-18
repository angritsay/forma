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
 * Calendar appointment page, a Telegram link); optional. It can be set per length, because a Google
 * appointment schedule holds one duration and the two lengths are therefore two pages, and once on
 * `BOOKING` as the fallback for a tool that asks the visitor to choose a length itself.
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
  /**
   * Slot page for **this length**, overriding `BOOKING.scheduleUrl`.
   *
   * It exists because of how the tool on the other end actually works: a Google Calendar
   * appointment schedule carries **one duration**, set on the schedule itself. So half an hour and
   * an hour are two separate schedules with two separate links, and one shared field cannot hold
   * them — whichever link it held, the other length would send a client who had just paid to a page
   * offering the duration they did not buy.
   *
   * Empty falls back to `BOOKING.scheduleUrl`, which stays right for a booking tool that does ask
   * the visitor to choose a length on its own page.
   */
  scheduleUrl?: string;
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
   * What an hour with him gives — **in his own voice, first person, short.**
   *
   * Two instructions from the owner, in order. First «перепиши понятным языком… реальные jtbd»,
   * which turned three compressed clauses-with-a-colon into three jobs with a concrete detail
   * each. Then, looking at the result on a phone: «эти тексты должны быть как от Серёжи и
   * покороче и человеческим языком».
   *
   * She is right about both halves. The block sat directly under his photograph and his
   * credentials and then talked about him in the third person — «он видит круглую спину» — which
   * is a brochure describing a man who is standing right there. And at that length it was three
   * paragraphs on a screen whose whole job is to make one decision. So: «я», and roughly half the
   * words.
   *
   * **The voice is a constraint, not a decoration.** Everything here is now a sentence Sergey
   * would have to be willing to say to a client, which rules out anything he could not deliver in
   * a session — no promises about a body, no outcome after N weeks, nothing about what the courses
   * cure. If a line cannot be said in the first person without becoming a boast or a medical
   * claim, it does not belong in this array.
   *
   * Not one of them is a new claim. The first is `HALF_INCLUDES[0]`, the second `HOUR_ADDS[0]`
   * plus the conditioning work in `COACH.bio`, the third `HALF_INCLUDES[1]` and `HOUR_ADDS[1]`.
   *
   * **Where the line is on «без травмы».** The first outcome says bad technique costs results and
   * eventually hurts, which is the reason technique coaching exists and is said about training in
   * general — it is not a promise that a session prevents injury, and it is certainly not a claim
   * that any Forma programme is safe for a particular back. That distinction is the same one
   * `content/site/coach.ts` draws in its header, and it survives the move into the first person:
   * «поправлю» is something he does in the session, «вылечу» would not be.
   */
  outcomes: [
    {
      title: { ru: 'Смотрю, как ты двигаешься', en: 'I watch how you move' },
      body: {
        ru: 'Покажешь упражнение — увижу круглую спину или колено внутрь и поправлю сразу. Кривая техника сначала съедает результат, а потом начинает болеть.',
        en: 'Show me the movement and I will see the rounded back or the knee caving in, and fix it there and then. Bad technique eats your results first and starts to hurt later.',
      },
    },
    {
      title: { ru: 'Считаю нагрузку под тебя', en: 'I work out the load for you' },
      body: {
        ru: 'Не «двадцать приседаний всем», а сколько и с чем именно тебе — под цель, под то, что есть дома, и под то, что пока болит.',
        en: 'Not "twenty squats for everyone", but how many and with what for you — your goal, the kit you have at home, and whatever still aches.',
      },
    },
    {
      title: { ru: 'Скажу, что делать дальше', en: 'I tell you what comes next' },
      body: {
        ru: 'Разберём всё, что накопилось, и ты уйдёшь с планом на ближайшие недели, а не с одной тренировкой.',
        en: 'We go through everything that has piled up, and you leave with a plan for the coming weeks, not one workout.',
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
   *
   * **The fallback, not the usual answer.** With Google Calendar each length is its own appointment
   * schedule with its own link, so those go on the options and this stays empty. Set this one only
   * for a booking page that asks the visitor to pick the length itself.
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
