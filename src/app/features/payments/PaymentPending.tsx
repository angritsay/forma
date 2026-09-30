/**
 * What stands in the pay button's place after the till was opened for a course or the club.
 *
 * The same pattern as the booking's `PaymentChecking` (0056), for the two purchases that open
 * access rather than a slot: while checking, it says so and asks nothing of the person; once the
 * check ends without the money, it offers the two ways on — the claim by order number (the payment
 * came from another address) and a message to us — and «Я не платил(а)» brings the pay button
 * back at any point. The poll itself is `pending.ts`; `usePaymentPending` wires it to the session.
 *
 * `PaymentPendingView` is stateless, so every state renders on the server in a test.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useT } from '@/app/hooks/useT';
import { useSession, type SessionState } from '@/app/store/session';
import { SupportSheet } from '@/app/features/support/SupportSheet';
import { ClaimSheet } from './ClaimSheet';
import {
  clearPendingMarker,
  createPendingWatch,
  readPendingMarker,
  writePendingMarker,
  type PendingKey,
  type PendingPhase,
  type PendingWatch,
} from './pending';

export interface PaymentPendingViewProps {
  phase: Exclude<PendingPhase, 'idle'>;
  onNotPaid: () => void;
  onCheckAgain: () => void;
  onClaim: () => void;
  onContact: () => void;
}

export function PaymentPendingView({
  phase,
  onNotPaid,
  onCheckAgain,
  onClaim,
  onContact,
}: PaymentPendingViewProps) {
  const { t } = useT();
  const waiting = phase === 'checking';
  return (
    <section
      role="status"
      aria-busy={waiting ? 'true' : undefined}
      className="flex flex-col gap-4 border-t border-border pt-5"
    >
      <div className="flex flex-col gap-1.5">
        <span className="font-display text-[17px] leading-snug">
          {t(waiting ? 'app.payPendingTitle' : 'app.payPendingLongTitle')}
        </span>
        <p className="text-sm leading-snug text-muted">
          {t(waiting ? 'app.payPendingNote' : 'app.payPendingLong')}
        </p>
      </div>
      {waiting ? null : (
        <div className="flex flex-col gap-2.5">
          <Button variant="secondary" size="lg" fullWidth onClick={onCheckAgain}>
            {t('app.payPendingCheckAgain')}
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={onClaim}>
            {t('app.claimLink')}
          </Button>
          <Button variant="ghost" size="md" className="self-start" onClick={onContact}>
            {t('app.contactUs')}
          </Button>
        </div>
      )}
      <Button variant="ghost" size="md" className="-ml-6.5 self-start" onClick={onNotPaid}>
        {t('app.payPendingNotPaid')}
      </Button>
    </section>
  );
}

export interface PaymentPendingProps {
  phase: PendingPhase;
  onNotPaid: () => void;
  onCheckAgain: () => void;
  /** What the message to us is about — travels with it (`SupportSheet`). */
  context: string;
}

/** The view plus the two sheets it leads to. Renders nothing while idle. */
export function PaymentPending({ phase, onNotPaid, onCheckAgain, context }: PaymentPendingProps) {
  const [claiming, setClaiming] = useState(false);
  const [writing, setWriting] = useState(false);
  if (phase === 'idle') return null;
  return (
    <>
      <PaymentPendingView
        phase={phase}
        onNotPaid={onNotPaid}
        onCheckAgain={onCheckAgain}
        onClaim={() => setClaiming(true)}
        onContact={() => setWriting(true)}
      />
      <ClaimSheet open={claiming} onClose={() => setClaiming(false)} />
      <SupportSheet open={writing} onClose={() => setWriting(false)} context={context} />
    </>
  );
}

export interface PaymentPendingState {
  phase: PendingPhase;
  /** The till is being opened: remember it and start checking. */
  start: () => void;
  /** «Я не платил(а)»: forget it, and the pay button comes back. */
  dismiss: () => void;
  /** Another three minutes of asking, from the «не дошла» state. */
  checkAgain: () => void;
}

/**
 * The check for one product. `owns` says, from the session, whether it is owned now; `onOwned`
 * runs once when a check sees it appear (close the sheet, say so).
 *
 * A marker left by an earlier visit starts the check on mount, and coming back to the app (the
 * tab shown again, or restored from the back-forward cache) restarts its window: a payment page
 * takes as long as it takes.
 */
export function usePaymentPending(
  key: PendingKey | null,
  owns: (s: SessionState) => boolean,
  onOwned?: () => void,
): PaymentPendingState {
  const [phase, setPhase] = useState<PendingPhase>('idle');
  const watch = useRef<PendingWatch | null>(null);
  const ownsRef = useRef(owns);
  const onOwnedRef = useRef(onOwned);
  useEffect(() => {
    ownsRef.current = owns;
    onOwnedRef.current = onOwned;
  });
  const ownedNow = useSession((s) => owns(s));

  useEffect(() => {
    if (!key) return;
    const w = createPendingWatch({
      refresh: async () => {
        await useSession.getState().refreshEntitlements();
        return ownsRef.current(useSession.getState());
      },
      onPhase: setPhase,
      onOwned: () => {
        clearPendingMarker(key);
        onOwnedRef.current?.();
      },
    });
    watch.current = w;
    if (ownsRef.current(useSession.getState())) clearPendingMarker(key);
    else if (readPendingMarker(key) !== null) w.start();

    const onVisible = () => {
      if (document.visibilityState === 'visible') w.resume();
    };
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted && readPendingMarker(key) !== null) w.start();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onShow);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onShow);
      w.stop();
      watch.current = null;
    };
  }, [key]);

  // Owned by any other road (a claim, a refresh elsewhere): the check has nothing left to say.
  useEffect(() => {
    if (!key || !ownedNow) return;
    clearPendingMarker(key);
    watch.current?.stop();
  }, [key, ownedNow]);

  const start = useCallback(() => {
    if (!key) return;
    writePendingMarker(key);
    watch.current?.start();
  }, [key]);
  const dismiss = useCallback(() => {
    if (key) clearPendingMarker(key);
    watch.current?.stop();
  }, [key]);
  const checkAgain = useCallback(() => watch.current?.start(), []);

  return { phase, start, dismiss, checkAgain };
}

/** Whether the till was opened for this product recently — to reopen its sheet after a reload. */
export function hasPendingPayment(key: PendingKey): boolean {
  return readPendingMarker(key) !== null;
}
