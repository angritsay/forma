/** Typed maps from engine enum values to i18n keys (keeps `t()` calls statically checked). */
import type { Equipment } from '@/content/schema';
import type { TKey } from '@/i18n/index';
import type { AgeBand, Limitation, Sex } from '@/lib/training/types';

export const AGE_BAND_LABEL: Record<AgeBand, TKey> = {
  '18-24': 'app.onbAge1824',
  '25-34': 'app.onbAge2534',
  '35-44': 'app.onbAge3544',
  '45-54': 'app.onbAge4554',
  '55-64': 'app.onbAge5564',
  '65+': 'app.onbAge65',
};

export const SEX_LABEL: Record<Sex, TKey> = {
  male: 'app.onbSexMale',
  female: 'app.onbSexFemale',
  na: 'app.onbSexNa',
};

/**
 * What each notch of the level slider says, notch 1 first.
 *
 * Ten labels rather than five spanning two notches each: a slider whose words move on every other
 * drag reads as broken, and these sentences are what turn the figure into an answer — without
 * them the athlete is picking a number on the app's private scale. They are sentences about how
 * much this person trains, which is the fact the two engine fields behind the slider hold
 * (LEVEL_ACTIVITY / LEVEL_EXPERIENCE in draft.ts).
 */
export const LEVEL_SLIDER_LABEL: readonly TKey[] = [
  'app.onbLevel01',
  'app.onbLevel02',
  'app.onbLevel03',
  'app.onbLevel04',
  'app.onbLevel05',
  'app.onbLevel06',
  'app.onbLevel07',
  'app.onbLevel08',
  'app.onbLevel09',
  'app.onbLevel10',
];

/**
 * Kept although the wizard no longer asks about equipment: the profile's equipment sheet and the
 * course cards both name a piece of gear through this map.
 */
export const EQUIPMENT_LABEL: Record<Equipment, TKey> = {
  none: 'common.equipment_none',
  dumbbells: 'common.equipment_dumbbells',
  kettlebell: 'common.equipment_kettlebell',
  pullup_bar: 'common.equipment_pullup_bar',
  bands: 'common.equipment_bands',
  jump_rope: 'common.equipment_jump_rope',
  box: 'common.equipment_box',
  chair: 'common.equipment_chair',
  mat: 'common.equipment_mat',
};

export const LIMITATION_LABEL: Record<Limitation, TKey> = {
  knees: 'app.onbLimKnees',
  lower_back: 'app.onbLimLowerBack',
  shoulders: 'app.onbLimShoulders',
  wrists: 'app.onbLimWrists',
  hypertension: 'app.onbLimHypertension',
  pregnancy: 'app.onbLimPregnancy',
};

/**
 * A picture for each answer, so the row is scanned rather than read («добавь эмодзи в каждую
 * плашку чтобы нагляднее было»).
 *
 * Emoji rather than drawn icons because the app already uses them for achievements, and because
 * six new glyphs in the icon set would be six drawings to keep in step with a face they do not
 * belong to. They sit here and not in the i18n strings so that a translator cannot lose one and so
 * that the tile can give the picture its own slot.
 *
 * There is no emoji for a lower back, and the ones that look like one are arrows and signs. 🦴 is
 * the closest true thing — the spine is what the answer is about. Blood pressure takes 🫀 for the
 * same reason: the organ, not a gauge. Nothing here is a diagnosis and none of them is a warning
 * sign; an answer about a body is not a hazard notice.
 */
export const LIMITATION_EMOJI: Record<Limitation, string> = {
  knees: '🦵',
  lower_back: '🦴',
  shoulders: '💪',
  wrists: '🤲',
  hypertension: '🫀',
  pregnancy: '🤰',
};

/** «Ничего, всё в порядке» and «Другое», which are not `Limitation`s but share the row. */
export const LIMITATION_NONE_EMOJI = '👌';
export const LIMITATION_OTHER_EMOJI = '✍️';
