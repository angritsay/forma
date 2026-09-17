/**
 * The self-test, as its own screen at `/assessment`.
 *
 * It used to be step seven of the onboarding wizard, which asked a person who had never trained
 * with this coach for five numbers before they had done a single session. The owner moved it:
 * «Мы тестирование через пару тренировок будем спрашивать». So it is offered by a banner after
 * the second completed workout (`features/assessment/AssessmentBanner`) and it opens here —
 * never back into the wizard, which is a form for someone who has not started yet.
 *
 * **It reads as a modal, because that is what it is.** A full-screen surface with a «×» rather
 * than a back chevron: it is a detour from whatever screen offered it, and closing it puts the
 * athlete back where they were with nothing lost. The runner itself already draws over
 * everything (`fixed inset-0`), so the two agree.
 *
 * Three moments:
 *   intro   — which five movements, what it costs, and the one instruction everything here
 *             depends on: «Максимум не выжимаем».
 *   running — `AssessmentRunner`, unchanged: the clip full-bleed, the name on a pane of glass,
 *             one field. Nothing is timed and nothing is performed (PR #80 took the clock out;
 *             the clip fills the width by geometry rather than by measurement). Neither is undone
 *             here.
 *   done    — the five numbers, and the button that saves them.
 *
 * **Saving is where a fitness index becomes honest.** The wizard no longer computes one: five
 * answers and no measurement is not a result. Here there are measurements, so the index and the
 * level are computed and stored alongside the counts, and the two movements the index does not
 * read are written to `benchmarks` — the same five movements are what a later retake is compared
 * against. A record that fails to save must not cost the profile that has already been written,
 * so those are settled, not awaited-or-thrown.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import { EXERCISE_BY_ID } from '@/content/registry';
import { formatNumber } from '@/i18n/index';
import { useT } from '@/app/hooks/useT';
import { AssessmentRunner } from '@/app/features/assessment/AssessmentRunner';
import { AssessmentStrip } from '@/app/features/assessment/AssessmentStrip';
import {
  answersComplete,
  assessmentBenchmarks,
  emptyAnswers,
  withAssessment,
  type AssessmentAnswers,
} from '@/app/features/assessment/model';
import { recordBenchmark } from '@/lib/api/benchmarks';
import { computeFitnessIndex } from '@/lib/training/assessment';
import { useSession } from '@/app/store/session';
import { ASSESSMENT_MOVES, ASSESSMENT_TOTAL_MIN } from '@content/site/assessment';
import { Question } from './onboarding/Question';

type Phase = 'intro' | 'running' | 'done';

export default function AssessmentScreen() {
  const { t, l, locale } = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const trainingProfile = useSession((s) => s.profile?.trainingProfile ?? null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [answers, setAnswers] = useState<AssessmentAnswers>(emptyAnswers);
  const [saving, setSaving] = useState(false);

  const close = () => navigate(-1);
  const complete = useMemo(() => answersComplete(answers), [answers]);

  const setCount = (exerciseId: string, reps: number) =>
    setAnswers((a) => ({ ...a, counts: { ...a.counts, [exerciseId]: reps } }));

  const save = async () => {
    if (!trainingProfile) return;
    const next = withAssessment(trainingProfile, answers);
    const fitness = computeFitnessIndex(next);
    setSaving(true);
    try {
      await useSession.getState().saveProfile({
        trainingProfile: next,
        fitnessIndex: fitness.index,
        fitnessLevel: fitness.level,
      });
      await Promise.allSettled(
        Object.entries(assessmentBenchmarks(answers)).map(([key, reps]) =>
          recordBenchmark(key, reps, 'reps'),
        ),
      );
      close();
    } catch {
      toast.show({ kind: 'error', title: t('app.onbSaveError') });
    } finally {
      setSaving(false);
    }
  };

  if (phase === 'running') {
    return (
      <AssessmentRunner
        onKnees={answers.onKnees}
        onCount={setCount}
        onKneesChange={(onKnees) => setAnswers((a) => ({ ...a, onKnees }))}
        onDone={() => setPhase('done')}
        onCancel={() => setPhase('intro')}
      />
    );
  }

  const header = (
    /* The gutter the content uses, and the «×» pulled out by its own padding so the mark sits on
       it — the same alignment the wizard's header keeps. */
    <div className="flex h-14 items-center justify-end px-6">
      <div className="-mr-2.5">
        <IconButton
          label={t('common.close')}
          icon="close"
          variant="ghost"
          size="sm"
          onClick={close}
        />
      </div>
    </div>
  );

  if (!trainingProfile) {
    /* Reachable only by typing the URL before onboarding has saved anything. */
    return (
      <Screen header={header}>
        <EmptyState icon="info" title={t('app.assessNoProfile')} />
      </Screen>
    );
  }

  if (phase === 'done') {
    return (
      <Screen
        header={header}
        footer={
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              fullWidth
              loading={saving}
              disabled={!complete}
              onClick={() => void save()}
            >
              {t('common.save')}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setPhase('running')}>
              {t('app.onbAssessRetake')}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-6 py-7">
          <Question text={t('app.onbAssessDoneTitle')} />
          <ul className="flex flex-col border-b border-border">
            {ASSESSMENT_MOVES.map((move, i) => {
              const exercise = EXERCISE_BY_ID.get(move.exerciseId);
              return (
                <li
                  key={move.exerciseId}
                  className="flex items-center gap-3 border-t border-border py-3"
                >
                  <span className="numeral w-8 text-sm text-muted-2">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[15px]">
                    {exercise ? l(exercise.name) : move.exerciseId}
                  </span>
                  {/* The number is the point of the row, so it is the biggest thing on it. */}
                  <span className="numeral tabular text-xl">{answers.counts[move.exerciseId]}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </Screen>
    );
  }

  return (
    <Screen
      header={header}
      footer={
        <div className="flex flex-col gap-2">
          <Button size="lg" fullWidth onClick={() => setPhase('running')}>
            {t('app.onbAssessWarnCta')}
          </Button>
          <Button variant="ghost" fullWidth onClick={close}>
            {t('app.assessBannerLater')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 py-7">
        {/*
         * Which five, and in what order. «Нужно будет сказать, сколько раз ты выполнишь 5
         * упражнений» is an abstraction until you see which five, and every frame here is the
         * coach's own still for that movement — the same one the runner shows a second later.
         */}
        <AssessmentStrip />
        {/*
         * The one instruction everything the assessment produces depends on, in the owner's own
         * words and nothing more: «тут просто нужно сказать, что не выжимаем максимум… конец. Не
         * нужно bloat-нода текста». It cannot ride along with the movement — beside a clip nobody
         * reads anything — so it stands here, before the first one.
         */}
        <Question text={t('app.onbAssessWarnTitle')} />
        <div className="flex flex-wrap gap-2">
          <Pill>
            {t('app.onbAssessMoves', { n: formatNumber(locale, ASSESSMENT_MOVES.length) })}
          </Pill>
          <Pill>{t('common.minutesShort', { n: formatNumber(locale, ASSESSMENT_TOTAL_MIN) })}</Pill>
        </div>
      </div>
    </Screen>
  );
}
