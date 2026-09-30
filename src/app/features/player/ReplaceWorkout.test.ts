/**
 * Starting a coach's workout over an unsaved one asks first, and the question offers the way back
 * to the other workout: save it when it is finished, resume it when it is not.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { t } from '@/i18n/index';
import { ReplaceWorkoutBack, startNeedsConfirm } from './ReplaceWorkout';

describe('custom workout start over an open session', () => {
  it('starts straight away when nothing is open', () => {
    expect(startNeedsConfirm({ session: null })).toBe(false);
  });

  it('asks when a session is on the device, finished or not', () => {
    expect(startNeedsConfirm({ session: { sessionId: 's1' } })).toBe(true);
  });

  it('offers «Сохранить ту» for a finished workout and «Продолжить ту» for one under way', () => {
    const finished = renderToStaticMarkup(
      createElement(ReplaceWorkoutBack, { finishedAt: '2026-09-30T10:00:00Z', onBack: () => {} }),
    );
    expect(finished).toContain(t('ru', 'app.nodeReplaceSaveThat'));
    const running = renderToStaticMarkup(
      createElement(ReplaceWorkoutBack, { finishedAt: null, onBack: () => {} }),
    );
    expect(running).toContain(t('ru', 'app.nodeReplaceResumeThat'));
  });
});
