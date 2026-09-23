/**
 * Проверка `initData` мини-аппа, на одном только Web Crypto, — чтобы тот же код шёл и в Deno, и в
 * тестах на Node.
 *
 * Телеграм подписывает строку запуска так: секрет — это `HMAC-SHA256(ключ="WebAppData",
 * сообщение=токен бота)`, а подпись — `HMAC-SHA256(ключ=секрет, сообщение=строка проверки)`.
 * Строка проверки — это все пары `ключ=значение`, кроме самой `hash`, отсортированные по ключу и
 * склеенные переводом строки. Значения берутся **как пришли**, без повторного декодирования: они
 * уже декодированы разбором query-строки, и второй проход по `decodeURIComponent` ломает всё, где
 * встречается процент.
 *
 * ## Что проверяется, кроме подписи
 *
 * `auth_date`. Подпись вечна: строка запуска, подсмотренная в логе прокси полгода назад, проходит
 * проверку подписи ровно так же, как сегодняшняя. Поэтому у неё есть срок, и он короткий — эта
 * строка живёт секунды между запуском приложения и первым запросом, а не сутки.
 *
 * ## Из пар исключается только `hash`
 *
 * Здесь была ошибка, и стоила она всей механики сообщений: `signature` исключалась вместе с
 * `hash`. Комментарий рядом уверял, что иначе «сломается проверка на всех новых клиентах», —
 * всё ровно наоборот. `signature` телеграм добавил в Bot API 8.0, шлют её все нынешние клиенты,
 * и она **входит** в `data_check_string`. Выкинув её, мы считали HMAC не от того текста, и
 * подпись не сходилась ни у кого: 0 привязок из 17, `initData rejected — signature` в журнале.
 *
 * Проверено по двум независимым реализациям, раз сама документация из этой среды недоступна
 * (`core.telegram.org` закрыт исходящим прокси):
 *
 *   • aiogram, `aiogram/utils/web_app.py` — `parsed_data.pop("hash")` и больше ничего;
 *   • Telegram-Mini-Apps/telegram-apps, `packages/init-data-node/src/validation.ts` — и это
 *     решающее свидетельство: в ветке Ed25519 SDK исключает и `hash`, и `signature`, а в ветке
 *     HMAC — только `hash`. То есть два разных текста для двух разных проверок, и мы применяли
 *     правило одной к другой.
 */

/** Сколько секунд строка запуска считается свежей. */
export const MAX_AGE_SEC = 900;

export interface InitData {
  /** Telegram user id. */
  userId: number;
  /** Когда телеграм выдал эту строку, unix-секунды. */
  authDate: number;
}

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmac(key: ArrayBuffer | Uint8Array, message: string): Promise<ArrayBuffer> {
  const material = key instanceof Uint8Array ? (key.slice().buffer as ArrayBuffer) : key;
  const imported = await crypto.subtle.importKey(
    'raw',
    material,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return crypto.subtle.sign('HMAC', imported, new TextEncoder().encode(message));
}

/**
 * Строка, которую телеграм на самом деле подписывал.
 *
 * Экспортируется ради тестов: подделать подпись в тесте можно только тем же способом, каким её
 * делает телеграм, и второй копии этого правила в тестах быть не должно.
 */
export function dataCheckString(params: URLSearchParams): string {
  const pairs: string[] = [];
  for (const [key, value] of params) {
    // Только `hash`. `signature` остаётся — см. шапку файла: её исключение и было той ошибкой.
    if (key === 'hash') continue;
    pairs.push(`${key}=${value}`);
  }
  return pairs.sort().join('\n');
}

/** Подпись строки запуска тем же способом, каким её ставит телеграм. */
export async function sign(initData: string, botToken: string): Promise<string> {
  const secret = await hmac(new TextEncoder().encode('WebAppData'), botToken);
  return hex(await hmac(secret, dataCheckString(new URLSearchParams(initData))));
}

/** Сравнение без ветвления по содержимому: одинаковая длина, потом xor всех байтов. */
export function digestMatches(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Почему не поверили. Наружу не уходит никогда — только в журнал функции.
 *
 * Одно слово «не верю» на все причины уже обошлось дорого: отказ выглядел одинаково и когда
 * подпись не та, и когда строка просто устарела, а чинится это совершенно по-разному.
 */
export type Refusal =
  /** Нет `hash` — это вообще не строка запуска телеграма. */
  | 'no-hash'
  /** Подпись не сошлась: чаще всего токен в секрете не от того бота, чей мини-апп открыли. */
  | 'signature'
  /** `auth_date` отсутствует или не число. */
  | 'no-auth-date'
  /** Подпись верна, но строке больше `MAX_AGE_SEC`: окно телеграма живёт дольше самой строки. */
  | 'stale'
  /** Подпись верна, а `user.id` не читается. */
  | 'user';

export type Checked =
  | { ok: true; data: InitData }
  /** `ageSec` есть только у `stale`: в журнал уходит возраст в секундах и больше ничего. */
  | { ok: false; reason: Refusal; ageSec?: number };

/**
 * Проверить строку запуска и **сказать, что именно не так**.
 *
 * Причина нужна тому, кто чинит, и не нужна тому, кто стучится: наружу по-прежнему уходит одно
 * `{ linked: false }` без подробностей (`index.ts`), потому что снаружи причина отказа — подсказка
 * подбирающему.
 *
 * `nowSec` параметром, а не `Date.now()`, чтобы возраст проверялся тестом, а не ожиданием.
 */
export async function checkInitData(
  initData: string,
  botToken: string,
  nowSec: number = Math.floor(Date.now() / 1000),
  maxAgeSec: number = MAX_AGE_SEC,
): Promise<Checked> {
  if (!initData || !botToken) return { ok: false, reason: 'no-hash' };

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { ok: false, reason: 'no-hash' };

  const expected = await sign(initData, botToken);
  if (!digestMatches(expected, hash.toLowerCase())) return { ok: false, reason: 'signature' };

  const authDate = Number(params.get('auth_date'));
  if (!Number.isFinite(authDate) || authDate <= 0) return { ok: false, reason: 'no-auth-date' };
  // Обе стороны: строка из будущего — это часы, которым нельзя верить, а значит и подписи под ними.
  if (Math.abs(nowSec - authDate) > maxAgeSec) {
    return { ok: false, reason: 'stale', ageSec: nowSec - authDate };
  }

  let userId = 0;
  try {
    const user = JSON.parse(params.get('user') ?? 'null') as { id?: unknown } | null;
    userId = typeof user?.id === 'number' ? user.id : Number(user?.id);
  } catch {
    return { ok: false, reason: 'user' };
  }
  // Целое и положительное: id телеграма влезает в двойную точность, но дробей среди них нет.
  if (!Number.isSafeInteger(userId) || userId <= 0) return { ok: false, reason: 'user' };

  return { ok: true, data: { userId, authDate } };
}

/**
 * То же самое, ответом «да или нет» — для тех, кому причина не нужна.
 *
 * `nowSec` параметром, а не `Date.now()`, чтобы возраст проверялся тестом, а не ожиданием.
 */
export async function verifyInitData(
  initData: string,
  botToken: string,
  nowSec: number = Math.floor(Date.now() / 1000),
  maxAgeSec: number = MAX_AGE_SEC,
): Promise<InitData | null> {
  const checked = await checkInitData(initData, botToken, nowSec, maxAgeSec);
  return checked.ok ? checked.data : null;
}
