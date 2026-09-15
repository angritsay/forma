import { clsx } from 'clsx';
import { useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { Logo } from '@/components/ui/Logo';
import { useT } from '@/app/hooks/useT';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { useSession } from '@/app/store/session';
import type { TKey } from '@/i18n/index';

interface NavItem {
  to: string;
  labelKey: TKey;
  end?: boolean;
}

/** The same four destinations as the tab bar, in the same order. */
const ITEMS: readonly NavItem[] = [
  { to: '/', labelKey: 'app.tabHome', end: true },
  { to: '/courses', labelKey: 'app.tabPrograms' },
  { to: '/marathon', labelKey: 'app.tabGame' },
  { to: '/stats', labelKey: 'app.tabReports' },
];

function NavWord({
  item,
  innerRef,
}: {
  item: NavItem;
  innerRef: (el: HTMLElement | null) => void;
}) {
  const { t } = useT();
  return (
    <NavLink
      ref={innerRef}
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        clsx(
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
          isActive ? 'text-text' : 'text-muted-2 hover:text-text',
        )
      }
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
 * Admin destinations are not here. There are five of them and they are long («Конструктор
 * тренировок»), so a row would either wrap or ellipsise; they get their own rail inside `/admin`
 * (`AdminNav`), where the width is affordable and nothing has to be truncated. This row carries one
 * word for the whole area.
 *
 * Glass, because it qualifies: the page genuinely scrolls underneath a sticky bar, which is the
 * condition `design/CHANGELOG.md` §8 sets for the material being worth its compositing layer.
 */
export function TopNav() {
  const { t } = useT();
  const navigate = useNavigate();
  const admin = useIsAdmin();
  const profile = useSession((s) => s.profile);
  const user = useSession((s) => s.user);
  const { pathname } = useLocation();

  /*
   * The mark under the current destination, and the one thing here that has to be measured.
   *
   * The tab bar gets this for free — four equal columns, so the mark is a quarter wide and travels
   * in quarters. These words are «Сегодня» and «Челлендж» and «Админка», so the mark has to ask
   * each one how wide it is. `useLayoutEffect` rather than `useEffect` so it is placed in the same
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
      const el = [...words.current.entries()].find(([to]) =>
        to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`),
      )?.[1];
      if (!box || !el) return setMark(null);
      setMark({ left: el.offsetLeft, width: el.offsetWidth });
    };
    place();
    const box = row.current;
    if (!box || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(place);
    ro.observe(box);
    return () => ro.disconnect();
  }, [pathname, admin]);

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
          {ITEMS.map((item) => (
            <NavWord key={item.to} item={item} innerRef={register(item.to)} />
          ))}
          {admin ? (
            <NavWord
              item={{ to: '/admin', labelKey: 'app.adminTitle' }}
              innerRef={register('/admin')}
            />
          ) : null}
          {/*
           * The same 2px rule the tab bar uses, on the bar's own bottom edge rather than beside
           * it. It travels for the same reason it travels down there: one mark moving between five
           * words says they are five seats of one object, where five marks blinking would say five
           * unrelated things happened.
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
        <button
          type="button"
          aria-label={t('app.homeProfile')}
          onClick={() => navigate('/profile')}
          className="tap-target shrink-0 rounded-control transition-opacity duration-150 ease-(--ease-out) hover:opacity-80"
        >
          <Avatar
            seed={profile?.avatarSeed ?? user?.id ?? ''}
            name={profile?.displayName ?? user?.email}
            size={32}
          />
        </button>
      </div>
    </nav>
  );
}
