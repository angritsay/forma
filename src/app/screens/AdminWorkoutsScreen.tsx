/**
 * The coach's workout builder (admins only). A list of custom workouts, the editor, and the two
 * ways to hand a workout out: a share link (opens the app) and assigning it to a person's email.
 *
 * The editor has its own address, `/admin/workouts/:id` (`new` for a new one). It used to be a
 * state of the list, so Telegram's back button — which walks history — skipped straight past it
 * and threw away whatever was being built. On its own route the back button is the editor's, and
 * leaving with unsaved work asks first (`useUnsavedGuard`).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { PersonPicker } from '@/app/features/admin/PersonPicker';
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
import { openExternal } from '@/lib/telegram/webapp';
import { TopBar } from '@/app/components/TopBar';
import { adminErrorTitle } from '@/app/features/admin/adminError';
import { useT } from '@/app/hooks/useT';
import { BootScreen } from '@/app/components/BootScreen';
import { LoadingBlock } from '@/app/components/LoadingBlock';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { telegramShareUrl } from '@/app/features/admin/share';
import { useUnsavedGuard } from '@/app/features/admin/useUnsavedGuard';
import { WorkoutEditor } from '@/app/features/admin/workoutBuilder/WorkoutEditor';

function shareUrl(token: string): string {
  // The app is already open at .../app/#/... — build the share link off the current app URL.
  const base = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
  return `${base}#/shared/${token}`;
}

export default function AdminWorkoutsScreen() {
  const { id } = useParams();
  const admin = useIsAdmin();
  if (admin === null) return <BootScreen />;
  if (admin === false) return <Navigate to="/" replace />;
  return id ? <WorkoutEditScreen id={id} /> : <WorkoutList />;
}

/** The editor on its own route: loads the workout (or starts a new one) and guards unsaved work. */
function WorkoutEditScreen({ id }: { id: string }) {
  const tr = useT();
  const { t } = tr;
  const toast = useToast();
  const isNew = id === 'new';
  const [input, setInput] = useState<CustomWorkoutInput | null>(null);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const guard = useUnsavedGuard(dirty, '/admin/workouts');

  useEffect(() => {
    if (isNew) return;
    let alive = true;
    getCustomWorkout(id)
      .then((w) => {
        if (!alive) return;
        /*
         * Всё, что у строки есть, а не половина.
         *
         * Английские половины сюда не клались, а `onSave` пишет то, что пришло из редактора, —
         * то есть открыть переведённую тренировку и нажать «Сохранить» значило стереть перевод.
         * Молча: на экране его и не было видно, потому что он не загрузился.
         */
        setInput({
          title: w.title,
          titleEn: w.titleEn,
          description: w.description,
          descriptionEn: w.descriptionEn,
          authorSlug: w.authorSlug,
          structure: w.structure as CustomWorkoutStructure,
        });
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setFailed(true);
        toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.builderLoadError') });
      });
    return () => {
      alive = false;
    };
  }, [id, isNew, toast, tr]);

  const onSave = async (next: CustomWorkoutInput) => {
    setSaving(true);
    try {
      if (isNew) await createCustomWorkout(next);
      else await updateCustomWorkout(id, next);
      toast.show({ kind: 'success', title: t('app.builderSaved') });
      setDirty(false);
      guard.leave();
    } catch (e) {
      toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.builderSaveError') });
    } finally {
      setSaving(false);
    }
  };

  if (failed) return <Navigate to="/admin/workouts" replace />;

  return (
    <Screen
      header={
        <TopBar back={guard.attempt} title={isNew ? t('app.builderNew') : t('app.builderEdit')} />
      }
    >
      {!isNew && !input ? (
        <LoadingBlock />
      ) : (
        <WorkoutEditor
          {...(input
            ? {
                initialTitle: input.title,
                initialTitleEn: input.titleEn,
                initialDescription: input.description,
                initialDescriptionEn: input.descriptionEn,
                initialAuthorSlug: input.authorSlug,
                initialStructure: input.structure,
              }
            : {})}
          saving={saving}
          onSave={(next) => void onSave(next)}
          onCancel={guard.attempt}
          onDirtyChange={setDirty}
        />
      )}
      <Modal
        open={guard.asking}
        onClose={guard.stay}
        title={t('app.builderLeaveTitle')}
        description={t('app.builderLeaveBody')}
        confirmLabel={t('app.builderLeaveConfirm')}
        cancelLabel={t('app.builderLeaveStay')}
        danger
        onConfirm={guard.leave}
      />
    </Screen>
  );
}

