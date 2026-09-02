/**
 * Guide clusters (topic hubs under /guides/<cluster>/).
 * Lives outside content.config.ts so that lib code and tests can import it without `astro:content`.
 * scripts/seo/lib.mjs reads this file to validate frontmatter — keep it a plain literal.
 */
export const GUIDE_CLUSTERS = [
  'beginners',
  'no_equipment',
  'dumbbells',
  'kettlebell',
  'formats',
  'fat_loss',
  'programming',
  'recovery',
  'mobility',
  'motivation',
  'equipment',
] as const;

export type GuideCluster = (typeof GUIDE_CLUSTERS)[number];

export function isGuideCluster(x: unknown): x is GuideCluster {
  return typeof x === 'string' && (GUIDE_CLUSTERS as readonly string[]).includes(x);
}
