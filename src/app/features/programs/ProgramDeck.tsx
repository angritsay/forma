/**
 * The programmes: everything there is to be in, one ticket each, stacked down the screen.
 *
 * The deck was the home screen, and then it was this tab as a sideways swipe of full-height
 * covers. Both of those made the same mistake in the same place: a screen whose whole job is «во
 * что я могу пойти» showed one thing at a time, at the size of a magazine cover, and you had to
 * discover by gesture that there was anything else. The owner put it plainly — «она сейчас
 * занимает весь экран, а хотелось бы, чтобы это выглядело как билетик в курс».
 *
 * So they are tickets now (`CourseTicket`), in a column, each with its progress at the top. One
 * fits a phone screen whole with the next one beginning under it, and that beginning is the thing
 * the swipe was failing to say: there is more than one. Nothing about the content changed — what it is, its
 * name, one line of what it gives you, how far in you are, one button. The full-bleed cover is
 * still the right shape on Home, where a single card answers «что у меня сегодня» and owns the
 * screen, and that is why `DeckCard` is still there and unchanged.
 *
 * A ticket is never the whole story: the tap-through is the course's own path or the challenge's
 * own day, where the detail lives.
 */
import { courseTitle } from '@/content/catalogue';
import { formatNumber, plural } from '@/i18n/index';
import { courseLandingHref, subscribeHref } from '@/app/features/courses/courseMeta';
import { PHOTOS, type Photo } from '@/lib/media/photos';
import { courseTileVars, GAME_TILE } from '@/lib/ui/tile';
import { useT } from '@/app/hooks/useT';
import { CourseTicket } from './CourseTicket';
import type { DeckEntry } from './deck';
import type { GameAccess } from '@/app/features/marathon/gameAccess';

/**
 * Which photograph a course card gets.
 *
 * The coach's own frame leads, because the first card is the one an athlete sees every morning.
 * The rest rotate through what the library has, by position rather than by id, so two cards next
 * to each other are never the same picture — and while those are still un-vendored stock URLs,
 * <CourseTicket> ignores them and paints the course's colour instead.
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
   * Whether the challenge opens, and on what grounds. A locked card is still shown — a locked game is
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

  if (entries.length === 0) return null;

  return (
    <section aria-label={t('app.homeDeckLabel')}>
      {/*
       * A column, not a scroller: the pager and its gesture went with the covers. There is nothing
       * left to page through — the screen scrolls the way every other screen in the app does, and
       * the next ticket showing at the bottom edge is what says there is one.
       *
       * Two across from `md`. A ticket is a fixed object, not a block of text: stretched to 680px
       * it becomes a banner with a cover band 340px tall, and the tab's question — «во что я могу
       * пойти» — is answered by seeing the choices at once rather than by seeing one of them
       * larger. At 760px each ticket lands near 360px, which is the width it has on a phone, so
       * the object itself does not change, only how many of them fit.
       *
       * `items-start`: a grid row stretches its cells to the tallest by default, and a ticket with
       * no progress stub would grow a band of empty paper to match one that has it.
       */}
      <ul className="flex flex-col gap-4 md:grid md:grid-cols-2 md:items-start">
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
              <li key={entry.key}>
                <CourseTicket
                  priority={priority}
                  style={courseTileVars(GAME_TILE)}
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
              </li>
            );
          }
          if (entry.kind === 'locked') {
            const { course } = entry;
            const title = l(courseTitle(course));
            return (
              <li key={entry.key}>
                <CourseTicket
                  cover={course.cover}
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
              </li>
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
            <li key={entry.key}>
              <CourseTicket
                cover={course.cover}
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
            </li>
          );
        })}
      </ul>
    </section>
  );
}
