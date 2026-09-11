/**
 * The coach's courses (admins only): every course she has written, drafts included, and the button
 * that starts a new one.
 *
 * A course is created with nothing but an id, because writing one takes days and the editor has to
 * be able to save something almost empty. What it may not do is *publish* something almost empty —
 * see admin_publish_course() and the issues list in the editor.
 */
import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { createAdminCourse, listAdminCourses } from '@/lib/api/courseBuilder';
import type { AdminCourseRow } from '@/lib/api/types';
import { BootScreen } from '@/app/components/BootScreen';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { COURSE_ID_RE } from '@/app/features/admin/courses/ids';

export default function AdminCoursesScreen() {
  const { t } = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const admin = useIsAdmin();

  const [rows, setRows] = useState<AdminCourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newId, setNewId] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    listAdminCourses()
      .then(setRows)
      .catch(() => toast.show({ kind: 'error', title: t('app.courseLoadError') }))
      .finally(() => setLoading(false));
  }, [toast, t]);

  useEffect(() => {
    if (admin) refresh();
  }, [admin, refresh]);

  if (admin === null) return <BootScreen />;
  if (admin === false) return <Navigate to="/profile" replace />;

  const idError = newId !== '' && !COURSE_ID_RE.test(newId) ? t('app.courseIdInvalid') : undefined;

  const create = async () => {
    if (!COURSE_ID_RE.test(newId)) return;
    setBusy(true);
    try {
      const course = await createAdminCourse(newId, { sortOrder: rows.length + 10 });
      setCreating(false);
      setNewId('');
      navigate(`/admin/courses/${course.id}`);
    } catch {
      toast.show({ kind: 'error', title: t('app.courseCreateError') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={<TopBar back title={t('app.courseScreenTitle')} />}
      footer={
        <Button
          size="lg"
          fullWidth
          icon={<Icon name="plus" size={18} />}
          onClick={() => setCreating(true)}
        >
          {t('app.courseNew')}
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
          title={t('app.courseEmptyTitle')}
          description={t('app.courseEmptyBody')}
        />
      ) : (
        <ul className="flex flex-col py-2">
          {rows.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => navigate(`/admin/courses/${c.id}`)}
                className="flex w-full items-center gap-3 border-t border-border py-4 text-left transition-colors hover:bg-surface-2"
              >
                <span
                  aria-hidden="true"
                  className="size-10 shrink-0 rounded-tile"
                  style={{ background: c.tile }}
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-display text-lg">
                      {/* An unnamed draft falls back to its id — it still has to be findable. */}
                      {c.content.name?.ru?.trim() || c.slugId}
                    </span>
                    <Badge tone={c.status === 'published' ? 'success' : 'neutral'} size="sm">
                      {t(c.status === 'published' ? 'app.coursePublished' : 'app.courseDraft')}
                    </Badge>
                  </span>
                  <span className="mt-0.5 truncate font-mono text-xs text-muted">{c.slugId}</span>
                </span>
                <Icon name="chevron" size={18} className="shrink-0 text-muted" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title={t('app.courseNew')}
        description={t('app.courseNewBody')}
        confirmLabel={t('app.courseNew')}
        cancelLabel={t('common.cancel')}
        loading={busy}
        onConfirm={() => void create()}
      >
        <Input
          label={t('app.courseId')}
          placeholder="yoga_start"
          hint={t('app.courseIdHint')}
          error={idError}
          value={newId}
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          onChange={(e) => setNewId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
        />
      </Modal>
    </Screen>
  );
}
