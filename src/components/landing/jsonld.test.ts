import { describe, expect, it } from 'vitest';
import { LIVE_COURSES } from '@/content/registry';
import { courseLd, creatorLd } from './jsonld';

const site = 'https://example.com';
const course = LIVE_COURSES[0]!;
const opts = { url: `${site}/courses/x/`, image: `${site}/og.png` };

type Instance = { hasCourseInstance: { instructor?: Record<string, unknown> } };

describe('courseLd instructor', () => {
  it("names Forma's coach for Forma's own course", () => {
    const ld = courseLd(site, 'ru', course, opts) as unknown as Instance;
    expect(ld.hasCourseInstance.instructor).toEqual({ '@id': `${site}/#coach` });
  });

  it("names the creator, by name only, for a creator's course", () => {
    const ld = courseLd(site, 'ru', course, { ...opts, instructor: 'Alla' }) as unknown as Instance;
    expect(ld.hasCourseInstance.instructor).toEqual({ '@type': 'Person', name: 'Alla' });
  });

  it('claims no instructor when the creator has no page to name', () => {
    const ld = courseLd(site, 'ru', course, { ...opts, instructor: null }) as unknown as Instance;
    expect(JSON.parse(JSON.stringify(ld)).hasCourseInstance.instructor).toBeUndefined();
  });
});

describe('creatorLd', () => {
  it('prints only what the creator wrote, and no empty fields', () => {
    expect(creatorLd(`${site}/c/alla/`, { name: 'Alla', about: null, audienceUrl: null })).toEqual({
      '@type': 'Person',
      '@id': `${site}/c/alla/#creator`,
      name: 'Alla',
      url: `${site}/c/alla/`,
    });
  });
});
