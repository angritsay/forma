import { clsx } from 'clsx';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { Logo } from '@/components/ui/Logo';
import { useT } from '@/app/hooks/useT';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { ProfileSheet } from '@/app/features/profile/ProfileSheet';
import { useSession } from '@/app/store/session';
import { activeTabIndex, tabItems, type NavItem } from './BottomNav';

/*
 * The destinations are `BottomNav`'s, imported rather than restated.
 *
 * They were two tables with the same four rows in them, kept in step by hand and by the test in
 * `routes.test.ts` — which checks that both link to routes that exist, not that both link to the
 * *same* routes. That was survivable while the bar was four fixed seats. It stops being
 * survivable now that the fourth seat is conditional: «Админка» appears for an admin in both
 * places, and two lists that each decide that for themselves are two chances to get it wrong.
 */

function NavWord({
  item,
  active,
  innerRef,
}: {
  item: NavItem;
  /** Decided by `activeTabIndex`, so the word and the mark under it agree — see `BottomNav`. */
  active: boolean;
  innerRef: (el: HTMLElement | null) => void;
}) {
  const { t } = useT();
  return (
    <NavLink
      ref={innerRef}
      to={item.to}
      end={item.end}
      className={clsx(
        /*
         * One voice for all of them, and the mark below says which you are in.
         *
         * The current destination used to be set large in the display face while the rest stayed
         * small tracked capitals, which read well in a still screenshot and badly in use: a word
         * growing from 11px to 16px in another family is a different width, so the whole row
         * reflowed on every navigation and the three words you did not choose moved out from
         * under the pointer. The tab bar had already answered this for itself — «hierarchy is
         * the rule and the ink now, not the size» — and this is that same answer, which is also
         * what lets the mark below travel instead of jumping.
         */
        'control-label flex h-16 items-center text-[11px]',
        'transition-colors duration-150 ease-(--ease-out)',
        active ? 'text-text' : 'text-muted-2 hover:text-text',
      )}
    >
      {t(item.labelKey)}
    </NavLink>
  );
}

/**
 * The navigation from `md` up: one row across the top, where `BottomNav` hides.
 *
 * It replaces the left rail (`SideNav`), and the choice was the owner's — a top row is what the
 * site's own header is (`layouts/Landing.astro`), so the app and the site read as one product
 * instead of two. It is typographic like the tab bar: no icons, no accent edge, the current
 * destination simply set large.
 *
 * **It starts at `md`, not `lg`, and that is the point of the whole component.** The app used to be
 * a 480px phone column until 1024px, so every tablet — an iPad in portrait is 820 — showed a phone
 * stranded in the middle of a grey field with the tab bar clipped to the column's own edges. There
 * was no treatment between the two. Now there is one line: below `md` it is a phone, above it the
 * screen is used.
 *
 * The admin's *sub*-destinations are not here. There are five of them and they are long
 * («Конструктор тренировок»), so a row would either wrap or ellipsise; they get their own rail
 * inside `/admin` (`AdminNav`), where the width is affordable and nothing has to be truncated.
 * This row carries the one word «Админка» for the whole area — and carries it as a seat of the
 * bar, not as a word appended after the seats.
 *
 * Glass, because it qualifies: the page genuinely scrolls underneath a sticky bar, which is the
 * condition `design/CHANGELOG.md` §8 sets for the material being worth its compositing layer.
 */
