/**
 * A block's shape as a line of short facts: «3 круга · каждую минуту · отдых 1 мин».
 *
 * On the preview this line stands where the coach's paragraph used to («Три круга. 1-я минута —
 * отжимания…»). The paragraph is still in the content and still on the screen, folded under «Что
 * внутри»; the line is what the plan says at a glance, and it is generated from the block's numbers
 * rather than written, so it can never disagree with them — the difficulty choice moves rounds,
 * windows and caps, and a sentence typed once would not move with it.
 *
 * Pure, so `blockChips.test.ts` holds every format the courses use, in both languages.
 */
import type { Translator } from '@/app/hooks/useT';
import { blockEmomRounds, isMaxRepsAmrap } from '@/lib/training/player';
import type { PrescribedBlock } from '@/lib/training/types';
import { roundsLabel, setsLabel } from './plan';

const minutes = (tr: Translator, sec: number) =>
  tr.t('app.nodeBlockMinutes', { n: Math.round(sec / 60) });

/** «отдых 45 с», «отдых 1 мин», «отдых 1 мин 10 с». */
export function restChip(tr: Translator, sec: number): string {
  if (sec < 60) return tr.t('app.nodeRestAfter', { s: sec });
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? tr.t('app.nodeChipRestMin', { m }) : tr.t('app.nodeChipRestMinSec', { m, s });
}

export type ChipBlock = Pick<
  PrescribedBlock,
  | 'format'
  | 'sets'
  | 'durationSec'
  | 'workSec'
  | 'restSec'
  | 'restBetweenSetsSec'
  | 'restBetweenRoundsSec'
  | 'items'
  | 'maxReps'
>;

/** The facts, in reading order; the caller joins them or sets each as a pill. */
export function blockChips(tr: Translator, block: ChipBlock): string[] {
  const out: string[] = [];
  switch (block.format) {
    case 'sets':
      out.push(setsLabel(tr, block.sets));
      break;
    case 'circuit':
      out.push(roundsLabel(tr, block.sets));
      break;
    case 'emom': {
      // With a rest between passes the passes are what a person counts, and the rest says the
      // clock; without one, the minutes are the whole story.
      const passes = blockEmomRounds(block);
      if (passes) out.push(roundsLabel(tr, passes.rounds), tr.t('app.nodeChipEveryMinute'));
      else out.push(tr.t('app.nodeChipEveryMinute'), minutes(tr, block.sets * 60));
      break;
    }
    case 'amrap':
      out.push(
        tr.t(isMaxRepsAmrap(block) ? 'app.nodeChipMaxReps' : 'app.nodeChipMaxRounds'),
        minutes(tr, block.durationSec ?? 0),
      );
      break;
    case 'fortime':
      out.push(tr.t('app.nodeChipForTime'));
      if (block.sets > 1) out.push(roundsLabel(tr, block.sets));
      if (block.durationSec)
        out.push(tr.t('app.nodeChipCap', { n: Math.round(block.durationSec / 60) }));
      break;
    case 'tabata':
    case 'interval':
      out.push(
        tr.t(`training.format_${block.format}`),
        tr.t('app.nodeBlockTabata', {
          work: block.workSec ?? 0,
          rest: block.restSec ?? 0,
          n: block.sets,
        }),
      );
      break;
  }
  const rest = block.restBetweenSetsSec || block.restBetweenRoundsSec;
  if (rest > 0) out.push(restChip(tr, rest));
  return out;
}

/** The same facts as one line, for a label or a test: «3 круга · каждую минуту · отдых 1 мин». */
export function blockChipLine(tr: Translator, block: ChipBlock): string {
  return blockChips(tr, block).join(' · ');
}
