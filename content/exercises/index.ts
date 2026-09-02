/**
 * Exercise library. Group files export arrays; this index concatenates them.
 * Keep ids stable: they are referenced by courses, animations, SEO pages and user data.
 */
import type { ExerciseInput } from '@/content/schema';
import { EXERCISES_A } from '@content/exercises/bodyweight-lower-upper';
import { EXERCISES_B } from '@content/exercises/bodyweight-core-cardio-mobility';

export const EXERCISES: ExerciseInput[] = [...EXERCISES_A, ...EXERCISES_B];