export function TopNav() {
  const { t } = useT();
  const admin = useIsAdmin() === true;
  /*
   * Memoized, and not a nicety: an admin's seats are a fresh array on every render, and this array
   * is a dependency of the layout effect below. Without the memo the effect ran after every render,
   * set the mark to a new object, and re-rendered — «Maximum update depth exceeded» on the first
   * screen an admin opened.
   */
  const items = useMemo(() => tabItems(admin), [admin]);
  const profile = useSession((s) => s.profile);
  const user = useSession((s) => s.user);
  const { pathname } = useLocation();
  const active = activeTabIndex(pathname, admin);
  const [sheet, setSheet] = useState(false);

  /*
   * The mark under the current destination, and the one thing here that has to be measured.
   *
   * The tab bar gets this for free — equal columns, so the mark is one seat wide and travels in
   * seats. These words are «Курсы» and «Клуб» and «Админка», so the mark has to ask each one how
   * wide it is. `useLayoutEffect` rather than `useEffect` so it is placed in the same
   * frame the route changed in, and never seen at the old width for a paint.
   *
   * A `ResizeObserver` on the row keeps it honest afterwards: the admin word appears once
   * `useIsAdmin` resolves, and the fonts land a moment after first paint — both move the words
   * under a mark that would otherwise stay where it was.
   */
  const row = useRef<HTMLDivElement>(null);
  const words = useRef(new Map<string, HTMLElement>());
  const [mark, setMark] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const place = () => {
      const box = row.current;
      /* The seat the bar itself would light — one rule for the mark, the ink and the tab bar. */
      const el = active < 0 ? undefined : words.current.get(items[active]?.to ?? '');
      if (!box || !el) return setMark(null);
      /* Only when it actually moved: a `ResizeObserver` fires for reasons that are not a move, and
         a fresh object with the same two numbers in it is still a re-render. */
      const next = { left: el.offsetLeft, width: el.offsetWidth };
      setMark((prev) =>
        prev && prev.left === next.left && prev.width === next.width ? prev : next,
      );
    };
    place();
    const box = row.current;
    if (!box || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(place);
    ro.observe(box);
    return () => ro.disconnect();
  }, [active, items]);

  const register = (to: string) => (el: HTMLElement | null) => {
    if (el) words.current.set(to, el);
    else words.current.delete(to);
  };

  return (
    <nav
      aria-label={t('app.navMain')}
      className="glass-bar-top sticky top-0 z-30 hidden pt-[var(--safe-top)] md:block"
    >
      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-8 px-6 md:px-10">
        <Logo className="shrink-0 text-lg" />
        <div ref={row} className="relative flex min-w-0 flex-1 items-center gap-7">
          {/* «Админка» is one of these now rather than a word appended after the loop: it is a seat
              «наравне с курсами, клубом и тренером», and the mark can only travel to a word the
              row has actually registered. */}
          {items.map((item, i) => (
            <NavWord key={item.to} item={item} active={i === active} innerRef={register(item.to)} />
          ))}
          {/*
           * The same 2px rule the tab bar uses, on the bar's own bottom edge rather than beside
           * it. It travels for the same reason it travels down there: one mark moving between the
           * words says they are seats of one object, where a mark blinking on and off in three
           * places would say three unrelated things happened.
           */}
          <span
            aria-hidden="true"
            className={clsx(
              'pointer-events-none absolute bottom-0 left-0 h-[2px] bg-primary',
              'transition-[transform,width,opacity] duration-280 ease-(--ease-out)',
              'motion-reduce:transition-none',
              mark ? 'opacity-100' : 'opacity-0',
            )}
            style={{ width: mark?.width ?? 0, transform: `translateX(${mark?.left ?? 0}px)` }}
          />
        </div>
        {/* The same avatar and the same sheet as the header of «Курсы»: there is no profile screen
            to navigate to any more, and an account is a small thing you look at, not a place. */}
        <button
          type="button"
          aria-label={t('app.profileTitle')}
          onClick={() => setSheet(true)}
          className="tap-target shrink-0 rounded-pill transition-opacity duration-150 ease-(--ease-out) hover:opacity-80"
        >
          <Avatar
            seed={profile?.avatarSeed ?? user?.id ?? ''}
            name={profile?.displayName ?? user?.email}
            size={32}
          />
        </button>
      </div>
      <ProfileSheet open={sheet} onClose={() => setSheet(false)} />
    </nav>
  );
}
