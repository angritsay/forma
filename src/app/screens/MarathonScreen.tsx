/**
 * Marathon — Today.
 *
 * The whole screen is one question: what is set for today, and have I done it. The board and the
 * points history are one tap away rather than on this screen, because at 7am on a mat the answer
 * to "where am I in the table" is never what gets someone moving.
 */
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageTitle } from '@/components/ui/PageTitle';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatNumber } from '@/i18n/index';
import { PROOFS_BUCKET, proofMediaPath, sendProof } from '@/lib/api/marathon';
import { uploadMedia } from '@/lib/api/storage';
import type { MyMarathon, ProofInput } from '@/lib/api/types';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { TaskCard } from '@/app/features/marathon/TaskCard';
import {
  useMarathonDay,
  useMarathonRoster,
  useMyMarathons,
} from '@/app/features/marathon/useMarathon';

function DaySkeleton() {
  return (
    <div className="flex flex-col gap-6 py-4" aria-hidden="true">
      <Skeleton rounded="control" className="h-20" />
      <Skeleton rounded="control" className="h-36" />
      <Skeleton rounded="control" className="h-36" />
    </div>
  );
}

export default function MarathonScreen() {
  const { t } = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const { marathon, status: marathonStatus, error, reload: reloadMarathon } = useMyMarathons();
  const dayIndex = marathon?.dayIndex ?? 0;
  const { data: tasks, status, reload } = useMarathonDay(marathon, dayIndex);
  const { data: roster } = useMarathonRoster(marathon?.id ?? null);
  const [sending, setSending] = useState(false);

  /** The people I am scored with, by member id — everyone on my team but me. */
  const teammateNames = useMemo(() => {
    const map = new Map<string, string>();
    if (!marathon?.teamId) return map;
    for (const row of roster) {
      if (row.teamId === marathon.teamId && row.memberId !== marathon.memberId) {
        map.set(row.memberId, row.displayName);
      }
    }
    return map;
  }, [roster, marathon?.teamId, marathon?.memberId]);

  const send = useCallback(
    async (taskId: string, proof: Omit<ProofInput, 'taskId' | 'memberId'>) => {
      if (!marathon) return;
      setSending(true);
      try {
        await sendProof({ ...proof, taskId, memberId: marathon.memberId });
        reload();
      } catch {
        toast.show({ kind: 'error', title: t('common.errorGeneric') });
      } finally {
        setSending(false);
      }
    },
    [marathon, reload, t, toast],
  );

  const sendMedia = useCallback(
    async (taskId: string, file: File) => {
      if (!marathon) return;
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = proofMediaPath(marathon.id, marathon.memberId, taskId, ext);
      try {
        const ref = await uploadMedia(PROOFS_BUCKET, path, file);
        await send(taskId, { mediaPath: ref });
      } catch {
        toast.show({ kind: 'error', title: t('common.errorGeneric') });
      }
    },
    [marathon, send, t, toast],
  );

  const header = <TopBar title={t('app.marathonTitle')} />;

  if (marathonStatus === 'loading') {
    return (
      <Screen header={header}>
        <DaySkeleton />
      </Screen>
    );
  }

  if (marathonStatus === 'error') {
    return (
      <Screen header={header}>
        <EmptyState
          title={t('app.marathonErrorTitle')}
          description={
            error?.code === 'network' ? t('common.errorOffline') : t('common.errorGeneric')
          }
          action={
            <Button size="lg" onClick={reloadMarathon}>
              {t('common.retry')}
            </Button>
          }
        />
      </Screen>
    );
  }

  if (!marathon) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="info"
          title={t('app.marathonEmptyTitle')}
          description={t('app.marathonEmptyBody')}
          action={<Button onClick={() => navigate('/')}>{t('app.tabHome')}</Button>}
        />
      </Screen>
    );
  }

  const closed = marathon.status === 'finished';

  return (
    <Screen header={header}>
      <div className="flex flex-col gap-5 pb-4">
        <MarathonHead marathon={marathon} partners={[...teammateNames.values()]} />

        {dayIndex < 1 ? (
          <EmptyState
            title={t('app.marathonNotStarted')}
            description={t('app.marathonNotStartedBody')}
          />
        ) : status === 'loading' ? (
          <DaySkeleton />
        ) : tasks.length === 0 ? (
          <EmptyState
            title={t('app.marathonNoTasksToday')}
            description={t('app.marathonNoTasksTodayBody')}
          />
        ) : (
          <div className="flex flex-col" aria-busy={sending}>
            {tasks.map((item) => (
              <TaskCard
                key={item.task.id}
                item={item}
                teammateNames={teammateNames}
                closed={closed}
                onSend={(proof) => send(item.task.id, proof)}
                onSendMedia={(file) => sendMedia(item.task.id, file)}
              />
            ))}
          </div>
        )}

        <div className="flex gap-3 border-t border-border pt-5">
          <Button variant="secondary" size="md" onClick={() => navigate('/marathon/board')}>
            {t('app.marathonTabBoard')}
          </Button>
          <Button variant="ghost" size="md" onClick={() => navigate('/marathon/points')}>
            {t('app.marathonTabPoints')}
          </Button>
        </div>
      </div>
    </Screen>
  );
}

/**
 * The head of the screen: which day it is, who you are scored with, and what the week is for.
 *
 * The day number is the big figure rather than the marathon's name — the name does not change and
 * the day does, and a format whose whole point is "every morning there is something" should lead
 * with the morning.
 */
function MarathonHead({ marathon, partners }: { marathon: MyMarathon; partners: string[] }) {
  const { t, locale } = useT();
  /*
   * Who you are scored with, by name. The team's own name is the wrong thing to say here — a pair
   * is usually called «Ты и Марек», and «В паре с Ты и Марек» is nonsense. The roster has the
   * people; the team name is on the board, where the team is the racer.
   */
  const partner = partners.length > 0 ? partners.join(', ') : marathon.teamName;
  return (
    <header className="flex flex-col gap-2 pt-2">
      <PageTitle
        eyebrow={marathon.title}
        title={t('app.marathonDayOf', {
          n: formatNumber(locale, Math.max(marathon.dayIndex, 1)),
          total: formatNumber(locale, marathon.days),
        })}
      />
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[13px] text-muted">
        <span>{t('app.marathonWeek', { n: formatNumber(locale, marathon.week) })}</span>
        <span>
          {partner ? t('app.marathonWithPartner', { name: partner }) : t('app.marathonSolo')}
        </span>
      </div>
      {marathon.prize ? (
        <p className="text-[13px] text-muted-2">
          <span className="control-label text-[10px]">{t('app.marathonPrize')}</span>{' '}
          {marathon.prize}
        </p>
      ) : null}
    </header>
  );
}
