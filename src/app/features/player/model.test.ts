import { afterEach, describe, expect, it } from 'vitest';
import { resetCatalogueOverlay, setCatalogueOverlay } from '@/content/catalogue';
import { EXERCISE_BY_ID } from '@/content/registry';
import {
  contraindicationsFor,
  exerciseAudioRef,
  exerciseVideoRef,
  firstFilmedIndex,
  sessionAudioRefs,
  sessionVideoRefs,
  stepArtExerciseId,
  stepFitSec,
  stepVideoRef,
  stepVoiceRef,
} from './model';
import type { PlayerStep, PrescribedItem, PrescribedWorkout } from '@/lib/training/types';

const ex = (id: string) => {
  const e = EXERCISE_BY_ID.get(id);
  if (!e) throw new Error(`fixture exercise missing: ${id}`);
  return e;
};

describe('contraindicationsFor', () => {
  it('reads the engine rules: jumps for knees, floor work on the hands for wrists', () => {
    expect(contraindicationsFor(ex('tuck_jump'))).toContain('knees');
    expect(contraindicationsFor(ex('push_up'))).toContain('wrists');
  });
  it('lists hypertension for isometric holds, which the engine caps rather than swaps', () => {
    expect(contraindicationsFor(ex('plank'))).toContain('hypertension');
  });
  it('is empty for a plain movement with no rule attached', () => {
    // A bodyweight squat: no jump, no hinge under load, nothing overhead, not on the hands.
    expect(contraindicationsFor(ex('air_squat'))).toEqual([]);
  });
});

describe('exerciseVideoRef', () => {
  it('falls back to the Russian clip when the locale has no recording of its own', () => {
    const ruOnly = ex('air_squat');
    expect(ruOnly.video?.ru).toBeTruthy();
    expect(exerciseVideoRef('air_squat', 'en')).toBe(ruOnly.video?.ru);
  });
  it('is undefined for an unknown id or an exercise without video', () => {
    expect(exerciseVideoRef(undefined, 'ru')).toBeUndefined();
    expect(exerciseVideoRef('no_such_exercise', 'ru')).toBeUndefined();
  });
});

describe('stepVideoRef', () => {
  const clip = exerciseVideoRef('air_squat', 'ru');
  const next = exerciseVideoRef('push_up', 'ru');

  /*
   * The one the athlete actually asked for. Work carried the drawn figure while the coach's own
   * recording of that exact movement sat unused — the clips are the movement, not a separate
   * explanation, so the moment of doing it is exactly when it should be on screen.
   */
  it('plays the exercise while it is being done', () => {
    const step = { kind: 'work', exerciseId: 'air_squat' } as unknown as PlayerStep;
    expect(clip).toBeTruthy();
    expect(stepVideoRef(step, 'ru')).toBe(clip);
  });

  it('previews what is coming during rest, not what has just been done', () => {
    const step = { kind: 'rest', nextExerciseId: 'push_up' } as unknown as PlayerStep;
    expect(next).toBeTruthy();
    expect(stepVideoRef(step, 'ru')).toBe(next);
    expect(stepVideoRef(step, 'ru')).not.toBe(clip);
  });

  it('shows nothing when there is no step', () => {
    expect(stepVideoRef(undefined, 'ru')).toBeUndefined();
    expect(stepVideoRef({ kind: 'done' } as PlayerStep, 'ru')).toBeUndefined();
  });
});

/*
 * The owner's screenshot: an AMRAP step with a clock, «Круги 0» and a black middle. A step about a
 * whole block used to get no clip at all; it now plays the first movement on its board that has
 * one, and a tap on a row switches to that row's.
 */
