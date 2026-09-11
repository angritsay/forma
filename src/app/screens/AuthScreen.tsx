/**
 * Auth (docs/SPEC.md §10 flow 1): email → 6-digit code → session.
 * Step 1: brand, tagline, email, "Send code". Step 2: code boxes, confirm, resend (60 s), change email.
 */
import { useCallback, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { CodeInput } from '@/components/ui/CodeInput';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
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
         * training, running past both gutters, with the wordmark and the tagline over it. A flat
         * tile carrying the same two lines said nothing that the words did not already say.
         */}
        <div className="-mx-5 lg:mx-0">
          <PhotoBlock photo={PHOTOS.auth} alt="" ratio="landscape" priority>
            <span className="wordmark block text-4xl text-white">
              {t('common.brand')}
              <span className="text-accent">.</span>
            </span>
            <span className="mt-2 block text-[15px] text-white/80">{t('common.tagline')}</span>
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
              leading={<Icon name="mail" />}
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
              <div className="rounded-inner border border-warning/40 bg-warning/10 px-4 py-3">
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
            <div className="flex flex-col items-center gap-3">
              <Button
                variant="ghost"
                disabled={!countdown.done || busy}
                onClick={() => void send(true)}
                icon={<Icon name="refresh" size={18} />}
              >
                {countdown.done
                  ? t('app.authResend')
                  : t('app.authResendIn', { s: countdown.remainingSec })}
              </Button>
              <button
                type="button"
                onClick={changeEmail}
                className="text-sm text-muted underline underline-offset-4 hover:text-text"
              >
                {t('app.authChangeEmail')}
              </button>
              {demoCode ? null : (
                <p className="text-center text-sm text-muted-2">{t('app.authSpamHint')}</p>
              )}
            </div>
          </form>
        )}
      </div>
    </Screen>
  );
}
