/**
 * Sign-in (docs/SPEC.md §10 flow 1): the montage, the word, the field.
 *
 * The screen used to sell: a photograph, the lockup, a display-sized tagline, a heading, a lead
 * paragraph, a labelled field and a hint about the spam folder. Eight things to read before typing
 * an address. It is the first screen of a product whose whole argument is "look at the training",
 * so it now argues by showing it — the coach's black-and-white montage runs full-bleed and loops,
 * and the interface over it is one word and one field.
 *
 * The word arrives first. «FORMA» fades up over the film, holds, and fades out; the form fades in
 * behind it. That is the entire introduction, it costs about two seconds, and any tap skips it —
 * as does `prefers-reduced-motion`, where the wordmark simply never appears and the form is there
 * from the first frame.
 *
 * After that there is nothing to read at all: the mark at a small size, a field, a button. No
 * heading, no lead, no label above the field (the placeholder is the label — this field asks for
 * the one thing it could possibly ask for), no spam hint. What is left is what a sign-in cannot do
 * without: the error when the address or the code is wrong, the resend, and the way back to the
 * address you mistyped.
 */
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { CodeInput } from '@/components/ui/CodeInput';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { Pill } from '@/components/ui/Pill';
import { useT } from '@/app/hooks/useT';
import { useCountdown } from '@/app/hooks/useTimer';
import { useMediaUrl } from '@/app/features/player/useMediaUrl';
import { useSession } from '@/app/store/session';
import { BRAND } from '@content/site/brand';
import { PHOTOS, photoSrc } from '@/lib/media/photos';
import { withBase } from '@/lib/util/paths';
import {
  AuthError,
  type AuthReason,
  OTP_TTL_SEC,
  checkEmail,
  demoPendingCode,
  normalizeEmail,
  requestCode,
  toAuthError,
  verifyCode,
  withDomain,
} from '@/lib/api/auth';
import { AUTH_FILM } from '@content/site/media';
import type { TKey, TParams } from '@/i18n/index';

const RESEND_SEC = 60;
const CODE_LENGTH = 6;
/** After this many refused codes the screen stops repeating itself and points at the resend. */
const WRONG_CODES_BEFORE_RESEND = 3;

/** How long the wordmark holds before it goes, and how long each fade takes. */
const INTRO_HOLD_MS = 1400;
const INTRO_FADE_MS = 700;

type Step = 'email' | 'code';
/** enter → hold → fade → done. `done` is where a reduced-motion visitor starts. */
type Intro = 'enter' | 'hold' | 'fade' | 'done';

/**
 * One line per thing that can actually go wrong.
 *
 * It used to be four reasons and a catch-all, so an empty field, a missing «@» and a slipped
 * domain all came out as «Проверь адрес» — true, and no help at all. The reasons are split in
 * src/lib/api/auth.ts; this is the map from one to its sentence.
 */
function authErrorKey(e: AuthError): TKey {
  switch (e.reason) {
    case 'email_empty':
      return 'app.authErrorEmailEmpty';
    case 'email_no_at':
      return 'app.authErrorEmailNoAt';
    case 'email_typo':
      return 'app.authErrorEmailTypo';
    case 'invalid_email':
      return 'app.authErrorInvalidEmail';
    case 'rate_limited':
      return 'app.authErrorRateLimited';
    case 'invalid_code':
      return 'app.authErrorInvalidCode';
    case 'code_expired':
      return 'app.authErrorCodeExpired';
    case 'too_many_attempts':
      return 'app.authErrorTooManyAttempts';
    case 'signup_disabled':
      return 'app.authErrorSignupDisabled';
    case 'email_send_failed':
      return 'app.authErrorEmailSend';
    case undefined:
      break;
  }
  switch (e.code) {
    case 'network':
      return 'app.authErrorNetwork';
    case 'validation':
      return 'app.authErrorInvalidEmail';
    case 'forbidden':
      return 'app.authErrorSignupDisabled';
    case 'auth':
    case 'not_found':
    case 'unknown':
      return 'app.authErrorGeneric';
  }
}

/**
 * Turn "the code was refused" into the three different things it can mean.
 *
 * Supabase cannot help here: it answers `otp_expired` — "Token has expired **or is invalid**" —
 * for a mistyped digit just as readily as for a code that has gone stale, so believing the code
 * would tell somebody to ask for a new letter when the one in their hand is fine. The screen has
 * what the server does not: it knows the minute it asked for this code, and `OTP_TTL_SEC` is how
 * long one lives (docs/SETUP.md §3.1). Past that, it is expired. Inside it, it is wrong — and
 * wrong for the third time in a row is its own sentence, because repeating "check the six digits"
 * to somebody who has now checked them three times is the app's failure rather than theirs.
 *
 * Everything that is not a refused code (no connection, a rate limit, a mailer that would not
 * send) passes through untouched.
 */
