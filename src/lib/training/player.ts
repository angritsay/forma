/**
 * Turn a prescribed workout into a deterministic, index-addressable list of player steps:
 * block_intro → (intro → work → rest …) → done. The app persists `stepIndex`, so the order must only
 * depend on the prescription. Rules: docs/TRAINING_SCIENCE.md §6.
 *
 * One step exists only to introduce an exercise, and only where the coach has written one.
 *
 * There used to be an introduction for every movement, from before the coach's clips existed: a
 * screen with the name, the target and the words, shown once per movement. It went, because the
 * clips turned out to be the movement itself rather than a talk about it, and an introduction that
 * only re-said what the clip already shows is one more tap between the athlete and their workout.
 *
 * The `intro` step that is here now is a different thing. It carries an explanation the coach
 * wrote and recorded for this movement in the admin panel (`Exercise.introFull` / `introBrief`) —
 * how to breathe into it, what to feel, what not to do — and it appears only where one is
 * configured, and only the first three times a person meets that movement: the full explanation
 * once, the brief one twice (intro.ts). Which exercises get one is decided when the session starts
 * and written on the prescription (`PrescribedWorkout.intros`), so these steps depend only on the
 * prescription like every other. A prescription without that map builds exactly what it did
 * before. What the old introduction carried for everyone is still on screen: a rest previews the
 * exercise that follows it, and the technique, cues and cautions are on the back of the card.
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

/**
 * A max-reps piece («максимум за 5 минут»): its target is the total, and the player counts reps
 * rather than rounds. The prescriber decides it (`PrescribedBlock.maxReps`); this only reads the
 * flag. A prescription stored before the flag existed has none, and only then is the shape read —
 * the same rule the engine applies, so a workout resumed across a deploy stays what it was.
 */
export function isMaxRepsAmrap(
  block: Pick<PrescribedBlock, 'format' | 'items' | 'maxReps'>,
): boolean {
  if (block.format !== 'amrap') return false;
  if (typeof block.maxReps === 'boolean') return block.maxReps;
  return block.items.length === 1 && block.items[0]!.unit === 'reps';
}

/** Expected rounds for a fully completing athlete in an AMRAP (min 1). */
export function amrapExpectedRounds(block: PrescribedBlock): number {
  // Max reps: the one item's target is the whole goal — one "round" is all of it.
  if (isMaxRepsAmrap(block)) return 1;
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
  /*
   * A session that opens with a warm-up opens *in* the warm-up — on its first movement.
   *
   * There used to be a gate here ("Сначала разомнёмся?") and, before that, a block intro. Both
   * were a screen asking permission to begin something the athlete has already begun: they pressed
   * Start. Skipping the warm-up is still possible at any moment (the pause overlay offers it), so
   * nothing is lost by not asking up front — `warmupSkipIndex` below is what that offer uses.
   */
  const openingWarmup = p.blocks[0]?.type === 'warmup' ? p.blocks[0] : undefined;

  /*
   * The coach's explanation, once per exercise per session, just before the athlete first does it.
   * `p.intros` already holds only exercises that have one to show and only the sessions they are
   * shown in (the first three meetings) — see intro.ts; here it is only placed.
   */
  const intros = p.intros ?? {};
  const introduced = new Set<string>();
  const introduce = (block: PrescribedBlock, exerciseId: string) => {
    // Read defensively: the map comes back from storage, and only the two known tiers count.
    const tier: unknown = intros[exerciseId];
    if ((tier !== 'full' && tier !== 'brief') || introduced.has(exerciseId)) return;
    introduced.add(exerciseId);
    steps.push({ kind: 'intro', blockId: block.blockId, exerciseId, tier });
  };

  p.blocks.forEach((block, blockIndex) => {
    if (block !== openingWarmup) {
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
            introduce(block, item.exerciseId);
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
        /*
         * A clock that runs minute after minute (and the interval below, round after round) is
         * one piece of work: an explanation of its second movement landing between minute 1 and
         * minute 2 would stop it halfway. So every explained movement of such a block is explained
         * up front, in order, before its first minute.
         */
        items.forEach((item) => introduce(block, item.exerciseId));
        for (let m = 1; m <= minutes; m++) {
          const item = items[(m - 1) % n]!;
          introduce(block, item.exerciseId);
          steps.push(workStep(block, item, m, minutes, { durationSec: 60, target: item.target }));
        }
        break;
      }
      case 'tabata': {
        const rounds = Math.max(1, num(block.sets, TABATA_DEFAULT_ROUNDS) || TABATA_DEFAULT_ROUNDS);
        const w = Math.max(0, num(block.workSec, FORMAT_DEFAULT_WORK_REST.tabata.workSec));
        const r = Math.max(0, num(block.restSec, FORMAT_DEFAULT_WORK_REST.tabata.restSec));
        items.forEach((item, i) => {
          const target = item.unit === 'reps' ? item.target : w;
          for (let round = 1; round <= rounds; round++) {
            introduce(block, item.exerciseId);
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
        // Up front, as for the EMOM above: the rounds are one continuous piece.
        items.forEach((item) => introduce(block, item.exerciseId));
        for (let round = 1; round <= rounds; round++) {
          items.forEach((item, i) => {
            const target = item.unit === 'reps' ? item.target : w;
            introduce(block, item.exerciseId);
            steps.push(workStep(block, item, round, rounds, { durationSec: w, target }));
            const isLast = round === rounds && i === n - 1;
            if (!isLast && r > 0) steps.push(restStep(block, r, items[(i + 1) % n]));
          });
        }
        break;
      }
      case 'amrap': {
        const amrap: Extract<PlayerStep, { kind: 'amrap' }> = {
          kind: 'amrap',
          blockId: block.blockId,
          durationSec: Math.max(0, num(block.durationSec)),
          items,
          expectedRounds: amrapExpectedRounds(block),
        };
        if (isMaxRepsAmrap(block)) amrap.maxReps = true;
        // A board of one movement is that movement; a board of several is not explained (intro.ts).
        if (n === 1) introduce(block, items[0]!.exerciseId);
        steps.push(amrap);
        break;
      }
      case 'fortime': {
        if (n === 1) introduce(block, items[0]!.exerciseId);
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

    // The authored pause between this block and the next; previews the next block's first move.
    const blockRest = num(block.restAfterSec);
    const nextBlock = p.blocks[blockIndex + 1];
    if (blockRest > 0 && nextBlock) steps.push(restStep(block, blockRest, nextBlock.items[0]));
  });

  steps.push({ kind: 'done' });
  return steps;
}

/**
 * Where "skip the warm-up" lands: the first step that is not part of the opening warm-up block,
 * or null when this session has no warm-up to skip.
 *
 * It is computed from the steps rather than stored on one, because the offer is made at any
 * moment during the warm-up now, not once at a gate that the athlete had to answer before
 * starting.
 */
export function warmupSkipIndex(steps: readonly PlayerStep[], p: PrescribedWorkout): number | null {
  const warmup = p.blocks[0]?.type === 'warmup' ? p.blocks[0] : undefined;
  if (!warmup) return null;
  const after = steps.findIndex(
    (s) => s.kind === 'done' || !('blockId' in s) || s.blockId !== warmup.blockId,
  );
  // Every step belongs to the warm-up, so there is nothing on the other side of it to skip to.
  return after < 0 ? null : after;
}
