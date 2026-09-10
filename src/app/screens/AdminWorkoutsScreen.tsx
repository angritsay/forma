/**
 * The coach's workout builder (admins only). A list of custom workouts, the editor, and the two
 * ways to hand a workout out: a share link (opens the app) and assigning it to a person's email.
 */
import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import {
  assignCustomWorkout,
  createCustomWorkout,
  deleteCustomWorkout,
  getCustomWorkout,
  listCustomWorkouts,
  listWorkoutAssignees,
  setCustomWorkoutShare,
  unassignCustomWorkout,
  updateCustomWorkout,
  type CustomWorkoutInput,
} from '@/lib/api/customWorkouts';
import type { CustomWorkoutSummary, WorkoutAssigneeRow } from '@/lib/api/types';
import type { CustomWorkoutStructure } from '@/lib/training/customWorkout';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { BootScreen } from '@/app/components/BootScreen';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { WorkoutEditor } from '@/app/features/admin/workoutBuilder/WorkoutEditor';

function shareUrl(token: string): string {
  // The app is already open at .../app/#/... — build the share link off the current app URL.
  const base = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
  return `${base}#/shared/${token}`;
}

type EditTarget = { id: string; input: CustomWorkoutInput } | 'new' | null;

export default function AdminWorkoutsScreen() {
  const { t } = useT();
  const toast = useToast();
  const admin = useIsAdmin();

  const [rows, setRows] = useState<CustomWorkoutSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditTarget>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [shareFor, setShareFor] = useState<CustomWorkoutSummary | null>(null);
  const [assignFor, setAssignFor] = useState<CustomWorkoutSummary | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    listCustomWorkouts()
      .then(setRows)
      .catch(() => toast.show({ kind: 'error', title: t('app.builderLoadError') }))
      .finally(() => setLoading(false));
  }, [toast, t]);

  useEffect(() => {
    if (admin) refresh();
  }, [admin, refresh]);

  if (admin === null) return <BootScreen />;
  if (admin === false) return <Navigate to="/profile" replace />;

  const startEdit = async (id: string) => {
    try {
      const w = await getCustomWorkout(id);
      setEditing({
        id,
        input: {
          title: w.title,
          description: w.description,
          structure: w.structure as CustomWorkoutStructure,
        },
      });
    } catch {
      toast.show({ kind: 'error', title: t('app.builderLoadError') });
    }
  };

  const onSave = async (input: CustomWorkoutInput) => {
    setSaving(true);
    try {
      if (editing && editing !== 'new') await updateCustomWorkout(editing.id, input);
      else await createCustomWorkout(input);
      setEditing(null);
      refresh();
      toast.show({ kind: 'success', title: t('app.builderSaved') });
    } catch {
      toast.show({ kind: 'error', title: t('app.builderSaveError') });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    try {
      await deleteCustomWorkout(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.show({ kind: 'error', title: t('app.builderDeleteError') });
    }
  };

  if (editing) {
    const isNew = editing === 'new';
    return (
      <Screen
        header={
          <TopBar
            back={() => setEditing(null)}
            title={isNew ? t('app.builderNew') : t('app.builderEdit')}
          />
        }
      >
        <WorkoutEditor
          {...(isNew
            ? {}
            : {
                initialTitle: editing.input.title,
                initialDescription: editing.input.description,
                initialStructure: editing.input.structure,
              })}
          saving={saving}
          onSave={onSave}
          onCancel={() => setEditing(null)}
        />
      </Screen>
    );
  }

  return (
    <Screen
      header={<TopBar back title={t('app.builderScreenTitle')} />}
      footer={
        <Button
          size="lg"
          fullWidth
          icon={<Icon name="plus" size={18} />}
          onClick={() => setEditing('new')}
        >
          {t('app.builderNew')}
        </Button>
      }
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon="courses"
          title={t('app.builderEmptyTitle')}
          description={t('app.builderEmptyBody')}
        />
      ) : (
        <ul className="flex flex-col gap-2 py-2">
          {rows.map((w) => {
            const minutes = w.estSec ? Math.max(1, Math.round(w.estSec / 60)) : null;
            return (
              <li key={w.id} className="flex flex-col gap-3 rounded-card bg-surface-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-lg">{w.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      {minutes ? (
                        <span className="tabular">{t('app.nodeDuration', { min: minutes })}</span>
                      ) : null}
                      {w.points ? (
                        <span className="tabular">· {t('app.nodePoints', { n: w.points })}</span>
                      ) : null}
                      {w.shareToken ? (
                        <Badge tone="accent" size="sm">
                          {t('app.builderShared')}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    icon={<Icon name="edit" size={16} />}
                    onClick={() => void startEdit(w.id)}
                  >
                    {t('app.builderEditBtn')}
                  </Button>
                  <Button
                    variant="secondary"
                    icon={<Icon name="globe" size={16} />}
                    onClick={() => setShareFor(w)}
                  >
                    {t('app.builderShareBtn')}
                  </Button>
                  <Button
                    variant="secondary"
                    icon={<Icon name="user" size={16} />}
                    onClick={() => setAssignFor(w)}
                  >
                    {t('app.builderAssignBtn')}
                  </Button>
                  <Button
                    variant="ghost"
                    icon={<Icon name="close" size={16} />}
                    onClick={() => setDeleteId(w.id)}
                  >
                    {t('app.builderDeleteBtn')}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title={t('app.builderDeleteConfirmTitle')}
        description={t('app.builderDeleteConfirmBody')}
        confirmLabel={t('app.builderDeleteBtn')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => void confirmDelete()}
      />

      <ShareSheet workout={shareFor} onClose={() => setShareFor(null)} onChanged={refresh} />
      <AssignSheet workout={assignFor} onClose={() => setAssignFor(null)} />
    </Screen>
  );
}

function ShareSheet({
  workout,
  onClose,
  onChanged,
}: {
  workout: CustomWorkoutSummary | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { t } = useT();
  const toast = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setToken(workout?.shareToken ?? null);
  }, [workout]);

  if (!workout) return null;

  const toggle = async (enabled: boolean) => {
    setBusy(true);
    try {
      const next = await setCustomWorkoutShare(workout.id, enabled);
      setToken(next);
      onChanged();
    } catch {
      toast.show({ kind: 'error', title: t('app.builderShareError') });
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(shareUrl(token));
      toast.show({ kind: 'success', title: t('app.builderLinkCopied') });
    } catch {
      /* Clipboard blocked: the link is shown for manual copy. */
    }
  };

  return (
    <Sheet open onClose={onClose} title={t('app.builderShareBtn')}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">{t('app.builderShareHint')}</p>
        {token ? (
          <>
            <div className="break-all rounded-inner bg-surface-2 p-3 text-sm">
              {shareUrl(token)}
            </div>
            <div className="flex gap-2">
              <Button fullWidth onClick={() => void copy()}>
                {t('app.builderCopyLink')}
              </Button>
              <Button variant="ghost" loading={busy} onClick={() => void toggle(false)}>
                {t('app.builderShareOff')}
              </Button>
            </div>
          </>
        ) : (
          <Button fullWidth loading={busy} onClick={() => void toggle(true)}>
            {t('app.builderShareOn')}
          </Button>
        )}
      </div>
    </Sheet>
  );
}

function AssignSheet({
  workout,
  onClose,
}: {
  workout: CustomWorkoutSummary | null;
  onClose: () => void;
}) {
  const { t } = useT();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [assignees, setAssignees] = useState<WorkoutAssigneeRow[]>([]);

  useEffect(() => {
    if (!workout) return;
    setEmail('');
    listWorkoutAssignees(workout.id)
      .then(setAssignees)
      .catch(() => setAssignees([]));
  }, [workout]);

  if (!workout) return null;

  const assign = async () => {
    const value = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      toast.show({ kind: 'error', title: t('app.builderInvalidEmail') });
      return;
    }
    setBusy(true);
    try {
      await assignCustomWorkout(workout.id, value);
      const next = await listWorkoutAssignees(workout.id);
      setAssignees(next);
      setEmail('');
      toast.show({ kind: 'success', title: t('app.builderAssigned') });
    } catch {
      toast.show({ kind: 'error', title: t('app.builderAssignError') });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (target: string) => {
    try {
      await unassignCustomWorkout(workout.id, target);
      setAssignees((prev) => prev.filter((a) => a.email !== target));
    } catch {
      toast.show({ kind: 'error', title: t('app.builderAssignError') });
    }
  };

  return (
    <Sheet open onClose={onClose} title={t('app.builderAssignBtn')}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">{t('app.builderAssignHint')}</p>
        <div className="flex gap-2">
          <Input
            type="email"
            inputMode="email"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={t('app.builderEmailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button loading={busy} onClick={() => void assign()}>
            {t('app.builderAssignAction')}
          </Button>
        </div>
        {assignees.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {assignees.map((a) => (
              <li
                key={a.email}
                className="flex items-center justify-between gap-3 rounded-inner bg-surface-2 px-3 py-2 text-sm"
              >
                <span className="truncate">{a.email}</span>
                <button
                  type="button"
                  className="shrink-0 text-muted hover:text-danger"
                  aria-label={t('app.builderUnassign')}
                  onClick={() => void remove(a.email)}
                >
                  <Icon name="close" size={16} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Sheet>
  );
}
