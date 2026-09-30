/**
 * Order form (client:load) for a course or for a subscription plan. Records email ↔ product
 * through the backend RPC, then either shows the success state or redirects to the product's
 * external payment link. With `plans` the form also carries the plan choice, so one email field,
 * one consent and one submit serve both products.
 */
import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import type { Locale } from '@/content/schema';
import { isConfigured } from '@/lib/api/client';
import { checkEmail, withDomain } from '@/lib/api/auth';
import { isAppError } from '@/lib/api/errors';
import { isDemo, isDemoEnv } from '@/lib/api/mode';
import { createOrder } from '@/lib/api/orders';
import { createSubscriptionOrder } from '@/lib/api/subscriptions';
import type { SubscriptionPlan } from '@/lib/api/types';
import { courseKey, lavaUrl, planKey } from '@content/site/payments';
import { TEST_PAYMENT_URL } from '@content/site/testPayment';
import { payHost, payHref, payRoute } from '@/lib/util/payment';
import { planFromOrderHash } from './orderPlanHash';
import { rememberedSource } from './visit';

export interface OrderFormLabels {
  emailLabel: string;
  emailPlaceholder: string;
  /** Template with {privacy}. */
  consent: string;
  consentLink: string;
  submit: string;
  submitting: string;
  redirecting: string;
  successTitle: string;
  /** Template with {course} and {email}. */
  successText: string;
  successApp: string;
  errorEmail: string;
  errorConsent: string;
  errorNetwork: string;
  /** Template with {email}. */
  errorGeneric: string;
  notConfigured: string;
  /** Offered when the order could not be recorded, so a backend fault does not kill the sale. */
  payAnyway: string;
  tryAgain: string;
  lifetimeNote: string;
  telegramLabel: string;
  /**
   * Shown next to the consent when the course has a payment link, preparing the buyer for the two
   * ways that page will not look like this one. Template with {host}.
   *
   * It lists the course under the processor's own fiscal wording, not the name we sell it by — that
   * wording belongs on a receipt and is not ours to rewrite — and it does not prefill the email: a
   * Prodamus short link redirects to the shop form and drops the query parameters it was given, so
   * `customer_email` never arrives (the parameters stay in `withEmail`, since they cost nothing and
   * work the moment the link is one that forwards them). Of the two, the email is the one that
   * matters: it is the only thing tying a payment back to an order, so a buyer who retypes it one
   * letter different, or reaches for a second address out of habit, leaves a paid order nobody can
   * match to a purchase.
   */
  paymentNote?: string;
  /** Accessible name of the plan choice; required when `plans` is given. */
  plansLabel?: string;
  /**
   * A slipped domain («gmial.com»), template with {suggestion}. Shown once per address and
   * tappable — it puts the suggestion in. The address is what ties the payment to the order, so
   * a typo here is a paid course nobody can find.
   */
  emailTypo?: string;
}

export interface PlanOption {
  id: SubscriptionPlan;
  name: string;
  /** Formatted, e.g. "1 990 ₽". */
  price: string;
  /** "/ month" or "/ year". */
  period: string;
  note?: string;
  /** Badge text on the featured plan (e.g. "Best value"). */
  badge?: string;
  paymentUrl?: string;
}

export interface OrderFormProps {
  /** Course id for a course order; ignored when `plans` is given. */
  courseId: string;
  /** Course name for the success text, or the product name for a plan order. */
  courseName: string;
  locale: Locale;
  paymentUrl?: string;
  /** Subscription plans: the form records a subscription intent instead of a course order. */
  plans?: PlanOption[];
  /** Initially selected plan; defaults to the first one. */
  defaultPlan?: SubscriptionPlan;
  appUrl: string;
  privacyUrl: string;
  supportEmail: string;
  supportTelegram?: string;
  labels: OrderFormLabels;
  /**
   * Whose colours the form wears. `course` (default): the neon submit, the course's one main
   * action. `club` (`/subscribe/`): the club has no neon (design/CHANGELOG.md §17), so the submit,
   * the plan badge and the success button take the warm gradient under ink instead. Only the
   * paint changes — validation, the order record and the hand-off to payment are the same.
   */
  tone?: 'course' | 'club';
}

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'redirecting'; email: string }
  | { kind: 'success'; email: string }
  /** `retryEmail` is set when the address was valid and the backend is what failed. */
  | { kind: 'error'; reason: ErrorReason; retryEmail?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function fill(template: string, params: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => params[k] ?? `{${k}}`);
}

