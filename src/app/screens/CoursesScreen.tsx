/**
 * Programmes (the second tab): one ticket per thing there is to be in, down the screen.
 *
 * It was a catalogue first — a page title, a lead, and five tiles in a grid, each with its own
 * heading, kicker, tagline and row of facts. That is a shop, and this is not a shop: there is one
 * course to walk («Форма с нуля»), the challenge running beside it, and the rest is what has not
 * been bought yet.
 *
 * Then it was a sideways deck of full-height covers, and that overcorrected: a screen that answers
 * «во что я могу пойти» showed exactly one answer at a time and left you to find the others by
 * swiping. Tickets are the middle of it — bounded, two to a phone screen, each carrying what it is,
 * its name, one line, how far in you are, and one button. Home keeps the full-bleed cover, because
 * Home has one card and a whole screen to give it.
 */
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { buildDeck } from '@/app/features/programs/deck';
import { ProgramDeck } from '@/app/features/programs/ProgramDeck';
import { gameAccess } from '@/app/features/marathon/gameAccess';
import { useMarathonDay, useMyMarathons } from '@/app/features/marathon/useMarathon';
import { useCatalogue } from '@/app/store/catalogue';
import { useActiveCourseId, useProgress, useProgressLoader } from '@/app/store/progress';
import { useSession } from '@/app/store/session';
import { GAME_REQUIRES_SUBSCRIPTION } from '@content/site/plans';

function DeckSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <Skeleton rounded="card" className="h-[420px]" />
      <Skeleton rounded="card" className="h-[420px]" />
    </div>
  );
}

export default function CoursesScreen() {
  useProgressLoader();
  const { t } = useT();
  const navigate = useNavigate();
  const entitlements = useSession((s) => s.entitlements);
  const subscription = useSession((s) => s.subscription);
  const newestPurchaseAt = useSession((s) => s.newestPurchaseAt);
  const status = useProgress((s) => s.status);
  const courseStates = useProgress((s) => s.courseStates);
  const activeCourseId = useActiveCourseId();
  const courses = useCatalogue((s) => s.courses);
  // The challenge that fails to load leaves the deck to the courses; it never blocks the tab.
  const { data: marathons, marathon } = useMyMarathons();
  const { data: todayTasks } = useMarathonDay(marathon, marathon?.dayIndex ?? 0);

  const entries = useMemo(
    () => buildDeck({ courses, entitlements, states: courseStates, marathons, activeCourseId }),
    [courses, entitlements, courseStates, marathons, activeCourseId],
  );

  const access = gameAccess({
    subscriptionLive: subscription?.isLive === true,
    newestPurchaseAt,
    now: Date.now(),
    gated: GAME_REQUIRES_SUBSCRIPTION,
  });

  /* Today's open tasks, for the challenge card's one line: a rank moves nobody, an unfinished task does. */
  const openTasks = useMemo(() => {
    if (!marathon || todayTasks.length === 0) return undefined;
    const left = todayTasks.filter((item) => item.task.rule !== 'none' && !item.mine).length;
    return { [marathon.id]: left };
  }, [marathon, todayTasks]);

  const refresh = useCallback(async () => {
    await Promise.allSettled([
      useProgress.getState().refresh(),
      useSession.getState().refreshEntitlements(),
    ]);
  }, []);

  /* The tab says its own name, the way «Челлендж» and «Прогресс» already do — asked for, and the
     one thing this screen was missing when the four tabs were put side by side. */
  const header = <TopBar title={t('app.tabPrograms')} />;

  if (status === 'idle' || status === 'loading') {
    return (
      <Screen header={header}>
        <DeckSkeleton />
      </Screen>
    );
  }

  if (entries.length === 0) {
    return (
      <Screen header={header}>
        <EmptyState
          title={t('app.homeTodayNoCourseTitle')}
          description={t('app.homeTodayNoCourseBody')}
          action={
            <Button size="lg" onClick={() => void refresh()}>
              {t('common.retry')}
            </Button>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen header={header}>
      <ProgramDeck
        entries={entries}
        openTasks={openTasks}
        gameAccess={access}
        onOpenCourse={(courseId) => navigate(`/courses/${courseId}`)}
        onStartNode={(courseId, nodeId) => navigate(`/courses/${courseId}/nodes/${nodeId}`)}
        onOpenMarathon={() => navigate('/marathon')}
      />
    </Screen>
  );
}
