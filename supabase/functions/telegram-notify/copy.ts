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
  'course_paid' | 'subscription_paid' | 'workout_assigned' | 'weekly_winner' | 'support_reply';

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

    default:
      return null;
  }
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
