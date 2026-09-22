/**
 * Проверка уведомления lava.top, без завязки на среду (только Web Crypto) — один и тот же код
 * работает в Edge Function и в ноде под тестом.
 *
 * lava.top подписывает уведомление HMAC-SHA256 по **сырому телу запроса** и кладёт hex-дайджест в
 * заголовок `signature`. Отсюда два требования, и оба легко нарушить:
 *
 *   1. подписывается именно тот текст, который приехал, — не `JSON.stringify(JSON.parse(body))`.
 *      Пробелы и порядок ключей после разбора и сборки почти наверняка станут другими, и подпись
 *      перестанет сходиться на совершенно правильном уведомлении;
 *   2. сравнивать надо за постоянное время. Побайтовое сравнение с ранним выходом рассказывает,
 *      сколько первых символов угаданы, а этого достаточно, чтобы подпись подобрать.
 *
 * ## Откуда взят контракт
 *
 * Официальная документация lava.top из этой среды недоступна (`gate.lava.top` закрыт исходящим
 * прокси), поэтому он восстановлен по их публичному SDK: заголовок `signature`, HMAC-SHA256 hex
 * от тела, секрет — тот, что выдаётся в кабинете. **Это надо подтвердить на первом живом
 * уведомлении** (`docs/SETUP.md` §7.9): при несовпадении функция отвечает 403 и не открывает
 * ничего, так что ошибка в контракте выглядит как «платежи не доходят», а не как открытый доступ
 * кому попало.
 */

/** Виды событий, которые присылает lava.top. */
export type LavaEvent =
  | 'payment.success'
  | 'payment.failed'
  | 'subscription.recurring.payment.success'
  | 'subscription.recurring.payment.failed'
  | 'subscription.cancelled';

/** Тело уведомления — то, что нам от него нужно. */
export interface LavaHook {
  eventType: LavaEvent;
  product: { id?: string; title?: string };
  contractId: string;
  parentContractId?: string | null;
  buyer: { email?: string };
  amount?: number;
  currency?: string;
  status?: string;
  timestamp?: string;
}

/** hex-дайджест HMAC-SHA256 по тексту. */
export async function hmacHex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Сходится ли подпись. Сравнение за постоянное время, регистр не важен — hex бывает любой.
 *
 * Разная длина — сразу `false`, и это не утечка: длина дайджеста и так известна всем.
 */
export function signatureMatches(expected: string, got: string): boolean {
  const a = expected.trim().toLowerCase();
  const b = got.trim().toLowerCase();
  if (a.length !== b.length || a.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Разбор тела в то, с чем можно работать, или `null` — если это не уведомление lava.top.
 *
 * Проверяется ровно то, без чего дальше нечего делать: вид события, идентификатор товара, почта
 * покупателя и номер контракта. Всё остальное — справочное, и придираться к нему значит отвергать
 * правильные уведомления из-за поля, которое мы не читаем.
 */
export function parseHook(raw: unknown): LavaHook | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const eventType = o.eventType;
  if (typeof eventType !== 'string') return null;
  const product = typeof o.product === 'object' && o.product !== null ? o.product : {};
  const buyer = typeof o.buyer === 'object' && o.buyer !== null ? o.buyer : {};
  const contractId = typeof o.contractId === 'string' ? o.contractId : '';
  if (!contractId) return null;
  return {
    eventType: eventType as LavaEvent,
    product: product as LavaHook['product'],
    contractId,
    parentContractId: typeof o.parentContractId === 'string' ? o.parentContractId : null,
    buyer: buyer as LavaHook['buyer'],
    ...(typeof o.amount === 'number' ? { amount: o.amount } : {}),
    ...(typeof o.currency === 'string' ? { currency: o.currency } : {}),
    ...(typeof o.status === 'string' ? { status: o.status } : {}),
    ...(typeof o.timestamp === 'string' ? { timestamp: o.timestamp } : {}),
  };
}

/**
 * Открывает ли это событие доступ.
 *
 * Успешная оплата и успешное продление — да. Отказ и отмена подписки — нет, и молча: отказ ничего
 * не меняет, а отмена подписки означает «больше не продлевать», и доступ при этом живёт до конца
 * оплаченного периода. Отбирать его сразу означало бы забрать неделю, за которую заплатили.
 */
export function grantsAccess(event: LavaEvent): boolean {
  return event === 'payment.success' || event === 'subscription.recurring.payment.success';
}
