/**
 * Everything that has been sent in, newest first.
 *
 * This is the screen the trust-then-void decision rests on. Points count the moment proof arrives,
 * so the coach never has to clear a queue — but he does have to be able to glance down a stream and
 * strike out the one that is wrong, and give somebody five points for something no task asked for.
 * Both of those are one tap from a row here.
 *
 * A struck-out proof stays on the feed with its reason. The athlete can see the same line on their
 * own card, which is what keeps "it did not count" from being a mystery.
 */
import { clsx } from 'clsx';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Sheet } from '@/components/ui/Sheet';
import { formatNumber } from '@/i18n/index';
import type { MarathonMemberRow, MarathonProofRow } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';

export interface ProofsFeedProps {
  proofs: readonly MarathonProofRow[];
  members: readonly MarathonMemberRow[];
  days: number;
  today: number;
  dayFilter: number | null;
  onDayFilter: (day: number | null) => void;
  onVoid: (id: string, reason: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onBonus: (input: {
    memberId: string;
    dayIndex: number;
    points: number;
    reason: string;
  }) => Promise<void>;
}

export function ProofsFeed({
  proofs,
  members,
  days,
  today,
  dayFilter,
  onDayFilter,
  onVoid,
  onRestore,
  onBonus,
}: ProofsFeedProps) {
  const { t, locale } = useT();
  const [voidFor, setVoidFor] = useState<MarathonProofRow | null>(null);
  const [reason, setReason] = useState('');
  const [bonusOpen, setBonusOpen] = useState(false);
  const [bonusMember, setBonusMember] = useState('');
  const [bonusPoints, setBonusPoints] = useState('5');
  const [bonusReason, setBonusReason] = useState('');
  const [busy, setBusy] = useState(false);

  const dayOptions = [
    { value: '', label: t('app.mAdminProofsAll') },
    ...Array.from({ length: days }, (_, i) => ({
      value: String(i + 1),
      label: t('app.mAdminDay', { n: formatNumber(locale, i + 1) }),
    })),
  ];

  return (
    <div className="flex flex-col gap-5">
      <Select
        label={undefined}
        aria-label={t('app.mAdminProofsAll')}
        value={dayFilter === null ? '' : String(dayFilter)}
        onChange={(v) => onDayFilter(v === '' ? null : Number(v))}
        options={dayOptions}
      />

      {proofs.length === 0 ? (
        <p className="border-t border-border py-6 text-[15px] text-muted-2">
          {t('app.mAdminProofsEmpty')}
        </p>
      ) : (
        <ul className="flex flex-col">
          {proofs.map((proof) => (
            <li
              key={proof.id}
              className={clsx(
                'flex flex-wrap items-start gap-x-3 gap-y-2 border-t border-border py-3.5',
                proof.voidedAt && 'opacity-60',
              )}
            >
              <span className="numeral tabular w-8 shrink-0 pt-0.5 text-[13px] text-muted-2">
                {String(proof.dayIndex).padStart(2, '0')}
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
                {proof.valueNum !== null ? (
                  <span className="numeral block text-[13px] text-text">
                    {formatNumber(locale, proof.valueNum)} {proof.unit ?? ''}
                  </span>
                ) : null}
                {proof.valueText ? (
                  <span className="block text-[13px] text-text">{proof.valueText}</span>
                ) : null}
                {proof.mediaPath ? (
                  <span className="block text-[13px] text-muted-2">
                    {t('app.marathonProofPhotoSent')}
                  </span>
                ) : null}
                {proof.voidedAt && proof.voidReason ? (
                  <span className="block text-[13px] text-danger">
                    {t('app.marathonProofVoided', { reason: proof.voidReason })}
                  </span>
                ) : null}
              </span>
              {proof.voidedAt ? (
                <Button variant="ghost" size="sm" onClick={() => void onRestore(proof.id)}>
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
            </li>
          ))}
        </ul>
      )}

      <Button variant="secondary" size="md" onClick={() => setBonusOpen(true)}>
        {t('app.mAdminBonus')}
      </Button>

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
                .finally(() => setBusy(false));
            }}
          >
            {t('app.mAdminVoid')}
          </Button>
        }
      >
        {/* A reason is required: «не засчитано» with no explanation is the fastest way to lose someone. */}
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
            fullWidth
            loading={busy}
            disabled={!bonusMember || !bonusReason.trim() || Number(bonusPoints) === 0}
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
