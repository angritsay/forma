/**
 * Что именно купили: разбор секрета `LAVA_PRODUCTS` и выбор ключа по уведомлению.
 *
 * ## Почему одного `product.id` не хватает
 *
 * В lava.top подписка заводится «тарифом» (Tier), а тариф — это **один товар с несколькими
 * периодами**: цена за месяц обязательна, год включается переключателем рядом. То есть месяц и год
 * живут под одним и тем же `product.id`.
 *
 * А в уведомлении периода нет вовсе. Тело вебхука — `eventType`, `product {id, title}`,
 * `contractId`, `buyer`, `amount`, `currency`, `status`, `timestamp`: ни поля `periodicity`, ни
 * чего-либо похожего (проверено по их SDK, `PurchaseWebhookLog` в `types_custom.py`; сама
 * документация из среды сборки недоступна).
 *
 * Значит различить месяц от года можно только суммой. Ровно так же, как это делает
 * `prodamus-webhook`, и по той же причине: касса не говорит, что куплено, — приходится смотреть на
 * цифру. Разница в том, что здесь это касается только подписки: у курса свой товар и свой id.
 *
 * ## Форма секрета
 *
 * Значение по ключу — либо строка, либо цены:
 *
 * ```json
 * {
 *   "<id товара-курса>": "course:start",
 *   "<id тарифа>": { "19": "plan:monthly", "79": "plan:annual" }
 * }
 * ```
 *
 * Строка — «этот товар всегда вот это». Объект — «смотри на сумму». Обе формы работают
 * одновременно, потому что курс и подписка в lava.top устроены по-разному, и притворяться, что
 * одинаково, значит однажды открыть год тому, кто заплатил за месяц.
 *
 * Сумма сравнивается с допуском в копейку: `19`, `19.0` и `19.00` — одно и то же число, а в каком
 * виде оно приедет, не наше дело.
 *
 * ## Валюта
 *
 * lava.top продаёт один товар в нескольких валютах, и «19» в долларах и «19» в евро — разные
 * деньги. Цену можно записать с кодом валюты — `"19 USD"`, — и тогда она сойдётся только с этой
 * валютой. Цена без кода сходится с любой: так секрет заполнялся до этого, и ломать его незачем.
 *
 * ## Что с ключом делать — решает {@link actionFor}
 *
 * Ключ, который не начинается ни с `plan:`, ни с `session:`, ни с `course:`, — не «наверное,
 * курс», а незнакомый товар. Раньше всё, что не тариф и не занятие, уходило открывать курс по
 * ожидающему заказу, и опечатка в секрете или товар, которого нет в карте, открывали человеку
 * тот курс, на который у него висел заказ. Теперь такой платёж записывается непривязанным и
 * ждёт владельца.
 */

/** Разобранная карта товаров: ключ lava.top → наш ключ, или наши ключи по цене. */
export type ProductMap = Readonly<Record<string, string | Readonly<Record<string, string>>>>;

/** Цена в секрете: число и, через пробел, необязательный код валюты — `19`, `19.00 USD`. */
const PRICE_RE = /^(\d+(?:\.\d+)?)(?:\s+([A-Za-z]{3}))?$/;

/** Разбор секрета. Кривой JSON — пустая карта: платёж всё равно попадёт в журнал и дождётся рук. */
export function parseProductMap(raw: string): ProductMap {
  if (!raw.trim()) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};

  const out: Record<string, string | Record<string, string>> = {};
  for (const [id, value] of Object.entries(parsed)) {
    if (typeof value === 'string') {
      out[id] = value;
      continue;
    }
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const byPrice: Record<string, string> = {};
      for (const [price, key] of Object.entries(value)) {
        if (typeof key === 'string' && PRICE_RE.test(price.trim())) byPrice[price] = key;
      }
      if (Object.keys(byPrice).length > 0) out[id] = byPrice;
    }
  }
  return out;
}

/**
 * Наш ключ по товару и сумме, или `''` — если сопоставить не с чем.
 *
 * Пустая строка не ошибка и не потеря: платёж уйдёт в журнал непривязанным и будет ждать выдачи
 * руками. Это лучше, чем угадать не тот тариф.
 */
export function keyFor(
  map: ProductMap,
  productId: string,
  amount: number | null,
  currency: string | null = null,
): string {
  const value = map[productId];
  if (typeof value === 'string') return value;
  if (!value || amount === null || !Number.isFinite(amount)) return '';

  for (const [price, key] of Object.entries(value)) {
    const m = PRICE_RE.exec(price.trim());
    if (!m) continue;
    // Цена с кодом валюты сходится только с этой валютой; без кода — с любой.
    if (m[2] && m[2].toUpperCase() !== currency) continue;
    // Допуск в копейку: 19, 19.0 и 19.00 — одна и та же цена.
    if (Math.abs(Number(m[1]) - amount) < 0.01) return key;
  }
  return '';
}

/** Код валюты из уведомления: три латинские буквы заглавными, иначе `null`. */
export function currencyCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : null;
}

/** Что сделать с оплатой. */
export type LavaAction =
  | { kind: 'plan'; plan: 'monthly' | 'annual' }
  | { kind: 'session'; key: string }
  | { kind: 'course'; courseId: string }
  | { kind: 'unknown' };

/**
 * Ключ из карты → действие. Всё, что не распознано дословно, — `unknown`: платёж записывается
 * непривязанным (в канал владельца уходит «Платёж не привязан»), и ни подписка, ни курс не
 * открываются наугад.
 */
export function actionFor(key: string): LavaAction {
  if (key === 'plan:monthly') return { kind: 'plan', plan: 'monthly' };
  if (key === 'plan:annual') return { kind: 'plan', plan: 'annual' };
  if (/^session:[a-z0-9_]{1,40}$/.test(key)) return { kind: 'session', key };
  const course = /^course:([a-z0-9_]{2,40})$/.exec(key);
  if (course) return { kind: 'course', courseId: course[1]! };
  return { kind: 'unknown' };
}

/** Вид платежа в журнале (`payments.intent`) для каждого действия. */
export function intentFor(action: LavaAction): 'monthly' | 'annual' | 'session' | 'course' {
  if (action.kind === 'plan') return action.plan;
  if (action.kind === 'session') return 'session';
  // Незнакомый товар пишется как курс: вида «неизвестно» в журнале нет, а тема канала у курса та,
  // куда владелец и так смотрит за непривязанными платежами.
  return 'course';
}
