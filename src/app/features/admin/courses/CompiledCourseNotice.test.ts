/**
 * The compiled-course notice renders for a course written in code and for nothing else.
 *
 * A render test rather than a screenshot: there is no browser in CI, and what matters is that the
 * sentence is on the page for «start» and absent for a course the admin built.
 */
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
