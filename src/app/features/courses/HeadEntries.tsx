/**
 * The streak and the achievements, as two small things you can tap.
 *
 * «Профиль и все ачивки убирай. Они должны быть на главном экране в виде маленьких энтри поинтов
 * где мы показываем только стрик и достижения. Достижения открывают каталог достижений.»
 *
 * The word in that instruction is «маленьких». These are not tiles and they are not a section with
 * a heading over it: two controls the height of a chip, side by side under the greeting, each
 * showing one figure and opening the thing behind it. A streak and a badge count are the two
 * numbers that bring anybody back, and they were taking a whole tab between them.
 *
 * Each is a control rather than a fact, so it sits on the control radius and not on the pill —
 * `design/CHANGELOG.md` §10: a fact that is not pressed is a pill, a thing that is pressed is not.
 *
 * The streak opens its calendar in a sheet; the achievements go to the catalogue, which is a
 * screen because there are thirteen of them with a rule each.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Icon, type IconName } from '@/components/ui/Icon';
import { formatNumber } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import { StreakSheet } from '@/app/features/stats/StreakSheet';

function Entry({
  icon,
  value,
  label,
  onClick,
}: {
  icon: IconName;
  /** The figure, and the whole of what the control says. */
  value: string;
  /** Its accessible name: a numeral on its own tells a screen reader nothing. */
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 min-w-0 items-center gap-1.5 rounded-control border border-border px-3 text-text transition-colors duration-150 ease-(--ease-out) hover:border-border-strong"
    >
      <Icon name={icon} size={15} strokeWidth={1.9} />
      <span className="numeral tabular text-[13px] leading-none">{value}</span>
    </button>
  );
}

export interface HeadEntriesProps {
  streak: number;
  /** Achievements taken and achievements there are — the catalogue's own figure. */
  unlocked: number;
  total: number;
}

export function HeadEntries({ streak, unlocked, total }: HeadEntriesProps) {
  const { t, locale } = useT();
  const navigate = useNavigate();
  const [calendar, setCalendar] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Entry
          icon="flame"
          value={formatNumber(locale, streak)}
          label={`${t('app.homeStreakTitle')}: ${formatNumber(locale, streak)}`}
          onClick={() => setCalendar(true)}
        />
        <Entry
          icon="trophy"
          value={`${formatNumber(locale, unlocked)}/${formatNumber(locale, total)}`}
          label={`${t('app.achievementsTitle')}: ${t('app.statsAchievementsCount', {
            done: formatNumber(locale, unlocked),
            total: formatNumber(locale, total),
          })}`}
          onClick={() => navigate('/achievements')}
        />
      </div>
      <StreakSheet open={calendar} onClose={() => setCalendar(false)} />
    </>
  );
}
