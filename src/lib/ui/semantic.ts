/**
 * The semantic colour map — one meaning per colour (global.css header, design/CHANGELOG.md §15).
 *
 * The third palette (§14) gave every colour a job, but the course colour kept leaking into places
 * where it meant nothing: the beginners' orange on a workout's title over a photograph, on the
 * «recommended» row of the difficulty sheet, on generic progress. Orange there reads as «effort»,
 * because that is what orange says everywhere else, and a green 🌿 inside an orange disc is not
 * readable at all. This module is the map written as data, so the components and the contrast tests
 * read the same values:
 *
 *   - neon      «do this / now»: the one main action; the «Рекомендуем», «Сегодня», «Новое» markers
 *   - light blue brand accent and selection: key words, links, selected state, progress, focus, info
 *   - field     electric blue as a surface only (hero field, active tab pill), never type on charcoal
 *   - orange    intensity and effort: «Посложнее», heat, max effort, time running out; also the
 *               beginners' course tag — identity on its own tile or tag only
 *   - ciel      the coach
 *   - success, warning, danger — unchanged
 *
 * The course colour (`--course-accent`, `text-course`, `bg-course`) is identity: a course's tile,
 * its tag, the nodes of its path. It is not a heading colour, not a UI state and not progress.
 */
import type { DifficultyChoice } from '@/lib/training/types';

export const COLOUR = {
  ground: '#1a1a1a',
  surface: '#242424',
  surface2: '#2e2e2e',
  surface3: '#383838',
  text: '#f6f6f7',
  ink: '#111111',
  /** Neon — «сделай это / сейчас». */
  action: '#f4ff3f',
  /** Light blue — brand accent and selection. */
  accent: '#afe9fd',
  /** Electric blue — a surface, never type on charcoal. */
  field: '#2038e2',
  /** Orange — intensity and effort. */
  effort: '#ff5a00',
  /** Bleu ciel — the coach. */
  coach: '#007bff',
  success: '#7ce0b0',
  warning: '#ffd166',
  danger: '#ff6b6b',
} as const;

/**
 * The difficulty scale: lighter is the light blue, the ordinary day is plain white, harder is the
 * orange of effort. The hex is what the tests measure; the class is what the sheet paints.
 */
export const DIFFICULTY_COLOUR: Readonly<Record<DifficultyChoice, string>> = {
  easier: COLOUR.accent,
  normal: COLOUR.text,
  harder: COLOUR.effort,
};

export const DIFFICULTY_BAR_CLASS: Readonly<Record<DifficultyChoice, string>> = {
  easier: 'bg-accent',
  normal: 'bg-text',
  harder: 'bg-orange',
};

/**
 * Where an emoji may sit. An emoji carries its own colours, and on a saturated fill (orange, neon,
 * the blues, the club's gradient) half of them vanish — 🌿 on orange is the case that started this.
 * So a plate under an emoji is one of these neutrals, or white.
 */
export const EMOJI_PLATES = [COLOUR.ground, COLOUR.surface, COLOUR.surface2, '#ffffff'] as const;

/** Fill utilities that are saturated and must never hold an emoji (`contrast-usage.test.ts`). */
export const SATURATED_FILL_CLASSES = [
  'bg-course',
  'bg-action',
  'bg-orange',
  'bg-field',
  'bg-cross',
  'bg-ciel',
] as const;
