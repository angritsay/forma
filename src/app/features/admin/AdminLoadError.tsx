/**
 * A screen, list or panel of the admin that did not load (0059): what failed, why if it is known,
 * and the one thing to do — try again, or go back when there is nothing there to load.
 *
 * It replaces two answers that were each wrong in their own way. An endless spinner said «still
 * coming» about a request that had already failed; an empty state said «nothing here» about a list
 * that was never read — «Записей нет» for a coach with a full week, which is the worse of the two
 * because it is believed.
 *
 * The reason line is `adminErrorTitle`: a database behind the code gets its own sentence with the
 * column, anything else the screen's own fallback. A missing row (`not_found`) is not retried —
 * the same request would find the same nothing — and goes back instead.
 */
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { isAppError } from '@/lib/api/errors';
import type { TKey } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import { adminErrorTitle } from '@/app/features/admin/adminError';

export interface AdminLoadErrorProps {
  error: unknown;
  onRetry: () => void;
  /** Heading; «Не удалось загрузить» by default. */
  title?: TKey;
  /** The screen's own sentence for the failure; «данные на месте» by default. */
  fallback?: TKey;
  /** Where «К списку» goes when the thing asked for does not exist. Without it, a retry. */
  notFound?: { title: TKey; body: TKey; back: string };
}

export function AdminLoadError({
  error,
  onRetry,
  title = 'app.adminLoadErrorTitle',
  fallback = 'app.adminLoadErrorBody',
  notFound,
}: AdminLoadErrorProps) {
  const tr = useT();
  const { t } = tr;
  const navigate = useNavigate();

  if (notFound && isAppError(error) && error.code === 'not_found') {
    return (
      <EmptyState
        title={t(notFound.title)}
        description={t(notFound.body)}
        action={
          <Button size="lg" onClick={() => void navigate(notFound.back, { replace: true })}>
            {t('app.adminNotFoundBack')}
          </Button>
        }
      />
    );
  }

  return (
    <div role="alert">
      <EmptyState
        title={t(title)}
        description={adminErrorTitle(tr, error, fallback)}
        action={
          <Button size="lg" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        }
      />
    </div>
  );
}
