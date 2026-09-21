/**
 * Legal documents (privacy policy, public offer, refund policy) as bilingual content.
 * Numbers and contacts are interpolated from content/site config so the pages never drift from it.
 * These are templates for a lawyer to review — see docs/LEGAL.md.
 */
import type { L10n } from '@/content/schema';
import { BRAND } from '@content/site/brand';
import { entityLines, entityName, hasLegalEntity } from '@content/site/legalEntity';
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

/*
 * The operator, and why it is a function call rather than a constant.
 *
 * 152-ФЗ ст. 18.1 ч. 2 п. 2 wants the published policy to name the operator, and ЗоЗПП ст. 9 wants
 * the offer to name the seller — and «Forma» is neither. It is a wordmark. Until the registration
 * details are filled in (content/site/legalEntity.ts) these pages keep saying «Forma», which is
 * what they said before; the moment they are filled in, every page that names the seller changes
 * at once, because they all read this one value.
 */
const org = entityName() || BRAND.organization;
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
          ru: 'Приложение хранит в браузере (localStorage) только служебные данные: сессию входа, незавершённую тренировку и настройки — звук и выбранный курс. Это не рекламные cookies и они не передаются третьим лицам.',
          en: 'The app keeps only functional data in the browser (localStorage): the login session, an unfinished workout and settings — sound and the chosen course. These are not advertising cookies and are not shared with third parties.',
        },
      ],
    };
  }
  return {
    id: 'cookies',
    heading: { ru: 'Cookies и аналитика', en: 'Cookies and analytics' },
    paragraphs: [
      {
        ru: 'Сайт не использует рекламные и аналитические cookies. Приложение хранит в браузере (localStorage) только служебные данные: сессию входа, незавершённую тренировку и настройки — звук и выбранный курс. Они не передаются третьим лицам.',
        en: 'The site uses no advertising or analytics cookies. The app keeps only functional data in the browser (localStorage): the login session, an unfinished workout and settings — sound and the chosen course. They are not shared with third parties.',
      },
    ],
  };
}

/**
 * The seller's registration details, as a section — or nothing at all while they are unset.
 *
 * ЗоЗПП ст. 9 ч. 1 and п. 8 Правил продажи товаров дистанционным способом (ПП РФ № 2463) both ask
 * for the same thing: before the contract is made, the buyer can read who they are contracting
 * with, where that party is, and under which registration it trades. `hasLegalEntity()` is false
 * until those are filled in, and an empty block would be a heading over nothing — so the section
 * is absent rather than hollow, and `npm run legal:check` is what says it is still missing.
 */
function requisitesSection(id: string, heading: L10n): LegalSection | null {
  if (!hasLegalEntity()) return null;
  return {
    id,
    heading,
    bullets: entityLines().map((line): L10n => ({
      ru: `${line.label.ru}: ${line.value}`,
      en: `${line.label.en}: ${line.value}`,
    })),
    after: [{ ru: `E-mail: ${email}.`, en: `Email: ${email}.` }],
  };
}

/** Drops the sections that are not there, so a document can list one conditionally. */
function sections(list: (LegalSection | null)[]): LegalSection[] {
  return list.filter((s): s is LegalSection => s !== null);
}

