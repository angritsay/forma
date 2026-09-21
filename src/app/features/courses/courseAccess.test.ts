import { describe, expect, it } from 'vitest';
import type { Course, CourseNode } from '@/content/schema';
import { courseAccess, firstTrainableNode, hasCompletedIn, nodeAccess } from './courseAccess';

function node(id: string, kind: CourseNode['kind']): CourseNode {
  return { id, kind, title: { ru: id, en: id }, workoutId: 'w1' } as CourseNode;
}
function course(nodes: CourseNode[]): Course {
  return { id: 'c', nodes } as Course;
}

describe('courseAccess', () => {
  it('reads ownership first, and whether the free workout was tried only when there is none', () => {
    expect(courseAccess({ owned: true, hasCompleted: false })).toBe('owned');
    // Owning it wins even once a workout is done — that is the whole point of owning it.
    expect(courseAccess({ owned: true, hasCompleted: true })).toBe('owned');
    expect(courseAccess({ owned: false, hasCompleted: false })).toBe('trial');
    expect(courseAccess({ owned: false, hasCompleted: true })).toBe('tried');
  });
});

describe('firstTrainableNode', () => {
  /*
   * «Форма с нуля» opens on a workout, but that is a property of one course rather than a rule:
   * a course may well start with a rest day or a milestone, and neither is a workout to give away.
   */
  it('skips the days that are not training', () => {
    const c = course([node('r1', 'rest'), node('m1', 'milestone'), node('w1', 'workout')]);
    expect(firstTrainableNode(c)?.id).toBe('w1');
  });

  it('takes the first workout when the course opens on one', () => {
    expect(firstTrainableNode(course([node('w1', 'workout'), node('w2', 'workout')]))?.id).toBe(
      'w1',
    );
  });

  it('answers null for a course with nothing to train', () => {
    expect(firstTrainableNode(course([node('r1', 'rest')]))).toBeNull();
  });
});

describe('nodeAccess', () => {
  const c = course([node('w1', 'workout'), node('w2', 'workout')]);

  it('opens everything for an owner', () => {
    const owned = { owned: true, course: c };
    expect(nodeAccess({ ...owned, node: c.nodes[0]! })).toBe('open');
    expect(nodeAccess({ ...owned, node: c.nodes[1]! })).toBe('open');
  });

  it('opens the first workout and nothing else', () => {
    const free = { owned: false, course: c };
    expect(nodeAccess({ ...free, node: c.nodes[0]! })).toBe('open');
    expect(nodeAccess({ ...free, node: c.nodes[1]! })).toBe('paywalled');
  });

  /*
   * The whole of 0022. The rule used to close the free workout the moment it was finished, so the
   * one thing the product gives away could be taken exactly once. Finishing it changes nothing
   * here now, which is what «перепроходить первую тренировку и всегда в бесплатном режиме» means.
   */
  it('leaves the first workout open after it has been done', () => {
    const c2 = course([node('r1', 'rest'), node('w1', 'workout'), node('w2', 'workout')]);
    expect(nodeAccess({ owned: false, course: c2, node: c2.nodes[1]! })).toBe('open');
    expect(nodeAccess({ owned: false, course: c2, node: c2.nodes[2]! })).toBe('paywalled');
  });

  /*
   * Stricter than the database on purpose: `can_train_free_node()` lets the free workout be any
   * node, because the server does not know their order. Here it is the first one, so nobody makes
   * day twenty their free workout by opening a link.
   */
  it('is stricter than the policy it mirrors', () => {
    const free = { owned: false, course: c };
    expect(nodeAccess({ ...free, node: c.nodes[1]! })).toBe('paywalled');
  });

  /* A course with nothing trainable in it paywalls everything rather than opening it. */
  it('opens nothing when the course has no workout in it', () => {
    const empty = course([node('r1', 'rest')]);
    expect(nodeAccess({ owned: false, course: empty, node: empty.nodes[0]! })).toBe('paywalled');
  });
});

describe('hasCompletedIn', () => {
  it('answers from the server list', () => {
    expect(hasCompletedIn(['start', 'engine'], 'start')).toBe(true);
    expect(hasCompletedIn(['engine'], 'start')).toBe(false);
    expect(hasCompletedIn([], 'start')).toBe(false);
  });
});
