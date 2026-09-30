/**
 * Что именно бот пишет по каждому поводу, и на каком языке. Чистые функции, без `Deno`, — чтобы
 * текст проверялся тестом, а не первым живым получателем.
 *
 * ## Тон
 *
 * Тот же, что в приветствии бота: на «ты», коротко, без восклицательных знаков. Это сервисные
 * сообщения — человек сам заплатил или сам получил тренировку, — и они сообщают факт и одно
 * действие, а не продают ещё раз. Английская половина держит тот же тон: `you`, короткие
 * предложения, никаких «Dear».
 *
 * ## Язык берётся у получателя, а не у повода
 *
 * `profiles.locale` — то, что человек выбрал на первом экране приложения. Повод же приходит из
 * триггера в базе, который про человека ничего не знает: покупка живёт на почте и случается
 * раньше регистрации. Поэтому язык подставляется здесь, в момент отправки, когда получатель уже
 * найден (`index.ts`), а не записывается в очередь вместе с поводом: между постановкой в очередь
 * и отправкой человек может язык поменять, и прав будет он, а не запись недельной давности.
 *
 * Неизвестный язык — русский: это язык по умолчанию у колонки (0001_init.sql) и у всех, кто
 * завёлся до того, как появился выбор.
 *
 * ## Кнопки «Отписаться» нет
 *
 * Прямое решение владельца: «Не нужно добавлять кнопку "Отписаться" в каждом сообщении. Это не
 * нарушает закон о рекламе 152 ФЗ.» Здесь нет рекламы: каждое сообщение — про то, что человек
 * только что купил или получил.
 *
 * ## HTML, а не Markdown
 *
 * Ровно по тому же доводу, что в `telegram-bot`: MarkdownV2 требует экранировать «.», «-» и «(»,
 * и сообщение, не разобравшееся у телеграма, не видит никто. В HTML особых символов три, и
 * `escapeHtml` закрывает все. Название тренировки пишет тренер — оно и есть тот текст, который
 * однажды приедет со знаком «<».
 */

/** Виды поводов, ровно как в `telegram_outbox.kind` (0027). */
export type NotifyKind =
  | 'course_paid'
  | 'subscription_paid'
  | 'workout_assigned'
  | 'weekly_winner'
  | 'support_reply'
  | 'referral_reward'
  | 'duo_nudge'
  | 'club_task'
  | 'club_reminder'
  | 'club_recap'
  | 'subscription_ending'
  | 'club_trial_tomorrow'
  | 'session_confirmed'
  | 'session_reminder'
  | 'session_moved'
  | 'session_cancelled';

/** Языки, на которых выходит продукт — `LOCALES` в src/content/schema.ts. */
export type Locale = 'ru' | 'en';

export const DEFAULT_LOCALE: Locale = 'ru';

export interface OutboxRow {
  kind: string;
  params: Record<string, unknown> | null;
}

export interface Message {
  text: string;
  /** Подпись кнопки, открывающей мини-апп. Пустая — кнопки нет. */
  buttonText: string;
  /** Id сообщения в том же чате, на которое это — ответ (цитата вопроса). */
  replyTo?: number;
}

/** `&`, `<` и `>` — всё, что телеграм считает особым в HTML. */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Приводит что угодно к языку, который мы умеем: по умолчанию русский. */
export function toLocale(x: unknown): Locale {
  return x === 'en' ? 'en' : DEFAULT_LOCALE;
}

/**
 * Готовые куски текста на обоих языках.
 *
 * Таблицей, а не двумя ветками в каждом `case`: так видно, что ни одна строка не осталась без
 * перевода, и так же устроен весь остальной продукт (src/i18n — английский словарь источник
 * истины, русский проверяется на полноту компилятором). Здесь компилятор проверяет то же самое:
 * `Record<Locale, …>` не даст забыть язык.
 */
