import { EQUIPMENT, type Equipment } from '@/content/schema';
import type { CustomWorkoutStructure } from './customWorkout';

/**
 * Что достать перед тренировкой — по самой тренировке, а не со слов.
 *
 * На карточке выданной тренировки вместо этого стояли очки: «~24 мин · 72 pts». Владелец:
 * «Вместо points нужно необходимое оборудование писать». И правда: очки человек узнает после, а
 * гантели нужны до — это единственная строка на карточке, которая может изменить решение открыть
 * её сейчас или позже.
 *
 * ## Коврика здесь нет намеренно
 *
 * «Коврик если что не нужно» — владелец. Он лежит у всех, кто занимается дома, и упоминать его
 * значит разбавлять список тем, за чем никто не пойдёт. `none` не выводится по той же причине, но
 * с обратным знаком: это не предмет, а его отсутствие.
 */
const HIDDEN: ReadonlySet<Equipment> = new Set<Equipment>(['none', 'mat']);

/** Порядок — канонический, из схемы: один и тот же список всегда читается одинаково. */
const ORDER = new Map<Equipment, number>(EQUIPMENT.map((e, i) => [e, i]));

/**
 * Оборудование всей тренировки, без повторов и в устойчивом порядке.
 *
 * Пустой ответ значит «ничего не нужно» — и это ответ, а не пробел: показать его полезнее, чем
 * промолчать, потому что «ничего не нужно» тоже решение.
 */
export function workoutEquipment(
  structure: CustomWorkoutStructure | null | undefined,
  equipmentOf: (exerciseId: string) => readonly Equipment[] | undefined,
): Equipment[] {
  const found = new Set<Equipment>();
  for (const section of structure?.sections ?? []) {
    for (const item of section.items ?? []) {
      for (const e of equipmentOf(item.exerciseId) ?? []) {
        if (!HIDDEN.has(e)) found.add(e);
      }
    }
  }
  return [...found].sort((a, b) => (ORDER.get(a) ?? 99) - (ORDER.get(b) ?? 99));
}
