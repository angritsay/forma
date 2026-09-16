import { clsx } from 'clsx';
import { NavLink, useLocation } from 'react-router';
import { Icon, type IconName } from '@/components/ui/Icon';
import { haptic } from '@/lib/telegram/webapp';
import { useT } from '@/app/hooks/useT';
import type { TKey } from '@/i18n/index';

interface NavItem {
  to: string;
  labelKey: TKey;
  icon: IconName;
  end?: boolean;
}

/*
 * Four tabs, and the profile is not one of them.
 *
 * The bar holds the four things the app *is* — today, the programmes, the club, the numbers — and
 * a profile is none of them: it is opened a handful of times ever, and it was taking a quarter of
 * the width every day. It lives where a phone owner already looks for it, as the avatar on
 * «Прогресс» (`AccountRow`) and in the top row from `md`, and the seat it gave up went to the
 * club, which used to be reachable only through a card on the home deck.
 *
 * «Курсы» is «Программы» here, and in the product generally: a course is one shape a programme
 * can take, and the tab holds them alongside the club.
 */
const ITEMS: readonly NavItem[] = [
  { to: '/', labelKey: 'app.tabHome', icon: 'home', end: true },
  { to: '/courses', labelKey: 'app.tabPrograms', icon: 'courses' },
  { to: '/marathon', labelKey: 'app.tabGame', icon: 'people' },
  { to: '/stats', labelKey: 'app.tabReports', icon: 'stats' },
];

/**
 * Which tab a path belongs to, or -1 for a screen that is in none of them.
 *
 * `NavLink` decides this per link and keeps the answer to itself, which is no use to a highlight
 * that has to know *where* to travel. So the rule is written once here, and it is the same rule
 * `NavLink` uses: an exact match for the root, a path-segment prefix for the rest — `/courses/start`
 * is inside «Программы», and `/coursesomething` is not, which is the whole reason the `/` is in the
 * prefix rather than a bare `startsWith`.
 *
 * -1 is a real answer, not a failure: `/profile`, `/book` and `/steps` all show this bar and belong
 * to no tab, and the highlight fades out rather than pointing at one of them.
 */
export function activeTabIndex(pathname: string): number {
  return ITEMS.findIndex((item) =>
    item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`),
  );
}

/**
 * The tab bar: a capsule of glass floating over the bottom of the screen, with one highlight
 * that slides to the seat you chose.
 *
 * It was a band across the bottom edge — a hairline, four columns, a 2px rule over the current
 * one — and the owner's verdict on it was «ощущается как по андроидовке … смотри в сторону iOS».
 * The difference between the two is not the icons or the words, which are the same, but what kind
 * of object the bar is. A band is part of the screen's edge: it ends where the screen ends and
 * moves when the screen does. A capsule is a thing laid *on* the screen — inset from its sides
 * and its bottom, rounded on every corner, casting a shadow — and the screen carries on underneath
 * it, which is what makes the glass worth having: there is content on every side of it to blur,
 * not just along one edge.
 *
 * Three moving parts, all in the spirit of the prototype in `design/ui_kits/app-v2`:
 *
 *   - **The highlight is one element that slides, not four that blink.** A lighter capsule inside
 *     the capsule, a quarter of the row wide, that travels by `translateX(n × 100%)` of its own
 *     width. Equal columns are what make that exact without measuring anything: a resize or a
 *     font swap cannot put it out of step. It travels on the spring easing, with a small overshoot
 *     — the one place the chrome is allowed to bounce, because a highlight settling into a seat
 *     is the gesture the whole bar exists to make.
 *   - **The icon you land on settles** (`.nav-icon-in`): down, past, and into place.
 *   - **The press lands on the contents**, scaled a little under the thumb — never on the link,
 *     so the 52px target does not shrink at the moment a finger is inside it.
 *
 * All of it is motion and material, none of it colour: the brandbook keeps colour for the
 * programmes, so chrome has only these two registers to be alive in. In Telegram a tap also ticks.
 *
 * The type stays quiet: 10px tracked capitals on every tab, the current one in full white and the
 * others in the second grey. Hierarchy is the highlight and the ink, not the size.
 *
 * Hidden from `md` up, where `TopNav` takes over; `AppShell` drops `--nav-inset` to match.
 */
export function BottomNav() {
  const { t } = useT();
  const { pathname } = useLocation();
  const active = activeTabIndex(pathname);

  return (
    <nav
      aria-label={t('app.navMain')}
      className={clsx(
        /*
         * Inset 16px from each side and 12px from the bottom, over the safe area and, in demo, the
         * demo strip — so the capsule floats above both rather than sitting on either. The width
         * is the phone column minus the two insets; on a tablet in portrait it stops at 448px,
         * because a capsule the width of an iPad is a band again.
         */
        'fixed left-1/2 z-30 w-[calc(100%-32px)] max-w-[448px] -translate-x-1/2 md:hidden',
        'bottom-[calc(var(--safe-bottom)+var(--demo-inset,0px)+12px)]',
        /*
         * `.glass-float`, the material for a floating object: an even tint rather than the bars'
         * gradient (a gradient is for an edge that content arrives from; a capsule has content on
         * every side), a heavier blur, a hairline ring that follows the radius and a shadow. Full
         * rounding, because this is the object the pill radius exists for now — see the token.
         */
        'glass-float rounded-pill',
      )}
    >
      {/* The row is its own element so the highlight is positioned against the four seats, inside
          the capsule's 6px padding. */}
      <div className="relative flex h-16 items-stretch p-1.5">
        <span
          aria-hidden="true"
          className={clsx(
            'pointer-events-none absolute inset-y-1.5 left-1.5 rounded-pill bg-paper/12',
            'transition-[transform,opacity] duration-420 ease-(--ease-spring)',
            'motion-reduce:transition-none',
            active < 0 && 'opacity-0',
          )}
          style={{
            width: `calc((100% - 12px) / ${ITEMS.length})`,
            transform: `translateX(${Math.max(0, active) * 100}%)`,
          }}
        />

        {ITEMS.map((item) => {
          const label = t(item.labelKey);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              aria-label={label}
              /* Every tap ticks, including one on the tab already open: the tick acknowledges the
                 touch, and a touch that landed correctly still deserves an answer. A no-op outside
                 Telegram, where there is no haptic engine to ask. */
              onClick={() => haptic('light')}
              className={({ isActive }) =>
                clsx(
                  'relative z-10 flex flex-1 flex-col items-center justify-center rounded-pill',
                  'transition-colors duration-150 ease-(--ease-out)',
                  isActive ? 'text-text' : 'text-muted-2 hover:text-muted',
                )
              }
            >
              {({ isActive }) => (
                <span
                  className={clsx(
                    'flex flex-col items-center gap-0.5',
                    'transition-transform duration-120 ease-(--ease-out)',
                    'active:scale-[0.9]',
                    'motion-reduce:transition-none motion-reduce:active:scale-100',
                  )}
                >
                  {/*
                   * Keyed on the tab's own state, so React remounts this span when the tab becomes
                   * current and the settle replays — and does nothing at all on the three tabs
                   * whose state did not change.
                   */}
                  <span key={isActive ? 'on' : 'off'} className={isActive ? 'nav-icon-in' : ''}>
                    <Icon name={item.icon} size={22} strokeWidth={isActive ? 2.25 : 1.9} />
                  </span>
                  <span className="control-label text-[10px] whitespace-nowrap">{label}</span>
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
