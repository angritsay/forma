/** The engine inputs derived from the signed-in profile (level, weight, training profile). */
import { useMemo } from 'react';
import type { Level } from '@/content/schema';
import { computeFitnessIndex } from '@/lib/training/assessment';
import type { UserTrainingProfile } from '@/lib/training/types';
import { useSession } from '@/app/store/session';

export interface TrainingContext {
  /** Null until onboarding stored one — the plan cannot be built without it. */
  profile: UserTrainingProfile | null;
  level: Level;
  weightKg: number | undefined;
}

export function useTrainingContext(): TrainingContext {
  const profile = useSession((s) => s.profile);
  return useMemo(() => {
    const training = profile?.trainingProfile ?? null;
    const level: Level =
      profile?.fitnessLevel ?? (training ? computeFitnessIndex(training).level : 1);
    return { profile: training, level, weightKg: training?.weightKg };
  }, [profile]);
}
