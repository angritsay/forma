/**
 * Programmes (the second tab): one full-height card per thing there is to be in, swiped sideways.
 *
 * It used to be a catalogue — a page title, a lead, and five tiles in a grid, each with its own
 * heading, kicker, tagline and row of facts. That is a shop, and this is not a shop: there is one
 * course to walk («Форма с нуля»), a game running beside it, and the rest is what has not been
 * bought yet. A grid of five 320px tiles says "compare these"; a deck says "this is the one, and
 * there is another behind it".
 *
 * So the deck that used to open the home screen lives here (`features/programs/ProgramDeck`), with
 * the game as a card of its own, and Home keeps only today. The kicker on each card says which
 * kind it is — «Курс» or «Игра» — and everything else is the picture, the name, one line and the
 * button.
 */
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
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
    <div className="flex flex-col" aria-hidden="true">
      <Skeleton rounded="control" className="-mx-5 h-[78dvh] min-h-[520px] lg:-mx-8" />
      <div className="mt-4 flex justify-center gap-2">
        <Skeleton rounded="control" className="h-0.5 w-7" />
        <Skeleton rounded="control" className="h-0.5 w-7" />
      </div>
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
  // A game that fails to load leaves the deck to the courses; it never blocks the tab.
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

  /* Today's open tasks, for the game card's one line: a rank moves nobody, an unfinished task does. */
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

  if (status === 'idle' || status === 'loading') {
    return (
      <Screen>
        <DeckSkeleton />
      </Screen>
    );
  }

  if (entries.length === 0) {
    return (
      <Screen>
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
    <Screen>
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
