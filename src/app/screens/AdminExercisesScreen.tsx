/**
 * The exercise library (admins only): search the catalogue, mark up a seeded movement, or author a
 * new one.
 *
 * This is the screen that makes a course of movements the product has never had — yoga, mobility,
 * anything Sergey films next — possible without a code change. A pose created here is immediately
 * available in the workout builder's picker.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import {
  createExercise,
  deleteExercise,
  listExerciseCatalog,
  updateExercise,
} from '@/lib/api/exercises';
import type { ExerciseCatalogRow, ExerciseDraft } from '@/lib/api/types';
import { BootScreen } from '@/app/components/BootScreen';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { SEARCH_DEBOUNCE_MS } from '@/app/features/admin/model';
import { useDebounced } from '@/app/features/admin/useDebounced';
import { useCatalogue } from '@/app/store/catalogue';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { ExerciseEditor } from '@/app/features/admin/exercises/ExerciseEditor';

type Filter = 'all' | 'custom' | 'video';
type EditTarget = ExerciseCatalogRow | 'new' | null;

export default function AdminExercisesScreen() {
  const { t } = useT();
  const toast = useToast();
  const admin = useIsAdmin();

  const courses = useCatalogue((s) => s.courses);
  const [rows, setRows] = useState<ExerciseCatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const search = useDebounced(query, SEARCH_DEBOUNCE_MS);
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<EditTarget>(null);
  const [saving, setSaving] = useState(false);
  const [deleteRow, setDeleteRow] = useState<ExerciseCatalogRow | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    listExerciseCatalog()
      .then(setRows)
      .catch(() => toast.show({ kind: 'error', title: t('app.exLoadError') }))
      .finally(() => setLoading(false));
  }, [toast, t]);

  useEffect(() => {
    if (admin) refresh();
  }, [admin, refresh]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((e) => {
      if (filter === 'custom' && !e.isCustom) return false;
      if (filter === 'video' && !e.videoRu) return false;
      if (!q) return true;
      return (
        e.nameRu.toLowerCase().includes(q) ||
        e.id.includes(q) ||
        e.tags.some((tag) => tag.includes(q))
      );
    });
  }, [rows, search, filter]);

  if (admin === null) return <BootScreen />;
  if (admin === false) return <Navigate to="/profile" replace />;

  const onSave = async (draft: ExerciseDraft) => {
    setSaving(true);
    try {
      const saved =
        editing === 'new' ? await createExercise(draft) : await updateExercise(draft.id, draft);
      setRows((prev) => {
        const without = prev.filter((r) => r.id !== saved.id);
        return [...without, saved].sort((a, b) => a.nameRu.localeCompare(b.nameRu, 'ru'));
      });
      setEditing(null);
      toast.show({ kind: 'success', title: t('app.exSaved') });
    } catch {
      toast.show({ kind: 'error', title: t('app.exSaveError') });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    const row = deleteRow;
    setDeleteRow(null);
    if (!row) return;
    try {
      await deleteExercise(row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch {
      toast.show({ kind: 'error', title: t('app.exDeleteError') });
    }
  };

  if (editing) {
    const isNew = editing === 'new';
    return (
      <Screen
        header={
          <TopBar back={() => setEditing(null)} title={isNew ? t('app.exNew') : t('app.exEdit')} />
        }
      >
        <ExerciseEditor
          initial={isNew ? null : editing}
          courseIds={courses.map((c) => c.id)}
          saving={saving}
          onSave={(d) => void onSave(d)}
          onCancel={() => setEditing(null)}
        />
      </Screen>
    );
  }

  return (
    <Screen
      header={<TopBar back title={t('app.exScreenTitle')} />}
      footer={
        <Button
          size="lg"
          fullWidth
          icon={<Glyph size={16}>+</Glyph>}
          onClick={() => setEditing('new')}
        >
          {t('app.exNew')}
        </Button>
      }
    >
      <div className="flex flex-col gap-3 py-4">
        <Input
          type="search"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-label={t('app.exSearch')}
          placeholder={t('app.exSearch')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <SegmentedControl<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('app.exFilterAll') },
            { value: 'custom', label: t('app.exFilterCustom') },
            { value: 'video', label: t('app.exFilterVideo') },
          ]}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title={t('app.exNoMatches')} />
      ) : (
        <ul className="flex flex-col">
          {filtered.map((e, i) => (
            <li key={e.id} className="flex items-center gap-3 border-t border-border py-3 lg:gap-4">
              <span className="numeral tabular w-6 shrink-0 text-[13px] text-muted-2">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[15px] font-medium">{e.nameRu}</span>
                  {/* The coach's own movement is the one white stamp in the row. */}
                  {e.isCustom ? (
                    <Badge tone="inverse" size="sm">
                      {t('app.exCustomBadge')}
                    </Badge>
                  ) : null}
                  {/* A word, not a play icon: the row is read, not watched. */}
                  {e.videoRu ? (
                    <Badge tone="neutral" size="sm">
                      {t('app.exHasVideo')}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-0.5 truncate font-mono text-xs text-muted">{e.id}</div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setEditing(e)}>
                {t('app.builderEditBtn')}
              </Button>
              {e.isCustom ? (
                <Button size="sm" variant="ghost" onClick={() => setDeleteRow(e)}>
                  {t('app.builderDeleteBtn')}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={deleteRow !== null}
        onClose={() => setDeleteRow(null)}
        title={t('app.exDeleteTitle')}
        description={t('app.exDeleteBody', { name: deleteRow?.nameRu ?? '' })}
        confirmLabel={t('app.builderDeleteBtn')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => void confirmDelete()}
      />
    </Screen>
  );
}
