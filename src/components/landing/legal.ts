/**
 * Legal documents (privacy policy, public offer, refund policy) as bilingual content.
 * Numbers and contacts are interpolated from content/site config so the pages never drift from it.
 * These are templates for a lawyer to review — see docs/LEGAL.md.
 */
import type { L10n } from '@/content/schema';
import { BRAND } from '@content/site/brand';
import { LINKS } from '@content/site/links';
import { PRICING } from '@content/site/pricing';

export interface LegalSection {
  id: string;
  heading: L10n;
  paragraphs?: L10n[];
  bullets?: L10n[];
  /** Paragraphs rendered after the bullet list. */
  after?: L10n[];
}

export interface LegalDocument {
  sections: LegalSection[];
}

const org = BRAND.organization;
const brand = BRAND.name;
const email = LINKS.supportEmail || BRAND.contactEmail;
const days = PRICING.refundDays;
const maxWorkouts = PRICING.refundMaxCompletedWorkouts;
const age = PRICING.minimumAge;
const notice = PRICING.shutdownNoticeDays;

const region: L10n =
  PRICING.dataRegion === 'eu'
    ? { ru: 'в регионе Европейского союза', en: 'in the European Union region' }
    : { ru: 'в регионе США', en: 'in the United States region' };

const metrikaId = import.meta.env.PUBLIC_YANDEX_METRIKA_ID;
const gaId = import.meta.env.PUBLIC_GA_ID;
const analyticsNames = [metrikaId ? 'Яндекс Метрика' : '', gaId ? 'Google Analytics' : '']
  .filter(Boolean)
  .join(', ');
const analyticsNamesEn = [metrikaId ? 'Yandex Metrica' : '', gaId ? 'Google Analytics' : '']
  .filter(Boolean)
  .join(', ');

function cookiesSection(): LegalSection {
  if (analyticsNames) {
    return {
      id: 'cookies',
      heading: { ru: 'Cookies и аналитика', en: 'Cookies and analytics' },
      paragraphs: [
        {
          ru: `Сайт использует ${analyticsNames} для обезличенной статистики посещений: какие страницы открывают, с каких устройств и как долго. Эти сервисы ставят свои cookies и обрабатывают данные по собственным политикам. Ты можешь запретить cookies в настройках браузера — сайт и приложение продолжат работать.`,
          en: `The site uses ${analyticsNamesEn} for anonymous visit statistics: which pages are opened, from which devices and for how long. These services set their own cookies and process data under their own policies. You can block cookies in your browser settings; the site and the app keep working.`,
        },
        {
          ru: 'Приложение хранит в браузере (localStorage) только служебные данные: сессию входа, выбранный язык и незавершённую тренировку. Это не рекламные cookies и они не передаются третьим лицам.',
          en: 'The app keeps only functional data in the browser (localStorage): the login session, the chosen language and an unfinished workout. These are not advertising cookies and are not shared with third parties.',
        },
      ],
    };
  }
  return {
    id: 'cookies',
    heading: { ru: 'Cookies и аналитика', en: 'Cookies and analytics' },
    paragraphs: [
      {
        ru: 'Сайт не использует рекламные и аналитические cookies. Приложение хранит в браузере (localStorage) только служебные данные: сессию входа, выбранный язык и незавершённую тренировку. Они не передаются третьим лицам.',
        en: 'The site uses no advertising or analytics cookies. The app keeps only functional data in the browser (localStorage): the login session, the chosen language and an unfinished workout. They are not shared with third parties.',
      },
    ],
  };
}