function sharpenCodeError(e: AuthError, sentAt: number, wrongSoFar: number): AuthError {
  if (e.reason !== 'invalid_code') return e;
  const expired = sentAt > 0 && Date.now() - sentAt > OTP_TTL_SEC * 1000;
  const reason = expired
    ? 'code_expired'
    : wrongSoFar >= WRONG_CODES_BEFORE_RESEND
      ? 'too_many_attempts'
      : 'invalid_code';
  return new AuthError(e.code, e.message, { cause: e.cause, status: e.status, reason });
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The film, or the still that stands in for it until it is cut (`content/site/media.ts`).
 *
 * It is fixed rather than absolute so it stays put while the on-screen keyboard pushes the form
 * around, and it is `object-cover` because a backdrop may be cropped — unlike a movement clip,
 * which may not. Two layers go over it: the brand's grain, and a gradient dark enough at both ends
 * that white type and a white button hold their contrast over any frame of any montage.
 *
 * **Why the film does not run, measured rather than guessed.** Chromium on a demo build at
 * 390×844: no `<video>` element is in the DOM at all and the poster is what is on screen. The
 * autoplay policy is satisfied (`muted` + `playsInline` + `autoPlay`, which is what the policy
 * asks for), the poster resolves and decodes, and nothing fails in the network log. The film is
 * `storage:images/site/auth.mp4` — an object in the Supabase public bucket, deliberately *not*
 * committed, and demo mode has no bucket, so `resolveMediaUrl` answers `undefined` and the still
 * renders. Against a real project the same reference resolves to a public URL, and if the file has
 * never been uploaded that URL 404s: Chromium then reports `MEDIA_ELEMENT_ERROR: Format error` and
 * keeps painting the poster (verified separately). So the screen is a still either way, and the
 * cause is a missing asset, not this code.
 *
 * What is added here is the last unguarded case. A `<video>` that has failed stays in the tree
 * showing its poster on Chrome, but not on every WebView — some Android ones draw a grey plate
 * with a play glyph over it, which is exactly the "broken element" this screen must never show. An
 * `onError` swaps it for the same still, so a refused, missing or unplayable film degrades to the
 * picture rather than to a control nobody can press.
 */
function Backdrop({ src, poster }: { src?: string; poster?: string }) {
  const url = useMediaUrl(src);
  const [filmFailed, setFilmFailed] = useState(false);
  // A new reference deserves a new chance; only this film has been ruled out.
  useEffect(() => setFilmFailed(false), [url]);
  const still = poster ?? photoSrc(PHOTOS.auth);
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-ink" aria-hidden="true">
      {url && !filmFailed ? (
        <video
          key={url}
          src={url}
          poster={poster}
          className="photo-mono size-full object-cover"
          playsInline
          muted
          loop
          autoPlay
          preload="metadata"
          onError={() => setFilmFailed(true)}
        />
      ) : (
        <img src={still} alt="" className="photo-mono size-full object-cover" decoding="async" />
      )}
      <div className="photo-grain" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,15,17,0.55),rgba(15,15,17,0.35)_38%,rgba(15,15,17,0.92))]" />
    </div>
  );
}

