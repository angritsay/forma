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

/** The payment page asks for the same email the order was made with; pass it along. */
export function withEmail(target: URL, email: string): string {
  const url = new URL(target.href);
  url.searchParams.set('email', email);
  return url.href;
}
