/**
 * Demo-mode strip, pinned to the bottom of the app frame on every screen.
 *
 * The whole point is that a tester can never mistake the demo for the live app, so it is always
 * on screen and always says where the data lives. `AppFrame` exposes `--demo-inset` so the bottom
 * nav, the sticky footers and the player controls sit above it; with demo mode off the variable
 * is 0 and nothing in the layout moves.
 */
import { useT } from '@/app/hooks/useT';

/** Height of the text row; `AppFrame` mirrors it into `--demo-inset`. */
export const DEMO_BADGE_HEIGHT = '26px';

export function DemoBadge() {
  const { t } = useT();
  return (
    <aside
      aria-label={t('app.demoBadgeLabel')}
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      <p
        style={{ height: DEMO_BADGE_HEIGHT }}
        className="flex items-center justify-center gap-2 px-4 text-[11px] leading-none text-muted"
      >
        <span className="rounded-pill bg-warning/20 px-1.5 py-1 text-[10px] font-bold tracking-wide text-warning uppercase">
          {t('app.demoBadgeLabel')}
        </span>
        <span className="truncate">{t('app.demoBadge')}</span>
      </p>
    </aside>
  );
}