interface Copy {
  /*
   * Одно и то же предложение в двух сообщениях про оплату, и оно намеренно одно.
   *
   * Владелец: «перезагрузи приложение, и если доступ не открылся — "Оплатил(а) с другой почты" с
   * номером заказа из чека». Доступ привязан к адресу, а платят часто с другого — это самая
   * частая причина «заплатил, а ничего нет», и ответ на неё должен приезжать вместе с самим
   * известием об оплате, а не потом, в переписке с тренером.
   *
   * Название кнопки процитировано дословно из `app.claimLink` на обоих языках: человек пойдёт
   * искать её глазами, и перевод «по смыслу» отправит его искать то, чего на экране нет.
   */
  afterPayment: string;
  openApp: string;
  coursePaid: string;
  subscriptionPaid: string;
  /** Без названия: «Сергей выдал тебе тренировку». С названием — плюс `: «…»`. */
  workoutAssigned: string;
  workoutWhere: string;
  winnerTitle: string;
  /** `{prize}` — приз словами тренера, на языке победителя, если тренер написал обе половины. */
  winnerPrize: string;
  winnerWrite: string;
  /** Подпись над ответом тренера на обращение (0045). */
  supportReply: string;
  /** Награда за реферала (0051): позвавшей — с `{days}`; без дней, если лимит за год исчерпан. */
  referralOwner: string;
  referralOwnerNoDays: string;
  /** …и пришедшей: подруга позвала, клуб оплачен, `{days}` в подарок. */
  referralFriend: string;
  /** Напарник по дуо сделал задание (0051): `{name}` — как его зовут на доске. */
  duoNudge: string;
  duoNudgeNoName: string;
  /** Кнопка под ежедневными сообщениями клуба (0052): короче, чем «Открыть приложение». */
  openForma: string;
  /** Утро (0052): `{title}` — задание словами тренера, `{points}` — «12 баллов» или ничего. */
  clubTask: string;
  clubTaskDo: string;
  /** Вечер (0052): `{streak}` — «3 дня». */
  clubReminder: string;
  /**
   * The line under it: the streak waits for midnight, the week's points do not. `{time}` is the
   * task's due time, `{zone}` the round's zone (`clubZoneMoscow`, or the IANA name in brackets).
   */
  clubReminderPoints: string;
  clubZoneMoscow: string;
  /** Воскресенье (0052): `{place}` — «, место 3» или ничего; `{streak}` — «Серия 3 дня 🔥. » или ничего. */
  clubRecap: string;
  clubRecapWeek: string;
  clubRecapPlace: string;
  clubRecapStreak: string;
  /**
   * The club ends in three days (0054): `{date}` is the last day, «2 октября». No auto-renewal
   * exists, so the second line says renewal is by hand — the one thing the person must do.
   */
  subscriptionEnding: string;
  subscriptionEndingDo: string;
  /** The free club week after a course ends tomorrow (0054). */
  trialTomorrow: string;
  trialTomorrowDo: string;
  /** Coach sessions (0054; queued by the booking core, 0055). */
  sessionConfirmed: string;
  sessionReminderDay: string;
  sessionReminderHour: string;
  sessionReminderSoon: string;
  sessionReminderStarted: string;
  sessionMoved: string;
  sessionMovedFrom: string;
  sessionCancelled: string;
  sessionCancelledDo: string;
  /** Moving is self-service only 24 h ahead; later, the person writes to the coach. */
  sessionMoveRule: string;
  /** Link text for the coach's room; the URL itself is never printed. */
  sessionJoin: string;
  /** Who, when the queue did not name the coach. */
  sessionCoachFallback: string;
  /** `{date}, {time}` then the zone: «2 октября, 14:30 МСК». */
  sessionWhen: string;
  /** The zone label for Moscow; any other zone is printed as its IANA name. */
  moscowTime: string;
  /** Формы слов при числе: балл / день / задание / минута. */
  points: Plural;
  days: Plural;
  tasks: Plural;
  minutes: Plural;
}

/** Формы одного слова при числе. `few` — у русского (2–4); английскому хватает двух. */
interface Plural {
  one: string;
  few?: string;
  many: string;
}

/** «1 балл», «3 балла», «12 баллов»; по-английски «1 point», «3 points». Правило — `src/i18n`. */
export function plural(locale: Locale, n: number, f: Plural): string {
  const abs = Math.abs(n);
  if (locale === 'ru') {
    const mod10 = abs % 10;
    const mod100 = abs % 100;
    if (mod10 === 1 && mod100 !== 11) return f.one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return f.few ?? f.many;
    return f.many;
  }
  return abs === 1 ? f.one : f.many;
}

