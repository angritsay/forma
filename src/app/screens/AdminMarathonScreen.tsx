/**
 * One round of the club, from the coach's side: the day plan, the people, the proof that has come
 * in, the weekly board, and the settings that decide when a day closes.
 *
 * Tabs rather than screens because the work moves between them constantly — he writes
 * tomorrow's task, checks who has not sent anything, gives someone five points, and goes back to
 * the plan. A navigation stack would make that a chore.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { Select } from '@/components/ui/Select';
import { Tabs, tabPanelId } from '@/components/ui/Tabs';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { dayIndexOf } from '@/lib/marathon/score';
import {
  acceptProof,
  addMarathonAdjustment,
  addMarathonMember,
  copyDayTasks,
  createMarathonTask,
  deleteMarathonAdjustment,
  deleteMarathonTask,
  getMarathon,
  listMarathonAdjustments,
  listMarathonMembers,
  listMarathonProofs,
  listMarathonTasks,
  listMarathonTeams,
  listTaskTargets,
  repeatTask,
  restoreProof,
  setTaskTargets,
  updateMarathon,
  updateMarathonMember,
  updateMarathonTask,
  voidProof,
} from '@/lib/api/marathonAdmin';
import type {
  MarathonAdjustmentRow,
  MarathonMemberRow,
  MarathonPatch,
  MarathonProofRow,
  MarathonRow,
  MarathonStatus,
  MarathonTaskPatch,
  MarathonTaskRow,
  MarathonTaskTarget,
  MarathonTeamRow,
} from '@/lib/api/types';
import { BootScreen } from '@/app/components/BootScreen';
import { LoadingBlock } from '@/app/components/LoadingBlock';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { LangTabs, useEditingLocale } from '@/app/features/admin/LangTabs';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { BoardTab } from '@/app/features/marathon/admin/BoardTab';
import { dateOfDay } from '@/app/features/marathon/admin/dates';
import { DayPlan, longDate } from '@/app/features/marathon/admin/DayPlan';
import { People } from '@/app/features/marathon/admin/People';
import { ProofsFeed } from '@/app/features/marathon/admin/ProofsFeed';
import { TaskEditor } from '@/app/features/marathon/admin/TaskEditor';
import { statusKey } from '@/app/features/marathon/admin/model';
import type { TKey } from '@/i18n/index';

type Tab = 'plan' | 'people' | 'proofs' | 'board' | 'settings';

/**
 * The zones a round is run in. A free-text field took «Москва» and «MSK» and failed on save with
 * `unknown_timezone`; these are the places the club's people actually live, west to east.
 */
const TIMEZONES: readonly { value: string; key: TKey }[] = [
  { value: 'Europe/Kaliningrad', key: 'app.mAdminTzKaliningrad' },
  { value: 'Europe/Moscow', key: 'app.mAdminTzMoscow' },
  { value: 'Asia/Yekaterinburg', key: 'app.mAdminTzYekaterinburg' },
  { value: 'Asia/Novosibirsk', key: 'app.mAdminTzNovosibirsk' },
  { value: 'Asia/Vladivostok', key: 'app.mAdminTzVladivostok' },
  { value: 'UTC', key: 'app.mAdminTzUtc' },
];

