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
 */

/** Разобранная карта товаров: ключ lava.top → наш ключ, или наши ключи по цене. */
export type ProductMap = Readonly<Record<string, string | Readonly<Record<string, string>>>>;

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
        if (typeof key === 'string' && Number.isFinite(Number(price))) byPrice[price] = key;
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
export function keyFor(map: ProductMap, productId: string, amount: number | null): string {
  const value = map[productId];
  if (typeof value === 'string') return value;
  if (!value || amount === null || !Number.isFinite(amount)) return '';

  for (const [price, key] of Object.entries(value)) {
    // Допуск в копейку: 19, 19.0 и 19.00 — одна и та же цена.
    if (Math.abs(Number(price) - amount) < 0.01) return key;
  }
  return '';
}
