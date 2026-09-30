/**
 * What an admin screen shows while `is_admin()` has not answered (0059).
 *
 * The loader while it is being asked; when the ask failed, the reason and «Повторить» — never the
 * redirect a `false` would cause, because a failed request is not a «no». `inline` is for screens
 * that keep their own header while they wait (the person page).
 */
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { BootScreen } from '@/app/components/BootScreen';
import { LoadingBlock } from '@/app/components/LoadingBlock';
import { useT } from '@/app/hooks/useT';
import { useAdminCheck } from '@/app/features/admin/useIsAdmin';

export function AdminCheckFailed({ onRetry }: { onRetry: () => void }) {
  const { t } = useT();
  return (
    <div role="alert">
      <EmptyState
        title={t('app.adminCheckFailedTitle')}
        description={t('app.adminCheckFailedBody')}
        action={
          <Button size="lg" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        }
      />
    </div>
  );
}

export function AdminBoot({
  inline = false,
  waiting,
}: {
  inline?: boolean;
  /** What to show while asking, in place of the loader (the admin home keeps its skeleton). */
  waiting?: ReactNode;
}) {
  const { failed, retry } = useAdminCheck();
  if (failed) {
    return inline ? (
      <AdminCheckFailed onRetry={retry} />
    ) : (
      <div className="flex min-h-dvh items-center px-5">
        <AdminCheckFailed onRetry={retry} />
      </div>
    );
  }
  if (waiting) return <>{waiting}</>;
  return inline ? <LoadingBlock /> : <BootScreen />;
}
