import ExerciseFigure from '@/components/anim/ExerciseFigure';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EXERCISE_BY_ID } from '@/content/registry';
import { formatDuration } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import type { PrescribedBlock, PrescribedItem, PrescribedWorkout } from '@/lib/training/types';
import { blockMetaLabel, exerciseName, itemLoadLabel, itemTargetLabel } from './plan';

function PlanItem({ item }: { item: PrescribedItem }) {
  const tr = useT();
  const { t, l } = tr;
  const exercise = EXERCISE_BY_ID.get(item.exerciseId);
  const name = exercise ? l(exercise.name) : item.exerciseId;
  const load = itemLoadLabel(tr, item);
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-inner bg-surface-3 text-text">
        <ExerciseFigure
          animation={exercise?.animation ?? 'air_squat'}
          variant="thumb"
          className="size-9"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{name}</span>
        {item.substituted ? (
          <span className="block truncate text-xs text-accent">
            {t('training.substitutedFrom', { name: exerciseName(tr, item.originalExerciseId) })}
          </span>
        ) : null}
        {item.note ? <span className="block text-xs text-muted">{l(item.note)}</span> : null}
      </span>
      <span className="flex shrink-0 flex-col items-end text-right">
        <span className="tabular text-sm font-semibold">{itemTargetLabel(tr, item)}</span>
        {load ? <span className="text-xs text-muted">{load}</span> : null}
        {item.restAfterSec > 0 ? (
          <span className="text-xs text-muted-2">
            {t('app.nodeRestAfter', { s: item.restAfterSec })}
          </span>
        ) : null}
      </span>
    </li>
  );
}

function PlanBlock({ block }: { block: PrescribedBlock }) {
  const tr = useT();
  const { t, l, locale } = tr;
  const between = block.restBetweenSetsSec || block.restBetweenRoundsSec;
  return (
    <Card padding="sm" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[15px] font-semibold">
          {block.title ? l(block.title) : t(`training.block_${block.type}`)}
        </span>
        <span className="tabular text-xs text-muted">{formatDuration(locale, block.estimatedSec)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Chip size="sm" tone={block.type === 'test' ? 'accent' : 'default'}>
          {blockMetaLabel(tr, block)}
        </Chip>
        {between > 0 ? (
          <span className="text-xs text-muted">{t('app.nodeRestAfter', { s: between })}</span>
        ) : null}
      </div>
      {block.description ? (
        <p className="text-sm text-muted">{l(block.description)}</p>
      ) : null}
      <ul className="flex flex-col divide-y divide-border">
        {block.items.map((item, i) => (
          <PlanItem key={`${item.exerciseId}-${i}`} item={item} />
        ))}
      </ul>
    </Card>
  );
}

/** The prescribed plan: every block with its format chip and concrete item targets. */
export function PlanBlocks({ prescribed }: { prescribed: PrescribedWorkout }) {
  return (
    <div className="flex flex-col gap-3">
      {prescribed.blocks.map((block) => (
        <PlanBlock key={block.blockId} block={block} />
      ))}
    </div>
  );
}
