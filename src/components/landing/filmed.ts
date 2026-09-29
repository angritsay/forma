/**
 * Which movements of a course are filmed — the facts behind the homepage's «Каждое движение — на
 * видео» wall and its one line, «Сергей снял все {n} движений курса».
 *
 * «Все» is printed only when it is true: every distinct movement in every block of the course
 * (warm-ups and cool-downs included) has a clip of its own in `storage:videos/…`. Otherwise the
 * page says how many are filmed and nothing about the rest. Build time only; the browser never
 * loads this file.
 */
import { EXERCISE_BY_ID } from '@/content/registry';
import type { Course } from '@/content/schema';

export interface FilmedFacts {
  /** Distinct movements in the course, every block. */
  total: number;
  /** Of those, how many have a clip. */
  filmed: number;
  /** `filmed === total` — the only case the page may say «все». */
  all: boolean;
  /**
   * Filmed movements of the training blocks (warm-up and cool-down left out: joint circles make a
   * poor wall), distinct, in the order the course meets them.
   */
  training: string[];
  /**
   * Every filmed movement, distinct: the training ones, then the cool-down's stretches, then the
   * warm-up's joint circles last — the order the wall draws its reserve in.
   */
  filmedIds: string[];
}

function hasClip(exerciseId: string): boolean {
  const video = EXERCISE_BY_ID.get(exerciseId)?.video;
  return Object.values(video ?? {}).some((v) => typeof v === 'string' && v.startsWith('storage:'));
}

export function filmedFacts(course: Course): FilmedFacts {
  const every = new Set<string>();
  const byKind = {
    training: new Set<string>(),
    cooldown: new Set<string>(),
    warmup: new Set<string>(),
  };
  for (const workout of course.workouts) {
    for (const block of workout.blocks) {
      const kind =
        block.type === 'warmup' ? 'warmup' : block.type === 'cooldown' ? 'cooldown' : 'training';
      for (const item of block.items) {
        every.add(item.exerciseId);
        if (hasClip(item.exerciseId)) byKind[kind].add(item.exerciseId);
      }
    }
  }
  const filmed = [...every].filter(hasClip).length;
  return {
    total: every.size,
    filmed,
    all: every.size > 0 && filmed === every.size,
    training: [...byKind.training],
    filmedIds: [...new Set([...byKind.training, ...byKind.cooldown, ...byKind.warmup])],
  };
}

/**
 * Up to `n` filmed movements for the wall, skipping the ones shown elsewhere: the training
 * movements first, then stretches, then mobility, to fill the row.
 */
export function wallMoves(facts: FilmedFacts, exclude: Iterable<string>, n = 8): string[] {
  const skip = new Set(exclude);
  const order = facts.filmedIds;
  return order.filter((id) => !skip.has(id)).slice(0, n);
}
