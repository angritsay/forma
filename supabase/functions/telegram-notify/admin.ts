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
  /** `payment_unclaimed:<id>` and the like; the payment id for rows queued before 0044. */
  dedupe_key?: string | null;
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

/** Сумма с валютой, если она известна (0043): «19» без неё в канале читается как рубли. */
function money(p: Record<string, unknown> | null): string {
  const amount = str(p, 'amount');
  const currency = str(p, 'currency');
  return amount && currency ? `${amount} ${currency}` : amount;
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
 *
 * `appUrl` — адрес приложения (`MINI_APP_URL`). С ним в конце сообщения стоит ссылка прямо на
 * нужный экран админки (0044); без него, или если он не https, — сообщение как раньше.
 */
export function adminMessage(row: AdminRow, appUrl = ''): string | null {
  const text = adminBody(row);
  if (text === null) return null;
  const link = adminLink(row, appUrl);
  return link ? `${text}\n\n<a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a>` : text;
}

/* ---------------------------------------------------------------------------------------------
 * Ссылка в админку (0044).
 *
 * Владелец: сообщение в канале — это повод что-то сделать, а сделать это можно только в админке.
 * Ссылка ведёт прямо туда: платёж — на него самого во вкладке «Платежи», пруф — на сам пруф,
 * обращение — в «Обращения», встреча — в «Записи», всё остальное — на страницу человека.
 *
 * Телеграм принимает в `href` только настоящий адрес: `https://…`. Кривой `MINI_APP_URL` значит
 * сообщение без ссылки, а не отказ телеграма и сообщение, отправленное со второй попытки.
 * ------------------------------------------------------------------------------------------- */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+$/;

/** Корень приложения с `/` на конце, или `null`, если это не https-адрес. */
export function appBase(appUrl: string): string | null {
  let u: URL;
  try {
    u = new URL(appUrl.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || !u.hostname) return null;
  u.hash = '';
  u.search = '';
  const s = u.toString();
  return s.endsWith('/') ? s : `${s}/`;
}

/** Путь внутри приложения → полный адрес. Приложение живёт на hash-роутере: `…/app/#/admin`. */
export function appLink(appUrl: string, path: string): string | null {
  const base = appBase(appUrl);
  return base ? `${base}#${path}` : null;
}

/** Id платежа: из параметров (0044) или из ключа строки — у строк, поставленных раньше. */
function paymentIdOf(row: AdminRow): string {
  const fromParams = str(row.params, 'paymentId');
  if (UUID_RE.test(fromParams)) return fromParams.toLowerCase();
  const tail = (row.dedupe_key ?? '').split(':')[1] ?? '';
  return UUID_RE.test(tail) ? tail.toLowerCase() : '';
}

function personPath(email: string): string | null {
  const e = email.trim();
  return EMAIL_RE.test(e) ? `/admin/people/${encodeURIComponent(e.toLowerCase())}` : null;
}

const PAYMENT_KINDS = new Set(['payment_unclaimed', 'session_paid', 'claim_no_order']);

/** Куда ведёт сообщение этого вида, и как ссылка подписана. */
export function adminLinkPath(row: AdminRow): { path: string; label: string } | null {
  const p = row.params;
  if (PAYMENT_KINDS.has(row.kind)) {
    const id = paymentIdOf(row);
    const filter = row.kind === 'session_paid' ? 'sessions' : 'unclaimed';
    return {
      path: id ? `/admin?tab=payments&id=${id}` : `/admin?tab=payments&filter=${filter}`,
      label: 'Открыть платёж в админке',
    };
  }
  /*
   * Пруф — на сам пруф: `/admin/marathons?proof=<id>` открывает его в очереди клуба. Id — из
   * параметров (0044) или из ключа строки `proof_resubmitted:<id>:<attempt>`.
   */
  if (row.kind === 'proof_resubmitted') {
    const fromParams = str(p, 'proofId');
    const fromKey = (row.dedupe_key ?? '').split(':')[1] ?? '';
    const proof = UUID_RE.test(fromParams) ? fromParams : UUID_RE.test(fromKey) ? fromKey : '';
    return {
      path: proof ? `/admin/marathons?proof=${proof.toLowerCase()}` : '/admin/marathons',
      label: 'Открыть пруф в админке',
    };
  }
  if (row.kind === 'support_message') {
    return { path: '/admin/support', label: 'Открыть обращения в админке' };
  }
  if (
    row.kind === 'session_booked' ||
    row.kind === 'session_moved' ||
    row.kind === 'session_cancelled'
  ) {
    return { path: '/admin/bookings', label: 'Открыть записи в админке' };
  }
  if (row.kind === 'channel_ready') return null;
  const person = personPath(row.kind === 'duo_paired' ? str(p, 'inviter') : str(p, 'email'));
  return person ? { path: person, label: 'Открыть человека в админке' } : null;
}

/** Полная ссылка для сообщения, или `null`. */
export function adminLink(row: AdminRow, appUrl: string): { url: string; label: string } | null {
  const target = adminLinkPath(row);
  if (!target) return null;
  const url = appLink(appUrl, target.path);
  return url ? { url, label: target.label } : null;
}

function adminBody(row: AdminRow): string | null {
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
    /*
     * «Закрыть доступ сейчас» и «Возврат подписки» из админки (0044). Оба закрывают доступ сразу,
     * в отличие от отмены, — поэтому свои слова: иначе в канале это выглядело бы как «Клуб
     * отменён» с датой, которая уже наступила.
     */
    case 'club_closed':
      return block(
        'Доступ к клубу закрыт',
        lines(['Почта', email], ['Тариф', PLAN_NAMES[str(p, 'plan')] ?? str(p, 'plan')]),
      );

    case 'club_refunded':
      return block(
        'Возврат за клуб',
        lines(
          ['Почта', email],
          ['Тариф', PLAN_NAMES[str(p, 'plan')] ?? str(p, 'plan')],
          ['Касса', tillName(str(p, 'source'))],
        ) + '\n\nДоступ закрыт. Деньги возвращаются вручную в кассе.',
      );

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
          ['Сумма', money(p)],
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
          ['Сумма', money(p)],
          ['За что', INTENT_NAMES[str(p, 'intent')] ?? str(p, 'intent')],
          ['Касса', tillName(str(p, 'provider'))],
          ['Заказ', str(p, 'ref')],
        ) +
          '\n\nДоступ не открылся — заказа нет, их несколько, почта в кассе другая или товар не распознан.',
      );

    /*
     * Человек пришёл забирать платёж за курс по номеру из чека, а ожидающего заказа у него нет
     * (0043). Платёж не сожжён — его можно забрать снова, — но человек сейчас стоит перед экраном
     * без курса и ждёт, так что это надо увидеть сразу.
     */
    case 'claim_no_order':
      return block(
        'Пришли за платежом, а заказа нет',
        lines(
          ['Аккаунт', email],
          ['Почта в кассе', str(p, 'payEmail')],
          ['Сумма', money(p)],
          ['Касса', tillName(str(p, 'provider'))],
          ['Заказ', str(p, 'ref')],
        ) +
          '\n\nКурс не открылся: у аккаунта нет ожидающего заказа или их несколько. Платёж ждёт — открой курс вручную или попроси оформить заказ и забрать снова.',
      );

    case 'support_message':
      return supportMessage(p);

    case 'channel_ready':
      return block('Канал подключён', 'Сюда будут приходить события этой темы.');

    default:
      return null;
  }
}

