import { clsx } from 'clsx';
import { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router';
import { Icon, type IconName } from '@/components/ui/Icon';
import { haptic } from '@/lib/telegram/webapp';
import { useT } from '@/app/hooks/useT';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import type { TKey } from '@/i18n/index';

export interface NavItem {
  to: string;
  labelKey: TKey;
  icon: IconName;
  /** Match the path exactly rather than as a prefix — the root seat, which would swallow the rest. */
  end?: boolean;
  /**
   * Other path prefixes this seat owns.
   *
   * A seat is lit by the screens that live inside it, and «Курсы» sits on `/` — which, matched
   * exactly, is lit by nothing but itself. A course's path, a day inside it and the achievements
   * catalogue are all opened *from* «Курсы» and belong to it, so they are named here.
   */
  owns?: readonly string[];
}

/*
 * Three tabs, and a fourth seat that only an admin ever sees.
 *
 * «Измени архитектуру приложения на три вкладки — курсы, клуб, тренер … А для тех у кого есть
 * доступ к админке появляется еще одна вкладка админка наравне с курсами, клубом и тренером.»
 *
 * What went: «Сегодня», whose one question — what am I doing today — is the first thing «Курсы»
 * answers, and «Прогресс», which was a tab full of figures about a screen that no longer existed.
 * The profile had already given up its seat; its last five rows are a sheet behind the avatar on
 * «Курсы» now, and the streak and the achievements are two small entry points beside it.
 *
 * The three that are left are the three things the product *is*: the courses you are walking, the
 * club that meets every day, and the coach whose hour you can book. The admin's seat is not a
 * fourth thing the product is — it is the same bar with one more seat, for the two or three people
 * who have the panel, and it is «наравне» with the rest rather than tucked inside a profile.
 *
 * The internal paths did not move with the words: `/` is «Курсы», `/marathon` is «Клуб»,
 * `/book` is «Тренер». Renaming them churns five files and changes nothing anybody can see.
 */
const TABS: readonly NavItem[] = [
  {
    to: '/',
    labelKey: 'app.tabCourses',
    icon: 'courses',
    end: true,
    owns: ['/courses', '/achievements'],
  },
  { to: '/marathon', labelKey: 'app.tabGame', icon: 'people' },
  { to: '/book', labelKey: 'app.tabCoach', icon: 'coach' },
];

/** The fourth seat. Appended, never inserted: the three the product is keep their order. */
const ADMIN_TAB: NavItem = { to: '/admin', labelKey: 'app.adminTitle', icon: 'settings' };

/** The seats this bar actually has — three, or four for somebody with the panel. */
export function tabItems(admin: boolean): readonly NavItem[] {
  return admin ? [...TABS, ADMIN_TAB] : TABS;
}

/**
 * Which tab a path belongs to, or -1 for a screen that is in none of them.
 *
 * `NavLink` decides this per link and keeps the answer to itself, which is no use to a highlight
 * that has to know *where* to travel. So the rule is written once here, and it is the same rule
 * `NavLink` uses: an exact match for the root, a path-segment prefix for the rest — `/marathon/board`
 * is inside «Клуб», and `/marathonish` is not, which is the whole reason the `/` is in the prefix
 * rather than a bare `startsWith`.
 *
 * **`admin` is a parameter and not a lookup, because the answer depends on how many seats the bar
 * drew.** The highlight travels in multiples of its own width and its own width is a share of the
 * row, so an index of 3 in a three-seat bar does not mean "the admin tab", it means one seat past
 * the end. Asking the caller which bar it is keeps the index and the geometry from ever disagreeing.
 *
 * -1 is a real answer, not a failure: `/leaderboard`, `/steps` and the player's summary all show
 * this bar and belong to no seat, and the highlight fades out rather than pointing at one of them.
 */
export function activeTabIndex(pathname: string, admin = false): number {
  const under = (base: string) => pathname === base || pathname.startsWith(`${base}/`);
  return tabItems(admin).findIndex(
    (item) => (item.end ? pathname === item.to : under(item.to)) || (item.owns ?? []).some(under),
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
 *   - **The highlight is one element that slides, not three that blink.** A lighter capsule inside
 *     the capsule, one seat wide, that travels by `translateX(n × 100%)` of its own width. Equal
 *     columns are what make that exact without measuring anything: a resize or a font swap cannot
 *     put it out of step. Its width is a share of `items.length` and not of a hard-coded four,
 *     because the bar has three seats for most people and four for an admin, and a highlight that
 *     assumed four would sit a third short of every seat on everybody else's phone. It travels on
 *     the spring easing, with a small overshoot
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
  /*
   * `useIsAdmin` answers `null` until the RPC lands, and `null` has to mean "three seats" here
   * rather than "wait": the bar is the first thing on screen and a bar that appears a beat late,
   * or appears with three seats and grows a fourth under the thumb, is worse than an admin
   * waiting one round-trip for a seat they open once a week.
   */
  const admin = useIsAdmin() === true;
  const items = useMemo(() => tabItems(admin), [admin]);
  const active = activeTabIndex(pathname, admin);

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
      {/* The row is its own element so the highlight is positioned against the seats themselves,
          inside the capsule's 6px padding. */}
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
            width: `calc((100% - 12px) / ${items.length})`,
            transform: `translateX(${Math.max(0, active) * 100}%)`,
          }}
        />

        {items.map((item, i) => {
          const label = t(item.labelKey);
          /*
           * The ink and the highlight take the same answer, from `activeTabIndex` and not from
           * `NavLink`'s own match. They used to disagree wherever a seat owns a screen that is not
           * under its own path: inside a course the highlight sat on «Курсы» — `/` owns
           * `/courses/*` — while the word under it stayed grey, because `end` makes `NavLink`
           * match `/` and nothing else. One rule, one lit seat.
           */
          const isActive = i === active;
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
              className={clsx(
                'relative z-10 flex flex-1 flex-col items-center justify-center rounded-pill',
                'transition-colors duration-150 ease-(--ease-out)',
                isActive ? 'text-text' : 'text-muted-2 hover:text-muted',
              )}
            >
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
                 * current and the settle replays — and does nothing at all on the tabs whose
                 * state did not change.
                 */}
                <span key={isActive ? 'on' : 'off'} className={isActive ? 'nav-icon-in' : ''}>
                  <Icon name={item.icon} size={22} strokeWidth={isActive ? 2.25 : 1.9} />
                </span>
                <span className="control-label text-[10px] whitespace-nowrap">{label}</span>
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