export default function AuthScreen() {
  const { t } = useT();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  /** Demo mode only: the code the local backend just issued (there is no inbox to check). */
  const [demoCode, setDemoCode] = useState<string | null>(null);
  /** How many codes have been asked for this visit; the second one changes what the screen says. */
  const [sends, setSends] = useState(0);
  const [intro, setIntro] = useState<Intro>('enter');
  const countdown = useCountdown(RESEND_SEC);
  /** The common domain the typed address is one or two characters away from, while it stands. */
  const [suggestion, setSuggestion] = useState<string | null>(null);
  /*
   * The address whose typo hint has already been shown once.
   *
   * A domain guess is a guess: people do own mailboxes on domains that look like a slip of
   * `gmail.com`. So the first press shows the hint and holds the request; pressing again with the
   * same address sends it unchanged. The hint helps and never blocks.
   */
  const typoShownFor = useRef<string | null>(null);
  /** When the code in the athlete's inbox was issued — the only way to tell expired from wrong. */
  const codeSentAt = useRef(0);
  /** Refused codes since the last send, so the third one can stop repeating the same sentence. */
  const wrongCodes = useRef(0);

  // Reduced motion gets no title card at all: a word that appears and leaves is the animation.
  useEffect(() => {
    if (prefersReducedMotion()) setIntro('done');
  }, []);

  useEffect(() => {
    if (intro === 'done') return;
    const next: Record<Exclude<Intro, 'done'>, { to: Intro; ms: number }> = {
      enter: { to: 'hold', ms: 40 },
      hold: { to: 'fade', ms: INTRO_HOLD_MS },
      fade: { to: 'done', ms: INTRO_FADE_MS },
    };
    const { to, ms } = next[intro];
    const id = setTimeout(() => setIntro(to), ms);
    return () => clearTimeout(id);
  }, [intro]);

  const fail = (reason: AuthReason) =>
    setError(new AuthError('validation', 'Invalid email', { reason }));

  /** Take the suggested domain: fix the field, clear the error, and leave the send to them. */
  const applySuggestion = () => {
    if (!suggestion) return;
    setEmail(withDomain(email, suggestion));
    setSuggestion(null);
    setError(null);
    typoShownFor.current = null;
  };

  const errorParams: TParams | undefined = error
    ? error.reason === 'email_typo' && suggestion
      ? { suggestion }
      : error.reason === 'signup_disabled'
        ? { from: BRAND.contactEmail }
        : undefined
    : undefined;
  const errorText = error ? t(authErrorKey(error), errorParams) : undefined;
  /*
   * The typo line is the fix. It is the error text under the field and it is also the button that
   * puts the suggested domain in — one tap instead of finding the slipped character by hand.
   */
  const emailError: ReactNode =
    error?.reason === 'email_typo' && suggestion ? (
      <button
        type="button"
        onClick={applySuggestion}
        className="text-left underline underline-offset-2"
      >
        {errorText}
      </button>
    ) : (
      errorText
    );
  const introOver = intro === 'done';

  const send = async () => {
    setError(null);
    const clean = normalizeEmail(email);
    const check = checkEmail(clean);
    if (!check.ok) {
      if (check.reason === 'email_typo') {
        // Shown once; a second press with the same address goes through as typed.
        if (typoShownFor.current !== clean) {
          typoShownFor.current = clean;
          setSuggestion(check.suggestion);
          fail('email_typo');
          return;
        }
      } else {
        setSuggestion(null);
        fail(check.reason);
        return;
      }
    }
    // Past the checks: nothing left to suggest about an address that is on its way.
    setSuggestion(null);
    setBusy(true);
    try {
      await requestCode(clean);
      setDemoCode(await demoPendingCode());
      setCode('');
      setStep('code');
      setSends((n) => n + 1);
      codeSentAt.current = Date.now();
      wrongCodes.current = 0;
      countdown.restart();
    } catch (e) {
      setError(toAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  const verify = useCallback(
    async (value: string) => {
      if (value.length !== CODE_LENGTH) return;
      setBusy(true);
      setError(null);
      try {
        await verifyCode(email, value);
        await useSession.getState().boot();
        const profile = useSession.getState().profile;
        navigate(profile?.onboardedAt ? '/' : '/onboarding', { replace: true });
      } catch (e) {
        const failure = toAuthError(e);
        if (failure.reason === 'invalid_code') wrongCodes.current += 1;
        setError(sharpenCodeError(failure, codeSentAt.current, wrongCodes.current));
        setCode('');
      } finally {
        setBusy(false);
      }
    },
    [email, navigate],
  );

  const onSubmitEmail = (e: FormEvent) => {
    e.preventDefault();
    void send();
  };

  const onSubmitCode = (e: FormEvent) => {
    e.preventDefault();
    void verify(code);
  };

  const changeEmail = () => {
    setStep('email');
    setCode('');
    setError(null);
    setDemoCode(null);
    setSuggestion(null);
    typoShownFor.current = null;
    wrongCodes.current = 0;
    // A new address starts a new count: the hint is about this inbox, not the last one.
    setSends(0);
    countdown.reset();
  };

  /*
   * `isolate` on the <main> below is what lets the backdrop be seen at all.
   *
   * `Backdrop` is `fixed inset-0 -z-10`, and `main` is `position: relative` with `z-index: auto` —
   * which is not a stacking context. So the backdrop was stacked against the *root* one, and a
   * negative z-index there paints behind the canvas background, which `html` and `body` both set
   * to `--ink`. The film ran, the poster loaded, and a black rectangle was drawn over both. It went
   * unnoticed because the only thing ever behind it was an Unsplash URL the session that wrote this
   * screen could not reach either.
   *
   * Isolating makes `-z-10` mean "behind this screen" rather than "behind the page", which is what
   * it was always meant to say, and leaves every other layer's order untouched.
   */
  return (
    <main
      className="relative isolate flex min-h-dvh flex-col justify-end px-6 pt-[var(--safe-top)] pb-[calc(var(--safe-bottom)+var(--nav-inset,0px)+28px)] text-paper"
      onPointerDown={introOver ? undefined : () => setIntro('done')}
    >
      <Backdrop src={AUTH_FILM.src || undefined} poster={withBasePoster(AUTH_FILM.poster)} />

      {/*
       * The title card. It covers the form rather than pushing it: the form is already mounted and
       * already has focus, so a visitor who starts typing through the introduction loses nothing.
       */}
      {introOver ? null : (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-opacity ease-(--ease-out)"
          style={{ opacity: intro === 'hold' ? 1 : 0, transitionDuration: `${INTRO_FADE_MS}ms` }}
        >
          <Logo className="text-[clamp(44px,17vw,96px)]" />
        </div>
      )}

      <div
        className="flex flex-col items-center gap-10 transition-opacity ease-(--ease-out)"
        style={{ opacity: introOver ? 1 : 0, transitionDuration: `${INTRO_FADE_MS}ms` }}
      >
        <Logo className="text-[15px]" />

        {step === 'email' ? (
          <form onSubmit={onSubmitEmail} className="flex w-full flex-col gap-4" noValidate>
            <Input
              type="email"
              name="email"
              aria-label={t('app.authEmailLabel')}
              placeholder={t('app.authEmailPlaceholder')}
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              className="text-center"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
                if (suggestion) setSuggestion(null);
              }}
              error={emailError}
            />
            {/*
             * The button is live on an empty field on purpose. Disabled, it said nothing at all —
             * you pressed a grey rectangle and the screen did not react, which reads as broken.
             * Pressed empty it now says what to type and where the code goes.
             */}
            <Button type="submit" size="lg" fullWidth loading={busy}>
              {t('app.authSendCode')}
            </Button>
          </form>
        ) : (
          <form onSubmit={onSubmitCode} className="flex w-full flex-col gap-4" noValidate>
            {demoCode ? (
              /* Demo mode has no inbox, so the code it just issued is said on the screen — as a
                 pill, because it is a fact and not a control (design/CHANGELOG.md §10). */
              <Pill tone="paper" className="self-center">
                {t('app.demoAuthCode', { code: demoCode })}
              </Pill>
            ) : null}
            <CodeInput
              length={CODE_LENGTH}
              value={code}
              onChange={(v) => {
                setCode(v);
                if (error) setError(null);
              }}
              onComplete={(v) => void verify(v)}
              disabled={busy}
              error={Boolean(error)}
              autoFocus={introOver}
              label={t('app.authCodeLabel')}
            />
            {errorText ? (
              /*
               * It wraps. It used to `truncate`, which was right while every line was three words
               * and wrong the moment they started saying what to do about it — «Код живёт 10
               * минут, этот уже истёк. Запроси новый.» clipped at 390px is «Код живёт 10 мину…»,
               * which is the generic message again with extra steps.
               */
              <p
                role="alert"
                className="text-center text-[13px] leading-snug text-balance text-danger"
              >
                {errorText}
              </p>
            ) : null}
            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={busy}
              disabled={code.length !== CODE_LENGTH}
            >
              {t('app.authConfirm')}
            </Button>
            {/*
             * Asked twice and still nothing.
             *
             * A sign-in code is the one message in this product that cannot be resent by a human,
             * and the app is told nothing when it fails: Supabase answers 200 whether the message
             * left or not (docs/SETUP.md §3), so by the time somebody is on their second request
             * the most useful thing the screen can do is name the two folders the message is
             * actually in and the address it came from.
             *
             * Second request, not the first: on the first, waiting is still the right advice.
             */}
            {sends >= 2 ? (
              <p className="pt-1 text-center text-[13px] leading-relaxed text-paper/60">
                {t('app.authNoMail', { from: BRAND.contactEmail })}
              </p>
            ) : null}
            {/*
             * The two ways out of a code that never arrived, set as quiet type rather than as two
             * more buttons: the address it went to is the label of the one that goes back to it.
             */}
            <div className="flex items-center justify-center gap-4 pt-1 text-[13px] text-paper/70">
              <button
                type="button"
                onClick={changeEmail}
                aria-label={t('app.authChangeEmail')}
                className="tap-target-y truncate underline underline-offset-4"
              >
                {normalizeEmail(email)}
              </button>
              <button
                type="button"
                disabled={!countdown.done || busy}
                onClick={() => void send()}
                className="tap-target-y shrink-0 underline underline-offset-4 disabled:no-underline disabled:opacity-60"
              >
                {countdown.done
                  ? t('app.authResend')
                  : t('app.authResendIn', { s: countdown.remainingSec })}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

/** A poster lives in `public/`, so it carries the site's base path; an empty one stays undefined. */
function withBasePoster(poster: string | undefined): string | undefined {
  if (!poster) return undefined;
  return /^https?:\/\//i.test(poster) ? poster : withBase(poster);
}