describe('stepVideoRef on a board', () => {
  const item = (exerciseId: string) => ({ exerciseId }) as unknown as PrescribedItem;
  // An unknown id stands in for a movement nobody has filmed yet.
  const items = [item('no_such_exercise'), item('air_squat'), item('push_up')];
  const squat = exerciseVideoRef('air_squat', 'ru');
  const pushUp = exerciseVideoRef('push_up', 'ru');
  const prescribed = {
    blocks: [{ blockId: 'b1', items }],
  } as unknown as PrescribedWorkout;

  it('plays the first filmed movement of an AMRAP and a for-time piece', () => {
    expect(firstFilmedIndex(items, 'ru')).toBe(1);
    expect(stepVideoRef({ kind: 'amrap', items } as unknown as PlayerStep, 'ru')).toBe(squat);
    expect(stepVideoRef({ kind: 'fortime', items } as unknown as PlayerStep, 'ru')).toBe(squat);
  });

  it('plays the row the athlete picked', () => {
    const step = { kind: 'amrap', items } as unknown as PlayerStep;
    expect(stepVideoRef(step, 'ru', prescribed, 2)).toBe(pushUp);
    expect(stepArtExerciseId(step, prescribed, 'ru', 2)).toBe('push_up');
    // A row with no footage plays nothing rather than someone else's clip.
    expect(stepVideoRef(step, 'ru', prescribed, 0)).toBeUndefined();
  });

  it("plays the block's first filmed movement on its title card", () => {
    const intro = { kind: 'block_intro', blockId: 'b1' } as unknown as PlayerStep;
    expect(stepVideoRef(intro, 'ru', prescribed)).toBe(squat);
    expect(stepArtExerciseId(intro, prescribed, 'ru')).toBe('air_squat');
    // Without the prescription there is no block to look in.
    expect(stepVideoRef(intro, 'ru')).toBeUndefined();
  });

  it('lists every clip of the session once, for signing in one go', () => {
    const twice = {
      blocks: [
        { blockId: 'b1', items },
        { blockId: 'b2', items: [item('air_squat')] },
      ],
    } as unknown as PrescribedWorkout;
    expect(sessionVideoRefs(twice, 'ru')).toEqual([squat, pushUp]);
  });
});

/*
 * A clip in `fit` mode is stretched over the step, so the step has to say how long it is. Only a
 * step about doing one movement can: everything else loops whatever the clip's mode says.
 */
describe('stepFitSec', () => {
  const item = { exerciseId: 'plank', estimatedSec: 24 } as unknown as PrescribedItem;

  it('is the countdown of a timed hold', () => {
    const step = { kind: 'work', mode: 'timer', durationSec: 60, item } as unknown as PlayerStep;
    expect(stepFitSec(step)).toBe(60);
  });

  it("is the engine's estimate for a set of reps", () => {
    const step = { kind: 'work', mode: 'reps', item } as unknown as PlayerStep;
    expect(stepFitSec(step)).toBe(24);
    // A timer with no length is shown as reps, and fits as reps.
    const empty = { kind: 'work', mode: 'timer', durationSec: 0, item } as unknown as PlayerStep;
    expect(stepFitSec(empty)).toBe(24);
  });

  it('is undefined where there is no length to fill, so the clip loops', () => {
    const none = { ...item, estimatedSec: 0 };
    expect(
      stepFitSec({ kind: 'work', mode: 'reps', item: none } as unknown as PlayerStep),
    ).toBeUndefined();
    expect(stepFitSec({ kind: 'rest', durationSec: 30 } as unknown as PlayerStep)).toBeUndefined();
    expect(
      stepFitSec({ kind: 'amrap', durationSec: 600, items: [item] } as unknown as PlayerStep),
    ).toBeUndefined();
    expect(
      stepFitSec({ kind: 'fortime', capSec: 600, items: [item] } as unknown as PlayerStep),
    ).toBeUndefined();
    expect(
      stepFitSec({ kind: 'block_intro', durationSec: 600 } as unknown as PlayerStep),
    ).toBeUndefined();
    expect(stepFitSec({ kind: 'done' } as PlayerStep)).toBeUndefined();
  });
});

