import { clsx } from 'clsx';
import { NavLink, useNavigate } from 'react-router';
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

function NavWord({ item }: { item: NavItem }) {
  const { t } = useT();
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        clsx(
          'flex h-16 items-center transition-colors duration-150 ease-(--ease-out)',
          // The same two voices as the tab bar: the place you are in is the one word set in the
          // display face, everything else is a small tracked label that brightens under a pointer.
          isActive
            ? 'font-display text-base text-text'
            : 'control-label text-[11px] text-muted-2 hover:text-text',
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

  return (
    <nav
      aria-label={t('app.navMain')}
      className="glass-bar-top sticky top-0 z-30 hidden pt-[var(--safe-top)] md:block"
    >
      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-8 px-6 md:px-10">
        <Logo className="shrink-0 text-lg" />
        <div className="flex min-w-0 flex-1 items-center gap-7">
          {ITEMS.map((item) => (
            <NavWord key={item.to} item={item} />
          ))}
          {admin ? <NavWord item={{ to: '/admin', labelKey: 'app.adminTitle' }} /> : null}
        </div>
        <button
          type="button"
          aria-label={t('app.homeProfile')}
          onClick={() => navigate('/profile')}
          className="tap-target shrink-0 rounded-control"
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
