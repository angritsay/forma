import { clsx } from 'clsx';
import { NavLink } from 'react-router';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useT } from '@/app/hooks/useT';
import type { TKey } from '@/i18n/index';

interface NavItem {
  to: string;
  labelKey: TKey;
  icon: IconName;
  end?: boolean;
}

const ITEMS: readonly NavItem[] = [
  { to: '/', labelKey: 'app.tabHome', icon: 'home', end: true },
  { to: '/courses', labelKey: 'app.tabCourses', icon: 'courses' },
  { to: '/stats', labelKey: 'app.tabStats', icon: 'stats' },
  { to: '/profile', labelKey: 'app.tabProfile', icon: 'user' },
];

/**
 * The tab bar: four equal columns, a mark over a word, and a rule over the one you are on.
 *
 * It was set in type alone — four words pushed to the left edge, the current one large in the
 * display face and the rest as small tracked capitals. On its own terms that worked, but on a
 * screen that is already mostly words it read as one more line of them: nothing said these four
 * were a set, nothing said they were the same kind of thing as each other, and nothing said any
 * of them could be tapped at all.
 *
 * So it spends the one convention every phone owner already knows, and spends it carefully:
 *   - four equal columns, because equal width is what says "pick one of these";
 *   - a mark over each word, because a shape is recognised before a word is read;
 *   - a 2px rule along the top of the current column — the same device the player's section
 *     stepper uses for the part you are in.
 *
 * The rule is white, not the programme colour. Outside a course screen `--course-tile` is unset
 * and the token falls back to `--tile-4`, which is a dark neutral: the rule came out near-black on
 * a near-black bar and could not be seen at all. White is also the honest choice here — the bar is
 * the app's chrome, and the brandbook keeps colour for the programmes themselves.
 *
 * The type stays quiet: 10px tracked capitals on every tab, the current one in full white and the
 * others in the second grey. Hierarchy is the rule and the ink now, not the size, so the bar reads
 * as chrome instead of competing with the screen above it.
 */
export function BottomNav() {
  const { t } = useT();
  return (
    <nav
      aria-label={t('app.navMain')}
      /* Hidden from `lg` up, where SideNav takes over; AppShell drops `--nav-inset` to match. */
      className={clsx(
        'fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 lg:hidden',
        'flex items-stretch border-t border-border bg-bg',
        'pl-[var(--safe-left)] pr-[var(--safe-right)]',
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
                /*
                 * The 56px row lives on the links, so the bar's own padding (safe area, demo
                 * strip) adds to it instead of eating into it — and every tab is a 56px target.
                 */
                'relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1',
                'transition-colors duration-150 ease-(--ease-out)',
                isActive ? 'text-text' : 'text-muted-2 hover:text-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                {/*
                 * The rule sits on the bar's own hairline rather than beside it, so the current
                 * tab reads as a tab pulled forward rather than as a word that changed colour.
                 */}
                <span
                  aria-hidden="true"
                  className={clsx(
                    'absolute inset-x-0 top-[-1px] h-[2px]',
                    isActive ? 'bg-primary' : 'bg-transparent',
                  )}
                />
                <Icon name={item.icon} size={20} strokeWidth={isActive ? 2.25 : 2} />
                <span className="control-label text-[10px] whitespace-nowrap">{label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
