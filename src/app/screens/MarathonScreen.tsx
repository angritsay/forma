/**
 * The club (the second tab), take two: **a card game, almost no words.**
 *
 * Owner, on the version this replaces (#230): «Визуально мусорно и не структурировано и много
 * текстов, нет элемента игры». Her screenshots showed why: a header «Day 7 · week 1 of 522» (a
 * 3650-day round makes the total meaningless), a centred Solo/Duo control on a row of its own,
 * the unpaired duo card saying the same thing in two paragraphs plus a raw URL, the task as a
 * heading + paragraph + field + link, a full-width prize bar, «Nobody has scored yet», «Full
 * board →», and on a rest day a huge «Nothing set for today». Everything was prose; nothing was
 * a game. Her choices for the replacement: a **card game**; the title and **two lines** of task
 * text; the Solo/Duo switch **small, in the HUD row**.
 *
 * Top to bottom, every piece a number, a mark or a card:
 *
 *   1. **The HUD** (`ClubHud`): `[avatar] 58 · [соло|дуо] · 🔥 4` — my avatar and the week's
 *      points, the mode as two small chips (only when a duo round exists), the streak pill
 *      (`ClubStreak`, compact, with its at-risk pulse and milestones sheet). Under it the
 *      **week track** (`WeekTrack`): seven tiles `пн … вс` from `my_club_days` and today.
 *   2. **The card** (`ClubCard`): dealt face down on the first look of the day (`isSealed`,
 *      remembered in `clubMemory`), a turn to the face — eyebrow «Задание дня · до 22:00», the
 *      «+12» pill, the title, two lines of the coach's text with «ещё», one control. In duo mode
 *      the face also carries **the pair's row** (`DuoRow`) between the title and the control:
 *      two small avatars with today's mark on each, the rule as numbers, «Напомнить»; leaving
 *      and the explanation live in a «···» sheet. No partner yet: a dashed «?», one line, one
 *      «Позвать друга» that shares the link directly. A rest day is the face reading «Отдых»
 *      (with the pair's row still on it).
 *   3. **The podium** (`ClubPodium`): the top three as 2 · 1 · 3 columns, the leader on the warm
 *      gradient, the prize as the caption above («Приз недели — час с тренером»), my own line
 *      under it when I am not up there («#5 · Ты · 58», «↑2», «до Димы — 2 балла»), «Вся
 *      таблица →» as a ghost.
 *   4. `ClubWinner`, `ClubWeekRecap`, `ClubInviteCard` — unchanged.
 *
 * **A failure is said, never drawn as a quiet state.** The day that did not load is an
 * `EmptyState` with «Повторить», not the «Отдых» face; the board that did not load is the same,
 * not three dashed steps. Both read as facts («rest today», «nobody scored»), and both facts were
 * false (audit item 4). On the course's trial week the HUD counts the days left.
 *
 * From `md` the card sits left and the podium right: the race beside the task is the whole
 * argument for having a board on the same tab.
 *
 * What did not change: the rules. The club is style B of the third palette (global.css header)
 * — the crossroads gradient as a glow behind the screen (`.club-aurora`), the warm half of it as
 * the material of every action and rim, ink on it, **no neon** (design/CHANGELOG.md §17,
 * `club-no-neon.test.ts`); `.text-gradient` on large type only. Nothing on the screen is an
 * invented number: the points, the places, the days, the deadline all come back from the API.
 * The small wins are as they were — haptic, confetti and «+12» rising from the button
 * (`ClubCelebrate`), the board reloading under it with «↑2» measured against the last visit,
 * the streak's milestones, Sunday's recap and «Поделиться».
 *
 * **The tab has a second state, and it is a screen rather than a closed door.** Somebody who is
 * not in the club gets the selling screen the owner drew (`ClubPitch`).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { PROOFS_BUCKET, proofMediaPath, sendProof } from '@/lib/api/marathon';
import { uploadMedia } from '@/lib/api/storage';
import type { MarathonTodayTask, ProofInput } from '@/lib/api/types';
import { prefersReducedMotion } from '@/lib/ui/motion';
import { courseTileVars, GAME_TILE } from '@/lib/ui/tile';
import { toLocalDateIso } from '@/lib/util/dates';
import { downscaleImage, extensionFor, isVideoFile, MAX_VIDEO_BYTES } from '@/lib/util/image';
import {
  MAX_IMAGE_BYTES,
  proofErrorKey,
  proofErrorKind,
  sameFile,
} from '@/app/features/marathon/proofError';
import { useT } from '@/app/hooks/useT';
import { ScreenLoader } from '@/app/components/ScreenLoader';
import { celebrate } from '@/app/features/marathon/ClubCelebrate';
import { ClubCard } from '@/app/features/marathon/ClubCard';
import { ClubHud } from '@/app/features/marathon/ClubHud';
import { ClubInviteCard } from '@/app/features/marathon/ClubInviteCard';
import { ClubPitch } from '@/app/features/marathon/ClubPitch';
import { PurchasesUnknown } from '@/app/components/PurchasesUnknown';
import { ClubPodium } from '@/app/features/marathon/ClubPodium';
import { ClubShare } from '@/app/features/marathon/ClubShare';
import { ClubStreak, useClubDays } from '@/app/features/marathon/ClubStreak';
import { ClubWeekRecap } from '@/app/features/marathon/ClubWeekRecap';
import { ClubWinner } from '@/app/features/marathon/ClubWinner';
import { DuoRow } from '@/app/features/marathon/DuoRow';
import { WeekTrack } from '@/app/features/marathon/WeekTrack';
import {
  isOpened,
  markOpened,
  readClubMemory,
  rememberBoard,
} from '@/app/features/marathon/clubMemory';
import { boardPath, clubFor, clubModeOf, type ClubMode } from '@/app/features/marathon/clubMode';
import { clubPrize } from '@/app/features/marathon/prize';
import {
  boardDelta,
  boardGap,
  weekStandings,
  type BoardSeen,
} from '@/app/features/marathon/standings';
import { clubStreak } from '@/app/features/marathon/streak';
import { isSealed } from '@/app/features/marathon/taskSeal';
import { useClubMemory } from '@/app/features/marathon/useClubMemory';
import {
  useMarathonDay,
  useMarathonScores,
  useMyMarathons,
} from '@/app/features/marathon/useMarathon';
import { purchasesUnknown, useSession } from '@/app/store/session';
import { gameAccess } from '@/app/features/marathon/gameAccess';
import { GAME_REQUIRES_SUBSCRIPTION } from '@content/site/plans';

/** The card's frame while the day loads: the same proportion, so nothing jumps when it lands. */
function DaySkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton rounded="card" className="aspect-[4/5] w-full md:aspect-auto md:h-[440px]" />
    </div>
  );
}

