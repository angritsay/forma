/**
 * One marathon, from the coach's side: the day plan, the people, the proof that has come in, and
 * the settings that decide when a day closes.
 *
 * Four tabs rather than four screens because the work moves between them constantly — he writes
 * tomorrow's task, checks who has not sent anything, gives someone five points, and goes back to
 * the plan. A navigation stack would make that a chore.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs, tabPanelId } from '@/components/ui/Tabs';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { dayIndexOf } from '@/lib/marathon/score';
import {
  addMarathonAdjustment,
  addMarathonMember,
  copyDayTasks,
  createMarathonTask,
  createMarathonTeam,
  deleteMarathonTask,
  getMarathon,
  listMarathonMembers,
  listMarathonProofs,
  listMarathonTasks,
  listMarathonTeams,
  repeatTask,
  restoreProof,
  updateMarathon,
  updateMarathonMember,
  updateMarathonTask,
  voidProof,
} from '@/lib/api/marathonAdmin';
import type {
  MarathonMemberRow,
  MarathonPatch,
  MarathonProofRow,
  MarathonRow,
  MarathonStatus,
  MarathonTaskPatch,
  MarathonTaskRow,
  MarathonTeamRow,
} from '@/lib/api/types';
import { BootScreen } from '@/app/components/BootScreen';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { DayPlan } from '@/app/features/marathon/admin/DayPlan';
import { People } from '@/app/features/marathon/admin/People';
import { ProofsFeed } from '@/app/features/marathon/admin/ProofsFeed';
import { TaskEditor } from '@/app/features/marathon/admin/TaskEditor';
import { statusKey } from '@/app/features/marathon/admin/model';

type Tab = 'plan' | 'people' | 'proofs' | 'settings';

export default function AdminMarathonScreen() {
  const { t } = useT();
  const toast = useToast();
  const admin = useIsAdmin();
  const { id = '' } = useParams();

  const [tab, setTab] = useState<Tab>('plan');
  const [marathon, setMarathon] = useState<MarathonRow | null>(null);
  const [tasks, setTasks] = useState<MarathonTaskRow[]>([]);
  const [members, setMembers] = useState<MarathonMemberRow[]>([]);
  const [teams, setTeams] = useState<MarathonTeamRow[]>([]);
  const [proofs, setProofs] = useState<MarathonProofRow[]>([]);
  const [dayFilter, setDayFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState(1);
  const [editing, setEditing] = useState<MarathonTaskRow | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const fail = useCallback(
    (key: 'app.mAdminLoadError' | 'app.mAdminSaveError' | 'app.mAdminAddError') => () =>
      toast.show({ kind: 'error', title: t(key) }),
    [toast, t],
  );

  const refresh = useCallback(async () => {
    const [m, ts, ms, tm] = await Promise.all([
      getMarathon(id),
      listMarathonTasks(id),
      listMarathonMembers(id),
      listMarathonTeams(id),
    ]);
    setMarathon(m);
    setTasks(ts);
    setMembers(ms);
    setTeams(tm);
    return m;
  }, [id]);

  useEffect(() => {
    if (!admin || !id) return;
    setLoading(true);
    refresh()
      .then((m) => {
        // Open on the day he is actually working on: today, or the first day if it has not started.
        const today = Math.min(Math.max(dayIndexOf(m.startsOn, m.timezone), 1), m.days);
        setDay(today);
        // The proofs feed opens on today too. Unfiltered it is every proof of the whole run —
        // hundreds of rows, none of which is the one he came to look at.
        setDayFilter(today);
      })
      .catch(fail('app.mAdminLoadError'))
      .finally(() => setLoading(false));
  }, [admin, id, refresh, fail]);

  const reloadProofs = useCallback(() => {
    listMarathonProofs({ marathonId: id, dayIndex: dayFilter ?? undefined })
      .then(setProofs)
      .catch(fail('app.mAdminLoadError'));
  }, [id, dayFilter, fail]);

  useEffect(() => {
    if (admin && id && tab === 'proofs') reloadProofs();
  }, [admin, id, tab, reloadProofs]);

  const today = useMemo(
    () =>
      marathon
        ? Math.min(Math.max(dayIndexOf(marathon.startsOn, marathon.timezone), 0), marathon.days)
        : 0,
    [marathon],
  );

  if (admin === null) return <BootScreen />;
  if (admin === false) return <Navigate to="/profile" replace />;
  if (loading || !marathon) {
    return (
      <Screen header={<TopBar back title={t('app.mAdminTitle')} />}>
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </Screen>
    );
  }

  const saveTask = async (patch: MarathonTaskPatch, repeatUntil: number | null) => {
    try {
      if (editing) {
        await updateMarathonTask(editing.id, patch);
      } else {
        const made = await createMarathonTask(id, {
          ...patch,
          dayIndex: day,
          title: patch.title ?? '',
        });
        if (repeatUntil) await repeatTask(made, repeatUntil);
      }
      setTasks(await listMarathonTasks(id));
    } catch {
      fail('app.mAdminSaveError')();
    }
  };

  const removeTask = async () => {
    if (!editing) return;
    try {
      await deleteMarathonTask(editing.id);
      setTasks(await listMarathonTasks(id));
    } catch {
      fail('app.mAdminSaveError')();
    }
  };

  const patchMarathon = async (patch: MarathonPatch) => {
    try {
      setMarathon(await updateMarathon(id, patch));
    } catch {
      fail('app.mAdminSaveError')();
    }
  };

  return (
    <Screen header={<TopBar back title={marathon.title} />}>
      <div className="flex flex-col gap-5 py-2">
        <Tabs<Tab>
          variant="underline"
          label={marathon.title}
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'plan', label: t('app.mAdminTabPlan') },
            { id: 'people', label: t('app.mAdminTabPeople') },
            { id: 'proofs', label: t('app.mAdminTabProofs') },
            { id: 'settings', label: t('app.mAdminTabSettings') },
          ]}
        />

        <div role="tabpanel" id={tabPanelId(tab)} aria-labelledby={`tab-${tab}`}>
          {tab === 'plan' ? (
            <DayPlan
              marathon={marathon}
              tasks={tasks}
              day={day}
              today={today}
              onDay={setDay}
              onOpenTask={(task) => {
                setEditing(task);
                setEditorOpen(true);
              }}
              onAddTask={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
              onCopyYesterday={() => {
                copyDayTasks(id, day - 1, day)
                  .then(() => listMarathonTasks(id).then(setTasks))
                  .catch(() => toast.show({ kind: 'error', title: t('app.mAdminCopyDayError') }));
              }}
            />
          ) : tab === 'people' ? (
            <People
              members={members}
              teams={teams}
              onAddMember={async (input) => {
                try {
                  await addMarathonMember({ marathonId: id, ...input });
                  setMembers(await listMarathonMembers(id));
                } catch {
                  fail('app.mAdminAddError')();
                }
              }}
              onSetTeam={async (memberId, teamId) => {
                await updateMarathonMember(memberId, { teamId }).catch(fail('app.mAdminSaveError'));
                setMembers(await listMarathonMembers(id));
              }}
              onSetStatus={async (memberId, status) => {
                await updateMarathonMember(memberId, { status }).catch(fail('app.mAdminSaveError'));
                setMembers(await listMarathonMembers(id));
              }}
              onAddTeam={async (name) => {
                try {
                  await createMarathonTeam(id, name, teams.length + 1);
                  setTeams(await listMarathonTeams(id));
                } catch {
                  fail('app.mAdminAddError')();
                }
              }}
            />
          ) : tab === 'proofs' ? (
            <ProofsFeed
              proofs={proofs}
              members={members}
              days={marathon.days}
              today={today}
              dayFilter={dayFilter}
              onDayFilter={setDayFilter}
              onVoid={async (proofId, reason) => {
                await voidProof(proofId, reason).catch(fail('app.mAdminSaveError'));
                reloadProofs();
              }}
              onRestore={async (proofId) => {
                await restoreProof(proofId).catch(fail('app.mAdminSaveError'));
                reloadProofs();
              }}
              onBonus={async (input) => {
                await addMarathonAdjustment({ marathonId: id, ...input }).catch(
                  fail('app.mAdminSaveError'),
                );
              }}
            />
          ) : (
            <Settings marathon={marathon} onPatch={patchMarathon} />
          )}
        </div>
      </div>

      <TaskEditor
        open={editorOpen}
        task={editing}
        dayIndex={day}
        lastDay={marathon.days}
        onClose={() => setEditorOpen(false)}
        onSave={saveTask}
        onDelete={editing ? removeTask : undefined}
      />
    </Screen>
  );
}

/**
 * The settings that change how the marathon behaves rather than what is in it.
 *
 * Everything saves on blur: this is a form the coach opens once a month, and a Save button he can
 * forget to press is a worse failure than a write he did not ask for.
 */
