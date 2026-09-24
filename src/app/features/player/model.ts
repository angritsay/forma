/**
 * Pure helpers shared by the player and summary screens: content lookups for steps, localized
 * labels for targets / sets / block formats, and result shapes.
 */
import type {
  BlockFormat,
  BlockType,
  Exercise,
  ExerciseIntro,
  ExerciseUnit,
  Load,
} from '@/content/schema';
import { findExercise } from '@/content/catalogue';
import { plural, type Locale, type TKey, type TParams } from '@/i18n/index';
import { ISOMETRIC_ID_PATTERN } from '@/lib/training/constants';
import { isMaxRepsAmrap } from '@/lib/training/player';
import { conflictsWithLimitations } from '@/lib/training/prescribe';
import type {
  IntroTier,
  Limitation,
  PlayerStep,
  PrescribedBlock,
  PrescribedItem,
  PrescribedWorkout,
} from '@/lib/training/types';
import type { PlayerResult } from '@/app/store/activeWorkout';

export type Translate = (key: TKey, params?: TParams) => string;

export type BlockIntroStep = Extract<PlayerStep, { kind: 'block_intro' }>;
export type IntroStep = Extract<PlayerStep, { kind: 'intro' }>;
export type WorkStep = Extract<PlayerStep, { kind: 'work' }>;
export type RestStep = Extract<PlayerStep, { kind: 'rest' }>;
export type AmrapStep = Extract<PlayerStep, { kind: 'amrap' }>;
export type FortimeStep = Extract<PlayerStep, { kind: 'fortime' }>;

/** Steps that produce a result and count towards completion. */
export function isWorkType(step: PlayerStep): boolean {
  return step.kind === 'work' || step.kind === 'amrap' || step.kind === 'fortime';
}

/*
 * Re-exported so the player's own modules have one place to ask from. It used to read the compiled
 * registry directly; it now goes through the catalogue, which also knows the exercises written in
 * the admin panel — without that, a yoga pose would be an unknown id mid-workout.
 */
export { findExercise };

export function findBlock(p: PrescribedWorkout, blockId: string): PrescribedBlock | undefined {
  return p.blocks.find((b) => b.blockId === blockId);
}

export function isTestBlock(block: PrescribedBlock | undefined): boolean {
  return block?.type === 'test';
}

/** Exercise name in the current locale, falling back to the id for unknown content. */
export function exerciseName(id: string, locale: Locale): string {
  const e = findExercise(id);
  return e ? e.name[locale] : id;
}

/**
 * The coach's video for an exercise in the viewer's language, falling back to Russian: the clips
 * are filmed once, and a language without its own recording still gets the demonstration.
 */
export function exerciseVideoRef(id: string | undefined, locale: Locale): string | undefined {
  const v = id ? findExercise(id)?.video : undefined;
  return v?.[locale] ?? v?.ru ?? undefined;
}

/**
 * The explanation an `intro` step shows: read from the catalogue when it is shown rather than
 * stored on the step, so an explanation re-edited in the admin panel shows its latest words.
 */
export function exerciseIntro(exerciseId: string, tier: IntroTier): ExerciseIntro | undefined {
  const e = findExercise(exerciseId);
  return (tier === 'full' ? e?.introFull : e?.introBrief) ?? undefined;
}

/** The explanation's own clip, if the coach filmed one (one clip for every language). */
export function introVideoRef(exerciseId: string, tier: IntroTier): string | undefined {
  const v = exerciseIntro(exerciseId, tier)?.video;
  return typeof v === 'string' && v.trim() !== '' ? v : undefined;
}

/**
 * The explanation's recording in the viewer's language, falling back to Russian — and, when the
 * coach wrote the explanation but recorded nothing, to the movement's spoken name, so the athlete
 * with their eyes elsewhere still hears which movement is being explained.
 */
export function introAudioRef(
  exerciseId: string,
  tier: IntroTier,
  locale: Locale,
): string | undefined {
  const a = exerciseIntro(exerciseId, tier)?.audio;
  return a?.[locale] || a?.ru || exerciseAudioRef(exerciseId, locale);
}

/**
 * An explanation's words in the viewer's language (else Russian, else English), as paragraphs:
 * the coach separates them with a blank line in the admin panel's text box.
 */
