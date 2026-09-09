/**
 * Landing FAQ (home page + FAQPage JSON-LD). Answers describe how the product actually works;
 * numbers come from config so they never drift from the policies.
 */
import type { FaqItem } from '@/content/schema';
import { BRAND } from './brand';
import { LINKS } from './links';
import { BOOKING } from './booking';
import { formatPrice, PRICING } from './pricing';

const supportEmail = LINKS.supportEmail || BRAND.contactEmail;
const hasTelegram = Boolean(LINKS.supportTelegram || BRAND.telegram);

export const FAQ: FaqItem[] = [
  ...(BOOKING.enabled
    ? [
        {
          q: {
            ru: 'Можно позаниматься с тренером лично?',
            en: 'Can I train with the coach one-to-one?',
          },
          a: {
            ru: `Да. В приложении есть занятие один на один: ${BOOKING.durationMin} минут по видеосвязи за ${formatPrice('ru', BOOKING.price)} — разбор техники, корректировка программы, ответы на вопросы. Курсы при этом не требуют участия тренера: программа адаптируется сама.`,
            en: `Yes. The app offers a one-to-one session: ${BOOKING.durationMin} minutes over video for ${formatPrice('en', BOOKING.price)} — technique review, program adjustments, your questions. The courses themselves need no coach involvement: the program adapts on its own.`,
          },
        },
      ]
    : []),
  {
    q: { ru: 'Как я получу доступ к курсу?', en: 'How do I get access to a course?' },
    a: {
      ru: 'На странице курса оставь e-mail. Мы записываем связку «почта — курс», тренер подтверждает доступ, и курс появляется в приложении под этой почтой. Купленный курс — навсегда. Если нужны все курсы сразу, есть подписка — помесячно или на год.',
      en: 'Leave your email on the course page. We record the email–course pair, the coach confirms access, and the course shows up in the app under that email. A bought course is yours for life. If you want every course at once, there is a subscription — monthly or annual.',
    },
  },
  {
    q: {
      ru: 'Что за код по почте? Нужен ли пароль?',
      en: 'What is the email code? Do I need a password?',
    },
    a: {
      ru: 'Пароля нет. При входе в приложение ты вводишь e-mail, получаешь шестизначный код письмом и подтверждаешь его. Если письмо не пришло — проверь «Спам»; новый код можно запросить через минуту.',
      en: 'There is no password. To sign in you enter your email, receive a six-digit code by email and confirm it. If the email did not arrive, check spam; you can request a new code after a minute.',
    },
  },
  {
    q: {
      ru: 'На каких устройствах работает приложение?',
      en: 'Which devices does the app work on?',
    },
    a: {
      ru: 'В любом современном браузере: на телефоне, планшете и компьютере. Устанавливать ничего не нужно — открой ссылку и войди. Прогресс хранится в аккаунте, поэтому можно свободно переключаться между устройствами.',
      en: 'Any modern browser on a phone, tablet or computer. Nothing to install: open the link and sign in. Progress is stored in your account, so you can switch devices freely.',
    },
  },
  {
    q: { ru: 'Нужно ли оборудование?', en: 'Do I need equipment?' },
    a: {
      ru: 'Зависит от курса. Часть программ полностью без оборудования, для остальных нужны гантели, гиря, турник или скакалка — список есть на странице каждого курса. Если чего-то нет, приложение подберёт замену упражнению.',
      en: 'It depends on the course. Some programs use no equipment at all; others need dumbbells, a kettlebell, a pull-up bar or a jump rope — each course page lists what it needs. If something is missing, the app substitutes the exercise.',
    },
  },
  {
    q: { ru: 'Я новичок. С чего начать?', en: 'I am a beginner. Where do I start?' },
    a: {
      ru: 'При первом входе ты ответишь на несколько вопросов и сделаешь три простых теста: отжимания, приседания за минуту и планку. По ним приложение определит уровень и стартовую нагрузку. Начинать лучше с курса первого уровня.',
      en: 'On first login you answer a few questions and do three simple tests: push-ups, air squats in a minute and a plank. The app uses them to set your level and starting load. A level-1 course is the right place to begin.',
    },
  },
  {
    q: { ru: 'Можно ли вернуть деньги?', en: 'Can I get a refund?' },
    a: {
      ru: `Да, в течение ${PRICING.refundDays} дней после активации доступа, если ты выполнил меньше ${PRICING.refundMaxCompletedWorkouts} тренировок курса. Как это сделать — в политике возврата.`,
      en: `Yes, within ${PRICING.refundDays} days of activation if you have completed fewer than ${PRICING.refundMaxCompletedWorkouts} workouts of the course. The refund policy explains how.`,
    },
  },
  {
    q: {
      ru: 'Куда писать, если что-то не работает?',
      en: 'Where do I write if something does not work?',
    },
    a: {
      ru: `На ${supportEmail}${hasTelegram ? ' или в Telegram' : ''}. Укажи почту, с которой оформлял доступ, — так мы быстрее найдём заказ. Отвечаем в порядке очереди.`,
      en: `Email ${supportEmail}${hasTelegram ? ' or message us on Telegram' : ''}. Mention the email you ordered with so we can find the order quickly. We answer in the order received.`,
    },
  },
];
