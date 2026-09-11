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
