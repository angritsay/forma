/**
 * The club (the third tab): today's tasks, and who is winning the week.
 *
 * It was reachable only through a card on the home deck, which made the format look like an
 * accessory to the course. It is a tab of its own now, and it holds the two halves of the club in
 * the order they are asked for: what is set for today and whether it is sent, then the short
 * table of the week under it — five rows, the full board one tap further.
 *
 * The table is short on purpose. At 7am on a mat the answer to "where am I in the standings" is
 * never what gets someone moving, so the day comes first; but a race nobody can see the score of
 * is not a race, and a link to it was not enough to make it one.
 *
 * **The screen is drawn in the language of the owner's prototype** (`design/ui_kits/app-v2`,
 * «Челлендж»), after she called the previous version «вообще мимо»: the day as a ring with the
 * number in it, one display line, each task as its name and a pill of points, one control per
 * task, and a board of circled ranks with the prize as a pill above it. What went was a cover in
 * the programme colour, a paragraph about the trial, a rule label over every task and a target
 * line under it — the same facts, said by smaller things.
 *
 * The colour is still the brandbook's own rule: «один экран — один цвет, и он приходит от
 * программы». The club's is `GAME_TILE`; `--course-tile` is set once around the whole screen,
 * so the ring, the pills, the leader's circle and the trial's link all read the same variable. It
 * paints figures and pills, never a button and never a field of it.
 */
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatNumber, plural } from '@/i18n/index';
import { PROOFS_BUCKET, proofMediaPath, sendProof } from '@/lib/api/marathon';
import { uploadMedia } from '@/lib/api/storage';
import type { MyMarathon, ProofInput } from '@/lib/api/types';
import { courseTileVars, GAME_TILE } from '@/lib/ui/tile';
import { externalLinkProps } from '@/app/hooks/useExternalLink';
import { useT } from '@/app/hooks/useT';
import { BoardRow } from '@/app/features/marathon/BoardRow';
import { GameHead } from '@/app/features/marathon/GameHead';
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
   * Every state of this screen is the same page: the head, then whatever there is to say under it.
   * There is no top bar — the head names the screen, and the tab bar already does. `--course-tile`
   * sits on the outer element so the ring and everything under it take the club's colour
   * from one place.
   */
  const page = (head: MyMarathon | null, body: ReactNode, partners?: string[]) => (
    <div style={courseTileVars(GAME_TILE)}>
      <Screen contentClassName="pt-5">
        <GameHead marathon={head} partners={partners} />
        {body}
      </Screen>
    </div>
  );

  /*
   * The club is part of the subscription (content/site/plans.ts). The screen says so plainly and
   * offers the subscription rather than pretending the format does not exist — somebody who got
   * here tapped a card that told them what the club is, and the answer to "can I play" is a price,
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
  const delivered = tasks.filter((item) => item.mine !== null && !item.mine.voidedAt).length;

  return page(
    marathon,
    <div className="flex flex-col gap-6 pt-5 pb-4">
      {/*
       * The week a course bought, as a pill that leads to the subscription. A trial nobody is told
       * about converts nothing: on the seventh day the person should already know what they are
       * about to lose — and one pill says it as well as the paragraph it replaced, in the colour
       * that marks the rest of the club's own facts.
       */}
      {access.trialDaysLeft !== undefined ? (
        <a
          {...externalLinkProps(subscribeHref(locale))}
          className="control-label inline-flex h-8 items-center gap-2 self-start rounded-pill border border-course/60 px-3.5 text-[10px] text-course transition-opacity duration-150 ease-(--ease-out) hover:opacity-80"
        >
          {t('app.marathonTrialTitle')} ·{' '}
          {t('app.marathonTrialLeft', {
            n: plural(locale, access.trialDaysLeft, {
              one: t('app.homeDeckGameTrialDayOne'),
              few: t('app.homeDeckGameTrialDayFew', { n: access.trialDaysLeft }),
              many: t('app.homeDeckGameTrialDayMany', { n: access.trialDaysLeft }),
            }),
          })}
          <Glyph size={12}>→</Glyph>
        </a>
      ) : null}

      {/*
       * The day and the week, side by side from `md`.
       *
       * On a phone they are stacked because only one of them can be on screen at a time, and the
       * day has to be the one: at 7am the standings are not what gets anyone off the sofa. A
       * laptop has room for both, and then the order stops being a ranking — the board beside the
       * task is the race made visible while the task is being done, which is the whole argument
       * for having a board at all.
       */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        <section className="min-w-0 flex-1">
          {/* The kicker and, opposite it, how much of today is in: «1/3» is a score, and a
              score is what this format runs on. */}
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="eyebrow">{t('app.marathonTasksToday')}</h2>
            {tasks.length > 0 ? (
              <span className="numeral tabular text-[13px] text-muted-2">
                {formatNumber(locale, delivered)}/{formatNumber(locale, tasks.length)}
              </span>
            ) : null}
          </div>
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
            <div className="mt-2 flex flex-col" aria-busy={sending}>
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
        </section>

        {/*
         * The week, as far as the top of it. One way on from here, not two: «Мои баллы» is the
         * breakdown of an answer this table already gives, so it lives on the full board.
         *
         * The prize sits beside the week's number as the one filled pill on the screen — it is
         * what the table is for, and the leader's filled circle under it is drawn in the same
         * colour for the same reason.
         */}
        <section className="md:w-80 md:shrink-0">
          <div className="flex items-center justify-between gap-3">
            <h2 className="eyebrow shrink-0">
              {t('app.marathonWeek', { n: formatNumber(locale, marathon.week) })}
            </h2>
            {marathon.prize ? (
              <Pill tone="course-fill">
                {t('app.marathonPrizeShort')} · {marathon.prize}
              </Pill>
            ) : null}
          </div>
          {topScores.length > 0 ? (
            <ol className="mt-3 flex flex-col">
              {topScores.map((row) => (
                <li key={row.entryId}>
                  <BoardRow row={row} />
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-[13px] text-muted">{t('app.marathonBoardEmpty')}</p>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 -ml-4.5"
            onClick={() => navigate('/marathon/board')}
            iconRight={<Glyph size={12}>→</Glyph>}
          >
            {t('app.marathonBoardAll')}
          </Button>
        </section>
      </div>
    </div>,
    [...teammateNames.values()],
  );
}