const COPY: Record<Locale, Copy> = {
  ru: {
    afterPayment:
      'Перезагрузи приложение, чтобы доступ появился. Если его всё равно нет — нажми в приложении ' +
      '«Оплатил(а) с другой почты?» и введи номер заказа из чека.',
    openApp: 'Открыть приложение',
    coursePaid: 'Оплата дошла — курс открыт.',
    subscriptionPaid: 'Оплата дошла — клуб открыт.',
    workoutAssigned: 'Сергей выдал тебе тренировку',
    workoutWhere: 'Она ждёт на вкладке «Курсы» и висит там, пока не выполнишь.',
    winnerTitle: 'Ты победил на этой неделе 🏆',
    winnerPrize: 'Твой приз: {prize}.',
    winnerWrite: 'Напиши Сергею, чтобы договориться, — он ждёт.',
    supportReply: 'Ответ тренера:',
    referralOwner: 'Друг оплатил клуб — тебе +{days} дней 🎁',
    referralOwnerNoDays: 'Друг оплатил клуб — спасибо 🎁',
    referralFriend: 'Тебя позвали в клуб — тебе +{days} дней 🎁',
    duoNudge: '{name} уже сделал(а) задание — твоя очередь',
    duoNudgeNoName: 'Напарник',
    openForma: 'Открыть Forma',
    clubTask: 'Задание на сегодня: <b>{title}</b>{points}',
    clubTaskDo: 'Сделай — и отметь в приложении.',
    clubReminder: 'Сегодня ещё нет отметки. Серия {streak} — сгорит в полночь 🔥',
    clubReminderPoints: 'Баллы — до {time} {zone}.',
    clubZoneMoscow: 'по Москве',
    clubRecap:
      '{week}{points}, {done} из {total} {tasks}{place}. {streak}Новая неделя — в понедельник.',
    clubRecapWeek: 'Неделя {week}: ',
    clubRecapPlace: ', место {place}',
    clubRecapStreak: 'Серия {streak} 🔥. ',
    subscriptionEnding: 'Клуб открыт до {date}',
    subscriptionEndingDo:
      'Автопродления нет: чтобы остаться в клубе, продли подписку в приложении.',
    trialTomorrow: 'Завтра заканчивается пробная неделя клуба',
    trialTomorrowDo: 'Чтобы остаться в клубе, оформи подписку в приложении.',
    sessionConfirmed: 'Встреча с тренером подтверждена',
    sessionReminderDay: 'Завтра встреча с тренером',
    sessionReminderHour: 'Через час встреча с тренером',
    sessionReminderSoon: 'Скоро встреча с тренером',
    sessionReminderStarted: 'Встреча с тренером уже началась',
    sessionMoved: 'Встреча перенесена',
    sessionMovedFrom: 'Было: {when}',
    sessionCancelled: 'Встреча отменена',
    sessionCancelledDo: 'Чтобы выбрать другое время, напиши тренеру.',
    sessionMoveRule:
      'Перенести время можно в приложении не позже чем за 24 часа. Позже — напиши тренеру.',
    sessionJoin: 'Ссылка на созвон',
    sessionCoachFallback: 'Тренер',
    sessionWhen: '{date}, {time} {zone}',
    moscowTime: 'МСК',
    points: { one: 'балл', few: 'балла', many: 'баллов' },
    days: { one: 'день', few: 'дня', many: 'дней' },
    // Родительный после «из»: «из 1 задания», «из 5 заданий».
    tasks: { one: 'задания', few: 'заданий', many: 'заданий' },
    minutes: { one: 'минута', few: 'минуты', many: 'минут' },
  },
  en: {
    afterPayment:
      'Reload the app and your access will be there. If it still is not — tap “Paid from another ' +
      'email?” in the app and enter the order number from your receipt.',
    openApp: 'Open the app',
    coursePaid: 'Payment received — the course is open.',
    subscriptionPaid: 'Payment received — the club is open.',
    workoutAssigned: 'Sergey has set you a workout',
    workoutWhere: 'It is waiting on the Courses tab and stays there until you do it.',
    winnerTitle: 'You won this week 🏆',
    winnerPrize: 'Your prize: {prize}.',
    winnerWrite: 'Write to Sergey to arrange it — he is waiting.',
    supportReply: 'Coach’s reply:',
    referralOwner: 'Your friend paid for the club — {days} days on us 🎁',
    referralOwnerNoDays: 'Your friend paid for the club — thank you 🎁',
    referralFriend: 'A friend invited you to the club — {days} days on us 🎁',
    duoNudge: '{name} has done today’s task — your turn',
    duoNudgeNoName: 'Your partner',
    openForma: 'Open Forma',
    clubTask: 'Today’s task: <b>{title}</b>{points}',
    clubTaskDo: 'Do it — and tick it off in the app.',
    clubReminder: 'No tick today yet. Your streak of {streak} burns out at midnight 🔥',
    clubReminderPoints: 'Points count until {time} {zone}.',
    clubZoneMoscow: 'Moscow time',
    clubRecap:
      '{week}{points}, {done} of {total} {tasks}{place}. {streak}A new week starts Monday.',
    clubRecapWeek: 'Week {week}: ',
    clubRecapPlace: ', place {place}',
    clubRecapStreak: 'Streak {streak} 🔥. ',
    subscriptionEnding: 'The club is open until {date}',
    subscriptionEndingDo:
      'There is no auto-renewal: to stay in the club, renew your subscription in the app.',
    trialTomorrow: 'Your free week in the club ends tomorrow',
    trialTomorrowDo: 'To stay in the club, subscribe in the app.',
    sessionConfirmed: 'Your session with the coach is confirmed',
    sessionReminderDay: 'Your session with the coach is tomorrow',
    sessionReminderHour: 'Your session with the coach is in an hour',
    sessionReminderSoon: 'Your session with the coach is coming up',
    sessionReminderStarted: 'Your session with the coach has started',
    sessionMoved: 'Your session has been moved',
    sessionMovedFrom: 'Was: {when}',
    sessionCancelled: 'Your session has been cancelled',
    sessionCancelledDo: 'To pick another time, write to the coach.',
    sessionMoveRule:
      'You can move it in the app up to 24 hours ahead. Later than that, write to the coach.',
    sessionJoin: 'Call link',
    sessionCoachFallback: 'Coach',
    sessionWhen: '{date}, {time} {zone}',
    moscowTime: 'Moscow time',
    points: { one: 'point', many: 'points' },
    days: { one: 'day', many: 'days' },
    tasks: { one: 'task', many: 'tasks' },
    minutes: { one: 'minute', many: 'minutes' },
  },
};

