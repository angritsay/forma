/**
 * Labels and lookups for a prescribed plan (node preview): difficulty options, block meta,
 * item targets and the exercise whose figure represents a workout.
 */
import { EXERCISE_BY_ID } from '@/content/registry';
import type { Exercise, Workout } from '@/content/schema';
import { plural, type TKey } from '@/i18n/index';
import type { Translator } from '@/app/hooks/useT';
import type { DifficultyChoice, PrescribedBlock, PrescribedItem } from '@/lib/training/types';

export const DIFFICULTY_CHOICES: readonly DifficultyChoice[] = ['easier', 'normal', 'harder'];

export const DIFFICULTY_LABEL: Record<DifficultyChoice, TKey> = {
  easier: 'training.difficultyEasier',
  normal: 'training.difficultyNormal',
  harder: 'training.difficultyHarder',
};

/** First item of the first non-warm-up / non-cool-down block. */
export function workoutSignatureExercise(workout: Workout): Exercise | undefined {
  const block =
    workout.blocks.find((b) => b.type !== 'warmup' && b.type !== 'cooldown') ?? workout.blocks[0];
  const item = block?.items[0];
  return item ? EXERCISE_BY_ID.get(item.exerciseId) : undefined;
}

export function exerciseName(tr: Translator, exerciseId: string): string {
  const e = EXERCISE_BY_ID.get(exerciseId);
  return e ? tr.l(e.name) : exerciseId;
}

function setsLabel(tr: Translator, n: number): string {
  const word = plural(tr.locale, n, {
    one: tr.t('app.nodeSetWordOne'),
    few: tr.t('app.nodeSetWordFew'),
    many: tr.t('app.nodeSetWordMany'),
  });
  return `${n} ${word}`;
}

function roundsLabel(tr: Translator, n: number): string {
  const word = plural(tr.locale, n, {
    one: tr.t('app.nodeRoundWordOne'),
    few: tr.t('app.nodeRoundWordFew'),
    many: tr.t('app.nodeRoundWordMany'),
  });
  return `${n} ${word}`;
}

/** "Sets · 3 sets", "AMRAP · 6 min", "For time · 4 rounds · 12 min", "Tabata · 20s on / 10s off × 8". */
export function blockMetaLabel(tr: Translator, block: PrescribedBlock): string {
  const format = tr.t(`training.format_${block.format}`);
  switch (block.format) {
    case 'sets':
      return `${format} · ${setsLabel(tr, block.sets)}`;
    case 'circuit':
      return `${format} · ${roundsLabel(tr, block.sets)}`;
    case 'amrap':
      return `${format} · ${tr.t('app.nodeBlockMinutes', {
        n: Math.round((block.durationSec ?? 0) / 60),
      })}`;
    case 'fortime': {
      const cap = block.durationSec
        ? ` · ${tr.t('app.nodeBlockMinutes', { n: Math.round(block.durationSec / 60) })}`
        : '';
      return `${format} · ${roundsLabel(tr, block.sets)}${cap}`;
    }
    case 'emom':
      return `${format} · ${tr.t('app.nodeBlockMinutes', { n: block.sets })}`;
    case 'tabata':
    case 'interval':
      return `${format} · ${tr.t('app.nodeBlockTabata', {
        work: block.workSec ?? 0,
        rest: block.restSec ?? 0,
        n: block.sets,
      })}`;
  }
}

/** "12 reps", "40 sec · per side", "200 m". */
export function itemTargetLabel(tr: Translator, item: PrescribedItem): string {
  const unit = tr.t(`training.${item.unit}`);
  let out = `${item.target} ${unit}`;
  if (item.perSide) out += ` · ${tr.t('training.perSide')}`;
  return out;
}

/** "8 kg" when a weight was picked, else the load label ("medium"); undefined for bodyweight. */
export function itemLoadLabel(tr: Translator, item: PrescribedItem): string | undefined {
  if (item.loadKg !== undefined) return tr.t('app.nodeLoadKg', { kg: item.loadKg });
  if (item.loadLabel) return tr.t(`training.load_${item.loadLabel}`);
  return undefined;
}
