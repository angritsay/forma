/**
 * Тексты приложения. Ключи должны совпадать с en/app.ts.
 * Обращение к пользователю — на «ты», без машинного перевода.
 */
export const app = {
  // «Клуб», а не «Клуб маленьких шагов»: подпись вкладки — один из четырёх слотов на 390px, и
  // имя в три слова туда не встаёт. Полное имя стоит там, где есть место — на шапке экрана и в
  // текстах приглашения (marathonTitle и ниже); короткое — во вкладке и в верхней строке.
  tabGame: 'Клуб',
  navMain: 'Основная навигация',
  navLocaleRu: 'RU',
  navLocaleEn: 'EN',

  // UI kit
  kitClose: 'Закрыть',
  kitDismiss: 'Скрыть',
  kitLoading: 'Загрузка',

  // Error states
  errorTitle: 'Что-то сломалось',
  errorDetails: 'Подробности ошибки',
  errorBody:
    'В приложении произошла непредвиденная ошибка. Перезагрузи страницу — прогресс сохранён.',
  errorReload: 'Перезагрузить',
  errorTryAgain: 'Попробовать ещё раз',
  errorLoadProfileTitle: 'Не удалось загрузить профиль',
  errorLoadProfileBody: 'Проверь соединение и попробуй ещё раз.',
  errorNotConfiguredTitle: 'Бэкенд не настроен',
  errorNotConfiguredBody:
    'Приложению нужен проект Supabase. Задай эти переменные окружения и пересобери сайт.',
  errorNotConfiguredHint: 'Пошаговая инструкция:',
  errorScreenMissingTitle: 'Этот экран пока недоступен',
  errorScreenMissingBody: 'Вернись на главный экран.',

  // Auth
  authEmailLabel: 'Почта',
  authEmailPlaceholder: 'name@example.com',
  authSendCode: 'Получить код',
  // Информированность согласия: 152-ФЗ ст. 9 требует, чтобы человек знал, на что соглашается,
  // до того как отдал данные. Вход — это одно поле и одна кнопка, а политика жила на сайте,
  // которого Telegram Mini App не показывает вовсе. Одно предложение под кнопкой это чинит.
  authLegal: 'Нажимая кнопку, ты соглашаешься с {privacy} и принимаешь {terms}.',
  authLegalPrivacy: 'политикой обработки данных',
  authLegalTerms: 'условия',
  authCodeLabel: 'Код из письма',
  authConfirm: 'Подтвердить',
  authResend: 'Отправить код ещё раз',
  authResendIn: 'Отправить ещё раз через {s} с',
  authChangeEmail: 'Изменить почту',
  // Shown only after a second request has also come up empty — see AuthScreen.
  authNoMail: 'Код не пришёл? Проверь «Спам» и «Промоакции» — письмо приходит с {from}.',
  authSignOut: 'Выйти',
  // Every one of these names what happened and what to do about it. «Проверь адрес» named neither,
  // and it was the same four words whether the field was empty, missing the «@» or a slipped
  // domain — so the reasons are split (src/lib/api/auth.ts AuthReason) and each has its own line.
  authErrorInvalidEmail: 'Адрес не похож на почтовый. После «@» нужен домен — например gmail.com',
  authErrorRateLimited: 'Слишком много запросов. Подожди минуту и нажми ещё раз.',
  authErrorInvalidCode: 'Код не подошёл. Сверь шесть цифр с последним письмом.',
  authErrorNetwork: 'Нет связи. Проверь интернет и нажми ещё раз.',
  authErrorEmailSend: 'Письмо не ушло. Подожди пару минут и запроси код заново.',
  authErrorSignupDisabled: 'Регистрация закрыта. Напиши на {from}.',
  authErrorGeneric: 'Не получилось войти. Попробуй ещё раз через минуту.',

  // Onboarding
  // One question per step, set as the display line; the answers are the only other words. The
  // leads that used to restate each question were cut per design/CHANGELOG.md §10.
  onbStepOf: 'Шаг {n} из {total}',
  onbNameTitle: 'Как тебя зовут?',
  onbNamePlaceholder: 'Имя',
  onbAge1824: '18–24',
  onbAge2534: '25–34',
  onbAge3544: '35–44',
  onbAge4554: '45–54',
  onbAge5564: '55–64',
  onbAge65: '65+',
  onbSexMale: 'Мужской',
  onbSexFemale: 'Женский',
  onbSexNa: 'Не хочу указывать',
  // Оборудование в анкете больше не спрашиваем — эти две подписи остались для листа
  // оборудования в профиле.
  onbDumbbellWeights: 'Гантели, кг',
  onbKettlebellWeights: 'Гири, кг',
  onbLimitationsTitle: 'Что беречь?',
  // Согласие на обработку данных о здоровье. Появляется только если что-то отмечено: «ничего,
  // всё в порядке» — это отсутствие таких данных, и спрашивать разрешение не на что.
  // 152-ФЗ ст. 10 относит состояние здоровья к специальной категории, для которой нужно
  // отдельное согласие; поэтому оно стоит рядом с самим вопросом, а не спрятано во входе.
  // Формулировка называет три вещи: что именно берём, зачем и кто увидит.
  onbHealthConsent:
    'Соглашаюсь, что приложение сохранит эти отметки о здоровье и будет подбирать по ним упражнения. Их видит тренер, другим участникам они не показываются. Согласие можно отозвать в профиле.',
  onbLimNone: 'Ничего, всё в порядке',
  onbLimKnees: 'Колени',
  onbLimLowerBack: 'Поясница',
  onbLimShoulders: 'Плечи',
  onbLimWrists: 'Запястья',
  onbLimHypertension: 'Повышенное давление',
  onbLimPregnancy: 'Беременность',
  // «Другое»: свободный ответ для того, чего нет в шести плашках. Подсказка говорит правду о том,
  // что дальше — тренер прочитает, упражнения сами не поменяются, — потому что пообещать замену,
  // которую мы не умеем делать по тексту, хуже, чем не обещать ничего.
  onbLimOther: 'Другое',
  onbLimOtherPlaceholder: 'Что беречь? Например: шея, голеностоп, операция на плече',
  onbLimOtherHint: 'Это прочитает тренер. Упражнения по тексту не подбираются автоматически.',
  onbAssessOfferTitle: 'Подстроить тренировки под тебя?',
  onbAssessMoves: '{n} упражнений',
  // The owner's words for this screen: «не выжимаем максимум… конец».
  onbAssessWarnTitle: 'Максимум не выжимаем',
  onbAssessWarnCta: 'Начнём',
  // Not «сколько получилось» any more: nothing was done on the screen, so the question is an
  // estimate the athlete gives, not a result the app watched them produce.
  onbAssessInstruction: 'Примерно, без максимума — сколько сделаешь спокойно',
  onbAssessInstructionHold: 'Примерно — сколько продержишься, пока спина прямая',
  onbAssessHoldLabel: 'Секунд',
  onbAssessOnKnees: 'С колен',
  onbAssessCountLabel: 'Раз',
  onbAssessDoneTitle: 'Записал',
  onbAssessRetake: 'Пройти заново',
  onbSaveError: 'Не удалось сохранить профиль. Проверь соединение и попробуй снова.',

  // Главная
  homeGreetingMorning: 'Доброе утро, {name}',
  homeGreetingAfternoon: 'Добрый день, {name}',
  homeGreetingEvening: 'Добрый вечер, {name}',
  homeGreetingNight: 'Не спится, {name}?',
  /*
   * Пять ключей серии стояли здесь — «Серия», «Чтобы не потерять серию…», «Рекорд». Серии больше
   * нет: курс Сергея — пять тренировочных дней в неделю, и человек, который делает ровно то, что
   * написано, терял серию каждые выходные. Считаем тренировки; счётчик не обнуляется.
   */
  homeWorkoutsTitle: 'Тренировки',
  homeResumeEyebrow: 'Тренировка не закончена',
  homeResumeFinishedEyebrow: 'Результат не сохранён',
  homeResumeCta: 'Продолжить',
  homeResumeSave: 'Завершить и сохранить',
  homeTodayEyebrow: 'Сегодня',
  homeTodayOpen: 'Открыть',
  // The prototype's «ВЫБЕРИ программу»: the first word heavy, the rest light (DisplayTitle).
  homeTodayNoCourseTitle: 'Выбери программу',
  homeTodayNoCourseBody: 'И первая тренировка появится здесь — уже сегодня.',
  homeTodayCompletedTitle: 'Курс пройден',
  homeTodayOpenPath: 'Открыть путь',
  homeStatsKcal: 'ккал за неделю',
  homeStatsMinutes: 'Минут за неделю',
  homeStatsPoints: 'Очки',
  homeStatsPointsHint: 'за всё время',
  homeYourCourses: 'Твои курсы',
  homeMoreCourses: 'Ещё курсы',
  homeCourseProgress: '{pct}% пройдено',
  homeDeckGameLocked: 'Входит в подписку',
  homeDeckGameTrial: 'Пробная неделя с курсом — осталось {n}',
  homeDeckGameTrialDayOne: '1 день',
  homeDeckGameTrialDayFew: '{n} дня',
  homeDeckGameTrialDayMany: '{n} дней',
  homeDeckGameLockedCta: 'Оформить подписку',
  // One word each, as the prototype's buttons have it: «Начать →», «Продолжить →».
  homeDeckStart: 'Начать',
  homeDeckContinue: 'Продолжить',
  homeErrorTitle: 'Не удалось загрузить прогресс',
  homeErrorBody: 'Проверь соединение и попробуй ещё раз.',

  // Курсы
  coursesOwned: 'Твои',
  coursesLocked: 'Закрыт',
  coursesContinue: 'Продолжить · {pct}%',
  coursesStart: 'Начать курс',
  coursesCompleted: 'Пройден — открыть путь',
  coursesGetAccess: 'Получить доступ',
  coursesBoughtHint:
    'Уже оплатил? Курс откроется сам, обычно за пару минут. Если нет — напиши нам.',
  coursesSubscribe: 'Подписка — все курсы',
  coursesSubscribeHint: 'от {price} в месяц · или купи этот курс навсегда',
  coursesBuyOne: 'Купить этот курс',
  coursesWeekWordOne: 'неделя',
  coursesWeekWordFew: 'недели',
  coursesWeekWordMany: 'недель',
  coursesPerWeekOne: '{n} раз в неделю',
  coursesPerWeekFew: '{n} раза в неделю',
  coursesPerWeekMany: '{n} раз в неделю',
  coursesAvgMin: '~{n} мин',
  coursesOpenPage: 'Открыть страницу курса',

  // Путь курса
  pathProgressLabel: 'Прогресс курса',
  pathProgress: '{done} из {total}',
  // Кикеры под цифрами в шапке курса. Держи их в одно слово: они набраны капсом с трекингом
  // .14em и стоят в колонке шириной в треть экрана — два слова уже переносятся.
  pathStatDays: 'Дней',
  pathStatMinutes: 'Минут',
  pathStatLoad: 'Нагрузка',
  // The head's one line beside the ring, in two weights: «ДЕНЬ 4» heavy, «из 28» light.
  pathDayN: 'День {n}',
  pathOfTotal: 'из {total}',
  pathLeaderboard: 'Рейтинг',
  pathScaleBadge: 'Твоя нагрузка ×{scale}',
  pathScaleTitle: 'Как подстраивается нагрузка',
  pathScaleBody1:
    'Все тренировки курса умножаются на твой личный коэффициент — сейчас это ×{scale}. Он меняет повторения, секунды и количество подходов.',
  pathScaleBody2:
    'После каждой тренировки ты оцениваешь усилие от 1 до 10. Легко и всё выполнено — +5%. В самый раз — +2%. На пределе или выполнено меньше 80% — −5%. Боль — −10% и напоминание поберечь себя.',
  pathScaleBody3:
    'Коэффициент держится в пределах ×0,5–×1,5. Перед каждой тренировкой ты по-прежнему выбираешь: полегче, как обычно или посложнее.',
  pathScaleStart: 'Стартовый коэффициент рассчитан по индексу формы из анкеты.',
  pathWeek: 'Неделя {n}',
  pathLockedToast: 'Сначала пройди предыдущие тренировки',
  pathNodeDone: 'Выполнено',
  pathNodeCurrent: 'Следующая',
  pathNodeOpen: 'Доступно',
  pathNodeLocked: 'Закрыто',
  pathRestTitle: 'День отдыха',
  pathRestDoneHint: 'Отдых — часть плана. Ничего делать не надо, просто закрой день.',
  pathRestMarkDone: 'Закрыть день отдыха',
  pathRestMarked: 'День отдыха засчитан',
  pathRestSkip: 'Пропустить день отдыха',
  pathRestCompleted: 'День отдыха засчитан',
  pathRestSkipped: 'День отдыха пропущен',
  pathRestAlreadyDone: 'Этот день отдыха уже засчитан.',
  pathMilestoneTitle: 'Веха',
  pathMilestoneBody: 'Контрольная точка на пути. Отметь её и двигайся дальше.',
  pathMilestoneDone: 'Веха пройдена',
  pathMilestoneMark: 'Отметить',
  pathSaveError: 'Не удалось сохранить. Проверь соединение и попробуй снова.',
  // --- Первая тренировка бесплатно (0019) ------------------------------------
  // Обещание короткое и проверяемое: одна тренировка, без карты. Всё, что сложнее, человек
  // читать не станет, а всё, что мягче («попробуй курс»), обещает больше, чем даётся.
  coursesFreeBadge: 'Первая тренировка бесплатно',
  coursesTryFree: 'Попробовать',
  // Цена стоит прямо на кнопке: к этому моменту человек уже сделал тренировку, и «Открыть весь
  // курс» без числа читается как ещё один шаг к неизвестному.
  coursesUnlock: 'Открыть весь курс — {price}',
  unlockCardEyebrow: 'Это была первая тренировка',
  unlockCardTitle: 'Дальше — весь курс',
  unlockCardBody:
    'Тренировки по порядку, каждая подстроена под твой уровень по тому, как прошла эта. Одна оплата, доступ навсегда.',
  unlockTitle: 'Открыть весь курс',
  unlockBody:
    'Первая тренировка «{course}» была бесплатной. Дальше — весь курс: тренировки по порядку, с подстройкой под твой уровень. Одна оплата, доступ навсегда.',
  unlockCta: 'Перейти к оплате',
  unlockNote: 'Курс откроется на {email} сразу после оплаты — обычно за пару минут.',
  // Заказ не записался: тогда обещать мгновенный доступ нельзя.
  unlockNoteManual:
    'Заказ не записался — оплатить можно, но доступ откроет тренер вручную. Обычно в тот же день.',
  unlockNoPayment: 'Оплата этого курса пока не подключена. Напиши нам, и мы всё откроем.',
  // «Оплатил(а) с другой почты» — миграция 0020.
  //
  // Доступ ищется по почте, а почту плательщика задаёт не приложение: короткая ссылка Prodamus
  // теряет `?customer_email=`, и адрес в форме тот, который человек вписал руками. Спрашиваем
  // номер заказа из чека, а не вторую почту: чужую почту знает кто угодно, номер — только тот,
  // кто платил.
  claimLink: 'Оплатил(а) с другой почты?',
  claimTitle: 'Оплата с другой почты',
  claimBody:
    'Если оплата прошла не с той почты, с которой ты входишь, — введи номер заказа из письма-чека Prodamus. Мы найдём платёж и откроем доступ здесь.',
  claimPlaceholder: 'Номер заказа из чека',
  claimCta: 'Найти оплату',
  claimOk: 'Нашли. Доступ открыт.',
  claimLinked:
    'Платёж нашёлся, адрес привязан — но открывать пока нечего. Напиши нам, и мы разберёмся.',
  claimNotFound: 'Такого номера не нашли. Проверь его в письме-чеке — или его уже забрали.',
  claimEmailTaken: 'Эта почта уже привязана к другому аккаунту. Напиши нам, и мы разберёмся.',
  claimRateLimited: 'Слишком много попыток. Попробуй через час.',
  // Тап по узлу, до которого дошли, но который за деньгами.
  // Тому, кто пробу ещё не тратил, говорить «была бесплатной» нельзя: этого не было.
  pathTrialLeftBody: 'Первая тренировка курса бесплатна — начни с неё, а дальше решишь.',
  pathTrialLeftCta: 'К первой тренировке',
  pathPaywalledToast: 'Дальше — по подписке или после оплаты курса',
  pathNotOwnedTitle: 'Этого курса у тебя пока нет',
  pathNotOwnedBody: 'Первая тренировка была бесплатной. Дальше — весь курс, одной оплатой.',
  pathNotOwnedCta: 'Страница курса',
  pathNotFound: 'Курс не найден',
  pathCompleted: 'Курс пройден!',

  // Превью тренировки
  nodeBack: 'Путь курса',
  nodeTestBadge: 'Тест',
  nodeBenchmarkBadge: 'Бенчмарк',
  nodeTestTitle: 'Как проходит тест',
  nodeTestBody:
    'Легко разомнись, потом выполни каждый тест на максимум с полным отдыхом между ними. Записывай честные цифры: по ним приложение подбирает нагрузку, а в конце курса ты повторишь тест и увидишь прогресс.',
  nodeBenchmarkTitle: 'Что такое бенчмарк',
  nodeBenchmarkBody:
    'Фиксированный комплекс на время. Запусти таймер, сделай всю работу как можно быстрее с чистой техникой и запиши результат. Повтори его позже — и увидишь прогресс в секундах.',
  nodeDeloadNote: 'Разгрузочная неделя: объём ×0,65, отдых длиннее. Очки — как обычно.',
  nodeRepeatNote: 'Эта тренировка уже выполнена. За повтор начисляется 50% очков.',
  // Set through DisplayText: «НАСКОЛЬКО тяжело сегодня?» — the prototype's own line.
  nodeDifficultyTitle: 'Насколько тяжело сегодня?',
  nodeDuration: '~{min} мин',
  nodeRepsOne: '{n} повтор',
  nodeRepsFew: '{n} повтора',
  nodeRepsMany: '{n} повторов',
  nodeWorkMin: '{min} мин работы',
  nodePoints: '{n} оч.',
  nodeKcal: '~{n} ккал',
  nodeWhatsInside: 'Что внутри',
  nodePlanTitle: 'План',
  nodeSetWordOne: 'подход',
  nodeSetWordFew: 'подхода',
  nodeSetWordMany: 'подходов',
  nodeRoundWordOne: 'круг',
  nodeRoundWordFew: 'круга',
  nodeRoundWordMany: 'кругов',
  nodeBlockMinutes: '{n} мин',
  nodeBlockTabata: '{work} с / {rest} с × {n}',
  nodeLoadKg: '{kg} кг',
  nodeInWorkout: 'За тренировку',
  nodeRestAfter: 'отдых {s} с',
  nodeStart: 'Начать тренировку',
  nodeReplaceTitle: 'Есть незаконченная тренировка',
  nodeReplaceBody:
    'Если начнёшь эту, та тренировка и всё, что в ней отмечено, пропадут. Может, сначала доделаешь её с главного экрана?',
  nodeStartError: 'Не удалось начать тренировку. Проверь соединение и попробуй снова.',
  nodeLocked: 'Сначала пройди предыдущие тренировки — тогда эта откроется.',
  nodeNotFound: 'Тренировка не найдена',
  nodeProfileMissingTitle: 'Заверши настройку профиля',
  nodeProfileMissingBody: 'Чтобы собрать план, нужны твой уровень и инвентарь.',
  nodeProfileMissingCta: 'Настроить',

  // Плеер
  playerKg: '{kg} кг',
  playerSetOf: 'Подход {n} из {total}',
  playerRoundOf: 'Круг {n} из {total}',
  playerMinuteOf: 'Минута {n} из {total}',
  playerSetsOne: '{n} подход',
  playerSetsFew: '{n} подхода',
  playerSetsMany: '{n} подходов',
  playerRoundsOne: '{n} круг',
  playerRoundsFew: '{n} круга',
  playerRoundsMany: '{n} кругов',
  playerBlockOf: 'Блок {n} из {total}',
  playerSectionsLabel: 'Части тренировки',
  playerSectionWarmup: 'Разминка',
  playerSectionMain: 'Тренировка',
  playerSectionCooldown: 'Заминка',
  playerSectionPart: 'Часть {n} из {total}',
  playerGo: 'Поехали',
  playerDone: 'Готово',
  playerSkipWarmup: 'Пропустить разминку',
  playerHowTo: 'Как делать',
  playerBackToVideo: 'Вернуться к видео',
  playerCardBackLabel: 'Об упражнении',
  playerTabTechnique: 'Техника',
  playerTabCues: 'Советы',
  playerTabMuscles: 'Мышцы',
  playerTabCautions: 'Осторожно',
  playerCautionsTitle: 'Противопоказания',
  playerCuesTitle: 'На что обратить внимание',
  playerMistakesTitle: 'Частые ошибки',
  playerBreathing: 'Дыхание',
  playerCautionsLead: 'С осторожностью или с заменой при:',
  playerCautionsNone: 'Особых ограничений нет — следи за техникой и не терпи острую боль.',
  playerAdjustReps: 'Количество повторений',
  playerDecrease: 'Меньше',
  playerIncrease: 'Больше',
  playerTestStart: 'Начать тест',
  playerStop: 'Стоп',
  playerTestRepsQuestion: 'Сколько повторений получилось?',
  playerTestSecondsQuestion: 'Сколько секунд удалось продержать?',
  playerTestResultLabel: 'Результат теста',
  playerTestSave: 'Записать результат',
  playerSkipRest: 'Пропустить отдых',
  playerAmrapRounds: 'Круги',
  playerAmrapRemoveRound: 'Убрать круг',
  playerRoundDone: 'Круг готов',
  playerTimeUp: 'Время!',
  playerAmrapPartial: 'Повторения в незавершённом круге',
  playerSaveScore: 'Записать результат',
  playerFortimeRound: 'Круг {n} из {total}',
  playerFortimeCap: 'Лимит {time}',
  playerFortimeFinished: 'Финиш',
  playerFortimeCapReached: 'Лимит времени вышел',
  playerFortimeCapBody: 'Ничего страшного — работа засчитается как частичный результат.',
  playerFortimeYourTime: 'Твоё время',
  playerProgressLabel: 'Прогресс тренировки',
  playerPause: 'Пауза',
  playerResume: 'Продолжить',
  playerPausedTitle: 'Пауза',
  playerPausedBody: 'Переведи дух. Таймеры стоят — нажми «Продолжить», когда захочешь вернуться.',
  playerLeaveTitle: 'Выйти из тренировки?',
  playerLeaveBody: 'Прогресс сохранён — сможешь продолжить с этого же места.',
  playerLeaveConfirm: 'Выйти',
  playerStay: 'Остаться',
  playerPrevStep: 'Предыдущий шаг',
  playerSkipStep: 'Пропустить шаг',
  // The star row is one image to a screen reader, never three separate marks.
  pathStars: '{n} из 3 звёзд',
  pathStarsNone: 'Звёзды ещё не заработаны',
  playerRestartStep: 'Начать шаг заново',
  playerEndWorkout: 'Завершить тренировку',
  playerEndTitle: 'Завершить тренировку сейчас?',
  playerEndBody: 'Всё, что уже сделано, засчитается. Остаток плана отметим как невыполненный.',
  playerEndConfirm: 'Завершить и посмотреть итоги',
  playerNoSessionTitle: 'Нет активной тренировки',
  playerNoSessionBody: 'Выбери тренировку на пути курса, чтобы начать.',

  // Итоги
  summaryEyebrow: 'Итоги',
  // The prototype's «Готово!»: one word the size of the screen, then one warm line about the
  // streak, then three figures. The ordinal is a word up to the tenth day — a figure that size
  // would fight the three under it — and «11-й день» after that.
  summaryDone: 'Готово!',
  summaryCountFirst: 'Первая. Начало положено.',
  summaryCountWord: '{ordinal} тренировка. Так и растёт форма.',
  summaryCountNum: 'Тренировка №{n}. Так и растёт форма.',
  summaryOrdinals: 'Второй|Третий|Четвёртый|Пятый|Шестой|Седьмой|Восьмой|Девятый|Десятый',
  summaryMinutes: 'Минут',
  summaryReps: 'Повторов',
  summaryKcal: 'Ккал',
  // The third figure's stand-in on a day with no rep-counted work (a plank test, растяжка).
  summaryCompletion: 'Выполнено',
  // The fold over the per-block, per-test and benchmark record, as on «Прогресс».
  summaryDetailsShow: 'Подробности',
  summaryDetailsHide: 'Свернуть',
  summaryBlocks: 'По блокам',
  summarySkipped: 'пропущено',
  summaryTests: 'Результаты теста',
  summaryBenchmark: 'Бенчмарк',
  summaryRoundsOne: '{n} круг',
  summaryRoundsFew: '{n} круга',
  summaryRoundsMany: '{n} кругов',
  summaryExtraReps: '+{n} повт.',
  summaryPartial: 'частично',
  // The one link under the button; it opens the RPE row and the note.
  summaryFeedbackTitle: 'Как зашло?',
  summaryRpeLabel: 'Нагрузка (RPE)',
  summaryFeelingLabel: 'Самочувствие',
  summaryNoteLabel: 'Заметка (необязательно)',
  summaryNotePlaceholder: 'Что стоит запомнить: сон, боль, что не пошло…',
  summarySaving: 'Сохраняем…',
  summarySaveError:
    'Не удалось сохранить итоги. Данные остались на этом устройстве — попробуй ещё раз.',
  summarySavedTitle: 'Сохранено',
  summaryAdaptTitle: 'В следующий раз',
  summaryVolumeDelta: '{delta}% объёма',
  summaryVolumeSame: 'Объём без изменений',
  summarySafetyTitle: 'Береги себя',
  summaryAchievementsTitle: 'Новые достижения',
  summaryBackToCourse: 'К пути',
  summaryShare: 'Поделиться',
  summaryShareCopied: 'Скопировано в буфер обмена',
  summaryShareText:
    '{workout}: {time}, {points} очков, {kcal} ккал, выполнено {completion}% — Forma',
  summaryNotFoundTitle: 'Тренировка не найдена',
  summaryNotFoundBody: 'Не нашли эту тренировку. Возможно, она сохранена с другого устройства.',
  summaryLoadErrorTitle: 'Не удалось загрузить итоги',
  summaryNoResultsTitle: 'Результаты недоступны',
  summaryNoResultsBody: 'Эта тренировка не была завершена на этом устройстве, поэтому итогов нет.',

  // Прогресс
  statsTitle: 'Прогресс',
  statsWeekBoardTitle: 'Кто впереди',
  statsLeaderboard: 'Рейтинг',
  statsLevelEyebrow: 'Уровень {n}',
  statsPointsValue: '{n} очков',
  statsLevelProgress: 'Сколько осталось до следующего уровня',
  // «До «Стажёра»» would be the right case and the title comes from data, which cannot be
  // declined. Putting the rank last lets it stay nominative and the line stay Russian.
  statsLevelNext: 'Ещё {n} очков — и «{title}»',
  statsLevelMax: 'Выше уровня нет. Дальше — просто тренируйся.',
  statsCalendarTotal: 'Всего {n}',
  statsCalendarWeek: 'На этой неделе {n}',
  statsCalendarWorkout: 'Тренировка',
  statsCalendarEmpty: 'Ничего не записано',
  statsCalendarFuture: 'Впереди',
  statsCalendarToday: 'сегодня',
  statsAchievementsCount: '{done} из {total}',
  // Read out to a screen reader beside each figure, never drawn. «Открыто / Закрыто» sounded
  // like a door; these say whether you have the thing.
  statsAchievementUnlocked: 'Есть',
  statsAchievementLocked: 'Пока нет',

  // Рейтинг
  leaderboardTitle: 'Рейтинг',
  leaderboardRefresh: 'Обновить',
  leaderboardTabWeek: 'Эта неделя',
  leaderboardTabAll: 'За всё время',
  leaderboardFilterLabel: 'Курс',
  leaderboardGlobal: 'Общий',
  leaderboardRankLabel: 'Место {n}',
  leaderboardYou: 'Это ты',
  leaderboardEmptyTitle: 'Очков пока нет',
  leaderboardEmptyWeek: 'Стань первым на этой неделе: заверши тренировку.',
  leaderboardEmptyAll: 'Здесь пока никто не набрал очков. Твоя первая тренировка откроет таблицу.',
  leaderboardErrorTitle: 'Не удалось загрузить рейтинг',
  leaderboardHowTitle: 'Как начисляются очки',
  leaderboardHowWorkout:
    'У каждой тренировки есть базовая стоимость — от 60 до 250 очков. Полегче — ×{easier}, как обычно — ×{normal}, посложнее — ×{harder}; итог умножается на долю выполненного плана.',
  leaderboardHowRepeat: 'Повтор уже пройденной тренировки приносит {pct}% очков.',
  leaderboardHowWeek:
    'Недельный рейтинг обнуляется каждый понедельник (по UTC). В рейтинге курса считаются только его тренировки.',

  // Профиль
  profileTitle: 'Профиль',
  profileWeightsKg: '{list} кг',
  profileLimitations: 'Что беречь',
  profileLimitationsNone: 'Ничего',
  profileSubscriptionNoneHint: 'от {price} в месяц',
  profileSubscriptionLive: '{plan} · до {date}',
  profileSubscriptionCancelled: 'Отменена · доступ до {date}',
  profileSubscriptionEnded: 'Закончилась {date} · продлить',
  profileSubscriptionPending: 'Ждёт оплаты',
  planMonthly: 'Месяц',
  planAnnual: 'Год',

  // Home: the coach's hour
  homeBookTitle: 'Занятие с тренером один на один',
  homeBookText: 'Полчаса или час по видеосвязи · от {price}',

  // Book a session
  bookTitle: 'Форма один на один',
  bookLengthLabel: 'Длительность сессии',
  bookDuration: '{n} мин',
  bookPay: 'Оплатить {price}',
  bookPickTime: 'Выбрать время',
  bookContact: 'Написать тренеру',
  bookContactHint: 'Оплата пока не подключена: напиши — о времени и оплате договоритесь напрямую.',
  bookDemoNote: 'В демо-режиме оплата отключена.',
  profileSignOut: 'Выйти',
  profileSignOutTitle: 'Выйти из аккаунта?',
  profileSignOutBody: 'Всё сделанное останется на месте. Чтобы вернуться, введи код из письма.',

  // Админка
  adminTitle: 'Админка',
  adminRefresh: 'Обновить',
  adminPurchases: 'Покупки',
  adminSearch: 'Поиск по почте',
  adminFilterLabel: 'Статус',
  adminFilterAll: 'Все',
  adminStatusPending: 'Ожидает',
  adminStatusActive: 'Активна',
  adminStatusRefunded: 'Возврат',
  adminCountOne: '{n} покупка',
  adminCountFew: '{n} покупки',
  adminCountMany: '{n} покупок',
  adminCreated: 'Создана {date}',
  adminActivated: 'активирована {date}',
  adminActivate: 'Активировать',
  adminRefund: 'Оформить возврат',
  adminConfirmActivateTitle: 'Открыть доступ?',
  adminConfirmActivateBody: 'Курс сразу откроется для этой почты.',
  adminConfirmRefundTitle: 'Отметить возврат?',
  adminConfirmRefundBody: 'Доступ к курсу для этой почты закроется.',
  adminStatusUpdated: 'Статус обновлён',
  adminActionError: 'Не удалось применить изменение.',
  adminForbidden: 'Только для админов. Войди с почтой тренера.',
  adminAdd: 'Добавить покупку',
  adminAddLead: 'Открывает доступ вручную: перевод, подарок, обращение в поддержку.',
  adminAddEmail: 'Почта',
  adminAddCourse: 'Курс',
  adminAddNote: 'Заметка (необязательно)',
  adminAddNotePlaceholder: 'например, оплата переводом 12 сентября',
  adminAdded: 'Доступ открыт',
  adminInvalidEmail: 'Похоже, в адресе ошибка.',
  adminEmptyTitle: 'Пусто',
  adminEmptyBody: 'Под фильтр ничего не попало.',
  adminErrorTitle: 'Не удалось загрузить покупки',
  // The people list: the third tab, so a grant is a choice rather than a typed address.
  adminTabPeople: 'Люди',
  adminPeopleCountOne: '{n} человек',
  adminPeopleCountFew: '{n} человека',
  adminPeopleCountMany: '{n} человек',
  adminPeopleEmpty: 'Пока никто не входил',
  adminPeopleEmptyBody: 'Здесь появятся все, кто подтвердил код при входе.',
  adminPersonNotOnboarded: 'без анкеты',
  adminPersonSubscribed: 'Подписка',
  adminPersonCourses: '{n} курса',
  adminPersonNothing: 'Ничего нет',
  adminPersonGiveCourse: 'Курс',
  adminPersonGiveSub: 'Подписка',
  adminTabPurchases: 'Покупки',
  adminTabSubscriptions: 'Подписки',
  adminSubscriptions: 'Подписки',
  adminSubStatusPending: 'Ждёт оплаты',
  adminSubStatusActive: 'Активна',
  adminSubStatusCancelled: 'Отменена',
  adminSubExpired: 'закончилась',
  adminSubUntil: 'до {date}',
  adminSubCountOne: '{n} подписка',
  adminSubCountFew: '{n} подписки',
  adminSubCountMany: '{n} подписок',
  adminSubExtendMonth: '+ 1 месяц',
  adminSubExtendYear: '+ 1 год',
  adminSubCancel: 'Отменить',
  adminSubActivate: 'Активировать',
  adminSubConfirmCancelTitle: 'Отменить подписку?',
  adminSubConfirmCancelBody:
    'Продлений больше не будет. Доступ останется до конца оплаченного периода.',
  adminSubConfirmExtendTitle: 'Продлить доступ?',
  adminSubConfirmExtendBody:
    'Период добавится к текущей дате окончания или начнётся сегодня, если подписка закончилась.',
  adminSubAdd: 'Добавить подписку',
  adminSubAddLead:
    'Открывает все курсы на период вручную: перевод, подарок, обращение в поддержку.',
  adminSubAddPlan: 'Тариф',
  adminSubAddUntil: 'Доступ до (необязательно)',
  adminSubAddUntilHint: 'Пусто = один период тарифа от сегодня',
  adminSubAdded: 'Подписка открыта',
  adminSubEmptyBody: 'Нет подписок под этот фильтр.',
  adminSubErrorTitle: 'Не удалось загрузить подписки',

  // Демо-режим (docs/SETUP.md §10) — песочница для теста, не боевое приложение
  demoBadgeLabel: 'Демо',
  demoBadge: 'Тестовые данные — они лежат только в этом браузере',
  demoOpen: 'Открыть демо',
  demoOpenLead: 'Просто хочешь посмотреть?',
  demoOpenBody:
    'В демо-режиме приложение работает целиком, на выдуманных данных внутри этого браузера. Ничего никуда не отправляется, Supabase не нужен.',
  demoAuthCode: 'Демо: код {code}',
  demoSection: 'Демо-режим',
  demoReset: 'Сбросить демо-данные',
  demoResetTitle: 'Сбросить демо-данные?',
  demoResetBody:
    'Демо-профиль, прогресс и покупки в этом браузере удалятся, и ты выйдешь из аккаунта. Никуда эти данные и не уходили.',
  demoLeave: 'Выйти из демо',
  demoLeaveTitle: 'Выйти из демо?',
  demoLeaveBody:
    'Приложение вернётся к экрану настройки. Демо-данные останутся в браузере — включишь демо снова, и всё будет на месте.',

  // --- custom (coach-built) workouts + builder ---
  customWorkoutTitle: 'Тренировка',
  customWorkoutErrorTitle: 'Не удалось загрузить',
  customWorkoutErrorBody: 'Попробуй открыть ссылку ещё раз.',
  customWorkoutMissingTitle: 'Тренировка не найдена',
  customWorkoutMissingBody: 'Ссылка недействительна или тренировку удалили.',
  customWorkoutFromCoach: 'От тренера',
  customWorkoutRounds: '{n} кр.',
  customWorkoutSeconds: '{n} сек',
  customWorkoutReps: '{n} повт.',
  customWorkoutPerSide: 'на каждую сторону',
  customWorkoutEmpty: 'В этой тренировке пока нет упражнений.',
  homeCoachWorkouts: 'Тренировки от тренера',
  builderPickExercise: 'Выбери упражнение',
  builderSearchExercise: 'Поиск упражнения',
  builderNoMatches: 'Ничего не найдено',
  builderTitle: 'Название',
  builderTitlePlaceholder: 'Название тренировки',
  builderDescription: 'Описание',
  builderDescriptionPlaceholder: 'Короткое описание (необязательно)',
  builderRounds: 'Круги',
  builderSectionEmpty: 'Пока пусто — добавь упражнение.',
  builderMoveUp: 'Выше',
  builderMoveDown: 'Ниже',
  builderRemove: 'Убрать',
  builderUnitReps: 'Повторы',
  builderUnitSeconds: 'Секунды',
  builderAmount: 'Количество',
  builderPerSide: 'на сторону',
  builderRest: 'Отдых, сек',
  builderNote: 'Заметка',
  builderNotePlaceholder: 'Заметка тренера (необязательно)',
  builderAddExercise: 'Добавить упражнение',
  builderScreenTitle: 'Конструктор тренировок',
  builderNew: 'Новая тренировка',
  builderEdit: 'Редактирование',
  builderEditBtn: 'Изменить',
  builderShareBtn: 'Поделиться',
  builderAssignBtn: 'Выдать',
  builderDeleteBtn: 'Удалить',
  builderShared: 'Ссылка активна',
  builderEmptyTitle: 'Пока нет тренировок',
  builderEmptyBody: 'Создай первую тренировку из упражнений.',
  builderLoadError: 'Не удалось загрузить тренировки',
  builderSaved: 'Сохранено',
  builderSaveError: 'Не удалось сохранить',
  builderDeleteError: 'Не удалось удалить',
  builderDeleteConfirmTitle: 'Удалить тренировку?',
  builderDeleteConfirmBody: 'Тренировка и все выдачи будут удалены. Отменить нельзя.',
  builderShareHint: 'Ссылка откроет тренировку в приложении. Человек войдёт и сможет её выполнить.',
  builderShareOn: 'Создать ссылку',
  builderShareOff: 'Отключить',
  builderCopyLink: 'Скопировать ссылку',
  builderLinkCopied: 'Ссылка скопирована',
  builderShareError: 'Не удалось изменить доступ по ссылке',
  builderAssignHint: 'Тренировка появится в личном кабинете этого человека.',
  builderEmailPlaceholder: 'Почта человека',
  builderAssignAction: 'Выдать',
  builderInvalidEmail: 'Проверь адрес почты',
  builderAssigned: 'Выдано',
  builderAssignError: 'Не удалось выдать',
  builderUnassign: 'Забрать доступ',

  // --- exercise library (admin) ---------------------------------------------
  exScreenTitle: 'База упражнений',
  exSearch: 'Поиск по названию, id или тегу',
  exFilterAll: 'Все',
  exFilterCustom: 'Мои',
  exFilterVideo: 'С видео',
  exNoMatches: 'Ничего не найдено',
  exCustomBadge: 'своё',
  exNew: 'Новое упражнение',
  exEdit: 'Упражнение',
  exSaved: 'Сохранено',
  exSaveError: 'Не удалось сохранить',
  exLoadError: 'Не удалось загрузить базу',
  exDeleteError: 'Не удалось удалить',
  exDeleteTitle: 'Удалить упражнение?',
  exDeleteBody:
    '«{name}» исчезнет из конструктора. Тренировки, где оно уже стоит, останутся без него.',
  exId: 'Идентификатор',
  exIdHint: 'Латиницей, через подчёркивание. Поменять потом нельзя.',
  exIdInvalid: 'Только латиница, цифры и подчёркивание, от 2 до 60 символов',
  exNameRu: 'Название',
  exNameEn: 'Название (EN)',
  exShortName: 'Короткое название',
  exShortNameHint: 'Для узких мест — плашек и списков',
  exSeededNotice:
    'Это упражнение приходит из файлов курса, поэтому название, мышцы и оборудование здесь только для чтения: их перезапишет следующая выгрузка. Видео, картинку, теги и тексты ниже можно менять — их выгрузка не трогает.',
  exDescription: 'Описание',
  exDescriptionHint: 'Пара абзацев: что это за движение и зачем оно в программе',
  exUnit: 'В чём считаем',
  exUnitHint: 'Для йоги почти всегда секунды',
  exUnitReps: 'Повторения',
  exUnitSeconds: 'Секунды',
  exUnitMeters: 'Метры',
  exUnitCalories: 'Калории',
  exSecondsPerRep: 'Секунд на повтор',
  exLevel: 'Уровень',
  exLevel1: '1 — новичок',
  exLevel2: '2 — средний',
  exLevel3: '3 — продвинутый',
  exPrimaryMuscle: 'Основная мышца',
  exPattern: 'Паттерн движения',
  exMuscles: 'Мышцы',
  exEquipment: 'Оборудование',
  exHowTo: 'Как делать',
  exHowToHint: 'По шагу на строку',
  exHowToPlaceholder: 'Шаг',
  exCues: 'На что обратить внимание',
  exCuesPlaceholder: 'Подсказка',
  exMistakes: 'Частые ошибки',
  exMistakesPlaceholder: 'Ошибка',
  exBreathing: 'Дыхание',
  exAddLine: 'Добавить строку',
  exRemoveLine: 'Убрать строку',
  exVideo: 'Видео',
  exVideoHint: 'Это то, что человек видит, пока выполняет упражнение',
  exVideoFolder: 'Папка видео',
  exVideoFolderHint:
    'Папка решает, кому видео доступно: папка курса — только купившим его, «Общее» — любому, кто вошёл.',
  exVideoFolderShared: 'Общее (всем, кто вошёл)',
  exImage: 'Картинка',
  exImageHint: 'Кадр из видео — на случай, когда видео ещё не снято',
  exTags: 'Теги',
  exTagsHint: 'Через запятую. По ним ищет конструктор.',

  // --- media upload (admin) -------------------------------------------------
  mediaNone: 'Ничего не загружено',
  mediaUpload: 'Загрузить',
  mediaReplace: 'Заменить',
  mediaRemove: 'Убрать',
  mediaUploaded: 'Загружено',
  mediaUploadError: 'Не удалось загрузить',
  mediaTooLarge: 'Файл больше {mb} МБ',

  // --- course builder (admin) -----------------------------------------------
  courseNavLabel: 'Конструктор курсов',
  courseScreenTitle: 'Курсы',
  courseNew: 'Новый курс',
  courseNewBody:
    'Идентификатор менять потом нельзя — по нему записаны покупки и история тренировок.',
  courseId: 'Идентификатор курса',
  courseIdHint: 'Латиницей, через подчёркивание: yoga_start',
  courseIdInvalid: 'Только латиница, цифры и подчёркивание, от 2 до 40 символов',
  courseCreateError: 'Не удалось создать курс',
  courseLoadError: 'Не удалось загрузить курс',
  courseEmptyTitle: 'Пока ни одного курса',
  courseEmptyBody: 'Начни с нового — его можно дописывать сколько угодно, пока не опубликуешь.',
  courseDraft: 'черновик',
  coursePublished: 'опубликован',
  courseTabMeta: 'О курсе',
  courseTabDays: 'Дни',
  courseTabPublish: 'Публикация',
  courseName: 'Название',
  courseTagline: 'Подзаголовок',
  courseTaglineHint: 'Одна строка под названием на странице курса',
  courseDescription: 'Короткое описание',
  courseDescriptionHint: 'Два-три предложения для карточки курса и поиска',
  courseLongDescription: 'Подробно о курсе',
  courseLongDescriptionHint: 'Абзацы для страницы курса. Нужно минимум два.',
  courseParagraph: 'Абзац',
  courseForWhom: 'Кому подойдёт',
  courseForWhomHint: 'Минимум два пункта',
  courseForWhomPlaceholder: 'Кому',
  courseOutcomes: 'Что будет в результате',
  courseOutcomesHint: 'Минимум три пункта',
  courseOutcomesPlaceholder: 'Результат',
  courseLevel: 'Уровень',
  courseWeeks: 'Недель',
  coursePerWeek: 'Тренировок в неделю',
  courseMinutes: 'Минут на тренировку',
  coursePriceRub: 'Цена, ₽',
  coursePriceUsd: 'Цена, $',
  courseEquipment: 'Оборудование',
  courseTile: 'Плашка курса',
  courseTileHint:
    'Единственный цвет на экране курса. Цвета программ: новичкам #f2f52d, йога #a8c8ff, марафон #ff7a1a. Другому курсу — одна из двух нейтральных поверхностей: #1f1f24 или #2a2a30.',
  courseCover: 'Обложка',
  courseCoverHint: 'Показывается на странице курса и в каталоге',
  courseIntroVideo: 'Вступительное видео',
  courseIntroVideoHint: 'Тренер рассказывает, о чём курс',
  coursePaymentUrl: 'Ссылка на оплату',
  coursePaymentUrlHint: 'Обязательно https. Пусто — и заявка уйдёт в поддержку.',
  courseFaq: 'Частые вопросы',
  courseFaqHint: 'Нужно минимум три пары «вопрос — ответ»',
  courseFaqQ: 'Вопрос',
  courseFaqA: 'Ответ',
  courseFaqAdd: 'Добавить вопрос',
  coursePublish: 'Опубликовать',
  courseUnpublish: 'Снять с публикации',
  coursePublishReady: 'Курс готов к публикации.',
  coursePublishBlocked: 'Пока опубликовать нельзя:',
  coursePublishSite:
    'Страница курса на сайте появится после следующей сборки — она собирается раз в сутки. Нужно сразу — запусти «Deploy site» в GitHub Actions.',
  coursePublishExplain:
    'После публикации курс появится в каталоге и его можно будет купить. Снять с публикации можно в любой момент — у тех, кто уже купил, курс останется.',
  coursePublishedToast: 'Курс опубликован',
  coursePublishError: 'Не удалось опубликовать',
  courseDelete: 'Удалить курс',

  // --- course days (admin) ---------------------------------------------------
  dayAdd: 'Добавить день',
  dayWeekN: 'Неделя {n}',
  dayUntitled: 'Без названия',
  dayNeedsWorkout: 'нет тренировки',
  dayEmptyTitle: 'В курсе пока нет дней',
  dayEmptyBody: 'Добавь первый день — тренировку, отдых или веху.',
  dayDefaultTitle: 'День {n}',
  dayCreateError: 'Не удалось добавить день',
  dayDeleteError: 'Не удалось удалить день',
  dayDelete: 'Удалить день',
  dayKind: 'Что это за день',
  dayKindWorkout: 'Тренировка',
  dayKindRest: 'Отдых',
  dayKindTest: 'Тест',
  dayKindBenchmark: 'Контрольная',
  dayKindMilestone: 'Веха',
  dayWeek: 'Неделя',
  dayNumber: 'День недели',
  dayNumberHint: 'От 1 до 7',
  dayTitle: 'Название дня',
  daySubtitle: 'Подзаголовок',
  daySubtitleHint: 'Например, на чём сегодня фокус',
  dayBody: 'Текст дня',
  dayBodyHint: 'Что человек читает перед тренировкой. Абзац на строку.',
  dayWorkout: 'Тренировка дня',
  dayNoWorkout: 'Тренировка ещё не выбрана.',
  dayPickWorkout: 'Выбрать из базы',
  daySearchWorkout: 'Поиск по названию',
  dayBuildWorkout: 'Собрать новую',
  dayChangeWorkout: 'Заменить',
  dayDeload: 'Разгрузочная неделя',
  dayImage: 'Картинка дня',
  dayImageHint: 'Показывается на экране дня',
  // Sign-in hero: the tagline split at the weight change — 800 for the claim, 200 for the promise.
  homeUpNext: 'Дальше по курсу',
  homeUpNextDay: 'День {n}',
  homeTodayStatDay: 'День из {total}',
  homeTodayStatExercises: 'Упражнения',
  homeTodayStatTime: 'Времени',
  // Node preview: the formula kicker and the secondary action of the two-button row.
  nodeLater: 'Позже',
  // Admin: the exercise row's "has a video" stamp, and the course tile field's format error.
  exHasVideo: 'видео',
  courseTileInvalid: 'Цвет — шесть шестнадцатеричных знаков, например #1f1f24',

  // --- Marathon -------------------------------------------------------------
  // The second format: daily tasks, proof, a weekly board. Everyone races for themselves.
  //
  // It is «Клуб маленьких шагов» to the reader and `marathon*` in the code and the database. Three
  // names for one thing would be a tax, so this is the one place that reconciles them: the keys
  // stay `marathon*` because renaming them buys the reader nothing and costs a migration, and the
  // words below are the only ones anybody sees.
  //
  // The name was the owner's, and it is the right one: «челлендж» promised a test, and the people
  // this is for are coming back after a break — a test is a reason not to start. A club promises
  // belonging, which is what the format actually delivers: a board with names, a day everyone is
  // having at once. (It once delivered a partner too; «каждый сам за себя» ended that.) Where the two disagree is the prize, so the prize stopped being
  // the pitch and became a fact of the week (see the Club block at the end of this file).
  marathonTitle: 'Клуб маленьких шагов',
  // The cover's big line before there is a day to count: what the format is, in one line.
  // No dash in it on purpose — the line sets in capitals across two lines of a 390px screen, and
  // an em-dash that lands first on the second line reads as a stray mark rather than as pause.
  marathonCoverPitch: 'Один маленький шаг в день',
  marathonTabBoard: 'Таблица',
  marathonDayOf: 'День {n} из {total}',
  // The same line in two weights on the challenge's head: «ДЕНЬ 10» heavy, «из 14» light.
  marathonDayN: 'День {n}',
  marathonOfTotal: 'из {total}',
  // The full board's own switch. The club screen has no week kicker any more — «Только задание,
  // кнопка и лидерборд» — so «Эта неделя» is said here, on the screen that can show another one.
  marathonWeekThis: 'Эта неделя',
  marathonWeekLast: 'Прошлая неделя',
  // On the pill above the board: «Приз · Час с тренером».
  marathonPrizeShort: 'Приз',
  marathonBoardAll: 'Вся таблица',
  marathonHomeCta: 'Открыть клуб',
  marathonHomeTasksLeft: 'Осталось заданий: {n}',
  marathonHomeAllDone: 'На сегодня всё',
  // A round of the club has a start and an end; the club itself does not. So these two lines are
  // about the round, and «клуб» is not the thing that begins or finishes.
  marathonNotStarted: 'Клуб ещё не собрался',
  marathonNotStartedBody: 'Задания появятся утром первого дня.',
  marathonFinished: 'Этот круг закончен',
  marathonFinishedBody: 'Таблица остаётся — можно посмотреть, чем всё кончилось.',
  marathonNoTasksToday: 'Сегодня заданий нет',
  marathonNoTasksTodayBody: 'Отдыхаем. Завтра утром будет новое.',
  marathonErrorTitle: 'Не удалось загрузить клуб',
  // The pill on the day screen: «Пробная неделя · осталось 7 дней →», leading to the subscription.
  // One task
  marathonDeadline: 'До {time}',
  marathonDeadlinePassed: 'Время вышло',
  // The pill on a task: what it is worth, said in full.
  marathonPointsOne: '{n} балл',
  marathonPointsFew: '{n} балла',
  marathonPointsMany: '{n} баллов',
  marathonRuleAllMembers: 'Только если сделают оба',
  marathonRulePerMember: 'Каждому за себя',
  marathonRuleCapped: 'На команду не больше {n}',
  marathonRuleNone: 'Без баллов',
  marathonProofDone: 'Отметить выполнение',
  marathonProofUndo: 'Отменить',
  marathonProofSent: 'Отправлено',
  marathonProofTextLabel: 'Напиши, как прошло',
  marathonProofNumberLabel: 'Сколько получилось',
  marathonProofPhoto: 'Прикрепить фото',
  marathonProofPhotoAgain: 'Заменить фото',
  marathonProofPhotoSent: 'Фото отправлено',
  // Необязательное вложение на любом задании — отсюда «+», а не кнопка: задание доставляет другой
  // контрол, а это доказательство к нему.
  marathonProofAttach: 'Прикрепить фото или видео',
  marathonProofAttachAgain: 'Заменить фото или видео',
  marathonProofTooBig: 'Файл больше {n} МБ. Сними покороче — 10–15 секунд обычно хватает.',
  marathonProofVoided: 'Не засчитано: {reason}',
  marathonProofCoachOnly: 'Видит только тренер',
  // The board
  marathonBoardEmpty: 'Пока никто не набрал баллов',
  marathonBoardYou: 'Ты',
  marathonBoardPoints: '{n}',

  // --- Marathon admin --------------------------------------------------------
  mAdminTitle: 'Марафоны',
  mAdminNav: 'Марафоны',
  mAdminNew: 'Новый марафон',
  mAdminEmpty: 'Марафонов пока нет',
  mAdminEmptyBody: 'Марафон — это ежедневные задания, пары и таблица по неделям.',
  mAdminSlug: 'Идентификатор',
  mAdminSlugHint: 'Латиница, цифры и _. Например sprint_oct',
  mAdminSlugInvalid: 'Только латиница, цифры и _, от 2 до 40 знаков',
  mAdminName: 'Название',
  mAdminStarts: 'Старт',
  mAdminDays: 'Дней',
  mAdminTeamSize: 'Размер команды',
  mAdminTeamSizeHint: 'Как считаются очки: пара делит задание на двоих или каждый идёт за себя',
  mAdminRuleSoloScores: 'Очки за выполнение',
  mAdminTeamSizeSolo: 'Каждый сам за себя',
  mAdminTeamSizePair: 'Пары',
  mAdminTimezone: 'Часовой пояс',
  mAdminDue: 'День закрывается в',
  mAdminPrize: 'Приз недели',
  mAdminDescription: 'Описание',
  mAdminCreate: 'Создать',
  mAdminCreateError: 'Не удалось создать марафон',
  mAdminLoadError: 'Не удалось загрузить',
  mAdminSaveError: 'Не удалось сохранить',
  mAdminStatus: 'Статус',
  mAdminStatusDraft: 'Черновик',
  mAdminStatusActive: 'Идёт',
  mAdminStatusFinished: 'Закончен',
  mAdminStatusArchived: 'В архиве',
  mAdminTabPlan: 'План',
  mAdminTabPeople: 'Люди',
  mAdminTabProofs: 'Отчёты',
  mAdminTabSettings: 'Настройки',
  // Day plan
  mAdminDay: 'День {n}',
  mAdminPrevMonth: 'Предыдущий месяц',
  mAdminNextMonth: 'Следующий месяц',
  mAdminTaskCount: 'заданий: {n}',
  mAdminDayToday: 'сегодня',
  mAdminDayEmpty: 'На этот день заданий нет',
  mAdminAddTask: 'Добавить задание',
  mAdminCopyDay: 'Скопировать вчерашний день',
  mAdminCopyDayError: 'Копировать нечего',
  mAdminRepeatUntil: 'Повторять до дня',
  mAdminRepeat: 'Повторить',
  mAdminTaskNew: 'Новое задание',
  mAdminTaskEdit: 'Задание',
  mAdminTaskTitle: 'Что сделать',
  mAdminTaskBody: 'Подробности',
  mAdminTaskImage: 'Картинка',
  // The crop is stated before the pick, not discovered after it: the card draws a 16:9 band.
  mAdminTaskImageHint: 'Горизонтальная — вертикальную обрежет сверху и снизу',
  mAdminTaskProof: 'Что прислать',
  mAdminProofDone: 'Отметку «сделал»',
  mAdminProofText: 'Текст',
  mAdminProofNumber: 'Число',
  mAdminProofMedia: 'Фото или видео',
  mAdminUnit: 'Единица',
  mAdminTarget: 'Цель',
  mAdminRule: 'Как считаем',
  mAdminRuleAll: 'Только если сделают все в команде',
  mAdminRulePer: 'Каждому за себя',
  mAdminRuleCapped: 'Каждому, но не больше потолка',
  mAdminRuleNone: 'Без баллов',
  mAdminPoints: 'Баллы',
  mAdminCap: 'Потолок на команду',
  mAdminSendTo: 'Кому отправляем',
  mAdminSendAll: 'Всем',
  mAdminSendViaTeam: 'через команду',
  mAdminSendSummary: 'Кому: {who}',
  mAdminVisibility: 'Кто видит отчёт',
  mAdminVisibilityTeam: 'Команда и тренер',
  mAdminVisibilityCoach: 'Только тренер',
  mAdminDueTime: 'Дедлайн',
  mAdminDueDefault: 'Как у клуба',
  mAdminLateCounts: 'Засчитывать после дедлайна',
  mAdminSave: 'Сохранить',
  mAdminDelete: 'Удалить',
  mAdminDeleteTask: 'Удалить задание?',
  // People and teams
  mAdminPeople: 'Участники',
  mAdminTeams: 'Команды',
  mAdminAddPerson: 'Добавить участника',
  mAdminAddTeam: 'Добавить команду',
  mAdminEmail: 'Почта',
  mAdminPersonName: 'Как называть',
  mAdminTeam: 'Команда',
  mAdminNoTeam: 'Без команды',
  mAdminRemove: 'Убрать',
  mAdminRestore: 'Вернуть',
  mAdminRemoved: 'Убран',
  mAdminPeopleEmpty: 'Пока никого',
  mAdminPeopleEmptyBody:
    'Добавь участников по почте — они увидят клуб, когда войдут с этим адресом.',
  mAdminAddError: 'Не удалось добавить',
  // Proofs
  mAdminProofsEmpty: 'Отчётов пока нет',
  // Пруф открывается по нажатию, а не грузится со всей лентой: месяц активного клуба — это сотни
  // объектов в приватном бакете, и подписывать их все ради экрана, который никто не долистывает,
  // значит сделать сотни запросов впустую.
  mAdminProofOpen: 'Посмотреть фото',
  mAdminProofOpenVideo: 'Посмотреть видео',
  mAdminProofFailed: 'Не открылось — нажми ещё раз',
  mAdminProofsAll: 'Все дни',
  mAdminVoid: 'Не засчитать',
  mAdminVoidReason: 'Почему',
  mAdminVoided: 'Не засчитано',
  mAdminRestoreProof: 'Вернуть',
  mAdminBonus: 'Начислить вручную',
  mAdminBonusPoints: 'Баллы (можно минус)',
  mAdminBonusReason: 'За что',
  mAdminBonusAdd: 'Начислить',

  // --- Club (stream 4) --------------------------------------------------------
  // The tab is «только задание и лидерборд», and this is everything the two states of it say
  // that the block above does not.
  //
  // The standing prize, said once so the member's board, the full board and the selling screen
  // cannot drift into three different promises. «Тренер и создатель Forma» is the owner's own
  // wording and he is sold as both from here on; a round may still name something else for itself
  // (`marathons.prize`), and then the row wins.
  marathonPrizeDefault: 'Час с тренером и создателем Forma',
  // The join button. `{price}` comes from PLANS (content/site/plans.ts) and the link goes to the
  // /subscribe/ page — never to a payment URL with an amount in it, which on a static site is an
  // amount the payer can edit (docs/SETUP.md §7.1).
  marathonJoinCta: 'Вступить за {price} / мес',
  // --- Онбординг: пять вопросов + тест после двух тренировок ------------------
  // Вопросы анкеты. Первое слово набирается 800-м, остальное 200-м (DisplayTitle),
  // поэтому в каждом заголовке первое слово — то, которое должно звучать громче.
  onbAgeTitle: 'Сколько тебе лет?',
  onbSexTitle: 'Твой пол',
  // A question like the four before it. «Уровень формы» was a category name — the label on a
  // field in a form — in the middle of a screen that otherwise talks.
  onbLevelTitle: 'Как сейчас с тренировками?',
  // Десять состояний, снизу вверх. Это и есть ответ — цифра на линейке только показывает, где
  // он стоит на шкале («акцент больше не на цифре, а на том, в каком состоянии»).
  //
  // Все десять — в настоящем времени и от первого лица. Прошедшее время в русском языке имеет
  // род («давно не тренировался»), а пол мы спрашиваем на шаге раньше и не обязаны его знать:
  // тот, кто выбрал «не хочу говорить», не должен читать про себя чужую форму слова.
  onbLevel01: 'Не тренируюсь много лет',
  onbLevel02: 'Начинаю с нуля',
  onbLevel03: 'Иногда хожу пешком, и всё',
  onbLevel04: 'Двигаюсь, но без системы',
  onbLevel05: 'Тренируюсь время от времени',
  onbLevel06: 'Тренируюсь раз в неделю',
  onbLevel07: 'Две-три тренировки в неделю',
  onbLevel08: 'Тренируюсь регулярно, почти без пропусков',
  onbLevel09: 'Тренируюсь много лет, почти каждый день',
  onbLevel10: 'Две тренировки в день, готовлюсь к соревнованиям',
  // «Далее», а не «Продолжить»: продолжают то, что прервали, а по анкете идут вперёд.
  onbNext: 'Далее',
  onbFinish: 'Начать тренироваться',
  // Баннер с предложением пройти тест — после второй завершённой тренировки.
  // Текст подсказки повторяет homeTaskAssessHint: цифры совпадают с ASSESSMENT_MOVES и
  // ASSESSMENT_TOTAL_MIN в content/site/assessment.ts.
  assessBannerTitle: 'Подстроить тренировки под тебя',
  assessBannerHint: '5 упражнений, 3 минуты — просто ответить',
  assessBannerCta: 'Пройти',
  assessBannerLater: 'Не сейчас',
  assessNoProfile: 'Сначала закончи анкету',
  // --- coach tab --------------------------------------------------------------
  bookLeadTimePill: 'Можно за {n} минут до начала',
  /*
   * `bookCredentials` («Регалии») and `bookOutcomes` («Что это даёт») stood over the two blocks
   * below and are gone on the owner's instruction. Both were labels announcing what kind of thing
   * the reader was about to read, over content that says so itself; `bookIncludes` below stays,
   * because that one is doing work — it tells you the list under it is what the price buys.
   */
  bookIncludes: 'Что входит',
  /*
   * `bookAdds`, `bookIncludesPrev` and `bookPriceDelta` stood here. They were the coach tab's
   * comparison between the half-hour and the hour; the owner struck the price delta and the
   * «Сверх 30 минут» kicker, and the third line had nothing left to belong to. Each length prints
   * its own full list now.
   */
  bookNext: 'Дальше',
  bookNextSchedule:
    'Оплати — и выбери слот на его странице. Ближайший может быть уже через {n} минут.',
  bookNextContact:
    'Страницы со слотами пока нет: оплати и напиши тренеру — время он поставит сам, хоть за {n} минут до начала.',
  bookPaidNote: 'Оплата открылась в браузере. Как оплатишь — возвращайся сюда за временем.',

  // --- Stream 3: sign-in, the bot, the emailed code -------------------------
  // Sign-in errors that used to share one generic line. Each says what happened first and what to
  // do second; the typo line is the error itself and it is tappable — pressing it fixes the field.
  authErrorEmailEmpty: 'Введи почту — на неё придёт код.',
  authErrorEmailNoAt: 'В адресе нет «@». Целиком это выглядит так: name@gmail.com',
  authErrorEmailTypo: 'Опечатка в домене? Нажми, чтобы исправить на {suggestion}',
  authErrorCodeExpired: 'Код живёт 10 минут, этот уже истёк. Запроси новый.',
  authErrorTooManyAttempts:
    'Код не подошёл три раза. Запроси новый и введи цифры из последнего письма.',

  // --- Stream 2: три вкладки и «Курсы» как главный экран ----------------------
  tabCourses: 'Курсы',
  tabCoach: 'Тренер',
  coursesMore: 'Подробнее',
  achievementsTitle: 'Достижения',
  // `achievementsLead` («Всё, что можно взять, и как.») stood here and said what the list under
  // it plainly is. The count in the header is the only line this screen needs over the rules.
  achievementsEmpty: 'Пока нечего показать.',
  // Инвентарь остался единственной настройкой профиля: вопрос про него убрали из онбординга, а
  // экран профиля удалён — без этой строки человек с гантелями тренировался бы без них всегда.
  profileEquipment: 'Инвентарь',
  // Имя редактируется здесь, а не только в онбординге. Политика конфиденциальности обещает
  // «исправить имя — прямо в приложении», а право на уточнение данных записано в 152-ФЗ ст. 14;
  // до этой строки обещание было невыполнимым. Подпись под полем говорит, кто это имя увидит:
  // на доске клуба оно публичное, и менять его человек захочет именно поэтому.
  profileName: 'Имя',
  profileNameEmpty: 'Не указано',
  profileNameTitle: 'Твоё имя',
  profileNameNote: 'Это имя видят другие участники клуба в рейтинге. Менять можно когда угодно.',
  profileEquipmentTitle: 'Твой инвентарь',
  profileEquipmentLead: 'Отметь, что есть дома, — тренировки подстроятся.',
  // «Данные и согласия» — права из политики в виде того, что можно нажать. Отзыв согласия
  // (152-ФЗ ст. 9 ч. 2) приложение делает само; удаление аккаунта — письмо в поддержку, потому
  // что вместе с ним удаляются покупки, клуб и пруфы, и по ст. 21 на это даётся 30 дней.
  dataRow: 'Данные и согласия',
  dataTitle: 'Данные и согласия',
  dataLead:
    'Приложение хранит почту, имя, ответы онбординга и то, что ты сделал на тренировках. Почта нужна для входа, остальное — чтобы подбирать нагрузку и считать очки.',
  dataHealthTitle: 'Данные о здоровье',
  dataHealthBody:
    'Ты разрешил хранить отметки о том, что беречь, и подбирать по ним упражнения. Если отозвать — отметки перестанут влиять на тренировки, и они будут назначаться без замен.',
  dataWithdraw: 'Отозвать согласие',
  dataWithdrawTitle: 'Отозвать согласие?',
  dataWithdrawConfirm:
    'Упражнения перестанут подстраиваться под твои ограничения. Дать согласие снова можно в любой момент — в онбординге.',
  dataWithdrawDone: 'Согласие отозвано',
  dataWithdrawError: 'Не получилось. Проверь соединение и попробуй снова.',
  dataDeleteTitle: 'Удалить аккаунт',
  dataDeleteBody2:
    'Вместе с аккаунтом удаляются тренировки, очки и доступ к купленным курсам. Напиши нам — ответим и удалим в течение 30 дней.',
  dataDeleteCta: 'Написать про удаление',
  dataDeleteSubject: 'Удаление аккаунта Forma',
  dataDeleteBody:
    'Здравствуйте! Прошу удалить мой аккаунт и данные в Forma. Почта аккаунта: {email}.',
  dataPolicyLink: 'Политика обработки данных',
  profileSaved: 'Сохранено',
  profileSaveError: 'Не удалось сохранить. Проверь соединение и попробуй снова.',

  // --- Stream: «Курсы» и таб-бар по макету владелицы --------------------------
  // В макете приветствие стоит в две строки: «Доброе утро» сверху, имя под ним крупно. Это те же
  // четыре времени суток, что и у homeGreeting*, но без подстановки {name}: имя печатается
  // отдельной строкой и своим шрифтом, поэтому склеивать его с приветствием больше нечем.
  homeGreetMorning: 'Доброе утро',
  homeGreetAfternoon: 'Добрый день',
  homeGreetEvening: 'Добрый вечер',
  homeGreetNight: 'Не спится?',
  // --- Club pitch (stream: club-pitch-redesign) -------------------------------
  // The selling screen rebuilt to the owner's own mockup. Everything here is sentence case: no
  // uppercase label appears anywhere on either of the two screens she sent.
  //
  // The label over the photo row is chosen by whose photographs are in it (content/site/club.ts).
  // «Результаты участников» is her wording and is true only of club members; while the row falls
  // back to the coach's consented before/after clients it says whose they are, because that label
  // beside a price would otherwise claim the club produced those results.
  clubPhotosMembers: 'Результаты участников',
  clubPhotosClients: 'Результаты учеников Сергея',
  // Read out in place of the individual frames, which go out unlabelled: their source describes
  // the before/after pair and each frame here is one panel of it, not the pair.
  clubPhotosMembersRow: 'Фотографии участников клуба, опубликованы с их согласия',
  clubPhotosClientsRow: 'Фотографии учеников Сергея, опубликованы с их согласия',
  // «Клуб маленьких шагов» on three lines, 200 / 800 / 200 — the middle one in the club's colour.
  // Split into three keys because the device is typographic, not linguistic: a translation may put
  // the heavy word somewhere else in the line. Together they must read as marathonTitle.
  clubNameLead: 'Клуб',
  clubNameAccent: 'маленьких',
  clubNameTail: 'шагов',
  // The owner's copy, verbatim. The middle piece is the phrase she set in orange.
  clubLeadPre: 'Большие планы не выдерживают рабочую неделю, поэтому ',
  clubLeadAccent: 'здесь одно маленькое задание в день',
  clubLeadPost: ': 10 минут пешком, 20 приседаний, стакан воды до кофе.',
  // `{prize}` is app.marathonPrizeDefault lowered into the sentence (prize.ts), so the board, the
  // member's tab and this screen cannot drift into three different promises.
  clubLeadWeek: 'За неделю набираешь баллы, а тому, кто наверху таблицы, достаётся {prize}.',
  // Under the join pill. «666 ₽ / мес» is the year divided by twelve and this is the payment that
  // actually happens — one charge, once. Quoting only the month for an annual product is how
  // chargebacks get written.
  clubChargeNote: 'Оплата одна: {price} за год доступа. Клуб и все курсы Forma.',
  // --- Club, for somebody who is already in it (stream: club-pitch-states) ----
  // Where the join pill stands on the selling screen. They pay, so there is nothing to sell and
  // nothing to press: the coach builds each round by hand. The note is the sentence that used to
  // be four lines of grey body copy in the button's place (marathonPitchNoRound, now gone).
  clubMemberTitle: 'Ты в клубе',
  clubMemberNote:
    'Круг собирает тренер: он добавляет участников и разбивает на пары сам. Как только начнётся новый, задания появятся здесь.',
  // --- Coach: the session already booked (stream: coach-sentence) -------------
  // `src/lib/coach/booking.ts` returns a shape and never a string, deliberately, so the Russian
  // lives here. The shape exists for the day boundary: тренировка завтра в 9:00 — это «завтра в
  // 9:00», а не «через 14 часов», хотя четырнадцать часов — ровно столько до неё и есть.
  //
  // Строчная буква в начале — не опечатка. Над строкой стоит `bookUpcoming`, и вместе они
  // читаются одной фразой: «Ближайшая тренировка — завтра в 9:00».
  bookUpcoming: 'Ближайшая тренировка',
  bookLive: 'идёт сейчас',
  bookInMinutesOne: 'через {n} минуту',
  bookInMinutesFew: 'через {n} минуты',
  bookInMinutesMany: 'через {n} минут',
  bookInHoursOne: 'через {n} час',
  bookInHoursFew: 'через {n} часа',
  bookInHoursMany: 'через {n} часов',
  bookTomorrowAt: 'завтра в {time}',
  bookInDaysOne: 'через {n} день',
  bookInDaysFew: 'через {n} дня',
  bookInDaysMany: 'через {n} дней',
  // Дата и часы — в поясе устройства, а не в том, в котором бронировали.
  bookWhen: '{date} · {from} – {to} · {dur}',
  bookJoin: 'Войти в тренировку',
  // Занятие в зале: адрес вместо ссылки, и кнопки здесь нет — нажимать нечего.
  bookPlace: 'Место: {place}',
  // Ссылка на конференцию создаётся не мгновенно, а у брони из Google Календаря её может не быть
  // вовсе. Пустая кнопка была бы хуже честной строки.
  bookNoLink: 'Ссылки на вход пока нет.',
  bookMove: 'Перенести',
  bookCancel: 'Отменить',
  // --- Club: the week's board, top three and where you are (stream: club-board) ---
  // The break between the top of the table and your own row, counted in rows left out.
  marathonBoardGapOne: 'ещё {n} место',
  marathonBoardGapFew: 'ещё {n} места',
  marathonBoardGapMany: 'ещё {n} мест',
  // Ноль — не место. У того, кто ещё ничего не набрал, места в таблице нет, и «0 место» —
  // не предложение ни на одном языке.
  // И это не то же самое: строки в таблице недели у человека пока просто нет.
} as const;
