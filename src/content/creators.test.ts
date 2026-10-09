import { describe, expect, it } from 'vitest';
import type { Course } from './schema';
import { creatorSitePath, siteCreatorsFrom, type PublicCreatorRow } from './creators';

const course = (id: string) => ({ id }) as unknown as Course;
const row = (over: Partial<PublicCreatorRow>): PublicCreatorRow => ({
  slug: 'alla-yoga',
  name: 'Alla',
  about: null,
  audience_url: null,
  courses: ['a'],
  ...over,
});

describe('siteCreatorsFrom', () => {
  const courses = [course('a'), course('b')];

  it('keeps only courses with a site page, in the creator order', () => {
    const [c] = siteCreatorsFrom([row({ courses: ['b', 'gone', 'a'] })], courses);
    expect(c?.courses.map((x) => x.id)).toEqual(['b', 'a']);
  });

  it('builds no page for a creator left with no course', () => {
    expect(siteCreatorsFrom([row({ courses: ['gone'] }), row({ courses: null })], courses)).toEqual(
      [],
    );
  });

  it('skips a slug that is not a safe path segment, and a second row with the same slug', () => {
    const out = siteCreatorsFrom(
      [row({ slug: '../x' }), row({ name: 'First' }), row({ name: 'Second' })],
      courses,
    );
    expect(out.map((c) => c.name)).toEqual(['First']);
  });

  it('drops an audience link that is not https, and trims the text', () => {
    const [c] = siteCreatorsFrom(
      [row({ name: ' Alla ', about: '  ', audience_url: 'javascript:alert(1)' })],
      courses,
    );
    expect(c).toMatchObject({ name: 'Alla', about: null, audienceUrl: null });
  });

  it('puts the page under /c/', () => {
    expect(creatorSitePath('alla-yoga')).toBe('/c/alla-yoga/');
  });
});
