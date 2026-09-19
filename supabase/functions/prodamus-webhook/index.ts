/**
 * Prodamus → Supabase: activate or extend a subscription when a payment lands.
 *
 * Deploy:  supabase functions deploy prodamus-webhook --no-verify-jwt
 * Secrets: supabase secrets set PRODAMUS_SECRET=… WEBHOOK_TOKEN=…
 *          (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by the platform)
 * URL to put in Prodamus ("Уведомления"): https://<project>.functions.supabase.co/prodamus-webhook?token=<WEBHOOK_TOKEN>
 *
 * Two independent checks guard the door: the token in the URL (only Prodamus knows it) and the
 * HMAC signature Prodamus sends in the `Sign` header (only Prodamus can produce it). Either
 * failing → 403, nothing written. `apply_subscription_payment()` then does the rest and is
 * idempotent per order id, so a notification delivered twice extends once.
 *
 * Which plan was paid is decided by the amount (PLAN_MONTHLY_RUB / PLAN_ANNUAL_RUB, defaulting to
 * the prices in content/site/plans.ts).
 *
 * **Anything that is not a plan is tried as a course** (0019). Not by amount: amounts collide
 * between products and a Prodamus short link drops the query parameters it was given, so the
 * course id cannot ride along with the payment. `apply_course_payment()` reads what the system
 * already knows instead — the `pending` purchase that both the site form and the app's unlock
 * sheet write through `create_order()` before sending anyone to pay. When that is ambiguous (no
 * pending order, or several) it answers null and the row is left to the coach, because activating
 * the wrong course silently is worse than activating the right one late.
 *
 * Order matters: the plan check runs first because it is an exact amount match, and a course
 * priced at exactly a plan's price would otherwise be read as a subscription. `plans.test.ts`
 * guards that the two price sets stay disjoint.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { parseForm, planForAmount, readPayment, sign, signatureMatches } from './verify.ts';

const PRICES = {
  monthly: Number(Deno.env.get('PLAN_MONTHLY_RUB') ?? '1990'),
  annual: Number(Deno.env.get('PLAN_ANNUAL_RUB') ?? '7990'),
};

function reply(status: number, body: string): Response {
  return new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply(405, 'method not allowed');

  const token = Deno.env.get('WEBHOOK_TOKEN');
  if (!token || new URL(req.url).searchParams.get('token') !== token) {
    return reply(403, 'bad token');
  }

  const raw = await req.text();
  const contentType = req.headers.get('content-type') ?? '';
  let data;
  try {
    data = contentType.includes('application/json')
      ? (JSON.parse(raw) as Record<string, unknown>)
      : parseForm(new URLSearchParams(raw));
  } catch {
    return reply(400, 'unreadable body');
  }

  /*
   * Fail closed. This is the function that hands out paid access, and it used to fall back to the
   * URL token alone when the signing secret was unset.
   *
   * A token in a query string is the weakest kind of credential there is: it sits in the Prodamus
   * dashboard, in browser history if anyone ever opens the URL, and in the logs of every proxy the
   * request crosses. On its own it is enough for a stranger to post `status=success` and
   * `sum=7990` and give themselves a year of the subscription. The HMAC cannot be forged without
   * the secret, so it is the check that actually matters — and a missing secret must stop the
   * door, not open it.
   */
  const secret = Deno.env.get('PRODAMUS_SECRET');
  if (!secret) {
    console.error('prodamus-webhook: PRODAMUS_SECRET is not set; refusing every delivery');
    return reply(503, 'not configured');
  }
  const expected = await sign(data as Parameters<typeof sign>[0], secret);
  if (!signatureMatches(expected, req.headers.get('sign') ?? req.headers.get('Sign'))) {
    console.warn('prodamus-webhook: signature mismatch');
    return reply(403, 'bad signature');
  }

  const payment = readPayment(data as Parameters<typeof readPayment>[0]);
  if (!payment) return reply(400, 'no customer_email');
  if (payment.status && payment.status !== 'success') return reply(200, 'ignored: not a success');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );
  const paidAt = new Date().toISOString();

  const plan = planForAmount(payment.sum, PRICES);
  if (plan) {
    const { error } = await supabase.rpc('apply_subscription_payment', {
      p_email: payment.email,
      p_plan: plan,
      p_provider_ref: payment.ref || null,
      p_paid_at: paidAt,
    });
    if (error) {
      console.error('prodamus-webhook: apply_subscription_payment failed', error.message);
      return reply(500, 'could not apply the payment');
    }
    return reply(200, `ok: ${plan} for ${payment.email}`);
  }

  /*
   * Not a plan, so it is a course — or something we have no record of.
   *
   * A 500 here would be wrong twice over: Prodamus retries on 5xx, and there is nothing to retry
   * when the cause is that a person paid without ever placing an order. The RPC answers null for
   * exactly that case, and for the other ambiguous one (several pending orders); both end in a
   * 200 and a log line, with the purchase left for the coach to confirm by hand.
   */
  // Named rather than destructured as `data`: the parsed body above already holds that name in
  // this scope, and `let data` followed by `const { data }` is a SyntaxError — the module refuses
  // to load at all, subscriptions included. Nothing in CI type-checks the edge functions, so it
  // would have surfaced as "payments stopped working" and no other clue.
  const { data: activated, error } = await supabase.rpc('apply_course_payment', {
    p_email: payment.email,
    p_provider_ref: payment.ref || null,
    p_paid_at: paidAt,
  });
  if (error) {
    console.error('prodamus-webhook: apply_course_payment failed', error.message);
    return reply(500, 'could not apply the payment');
  }
  if (!activated) {
    console.warn(
      `prodamus-webhook: ${payment.email} paid ${payment.sum ?? '?'} and no single pending order matches it; left for manual activation`,
    );
    return reply(200, 'ignored: no single pending order for this address');
  }
  return reply(200, `ok: course activated for ${payment.email}`);
});
