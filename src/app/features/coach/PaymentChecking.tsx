/**
 * What stands in the picker's place when a hold ran out after the payment page was opened (0056).
 *
 * The person may have paid in the last minute, and the webhook still confirms a hold that simply
 * ran out while its slot is free (0055 §10). Telling them «the time ran out, pick again» — what
 * the screen used to say — asks for a second payment. So it says the payment is being checked,
 * keeps asking (`BookScreen` polls), and hides the picker; «I did not pay» brings it back. After
 * `PAYMENT_CHECK_MINUTES` it stops waiting and says to write to the coach if the money was taken.
 *
 * Stateless, so every state renders on the server in a test.
 */
import { Button } from '@/components/ui/Button';
import type { HoldLapse } from '@/lib/coach/slots';
import { useT } from '@/app/hooks/useT';

export interface PaymentCheckingProps {
  state: Exclude<HoldLapse, 'expired'>;
  onContact: () => void;
  onDismiss: () => void;
}

export function PaymentChecking({ state, onContact, onDismiss }: PaymentCheckingProps) {
  const { t } = useT();
  const waiting = state === 'checking';
  return (
    <section
      role="status"
      aria-busy={waiting ? 'true' : undefined}
      className="flex flex-col gap-4 border-t border-border pt-5"
    >
      <div className="flex flex-col gap-1.5">
        <span className="font-display text-[17px] leading-snug">
          {t('app.bookPaymentChecking')}
        </span>
        <p className="text-sm leading-snug text-muted">
          {t(waiting ? 'app.bookPaymentCheckingNote' : 'app.bookPaymentCheckingLong')}
        </p>
      </div>
      {waiting ? null : (
        <Button variant="secondary" size="lg" fullWidth onClick={onContact}>
          {t('app.bookContact')}
        </Button>
      )}
      <Button variant="ghost" size="md" className="-ml-6.5 self-start" onClick={onDismiss}>
        {t('app.bookPaymentNotPaid')}
      </Button>
    </section>
  );
}
