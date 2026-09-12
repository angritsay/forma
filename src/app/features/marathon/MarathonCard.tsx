/**
 * The marathon's entry point on Home. Renders nothing at all unless the athlete is in one, so the
 * home screen of someone who only does courses is untouched by the format existing.
 *
 * What it says is the one thing worth interrupting the home screen for: how many of today's tasks
 * are still open. Not the board position — a rank does not get anyone off the sofa, and an
 * unfinished task does.
 */
import { useEffect, useState } from 'react';
import { Glyph } from '@/components/ui/Icon';
import { formatNumber } from '@/i18n/index';
import { getMarathonDay, listMyMarathons } from '@/lib/api/marathon';
import type { MyMarathon } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';

export interface MarathonCardProps {
  onOpen: () => void;
}

export function MarathonCard({ onOpen }: MarathonCardProps) {
  const { t, locale } = useT();
  const [marathon, setMarathon] = useState<MyMarathon | null>(null);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    let alive = true;
    listMyMarathons()
      .then(async (rows) => {
        const running = rows.find((m) => m.status === 'active');
        if (!alive || !running || running.dayIndex < 1) return;
        setMarathon(running);
        const today = await getMarathonDay(running, running.dayIndex);
        if (!alive) return;
        setLeft(today.filter((item) => item.task.rule !== 'none' && !item.mine).length);
      })
      .catch(() => {
        /* A marathon that fails to load never blocks the home screen. */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!marathon) return null;

  return (
    <section className="mt-6 flex flex-col">
      <div className="flex items-baseline justify-between gap-3 border-t border-border pt-5 pb-1">
        <h2 className="font-display text-xl">{t('app.marathonTitle')}</h2>
        <span className="eyebrow">
          {t('app.marathonDayOf', {
            n: formatNumber(locale, marathon.dayIndex),
            total: formatNumber(locale, marathon.days),
          })}
        </span>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="flex items-center gap-3.5 border-t border-border py-4 text-left first:border-t-0"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-display truncate text-[15px] leading-[1.24]">{marathon.title}</span>
          <span className="text-xs text-muted">
            {left > 0
              ? t('app.marathonHomeTasksLeft', { n: formatNumber(locale, left) })
              : t('app.marathonHomeAllDone')}
          </span>
        </span>
        <Glyph size={16} className="shrink-0 text-muted-2">
          ›
        </Glyph>
      </button>
    </section>
  );
}