export default function AdminMarathonScreen() {
  const { t, locale } = useT();
  const toast = useToast();
  const admin = useIsAdmin();
  const { id = '' } = useParams();

  const [tab, setTab] = useState<Tab>('plan');
  const [marathon, setMarathon] = useState<MarathonRow | null>(null);
  const [tasks, setTasks] = useState<MarathonTaskRow[]>([]);
  const [members, setMembers] = useState<MarathonMemberRow[]>([]);
  const [teams, setTeams] = useState<MarathonTeamRow[]>([]);
  const [proofs, setProofs] = useState<MarathonProofRow[]>([]);
  const [adjustments, setAdjustments] = useState<MarathonAdjustmentRow[]>([]);
  const [targets, setTargets] = useState<Map<string, MarathonTaskTarget[]>>(new Map());
  const [dayFilter, setDayFilter] = useState<number | null>(null);
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState(1);
  const [editing, setEditing] = useState<MarathonTaskRow | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const fail = useCallback(
    (key: 'app.mAdminLoadError' | 'app.mAdminSaveError' | 'app.mAdminAddError') => () =>
      toast.show({ kind: 'error', title: t(key) }),
    [toast, t],
  );
  const done = useCallback(
    (key: TKey, description?: string) =>
      toast.show({ kind: 'success', title: t(key), description }),
    [toast, t],
  );

  /**
   * One write from this screen: run it, say it worked, or say it did not and reject so the sheet
   * or dialog that asked for it stays open. Nothing here fails silently any more.
   */
  const act = useCallback(
    async (write: () => Promise<unknown>, ok: TKey, error: Parameters<typeof fail>[0]) => {
      try {
        await write();
        done(ok);
      } catch (e) {
        fail(error)();
        throw e;
      }
    },
    [done, fail],
  );

  const refresh = useCallback(async () => {
    const [m, ts, ms, tm, tg] = await Promise.all([
      getMarathon(id),
      listMarathonTasks(id),
      listMarathonMembers(id),
      listMarathonTeams(id),
      listTaskTargets(id),
    ]);
    setMarathon(m);
    setTasks(ts);
    setMembers(ms);
    setTeams(tm);
    setTargets(tg);
    return m;
  }, [id]);

  /** Names for the recipient chips: a team id or a member id in, a word out. */
  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const team of teams) map.set(team.id, team.name);
    for (const member of members) {
      map.set(member.id, member.displayName?.trim() || member.email);
    }
    return map;
  }, [teams, members]);

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
    listMarathonProofs({
      marathonId: id,
      dayIndex: dayFilter ?? undefined,
      needsReviewOnly: needsReviewOnly || undefined,
    })
      .then(setProofs)
      .catch(fail('app.mAdminLoadError'));
  }, [id, dayFilter, needsReviewOnly, fail]);

  const reloadAdjustments = useCallback(() => {
    listMarathonAdjustments(id).then(setAdjustments).catch(fail('app.mAdminLoadError'));
  }, [id, fail]);

  useEffect(() => {
    if (admin && id && tab === 'proofs') {
      reloadProofs();
      reloadAdjustments();
    }
  }, [admin, id, tab, reloadProofs, reloadAdjustments]);

  const today = useMemo(
    () =>
      marathon
        ? Math.min(Math.max(dayIndexOf(marathon.startsOn, marathon.timezone), 0), marathon.days)
        : 0,
    [marathon],
  );

  if (admin === null) return <BootScreen />;
  if (admin === false) return <Navigate to="/" replace />;
  if (loading || !marathon) {
    return (
      <Screen header={<TopBar back title={t('app.mAdminTitle')} />}>
        <LoadingBlock />
      </Screen>
    );
  }

  const saveTask = async (
    patch: MarathonTaskPatch,
    who: readonly MarathonTaskTarget[],
    repeatUntil: number | null,
  ) => {
    try {
      if (editing) {
        await updateMarathonTask(editing.id, patch);
        await setTaskTargets(editing.id, who);
      } else {
        const made = await createMarathonTask(id, {
          ...patch,
          dayIndex: day,
          title: patch.title ?? '',
        });
        await setTaskTargets(made.id, who);
        // A repeat copies the recipients too: «эту неделю Ване и Вите каждое утро» is one action.
        if (repeatUntil) {
          for (const copy of await repeatTask(made, repeatUntil)) {
            await setTaskTargets(copy.id, who);
          }
        }
      }
      const [ts, tg] = await Promise.all([listMarathonTasks(id), listTaskTargets(id)]);
      setTasks(ts);
      setTargets(tg);
      done('app.mAdminTaskSaved');
    } catch (e) {
      fail('app.mAdminSaveError')();
      throw e;
    }
  };

  const removeTask = async () => {
    if (!editing) return;
    const taskId = editing.id;
    await act(
      async () => {
        await deleteMarathonTask(taskId);
        setTasks(await listMarathonTasks(id));
      },
      'app.mAdminTaskDeleted',
      'app.mAdminSaveError',
    );
  };

  const patchMarathon = async (patch: MarathonPatch) => {
    await act(
      async () => setMarathon(await updateMarathon(id, patch)),
      'app.mAdminSaved',
      'app.mAdminSaveError',
    );
  };

  // Everyone for themselves: the one setting that changes what the rest of this screen offers.
  const solo = marathon.teamSize <= 1;

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
            { id: 'board', label: t('app.mAdminTabBoard') },
            { id: 'settings', label: t('app.mAdminTabSettings') },
          ]}
        />

        <div role="tabpanel" id={tabPanelId(tab)} aria-labelledby={`tab-${tab}`}>
          {tab === 'plan' ? (
            <DayPlan
              marathon={marathon}
              tasks={tasks}
              targets={targets}
              names={names}
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
                  .then(() => done('app.mAdminDayCopied'))
                  .catch(() => toast.show({ kind: 'error', title: t('app.mAdminCopyDayError') }));
              }}
            />
          ) : tab === 'people' ? (
            <People
              members={members}
              teams={teams}
              solo={solo}
              onAddMember={(input) =>
                act(
                  async () => {
                    await addMarathonMember({ marathonId: id, ...input });
                    setMembers(await listMarathonMembers(id));
                  },
                  'app.mAdminMemberAdded',
                  'app.mAdminAddError',
                )
              }
              onSetStatus={(memberId, status) =>
                act(
                  async () => {
                    await updateMarathonMember(memberId, { status });
                    setMembers(await listMarathonMembers(id));
                  },
                  status === 'removed' ? 'app.mAdminMemberRemoved' : 'app.mAdminMemberRestored',
                  'app.mAdminSaveError',
                )
              }
            />
          ) : tab === 'proofs' ? (
            <ProofsFeed
              proofs={proofs}
              members={members}
              startsOn={marathon.startsOn}
              days={marathon.days}
              today={today}
              dayFilter={dayFilter}
              onDayFilter={setDayFilter}
              needsReviewOnly={needsReviewOnly}
              onNeedsReviewOnly={setNeedsReviewOnly}
              onVoid={async (proofId, reason) => {
                await act(
                  () => voidProof(proofId, reason),
                  'app.mAdminProofVoidedToast',
                  'app.mAdminSaveError',
                );
                reloadProofs();
              }}
              onRestore={async (proofId) => {
                await act(
                  () => restoreProof(proofId),
                  'app.mAdminProofRestoredToast',
                  'app.mAdminSaveError',
                );
                reloadProofs();
              }}
              onAccept={async (proofId) => {
                await act(
                  () => acceptProof(proofId),
                  'app.mAdminProofAcceptedToast',
                  'app.mAdminSaveError',
                );
                reloadProofs();
              }}
              onBonus={async (input) => {
                await act(
                  () => addMarathonAdjustment({ marathonId: id, ...input }),
                  'app.mAdminBonusAdded',
                  'app.mAdminSaveError',
                );
                reloadAdjustments();
              }}
              adjustments={adjustments}
              onUndoBonus={async (adjustmentId) => {
                await act(
                  () => deleteMarathonAdjustment(adjustmentId),
                  'app.mAdminBonusRemoved',
                  'app.mAdminSaveError',
                );
                reloadAdjustments();
              }}
            />
          ) : tab === 'board' ? (
            <BoardTab marathon={marathon} today={today} />
          ) : (
            <Settings marathon={marathon} onPatch={patchMarathon} />
          )}
        </div>
      </div>

      <TaskEditor
        open={editorOpen}
        task={editing}
        dayLabel={longDate(locale, dateOfDay(marathon.startsOn, day))}
        startsOn={marathon.startsOn}
        dayIndex={day}
        lastDay={marathon.days}
        teams={teams}
        members={members}
        solo={solo}
        initialTargets={(editing ? targets.get(editing.id) : undefined) ?? []}
        onClose={() => setEditorOpen(false)}
        onSave={saveTask}
        onDelete={editing ? removeTask : undefined}
      />
    </Screen>
  );
}

