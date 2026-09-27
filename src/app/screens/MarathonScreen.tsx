/**
 * The club (the second tab). **Three things and nothing else** — «Только задание, кнопка и
 * лидерборд», which is the owner reading a screen that had accumulated furniture again and naming
 * what survives: today's task, the one control that delivers it, and the week's table.
 *
 * What went with that sentence, in the order it had piled up:
 *
 *   • the «Задания дня» kicker and the «1/3» counter beside it — over a list of one that counter
 *     reads «0/1», which is a worse way of saying «не сделано» than the card already says it;
 *   • the «Пробная неделя · осталось 3 дня» pill, a sales line on a screen that is not for selling;
 *   • the «Неделя 1» kicker over the table;
 *   • «Ты ещё без баллов на этой неделе» and «Тебя пока нет в таблице» — the row draws a dash where
 *     the place would be, and the dash says it.
 *
 * **The head went the same way, later and on its own instruction: «шапку с кольцом убери».** It was
 * the day as a ring with «День 10 из 14» beside it, and it was this tab's title in the idiom the
 * other three use. Her mockups have no equivalent — the picture the coach attached to today's task
 * is the first thing on the page — and the trade is the right one: the ring reported a number
 * nobody acts on, directly above the one thing on the screen that is asking to be done today. The
 * day is still named inside the round's own screens and on the full table.
 *
 * Two things stayed: the prize pill — the table exists to be won, and one short pill is what it is
 * won for — and the single link to the full table, which is the only way the board screen is
 * reachable.
 *
 * **Nobody has a partner** in the solo club. «Никакого напарника в клубе быть не должно. Каждый сам
 * за себя.» The club is `team_size = 1`, so there is no roster to read here and no line on the
 * card about where somebody else has got to. Each member is their own row. The duo club (0033) is
 * the one place a partner exists, and there the card does say where they are (`ClubPartnerLine`).
 *
 * The table is short on purpose. At 7am on a mat the answer to "where am I in the standings" is
 * never what gets someone moving, so the task comes first; but a race nobody can see the score of
 * is not a race, and a link to it was not enough to make it one.
 *
 * **The tab has a second state, and it is a screen rather than a closed door.** Somebody who is
 * not in the club gets the screen the owner drew
 * and sent as a picture — a row of photographs with the club's name across it, one orange pill
 * with the price on it, and her two paragraphs (`ClubPitch`). It is built without a sticky footer,
 * because there is none in the drawing.
 *
 * **The screen is drawn in the language of the owner's prototype** (`design/ui_kits/app-v2`,
 * «Челлендж»), after she called the previous version «вообще мимо», and then to the order she gave
 * off her Figma mockups: the coach's picture, the task's name, its text, the control that delivers
 * it, and the board — which ends on your own row between its two neighbours.
 *
 * The colour is still the brandbook's own rule: «один экран — один цвет, и он приходит от
 * программы». The club's is `GAME_TILE`; `--course-tile` is set once around the whole screen, so
 * the pills read the same variable.
 *
 * **The club is style B of the third palette** (global.css header) — owner: «давай градиент для
 * клуба сделаем, всё остальное как в стиле а». So this tab alone wears the crossroads gradient: a
 * soft glow behind the screen (`.club-aurora`), the streak's rim and its day dots (`ClubStreak`),
 * and the key words of the pitch and of the task's title as `.text-gradient`, large type only.
 * **No neon on the club's screens** (design/CHANGELOG.md §17): the task's button, «Вступить», the
 * retry and the prize pill are the warm half of the gradient under ink, the leader's circle too,
 * and today's dot on the streak is orange. The neon is the rest of the app's main action; the
 * club's is its own colour.
 *
 * ## The week as a game (2026-09-27)
 *
 * Owner: «геймифицировать… регулярная подпитка дофамином… желание зайти и узнать новое задание,
 * поучаствовать, поделиться». The three things are still the three things; what changed is that
 * each of them now has a moment attached, and every moment is made of numbers the API already
 * returned — nothing on this screen is invented for effect:
 *
 *   - **morning** — the day named (`ClubDay`: «День 10 · неделя 2 из 2 · до 22:00») and the task
 *     sealed until the first tap (`TaskCard`, `isSealed`, remembered in `clubMemory`);
 *   - **doing it** — on a new proof, haptic + confetti + «+12» rising from the button
 *     (`ClubCelebrate`), the board reloading under it with «↑1» on your row and «До Димы — 5
 *     баллов» beneath the table (`boardDelta`, `boardGap`);
 *   - **the partner** — in the duo club, where they have got to today (`ClubPartnerLine`);
 *   - **the evening** — the streak at risk after 18:00 (`ClubStreak`), with its milestones;
 *   - **Sunday** — the week's recap and a «Поделиться» (`ClubWeekRecap`, `ClubShare`), the same
 *     six story designs the workout summary has, with the club's own facts on them.
 *
 * All the client keeps for this is in `localStorage`, per email (`clubMemory.ts`): which envelope
 * was opened, where you were last time, which confetti already fell.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { PROOFS_BUCKET, proofMediaPath, sendProof } from '@/lib/api/marathon';
import { uploadMedia } from '@/lib/api/storage';
import type { ClubDuoStatus, ProofInput } from '@/lib/api/types';
import { prefersReducedMotion } from '@/lib/ui/motion';
import { courseTileVars, GAME_TILE } from '@/lib/ui/tile';
import { toLocalDateIso } from '@/lib/util/dates';
import { downscaleImage, extensionFor, isVideoFile, MAX_VIDEO_BYTES } from '@/lib/util/image';
import { useT } from '@/app/hooks/useT';
import { ScreenLoader } from '@/app/components/ScreenLoader';
import { BoardGap, BoardRow } from '@/app/features/marathon/BoardRow';
import { celebrate } from '@/app/features/marathon/ClubCelebrate';
import { ClubDay } from '@/app/features/marathon/ClubDay';
import { ClubDuoPair } from '@/app/features/marathon/ClubDuoPair';
import { ClubInviteCard } from '@/app/features/marathon/ClubInviteCard';
import { ClubPartnerLine } from '@/app/features/marathon/ClubPartnerLine';
import { ClubPitch } from '@/app/features/marathon/ClubPitch';
import { ClubShare } from '@/app/features/marathon/ClubShare';
import { ClubStreak, useClubDays } from '@/app/features/marathon/ClubStreak';
import { ClubWeekRecap } from '@/app/features/marathon/ClubWeekRecap';
import { ClubWinner } from '@/app/features/marathon/ClubWinner';
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
import { TaskCard } from '@/app/features/marathon/TaskCard';
import { isSealed } from '@/app/features/marathon/taskSeal';
import { useClubMemory } from '@/app/features/marathon/useClubMemory';
import {
  useMarathonDay,
  useMarathonScores,
  useMyMarathons,
} from '@/app/features/marathon/useMarathon';
import { pointsWord } from '@/app/features/share/story/data';
import { useSession } from '@/app/store/session';
import { gameAccess } from '@/app/features/marathon/gameAccess';
import { GAME_REQUIRES_SUBSCRIPTION } from '@content/site/plans';

function DaySkeleton() {
  return (
    <div className="flex flex-col gap-6 py-4" aria-hidden="true">
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
   * из задания владельца. Подписка одна на оба («подписка единая на оба клуба, поэтому все
   * пользователи могут участвовать как в соло-режиме, так и дуо»), поэтому это переключатель
   * внутри экрана, а не вторая вкладка в нижней панели: выбирают не продукт, а режим.
   *
   * Начинаем с соло. Он есть у всех и всегда, а дуо на первой неделе — это ещё и баннер «пары
   * пока нет»: открывать вкладку клуба на нём значило бы встречать человека сообщением о том,
   * чего у него нет.
   *
   * Дуо-круга может не быть вовсе — до того, как применена 0033. Тогда переключателя нет и экран
   * ровно такой, каким был; это не поломка, а состояние базы.
   */
  // `?mode=duo` — сюда ведёт принятое приглашение в пару (DuoInviteScreen).
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<ClubMode>(() => clubModeOf(searchParams.get('mode')));
  const duo = mode === 'duo' && duoClub !== null;
  /* Закрытый круг, который тренер ведёт руками, клубом не является — он приезжает в `anyRound`. */
  const marathon = clubFor({ soloClub, duoClub, marathon: anyRound }, mode);
  const dayIndex = marathon?.dayIndex ?? 0;
  const { data: tasks, status, reload } = useMarathonDay(marathon, dayIndex);
  const {
    data: scores,
    status: scoresStatus,
    reload: reloadScores,
  } = useMarathonScores(marathon?.id ?? null, marathon?.week ?? null);
  const [sending, setSending] = useState(false);

  /*
   * The member's own clock, fixed per mount: the streak, the recap's weekday and the seal are all
   * «today» questions, and a render at midnight must not move any of them under the reader.
   * `daysVersion` re-reads `my_club_days()` after a proof, so the pill and the recap move with
   * the board instead of waiting for the tab to be mounted again.
   */
  const [today] = useState(() => toLocalDateIso(new Date()));
  const [weekday] = useState(() => new Date().getDay());
  const [daysVersion, setDaysVersion] = useState(0);
  const days = useClubDays(today, daysVersion);
  const streak = days ? clubStreak(days, today) : 0;
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);

  /* What this phone remembers about this account (`clubMemory.ts`). */
  const { memory, update, email } = useClubMemory();
  /* The duo pair, read once by `ClubDuoPair` and shared with the task card. */
  const [duoStatus, setDuoStatus] = useState<ClubDuoStatus | null>(null);

  /*
   * The week's table. The arithmetic is in `standings.ts` and unit-tested there — ties, an empty
   * week, a member with no row and a member on nothing are all cases this screen would otherwise
   * be the only place to get wrong, and the wrong answer («0 место», or a place counted over the
   * three rows on screen instead of over the week) is not one a screenshot catches.
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

  const send = useCallback(
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
         * points are already different — leaving the table alone until the tab is next mounted made
         * the card tick and the standings sit still, which on a screen whose second half is now
         * «где ты» reads as the score not counting.
         */
        reloadScores();
        setDaysVersion((v) => v + 1);
      } catch {
        toast.show({ kind: 'error', title: t('common.errorGeneric') });
      } finally {
        setSending(false);
      }
    },
    [marathon, tasks, reload, reloadScores, t, toast],
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
       * A photograph is shrunk first, through `lib/util/image`. This path used to upload whatever
       * the picker handed it: a 3MB phone photograph over mobile data to prove a task the coach
       * reads in two seconds, and in demo mode that same 3MB base64'd into `localStorage` beside
       * the rest of the demo database. `downscaleImage` degrades rather than fails — a decoder
       * that will not open the file returns it untouched — so the upload still happens either way.
       *
       * **A clip is uploaded as picked**, because a browser has no way to re-encode one, and is
       * refused above `MAX_VIDEO_BYTES` with a line saying what to do about it. Silently uploading
       * 90MB over mobile data is not a kindness.
       *
       * The extension comes from the blob first and from `file.name` only as the fallback, because
       * after a re-encode the name is a lie: a picked `.png` leaves here as JPEG bytes, and the
       * object was being stored as `.png`. `extensionFor` knows the types a re-encode can produce
       * plus the three video types stored as picked; anything else keeps whatever the file called
       * itself, and `proofMediaPath` strips it to `[a-z0-9]`.
       *
       * `keep` re-sends what the proof already said: `sendProof` upserts the whole row, so a photo
       * attached to a number would otherwise erase the number.
       */
      const video = isVideoFile(file);
      if (video && file.size > MAX_VIDEO_BYTES) {
        toast.show({
          kind: 'error',
          title: t('app.marathonProofTooBig', { n: Math.round(MAX_VIDEO_BYTES / (1024 * 1024)) }),
        });
        return;
      }
      try {
        const blob = video ? file : await downscaleImage(file);
        const ext = extensionFor(blob, file.name.split('.').pop() || (video ? 'mp4' : 'jpg'));
        const path = proofMediaPath(marathon.id, marathon.memberId, taskId, ext);
        const ref = await uploadMedia(PROOFS_BUCKET, path, blob);
        await send(taskId, { ...keep, mediaPath: ref }, anchor);
      } catch {
        toast.show({ kind: 'error', title: t('common.errorGeneric') });
      }
    },
    [marathon, send, t, toast],
  );

  /*
   * Every state of this screen is the same page, and it now opens on its content.
   *
   * **The head is gone, on the owner's word: «шапку с кольцом убери».** It was the day as a ring
   * with «День 10 из 14» beside it, and it was the screen's title in the same idiom as the other
   * three tabs. Her mockups have no equivalent — the picture the coach attached is the first thing
   * on the page — and she is right about the trade: the ring reported a number nobody acts on,
   * directly above the one thing on the tab that is asking to be done today. The day is still in
   * the round's own screens and in the full table.
   *
   * There is no top bar either; the tab bar names the screen. `--course-tile` stays on the outer
   * element so everything that reads the club's colour takes it from one place, and the club's
   * glow (`.club-aurora`) sits behind the whole page.
   *
   * **One thing did come back up there, and it is not a head.** The owner asked for the streak —
   * «показывать, сколько дней подряд ты выполняешь упражнения» — «в том же месте, как у нас это
   * сделано на курсах», which is the top right. It is one pill and it draws nothing when the
   * streak is zero, so the objection that took the ring away does not apply to it: it reports a
   * number the person made, rather than a number the calendar made. It now sits at the right end
   * of the day's line (`ClubDay`) — one quiet 13px row, still not a head.
   */
  const page = (body: ReactNode) => (
    <div className="club-aurora-host" style={courseTileVars(GAME_TILE)}>
      <div className="club-aurora" aria-hidden="true" />
      <Screen contentClassName="pt-2">
        <ClubDay
          marathon={marathon}
          dueTime={tasks[0]?.task.dueTime ?? null}
          streak={<ClubStreak days={days} today={today} />}
        />
        {/*
         * Над заданием дня, а не под ним: объявление — это про прошлую неделю, и оно закрывает её
         * прежде, чем человек берётся за сегодняшнее. Своего победителя тут нет — плашка рисуется,
         * только когда тренер кого-то объявил.
         */}
        <ClubWinner duo={duo} />
        {body}
      </Screen>
    </div>
  );

  /* The tab's other face: no head, no footer, the photographs starting near the top of the page. */
  const pitch = (body: ReactNode) => (
    <div className="club-aurora-host" style={courseTileVars(GAME_TILE)}>
      <div className="club-aurora" aria-hidden="true" />
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

  /*
   * The mark, not a drawn-empty page. That rendered the whole screen with nothing in it — a «?»
   * where the day number went, the generic title, an empty card — and then swapped it for the real
   * one a moment later, which is the jerk the owner reported.
   */
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
   * hand, so there is no button that would put them in one. Same screen, without the
   * price — quoting a subscription to somebody who is already paying for it is the kind of thing
   * that makes a product look like it does not know who it is talking to.
   */
  if (!marathon) {
    return pitch(<ClubPitch locked={false} />);
  }

  const closed = marathon.status === 'finished';
  const todayDone = tasks.length > 0 && tasks.every((i) => i.mine !== null && !i.mine.voidedAt);
  const myPlace = standings.place.kind === 'ranked' ? standings.place.rank : null;

  const rowDelta = (isMine: boolean) => (isMine ? rankDelta : null);

  return page(
    <div className="flex flex-col gap-6 pt-5 pb-4">
      {/*
       * Переключатель режима — над всем остальным, потому что он меняет всё остальное: задание,
       * доску и то, с кем ты его делаешь. Рисуется, только когда дуо-круг заведён.
       */}
      {duoClub ? (
        <SegmentedControl<'solo' | 'duo'>
          /*
           * `self-center` — по решению владельца: «переключатель сделай по центру».
           *
           * Без него рамка уезжала во всю ширину, а «Соло | Дуо» жались к левому краю: в колонке
           * `align-items: stretch` растягивает `inline-flex` коробку, но не ячейки — те остаются
           * шириной своих подписей. Та же ловушка уже описана в `BookScreen`, там она решена
           * `self-start`; здесь — по центру.
           */
          className="self-center"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'solo', label: t('app.clubTabSolo') },
            { value: 'duo', label: t('app.clubTabDuo') },
          ]}
        />
      ) : null}

      {/* Кто с тобой на этой неделе — первое, что видно в дуо, и только в нём. */}
      {/*
       * A pair formed or broken changes more than today's task: the board counts the pair's points
       * together and `my_marathons()` hands back a new team — so all three reload.
       */}
      {duo ? (
        <ClubDuoPair
          onStatus={setDuoStatus}
          onChanged={() => {
            reload();
            reloadScores();
            reloadMarathon();
          }}
        />
      ) : null}

      {/* Today's task delivered: the moment to ask a friend along (0051). */}
      {dayIndex >= 1 && status === 'ready' && todayDone ? <ClubInviteCard /> : null}

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

      {/*
       * The task and the table, side by side from `md`.
       *
       * On a phone they are stacked because only one of them can be on screen at a time, and the
       * task has to be the one: at 7am the standings are not what gets anyone off the sofa. A
       * laptop has room for both, and then the order stops being a ranking — the board beside the
       * task is the race made visible while the task is being done, which is the whole argument
       * for having a board at all.
       */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        <section className="min-w-0 flex-1">
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
            /*
             * One card, because the club is one task a day. It stays a list because the table
             * still lets a coach write two, and a screen that silently dropped the second would be
             * worse than one that shows it.
             */
            <div className="flex flex-col" aria-busy={sending}>
              {tasks.map((item) => {
                const done = item.mine !== null && !item.mine.voidedAt;
                const title = (locale === 'en' && item.task.titleEn) || item.task.title;
                return (
                  <TaskCard
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
                    partner={
                      duo && duoStatus?.mateName ? (
                        <ClubPartnerLine item={item} mateName={duoStatus.mateName} />
                      ) : null
                    }
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
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* 384px rather than 320: the prize is the widest thing in this column at 304px, and a
            column half again as wide as the pill keeps the table from reading as a narrow sidebar
            beside the task. */}
        <section className="md:w-96 md:shrink-0">
          {/*
           * The prize is the one filled pill on the screen — what the table is for, and the reason
           * the table is on this tab at all. The «Неделя 1» kicker that stood over it is gone: the
           * ring in the head already counts the days, and the club runs one week. A prize the
           * coach types longer than the standing one will ellipsise, like every other pill. It
           * is the warm gradient, not the neon: the club's one filled pill is the club's colour.
           */}
          <Pill tone="warm">
            {t('app.marathonPrizeShort')} · {clubPrize(tr, marathon.prize)}
          </Pill>
          {/*
           * «Топ 3 и где ты» — three rows, then the member's own, which is the shape a standings
           * table has had since long before there were screens. The row is pulled down only when
           * it is not already one of the three; up there the «Ты» tag marks it instead, because
           * the same name printed twice in nine rows of table is the reader wondering whether the
           * board is broken.
           */}
          {standings.top.length > 0 ? (
            <ol className="mt-3 flex flex-col">
              {standings.top.map(({ row, rank }) => (
                <li key={row.entryId}>
                  <BoardRow row={row} rank={rank} delta={rowDelta(row.isMine)} />
                </li>
              ))}
              {standings.mine ? (
                <>
                  {standings.skipped > 0 ? (
                    <li>
                      <BoardGap hidden={standings.skipped} />
                    </li>
                  ) : null}
                  {/*
                   * The neighbour above, your row, the neighbour below — the tail the owner drew
                   * («168 Маша · 169 Ты · 170 Никита»). At 169th the leader is news about a
                   * stranger and the person one row up is the only opponent in reach, so the table
                   * now ends with something to do rather than with a number. `standings.ts` drops
                   * either neighbour that is already one of the three rows above.
                   */}
                  {standings.above ? (
                    <li>
                      <BoardRow row={standings.above.row} rank={standings.above.rank} />
                    </li>
                  ) : null}
                  <li>
                    <BoardRow
                      row={standings.mine.row}
                      rank={standings.mine.rank}
                      delta={rankDelta}
                    />
                  </li>
                  {standings.below ? (
                    <li>
                      <BoardRow row={standings.below.row} rank={standings.below.rank} />
                    </li>
                  ) : null}
                </>
              ) : null}
            </ol>
          ) : (
            <p className="mt-3 text-[13px] text-muted">{t('app.marathonBoardEmpty')}</p>
          )}
          {/*
           * The one line that turns a place into a task: how far the row above is, in points, or
           * the size of the lead. Nothing for an unscored week — «До Ани — 42 балла» over a dash
           * is a mountain, not a nudge (`boardGap`).
           */}
          {gap ? (
            <p className="mt-2 text-[13px] text-muted">
              {gap.kind === 'chase'
                ? t('app.clubGapChase', {
                    name: gap.name,
                    points: pointsWord(t, locale, gap.points),
                  })
                : t('app.clubGapLeader', { points: pointsWord(t, locale, gap.lead) })}
            </p>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 -ml-4.5"
            onClick={() => navigate(boardPath(duo ? 'duo' : 'solo'))}
            iconRight={<Glyph size={12}>→</Glyph>}
          >
            {t('app.marathonBoardAll')}
          </Button>
        </section>
      </div>
    </div>,
  );
}