function Settings({
  marathon,
  onPatch,
}: {
  marathon: MarathonRow;
  onPatch: (patch: MarathonPatch) => Promise<void>;
}) {
  const { t } = useT();
  const [draft, setDraft] = useState(marathon);
  useEffect(() => setDraft(marathon), [marathon]);

  const set = <K extends keyof MarathonRow>(key: K, value: MarathonRow[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <div className="flex flex-col gap-4">
      <Select<MarathonStatus>
        label={t('app.mAdminStatus')}
        value={draft.status}
        onChange={(status) => {
          set('status', status);
          void onPatch({ status });
        }}
        options={(['draft', 'active', 'finished', 'archived'] as const).map((s) => ({
          value: s,
          label: t(statusKey(s)),
        }))}
      />
      <Input
        label={t('app.mAdminName')}
        value={draft.title}
        onChange={(e) => set('title', e.target.value)}
        onBlur={() => void onPatch({ title: draft.title })}
      />
      <Textarea
        label={t('app.mAdminDescription')}
        rows={2}
        value={draft.description ?? ''}
        onChange={(e) => set('description', e.target.value)}
        onBlur={() => void onPatch({ description: draft.description?.trim() || null })}
      />
      <Input
        label={t('app.mAdminPrize')}
        value={draft.prize ?? ''}
        onChange={(e) => set('prize', e.target.value)}
        onBlur={() => void onPatch({ prize: draft.prize?.trim() || null })}
      />
      <div className="flex gap-3">
        <Input
          label={t('app.mAdminStarts')}
          type="date"
          value={draft.startsOn}
          onChange={(e) => set('startsOn', e.target.value)}
          onBlur={() => void onPatch({ startsOn: draft.startsOn })}
          wrapperClassName="flex-1"
        />
        <Input
          label={t('app.mAdminDays')}
          inputMode="numeric"
          value={String(draft.days)}
          onChange={(e) => set('days', Number(e.target.value) || 1)}
          onBlur={() => void onPatch({ days: draft.days })}
          wrapperClassName="w-24"
        />
      </div>
      <div className="flex gap-3">
        <Input
          label={t('app.mAdminTimezone')}
          value={draft.timezone}
          onChange={(e) => set('timezone', e.target.value)}
          onBlur={() => void onPatch({ timezone: draft.timezone })}
          wrapperClassName="flex-1"
        />
        <Input
          label={t('app.mAdminDue')}
          type="time"
          value={draft.dueTime.slice(0, 5)}
          onChange={(e) => set('dueTime', `${e.target.value}:00`)}
          onBlur={() => void onPatch({ dueTime: draft.dueTime })}
          wrapperClassName="w-32"
        />
      </div>
      <Select
        label={t('app.mAdminTeamSize')}
        value={String(draft.teamSize)}
        onChange={(v) => {
          set('teamSize', Number(v));
          void onPatch({ teamSize: Number(v) });
        }}
        options={[
          { value: '1', label: t('app.mAdminTeamSizeSolo') },
          { value: '2', label: t('app.mAdminTeamSizePair') },
        ]}
      />
      <Button variant="ghost" size="sm" onClick={() => void onPatch({ title: draft.title })}>
        {t('app.mAdminSave')}
      </Button>
    </div>
  );
}
