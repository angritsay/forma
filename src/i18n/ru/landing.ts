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
  heroSubtitle:
    'Маленькими шагами: 13–20 минут вместе с разминкой, нужны только стул и коврик. Сергей показывает каждое движение на видео, а нагрузка подстраивается после каждой тренировки. Первая — бесплатно и без карты.',
  heroChipFree: 'Первая — бесплатно',
  heroChipTime: '13–20 минут',
  heroChipNoKit: 'Без оборудования',
  heroChipVideo: 'Видео тренера к каждому движению',
  heroChipNoJumps: 'Без прыжков',
  heroSignIn: 'Уже тренируешься? Войти',
  heroCtaApp: 'Открыть приложение',
  chipCourses: '{n} {word}',

  // Главная, 01: тренировка 1.
  firstEyebrow: 'Тренировка 1',
  firstTitle: 'Вот она — тренировка 1',
  // {work} — рабочие минуты из движка («9 мин», без минут отдыха между кругами), {total} — вся
  // тренировка с разминкой; не набирать руками.
  firstIntro:
    'По таймеру: каждую минуту — новое движение, всего {work} работы. До и после — разминка и заминка, вместе с ними около {total} мин.',
  firstQuote:
    'Первая тренировка не должна тебя уничтожить — она должна помочь захотеть прийти на вторую.',
  firstCourseTag: 'Первая тренировка бесплатно',
  firstCoursePrice: '{price} навсегда · неделя клуба в подарок',
  firstCourseLine:
    'Тренировка 1 — начало курса «{course}»: 20 тренировок, 4 блока по 5, в своём темпе.',
  firstCourseMore: 'Программа курса',
  firstCta: 'Сделать тренировку 1',

  // Главная, 02: вместе с понедельника. Никаких обещаний «вступите вдвоём — получите час».
  togetherEyebrow: 'Вместе с понедельника',
  togetherTitle: 'Позови с собой — начните в понедельник',
  togetherIntro:
    'Начинать в одиночку легко отложить, вдвоём — неудобно подвести. Ссылку можно взять прямо здесь, без регистрации.',
  togetherLinkLabel: 'Ссылка, чтобы позвать',
  togetherPersonalCta: 'Сделать ссылку личной',
  togetherNoDiscount: 'Скидки нет — есть дни и пара.',
  togetherStep1Title: 'Отправь ссылку',
  togetherStep1Text:
    'Скопируй её здесь и пришли подруге или другу — в Telegram, WhatsApp или куда удобно.',
  togetherStep2Title: 'В понедельник — тренировка 1',
  togetherStep2Text: 'Каждый у себя дома. Бесплатно, ~{total} минут.',
  togetherStep3Title: 'Дальше — вместе в клубе',
  togetherStep3Text:
    'По желанию: клуб по подписке, одна таблица на двоих, а паре наверху в воскресенье — по часу с тренером каждому.',

  // Главная, 03: нагрузка идёт за тобой (демо DifficultyDemo).
  adaptEyebrow: 'Как подстраивается нагрузка',
  adaptTitle: 'Нагрузка идёт за тобой',
  adaptIntro:
    'Перед тренировкой выбираешь: полегче, как обычно или посложнее — приложение подскажет. После — одна оценка, и следующая сдвигается на несколько процентов. Максимум не выжимаем.',
  adaptWorkoutLabel: 'Тренировка из курса «{course}»: {workout}',
  adaptRecommended: 'Рекомендуем',
  adaptPlanTitle: 'Твой план',
  // «72 очка» under the minutes of a difficulty row; the engine's real figure for this workout.
  adaptPointsOne: '{n} очко',
  adaptPointsFew: '{n} очка',
  adaptPointsMany: '{n} очков',
  adaptRpeTitle: 'После тренировки — одна оценка',
  adaptRpeIntro: 'Насколько тяжело было по шкале от 1 до 10? От ответа зависит следующая нагрузка.',
  adaptRpeEasy: 'Легко · RPE 5',
  adaptRpeOk: 'В самый раз · RPE 7',
  adaptRpeHard: 'Слишком тяжело · RPE 9',
  adaptRpePain: 'Что-то болело',
  adaptNextTime: 'В следующий раз',
  adaptScaleNow: 'Коэффициент нагрузки: {scale}',
  adaptHowTitle: 'Правила, по которым это считается',
  /*
   * The engine's constants (src/lib/training) as pills. The numbers are filled in from
   * `ADAPTATION` and `CHOICE_VOLUME` by the home page, so the pills cannot drift from the engine.
   */
  adaptRuleEasy: 'Легко → {x}',
  adaptRuleModerate: 'В самый раз → {x}',
  adaptRuleHard: 'Слишком тяжело → {x}',
  adaptRulePain: 'Что-то болело → {x}',
  adaptRuleEasier: 'Полегче · объём ×{x}',
  adaptRuleHarder: 'Посложнее · объём ×{x}',
  adaptRow1Title: 'Старт — пять вопросов',
  adaptRow1Text: 'Без тестов на максимум. Проверка — после второй тренировки, {n} мин.',
  adaptRow2Title: 'Больное бережём',
  adaptRow2Text: 'Колени, спина, плечи, запястья: меняются сами упражнения, а не только повторы.',
  adaptRow3Title: 'Пропуск ничего не ломает',
  adaptRow3Text: 'Курс считает тренировки, а не дни подряд.',
  adaptCta: 'Попробовать на тренировке 1',

  pathNodeLocked: 'Закрыто',
  cardView: 'Открыть курс',
  /* The ticket's kicker: what kind of thing this is («Курс · Начальный»), as in the app. */
  cardKicker: 'Курс',

  // Главная, 04: клуб маленьких шагов. Заголовок, лид и фичи — ключи приложения (`app.club*`).
  clubEyebrow: 'Клуб — чтобы не бросить',
  clubSoloTitle: 'Соло или вдвоём',
  clubDuoPrize: 'В дуо приз — час с тренером каждому из пары.',
  clubBotTitle: 'Сообщения в Telegram',
  clubBot:
    'Если подключишь Telegram, бот пришлёт задание утром, напомнит вечером, если серия под угрозой, и подведёт итоги в воскресенье вечером. Сообщения можно выключить.',
  clubFirstFree: 'Сначала тренировка 1 — бесплатно',
  clubInvite: 'Позвать с собой — +30 дней',

  // Главная, 05: тренер.
  coachEyebrow: 'Тренер',
  coachTitle: 'Сергей Титов — полчаса или час онлайн',
  coachCredentials: 'Образование и сертификаты',
  coachMore: 'Подробнее о тренере',
  coachBook: 'Записаться на занятие',
  coachBookHint: 'Полчаса или час онлайн · от {price} · в приложении',

  // Главная: до и после (подпись — `app.clubPhotosClientsRow`).
  resultsEyebrow: 'Ученики Сергея',
  resultsTitle: 'До и после — с персональных занятий',
  resultsBefore: 'До',
  resultsAfter: 'После',

  // Главная, 06: цены.
  pricesEyebrow: 'Цены',
  pricesTitle: 'Начать — бесплатно',

  // Главная, 07: FAQ + финальный призыв.
  faqEyebrow: 'Вопросы',
  faqTitle: 'Частые вопросы',
  homeCtaTitle: 'Тренировка 1 ждёт',
  homeCtaText: '~{total} минут, стул и коврик. Бесплатно и без карты.',
  homeCtaNote:
    'Приложение работает в браузере, скачивать ничего не нужно — добавь его на экран «Домой», и оно откроется одним касанием.',
  // Финальный призыв других страниц (about, courses).
  ctaTitle: 'Начни с первой тренировки',
  ctaText: 'Выбери курс, оставь e-mail — и тренируйся дома в своём темпе.',
  ctaPrimary: 'Выбрать курс',
  ctaSecondary: 'Открыть приложение',

  // Хаб курсов
  coursesHubTitle: 'Курсы кроссфита дома — с оборудованием и без',
  coursesHubDescription:
    'Курс «Форма с нуля»: двадцать тренировок кроссфита дома без оборудования, нагрузка под тебя, видео тренера к каждому движению. Плюс клуб и тренер в Telegram.',
  coursesHubH1: 'Курсы',
  coursesHubIntro: 'Двадцать тренировок по порядку, в своём темпе. Доступ навсегда.',
  filterEquipment: 'Оборудование',
  filterLevel: 'Уровень',
  filterAll: 'Все',
  filterReset: 'Сбросить фильтры',
  filterNoResults: 'Под такие фильтры курсов нет.',
  filterResultsLabel: 'Курсы',

  // Страница курса
  courseTitleSuffix: 'курс для дома',
  courseCtaOrder: 'Получить доступ',
  courseAboutTitle: 'О курсе',
  courseForWhomTitle: 'Кому подойдёт',
  courseOutcomesTitle: 'Что получишь',
  courseEquipmentTitle: 'Оборудование',
  courseEquipmentNone: 'Без оборудования — нужен устойчивый стул и коврик',
  courseProgramTitle: 'Программа',
  courseProgramIntro: 'По неделям. Раскрой неделю, чтобы увидеть дни.',
  courseWeek: 'Неделя {n}',
  courseDay: 'День {n}',
  courseDeload: 'Разгрузка',
  // Блок был «Пример тренировки» — витриной. Теперь это приглашение: та же тренировка, но её
  // можно сделать, а не только прочитать. Обещание короткое и проверяемое.
  courseSampleTitle: 'Первая тренировка — бесплатно',
  courseSampleIntro:
    'Вот она целиком — как в приложении, до подстройки под твой уровень. Её можно сделать прямо сейчас, без карты и без оплаты.',
  courseSampleCta: 'Сделать её в приложении',
  // Строка над ценой: то, что человек получает до того, как что-то решит.
  courseFreeFirst: 'Первая тренировка бесплатно',
  courseAdaptTitle: 'Как приложение подстраивается',
  courseAdaptText:
    'Перед тренировкой выбираешь: полегче, как обычно или посложнее. После — оценка усилия от 1 до 10, и следующая нагрузка меняется.',
  // The three numbers of that paragraph, as pills.
  courseAdaptEasy: '+5 % когда легко',
  courseAdaptHard: '−5 % когда тяжело',
  courseAdaptDeload: 'Разгрузка встроена',
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
  courseOrSubscribe: 'Или клуб вместе с курсом — {price} в месяц при оплате за год',
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
  subscribeTitle: 'Клуб маленьких шагов и курс для дома',
  subscribeDescription:
    'Клуб маленьких шагов: одно задание в день, таблица недели с призом, серия и пара. Курс «Форма с нуля» входит в подписку. Помесячно или на год.',
  subscribeEyebrow: 'Клуб',
  subscribeLead:
    'Большие планы не выдерживают рабочую неделю. В клубе — одно маленькое задание в день, таблица недели и пара, а курс «Форма с нуля» уже внутри.',
  subscribeIncludes: 'Что входит',
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
  subscribeCourseHint: 'Нужен только курс, навсегда?',
  subscribeCourseLink: 'Смотреть курс',
  subscribeVsTitle: 'Курс или клуб?',
  subscribeVsCourse:
    'Один курс, одна оплата, твой навсегда — и первая неделя клуба в подарок. Когда нужна программа тренировок.',
  subscribeVsPlan:
    'Клуб и курс за месяц или за год: задание каждый день, таблица, серия и пара. Когда цель — не бросить.',
  // Отменять пока нечего: списаний нет, каждая оплата открывает свой период и на этом всё.
  subscribeFaq1Q: 'Что за задание дня?',
  subscribeFaq1A:
    'Одно маленькое дело: десять минут пешком, двадцать приседаний, стакан воды до кофе. Сделал — отметь в приложении и получи баллы в таблицу недели. Лидеру недели — приз.',
  subscribeFaq2Q: 'Что будет, когда оплаченный период закончится?',
  subscribeFaq2A:
    'Клуб и курс закроются, прогресс и статистика останутся. Автосписаний нет: деньги уходят, только когда ты платишь сам. Продлишь — продолжишь с того же места.',
  subscribeFaq3Q: 'Я уже купил курс. Зачем клуб?',
  // Было «остальные четыре». Курсов шесть, опубликован один: называть число значит обещать
  // программы, которых ещё нет на сайте.
  subscribeFaq3A:
    'Купленный курс твой навсегда, и первая неделя клуба к нему — в подарок. Подписка нужна, чтобы остаться в клубе дальше: задание каждый день, таблица недели, серия и пара.',

  // О тренере
  aboutTitle: 'О тренере',
  aboutDescription:
    'Кто ведёт курсы Forma, как устроена адаптивная нагрузка и почему безопасность и регулярность важнее рекордов.',
  aboutPhilosophyTitle: 'Принципы',
  aboutPhilosophy1Title: 'Нагрузка под тебя',
  aboutPhilosophy1Text:
    'Одинаковых людей нет, поэтому нет и одинаковых тренировок. Стартовый уровень задают тесты, дальше нагрузка меняется по твоим оценкам усилия.',
  aboutPhilosophy2Title: 'Безопасность',
  aboutPhilosophy2Text:
    'Техника раньше объёма. У каждого упражнения есть подсказки, типичные ошибки и более простая версия. Боль — сигнал снизить нагрузку, а не терпеть.',
  aboutPhilosophy3Title: 'Регулярность',
  aboutPhilosophy3Text:
    'Результат дают недели подряд, а не одна тяжёлая тренировка. Поэтому приложение считает тренировки, а не дни без пропусков, и пропуск ничего не обнуляет.',
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
  notFoundApp: 'Открыть приложение',

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
  ticketsPickTime: 'Оплати и выбери время',
  ticketsWrite: 'Оплати и напиши — время поставит тренер',
  ticketsNote: 'Возврата нет — занятие можно перенести, если написать не позднее чем за 24 часа.',
  // Лестница цен (PriceLadder.astro).
  ladderLabel: 'Цены',
  ladderFreeTitle: 'Тренировка 1',
  ladderFreePrice: '{price} — без карты, можно повторять',
  ladderCourseTitle: 'Курс «{course}» навсегда',
  ladderCourseNote: 'неделя клуба в подарок',
  ladderCourseCta: 'Купить курс',
  ladderClubTitle: 'Клуб и курс',
  ladderClubBadge: 'Выгоднее',
  ladderCoachTitle: 'Тренер один на один',
  ladderCoachPrice: 'Полчаса — {half} · час — {hour}',
  ladderCoachCta: 'Записаться к тренеру',
  ladderFootnote:
    'Автосписаний нет: оплаченный период просто заканчивается. Курс и клуб можно вернуть в течение {days} дней, если сделано меньше {n} тренировок.',
  // Три телефона тренировки 1 (FirstWorkoutPhones.astro).
  phonesLabel: 'Тренировка 1 в приложении',
  phonesPath: 'Путь курса',
  phonesToday: 'сегодня',
  phonesPlayer: 'Плеер',
  phonesMinute: 'Минута {n} из {total}',
  phonesAfter: 'После тренировки',
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
  inviteCalendarGoogle: 'Google Календарь',
  inviteCalendarFile: 'Файл для Apple и Outlook (.ics)',
  inviteRefOff: '+30 дней клуба вам двоим — если ссылка личная и по ней оплатят клуб.',
  inviteRefOn: 'Ссылка личная: оплатят клуб по ней — вам двоим по +30 дней.',
  // Страница друга /together/. Имя из ссылки ставится только через textContent.
  togetherEyebrowFrom: '{name} зовёт тебя',
  togetherEyebrowPlain: 'Приглашение',
  togetherH1: 'Тренируемся вместе с понедельника',
  togetherLead:
    '{date} — первая тренировка. Бесплатно, ~{total} минут, без прыжков и без оборудования.',
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
  togetherWeek1Title: 'Понедельник — тренировка 1',
  togetherWeek1Text: 'Каждый у себя дома. Бесплатно, можно повторять.',
  togetherWeek2Title: 'Дальше — в своём темпе',
  togetherWeek2Text: 'Тренер советует пять в неделю, но пропуск ничего не ломает.',
  togetherWeek3Title: 'Хотите каждый день вместе — клуб',
  togetherWeek3Text: 'Одно маленькое задание в день и одна таблица на двоих. Клуб — по подписке.',
  togetherClubEyebrow: 'Вдвоём в клубе',
  togetherClubTitle: 'Одна таблица на двоих',
  togetherClubRef:
    '+30 дней клуба — тебе и тому, кто позвал, когда оплатишь клуб по этой ссылке. И вы окажетесь в одной паре, если у вас ещё нет пары.',
  togetherClubNoRef:
    'Когда оба будете в клубе, один из вас нажмёт «{invite}» в дуо — и вы пара. Или в понедельник клуб подберёт напарника.',
  togetherClubPrize:
    'Паре наверху таблицы в воскресенье — час с тренером каждому из пары. Победителя объявляет тренер.',
  togetherCoachMore: 'Подробнее о тренере',
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
} as const;
