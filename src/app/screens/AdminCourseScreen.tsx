/**
 * One course, end to end (admins only): what it is, what its days are, and whether it is ready to
 * publish.
 *
 * The three tabs are the three questions in order — describe it, build it, ship it. The publish tab
 * is not a button on its own: it runs the same `CourseSchema` the compiled courses are validated
 * against and lists what is still missing, so "why can't I publish?" is answered on the screen
 * rather than by a Postgres error.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import {
  createCourseDay,
  deleteAdminCourse,
  deleteCourseDay,
  getAdminCourse,
  publishAdminCourse,
  unpublishAdminCourse,
  updateAdminCourse,
  updateCourseDay,
} from '@/lib/api/courseBuilder';
import {
  createCustomWorkout,
  getCustomWorkout,
  updateCustomWorkout,
  type CustomWorkoutInput,
} from '@/lib/api/customWorkouts';
import type {
  AdminCourseBundle,
  AdminCourseDayPatch,
  AdminCourseDayRow,
  AdminCoursePatch,
  CustomWorkoutRow,
} from '@/lib/api/types';
import { draftToCourse } from '@/lib/courses/draft';
import type { CustomWorkoutStructure } from '@/lib/training/customWorkout';
import { BootScreen } from '@/app/components/BootScreen';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { useIsAdmin } from '@/app/features/admin/useIsAdmin';
import { CourseMetaEditor } from '@/app/features/admin/courses/CourseMetaEditor';
import { DayEditor } from '@/app/features/admin/courses/DayEditor';
import { DayList } from '@/app/features/admin/courses/DayList';
import { nextDaySlot, nodeIdFor } from '@/app/features/admin/courses/ids';
import { useAutosave } from '@/app/features/admin/courses/useAutosave';
import { WorkoutEditor } from '@/app/features/admin/workoutBuilder/WorkoutEditor';

type Tab = 'meta' | 'days' | 'publish';
/** The workout builder, opened either for a brand-new workout or on an existing one. */
type WorkoutTarget = { dayId: string; existing: CustomWorkoutRow | null } | null;

