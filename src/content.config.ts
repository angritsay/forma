/**
 * Astro content collections.
 * guides: SEO articles in content/guides/{ru,en}/<slug>.md
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const faq = z.array(z.object({ q: z.string().min(1), a: z.string().min(1) }));

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

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/guides' }),
  schema: z.object({
    title: z.string().min(10).max(70),
    description: z.string().min(60).max(170),
    h1: z.string().min(5).max(90),
    targetKeyword: z.string().min(2),
    secondaryKeywords: z.array(z.string()).default([]),
    cluster: z.enum(GUIDE_CLUSTERS),
    /** Pairs RU and EN versions of the same article for hreflang. */
    translationKey: z.string().min(2),
    publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    faq: faq.default([]),
    relatedExercises: z.array(z.string()).default([]),
    relatedCourses: z.array(z.string()).default([]),
    relatedGuides: z.array(z.string()).default([]),
    cta: z.object({ courseId: z.string().optional(), label: z.string().optional() }).default({}),
    priority: z.number().min(0).max(1).default(0.7),
    draft: z.boolean().default(false),
  }),
});

export const collections = { guides };
