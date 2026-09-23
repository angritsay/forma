/**
 * «Не просмотрено» — proof from both live clubs that the coach has not looked at yet (0047).
 *
 * Points still count the moment proof arrives; this is not an approval queue. It is the answer to
 * «what have people sent since I last looked», across solo and duo at once, newest first, with the
 * photo or clip right on the row and two buttons: «Засчитать» (looked, it stands) and «Не
 * засчитать» (with a reason the athlete reads, as in the round's own feed).
 *
 * `?proof=<id>` opens one proof in a sheet whatever its state — the link in the Telegram message
 * «Пруф прислали заново» lands here.
 */
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatNumber } from '@/i18n/index';
import {
  acceptProof,
  listProofQueue,
  markProofsReviewed,
  voidProof,
} from '@/lib/api/marathonAdmin';
import type { QueuedProofRow } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';
import { ProofMedia } from './ProofMedia';

const PAGE = 30;

export interface ProofQueueProps {
  /** A proof to open on arrival, from `?proof=`. */
  openProofId: string | null;
  /** Called when that sheet closes, so the screen can drop the parameter. */
  onCloseProof: () => void;
}

export function ProofQueue({ openProofId, onCloseProof }: ProofQueueProps) {
  const { t, locale } = useT();
  const toast = useToast();
  const [items, setItems] = useState<QueuedProofRow[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(PAGE);
  const [loading, setLoading] = useState(true);
  const [single, setSingle] = useState<QueuedProofRow | null>(null);
  const [voidFor, setVoidFor] = useState<QueuedProofRow | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [allOpen, setAllOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    listProofQueue({ limit })
      .then((q) => {
        setItems(q.items);
        setTotal(q.total);
      })
      .catch(() => toast.show({ kind: 'error', title: t('app.mAdminLoadError') }))
      .finally(() => setLoading(false));
  }, [limit, toast, t]);

  useEffect(load, [load]);

  useEffect(() => {
    if (!openProofId) {
      setSingle(null);
      return;
    }
    let alive = true;
    listProofQueue({ proofId: openProofId })
      .then((q) => {
        if (!alive) return;
        const row = q.items[0];
        if (row) setSingle(row);
        else {
          toast.show({ kind: 'error', title: t('app.clubQueueNotFound') });
          onCloseProof();
        }
      })
      .catch(() => alive && toast.show({ kind: 'error', title: t('app.mAdminLoadError') }));
    return () => {
      alive = false;
    };
  }, [openProofId, onCloseProof, toast, t]);

  /** The row is decided: off the list, and off the open sheet with the new state. */
  const settle = (id: string, patch: Partial<QueuedProofRow>) => {
    setItems((list) => list.filter((p) => p.id !== id));
    setTotal((n) => Math.max(n - 1, 0));
    setSingle((s) => (s && s.id === id ? { ...s, ...patch } : s));
  };

  const accept = async (proof: QueuedProofRow) => {
    setBusy(proof.id);
    try {
      await acceptProof(proof.id);
      settle(proof.id, { reviewedAt: new Date().toISOString() });
      toast.show({ kind: 'success', title: t('app.clubQueueAccepted') });
    } catch {
      toast.show({ kind: 'error', title: t('app.mAdminSaveError') });
    } finally {
      setBusy(null);
    }
  };

  const reject = async () => {
    if (!voidFor || !reason.trim()) return;
    const proof = voidFor;
    setBusy(proof.id);
    try {
      await voidProof(proof.id, reason);
      const at = new Date().toISOString();
      settle(proof.id, { voidedAt: at, voidReason: reason.trim(), reviewedAt: at });
      setVoidFor(null);
      toast.show({ kind: 'success', title: t('app.mAdminProofVoidedToast') });
    } catch {
      toast.show({ kind: 'error', title: t('app.mAdminSaveError') });
    } finally {
      setBusy(null);
    }
  };

  const markAll = async () => {
    setBusy('all');
    try {
      const n = await markProofsReviewed(items.map((p) => p.id));
      setAllOpen(false);
      toast.show({
        kind: 'success',
        title: t('app.clubQueueAllDone', { n: formatNumber(locale, n) }),
      });
      load();
    } catch {
      toast.show({ kind: 'error', title: t('app.mAdminSaveError') });
    } finally {
      setBusy(null);
    }
  };

  const card = (proof: QueuedProofRow, inSheet: boolean) => {
    const decided = proof.voidedAt !== null || proof.reviewedAt !== null;
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={proof.duo ? 'inverse' : 'neutral'}>
            {t(proof.duo ? 'app.clubQueueDuo' : 'app.clubQueueSolo')}
          </Badge>
          {proof.attempt > 1 ? (
            <Badge tone="warning">
              {t('app.mAdminProofRedone', { n: formatNumber(locale, proof.attempt) })}
            </Badge>
          ) : null}
          <span className="tabular text-[13px] text-muted-2">
            {formatDate(locale, proof.resubmittedAt ?? proof.submittedAt)}
          </span>
        </div>
        <span className="font-display block text-[15px] leading-[1.24]">
          {proof.memberName}
          {proof.teamName ? (
            <span className="font-sans text-[13px] font-normal text-muted-2">
              {' · '}
              {proof.teamName}
            </span>
          ) : null}
        </span>
        <span className="block text-[13px] text-muted">{proof.taskTitle}</span>
        {proof.valueNum !== null ? (
          <span className="numeral block text-[13px] text-text">
            {formatNumber(locale, proof.valueNum)} {proof.unit ?? ''}
          </span>
        ) : null}
        {proof.valueText ? <span className="block text-[13px]">{proof.valueText}</span> : null}
        {proof.mediaPath ? <ProofMedia mediaPath={proof.mediaPath} /> : null}
        {proof.voidedAt && proof.voidReason ? (
          <span className="block text-[13px] text-danger">
            {t('app.marathonProofVoided', { reason: proof.voidReason })}
          </span>
        ) : proof.voidReason ? (
          <span className="block text-[13px] text-muted-2">
            {t('app.mAdminProofPastNote', { reason: proof.voidReason })}
          </span>
        ) : null}
        {inSheet && decided ? (
          <p className="text-[13px] text-muted-2">
            {t(proof.voidedAt ? 'app.clubQueueStateVoided' : 'app.clubQueueStateSeen')}
          </p>
        ) : null}
        {decided ? null : (
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant="secondary"
              size="md"
              loading={busy === proof.id}
              onClick={() => void accept(proof)}
            >
              {t('app.clubQueueAccept')}
            </Button>
            <Button
              variant="ghost"
              size="md"
              disabled={busy === proof.id}
              onClick={() => {
                setReason('');
                setVoidFor(proof);
              }}
            >
              {t('app.clubQueueReject')}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="flex flex-col gap-3" aria-labelledby="proof-queue-title">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="proof-queue-title" className="font-display text-xl">
          {t('app.clubQueueTitle')}
          {total > 0 ? (
            <span className="numeral ml-2 text-base text-muted">{formatNumber(locale, total)}</span>
          ) : null}
        </h2>
        {items.length > 1 ? (
          <Button variant="ghost" size="sm" onClick={() => setAllOpen(true)}>
            {t('app.clubQueueAll')}
          </Button>
        ) : null}
      </div>

      {loading && items.length === 0 ? (
        <p className="py-2 text-[15px] text-muted-2">{t('app.clubQueueLoading')}</p>
      ) : items.length === 0 ? (
        <p className="border-t border-border py-4 text-[15px] text-muted-2">
          {t('app.clubQueueEmpty')}
        </p>
      ) : (
        <ul className="flex flex-col">
          {items.map((proof) => (
            <li key={proof.id} className="border-t border-border py-3.5">
              {card(proof, false)}
            </li>
          ))}
        </ul>
      )}

      {total > items.length ? (
        <Button variant="ghost" size="md" onClick={() => setLimit((n) => n + PAGE)}>
          {t('app.clubQueueMore', { n: formatNumber(locale, total - items.length) })}
        </Button>
      ) : null}

      <Sheet open={single !== null} onClose={onCloseProof} title={t('app.clubQueueOne')}>
        <div className="pb-2">{single ? card(single, true) : null}</div>
      </Sheet>

      <Sheet
        open={voidFor !== null}
        onClose={() => setVoidFor(null)}
        title={t('app.clubQueueReject')}
        footer={
          <Button
            size="lg"
            fullWidth
            loading={voidFor !== null && busy === voidFor.id}
            disabled={!reason.trim()}
            onClick={() => void reject()}
          >
            {t('app.clubQueueReject')}
          </Button>
        }
      >
        {/* The athlete reads these words on their own card, beside the button to send it again. */}
        <Input
          label={t('app.mAdminVoidReason')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          wrapperClassName="pb-2"
        />
      </Sheet>

      <Modal
        open={allOpen}
        onClose={() => setAllOpen(false)}
        title={t('app.clubQueueAllTitle', { n: formatNumber(locale, items.length) })}
        description={t('app.clubQueueAllBody')}
        confirmLabel={t('app.clubQueueAllConfirm')}
        cancelLabel={t('common.cancel')}
        loading={busy === 'all'}
        onConfirm={() => void markAll()}
      />
    </section>
  );
}
