/**
 * The hero's way into workout 1 (client:load): an optional email and the neon «Начать бесплатно».
 *
 * The button is a navigation, not a sign-in. It goes to `appHref('/start', { locale })`, which the
 * app turns into workout 1 of the free course — through the language screen, the email code and
 * onboarding only where they are still missing (PR 1, `forma.next`). What the form adds is one
 * saved step: an address typed here is handed over in `sessionStorage['forma.authEmail']`, and
 * AuthScreen prefills it, sends the code once and deletes the key (`AUTH_EMAIL_KEY`). Same tab,
 * same origin, read once — the address never goes into a URL.
 *
 * **No Supabase here.** The island imports nothing from `@/lib/api`, so the hero ships a small
 * form and not the client: the code is requested by the app, which already holds that machinery,
 * and this page stays static.
 *
 * The email is optional and the empty form simply navigates. A typed one is checked with the same
 * loose pattern `OrderForm` uses, because a typo here would send a code to nobody. Once anything
 * is typed, the app's own consent line (`app.authLegal`, with the privacy policy and terms linked)
 * appears under the button — the words AuthScreen shows next to the same action, so agreeing here
 * and agreeing there are the same agreement.
 *
 * A pending referral code (`forma.referral`, stashed by the layout from `?ref=`) is added to the
 * link at the moment of the tap, as the layout script does for every other `[data-app-link]`.
 *
 * Before hydration the form still works and still keeps the address out of the URL: the input has
 * no `name`, so a native submit sends nothing typed, and `action` is the app link, with its query
 * (`lang`) repeated as hidden fields because a GET submit replaces the query. The hash (`#/start`)
 * survives a GET submit, so a tap before React loads lands on the app just like one after.
 *
 * The button carries `data-neon`: it is the hero's one neon, and the phone's sticky bar
 * (`StickyStart.astro`) steps aside while it is on screen.
 */
import { useId, useState, type SubmitEvent } from 'react';
import { pendingReferral, withRef } from './visit';

export interface StartFormLabels {
  emailLabel: string;
  emailPlaceholder: string;
  submit: string;
  hint: string;
  invalid: string;
  /** `app.authLegal`: template with {privacy} and {terms}. */
  legal: string;
  legalPrivacy: string;
  legalTerms: string;
}

export interface StartFormProps {
  /** `appHref('/start', { locale })` — where the button goes, with or without an email. */
  appUrl: string;
  privacyUrl: string;
  termsUrl: string;
  labels: StartFormLabels;
  class?: string;
}

/** The key AuthScreen reads (src/app/screens/AuthScreen.tsx, `AUTH_EMAIL_KEY`). */
export const AUTH_EMAIL_KEY = 'forma.authEmail';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Split a template around `{privacy}` and `{terms}` so the two can be links. */
function legalParts(template: string): { text: string; link?: 'privacy' | 'terms' }[] {
  return template
    .split(/(\{privacy\}|\{terms\})/)
    .filter(Boolean)
    .map((part) =>
      part === '{privacy}'
        ? { text: part, link: 'privacy' as const }
        : part === '{terms}'
          ? { text: part, link: 'terms' as const }
          : { text: part },
    );
}

export default function StartForm({
  appUrl,
  privacyUrl,
  termsUrl,
  labels,
  class: className = '',
}: StartFormProps) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [invalid, setInvalid] = useState(false);
  const typed = email.trim().length > 0;

  function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (value) {
      if (!EMAIL_RE.test(value)) {
        setInvalid(true);
        return;
      }
      try {
        sessionStorage.setItem(AUTH_EMAIL_KEY, value);
      } catch {
        // Storage blocked (private mode, a WebView): the app simply asks for the address again.
      }
    }
    // A friend's code waiting from `?ref=` rides along, as on every `[data-app-link]` (visit.ts).
    const code = pendingReferral();
    window.location.assign(code ? withRef(appUrl, code) : appUrl);
  }

  // A GET submit replaces the action's query with the form's fields, so `lang` rides as a field.
  const hidden = [...new URL(appUrl, 'https://x.invalid').searchParams];

  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <form
      noValidate
      method="get"
      action={appUrl}
      onSubmit={onSubmit}
      className={`flex w-full max-w-md flex-col gap-3 ${className}`}
    >
      {hidden.map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <label htmlFor={`${id}-email`} className="sr-only">
        {labels.emailLabel}
      </label>
      <input
        id={`${id}-email`}
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        placeholder={labels.emailPlaceholder}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : hintId}
        onChange={(e) => {
          setEmail(e.target.value);
          if (invalid) setInvalid(false);
        }}
        className={`h-12 w-full rounded-control border bg-surface-2 px-4 text-base text-text placeholder:text-muted-2 focus:border-accent focus:outline-none ${
          invalid ? 'border-danger' : 'border-border'
        }`}
      />
      {invalid && (
        <p id={errorId} role="alert" className="border-l-2 border-danger pl-3 text-sm text-danger">
          {labels.invalid}
        </p>
      )}
      <button
        type="submit"
        data-neon=""
        data-goal="app_start"
        className="control-label inline-flex h-14 w-full items-center justify-center gap-2 rounded-control bg-action px-8 text-[15px] text-on-action transition-[opacity,transform] duration-150 ease-(--ease-out) hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]"
      >
        {labels.submit}
        <span className="glyph" aria-hidden="true">
          →
        </span>
      </button>
      <p id={hintId} className="text-[13px] leading-snug text-muted">
        {labels.hint}
      </p>
      {typed && (
        <p className="text-[12px] leading-snug text-muted-2">
          {legalParts(labels.legal).map((part, i) =>
            part.link ? (
              <a
                key={i}
                href={part.link === 'privacy' ? privacyUrl : termsUrl}
                className="text-muted underline decoration-border-strong underline-offset-4 hover:text-text"
              >
                {part.link === 'privacy' ? labels.legalPrivacy : labels.legalTerms}
              </a>
            ) : (
              <span key={i}>{part.text}</span>
            ),
          )}
        </p>
      )}
    </form>
  );
}
