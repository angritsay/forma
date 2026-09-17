import { Badge } from '@/components/ui/Badge';
import { Glyph } from '@/components/ui/Icon';
import { useT } from '@/app/hooks/useT';
import { BadgeCircle } from '@/app/features/stats/Badges';
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
        would bury it in the rhythm of the page. Its mark is the brand's notice glyph, in red.
      */}
      {adjustment.safetyNote ? (
        <div className="flex gap-3 border border-danger/40 p-4">
          <Glyph size={13} className="mt-1 shrink-0 text-danger">
            //
          </Glyph>
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

/**
 * Freshly unlocked achievements, as the same white circle the catalogue puts them on — with the
 * achievement's own emoji in it, which is exactly the instant that emoji is a reward rather than a
 * decoration. Same `BadgeCircle`, so the figure cannot drift between the two screens.
 *
 * It was a numbered ruled list — «01 ПЕРВЫЙ ШАГ» over «Заверши первую тренировку.» — which is the
 * description of a thing you have not got yet, printed at the moment you get it. An achievement
 * should look the same the instant it is taken and afterwards on the shelf, so this is
 * `BadgeCircle` from `features/stats/Badges`, landing on the spring one after another. The
 * description is still its accessible name and its `title`; on the screen the circle is the news.
 *
 * `n` is the position the achievement holds in the whole set, which is what the shelf numbers its
 * locked ones by — an unlocked circle never draws it, but passing anything else would make the
 * two components disagree about what the number means.
 */
export function AchievementList({ items }: { items: readonly AchievementStatus[] }) {
  const { t } = useT();
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-4 border-t border-border pt-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="eyebrow">{t('app.summaryAchievementsTitle')}</span>
        <span className="numeral text-sm text-muted">{String(items.length).padStart(2, '0')}</span>
      </div>
      <ul className="flex flex-wrap gap-3">
        {items.map((a, i) => (
          <li key={a.id}>
            <BadgeCircle item={a} n={i + 1} delay={i * 45} />
          </li>
        ))}
      </ul>
    </section>
  );
}
