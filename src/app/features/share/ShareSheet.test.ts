/**
 * A story picture that failed to draw is a failed state with a retry — not a skeleton forever —
 * and the targets that need only the line and the link stay usable without it.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { t } from '@/i18n/index';
import { SharePreview } from './ShareSheet';
import { needsPicture } from './targets';

describe('share without a picture', () => {
  it('keeps the chat message and the system share, and holds the rest', () => {
    expect(needsPicture('telegramChat')).toBe(false);
    expect(needsPicture('more')).toBe(false);
    expect(needsPicture('instagram')).toBe(true);
    expect(needsPicture('telegramStory')).toBe(true);
    expect(needsPicture('save')).toBe(true);
  });

  it('says the picture failed and offers to draw it again', () => {
    const html = renderToStaticMarkup(
      createElement(SharePreview, { url: null, failed: true, onRetry: () => {} }),
    );
    expect(html).toContain(t('ru', 'app.shareRenderFailedBody'));
    expect(html).toContain(t('ru', 'common.retry'));
    expect(html).not.toContain('role="status"');
  });

  it('is a skeleton only while the picture is being drawn', () => {
    const html = renderToStaticMarkup(
      createElement(SharePreview, { url: null, failed: false, onRetry: () => {} }),
    );
    expect(html).toContain('role="status"');
  });
});
