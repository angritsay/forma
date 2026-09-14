/**
 * The programmes: everything there is to be in, one full-height card each, swiped sideways.
 *
 * The deck was the home screen. It is the second tab now, and moving it there is what let both
 * screens say one thing each: Home answers «что у меня сегодня», this answers «во что я могу
 * пойти». A course is a card, the game is a card, a course that has not been bought is a card —
 * peers, in the gesture every phone has taught, with the kicker naming which kind each one is.
 *
 * A card carries as little as a card can: what it is, its name, one line of what it gives you, how
 * far in you are if you are in it, and one button. The day's own session is not on it — that is
 * Home's line, and repeating it here made the card a status board instead of a cover.
 *
 * A card is never the whole story: the tap-through is the course's own path or the game's own day,
 * where the detail lives.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { courseTitle } from '@/content/catalogue';
import { formatNumber, plural } from '@/i18n/index';
import { courseLandingHref, subscribeHref } from '@/app/features/courses/courseMeta';
import { PHOTOS, type Photo } from '@/lib/media/photos';
import { courseTileVars } from '@/lib/ui/tile';
import { useT } from '@/app/hooks/useT';
import { DeckCard } from './DeckCard';
import type { DeckEntry } from './deck';
import type { GameAccess } from '@/app/features/marathon/gameAccess';

/** Marathon orange — a marathon has no course tile of its own, and the deck's rule needs one. */
const MARATHON_TILE = '#f08a3c';

/**
 * Which photograph a course card gets.
 *
 * The coach's own frame leads, because the first card is the one an athlete sees every morning.
 * The rest rotate through what the library has, by position rather than by id, so two cards next
 * to each other are never the same picture — and while those are still un-vendored stock URLs,
 * <DeckCard> ignores them and paints the course's colour instead.
 *
 * A marathon is never given one: it has no photograph of its own, and orange is its cover.
 */
const DECK_PHOTOS: readonly Photo[] = [
  PHOTOS.homeToday,
  PHOTOS.coursePath,
  PHOTOS.stats,
  PHOTOS.profile,
  PHOTOS.exercise,
];

function photoAt(i: number): Photo {
  return DECK_PHOTOS[i % DECK_PHOTOS.length]!;
}

export interface ProgramDeckProps {
  entries: readonly DeckEntry[];
  /**
   * How many of today's tasks are still open, by marathon id. Absent while the day is loading —
   * and it is the one thing worth interrupting a morning for, so the card says it rather than the
   * board position: a rank does not get anyone off the sofa and an unfinished task does.
   */
  openTasks?: Readonly<Record<string, number>>;
  /**
   * Whether the game opens, and on what grounds. A locked card is still shown — a locked game is
   * the clearest thing the subscription has to sell — but it explains itself and leads to the
   * subscribe page instead of into the day; a card open on the trial says how long is left.
   */
  gameAccess?: GameAccess;
  onOpenCourse: (courseId: string) => void;
  onStartNode: (courseId: string, nodeId: string) => void;
  onOpenMarathon: () => void;
}