export function introParagraphs(text: ExerciseIntro['text'], locale: Locale): string[] {
  const raw = text?.[locale]?.trim() || text?.ru?.trim() || text?.en?.trim() || '';
  return raw
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p !== '');
}

/**
 * The movements a step that is about a whole block puts on its board: an AMRAP's or a for-time
 * piece's own list, or the block a title card introduces. Empty for a step about one movement.
 */
export function boardItems(
  step: PlayerStep | undefined,
  prescribed?: PrescribedWorkout,
): readonly PrescribedItem[] {
  switch (step?.kind) {
    case 'amrap':
    case 'fortime':
      return step.items;
    case 'block_intro':
      return (prescribed && findBlock(prescribed, step.blockId)?.items) ?? [];
    default:
      return [];
  }
}

/** The first movement on a board that the coach has filmed, or 0 when none of them is. */
export function firstFilmedIndex(items: readonly PrescribedItem[], locale: Locale): number {
  const i = items.findIndex((it) => exerciseVideoRef(it.exerciseId, locale) !== undefined);
  return i < 0 ? 0 : i;
}

/**
 * The clip to play behind a step, if the exercise has one.
 *
 * Wherever an exercise is the subject of the screen, its footage is what belongs on it: while it is
 * explained, while it is being done, and — for the exercise coming next — through the rest before
 * it. Work was once excluded on the theory that a recording cannot match a prescribed count. It
 * cannot, but that is not what these clips are: they are the movement itself, filmed once and
 * looped, with no separate "explaining" version to hold back for.
 *
 * **A step about a block plays one of its movements.** An AMRAP, a for-time piece and a block's
 * title card used to get nothing, on the theory that they are about the block rather than a
 * movement — and on a phone that theory was a black screen with a clock on it, which is what the
 * owner sent. They now play the first movement on the board that has footage, and the board's
 * rows switch it (`pick`, the row's index). A block intro needs the prescription to find its
 * block; without one it keeps the old answer.
 */
export function stepVideoRef(
  step: PlayerStep | undefined,
  locale: Locale,
  prescribed?: PrescribedWorkout,
  pick?: number,
): string | undefined {
  switch (step?.kind) {
    case 'work':
      return exerciseVideoRef(step.exerciseId, locale);
    // The explanation's own clip when there is one, else the movement it explains.
    case 'intro':
      return introVideoRef(step.exerciseId, step.tier) ?? exerciseVideoRef(step.exerciseId, locale);
    case 'rest':
      return exerciseVideoRef(step.nextExerciseId, locale);
    case 'amrap':
    case 'fortime':
    case 'block_intro': {
      const items = boardItems(step, prescribed);
      const item = items[pick ?? firstFilmedIndex(items, locale)];
      return exerciseVideoRef(item?.exerciseId, locale);
    }
    default:
      return undefined;
  }
}

/**
 * Every clip a session can show, once each — what the player signs in one go when it opens (see
 * `signMediaUrls`). Every movement of every block, not only the ones a step plays by default: a
 * board's rows can switch to any of theirs.
 */
export function sessionVideoRefs(prescribed: PrescribedWorkout, locale: Locale): string[] {
  const refs = sessionRefs(prescribed, (id) => exerciseVideoRef(id, locale));
  return unique([...refs, ...introRefs(prescribed, (id, tier) => introVideoRef(id, tier))]);
}

/**
 * How long the step's clip has to fill, for a clip in `fit` mode (see `fit.ts`) — or undefined
 * where the clip should loop as before.
 *
 * Only a step about doing one movement has a length the clip can be stretched to: a timed hold
 * has its countdown, a set of reps has the engine's estimate of how long it takes. A rest shows the
 * next movement as a preview, a board (AMRAP, for time, a title card) shows one of several, and
 * none of those is the movement being done for that long — so they loop, whatever the clip's mode.
 */
export function stepFitSec(step: PlayerStep): number | undefined {
  if (step.kind !== 'work') return undefined;
  // The same branch the player takes: a timer with no length is shown as reps.
  if (step.mode === 'timer' && (step.durationSec ?? 0) > 0) return step.durationSec;
  return step.item.estimatedSec > 0 ? step.item.estimatedSec : undefined;
}

/**
 * The exercise's name spoken in the viewer's language, falling back to Russian as the clips do:
 * a name in the wrong language still tells the athlete which movement is next.
 */
