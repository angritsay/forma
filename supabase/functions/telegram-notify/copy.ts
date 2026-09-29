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
  | 'club_recap';

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
  /** The line under it: the streak waits for midnight, the week's points do not. */
  clubReminderPoints: string;
  /** Воскресенье (0052): `{place}` — «, место 3» или ничего; `{streak}` — «Серия 3 дня 🔥. » или ничего. */
  clubRecap: string;
  clubRecapWeek: string;
  clubRecapPlace: string;
  clubRecapStreak: string;
  /** Формы слов при числе: балл / день / задание. */
  points: Plural;
  days: Plural;
  tasks: Plural;
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
    clubReminderPoints: 'Баллы — до 22:00.',
    clubRecap:
      '{week}{points}, {done} из {total} {tasks}{place}. {streak}Новая неделя — в понедельник.',
    clubRecapWeek: 'Неделя {week}: ',
    clubRecapPlace: ', место {place}',
    clubRecapStreak: 'Серия {streak} 🔥. ',
    points: { one: 'балл', few: 'балла', many: 'баллов' },
    days: { one: 'день', few: 'дня', many: 'дней' },
    // Родительный после «из»: «из 1 задания», «из 5 заданий».
    tasks: { one: 'задания', few: 'заданий', many: 'заданий' },
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
    clubReminderPoints: 'Points count until 22:00.',
    clubRecap:
      '{week}{points}, {done} of {total} {tasks}{place}. {streak}A new week starts Monday.',
    clubRecapWeek: 'Week {week}: ',
    clubRecapPlace: ', place {place}',
    clubRecapStreak: 'Streak {streak} 🔥. ',
    points: { one: 'point', many: 'points' },
    days: { one: 'day', many: 'days' },
    tasks: { one: 'task', many: 'tasks' },
  },
};

/**
 * Текст сообщения по строке очереди, или `null` для вида, которого мы не знаем.
 *
 * `null`, а не исключение: неизвестный вид — это строка из будущей миграции, доехавшая до старой
 * функции, и ронять на ней всю рассылку нельзя.
 */
export function messageFor(row: OutboxRow, locale: Locale = DEFAULT_LOCALE): Message | null {
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
      /*
       * The streak lives until midnight, but the task is due at 22:00 (0016's `due_time`), and a
       * proof after that keeps the streak and scores nothing for the week (audit item 8). The
       * reminder goes out at 20:00, so both clocks are still running when it is read.
       */
      return {
        text: `<b>${line}</b>\n\n${c.clubReminderPoints}`,
        buttonText: c.openForma,
      };
    }

    case 'club_recap':
      return clubRecapMessage(params, c, locale);

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
