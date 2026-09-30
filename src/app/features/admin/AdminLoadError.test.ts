/**
 * An admin list or screen that did not load (0059) says so and offers a retry — never «nothing
 * here», which is believed — and a row that does not exist goes back instead of retrying.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { t } from '@/i18n/index';
import { AppError } from '@/lib/api/errors';
import { AdminLoadError, type AdminLoadErrorProps } from './AdminLoadError';
import { AdminCheckFailed } from './AdminBoot';

const render = (props: Omit<AdminLoadErrorProps, 'onRetry'>) =>
  renderToStaticMarkup(
    createElement(
      MemoryRouter,
      null,
      createElement(AdminLoadError, { ...props, onRetry: () => {} }),
    ),
  );

const NOT_FOUND = {
  title: 'app.courseNotFoundTitle',
  body: 'app.courseNotFoundBody',
  back: '/admin/courses',
} as const;

describe('AdminLoadError', () => {
  it('names the failure and offers a retry', () => {
    const html = render({ error: new AppError('network', 'x'), title: 'app.inboxLoadError' });
    expect(html).toContain(t('ru', 'app.inboxLoadError'));
    expect(html).toContain(t('ru', 'app.adminLoadErrorBody'));
    expect(html).toContain(t('ru', 'common.retry'));
  });

  it('names the column when the database is behind the code', () => {
    const html = render({ error: new AppError('schema', 'column x does not exist') });
    expect(html).toContain('column x does not exist');
  });

  it('goes back instead of retrying what does not exist', () => {
    const html = render({ error: new AppError('not_found', 'x'), notFound: NOT_FOUND });
    expect(html).toContain(t('ru', 'app.courseNotFoundTitle'));
    expect(html).toContain(t('ru', 'app.adminNotFoundBack'));
    expect(html).not.toContain(t('ru', 'common.retry'));
  });

  it('retries any other failure even where «not found» is possible', () => {
    const html = render({ error: new AppError('network', 'x'), notFound: NOT_FOUND });
    expect(html).toContain(t('ru', 'common.retry'));
  });
});

describe('AdminCheckFailed', () => {
  it('says the check failed, not that access was refused, and offers a retry', () => {
    const html = renderToStaticMarkup(createElement(AdminCheckFailed, { onRetry: () => {} }));
    expect(html).toContain(t('ru', 'app.adminCheckFailedTitle'));
    expect(html).toContain(t('ru', 'common.retry'));
  });
});
