import { clsx } from 'clsx';
import { NavLink } from 'react-router';
import { useT } from '@/app/hooks/useT';
import type { TKey } from '@/i18n/index';

interface AdminItem {
  to: string;
  labelKey: TKey;
  end?: boolean;
}

const ITEMS: readonly AdminItem[] = [
  { to: '/admin', labelKey: 'app.adminPurchases', end: true },
  { to: '/admin/workouts', labelKey: 'app.builderScreenTitle' },
  { to: '/admin/courses', labelKey: 'app.courseNavLabel' },
  { to: '/admin/exercises', labelKey: 'app.exScreenTitle' },
  { to: '/admin/marathons', labelKey: 'app.mAdminNav' },
];

/**
 * The admin's own navigation: a column beside its screens, from `md` up.
 *
 * The top row (`TopNav`) carries one word for the whole area and stops there, because these five
 * do not fit in a row — «Конструктор тренировок» alone is twenty-one characters in tracked
 * capitals, and five of them would either wrap the bar or ellipsise. They fitted badly in the old
 * left rail too: it was 240px wide with `truncate`, so «База упражнений» rendered as «БАЗА
 * УПРАЖНЕН…» while it was the open screen.
 *
 * So the rail lives here, where it is affordable: 264px, no truncation, and it appears only on the
 * screens that need it. On a phone the admin keeps the route it always had — the list of links on
 * the profile screen, and `TopBar`'s back arrow between screens.
 *
 * It is sticky rather than fixed so it scrolls with a long day editor but stays put on a short
 * list, and it takes no glass: nothing passes underneath a column that sits beside the content.
 */
export function AdminNav() {
  const { t } = useT();
  return (
    <nav
      aria-label={t('app.adminTitle')}
      className="sticky top-[calc(var(--safe-top)+64px)] hidden w-66 shrink-0 flex-col self-start border-r border-border py-6 md:flex"
    >
      <span className="eyebrow mx-6 pb-3 text-muted-2">{t('app.adminTitle')}</span>
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            clsx(
              'flex min-h-11 items-center px-6 transition-colors duration-150 ease-(--ease-out)',
              isActive
                ? 'font-display text-[15px] text-text'
                : 'control-label text-[11px] text-muted-2 hover:text-text',
            )
          }
        >
          {t(item.labelKey)}
        </NavLink>
      ))}
    </nav>
  );
}