/**
 * The settings that change how the round behaves rather than what is in it.
 *
 * Everything saves on blur (or on pick), and says «Сохранено» when it has: this is a form the
 * owner opens once a month, and a Save button she can forget to press is a worse failure than a
 * write she did not ask for. There used to be one anyway, at the bottom, and it saved the title
 * alone — which made every other field look unsaved.
 *
 * A field that was left as it was does not write: tabbing through the form is not an edit.
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
  const [pendingStatus, setPendingStatus] = useState<MarathonStatus | null>(null);
  useEffect(() => setDraft(marathon), [marathon]);

  const set = <K extends keyof MarathonRow>(key: K, value: MarathonRow[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  /** Write only the fields that differ from what is stored. */
  const commit = (patch: MarathonPatch) => {
    const changed = Object.entries(patch).some(
      ([key, value]) => (marathon as unknown as Record<string, unknown>)[key] !== value,
    );
    if (changed) void onPatch(patch).catch(() => setDraft(marathon));
  };

  /*
   * Название, описание и приз — единственное здесь, что читает участник; всё остальное в этой
   * форме (даты, часовой пояс, размер команды) — цифры, которые он видит уже разложенными по
   * экрану. Поэтому переключатель стоит над тремя полями, а не над всей формой.
   *
   * Приз тут самый важный: `clubPrize()` подставляет переведённую строку по умолчанию только
   * пока поле пустое. Стоит Сергею вписать «Час с тренером» — и её же видит английский читатель.
   */
  const editing = useEditingLocale();
  const en = editing === 'en';

  /*
   * Черновик и архив прячут круг от участников — это спрашивается. «Идёт» и «Закончен» ничего
   * не прячут и меняются сразу.
   */
  const pickStatus = (status: MarathonStatus) => {
    if (status === marathon.status) return;
    if (status === 'draft' || status === 'archived') setPendingStatus(status);
    else commit({ status });
  };

  const timezones = TIMEZONES.some((z) => z.value === draft.timezone)
    ? TIMEZONES.map((z) => ({ value: z.value, label: t(z.key) }))
    : [
        { value: draft.timezone, label: draft.timezone },
        ...TIMEZONES.map((z) => ({ value: z.value, label: t(z.key) })),
      ];

  return (
    <div className="flex flex-col gap-4">
      <Select<MarathonStatus>
        label={t('app.mAdminStatus')}
        value={draft.status}
        onChange={pickStatus}
        options={(['draft', 'active', 'finished', 'archived'] as const).map((s) => ({
          value: s,
          label: t(statusKey(s)),
        }))}
      />
      <LangTabs />
      <Input
        label={t('app.mAdminName')}
        placeholder={en ? draft.title : (draft.titleEn ?? '')}
        value={(en ? draft.titleEn : draft.title) ?? ''}
        onChange={(e) => set(en ? 'titleEn' : 'title', e.target.value)}
        onBlur={() =>
          commit(
            en
              ? { titleEn: draft.titleEn?.trim() || null }
              : { title: draft.title.trim() || marathon.title },
          )
        }
      />
      <Textarea
        label={t('app.mAdminDescription')}
        rows={2}
        placeholder={(en ? draft.description : draft.descriptionEn) ?? ''}
        value={(en ? draft.descriptionEn : draft.description) ?? ''}
        onChange={(e) => set(en ? 'descriptionEn' : 'description', e.target.value)}
        onBlur={() =>
          commit(
            en
              ? { descriptionEn: draft.descriptionEn?.trim() || null }
              : { description: draft.description?.trim() || null },
          )
        }
      />
      <Input
        label={t('app.mAdminPrize')}
        placeholder={(en ? draft.prize : draft.prizeEn) ?? ''}
        value={(en ? draft.prizeEn : draft.prize) ?? ''}
        onChange={(e) => set(en ? 'prizeEn' : 'prize', e.target.value)}
        onBlur={() =>
          commit(
            en
              ? { prizeEn: draft.prizeEn?.trim() || null }
              : { prize: draft.prize?.trim() || null },
          )
        }
      />
      <div className="flex gap-3">
        <Input
          label={t('app.mAdminStarts')}
          type="date"
          value={draft.startsOn}
          onChange={(e) => set('startsOn', e.target.value)}
          onBlur={() => draft.startsOn && commit({ startsOn: draft.startsOn })}
          wrapperClassName="min-w-0 flex-1"
        />
        <Input
          label={t('app.mAdminDays')}
          inputMode="numeric"
          value={String(draft.days)}
          onChange={(e) => set('days', Number(e.target.value) || 1)}
          onBlur={() => commit({ days: draft.days })}
          wrapperClassName="w-24"
        />
      </div>
      <div className="flex gap-3">
        <Select
          label={t('app.mAdminTimezone')}
          value={draft.timezone}
          onChange={(timezone) => {
            set('timezone', timezone);
            commit({ timezone });
          }}
          options={timezones}
          wrapperClassName="min-w-0 flex-1"
        />
        <Input
          label={t('app.mAdminDue')}
          type="time"
          value={draft.dueTime.slice(0, 5)}
          onChange={(e) => set('dueTime', `${e.target.value}:00`)}
          onBlur={() => commit({ dueTime: draft.dueTime })}
          wrapperClassName="w-32"
        />
      </div>
      {/*
       * Switching a running round here really does change the club: solo stops consulting teams
       * anywhere, so the pairs stop scoring together from the next board onwards. The hint says so
       * rather than leaving it to be discovered on Monday.
       */}
      <Select
        label={t('app.mAdminTeamSize')}
        hint={t('app.mAdminTeamSizeHint')}
        value={String(draft.teamSize)}
        onChange={(v) => {
          set('teamSize', Number(v));
          commit({ teamSize: Number(v) });
        }}
        options={[
          { value: '1', label: t('app.mAdminTeamSizeSolo') },
          { value: '2', label: t('app.mAdminTeamSizePair') },
        ]}
      />

      <Modal
        open={pendingStatus !== null}
        onClose={() => setPendingStatus(null)}
        title={t(
          pendingStatus === 'archived'
            ? 'app.mAdminStatusConfirmArchivedTitle'
            : 'app.mAdminStatusConfirmDraftTitle',
        )}
        description={t(
          pendingStatus === 'archived'
            ? 'app.mAdminStatusConfirmArchivedBody'
            : 'app.mAdminStatusConfirmDraftBody',
        )}
        confirmLabel={t('app.mAdminStatusConfirm')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          if (pendingStatus) {
            set('status', pendingStatus);
            commit({ status: pendingStatus });
          }
          setPendingStatus(null);
        }}
      />
    </div>
  );
}