export function exerciseAudioRef(id: string | undefined, locale: Locale): string | undefined {
  const a = id ? findExercise(id)?.audio : undefined;
  return a?.[locale] ?? a?.ru ?? undefined;
}

/**
 * The recording to say when a step begins: the movement's name (see `voice.ts`).
 *
 * A set of one movement says that movement. An AMRAP or a for-time piece of exactly one movement
 * says it too — «максимум повторений» is still one exercise. A board of several says nothing: the
 * athlete is about to do all of them, and listing them would be a sentence, not a name. A rest
 * says nothing either — its clip is a preview of the next movement, and the name will be said when
 * that movement begins. An explanation (`intro`) says nothing here either: it plays its own
 * recording, which is longer than a name and belongs to the explanation's screen (IntroStep).
 */
export function stepVoiceRef(step: PlayerStep | undefined, locale: Locale): string | undefined {
  switch (step?.kind) {
    case 'work':
      return exerciseAudioRef(step.exerciseId, locale);
    case 'amrap':
    case 'fortime':
      return step.items.length === 1
        ? exerciseAudioRef(step.items[0]?.exerciseId, locale)
        : undefined;
    default:
      return undefined;
  }
}

/**
 * Every recording a session can speak, once each — signed together with the clips and decoded
 * ahead by `prefetchVoice`, so the first name is ready before the first step asks for it.
 */
export function sessionAudioRefs(prescribed: PrescribedWorkout, locale: Locale): string[] {
  const refs = sessionRefs(prescribed, (id) => exerciseAudioRef(id, locale));
  return unique([...refs, ...introRefs(prescribed, (id, tier) => introAudioRef(id, tier, locale))]);
}

/**
 * The explanations' own media, for the exercises this session explains (`prescribed.intros`) —
 * signed and decoded with everything else, so an explanation's recording is ready when its step
 * arrives. Absent map, nothing.
 */
function introRefs(
  prescribed: PrescribedWorkout,
  refOf: (exerciseId: string, tier: IntroTier) => string | undefined,
): string[] {
  const out: string[] = [];
  for (const [id, tier] of Object.entries(prescribed.intros ?? {})) {
    if (tier !== 'full' && tier !== 'brief') continue;
    const ref = refOf(id, tier);
    if (ref) out.push(ref);
  }
  return out;
}

function unique(refs: readonly string[]): string[] {
  return [...new Set(refs)];
}

function sessionRefs(
  prescribed: PrescribedWorkout,
  refOf: (exerciseId: string) => string | undefined,
): string[] {
  const refs = new Set<string>();
  for (const block of prescribed.blocks) {
    for (const item of block.items) {
      const ref = refOf(item.exerciseId);
      if (ref) refs.add(ref);
    }
  }
  return [...refs];
}

const ALL_LIMITATIONS: readonly Limitation[] = [
  'knees',
  'lower_back',
  'shoulders',
  'wrists',
  'hypertension',
  'pregnancy',
];

/**
 * Conditions under which the coach would swap or cap this movement — read straight off the
 * engine's substitution rules, so the "contraindications" tab never says something the app would
 * not itself act on. Hypertension is the one rule expressed as a cap (long isometric holds), not a
 * swap, so it is listed for holds.
 */
export function contraindicationsFor(exercise: Exercise, load?: Load): Limitation[] {
  return ALL_LIMITATIONS.filter((lim) =>
    lim === 'hypertension'
      ? ISOMETRIC_ID_PATTERN.test(exercise.id)
      : conflictsWithLimitations(exercise, load, new Set([lim])),
  );
}

const LIMITATION_KEY: Record<Limitation, TKey> = {
  knees: 'app.onbLimKnees',
  lower_back: 'app.onbLimLowerBack',
  shoulders: 'app.onbLimShoulders',
  wrists: 'app.onbLimWrists',
  hypertension: 'app.onbLimHypertension',
  pregnancy: 'app.onbLimPregnancy',
};

export function limitationLabel(t: Translate, lim: Limitation): string {
  return t(LIMITATION_KEY[lim]);
}

export function unitLabel(t: Translate, unit: ExerciseUnit): string {
  return t(`training.${unit}`);
}

