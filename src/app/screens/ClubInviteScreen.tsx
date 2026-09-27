/**
 * `/invite` — «Позови друга»: +30 дней тебе и другу (0051).
 *
 * Владелец: «Очень важен реферальный аспект… надо увеличить LTV». Экран — одна ссылка и три
 * строки о том, что за неё дают; ниже — что она уже принесла. Числа — из `my_referrals()`, и
 * это единственное, что база о рефералах отдаёт наружу: счётчики, а не люди.
 *
 * Ссылка одна на человека и не меняется (`my_referral_code()` на второй вызов отдаёт первый),
 * поэтому её можно спокойно копировать много раз: отправленная вчера подруге не перестаёт
 * работать от того, что сегодня нажали ещё раз.
 *
 * Делится через `navigator.share`, если он есть, — внутри телеграма это родное «переслать», —
 * иначе копирует в буфер и говорит об этом. Текст ссылки виден и без кнопки: он и есть
 * запасной путь.
 *
 * Это экран клуба, и неона здесь нет: рамка — гребень клуба, кнопка — тёплая половина градиента
 * (`Button` `gradient`), ключевое слово — `.text-gradient` (design/CHANGELOG.md §17).
 */
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import { formatNumber } from '@/i18n/index';
import { getMyReferralCode, getMyReferrals } from '@/lib/api/referral';
import type { ReferralStats } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';
import { ScreenLoader } from '@/app/components/ScreenLoader';
import { TopBar } from '@/app/components/TopBar';
import { shareFailure } from '@/app/features/marathon/duoInvite';
import { referralUrl } from '@/app/features/referral/link';

export default function ClubInviteScreen() {
  const { t, locale } = useT();
  const toast = useToast();
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    Promise.all([getMyReferralCode(), getMyReferrals()])
      .then(([c, s]) => {
        if (!alive) return;
        setCode(c);
        setStats(s);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

  const url = code ? referralUrl(code) : '';

  const copy = useCallback(async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.show({ kind: 'success', title: t('app.duoInviteCopied') });
    } catch {
      toast.show({ kind: 'error', title: t('common.errorGeneric') });
    }
  }, [url, t, toast]);

  const share = useCallback(async () => {
    if (!url) return;
    setBusy(true);
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title: t('app.inviteShareTitle'), url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.show({ kind: 'success', title: t('app.duoInviteCopied') });
    } catch (e) {
      // Закрытая шторка — не ошибка; остальное говорится вслух, иначе кнопка «ничего не делает».
      const message = shareFailure(e);
      if (message) toast.show({ kind: 'error', title: t(message) });
    } finally {
      setBusy(false);
    }
  }, [url, t, toast]);

  const header = <TopBar back title={t('app.inviteTitle')} />;

  if (failed) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="info"
          title={t('app.inviteTitle')}
          description={t('app.inviteFailed')}
          action={
            <Button variant="gradient" size="lg" onClick={() => setAttempt((n) => n + 1)}>
              {t('common.retry')}
            </Button>
          }
        />
      </Screen>
    );
  }

  if (!code || !stats) {
    return (
      <Screen header={header} contentClassName="pt-4">
        <ScreenLoader />
      </Screen>
    );
  }

  const steps = [t('app.inviteStep1'), t('app.inviteStep2'), t('app.inviteStep3')];

  return (
    <Screen header={header} contentClassName="pt-2">
      <div className="flex flex-col gap-6">
        {/* The club's rim, as on the winner card: the crossroads gradient frames, never fills. */}
        <div className="rounded-card bg-cross p-[1.5px]">
          <div className="glass-card flex flex-col gap-2 rounded-[calc(var(--r-card)-1.5px)] border-0 p-5">
            <span className="eyebrow">{t('app.inviteEyebrow')}</span>
            <h2 className="display text-[26px] leading-[1.1] text-balance">
              <span className="text-gradient">{t('app.inviteDays')}</span>{' '}
              {t('app.inviteHeadlineRest')}
            </h2>
          </div>
        </div>

        <section className="flex flex-col gap-3" aria-label={t('app.inviteHow')}>
          <span className="eyebrow">{t('app.inviteHow')}</span>
          <ol className="flex flex-col gap-2">
            {steps.map((step, i) => (
              <li key={step} className="flex items-baseline gap-3">
                <span className="numeral tabular shrink-0 text-[15px] text-orange">
                  {formatNumber(locale, i + 1)}
                </span>
                <span className="text-[15px] leading-snug">{step}</span>
              </li>
            ))}
          </ol>
          <p className="text-[13px] leading-relaxed text-muted">{t('app.inviteNote')}</p>
        </section>

        <section className="flex flex-col gap-3" aria-label={t('app.inviteLinkLabel')}>
          <span className="eyebrow">{t('app.inviteLinkLabel')}</span>
          <Card level={2} padding="sm" className="flex items-center gap-3">
            {/* Written out in full: the share sheet may not open, and then it is copied by eye.
                `break-all` because a code does not wrap on a word boundary. */}
            <span className="min-w-0 flex-1 break-all text-[13px] leading-snug text-muted-2">
              {url}
            </span>
            <Button variant="ghost" size="sm" onClick={() => void copy()}>
              {t('app.inviteCopy')}
            </Button>
          </Card>
          <Button
            variant="gradient"
            size="lg"
            fullWidth
            loading={busy}
            onClick={() => void share()}
          >
            {t('app.inviteShare')}
          </Button>
        </section>

        <section className="flex flex-col gap-2" aria-label={t('app.inviteStatsEyebrow')}>
          <span className="eyebrow">{t('app.inviteStatsEyebrow')}</span>
          <p className="text-[15px] text-muted">
            {t('app.inviteStats', {
              attached: formatNumber(locale, stats.attached),
              rewarded: formatNumber(locale, stats.rewarded),
              days: formatNumber(locale, stats.daysEarned),
            })}
          </p>
        </section>
      </div>
    </Screen>
  );
}
