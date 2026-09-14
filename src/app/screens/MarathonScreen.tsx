/**
 * The challenge (the third tab): today's task, and who is winning the week.
 *
 * It was reachable only through a card on the home deck, which made the format look like an
 * accessory to the course. It is a tab of its own now, and it holds the two halves of the challenge in
 * the order they are asked for: what is set for today and whether it is sent, then the short
 * table of the week under it — five rows, the full board one tap further.
 *
 * The table is short on purpose. At 7am on a mat the answer to "where am I in the standings" is
 * never what gets someone moving, so the day comes first; but a race nobody can see the score of
 * is not a race, and a link to it was not enough to make it one.
 */
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageTitle } from '@/components/ui/PageTitle';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatNumber, plural } from '@/i18n/index';
import { PROOFS_BUCKET, proofMediaPath, sendProof } from '@/lib/api/marathon';
import { uploadMedia } from '@/lib/api/storage';
import type { MyMarathon, ProofInput } from '@/lib/api/types';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { BoardRow } from '@/app/features/marathon/BoardRow';
import { TaskCard } from '@/app/features/marathon/TaskCard';
import {
  useMarathonDay,
  useMarathonRoster,
  useMarathonScores,
  useMyMarathons,
} from '@/app/features/marathon/useMarathon';
import { LinkButton } from '@/app/features/courses/LinkButton';
import { subscribeHref } from '@/app/features/courses/courseMeta';
import { useSession } from '@/app/store/session';
import { gameAccess } from '@/app/features/marathon/gameAccess';
import { GAME_REQUIRES_SUBSCRIPTION } from '@content/site/plans';

/** How much of the week's table the day screen shows. */
const BOARD_ROWS = 5;

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
  const { t, locale } = useT();
  const subscription = useSession((s) => s.subscription);
  const newestPurchaseAt = useSession((s) => s.newestPurchaseAt);
  const navigate = useNavigate();
  const toast = useToast();
  const { marathon, status: marathonStatus, error, reload: reloadMarathon } = useMyMarathons();
  const dayIndex = marathon?.dayIndex ?? 0;
  const { data: tasks, status, reload } = useMarathonDay(marathon, dayIndex);
  const { data: roster } = useMarathonRoster(marathon?.id ?? null);
  const { data: scores } = useMarathonScores(marathon?.id ?? null, marathon?.week ?? null);
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

  /*
   * The challenge is part of the subscription (content/site/plans.ts). The screen says so plainly and
   * offers the subscription rather than pretending the format does not exist — somebody who got
   * here tapped a card that told them what the challenge is, and the answer to "can I play" is a price,
   * not a locked door.
   */
  const access = gameAccess({
    subscriptionLive: subscription?.isLive === true,
    newestPurchaseAt,
    now: Date.now(),
    gated: GAME_REQUIRES_SUBSCRIPTION,
  });

  if (!access.allowed) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="info"
          title={t('app.marathonLockedTitle')}
          description={t('app.marathonLockedBody')}
          action={
            <LinkButton href={subscribeHref(locale)} size="lg">
              {t('app.homeDeckGameLockedCta')}
            </LinkButton>
          }
        />
      </Screen>
    );
  }

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
  /* The top of this week's table; a week nobody has scored in yet shows as empty, not as zeros. */
  const topScores = scores.filter((row) => row.points > 0).slice(0, BOARD_ROWS);

  return (
    <Screen header={header}>
      <div className="flex flex-col gap-5 pb-4">
        <MarathonHead marathon={marathon} partners={[...teammateNames.values()]} />

        {/*
         * The week a course bought says so, and says how much of it is left. A trial nobody is
         * told about converts nothing: the whole point is that on the seventh day the person
         * already knows what they are about to lose.
         */}
        {access.allowed && access.trialDaysLeft !== undefined ? (
          <section className="border-l-2 border-course pl-4">
            <span className="eyebrow text-course">{t('app.marathonTrialTitle')}</span>
            <p className="mt-1 text-[15px]">
              {t('app.marathonTrialBody', {
                n: plural(locale, access.trialDaysLeft, {
                  one: t('app.homeDeckGameTrialDayOne'),
                  few: t('app.homeDeckGameTrialDayFew', { n: access.trialDaysLeft }),
                  many: t('app.homeDeckGameTrialDayMany', { n: access.trialDaysLeft }),
                }),
              })}
            </p>
          </section>
        ) : null}

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

        {/*
         * The week, as far as the top of it. One way on from here, not two: «Мои баллы» is the
         * breakdown of an answer this table already gives, so it lives on the full board.
         */}
        <section className="border-t border-border pt-5">
          <h2 className="eyebrow">{t('app.marathonWeekThis')}</h2>
          {topScores.length > 0 ? (
            <ol className="mt-2 flex flex-col">
              {topScores.map((row) => (
                <li key={row.entryId}>
                  <BoardRow row={row} />
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-[13px] text-muted">{t('app.marathonBoardEmpty')}</p>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => navigate('/marathon/board')}
          >
            {t('app.marathonTabBoard')}
          </Button>
        </section>
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
