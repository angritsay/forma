/**
 * Homepage FAQ (and its FAQPage JSON-LD): five questions in the order the page tells the story —
 * what is free, how to get in, course or club, starting together, auto-renewal (site synthesis
 * §2, S9). The pair, the prize and the coach's sessions are answered on their own pages and in
 * the terms, not here.
 *
 * Answers describe how the product actually works, and **every figure is read from its file**:
 * the course's price from `content/courses/start.ts`, the club's year and month from `plans.ts`
 * (`planMonthlyPrice`, so «666 ₽» is always the year divided by twelve and is never printed
 * without the year's price beside it). English quotes the club's year only, as every EN surface
 * does (`clubPrice.ts`).
 *
 * The owner's rule that **the pair is not a promotion** is written into the wording, not left to
 * taste: nothing here promises an hour for joining together.
 *
 * A question whose product is switched off (`PLANS_ENABLED`) drops out rather than describing
 * something that cannot be bought.
 */
import type { FaqItem, L10n } from '@/content/schema';
import { l, t } from '@/i18n/index';
import { COURSE_START } from '../courses/start';
import { CLUB_PLAN_ID, PLAN_BY_ID, PLANS, PLANS_ENABLED, planMonthlyPrice } from './plans';
import { formatPrice, type CoursePrice } from './pricing';

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

const courseOrClub: FaqItem[] = clubPlan
  ? [
      {
        q: { ru: 'Курс или клуб?', en: 'Course or club?' },
        a: {
          ru: `Курс — 20 тренировок навсегда за ${course.ru}, и неделя клуба в подарок. Клуб — задание в день, серия, таблица недели и приз; курс уже внутри. ${formatPrice('ru', planMonthlyPrice(clubPlan))} в месяц — это одна оплата ${formatPrice('ru', clubPlan.price)} за год.`,
          en: `The course is 20 workouts with no time limit for ${course.en}, with a week of the club as a gift. The club is a task a day, a streak, the weekly board and a prize, with the course inside. It is one payment of ${formatPrice('en', clubPlan.price)} for a year.`,
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

/**
 * The homepage's five, in its order, and its FAQPage JSON-LD is built from the same five, so the
 * markup never describes a question the page does not show.
 */
export const HOME_FAQ: FaqItem[] = [free, signIn, ...courseOrClub, together, ...autoRenewal];
