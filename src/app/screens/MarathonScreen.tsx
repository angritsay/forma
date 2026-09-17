/**
 * The club (the second tab): today's tasks, and who is winning the week. **Those two and nothing
 * else** — «Там должно быть только задание и лидерборд», which is the owner reading a screen that
 * had accumulated sections and naming the two that survive.
 *
 * What went with that sentence was «Мои баллы»: a total the member cannot act on, one tap below a
 * table that already answers the only question a total is asked. The screen it lived on is deleted
 * and so is its route.
 *
 * It was reachable only through a card on the home deck, which made the format look like an
 * accessory to the course. It is a tab of its own now, and it holds the two halves of the club in
 * the order they are asked for: what is set for today and whether it is sent, then the short
 * table of the week under it — «топ 3 и где ты», the full board one tap further.
 *
 * The short table is three rows and then the member's own, which is the owner's own instruction:
 * «рейтинг этой недели (топ 3 и где ты)». It stood at five rows and no "you" for a while, and that
 * is a board that tells four people something and everybody else nothing.
 *
 * The table is short on purpose. At 7am on a mat the answer to "where am I in the standings" is
 * never what gets someone moving, so the day comes first; but a race nobody can see the score of
 * is not a race, and a link to it was not enough to make it one.
 *
 * **The tab has a second state, and it is a screen rather than a closed door.** Somebody who is
 * not in the club used to get an empty state and an icon. They now get the screen the owner drew
 * and sent as a picture — a row of photographs with the club's name across it, one orange pill
 * with the price on it, and her two paragraphs (`ClubPitch`). It is built without the head and
 * without a sticky footer, because neither is in the drawing.
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
import { downscaleImage, extensionFor } from '@/lib/util/image';
import { externalLinkProps } from '@/app/hooks/useExternalLink';
import { useT } from '@/app/hooks/useT';
import { BoardGap, BoardRow } from '@/app/features/marathon/BoardRow';
import { ClubPitch } from '@/app/features/marathon/ClubPitch';
import { GameHead } from '@/app/features/marathon/GameHead';
import { clubPrize } from '@/app/features/marathon/prize';
import { weekStandings } from '@/app/features/marathon/standings';
import { TaskCard } from '@/app/features/marathon/TaskCard';
import {
  useMarathonDay,
  useMarathonRoster,
  useMarathonScores,
  useMyMarathons,
} from '@/app/features/marathon/useMarathon';
import { subscribeHref } from '@/app/features/courses/courseMeta';
import { useSession } from '@/app/store/session';
import { gameAccess } from '@/app/features/marathon/gameAccess';
import { GAME_REQUIRES_SUBSCRIPTION } from '@content/site/plans';

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
  const tr = useT();
  const { t, locale } = tr;
  const subscription = useSession((s) => s.subscription);
  const newestPurchaseAt = useSession((s) => s.newestPurchaseAt);
  const navigate = useNavigate();
  const toast = useToast();
  const { marathon, status: marathonStatus, error, reload: reloadMarathon } = useMyMarathons();
  const dayIndex = marathon?.dayIndex ?? 0;
  const { data: tasks, status, reload } = useMarathonDay(marathon, dayIndex);
  const { data: roster } = useMarathonRoster(marathon?.id ?? null);
  const { data: scores, reload: reloadScores } = useMarathonScores(
    marathon?.id ?? null,
    marathon?.week ?? null,
  );
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

  /*
   * «Топ 3 и где ты». The arithmetic is in `standings.ts` and unit-tested there — ties, an empty
   * week, a member with no row and a member on nothing are all cases this screen would otherwise
   * be the only place to get wrong, and the wrong answer («0 место», or a place counted over the
   * three rows on screen instead of over the week) is not one a screenshot catches.
   */
  const standings = useMemo(
    () => weekStandings(scores, marathon?.memberId ?? null),
    [scores, marathon?.memberId],
  );

  const send = useCallback(
    async (taskId: string, proof: Omit<ProofInput, 'taskId' | 'memberId'>) => {
      if (!marathon) return;
      setSending(true);
      try {
        await sendProof({ ...proof, taskId, memberId: marathon.memberId });
        reload();
        /*
         * And the board with it. Proof is counted the moment it is sent (0011_marathon.sql), so the
         * points are already different — leaving the table alone until the tab is next mounted made
         * the card tick and the standings sit still, which on a screen whose second half is now
         * «где ты» reads as the score not counting.
         */
        reloadScores();
      } catch {
        toast.show({ kind: 'error', title: t('common.errorGeneric') });
      } finally {
        setSending(false);
      }
    },
    [marathon, reload, reloadScores, t, toast],
  );

  const sendMedia = useCallback(
    async (taskId: string, file: File) => {
      if (!marathon) return;
      /*
       * Shrunk first, through `lib/util/image`. This path used
       * to upload whatever the picker handed it: a 3MB phone photograph over mobile data to prove
       * a task the coach reads in two seconds, and in demo mode that same 3MB base64'd into
       * `localStorage` beside the rest of the demo database. `downscaleImage` degrades rather than
       * fails — a decoder that will not open the file returns it untouched — so the upload still
       * happens either way.
       *
       * The extension comes from the blob first and from `file.name` only as the fallback, because
       * after a re-encode the name is a lie: a picked `.png` leaves here as JPEG bytes, and the
       * object was being stored as `.png`. `extensionFor` knows the five types a re-encode can
       * produce; anything else keeps whatever the picked file called itself, and `proofMediaPath`
       * strips it to `[a-z0-9]`.
       */
      try {
        const blob = await downscaleImage(file);
        const ext = extensionFor(blob, file.name.split('.').pop() || 'jpg');
        const path = proofMediaPath(marathon.id, marathon.memberId, taskId, ext);
        const ref = await uploadMedia(PROOFS_BUCKET, path, blob);
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
  const page = (
    head: MyMarathon | null,
    body: ReactNode,
    partners?: string[],
    footer?: ReactNode,
  ) => (
    <div style={courseTileVars(GAME_TILE)}>
      <Screen contentClassName="pt-5" footer={footer}>
        <GameHead marathon={head} partners={partners} />
        {body}
      </Screen>
    </div>
  );

  /* The tab's other face: no head, no footer, the photographs starting near the top of the page. */
  const pitch = (body: ReactNode) => (
    <div style={courseTileVars(GAME_TILE)}>
      <Screen contentClassName="pt-3">{body}</Screen>
    </div>
  );

  /*
   * The club is part of the subscription (content/site/plans.ts). The screen says so plainly and
   * offers the subscription rather than pretending the format does not exist — somebody who got
   * here tapped a tab that told them what the club is, and the answer to "can I play" is a price,
   * not a locked door.
   */
  const access = gameAccess({
    subscriptionLive: subscription?.isLive === true,
    newestPurchaseAt,
    now: Date.now(),
    gated: GAME_REQUIRES_SUBSCRIPTION,
  });

  /*
   * The selling screen is the owner's mockup end to end, so it has no head and no sticky footer:
   * the club's name is set over the photographs and the join pill sits in the flow under them. A
   * ring counting a club this person is not in would be the one thing on the screen with nothing
   * to count, and a sticky CTA would cover the copy that explains what is being bought.
   */
  if (!access.allowed) {
    return pitch(<ClubPitch locked />);
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

  /*
   * Paid for, or on the course's trial week, and not in a running round: the coach forms the
   * teams by hand, so there is no button that would put them in one. Same screen, without the
   * price — quoting a subscription to somebody who is already paying for it is the kind of thing
   * that makes a product look like it does not know who it is talking to.
   */
  if (!marathon) {
    return pitch(<ClubPitch locked={false} />);
  }

  const closed = marathon.status === 'finished';
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
          className="control-label inline-flex h-8 items-center gap-2 self-start rounded-pill border border-course/60 px-3.5 text-[13px] text-course transition-opacity duration-150 ease-(--ease-out) hover:opacity-80"
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
        {/* 384px rather than 320, and it is a proportion rather than a fix now: the prize is still
            the widest thing in this column, but sentence case brought it to 304px, so 320 would
            hold it with 16px to spare. A column half again as wide as the pill keeps the table
            from reading as a narrow sidebar beside the day. */}
        <section className="md:w-96 md:shrink-0">
          {/*
           * The kicker and the prize are stacked, not opposite each other. They shared a line
           * while the prize was two words; «Час с тренером и создателем Forma» is eleven, and side
           * by side there is no width at which both survive on a phone.
           */}
          <div className="flex flex-col items-start gap-2">
            <h2 className="eyebrow">
              {t('app.marathonWeek', { n: formatNumber(locale, marathon.week) })}
            </h2>
            {/*
             * The prize is the one filled pill on the screen — what the table is for. It is the
             * shared `Pill` again: it used to need a wrapping twin (`PrizePill`), because at 10px
             * tracked capitals the string measured 313px against a 327px column at 375 and
             * ellipsised to «…СОЗДАТЕЛЕМ FO…» there. Sentence case at 13px measures 304px in the
             * same 327, so the exception had nothing left to protect and is gone. A prize the
             * coach types longer than the standing one will ellipsise, like every other pill.
             */}
            <Pill tone="course-fill">
              {t('app.marathonPrizeShort')} · {clubPrize(tr, marathon.prize)}
            </Pill>
          </div>
          {/*
           * «Топ 3 и где ты» — three rows, then the member's own, which is the shape a standings
           * table has had since long before there were screens. Five rows used to stand here and
           * they answered only the first half: in sixth place you opened the club and read four
           * names you already knew and nothing whatsoever about your own week.
           *
           * The row is pulled down only when it is not already one of the three; up there the
           * «Ты» tag on the row marks it instead, because the same pair printed twice in nine
           * rows of table is the reader wondering whether the board is broken.
           */}
          {standings.top.length > 0 ? (
            <ol className="mt-3 flex flex-col">
              {standings.top.map(({ row, rank }) => (
                <li key={row.entryId}>
                  <BoardRow row={row} rank={rank} />
                </li>
              ))}
              {standings.mine ? (
                <>
                  {standings.skipped > 0 ? (
                    <li>
                      <BoardGap hidden={standings.skipped} />
                    </li>
                  ) : null}
                  <li>
                    <BoardRow row={standings.mine.row} rank={standings.mine.rank} />
                  </li>
                </>
              ) : null}
            </ol>
          ) : (
            <p className="mt-3 text-[13px] text-muted">{t('app.marathonBoardEmpty')}</p>
          )}

          {/*
           * The two answers to «где ты» that are not a number. Zero points is not a place — the
           * pulled row already draws a dash where the place would be, and this says why. A member
           * with no row at all is a different thing again: the coach has them in the club, the
           * week's table simply has not been built around them yet.
           *
           * Both only when there is a table to be outside of. On a week nobody has scored in,
           * «Пока никто не набрал баллов» has already said it, and «Ты ещё без баллов» under it is
           * the screen telling the same person the same thing twice.
           */}
          {standings.top.length === 0 ? null : standings.place.kind === 'unscored' ? (
            <p className="mt-3 text-[13px] text-muted">{t('app.marathonBoardYouUnscored')}</p>
          ) : standings.place.kind === 'missing' ? (
            <p className="mt-3 text-[13px] text-muted">{t('app.marathonBoardYouMissing')}</p>
          ) : null}
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
