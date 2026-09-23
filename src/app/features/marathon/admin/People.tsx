/**
 * Who plays, and — in a round run in pairs — who they are paired with this week.
 *
 * The pair is shown, not edited. Pairs are made in two ways only: the Monday rematch pairs
 * everyone left without one, and an invite link (0034) pairs two friends until they split up.
 * The coach used to transcribe pairs by hand here — a select per row and «Добавить команду» — and
 * the owner took that out: a hand-made pair was the one pairing nobody had asked for, and the next
 * Monday's rematch undid it anyway.
 *
 * People are added by email whether or not they have ever opened the app. That is the same rule as
 * purchases, and it is what lets a round be built on a Sunday from a Telegram thread.
 */
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import type { MarathonMemberRow, MarathonTeamRow } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';

export interface PeopleProps {
  members: readonly MarathonMemberRow[];
  teams: readonly MarathonTeamRow[];
  /** Everyone for themselves: no pairs anywhere on this screen. */
  solo: boolean;
  onAddMember: (input: { email: string; displayName: string }) => Promise<void>;
  onSetStatus: (memberId: string, status: 'active' | 'removed') => Promise<void>;
}

export function People({ members, teams, solo, onAddMember, onSetStatus }: PeopleProps) {
  const { t } = useT();
  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const teamName = new Map(teams.map((team) => [team.id, team.name]));

  const add = async () => {
    setBusy(true);
    try {
      await onAddMember({ email, displayName: name });
      setEmail('');
      setName('');
      setAddOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
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
              <span className="min-w-0 flex-1">
                <span className="font-display block truncate text-[15px] leading-[1.24]">
                  {member.displayName?.trim() || member.email}
                </span>
                <span className="block truncate text-xs text-muted-2">{member.email}</span>
              </span>
              {member.status === 'removed' ? (
                <Badge tone="warning">{t('app.mAdminRemoved')}</Badge>
              ) : solo ? null : (
                <span className="w-40 shrink-0 truncate text-xs text-muted-2">
                  {(member.teamId && teamName.get(member.teamId)) || t('app.mAdminNoTeam')}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  void onSetStatus(member.id, member.status === 'active' ? 'removed' : 'active')
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

      <Sheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t('app.mAdminAddPerson')}
        footer={
          <Button
            size="lg"
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
