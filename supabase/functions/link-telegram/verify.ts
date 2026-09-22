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
 * `signature` из пар исключается вместе с `hash`: это подпись третьих сторон (Ed25519), её
 * телеграм добавил позже и в свой же `data_check_string` не кладёт. Оставить её здесь значит
 * ломать проверку на всех новых клиентах.
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
    if (key === 'hash' || key === 'signature') continue;
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
 * Разобрать и проверить строку запуска. `null` — значит «не верю», и звать это надо именно так:
 * причина отказа наружу не выходит, потому что снаружи она подсказка подбирающему.
 *
 * `nowSec` параметром, а не `Date.now()`, чтобы возраст проверялся тестом, а не ожиданием.
 */
export async function verifyInitData(
  initData: string,
  botToken: string,
  nowSec: number = Math.floor(Date.now() / 1000),
  maxAgeSec: number = MAX_AGE_SEC,
): Promise<InitData | null> {
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  const expected = await sign(initData, botToken);
  if (!digestMatches(expected, hash.toLowerCase())) return null;

  const authDate = Number(params.get('auth_date'));
  if (!Number.isFinite(authDate) || authDate <= 0) return null;
  // Обе стороны: строка из будущего — это часы, которым нельзя верить, а значит и подписи под ними.
  if (Math.abs(nowSec - authDate) > maxAgeSec) return null;

  let userId = 0;
  try {
    const user = JSON.parse(params.get('user') ?? 'null') as { id?: unknown } | null;
    userId = typeof user?.id === 'number' ? user.id : Number(user?.id);
  } catch {
    return null;
  }
  // Целое и положительное: id телеграма влезает в двойную точность, но дробей среди них нет.
  if (!Number.isSafeInteger(userId) || userId <= 0) return null;

  return { userId, authDate };
}
