/**
 * Turn a prescribed workout into a deterministic, index-addressable list of player steps:
 * block_intro → (explain → work → rest …) → done. The app persists `stepIndex`, so the order
 * must only depend on the prescription. Rules: docs/TRAINING_SCIENCE.md §6.
 */
import { TABATA_DEFAULT_ROUNDS, TRANSITION_SEC } from './constants';
import type { PlayerStep, PrescribedBlock, PrescribedItem, PrescribedWorkout } from './types';
import { sum } from './util';

type WorkStep = Extract<PlayerStep, { kind: 'work' }>;

function workStep(
  block: PrescribedBlock,
  item: PrescribedItem,
  set: number,
  totalSets: number,
  timer?: { durationSec: number; target?: number },
): WorkStep {
  const isTimed = timer !== undefined || item.unit === 'seconds';
  const step: WorkStep = {
    kind: 'work',
    blockId: block.blockId,
    exerciseId: item.exerciseId,
    item,
    set,
    totalSets,
    mode: isTimed ? 'timer' : 'reps',
    target: timer?.target ?? item.target,
  };
  if (isTimed) step.durationSec = timer?.durationSec ?? item.target;
  if (item.loadKg !== undefined) step.loadKg = item.loadKg;
  return step;
}

function restStep(block: PrescribedBlock, durationSec: number, next?: PrescribedItem): PlayerStep {
  const step: Extract<PlayerStep, { kind: 'rest' }> = {
    kind: 'rest',
    blockId: block.blockId,
    durationSec,
  };
  if (next) step.nextExerciseId = next.exerciseId;
  return step;
}

/** Expected rounds for a fully completing athlete in an AMRAP (min 1). */
export function amrapExpectedRounds(block: PrescribedBlock): number {
  const perRound =
    sum(block.items.map((it) => it.estimatedSec)) + TRANSITION_SEC * block.items.length;
  const duration = block.durationSec ?? 0;
  if (perRound <= 0) return 1;
  return Math.max(1, Math.floor(duration / perRound));
}

export function buildPlayerSteps(p: PrescribedWorkout): PlayerStep[] {
  const steps: PlayerStep[] = [];
  const explained = new Set<string>();

  const explain = (block: PrescribedBlock, item: PrescribedItem) => {
    if (explained.has(item.exerciseId)) return;
    explained.add(item.exerciseId);
    steps.push({ kind: 'explain', blockId: block.blockId, exerciseId: item.exerciseId, item });
  };

  p.blocks.forEach((block, blockIndex) => {
    const intro: Extract<PlayerStep, { kind: 'block_intro' }> = {
      kind: 'block_intro',
      blockId: block.blockId,
      blockIndex,
      type: block.type,
      format: block.format,
      sets: block.sets,
    };
    if (block.title) intro.title = block.title;
    if (block.description) intro.description = block.description;
    if (block.durationSec !== undefined) intro.durationSec = block.durationSec;
    steps.push(intro);

    const items = block.items;
    const n = items.length;
    if (n === 0) return;

    switch (block.format) {
      case 'sets':
      case 'circuit': {
        const sets = Math.max(1, block.sets);
        const between =
          block.format === 'circuit'
            ? block.restBetweenRoundsSec || block.restBetweenSetsSec
            : block.restBetweenSetsSec || block.restBetweenRoundsSec;
        for (let s = 1; s <= sets; s++) {
          items.forEach((item, i) => {
            explain(block, item);
            steps.push(workStep(block, item, s, sets));
            const isLastItem = i === n - 1;
            if (!isLastItem) {
              if (item.restAfterSec > 0)
                steps.push(restStep(block, item.restAfterSec, items[i + 1]));
            } else if (s < sets) {
              const r = between > 0 ? between : item.restAfterSec;
              if (r > 0) steps.push(restStep(block, r, items[0]));
            }
          });
        }
        break;
      }
      case 'emom': {
        const minutes = Math.max(1, block.sets);
        for (let m = 1; m <= minutes; m++) {
          const item = items[(m - 1) % n]!;
          explain(block, item);
          steps.push(workStep(block, item, m, minutes, { durationSec: 60, target: item.target }));
        }
        break;
      }
      case 'tabata': {
        const rounds = Math.max(1, block.sets || TABATA_DEFAULT_ROUNDS);
        const w = block.workSec ?? 20;
        const r = block.restSec ?? 10;
        items.forEach((item, i) => {
          explain(block, item);
          const target = item.unit === 'reps' ? item.target : w;
          for (let round = 1; round <= rounds; round++) {
            steps.push(workStep(block, item, round, rounds, { durationSec: w, target }));
            if (round < rounds && r > 0) steps.push(restStep(block, r, item));
          }
          const next = items[i + 1];
          if (next) {
            const gap = Math.max(block.restBetweenRoundsSec, r);
            if (gap > 0) steps.push(restStep(block, gap, next));
          }
        });
        break;
      }
      case 'interval': {
        const rounds = Math.max(1, block.sets);
        const w = block.workSec ?? 30;
        const r = block.restSec ?? 30;
        for (let round = 1; round <= rounds; round++) {
          items.forEach((item, i) => {
            explain(block, item);
            const target = item.unit === 'reps' ? item.target : w;
            steps.push(workStep(block, item, round, rounds, { durationSec: w, target }));
            const isLast = round === rounds && i === n - 1;
            if (!isLast && r > 0) steps.push(restStep(block, r, items[(i + 1) % n]));
          });
        }
        break;
      }
      case 'amrap': {
        for (const item of items) explain(block, item);
        steps.push({
          kind: 'amrap',
          blockId: block.blockId,
          durationSec: block.durationSec ?? 0,
          items,
          expectedRounds: amrapExpectedRounds(block),
        });
        break;
      }
      case 'fortime': {
        for (const item of items) explain(block, item);
        steps.push({
          kind: 'fortime',
          blockId: block.blockId,
          capSec: block.durationSec ?? 0,
          rounds: Math.max(1, block.sets),
          items,
        });
        break;
      }
    }
  });

  steps.push({ kind: 'done' });
  return steps;
}
