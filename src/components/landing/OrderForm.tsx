/**
 * Course order form (client:load). Records email ↔ course through the backend RPC, then either
 * shows the success state or redirects to the course's external payment link.
 */
import { useState, type SubmitEvent } from 'react';
import type { Locale } from '@/content/schema';
import { isConfigured } from '@/lib/api/client';
import { isAppError } from '@/lib/api/errors';
import { createOrder } from '@/lib/api/orders';

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
}

export interface OrderFormProps {
  courseId: string;
  courseName: string;
  locale: Locale;
  paymentUrl?: string;
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

function withEmail(url: string, email: string): string {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}email=${encodeURIComponent(email)}`;
}

export default function OrderForm({
  courseId,
  courseName,
  locale,
  paymentUrl,
  appUrl,
  privacyUrl,
  supportEmail,
  supportTelegram,
  labels,
}: OrderFormProps) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const configured = isConfigured();
  const [consentBefore, consentAfter] = labels.consent.split('{privacy}');

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
      await createOrder({ email: trimmed, courseId, locale, source: 'landing' });
    } catch (err) {
      setStatus({ kind: 'error', reason: errorReason(err) });
      return;
    }
    if (paymentUrl) {
      setStatus({ kind: 'redirecting' });
      window.location.assign(withEmail(paymentUrl, trimmed));
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
      <div className="rounded-inner border border-success/40 bg-success/10 p-5" role="status">
        <p className="font-display text-2xl">{labels.successTitle}</p>
        <p className="mt-2 text-sm leading-relaxed">
          {fill(labels.successText, { course: courseName, email: status.email })}
        </p>
        <a
          href={appUrl}
          className="mt-4 inline-flex items-center justify-center rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary"
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

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor="order-email" className="block text-sm font-medium">
          {labels.emailLabel}
        </label>
        <input
          id="order-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          disabled={busy}
          aria-invalid={emailInvalid || undefined}
          aria-describedby={errorText ? 'order-error' : undefined}
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
          type="checkbox"
          name="consent"
          checked={consent}
          disabled={busy}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (status.kind === 'error') setStatus({ kind: 'idle' });
          }}
          className="mt-1 size-4 shrink-0 accent-accent"
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
        className="inline-flex items-center justify-center rounded-pill bg-primary px-6 py-3.5 text-base font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
      >
        {status.kind === 'submitting'
          ? labels.submitting
          : status.kind === 'redirecting'
            ? labels.redirecting
            : labels.submit}
      </button>
      <p className="text-xs text-muted">{labels.lifetimeNote}</p>
    </form>
  );
}
