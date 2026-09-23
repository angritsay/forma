/**
 * Everything that has been sent in, newest first.
 *
 * This is the screen the trust-then-reject decision rests on. Points count the moment proof arrives,
 * so the coach never has to clear a queue — but he does have to be able to glance down a stream and
 * strike out the one that is wrong, and give somebody five points for something no task asked for.
 * Both of those are one tap from a row here.
 *
 * A rejected proof stays on the feed with its reason. The athlete reads the same words on their own
 * card, which is what keeps «не засчитано» from being a mystery — and they can then do the task
 * again, which is the one queue this screen does have. «Ждут проверки» is that queue and nothing
 * else: proof nobody has rejected never appears in it, because a club where the coach has to
 * approve things is a club that stops the day he is busy.
 */
import { clsx } from 'clsx';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Sheet } from '@/components/ui/Sheet';
import { formatDate, formatNumber } from '@/i18n/index';
import { needsCoachLook } from '@/lib/marathon/review';
import type { MarathonAdjustmentRow, MarathonMemberRow, MarathonProofRow } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';
import { dateOfDay, dayOfDate, recentDays } from './dates';
import { ProofMedia } from './ProofMedia';

export interface ProofsFeedProps {
  proofs: readonly MarathonProofRow[];
  members: readonly MarathonMemberRow[];
  /** Day 1 of the round, so the filter can speak in dates. */
  startsOn: string;
  days: number;
  today: number;
  dayFilter: number | null;
  onDayFilter: (day: number | null) => void;
  /** Show only what has been redone since a rejection and not looked at since. */
  needsReviewOnly: boolean;
  onNeedsReviewOnly: (only: boolean) => void;
  /** Each action rejects when it failed (the caller has already said so), so a sheet stays open. */
  onVoid: (id: string, reason: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onAccept: (id: string) => Promise<void>;
  onBonus: (input: {
    memberId: string;
    dayIndex: number;
    points: number;
    reason: string;
  }) => Promise<void>;
  /** Points given by hand, newest first — the list under «Начислить вручную». */
  adjustments: readonly MarathonAdjustmentRow[];
  onUndoBonus: (id: string) => Promise<void>;
}

export function ProofsFeed({
  proofs,
  members,
  startsOn,
  days,
  today,
  dayFilter,
  onDayFilter,
  needsReviewOnly,
  onNeedsReviewOnly,
  onVoid,
  onRestore,
  onAccept,
  onBonus,
  adjustments,
  onUndoBonus,
}: ProofsFeedProps) {
  const { t, locale } = useT();
  const [voidFor, setVoidFor] = useState<MarathonProofRow | null>(null);
  const [reason, setReason] = useState('');
  const [bonusOpen, setBonusOpen] = useState(false);
  const [bonusMember, setBonusMember] = useState('');
  const [bonusPoints, setBonusPoints] = useState('5');
  const [bonusReason, setBonusReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [undoFor, setUndoFor] = useState<MarathonAdjustmentRow | null>(null);

  /*
   * The filter speaks in dates. It was a select of every day of the run — 3650 options on a club
   * that runs for ten years — and «День 214» is not a day anyone remembers. The last two weeks are
   * chips, which is where every question about a proof actually lands; anything older is a date.
   */
  const chips = recentDays(today, days);
  const chipLabel = (d: number) =>
    d === today
      ? t('app.mAdminToday')
      : d === today - 1
        ? t('app.mAdminYesterday')
        : formatDate(locale, dateOfDay(startsOn, d));
  const lastDate = dateOfDay(startsOn, Math.max(Math.min(today || 1, days), 1));
  const pickedOlder = dayFilter !== null && !chips.includes(dayFilter);
  const memberName = (id: string) => {
    const m = members.find((x) => x.id === id);
    return m ? m.displayName?.trim() || m.email : '—';
  };
  const signed = (n: number) => (n > 0 ? `+${formatNumber(locale, n)}` : formatNumber(locale, n));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('app.mAdminTabProofs')}>
        <Chip
          className="tap-target-y"
          selected={dayFilter === null}
          onClick={() => onDayFilter(null)}
        >
          {t('app.mAdminProofsAll')}
        </Chip>
        {chips.map((d) => (
          <Chip
            key={d}
            className="tap-target-y"
            selected={dayFilter === d}
            onClick={() => onDayFilter(d)}
          >
            {chipLabel(d)}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <Input
          label={t('app.mAdminProofsPickDate')}
          type="date"
          min={startsOn}
          max={lastDate}
          value={pickedOlder && dayFilter !== null ? dateOfDay(startsOn, dayFilter) : ''}
          onChange={(e) => {
            const d = dayOfDate(startsOn, days, e.target.value);
            onDayFilter(d > 0 ? d : null);
          }}
          wrapperClassName="min-w-0 flex-1"
        />
        {/* A filter rather than a tab: the queue is a view of the same feed, and everything the
            coach does to a row he does in the same place whichever way he found it. */}
        <Button
          variant={needsReviewOnly ? 'primary' : 'secondary'}
          size="md"
          aria-pressed={needsReviewOnly}
          onClick={() => onNeedsReviewOnly(!needsReviewOnly)}
        >
          {t('app.mAdminProofsNeedReview')}
        </Button>
      </div>

      {proofs.length === 0 ? (
        <p className="border-t border-border py-6 text-[15px] text-muted-2">
          {t(needsReviewOnly ? 'app.mAdminProofsNeedReviewEmpty' : 'app.mAdminProofsEmpty')}
        </p>
      ) : (
        <ul className="flex flex-col">
          {proofs.map((proof) => {
            const redone = needsCoachLook(proof);
            return (
              <li
                key={proof.id}
                className={clsx(
                  'flex flex-wrap items-start gap-x-3 gap-y-2 border-t border-border py-3.5',
                  proof.voidedAt && 'opacity-60',
                )}
              >
                <span className="tabular w-14 shrink-0 pt-0.5 text-[13px] text-muted-2">
                  {formatDate(locale, dateOfDay(startsOn, proof.dayIndex))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-display block truncate text-[15px] leading-[1.24]">
                    {proof.memberName}
                    {proof.teamName ? (
                      <span className="font-sans text-[13px] font-normal text-muted-2">
                        {' · '}
                        {proof.teamName}
                      </span>
                    ) : null}
                  </span>
                  <span className="block truncate text-[13px] text-muted">{proof.taskTitle}</span>
                  {/*
                    The one thing on this row that is a request rather than a record — the white
                    stamp the design system keeps for «this one», on its own line rather than
                    inside the truncating name, where a long name would have eaten it.
                  */}
                  {redone ? (
                    <Badge tone="inverse" className="mt-1">
                      {t('app.mAdminProofRedone', { n: formatNumber(locale, proof.attempt) })}
                    </Badge>
                  ) : null}
                  {proof.valueNum !== null ? (
                    <span className="numeral block text-[13px] text-text">
                      {formatNumber(locale, proof.valueNum)} {proof.unit ?? ''}
                    </span>
                  ) : null}
                  {proof.valueText ? (
                    <span className="block text-[13px] text-text">{proof.valueText}</span>
                  ) : null}
                  {/*
                  The proof, not a sentence about it. This printed «Фото отправлено» and nothing
                  else, which made the void decision this feed exists for impossible: you cannot
                  strike out evidence you have never looked at.
                */}
                  {proof.mediaPath ? <ProofMedia mediaPath={proof.mediaPath} /> : null}
                  {proof.voidedAt && proof.voidReason ? (
                    <span className="block text-[13px] text-danger">
                      {t('app.marathonProofVoided', { reason: proof.voidReason })}
                    </span>
                  ) : proof.voidReason ? (
                    /* Not rejected any more, so not red — his own last words, kept because they are
                     the only thing that says why this was sent twice. */
                    <span className="block text-[13px] text-muted-2">
                      {t('app.mAdminProofPastNote', { reason: proof.voidReason })}
                    </span>
                  ) : null}
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  {/* «Оставить как есть» is only ever offered on the rows that ask a question. */}
                  {redone ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void onAccept(proof.id).catch(() => undefined)}
                    >
                      {t('app.mAdminAcceptProof')}
                    </Button>
                  ) : null}
                  {proof.voidedAt ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void onRestore(proof.id).catch(() => undefined)}
                    >
                      {t('app.mAdminRestoreProof')}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setReason('');
                        setVoidFor(proof);
                      }}
                    >
                      {t('app.mAdminVoid')}
                    </Button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <Button variant="secondary" size="md" onClick={() => setBonusOpen(true)}>
        {t('app.mAdminBonus')}
      </Button>

      {/*
        What has been given by hand, with a way to take it back. Points by hand used to be
        write-only: a +50 typed as +5 stayed on the board for the week.
      */}
      <section className="flex flex-col gap-2">
        <h3 className="eyebrow">{t('app.mAdminBonusList')}</h3>
        {adjustments.length === 0 ? (
          <p className="border-t border-border py-4 text-[15px] text-muted-2">
            {t('app.mAdminBonusListEmpty')}
          </p>
        ) : (
          <ul className="flex flex-col">
            {adjustments.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 border-t border-border py-3 text-[15px]"
              >
                <span className="numeral tabular w-12 shrink-0 text-right">{signed(a.points)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{memberName(a.memberId)}</span>
                  <span className="block truncate text-[13px] text-muted-2">
                    {formatDate(locale, dateOfDay(startsOn, a.dayIndex))} · {a.reason}
                  </span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => setUndoFor(a)}>
                  {t('app.mAdminBonusUndo')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        open={undoFor !== null}
        onClose={() => setUndoFor(null)}
        title={t('app.mAdminBonusUndoTitle')}
        description={
          undoFor
            ? t('app.mAdminBonusUndoBody', {
                points: signed(undoFor.points),
                name: memberName(undoFor.memberId),
              })
            : undefined
        }
        confirmLabel={t('app.mAdminBonusUndo')}
        cancelLabel={t('common.cancel')}
        danger
        loading={busy}
        onConfirm={() => {
          if (!undoFor) return;
          setBusy(true);
          void onUndoBonus(undoFor.id)
            .then(() => setUndoFor(null))
            .catch(() => undefined)
            .finally(() => setBusy(false));
        }}
      />

      <Sheet
        open={voidFor !== null}
        onClose={() => setVoidFor(null)}
        title={t('app.mAdminVoid')}
        footer={
          <Button
            size="lg"
            fullWidth
            loading={busy}
            disabled={!reason.trim()}
            onClick={() => {
              if (!voidFor) return;
              setBusy(true);
              void onVoid(voidFor.id, reason.trim())
                .then(() => setVoidFor(null))
                .catch(() => undefined)
                .finally(() => setBusy(false));
            }}
          >
            {t('app.mAdminVoid')}
          </Button>
        }
      >
        {/*
          A reason is required, and it is not a note to himself: these words are what the athlete
          reads on their own card, over his name, beside the button that sends the task again.
          «Не засчитано» with no explanation is the fastest way to lose someone.
        */}
        <Input
          label={t('app.mAdminVoidReason')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          wrapperClassName="pb-2"
        />
      </Sheet>

      <Sheet
        open={bonusOpen}
        onClose={() => setBonusOpen(false)}
        title={t('app.mAdminBonus')}
        footer={
          <Button
            size="lg"
            variant="action"
            fullWidth
            loading={busy}
            disabled={!bonusMember || !bonusReason.trim() || !Number(bonusPoints)}
            onClick={() => {
              setBusy(true);
              void onBonus({
                memberId: bonusMember,
                dayIndex: Math.max(Math.min(today, days), 1),
                points: Number(bonusPoints),
                reason: bonusReason.trim(),
              })
                .then(() => {
                  setBonusOpen(false);
                  setBonusReason('');
                })
                .catch(() => undefined)
                .finally(() => setBusy(false));
            }}
          >
            {t('app.mAdminBonusAdd')}
          </Button>
        }
      >
        <div className="flex flex-col gap-4 pb-2">
          <Select
            label={t('app.mAdminPeople')}
            value={bonusMember}
            onChange={setBonusMember}
            options={[
              { value: '', label: '—' },
              ...members
                .filter((m) => m.status === 'active')
                .map((m) => ({ value: m.id, label: m.displayName?.trim() || m.email })),
            ]}
          />
          <Input
            label={t('app.mAdminBonusPoints')}
            inputMode="numeric"
            value={bonusPoints}
            onChange={(e) => setBonusPoints(e.target.value)}
          />
          <Input
            label={t('app.mAdminBonusReason')}
            value={bonusReason}
            onChange={(e) => setBonusReason(e.target.value)}
          />
        </div>
      </Sheet>
    </div>
  );
}