/**
 * The moment an access warning (0054) is about: `expires_at` of `subscription_ending`, `ends_at`
 * of `club_trial_tomorrow`, as epoch milliseconds. `null` for every other kind, and for a row
 * whose time does not parse.
 *
 * The text is built when the row is sent, not when it is queued, and a row can wait for the
 * person to link Telegram. By then the warning may be moot: the moment has passed, or the person
 * has renewed or subscribed. `index.ts` uses this to check both before sending, so a warning never
 * arrives after the fact.
 */
export function accessWarningEnd(row: OutboxRow): number | null {
  if (row.kind !== 'subscription_ending' && row.kind !== 'club_trial_tomorrow') return null;
  const raw = row.kind === 'subscription_ending' ? row.params?.expires_at : row.params?.ends_at;
  if (typeof raw !== 'string' || !raw) return null;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : null;
}

/**
 * Текст сообщения по строке очереди, или `null` для вида, которого мы не знаем.
 *
 * `null`, а не исключение: неизвестный вид — это строка из будущей миграции, доехавшая до старой
 * функции, и ронять на ней всю рассылку нельзя.
 */
export function messageFor(
  row: OutboxRow,
  locale: Locale = DEFAULT_LOCALE,
  now?: number,
): Message | null {
  const params = row.params ?? {};
  const c = COPY[locale] ?? COPY[DEFAULT_LOCALE];

  switch (row.kind) {
    case 'course_paid':
      return { text: `<b>${c.coursePaid}</b>\n\n${c.afterPayment}`, buttonText: c.openApp };

    case 'subscription_paid':
      return { text: `<b>${c.subscriptionPaid}</b>\n\n${c.afterPayment}`, buttonText: c.openApp };

    case 'workout_assigned': {
      const raw = typeof params.title === 'string' ? params.title.trim() : '';
      /*
       * Название — если оно есть. Тренировка без названия возможна (поле необязательное), и
       * «Сергей выдал тебе тренировку «»» читается как сбой. Тогда просто без кавычек.
       *
       * Кавычки-ёлочки на обоих языках: название пишет тренер по-русски (в конструкторе одно
       * поле, не два), и английские кавычки вокруг русского названия выглядели бы опечаткой.
       */
      const title = raw ? `: «${escapeHtml(raw.slice(0, 120))}»` : '';
      return {
        text: `<b>${c.workoutAssigned}${title}</b>\n\n${c.workoutWhere}`,
        buttonText: c.openApp,
      };
    }

    case 'weekly_winner': {
      /*
       * Единственное сообщение здесь, которое не сообщает факт, а поздравляет.
       *
       * Приз — словами тренера, из самого круга: он может смениться, и бот не должен обещать час,
       * если на этой неделе обещали другое. Нет приза — нет и строки про него: «ты победил» само
       * по себе полное сообщение. Бот ничего не переводит сам — это чужие слова, и переводить их
       * значит менять то, что человек обещал.
       *
       * Но у приза теперь две половины, и триггер кладёт в очередь обе (0035): выбор языка тут
       * поздний, потому что письмо пишет тренер, а читает победитель, и в очереди оно может
       * пролежать сутки. `prize` остаётся русским и остаётся запасным ответом — в очереди могут
       * лежать сообщения, сложенные до этой миграции, и у них второй половины просто нет.
       *
       * Заметка не двоится: её тренер пишет этому человеку и сейчас.
       *
       * «Напиши Сергею» в конце, потому что приз надо получить, а получить его можно только
       * написав. Сообщение, которое поздравляет и не говорит, что делать дальше, оставляет
       * человека ждать, пока про него вспомнят.
       */
      const prizeRu = typeof params.prize === 'string' ? params.prize.trim() : '';
      const prizeEn = typeof params.prize_en === 'string' ? params.prize_en.trim() : '';
      const prize = locale === 'en' && prizeEn ? prizeEn : prizeRu;
      const note = typeof params.note === 'string' ? params.note.trim() : '';
      const lines = [`<b>${c.winnerTitle}</b>`];
      if (note) lines.push(`«${escapeHtml(note.slice(0, 300))}»`);
      if (prize) lines.push(c.winnerPrize.replace('{prize}', escapeHtml(prize.slice(0, 200))));
      lines.push(c.winnerWrite);
      return { text: lines.join('\n\n'), buttonText: c.openApp };
    }

    case 'support_reply':
      return supportReplyMessage(params, c);

    /*
     * Награда за реферала (0051): одна строка и кнопка. Кому она — говорит `role`: позвавшей или
     * пришедшей. Дни — из очереди, а не из текста: лимит за год у позвавшей может дать ноль, и
     * тогда строка благодарит, а не обещает.
     */
    case 'referral_reward': {
      const days = Number(params.days);
      const n = Number.isSafeInteger(days) && days > 0 ? String(days) : '';
      const line =
        params.role === 'friend'
          ? c.referralFriend.replace('{days}', n || '0')
          : n
            ? c.referralOwner.replace('{days}', n)
            : c.referralOwnerNoDays;
      return { text: `<b>${line}</b>`, buttonText: c.openApp };
    }

    /*
     * Напарник по дуо сделал задание (0051). Имя — как на доске, его пишет человек, поэтому оно
     * экранируется; без имени — «Напарник», чтобы фраза не начиналась с пробела.
     */
    case 'duo_nudge': {
      const raw = typeof params.name === 'string' ? params.name.trim() : '';
      const name = raw ? escapeHtml(raw.slice(0, 60)) : c.duoNudgeNoName;
      return { text: `<b>${c.duoNudge.replace('{name}', name)}</b>`, buttonText: c.openApp };
    }

    /*
     * Ежедневные касания клуба (0052). Кнопка — «Открыть Forma»: сообщение приходит каждый
     * день, и длинная подпись под ним каждый день — лишняя.
     */
    case 'club_task':
      return clubTaskMessage(params, c, locale);

    case 'club_reminder': {
      const streak = count(params.streak);
      // Серии нет — напоминать не о чем; база такое не кладёт, но старая строка может.
      if (streak === null || streak < 1) return null;
      const line = c.clubReminder.replace(
        '{streak}',
        `${streak} ${plural(locale, streak, c.days)}`,
      );
      const points = clubReminderPointsLine(params, c);
      return {
        text: points ? `<b>${line}</b>\n\n${points}` : `<b>${line}</b>`,
        buttonText: c.openForma,
      };
    }

    case 'club_recap':
      return clubRecapMessage(params, c, locale);

    /*
     * Access running out (0054). The date is the one thing that changes; without it there is
     * nothing to say that the app does not already show, so no message.
     */
    case 'subscription_ending': {
      const date = dayOf(params.expires_at, locale);
      if (!date) return null;
      return {
        text: `<b>${c.subscriptionEnding.replace('{date}', date)}</b>\n\n${c.subscriptionEndingDo}`,
        buttonText: c.openApp,
      };
    }

    case 'club_trial_tomorrow':
      return { text: `<b>${c.trialTomorrow}</b>\n\n${c.trialTomorrowDo}`, buttonText: c.openApp };

    case 'session_confirmed':
    case 'session_reminder':
    case 'session_moved':
    case 'session_cancelled':
      return sessionMessage(row.kind, params, c, locale, now);

    default:
      return null;
  }
}