export default function AdminCourseScreen() {
  const { id = '' } = useParams();
  const { t } = useT();
  const toast = useToast();
  const admin = useIsAdmin();

  const [bundle, setBundle] = useState<AdminCourseBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('meta');
  const [openDayId, setOpenDayId] = useState<string | null>(null);
  const [workoutFor, setWorkoutFor] = useState<WorkoutTarget>(null);
  const [savingWorkout, setSavingWorkout] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getAdminCourse(id)
      .then(setBundle)
      .catch(() => toast.show({ kind: 'error', title: t('app.courseLoadError') }))
      .finally(() => setLoading(false));
  }, [id, toast, t]);

  useEffect(() => {
    if (admin) load();
  }, [admin, load]);

  const saveCourse = useCallback((patch: AdminCoursePatch) => updateAdminCourse(id, patch), [id]);
  const courseSave = useAutosave<AdminCoursePatch>(saveCourse);

  // The open day's patches go to its own row; the hook is keyed by the day so switching days
  // flushes the previous one's pending write rather than sending it to the new day.
  const saveDay = useCallback(
    (patch: AdminCourseDayPatch) =>
      openDayId ? updateCourseDay(openDayId, patch) : Promise.resolve(),
    [openDayId],
  );
  const daySave = useAutosave<AdminCourseDayPatch>(saveDay);

  const assembled = useMemo(() => {
    if (!bundle) return null;
    const byId = new Map(bundle.workouts.map((w) => [w.id, w]));
    return draftToCourse(
      { ...bundle.course, content: bundle.course.content },
      bundle.days.map((d) => ({
        nodeId: d.nodeId,
        week: d.week,
        day: d.day,
        kind: d.kind,
        workoutShortId: d.customWorkoutId ? (byId.get(d.customWorkoutId)?.shortId ?? null) : null,
        deload: d.deload,
        stepsGoal: d.stepsGoal,
        sortOrder: d.sortOrder,
        content: d.content,
      })),
      bundle.workouts.map((w) => ({
        shortId: w.shortId,
        title: w.title,
        description: w.description,
        points: w.points,
        structure: (w.structure ?? { sections: [] }) as CustomWorkoutStructure,
      })),
    );
  }, [bundle]);

  if (admin === null) return <BootScreen />;
  if (admin === false) return <Navigate to="/profile" replace />;

  if (loading || !bundle) {
    return (
      <Screen header={<TopBar back="/admin/courses" />}>
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      </Screen>
    );
  }

  const { course, days, workouts } = bundle;
  const openDay = days.find((d) => d.id === openDayId) ?? null;

  /** Apply a patch locally at once, and schedule the write. */
  const patchCourse = (patch: AdminCoursePatch) => {
    setBundle((b) => (b ? { ...b, course: { ...b.course, ...patch } } : b));
    courseSave.push(patch);
  };

  const patchDay = (dayId: string, patch: AdminCourseDayPatch) => {
    setBundle((b) =>
      b ? { ...b, days: b.days.map((d) => (d.id === dayId ? { ...d, ...patch } : d)) } : b,
    );
    daySave.push(patch);
  };

  const addDay = async () => {
    const { week, day } = nextDaySlot(days);
    try {
      const created = await createCourseDay(course.id, {
        nodeId: nodeIdFor(week, day),
        week,
        day,
        kind: 'workout',
        sortOrder: days.length,
        content: { title: { ru: t('app.dayDefaultTitle', { n: days.length + 1 }) }, body: [] },
      });
      setBundle((b) => (b ? { ...b, days: [...b.days, created] } : b));
      setOpenDayId(created.id);
    } catch {
      toast.show({ kind: 'error', title: t('app.dayCreateError') });
    }
  };

  const removeDay = async (dayId: string) => {
    setOpenDayId(null);
    try {
      await deleteCourseDay(dayId);
      setBundle((b) => (b ? { ...b, days: b.days.filter((d) => d.id !== dayId) } : b));
    } catch {
      toast.show({ kind: 'error', title: t('app.dayDeleteError') });
    }
  };

  const saveWorkout = async (input: CustomWorkoutInput) => {
    if (!workoutFor) return;
    setSavingWorkout(true);
    try {
      const saved = workoutFor.existing
        ? await updateCustomWorkout(workoutFor.existing.id, input)
        : await createCustomWorkout(input);
      // A brand-new workout has to be attached to the day that asked for it.
      if (!workoutFor.existing) {
        await updateCourseDay(workoutFor.dayId, { customWorkoutId: saved.id });
      }
      setBundle((b) =>
        b
          ? {
              ...b,
              days: b.days.map((d) =>
                d.id === workoutFor.dayId ? { ...d, customWorkoutId: saved.id } : d,
              ),
              workouts: [...b.workouts.filter((w) => w.id !== saved.id), saved],
            }
          : b,
      );
      setWorkoutFor(null);
    } catch {
      toast.show({ kind: 'error', title: t('app.builderSaveError') });
    } finally {
      setSavingWorkout(false);
    }
  };

  const openWorkoutEditor = async (dayId: string, workoutId: string | null) => {
    if (!workoutId) {
      setWorkoutFor({ dayId, existing: null });
      return;
    }
    try {
      setWorkoutFor({ dayId, existing: await getCustomWorkout(workoutId) });
    } catch {
      toast.show({ kind: 'error', title: t('app.builderLoadError') });
    }
  };

  const publish = async () => {
    courseSave.flush();
    daySave.flush();
    setPublishing(true);
    try {
      await publishAdminCourse(course.id);
      setBundle((b) => (b ? { ...b, course: { ...b.course, status: 'published' } } : b));
      toast.show({ kind: 'success', title: t('app.coursePublishedToast') });
    } catch {
      toast.show({ kind: 'error', title: t('app.coursePublishError') });
    } finally {
      setPublishing(false);
    }
  };

  const unpublish = async () => {
    setPublishing(true);
    try {
      await unpublishAdminCourse(course.id);
      setBundle((b) => (b ? { ...b, course: { ...b.course, status: 'draft' } } : b));
    } catch {
      toast.show({ kind: 'error', title: t('app.coursePublishError') });
    } finally {
      setPublishing(false);
    }
  };

  // --- the workout builder, opened from a day ---------------------------------
  if (workoutFor) {
    const existing = workoutFor.existing;
    return (
      <Screen
        header={
          <TopBar
            back={() => setWorkoutFor(null)}
            title={existing ? t('app.builderEdit') : t('app.builderNew')}
          />
        }
      >
        <WorkoutEditor
          {...(existing
            ? {
                initialTitle: existing.title,
                initialDescription: existing.description,
                initialStructure: (existing.structure ?? {
                  sections: [],
                }) as CustomWorkoutStructure,
              }
            : {})}
          saving={savingWorkout}
          onSave={(input) => void saveWorkout(input)}
          onCancel={() => setWorkoutFor(null)}
        />
      </Screen>
    );
  }

  // --- one day ----------------------------------------------------------------
  if (openDay) {
    const workout = workouts.find((w) => w.id === openDay.customWorkoutId) ?? null;
    return (
      <Screen
        header={
          <TopBar
            back={() => {
              daySave.flush();
              setOpenDayId(null);
            }}
            title={openDay.content.title?.ru || openDay.nodeId}
          />
        }
      >
        <DayEditor
          courseSlugId={course.slugId}
          day={openDay}
          workout={workout}
          onPatch={(patch) => patchDay(openDay.id, patch)}
          onBuildNewWorkout={() => setWorkoutFor({ dayId: openDay.id, existing: null })}
          onEditWorkout={(workoutId) => void openWorkoutEditor(openDay.id, workoutId)}
          onDelete={() => void removeDay(openDay.id)}
        />
      </Screen>
    );
  }

  // --- the course -------------------------------------------------------------
  const issues = assembled?.issues ?? [];
  const published = course.status === 'published';

  return (
    <Screen
      header={
        <TopBar
          back="/admin/courses"
          title={course.content.name?.ru || course.slugId}
          right={
            /* Published is the one white stamp; a draft is an outline. */
            <Badge tone={published ? 'inverse' : 'neutral'} size="sm">
              {t(published ? 'app.coursePublished' : 'app.courseDraft')}
            </Badge>
          }
        />
      }
      footer={
        tab === 'days' ? (
          <Button
            size="lg"
            fullWidth
            icon={<Glyph size={16}>+</Glyph>}
            onClick={() => void addDay()}
          >
            {t('app.dayAdd')}
          </Button>
        ) : undefined
      }
    >
      <div className="pt-4">
        <SegmentedControl<Tab>
          fullWidth
          value={tab}
          onChange={setTab}
          options={[
            { value: 'meta', label: t('app.courseTabMeta') },
            { value: 'days', label: t('app.courseTabDays') },
            { value: 'publish', label: t('app.courseTabPublish') },
          ]}
        />
      </div>

      {tab === 'meta' ? <CourseMetaEditor course={course} onPatch={patchCourse} /> : null}

      {tab === 'days' ? (
        days.length === 0 ? (
          <EmptyState title={t('app.dayEmptyTitle')} description={t('app.dayEmptyBody')} />
        ) : (
          <DayList
            days={days}
            workouts={workouts}
            onOpen={(d: AdminCourseDayRow) => setOpenDayId(d.id)}
          />
        )
      ) : null}

      {tab === 'publish' ? (
        <div className="flex flex-col gap-5 py-4">
          {/*
           * The verdict is a ruled line, not a tinted callout: the semantic colour sits on the
           * words alone, and the things still missing follow as a numbered list — 01, 02 — in
           * `CourseSchema`'s own wording, each on its own hairline.
           */}
          {issues.length === 0 ? (
            <p className="eyebrow-sentence border-y border-border py-3 text-success">
              {t('app.coursePublishReady')}
            </p>
          ) : (
            <div className="flex flex-col border-t border-border">
              <p className="eyebrow-sentence py-3 text-warning">{t('app.coursePublishBlocked')}</p>
              <ul className="flex flex-col">
                {issues.map((issue, i) => (
                  <li
                    key={issue}
                    className="flex gap-3 border-t border-border py-2.5 text-[15px] text-muted last:border-b"
                  >
                    <span className="numeral tabular w-6 shrink-0 text-[13px] text-muted-2">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[15px] text-muted">{t('app.coursePublishExplain')}</p>
          {/* Publishing is instant in the app and not on the website; say so where it is decided. */}
          <p className="text-[15px] text-muted">{t('app.coursePublishSite')}</p>

          {/* Publish is the one white button on this tab; taking it back is a secondary. */}
          {published ? (
            <Button
              variant="secondary"
              size="lg"
              loading={publishing}
              onClick={() => void unpublish()}
            >
              {t('app.courseUnpublish')}
            </Button>
          ) : (
            <Button
              size="lg"
              loading={publishing}
              disabled={issues.length > 0}
              onClick={() => void publish()}
            >
              {t('app.coursePublish')}
            </Button>
          )}

          {!published && days.length === 0 ? (
            <Button
              variant="danger"
              size="sm"
              className="self-start"
              onClick={() => {
                void deleteAdminCourse(course.id).then(() => {
                  window.location.hash = '#/admin/courses';
                });
              }}
            >
              {t('app.courseDelete')}
            </Button>
          ) : null}
        </div>
      ) : null}
    </Screen>
  );
}
