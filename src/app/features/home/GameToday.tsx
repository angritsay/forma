/**
 * The game, on the home screen, as one row.
 *
 * Home used to never mention the game at all: it was reachable only from its own tab, which meant
 * somebody in a thirty-day game had to remember to go and look for today's task, and somebody not
 * in one had no way of learning it existed. Both are the same bug — the screen that answers "what
 * am I doing today" was answering it only for the course.
 *
 * So it is a row, not a card: the deck of full-bleed cards lives on the programmes tab now, and
 * today's workout is already the one full-height thing on this screen. A row under it is the
 * right size for "and one more thing", and it is the same row in both states — the difference is
 * that somebody who is not playing gets the task blurred out. A spoiler is a better invitation
 * than an advertisement, because it is true: there really is a task today, and they really are
 * not seeing it.
 *
 * The ring counts the days of the game, not any kind of score. Points belong to the game itself,
 * where they are the whole point; the honest figure here is how far in this is.
 *
 * It wears the game's colour and nothing else on Home does, because in this product colour says
 * which part of it you are in.
 */
import { clsx } from 'clsx';
import { Glyph } from '@/components/ui/Icon';
import { RingProgress } from '@/components/ui/RingProgress';
import type { MarathonTodayTask, MyMarathon } from '@/lib/api/types';
import { courseTileVars, GAME_TILE } from '@/lib/ui/tile';
import { useT } from '@/app/hooks/useT';

export interface GameTodayProps {
  /** The game I am in, or null when I am not in one. */
  marathon: MyMarathon | null;
  /** Today's tasks, when they have loaded. */
  tasks: readonly MarathonTodayTask[];
  onOpen: () => void;
}

export function GameToday({ marathon, tasks, onOpen }: GameTodayProps) {
  const { t } = useT();
  const playing = marathon !== null;

  /*
   * The one task worth naming is the first still owed; when they are all in, the row says that
   * instead of naming something already done.
   */
  const pending = tasks.filter((x) => x.mine === null);
  const day = marathon?.dayIndex ?? 0;
  const days = marathon?.days ?? 0;

  const eyebrow =
    playing && day > 0 ? t('app.marathonDayOf', { n: day, total: days }) : t('app.homeGameSpoiler');

  let title: string;
  if (!playing) title = t('app.homeGameSpoilerTask');
  else if (tasks.length === 0) title = t('app.marathonNoTasksToday');
  else if (pending.length === 0) title = t('app.marathonHomeAllDone');
  else title = pending[0]!.task.title;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t('app.marathonHomeCta')}
      /* `--course-tile` is how this system paints a colour: the ring's `course` tone and the
         kicker's `text-course` both read it, so the orange is set once and never spelled out. */
      style={courseTileVars(GAME_TILE)}
      className={clsx(
        'flex w-full items-center gap-4 border-y border-border py-4 text-left',
        'transition-colors duration-150 ease-(--ease-out) active:bg-surface-2',
      )}
    >
      <RingProgress
        value={days > 0 ? day / days : 0}
        size={52}
        stroke={5}
        label={t('app.marathonTitle')}
      >
        {playing ? (
          <span className="numeral tabular text-sm">{day}</span>
        ) : (
          <Glyph size={14} className="text-course">
            ?
          </Glyph>
        )}
      </RingProgress>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="eyebrow truncate text-course">{eyebrow}</span>
        <span className={clsx('truncate text-[15px] font-medium', !playing && 'blur-[5px]')}>
          {title}
        </span>
      </span>
      <Glyph size={14} className="shrink-0 text-muted-2">
        →
      </Glyph>
    </button>
  );
}
