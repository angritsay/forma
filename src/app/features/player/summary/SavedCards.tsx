import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { useT } from '@/app/hooks/useT';
import type { AchievementStatus, ScaleAdjustment } from '@/lib/training/types';

/** The adaptation message after saving ("next time +5%"), plus the safety note on pain. */
export function AdaptationCard({ adjustment }: { adjustment: ScaleAdjustment }) {
  const { t, l } = useT();
  const pct = Math.round(adjustment.delta * 100);
  const deltaText =
    pct === 0
      ? t('app.summaryVolumeSame')
      : t('app.summaryVolumeDelta', { delta: `${pct > 0 ? '+' : '−'}${Math.abs(pct)}` });
  return (
    <div className="flex flex-col gap-3">
      <Card level={2} className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            {t('app.summaryAdaptTitle')}
          </span>
          <Badge tone={pct > 0 ? 'success' : pct < 0 ? 'warning' : 'neutral'} size="md">
            {deltaText}
          </Badge>
        </div>
        <p className="text-[15px]">{l(adjustment.reason)}</p>
      </Card>
      {adjustment.safetyNote ? (
        <Card level={2} className="flex gap-3 border-danger/30">
          <Icon name="warning" className="mt-0.5 shrink-0 text-danger" />
          <div className="flex flex-col gap-1">
            <span className="text-[15px] font-semibold text-danger">
              {t('app.summarySafetyTitle')}
            </span>
            <p className="text-[15px] text-muted">{l(adjustment.safetyNote)}</p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

export function AchievementList({ items }: { items: readonly AchievementStatus[] }) {
  const { t, l } = useT();
  if (items.length === 0) return null;
  return (
    <Card gradient className="flex flex-col gap-3">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] opacity-70">
        {t('app.summaryAchievementsTitle')}
      </span>
      <ul className="flex flex-col gap-2">
        {items.map((a) => (
          <li key={a.id} className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-black/10 text-2xl">
              <span aria-hidden="true">{a.icon}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-semibold">{l(a.title)}</span>
              <span className="block text-sm opacity-80">{l(a.description)}</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
