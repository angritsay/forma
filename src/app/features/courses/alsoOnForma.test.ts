import { describe, expect, it } from 'vitest';
import type { Course } from '@/content/schema';
import type { PublicCreator } from '@/lib/api/types';
import { alsoOnForma } from './alsoOnForma';

const course = (id: string) => ({ id }) as unknown as Course;
const creator = (slug: string, courses: string[]): PublicCreator => ({
  slug,
  name: slug.toUpperCase(),
  about: null,
  audienceUrl: null,
  courses,
});

describe('alsoOnForma', () => {
  const catalogue = [course('a1'), course('a2'), course('b1'), course('mine')];

  it('groups loaded courses by creator, in the server order', () => {
    const groups = alsoOnForma(
      [creator('alla', ['a2', 'a1']), creator('bob', ['b1'])],
      catalogue,
      new Set(),
    );
    expect(groups.map((g) => [g.slug, g.courses.map((c) => c.id)])).toEqual([
      ['alla', ['a2', 'a1']],
      ['bob', ['b1']],
    ]);
  });

  it('leaves out courses already on the screen, unknown ones, and creators left empty', () => {
    const groups = alsoOnForma(
      [creator('alla', ['a1', 'gone']), creator('me', ['mine'])],
      catalogue,
      new Set(['mine']),
    );
    expect(groups).toEqual([{ slug: 'alla', name: 'ALLA', courses: [course('a1')] }]);
  });

  it('shows a course once even if two rows name it', () => {
    const groups = alsoOnForma(
      [creator('alla', ['a1']), creator('bob', ['a1', 'b1'])],
      catalogue,
      new Set(),
    );
    expect(groups.map((g) => g.courses.map((c) => c.id))).toEqual([['a1'], ['b1']]);
  });
});
