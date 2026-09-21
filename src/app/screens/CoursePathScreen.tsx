/**
 * Course path (docs/SPEC.md §10 flow 4): the course's name on a band of its colour, the ring and
 * one line saying which day this is, three figures, and the days as a zigzag of circles under a
 * band per week. Rest days and milestones open a sheet; workout nodes go to the preview.
 *
 * **Drawn in the owner's prototype's language** (`design/ui_kits/app-v2`, «Путь по дням»), after
 * her verdict on the app — «МИНИМУМ текста, максимум визуала и дофамина». What went from the
 * head: the tagline paragraph, the «4 недели · 3 раза в неделю» kicker and the strip of eight
 * ruled week numbers — three lines that described the course to somebody already walking it.
 * What replaced them says the same in figures: the percentage is inside a ring, the day is one
 * display line in two weights («ДЕНЬ 4 из 28»), and the weeks are the bands the days sit under.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { RingProgress } from '@/components/ui/RingProgress';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import { courseTitle, findCourse } from '@/content/catalogue';
import type { CourseNode } from '@/content/schema';
import { formatNumber } from '@/i18n/index';
import { courseTileVars } from '@/lib/ui/tile';
import { TopBar } from '@/app/components/TopBar';
import { ScreenLoader } from '@/app/components/ScreenLoader';
import { useT } from '@/app/hooks/useT';
import { DisplayText, DisplayTitle } from '@/app/features/home/DisplayTitle';
import { NodeSheet } from '@/app/features/path/NodeSheet';
import {
  courseProgress,
  currentNodeIndex,
  nodeStatus,
  type NodeStatus,
} from '@/app/features/path/nodeState';
import { PathView } from '@/app/features/path/PathView';
import { ScaleSheet } from '@/app/features/path/ScaleSheet';
import {
  startingScale,
  useCourseStateRow,
  starsByNode,
  useProgress,
  useProgressLoader,
} from '@/app/store/progress';
import { useSession } from '@/app/store/session';
import { nodeAccess } from '@/app/features/courses/courseAccess';
import { UnlockSheet } from '@/app/features/courses/UnlockSheet';

export default function CoursePathScreen() {
  useProgressLoader();
  const { id = '' } = useParams();
  const { t, l, locale } = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const course = findCourse(id);
  const entitlements = useSession((s) => s.entitlements);
  const profile = useSession((s) => s.profile);
  const status = useProgress((s) => s.status);
  const loading = useProgress((s) => s.loading);
  const setActiveCourse = useProgress((s) => s.setActiveCourse);
  const row = useCourseStateRow(course?.id);
  /*
   * Best stars per day, recomputed from the session rows the store already holds. Derived rather
   * than stored, so it needs no column and shows on days done before the rule existed.
   */
  const sessions = useProgress((s) => s.recentSessions);
  const stars = useMemo(() => (course ? starsByNode(sessions, course.id) : {}), [sessions, course]);
  /*
   * Minutes trained on this course, from the same rows — the prototype's second figure. Its
   * horizon is the horizon of `recentSessions` (60 rows), which is past the length of any course
   * in the catalogue; a session older than that is not counted rather than guessed at.
   */
  const minutes = useMemo(() => {
    if (!course) return 0;
    const sec = sessions
      .filter((s) => s.courseId === course.id && s.completedAt)
      .reduce((n, s) => n + (s.durationSec ?? 0), 0);
    return Math.round(sec / 60);
  }, [sessions, course]);
  const [sheetNode, setSheetNode] = useState<CourseNode | null>(null);
  const [scaleOpen, setScaleOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const owned = course ? entitlements.includes(course.id) : false;
  /*
   * Что открыто, решает `nodeAccess` на нажатии: он отвечает 'paywalled' там, где раньше весь
   * экран подменялся заглушкой «Этого курса у тебя пока нет», и открывает шторку с ценой. Ему
   * достаточно `owned` — проба больше не тратится (0022), поэтому спрашивать сервер о том,
   * тренировался ли здесь человек, этому экрану не нужно вовсе.
   */
  const [unlockOpen, setUnlockOpen] = useState(false);

  // The course the athlete opened becomes the one the Home screen follows.
  useEffect(() => {
    // Курс, который пробуют, — тоже тот, которым человек сейчас занят: иначе «Сегодня» осталось бы
    // пустым ровно у того, кто только что начал. Оговорки «кроме потративших пробу» здесь больше
    // нет: проба не тратится (0022), и попробовавшему по-прежнему есть что открыть отсюда.
    if (course) setActiveCourse(course.id);
  }, [course, setActiveCourse]);

  if (!course) {
    return (
      <Screen header={<TopBar back="/courses" />}>
        <EmptyState
          title={t('app.pathNotFound')}
          action={<Button onClick={() => navigate('/')}>{t('app.tabCourses')}</Button>}
        />
      </Screen>
    );
  }

  const progress = courseProgress(course.nodes, row);
  const finished = progress.total > 0 && progress.done >= progress.total;
  /* The day being lived, 1-based: the next stop on the path, whatever the count of finished ones. */
  const todayIndex = currentNodeIndex(course.nodes, row);
  const dayN = todayIndex >= 0 ? todayIndex + 1 : progress.total;
  const scale = row?.scale ?? startingScale(profile);
  const sheetIndex = sheetNode ? course.nodes.findIndex((n) => n.id === sheetNode.id) : -1;
  const sheetStatus: NodeStatus =
    sheetIndex >= 0 ? nodeStatus(sheetIndex, course.nodes, row) : 'locked';

  const onNodePress = (node: CourseNode, _index: number, nodeState: NodeStatus) => {
    /*
     * Два разных тупика, и вести из них надо в разные места. «Ещё не дошёл» — это подсказка про
     * порядок; «за это не заплачено» — это цена, и показывать её тостом было бы издевательством.
     *
     * **Порядок проверок перевернулся, и это правка 0022.** Раньше порядок стоял первым, на
     * доводе «до дня двадцатого человек и так не дошёл, и говорить ему про оплату раньше, чем про
     * порядок, значит продавать вместо того, чтобы объяснять». Владелец решила иначе: «до оплаты
     * курса он может кликать, и мы будем его перенаправлять на пейволл, за исключением первой
     * тренировки». Она права про то, кто нажимает: у некупившего курса нет никакого «дошёл» —
     * ему открыта ровно одна тренировка, и «сначала пройди предыдущие» отвечает не на тот вопрос,
     * который он задал. Для купившего порядок остался ровно там, где был.
     */
    if (nodeAccess({ owned, course, node }) === 'paywalled') {
      setUnlockOpen(true);
      return;
    }
    if (nodeState === 'locked') {
      toast.show({ kind: 'info', title: t('app.pathLockedToast') });
      return;
    }
    if (node.kind === 'rest' || node.kind === 'milestone') {
      setSheetNode(node);
      return;
    }
    navigate(`/courses/${course.id}/nodes/${node.id}`);
  };

  const completeSheetNode = async (skip: boolean) => {
    if (!sheetNode) return;
    setBusy(true);
    try {
      await useProgress.getState().completeNode(course.id, sheetNode.id);
      const title =
        sheetNode.kind === 'rest'
          ? skip
            ? t('app.pathRestSkipped')
            : t('app.pathRestCompleted')
          : t('app.pathMilestoneDone');
      toast.show({ kind: 'success', title });
      setSheetNode(null);
    } catch {
      toast.show({ kind: 'error', title: t('app.pathSaveError') });
    } finally {
      setBusy(false);
    }
  };

  let body: React.ReactNode;
  if (status === 'loading' || status === 'idle') {
    body = <ScreenLoader />;
  } else if (status === 'error') {
    body = (
      <EmptyState
        title={t('app.homeErrorTitle')}
        description={t('app.homeErrorBody')}
        action={
          <Button size="lg" loading={loading} onClick={() => void useProgress.getState().refresh()}>
            {t('common.retry')}
          </Button>
        }
      />
    );
  } else {
    body = <PathView course={course} state={row} stars={stars} onNodePress={onNodePress} />;
  }

  const dayText = formatNumber(locale, dayN);
  const totalText = formatNumber(locale, progress.total);

  return (
    /*
     * `--course-tile` is set once, around the whole screen: the head is painted in it, and
     * further down the ring, the week bands, the finished circles and today's «Сегодня» read the
     * same variable. One screen, one colour — and this is the screen it belongs to.
     */
    <div style={courseTileVars(course.tile)}>
      <Screen>
        {/*
         * The head is the programme colour with ink text, bleeding past the gutters and up under
         * the status bar, and it carries two things: the way out and the way to the board on one
         * line, and the course's name as the one big line. There is no bar; the back control is a
         * kicker in the block's top-left corner and the leaderboard sits opposite.
         */}
        <header className="hero-art -mx-6 -mt-[var(--safe-top)] px-6 pt-[calc(var(--safe-top)+14px)] pb-6 md:-mx-10 md:px-10">
          <div className="flex items-baseline justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/courses')}
              aria-label={t('common.back')}
              className="eyebrow tap-target-y inline-flex items-center gap-1.5 text-current"
            >
              <Glyph size={12}>←</Glyph>
              {t('app.tabCourses')}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/leaderboard?course=${course.id}`)}
              className="eyebrow tap-target-y inline-flex items-center gap-1.5 text-current opacity-70"
            >
              {t('app.pathLeaderboard')}
              <Glyph size={12}>›</Glyph>
            </button>
          </div>
          <DisplayTitle text={l(courseTitle(course))} className="mt-6 text-4xl lg:text-5xl" />
        </header>

        {/*
         * Where you are: a ring with the share inside and one display line beside it —
         * «ДЕНЬ 4 из 28», 800 + 200. The club's screen used to open on the same figure; the owner
         * took it off that tab («шапку с кольцом убери») because there the number reported a day
         * nobody acts on. Here it is the programme's own progress, which is the thing being worked
         * through, so it stays. It
         * stands on the dark ground rather than on the coloured head so the ring can be drawn in
         * the programme colour, which is where §10 puts the colour: on the figure, not the field.
         * When the course is finished the line says so, in the same two weights.
         */}
        <div className="flex items-center gap-5 pt-6">
          <RingProgress
            value={progress.total > 0 ? progress.done / progress.total : 0}
            size={84}
            stroke={6}
            label={t('app.pathProgressLabel')}
            valueText={t('app.pathProgress', { done: progress.done, total: progress.total })}
          >
            {/*
             * One figure in the ring, the way the club's head has it: «0%» on one line, not
             * a numeral with «%» stacked under it as a kicker. The sign belongs to the number, and
             * a second line inside a 72px circle is a label repeating what is above it.
             */}
            <span className="numeral tabular text-[19px] leading-none">{progress.pct}%</span>
          </RingProgress>
          {/* 1.08 → 1.2: a course name wraps, and 1.08 was drawn for capitals. global.css. */}
          <h2 className="display min-w-0 flex-1 text-[26px] leading-[1.2] text-balance">
            {finished ? (
              <DisplayText text={t('app.pathCompleted')} />
            ) : (
              <>
                {t('app.pathDayN', { n: dayText })}{' '}
                <span className="t-thin">{t('app.pathOfTotal', { total: totalText })}</span>
              </>
            )}
          </h2>
        </div>

        {/*
         * Three figures on one ruled line: days done, minutes trained, the load. The third is a
         * button — the multiplier opens the sheet that explains how the course adapts.
         */}
        <div className="-mx-6 mt-6 grid grid-cols-3 divide-x divide-border border-y border-border bg-bg md:-mx-10">
          <div className="px-6 py-4 md:px-10">
            <div className="numeral tabular text-2xl leading-none">
              {progress.done}/{progress.total}
            </div>
            <div className="eyebrow mt-2">{t('app.pathStatDays')}</div>
          </div>
          <div className="px-4 py-4">
            <div className="numeral tabular text-2xl leading-none">
              {formatNumber(locale, minutes)}
            </div>
            <div className="eyebrow mt-2">{t('app.pathStatMinutes')}</div>
          </div>
          <button
            type="button"
            onClick={() => setScaleOpen(true)}
            className="px-4 py-4 text-left transition-colors duration-150 ease-(--ease-out) hover:bg-surface"
            aria-label={t('app.pathScaleBadge', { scale: formatNumber(locale, scale, 2) })}
          >
            <div className="numeral tabular text-2xl leading-none">
              ×{formatNumber(locale, scale, 2)}
            </div>
            <div className="eyebrow mt-2 flex items-center gap-1">
              {t('app.pathStatLoad')}
              <Glyph size={11}>›</Glyph>
            </div>
          </button>
        </div>
        <div className="pt-6">{body}</div>
        <NodeSheet
          node={sheetNode}
          status={sheetStatus}
          busy={busy}
          onClose={() => setSheetNode(null)}
          onComplete={(skip) => void completeSheetNode(skip)}
        />
        <ScaleSheet open={scaleOpen} scale={scale} onClose={() => setScaleOpen(false)} />
        <UnlockSheet open={unlockOpen} course={course} onClose={() => setUnlockOpen(false)} />
      </Screen>
    </div>
  );
}
