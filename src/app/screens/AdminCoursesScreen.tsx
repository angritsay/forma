/**
 * The coach's courses (admins): every course she has written, drafts included, and the button
 * that starts a new one.
 *
 * The same screen is a creator's «Мои курсы» at `/creator/courses` (0065, `CreatorCoursesScreen`):
 * only their own courses, a new one created as theirs, and no catalogue order to set — that is the
 * owner's. Courses a creator sent for review carry «Ждёт проверки» on both sides.
 *
 * A course is created with nothing but an id, because writing one takes days and the editor has to
 * be able to save something almost empty. What it may not do is *publish* something almost empty —
 * see admin_publish_course() and the issues list in the editor.
 */
import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import { createAdminCourse, listAdminCourses, listCreatorCourses } from '@/lib/api/courseBuilder';
import type { AdminCourseRow } from '@/lib/api/types';
import { courseTileVars } from '@/lib/ui/tile';
import { LoadingBlock } from '@/app/components/LoadingBlock';
import { TopBar } from '@/app/components/TopBar';
import { adminErrorTitle } from '@/app/features/admin/adminError';
import { useT } from '@/app/hooks/useT';
import { AdminBoot } from '@/app/features/admin/AdminBoot';
import { AdminLoadError } from '@/app/features/admin/AdminLoadError';
import { builderErrorKey, coursesBase } from '@/app/features/admin/courses/builderScope';
import { CourseStateBadge } from '@/app/features/admin/courses/CourseStateBadge';
import { COURSE_ID_RE } from '@/app/features/admin/courses/ids';
import { useBuilderScope, type BuilderMode } from '@/app/features/admin/courses/useBuilderScope';

export default function AdminCoursesScreen() {
  return <CourseListScreen mode="admin" />;
}

export function CourseListScreen({ mode }: { mode: BuilderMode }) {
  const tr = useT();
  const { t } = tr;
  const toast = useToast();
  const navigate = useNavigate();
  const scope = useBuilderScope(mode);
  const base = scope ? coursesBase(scope) : '/';

  const [rows, setRows] = useState<AdminCourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  /** A failed read is said as one, not as «no courses yet». */
  const [loadError, setLoadError] = useState<unknown>(null);
  const [creating, setCreating] = useState(false);
  const [newId, setNewId] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    if (!scope) return;
    setLoading(true);
    setLoadError(null);
    (scope.kind === 'creator' ? listCreatorCourses(scope.creatorId) : listAdminCourses())
      .then(setRows)
      .catch((e: unknown) => setLoadError(e))
      .finally(() => setLoading(false));
  }, [scope]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (scope === undefined) {
    return mode === 'admin' ? (
      <AdminBoot />
    ) : (
      <Screen header={<TopBar back="/creator" title={t('app.creatorCoursesTitle')} />}>
        <LoadingBlock />
      </Screen>
    );
  }
  if (scope === null) return <Navigate to={mode === 'admin' ? '/' : '/creator'} replace />;
  const creatorPaused = scope.kind === 'creator' && !scope.open;

  const idError = newId !== '' && !COURSE_ID_RE.test(newId) ? t('app.courseIdInvalid') : undefined;

  const create = async () => {
    if (!COURSE_ID_RE.test(newId)) return;
    setBusy(true);
    try {
      // The catalogue order is the owner's: a creator's course is created without one (0065).
      const course =
        scope.kind === 'creator'
          ? await createAdminCourse(newId, {}, scope.creatorId)
          : await createAdminCourse(newId, { sortOrder: rows.length + 10 });
      setCreating(false);
      setNewId('');
      navigate(`${base}/${course.id}`);
    } catch (e) {
      const key = builderErrorKey(e);
      toast.show({
        kind: 'error',
        title: key ? t(key) : adminErrorTitle(tr, e, 'app.courseCreateError'),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={
        <TopBar
          back={scope.kind === 'creator' ? '/creator' : true}
          title={t(scope.kind === 'creator' ? 'app.creatorCoursesTitle' : 'app.courseScreenTitle')}
        />
      }
      footer={
        creatorPaused ? undefined : (
          <Button
            size="lg"
            fullWidth
            icon={<Glyph size={16}>+</Glyph>}
            onClick={() => setCreating(true)}
          >
            {t('app.courseNew')}
          </Button>
        )
      }
    >
      {scope.kind === 'creator' ? (
        <p className="pt-4 text-[14px] leading-snug text-muted">
          {t(creatorPaused ? 'app.creatorCoursesPaused' : 'app.creatorCoursesIntro')}
        </p>
      ) : null}
      {loading ? (
        <LoadingBlock />
      ) : loadError !== null ? (
        <AdminLoadError error={loadError} onRetry={refresh} title="app.courseLoadError" />
      ) : rows.length === 0 ? (
        <EmptyState
          title={t('app.courseEmptyTitle')}
          description={t(
            scope.kind === 'creator' ? 'app.creatorCoursesEmptyBody' : 'app.courseEmptyBody',
          )}
        />
      ) : (
        <ul className="flex flex-col py-2">
          {rows.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => navigate(`${base}/${c.id}`)}
                className="flex w-full items-center gap-3 border-t border-border py-4 text-left transition-colors duration-150 ease-(--ease-out) hover:bg-surface-2 active:bg-surface-3"
              >
                <span className="numeral tabular w-6 shrink-0 text-[13px] text-muted-2">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {/*
                 * The swatch is the course's cover in miniature — `.hero-art` painted with its
                 * tile through courseTileVars() — so the list shows the one colour each course
                 * will bring to the screen, and the interface around it stays black and white.
                 */}
                <span
                  aria-hidden="true"
                  className="hero-art size-10 shrink-0 rounded-inner"
                  style={courseTileVars(c.tile)}
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-display text-lg">
                      {/* An unnamed draft falls back to its id — it still has to be findable. */}
                      {c.content.name?.ru?.trim() || c.slugId}
                    </span>
                    <CourseStateBadge course={c} />
                  </span>
                  <span className="mt-0.5 truncate font-mono text-xs text-muted">{c.slugId}</span>
                </span>
                <Glyph size={16} className="shrink-0 text-muted-2">
                  ›
                </Glyph>
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
