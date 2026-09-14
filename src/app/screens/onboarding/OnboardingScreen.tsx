/**
 * Onboarding wizard (docs/SPEC.md §10 flow 2). Progress bar + back in the header, one step per
 * screen, draft persisted in sessionStorage (`forma.onboarding`) so a reload resumes.
 * The result step saves the profile and sends the user home.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import { useT } from '@/app/hooks/useT';
import { useSession } from '@/app/store/session';
import { computeFitnessIndex } from '@/lib/training/assessment';
import {
  assessmentBenchmarks,
  clearDraft,
  draftToTrainingProfile,
  firstIncompleteStep,
  isStepComplete,
  loadDraft,
  resumeStepIndex,
  saveDraft,
  STEP_IDS,
  type OnboardingDraft,
  type StepId,
} from './draft';
import { recordBenchmark } from '@/lib/api/benchmarks';
import { StepActivity } from './StepActivity';
import { StepAssess } from './StepAssess';
import { StepBasics } from './StepBasics';
import { StepEquipment } from './StepEquipment';
import { StepExperience } from './StepExperience';
import { StepGoal } from './StepGoal';
import { StepLimitations } from './StepLimitations';
import { StepName } from './StepName';
import { StepResult } from './StepResult';
import { StepTime } from './StepTime';
import type { StepProps } from './types';

const STEP_COMPONENT: Record<StepId, (props: StepProps) => React.ReactElement | null> = {
  name: StepName,
  basics: StepBasics,
  activity: StepActivity,
  experience: StepExperience,
  equipment: StepEquipment,
  limitations: StepLimitations,
  assess: StepAssess,
  time: StepTime,
  goal: StepGoal,
  result: StepResult,
};

/**
 * Steps that carry their own controls, so the shared footer stands down.
 *
 * The assessment's two answers are the step (see StepAssess); a «Продолжить» under them would be a
 * third answer to a question that has two.
 */
const OWN_CONTROLS: ReadonlySet<StepId> = new Set<StepId>(['assess']);

/**
 * Draft the wizard opens with: the persisted one, seeded with the profile's locale/name.
 * `?step=` (e.g. `?step=tests` from "retake tests") asks for a starting step; it is clamped to the
 * first incomplete step, so it can never skip an unanswered question.
 */
function initialDraft(
  locale: OnboardingDraft['locale'],
  displayName: string | null | undefined,
  requestedStep: number | null,
): OnboardingDraft {
  const saved = loadDraft();
  const draft: OnboardingDraft = {
    ...saved,
    locale: saved.locale ?? locale,
    displayName: saved.displayName ?? displayName ?? undefined,
  };
  const wanted = requestedStep === null ? draft.step : Math.max(draft.step, requestedStep);
  return { ...draft, step: Math.min(wanted, firstIncompleteStep(draft)) };
}

export default function OnboardingScreen() {
  const { t, locale } = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const profileName = useSession((s) => s.profile?.displayName);
  const signOut = useSession((s) => s.signOut);
  const [draft, setDraft] = useState<OnboardingDraft>(() =>
    initialDraft(locale, profileName, resumeStepIndex(searchParams.get('step'))),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  const stepIndex = draft.step;
  const step: StepId = STEP_IDS[stepIndex] ?? 'name';
  const total = STEP_IDS.length;
  const isLast = step === 'result';
  const canContinue = isStepComplete(draft, step);

  const update = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  const goTo = useCallback(
    (index: number) => {
      setDraft((d) => ({ ...d, step: Math.max(0, Math.min(total - 1, index)) }));
      window.scrollTo({ top: 0 });
    },
    [total],
  );

  const next = useCallback(() => {
    setDraft((d) => {
      const current = STEP_IDS[d.step] ?? 'name';
      if (!isStepComplete(d, current)) return d;
      return { ...d, step: Math.min(total - 1, d.step + 1) };
    });
    window.scrollTo({ top: 0 });
  }, [total]);

  const back = () => goTo(stepIndex - 1);

  const finish = async () => {
    const trainingProfile = draftToTrainingProfile(draft);
    const displayName = (draft.displayName ?? '').trim();
    if (!trainingProfile || !displayName) return;
    const assessment = computeFitnessIndex(trainingProfile);
    setSaving(true);
    try {
      // Retaking the tests must not rewrite the date the athlete first finished onboarding.
      const onboardedAt = useSession.getState().profile?.onboardedAt ?? new Date().toISOString();
      await useSession.getState().saveProfile({
        displayName,
        locale: draft.locale ?? locale,
        trainingProfile,
        fitnessIndex: assessment.index,
        fitnessLevel: assessment.level,
        onboardedAt,
      });
      /*
       * The two movements the fitness index does not read are personal records, so they are kept
       * where records live rather than dropped: the same five movements are what a later
       * assessment is compared against. A record that fails to save must not cost the profile that
       * has already been written, so this is settled, not awaited-or-thrown.
       */
      await Promise.allSettled(
        Object.entries(assessmentBenchmarks(draft)).map(([key, reps]) =>
          recordBenchmark(key, reps, 'reps'),
        ),
      );
      clearDraft();
      navigate('/', { replace: true });
    } catch {
      toast.show({ kind: 'error', title: t('app.onbSaveError') });
    } finally {
      setSaving(false);
    }
  };

  const StepView = STEP_COMPONENT[step];
  const stepProps = useMemo<StepProps>(() => ({ draft, update, next }), [draft, update, next]);
  const ownControls = OWN_CONTROLS.has(step);

  return (
    <Screen
      header={
        /*
         * The step counter is set as a numeral pair — 03/12 — rather than as small grey text, and
         * the progress rule sits under the whole bar instead of competing with it for width. On a
         * twelve-step form the number is the thing you look for, so it is the thing that is legible.
         */
        <div>
          <div className="flex h-14 items-center gap-3 px-3">
            <div className="flex w-11 shrink-0 items-center">
              {stepIndex > 0 ? (
                <IconButton label={t('common.back')} icon="back" variant="ghost" onClick={back} />
              ) : null}
            </div>
            <span className="eyebrow flex-1">
              {t('app.onbStepOf', { n: stepIndex + 1, total })}
            </span>
            <span className="numeral tabular shrink-0 text-right text-sm">
              <span className="text-text">{String(stepIndex + 1).padStart(2, '0')}</span>
              <span className="text-muted-2">/{String(total).padStart(2, '0')}</span>
            </span>
          </div>
          {/* The brandbook's 4px rule; white, because no course is in scope during onboarding. */}
          <ProgressBar
            value={stepIndex / (total - 1)}
            label={t('app.onbStepOf', { n: stepIndex + 1, total })}
          />
        </div>
      }
      footer={
        ownControls ? undefined : (
          <div className="flex flex-col gap-2">
            {isLast ? (
              <Button
                size="lg"
                fullWidth
                loading={saving}
                disabled={!canContinue}
                onClick={() => void finish()}
              >
                {t('app.onbResultStart')}
              </Button>
            ) : (
              <Button size="lg" fullWidth disabled={!canContinue} onClick={next}>
                {t('common.continue')}
              </Button>
            )}
            {stepIndex === 0 ? (
              <Button variant="ghost" fullWidth onClick={() => void signOut()}>
                {t('app.authSignOut')}
              </Button>
            ) : null}
          </div>
        )
      }
    >
      <div className="py-7">
        <StepView {...stepProps} />
      </div>
    </Screen>
  );
}
