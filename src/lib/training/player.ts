/**
 * Turn a prescribed workout into a deterministic, index-addressable list of player steps:
 * block_intro → (explain → work → rest …) → done. The app persists `stepIndex`, so the order
 * must only depend on the prescription. Rules: docs/TRAINING_SCIENCE.md §6.
 */
import { FORMAT_DEFAULT_WORK_REST, TABATA_DEFAULT_ROUNDS, TRANSITION_SEC } from './constants';
import type { PlayerStep, PrescribedBlock, PrescribedItem, PrescribedWorkout } from './types';
import { num, sum } from './util';

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
  // A test is a max effort against the clock: the UI records a score, not a share of the target.
  if (block.type === 'test') step.isTest = true;
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
  const workSec = sum(block.items.map((it) => Math.max(0, num(it.estimatedSec))));
  // No usable work estimate (no items, or numbers lost in storage): expect a single round rather
  // than an expectation built from transitions alone, which would punish the athlete.
  if (workSec <= 0) return 1;
  const perRound = workSec + TRANSITION_SEC * block.items.length;
  const duration = Math.max(0, num(block.durationSec));
  return Math.max(1, Math.floor(duration / perRound));
}

export function buildPlayerSteps(p: PrescribedWorkout): PlayerStep[] {
  const steps: PlayerStep[] = [];
  const explained = new Set<string>();

  /**
   * Introduce an exercise once. An explanation is its own step only when nothing else shows it:
   * a rest that already names this exercise as "next" is where the coach's video and notes play
   * (the athlete watches while resting), so no separate explain step follows it.
   */
  const explain = (block: PrescribedBlock, item: PrescribedItem) => {
    if (explained.has(item.exerciseId)) return;
    explained.add(item.exerciseId);
    const last = steps[steps.length - 1];
    if (last?.kind === 'rest' && last.nextExerciseId === item.exerciseId) return;
    steps.push({ kind: 'explain', blockId: block.blockId, exerciseId: item.exerciseId, item });
  };

  // A session that opens with a warm-up starts on the gate ("Сначала разомнёмся?") instead of
  // the warm-up's block intro; `skipToIndex` is filled in once the warm-up's steps are known.
  const gateFor = p.blocks[0]?.type === 'warmup' ? p.blocks[0] : undefined;
  if (gateFor) steps.push({ kind: 'warmup_gate', blockId: gateFor.blockId, skipToIndex: 0 });

  p.blocks.forEach((block, blockIndex) => {
    if (block !== gateFor) {
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
    }

    const items = block.items;
    const n = items.length;
    if (n === 0) return;

    switch (block.format) {
      case 'sets':
      case 'circuit': {
        const sets = Math.max(1, num(block.sets, 1));
        const between = num(
          block.format === 'circuit'
            ? block.restBetweenRoundsSec || block.restBetweenSetsSec
            : block.restBetweenSetsSec || block.restBetweenRoundsSec,
        );
        for (let s = 1; s <= sets; s++) {
          items.forEach((item, i) => {
            explain(block, item);
            steps.push(workStep(block, item, s, sets));
            const after = num(item.restAfterSec);
            const isLastItem = i === n - 1;
            if (!isLastItem) {
              if (after > 0) steps.push(restStep(block, after, items[i + 1]));
            } else if (s < sets) {
              const r = between > 0 ? between : after;
              if (r > 0) steps.push(restStep(block, r, items[0]));
            }
          });
        }
        break;
      }
      case 'emom': {
        const minutes = Math.max(1, num(block.sets, 1));
        for (let m = 1; m <= minutes; m++) {
          const item = items[(m - 1) % n]!;
          explain(block, item);
          steps.push(workStep(block, item, m, minutes, { durationSec: 60, target: item.target }));
        }
        break;
      }
      case 'tabata': {
        const rounds = Math.max(1, num(block.sets, TABATA_DEFAULT_ROUNDS) || TABATA_DEFAULT_ROUNDS);
        const w = Math.max(0, num(block.workSec, FORMAT_DEFAULT_WORK_REST.tabata.workSec));
        const r = Math.max(0, num(block.restSec, FORMAT_DEFAULT_WORK_REST.tabata.restSec));
        items.forEach((item, i) => {
          explain(block, item);
          const target = item.unit === 'reps' ? item.target : w;
          for (let round = 1; round <= rounds; round++) {
            steps.push(workStep(block, item, round, rounds, { durationSec: w, target }));
            if (round < rounds && r > 0) steps.push(restStep(block, r, item));
          }
          const next = items[i + 1];
          if (next) {
            const gap = Math.max(num(block.restBetweenRoundsSec), r);
            if (gap > 0) steps.push(restStep(block, gap, next));
          }
        });
        break;
      }
      case 'interval': {
        const rounds = Math.max(1, num(block.sets, 1));
        const w = Math.max(0, num(block.workSec, FORMAT_DEFAULT_WORK_REST.interval.workSec));
        const r = Math.max(0, num(block.restSec, FORMAT_DEFAULT_WORK_REST.interval.restSec));
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
          durationSec: Math.max(0, num(block.durationSec)),
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
          capSec: Math.max(0, num(block.durationSec)),
          rounds: Math.max(1, num(block.sets, 1)),
          items,
        });
        break;
      }
    }
  });

  steps.push({ kind: 'done' });

  // Skipping the warm-up lands on the first step that is not part of it (a block intro or done).
  const gate = steps[0];
  if (gate?.kind === 'warmup_gate') {
    const after = steps.findIndex(
      (s, i) => i > 0 && (s.kind === 'done' || !('blockId' in s) || s.blockId !== gate.blockId),
    );
    gate.skipToIndex = after < 0 ? steps.length - 1 : after;
  }
  return steps;
}