/** Целое неотрицательное число из очереди, или `null`: строку «12» тоже принимает. */
function count(x: unknown): number | null {
  const n = typeof x === 'string' ? Number(x) : x;
  return typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 ? n : null;
}

/**
 * Утро (0052): «Задание на сегодня: <b>{title}</b> · 12 баллов» и одна строка про то, что делать.
 *
 * Название — словами тренера, как у `workout_assigned`: экранируется и не переводится; английская
 * половина берётся, если тренер её написал (0032), как у приза победителя. Без названия сообщения
 * нет — база такое не кладёт. Ноль баллов («Доброе утро», день отдыха) — без хвоста про баллы:
 * «· 0 баллов» читается как насмешка.
 */
function clubTaskMessage(params: Record<string, unknown>, c: Copy, locale: Locale): Message | null {
  const ru = typeof params.title === 'string' ? params.title.trim() : '';
  const en = typeof params.title_en === 'string' ? params.title_en.trim() : '';
  const title = locale === 'en' && en ? en : ru;
  if (!title) return null;
  const points = count(params.points) ?? 0;
  const tail = points > 0 ? ` · ${points} ${plural(locale, points, c.points)}` : '';
  const line = c.clubTask
    .replace('{title}', escapeHtml(title.slice(0, 120)))
    .replace('{points}', tail);
  return { text: `${line}\n\n${c.clubTaskDo}`, buttonText: c.openForma };
}

