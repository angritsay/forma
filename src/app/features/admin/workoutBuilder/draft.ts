/**
 * The workout builder's form state, and the two conversions around it: a saved structure into
 * editable drafts, and the drafts back into a structure. Kept apart from the form so the round
 * trip can be tested without rendering it.
 *
 * Every section and item keeps the object it was read from, and saving merges the edited fields
 * over it. A course imported from content brings EMOMs, AMRAPs, for-time pieces and Tabatas whose
 * timing the form has no controls for, and a rebuild from the form's own state would drop it.
 */
import type {
  CustomSectionKind,
  CustomWorkoutItem,
  CustomWorkoutSection,
  CustomWorkoutStructure,
} from '@/lib/training/customWorkout';
import type { ExerciseUnit } from '@/content/schema';
import { findExercise } from '@/content/catalogue';

export interface DraftItem {
  key: string;
  exerciseId: string;
  nameRu: string;
  unit: ExerciseUnit;
  target: number;
  perSide: boolean;
  restAfterSec: number;
  note: string;
  noteEn: string;
  /** The item this was read from, so fields the form has no control for survive a save. */
  source?: CustomWorkoutItem;
}

export interface DraftSection {
  kind: CustomSectionKind;
  sets: number;
  /**
   * The rest between rounds of a circuit. An EMOM reads it as a rest minute after each pass of its
   * movements, and the form has no control for it there, so an EMOM's value is never the form's.
   */
  restBetweenRoundsSec: number;
  items: DraftItem[];
  /** The section this was read from; see the note at the top of the file. */
  source?: CustomWorkoutSection;
}

const KINDS: CustomSectionKind[] = ['warmup', 'main', 'cooldown'];

let counter = 0;
/** A fresh row key, unique for the life of the page. */
export const nextKey = () => `it_${(counter += 1)}`;

/** The three sections of the form, filled from `initial` where it has them. */
export function emptySections(initial?: CustomWorkoutStructure): DraftSection[] {
  return KINDS.map((kind) => {
    const found = initial?.sections.find((s) => s.kind === kind);
    // A new circuit starts with a minute between rounds; an EMOM rests only where it was written to.
    const defaultRest = kind === 'main' && found?.format !== 'emom' ? 60 : 0;
    return {
      kind,
      sets: found?.sets ?? 1,
      restBetweenRoundsSec: found?.restBetweenRoundsSec ?? defaultRest,
      source: found,
      items: (found?.items ?? []).map((it) => ({
        key: nextKey(),
        exerciseId: it.exerciseId,
        nameRu: findExercise(it.exerciseId)?.name.ru ?? it.exerciseId,
        unit: it.unit,
        target: it.target,
        perSide: it.perSide === true,
        restAfterSec: it.restAfterSec,
        note: it.note ?? '',
        noteEn: it.noteEn ?? '',
        source: it,
      })),
    };
  });
}

/**
 * The drafts as a structure to save. Only the fields the form shows are overwritten; empty
 * sections are left out. An EMOM's rest between passes comes from its source, since the form
 * cannot show or change it.
 */
export function draftToStructure(sections: DraftSection[]): CustomWorkoutStructure {
  return {
    sections: sections
      .filter((s) => s.items.length > 0)
      .map((s) => {
        const format = s.source?.format ?? 'circuit';
        const formRest = s.kind === 'main' && format !== 'emom';
        return {
          ...s.source,
          kind: s.kind,
          format,
          sets: s.kind === 'main' ? Math.max(1, s.sets) : (s.source?.sets ?? 1),
          restBetweenRoundsSec: formRest
            ? Math.max(0, s.restBetweenRoundsSec)
            : (s.source?.restBetweenRoundsSec ?? 0),
          items: s.items.map((it) => ({
            ...it.source,
            exerciseId: it.exerciseId,
            unit: it.unit,
            target: Math.max(1, it.target),
            ...(it.perSide ? { perSide: true } : { perSide: undefined }),
            restAfterSec: Math.max(0, it.restAfterSec),
            ...(it.note.trim() ? { note: it.note.trim() } : { note: undefined }),
            ...(it.noteEn.trim() ? { noteEn: it.noteEn.trim() } : { noteEn: undefined }),
          })),
        };
      }),
  };
}
