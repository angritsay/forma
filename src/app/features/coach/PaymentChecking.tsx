/**
 * What stands in the picker's place when a hold ran out after the payment page was opened (0056).
 *
 * The person may have paid in the last minute, and the webhook still confirms a hold that simply
 * ran out while its slot is free (0055 §10). Telling them «the time ran out, pick again» — what
 * the screen used to say — asks for a second payment. So it says the payment is being checked,
 * keeps asking (`BookScreen` polls), and hides the picker; «I did not pay» brings it back. After
 * `PAYMENT_CHECK_MINUTES` it stops waiting and says what it sees — no payment yet — and what to do
 * about each reason (0058): paid from another address, then the order number from the receipt
 * (`ClaimSheet`, a `session` answer confirms the held slot and ends the wait); charged and still
 * nothing, then the coach.
 *
 * «Оплатил(а) с другой почты» is there from the start, not only once the wait is over: somebody
 * who typed their work address at the till knows it now, and the webhook will never match it.
 *
 * The sheet is mounted here and closed by default, so every state still renders on the server in
 * a test.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { ClaimResult } from '@/lib/api/claims';
import type { HoldLapse } from '@/lib/coach/slots';
import { ClaimSheet } from '@/app/features/payments/ClaimSheet';
import { useT } from '@/app/hooks/useT';

export interface PaymentCheckingProps {
  state: Exclude<HoldLapse, 'expired'>;
  onContact: () => void;
  onDismiss: () => void;
  /** A claim confirmed the session (`session`): stop waiting and read it. */
  onClaimed: () => void;
}

export function PaymentChecking({ state, onContact, onDismiss, onClaimed }: PaymentCheckingProps) {
  const { t } = useT();
  const [claiming, setClaiming] = useState(false);
  const waiting = state === 'checking';
  const answered = (result: ClaimResult) => {
    if (result !== 'session') return;
    setClaiming(false);
    onClaimed();
  };
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
      <Button variant="secondary" size="lg" fullWidth onClick={() => setClaiming(true)}>
        {t('app.bookPaymentOtherEmail')}
      </Button>
      {waiting ? null : (
        <Button variant="secondary" size="lg" fullWidth onClick={onContact}>
          {t('app.bookContact')}
        </Button>
      )}
      <Button variant="ghost" size="md" className="-ml-6.5 self-start" onClick={onDismiss}>
        {t('app.bookPaymentNotPaid')}
      </Button>
      <ClaimSheet open={claiming} onClose={() => setClaiming(false)} onResult={answered} />
    </section>
  );
}
