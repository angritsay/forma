/**
 * «Не удалось проверить покупки» — what stands where a paywall would, while the app does not know
 * what the account owns (`purchasesUnknown`, store/session.ts).
 *
 * An empty list of entitlements used to mean both «owns nothing» and «the request failed», so a
 * flaky network showed the price of a course to the person who had bought it. This says what
 * failed and retries the one request that answers it.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ButtonVariant } from '@/components/ui/Button';
import { useT } from '@/app/hooks/useT';
import { useSession } from '@/app/store/session';

export function PurchasesUnknownView({
  offline,
  busy,
  onRetry,
  variant = 'action',
}: {
  offline: boolean;
  busy: boolean;
  onRetry: () => void;
  /** The club's screens take the warm gradient instead of the neon (club-no-neon.test.ts). */
  variant?: ButtonVariant;
}) {
  const { t } = useT();
  return (
    <EmptyState
      title={t('app.purchasesUnknownTitle')}
      description={offline ? t('common.errorOffline') : t('app.purchasesUnknownBody')}
      action={
        <Button variant={variant} size="lg" loading={busy} onClick={onRetry}>
          {t('common.retry')}
        </Button>
      }
    />
  );
}

export function PurchasesUnknown({ variant }: { variant?: ButtonVariant }) {
  const offline = useSession((s) => s.entitlementsError?.code === 'network');
  const [busy, setBusy] = useState(false);
  const retry = () => {
    setBusy(true);
    useSession
      .getState()
      .refreshEntitlements()
      .catch(() => undefined)
      .finally(() => setBusy(false));
  };
  return (
    <PurchasesUnknownView
      offline={offline}
      busy={busy}
      onRetry={retry}
      {...(variant ? { variant } : {})}
    />
  );
}