export default function MarathonScreen() {
  const tr = useT();
  const { t, locale } = tr;
  const subscription = useSession((s) => s.subscription);
  const newestPurchaseAt = useSession((s) => s.newestPurchaseAt);
  const unknownPurchases = useSession(purchasesUnknown);
  const navigate = useNavigate();
  const toast = useToast();
  const {
    soloClub,
    duoClub,
    marathon: anyRound,
    status: marathonStatus,
    error,
    reload: reloadMarathon,
  } = useMyMarathons();

  /*
   * Соло или дуо — два вида одного клуба, и переключатель между ними это и есть «вторая вкладка»
   * из задания владельца. Подписка одна на оба, поэтому это переключатель внутри экрана, а не
   * вторая вкладка в нижней панели: выбирают не продукт, а режим. Начинаем с соло: он есть у всех
   * и всегда. Дуо-круга может не быть вовсе — до 0033; тогда переключателя нет.
   */
  // `?mode=duo` — сюда ведёт принятое приглашение в пару (DuoInviteScreen).
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<ClubMode>(() => clubModeOf(searchParams.get('mode')));
  const duo = mode === 'duo' && duoClub !== null;
  /* Закрытый круг, который тренер ведёт руками, клубом не является — он приезжает в `anyRound`. */
  const marathon = clubFor({ soloClub, duoClub, marathon: anyRound }, mode);
  const dayIndex = marathon?.dayIndex ?? 0;
  const { data: tasks, status, error: dayError, reload } = useMarathonDay(marathon, dayIndex);
  const {
    data: scores,
    status: scoresStatus,
    reload: reloadScores,
  } = useMarathonScores(marathon?.id ?? null, marathon?.week ?? null);
  const [sending, setSending] = useState(false);

  /*
   * The member's own clock, fixed per mount: the streak, the week track, the recap's weekday and
   * the seal are all «today» questions, and a render at midnight must not move any of them under
   * the reader. `daysVersion` re-reads `my_club_days()` after a proof, so the pill, the track and
   * the recap move with the board instead of waiting for the tab to be mounted again.
   */
  const [today] = useState(() => toLocalDateIso(new Date()));
  const [weekday] = useState(() => new Date().getDay());
  const [daysVersion, setDaysVersion] = useState(0);
  const days = useClubDays(today, daysVersion);
  const streak = days ? clubStreak(days, today) : 0;
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);

  /* What this phone remembers about this account (`clubMemory.ts`). */
  const { memory, update, email } = useClubMemory();

  /*
   * The week's table. The arithmetic is in `standings.ts` and unit-tested there — ties, an empty
   * week, a member with no row and a member on nothing are all cases the podium would otherwise
   * be the only place to get wrong.
   */
  const standings = useMemo(
    () => weekStandings(scores, marathon?.memberId ?? null),
    [scores, marathon?.memberId],
  );
  const gap = useMemo(() => boardGap(scores), [scores]);

  /*
   * «↑2»: the place now against the place the last time this mode was on screen. The baseline is
   * read once per visit (per account and mode) and the current place is written back whenever
   * the board arrives, so the arrow is honest for the whole visit — after a proof it measures
   * against where the person *was* when they opened the tab, which is the move they made.
   */
  const seen = useMemo(() => readClubMemory(email).board[mode] ?? null, [email, mode]);
  const week = marathon?.week ?? null;
  const place = standings.place;
  const now = useMemo<BoardSeen | null>(
    () =>
      week !== null && place.kind !== 'missing'
        ? {
            rank: place.kind === 'ranked' ? place.rank : null,
            points: place.kind === 'ranked' ? place.points : 0,
            week,
          }
        : null,
    [week, place],
  );
  const rankDelta = now ? boardDelta(seen, now).rankDelta : null;
  useEffect(() => {
    if (scoresStatus !== 'ready' || !now) return;
    update((m) => rememberBoard(m, mode, now));
  }, [scoresStatus, now, mode, update]);

  /** Send a proof; says what failed and throws on, so `sendMedia` knows the row did not land. */
  const deliver = useCallback(
    async (
      taskId: string,
      proof: Omit<ProofInput, 'taskId' | 'memberId'>,
      anchor?: HTMLElement | null,
    ) => {
      if (!marathon) return;
      /* New, as against corrected or done again after a rejection: only a first proof celebrates. */
      const item = tasks.find((i) => i.task.id === taskId);
      const fresh = item !== undefined && item.mine === null;
      setSending(true);
      try {
        await sendProof({ ...proof, taskId, memberId: marathon.memberId });
        /*
         * The small win (`ClubCelebrate`): the haptic, the burst and the «+12» from where the
         * finger was. Only for a task that scores and only the first time — a corrected number or
         * a redo after the coach's rejection is the same points again, not new ones. Before the
         * reloads, while the button it rises from is still on the page.
         */
        if (fresh && item.task.rule !== 'none') {
          celebrate({ points: item.task.points, anchor });
        }
        reload();
        /*
         * And the board with it. Proof is counted the moment it is sent (0011_marathon.sql), so the
         * points are already different — a podium that sat still while the card ticked would read
         * as the score not counting.
         */
        reloadScores();
        setDaysVersion((v) => v + 1);
      } catch (e) {
        toast.show({ kind: 'error', title: t(proofErrorKey(proofErrorKind(e))) });
        // Thrown on so an upload that landed is remembered rather than repeated (`sendMedia`).
        throw e;
      } finally {
        setSending(false);
      }
    },
    [marathon, tasks, reload, reloadScores, t, toast],
  );
  // The card's own «Отправить»: the failure is already on screen, nothing more to do with it.
  const send = useCallback(
    (taskId: string, proof: Omit<ProofInput, 'taskId' | 'memberId'>, anchor?: HTMLElement | null) =>
      deliver(taskId, proof, anchor).catch(() => undefined),
    [deliver],
  );

  /*
   * Files already in the bucket, by task. A proof whose upload landed but whose row did not (the
   * signal dropped between the two) is sent again with the same reference when the same file is
   * picked again, instead of uploading the same bytes a second time.
   */
  const uploaded = useRef(
    new Map<string, { name: string; size: number; lastModified: number; ref: string }>(),
  );

  const sendMedia = useCallback(
    async (
      taskId: string,
      file: File,
      keep: Omit<ProofInput, 'taskId' | 'memberId'>,
      anchor?: HTMLElement | null,
    ) => {
      if (!marathon) return;
      /*
       * A photograph is shrunk first, through `lib/util/image` — `downscaleImage` degrades rather
       * than fails, so the upload still happens either way. **A clip is uploaded as picked**,
       * because a browser has no way to re-encode one, and is refused above `MAX_VIDEO_BYTES`
       * with a line saying what to do about it.
       *
       * The extension comes from the blob first and from `file.name` only as the fallback,
       * because after a re-encode the name is a lie. `keep` re-sends what the proof already said:
       * `sendProof` upserts the whole row, so a photo attached to a number would otherwise erase
       * the number.
       */
      const video = isVideoFile(file);
      if (video && file.size > MAX_VIDEO_BYTES) {
        toast.show({
          kind: 'error',
          title: t('app.marathonProofTooBig', { n: Math.round(MAX_VIDEO_BYTES / (1024 * 1024)) }),
        });
        return;
      }
      let ref: string;
      const kept = uploaded.current.get(taskId);
      if (kept && sameFile(file, kept)) {
        ref = kept.ref;
      } else {
        try {
          const blob = video ? file : await downscaleImage(file);
          if (!video && blob.size > MAX_IMAGE_BYTES) {
            toast.show({ kind: 'error', title: t('app.marathonProofTooLarge') });
            return;
          }
          const ext = extensionFor(blob, file.name.split('.').pop() || (video ? 'mp4' : 'jpg'));
          const path = proofMediaPath(marathon.id, marathon.memberId, taskId, ext);
          ref = await uploadMedia(PROOFS_BUCKET, path, blob);
          uploaded.current.set(taskId, {
            name: file.name,
            size: file.size,
            lastModified: file.lastModified,
            ref,
          });
        } catch (e) {
          toast.show({ kind: 'error', title: t(proofErrorKey(proofErrorKind(e))) });
          return;
        }
      }
      try {
        await deliver(taskId, { ...keep, mediaPath: ref }, anchor);
        uploaded.current.delete(taskId);
      } catch {
        /* `deliver` has said what went wrong; the upload stays remembered for the retry. */
      }
    },
    [marathon, deliver, t, toast],
  );

  /*
   * Every state of this screen is the same page: no head, no top bar — the tab bar names the
   * screen. `--course-tile` stays on the outer element so everything that reads the club's colour
   * takes it from one place, and the club's glow (`.club-aurora`) sits behind the whole page.
   */
  const page = (body: ReactNode) => (
    <div className="club-aurora-host" style={courseTileVars(GAME_TILE)}>
      <div className="club-aurora" aria-hidden="true" />
      <Screen contentClassName="pt-2">{body}</Screen>
    </div>
  );

  /*
   * The club is part of the subscription (content/site/plans.ts). The screen says so plainly and
   * offers the subscription rather than pretending the format does not exist.
   */
  const access = gameAccess({
    subscriptionLive: subscription?.isLive === true,
    newestPurchaseAt,
    now: Date.now(),
    gated: GAME_REQUIRES_SUBSCRIPTION,
  });

  /*
   * Whether the club is paid for could not be read: the pitch would sell the club to somebody
   * who may be in it. Said as that, with a retry (`purchasesUnknown`).
   */
  if (!access.allowed && unknownPurchases) {
    return page(<PurchasesUnknown variant="gradient" />);
  }

  if (!access.allowed) {
    return page(<ClubPitch locked />);
  }

  /* The mark, not a drawn-empty page that is swapped for the real one a moment later. */
  if (marathonStatus === 'loading') {
    return <ScreenLoader />;
  }

  if (marathonStatus === 'error') {
    return page(
      <EmptyState
        title={t('app.marathonErrorTitle')}
        description={
          error?.code === 'network' ? t('common.errorOffline') : t('common.errorGeneric')
        }
        action={
          <Button variant="gradient" size="lg" onClick={reloadMarathon}>
            {t('common.retry')}
          </Button>
        }
      />,
    );
  }

  /*
   * Paid for, or on the course's trial week, and not in a running round: the coach adds people by
   * hand, so there is no button that would put them in one. Same screen, without the price.
   */
  if (!marathon) {
    return page(<ClubPitch locked={false} />);
  }

  const closed = marathon.status === 'finished';
  const todayDone = tasks.length > 0 && tasks.every((i) => i.mine !== null && !i.mine.voidedAt);
  const myPlace = standings.place.kind === 'ranked' ? standings.place.rank : null;
  const myPoints = standings.place.kind === 'ranked' ? standings.place.points : 0;

  /* A pair formed or broken changes more than today's task: the board counts the pair's points
     together and `my_marathons()` hands back a new team — so all three reload. */
  const onPairChanged = () => {
    reload();
    reloadScores();
    reloadMarathon();
  };

  /* The pair's row for the card's face — duo mode only. */
  const duoRow = (item: MarathonTodayTask | null) =>
    duo ? <DuoRow item={item} onChanged={onPairChanged} /> : null;

  return page(
    <div className="flex flex-col gap-5 pt-3 pb-4">
      <ClubHud
        points={myPoints}
        mode={mode}
        onMode={setMode}
        hasDuo={duoClub !== null}
        streak={<ClubStreak days={days} today={today} compact />}
        trialDaysLeft={access.reason === 'trial' ? (access.trialDaysLeft ?? null) : null}
      />
      <WeekTrack days={days} today={today} />

      {/*
       * The card and the race, side by side from `md`. On a phone they are stacked because only
       * one of them can be on screen at a time, and the task has to be the one: at 7am the
       * standings are not what gets anyone off the sofa.
       */}
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
        <section className="min-w-0 flex-1" aria-busy={sending}>
          {dayIndex < 1 ? (
            <EmptyState
              title={t('app.marathonNotStarted')}
              description={t('app.marathonNotStartedBody')}
            />
          ) : status === 'loading' ? (
            <DaySkeleton />
          ) : status === 'error' ? (
            /* A failed load says so. It used to fall through to the empty list and read «Отдых»,
               and a member told today is a rest day loses the task and the streak to a network
               error (audit item 4). */
            <EmptyState
              className="py-6"
              title={t('app.clubDayError')}
              description={
                dayError?.code === 'network' ? t('common.errorOffline') : t('common.errorGeneric')
              }
              action={
                <Button variant="gradient" size="lg" onClick={reload}>
                  {t('common.retry')}
                </Button>
              }
            />
          ) : tasks.length === 0 ? (
            <ClubCard item={null} duo={duoRow(null)} />
          ) : (
            /* One card, because the club is one task a day. It stays a list because the table
               still lets a coach write two, and a screen that silently dropped the second would
               be worse than one that shows it. */
            <div className="flex flex-col gap-5">
              {tasks.map((item) => {
                const done = item.mine !== null && !item.mine.voidedAt;
                const title = (locale === 'en' && item.task.titleEn) || item.task.title;
                return (
                  <ClubCard
                    key={item.task.id}
                    item={item}
                    closed={closed}
                    sealed={isSealed({
                      done,
                      opened: isOpened(memory, item.task.id),
                      closed,
                      reducedMotion,
                    })}
                    onOpen={() => update((m) => markOpened(m, item.task.id, today))}
                    share={
                      <ClubShare
                        seed={item.task.id}
                        headline={title}
                        points={item.task.rule === 'none' ? null : item.task.points}
                        pointsMode="gain"
                        day={dayIndex}
                        streak={streak}
                        place={myPlace}
                      />
                    }
                    onSend={(proof, anchor) => send(item.task.id, proof, anchor)}
                    onSendMedia={(file, keep, anchor) =>
                      sendMedia(item.task.id, file, keep, anchor)
                    }
                    duo={duoRow(item)}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* 384px: wide enough for three podium columns beside the card without reading as a
            sidebar. */}
        <section className="flex flex-col gap-5 md:w-96 md:shrink-0">
          {/* The same honesty for the race: three dashed steps would say nobody has scored. */}
          {scoresStatus === 'error' ? (
            <EmptyState
              className="py-6"
              title={t('app.clubPodiumError')}
              description={t('common.errorGeneric')}
              action={
                <Button variant="ghost" size="md" onClick={reloadScores}>
                  {t('common.retry')}
                </Button>
              }
            />
          ) : (
            <ClubPodium
              standings={standings}
              delta={rankDelta}
              gap={gap}
              prize={clubPrize(tr, marathon.prize)}
              onAll={() => navigate(boardPath(duo ? 'duo' : 'solo'))}
            />
          )}
        </section>
      </div>

      {/* Плашка рисуется, только когда тренер кого-то объявил. */}
      <ClubWinner duo={duo} />

      {/* The week closed: Sunday once the task is done, Monday–Tuesday until the first new proof. */}
      {dayIndex >= 1 && status === 'ready' ? (
        <ClubWeekRecap
          marathon={marathon}
          todayDone={todayDone}
          streak={streak}
          weekday={weekday}
          version={daysVersion}
        />
      ) : null}

      {/* Today's task delivered: the moment to ask a friend along (0051). */}
      {dayIndex >= 1 && status === 'ready' && todayDone ? <ClubInviteCard /> : null}
    </div>,
  );
}
