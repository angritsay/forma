/**
 * «Не сейчас» on the assessment banner, remembered.
 *
 * Per device and in `localStorage`, deliberately: the offer is a nudge, not a task the athlete
 * owes, and a nudge waved away on a phone has no business following them to a laptop or costing a
 * row in the database. The assessment itself is remembered on the server — it is the counts in
 * the training profile (`assessmentTaken`), which is why waving the banner away can never lose
 * anything. The banner can always be reached again through the screen that offers it.
 */
export const ASSESSMENT_DISMISSED_KEY = 'forma.assessment.dismissed';

export function isAssessmentDismissed(): boolean {
  try {
    return typeof localStorage !== 'undefined'
      ? localStorage.getItem(ASSESSMENT_DISMISSED_KEY) === '1'
      : false;
  } catch {
    /* Private mode or blocked storage: nothing is remembered, and the banner comes back. */
    return false;
  }
}

export function dismissAssessment(): void {
  try {
    localStorage?.setItem(ASSESSMENT_DISMISSED_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function clearAssessmentDismissal(): void {
  try {
    localStorage?.removeItem(ASSESSMENT_DISMISSED_KEY);
  } catch {
    /* ignore */
  }
}
