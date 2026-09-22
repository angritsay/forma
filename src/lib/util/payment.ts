import { DEFAULT_LOCALE, type Locale } from '@/content/schema';

/**
 * Following a payment link hands the visitor's email to a third party, so only an absolute
 * `https://` URL is ever navigated to. Anything else (relative path, `http:`, `javascript:`, a
 * typo) is ignored and the flow ends without a redirect. `PaymentUrlSchema` enforces the same rule
 * on course content at build time; this is the runtime half, and it also covers config the schema
 * does not see (the booking link).
 */
export function paymentTarget(url: string | undefined): URL | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  return parsed.protocol === 'https:' ? parsed : null;
}

/**
 * The payment page asks for the same email the order was made with; pass it along.
 *
 * Two parameter names, because that email is the key tying a payment back to its order: a
 * customer who retypes it — one letter different, or a second address — leaves a paid order
 * nobody can match to a purchase. `email` is the generic name; `customer_email` is the one
 * Prodamus, the processor in use, reads to prefill its form. A payment page ignores query
 * parameters it does not recognise, so sending both costs nothing and keeps these links working
 * if the processor is ever swapped.
 */
export function withEmail(target: URL, email: string): string {
  const url = new URL(target.href);
  url.searchParams.set('email', email);
  url.searchParams.set('customer_email', email);
  return url.href;
}

/* ---------------------------------------------------------------------------------------------
 * Тот, кто не может заплатить в рублях
 * ------------------------------------------------------------------------------------------- */

/** Нужна ли этому языку вторая касса вместо рублёвой. */
export function needsForeignTill(locale: Locale): boolean {
  return locale !== DEFAULT_LOCALE;
}

/**
 * Куда ведёт «купить» — и чем это место является.
 *
 * `till` — настоящая касса: туда уходит почта, и её хост можно назвать в подписи под кнопкой,
 * потому что человек сейчас окажется на чужом сайте и должен узнать его имя. Касс две, и какая
 * из них — решает язык: рубли идут в Prodamus, остальное в lava.top.
 *
 * Это по-прежнему один тип, а не два: со стороны экрана обе кассы — «чужой сайт, куда уходят
 * платить», и всё, что их различает, решено здесь.
 */
export type PayRoute = { kind: 'external'; url: URL };

/**
 * Маршрут оплаты, или `null`, если платить негде.
 *
 * Русскому читателю — рублёвая касса, всем остальным — `foreignUrl`, ссылка на товар в lava.top
 * из `content/site/payments.ts`. Нет её — нет и маршрута: кнопка «купить» тогда ведёт туда же,
 * куда ведёт любая отсутствующая ссылка на оплату в этом продукте, к адресу поддержки. Раньше на
 * этом месте была страница с инструкцией и переводом на PayPal; владелец заменила её кассой,
 * потому что касса открывает доступ сама.
 *
 * Ссылка на рублёвую кассу проверяется первой и на всех языках: она же и есть признак того, что
 * вещь продаётся. Нет её — значит не продаётся никому, и английский читатель получает тот же
 * запасной путь, что русский, а не ссылку на товар, которого нет.
 */
export function payRoute(
  locale: Locale,
  url: string | undefined,
  foreignUrl?: string | null,
): PayRoute | null {
  const rub = paymentTarget(url);
  if (!rub) return null;
  if (!needsForeignTill(locale)) return { kind: 'external', url: rub };
  const foreign = paymentTarget(foreignUrl ?? undefined);
  return foreign ? { kind: 'external', url: foreign } : null;
}

/** Адрес для перехода, с почтой — она связывает платёж с человеком. */
export function payHref(route: PayRoute, email = ''): string {
  return email ? withEmail(route.url, email) : route.url.href;
}

/** Хост, который честно назвать в подписи под кнопкой. */
export function payHost(route: PayRoute): string | null {
  return route.url.host;
}
