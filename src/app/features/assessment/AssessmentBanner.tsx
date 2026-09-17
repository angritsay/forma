/**
 * The offer to take the self-test, after the second completed workout.
 *
 * **It decides for itself whether it exists.** Mounting it is one line — `<AssessmentBanner />` —
 * because the screen that carries it should not have to know the rule: the component reads the
 * profile and the totals, asks `shouldOfferAssessment`, and renders nothing until all three of
 * its conditions hold. That also means the same line can sit on whichever screen the owner ends
 * up wanting it on without the rule being copied twice.
 *
 * **The register is a calibration, not an exam.** The line under the title is the one the home
 * task already used — «5 упражнений, 3 минуты — просто ответить» — and it is the whole of the
 * promise: two pills' worth of cost, a verb, and a way to say not now. The three movements it
 * scores are what the programme is built from, so what the athlete gets for three minutes is a
 * programme that fits; what they risk is nothing, because «Не сейчас» is remembered and the test
 * is reachable afterwards.
 *
 * It is a banner rather than a card: a card on this product carries a photograph and a workout,
 * and a second one competing with it would read as a second session on offer.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { useT } from '@/app/hooks/useT';
import { useProgress } from '@/app/store/progress';
import { useSession } from '@/app/store/session';
import { dismissAssessment, isAssessmentDismissed } from './dismissal';
import { assessmentTaken, shouldOfferAssessment } from './model';

export function AssessmentBanner({ className }: { className?: string }) {
  const { t } = useT();
  const navigate = useNavigate();
  const trainingProfile = useSession((s) => s.profile?.trainingProfile ?? null);
  const completedWorkouts = useProgress((s) => s.totals?.workouts ?? 0);
  const [dismissed, setDismissed] = useState(isAssessmentDismissed);

  const offer = shouldOfferAssessment({
    completedWorkouts,
    taken: assessmentTaken(trainingProfile),
    dismissed,
  });
  if (!offer) return null;

  return (
    <section className={className} aria-label={t('app.assessBannerTitle')}>
      <div className="flex flex-col gap-4 rounded-control border border-border bg-surface-2 p-5">
        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-base">{t('app.assessBannerTitle')}</h2>
          {/*
           * What it costs and what it asks, in one line — the same one today's task used. The
           * screen behind the button says which five movements and shows them, so repeating the
           * two figures as pills here would be the cost stated twice on a banner with four lines
           * in it.
           */}
          <p className="text-[13px] text-muted">{t('app.assessBannerHint')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => navigate('/assessment')}>
            {t('app.assessBannerCta')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              dismissAssessment();
              setDismissed(true);
            }}
          >
            {t('app.assessBannerLater')}
          </Button>
        </div>
      </div>
    </section>
  );
}
