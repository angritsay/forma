/**
 * Steps (docs/SPEC.md §10 flow 10): log today's steps by hand (with the reason why), the goal
 * ring and points preview, and the last 14 days with an edit sheet. Saving upserts the daily
 * log, pushes it into the progress store and reports what it did to the streak.
 *
 * A day may also carry a screenshot of the athlete's own step counter. It is attached the moment
 * it is picked rather than waiting for Save — an upload is slow enough that batching it behind a
 * button would mean staring at a spinner, and it is its own fact about the day, not an edit to the
 * number. Points are unaffected either way: nothing reads the picture.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Glyph } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatNumber, plural } from '@/i18n/index';
import { STEP_PROOFS_BUCKET, stepProofPath, upsertDailyLog } from '@/lib/api/dailyLogs';
import { isAppError } from '@/lib/api/errors';
import { deleteMedia, uploadMedia } from '@/lib/api/storage';
import { downscaleImage, extensionFor } from '@/lib/util/image';
import { STEPS_GOAL } from '@/lib/training/constants';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { historyDays, parseSteps, stepsToGoal, streakFeedback } from '@/app/features/steps/model';
import { StepsEditor } from '@/app/features/steps/StepsEditor';
import { StepsHistory } from '@/app/features/steps/StepsHistory';
import { StepsProof } from '@/app/features/steps/StepsProof';
import {
  selectStreak,
  useProgress,
  useProgressLoader,
  useStepsToday,
  useTodayIso,
} from '@/app/store/progress';
import { useSession } from '@/app/store/session';

/**
 * Attach or replace a day's screenshot, storing it against the day straight away.
 *
 * Shared by today's field and the edit sheet, because "add a screenshot" means the same thing on
 * a day three days ago as it does on this one. The picture is shrunk first: a phone screenshot is
 * two to four megabytes of PNG, and the coach needs to read a number off it (see lib/util/image).
 */
function useStepsProof(localDate: string | null, userId: string | undefined) {
  const { t } = useT();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const write = async (proofPath: string | null) => {
    if (!localDate) return;
    const steps = useProgress.getState().dailyLogs[localDate]?.steps ?? 0;
    const row = await upsertDailyLog(localDate, steps, undefined, proofPath);
    useProgress.getState().putDailyLog(row);
  };

  const attach = async (file: File) => {
    if (!localDate || !userId) return;
    setBusy(true);
    try {
      const blob = await downscaleImage(file);
      const path = stepProofPath(userId, localDate, extensionFor(blob));
      await write(await uploadMedia(STEP_PROOFS_BUCKET, path, blob));
    } catch (e) {
      toast.show({
        kind: 'error',
        title:
          isAppError(e) && e.code === 'network'
            ? t('common.errorOffline')
            : t('app.stepsProofError'),
      });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!localDate) return;
    const current = useProgress.getState().dailyLogs[localDate]?.proofPath ?? null;
    setBusy(true);
    try {
      await write(null);
      // Best effort: the row no longer points at it, so a file left behind is invisible, not a leak.
      if (current) await deleteMedia(current).catch(() => undefined);
    } catch {
      toast.show({ kind: 'error', title: t('app.stepsProofError') });
    } finally {
      setBusy(false);
    }
  };

  return { busy, attach, remove };
}

/**
 * Why steps are entered by hand. The explanation is the longest single string in the app, and it
 * answers a question most athletes ask once — so it collapses behind its own title. `<details>`
 * carries the expanded/collapsed state to assistive technology without any JavaScript.
 */
