import { describe, expect, it } from 'vitest';
import { CourseSchema, type Course } from '@/content/schema';
import { breadcrumbJsonLd, courseJsonLd, courseWorkload, faqJsonLd, itemListJsonLd, videoEmbed } from './jsonld';

const course: Course = CourseSchema.parse({
  id: 'start',
  order: 1,
  slug: { ru: 'start', en: 'start' },
  name: { ru: 'Старт', en: 'Start' },
  tagline: { ru: 'Первые шаги', en: 'First steps' },
  description: { ru: 'Описание', en: 'Description' },
  longDescription: [{ ru: 'а', en: 'a' }, { ru: 'б', en: 'b' }],
  forWhom: [{ ru: 'а', en: 'a' }, { ru: 'б', en: 'b' }],
  outcomes: [{ ru: 'а', en: 'a' }, { ru: 'б', en: 'b' }, { ru: 'в', en: 'c' }],
  equipment: ['none'],
  level: 1,
  weeks: 4,
  sessionsPerWeek: 3,
  avgSessionMin: 25,
  accent: '#B9F3E0',
  gradient: ['#B9F3E0', '#C9D6FF'],
  price: { rub: 2990, usd: 29 },
  workouts: [
    {
      id: 'w1',
      name: { ru: 'Т1', en: 'W1' },
      focus: { ru: 'ф', en: 'f' },
      description: { ru: 'о', en: 'd' },
      basePoints: 100,
      blocks: [{ id: 'b1', type: 'metcon', format: 'amrap', durationSec: 600, items: [{ exerciseId: 'air_squat', reps: 10 }] }],
    },
  ],
  nodes: [
    { id: 'n1', week: 1, day: 1, kind: 'test', workoutId: 'w1', title: { ru: 'т', en: 't' } },
    { id: 'n2', week: 1, day: 2, kind: 'rest', title: { ru: 'о', en: 'r' } },
    { id: 'n3', week: 1, day: 3, kind: 'workout', workoutId: 'w1', title: { ru: 'т', en: 't' } },
    { id: 'n4', week: 1, day: 5, kind: 'benchmark', workoutId: 'w1', title: { ru: 'т', en: 't' } },
  ],
  faq: [
    { q: { ru: 'в', en: 'q' }, a: { ru: 'о', en: 'a' } },
    { q: { ru: 'в', en: 'q' }, a: { ru: 'о', en: 'a' } },
    { q: { ru: 'в', en: 'q' }, a: { ru: 'о', en: 'a' } },
  ],
});

describe('jsonld builders', () => {
  it('numbers breadcrumb and list items from 1', () => {
    const bc = breadcrumbJsonLd([{ name: 'Home', url: 'https://x/' }, { name: 'Guides', url: 'https://x/guides/' }]) as { itemListElement: { position: number }[] };
    expect(bc.itemListElement.map((i) => i.position)).toEqual([1, 2]);
    const list = itemListJsonLd([{ name: 'a', url: 'https://x/a' }], 'List') as { numberOfItems: number };
    expect(list.numberOfItems).toBe(1);
  });
  it('returns null for an empty FAQ', () => {
    expect(faqJsonLd([])).toBeNull();
    expect(faqJsonLd([{ q: 'q', a: 'a' }])).toMatchObject({ '@type': 'FAQPage' });
  });
  it('classifies video URLs', () => {
    expect(videoEmbed('https://www.youtube.com/watch?v=abc123XYZ')).toEqual({ kind: 'youtube', embedUrl: 'https://www.youtube-nocookie.com/embed/abc123XYZ' });
    expect(videoEmbed('https://youtu.be/abc123XYZ')).toMatchObject({ kind: 'youtube' });
    expect(videoEmbed('https://vimeo.com/12345')).toEqual({ kind: 'vimeo', embedUrl: 'https://player.vimeo.com/video/12345' });
    expect(videoEmbed('https://cdn.example.com/v.mp4')).toEqual({ kind: 'file', contentUrl: 'https://cdn.example.com/v.mp4' });
  });
  it('builds a Course with locale-specific offers and an ISO workload', () => {
    expect(courseWorkload(course)).toBe('PT5H');
    const ru = courseJsonLd({ course, locale: 'ru', site: 'https://x', url: 'https://x/courses/start/' }) as { offers: { price: number; priceCurrency: string }[] };
    const en = courseJsonLd({ course, locale: 'en', site: 'https://x', url: 'https://x/en/courses/start/' }) as { offers: { price: number; priceCurrency: string }[] };
    expect(ru.offers[0]).toMatchObject({ price: 2990, priceCurrency: 'RUB' });
    expect(en.offers[0]).toMatchObject({ price: 29, priceCurrency: 'USD' });
  });
});