/**
 * Воскресенье (0052): неделя, баллы, сделано из скольких, место, серия — и что дальше.
 *
 * Места нет, когда доска его не назвала (`null` в очереди); серии нет — нет и фразы про неё:
 * «Серия 0 дней» в вечер закрытия недели — упрёк, а не итог. Номера недели нет — нет и «Неделя N:».
 * Нет ни одного числа — остаётся «0 баллов, 0 из 0» и последняя фраза: это всё ещё сообщение,
 * а не пустой `<b></b>`.
 */
function clubRecapMessage(params: Record<string, unknown>, c: Copy, locale: Locale): Message {
  const week = count(params.week);
  const points = count(params.points) ?? 0;
  const done = count(params.done) ?? 0;
  const total = count(params.total) ?? 0;
  const place = count(params.place);
  const streak = count(params.streak) ?? 0;
  const line = c.clubRecap
    .replace(
      '{week}',
      week !== null && week > 0 ? c.clubRecapWeek.replace('{week}', String(week)) : '',
    )
    .replace('{points}', `${points} ${plural(locale, points, c.points)}`)
    .replace('{done}', String(done))
    .replace('{total}', String(total))
    .replace('{tasks}', plural(locale, total, c.tasks))
    .replace(
      '{place}',
      place !== null && place > 0 ? c.clubRecapPlace.replace('{place}', String(place)) : '',
    )
    .replace(
      '{streak}',
      streak > 0
        ? c.clubRecapStreak.replace('{streak}', `${streak} ${plural(locale, streak, c.days)}`)
        : '',
    );
  return { text: `<b>${line}</b>`, buttonText: c.openForma };
}

