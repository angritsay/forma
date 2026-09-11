import { clsx } from 'clsx';
import { NavLink } from 'react-router';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useT } from '@/app/hooks/useT';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import type { TKey } from '@/i18n/index';

interface NavItem {
  to: string;
  icon: IconName;
  labelKey: TKey;
  end?: boolean;
}

const ITEMS: readonly NavItem[] = [
  { to: '/', icon: 'home', labelKey: 'app.tabHome', end: true },
  { to: '/courses', icon: 'courses', labelKey: 'app.tabCourses' },
  { to: '/stats', icon: 'stats', labelKey: 'app.tabStats' },
  { to: '/profile', icon: 'profile', labelKey: 'app.tabProfile' },
];

/** Admin destinations, appended for admins only — the same links the profile screen exposes. */
const ADMIN_ITEMS: readonly NavItem[] = [
  { to: '/admin', icon: 'settings', labelKey: 'app.adminPurchases', end: true },
  { to: '/admin/workouts', icon: 'edit', labelKey: 'app.builderScreenTitle' },
];

const LINK =
  'flex items-center gap-3 border-l-2 py-2.5 pl-4 text-[15px] transition-colors' as const;

function NavRow({ item }: { item: NavItem }) {
  const { t } = useT();
  const label = t(item.labelKey);
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        clsx(
          LINK,
          isActive
            ? 'border-l-accent text-text'
            : 'border-l-transparent text-muted hover:border-l-border-strong hover:text-text',
        )
      }
    >
      <Icon name={item.icon} size={18} />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

/**
 * The desktop navigation: a fixed column of destinations down the left edge, shown from `lg` up
 * where `BottomNav` hides.
 *
 * A phone tab bar transplanted onto a 1440px screen leaves four icons stranded at the bottom of
 * an otherwise empty page; a column puts them where a pointer already is and leaves room for the
 * admin destinations, which is where the owner actually spends her time. Marking the active item
 * with an accent left edge rather than a filled block is the same treatment the leaderboard uses
 * for "this is you".
 */
export function SideNav() {
  const { t } = useT();
  const admin = useIsAdmin();
  return (
    <nav
      aria-label={t('app.navMain')}
      className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-8 overflow-y-auto border-r border-border py-6 lg:flex"
    >
      <span className="wordmark px-4 text-xl">
        Forma<span className="text-accent">.</span>
      </span>
      <div className="flex flex-col">
        {ITEMS.map((item) => (
          <NavRow key={item.to} item={item} />
        ))}
      </div>
      {admin ? (
        <div className="flex flex-col">
          <span className="eyebrow px-4 pb-2">{t('app.adminTitle')}</span>
          {ADMIN_ITEMS.map((item) => (
            <NavRow key={item.to} item={item} />
          ))}
        </div>
      ) : null}
    </nav>
  );
}