export function ProgramDeck({
  entries,
  openTasks,
  gameAccess,
  onOpenCourse,
  onStartNode,
  onOpenMarathon,
}: ProgramDeckProps) {
  const { t, l, locale } = useT();
  const scroller = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  /*
   * Which card is showing, from the scroll position rather than from a gesture handler: the same
   * answer whether it was swiped, flung, tabbed into or scrolled with a trackpad.
   */
  const onScroll = useCallback(() => {
    const el = scroller.current;
    if (!el || el.clientWidth === 0) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  // A deck that shrinks under the finger (a course bought, a marathon ended) must not leave the
  // pager pointing at a card that is gone.
  useEffect(() => {
    setActive((i) => Math.min(i, Math.max(0, entries.length - 1)));
  }, [entries.length]);

  const goTo = (i: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
    setActive(i);
  };

  if (entries.length === 0) return null;

  return (
    <section
      className="relative -mx-6 -mt-[var(--safe-top)] lg:-mx-10"
      aria-label={t('app.homeDeckLabel')}
    >
      <div
        ref={scroller}
        onScroll={onScroll}
        className="deck-scroller flex h-[78dvh] max-h-[820px] min-h-[520px] snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      >
        {entries.map((entry, i) => {
          const photo = photoAt(i);
          const priority = i === 0;
          if (entry.kind === 'marathon') {
            const { marathon, progress } = entry;
            const day = Math.max(1, marathon.dayIndex);
            const left = openTasks?.[marathon.id];
            const locked = gameAccess?.allowed === false;
            const trialLeft = gameAccess?.allowed ? gameAccess.trialDaysLeft : undefined;
            return (
              <div key={entry.key} className="w-full shrink-0 snap-center">
                <DeckCard
                  priority={priority}
                  style={courseTileVars(MARATHON_TILE)}
                  eyebrow={`${t('app.homeDeckMarathon')} · ${t('app.marathonDayOf', {
                    n: formatNumber(locale, day),
                    total: formatNumber(locale, marathon.days),
                  })}`}
                  title={marathon.title}
                  lead={t('app.homeDeckMarathonLead')}
                  subtitle={
                    locked
                      ? t('app.homeDeckGameLocked')
                      : trialLeft !== undefined
                        ? t('app.homeDeckGameTrial', {
                            n: plural(locale, trialLeft, {
                              one: t('app.homeDeckGameTrialDayOne'),
                              few: t('app.homeDeckGameTrialDayFew', { n: trialLeft }),
                              many: t('app.homeDeckGameTrialDayMany', { n: trialLeft }),
                            }),
                          })
                        : left === undefined
                          ? t('app.homeDeckMarathonBody')
                          : left > 0
                            ? t('app.marathonHomeTasksLeft', { n: formatNumber(locale, left) })
                            : t('app.marathonHomeAllDone')
                  }
                  pct={progress.pct}
                  progressLabel={t('app.homeDeckProgressLabel')}
                  progressMeta={`${progress.done}/${progress.total}`}
                  {...(locked
                    ? {
                        dimmed: true,
                        ctaLabel: t('app.homeDeckGameLockedCta'),
                        ctaHref: subscribeHref(locale),
                      }
                    : {
                        ctaLabel: t('app.homeDeckMarathonCta'),
                        onCta: onOpenMarathon,
                        onOpen: onOpenMarathon,
                      })}
                  openLabel={marathon.title}
                />
              </div>
            );
          }
          if (entry.kind === 'locked') {
            const { course } = entry;
            const title = l(courseTitle(course));
            return (
              <div key={entry.key} className="w-full shrink-0 snap-center">
                <DeckCard
                  photo={photo}
                  priority={priority}
                  dimmed
                  style={courseTileVars(course.tile)}
                  eyebrow={`${t('app.homeDeckCourse')} · ${t('app.homeCourseLocked')}`}
                  title={title}
                  lead={l(course.tagline)}
                  ctaLabel={t('app.homeCourseGet')}
                  ctaHref={courseLandingHref(locale, course)}
                  openLabel={`${title} — ${t('app.homeCourseGet')}`}
                />
              </div>
            );
          }

          const { course, progress, next } = entry;
          const title = l(courseTitle(course));
          /*
           * A rest day and a milestone are not something to "start": they are read and ticked off
           * on the path. Only a day with a workout behind it goes straight into the preview.
           */
          const startable =
            next !== null &&
            (next.kind === 'workout' || next.kind === 'test' || next.kind === 'benchmark');
          return (
            <div key={entry.key} className="w-full shrink-0 snap-center">
              <DeckCard
                photo={photo}
                priority={priority}
                style={courseTileVars(course.tile)}
                eyebrow={
                  next
                    ? `${t('app.homeDeckCourse')} · ${t('app.homeTodayWeek', { week: next.week, day: next.day })}`
                    : `${t('app.homeDeckCourse')} · ${t('app.pathCompleted')}`
                }
                title={title}
                lead={l(course.tagline)}
                pct={progress.pct}
                progressLabel={t('app.homeDeckProgressLabel')}
                progressMeta={`${progress.done}/${progress.total}`}
                ctaLabel={
                  next === null
                    ? t('app.homeTodayOpenPath')
                    : startable
                      ? t('app.homeDeckStart')
                      : t('app.homeTodayOpen')
                }
                onCta={() =>
                  next && startable ? onStartNode(course.id, next.id) : onOpenCourse(course.id)
                }
                onOpen={() => onOpenCourse(course.id)}
                openLabel={title}
              />
            </div>
          );
        })}
      </div>

      {/*
       * The pager. Dots are circles and this brand has none, so the cards are counted in rules —
       * the same 2px marks the course screen uses for its weeks. They are buttons, because a deck
       * that can only be swiped cannot be used with a keyboard.
       */}
      {entries.length > 1 ? (
        <div className="flex justify-center gap-2 pt-5">
          {entries.map((entry, i) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => goTo(i)}
              aria-label={t('app.homeDeckGoTo', { n: i + 1 })}
              aria-current={i === active ? 'true' : undefined}
              className="tap-target-y px-1"
            >
              <span
                className={clsx(
                  'block h-0.5 w-7 transition-colors duration-150 ease-(--ease-out)',
                  i === active ? 'bg-text' : 'bg-border-strong',
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