/**
 * Сколько неудачных попыток подряд строка канала переживает, прежде чем стать `failed`.
 *
 * Запуск раз в десять минут, так что двенадцать попыток — два часа. Этого хватает, чтобы пережить
 * перебой у телеграма, лимит частоты и выкладку, и не хватает, чтобы строка с настоящей ошибкой
 * (бота выгнали из группы, тему удалили) висела вечно.
 */
export const ADMIN_MAX_ATTEMPTS = 12;

/**
 * Ответы телеграма, которые чинятся тем же сообщением без ссылок: ссылка на человека
 * (`tg://user?id=…`) бывает запрещена его настройками приватности, и тогда телеграм отказывает
 * всему сообщению — хотя всё остальное в нём в порядке.
 */
const LINK_TROUBLE_RE =
  /can't parse entities|invalid url|wrong http url|url host is empty|unsupported url protocol|button_url_invalid/i;

/** Что делать со строкой канала после отказа. */
export type AdminFailure = 'retry_plain' | 'retry' | 'give_up';

/**
 * Решение по отказу телеграма.
 *
 * * **400 про разметку или ссылку** — сразу ещё раз, тем же текстом без ссылок, один раз.
 * * **Всё остальное** — 429, 5xx, обрыв, но и 400/403 («тему удалили», «бота выгнали»): строка
 *   остаётся `pending` и пробуется в следующий запуск. Раньше 400 и 403 сразу делали строку
 *   `failed`, и сообщение о деньгах пропадало из-за того, что владелец в ту минуту переименовывал
 *   тему. Эти ошибки чинятся руками, и строка должна дождаться, пока их починят.
 * * **`failed`** — только после {@link ADMIN_MAX_ATTEMPTS} попыток.
 *
 * `attemptsAfter` — сколько попыток будет с учётом этой.
 */
export function adminFailure(
  status: number,
  body: string,
  attemptsAfter: number,
  plainTried: boolean,
): AdminFailure {
  if (status === 400 && !plainTried && LINK_TROUBLE_RE.test(body)) return 'retry_plain';
  if (attemptsAfter >= ADMIN_MAX_ATTEMPTS) return 'give_up';
  return 'retry';
}

/** Ссылки — в простой текст: `<a href="…">подпись</a>` → `подпись`. Остальная разметка остаётся. */
export function stripLinks(html: string): string {
  return html.replace(/<a\s[^>]*>/gi, '').replace(/<\/a>/gi, '');
}
