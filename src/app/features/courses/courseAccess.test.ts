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
  it('reads ownership first, and the trial only when there is none', () => {
    expect(courseAccess({ owned: true, hasCompleted: false })).toBe('owned');
    // Owning it wins even once a workout is done — that is the whole point of owning it.
    expect(courseAccess({ owned: true, hasCompleted: true })).toBe('owned');
    expect(courseAccess({ owned: false, hasCompleted: false })).toBe('trial');
    expect(courseAccess({ owned: false, hasCompleted: true })).toBe('spent');
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
    const owned = { owned: true, hasCompleted: true, course: c };
    expect(nodeAccess({ ...owned, node: c.nodes[0]! })).toBe('open');
    expect(nodeAccess({ ...owned, node: c.nodes[1]! })).toBe('open');
  });

  it('opens the first workout on the trial and nothing else', () => {
    const trial = { owned: false, hasCompleted: false, course: c };
    expect(nodeAccess({ ...trial, node: c.nodes[0]! })).toBe('open');
    expect(nodeAccess({ ...trial, node: c.nodes[1]! })).toBe('paywalled');
  });

  it('closes the first workout once the trial is spent', () => {
    const spent = { owned: false, hasCompleted: true, course: c };
    expect(nodeAccess({ ...spent, node: c.nodes[0]! })).toBe('paywalled');
  });

  /*
   * Stricter than the database on purpose: `can_try_course()` would allow a session on any node,
   * because the server does not know their order. Here only the first one is free, so nobody spends
   * their single free workout on day twenty by opening a link.
   */
  it('is stricter than the policy it mirrors', () => {
    const trial = { owned: false, hasCompleted: false, course: c };
    expect(nodeAccess({ ...trial, node: c.nodes[1]! })).toBe('paywalled');
  });
});

describe('hasCompletedIn', () => {
  it('answers from the server list', () => {
    expect(hasCompletedIn(['start', 'engine'], 'start')).toBe(true);
    expect(hasCompletedIn(['engine'], 'start')).toBe(false);
    expect(hasCompletedIn([], 'start')).toBe(false);
  });
});
