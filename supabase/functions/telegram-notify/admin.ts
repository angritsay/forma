/**
 * Что канал владельца пишет по каждому поводу, и в какую тему. Чистые функции, без `Deno`, —
 * чтобы текст проверялся тестом, а не первым живым платежом.
 *
 * ## Один язык
 *
 * Русский, и без выбора. У сообщений людям язык берётся у получателя (`copy.ts`), потому что
 * получателей тысячи и они разные. Здесь читателей двое, оба русские, и локализация была бы
 * механикой без повода.
 *
 * ## Тон другой, чем у бота
 *
 * Бот пишет клиенту и говорит «ты». Здесь — журнал: первое слово называет событие, дальше факты
 * строками, и ни одного обращения. Это то, что читают взглядом по диагонали в списке из сорока
 * сообщений, а не письмо.
 *
 * Адрес человека — всегда, и это не небрежность с приватностью: канал закрытый, читают его двое,
 * и без адреса ни одно из этих сообщений нельзя превратить в действие. Именно им ищут в админке.
 *
 * ## HTML, и почему заголовок жирный
 *
 * Тот же довод, что в `copy.ts`: MarkdownV2 требует экранировать «.», «-» и «(», а сообщение, не
 * разобравшееся у телеграма, не видит никто. Жирная первая строка — единственная разметка: она
 * даёт списку сообщений колонку, по которой глаз скользит.
 */

/** Темы группы. Имена наши; числовые id тем живут секретом (`docs/SETUP.md`). */
export type AdminTopic = 'signups' | 'courses' | 'club' | 'sessions' | 'support';

export const ADMIN_TOPICS: readonly AdminTopic[] = [
  'signups',
  'courses',
  'club',
  'sessions',
  'support',
] as const;

/** Как тема называется в самой группе — этим её и создаёт настроечный workflow. */
export const TOPIC_TITLES: Readonly<Record<AdminTopic, string>> = {
  signups: 'Регистрации',
  courses: 'Курсы',
  club: 'Клуб',
  sessions: 'Онлайн-тренировки',
  support: 'Обращения',
};

/**
 * Числовые id тем из секрета `TELEGRAM_ADMIN_TOPICS`. Кривой JSON — пустая карта, а не отказ:
 * сообщение тогда уйдёт в группу без темы, что видно и поправимо, в отличие от тишины.
 */
export function parseTopics(raw: string): Readonly<Record<string, number>> {
  if (!raw.trim()) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
  const out: Record<string, number> = {};
  for (const [name, id] of Object.entries(parsed)) {
    const n = typeof id === 'number' ? id : Number(id);
    if (Number.isFinite(n) && n > 0) out[name] = n;
  }
  return out;
}

export interface AdminRow {
  topic: string;
  kind: string;
  params: Record<string, unknown> | null;
}

/** `&`, `<` и `>` — всё, что телеграм считает особым в HTML. */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function str(params: Record<string, unknown> | null, key: string): string {
  const v = params?.[key];
  return typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '';
}

/** Название кассы так, как её называет человек, а не колонка. */
function tillName(source: string): string {
  const s = source.trim().toLowerCase();
  if (s === 'prodamus') return 'Prodamus';
  if (s === 'lava') return 'lava.top';
  if (s === 'admin') return 'выдано вручную';
  if (!s) return 'неизвестно';
  return s;
}

const PLAN_NAMES: Readonly<Record<string, string>> = {
  monthly: 'месяц',
  annual: 'год',
};

const INTENT_NAMES: Readonly<Record<string, string>> = {
  monthly: 'подписка на месяц',
  annual: 'подписка на год',
  course: 'курс',
  session: 'занятие с тренером',
};

/**
 * Момент времени так, как его прочтёт человек: Москва, потому что тренер и владелец живут в ней,
 * а бронь приезжает в UTC.
 *
 * Своя сборка строки, а не `toLocaleString('ru-RU')`: на Deno полный ICU есть не всегда, и тихий
 * откат к английскому формату превратил бы дату в «Sep 23, 2026», что читается уже не сразу.
 */
