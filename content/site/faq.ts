/**
 * Landing FAQ (home page + FAQPage JSON-LD). Answers describe how the product actually works;
 * numbers come from config so they never drift from the policies.
 */
import type { FaqItem } from '@/content/schema';
import { BRAND } from './brand';
import { LINKS } from './links';
import { BOOKING, bookingFromPrice } from './booking';
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
            ru: `Да. В приложении есть занятие один на один по видеосвязи — полчаса или час, от ${formatPrice('ru', bookingFromPrice())}: разбор техники, корректировка программы, ответы на вопросы. Курсы при этом не требуют участия тренера: программа адаптируется сама.`,
            en: `Yes. The app offers a one-to-one session over video — half an hour or an hour, from ${formatPrice('en', bookingFromPrice())}: technique review, program adjustments, your questions. The courses themselves need no coach involvement: the program adapts on its own.`,
          },
        },
      ]
    : []),
  {
    q: { ru: 'Как я получу доступ к курсу?', en: 'How do I get access to a course?' },
    a: {
      ru: 'На странице курса оставь e-mail и оплати. Доступ откроется сам сразу после оплаты — курс появится в приложении под этой почтой. Купленный курс — навсегда. Клуб с заданием на каждый день и курс вместе — по подписке, помесячно или на год.',
      en: 'Leave your email on the course page and pay. Access opens automatically right after the payment — the course shows up in the app under that email. A bought course is yours for life. The club with a task every day comes together with the course by subscription, monthly or annual.',
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
      ru: 'Нет. «Форма с нуля» — без оборудования: хватит коврика и устойчивого стула. Если движение пока не получается, приложение заменит его более простым.',
      en: 'No. Forma. Start uses no equipment: a mat and a sturdy chair are enough. If a movement is not there yet, the app swaps it for a simpler one.',
    },
  },
  {
    q: { ru: 'Я новичок. С чего начать?', en: 'I am a beginner. Where do I start?' },
    a: {
      ru: 'С курса «Форма с нуля» — он для новичков и тех, кто возвращается после перерыва. При первом входе ты ответишь на пять коротких вопросов, а после второй тренировки приложение предложит тест из пяти движений: приседания, отжимания, подъёмы корпуса, выпады и планку. По нему оно уточнит уровень и нагрузку.',
      en: 'With Forma. Start — it is made for beginners and for anyone coming back after a break. On first login you answer five short questions, and after your second workout the app offers a test of five movements: squats, push-ups, sit-ups, lunges and a plank. It uses them to fine-tune your level and load.',
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
