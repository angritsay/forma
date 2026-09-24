/**
 * The offer to take the self-test, after the second completed workout.
 *
 * **It decides for itself whether it exists.** Mounting it is one line — `<AssessmentBanner />` —
 * because the screen that carries it should not have to know the rule: the component reads the
 * profile and the totals, asks `shouldOfferAssessment`, and renders nothing until all three of
 * its conditions hold. That also means the same line can sit on whichever screen the owner ends
 * up wanting it on without the rule being copied twice.
 *
 * **It is a row, not a card** (design/CHANGELOG.md §18). It used to be a four-line card — a
 * display-face title, the hint, and two buttons on a third line — and on «Курсы» that is a second
 * card competing with the coach's field and the course photograph above the fold, for an offer
 * that is a calibration rather than a session. So it is one row on the dark grey plate, with no
 * border: the title and the hint stacked on the left in the text face, the one button on the
 * right. Two sizes only, the screen's 15 and 13; the title is semibold rather than display, because
 * a display heading on a row makes it a section, and this is a note.
 *
 * **The register is a calibration, not an exam.** The hint is the line the home task already used
 * — «5 упражнений, 3 минуты — просто ответить» — and it is the whole of the promise: the cost, a
 * verb, and a way to say not now. The three movements it scores are what the programme is built
 * from, so what the athlete gets for three minutes is a programme that fits; what they risk is
 * nothing, because «Не сейчас» is remembered and the test is reachable afterwards.
 *
 * **«Не сейчас» is a × now, not a second button.** Two buttons on a row make it a dialogue, and a
 * ghost button beside a filled one is a choice being weighed — but there is nothing to weigh:
 * the second action only puts the row away. A close mark is what «put this away» looks like
 * everywhere else in the product, so it is that, on a 44px tap target, and the word stays as its
 * accessible name.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
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
      <div className="flex items-center gap-3 rounded-tile bg-surface-2 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] leading-tight font-semibold">{t('app.assessBannerTitle')}</h2>
          {/*
           * What it costs and what it asks, in one line — the same one today's task used. The
           * screen behind the button says which five movements and shows them, so repeating the
           * two figures as pills here would be the cost stated twice.
           */}
          <p className="text-[13px] text-muted">{t('app.assessBannerHint')}</p>
        </div>
        <Button size="sm" onClick={() => navigate('/assessment')}>
          {t('app.assessBannerCta')}
        </Button>
        <button
          type="button"
          aria-label={t('app.assessBannerLater')}
          onClick={() => {
            dismissAssessment();
            setDismissed(true);
          }}
          className="tap-target shrink-0 text-muted transition-opacity duration-150 ease-(--ease-out) hover:opacity-70"
        >
          <Icon name="close" size={15} />
        </button>
      </div>
    </section>
  );
}