export function moscowTime(iso: string): string {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return iso;
  const ms = t.getTime() + 3 * 60 * 60 * 1000;
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} МСК`;
}

/** Строки «ключ: значение», пустые выброшены. Пустая строка в журнале хуже отсутствующей. */
function lines(...pairs: (readonly [string, string])[]): string {
  return pairs
    .filter(([, v]) => v.trim().length > 0)
    .map(([k, v]) => `${k}: ${escapeHtml(v)}`)
    .join('\n');
}

function block(title: string, body: string): string {
  return body ? `<b>${escapeHtml(title)}</b>\n${body}` : `<b>${escapeHtml(title)}</b>`;
}

const LANGUAGE_NAMES: Readonly<Record<string, string>> = { ru: 'русский', en: 'английский' };

const ATTACHMENT_NAMES: Readonly<Record<string, string>> = {
  photo: 'фото',
  video: 'видео',
  document: 'файл',
  audio: 'аудио',
  voice: 'голосовое',
  animation: 'гифка',
};

/** Имя в телеграме по его правилам: латиница, цифры и `_`, до 32 символов. Иначе — не ссылка. */
const USERNAME_RE = /^[A-Za-z0-9_]{3,32}$/;
/** Id пользователя телеграма — только цифры. Всё прочее в ссылку не подставляется. */
const TELEGRAM_ID_RE = /^[1-9][0-9]{0,15}$/;

/**
 * Как ответить человеку, одной строкой со ссылкой — ради неё сообщение и нужно.
 *
 * **Отвечает тренер сам, со своего аккаунта.** Ни служебный бот, ни основной не могут написать
 * человеку от имени тренера, а служебный не может написать ему вовсе: бот пишет только тем, кто
 * сам начал с ним разговор. Поэтому ссылка открывает личный чат с человеком.
 *
 * `@username` — надёжнее всего: `t.me/<username>` открывается у кого угодно. Без него остаётся
 * `tg://user?id=…`, которую телеграм открывает, если человек не запретил находить себя по номеру
 * и уже попадался тренеру; иначе ссылка превращается в простой текст, и тогда ответить можно
 * только через почту или — если человек писал в бота — попросить его в ответе оставить @username.
 */
function replyLine(p: Record<string, unknown> | null): string {
  const username = str(p, 'username').replace(/^@/, '');
  if (USERNAME_RE.test(username)) {
    return `Ответить: <a href="https://t.me/${username}">@${escapeHtml(username)}</a>`;
  }
  const tgId = str(p, 'tgId');
  if (TELEGRAM_ID_RE.test(tgId)) {
    return `Ответить: <a href="tg://user?id=${tgId}">открыть чат в телеграме</a>`;
  }
  const email = str(p, 'email');
  if (email) return `Ответить на почту: ${escapeHtml(email)}`;
  return '';
}

/**
 * Обращение — единственный повод, где главное не поля, а то, что человек написал. Поэтому текст
 * идёт цитатой, отдельно от строк про автора, а под ним — как ответить.
 */
function supportMessage(p: Record<string, unknown> | null): string {
  const fromBot = str(p, 'source') === 'telegram';
  const username = str(p, 'username').replace(/^@/, '');
  const account = str(p, 'account');
  const attachment = str(p, 'attachment');
  const text = str(p, 'text').trim();

  const head = lines(
    ['Имя', str(p, 'name')],
    ['Телеграм', USERNAME_RE.test(username) ? `@${username}` : ''],
    ['Почта', str(p, 'email')],
    ['Аккаунт в приложении', fromBot ? (account === 'yes' ? 'есть' : 'нет') : ''],
    ['Язык', LANGUAGE_NAMES[str(p, 'locale')] ?? str(p, 'locale')],
    ['Откуда', str(p, 'context')],
    ['Вложение', attachment ? `${ATTACHMENT_NAMES[attachment] ?? attachment} — открой чат` : ''],
  );
  const parts = [head];
  if (text) parts.push(`<blockquote>${escapeHtml(text)}</blockquote>`);
  const how = replyLine(p);
  if (how) parts.push(how);
  return block(
    fromBot ? 'Обращение в бот' : 'Обращение из приложения',
    parts.filter(Boolean).join('\n\n'),
  );
}

/**
 * Текст сообщения, или `null` — повод незнакомый.
 *
 * `null`, а не заглушка: неизвестный вид значит, что база обогнала функцию, и молча написать
 * «событие» в канал было бы хуже, чем оставить строку в очереди и сказать об этом в логе.
 */
