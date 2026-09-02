import { clsx } from 'clsx';
import { NavLink } from 'react-router';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useT } from '@/app/hooks/useT';
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

/** Floating pill tab bar; the active tab is a white pill with icon + label. */
export function BottomNav() {
  const { t } = useT();
  return (
    <nav
      aria-label={t('app.navMain')}
      className="fixed bottom-0 left-1/2 z-30 w-full max-w-[480px] -translate-x-1/2 px-4 pb-[max(env(safe-area-inset-bottom),12px)]"
    >
      <div className="flex h-16 items-center justify-around rounded-pill border border-border bg-surface/95 px-2 shadow-card backdrop-blur-md">
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
                  'flex h-12 items-center justify-center gap-2 rounded-pill transition-colors',
                  isActive ? 'bg-primary px-4 text-on-primary' : 'px-3 text-muted hover:text-text',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon name={item.icon} size={22} />
                  {isActive ? <span className="text-sm font-semibold">{label}</span> : null}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
