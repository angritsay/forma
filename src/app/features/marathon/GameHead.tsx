/**
 * The head of the challenge's screen: the day as a ring, and one line saying which day it is.
 *
 * It replaces a cover — the programme colour bleeding past the gutters with the title, the day, the
 * week, the partner, a strip of fourteen rules and the prize, all set on it. The owner's verdict on
 * that screen was «вообще мимо», and her own prototype (`design/ui_kits/app-v2`, «Челлендж»)
 * shows what she meant instead: the colour on a ring and a few pills, not on a field, and the
 * whole head one figure and one line. Everything the cover said is still said, by something
 * smaller: the ring *is* the strip of days, the pill on the board *is* the prize.
 *
 * The ring is `RingProgress` with the challenge's colour, which the screen sets around itself
 * (`courseTileVars(GAME_TILE)`) — the same ring the home screen's challenge row draws, at the size
 * of a head rather than a row, so the two read as the same object at two distances.
 */
import { Glyph } from '@/components/ui/Icon';
import { RingProgress } from '@/components/ui/RingProgress';
import { formatNumber } from '@/i18n/index';
import type { MyMarathon } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';

export interface GameHeadProps {
  /** The challenge I am in, or null — locked, not joined, still loading, failed. */
  marathon: MyMarathon | null;
  /** The people I am scored with, by name; empty in a solo challenge. */
  partners?: readonly string[];
}

export function GameHead({ marathon, partners = [] }: GameHeadProps) {
  const { t, locale } = useT();
  /*
   * Who you are scored with, by name: a pair is usually called «Ты и Марек», so «Напарник: Ты и
   * Марек» is nonsense and the roster has the people. The team name is the fallback, and the board
   * is where the team is the racer.
   */
  const partner = partners.length > 0 ? partners.join(', ') : (marathon?.teamName ?? '');
  const who = marathon
    ? partner
      ? t('app.marathonWithPartner', { name: partner })
      : t('app.marathonSolo')
    : null;
  const day = marathon ? Math.max(marathon.dayIndex, 1) : 0;
  const days = marathon?.days ?? 0;
  const dayText = formatNumber(locale, day);
  const daysText = formatNumber(locale, days);

  return (
    <header className="flex items-center gap-4">
      <RingProgress
        value={days > 0 ? day / days : 0}
        size={72}
        stroke={5}
        label={t('app.marathonTitle')}
        valueText={marathon ? t('app.marathonDayOf', { n: dayText, total: daysText }) : undefined}
      >
        {marathon ? (
          <span className="numeral tabular text-[26px] leading-none">{dayText}</span>
        ) : (
          /* No challenge to count: the same «?» the home screen shows somebody not playing. */
          <Glyph size={18} className="text-course">
            ?
          </Glyph>
        )}
      </RingProgress>
      <div className="min-w-0 flex-1">
        {/* Two lines allowed, not one: «Спринт формы · Напарник: Марек» is 31 tracked capitals,
            which is more than a phone leaves beside a 72px ring, and the ring is taller than the
            two lines together. */}
        <p className="eyebrow line-clamp-2">
          {marathon ? marathon.title : t('app.marathonTitle')}
          {who ? ` · ${who}` : ''}
        </p>
        {/* «ДЕНЬ 10» at 800 and «из 14» at 200 — the brand's device, on the one line here. */}
        <h1 className="display mt-1 text-[26px] leading-[1.08] text-balance">
          {marathon ? (
            <>
              {t('app.marathonDayN', { n: dayText })}{' '}
              <span className="t-thin">{t('app.marathonOfTotal', { total: daysText })}</span>
            </>
          ) : (
            t('app.marathonCoverPitch')
          )}
        </h1>
      </div>
    </header>
  );
}
