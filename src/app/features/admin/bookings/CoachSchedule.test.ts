/**
 * «Расписание» when the week did not load (0059): the reason and «Повторить», and no editor — an
 * editor over the empty week it starts with was one tap from saving that over the coach's real
 * hours. And a week with no hours is recognised, so saving it asks first.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { t } from '@/i18n/index';
import { AppError } from '@/lib/api/errors';
import { rulesToWeek } from '@/lib/coach/slots';
import { CoachScheduleGate, weekIsEmpty, type ScheduleLoad } from './CoachSchedule';

const EDITOR = 'the-week-editor';

const render = (load: ScheduleLoad) =>
  renderToStaticMarkup(
    createElement(
      MemoryRouter,
      null,
      createElement(CoachScheduleGate, {
        load,
        onRetry: () => {},
        children: createElement('button', null, EDITOR),
      }),
    ),
  );

describe('CoachScheduleGate', () => {
  it('shows the failure and a retry, and no editor, when the week did not load', () => {
    const html = render({ status: 'error', error: new AppError('network', 'Failed to fetch') });
    expect(html).toContain('role="alert"');
    expect(html).toContain(t('ru', 'app.bookingsScheduleLoadError'));
    expect(html).toContain(t('ru', 'app.bookingsScheduleLoadErrorBody'));
    expect(html).toContain(t('ru', 'common.retry'));
    expect(html).not.toContain(EDITOR);
  });

  it('shows no editor while loading either', () => {
    const html = render({ status: 'loading' });
    expect(html).not.toContain(EDITOR);
    expect(html).not.toContain(t('ru', 'common.retry'));
  });

  it('shows the editor once the week is read', () => {
    expect(render({ status: 'ready' })).toContain(EDITOR);
  });
});

describe('weekIsEmpty', () => {
  it('is true only when no day has hours', () => {
    expect(weekIsEmpty(rulesToWeek([]))).toBe(true);
    expect(weekIsEmpty(rulesToWeek([{ weekday: 3, start: '10:00', end: '12:00' }]))).toBe(false);
  });
});
