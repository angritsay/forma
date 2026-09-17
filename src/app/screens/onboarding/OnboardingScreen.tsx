/**
 * Onboarding wizard (docs/SPEC.md §10 flow 2). Back, the progress rule and «01/05» in the header,
 * one question per screen, draft persisted in sessionStorage (`forma.onboarding`) so a reload
 * resumes. The last step saves the profile and sends the athlete home.
 *
 * **Five questions, and the test is not one of them.** The owner's instruction was «убрать все
 * лишнее в онбординге и особенно оттуда убрать тестирование. Мы тестирование через пару
 * тренировок будем спрашивать». So the minutes-per-session, the goal, the activity level, the
 * experience, the equipment and the self-test all left this screen: what is asked before the
 * first workout is a name, an age, a sex, what to protect and one slider. The self-test lives at
 * `/assessment` and is offered after the second completed workout
 * (`src/app/features/assessment`); the «60 — средний» result screen went with it, because an
 * index computed from five answers and no measurement is a number pretending to be a result.
 *
 * Each step is one question in the display face and its answers as plates, a field or a slider,
 * and nothing else — the owner's prototype (`design/ui_kits/app-v2`) is the measure, and
 * design/CHANGELOG.md §10 records why the leads, kickers and descriptions went. The footer keeps
 * the one primary button; «Выйти» on the first step is the way out for a wrong account and stays
 * as quiet type.
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
import {
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
import { StepAge } from './StepAge';
import { StepLevel } from './StepLevel';
import { StepLimitations } from './StepLimitations';
import { StepName } from './StepName';
import { StepSex } from './StepSex';
import type { StepProps } from './types';

/**
 * The header is the top of the page here, not chrome over a list — so it is the page's own ground
 * rather than glass.
 *
 * `Screen` puts `.glass-bar-top` on every header it draws, and that material earns its compositing
 * layer where something scrolls beneath it. Nothing does here: measured at 390×844, every one of
 * the five steps reports `scrollHeight` 844 against `clientHeight` 844 — the bottom half of each
 * step is empty. A 20px `backdrop-filter` over a ground that never moves is the whole cost of the
 * layer for none of the effect, and the gradient it draws is the page colour at 38–96% over the
 * page colour, which is the page colour. The hairline is `.glass-bar-top`'s `border-bottom` and is
 * not part of the material, so it stays and the row still has an edge.
 *
 * Written as an override on the container rather than as a prop because `src/components/ui` is
 * another stream's this week; `Screen` should grow `headerGlass={false}` beside its existing
 * `headerRule`, and then this constant and its twin in `screens/AssessmentScreen.tsx` both go.
 */
const FLAT_HEADER =
  '[&>.glass-bar-top]:bg-none [&>.glass-bar-top]:bg-bg [&>.glass-bar-top]:backdrop-filter-none';

const STEP_COMPONENT: Record<StepId, (props: StepProps) => React.ReactElement | null> = {
  name: StepName,
  age: StepAge,
  sex: StepSex,
  limitations: StepLimitations,
  level: StepLevel,
};

/**
 * Draft the wizard opens with: the persisted one, seeded with the profile's locale/name.
 * `?step=` asks for a starting step; it is clamped to the first incomplete step, so it can never
 * skip an unanswered question.
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
  const isLast = stepIndex === total - 1;
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

  /*
   * Save and go home. No fitness index is written: nothing here measured anything, and the field
   * stays null until the athlete takes the assessment. Everything that reads it already copes
   * with its absence by recomputing from the training profile (`fitnessOf`, `startingScale`,
   * `useTrainingContext`), which for a profile with no self-tests is capped on purpose.
   */
  const finish = async () => {
    const trainingProfile = draftToTrainingProfile(draft);
    const displayName = (draft.displayName ?? '').trim();
    if (!trainingProfile || !displayName) return;
    setSaving(true);
    try {
      const onboardedAt = useSession.getState().profile?.onboardedAt ?? new Date().toISOString();
      await useSession.getState().saveProfile({
        displayName,
        locale: draft.locale ?? locale,
        trainingProfile,
        onboardedAt,
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

  return (
    <Screen
      className={FLAT_HEADER}
      header={
        /*
         * One row: the way back, the rule, the numeral pair. It used to say where you are twice —
         * «ШАГ 2 ИЗ 10» as a kicker and «02/10» as numerals, with a second rule under the whole
         * bar — and the kicker was the words for what the rule and the pair already draw. The
         * sentence survives as the rule's accessible name. The rule is filled to the step being
         * answered, not the steps behind it, so it and «01/05» say the same thing from the first
         * screen. White, because no course is in scope during onboarding.
         *
         * **The three are aligned, which they were not.** The row sat on `px-3` while every word
         * on the screen below it sits on the content's `px-6`, and the chevron's own 13px of
         * padding inside its 44px button pushed the mark to 25px while the numeral ended 16px
         * from the other edge — three different verticals in one row. Now the row takes the
         * content gutter, the back button is pulled out by exactly its own padding so the mark
         * lands on that gutter, and the numeral ends on it: the chevron, the rule's two ends and
         * the pair all measure from the same two lines. `h-14` with `items-center` puts the 4px
         * rule on the same centre line as the 14px numerals.
         */
        <div className="flex h-14 items-center gap-3 px-6">
          {/* 36px button, a 16px mark, so 10px of padding — and exactly 10px of negative margin
              back, which puts the mark on the 24px gutter the content below it uses. */}
          <div className="-ml-2.5 flex w-9 shrink-0 items-center">
            {stepIndex > 0 ? (
              <IconButton
                label={t('common.back')}
                icon="back"
                variant="ghost"
                size="sm"
                onClick={back}
              />
            ) : null}
          </div>
          <ProgressBar
            value={(stepIndex + 1) / total}
            tone="primary"
            label={t('app.onbStepOf', { n: stepIndex + 1, total })}
            className="flex-1"
          />
          <span className="numeral tabular shrink-0 text-right text-sm">
            <span className="text-text">{String(stepIndex + 1).padStart(2, '0')}</span>
            <span className="text-muted-2">/{String(total).padStart(2, '0')}</span>
          </span>
        </div>
      }
      footer={
        <div className="flex flex-col gap-2">
          {/*
           * «Далее», not «Продолжить» (the designer's note): a wizard moves forward through
           * questions, and «Продолжить» is what you press to resume something you stopped. The
           * last step's button says what pressing it actually does instead of counting steps.
           */}
          {isLast ? (
            <Button
              size="lg"
              fullWidth
              loading={saving}
              disabled={!canContinue}
              onClick={() => void finish()}
            >
              {t('app.onbFinish')}
            </Button>
          ) : (
            <Button size="lg" fullWidth disabled={!canContinue} onClick={next}>
              {t('app.onbNext')}
            </Button>
          )}
          {stepIndex === 0 ? (
            <Button variant="ghost" fullWidth onClick={() => void signOut()}>
              {t('app.authSignOut')}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="py-7">
        <StepView {...stepProps} />
      </div>
    </Screen>
  );
}