/** Сколько символов ответа доходит до человека — тот же предел, что у обращения (0042, 0045). */
export const SUPPORT_REPLY_MAX = 1000;

/**
 * Ответ тренера на обращение (0045): подпись на языке человека и сам текст.
 *
 * Текст — слово в слово, как его написали в админке: бот его не переводит и не правит, только
 * экранирует. Подпись нужна потому, что пишет бот, а не тренер: без неё ответ читался бы как
 * очередное автоматическое сообщение. Кнопки нет — это разговор, а не повод открыть приложение.
 *
 * Если вопрос был задан боту, ответ цитирует его (`replyTo`): в чате, где человек написал три
 * вопроса за вечер, иначе не понять, на который ответили. Пустой ответ — `null`, как неизвестный
 * вид: отправлять одну подпись незачем.
 */
function supportReplyMessage(params: Record<string, unknown>, c: Copy): Message | null {
  const raw = typeof params.text === 'string' ? params.text.trim() : '';
  if (!raw) return null;
  const text = Array.from(raw).slice(0, SUPPORT_REPLY_MAX).join('');
  const replyTo = Number(params.replyTo);
  return {
    text: `<b>${c.supportReply}</b>\n\n${escapeHtml(text)}`,
    buttonText: '',
    ...(Number.isSafeInteger(replyTo) && replyTo > 0 ? { replyTo } : {}),
  };
}

/**
 * «Баллы — до 22:00 по Москве.» under the evening reminder, or nothing (audit item 8).
 *
 * The streak lives until midnight, but a proof after the task's due time keeps the streak and
 * scores nothing for the week — unless the task has `late_counts`. The reminder goes out at 20:00,
 * so both clocks are still running when it is read. The line states the deadline only when the
 * queue row carries it: `due` is `coalesce(task.due_time, marathons.due_time)` («HH:MM»),
 * `late_counts` the task's flag and `tz` the round's `marathons.timezone` (all from 0011). A clock
 * typed into the copy would be wrong the day a coach moves the time, and a Moscow time read in
 * London is two hours off — so no `due`, no `tz`, or a task that scores late: no line.
 */
function clubReminderPointsLine(params: Record<string, unknown>, c: Copy): string {
  if (params.late_counts !== false) return '';
  const due = typeof params.due === 'string' ? /^([01]\d|2[0-3]):([0-5]\d)/.exec(params.due) : null;
  const tz = typeof params.tz === 'string' ? params.tz.trim() : '';
  if (!due || !/^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)+$/.test(tz)) return '';
  const zone = tz === 'Europe/Moscow' ? c.clubZoneMoscow : `(${escapeHtml(tz)})`;
  return c.clubReminderPoints.replace('{time}', `${due[1]}:${due[2]}`).replace('{zone}', zone);
}

/** The zone the product runs on: the club rounds' and the coaches' default. */
const DEFAULT_TIME_ZONE = 'Europe/Moscow';

/** The IANA zone from the queue if the runtime knows it, else Moscow. */
function zoneOf(x: unknown): string {
  const tz = typeof x === 'string' ? x.trim() : '';
  if (!tz) return DEFAULT_TIME_ZONE;
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

/** Under this much to go, the hour-before reminder says «скоро», not «через час». */
const LATE_HOUR_REMINDER_MS = 45 * 60_000;

/** A timestamp from the queue, or `null` when it is missing or unreadable. */
function instant(x: unknown): Date | null {
  if (typeof x !== 'string' || !x.trim()) return null;
  const d = new Date(x);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * «2 октября» / «2 October», on the calendar of `tz`.
 *
 * `en-GB` rather than `en-US`: day before month reads the same way as the Russian half. No year —
 * every date here is days away.
 */
function dayOf(x: unknown, locale: Locale, tz: string = DEFAULT_TIME_ZONE): string {
  const d = instant(x);
  if (!d) return '';
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    timeZone: tz,
  }).format(d);
}

/**
 * «2 октября, 14:30 МСК» — the date, a 24-hour time and the zone.
 *
 * Built from parts rather than one `Intl` call with both date and time: how ICU joins the two
 * («2 октября в 14:30», «2 октября, 14:30») differs between Node and Deno releases, and the test
 * would pass on one and the message change on the other.
 */
