/**
 * Landing FAQ (home page + FAQPage JSON-LD): ten questions in the order the page tells the story —
 * what is free, how to get in, course or club, starting together, the +30 days, the weekly prize,
 * the coach, auto-renewal, equipment, refunds (site synthesis §2, S9).
 *
 * Answers describe how the product actually works, and **every figure is read from its file**:
 * the course's price from `content/courses/start.ts`, the club's year and month from `plans.ts`
 * (`planMonthlyPrice`, so «666 ₽» is always the year divided by twelve and is never printed
 * without the year's price beside it), the coach's two lengths from `booking.ts`, the refund window
 * from `pricing.ts`. English quotes the club's year only, as every EN surface does (`clubPrice.ts`).
 *
 * Two owner rules are written into the wording, not left to taste:
 * - **The pair is not a promotion.** +30 days each happens when a friend pays for the club through
 *   a personal link, and the weekly prize is an hour with the coach for each of a winning pair.
 *   Nothing here promises an hour for joining together.
 * - **Coach sessions are not refunded.** A session can be moved when the coach is told at least 24
 *   hours ahead — the same line `SessionTickets` prints under the tickets.
 *
 * A question whose product is switched off (`BOOKING.enabled`, `PLANS_ENABLED`) drops out rather
 * than describing something that cannot be bought.
 */
import type { FaqItem, L10n } from '@/content/schema';
import { l, t } from '@/i18n/index';
import { COURSE_START } from '../courses/start';
import { BOOKING, type BookingOption } from './booking';
import { CLUB_PLAN_ID, PLAN_BY_ID, PLANS, PLANS_ENABLED, planMonthlyPrice } from './plans';
import { formatPrice, PRICING, type CoursePrice } from './pricing';

/** Both locales' spelling of one price. */
function both(price: CoursePrice): L10n {
  return { ru: formatPrice('ru', price), en: formatPrice('en', price) };
}

const course = both(COURSE_START.price);
const courseName: L10n = {
  ru: l(COURSE_START.shortName, 'ru'),
  en: l(COURSE_START.shortName, 'en'),
};
const clubPlan = PLANS_ENABLED ? PLAN_BY_ID.get(CLUB_PLAN_ID) : undefined;
const thirtyDays = PLANS.find((p) => p.period === 'month' && p.id !== CLUB_PLAN_ID);

const half = BOOKING.options.find((o) => o.id === 'half');
const hour = BOOKING.options.find((o) => o.id === 'hour');

/** «Оплати и выбери время» when the length has a slot page, else the coach sets the time. */
function howToBook(o: BookingOption): L10n {
  return o.scheduleUrl || BOOKING.scheduleUrl
    ? { ru: 'оплати и выбери время', en: 'pay and pick a time' }
    : {
        ru: 'оплати и напиши — время поставит тренер',
        en: 'pay and send a message — the coach sets the time',
      };
}

const courseOrClub: FaqItem[] = clubPlan
  ? [
      {
        q: { ru: 'Курс или клуб?', en: 'Course or club?' },
        a: {
          ru: `Курс — 20 тренировок навсегда за ${course.ru}, и неделя клуба в подарок. Клуб — задание в день, серия, таблица недели и приз; курс уже внутри. ${formatPrice('ru', planMonthlyPrice(clubPlan))} в месяц — это одна оплата ${formatPrice('ru', clubPlan.price)} за год.`,
          en: `The course is 20 workouts for life for ${course.en}, with a week of the club as a gift. The club is a task a day, a streak, the weekly board and a prize, with the course inside. It is one payment of ${formatPrice('en', clubPlan.price)} for a year.`,
        },
      },
    ]
  : [];

const together: FaqItem = {
  q: { ru: 'Как начать вместе?', en: 'How do we start together?' },
  a: {
    ru: `Возьми ссылку в блоке «Вместе с понедельника» на этой странице — регистрироваться не нужно. В понедельник каждый делает тренировку 1 у себя дома. В клубе можно стать парой: в приложении — Клуб → Дуо → «${t('ru', 'app.duoInvite')}».`,
    en: `Take the link from the “Together from Monday” block on this page — no sign-up needed. On Monday each of you does workout 1 at home. In the club you can become a pair: in the app, Club → Duo → “${t('en', 'app.duoInvite')}”.`,
  },
};

