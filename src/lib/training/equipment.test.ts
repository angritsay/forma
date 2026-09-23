import { describe, expect, it } from 'vitest';
import type { Equipment } from '@/content/schema';
import type { CustomWorkoutStructure } from './customWorkout';
import { workoutEquipment } from './equipment';

const GEAR: Record<string, Equipment[]> = {
  squat: ['none'],
  swing: ['kettlebell'],
  press: ['dumbbells'],
  row: ['dumbbells'],
  stretch: ['mat'],
  pullup: ['pullup_bar'],
};
const equipmentOf = (id: string) => GEAR[id];

const workout = (...ids: string[]): CustomWorkoutStructure => ({
  sections: [
    { kind: 'main', items: ids.map((exerciseId) => ({ exerciseId, unit: 'reps', target: 10 })) },
  ] as CustomWorkoutStructure['sections'],
});

describe('workoutEquipment', () => {
  it('names each thing once, however many exercises use it', () => {
    expect(workoutEquipment(workout('press', 'row', 'press'), equipmentOf)).toEqual(['dumbbells']);
  });

  /*
   * Владелец: «коврик если что не нужно». Он есть у всех, кто занимается дома, и в списке только
   * разбавляет то, за чем действительно надо идти.
   */
  it('leaves out the mat and the absence of equipment', () => {
    expect(workoutEquipment(workout('squat', 'stretch'), equipmentOf)).toEqual([]);
    expect(workoutEquipment(workout('squat', 'stretch', 'swing'), equipmentOf)).toEqual([
      'kettlebell',
    ]);
  });

  /* Один и тот же набор читается одинаково, в каком бы порядке упражнения ни стояли. */
  it('keeps a stable order whatever the workout order', () => {
    const a = workoutEquipment(workout('pullup', 'swing', 'press'), equipmentOf);
    const b = workoutEquipment(workout('press', 'pullup', 'swing'), equipmentOf);
    expect(a).toEqual(b);
    expect(a).toEqual(['dumbbells', 'kettlebell', 'pullup_bar']);
  });

  /*
   * Каталог грузится отдельно от карточки и может опоздать. Пустой ответ здесь лучше выдуманного:
   * карточка просто не нарисует строку, а не соврёт «ничего не нужно».
   */
  it('answers empty rather than throwing when nothing is known yet', () => {
    expect(workoutEquipment(workout('press'), () => undefined)).toEqual([]);
    expect(workoutEquipment(null, equipmentOf)).toEqual([]);
    expect(workoutEquipment({ sections: [] }, equipmentOf)).toEqual([]);
  });
});
