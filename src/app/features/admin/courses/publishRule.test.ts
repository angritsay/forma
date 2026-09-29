import { describe, expect, it } from 'vitest';
import { canPublish } from './publishRule';

describe('canPublish', () => {
  it('never lets a compiled course be published from the builder', () => {
    expect(canPublish('start', [])).toBe(false);
    expect(canPublish('start', ['missing title'])).toBe(false);
  });

  it('lets an admin-built course be published once it has no issues', () => {
    expect(canPublish('my_own_course', [])).toBe(true);
    expect(canPublish('my_own_course', ['missing title'])).toBe(false);
  });
});
