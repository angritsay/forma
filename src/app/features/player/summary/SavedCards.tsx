import { Badge } from '@/components/ui/Badge';
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
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3 border-t border-border pt-5">
        <div className="flex items-center justify-between gap-3">
          <span className="eyebrow">{t('app.summaryAdaptTitle')}</span>
          <Badge tone={pct > 0 ? 'success' : pct < 0 ? 'warning' : 'neutral'} size="md">
            {deltaText}
          </Badge>
        </div>
        <p className="text-[15px]">{l(adjustment.reason)}</p>
      </section>
      {/*
        The safety note keeps a border, and it is the danger colour on all four sides. This is the
        one message in the product that must not be skimmed past — a hairline like everything else
        would bury it in the rhythm of the page.
      */}
      {adjustment.safetyNote ? (
        <div className="flex gap-3 rounded-inner border border-danger/40 p-4">
          <Icon name="warning" className="mt-0.5 shrink-0 text-danger" />
          <div className="flex flex-col gap-1">
            <span className="text-[15px] font-semibold text-danger">
              {t('app.summarySafetyTitle')}
            </span>
            <p className="text-[15px] text-muted">{l(adjustment.safetyNote)}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AchievementList({ items }: { items: readonly AchievementStatus[] }) {
  const { t, l } = useT();
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="eyebrow text-accent">{t('app.summaryAchievementsTitle')}</span>
        <span className="numeral text-sm text-accent">{String(items.length).padStart(2, '0')}</span>
      </div>
      <ul className="flex flex-col">
        {items.map((a, i) => (
          <li
            key={a.id}
            className={`flex items-center gap-3 py-3 ${i > 0 ? 'border-t border-border' : ''}`}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-control border border-accent/40 text-xl">
              <span aria-hidden="true">{a.icon}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-display block truncate text-[15px] leading-[1.24]">
                {l(a.title)}
              </span>
              <span className="block text-sm text-muted">{l(a.description)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
