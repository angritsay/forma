import { Button } from '@/components/ui/Button';
import { useT } from '@/app/hooks/useT';
import { LEVEL_LABEL } from '@/app/screens/onboarding/labels';
import type { Fitness } from './model';

export interface FitnessCardProps {
  fitness: Fitness | null;
  onRetake: () => void;
  onSetup: () => void;
}

/**
 * The fitness index as the profile's one key number: a dark card cut into the paper, the index
 * at 800 with «из 100» at 200 beside it, the level under it, and the action as the black primary
 * button below the card.
 *
 * The ring this replaced does not survive the paper theme — inside a `bg-ink` inset every token
 * has flipped to the light side, so a white stroke would come out black on black. The button sits
 * outside the inset for the same reason: on paper `--primary` is ink, which is exactly the black
 * button the brandbook wants, but only against the white ground.
 */
export function FitnessCard({ fitness, onRetake, onSetup }: FitnessCardProps) {
  const { t } = useT();
  if (!fitness) {
    return (
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 bg-ink p-5 text-paper">
          <span className="eyebrow text-paper/60">{t('app.profileFitnessEyebrow')}</span>
          <p className="text-[15px] leading-relaxed text-paper/80">
            {t('app.profileFitnessMissing')}
          </p>
        </div>
        <Button size="lg" fullWidth onClick={onSetup}>
          {t('app.profileFitnessSetup')}
        </Button>
      </section>
    );
  }
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 bg-ink p-5 text-paper">
        <span className="eyebrow text-paper/60">{t('app.profileFitnessEyebrow')}</span>
        <p
          className="display text-6xl"
          aria-label={`${t('app.profileFitnessEyebrow')}: ${fitness.index} / 100`}
        >
          <span className="tabular">{fitness.index}</span>{' '}
          <span className="t-thin">{t('app.profileFitnessOf')}</span>
        </p>
        <p className="text-[14px] text-paper/70">
          {t('app.profileFitnessLevel', {
            n: fitness.level,
            name: t(LEVEL_LABEL[fitness.level]),
          })}
        </p>
      </div>
      <Button size="lg" fullWidth onClick={onRetake}>
        {t('app.profileRetakeTests')}
      </Button>
    </section>
  );
}
