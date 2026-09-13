/**
 * The home screen's deck: everything the athlete is in, one card each, swiped sideways.
 *
 * The home screen used to open on one photograph — today's session of the one course Home was
 * following — with the other courses and the marathon further down as ruled rows. That put the
 * three things a person might actually be doing at three different altitudes: a hero, a list item
 * and a strip. The deck makes them peers: a course is a card, a marathon is a card, a course that
 * has not been bought is a card, and moving between them is the gesture every phone has taught.
 *
 * A card is never the whole story, only its cover: the tap-through is the course's own path or the
 * marathon's own day, where the detail lives.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { courseTitle } from '@/content/catalogue';
import { formatNumber } from '@/i18n/index';
import { courseLandingHref } from '@/app/features/courses/courseMeta';
import { PHOTOS, type Photo } from '@/lib/media/photos';
import { courseTileVars } from '@/lib/ui/tile';
import { useT } from '@/app/hooks/useT';
import { DeckCard } from './DeckCard';
import type { DeckEntry } from './deck';

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

export interface HomeDeckProps {
  entries: readonly DeckEntry[];
  /**
   * How many of today's tasks are still open, by marathon id. Absent while the day is loading —
   * and it is the one thing worth interrupting a morning for, so the card says it rather than the
   * board position: a rank does not get anyone off the sofa and an unfinished task does.
   */
  openTasks?: Readonly<Record<string, number>>;
  /** The wordmark and the app's controls, laid over the top of whichever card is showing. */
  chrome?: ReactNode;
  onOpenCourse: (courseId: string) => void;
  onStartNode: (courseId: string, nodeId: string) => void;
  onOpenMarathon: () => void;
}

export function HomeDeck({
  entries,
  openTasks,
  chrome,
  onOpenCourse,
  onStartNode,
  onOpenMarathon,
}: HomeDeckProps) {
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
      className="relative -mx-5 -mt-[var(--safe-top)] lg:-mx-8"
      aria-label={t('app.homeDeckLabel')}
    >
      {/*
       * Over every card, never inside one: the controls do not move when the deck is swiped.
       *
       * It carries its own scrim because the covers underneath are not all dark — a marathon's is
       * orange — and the wordmark is white on every one of them. The gradient is on this row
       * rather than on the cards so it does not have to be repeated, or reasoned about, per card.
       */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center gap-3 bg-[linear-gradient(180deg,rgba(15,15,17,0.7),transparent)] px-5 pt-[calc(var(--safe-top)+14px)] pb-7 text-paper lg:px-8">
        <span className="pointer-events-auto contents">{chrome}</span>
      </div>

      <div
        ref={scroller}
        onScroll={onScroll}
        className="deck-scroller flex h-[74dvh] max-h-[760px] min-h-[520px] snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      >
        {entries.map((entry, i) => {
          const photo = photoAt(i);
          const priority = i === 0;
          if (entry.kind === 'marathon') {
            const { marathon, progress } = entry;
            const day = Math.max(1, marathon.dayIndex);
            const left = openTasks?.[marathon.id];
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
                  subtitle={
                    left === undefined
                      ? t('app.homeDeckMarathonBody')
                      : left > 0
                        ? t('app.marathonHomeTasksLeft', { n: formatNumber(locale, left) })
                        : t('app.marathonHomeAllDone')
                  }
                  pct={progress.pct}
                  progressLabel={t('app.homeDeckProgressLabel')}
                  progressMeta={`${progress.done}/${progress.total}`}
                  ctaLabel={t('app.homeDeckMarathonCta')}
                  onCta={onOpenMarathon}
                  onOpen={onOpenMarathon}
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
                  subtitle={l(course.tagline)}
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
                subtitle={next ? l(next.title) : t('app.homeTodayCompletedBody')}
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
        <div className="flex justify-center gap-2 pt-4">
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