type ErrorReason = 'email' | 'consent' | 'network' | 'generic';

/** Map an API failure to the message the visitor should see. */
function errorReason(err: unknown): ErrorReason {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'network';
  if (isAppError(err)) {
    if (err.code === 'network') return 'network';
    if (err.code === 'validation' && /email/i.test(err.message)) return 'email';
    return 'generic';
  }
  if (err instanceof TypeError) return 'network';
  const msg = err instanceof Error ? err.message.toLowerCase() : '';
  return msg.includes('fetch') || msg.includes('network') ? 'network' : 'generic';
}

export default function OrderForm({
  courseId,
  courseName,
  locale,
  paymentUrl,
  plans,
  defaultPlan,
  appUrl,
  privacyUrl,
  supportEmail,
  supportTelegram,
  labels,
  tone = 'course',
}: OrderFormProps) {
  /* The filled action's paint: neon for a course, the club's warm gradient under ink. */
  const paint = tone === 'club' ? 'bg-warm text-ink' : 'bg-action text-on-action';
  const [email, setEmail] = useState('');
  const [planId, setPlanId] = useState<SubscriptionPlan>(
    defaultPlan ?? plans?.[0]?.id ?? 'monthly',
  );
  const plan = plans?.find((p) => p.id === planId) ?? plans?.[0];
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  // The address the typo hint was shown for: a second submit of the same address goes through.
  const [typo, setTypo] = useState<{ email: string; suggestion: string } | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  /**
   * Demo mode records the order in the visitor's browser instead of failing on a missing
   * backend. The build flag is the only part known during the static render, so the
   * localStorage half is picked up after hydration — the first paint stays identical.
   */
  const [demo, setDemo] = useState(isDemoEnv);

  useEffect(() => {
    setDemo(isDemo());
  }, []);

  /*
   * A plan picked outside the form: the club page's tickets link to `#order-<plan id>`, and the
   * page gives each of those an anchor at the form. The hash only ever selects a plan this form
   * already offers; anything else is ignored (`planFromOrderHash`). A ticket tapped a second time
   * leaves the hash as it was and fires no `hashchange`, so the tap itself picks the plan too —
   * otherwise a switch to 30 days inside the form would survive a second tap on «Выбрать год».
   */
  useEffect(() => {
    if (!plans) return;
    const pick = (hash: string | null) => {
      const found = planFromOrderHash(hash, plans);
      if (found) setPlanId(found.id);
    };
    const onHash = () => pick(window.location.hash);
    const onClick = (e: MouseEvent) => {
      const link = e.target instanceof Element ? e.target.closest('a[href^="#order-"]') : null;
      if (link) pick(link.getAttribute('href'));
    };
    onHash();
    window.addEventListener('hashchange', onHash);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('hashchange', onHash);
      document.removeEventListener('click', onClick);
    };
  }, [plans]);

  /*
   * Back from the payment page, the browser may restore this page from its back-forward cache as
   * it was left: «Переходим к оплате…» and every field disabled, with nothing left to press.
   */
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setStatus((s) => (s.kind === 'redirecting' ? { kind: 'idle' } : s));
    };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  const configured = isConfigured() || demo;
  const [consentBefore, consentAfter] = labels.consent.split('{privacy}');
  // Only an https link is ever followed; see lib/util/payment.
  // TEST_PAYMENT_URL — временная подмена на тестовый товар; снимается одной строкой в
  // content/site/testPayment.ts. В бою она null и выражение сводится к обычной ссылке.
  // На неродном языке — в lava.top (content/site/payments.ts): рублёвая касса только для `ru`.
  // Без третьего аргумента английский читатель оставался без кнопки оплаты вовсе. См. `payRoute`.
  const payment = payRoute(
    locale,
    TEST_PAYMENT_URL ?? (plan ? plan.paymentUrl : paymentUrl),
    lavaUrl(plan ? planKey(plan.id) : courseKey(courseId)),
  );
  // Хост называется в подписи только тогда, когда человек правда уходит на чужой сайт.
  const paymentHost = payment ? payHost(payment) : null;
  const productName = plan ? plan.name : courseName;

  // Validation errors must reach keyboard and screen-reader users: the message is announced by its
  // role="alert" and focus moves to the control that has to change.
  useEffect(() => {
    if (status.kind !== 'error') return;
    if (status.reason === 'consent') consentRef.current?.focus();
    else emailRef.current?.focus();
    /*
     * And bring the message on screen. A backend failure renders below the button, which on a phone
     * is below the fold — pressing "Получить доступ" then looks like it did nothing at all, which
     * is exactly how it was reported.
     */
    document.getElementById('order-error')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [status]);

  // The success panel replaces the form, so focus would otherwise fall back to <body>.
  useEffect(() => {
    if (status.kind === 'success') successRef.current?.focus();
  }, [status.kind]);

  async function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setStatus({ kind: 'error', reason: 'email' });
      return;
    }
    if (!consent) {
      setStatus({ kind: 'error', reason: 'consent' });
      return;
    }
    // A slipped domain is asked about once; the same address submitted again is taken as meant.
    const check = checkEmail(trimmed);
    if (labels.emailTypo && !check.ok && check.reason === 'email_typo' && typo?.email !== trimmed) {
      setTypo({ email: trimmed, suggestion: check.suggestion });
      emailRef.current?.focus();
      return;
    }
    setStatus({ kind: 'submitting' });
    /*
     * The first touch the layout remembered (`forma.src`: a campaign, a QR, the landing page) goes
     * to the RPC as `p_source` — `create_order` and `create_subscription_order` both take it and
     * cut it at 40 (0002, 0005). Without one, the form still says which form it was.
     */
    const firstTouch = rememberedSource();
    try {
      if (plan) {
        await createSubscriptionOrder({
          email: trimmed,
          plan: plan.id,
          locale,
          source: firstTouch ?? 'subscribe',
        });
      } else {
        await createOrder({ email: trimmed, courseId, locale, source: firstTouch ?? 'landing' });
      }
    } catch (err) {
      /*
       * The visitor gets one of four sentences; whoever is debugging needs the actual cause.
       * Reported as "nothing happens" — the order is recorded before the hand-off, so a backend
       * that rejects it ends the flow with a line of red text and no way to tell why.
       */
      console.error('[order] create failed', err);
      setStatus({ kind: 'error', reason: errorReason(err), retryEmail: trimmed });
      return;
    }
    // A demo order never leaves the browser, so it never hands anyone to a payment page.
    if (payment && !demo) {
      setStatus({ kind: 'redirecting', email: trimmed });
      window.location.assign(payHref(payment, trimmed));
      return;
    }
    setStatus({ kind: 'success', email: trimmed });
  }

  if (!configured) {
    return (
      <div className="border-t border-border pt-5">
        <p className="text-sm text-muted">{labels.notConfigured}</p>
        <ul className="mt-3 flex flex-col gap-1 text-base font-medium">
          <li>
            <a
              className="underline decoration-border-strong underline-offset-4 hover:decoration-text"
              href={`mailto:${supportEmail}`}
            >
              {supportEmail}
            </a>
          </li>
          {supportTelegram && (
            <li>
              <a
                className="underline decoration-border-strong underline-offset-4 hover:decoration-text"
                href={supportTelegram}
                rel="noopener"
              >
                {labels.telegramLabel}
              </a>
            </li>
          )}
        </ul>
      </div>
    );
  }

  if (status.kind === 'success') {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        className="border border-border-strong bg-surface-2 p-5 outline-none"
        role="status"
      >
        <p className="font-display flex items-baseline gap-3 text-xl">
          <span className="glyph text-success" aria-hidden="true">
            ✓
          </span>
          {labels.successTitle}
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          {fill(labels.successText, { course: productName, email: status.email })}
        </p>
        <a
          href={appUrl}
          className={`control-label mt-5 inline-flex h-12 items-center justify-center rounded-control px-6.5 text-[15px] transition-opacity duration-150 hover:opacity-85 ${paint}`}
        >
          {labels.successApp}
        </a>
      </div>
    );
  }

  const busy = status.kind === 'submitting' || status.kind === 'redirecting';
  const errorText =
    status.kind === 'error'
      ? status.reason === 'email'
        ? labels.errorEmail
        : status.reason === 'consent'
          ? labels.errorConsent
          : status.reason === 'network'
            ? labels.errorNetwork
            : fill(labels.errorGeneric, { email: supportEmail })
      : '';
  const emailInvalid = status.kind === 'error' && status.reason === 'email';
  // Only while the field still holds the address it was about.
  const showTypo = typo !== null && typo.email === email.trim().toLowerCase();
  const consentInvalid = status.kind === 'error' && status.reason === 'consent';

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {plans && plans.length > 0 && (
        <fieldset className="m-0 border-0 p-0" disabled={busy}>
          <legend className="text-[13px] font-semibold text-muted">{labels.plansLabel}</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {plans.map((p) => {
              const selected = p.id === plan?.id;
              return (
                <label
                  key={p.id}
                  className={`relative flex cursor-pointer flex-col gap-1 border p-4 transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                    selected
                      ? 'border-accent bg-surface-2'
                      : 'border-border hover:border-border-strong'
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={p.id}
                    checked={selected}
                    onChange={() => setPlanId(p.id)}
                    className="sr-only"
                  />
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-sm">{p.name}</span>
                    {p.badge && (
                      <span
                        className={`inline-flex h-6 items-center rounded-pill px-2.5 text-[12px] font-semibold tracking-[0.01em] ${paint}`}
                      >
                        {p.badge}
                      </span>
                    )}
                  </span>
                  <span className="tabular">
                    <span className="numeral text-2xl">{p.price}</span>
                    <span className="text-sm text-muted"> {p.period}</span>
                  </span>
                  {p.note && <span className="text-xs text-muted">{p.note}</span>}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
      <div>
        <label htmlFor="order-email" className="block text-[13px] font-semibold text-muted">
          {labels.emailLabel}
        </label>
        <input
          ref={emailRef}
          id="order-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          disabled={busy}
          aria-invalid={emailInvalid || undefined}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status.kind === 'error') setStatus({ kind: 'idle' });
          }}
          aria-describedby={
            errorText && !consentInvalid ? 'order-error' : showTypo ? 'order-typo' : undefined
          }
          placeholder={labels.emailPlaceholder}
          className={`mt-2 h-12 w-full border bg-surface-2 px-4 text-base text-text placeholder:text-muted-2 focus:border-accent focus:outline-none ${
            emailInvalid ? 'border-danger' : 'border-border'
          }`}
        />
        {showTypo && typo && labels.emailTypo ? (
          <button
            id="order-typo"
            type="button"
            onClick={() => {
              setEmail(withDomain(typo.email, typo.suggestion));
              setTypo(null);
              emailRef.current?.focus();
            }}
            className="mt-2 text-left text-sm text-muted underline underline-offset-4"
          >
            {fill(labels.emailTypo, { suggestion: typo.suggestion })}
          </button>
        ) : null}
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm text-muted">
        <input
          ref={consentRef}
          type="checkbox"
          name="consent"
          checked={consent}
          disabled={busy}
          aria-invalid={consentInvalid || undefined}
          aria-describedby={consentInvalid ? 'order-error' : undefined}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (status.kind === 'error') setStatus({ kind: 'idle' });
          }}
          className="mt-0.5 size-5 shrink-0 accent-primary"
        />
        <span>
          {consentBefore}
          <a
            className="text-text underline decoration-border-strong underline-offset-4"
            href={privacyUrl}
          >
            {labels.consentLink}
          </a>
          {consentAfter}
        </span>
      </label>

      {paymentHost && !demo && labels.paymentNote && (
        <p className="text-sm text-muted">{fill(labels.paymentNote, { host: paymentHost })}</p>
      )}

      {errorText && (
        <p
          id="order-error"
          role="alert"
          className="border-l-2 border-danger pl-3 text-sm text-danger"
        >
          {errorText}
        </p>
      )}

      {/*
       * Recording the order failed, but the customer still wants to buy.
       *
       * The order row is how a payment is matched back to a person, so it is written first — and
       * that made a backend problem a dead end for the sale: the visitor is told to try again and
       * has nowhere else to go. They can still pay; the processor's own notification carries the
       * same email, and the coach grants access from it by hand. So offer the payment page rather
       * than lose the purchase, and say plainly that the address has to match.
       */}
      {status.kind === 'error' && status.retryEmail && payment && !demo && (
        <a
          href={payHref(payment, status.retryEmail)}
          className="control-label inline-flex h-12 items-center justify-center rounded-control border border-border-strong px-6 text-[15px] text-text"
        >
          {labels.payAnyway}
        </a>
      )}

      <button
        type="submit"
        disabled={busy}
        className={`control-label inline-flex h-14 items-center justify-center rounded-control px-8 text-[15px] transition-[opacity,transform] duration-150 ease-(--ease-out) hover:opacity-85 active:scale-[0.98] disabled:cursor-wait disabled:opacity-40 ${paint}`}
      >
        {status.kind === 'submitting'
          ? labels.submitting
          : status.kind === 'redirecting'
            ? labels.redirecting
            : labels.submit}
      </button>
      <p className="text-sm text-muted">{labels.lifetimeNote}</p>
    </form>
  );
}