export function privacyDocument(): LegalDocument {
  return {
    sections: [
      {
        id: 'general',
        heading: { ru: '1. Общие положения', en: '1. General' },
        paragraphs: [
          {
            ru: `Эта политика описывает, какие персональные данные собирает ${org} (далее — «мы») на сайте ${brand} и в приложении ${brand}, зачем они нужны, где хранятся и какие у тебя есть права. Используя сайт или приложение, ты соглашаешься с этой политикой.`,
            en: `This policy describes which personal data ${org} ("we") collects on the ${brand} website and in the ${brand} app, why it is needed, where it is stored and what rights you have. By using the site or the app you agree to this policy.`,
          },
          {
            ru: `Сервис предназначен для лиц старше ${age} лет. Если тебе меньше — пользуйся им только с согласия родителя или опекуна.`,
            en: `The service is intended for people aged ${age} and over. If you are younger, use it only with the consent of a parent or guardian.`,
          },
        ],
      },
      {
        id: 'data',
        heading: { ru: '2. Какие данные мы собираем', en: '2. What data we collect' },
        bullets: [
          {
            ru: 'E-mail — когда ты оставляешь заявку на курс и когда входишь в приложение по коду.',
            en: 'Email — when you order a course and when you sign in to the app with a code.',
          },
          {
            ru: 'Имя (отображаемое имя) и аватар — ты задаёшь их сам в профиле; они видны другим участникам в таблице лидеров.',
            en: 'Name (display name) and avatar — you set them yourself in your profile; other participants see them on the leaderboard.',
          },
          {
            ru: 'Данные тренировок: ответы опроса при первом входе (возрастная группа, пол и вес — по желанию, опыт, оборудование, ограничения), результаты тестов, выполненные тренировки, оценки усилия и самочувствия, шаги, очки и серии.',
            en: 'Training data: your onboarding answers (age band, optional sex and weight, experience, equipment, limitations), test results, completed workouts, effort and feeling ratings, steps, points and streaks.',
          },
          {
            ru: 'Технические данные: язык интерфейса, время действий и данные сессии, необходимые для работы входа.',
            en: 'Technical data: interface language, timestamps of actions and the session data needed for sign-in to work.',
          },
        ],
      },
      {
        id: 'purposes',
        heading: { ru: '3. Зачем они нужны', en: '3. Why we need it' },
        bullets: [
          {
            ru: 'Открыть доступ к курсу и связать его с твоей почтой.',
            en: 'To open access to a course and link it to your email.',
          },
          {
            ru: 'Вход без пароля — по одноразовому коду на e-mail.',
            en: 'Passwordless sign-in with a one-time code sent to your email.',
          },
          {
            ru: 'Подбор нагрузки: результаты тестов и оценки усилия определяют уровень и корректировки следующей тренировки.',
            en: 'Load adaptation: test results and effort ratings set your level and adjust the next workout.',
          },
          {
            ru: 'Прогресс, статистика, серии и таблица лидеров (в ней видны только имя, аватар и очки — никогда e-mail).',
            en: 'Progress, statistics, streaks and the leaderboard (which shows only name, avatar and points — never your email).',
          },
          {
            ru: 'Поддержка, возвраты и выполнение требований закона.',
            en: 'Support, refunds and compliance with legal requirements.',
          },
        ],
        after: [
          {
            ru: 'Мы не продаём данные и не используем их для рекламы.',
            en: 'We do not sell data and do not use it for advertising.',
          },
        ],
      },
      {
        id: 'storage',
        heading: { ru: '4. Где хранятся данные', en: '4. Where data is stored' },
        paragraphs: [
          {
            ru: `Данные хранятся в Supabase (база данных Postgres, сервис авторизации и файловое хранилище) ${region.ru}. Supabase выступает обработчиком и не использует данные в своих целях. Письма с кодом входа отправляются через почтовый сервис, настроенный в Supabase.`,
            en: `Data is stored in Supabase (a Postgres database, an authentication service and file storage) ${region.en}. Supabase acts as a processor and does not use the data for its own purposes. Sign-in code emails are sent through the email service configured in Supabase.`,
          },
          {
            ru: 'Сам сайт статический и размещён на GitHub Pages; при его открытии хостинг видит стандартные технические данные запроса (IP-адрес, браузер), как любой сайт в интернете.',
            en: 'The site itself is static and hosted on GitHub Pages; when you open it, the host sees the standard technical data of a request (IP address, browser), as with any website.',
          },
          {
            ru: 'Доступ к данным защищён правилами на уровне строк: ты видишь только свои записи. Тренер видит список заявок (e-mail и курс), чтобы подтверждать доступ.',
            en: 'Access to data is protected by row-level rules: you see only your own records. The coach sees the list of orders (email and course) in order to confirm access.',
          },
        ],
      },
      cookiesSection(),
      {
        id: 'retention',
        heading: { ru: '5. Срок хранения', en: '5. Retention' },
        paragraphs: [
          {
            ru: 'Данные хранятся, пока у тебя есть аккаунт и доступ к курсам (доступ пожизненный), либо пока ты не попросишь их удалить. Записи о заявках и возвратах мы храним столько, сколько требует закон о бухгалтерском и налоговом учёте.',
            en: 'Data is kept while you have an account and course access (access is for life) or until you ask us to delete it. Records of orders and refunds are kept as long as accounting and tax law requires.',
          },
        ],
      },
      {
        id: 'rights',
        heading: { ru: '6. Твои права', en: '6. Your rights' },
        bullets: [
          {
            ru: 'Узнать, какие данные о тебе хранятся.',
            en: 'Know which data about you is stored.',
          },
          {
            ru: 'Исправить имя, аватар, язык и данные профиля — прямо в приложении.',
            en: 'Correct your name, avatar, language and profile data — directly in the app.',
          },
          {
            ru: 'Удалить аккаунт и данные тренировок. Учти: вместе с ними удаляется и связь «почта — курс», то есть доступ к курсам.',
            en: 'Delete your account and training data. Note that this also removes the email–course link, i.e. your course access.',
          },
          {
            ru: 'Отозвать согласие на обработку — с этого момента мы прекращаем обработку, кроме случаев, когда обязаны хранить данные по закону.',
            en: 'Withdraw consent — from that moment we stop processing, except where the law requires us to keep the data.',
          },
        ],
        after: [
          {
            ru: `Чтобы воспользоваться правами, напиши на ${email} с почты, привязанной к аккаунту. Отвечаем в порядке очереди.`,
            en: `To exercise these rights, write to ${email} from the email linked to your account. We answer in the order received.`,
          },
        ],
      },
      {
        id: 'changes',
        heading: { ru: '7. Изменения политики', en: '7. Changes to this policy' },
        paragraphs: [
          {
            ru: 'Мы можем обновлять политику. Дата последнего обновления указана вверху страницы; актуальная версия всегда доступна по этому адресу.',
            en: 'We may update this policy. The date of the latest update is shown at the top of the page; the current version is always available at this address.',
          },
        ],
      },
      {
        id: 'contact',
        heading: { ru: '8. Контакты', en: '8. Contact' },
        paragraphs: [
          {
            ru: `${org}, e-mail: ${email}.`,
            en: `${org}, email: ${email}.`,
          },
        ],
      },
    ],
  };
}

