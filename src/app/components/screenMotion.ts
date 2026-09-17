/**
 * Which way a screen arrives, decided from where the last one was.
 *
 * The tab bar's highlight slides sideways between its seats, and a screen that then simply
 * appeared would contradict it: the chrome said "you moved right", the content said "something
 * was replaced". So the content moves the same way the highlight did — in from the right when the
 * tab you chose is to the right of the one you left, in from the left when it is to the left.
 *
 * Inside a tab the same two directions mean depth: a screen you pushed into (the course's path,
 * a day inside it) comes from the right, the way every phone stacks screens, and the one you come
 * back to from the left. A move that is neither — the same depth in the same tab, or a screen the
 * bar has no seat for arriving from another such screen — rises into place instead.
 *
 * Pure, so it can be tested without a router; the first screen of a session has nothing to
 * arrive from and moves not at all.
 */
import { activeTabIndex } from './BottomNav';

export type ScreenMotion = 'right' | 'left' | 'up' | 'none';

function depth(pathname: string): number {
  return pathname.split('/').filter(Boolean).length;
}

export function screenMotion(from: string | null, to: string): ScreenMotion {
  if (from === null || from === to) return 'none';
  /*
   * Asked as an admin, always: the extra seat only changes the answer for `/admin`, and an admin
   * is the only person who ever lands there. Reading `useIsAdmin` here would make a pure function
   * depend on a hook to decide which way a screen slides.
   */
  const a = activeTabIndex(from, true);
  const b = activeTabIndex(to, true);
  if (a >= 0 && b >= 0 && a !== b) return b > a ? 'right' : 'left';
  const da = depth(from);
  const db = depth(to);
  if (db > da) return 'right';
  if (db < da) return 'left';
  return 'up';
}

/** The class that draws each motion; `none` draws nothing. */
export const SCREEN_MOTION_CLASS: Record<ScreenMotion, string> = {
  right: 'screen-in-right',
  left: 'screen-in-left',
  up: 'screen-in-up',
  none: '',
};
