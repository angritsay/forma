/**
 * A proof that did not go through says why, and the club's board never spins forever: no clubs
 * loaded is a failure with a retry, no club at all is the way to the club tab.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { t } from '@/i18n/index';
import { AppError } from '@/lib/api/errors';
import { proofErrorKey, proofErrorKind, sameFile } from './proofError';
import { MarathonBoardEmpty } from '@/app/screens/MarathonBoardScreen';

describe('proofErrorKind', () => {
  it('names the connection, the closed round and the file too large', () => {
    expect(proofErrorKind(new AppError('network', 'Failed to fetch'))).toBe('offline');
    expect(proofErrorKind(new AppError('forbidden', 'new row violates row-level security'))).toBe(
      'closed',
    );
    expect(
      proofErrorKind(new AppError('unknown', 'The object exceeded the maximum allowed size')),
    ).toBe('too_large');
    expect(proofErrorKind(new AppError('unknown', 'Payload too large', { status: 413 }))).toBe(
      'too_large',
    );
    expect(proofErrorKind(new Error('boom'))).toBe('generic');
    expect(proofErrorKey('closed')).toBe('app.marathonProofClosed');
  });

  it('knows the same file picked again, so a landed upload is not repeated', () => {
    const f = { name: 'a.jpg', size: 10, lastModified: 1 } as File;
    expect(sameFile(f, { name: 'a.jpg', size: 10, lastModified: 1 })).toBe(true);
    expect(sameFile(f, { name: 'a.jpg', size: 11, lastModified: 1 })).toBe(false);
  });
});

describe('MarathonBoardEmpty', () => {
  const render = (failed: boolean) =>
    renderToStaticMarkup(
      createElement(MarathonBoardEmpty, {
        failed,
        offline: false,
        onRetry: () => {},
        onOpenClub: () => {},
      }),
    );

  it('a failed load says so with a retry', () => {
    const html = render(true);
    expect(html).toContain(t('ru', 'app.marathonErrorTitle'));
    expect(html).toContain(t('ru', 'common.retry'));
  });

  it('no club leads to the club tab', () => {
    const html = render(false);
    expect(html).toContain(t('ru', 'app.marathonBoardNoClubTitle'));
    expect(html).toContain(t('ru', 'app.marathonBoardNoClubCta'));
  });
});
