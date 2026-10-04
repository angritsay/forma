/** How the studio names an exercise's unit: «на повторы», «на время», … */
import type { ExerciseUnit } from '@/lib/api/mediaStudio';
import type { TKey } from '@/i18n/index';

const UNIT_LABEL: Record<ExerciseUnit, TKey> = {
  reps: 'app.studioUnitRepsShort',
  seconds: 'app.studioUnitSecondsShort',
  meters: 'app.studioUnitMetersShort',
  calories: 'app.studioUnitCaloriesShort',
};

export function unitLabel(unit: ExerciseUnit): TKey {
  return UNIT_LABEL[unit];
}