function WorkoutList() {
  const tr = useT();
  const { t } = tr;
  const toast = useToast();
  const navigate = useNavigate();

  const [rows, setRows] = useState<CustomWorkoutSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
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
    refresh();
  }, [refresh]);

  /*
   * Search by title, on the list already loaded: the library is dozens of workouts, not thousands,
   * and a round trip per letter would only make the list flicker.
   */
  const shown = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    if (!q) return rows;
    return rows.filter((w) => w.title.toLocaleLowerCase().includes(q));
  }, [rows, query]);

  const confirmDelete = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    try {
      await deleteCustomWorkout(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.show({ kind: 'success', title: t('app.builderDeleted') });
    } catch (e) {
      toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.builderDeleteError') });
    }
  };

  return (
    <Screen
      header={<TopBar back title={t('app.builderScreenTitle')} />}
      footer={
        <Button
          size="lg"
          fullWidth
          icon={<Glyph size={16}>+</Glyph>}
          onClick={() => navigate('/admin/workouts/new')}
        >
          {t('app.builderNew')}
        </Button>
      }
    >
      {rows.length > 0 ? (
        <div className="pt-2">
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('app.builderSearch')}
            aria-label={t('app.builderSearch')}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      ) : null}
      {loading ? (
        <LoadingBlock />
      ) : rows.length === 0 ? (
        <EmptyState title={t('app.builderEmptyTitle')} description={t('app.builderEmptyBody')} />
      ) : shown.length === 0 ? (
        <p className="border-t border-border py-6 text-[15px] text-muted-2">
          {t('app.builderSearchEmpty')}
        </p>
      ) : (
        <ul className="flex flex-col py-2">
          {shown.map((w, i) => {
            const minutes = w.estSec ? Math.max(1, Math.round(w.estSec / 60)) : null;
            return (
              <li key={w.id} className="flex gap-3 border-t border-border py-4 lg:gap-4">
                <span className="numeral tabular w-6 shrink-0 pt-1 text-[13px] text-muted-2">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-lg">{w.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-muted">
                      {minutes ? (
                        <span className="tabular">{t('app.nodeDuration', { min: minutes })}</span>
                      ) : null}
                      {w.points ? (
                        <span className="tabular">· {t('app.nodePoints', { n: w.points })}</span>
                      ) : null}
                      {/* A live share link is the one white stamp on the row. */}
                      {w.shareToken ? (
                        <Badge tone="inverse" size="sm">
                          {t('app.builderShared')}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  {/* Row actions are words in small buttons; the pictures they used to carry said nothing the words did not. */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/admin/workouts/${w.id}`)}
                    >
                      {t('app.builderEditBtn')}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setShareFor(w)}>
                      {t('app.builderShareBtn')}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setAssignFor(w)}>
                      {t('app.builderAssignBtn')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(w.id)}>
                      {t('app.builderDeleteBtn')}
                    </Button>
                  </div>
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
  const tr = useT();
  const { t } = tr;
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
    } catch (e) {
      toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.builderShareError') });
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
      // Clipboard blocked (Telegram's webview often is): the link is on screen to copy by hand.
      toast.show({ kind: 'error', title: t('app.builderCopyFailed') });
    }
  };

  /*
   * Straight into a chat: Telegram's own share sheet inside the Mini App, a new tab elsewhere.
   * This is how a workout actually travels — the owner sends it to a person, she does not paste a
   * link into a field.
   */
  const sendTelegram = () => {
    if (!token) return;
    const url = telegramShareUrl(shareUrl(token), workout.title);
    if (!openExternal(url)) window.open(url, '_blank', 'noopener');
  };

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const shareNative = async () => {
    if (!token) return;
    try {
      await navigator.share({ title: workout.title, url: shareUrl(token) });
    } catch {
      /* Dismissed or refused — nothing was sent and there is nothing to say. */
    }
  };

  return (
    <Sheet open onClose={onClose} title={t('app.builderShareBtn')}>
      <div className="flex flex-col gap-3">
        <p className="text-[15px] text-muted">{t('app.builderShareHint')}</p>
        {token ? (
          <>
            {/* The link is shown as a read-only field — the same surface a field has — so it looks like something to select and copy. */}
            <div className="border border-border bg-surface-2 px-4 py-3 font-mono text-[13px] break-all select-all">
              {shareUrl(token)}
            </div>
            <Button variant="action" fullWidth onClick={sendTelegram}>
              {t('app.builderSendTelegram')}
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button className="flex-1" onClick={() => void copy()}>
                {t('app.builderCopyLink')}
              </Button>
              {canShare ? (
                <Button variant="secondary" className="flex-1" onClick={() => void shareNative()}>
                  {t('app.builderShareNative')}
                </Button>
              ) : null}
            </div>
            <Button variant="ghost" loading={busy} onClick={() => void toggle(false)}>
              {t('app.builderShareOff')}
            </Button>
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
  const tr = useT();
  const { t } = tr;
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [assignees, setAssignees] = useState<WorkoutAssigneeRow[]>([]);
  const [unassigning, setUnassigning] = useState<string | null>(null);

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
    } catch (e) {
      toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.builderAssignError') });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (target: string) => {
    try {
      await unassignCustomWorkout(workout.id, target);
      setAssignees((prev) => prev.filter((a) => a.email !== target));
      toast.show({ kind: 'success', title: t('app.builderUnassigned') });
    } catch (e) {
      toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.builderAssignError') });
    }
  };

  return (
    <Sheet open onClose={onClose} title={t('app.builderAssignBtn')}>
      <div className="flex flex-col gap-3">
        <p className="text-[15px] text-muted">{t('app.builderAssignHint')}</p>
        {/*
         * Поиск по имени вместо набора адреса: «мы обычно знаем их имена и хочется не писать его
         * буквально, потому что мы можем создать ошибку, а выбрать из списка имеющихся».
         * Печатать по-прежнему можно что угодно — тренировку иногда выдают человеку, которого в
         * базе ещё нет, и `PersonPicker` это оставляет.
         */}
        <div className="flex items-start gap-2">
          <PersonPicker
            className="flex-1"
            placeholder={t('app.builderEmailPlaceholder')}
            value={email}
            onChange={setEmail}
          />
          <Button loading={busy} onClick={() => void assign()}>
            {t('app.builderAssignAction')}
          </Button>
        </div>
        {assignees.length > 0 ? (
          <ul className="flex flex-col">
            {assignees.map((a, i) => (
              <li
                key={a.email}
                className="flex items-center gap-3 border-t border-border py-1.5 text-[15px]"
              >
                <span className="numeral tabular w-6 shrink-0 text-[13px] text-muted-2">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1 truncate">{a.email}</span>
                <IconButton
                  size="sm"
                  variant="ghost"
                  label={t('app.builderUnassign')}
                  icon="close"
                  className="-mr-2 text-muted-2 hover:text-danger"
                  onClick={() => setUnassigning(a.email)}
                />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <Modal
        open={unassigning !== null}
        onClose={() => setUnassigning(null)}
        title={t('app.builderUnassignTitle', { email: unassigning ?? '' })}
        description={t('app.builderUnassignBody')}
        confirmLabel={t('app.builderUnassign')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          const target = unassigning;
          setUnassigning(null);
          if (target) void remove(target);
        }}
      />
    </Sheet>
  );
}
