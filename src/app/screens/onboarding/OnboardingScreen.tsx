/**
 * Onboarding wizard (docs/SPEC.md §10 flow 2). Progress bar + back in the header, one step per
 * screen, draft persisted in sessionStorage (`forma.onboarding`) so a reload resumes.
 * The result step saves the profile and sends the user home.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import { useT } from '@/app/hooks/useT';
import { useSession } from '@/app/store/session';
import { computeFitnessIndex } from '@/lib/training/assessment';
import {
  clearDraft,
  draftToTrainingProfile,
  firstIncompleteStep,
  isStepComplete,
  loadDraft,
  saveDraft,
  STEP_IDS,
  type OnboardingDraft,
  type StepId,
  type TestKey,
} from './draft';
import { StepActivity } from './StepActivity';
import { StepBasics } from './StepBasics';
import { StepEquipment } from './StepEquipment';
import { StepExperience } from './StepExperience';
import { StepGoal } from './StepGoal';
import { StepLanguage } from './StepLanguage';
import { StepLimitations } from './StepLimitations';
import { StepName } from './StepName';
import { StepResult } from './StepResult';
import { StepTestPlank } from './StepTestPlank';
import { StepTestPushups } from './StepTestPushups';
import { StepTestSquats } from './StepTestSquats';
import { StepTime } from './StepTime';
import type { StepProps } from './types';

const SKIPPABLE: Partial<Record<StepId, TestKey>> = {
  testPushups: 'pushups',
  testSquats: 'squats',
  testPlank: 'plank',
};

const STEP_COMPONENT: Record<StepId, (props: StepProps) => React.ReactElement | null> = {
  language: StepLanguage,
  name: StepName,
  basics: StepBasics,
  activity: StepActivity,
  experience: StepExperience,
  equipment: StepEquipment,
  limitations: StepLimitations,
  testPushups: StepTestPushups,
  testSquats: StepTestSquats,
  testPlank: StepTestPlank,
  time: StepTime,
  goal: StepGoal,
  result: StepResult,
};

function initialDraft(
  locale: OnboardingDraft['locale'],
  displayName: string | null | undefined,
): OnboardingDraft {
  const saved = loadDraft();
  const draft: OnboardingDraft = {
    ...saved,
    locale: saved.locale ?? locale,
    displayName: saved.displayName ?? displayName ?? undefined,
  };
  return { ...draft, step: Math.min(draft.step, firstIncompleteStep(draft)) };
}

export default function OnboardingScreen() {
  const { t, locale } = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const profileName = useSession((s) => s.profile?.displayName);
  const signOut = useSession((s) => s.signOut);
  const [draft, setDraft] = useState<OnboardingDraft>(() => initialDraft(locale, profileName));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  const stepIndex = draft.step;
  const step: StepId = STEP_IDS[stepIndex] ?? 'language';
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
      const current = STEP_IDS[d.step] ?? 'language';
      if (!isStepComplete(d, current)) return d;
      return { ...d, step: Math.min(total - 1, d.step + 1) };
    });
    window.scrollTo({ top: 0 });
  }, [total]);

  const back = () => goTo(stepIndex - 1);

  const skipTest = () => {
    const key = SKIPPABLE[step];
    if (!key) return;
    const tests = { ...draft.tests };
    if (key === 'pushups') tests.pushups = undefined;
    if (key === 'squats') tests.squats60s = undefined;
    if (key === 'plank') tests.plankSec = undefined;
    setDraft((d) => ({
      ...d,
      tests,
      skipped: { ...d.skipped, [key]: true },
      step: Math.min(total - 1, d.step + 1),
    }));
    window.scrollTo({ top: 0 });
  };

  const finish = async () => {
    const trainingProfile = draftToTrainingProfile(draft);
    const displayName = (draft.displayName ?? '').trim();
    if (!trainingProfile || !displayName) return;
    const assessment = computeFitnessIndex(trainingProfile);
    setSaving(true);
    try {
      await useSession.getState().saveProfile({
        displayName,
        locale: draft.locale ?? locale,
        trainingProfile,
        fitnessIndex: assessment.index,
        fitnessLevel: assessment.level,
        onboardedAt: new Date().toISOString(),
      });
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
  const skipKey = SKIPPABLE[step];

  return (
    <Screen
      header={
        <div className="flex h-14 items-center gap-3 px-3">
          <div className="flex w-11 shrink-0 items-center">
            {stepIndex > 0 ? (
              <IconButton label={t('common.back')} icon="back" variant="ghost" onClick={back} />
            ) : null}
          </div>
          <ProgressBar
            value={stepIndex / (total - 1)}
            label={t('app.onbStepOf', { n: stepIndex + 1, total })}
            size="sm"
            className="flex-1"
          />
          <span className="tabular w-11 shrink-0 text-right text-xs text-muted">
            {stepIndex + 1}/{total}
          </span>
        </div>
      }
      footer={
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
          {skipKey ? (
            <Button variant="ghost" fullWidth onClick={skipTest}>
              {t('app.onbTestSkip')}
            </Button>
          ) : null}
          {stepIndex === 0 ? (
            <Button variant="ghost" fullWidth onClick={() => void signOut()}>
              {t('app.authSignOut')}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="py-4">
        <StepView {...stepProps} />
      </div>
    </Screen>
  );
}