export function termsDocument(): LegalDocument {
  return {
    sections: [
      {
        id: 'definitions',
        heading: { ru: '1. Термины', en: '1. Definitions' },
        bullets: [
          {
            ru: `Исполнитель — ${org}, владелец сайта и приложения ${brand}.`,
            en: `Provider — ${org}, the owner of the ${brand} website and app.`,
          },
          {
            ru: 'Пользователь — физическое лицо, оформившее заявку на курс или вошедшее в приложение.',
            en: 'User — an individual who has ordered a course or signed in to the app.',
          },
          {
            ru: 'Курс — цифровая тренировочная программа: последовательность тренировок, тестов и дней отдыха с описаниями, анимациями и, при наличии, видео, доступная в приложении.',
            en: 'Course — a digital training program: a sequence of workouts, tests and rest days with descriptions, animations and, where available, videos, delivered in the app.',
          },
          {
            ru: 'Приложение — веб-приложение по адресу /app/, в котором проходят тренировки.',
            en: 'App — the web application at /app/ where the training happens.',
          },
        ],
      },
      {
        id: 'subject',
        heading: { ru: '2. Предмет оферты', en: '2. Subject' },
        paragraphs: [
          {
            ru: 'Исполнитель предоставляет Пользователю доступ к выбранному Курсу в Приложении, а Пользователь оплачивает его по цене, указанной на странице Курса на момент заявки. Курс — цифровой продукт для самостоятельных занятий; он не является медицинской, физкультурно-оздоровительной или образовательной услугой с индивидуальным сопровождением.',
            en: 'The Provider grants the User access to the chosen Course in the App, and the User pays the price shown on the Course page at the time of the order. The Course is a digital product for self-directed training; it is not a medical, healthcare or educational service with individual supervision.',
          },
          {
            ru: 'Оферта считается принятой (акцепт) в момент, когда Пользователь оставил e-mail на странице Курса и оплатил его, а если Курс бесплатный — в момент заявки.',
            en: 'The offer is accepted when the User leaves an email on the Course page and pays for it, or, for a free Course, at the moment of the order.',
          },
        ],
      },
      {
        id: 'access',
        heading: { ru: '3. Порядок получения доступа', en: '3. How access is granted' },
        bullets: [
          {
            ru: 'Пользователь указывает e-mail на странице Курса. Этот e-mail становится логином в Приложении; пароль не требуется — вход по одноразовому коду из письма.',
            en: 'The User enters an email on the Course page. This email becomes the login for the App; no password is needed — sign-in uses a one-time code from an email.',
          },
          {
            ru: 'После оплаты Исполнитель подтверждает доступ вручную и активирует Курс для указанного e-mail. Обычно это происходит в порядке очереди; о задержках Пользователь может спросить по адресу ниже.',
            en: 'After payment the Provider confirms access manually and activates the Course for that email. This happens in the order received; the User may ask about delays at the address below.',
          },
          {
            ru: 'Курс считается предоставленным в момент активации. С этого момента отсчитывается срок для возврата.',
            en: 'The Course is deemed delivered at the moment of activation. The refund window starts then.',
          },
        ],
      },
      {
        id: 'lifetime',
        heading: { ru: '4. Пожизненный доступ', en: '4. Lifetime access' },
        paragraphs: [
          {
            ru: 'Пожизненный доступ означает: Курс доступен Пользователю без ограничения срока и без дополнительной платы, пока существует Приложение. Обновления Курса (исправления, новые описания, видео) включены.',
            en: 'Lifetime access means the Course is available to the User with no time limit and no extra charge for as long as the App exists. Course updates (fixes, new descriptions, videos) are included.',
          },
          {
            ru: `Если Исполнитель решит прекратить работу Приложения, он уведомит Пользователей по e-mail не менее чем за ${notice} дней.`,
            en: `Should the Provider decide to discontinue the App, it will notify Users by email at least ${notice} days in advance.`,
          },
        ],
      },
      {
        id: 'price',
        heading: { ru: '5. Стоимость и оплата', en: '5. Price and payment' },
        paragraphs: [
          {
            ru: 'Цена каждого Курса указана на его странице в рублях (для русской версии сайта) или в долларах США (для английской). Оплата проходит через внешний платёжный сервис по ссылке со страницы Курса; чек или подтверждение выдаёт этот сервис. Если платёжная ссылка не подключена, порядок оплаты согласовывается по e-mail.',
            en: 'Each Course price is shown on its page in Russian roubles (Russian version of the site) or US dollars (English version). Payment goes through an external payment service linked from the Course page; the receipt is issued by that service. If no payment link is connected, payment is arranged by email.',
          },
        ],
      },
      {
        id: 'health',
        heading: { ru: '6. Здоровье и безопасность', en: '6. Health and safety' },
        paragraphs: [
          {
            ru: 'Курсы содержат физические упражнения, включая интенсивные. Перед началом занятий проконсультируйся с врачом, особенно при хронических заболеваниях, травмах, беременности, гипертонии или если давно не тренировался. Материалы Курса не являются медицинскими рекомендациями и не заменяют консультацию специалиста.',
            en: 'The Courses contain physical exercise, including intense exercise. Consult a doctor before starting, especially if you have chronic conditions, injuries, are pregnant, have hypertension or have not trained for a long time. Course materials are not medical advice and do not replace a professional consultation.',
          },
          {
            ru: 'Пользователь самостоятельно оценивает своё состояние и выбирает нагрузку. При боли, головокружении или плохом самочувствии тренировку нужно прекратить. Рекомендации Приложения по уровню сложности носят справочный характер.',
            en: 'The User assesses their own condition and chooses the load. Stop the workout if you feel pain, dizziness or unwell. The App’s difficulty recommendations are informational.',
          },
        ],
      },
      {
        id: 'prohibited',
        heading: { ru: '7. Что запрещено', en: '7. Prohibited use' },
        bullets: [
          {
            ru: 'Передавать доступ (e-mail и коды входа) третьим лицам или пользоваться одним аккаунтом нескольким людям.',
            en: 'Sharing access (email and sign-in codes) with others or using one account for several people.',
          },
          {
            ru: 'Копировать, записывать, публиковать или перепродавать материалы Курса: тексты, анимации, видео, программы.',
            en: 'Copying, recording, publishing or reselling Course materials: texts, animations, videos, programs.',
          },
          {
            ru: 'Обходить технические ограничения Приложения или мешать его работе.',
            en: 'Circumventing the App’s technical restrictions or interfering with its operation.',
          },
        ],
        after: [
          {
            ru: 'При нарушении Исполнитель вправе прекратить доступ без возврата средств.',
            en: 'In case of violation the Provider may terminate access without a refund.',
          },
        ],
      },
      {
        id: 'liability',
        heading: { ru: '8. Ответственность', en: '8. Liability' },
        paragraphs: [
          {
            ru: 'Приложение предоставляется «как есть». Исполнитель старается обеспечить бесперебойную работу, но не гарантирует отсутствие перерывов и ошибок и не отвечает за сбои у сторонних сервисов (хостинг, почта, платёжный сервис). Исполнитель не гарантирует конкретных результатов тренировок — они зависят от регулярности, питания, сна и здоровья Пользователя.',
            en: 'The App is provided “as is”. The Provider strives to keep it running but does not guarantee the absence of interruptions and errors and is not responsible for outages of third-party services (hosting, email, payment). The Provider does not guarantee specific training results — they depend on the User’s consistency, nutrition, sleep and health.',
          },
          {
            ru: 'Ответственность Исполнителя по этой оферте ограничена стоимостью оплаченного Курса.',
            en: 'The Provider’s liability under these terms is limited to the price paid for the Course.',
          },
        ],
      },
      {
        id: 'refund',
        heading: { ru: '9. Возврат средств', en: '9. Refunds' },
        paragraphs: [
          {
            ru: `Возврат возможен в течение ${days} дней после активации доступа, если выполнено меньше ${maxWorkouts} тренировок Курса. Подробности — в политике возврата на странице /refund/.`,
            en: `A refund is possible within ${days} days of activation if fewer than ${maxWorkouts} workouts of the Course are completed. Details are in the refund policy at /refund/.`,
          },
        ],
      },
      {
        id: 'data',
        heading: { ru: '10. Персональные данные', en: '10. Personal data' },
        paragraphs: [
          {
            ru: 'Обработка персональных данных описана в политике конфиденциальности на странице /privacy/. Оставляя e-mail, Пользователь соглашается с ней.',
            en: 'Personal data processing is described in the privacy policy at /privacy/. By leaving an email the User agrees to it.',
          },
        ],
      },
      {
        id: 'changes',
        heading: { ru: '11. Изменения оферты', en: '11. Changes' },
        paragraphs: [
          {
            ru: 'Исполнитель может менять оферту; новая редакция действует с момента публикации на сайте и не ухудшает условия по уже оплаченным Курсам. Дата последнего обновления указана вверху страницы.',
            en: 'The Provider may change these terms; a new version applies from its publication on the site and does not worsen the conditions of Courses already paid for. The date of the latest update is shown at the top of the page.',
          },
        ],
      },
      {
        id: 'contact',
        heading: { ru: '12. Контакты', en: '12. Contact' },
        paragraphs: [{ ru: `${org}, e-mail: ${email}.`, en: `${org}, email: ${email}.` }],
      },
    ],
  };
}

