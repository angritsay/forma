import type { OnboardingDraft } from './draft';

export interface StepProps {
  draft: OnboardingDraft;
  /** Merge a partial patch into the draft (persisted automatically). */
  update: (patch: Partial<OnboardingDraft>) => void;
  /** Advance to the next step (steps with a form submit call this on Enter). */
  next: () => void;
}
