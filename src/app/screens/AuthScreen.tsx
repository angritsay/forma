/**
 * Auth (docs/SPEC.md §10 flow 1): email → 6-digit code → session.
 * Step 1: brand, tagline, email, "Send code". Step 2: code boxes, confirm, resend (60 s), change email.
 */
import { useCallback, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { CodeInput } from '@/components/ui/CodeInput';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { PageTitle } from '@/components/ui/PageTitle';
import { PhotoBlock } from '@/components/ui/PhotoBlock';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import { PHOTOS } from '@/lib/media/photos';
import { useT } from '@/app/hooks/useT';
import { useCountdown } from '@/app/hooks/useTimer';
import { useSession } from '@/app/store/session';
import {
  AuthError,
  demoPendingCode,
  isValidEmail,
  normalizeEmail,
  requestCode,
  toAuthError,
  verifyCode,
} from '@/lib/api/auth';
import type { TKey } from '@/i18n/index';

const RESEND_SEC = 60;
const CODE_LENGTH = 6;

type Step = 'email' | 'code';

function authErrorKey(e: AuthError): TKey {
  switch (e.reason) {
    case 'invalid_email':
      return 'app.authErrorInvalidEmail';
    case 'rate_limited':
      return 'app.authErrorRateLimited';
    case 'invalid_code':
      return 'app.authErrorInvalidCode';
    case 'signup_disabled':
      return 'app.authErrorSignupDisabled';
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

export default function AuthScreen() {
  const { t } = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  /** Demo mode only: the code the local backend just issued (there is no inbox to check). */
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const countdown = useCountdown(RESEND_SEC);

  const errorText = error ? t(authErrorKey(error)) : undefined;

  const send = async (resend: boolean) => {
    setError(null);
    if (!isValidEmail(email)) {
      setError(new AuthError('validation', 'Invalid email', { reason: 'invalid_email' }));
      return;
    }
    setBusy(true);
    try {
      await requestCode(email);
      setDemoCode(await demoPendingCode());
      setCode('');
      setStep('code');
      countdown.restart();
      if (resend) toast.show({ kind: 'success', title: t('app.authResent') });
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
        setError(toAuthError(e));
        setCode('');
      } finally {
        setBusy(false);
      }
    },
    [email, navigate],
  );

  const onSubmitEmail = (e: FormEvent) => {
    e.preventDefault();
    void send(false);
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
    countdown.reset();
  };

  return (
    <Screen>
      <div className="flex flex-col gap-6 py-4">
        {/*
         * The first screen anyone sees, so it is the brand's own argument: a photograph of someone
         * training, running past both gutters, with the lockup and the tagline over it. The
         * tagline is the screen's one display line, set the brand's way — the claim at 800, the
         * promise at 200 — and it is a paragraph, not a heading: the heading of this page is
         * «Вход», below the fold of the picture.
         */}
        <div className="-mx-5 lg:mx-0">
          <PhotoBlock photo={PHOTOS.auth} alt="" ratio="landscape" priority>
            <Logo lockup className="text-[22px] text-paper" />
            <p className="display mt-4 text-5xl text-paper lg:text-6xl">
              {t('app.authHeroHeavy')} <span className="t-thin">{t('app.authHeroThin')}</span>
            </p>
          </PhotoBlock>
        </div>

        {step === 'email' ? (
          <form onSubmit={onSubmitEmail} className="flex flex-col gap-5" noValidate>
            <PageTitle size="md" title={t('app.authTitle')} subtitle={t('app.authLead')} />
            <Input
              type="email"
              name="email"
              label={t('app.authEmailLabel')}
              placeholder={t('app.authEmailPlaceholder')}
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              error={errorText}
            />
            <Button type="submit" size="lg" fullWidth loading={busy} disabled={email.trim() === ''}>
              {t('app.authSendCode')}
            </Button>
          </form>
        ) : (
          <form onSubmit={onSubmitCode} className="flex flex-col gap-5" noValidate>
            <PageTitle
              size="md"
              title={t('app.authCodeTitle')}
              subtitle={t('app.authCodeLead', { email: normalizeEmail(email) })}
            />
            {demoCode ? (
              /* A warning is a coloured word behind a hairline, never a tinted block. */
              <div className="border border-border-strong px-4 py-3">
                <p className="text-base font-semibold text-warning">
                  {t('app.demoAuthCode', { code: demoCode })}
                </p>
                <p className="mt-1 text-sm text-muted">{t('app.demoAuthCodeHint')}</p>
              </div>
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
              autoFocus
              label={t('app.authCodeLabel')}
            />
            {errorText ? (
              <p role="alert" className="text-sm text-danger">
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
            <div className="flex flex-col items-start gap-1">
              <Button
                variant="ghost"
                disabled={!countdown.done || busy}
                onClick={() => void send(true)}
              >
                {countdown.done
                  ? t('app.authResend')
                  : t('app.authResendIn', { s: countdown.remainingSec })}
              </Button>
              <Button variant="ghost" size="sm" onClick={changeEmail}>
                {t('app.authChangeEmail')}
              </Button>
              {demoCode ? null : (
                <p className="mt-2 text-sm text-muted-2">{t('app.authSpamHint')}</p>
              )}
            </div>
          </form>
        )}
      </div>
    </Screen>
  );
}
