/**
 * Steps (docs/SPEC.md §10 flow 10): log today's steps by hand (with the reason why), the goal
 * ring and points preview, and the last 14 days with an edit sheet. Saving upserts the daily
 * log, pushes it into the progress store and reports what it did to the streak.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatNumber, plural } from '@/i18n/index';
import { upsertDailyLog } from '@/lib/api/dailyLogs';
import { isAppError } from '@/lib/api/errors';
import { STEPS_GOAL } from '@/lib/training/constants';
import { TopBar } from '@/app/components/TopBar';
import { useT } from '@/app/hooks/useT';
import { historyDays, parseSteps, stepsToGoal, streakFeedback } from '@/app/features/steps/model';
import { StepsEditor } from '@/app/features/steps/StepsEditor';
import { StepsHistory } from '@/app/features/steps/StepsHistory';
import {
  selectStreak,
  useProgress,
  useProgressLoader,
  useStepsToday,
  useTodayIso,
} from '@/app/store/progress';

function WhyManualCard() {
  const { t, locale } = useT();
  return (
    <Card level={2} className="flex gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-accent-2/15 text-accent-2">
        <Icon name="info" size={20} />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-[15px] font-semibold">{t('app.stepsWhyTitle')}</h2>
        <p className="text-sm leading-relaxed text-muted">
          {t('app.stepsWhyBody', { goal: formatNumber(locale, STEPS_GOAL) })}
        </p>
      </div>
    </Card>
  );
}

interface EditSheetProps {
  date: string | null;
  initialSteps: number | null;
  onClose: () => void;
  onSaved: () => void;
}

/** Edit the steps of a past day. */
function EditSheet({ date, initialSteps, onClose, onSaved }: EditSheetProps) {
  const { t, locale } = useT();
  const toast = useToast();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

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
      <div className="py-4">
        {date ? (
          <StepsEditor
            text={text}
            onText={setText}
            goal={STEPS_GOAL}
            label={t('app.stepsEditTitle', { date: formatDate(locale, date, 'long') })}
            disabled={saving}
          />
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
        <Skeleton rounded="pill" className="size-[200px]" />
        <Skeleton rounded="card" className="h-24 w-full" />
        <Skeleton rounded="card" className="h-64 w-full" />
      </div>
    );
  } else if (status === 'error') {
    body = (
      <EmptyState
        icon="warning"
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
          <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            {t('app.stepsTodayLabel')} · {formatDate(locale, today)}
          </h2>
          <Card>
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
          </Card>
        </section>
        <WhyManualCard />
        <section className="flex flex-col gap-3">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            {t('app.stepsHistoryTitle')}
          </h2>
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
        onClose={() => setEditDate(null)}
        onSaved={() => setEditDate(null)}
      />
    </Screen>
  );
}