export function privacyDocument(): LegalDocument {
  return {
    sections: sections([
      {
        id: 'general',
        heading: { ru: '1. Общие положения', en: '1. General' },
        paragraphs: [
          {
            ru: `Это политика в отношении обработки персональных данных (152-ФЗ «О персональных данных», ст. 18.1). Она описывает, какие данные собирает оператор — ${org} (далее «мы») — на сайте и в приложении ${brand}, на каком основании, зачем, где они хранятся, сколько и какие у тебя есть права.`,
            en: `This is the policy on the processing of personal data required by 152-ФЗ art. 18.1. It describes what the operator — ${org} ("we") — collects on the ${brand} site and in the ${brand} app, on what legal basis, why, where the data is kept, for how long, and what rights you have.`,
          },
          {
            ru: `Сервис предназначен для лиц старше ${age} лет. Мы не собираем данные детей сознательно; если ты родитель и считаешь, что ребёнок оставил у нас свои данные, напиши на ${email} — мы удалим их.`,
            en: `The service is intended for people aged ${age} and over. We do not knowingly collect children's data; if you are a parent and believe your child left data with us, write to ${email} and we will delete it.`,
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
            ru: 'Данные тренировок: ответы при первом входе (возрастная группа, пол, оборудование), результаты тестов, выполненные тренировки, оценки усилия и самочувствия, очки.',
            en: 'Training data: your onboarding answers (age band, sex, equipment), test results, completed workouts, effort and feeling ratings and points.',
          },
          {
            ru: 'Данные о здоровье — только те, которые ты отмечаешь сам в вопросе «что беречь»: колени, поясница, плечи, запястья, гипертония, беременность. Это специальная категория персональных данных (152-ФЗ ст. 10), и мы берём их отдельным согласием, которое приложение спрашивает прямо под этим вопросом. Без согласия отметки не сохраняются и тренировки идут без замен упражнений.',
            en: 'Health data — only what you tick yourself in the "what should we go easy on" question: knees, lower back, shoulders, wrists, high blood pressure, pregnancy. This is a special category under 152-ФЗ art. 10, and it is taken on a separate consent that the app asks for directly under that question. Without it nothing is stored and workouts come without exercise substitutions.',
          },
          {
            ru: 'Фотографии и видео, которые ты сам прикладываешь как подтверждение задания в клубе. Их видит только тренер.',
            en: 'Photos and videos you attach yourself as proof of a club task. Only the coach sees them.',
          },
          {
            ru: 'Технические данные: время действий и данные сессии, необходимые для работы входа.',
            en: 'Technical data: timestamps of actions and the session data needed for sign-in to work.',
          },
        ],
        after: [
          {
            ru: 'Мы не собираем паспортных данных, адресов, номеров карт и точной геолокации. Оплата проходит на стороне платёжного сервиса — реквизиты карты к нам не попадают вовсе.',
            en: 'We collect no passport data, postal addresses, card numbers or precise location. Payment happens on the payment service’s side — card details never reach us at all.',
          },
        ],
      },
      {
        id: 'basis',
        heading: { ru: '2а. На каком основании', en: '2a. Legal basis' },
        bullets: [
          {
            ru: 'Твоё согласие (152-ФЗ ст. 6 ч. 1 п. 1) — почта, имя, ответы онбординга. Согласие даётся действием: галочкой в форме заказа и нажатием кнопки при входе, рядом с ссылкой на эту политику.',
            en: 'Your consent (152-ФЗ art. 6 § 1 cl. 1) — email, name, onboarding answers. Consent is given by a deliberate act: the checkbox on the order form and the button on the sign-in screen, next to a link to this policy.',
          },
          {
            ru: 'Отдельное согласие на специальную категорию (ст. 10) — отметки о здоровье.',
            en: 'A separate consent for the special category (art. 10) — the health notes.',
          },
          {
            ru: 'Исполнение договора с тобой (ст. 6 ч. 1 п. 5) — всё, что нужно, чтобы открыть оплаченный курс и вести твой прогресс.',
            en: 'Performance of our contract with you (art. 6 § 1 cl. 5) — everything needed to open a course you paid for and keep your progress.',
          },
          {
            ru: 'Требования закона (ст. 6 ч. 1 п. 2) — записи об оплатах и возвратах, которые обязан хранить продавец.',
            en: 'Legal obligations (art. 6 § 1 cl. 2) — the records of payments and refunds a seller must keep.',
          },
        ],
        after: [
          {
            ru: 'Мы фиксируем каждое согласие: какая почта, на какой текст, какой его версии и когда. Это требование ст. 9 ч. 3 — доказывать согласие обязан оператор, а не ты.',
            en: 'Every consent is logged: which address, to which text, which version of it, and when. That is art. 9 § 3 — proving consent is the operator’s duty, not yours.',
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
            ru: 'Прогресс, статистика и таблица лидеров (в ней видны только имя, аватар и очки — никогда e-mail).',
            en: 'Progress, statistics and the leaderboard (which shows only name, avatar and points — never your email).',
          },
          {
            ru: 'Поддержка, возвраты и выполнение требований закона.',
            en: 'Support, refunds and compliance with legal requirements.',
          },
          /*
           * Цель обработки, которую надо было назвать: тренер смотрит сводку по всем — сколько
           * людей дошло до какого шага и кто давно не занимался, — чтобы понимать, что в
           * приложении чинить. Ст. 18.1 требует перечислять цели, а не только данные, и молчать
           * о той, ради которой сделан целый экран в админке, нельзя.
           *
           * Сказано и то, чего мы не делаем: внешней аналитики в приложении нет вовсе, и это
           * проверяемо — счётчиков и SDK в нём не стоит.
           */
          {
            ru: 'Понять, как работает приложение: сколько людей доходит до каждого шага и кто перестал заниматься. Эту сводку видит только тренер, внутри приложения, и она нужна, чтобы улучшать курсы и сам сервис. Никаких внешних систем аналитики мы не используем.',
            en: 'To understand how the app works: how many people reach each step and who has stopped training. Only the coach sees this summary, inside the app, and it exists so that the courses and the service can be improved. We use no third-party analytics.',
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
            ru: 'Это значит, что данные передаются за пределы России — трансграничная передача по ст. 12 152-ФЗ. Серверы Supabase находятся в Европейском союзе, серверы GitHub — в США; обе страны являются сторонами Конвенции Совета Европы о защите физических лиц при автоматизированной обработке персональных данных либо обеспечивают сопоставимую защиту. Мы называем это прямо, чтобы ты знал об этом до того, как оставишь адрес, а не после.',
            en: 'This means data leaves Russia — a cross-border transfer under 152-ФЗ art. 12. Supabase servers are in the European Union and GitHub’s are in the United States. We say so plainly so that you know it before you leave an address rather than after.',
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
          {
            ru: 'Когда основание для обработки отпадает — ты отозвал согласие, попросил удалить аккаунт или цель достигнута — мы удаляем данные в течение 30 дней (152-ФЗ ст. 21). Удаление значит удаление: строки стираются из базы, файлы — из хранилища. Исключение одно: документы об оплатах, которые продавец обязан хранить по налоговому законодательству.',
            en: 'When the basis for processing falls away — you withdraw consent, ask for the account to be deleted, or the purpose is met — we delete the data within 30 days (152-ФЗ art. 21). Deletion means deletion: rows go from the database and files from storage. One exception: the payment records a seller is required to keep under tax law.',
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
            ru: 'Исправить имя и настройки профиля — прямо в приложении, в разделе «Данные и согласия» и в строке «Имя». Всё остальное — по письму.',
            en: 'Correct your name and profile settings — in the app itself, under "Data and consents" and the "Name" row. Anything else, by letter.',
          },
          {
            ru: 'Отозвать согласие на обработку данных о здоровье — кнопкой в приложении, там же. С этого момента отметки перестают влиять на тренировки.',
            en: 'Withdraw the consent to process health data — with a button in the app, in the same place. From that moment the notes stop affecting your training.',
          },
          {
            ru: 'Удалить аккаунт и данные тренировок. Учти: вместе с ними удаляется и связь «почта — курс», то есть доступ к купленным курсам.',
            en: 'Delete your account and training data. Note that this also removes the email–course link, i.e. access to the courses you bought.',
          },
          {
            ru: 'Отозвать согласие целиком — это и есть просьба удалить аккаунт: мы прекращаем обработку и удаляем данные, кроме тех, что обязаны хранить по закону.',
            en: 'Withdraw consent altogether — which is the same as asking for the account to be deleted: we stop processing and delete the data, save what the law requires us to keep.',
          },
          {
            ru: 'Пожаловаться в Роскомнадзор или пойти в суд, если считаешь, что мы обрабатываем данные неправильно (152-ФЗ ст. 17).',
            en: 'Complain to Роскомнадзор or go to court if you believe we process data improperly (152-ФЗ art. 17).',
          },
        ],
        after: [
          {
            ru: `Чтобы воспользоваться правами, напиши на ${email} с почты, привязанной к аккаунту, — это и есть подтверждение, что аккаунт твой. Отвечаем в течение 30 дней, обычно быстрее.`,
            en: `To exercise these rights, write to ${email} from the email linked to your account — that is what confirms the account is yours. We answer within 30 days, usually sooner.`,
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
        heading: { ru: '8. Контакты оператора', en: '8. The operator' },
        paragraphs: [
          {
            ru: `${org}, e-mail: ${email}. По любым вопросам об обработке данных пиши на этот адрес — он же адрес для отзыва согласия и для запроса на удаление.`,
            en: `${org}, email: ${email}. Write to this address about anything to do with data — it is also the address for withdrawing consent and for deletion requests.`,
          },
        ],
      },
      requisitesSection('requisites', { ru: '9. Реквизиты', en: '9. Registration details' }),
    ]),
  };
}

export function termsDocument(): LegalDocument {
  return {
    sections: sections([
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
            ru: 'Курс — цифровая тренировочная программа: последовательность тренировок, тестов и дней отдыха с описаниями и видео, доступная в приложении.',
            en: 'Course — a digital training program: a sequence of workouts, tests and rest days with descriptions and videos, delivered in the app.',
          },
          {
            ru: 'Приложение — веб-приложение по адресу /app/, в котором проходят тренировки.',
            en: 'App — the web application at /app/ where the training happens.',
          },
          {
            ru: 'Подписка — доступ ко всем Курсам на оплаченный период: 30 дней или год. Автоматического списания нет: период заканчивается, и доступ закрывается, пока Пользователь не оплатит следующий сам.',
            en: 'Subscription — access to every Course for a paid period: 30 days or a year. There is no automatic charge: the period ends and access closes until the User pays for the next one themselves.',
          },
        ],
      },
      {
        id: 'subject',
        heading: { ru: '2. Предмет оферты', en: '2. Subject' },
        paragraphs: [
          {
            ru: 'Исполнитель предоставляет Пользователю доступ к выбранному Курсу или, по Подписке, ко всем Курсам в Приложении, а Пользователь оплачивает его по цене, указанной на странице Курса или Подписки на момент заявки. Курс — цифровой продукт для самостоятельных занятий; он не является медицинской, физкультурно-оздоровительной или образовательной услугой с индивидуальным сопровождением.',
            en: 'The Provider grants the User access to the chosen Course or, under a Subscription, to every Course in the App, and the User pays the price shown on the Course or Subscription page at the time of the order. The Course is a digital product for self-directed training; it is not a medical, healthcare or educational service with individual supervision.',
          },
          {
            ru: 'Оферта считается принятой (акцепт) в момент, когда Пользователь оставил e-mail на странице Курса и оплатил его, а если Курс бесплатный — в момент заявки.',
            en: 'The offer is accepted when the User leaves an email on the Course page and pays for it, or, for a free Course, at the moment of the order.',
          },
          {
            ru: 'Первая тренировка каждого Курса доступна бесплатно и без оплаты — один раз. Это не услуга по настоящей оферте и не её часть: договор между Исполнителем и Пользователем возникает только при оплате Курса. Исполнитель вправе изменить или прекратить бесплатный доступ в любой момент, и на уже оплаченные Курсы это не влияет.',
            en: 'The first workout of each Course is available free of charge, once. It is not a service under these terms and not a part of them: the contract between the Provider and the User arises only on payment for a Course. The Provider may change or withdraw the free access at any time, and doing so does not affect Courses already paid for.',
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
            ru: 'После оплаты Курс открывается автоматически, на тот же e-mail, обычно в течение нескольких минут. Если по техническим причинам этого не произошло, доступ включает Исполнитель вручную — напиши по адресу ниже, и мы разберёмся.',
            en: 'After payment the Course opens automatically, for the same email, usually within a few minutes. If for technical reasons it does not, the Provider grants access by hand — write to the address below and we will sort it out.',
          },
          {
            ru: 'Курс считается предоставленным в момент активации. С этого момента отсчитывается срок для возврата.',
            en: 'The Course is deemed delivered at the moment of activation. The refund window starts then.',
          },
        ],
      },
      {
        id: 'lifetime',
        heading: { ru: '4. Срок доступа', en: '4. Term of access' },
        paragraphs: [
          {
            ru: 'Купленный Курс доступен Пользователю без ограничения срока и без дополнительной платы, пока существует Приложение. Обновления Курса (исправления, новые описания, видео) включены.',
            en: 'A purchased Course is available to the User with no time limit and no extra charge for as long as the App exists. Course updates (fixes, new descriptions, videos) are included.',
          },
          {
            ru: 'Подписка открывает все Курсы на оплаченный период. В конце периода доступ закрывается сам — отменять ничего не нужно и отписываться не от чего. Чтобы продолжить, Пользователь оплачивает следующий период. Прогресс и статистика сохраняются и после окончания Подписки, а Курсы, купленные отдельно, остаются открытыми.',
            en: 'A Subscription opens every Course for the paid period. At the end of that period access closes by itself — there is nothing to cancel and nothing to unsubscribe from. To continue, the User pays for the next period. Progress and statistics are kept after the Subscription ends, and Courses bought separately stay open.',
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
            ru: 'Цена каждого Курса и Подписки указана на его странице в рублях. Оплата проходит через внешний платёжный сервис по ссылке со страницы; чек или подтверждение выдаёт этот сервис. Если платёжная ссылка не подключена, порядок оплаты согласовывается по e-mail.',
            en: 'Each Course and Subscription price is shown on its page in Russian roubles. Payment goes through an external payment service linked from that page; the receipt is issued by that service. If no payment link is connected, payment is arranged by email.',
          },
          {
            ru: 'Подписка не списывается автоматически: каждый период Пользователь оплачивает сам, по цене, указанной на странице на момент оплаты. Мы не храним реквизиты карт и не можем списать деньги без нового действия Пользователя. Если автосписание когда-нибудь появится, оно будет отдельно включаемой опцией, а не изменением этих условий.',
            en: 'A Subscription is not charged automatically: the User pays for each period themselves, at the price shown on the page at the time of payment. We do not store card details and cannot take money without a fresh action by the User. Should automatic renewal ever be introduced, it will be an option to switch on, not a change to these terms.',
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
            ru: 'Копировать, записывать, публиковать или перепродавать материалы Курса: тексты, видео, программы.',
            en: 'Copying, recording, publishing or reselling Course materials: texts, videos, programs.',
          },
          {
            ru: 'Обходить технические ограничения Приложения или мешать его работе.',
            en: 'Circumventing the App’s technical restrictions or interfering with its operation.',
          },
        ],
        after: [
          {
            ru: 'При доказанном нарушении Исполнитель вправе ограничить или прекратить доступ и потребовать возмещения причинённых убытков. Условия, ухудшающие права потребителя по сравнению с законом, недействительны (ст. 16 Закона «О защите прав потребителей»), и это правило действует и здесь.',
            en: 'In case of a proven violation the Provider may limit or terminate access and claim compensation for the damage actually caused. Terms that worsen a consumer’s statutory rights are void (ЗоЗПП art. 16), and that rule applies here too.',
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
          {
            ru: 'Это наше правило, а не предел твоих прав. По ст. 32 Закона «О защите прав потребителей» ты можешь отказаться от услуги в любой момент, оплатив фактически понесённые нами расходы. Правило выше проще и в большинстве случаев выгоднее; если оно не подходит, напиши — будем считать по закону.',
            en: 'That is our rule, not the limit of your rights. Under ЗоЗПП art. 32 you may withdraw from the service at any time, paying the costs we have actually incurred. The rule above is simpler and usually better for you; if it does not fit your case, write to us and we will apply the statute.',
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
        id: 'law',
        heading: { ru: '12. Право и споры', en: '12. Governing law and disputes' },
        paragraphs: [
          {
            ru: 'К этой оферте применяется право Российской Федерации. Сначала пишем друг другу: претензию мы рассматриваем в течение 10 дней. Если договориться не вышло, спор решается судом — и потребитель вправе выбрать суд по своему месту жительства или пребывания (ст. 17 Закона «О защите прав потребителей»); никакое условие этой оферты этого права не ограничивает.',
            en: 'These terms are governed by the law of the Russian Federation. First we write to each other: we answer a claim within 10 days. If that does not settle it, the dispute goes to court — and a consumer may choose the court at their own place of residence (ЗоЗПП art. 17). Nothing in these terms limits that right.',
          },
        ],
      },
      {
        id: 'contact',
        heading: { ru: '13. Контакты', en: '13. Contact' },
        paragraphs: [{ ru: `${org}, e-mail: ${email}.`, en: `${org}, email: ${email}.` }],
      },
      requisitesSection('requisites', { ru: '14. Реквизиты продавца', en: '14. Seller details' }),
    ]),
  };
}

export function refundDocument(): LegalDocument {
  return {
    sections: sections([
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
        id: 'subscription',
        heading: { ru: '1а. Подписка', en: '1a. Subscription' },
        paragraphs: [
          {
            ru: `Оплата периода возвращается на тех же условиях: не больше ${days} дней с момента оплаты и меньше ${maxWorkouts} выполненных тренировок за этот период. Отменять подписку не нужно и отписываться не от чего: автосписания нет, период просто заканчивается.`,
            en: `A payment for a period is refundable on the same terms: no more than ${days} days since the payment and fewer than ${maxWorkouts} workouts completed within it. There is no subscription to cancel and nothing to unsubscribe from: nothing is charged automatically, the period simply ends.`,
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
        id: 'statutory',
        heading: { ru: '6. Права по закону', en: '6. Your statutory rights' },
        paragraphs: [
          {
            ru: 'Правила выше — наши, и они проще закона. Помимо них у тебя есть права по Закону «О защите прав потребителей»: отказаться от услуги в любой момент, оплатив фактически понесённые нами расходы (ст. 32), и требовать возврата, если услуга оказана некачественно (ст. 29). Ничто на этой странице эти права не отменяет — такие условия были бы недействительны (ст. 16).',
            en: 'The rules above are ours, and they are simpler than the statute. Beyond them you have rights under ЗоЗПП: to withdraw from the service at any time, paying the costs we actually incurred (art. 32), and to a refund where the service was not performed properly (art. 29). Nothing on this page removes them — such terms would be void (art. 16).',
          },
        ],
      },
      {
        id: 'contact',
        heading: { ru: '7. Контакты', en: '7. Contact' },
        paragraphs: [{ ru: `${org}, e-mail: ${email}.`, en: `${org}, email: ${email}.` }],
      },
      requisitesSection('requisites', { ru: '8. Реквизиты продавца', en: '8. Seller details' }),
    ]),
  };
}
