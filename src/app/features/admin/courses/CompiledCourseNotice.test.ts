/**
 * The compiled-course notice renders for a course written in code and for nothing else.
 *
 * A render test rather than a screenshot: there is no browser in CI, and what matters is that the
 * sentence is on the page for «start» and absent for a course the admin built.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { t } from '@/i18n/index';
import { isCompiledCourse } from '@/content/catalogue';
import { CompiledCourseNotice } from './CompiledCourseNotice';

describe('CompiledCourseNotice', () => {
  it('says the course is in code for a compiled course', () => {
    expect(isCompiledCourse('start')).toBe(true);
    const html = renderToStaticMarkup(createElement(CompiledCourseNotice, { slugId: 'start' }));
    expect(html).toContain(t('ru', 'app.courseCompiledNotice'));
    expect(html).toContain('role="note"');
  });

  it('renders nothing for a course built in the admin', () => {
    expect(isCompiledCourse('my_own_course')).toBe(false);
    expect(
      renderToStaticMarkup(createElement(CompiledCourseNotice, { slugId: 'my_own_course' })),
    ).toBe('');
  });
});

/*
 * The screen around the notice is read-only for such a course: nothing typed there could reach
 * anyone, so nothing can be typed and nothing is autosaved. Read out of the source, like
 * `routes.test.ts` does, because the screen needs a router, a session and a backend to render.
 */
describe('AdminCourseScreen on a compiled course', () => {
  const src = readFileSync(
    join(process.cwd(), 'src', 'app', 'screens', 'AdminCourseScreen.tsx'),
    'utf8',
  );

  it('disables both editors', () => {
    expect(src.match(/<fieldset disabled=\{compiled\}/g)).toHaveLength(2);
  });

  it('refuses every write before it reaches the autosave', () => {
    for (const fn of ['patchCourse', 'patchDay']) {
      expect(src, fn).toMatch(
        new RegExp(`const ${fn} = \\([^)]*\\) => \\{\\s*if \\(compiled\\) return;`),
      );
    }
  });
});
