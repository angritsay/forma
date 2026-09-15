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
 * The bar holds the four things the app *is* — today, the programmes, the challenge, the numbers — and
 * a profile is none of them: it is opened a handful of times ever, and it was taking a quarter of
 * the width every day. It lives where a phone owner already looks for it, as the avatar in the top
 * right of the home screen (HomeScreen's `chrome`), and the seat it gave up went to the challenge,
 * which used to be reachable only through a card on the home deck.
 *
 * «Курсы» is «Программы» here, and in the product generally: a course is one shape a programme
 * can take, and the tab holds them alongside the challenge.
 */
const ITEMS: readonly NavItem[] = [
  { to: '/', labelKey: 'app.tabHome', icon: 'home', end: true },
  { to: '/courses', labelKey: 'app.tabPrograms', icon: 'courses' },
  { to: '/marathon', labelKey: 'app.tabGame', icon: 'trophy' },
  { to: '/stats', labelKey: 'app.tabReports', icon: 'stats' },
];

/**
 * Which tab a path belongs to, or -1 for a screen that is in none of them.
 *
 * `NavLink` decides this per link and keeps the answer to itself, which is no use to a mark that
 * has to know *where* to travel. So the rule is written once here, and it is the same rule
 * `NavLink` uses: an exact match for the root, a path-segment prefix for the rest — `/courses/start`
 * is inside «Программы», and `/coursesomething` is not, which is the whole reason the `/` is in the
 * prefix rather than a bare `startsWith`.
 *
 * -1 is a real answer, not a failure: `/profile`, `/book` and `/steps` all show this bar and belong
 * to no tab, and the mark hides rather than pointing at one of them.
 */
export function activeTabIndex(pathname: string): number {
  return ITEMS.findIndex((item) =>
    item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`),
  );
}

/**
 * The tab bar: four equal columns, a mark over a word, and one rule that travels to the tab you
 * are on.
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
 * **The rule is one element that moves, not four that blink**, and that is the difference between
 * a bar that changes and a bar that answers. Four separate rules switching on and off say four
 * unrelated things happened; one rule sliding from the third column to the fourth says these are
 * four seats of one object and you moved between them. It costs a transform and nothing else: the
 * columns are equal, so the mark is a quarter wide and travels in quarters — nothing is measured,
 * so there is nothing to fall out of step on a resize or a font swap.
 *
 * Two more things answer the touch, because a bar that only recolours feels like a picture of a
 * bar. The icon of the tab you land on settles into place (`.nav-icon-in`), and the column takes
 * the press with a small scale — on the contents, never on the link, so the 56px target does not
 * shrink under the thumb that is inside it. In Telegram the tap also ticks.
 *
 * All three are motion and material, and none of them is colour. That is not restraint for its own
 * sake: the brandbook keeps colour for the programmes, so chrome has exactly these two registers to
 * be alive in.
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
  const { pathname } = useLocation();
  const active = activeTabIndex(pathname);

  return (
    <nav
      aria-label={t('app.navMain')}
      /* Hidden from `md` up, where TopNav takes over; AppShell drops `--nav-inset` to match.
         `md`, not `lg`: between the two the app used to be a 480px phone column stranded in the
         middle of a tablet, with this bar clipped to the column's own edges. */
      className={clsx(
        'fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 md:hidden',
        /*
         * Glass, and the bar is where it works best: it is already `fixed`, so the screen genuinely
         * scrolls underneath rather than stopping above it, and `--nav-inset` already reserves the
         * room. `.glass-bar` brings its own hairline along the top edge, which is why the border
         * utility that used to sit here is gone — the material owns its edge now.
         *
         * Its corners stay square on purpose, against the rounding going on everywhere else. This
         * bar is edge-to-edge chrome touching three sides of a phone screen; a radius there reads
         * as a mistake rather than as a panel, and it would cut the active rule short on the two
         * outer tabs and nowhere else. Rounding is for surfaces that float.
         */
        'glass-bar block',
        'pl-[var(--safe-left)] pr-[var(--safe-right)]',
        'pb-[calc(var(--safe-bottom)+var(--demo-inset,0px))]',
      )}
    >
      {/* The row is its own element so the mark is positioned against the four columns rather than
          against the bar's padding box, which carries the safe area and the demo strip. */}
      <div className="relative flex items-stretch">
        {/*
         * The travelling rule. It sits on the bar's own hairline rather than beside it, so the
         * current tab reads as a tab pulled forward rather than as a word that changed colour.
         *
         * Width and travel are both quarters of this row, which is what makes it exact without
         * measuring: the mark over tab *n* is `translateX(n × 100%)` of its own width. A fifth tab
         * would need this one divisor changed and nothing else.
         */}
        <span
          aria-hidden="true"
          className={clsx(
            'pointer-events-none absolute top-[-1px] left-0 h-[2px] bg-primary',
            'transition-[transform,opacity] duration-280 ease-(--ease-out)',
            'motion-reduce:transition-none',
            active < 0 && 'opacity-0',
          )}
          style={{
            width: `${100 / ITEMS.length}%`,
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
                  /*
                   * The 56px row lives on the links, so the bar's own padding (safe area, demo
                   * strip) adds to it instead of eating into it — and every tab is a 56px target.
                   */
                  'relative flex min-h-14 flex-1 flex-col items-center justify-center',
                  'transition-colors duration-150 ease-(--ease-out)',
                  isActive ? 'text-text' : 'text-muted-2 hover:text-muted',
                )
              }
            >
              {({ isActive }) => (
                /*
                 * The press lands on the contents, not on the link: scaling the link would shrink
                 * the tap target at the exact moment a thumb is inside it.
                 */
                <span
                  className={clsx(
                    'flex flex-col items-center gap-1',
                    'transition-transform duration-120 ease-(--ease-out)',
                    'active:scale-[0.92]',
                    'motion-reduce:transition-none motion-reduce:active:scale-100',
                  )}
                >
                  {/*
                   * Keyed on the tab's own state, so React remounts this span when the tab becomes
                   * current and the settle replays — and does nothing at all on the three tabs
                   * whose state did not change.
                   */}
                  <span key={isActive ? 'on' : 'off'} className={isActive ? 'nav-icon-in' : ''}>
                    <Icon name={item.icon} size={20} strokeWidth={isActive ? 2.25 : 2} />
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
