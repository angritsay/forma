/**
 * The challenge's cover — the one block on these screens that is painted, and the reason the tab
 * stops looking like every other screen.
 *
 * The colour is not an invention. The brandbook's rule is «один экран — один цвет, и он приходит
 * от программы»: a course wears the colour content gives it, and the challenge already owns orange
 * — `GAME_TILE` in src/lib/ui/tile.ts, the hex the deck card and the row on Home have been drawn
 * in since the format shipped. The challenge's own screens were the one place it never reached, so
 * a format whose whole point is that it is a different thing arrived as black type on black.
 *
 * The block is built exactly like a course's header (CoursePathScreen): the programme colour
 * bleeding past both gutters and up under the status bar, a kicker, the one big line in the display
 * face, and the quiet lines under it. The colour paints a cover, a progress strip and a numeral —
 * never a button, and never a large flat field of it further down the page. It does not set
 * `--course-tile` itself; the screen around it does, once, so the day number, the trial rule and the
 * board rows further down read the same variable.
 *
 * Every text on the orange is the tile's black ink at full strength or at 80%, which measures
 * 7.66:1 and 5.56:1 — the ink may not go below 75% here, and light text on the orange (2.50:1)
 * is never allowed at all.
 */
import { clsx } from 'clsx';
import { formatNumber } from '@/i18n/index';
import type { MyMarathon } from '@/lib/api/types';
import { DisplayTitle } from '@/app/features/home/DisplayTitle';
import { useT } from '@/app/hooks/useT';

export interface GameCoverProps {
  /** The challenge I am in, or null — locked, not joined, still loading, failed. */
  marathon: MyMarathon | null;
  /** The people I am scored with, by name; empty in a solo challenge. */
  partners?: readonly string[];
}

/**
 * The days as a strip of rules: one per day, ink for the days behind and a faint ink for the days
 * ahead. It is the same device as the course's week strip, counting the unit this format runs on.
 *
 * Decorative on purpose — `aria-hidden`. The big line above it already says «День 10 из 14», and a
 * screen reader walking thirty list items to be told the same thing is worse than silence.
 */
function DayStrip({ day, days }: { day: number; days: number }) {
  if (days < 2) return null;
  return (
    <div aria-hidden="true" className="mt-6 flex gap-[3px]">
      {Array.from({ length: days }, (_, i) => (
        <span key={i} className={clsx('h-0.5 flex-1', i < day ? 'bg-current' : 'bg-current/30')} />
      ))}
    </div>
  );
}

export function GameCover({ marathon, partners = [] }: GameCoverProps) {
  const { t, locale } = useT();
  /*
   * Who you are scored with, by name — the same choice the head made before this block replaced
   * it: a pair is usually called «Ты и Марек», so «В паре с Ты и Марек» is nonsense and the roster
   * has the people. The team name is the fallback, and the board is where the team is the racer.
   */
  const partner = partners.length > 0 ? partners.join(', ') : (marathon?.teamName ?? '');
  const day = marathon ? Math.max(marathon.dayIndex, 1) : 0;

  return (
    <header
      className={clsx(
        'hero-art relative -mx-6 -mt-[var(--safe-top)] px-6 pb-7 md:-mx-10 md:px-10',
        'pt-[calc(var(--safe-top)+20px)]',
      )}
    >
      {/*
       * Grain over the colour, the way every other colour cover in the product is drawn
       * (`DeckCard`, `CourseTicket`): «фото — монохром + зерно», and a flat fill this size —
       * roughly half a phone screen — is the one place the texture is doing real work rather than
       * decorating. It is an overlay element rather than an `::after` on the header, because a
       * pseudo-element would paint above the day numeral instead of under it.
       */}
      <div className="photo-grain" aria-hidden="true" />
      {/* Everything the cover says sits in its own stacking context, so the grain stays under it:
          an absolutely positioned sibling paints above static ones whatever the DOM order. */}
      <div className="relative">
        <span className="eyebrow block text-current">
          {marathon ? marathon.title : t('app.marathonTitle')}
        </span>
        <DisplayTitle
          text={
            marathon
              ? t('app.marathonDayOf', {
                  n: formatNumber(locale, day),
                  total: formatNumber(locale, marathon.days),
                })
              : t('app.marathonCoverPitch')
          }
          className="mt-5 text-5xl lg:text-6xl"
        />
        {marathon ? (
          <>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[13px] opacity-80">
              <span>{t('app.marathonWeek', { n: formatNumber(locale, marathon.week) })}</span>
              <span>
                {partner ? t('app.marathonWithPartner', { name: partner }) : t('app.marathonSolo')}
              </span>
            </div>
            <DayStrip day={day} days={marathon.days} />
            {marathon.prize ? (
              <p className="mt-5 text-[13px] opacity-80">
                <span className="control-label text-[10px]">{t('app.marathonPrize')}</span>{' '}
                {marathon.prize}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </header>
  );
}
