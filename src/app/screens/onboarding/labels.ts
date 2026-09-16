/** Typed maps from engine enum values to i18n keys (keeps `t()` calls statically checked). */
import type { Equipment, Level } from '@/content/schema';
import type { TKey } from '@/i18n/index';
import type {
  ActivityLevel,
  AgeBand,
  Experience,
  Goal,
  Limitation,
  Sex,
} from '@/lib/training/types';

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

export const ACTIVITY_LABEL: Record<ActivityLevel, TKey> = {
  sedentary: 'app.onbActivitySedentary',
  light: 'app.onbActivityLight',
  moderate: 'app.onbActivityModerate',
  active: 'app.onbActivityActive',
};

/*
 * The answers are the facts now — «Меньше года», «1–3 года» — so there is no second line to map.
 * Each answer used to be a level name («Новичок») with the years under it as a description; the
 * description was the answer, and the name was a label for it (design/CHANGELOG.md §10).
 */
export const EXPERIENCE_LABEL: Record<Experience, TKey> = {
  none: 'app.onbExpNone',
  beginner: 'app.onbExpBeginner',
  intermediate: 'app.onbExpIntermediate',
  advanced: 'app.onbExpAdvanced',
};

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

export const GOAL_LABEL: Record<Goal, TKey> = {
  fat_loss: 'app.onbGoalFatLoss',
  strength: 'app.onbGoalStrength',
  endurance: 'app.onbGoalEndurance',
  general: 'app.onbGoalGeneral',
  muscle: 'app.onbGoalMuscle',
};

export const LEVEL_LABEL: Record<Level, TKey> = {
  1: 'common.level_1',
  2: 'common.level_2',
  3: 'common.level_3',
};
