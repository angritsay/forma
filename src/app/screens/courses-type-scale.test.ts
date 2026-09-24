/**
 * «Курсы» has one type scale, and this is what keeps it to one.
 *
 * Owner, of the screen: «Слишком много типографики и элементов. Почисти и сделай аккуратнее и
 * консистентнее». Before design/CHANGELOG.md §18 the screen set type at eight sizes — 13, 14, 15,
 * 16, 19, 20, 26 and 42px — because each block had grown its own: the banner's `text-base`
 * heading, the coach shelf's `text-xl` heading and 19px card title, the course card's 15px name
 * and 42px figure, the hero's 26px title. §18 cut it to four steps, one job each:
 *
 *   - **26** — the athlete's name in the head, and nothing else;
 *   - **22** — every card title: the hero, the square course card, the coach's field;
 *   - **15** — body: the greeting, the banner's title, the card buttons' labels;
 *   - **13** — pills, meta, hints.
 *
 * The scan reads the four files that draw the screen and lists every `text-[Npx]` they set; a
 * fifth size is a regression, whichever file it lands in. The 42px figure is named on its own,
 * because it was the loudest thing on the screen and the one most likely to be «brought back».
 * Tailwind's named steps (`text-sm`, `text-xl`) would slip past a pixel scan, so the files are
 * checked for those too: on this screen a size is always written in pixels, so the scale can be
 * read off the source.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const FILES = {
  CoursesHead: '../features/courses/CoursesHead.tsx',
  AssessmentBanner: '../features/assessment/AssessmentBanner.tsx',
  AssignedWorkoutsCard: '../features/customWorkout/AssignedWorkoutsCard.tsx',
  CourseCard: '../features/courses/CourseCard.tsx',
} as const;

const SCALE = new Set([13, 15, 22, 26]);

/** Tailwind's named text sizes, which would set a fifth step without a pixel value in the source. */
const NAMED_SIZE = /\btext-(?:xs|sm|base|lg|[2-9]?xl)\b/;

function source(name: keyof typeof FILES): string {
  return readFileSync(fileURLToPath(new URL(FILES[name], import.meta.url)), 'utf8');
}

function sizes(src: string): number[] {
  return [...src.matchAll(/text-\[(\d+)px\]/g)].map((m) => Number(m[1]));
}

describe('the type scale of «Курсы»', () => {
  for (const name of Object.keys(FILES) as (keyof typeof FILES)[]) {
    it(`${name} sets type only at 13 / 15 / 22 / 26px`, () => {
      const found = sizes(source(name));
      expect(found.length, 'the file sets at least one pixel size').toBeGreaterThan(0);
      const strays = found.filter((px) => !SCALE.has(px));
      expect(strays, `sizes outside the scale in ${name}`).toEqual([]);
    });

    it(`${name} never sets the 42px figure`, () => {
      expect(source(name)).not.toContain('text-[42px]');
    });

    it(`${name} sets no named Tailwind text size`, () => {
      expect(source(name)).not.toMatch(NAMED_SIZE);
    });
  }

  it('gives every card its title at 22px and the head its name at 26px', () => {
    expect(sizes(source('CourseCard'))).toContain(22);
    expect(sizes(source('AssignedWorkoutsCard'))).toContain(22);
    expect(sizes(source('CoursesHead'))).toContain(26);
    expect(sizes(source('AssessmentBanner'))).not.toContain(26);
    expect(sizes(source('AssessmentBanner'))).not.toContain(22);
  });
});