/*
 * The spoken name. None of the compiled exercises carries a recording, so one is marked up the
 * way the admin panel does it: as a media overlay on a compiled movement.
 */
describe('the spoken name', () => {
  const RU = 'storage:audio/shared/plank.ru.m4a';
  const EN = 'storage:audio/shared/plank.en.m4a';
  const SQUAT_RU = 'storage:audio/shared/air_squat.ru.m4a';
  const overlay = () =>
    setCatalogueOverlay({
      courses: [],
      exercises: [
        { ...ex('plank'), audio: { ru: RU, en: EN } },
        { ...ex('air_squat'), audio: { ru: SQUAT_RU } },
      ],
    });
  afterEach(() => resetCatalogueOverlay());

  it('speaks the viewer’s language and falls back to Russian, as the clips do', () => {
    overlay();
    expect(exerciseAudioRef('plank', 'en')).toBe(EN);
    expect(exerciseAudioRef('plank', 'ru')).toBe(RU);
    expect(exerciseAudioRef('air_squat', 'en')).toBe(SQUAT_RU);
  });

  it('is silent for an exercise with no recording, or no exercise', () => {
    expect(exerciseAudioRef('push_up', 'ru')).toBeUndefined();
    expect(exerciseAudioRef('no_such_exercise', 'ru')).toBeUndefined();
    expect(exerciseAudioRef(undefined, 'ru')).toBeUndefined();
  });

  it('names the movement of a work step and of a one-movement AMRAP or for-time piece', () => {
    overlay();
    const item = (exerciseId: string) => ({ exerciseId }) as unknown as PrescribedItem;
    expect(stepVoiceRef({ kind: 'work', exerciseId: 'plank' } as unknown as PlayerStep, 'ru')).toBe(
      RU,
    );
    expect(
      stepVoiceRef({ kind: 'amrap', items: [item('plank')] } as unknown as PlayerStep, 'en'),
    ).toBe(EN);
    expect(
      stepVoiceRef({ kind: 'fortime', items: [item('plank')] } as unknown as PlayerStep, 'ru'),
    ).toBe(RU);
  });

  it('says nothing for a board of several, a rest, a title card or the end', () => {
    overlay();
    const item = (exerciseId: string) => ({ exerciseId }) as unknown as PrescribedItem;
    const several = [item('plank'), item('air_squat')];
    expect(
      stepVoiceRef({ kind: 'amrap', items: several } as unknown as PlayerStep, 'ru'),
    ).toBeUndefined();
    expect(
      stepVoiceRef({ kind: 'fortime', items: several } as unknown as PlayerStep, 'ru'),
    ).toBeUndefined();
    expect(
      stepVoiceRef({ kind: 'rest', nextExerciseId: 'plank' } as unknown as PlayerStep, 'ru'),
    ).toBeUndefined();
    expect(
      stepVoiceRef({ kind: 'block_intro', blockId: 'b1' } as unknown as PlayerStep, 'ru'),
    ).toBeUndefined();
    expect(stepVoiceRef({ kind: 'done' } as PlayerStep, 'ru')).toBeUndefined();
    expect(stepVoiceRef(undefined, 'ru')).toBeUndefined();
  });

  it('lists every recording of the session once, for signing and decoding in one go', () => {
    overlay();
    const item = (exerciseId: string) => ({ exerciseId }) as unknown as PrescribedItem;
    const prescribed = {
      blocks: [
        { blockId: 'b1', items: [item('plank'), item('push_up'), item('air_squat')] },
        { blockId: 'b2', items: [item('plank')] },
      ],
    } as unknown as PrescribedWorkout;
    expect(sessionAudioRefs(prescribed, 'en')).toEqual([EN, SQUAT_RU]);
    expect(sessionAudioRefs(prescribed, 'ru')).toEqual([RU, SQUAT_RU]);
  });
});