export function adminMessage(row: AdminRow): string | null {
  const p = row.params;
  const email = str(p, 'email');

  switch (row.kind) {
    case 'signup':
      return block('Регистрация', lines(['Почта', email], ['Язык', str(p, 'locale')]));

    case 'course_paid':
      return block(
        'Курс оплачен',
        lines(
          ['Курс', str(p, 'courseId')],
          ['Почта', email],
          ['Касса', tillName(str(p, 'source'))],
        ),
      );

    case 'course_refunded':
      return block(
        'Возврат за курс',
        lines(
          ['Курс', str(p, 'courseId')],
          ['Почта', email],
          ['Касса', tillName(str(p, 'source'))],
        ),
      );

    case 'club_paid':
      return block(
        'Клуб оплачен',
        lines(
          ['Тариф', PLAN_NAMES[str(p, 'plan')] ?? str(p, 'plan')],
          ['Почта', email],
          ['Касса', tillName(str(p, 'source'))],
          ['Действует до', str(p, 'expiresAt') ? moscowTime(str(p, 'expiresAt')) : ''],
        ),
      );

    case 'club_renewed':
      return block(
        'Клуб продлён',
        lines(
          ['Тариф', PLAN_NAMES[str(p, 'plan')] ?? str(p, 'plan')],
          ['Почта', email],
          ['Касса', tillName(str(p, 'source'))],
          ['Действует до', str(p, 'expiresAt') ? moscowTime(str(p, 'expiresAt')) : ''],
        ),
      );

    /*
     * Отмена — не потеря доступа: оплаченный период дослуживает до конца (0005). Строка
     * «действует до» здесь поэтому главная, а не служебная: она говорит, сколько времени ещё есть
     * на то, чтобы человека вернуть.
     */
    case 'club_cancelled':
      return block(
        'Клуб отменён',
        lines(
          ['Почта', email],
          ['Доступ до', str(p, 'expiresAt') ? moscowTime(str(p, 'expiresAt')) : ''],
        ),
      );

    case 'duo_paired':
      return block(
        'Пара дуо собралась',
        lines(['Позвал', str(p, 'inviter')], ['Принял', str(p, 'partner')]),
      );

    case 'proof_resubmitted':
      return block(
        'Пруф прислали заново',
        lines(
          ['Почта', email],
          ['Попытка', str(p, 'attempt')],
          ['День', str(p, 'day')],
          ['Отказ был', str(p, 'reason')],
        ),
      );

    case 'session_paid':
      return block(
        'Занятие оплачено',
        lines(
          ['Почта', email],
          ['Сумма', str(p, 'amount')],
          ['Касса', tillName(str(p, 'provider'))],
          ['Заказ', str(p, 'ref')],
        ),
      );

    case 'session_booked':
      return block(
        'Выбрали время',
        lines(
          ['Когда', str(p, 'startsAt') ? moscowTime(str(p, 'startsAt')) : ''],
          ['Длительность', str(p, 'minutes') ? `${str(p, 'minutes')} мин` : ''],
          ['Почта', email],
          ['Часовой пояс клиента', str(p, 'timezone')],
        ),
      );

    case 'session_moved':
      return block(
        'Встречу перенесли',
        lines(
          ['Новое время', str(p, 'startsAt') ? moscowTime(str(p, 'startsAt')) : ''],
          ['Почта', email],
        ),
      );

    case 'session_cancelled':
      return block(
        'Встречу отменили',
        lines(['Было', str(p, 'startsAt') ? moscowTime(str(p, 'startsAt')) : ''], ['Почта', email]),
      );

    /*
     * Деньги пришли, доступ не открылся. Самое важное сообщение во всём канале: человек заплатил
     * и сидит без курса, и единственный, кто может это исправить, — тот, кто это прочтёт.
     */
    case 'payment_unclaimed':
      return block(
        'Платёж не привязан',
        lines(
          ['Почта', email],
          ['Сумма', str(p, 'amount')],
          ['За что', INTENT_NAMES[str(p, 'intent')] ?? str(p, 'intent')],
          ['Касса', tillName(str(p, 'provider'))],
          ['Заказ', str(p, 'ref')],
        ) + '\n\nДоступ не открылся — заказа нет, их несколько или почта в кассе другая.',
      );

    case 'support_message':
      return supportMessage(p);

    case 'channel_ready':
      return block('Канал подключён', 'Сюда будут приходить события этой темы.');

    default:
      return null;
  }
}
