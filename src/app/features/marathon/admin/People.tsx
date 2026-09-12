/**
 * Who plays, and who they are paired with.
 *
 * Pairing is a select on the person's row rather than a drag between two lists: the coach knows the
 * pairs before he opens the screen — he decided them in the group chat — so the job is transcription,
 * and a select is the fastest way to transcribe.
 *
 * People are added by email whether or not they have ever opened the app. That is the same rule as
 * purchases, and it is what lets a marathon be built on a Sunday from a Telegram thread.
 */
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Sheet } from '@/components/ui/Sheet';
import type { MarathonMemberRow, MarathonTeamRow } from '@/lib/api/types';
import { useT } from '@/app/hooks/useT';

export interface PeopleProps {
  members: readonly MarathonMemberRow[];
  teams: readonly MarathonTeamRow[];
  onAddMember: (input: {
    email: string;
    displayName: string;
    teamId: string | null;
  }) => Promise<void>;
  onSetTeam: (memberId: string, teamId: string | null) => Promise<void>;
  onSetStatus: (memberId: string, status: 'active' | 'removed') => Promise<void>;
  onAddTeam: (name: string) => Promise<void>;
}

export function People({
  members,
  teams,
  onAddMember,
  onSetTeam,
  onSetStatus,
  onAddTeam,
}: PeopleProps) {
  const { t } = useT();
  const [addOpen, setAddOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [teamId, setTeamId] = useState<string>('');
  const [teamName, setTeamName] = useState('');
  const [busy, setBusy] = useState(false);

  const teamOptions = [
    { value: '', label: t('app.mAdminNoTeam') },
    ...teams.map((team) => ({ value: team.id, label: team.name })),
  ];

  const add = async () => {
    setBusy(true);
    try {
      await onAddMember({ email, displayName: name, teamId: teamId || null });
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
              ) : (
                <Select
                  label={undefined}
                  aria-label={t('app.mAdminTeam')}
                  value={member.teamId ?? ''}
                  onChange={(v) => void onSetTeam(member.id, v || null)}
                  options={teamOptions}
                  wrapperClassName="w-40 shrink-0"
                />
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
        <Button variant="ghost" size="md" onClick={() => setTeamOpen(true)}>
          {t('app.mAdminAddTeam')}
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
          <Select
            label={t('app.mAdminTeam')}
            value={teamId}
            onChange={setTeamId}
            options={teamOptions}
          />
        </div>
      </Sheet>

      <Sheet
        open={teamOpen}
        onClose={() => setTeamOpen(false)}
        title={t('app.mAdminAddTeam')}
        footer={
          <Button
            size="lg"
            fullWidth
            disabled={!teamName.trim()}
            onClick={() => {
              void onAddTeam(teamName.trim()).then(() => {
                setTeamName('');
                setTeamOpen(false);
              });
            }}
          >
            {t('app.mAdminAddTeam')}
          </Button>
        }
      >
        <Input
          label={t('app.mAdminName')}
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          wrapperClassName="pb-2"
        />
      </Sheet>
    </div>
  );
}
