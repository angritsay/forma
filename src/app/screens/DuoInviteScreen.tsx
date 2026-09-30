/**
 * `/duo` — принять приглашение в пару (ссылка подруги из `ClubDuoPair`).
 *
 * Токен сюда приезжает не в адресе, а из sessionStorage: ссылку `#/duo/<token>` ловит маршрут без
 * охраны и откладывает его (`duoInvite.ts`), потому что между ссылкой и этим экраном у нового
 * человека стоят вход и анкета. Здесь токен принимается один раз; при успехе — во вкладку «Дуо»
 * клуба, при отказе — фраза о том, что именно не так, и кнопка в клуб.
 *
 * **Уже в паре — сначала вопрос.** Принятое приглашение расторгает прежние пары обеих сторон
 * (`club_invite_redeem`), и напарница узнавала об этом по пустому месту рядом. Поэтому перед
 * приёмом экран спрашивает состояние пары, и если в ней кто-то есть — называет его и спрашивает,
 * менять ли. Не удалось спросить — приглашение принимается как раньше: ссылку открыли, чтобы
 * принять, и сбой проверки не повод это отнять.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import { getClubDuoStatus, redeemClubInvite } from '@/lib/api/marathon';
import { useT } from '@/app/hooks/useT';
import { ScreenLoader } from '@/app/components/ScreenLoader';
import { TopBar } from '@/app/components/TopBar';
import {
  clearDuoInvite,
  pendingDuoInvite,
  redeemFailure,
  type RedeemFailure,
} from '@/app/features/marathon/duoInvite';

/** Куда вести после приглашения: клуб, сразу на переключателе «Дуо». */
export const DUO_TAB_PATH = '/marathon?mode=duo';

export default function DuoInviteScreen() {
  const { t } = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const [token] = useState(() => pendingDuoInvite());
  const [failure, setFailure] = useState<RedeemFailure | null>(null);
  const [attempt, setAttempt] = useState(0);
  /*
   * `null` — ещё спрашиваем пару; `''` — пары нет (или спросить не вышло), принимаем сразу;
   * имя — есть пара, ждём ответа человека; `confirmed` — он согласился её сменить.
   */
  const [mate, setMate] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  // Строгий режим React монтирует эффект дважды; приглашение принимается один раз на попытку.
  const started = useRef(-1);
  const asked = useRef(false);

  useEffect(() => {
    if (!token || asked.current) return;
    asked.current = true;
    getClubDuoStatus()
      .then((status) => setMate(status?.teamId && status.mateName ? status.mateName : ''))
      .catch(() => setMate(''));
  }, [token]);

  const ready = mate === '' || confirmed;

  useEffect(() => {
    if (!token || !ready || started.current === attempt) return;
    started.current = attempt;
    // Снимается сразу, как только экран взялся за приглашение: «повторить» берёт токен из
    // состояния экрана, а лежащий токен возвращал бы сюда с каждого перехода, пока ответ в пути.
    clearDuoInvite();
    redeemClubInvite(token)
      .then(() => {
        toast.show({ kind: 'success', title: t('app.duoRedeemDone') });
        navigate(DUO_TAB_PATH, { replace: true });
      })
      .catch((e: unknown) => setFailure(redeemFailure(e)));
  }, [token, ready, attempt, navigate, toast, t]);

  const retry = useCallback(() => {
    setFailure(null);
    setAttempt((n) => n + 1);
  }, []);

  if (!token) return <Navigate to={DUO_TAB_PATH} replace />;

  if (mate && !confirmed) {
    return (
      <Screen header={<TopBar back title={t('app.duoSwitchTitle')} />}>
        <EmptyState
          title={t('app.duoSwitchTitle')}
          description={t('app.duoSwitchBody', { name: mate })}
          action={
            <div className="flex flex-col items-center gap-3">
              <Button variant="action" size="lg" onClick={() => setConfirmed(true)}>
                {t('app.duoSwitchAccept')}
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  clearDuoInvite();
                  navigate(DUO_TAB_PATH, { replace: true });
                }}
              >
                {t('app.duoSwitchKeep')}
              </Button>
            </div>
          }
        />
      </Screen>
    );
  }

  if (!failure) return <ScreenLoader />;

  return (
    <Screen header={<TopBar back title={t('app.duoRedeemTitle')} />}>
      <EmptyState
        title={t('app.duoRedeemTitle')}
        description={t(failure.message)}
        action={
          failure.retry ? (
            <Button variant="action" size="lg" onClick={retry}>
              {t('common.retry')}
            </Button>
          ) : (
            <Button variant="action" size="lg" onClick={() => navigate(DUO_TAB_PATH)}>
              {t('app.duoRedeemToClub')}
            </Button>
          )
        }
      />
    </Screen>
  );
}
