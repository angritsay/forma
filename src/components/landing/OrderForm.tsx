/**
 * Order form (client:load) for a course or for a subscription plan. Records email ↔ product
 * through the backend RPC, then either shows the success state or redirects to the product's
 * external payment link. With `plans` the form also carries the plan choice, so one email field,
 * one consent and one submit serve both products.
 */
import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import type { Locale } from '@/content/schema';
import { isConfigured } from '@/lib/api/client';
import { isAppError } from '@/lib/api/errors';
import { isDemo, isDemoEnv } from '@/lib/api/mode';
import { createOrder } from '@/lib/api/orders';
import { createSubscriptionOrder } from '@/lib/api/subscriptions';
import type { SubscriptionPlan } from '@/lib/api/types';
import { paymentTarget, withEmail } from '@/lib/util/payment';

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
  tryAgain: string;
  lifetimeNote: string;
  telegramLabel: string;
  /**
   * Shown next to the consent when the course has a payment link: the visitor is
   * handed over to that page with their email. Template with {host}.
   */
  paymentNote?: string;
  /** Accessible name of the plan choice; required when `plans` is given. */
  plansLabel?: string;
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
}

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'redirecting' }
  | { kind: 'success'; email: string }
  | { kind: 'error'; reason: ErrorReason };

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
}: OrderFormProps) {
  const [email, setEmail] = useState('');
  const [planId, setPlanId] = useState<SubscriptionPlan>(
    defaultPlan ?? plans?.[0]?.id ?? 'monthly',
  );
  const plan = plans?.find((p) => p.id === planId) ?? plans?.[0];
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
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

  const configured = isConfigured() || demo;
  const [consentBefore, consentAfter] = labels.consent.split('{privacy}');
  // Only an https link is ever followed; see lib/util/payment.
  const payment = paymentTarget(plan ? plan.paymentUrl : paymentUrl);
  const productName = plan ? plan.name : courseName;

  // Validation errors must reach keyboard and screen-reader users: the message is announced by its
  // role="alert" and focus moves to the control that has to change.
  useEffect(() => {
    if (status.kind !== 'error') return;
    if (status.reason === 'consent') consentRef.current?.focus();
    else emailRef.current?.focus();
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
    setStatus({ kind: 'submitting' });
    try {
      if (plan) {
        await createSubscriptionOrder({
          email: trimmed,
          plan: plan.id,
          locale,
          source: 'subscribe',
        });
      } else {
        await createOrder({ email: trimmed, courseId, locale, source: 'landing' });
      }
    } catch (err) {
      setStatus({ kind: 'error', reason: errorReason(err) });
      return;
    }
    // A demo order never leaves the browser, so it never hands anyone to a payment page.
    if (payment && !demo) {
      setStatus({ kind: 'redirecting' });
      window.location.assign(withEmail(payment, trimmed));
      return;
    }
    setStatus({ kind: 'success', email: trimmed });
  }

  if (!configured) {
    return (
      <div className="rounded-inner border border-border bg-bg p-5">
        <p className="text-sm text-muted">{labels.notConfigured}</p>
        <ul className="mt-3 flex flex-col gap-1 text-base font-medium">
          <li>
            <a
              className="underline decoration-border-strong underline-offset-4 hover:text-accent"
              href={`mailto:${supportEmail}`}
            >
              {supportEmail}
            </a>
          </li>
          {supportTelegram && (
            <li>
              <a
                className="underline decoration-border-strong underline-offset-4 hover:text-accent"
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
        className="rounded-inner border border-success/40 bg-success/10 p-5 outline-none"
        role="status"
      >
        <p className="font-display text-2xl">{labels.successTitle}</p>
        <p className="mt-2 text-sm leading-relaxed">
          {fill(labels.successText, { course: productName, email: status.email })}
        </p>
        <a
          href={appUrl}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-control bg-accent px-5 py-2.5 text-sm font-semibold text-on-primary"
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
  const consentInvalid = status.kind === 'error' && status.reason === 'consent';

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {plans && plans.length > 0 && (
        <fieldset className="m-0 border-0 p-0" disabled={busy}>
          <legend className="text-sm font-medium">{labels.plansLabel}</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {plans.map((p) => {
              const selected = p.id === plan?.id;
              return (
                <label
                  key={p.id}
                  className={`relative flex cursor-pointer flex-col gap-1 rounded-inner border p-4 transition ${
                    selected ? 'border-text bg-bg' : 'border-border hover:border-border-strong'
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
                    <span className="text-base font-semibold">{p.name}</span>
                    {p.badge && (
                      <span className="rounded-control bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                        {p.badge}
                      </span>
                    )}
                  </span>
                  <span className="tabular">
                    <span className="font-display text-2xl">{p.price}</span>
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
        <label htmlFor="order-email" className="block text-sm font-medium">
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
          aria-describedby={errorText && !consentInvalid ? 'order-error' : undefined}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status.kind === 'error') setStatus({ kind: 'idle' });
          }}
          placeholder={labels.emailPlaceholder}
          className={`mt-2 w-full rounded-inner border bg-bg px-4 py-3 text-base text-text placeholder:text-muted-2 focus:border-border-strong focus:outline-none ${
            emailInvalid ? 'border-danger' : 'border-border'
          }`}
        />
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
          className="mt-1 size-5 shrink-0 accent-accent"
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

      {payment && !demo && labels.paymentNote && (
        <p className="text-xs text-muted">{fill(labels.paymentNote, { host: payment.host })}</p>
      )}

      {errorText && (
        <p
          id="order-error"
          role="alert"
          className="rounded-inner bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {errorText}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-11 items-center justify-center rounded-control bg-accent px-6 py-3.5 text-base font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
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
