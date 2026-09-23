/**
 * Who plays, and — in a round run in pairs — who they are paired with this week.
 *
 * The pair is shown, not edited. Pairs are made in two ways only: the Monday rematch pairs
 * everyone left without one, and an invite link (0034) pairs two friends until they split up.
 * The coach used to transcribe pairs by hand here — a select per row and «Добавить команду» — and
 * the owner took that out: a hand-made pair was the one pairing nobody had asked for, and the next
 * Monday's rematch undid it anyway.
 *
 * The one exception is the live duo club (0047): there the owner can run the draw now, split a
 * pair, and pair someone the draw left out — see `DuoPairs`. Those are not transcription; they are
 * the same draw and the same pairing the club already does, pressed by hand.
 *
 * People are added by email whether or not they have ever opened the app. That is the same rule as
 * purchases, and it is what lets a round be built on a Sunday from a Telegram thread.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Sheet } from '@/components/ui/Sheet';
import type { MarathonMemberRow, MarathonTeamRow } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';
import { personPath } from '@/app/features/admin/person/path';
import { DuoPairs, type DuoPairsProps } from './DuoPairs';

export interface PeopleProps {
  members: readonly MarathonMemberRow[];
  teams: readonly MarathonTeamRow[];
  /** Everyone for themselves: no pairs anywhere on this screen. */
  solo: boolean;
  onAddMember: (input: { email: string; displayName: string }) => Promise<void>;
  onSetStatus: (memberId: string, status: 'active' | 'removed') => Promise<void>;
  /** Only for the live duo club: the pair tools above the list. */
  pairs?: Omit<DuoPairsProps, 'members' | 'teams'>;
}

export function People({ members, teams, solo, onAddMember, onSetStatus, pairs }: PeopleProps) {
  const { t } = useT();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<MarathonMemberRow | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  const teamName = new Map(teams.map((team) => [team.id, team.name]));

  const add = async () => {
    setBusy(true);
    try {
      await onAddMember({ email, displayName: name });
      setEmail('');
      setName('');
      setAddOpen(false);
    } catch {
      /* Said by the screen; the sheet keeps what was typed. */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {pairs ? <DuoPairs members={members} teams={teams} {...pairs} /> : null}
      {members.length === 0 ? (
        <p className="border-t border-border py-6 text-[15px] text-muted-2">
          {t('app.mAdminPeopleEmptyBody')}
        </p>
      ) : (
        <ul className="flex flex-col">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border py-3.5"
            >
              {/* The whole person — purchases, proofs, payments — one tap away (0046). */}
              <button
                type="button"
                aria-label={t('app.personOpen', {
                  name: member.displayName?.trim() || member.email,
                })}
                onClick={() => void navigate(personPath(member.email))}
                className="min-w-0 flex-1 text-left transition-opacity duration-150 ease-(--ease-out) hover:opacity-80 active:opacity-60"
              >
                <span className="font-display block truncate text-[15px] leading-[1.24]">
                  {member.displayName?.trim() || member.email}
                </span>
                <span className="block truncate text-xs text-muted-2">{member.email}</span>
                {/* The pair on its own line under the address rather than a fixed 160px column
                    beside it, which squeezed the name to a few letters on a phone. */}
                {member.status !== 'removed' && !solo ? (
                  <span className="block truncate text-xs text-muted-2">
                    {(member.teamId && teamName.get(member.teamId)) || t('app.mAdminNoTeam')}
                  </span>
                ) : null}
              </button>
              {member.status === 'removed' ? (
                <Badge tone="warning">{t('app.mAdminRemoved')}</Badge>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  member.status === 'active'
                    ? setRemoving(member)
                    : void onSetStatus(member.id, 'active').catch(() => undefined)
                }
              >
                {member.status === 'active' ? t('app.mAdminRemove') : t('app.mAdminRestore')}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" size="md" onClick={() => setAddOpen(true)}>
          {t('app.mAdminAddPerson')}
        </Button>
      </div>

      <Modal
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={t('app.mAdminRemoveConfirmTitle', {
          name: removing ? removing.displayName?.trim() || removing.email : '',
        })}
        description={t('app.mAdminRemoveConfirmBody')}
        confirmLabel={t('app.mAdminRemove')}
        cancelLabel={t('common.cancel')}
        danger
        loading={removeBusy}
        onConfirm={() => {
          if (!removing) return;
          setRemoveBusy(true);
          void onSetStatus(removing.id, 'removed')
            .then(() => setRemoving(null))
            .catch(() => undefined)
            .finally(() => setRemoveBusy(false));
        }}
      />

      <Sheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t('app.mAdminAddPerson')}
        footer={
          <Button
            size="lg"
            variant="action"
            fullWidth
            loading={busy}
            disabled={!email.includes('@')}
            onClick={() => void add()}
          >
            {t('app.mAdminAddPerson')}
          </Button>
        }
      >
        <div className="flex flex-col gap-4 pb-2">
          <Input
            label={t('app.mAdminEmail')}
            type="email"
            inputMode="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label={t('app.mAdminPersonName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </Sheet>
    </div>
  );
}