/** "12 reps", "30 sec · per side". */
export function targetLabel(
  t: Translate,
  item: Pick<PrescribedItem, 'unit' | 'target' | 'perSide'>,
): string {
  const base = `${item.target} ${unitLabel(t, item.unit)}`;
  return item.perSide ? `${base} · ${t('training.perSide')}` : base;
}

/** "8 kg" when a weight is chosen, else the load label ("medium"), else undefined. */
export function loadLabel(
  t: Translate,
  item: { loadKg?: number; loadLabel?: Load },
): string | undefined {
  if (item.loadKg !== undefined) return t('app.playerKg', { kg: item.loadKg });
  if (item.loadLabel) return t(`training.load_${item.loadLabel}`);
  return undefined;
}

export function formatLabel(t: Translate, format: BlockFormat): string {
  return t(`training.format_${format}`);
}

export function blockTypeLabel(t: Translate, type: BlockType): string {
  return t(`training.block_${type}`);
}

/** Localized block title (authored title, else the block type). */
export function blockTitle(
  t: Translate,
  locale: Locale,
  block: Pick<PrescribedBlock, 'title' | 'type'>,
): string {
  return block.title ? block.title[locale] : blockTypeLabel(t, block.type);
}

/**
 * The three parts a session reads as, the way the coach describes it: the warm-up, the workout
 * itself, and the cool-down. Every granular block type folds into one of them — warm-up and
 * cool-down are their own, everything else (strength, metcon, core, skill, the test) is the workout.
 */
export type BlockSection = 'warmup' | 'main' | 'cooldown';

export function blockSection(type: BlockType): BlockSection {
  if (type === 'warmup') return 'warmup';
  if (type === 'cooldown') return 'cooldown';
  return 'main';
}

const SECTION_KEY: Record<BlockSection, TKey> = {
  warmup: 'app.playerSectionWarmup',
  main: 'app.playerSectionMain',
  cooldown: 'app.playerSectionCooldown',
};

export function sectionLabel(t: Translate, section: BlockSection): string {
  return t(SECTION_KEY[section]);
}

/** The section the current step belongs to; a block intro carries its own type. */
export function sectionOfStep(step: PlayerStep, p: PrescribedWorkout): BlockSection {
  if (step.kind === 'block_intro') return blockSection(step.type);
  if (step.kind === 'done') {
    const last = p.blocks[p.blocks.length - 1];
    return last ? blockSection(last.type) : 'main';
  }
  const block = findBlock(p, step.blockId);
  return block ? blockSection(block.type) : 'main';
}

/** Sections present in this workout, in order (warm-up → workout → cool-down), de-duplicated. */
export function workoutSections(p: PrescribedWorkout): BlockSection[] {
  const out: BlockSection[] = [];
  for (const b of p.blocks) {
    const s = blockSection(b.type);
    if (!out.includes(s)) out.push(s);
  }
  return out;
}

/** When the workout section spans several blocks, which part this one is: {n, total}, else null. */
export function mainPart(
  p: PrescribedWorkout,
  blockId: string,
): { n: number; total: number } | null {
  const mains = p.blocks.filter((b) => blockSection(b.type) === 'main');
  if (mains.length < 2) return null;
  const i = mains.findIndex((b) => b.blockId === blockId);
  return i < 0 ? null : { n: i + 1, total: mains.length };
}

/** "Set 2 of 3" / "Round 2 of 3" / "Minute 2 of 12" depending on the block format. */
export function setLabel(t: Translate, format: BlockFormat, set: number, total: number): string {
  switch (format) {
    case 'sets':
      return t('app.playerSetOf', { n: set, total });
    case 'emom':
      return t('app.playerMinuteOf', { n: set, total });
    case 'circuit':
    case 'tabata':
    case 'interval':
    case 'amrap':
    case 'fortime':
      return t('app.playerRoundOf', { n: set, total });
  }
}

export function setsText(t: Translate, locale: Locale, n: number): string {
  return plural(locale, n, {
    one: t('app.playerSetsOne', { n }),
    few: t('app.playerSetsFew', { n }),
    many: t('app.playerSetsMany', { n }),
  });
}

export function roundsText(t: Translate, locale: Locale, n: number): string {
  return plural(locale, n, {
    one: t('app.playerRoundsOne', { n }),
    few: t('app.playerRoundsFew', { n }),
    many: t('app.playerRoundsMany', { n }),
  });
}

