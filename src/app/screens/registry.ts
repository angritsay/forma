/**
 * Lazy screen registry.
 *
 * Each screen is `src/app/screens/<Name>Screen.tsx` (default export = the screen), and the router
 * looks it up here by name. Modules are discovered with Vite's `import.meta.glob`, so every screen
 * is its own chunk. Every name below has its file — `routes.test.ts` checks it — so a lookup never
 * misses; the "not available yet" state the router used to keep for a screen still being written
 * went with the last screen that landed.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const SCREEN_NAMES = [
  // «Курсы», the main screen: the index route renders it.
  'CoursesScreen',
  'AchievementsScreen',
  'CoursePathScreen',
  'NodePreviewScreen',
  'PlayerScreen',
  'SummaryScreen',
  // The physical test, now asked for after a couple of workouts rather than during onboarding.
  'AssessmentScreen',
  // The onboarding stories again, from «Как это работает» in the account sheet.
  'IntroScreen',
  'LeaderboardScreen',
  'MarathonScreen',
  'MarathonBoardScreen',
  // Accepting a friend's duo invite (the `#/duo/<token>` link).
  'DuoInviteScreen',
  // «Позови друга»: the referral link, how it works, what it has brought (0051).
  'ClubInviteScreen',
  // «Кабинет автора»: applying as a creator, then their sales and settlement (0064).
  'CreatorScreen',
  'BookScreen',
  'AdminScreen',
  'AdminWorkoutsScreen',
  'AdminExercisesScreen',
  // Every clip, recording and still in the buckets, with the exercises that use them (0048).
  'AdminMediaScreen',
  // «Студия»: a filmed workout cut into exercise clips on the device and uploaded (0060).
  'AdminStudioScreen',
  'AdminStudioCutScreen',
  // «Студия» for one video: cut, names, colour, preview and the render queue (0061).
  'AdminStudioFlowScreen',
  // The old «Цвет и кадр» addresses of 0060, redirected into the flow.
  'AdminStudioGradeScreen',
  'AdminCoursesScreen',
  'AdminCourseScreen',
  'AdminMarathonsScreen',
  'AdminMarathonScreen',
  'AdminStatsScreen',
  // «Обращения» and «Записи» (0045).
  'AdminSupportScreen',
  'AdminBookingsScreen',
  // One person by email: everything known about them and what can be done (0046).
  'AdminPersonScreen',
  // «Авторы»: applications, plans, courses and invoices of creators (0064).
  'AdminCreatorsScreen',
  'CustomWorkoutScreen',
] as const;

export type ScreenName = (typeof SCREEN_NAMES)[number];

type ScreenModule = { default: ComponentType };

const modules = import.meta.glob<ScreenModule>('./*Screen.tsx');
const cache = new Map<ScreenName, LazyExoticComponent<ComponentType>>();

/** Lazy component for a registered screen. */
export function getScreen(name: ScreenName): LazyExoticComponent<ComponentType> {
  let component = cache.get(name);
  if (!component) {
    const loader = modules[`./${name}.tsx`];
    // Unreachable while `routes.test.ts` passes: every registered name has its module.
    if (!loader) throw new Error(`screen module missing: ${name}`);
    /*
     * A failed load is not cached. `lazy()` remembers a rejected import for good, so a screen that
     * failed to arrive offline would fail again on «Повторить» even with the signal back; dropping
     * it here makes the next render ask for the file afresh.
     */
    component = lazy(() =>
      loader().catch((e: unknown) => {
        cache.delete(name);
        throw e;
      }),
    );
    cache.set(name, component);
  }
  return component;
}

/**
 * Fetch a screen's code ahead of need. The player warms the summary and the home screen, so the
 * end of a workout done out of signal does not stop on a screen the phone never downloaded.
 * Failures are ignored: the real navigation will try again and show its own state.
 */
export function preloadScreen(name: ScreenName): void {
  const loader = modules[`./${name}.tsx`];
  if (!loader) return;
  loader().catch(() => undefined);
}
