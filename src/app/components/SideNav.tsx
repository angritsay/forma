import { clsx } from 'clsx';
import { NavLink } from 'react-router';
import { Logo } from '@/components/ui/Logo';
import { useT } from '@/app/hooks/useT';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
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

/** Admin destinations, appended for admins only — the same links the profile screen exposes. */
const ADMIN_ITEMS: readonly NavItem[] = [
  { to: '/admin', labelKey: 'app.adminPurchases', end: true },
  { to: '/admin/workouts', labelKey: 'app.builderScreenTitle' },
  { to: '/admin/courses', labelKey: 'app.courseNavLabel' },
  { to: '/admin/exercises', labelKey: 'app.exScreenTitle' },
  { to: '/admin/marathons', labelKey: 'app.mAdminNav' },
];

function NavRow({ item }: { item: NavItem }) {
  const { t } = useT();
  const label = t(item.labelKey);
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        clsx(
          'flex min-h-11 items-center px-5.5 transition-colors duration-150 ease-(--ease-out)',
          // The same two voices as the tab bar: the current place is the one word in the display
          // face, everything else is a small tracked label that only brightens under the pointer.
          isActive
            ? 'font-display text-base text-text'
            : 'control-label text-[10px] text-muted-2 hover:text-text',
        )
      }
    >
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

/**
 * The desktop navigation: a fixed column of destinations down the left edge, shown from `lg` up
 * where `BottomNav` hides.
 *
 * A phone tab bar transplanted onto a 1440px screen leaves four words stranded at the bottom of
 * an otherwise empty page; a column puts them where a pointer already is and leaves room for the
 * admin destinations, which is where the owner actually spends her time. It is typographic like
 * the tab bar — no icons, no accent edge: the active item is simply the one set large.
 */
export function SideNav() {
  const { t } = useT();
  const admin = useIsAdmin();
  return (
    <nav
      aria-label={t('app.navMain')}
      className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-8 overflow-y-auto border-r border-border py-6 lg:flex"
    >
      <Logo className="px-5.5 text-xl" />
      <div className="flex flex-col">
        {ITEMS.map((item) => (
          <NavRow key={item.to} item={item} />
        ))}
      </div>
      {admin ? (
        <div className="flex flex-col">
          <span className="eyebrow mx-5.5 border-t border-border pt-4 pb-2">
            {t('app.adminTitle')}
          </span>
          {ADMIN_ITEMS.map((item) => (
            <NavRow key={item.to} item={item} />
          ))}
        </div>
      ) : null}
    </nav>
  );
}
