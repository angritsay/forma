/** Тексты лендинга. Ключи должны совпадать с en/landing.ts. */
export const landing = {
  // Навигация / футер
  navCourses: 'Курсы',
  navExercises: 'Упражнения',
  navGuides: 'Гайды',
  navSubscribe: 'Клуб',
  navHome: 'Главная',
  navContact: 'Контакты',
  navMenu: 'Меню',
  skipToContent: 'К содержанию',
  navLanguage: 'Язык',
  // Подпись к возрастной отметке в подвале: сама «18+» — это цифра, и скринридеру она ничего
  // не говорит без слова рядом.
  footerAgeLabel: 'Сервис для совершеннолетних',
  footerPrivacy: 'Политика конфиденциальности',
  footerTerms: 'Оферта',
  footerRefund: 'Возврат средств',
  footerContact: 'Контакты',
  footerProduct: 'Продукт',
  footerLegal: 'Документы',
  footerReach: 'Связаться',
  // Оболочка v2 (PR 2): короткие пункты навигации, вход, Telegram, строка под знаком в подвале.
  navCourse: 'Курс',
  navCoach: 'Тренер',
  navTogether: 'Вместе',
  navSignIn: 'Войти',
  openTelegram: 'Открыть в Telegram',
  footerTagline: 'Кроссфит дома маленькими шагами.',

  // Формы множественного числа
  courseWordOne: 'курс',
  courseWordFew: 'курса',
  courseWordMany: 'курсов',
  weekWordOne: 'неделя',
  weekWordFew: 'недели',
  weekWordMany: 'недель',
  workoutWordOne: 'тренировка',
  workoutWordFew: 'тренировки',
  workoutWordMany: 'тренировок',
  // A block's own count, on the pill that names its format: «1 раунд», «3 раунда», «5 раундов».
  roundWordOne: 'раунд',
  roundWordFew: 'раунда',
  roundWordMany: 'раундов',
  setWordOne: 'подход',
  setWordFew: 'подхода',
  setWordMany: 'подходов',
  sessionsPerWeek: '{n} {word} в неделю',
  avgSession: '~{n} мин',
  priceFree: 'Бесплатно',

  // Главная: SEO. В заголовке уже есть «Forma», поэтому суффикс не добавляется.
  homeTitle: 'Forma — кроссфит дома: первая тренировка бесплатно',
  homeDescription:
    'Домашний кроссфит маленькими шагами: короткие тренировки без прыжков, нагрузка подстраивается под тебя. Первая — бесплатно, без карты.',

  // Главная: hero. Ключевое слово заголовка — «сегодня», тонкая часть — «Первая тренировка —».
  heroEyebrow: 'Маленькими шагами',
  heroTitle: 'Кроссфит дома. Первая тренировка — сегодня',
  heroThin: 'Первая тренировка —',
  heroChipVideo: 'Видео к каждому движению',
  heroChipNoJumps: 'Без прыжков',
  heroCtaApp: 'Открыть приложение',
  chipCourses: '{n} {word}',

  // Главная, 01: тренировка 1.
  firstEyebrow: 'Тренировка 1',
  firstTitle: 'Вот она — тренировка 1',
  // {work} — рабочие минуты из движка («9 мин», без минут отдыха между кругами), {total} — вся
  // тренировка с разминкой; не набирать руками.
  firstIntro:
    'По таймеру: каждую минуту — новое движение, всего {work} работы. До и после — разминка и заминка, вместе с ними около {total} мин.',
  firstCta: 'Сделать тренировку 1',

  // Главная, 02: вместе с понедельника. Никаких обещаний «вступите вдвоём — получите час».
  togetherEyebrow: 'Вместе с понедельника',
  togetherTitle: 'Позови с собой — начните в понедельник',
  togetherLinkLabel: 'Ссылка, чтобы позвать',
  togetherPersonalCta: 'Сделать ссылку личной',
  togetherNoDiscount: 'Скидки нет — есть дни и пара.',

  // Главная, 03: нагрузка идёт за тобой (схема LoadDiagram).
  adaptEyebrow: 'Как подстраивается нагрузка',
  adaptTitle: 'Нагрузка идёт за тобой',

  pathNodeLocked: 'Закрыто',
  cardView: 'Открыть курс',
  /* The ticket's kicker: what kind of thing this is («Курс · Начальный»), as in the app. */
  cardKicker: 'Курс',

  // Главная, 04: клуб маленьких шагов. Заголовок, лид и фичи — ключи приложения (`app.club*`).
  clubEyebrow: 'Клуб — чтобы не бросить',

  // Главная, 05: тренер.
  coachEyebrow: 'Тренер',
  coachTitle: 'Тренировка с Сергеем онлайн',
  coachCredentials: 'Образование и сертификаты',
  coachMore: 'Подробнее о тренере',
  coachBook: 'Записаться на занятие',

  // Главная: до и после (подпись — `app.clubPhotosClientsRow`).
  resultsEyebrow: 'Ученики Сергея',
  resultsTitle: 'До и после — с персональных занятий',

  // Главная, 06: цены.
  pricesEyebrow: 'Цены',
  pricesTitle: 'Начать — бесплатно',

  // Главная, 07: FAQ + финальный призыв.
  faqEyebrow: 'Вопросы',
  faqTitle: 'Частые вопросы',
  homeCtaTitle: 'Тренировка 1 ждёт',
  // Финальный призыв других страниц (about, courses).
  ctaTitle: 'Начни с первой тренировки',
  ctaText: 'Тренировка 1 — бесплатно и без карты. Дальше — в своём темпе.',

  // Хаб курсов
  coursesHubTitle: 'Курс кроссфита дома без оборудования',
  coursesHubDescription:
    'Курс «Форма с нуля»: двадцать тренировок кроссфита дома без оборудования, нагрузка под тебя, видео тренера к каждому движению. Плюс клуб и тренер в Telegram.',
  coursesHubH1: 'Курс для старта',
  coursesHubIntro:
    'Двадцать тренировок по порядку, без прыжков и без оборудования. Первая — бесплатно.',
  coursesHubListLabel: 'Курсы',

  // Страница курса
  courseTitleSuffix: 'курс для дома',
  courseCtaOrder: 'Получить доступ',
  courseAboutTitle: 'О курсе',
  courseForWhomTitle: 'Кому подойдёт',
  courseOutcomesTitle: 'Что получишь',
  courseEquipmentTitle: 'Оборудование',
  courseEquipmentNone: 'Без оборудования — нужен устойчивый стул и коврик',
  courseProgramTitle: 'Программа',
  courseProgramIntro: 'Двадцать тренировок по порядку. Недели — ориентир, а не календарь.',
  courseWeek: 'Неделя {n}',
  courseDay: 'День {n}',
  courseDeload: 'Разгрузка',
  // Блок был «Пример тренировки» — витриной. Теперь это приглашение: та же тренировка, но её
  // можно сделать, а не только прочитать. Обещание короткое и проверяемое.
  courseSampleTitle: 'Первая тренировка — бесплатно',
  courseSampleIntro: 'Вот она целиком. Сделай её сейчас — без карты и без оплаты.',
  courseSampleCta: 'Сделать её в приложении',
  // Строка над ценой: то, что человек получает до того, как что-то решит.
  courseFreeFirst: 'Первая тренировка бесплатно',
  courseAdaptTitle: 'Как приложение подстраивается',
  courseAdaptText:
    'Перед тренировкой выбираешь: полегче, как обычно или посложнее. После — оценка усилия от 1 до 10, и следующая нагрузка меняется.',
  // The engine's four steps (`ADAPTATION`), one tile each; the figure is computed, not typed.
  courseAdaptStepEasy: 'Легко, всё сделано',
  courseAdaptStepOk: 'В самый раз',
  courseAdaptStepHard: 'На пределе',
  courseAdaptStepPain: 'Что-то болело',
  /* «О курсе» shows one paragraph; the rest of the coach's text opens under this. */
  courseMoreAbout: 'Подробнее о курсе',
  // «2 дня отдыха» on a week's row of the programme.
  restDayOne: 'день отдыха',
  restDayFew: 'дня отдыха',
  restDayMany: 'дней отдыха',
  courseFaqTitle: 'Вопросы о курсе',
  courseGuidesTitle: 'Гайды по теме',
  courseExercisesTitle: 'Упражнения курса',
  courseOrderTitle: 'Получить доступ к курсу',
  courseOrderIntro:
    'Оставь e-mail и оплати — доступ откроется сам, и курс появится в приложении под этой почтой.',
  courseLifetimeNote: 'Одна оплата, доступ навсегда',
  courseOrSubscribe: 'Или клуб вместе с курсом — {price} в месяц, одной оплатой {year} за год',
  nodeWorkout: 'Тренировка',
  // It said «7 000 шагов» while the app counted steps, which kept the pill from repeating the
  // «Отдых» already in every rest day's own title. Steps are gone, so the pill is a walk — which
  // is what the day is, and what its title says it is («Отдых и прогулка»).
  nodeRest: 'Прогулка',
  nodeTest: 'Тест',
  nodeBenchmark: 'Бенчмарк',
  nodeMilestone: 'Веха',
  blockRounds: '{n} {word}',
  blockSets: '{n} {word}',
  blockMinutes: '{n} мин',
  blockTabata: '{work} с работа / {rest} с отдых × {n}',
  breadcrumbHome: 'Главная',
  breadcrumbCourses: 'Курсы',

  // Форма заявки
  orderEmailLabel: 'E-mail',
  orderEmailPlaceholder: 'you@example.com',
  orderConsent: 'Соглашаюсь с {privacy}',
  orderConsentPrivacy: 'политикой конфиденциальности',
  orderSubmit: 'Получить доступ',
  orderSubmitting: 'Отправляем…',
  orderRedirecting: 'Переходим к оплате…',
  /*
   * Prepares the buyer for the two ways the payment page will not look like this one. The product
   * wording quoted here is the processor's own fiscal label, copied as it appears on the form — it
   * belongs on a receipt and is not ours to rewrite, so our side explains it instead. If that label
   * is ever changed in Prodamus, change it here too.
   */
  orderPaymentNote:
    'Оплата — на {host}. Курс там может называться «Доступ к обучающим материалам»: это он и есть. Укажи ту же почту, что и здесь, — по ней доступ откроется сам сразу после оплаты; другой адрес мы не свяжем с заказом.',
  orderPayAnyway: 'Всё равно перейти к оплате',
  orderSuccessTitle: 'Заявка принята',
  orderSuccessText:
    'Записали «{course}» для {email}. Доступ откроется сам, как только пройдёт оплата, — войди в приложение с этой почтой.',
  orderSuccessApp: 'Открыть приложение',
  orderErrorEmail: 'Проверь e-mail — похоже, в адресе ошибка.',
  orderErrorConsent: 'Нужно согласие с политикой конфиденциальности.',
  orderErrorNetwork: 'Нет соединения. Проверь интернет и попробуй ещё раз.',
  orderErrorGeneric: 'Не получилось отправить заявку. Попробуй ещё раз или напиши нам: {email}.',
  orderNotConfigured: 'Приём заявок ещё не подключён. Напиши нам — откроем доступ вручную:',
  orderTryAgain: 'Попробовать снова',

  // Subscribe page
  subscribeTitle: 'Клуб маленьких шагов — задание в день и тренер',
  subscribeDescription:
    'Клуб маленьких шагов: одно задание в день, серия, таблица недели и приз — час с тренером. Курс «Форма с нуля» уже внутри. Автосписаний нет.',
  subscribePlanLabel: 'Тариф',
  subscribePerMonth: '/ месяц',
  subscribePerYear: '/ год',
  subscribeBestValue: 'Выгоднее',
  subscribeOrderTitle: 'Вступить в клуб',
  subscribeOrderIntro:
    'Оставь e-mail и оплати на следующей странице — клуб и курс откроются в приложении под этой почтой сами.',
  /*
   * Эта строка стоит прямо под кнопкой оплаты и до сих пор обещала автопродление — ровно то,
   * чего нет: `content/site/plans.ts` объясняет, что рекуррентные списания у Prodamus идут через
   * отдельную клубную систему, которая не подключена, и карточка тарифа честно пишет
   * «Автосписания пока нет». Две противоположные фразы на одном экране, и та, что врёт, — ближе
   * к кнопке. Поправить надо было её.
   */
  subscribeNote: 'Оплата разовая · доступ на весь оплаченный период · продлишь, когда захочешь',
  subscribeSuccessText:
    'Записали «{course}» для {email}. Как только пройдёт платёж, доступ откроется сам — войди в приложение с этой почтой.',
  subscribeVsTitle: 'Курс или клуб?',
  // Отменять пока нечего: списаний нет, каждая оплата открывает свой период и на этом всё.
  subscribeFaq1Q: 'Что за задание дня?',
  subscribeFaq1A:
    'Одно маленькое дело: десять минут пешком, двадцать приседаний, стакан воды до кофе. Сделал — отметь в приложении и получи баллы в таблицу недели. Лидеру недели — приз.',
  subscribeFaq2Q: 'Что будет, когда оплаченный период закончится?',
  subscribeFaq2A:
    'Клуб и курс закроются, прогресс и статистика останутся. Продлишь — продолжишь с того же места.',
  subscribeFaq3Q: 'Я уже купил курс. Зачем клуб?',
  // Было «остальные четыре». Курсов шесть, опубликован один: называть число значит обещать
  // программы, которых ещё нет на сайте.
  subscribeFaq3A:
    'Купленный курс твой навсегда, и первая неделя клуба к нему — в подарок. Подписка нужна, чтобы остаться в клубе дальше: задание каждый день, таблица недели, серия и пара.',

  // О тренере
  aboutTitle: 'Сергей Титов — тренер Forma, занятия онлайн',
  aboutDescription:
    'Сергей Титов — основатель и тренер Forma, больше 10 000 часов персональных занятий. Онлайн: полчаса — техника, час — ещё нагрузка и план. Запись в приложении.',
  aboutPhilosophyTitle: 'Как устроены тренировки',
  aboutPhilosophy1Title: 'Нагрузка под тебя',
  aboutPhilosophy1Text:
    'Старт — по пяти вопросам, без тестов на максимум; проверка — после второй тренировки.',
  aboutPhilosophy2Title: 'Безопасность',
  aboutPhilosophy2Text:
    'Техника раньше объёма. У каждого движения — подсказки и версия попроще; боль — сигнал снизить нагрузку.',
  aboutPhilosophy3Title: 'Регулярность',
  aboutPhilosophy3Text:
    'Курс считает тренировки, а не дни подряд: пропуск ничего не ломает. Серия есть только в клубе — для маленьких заданий.',
  aboutScienceTitle: 'Коротко о науке',
  aboutScienceText:
    'Программы опираются на рекомендации ACSM и ВОЗ по физической активности, принцип прогрессивной перегрузки и авторегуляцию по шкале RPE.',
  aboutScienceLink: 'Читать гайды',
  /*
   * The figures under the coach's name used to have their words here — `aboutFigureSince`,
   * `aboutFigureHours`, `aboutFigureSport`. They are `COACH.figures[].label` now: the page was
   * keeping a second copy of a list content already holds, and the copy drifted the moment a
   * credential was struck from the record.
   */

  // Контакты
  contactTitle: 'Контакты',
  contactDescription:
    'Как связаться с Forma: e-mail и Telegram. Отвечаем в порядке очереди — по доступу к курсам, входу в приложение и возвратам.',
  contactIntro: 'Напиши, если не пришёл код, не открылся курс или есть вопрос по программе.',
  contactEmail: 'E-mail',
  contactTelegram: 'Telegram',
  contactBot: 'Бот Forma',
  contactOrder: 'Отвечаем в порядке очереди.',
  contactBeforeTitle: 'Перед тем как писать',
  contactBefore1: 'Код не пришёл — проверь папку «Спам» и запроси новый через минуту.',
  contactBefore2:
    'Курс не появился после оплаты — проверь, что входишь с той же почтой, что указал при оплате. Если совпадает, напиши нам с этого адреса.',
  contactBefore3: 'По возвратам — смотри политику возврата.',

  // Документы
  legalUpdated: 'Обновлено: {date}',
  legalContents: 'Содержание',
  privacyTitle: 'Политика конфиденциальности',
  privacyDescription:
    'Какие данные собирает Forma (e-mail, имя, данные тренировок), зачем, где хранит и как их изменить или удалить.',
  termsTitle: 'Публичная оферта',
  termsDescription:
    'Условия покупки цифровой тренировочной программы Forma: доступ, пожизненное использование, медицинский дисклеймер, ограничения и ответственность.',
  refundTitle: 'Политика возврата',
  refundDescription:
    'Как вернуть деньги за курс Forma: {days} дней с момента активации, если выполнено меньше {n} тренировок.',

  // 404
  notFoundTitle: 'Страница не найдена',
  notFoundText: 'Такой страницы нет или её адрес изменился.',
  notFoundHome: 'На главную',

  // Главная v2 (PR 2): строительные блоки — форма старта, липкая панель, клуб, тренер, цены.
  // Форма старта (StartForm.tsx): почта необязательна, согласие — `app.authLegal` из приложения.
  startEmailLabel: 'Почта',
  startEmailPlaceholder: 'Твоя почта — необязательно',
  startCta: 'Начать бесплатно',
  startHint: 'Пришлём код на почту — без пароля и без карты',
  startEmailInvalid: 'Проверь адрес — или оставь поле пустым',
  // Позвать с собой: кнопка, текст для «Поделиться», копирование ссылки.
  shareCta: 'Позвать с собой',
  shareTitle: 'Forma — кроссфит дома',
  copyLink: 'Скопировать ссылку',
  copyLinkDone: 'Ссылка скопирована',
  copyLinkFailed: 'Не удалось — ссылка в сообщении выше',
  stickyRegion: 'Быстрый старт',
  // Цена клуба: 666 ₽ только рядом с 7 990 ₽; на английском — только цена за год.
  clubPriceMonth: '{price} / мес',
  clubPriceYear: '{price} за год',
  clubJoinYear: 'Вступить — {price} за год',
  clubChargeShort: '{price} за год, одной оплатой',
  clubOr30: 'Или доступ на 30 дней — {price}',
  clubNoAutoRenew: 'Автосписаний нет',
  // Занятия с тренером (SessionTickets.astro).
  ticketsMinutes: '{n} минут',
  ticketsHalfCta: 'Выбрать полчаса',
  ticketsHourCta: 'Выбрать час',
  // Лестница цен (PriceLadder.astro).
  ladderLabel: 'Цены',
  ladderFreeTitle: 'Тренировка 1',
  ladderCourseNote: 'неделя клуба в подарок',
  ladderCourseCta: 'Купить курс',
  ladderClubTitle: 'Клуб и курс',
  ladderClubBadge: 'Выгоднее',
  ladderCoachCta: 'Записаться к тренеру',
  // Путь курса в телефоне (PathPhone.astro).
  phonesPath: 'Путь курса',
  phonesToday: 'сегодня',
  // QR для десктопа (QrCode.astro).
  qrLabel: 'Открой на телефоне — наведи камеру',
  // Приглашение начать вместе (src/lib/share/invite.ts). {date} — «5 октября», из Intl.
  inviteWhen: 'с понедельника, {date}',
  inviteWhenTomorrow: 'с завтрашнего понедельника, {date}',
  inviteWhenToday: 'с сегодняшнего понедельника',
  inviteShareText:
    'Давай {when} тренироваться вместе? Это Forma — кроссфит дома маленькими шагами от тренера Сергея Титова: короткие тренировки без прыжков, нагрузка подстраивается. Первая — бесплатно: {url}',
  inviteShareRef: 'Оплатишь клуб по этой ссылке — нам двоим по +30 дней.',
  inviteCalendarTitle: 'Forma — тренировка 1',
  inviteCalendarDetails: 'Первая тренировка, вместе. Открыть: {url}',
  inviteWhenSoon: 'с ближайшего понедельника',
  inviteSoonLabel: 'в ближайший понедельник',
  // Карточка «Позвать с собой» (ShareInvite.tsx). Без neon: кнопка «Отправить» — тёплый градиент.
  inviteChip: 'Старт — {date}',
  inviteNameLabel: 'Как тебя подписать',
  inviteNamePlaceholder: 'Имя — необязательно',
  inviteNameHint: 'Только буквы, до 16 — иначе без подписи',
  invitePreviewLabel: 'Что придёт в сообщении',
  inviteSend: 'Отправить',
  inviteCalendar: 'В календарь',
  inviteCopyShort: 'Ссылка',
  inviteCopiedShort: 'Скопировано',
  inviteCalendarShort: 'Календарь',
  inviteCalendarGoogle: 'Google Календарь',
  inviteCalendarFile: 'Файл для Apple и Outlook (.ics)',
  inviteRefOff: '+30 дней клуба вам двоим — если ссылка личная и по ней оплатят клуб.',
  inviteRefOn: 'Ссылка личная: оплатят клуб по ней — вам двоим по +30 дней.',
  // Страница друга /together/. Имя из ссылки ставится только через textContent.
  togetherEyebrowFrom: '{name} зовёт тебя',
  togetherEyebrowPlain: 'Приглашение',
  togetherH1: 'Тренируемся вместе с понедельника',
  togetherLead: '{date} — первая тренировка. Бесплатно, около {total} мин.',
  togetherLeadSoon: 'В ближайший понедельник',
  togetherStart: 'Начать с тренировки 1',
  togetherReply: 'Ответить: я в деле',
  togetherReplyText: 'Я в деле — в понедельник начинаем!',
  togetherReplyDone: 'Скопировано — отправь в чат',
  togetherReplyFailed: 'Не удалось скопировать — просто напиши в ответ «я в деле»',
  togetherOwnLink: 'Это твоя ссылка — отправь её',
  togetherInApp: 'Открой в браузере, чтобы не потерять приглашение',
  togetherWeekEyebrow: 'Первая неделя',
  togetherWeekTitle: 'Как пройдёт первая неделя',
  togetherClubEyebrow: 'Вдвоём в клубе',
  togetherClubTitle: 'Одна таблица на двоих',
  togetherClubRef: '+30 дней клуба вам обоим — если оплатишь клуб по этой ссылке.',
  togetherMoreTitle: 'Позвать ещё кого-то',
  togetherFaq1Q: 'Как получить +30 дней?',
  togetherFaq1A:
    'Открой личную ссылку того, кто позвал, и вступи в клуб через приложение — по +30 дней получите оба. Награды нет, если ты уже был(а) в клубе или покупаешь только курс. Это не скидка: цена та же, прибавляются дни.',
  togetherFaq2Q: 'Что за приз паре?',
  togetherFaq2A:
    'Каждое воскресенье паре наверху таблицы клуба — час с тренером каждому из пары. Победителя объявляет тренер, спорные случаи решает он же.',
  togetherFaq3Q: 'Как мы окажемся в одной паре?',
  togetherFaq3A:
    'Если клуб оплачен по личной ссылке, вы станете парой сами — когда ни у кого из вас ещё нет пары. Иначе один из вас нажмёт «Позвать друга» в дуо. А если пары нет, в понедельник клуб подберёт напарника.',
  // /subscribe/: подсказка тем, кто пришёл по приглашению (показывается скриптом).
  subscribeRefNote:
    'Пришли по приглашению? Вступи через приложение — так +30 дней засчитаются вам обоим.',
  subscribeRefCta: 'Вступить через приложение',
  // Визуальная главная: одна строка на секцию, подписи плиток до четырёх слов.
  heroLead: '14–21 минута, стул и коврик. Первая — бесплатно, без карты.',
  heroChipAdapt: 'Нагрузка под тебя',
  filmedEyebrow: 'На видео',
  filmedTitle: 'Каждое движение — на видео',
  filmedMore: 'Все упражнения',
  adaptBarToday: 'Сегодня',
  adaptBarNext: 'Следующая',
  adaptEasyTag: 'Было легко',
  adaptDelta: '+{n} %',
  adaptMore: 'Как это работает',
  clubTileTask: 'Задание в день',
  clubTileStreak: 'Серия дней',
  clubTilePrize: 'Приз недели',
  clubTileDuo: 'Соло или вдвоём',
  coachRules: 'Онлайн · перенос за 24 часа · без возврата',
  coachFiguresLabel: 'Сергей Титов в цифрах',
  ladderCourseShort: 'Курс навсегда',
  ladderFootnoteShort:
    'Автосписаний нет. Возврат — {days} дней, если сделано меньше {n} тренировок.',
  // Клуб (/subscribe/) и тренер (/about/), PR 4: подписи — до двух строк, остальное в FAQ.
  subscribeStartFirst: 'Сначала тренировка 1 — бесплатно',
  subscribeDayEyebrow: 'Один день в клубе',
  subscribeDayTitle: 'Маленькое дело каждый день',
  subscribeStreakEyebrow: 'Серия и приз',
  subscribeStreakTitle: 'Дни подряд — и приз недели',
  subscribeStreakLine: 'Каждую веху приложение отмечает — один раз.',
  subscribePrizeDuo: 'В дуо — каждому из пары.',
  subscribeDuoEyebrow: 'Соло или вдвоём',
  subscribeDuoTitle: 'Вдвоём — неудобно подвести',
  subscribeBotEyebrow: 'Сообщения в Telegram',
  subscribeBotTitle: 'Бот напомнит о задании',
  subscribeBotMorningWhen: 'Утром',
  subscribeBotMorning: 'Задание дня',
  subscribeBotEveningWhen: 'Вечером',
  subscribeBotEvening: 'Если серия под угрозой',
  subscribeBotSundayWhen: 'В воскресенье вечером',
  subscribeBotSunday: 'Итоги недели',
  subscribeBotMute: 'Telegram подключается после входа. Сообщения можно выключить.',
  subscribePlansEyebrow: 'Тарифы',
  subscribePlansTitle: 'Год или 30 дней',
  subscribePickYear: 'Выбрать год',
  subscribePick30: 'Выбрать 30 дней',
  subscribeOrderEyebrow: 'Оплата',
  subscribeVsEyebrow: 'Сравнить',
  subscribeVsLine: 'Курс — программа навсегда. Клуб — чтобы не бросить.',
  subscribeFaq4Q: 'Кто получает приз?',
  subscribeFaq4A:
    'Тот, кто наверху таблицы в воскресенье: час один на один с Сергеем онлайн. В дуо — по часу каждому из пары. Победителя объявляет тренер, спорные случаи решает он же.',
  subscribeFaq5Q: 'Деньги спишутся сами?',
  subscribeFaq5A:
    'Нет. Оплата разовая — за год или за 30 дней, и на этом всё. Продлить можно вручную, когда захочешь.',
  subscribeFaq6Q: 'Как получить +30 дней и пару?',
  subscribeFaq6A:
    'Отправь другу личную ссылку. Оплатит клуб по ней — вам обоим по +30 дней, и вы станете парой, если ни у кого из вас её ещё нет. Если друг уже был в клубе, бонуса нет. Это не скидка: цена та же, прибавляются дни.',
  aboutOutcomesEyebrow: 'Один на один',
  aboutOutcomesTitle: 'Что даёт занятие',
  aboutSessionsEyebrow: 'Занятия онлайн',
  aboutSessionsTitle: 'Полчаса или час',
  aboutHowTitle: 'Как записаться',
  aboutHowPick: 'Оплати и выбери время',
  aboutHowWrite: 'Оплати и напиши — время поставит тренер',
  aboutRule: 'Возврата нет — занятие можно перенести, если написать не позднее чем за 24 часа',
  aboutDailyEyebrow: 'В приложении',
  aboutDailyTitle: 'Каждый день в Forma',
  aboutDailyFilmed: 'Снял каждое движение',
  aboutDailyReports: 'Смотрит каждый отчёт',
  aboutDailyBot: 'Отвечает в боте',
  aboutDailyWinner: 'Объявляет победителя недели',
  aboutPhilosophyEyebrow: 'Принципы',
  aboutCredEyebrow: 'Опыт',
  aboutBioMore: 'Подробнее о Сергее',
  aboutScienceEyebrow: 'Наука',
  // Курсы, курс, гайды, упражнения, контакты (PR 4, этап 2).
  cardStartCta: 'Тренировка 1 — бесплатно',
  cardBuyCta: 'Купить — {price}',
  cardGift: 'Неделя клуба в подарок',
  clubBandEyebrow: 'Клуб вместе с курсом',
  clubBandMore: 'Что внутри клуба',
  courseBuyCta: 'Получить доступ · {price}',
  courseInviteLine: 'Вдвоём проще не бросить — начните в понедельник.',
  courseSamplePlan: 'Весь план по минутам',
  startWorkout1Cta: 'Сделать тренировку 1 бесплатно',
  inWorkout1: 'Это движение — в тренировке 1',
  hubCtaText: 'Около {total} минут — бесплатно и без карты.',
} as const;