/** «Ориентир: около 1 круга / 3 кругов» under the AMRAP clock. */
export function amrapExpectedText(t: Translate, locale: Locale, n: number): string {
  return plural(locale, n, {
    one: t('training.amrapExpectedOne', { n }),
    few: t('training.amrapExpectedFew', { n }),
    many: t('training.amrapExpectedMany', { n }),
  });
}

/** One-line structure of a block for intros and summaries. */
export function blockMeta(t: Translate, locale: Locale, block: PrescribedBlock): string {
  const min = Math.round((block.durationSec ?? 0) / 60);
  switch (block.format) {
    case 'sets':
      return setsText(t, locale, block.sets);
    case 'circuit':
      return roundsText(t, locale, block.sets);
    case 'emom':
      return `${formatLabel(t, 'emom')} · ${t('common.minutesShort', { n: block.sets })}`;
    case 'tabata':
      return `${formatLabel(t, 'tabata')} · ${block.sets} × ${block.workSec ?? 20}/${block.restSec ?? 10} ${t('training.seconds')}`;
    case 'interval':
      return `${roundsText(t, locale, block.sets)} · ${block.workSec ?? 30}/${block.restSec ?? 30} ${t('training.seconds')}`;
    case 'amrap':
      return isMaxRepsAmrap(block)
        ? `${t('training.maxRepsHint', { min })} · ${t('training.maxRepsGoal', { n: block.items[0]!.target })}`
        : t('training.amrapHint', { min });
    case 'fortime':
      return t('training.fortimeHint', { rounds: roundsText(t, locale, block.sets), min });
  }
}

/** Title for the player top bar. */
export function stepTitle(
  t: Translate,
  locale: Locale,
  step: PlayerStep,
  prescribed: PrescribedWorkout,
): string {
  switch (step.kind) {
    case 'block_intro':
      return step.title ? step.title[locale] : blockTypeLabel(t, step.type);
    case 'work':
    case 'intro':
      return exerciseName(step.exerciseId, locale);
    case 'rest':
      return t('training.rest');
    case 'amrap':
    case 'fortime': {
      const block = findBlock(prescribed, step.blockId);
      return block ? blockTitle(t, locale, block) : formatLabel(t, step.kind);
    }
    case 'done':
      return '';
  }
}

/** The movement a step is about: the exercise itself, or the first exercise of its block. */
export function stepExerciseId(
  step: PlayerStep,
  prescribed: PrescribedWorkout,
): string | undefined {
  const first = (blockId: string) => findBlock(prescribed, blockId)?.items[0]?.exerciseId;
  let exerciseId: string | undefined;
  switch (step.kind) {
    case 'work':
    case 'intro':
      exerciseId = step.exerciseId;
      break;
    case 'rest':
      exerciseId = step.nextExerciseId ?? first(step.blockId);
      break;
    case 'block_intro':
    case 'amrap':
    case 'fortime':
      exerciseId = first(step.blockId);
      break;
    case 'done':
      exerciseId = prescribed.blocks[0]?.items[0]?.exerciseId;
      break;
  }
  return exerciseId;
}

/**
 * The movement whose picture is behind a step: the one `stepVideoRef` plays, so the still under
 * the clip is a frame of the same movement.
 */
export function stepArtExerciseId(
  step: PlayerStep,
  prescribed: PrescribedWorkout,
  locale: Locale,
  pick?: number,
): string | undefined {
  const items = boardItems(step, prescribed);
  if (items.length > 0) return items[pick ?? firstFilmedIndex(items, locale)]?.exerciseId;
  return stepExerciseId(step, prescribed);
}

/** Result for a step the athlete chose to skip (null for steps without a result). */
export function skippedResult(step: PlayerStep, stepIndex: number): PlayerResult | null {
  switch (step.kind) {
    case 'work':
      return {
        stepIndex,
        blockId: step.blockId,
        exerciseId: step.exerciseId,
        completed: false,
        skipped: true,
      };
    case 'amrap':
    case 'fortime':
      return { stepIndex, blockId: step.blockId, completed: false, skipped: true };
    case 'block_intro':
    case 'intro':
    case 'rest':
    case 'done':
      return null;
  }
}

/** Clamp a hand-entered count. */
export const COUNT_MAX = 999;
export function clampCount(n: number, max = COUNT_MAX): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(max, Math.round(n)));
}
