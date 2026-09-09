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
 * the prices in content/site/plans.ts). Any other amount — a course, a session with the coach —
 * is acknowledged with 200 and left to the manual flow, so Prodamus stops retrying.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { parseForm, planForAmount, readPayment, sign, signatureMatches } from './verify.ts';

const PRICES = {
  monthly: Number(Deno.env.get('PLAN_MONTHLY_RUB') ?? '1990'),
  annual: Number(Deno.env.get('PLAN_ANNUAL_RUB') ?? '9990'),
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

  const secret = Deno.env.get('PRODAMUS_SECRET');
  if (secret) {
    const expected = await sign(data as Parameters<typeof sign>[0], secret);
    if (!signatureMatches(expected, req.headers.get('sign') ?? req.headers.get('Sign'))) {
      console.warn('prodamus-webhook: signature mismatch');
      return reply(403, 'bad signature');
    }
  } else {
    console.warn('prodamus-webhook: PRODAMUS_SECRET is not set; relying on the URL token only');
  }

  const payment = readPayment(data as Parameters<typeof readPayment>[0]);
  if (!payment) return reply(400, 'no customer_email');
  if (payment.status && payment.status !== 'success') return reply(200, 'ignored: not a success');

  const plan = planForAmount(payment.sum, PRICES);
  if (!plan) return reply(200, `ignored: amount ${payment.sum ?? '?'} is not a plan`);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );
  const { error } = await supabase.rpc('apply_subscription_payment', {
    p_email: payment.email,
    p_plan: plan,
    p_provider_ref: payment.ref || null,
    p_paid_at: new Date().toISOString(),
  });
  if (error) {
    console.error('prodamus-webhook: apply_subscription_payment failed', error.message);
    return reply(500, 'could not apply the payment');
  }
  return reply(200, `ok: ${plan} for ${payment.email}`);
});
