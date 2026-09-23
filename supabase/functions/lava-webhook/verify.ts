/**
 * Проверка уведомления lava.top, без завязки на среду (только Web Crypto) — один и тот же код
 * работает в Edge Function и в ноде под тестом.
 *
 * ## Как lava.top представляется — и как я это выяснил неправильно
 *
 * Сначала здесь стояла проверка HMAC-подписи тела: заголовок `signature`, hex-дайджест, секрет из
 * кабинета. Взялось это из их публичного Python-SDK, где есть `verify_webhook_signature()`:
 * документация из среды сборки недоступна (`lava.top` и `gate.lava.top` закрыты исходящим
 * прокси), и SDK казался лучшим доступным источником.
 *
 * Он им не был. Владелец открыла в кабинете «Add Webhook», и там выбор из двух: **Basic (логин и
 * пароль) либо API-ключ своего сервиса**. Подписи тела lava.top не шлёт вовсе — значит функция
 * отвергла бы каждое настоящее уведомление. Снаружи это выглядело бы как «платежи не доходят», и
 * снова с пустым журналом.
 *
 * Мораль дороже самой правки: **SDK третьей стороны — не спецификация.** Он показывает, что счёл
 * нужным его автор, а не то, что делает сервис.
 *
 * Выбран **Basic**, и не из вкуса: это стандартный заголовок с единственным прочтением
 * (`Authorization: Basic base64(логин:пароль)`), тогда как «API-ключ своего сервиса» — это ещё и
 * угадывание имени заголовка, то есть ровно та ошибка, из которой мы только что вылезли.
 *
 * Сравнение — за постоянное время: побайтовое с ранним выходом рассказывает, сколько первых
 * символов угаданы, а этого достаточно, чтобы пароль подобрать.
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

/** Совпадение двух строк за постоянное время. Разная длина — сразу `false`. */
function sameSecret(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Те ли это логин и пароль, что заведены в кабинете lava.top.
 *
 * `expected` — секрет в виде `логин:пароль`, ровно как его требует Basic. `header` — целиком
 * заголовок `Authorization`, как он приехал.
 *
 * Регистр схемы не важен (`Basic`, `basic`), само значение — важен: пароль есть пароль.
 */
export function basicMatches(expected: string, header: string): boolean {
  const raw = header.trim();
  if (!raw.toLowerCase().startsWith('basic ')) return false;
  const encoded = raw.slice('basic '.length).trim();
  if (!encoded) return false;
  let decoded = '';
  try {
    /*
     * `atob` возвращает не строку, а байты, разложенные по символам 0–255. Сравнивать их
     * напрямую с секретом нельзя: пароль с любой буквой вне латиницы — «пароль», «Grüße» — даёт
     * два байта на символ, и совпадения не будет никогда. Снаружи это выглядело бы как «платежи
     * не доходят», и разбираться пришлось бы по пустому журналу.
     */
    const bytes = Uint8Array.from(atob(encoded), (ch) => ch.charCodeAt(0));
    decoded = new TextDecoder().decode(bytes);
  } catch {
    // Не base64 — значит и не Basic. Отказ, и без подробностей наружу.
    return false;
  }
  return sameSecret(expected.trim(), decoded);
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
