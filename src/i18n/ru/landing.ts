/** Тексты лендинга. Ключи должны совпадать с en/landing.ts. */
export const landing = {
  // Навигация / футер
  navCourses: 'Курсы',
  navExercises: 'Упражнения',
  navGuides: 'Гайды',
  navAbout: 'О тренере',
  navSubscribe: 'Подписка',
  navApp: 'Открыть приложение',
  navHome: 'Главная',
  navContact: 'Контакты',
  navMenu: 'Меню',
  skipToContent: 'К содержанию',
  footerPrivacy: 'Политика конфиденциальности',
  footerTerms: 'Оферта',
  footerRefund: 'Возврат средств',
  footerContact: 'Контакты',
  footerProduct: 'Продукт',
  footerLegal: 'Документы',
  footerReach: 'Связаться',

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

  // Главная: SEO
  homeTitle: 'Forma — кроссфит дома, который подстраивается под тебя',
  homeDescription:
    'Пять курсов кроссфита для дома — с оборудованием и без. Пожизненный доступ, нагрузка подстраивается под твой уровень, видео к каждому упражнению.',

  // Главная: hero
  heroTitle: 'Кроссфит дома, который подстраивается под тебя',
  // One line under the headline; the facts it used to carry are the pills below it.
  heroSubtitle: 'Курсы для дома, с оборудованием и без — нагрузка подстраивается под тебя.',
  heroCtaCourses: 'Выбрать курс',
  heroCtaApp: 'Открыть приложение',
  heroTileTop: 'Адаптивная нагрузка',
  chipCourses: '{n} {word}',
  chipLifetime: 'Пожизненный доступ',
  chipAdaptive: 'Подстраивается под тебя',
  chipHome: 'Дома, с оборудованием и без',
  chipVideo: 'Видео к каждому упражнению',

  // Главная: как это работает
  howEyebrow: 'Как это работает',
  howTitle: 'Три шага до первой тренировки',
  howStep1Title: 'Выбери курс',
  howStep1Text: 'Программа тренера по неделям: тест в начале и в конце.',
  howStep2Title: 'Оставь e-mail',
  howStep2Text: 'Без паролей: почта на странице курса — и курс закреплён за тобой навсегда.',
  howStep3Title: 'Войди по коду и тренируйся',
  howStep3Text: 'Код из письма — и вперёд: путь по неделям, таймер, подсказки по технике.',

  // Главная: курсы
  resultsEyebrow: 'Результаты',
  resultsTitle: 'До и после',
  resultsIntro: 'Люди, которых тренировал Сергей. Каждая фотография опубликована с их разрешения.',
  resultsBefore: 'До',
  resultsAfter: 'После',
  coursesEyebrow: 'Курсы',
  coursesTitle: 'Выбери свою программу',
  coursesIntro:
    'Программа по неделям с тестом, отдыхом и разгрузкой. Купил один раз — доступ навсегда.',
  coursesAll: 'Все курсы',
  cardView: 'Открыть курс',
  /* The ticket's kicker: what kind of thing this is («Курс · Начальный»), as in the app. */
  cardKicker: 'Курс',

  // Главная: адаптивная нагрузка
  adaptEyebrow: 'Адаптивная нагрузка',
  adaptTitle: 'У каждой тренировки три версии. Приложение подскажет, какая твоя',
  adaptIntro:
    'Перед стартом выбираешь: полегче, как обычно или посложнее. После — одна оценка усилия, и следующая подстроится.',
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
   * The engine's constants (src/lib/training) as pills, not as three sentences: each is one fact,
   * and a fact that is not a control is a pill (design/CHANGELOG.md §10).
   */
  adaptRuleEasier: 'Полегче · объём ×0,85',
  adaptRuleHarder: 'Посложнее · объём ×1,15',
  adaptRulePoints: 'Очки ×0,8 / ×1,25',
  adaptRuleStreak7: 'Серия 7 дней · +10 %',
  adaptRuleStreak30: 'Серия 30 дней · +20 %',
  adaptRuleDeload: 'Разгрузка · объём ×0,65',

  // Главная: путь и мотивация
  pathEyebrow: 'Путь и мотивация',
  pathTitle: 'Каждая неделя — как уровень в игре',
  pathIntro: 'Тренировки, тесты и дни отдыха идут по порядку — ты всегда видишь, где находишься.',
  pathStreakTitle: 'Серия',
  pathStreakText: 'День засчитан, если ты потренировался или прошёл норму шагов.',
  pathStreakBonus: '+10 % с 7-го дня',
  pathStepsTitle: '7 000 шагов в день отдыха',
  pathStepsText: 'Записал шаги — получил очки и сохранил серию.',
  pathStepsGoal: 'цель',
  pathBoardTitle: 'Таблица лидеров',
  pathBoardText: 'Очки за тренировки и шаги — в общий рейтинг за неделю и за всё время.',
  pathYou: 'ты',
  pathWeekdays: 'П,В,С,Ч,П,С,В',
  pathNodeDone: 'Сделано',
  pathNodeCurrent: 'Следующая',
  pathNodeOpen: 'Открыто',
  pathNodeLocked: 'Закрыто',

  // Главная: внутри тренировки
  insideEyebrow: 'Внутри тренировки',
  insideTitle: 'Объяснили, показали, засекли',
  insideIntro: 'Плеер ведёт по каждому упражнению: что это, как двигаться, сколько — и отдых.',
  insideStep1Title: 'Объяснение',
  insideStep1Text: 'Подсказки по технике и типичные ошибки перед каждым упражнением.',
  insideStep2Title: 'Анимация',
  insideStep2Text: 'Фигурка показывает движение в темпе; где есть видео — оно здесь.',
  insideStep3Title: 'Таймер или повторы',
  insideStep3Text: 'Секунды идут сами, повторы отмечаешь кнопкой «Готово».',
  insideStep4Title: 'Отдых',
  insideStep4Text: 'Обратный отсчёт до следующего упражнения — можно пропустить.',
  insideTimerLabel: 'Таймер',
  insideRepsLabel: 'Повторы',
  insideRestLabel: 'Отдых',

  // Главная: тренер
  coachEyebrow: 'Тренер',
  coachCredentials: 'Образование и сертификаты',
  coachMore: 'Подробнее о тренере',
  coachBook: 'Записаться на занятие',
  coachBookHint: 'Полчаса или час онлайн · от {price} · в приложении',

  // Главная: FAQ + CTA
  faqEyebrow: 'Вопросы',
  faqTitle: 'Частые вопросы',
  ctaTitle: 'Начни с первой тренировки',
  ctaText: 'Выбери курс, оставь e-mail — и тренируйся дома в своём темпе.',
  ctaPrimary: 'Выбрать курс',
  ctaSecondary: 'Открыть приложение',

  // Хаб курсов
  coursesHubTitle: 'Курсы кроссфита дома — с оборудованием и без',
  coursesHubDescription:
    'Пять курсов кроссфита для дома: без оборудования, с гантелями, гирей и турником. Пожизненный доступ, адаптивная нагрузка, видео к упражнениям.',
  coursesHubH1: 'Курсы',
  coursesHubIntro: 'Программа по неделям с тестом в начале и в конце. Доступ навсегда.',
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
  courseEquipmentNone: 'Без оборудования — хватит коврика',
  courseProgramTitle: 'Программа',
  courseProgramIntro: 'По неделям. Раскрой неделю, чтобы увидеть дни.',
  courseWeek: 'Неделя {n}',
  courseDay: 'День {n}',
  courseDeload: 'Разгрузка',
  courseSampleTitle: 'Пример тренировки',
  courseSampleIntro: 'Первая тренировка курса — как в приложении, до подстройки под твой уровень.',
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
  courseOrderIntro: 'Оставь e-mail — тренер подтвердит доступ, и курс появится в приложении.',
  courseLifetimeNote: 'Одна оплата, доступ навсегда',
  courseOrSubscribe: 'Или все курсы по подписке — от {price} в месяц',
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
    'Оплата — на {host}. Курс там указан как «Доступ к обучающим материалам»: это он и есть. Укажи ту же почту, что и здесь, — по ней тренер откроет доступ, другой адрес мы не свяжем с заказом.',
  orderPayAnyway: 'Всё равно перейти к оплате',
  orderSuccessTitle: 'Заявка принята',
  orderSuccessText:
    'Тренер подтвердит доступ к курсу «{course}» для {email}. После этого открой приложение и войди с этой почтой.',
  orderSuccessApp: 'Открыть приложение',
  orderErrorEmail: 'Проверь e-mail — похоже, в адресе ошибка.',
  orderErrorConsent: 'Нужно согласие с политикой конфиденциальности.',
  orderErrorNetwork: 'Нет соединения. Проверь интернет и попробуй ещё раз.',
  orderErrorGeneric: 'Не получилось отправить заявку. Попробуй ещё раз или напиши нам: {email}.',
  orderNotConfigured: 'Приём заявок ещё не подключён. Напиши нам — откроем доступ вручную:',
  orderTryAgain: 'Попробовать снова',

  // Subscribe page
  subscribeTitle: 'Все курсы. Одна подписка.',
  subscribeDescription:
    'Все курсы Forma в одной подписке: пять домашних кроссфит-программ, нагрузка под тебя, новые курсы включены. Помесячно или на год.',
  subscribeEyebrow: 'Подписка',
  subscribeLead:
    'Один курс — это старт. Подписка — все программы, и следующая уже готова, когда заканчивается эта.',
  subscribeIncludes: 'Что входит',
  subscribePlanLabel: 'Тариф',
  subscribePerMonth: '/ месяц',
  subscribePerYear: '/ год',
  subscribeBestValue: 'Выгоднее',
  subscribeOrderTitle: 'Оформить подписку',
  subscribeOrderIntro:
    'Оставь e-mail и оплати на следующей странице — курсы откроются в приложении под этой почтой.',
  subscribeNote:
    'Продлевается автоматически · отмена в любой момент · доступ до конца оплаченного периода',
  subscribeSuccessText:
    'Мы записали подписку «{course}» для {email}. Как только пройдёт платёж, открой приложение и войди с этой почтой.',
  subscribeCourseHint: 'Нужен один курс навсегда?',
  subscribeCourseLink: 'Смотреть курсы',
  subscribeVsTitle: 'Курс или подписка?',
  subscribeVsCourse:
    'Один курс, одна оплата, твой навсегда. Когда знаешь, что хочешь и где остановишься.',
  subscribeVsPlan:
    'Все курсы, оплата раз в месяц или раз в год, пока тренируешься. Когда цель — не останавливаться.',
  subscribeFaq1Q: 'Можно отменить?',
  subscribeFaq1A:
    'Да, в любой момент — в платёжном сервисе или письмом нам. Курсы остаются открытыми до конца оплаченного периода.',
  subscribeFaq2Q: 'Что будет, когда подписка закончится?',
  subscribeFaq2A:
    'Курсы закроются, прогресс и статистика останутся. Оформишь снова — продолжишь с того же места.',
  subscribeFaq3Q: 'Я уже купил курс. Он учитывается?',
  subscribeFaq3A:
    'Купленный курс твой навсегда, с подпиской или без. Подписка добавляет к нему остальные четыре.',
  planMonthlyName: 'Месяц',
  planAnnualName: 'Год',

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
    'Результат дают недели подряд, а не одна тяжёлая тренировка. Поэтому в курсах есть серии, дни отдыха и разгрузочные недели.',
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
    'Курс не появился — тренер подтверждает доступ вручную; укажи e-mail, с которого оформлял.',
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
} as const;