function WhyManualCard() {
  const { t, locale } = useT();
  return (
    <div className="border-y border-border">
      <details className="group">
        {/* A hairline row: the question, and a `›` that turns down when it is open. No "i" in a box. */}
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 py-3 [&::-webkit-details-marker]:hidden">
          <h2 className="min-w-0 flex-1 text-[15px] font-semibold">{t('app.stepsWhyTitle')}</h2>
          <Glyph
            size={16}
            className="shrink-0 text-muted-2 transition-transform duration-150 ease-(--ease-out) group-open:rotate-90"
          >
            ›
          </Glyph>
        </summary>
        <p className="pb-4 text-sm leading-relaxed text-muted">
          {t('app.stepsWhyBody', { goal: formatNumber(locale, STEPS_GOAL) })}
        </p>
      </details>
    </div>
  );
}

interface EditSheetProps {
  date: string | null;
  initialSteps: number | null;
  proofPath: string | null;
  userId: string | undefined;
  onClose: () => void;
  onSaved: () => void;
}

/** Edit the steps of a past day, and its screenshot. */
function EditSheet({ date, initialSteps, proofPath, userId, onClose, onSaved }: EditSheetProps) {
  const { t, locale } = useT();
  const toast = useToast();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const proof = useStepsProof(date, userId);

  useEffect(() => {
    if (date) setText(initialSteps !== null && initialSteps > 0 ? String(initialSteps) : '');
  }, [date, initialSteps]);

  const steps = parseSteps(text);
  const dirty = steps !== null && steps !== (initialSteps ?? 0);

  const save = async () => {
    if (!date || steps === null) return;
    setSaving(true);
    try {
      const row = await upsertDailyLog(date, steps);
      useProgress.getState().putDailyLog(row);
      toast.show({ kind: 'success', title: t('app.stepsSaved') });
      onSaved();
    } catch (e) {
      toast.show({
        kind: 'error',
        title:
          isAppError(e) && e.code === 'network'
            ? t('common.errorOffline')
            : t('app.stepsSaveError'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={date !== null}
      onClose={onClose}
      title={date ? t('app.stepsEditTitle', { date: formatDate(locale, date, 'long') }) : ''}
      footer={
        <Button size="lg" fullWidth loading={saving} disabled={!dirty} onClick={() => void save()}>
          {t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 py-4">
        {date ? (
          <>
            <StepsEditor
              text={text}
              onText={setText}
              goal={STEPS_GOAL}
              label={t('app.stepsEditTitle', { date: formatDate(locale, date, 'long') })}
              disabled={saving}
            />
            <StepsProof
              value={proofPath}
              onPick={proof.attach}
              onRemove={() => void proof.remove()}
              disabled={saving}
              busy={proof.busy}
            />
          </>
        ) : null}
      </div>
    </Sheet>
  );
}

export default function StepsScreen() {
  useProgressLoader();
  const { t, locale } = useT();
  const toast = useToast();
  const today = useTodayIso();
  const status = useProgress((s) => s.status);
  const loading = useProgress((s) => s.loading);
  const error = useProgress((s) => s.error);
  const logs = useProgress((s) => s.dailyLogs);
  const stepsToday = useStepsToday();
  const userId = useSession((s) => s.user?.id);
  const proofToday = useProgress((s) => s.dailyLogs[today]?.proofPath ?? null);
  const proof = useStepsProof(today, userId);
  const [text, setText] = useState('');
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editDate, setEditDate] = useState<string | null>(null);

  // Seed the field from the stored log until the athlete starts typing.
  useEffect(() => {
    if (!touched) setText(stepsToday > 0 ? String(stepsToday) : '');
  }, [stepsToday, touched]);

  const history = useMemo(() => historyDays(logs, today), [logs, today]);
  const steps = parseSteps(text);
  const dirty = steps !== null && steps !== stepsToday;

  const dayWord = useCallback(
    (n: number) =>
      plural(locale, n, {
        one: t('app.stepsDayOne', { n }),
        few: t('app.stepsDayFew', { n }),
        many: t('app.stepsDayMany', { n }),
      }),
    [locale, t],
  );

  const save = async () => {
    if (steps === null) return;
    setSaving(true);
    const before = useProgress.getState();
    const streakBefore = selectStreak(before.recentSessions, before.dailyLogs, today);
    try {
      const row = await upsertDailyLog(today, steps);
      useProgress.getState().putDailyLog(row);
      const after = useProgress.getState();
      const streakAfter = selectStreak(after.recentSessions, after.dailyLogs, today);
      const feedback = streakFeedback(streakBefore, streakAfter);
      switch (feedback) {
        case 'kept':
          toast.show({
            kind: 'success',
            title: t('app.stepsStreakKept'),
            description: dayWord(streakAfter.current),
          });
          break;
        case 'started':
          toast.show({
            kind: 'success',
            title: t('app.stepsStreakStarted'),
            description: dayWord(streakAfter.current),
          });
          break;
        case 'below_goal':
          toast.show({
            kind: 'info',
            title: t('app.stepsSaved'),
            description: t('app.stepsBelowGoal', {
              n: formatNumber(locale, stepsToGoal(row.steps, STEPS_GOAL)),
            }),
          });
          break;
        case 'updated':
          toast.show({ kind: 'success', title: t('app.stepsSaved') });
          break;
      }
      setTouched(false);
    } catch (e) {
      toast.show({
        kind: 'error',
        title:
          isAppError(e) && e.code === 'network'
            ? t('common.errorOffline')
            : t('app.stepsSaveError'),
      });
    } finally {
      setSaving(false);
    }
  };

  let body: React.ReactNode;
  if (status === 'loading' || status === 'idle') {
    body = (
      <div className="flex flex-col items-center gap-5 py-2" aria-hidden="true">
        <Skeleton rounded="control" className="size-[200px]" />
        <Skeleton rounded="card" className="h-24 w-full" />
        <Skeleton rounded="card" className="h-64 w-full" />
      </div>
    );
  } else if (status === 'error') {
    body = (
      <EmptyState
        title={t('app.stepsErrorTitle')}
        description={
          error?.code === 'network' ? t('common.errorOffline') : t('common.errorGeneric')
        }
        action={
          <Button size="lg" loading={loading} onClick={() => void useProgress.getState().refresh()}>
            {t('common.retry')}
          </Button>
        }
      />
    );
  } else {
    body = (
      <div className="flex flex-col gap-6 py-2">
        <section className="flex flex-col gap-4">
          <h2 className="eyebrow">
            {t('app.stepsTodayLabel')} · {formatDate(locale, today)}
          </h2>
          <div className="flex flex-col gap-4 border-t border-border pt-4">
            <StepsEditor
              text={text}
              onText={(v) => {
                setTouched(true);
                setText(v);
              }}
              goal={STEPS_GOAL}
              label={t('app.stepsInputLabel')}
              disabled={saving}
            />
            <StepsProof
              value={proofToday}
              onPick={proof.attach}
              onRemove={() => void proof.remove()}
              disabled={saving}
              busy={proof.busy}
            />
          </div>
        </section>
        <WhyManualCard />
        <section className="flex flex-col gap-3">
          <h2 className="eyebrow">{t('app.stepsHistoryTitle')}</h2>
          <StepsHistory days={history} goal={STEPS_GOAL} onEdit={setEditDate} />
        </section>
      </div>
    );
  }

  return (
    <Screen
      header={<TopBar back title={t('app.stepsTitle')} />}
      footer={
        status === 'ready' ? (
          <Button
            size="lg"
            fullWidth
            loading={saving}
            disabled={!dirty}
            onClick={() => void save()}
          >
            {t('common.save')}
          </Button>
        ) : undefined
      }
    >
      {body}
      <EditSheet
        date={editDate}
        initialSteps={editDate ? (logs[editDate]?.steps ?? null) : null}
        proofPath={editDate ? (logs[editDate]?.proofPath ?? null) : null}
        userId={userId}
        onClose={() => setEditDate(null)}
        onSaved={() => setEditDate(null)}
      />
    </Screen>
  );
}
