import { clsx } from 'clsx';
import { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router';
import { haptic } from '@/lib/telegram/webapp';
import { useT } from '@/app/hooks/useT';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import type { TKey } from '@/i18n/index';

export interface NavItem {
  to: string;
  labelKey: TKey;
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
 * «Курсы» now, and the workout count and the achievements are two small entry points beside it.
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
    end: true,
    owns: ['/courses', '/achievements'],
  },
  { to: '/marathon', labelKey: 'app.tabGame' },
  { to: '/book', labelKey: 'app.tabCoach' },
];

/** The fourth seat. Appended, never inserted: the three the product is keep their order. */
const ADMIN_TAB: NavItem = { to: '/admin', labelKey: 'app.adminTitle' };

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
 * -1 is a real answer, not a failure: `/leaderboard` and the player's summary both show
 * this bar and belong to no seat, and the highlight fades out rather than pointing at one of them.
 */
export function activeTabIndex(pathname: string, admin = false): number {
  const under = (base: string) => pathname === base || pathname.startsWith(`${base}/`);
  return tabItems(admin).findIndex(
    (item) => (item.end ? pathname === item.to : under(item.to)) || (item.owns ?? []).some(under),
  );
}

/**
 * The tab bar: an iOS segmented control floating over the bottom of the screen, with one capsule
 * that slides to the seat you chose.
 *
 * This is the owner's own mockup, sent with «Обрати внимание на дизайн который я скинула. Сделай
 * под него», and it is the second reduction of this bar. It was a band across the bottom edge
 * («ощущается как по андроидовке … смотри в сторону iOS»), then a floating glass capsule with an
 * icon and a tracked-caps label per seat; the mockup keeps the floating capsule and throws out
 * everything inside it. No icons and no capitals — three plain words, «Курсы · Клуб · Тренер»,
 * with the current one wearing a lighter capsule. What is left is a *segmented control*: the seats
 * are one object you switch between, not four separate places you launch.
 *
 * Two of the three things dropped were carrying real weight and are worth naming, so nobody puts
 * them back by accident. The **icons** were a second name for each seat in a language nobody had
 * to learn — but a stopwatch over the word «Тренер» only repeats the word, and the set had to
 * invent a mark for «Админка» that means nothing at all. The **tracked capitals** were the app's
 * control voice everywhere; the mockup sets every control on both screens in sentence case, which
 * is the departure that makes the redesign read as iOS rather than as a brandbook.
 *
 * What survives is what the bar actually does:
 *
 *   - **The highlight is one element that slides, not three that blink.** A lighter capsule inside
 *     the container, one seat wide, that travels by `translateX(n × 100%)` of its own width. Equal
 *     columns are what make that exact without measuring anything: a resize or a font swap cannot
 *     put it out of step. Its width is a share of `items.length` and not of a hard-coded four,
 *     because the bar has three seats for most people and four for an admin, and a highlight that
 *     assumed four would sit a third short of every seat on everybody else's phone. It travels on
 *     the spring easing, with a small overshoot — the one place the chrome is allowed to bounce,
 *     because a highlight settling into a seat is the gesture the whole bar exists to make.
 *   - **The press lands on the word**, scaled a little under the thumb — never on the link, so the
 *     44px target does not shrink at the moment a finger is inside it.
 *   - **In Telegram a tap ticks.**
 *
 * The capsule is the one piece of colour the chrome carries: electric blue, the hero field's
 * colour, so the seat you are in and the thing happening on the screen speak the same colour.
 *
 * The container is inset far more than a tab bar usually is — the mockup puts it at 292 of 375,
 * about 78% of the column — which is what makes it read as a control laid on the screen rather
 * than as chrome fixed to its bottom edge. The one accommodation for the admin's fourth seat is
 * that it is a *minimum* inset rather than a fixed one: «Админка» is a longer word than any of
 * the three and a fourth segment of the mockup's width does not hold it.
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
         * Inset from each side and 12px from the bottom, over the safe area and, in demo, the demo
         * strip — so the control floats above both rather than sitting on either. On a tablet in
         * portrait it stops at 360px, because a segmented control the width of an iPad is a band
         * again.
         *
         * The inset is the mockup's 44px for three seats and 16px for four. This is the one place
         * the admin's seat changes the bar's geometry rather than just its arithmetic: four
         * segments of 304px leave «Админка» 76px, and the word does not fit in it. It is still one
         * segment per seat and one capsule one segment wide — only the row it divides is wider.
         */
        'fixed left-1/2 z-30 -translate-x-1/2 md:hidden',
        items.length > 3
          ? 'w-[calc(100%-32px)] max-w-[448px]'
          : 'w-[calc(100%-88px)] max-w-[360px]',
        'bottom-[calc(var(--safe-bottom)+var(--demo-inset,0px)+12px)]',
        /*
         * `.glass-capsule` is the material, `.nav-segmented` the ring and the shadow (global.css).
         *
         * The bar has been glass, opaque and glass again, and the middle step is why this glass is
         * tuned the way it is. The first glass, `.glass-float`, was a *flat* alpha, which
         * `design/CHANGELOG.md` §8 records as tried and rejected: with the leaderboard scrolled
         * underneath, the row «13 Настя 105» was legible inside the capsule, so the bar went
         * solid. The owner then asked for the glass back on every plate (§16), and the answer to
         * the objection is density rather than opacity — the capsule is a gradient of the ground,
         * .62 at its top edge and .96 where «Курсы · Клуб · Тренер» sit, so a scrolled row reads
         * as texture under the sheer edge and nothing reads through the words. The leaderboard is
         * still the case to check it against.
         *
         * Full rounding, because this is the object the pill radius exists for now — see the token.
         */
        'glass-capsule nav-segmented rounded-pill',
      )}
    >
      {/* The row is its own element so the capsule is positioned against the seats themselves,
          inside the container's 4px padding. */}
      <div className="relative flex h-11 items-stretch p-1">
        <span
          aria-hidden="true"
          className={clsx(
            /* The blue pill of the third palette (global.css header, style A): the current seat
               wears the hero field's electric blue. Its word is white on it and nothing else —
               7.71:1 — while `--muted` there would measure 3.4, so the grey stays for the words
               on the container, which is far darker. */
            'pointer-events-none absolute inset-y-1 left-1 rounded-pill bg-field',
            'transition-[transform,opacity] duration-420 ease-(--ease-spring)',
            'motion-reduce:transition-none',
            active < 0 && 'opacity-0',
          )}
          style={{
            width: `calc((100% - 8px) / ${items.length})`,
            transform: `translateX(${Math.max(0, active) * 100}%)`,
          }}
        />

        {items.map((item, i) => {
          const label = t(item.labelKey);
          /*
           * The ink and the capsule take the same answer, from `activeTabIndex` and not from
           * `NavLink`'s own match. They used to disagree wherever a seat owns a screen that is not
           * under its own path: inside a course the capsule sat on «Курсы» — `/` owns
           * `/courses/*` — while the word under it stayed grey, because `end` makes `NavLink`
           * match `/` and nothing else. One rule, one lit seat.
           */
          const isActive = i === active;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              /* Every tap ticks, including one on the tab already open: the tick acknowledges the
                 touch, and a touch that landed correctly still deserves an answer. A no-op outside
                 Telegram, where there is no haptic engine to ask. */
              onClick={() => haptic('light')}
              className={clsx(
                /* `.tap-target-y` because the row is 36px tall inside a 44px container and the
                   mockup's proportions are what make it a segmented control: the hit area grows
                   with a pseudo-element instead of the box. */
                'tap-target-y relative z-10 flex min-w-0 flex-1 items-center justify-center rounded-pill',
                'transition-colors duration-150 ease-(--ease-out)',
                isActive ? 'text-on-field' : 'text-muted hover:text-text',
              )}
            >
              <span
                className={clsx(
                  /* Sentence case and the text face — the mockup's departure from the tracked
                     capitals this bar used to set. Medium rather than regular so the word holds
                     its own against the capsule under it without changing size. */
                  'truncate px-1 text-[14px] leading-none font-medium',
                  'transition-transform duration-120 ease-(--ease-out)',
                  'active:scale-[0.92]',
                  'motion-reduce:transition-none motion-reduce:active:scale-100',
                )}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
