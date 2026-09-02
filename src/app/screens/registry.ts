/**
 * Lazy screen registry.
 *
 * Screen agents add `src/app/screens/<Name>Screen.tsx` files (default export = the screen).
 * The router looks them up here by name. Modules are discovered with Vite's `import.meta.glob`
 * so a screen that has not landed yet does not break the type check or the build — the router
 * renders a localized "not available" state for it instead. To pin a screen explicitly, replace
 * its lookup with `lazy(() => import('./HomeScreen'))`.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export const SCREEN_NAMES = [
  'HomeScreen',
  'CoursesScreen',
  'CoursePathScreen',
  'NodePreviewScreen',
  'PlayerScreen',
  'SummaryScreen',
  'StatsScreen',
  'LeaderboardScreen',
  'StepsScreen',
  'ProfileScreen',
  'AdminScreen',
] as const;

export type ScreenName = (typeof SCREEN_NAMES)[number];

type ScreenModule = { default: ComponentType };

const modules = import.meta.glob<ScreenModule>('./*Screen.tsx');
const cache = new Map<ScreenName, LazyExoticComponent<ComponentType>>();

/** Lazy component for a registered screen, or null when its module does not exist yet. */
export function getScreen(name: ScreenName): LazyExoticComponent<ComponentType> | null {
  const loader = modules[`./${name}.tsx`];
  if (!loader) return null;
  let component = cache.get(name);
  if (!component) {
    component = lazy(loader);
    cache.set(name, component);
  }
  return component;
}

/** Names of screens whose modules are present in this build. */
export function availableScreens(): ScreenName[] {
  return SCREEN_NAMES.filter((n) => Boolean(modules[`./${n}.tsx`]));
}
