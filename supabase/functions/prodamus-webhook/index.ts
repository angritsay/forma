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
 * **An amount that is a course price is tried as a course** (0019); an amount that matches no
 * plan, session or course price opens nothing and is recorded unclaimed (0043). The course itself
 * is not chosen by amount: amounts collide between products and a Prodamus short link drops the query parameters it was given, so the
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
import {
  DEFAULT_COURSE_PRICES_RUB,
  intentForRoute,
  parseForm,
  parsePriceList,
  readPayment,
  routeAmount,
  sign,
  signatureMatches,
} from './verify.ts';

const PRICES = {
  monthly: Number(Deno.env.get('PLAN_MONTHLY_RUB') ?? '1990'),
  annual: Number(Deno.env.get('PLAN_ANNUAL_RUB') ?? '7990'),
};

/** Цены занятий с тренером — те же, что в `content/site/booking.ts`. */
const SESSION_PRICES = {
  half: Number(Deno.env.get('SESSION_HALF_RUB') ?? '2500'),
  hour: Number(Deno.env.get('SESSION_HOUR_RUB') ?? '3500'),
};

/** Цены курсов: сумма, не равная ни одной, ничего не открывает (`verify.ts`, `routeAmount`). */
const COURSE_PRICES = parsePriceList(Deno.env.get('COURSE_PRICES_RUB'), DEFAULT_COURSE_PRICES_RUB);

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

  /*
   * Write the payment down, whatever happens to it next.
   *
   * Until this existed, a notification that matched no order left one line in a log nobody reads
   * and nothing else — and it matches no order more often than you would think, because the
   * Prodamus short link drops the `?customer_email=` we append, so the address is whatever the
   * payer typed into the form. Their work address, their spouse's, the one the browser filled in.
   * The money arrived; the account it belongs to is simply not named in the notification.
   *
   * The row is what `claim_payment()` later hands to the right person against the order number
   * from their receipt (migration 0020). So it is recorded first and separately from applying it:
   * a failure to apply must not also lose the record of the payment.
   */
  const amount = Number.parseFloat(payment.sum ?? '');
  const route = routeAmount(payment.sum, {
    plans: PRICES,
    sessions: SESSION_PRICES,
    courses: COURSE_PRICES,
  });
  async function record(applied: boolean): Promise<void> {
    const { error } = await supabase.rpc('record_payment', {
      p_email: payment!.email,
      p_amount: Number.isFinite(amount) ? amount : null,
      p_provider_ref: payment!.ref || null,
      p_paid_at: paidAt,
      p_intent: intentForRoute(route),
      p_applied: applied,
      // Касса, из которой пришли деньги. Названа явно, хотя это и умолчание: касс теперь две, и
      // «какая» должно читаться на месте вызова, а не в сигнатуре функции (миграция 0038).
      p_provider: 'prodamus',
    });
    // Never fatal. The ledger is for support; the access is what the customer paid for, and a
    // database without 0020 has no `record_payment` at all — which must not turn every payment
    // into a 500 and an endless Prodamus retry.
    if (error) console.warn('prodamus-webhook: record_payment failed', error.message);
  }

  if (route.kind === 'plan') {
    const { error } = await supabase.rpc('apply_subscription_payment', {
      p_email: payment.email,
      p_plan: route.plan,
      p_provider_ref: payment.ref || null,
      p_paid_at: paidAt,
      p_source: 'prodamus',
    });
    if (error) {
      console.error('prodamus-webhook: apply_subscription_payment failed', error.message);
      await record(false);
      return reply(500, 'could not apply the payment');
    }
    await record(true);
    return reply(200, `ok: ${route.plan} for ${payment.email}`);
  }

  /*
   * Занятие с тренером: полчаса или час, опознанные по сумме.
   *
   * Открывать нечего — куплено время тренера, а не доступ, — поэтому только журнал. И ветка эта
   * не про отчётность: без неё платёж за занятие проваливался бы вниз, в `apply_course_payment()`,
   * а тот открывает единственный ожидающий заказ на курс этой почты. Человек, который оформил
   * заказ на курс и потом купил час с тренером, получал бы курс даром.
   *
   * `record()` уже знает, что это `session` (см. `p_intent` выше), так что в журнале видно, за
   * что заплатили, а не только сколько. И пишет его привязанным (`applied = true`, 0043): платёж
   * сделал всё, что мог, и в счётчик непривязанных не попадает.
   */
  if (route.kind === 'session') {
    await record(true);
    console.info(
      `prodamus-webhook: session ${route.session} paid by ${payment.email} (order ${payment.ref || 'without a number'}); nothing to unlock, the coach agrees the time`,
    );
    return reply(200, `ok: session ${route.session} recorded`);
  }

  /*
   * A sum that is no plan, no session and no course price. It used to fall through to the course
   * branch below, and `apply_course_payment()` would open whatever course this address had a
   * pending order for — for any amount at all. Now it is recorded unapplied, the 0040 trigger puts
   * «Платёж не привязан» in the owner's channel, and a person decides. 200: a retry changes nothing.
   */
  if (route.kind === 'unknown') {
    await record(false);
    console.warn(
      `prodamus-webhook: ${payment.email} paid ${payment.sum ?? '?'}, which is no plan, session or course price; recorded as unclaimed (order ${payment.ref || 'without a number'})`,
    );
    return reply(200, 'ignored: unknown amount, recorded, waiting to be claimed');
  }

  /*
   * A course price — the course itself still comes from the pending order.
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
    p_source: 'prodamus',
  });
  if (error) {
    console.error('prodamus-webhook: apply_course_payment failed', error.message);
    await record(false);
    return reply(500, 'could not apply the payment');
  }
  if (!activated) {
    await record(false);
    console.warn(
      `prodamus-webhook: ${payment.email} paid ${payment.sum ?? '?'} and no single pending order matches it; recorded as unclaimed (order ${payment.ref || 'without a number'})`,
    );
    return reply(200, 'ignored: recorded, waiting to be claimed');
  }
  await record(true);
  return reply(200, `ok: course activated for ${payment.email}`);
});
