import { describe, expect, it } from 'vitest';
import { COURSES, EXERCISES, contentIssues } from './registry';

describe('content registry', () => {
  it('loads exercises and courses without schema or cross-reference issues', () => {
    const issues = contentIssues();
    const report = issues.map((i) => `${i.path}: ${i.message}`).join('\n');
    expect(issues, report).toEqual([]);
  });

  it('ships the full catalog (5 courses, 40+ exercises)', () => {
    expect(COURSES.length).toBe(5);
    expect(EXERCISES.length).toBeGreaterThanOrEqual(40);
  });

  it('every course has both locales in slugs and unique node ids', () => {
    for (const c of COURSES) {
      expect(c.slug.ru).toBeTruthy();
      expect(c.slug.en).toBeTruthy();
      expect(new Set(c.nodes.map((n) => n.id)).size).toBe(c.nodes.length);
    }
  });
});