const pairAndPrize: FaqItem[] = clubPlan
  ? [
      {
        q: { ru: 'Что за +30 дней?', en: 'What are the +30 days?' },
        a: {
          ru: 'Когда человек по твоей личной ссылке оплатит клуб — на 30 дней или на год, — вы оба получаете по 30 дней клуба. Если друг уже был в клубе, бонус не начисляется. До 12 наград в год. Это не скидка: цена та же, дней больше.',
          en: 'When someone pays for the club through your personal link — for 30 days or for a year — you both get 30 days of the club. No bonus if your friend has been in the club before. Up to 12 rewards a year. It is not a discount: the price is the same, the days are more.',
        },
      },
      {
        q: { ru: 'Что за приз недели?', en: 'What is the weekly prize?' },
        a: {
          ru: 'Час один на один с Сергеем. Кто наверху таблицы в воскресенье, получает его; в дуо — каждый из пары. Победителя объявляет тренер.',
          en: 'An hour one-to-one with Sergey. Whoever tops the board on Sunday gets it; in a duo, each of the pair. The coach announces the winner.',
        },
      },
    ]
  : [];

const coach: FaqItem[] =
  BOOKING.enabled && half && hour
    ? [
        {
          q: {
            ru: 'Можно заниматься с тренером лично?',
            en: 'Can I train with the coach one-to-one?',
          },
          a: {
            ru: `Да, онлайн: полчаса — ${formatPrice('ru', half.price)}, час — ${formatPrice('ru', hour.price)}. Полчаса: ${howToBook(half).ru}. Час: ${howToBook(hour).ru}. Возврата нет — занятие можно перенести, если написать не позднее чем за 24 часа.`,
            en: `Yes, online: half an hour is ${formatPrice('en', half.price)}, an hour ${formatPrice('en', hour.price)}. Half an hour: ${howToBook(half).en}. An hour: ${howToBook(hour).en}. No refunds — a session can be moved if you write at least 24 hours ahead.`,
          },
        },
      ]
    : [];

const autoRenewal: FaqItem[] = clubPlan
  ? [
      {
        q: { ru: 'Есть автосписание?', en: 'Is there auto-renewal?' },
        a: {
          ru: `Нет. Доступ ${thirtyDays ? 'на 30 дней или на год' : 'на год'} оплачивается один раз и просто заканчивается — отменять нечего.`,
          en: `No. ${thirtyDays ? 'Thirty days or a year of access is' : 'A year of access is'} paid once and simply ends — there is nothing to cancel.`,
        },
      },
    ]
  : [];

const free: FaqItem = {
  q: { ru: 'Что бесплатно?', en: 'What is free?' },
  a: {
    ru: `Первая тренировка курса «${courseName.ru}» — без карты, и её можно повторять. Нужны только почта и код из письма.`,
    en: `The first workout of the ${courseName.en} course — no card, and you can repeat it. All it takes is your email and the code we send to it.`,
  },
};

const signIn: FaqItem = {
  q: { ru: 'Как войти?', en: 'How do I sign in?' },
  a: {
    ru: 'По почте: приходит код из 6 цифр, пароля нет. Приложение работает в браузере — скачивать ничего не нужно, его можно добавить на экран «Домой». Telegram подключается после входа, чтобы получать сообщения клуба.',
    en: 'With your email: a 6-digit code arrives, and there is no password. The app runs in the browser — nothing to download, and you can add it to your home screen. Telegram is connected after sign-in, for the club’s messages.',
  },
};

export const FAQ: FaqItem[] = [
  free,
  signIn,
  ...courseOrClub,
  together,
  ...pairAndPrize,
  ...coach,
  ...autoRenewal,
  {
    q: { ru: 'Нужно ли оборудование?', en: 'Do I need equipment?' },
    a: {
      ru: 'Нет: устойчивый стул и коврик. Прыжков и бёрпи в курсе нет.',
      en: 'No: a sturdy chair and a mat. There are no jumps and no burpees in the course.',
    },
  },
  {
    q: { ru: 'Можно вернуть деньги?', en: 'Can I get a refund?' },
    a: {
      ru: `За курс — в течение ${PRICING.refundDays} дней после открытия доступа, за клуб — после оплаты, если сделано меньше ${PRICING.refundMaxCompletedWorkouts} тренировок. Занятие с тренером не возвращается — его можно перенести.`,
      en: `For the course — within ${PRICING.refundDays} days of access opening, for the club — of payment, if fewer than ${PRICING.refundMaxCompletedWorkouts} workouts are done. A coach session is not refunded — it can be moved.`,
    },
  },
];

/**
 * The homepage keeps five of them — what is free, how to get in, course or club, starting
 * together, auto-renewal — and its FAQPage JSON-LD is built from the same five, so the markup
 * never describes a question the page does not show. The rest stay in `FAQ` for the inner pages.
 */
export const HOME_FAQ: FaqItem[] = [free, signIn, ...courseOrClub, together, ...autoRenewal];
