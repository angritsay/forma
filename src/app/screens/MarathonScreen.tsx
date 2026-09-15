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
 *
 * The screen is orange, and the orange is the brandbook's own rule rather than a departure from it:
 * «один экран — один цвет, и он приходит от программы». The challenge's programme colour is
 * `GAME_TILE` — it has painted the deck card and the row on Home since the format shipped — and
 * this, the format's own screen, was the one place it never reached. `--course-tile` is set once
 * around the whole screen, so the cover, the trial rule, the points still on the table and the row
 * that is yours on the board all read the same variable. It paints a cover, a progress strip and
 * numerals; the buttons stay black and white, because the rule says «НЕ кнопки».
 */
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { plural } from '@/i18n/index';
import { PROOFS_BUCKET, proofMediaPath, sendProof } from '@/lib/api/marathon';
import { uploadMedia } from '@/lib/api/storage';
import type { MyMarathon, ProofInput } from '@/lib/api/types';
import { courseTileVars, GAME_TILE } from '@/lib/ui/tile';
import { useT } from '@/app/hooks/useT';
import { BoardRow } from '@/app/features/marathon/BoardRow';
import { GameCover } from '@/app/features/marathon/GameCover';
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

  /*
   * Every state of this screen is the same page: the cover, then whatever there is to say under it.
   * There is no top bar — the cover *is* the header, the way a course's is, and the tab bar already
   * names the screen. `--course-tile` sits on the outer element so the block and everything under
   * it take the challenge's colour from one place.
   */
  const page = (cover: MyMarathon | null, body: ReactNode, partners?: string[]) => (
    <div style={courseTileVars(GAME_TILE)}>
      <Screen>
        <GameCover marathon={cover} partners={partners} />
        {body}
      </Screen>
    </div>
  );

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
    return page(
      null,
      <EmptyState
        icon="info"
        title={t('app.marathonLockedTitle')}
        description={t('app.marathonLockedBody')}
        action={
          <LinkButton href={subscribeHref(locale)} size="lg">
            {t('app.homeDeckGameLockedCta')}
          </LinkButton>
        }
      />,
    );
  }

  if (marathonStatus === 'loading') {
    return page(null, <DaySkeleton />);
  }

  if (marathonStatus === 'error') {
    return page(
      null,
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
      />,
    );
  }

  if (!marathon) {
    return page(
      null,
      <EmptyState
        icon="info"
        title={t('app.marathonEmptyTitle')}
        description={t('app.marathonEmptyBody')}
        action={<Button onClick={() => navigate('/')}>{t('app.tabHome')}</Button>}
      />,
    );
  }

  const closed = marathon.status === 'finished';
  /* The top of this week's table; a week nobody has scored in yet shows as empty, not as zeros. */
  const topScores = scores.filter((row) => row.points > 0).slice(0, BOARD_ROWS);

  return page(
    marathon,
    <div className="flex flex-col gap-5 pt-6 pb-4">
      {/*
       * The week a course bought says so, and says how much of it is left. A trial nobody is
       * told about converts nothing: the whole point is that on the seventh day the person
       * already knows what they are about to lose.
       *
       * The rule and the kicker are `border-course` / `text-course`, which is to say the
       * challenge's orange — they always were, and until the screen set `--course-tile` they fell
       * back to a neutral grey and nobody could see what they were for.
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
        <h2 className="eyebrow text-course">{t('app.marathonWeekThis')}</h2>
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
    </div>,
    [...teammateNames.values()],
  );
}