function whenOf(x: unknown, tz: string, c: Copy, locale: Locale): string {
  const d = instant(x);
  if (!d) return '';
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: tz,
  }).format(d);
  return c.sessionWhen
    .replace('{date}', dayOf(x, locale, tz))
    .replace('{time}', time)
    .replace('{zone}', tz === DEFAULT_TIME_ZONE ? c.moscowTime : tz);
}

/** The coach's room link, only when it is an https URL; `"` is escaped for the attribute. */
function joinLink(x: unknown, c: Copy): string {
  if (typeof x !== 'string') return '';
  let url: URL;
  try {
    url = new URL(x.trim());
  } catch {
    return '';
  }
  if (url.protocol !== 'https:') return '';
  const href = escapeHtml(url.href).replace(/"/g, '&quot;');
  return `<a href="${href}">${c.sessionJoin}</a>`;
}

/**
 * A coach session (0054; the rows are queued by the booking core, 0055).
 *
 * Params, as the booking core writes them:
 *   * `starts_at` — ISO timestamp of the start. Required: a session message without a time says
 *     nothing, so it is `null`.
 *   * `minutes` — 30 or 60; `tz` — the coach's IANA zone, Moscow by default.
 *   * `coach` / `coach_en` — the coach's name in each language; the Russian one is the fallback.
 *   * `join_url` — the coach's fixed room link (https only); omitted for a cancelled session.
 *   * `from_starts_at` — `session_moved` only: the old time.
 *   * `hours_before` — `session_reminder` only: 24 or 1, which picks the headline.
 *
 * `now` is the sender's clock. The hour-before reminder lives 90 minutes (0056), so a late run can
 * send it with far less than an hour to go, or after the start: then «через час» would be false,
 * and the headline says «скоро» or «уже началась» instead. Without `now` the headline goes by
 * `hours_before` alone.
 *
 * Layout: a bold headline, then «Сергей · 30 минут · 2 октября, 14:30 МСК», then the link and,
 * for a confirmation or a move, the 24-hour rule. The coach's name is a person's own words and is
 * escaped like any other.
 */
function sessionMessage(
  kind: string,
  params: Record<string, unknown>,
  c: Copy,
  locale: Locale,
  now?: number,
): Message | null {
  const tz = zoneOf(params.tz);
  const when = whenOf(params.starts_at, tz, c, locale);
  if (!when) return null;

  const ru = typeof params.coach === 'string' ? params.coach.trim() : '';
  const en = typeof params.coach_en === 'string' ? params.coach_en.trim() : '';
  const coach =
    escapeHtml((locale === 'en' && en ? en : ru).slice(0, 60)) || c.sessionCoachFallback;
  const minutes = count(params.minutes);
  const length = minutes && minutes > 0 ? `${minutes} ${plural(locale, minutes, c.minutes)}` : '';
  const details = [coach, length, when].filter(Boolean).join(' · ');
  const link = kind === 'session_cancelled' ? '' : joinLink(params.join_url, c);

  let title: string;
  const lines: string[] = [];
  switch (kind) {
    case 'session_confirmed':
      title = c.sessionConfirmed;
      lines.push(details);
      if (link) lines.push(link);
      lines.push(c.sessionMoveRule);
      break;
    case 'session_reminder': {
      const hours = count(params.hours_before);
      const starts = instant(params.starts_at)?.getTime() ?? null;
      const left = now !== undefined && starts !== null ? starts - now : null;
      title =
        hours === 24
          ? c.sessionReminderDay
          : left !== null && left <= 0
            ? c.sessionReminderStarted
            : hours === 1 && (left === null || left > LATE_HOUR_REMINDER_MS)
              ? c.sessionReminderHour
              : c.sessionReminderSoon;
      lines.push(details);
      if (link) lines.push(link);
      break;
    }
    case 'session_moved': {
      title = c.sessionMoved;
      lines.push(details);
      const from = whenOf(params.from_starts_at, tz, c, locale);
      if (from) lines.push(c.sessionMovedFrom.replace('{when}', from));
      if (link) lines.push(link);
      lines.push(c.sessionMoveRule);
      break;
    }
    default:
      title = c.sessionCancelled;
      lines.push(details);
      lines.push(c.sessionCancelledDo);
  }
  return { text: [`<b>${title}</b>`, ...lines].join('\n\n'), buttonText: c.openApp };
}
