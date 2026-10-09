/**
 * One course, end to end: what it is, what its days are, and whether it is ready to publish.
 *
 * Two scopes (`builderScope.ts`, 0065). The owner at `/admin/courses/:id` edits any course and
 * publishes. A creator at `/creator/courses/:id` (`CreatorCourseScreen`) edits only an editable
 * draft of their own, uploads under `creators/<id>/`, builds workouts that are theirs, and sends
 * the draft for review instead of publishing; the server holds every one of those lines again.
 *
 * The three tabs are the three questions in order — describe it, build it, ship it. The publish tab
 * is not a button on its own: it runs the same `CourseSchema` the compiled courses are validated
 * against and lists what is still missing, so "why can't I publish?" is answered on the screen
 * rather than by a Postgres error.
 */
import { clsx } from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useToast } from '@/components/ui/Toast';
import {
  createCourseDay,
  deleteAdminCourse,
  deleteCourseDay,
  getAdminCourse,
  publishAdminCourse,
  requestCourseReview,
  returnCourseToCreator,
  unpublishAdminCourse,
  withdrawCourseReview,
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
import { isCompiledCourse } from '@/content/catalogue';
import { formatDate } from '@/i18n/index';
import { draftToCourse } from '@/lib/courses/draft';
import type { CustomWorkoutStructure } from '@/lib/training/customWorkout';
import { LoadingBlock } from '@/app/components/LoadingBlock';
import { TopBar } from '@/app/components/TopBar';
import { adminErrorTitle } from '@/app/features/admin/adminError';
import { useT } from '@/app/hooks/useT';
import { AdminBoot } from '@/app/features/admin/AdminBoot';
import {
  canEditCourse,
  builderErrorKey,
  coursesBase,
  creatorLock,
  inReview,
  mediaPrefix,
} from '@/app/features/admin/courses/builderScope';
import { CourseStateBadge } from '@/app/features/admin/courses/CourseStateBadge';
import { useBuilderScope, type BuilderMode } from '@/app/features/admin/courses/useBuilderScope';
import { LangTabs } from '@/app/features/admin/LangTabs';
import { CompiledCourseNotice } from '@/app/features/admin/courses/CompiledCourseNotice';
import { CourseMetaEditor } from '@/app/features/admin/courses/CourseMetaEditor';
import { DayEditor } from '@/app/features/admin/courses/DayEditor';
import { DayList } from '@/app/features/admin/courses/DayList';
import { nextDaySlot, nodeIdFor } from '@/app/features/admin/courses/ids';
import { canPublish } from '@/app/features/admin/courses/publishRule';
import { combineSaveStates, SaveStatus } from '@/app/features/admin/courses/SaveStatus';
import { useAutosave } from '@/app/features/admin/courses/useAutosave';
import { AdminLoadError } from '@/app/features/admin/AdminLoadError';
import { WorkoutEditor } from '@/app/features/admin/workoutBuilder/WorkoutEditor';

type Tab = 'meta' | 'days' | 'publish';
/** The workout builder, opened either for a brand-new workout or on an existing one. */
type WorkoutTarget = { dayId: string; existing: CustomWorkoutRow | null } | null;
/** The three irreversible-looking actions on this screen, each asked about before it runs. */
type Confirm =
  { kind: 'unpublish' } | { kind: 'deleteCourse' } | { kind: 'deleteDay'; dayId: string };

export default function AdminCourseScreen() {
  return <CourseEditorScreen mode="admin" />;
}

export function CourseEditorScreen({ mode }: { mode: BuilderMode }) {
  const { id = '' } = useParams();
  const tr = useT();
  const { t, locale } = tr;
  const toast = useToast();
  const scope = useBuilderScope(mode);
  const navigate = useNavigate();
  const base = scope
    ? coursesBase(scope)
    : mode === 'admin'
      ? '/admin/courses'
      : '/creator/courses';

  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [bundle, setBundle] = useState<AdminCourseBundle | null>(null);
  const [loading, setLoading] = useState(true);
  /** The last load's failure; the screen shows it with a retry instead of loading forever. */
  const [loadError, setLoadError] = useState<unknown>(null);
  const [tab, setTab] = useState<Tab>('meta');
  const [openDayId, setOpenDayId] = useState<string | null>(null);
  const [workoutFor, setWorkoutFor] = useState<WorkoutTarget>(null);
  const [savingWorkout, setSavingWorkout] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    getAdminCourse(id)
      .then(setBundle)
      .catch((e: unknown) => setLoadError(e))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (scope) load();
  }, [scope, load]);

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

  if (scope === undefined && mode === 'admin') return <AdminBoot />;
  if (scope === null) return <Navigate to={mode === 'admin' ? '/' : '/creator'} replace />;

  if (!scope || loading || !bundle) {
    return (
      <Screen header={<TopBar back={base} />}>
        {!loading && loadError !== null ? (
          <AdminLoadError
            error={loadError}
            onRetry={load}
            title="app.courseLoadError"
            notFound={{
              title: 'app.courseNotFoundTitle',
              body: 'app.courseNotFoundBody',
              back: base,
            }}
          />
        ) : (
          <LoadingBlock />
        )}
      </Screen>
    );
  }

  const { course, days, workouts } = bundle;
  const openDay = days.find((d) => d.id === openDayId) ?? null;
  /*
   * A compiled course's file wins over this draft (see CompiledCourseNotice), so publishing it
   * would change nothing for anyone — the button stays off rather than pretend (`canPublish`) —
   * and neither would an edit. The screen is read-only for it: the fields are disabled, no day is
   * added or removed, and nothing is autosaved. The notice stays and says why.
   */
  const compiled = isCompiledCourse(course.slugId);
  /*
   * A creator's course is read-only to them unless it is an editable draft of theirs: once sent
   * for review, once ever published, or while they are paused (0065). Same mechanism as a
   * compiled course — disabled fieldsets, no autosave — and a line on the screen says why.
   */
  const readOnly = compiled || !canEditCourse(scope, course);
  const lock = creatorLock(scope, course);
  const creatorId = scope.kind === 'creator' ? scope.creatorId : null;
  const prefix = mediaPrefix(scope);

  /** Apply a patch locally at once, and schedule the write. */
  const patchCourse = (patch: AdminCoursePatch) => {
    if (readOnly) return;
    setBundle((b) => (b ? { ...b, course: { ...b.course, ...patch } } : b));
    courseSave.push(patch);
  };

  const patchDay = (dayId: string, patch: AdminCourseDayPatch) => {
    if (readOnly) return;
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
    } catch (e) {
      toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.dayCreateError') });
    }
  };

  const removeDay = async (dayId: string) => {
    setOpenDayId(null);
    try {
      await deleteCourseDay(dayId);
      setBundle((b) => (b ? { ...b, days: b.days.filter((d) => d.id !== dayId) } : b));
      toast.show({ kind: 'success', title: t('app.dayDeleted') });
    } catch (e) {
      toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.dayDeleteError') });
    }
  };

  const saveWorkout = async (input: CustomWorkoutInput) => {
    if (!workoutFor) return;
    setSavingWorkout(true);
    try {
      const saved = workoutFor.existing
        ? await updateCustomWorkout(workoutFor.existing.id, input)
        : await createCustomWorkout({ ...input, creatorId });
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
    } catch (e) {
      toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.builderSaveError') });
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
    } catch (e) {
      toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.builderLoadError') });
    }
  };

  const publish = async () => {
    setPublishing(true);
    /*
     * Publish what is saved, and only once it is: the last edits are sent and waited for, and a
     * failed one stops the publish — otherwise the course would go out without them while the
     * screen showed them as done.
     */
    const [courseSaved, daySaved] = await Promise.all([courseSave.flush(), daySave.flush()]);
    if (!courseSaved || !daySaved) {
      toast.show({ kind: 'error', title: t('app.courseSaveBeforePublish') });
      setPublishing(false);
      return;
    }
    try {
      await publishAdminCourse(course.id);
      // Publishing ends a creator's review too (0065).
      setBundle((b) =>
        b
          ? {
              ...b,
              course: {
                ...b.course,
                status: 'published',
                publishedAt: b.course.publishedAt ?? new Date().toISOString(),
                reviewRequestedAt: null,
              },
            }
          : b,
      );
      toast.show({ kind: 'success', title: t('app.coursePublishedToast') });
    } catch (e) {
      toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.coursePublishError') });
    } finally {
      setPublishing(false);
    }
  };

  const unpublish = async () => {
    setPublishing(true);
    try {
      await unpublishAdminCourse(course.id);
      setBundle((b) => (b ? { ...b, course: { ...b.course, status: 'draft' } } : b));
      toast.show({ kind: 'success', title: t('app.courseUnpublished') });
    } catch (e) {
      toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.coursePublishError') });
    } finally {
      setPublishing(false);
    }
  };

  const removeCourse = async () => {
    try {
      await deleteAdminCourse(course.id);
      toast.show({ kind: 'success', title: t('app.courseDeleted') });
      navigate(base, { replace: true });
    } catch (e) {
      toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.courseDeleteError') });
    }
  };

  /*
   * The creator's «Отправить на проверку»: what is saved goes, as with a publish, and then the
   * course waits for the owner — read-only to its creator until she publishes it or hands it back.
   */
  const sendForReview = async () => {
    setPublishing(true);
    const [courseSaved, daySaved] = await Promise.all([courseSave.flush(), daySave.flush()]);
    if (!courseSaved || !daySaved) {
      toast.show({ kind: 'error', title: t('app.courseSaveBeforePublish') });
      setPublishing(false);
      return;
    }
    try {
      await requestCourseReview(course.id);
      setBundle((b) =>
        b ? { ...b, course: { ...b.course, reviewRequestedAt: new Date().toISOString() } } : b,
      );
      toast.show({ kind: 'success', title: t('app.courseReviewSent') });
    } catch (e) {
      const key = builderErrorKey(e);
      toast.show({
        kind: 'error',
        title: key ? t(key) : adminErrorTitle(tr, e, 'app.courseReviewError'),
      });
    } finally {
      setPublishing(false);
    }
  };

  /** The creator takes it back to edit, or the owner hands it back: either way, not waiting. */
  const endReview = async () => {
    setPublishing(true);
    try {
      if (scope.kind === 'creator') await withdrawCourseReview(course.id);
      else await returnCourseToCreator(course.id);
      setBundle((b) => (b ? { ...b, course: { ...b.course, reviewRequestedAt: null } } : b));
      toast.show({
        kind: 'success',
        title: t(scope.kind === 'creator' ? 'app.courseReviewWithdrawn' : 'app.courseReturned'),
      });
    } catch (e) {
      toast.show({ kind: 'error', title: adminErrorTitle(tr, e, 'app.courseReviewError') });
    } finally {
      setPublishing(false);
    }
  };

  const runConfirm = () => {
    const c = confirm;
    setConfirm(null);
    if (!c) return;
    if (c.kind === 'unpublish') void unpublish();
    else if (c.kind === 'deleteCourse') void removeCourse();
    else void removeDay(c.dayId);
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
                initialTitleEn: existing.titleEn,
                initialDescription: existing.description,
                initialDescriptionEn: existing.descriptionEn,
                initialStructure: (existing.structure ?? {
                  sections: [],
                }) as CustomWorkoutStructure,
              }
            : {})}
          withAuthor={scope.kind === 'admin'}
          saving={savingWorkout}
          onSave={(input) => void saveWorkout(input)}
          onCancel={() => setWorkoutFor(null)}
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
          back={base}
          title={course.content.name?.ru || course.slugId}
          right={<CourseStateBadge course={course} />}
        />
      }
      footer={
        tab === 'days' && !readOnly ? (
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

      {/* Whether the screen is what the database has — the editor has no Save button. */}
      <SaveStatus
        state={combineSaveStates(courseSave.state, daySave.state)}
        onRetry={() => {
          courseSave.retry();
          daySave.retry();
        }}
      />

      {/* On every tab, not only «Публикация»: the edits the notice is about happen on the other two. */}
      <CompiledCourseNotice slugId={course.slugId} />

      {/* Why a creator cannot edit their own course right now (0065). */}
      {lock ? (
        <p className="border-b border-border py-3 text-[13px] leading-[1.3] text-muted">
          {t(
            lock === 'published'
              ? 'app.courseLockPublished'
              : lock === 'review'
                ? 'app.courseLockReview'
                : 'app.courseLockPaused',
          )}
        </p>
      ) : null}

      {/*
       * «Пишем на» — под вкладками и над формой, и только там, где действительно печатают текст.
       * На вкладке «Публикация» переключать нечего, и лишняя полоска там читалась бы как ещё одна
       * настройка публикации.
       */}
      {tab !== 'publish' ? (
        <div className="flex items-center justify-between gap-3 pt-4">
          <span className="eyebrow">{t('app.adminEditingLanguage')}</span>
          <LangTabs />
        </div>
      ) : null}

      {/*
       * Read-only on a compiled course: a disabled fieldset turns off every input, select and
       * button inside the editors at once, and `patchCourse` / `patchDay` refuse the write anyway.
       */}
      {tab === 'meta' ? (
        <fieldset disabled={readOnly} className="min-w-0">
          <CourseMetaEditor
            course={course}
            mediaPrefix={prefix}
            withPaymentUrl={scope.kind === 'admin'}
            onPatch={patchCourse}
          />
        </fieldset>
      ) : null}

      {tab === 'days' ? (
        days.length === 0 ? (
          <EmptyState title={t('app.dayEmptyTitle')} description={t('app.dayEmptyBody')} />
        ) : (
          /*
           * Two columns from `md`, one screen at a time below it.
           *
           * The editor used to be a second screen: opening a day replaced the list, and going back
           * to see where you were in the programme cost the day you were editing. On a phone that
           * is the only shape available and it stays. On a laptop — which is where the owner said
           * she wants to build a course — the list is 320px of the 1280 the admin already has, so
           * keeping it costs nothing and the week you are writing stays in front of you.
           *
           * One `DayEditor`, not two: it autosaves (`useAutosave`), and a second mounted instance
           * would be a second saver racing the first. Which column shows is CSS.
           */
          <div className="md:flex md:items-start md:gap-6">
            <div className={clsx('md:w-80 md:shrink-0', openDay && 'max-md:hidden')}>
              <DayList
                days={days}
                workouts={workouts}
                openId={openDay?.id}
                onOpen={(d: AdminCourseDayRow) => {
                  void daySave.flush();
                  setOpenDayId(d.id);
                }}
              />
            </div>
            {openDay ? (
              <div className="min-w-0 flex-1 md:border-l md:border-border md:pl-6">
                {/* The way back to the list, on a phone only: from `md` the list never left. */}
                <div className="md:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3"
                    icon={<Glyph size={14}>←</Glyph>}
                    onClick={() => {
                      void daySave.flush();
                      setOpenDayId(null);
                    }}
                  >
                    {t('app.courseTabDays')}
                  </Button>
                </div>
                <fieldset disabled={readOnly} className="min-w-0">
                  <DayEditor
                    courseSlugId={course.slugId}
                    mediaPrefix={prefix}
                    workoutOwner={creatorId}
                    day={openDay}
                    workout={workouts.find((w) => w.id === openDay.customWorkoutId) ?? null}
                    onPatch={(patch) => patchDay(openDay.id, patch)}
                    onBuildNewWorkout={() => setWorkoutFor({ dayId: openDay.id, existing: null })}
                    onEditWorkout={(workoutId) => void openWorkoutEditor(openDay.id, workoutId)}
                    onDelete={() => setConfirm({ kind: 'deleteDay', dayId: openDay.id })}
                  />
                </fieldset>
              </div>
            ) : null}
          </div>
        )
      ) : null}

      {tab === 'publish' ? (
        <div className="flex flex-col gap-5 py-4">
          {/*
           * The verdict is a ruled line, not a tinted callout: the semantic colour sits on the
           * words alone, and the things still missing follow as a numbered list — 01, 02 — in
           * `CourseSchema`'s own wording, each on its own hairline.
           *
           * Body text in the quiet register, not `.eyebrow`. These lines used to be
           * `.eyebrow-sentence`, a class that existed only because a sentence could not be set in
           * the kicker's capitals. `.eyebrow` is sentence case now and that opt-out is gone — and
           * the right home for a sentence turns out not to be the kicker either, but plain small
           * text. A kicker marks a section; a verdict is read.
           */}
          {issues.length === 0 ? (
            /* «Готов к публикации» would contradict the notice above on a course that is in code. */
            compiled ? null : (
              <p className="border-y border-border py-3 text-[13px] leading-[1.3] text-success">
                {t('app.coursePublishReady')}
              </p>
            )
          ) : (
            <div className="flex flex-col border-t border-border">
              <p className="py-3 text-[13px] leading-[1.3] text-warning">
                {t('app.coursePublishBlocked')}
              </p>
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

          {scope.kind === 'creator' ? (
            /*
             * The creator's side (0065): no Publish. The neon action is «Отправить на проверку»,
             * the one thing this tab is for them; once sent, a secondary takes it back. A published
             * course has nothing to press: it is the owner's from then on.
             */
            <>
              <p className="text-[15px] text-muted">{t('app.courseReviewExplain')}</p>
              {lock === 'published' ? null : inReview(course) ? (
                <>
                  <p className="text-[15px] text-muted">
                    {t('app.courseReviewSince', {
                      date: formatDate(locale, (course.reviewRequestedAt ?? '').slice(0, 10)),
                    })}
                  </p>
                  <Button
                    variant="secondary"
                    size="lg"
                    loading={publishing}
                    disabled={!scope.open}
                    onClick={() => void endReview()}
                  >
                    {t('app.courseReviewWithdraw')}
                  </Button>
                </>
              ) : (
                <Button
                  size="lg"
                  variant="action"
                  loading={publishing}
                  disabled={readOnly || !canPublish(course.slugId, issues)}
                  onClick={() => void sendForReview()}
                >
                  {t('app.courseReviewSend')}
                </Button>
              )}
            </>
          ) : (
            <>
              {/*
               * Publishing is instant in the app and not on the website; say so where it is
               * decided. Not on a compiled course: Publish is off there, and neither the catalogue
               * nor the site would show its draft, so both sentences would describe something that
               * cannot happen.
               */}
              {compiled ? null : (
                <>
                  <p className="text-[15px] text-muted">{t('app.coursePublishExplain')}</p>
                  <p className="text-[15px] text-muted">{t('app.coursePublishSite')}</p>
                </>
              )}

              {/* A creator sent this one (0065): say since when, and offer to hand it back. */}
              {inReview(course) && !published ? (
                <p className="border-y border-border py-3 text-[13px] leading-[1.3] text-warning">
                  {t('app.courseReviewWaiting', {
                    date: formatDate(locale, (course.reviewRequestedAt ?? '').slice(0, 10)),
                  })}
                </p>
              ) : null}

              {/*
               * Publish is the one neon button on this tab — neon is the palette's colour for
               * action, and this is the action the whole tab exists for. Taking it back is a
               * secondary. The ink is #111111 (17.3).
               */}
              {published ? (
                <Button
                  variant="secondary"
                  size="lg"
                  loading={publishing}
                  disabled={compiled}
                  onClick={() => setConfirm({ kind: 'unpublish' })}
                >
                  {t('app.courseUnpublish')}
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="action"
                  loading={publishing}
                  disabled={!canPublish(course.slugId, issues)}
                  onClick={() => void publish()}
                >
                  {t('app.coursePublish')}
                </Button>
              )}
              {inReview(course) && !published ? (
                <Button
                  variant="secondary"
                  size="lg"
                  loading={publishing}
                  onClick={() => void endReview()}
                >
                  {t('app.courseReturn')}
                </Button>
              ) : null}
            </>
          )}

          {!published && days.length === 0 && !readOnly ? (
            <Button
              variant="danger"
              size="sm"
              className="self-start"
              onClick={() => setConfirm({ kind: 'deleteCourse' })}
            >
              {t('app.courseDelete')}
            </Button>
          ) : null}
        </div>
      ) : null}

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={t(
          confirm?.kind === 'unpublish'
            ? 'app.courseUnpublishConfirmTitle'
            : confirm?.kind === 'deleteCourse'
              ? 'app.courseDeleteConfirmTitle'
              : 'app.dayDeleteConfirmTitle',
        )}
        description={t(
          confirm?.kind === 'unpublish'
            ? 'app.courseUnpublishConfirmBody'
            : confirm?.kind === 'deleteCourse'
              ? 'app.courseDeleteConfirmBody'
              : 'app.dayDeleteConfirmBody',
        )}
        confirmLabel={t(
          confirm?.kind === 'unpublish'
            ? 'app.courseUnpublish'
            : confirm?.kind === 'deleteCourse'
              ? 'app.courseDelete'
              : 'app.dayDelete',
        )}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={runConfirm}
      />
    </Screen>
  );
}
