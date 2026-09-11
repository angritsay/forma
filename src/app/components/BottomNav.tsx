import { clsx } from 'clsx';
import { NavLink } from 'react-router';
import { useT } from '@/app/hooks/useT';
import type { TKey } from '@/i18n/index';

interface NavItem {
  to: string;
  labelKey: TKey;
  end?: boolean;
}

const ITEMS: readonly NavItem[] = [
  { to: '/', labelKey: 'app.tabHome', end: true },
  { to: '/courses', labelKey: 'app.tabCourses' },
  { to: '/stats', labelKey: 'app.tabStats' },
  { to: '/profile', labelKey: 'app.tabProfile' },
];

/**
 * The tab bar, set in type alone.
 *
 * The brandbook's bar has no icons: the current destination is the one word set large in the
 * display face, the others are small tracked capitals in the quietest grey, and everything is
 * pushed to the left edge like a running head. Hierarchy comes from size, not from a filled
 * block, so nothing on the bar competes with the programme colour on the screen above it.
 *
 * It runs the full width of the phone column — a translucent strip on a hairline, blurred over
 * whatever scrolls under it — rather than floating as a rounded island. 56px tall plus the safe
 * area; every link is at least 44px tall so the small labels are still easy to hit.
 */
export function BottomNav() {
  const { t } = useT();
  return (
    <nav
      aria-label={t('app.navMain')}
      /*
       * Hidden from `lg` up, where SideNav takes over; AppShell drops `--nav-inset` to match.
       * Four Russian labels at these sizes just fit 390px with the design system's 24px gap; the
       * gap steps down below 420px so the widest active word never pushes the last tab off the edge.
       */
      className={clsx(
        'fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 lg:hidden',
        'flex items-center gap-6 border-t border-border bg-bg/88 backdrop-blur-lg max-[420px]:gap-4',
        'pl-[max(var(--safe-left),22px)] pr-[max(var(--safe-right),22px)]',
        'pb-[calc(var(--safe-bottom)+var(--demo-inset,0px))]',
      )}
    >
      {ITEMS.map((item) => {
        const label = t(item.labelKey);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            aria-label={label}
            className={({ isActive }) =>
              clsx(
                // The 56px row lives on the links, so the bar's own padding (safe area, demo
                // strip) adds to it instead of eating into it — and every tab is a 56px target.
                'flex min-h-14 shrink-0 items-center whitespace-nowrap transition-colors duration-150 ease-(--ease-out)',
                isActive
                  ? 'font-display text-base text-text'
                  : 'control-label text-[10px] text-muted-2 hover:text-text',
              )
            }
          >
            {label}
          </NavLink>
        );
      })}
    </nav>
  );
}
