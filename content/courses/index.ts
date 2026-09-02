/**
 * Course programs. One file per course; this index lists them in display order.
 */
import type { CourseInput } from '@/content/schema';
import { COURSE_START } from './start';
import { COURSE_ENGINE } from './engine';
import { COURSE_DUMBBELLS } from './dumbbells';
import { COURSE_KETTLEBELL } from './kettlebell';

export const COURSES: CourseInput[] = [
  COURSE_START,
  COURSE_ENGINE,
  COURSE_DUMBBELLS,
  COURSE_KETTLEBELL,
];