export function refundDocument(): LegalDocument {
  return {
    sections: [
      {
        id: 'conditions',
        heading: { ru: '1. Когда возможен возврат', en: '1. When a refund is possible' },
        paragraphs: [
          {
            ru: `Ты можешь вернуть полную стоимость Курса, если с момента активации доступа прошло не больше ${days} дней и ты выполнил меньше ${maxWorkouts} тренировок этого Курса (считаются тренировки, отмеченные в Приложении как завершённые; тесты и дни отдыха не считаются).`,
            en: `You can get a full refund if no more than ${days} days have passed since access was activated and you have completed fewer than ${maxWorkouts} workouts of that Course (workouts marked as completed in the App count; tests and rest days do not).`,
          },
          {
            ru: 'Оба условия проверяются по данным Приложения на момент запроса.',
            en: 'Both conditions are checked against App data at the time of the request.',
          },
        ],
      },
      {
        id: 'how',
        heading: { ru: '2. Как запросить возврат', en: '2. How to request a refund' },
        bullets: [
          {
            ru: `Напиши на ${email} с e-mail, на который оформлен доступ.`,
            en: `Write to ${email} from the email your access is linked to.`,
          },
          {
            ru: 'Укажи название Курса и, если есть, номер платежа или дату оплаты.',
            en: 'Mention the Course name and, if you have it, the payment id or date.',
          },
          {
            ru: 'Причину указывать не обязательно, но она поможет нам сделать курсы лучше.',
            en: 'You do not have to give a reason, but it helps us make the courses better.',
          },
        ],
      },
      {
        id: 'timing',
        heading: { ru: '3. Сроки и способ', en: '3. Timing and method' },
        paragraphs: [
          {
            ru: 'Запросы рассматриваем в порядке очереди. Деньги возвращаются тем же способом, которым была оплата; срок зачисления зависит от банка и платёжного сервиса. После возврата доступ к Курсу закрывается.',
            en: 'Requests are handled in the order received. The money goes back by the same method used for payment; how fast it arrives depends on the bank and the payment service. After the refund, access to the Course is closed.',
          },
        ],
      },
      {
        id: 'no-refund',
        heading: { ru: '4. Когда возврат невозможен', en: '4. When a refund is not possible' },
        bullets: [
          {
            ru: `Прошло больше ${days} дней с момента активации.`,
            en: `More than ${days} days have passed since activation.`,
          },
          {
            ru: `Выполнено ${maxWorkouts} и больше тренировок Курса.`,
            en: `${maxWorkouts} or more workouts of the Course have been completed.`,
          },
          {
            ru: 'Нарушены условия оферты — например, доступ передан другим людям.',
            en: 'The terms have been violated — for example, access was shared with others.',
          },
          { ru: 'Курс был бесплатным.', en: 'The Course was free.' },
        ],
      },
      {
        id: 'technical',
        heading: { ru: '5. Технические проблемы', en: '5. Technical problems' },
        paragraphs: [
          {
            ru: 'Если Курс не открывается по нашей вине и мы не можем это исправить в разумный срок, мы вернём деньги независимо от условий выше.',
            en: 'If a Course does not open because of a fault on our side and we cannot fix it within a reasonable time, we refund regardless of the conditions above.',
          },
        ],
      },
      {
        id: 'contact',
        heading: { ru: '6. Контакты', en: '6. Contact' },
        paragraphs: [{ ru: `${org}, e-mail: ${email}.`, en: `${org}, email: ${email}.` }],
      },
    ],
  };
}
