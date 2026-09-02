import { describe, expect, it } from 'vitest';
import {
  auditContentIndex,
  auditGuides,
  auditHtml,
  checkLength,
  collectObjectsWithId,
  containsPhrase,
  extractAlternates,
  extractCanonical,
  extractHeadings,
  extractImages,
  extractLinks,
  localizedHref,
  parseFrontmatter,
  parseSitemap,
  parseTsLiterals,
  readGuideFile,
  resolveContentLink,
  urlToDistFile,
  wordCount,
} from './lib.mjs';

const FRONTMATTER = `---
title: "AMRAP, EMOM, For time: what they mean"
description: 'Coach''s guide to the four CrossFit formats: how each works, how to score it and how to adapt it at home. Read it and pick yours.'
h1: AMRAP, EMOM, For time and Tabata explained
targetKeyword: crossfit workout formats
secondaryKeywords: [amrap meaning, "emom workout", 'tabata']
cluster: formats
translationKey: workout-formats
publishedAt: 2026-09-02
updatedAt: 2026-09-02
faq:
  - q: What does AMRAP mean?
    a: "As many rounds as possible: you repeat the circuit until the clock runs out."
  - q: 'Is EMOM good for beginners?'
    a: >-
      Yes — the built-in rest keeps
      the intensity in check.
relatedExercises:
  - burpee
  - air_squat
relatedCourses: []
relatedGuides: [crossfit-home-beginners]
cta:
  courseId: start
priority: 0.8
draft: false
---

Body starts here.
`;

describe('parseFrontmatter', () => {
  it('parses scalars, flow and block arrays, arrays of mappings, nested mappings and folded scalars', () => {
    const { data, body, hasFrontmatter } = parseFrontmatter(FRONTMATTER);
    expect(hasFrontmatter).toBe(true);
    expect(body.trim()).toBe('Body starts here.');
    expect(data.title).toBe('AMRAP, EMOM, For time: what they mean');
    expect(data.description).toContain("Coach's guide");
    expect(data.h1).toBe('AMRAP, EMOM, For time and Tabata explained');
    expect(data.secondaryKeywords).toEqual(['amrap meaning', 'emom workout', 'tabata']);
    expect(data.cluster).toBe('formats');
    expect(data.publishedAt).toBe('2026-09-02');
    expect(data.faq).toEqual([
      {
        q: 'What does AMRAP mean?',
        a: 'As many rounds as possible: you repeat the circuit until the clock runs out.',
      },
      { q: 'Is EMOM good for beginners?', a: 'Yes — the built-in rest keeps the intensity in check.' },
    ]);
    expect(data.relatedExercises).toEqual(['burpee', 'air_squat']);
    expect(data.relatedCourses).toEqual([]);
    expect(data.relatedGuides).toEqual(['crossfit-home-beginners']);
    expect(data.cta).toEqual({ courseId: 'start' });
    expect(data.priority).toBe(0.8);
    expect(data.draft).toBe(false);
  });

  it('returns the whole text as body when there is no frontmatter', () => {
    const r = parseFrontmatter('# Just markdown');
    expect(r.hasFrontmatter).toBe(false);
    expect(r.data).toEqual({});
    expect(r.body).toBe('# Just markdown');
  });
});

describe('markdown helpers', () => {
  const md = `# H1 title\n\nIntro with a [link](exercise:burpee) and ![figure](img.png) and ![](noalt.png).\n\n## Section one\n\nText **bold** \`code\`.\n\n### Sub\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n## Section two\n\n- item one\n- item [two](course:start)\n`;
  it('counts words without markup', () => {
    expect(wordCount('one two three')).toBe(3);
    expect(wordCount('**bold** and `code` and [link text](x)')).toBe(6);
    expect(wordCount('## Heading\n\n| a | b |\n|---|---|\n| one | two |')).toBe(5);
    expect(wordCount('<!-- comment words -->\nreal')).toBe(1);
  });
  it('extracts headings, links and images', () => {
    expect(extractHeadings(md)).toEqual([
      { depth: 1, text: 'H1 title' },
      { depth: 2, text: 'Section one' },
      { depth: 3, text: 'Sub' },
      { depth: 2, text: 'Section two' },
    ]);
    expect(extractLinks(md)).toEqual([
      { text: 'link', href: 'exercise:burpee' },
      { text: 'two', href: 'course:start' },
    ]);
    expect(extractImages(md)).toEqual([
      { alt: 'figure', src: 'img.png' },
      { alt: '', src: 'noalt.png' },
    ]);
  });
  it('matches phrases loosely', () => {
    expect(containsPhrase('Как делать бёрпи дома?', 'как делать берпи')).toBe(true);
    expect(containsPhrase('CrossFit at home for beginners', 'crossfit at home')).toBe(true);
    expect(containsPhrase('crossfit home', 'crossfit at home')).toBe(false);
  });
});

describe('parseTsLiterals', () => {
  const src = `
import type { ExerciseInput } from '@/content/schema';

// exercises
export const EXERCISES_A: ExerciseInput[] = [
  {
    id: 'air_squat',
    slug: { ru: 'prisedaniya', en: 'air-squat' } satisfies { ru: string; en: string },
    name: { ru: 'Приседания', en: 'Air squat' },
    howTo: [{ ru: 'Шаг 1', en: 'Step 1' }, { ru: 'Шаг 2: "кавычки"', en: "It's fine" }],
    level: 1 as const, /* inline */ loadable: false,
    scaling: { harder: 'jump_squat' },
    tags: [\`warmup\`, 'lower'],
  },
  { id: 'burpee', slug: { ru: 'berpi', en: 'burpee' }, name: { ru: 'Бёрпи', en: 'Burpee' }, level: 2 },
];
const l = (ru: string, en: string): L10n => ({ ru, en });
const COURSE = {
  id: 'start', order: 1,
  slug: { ru: 'start', en: 'start' },
  name: l('Старт', 'Start'),
  tagline: l("It's a 'quoted' one", "en"),
  weeks: WEEKS as number,
  accent: pickAccent('start', 2),
  workouts: [{ id: 'w1', blocks: [{ id: 'b1', items: [{ exerciseId: 'air_squat', reps: 10 }] }] }],
  faq: [],
} satisfies CourseInput;
export const COURSES = [COURSE];
`;
  it('reads objects, arrays, strings, numbers and skips type noise', () => {
    const lits = parseTsLiterals(src);
    const a = lits.find((x) => x.name === 'EXERCISES_A');
    expect(Array.isArray(a?.value)).toBe(true);
    const [first, second] = a.value;
    expect(first.id).toBe('air_squat');
    expect(first.slug).toEqual({ ru: 'prisedaniya', en: 'air-squat' });
    expect(first.name.en).toBe('Air squat');
    expect(first.howTo[1]).toEqual({ ru: 'Шаг 2: "кавычки"', en: "It's fine" });
    expect(first.level).toBe(1);
    expect(first.loadable).toBe(false);
    expect(first.tags).toEqual(['warmup', 'lower']);
    expect(second.id).toBe('burpee');
    const course = lits.find((x) => x.name === 'COURSE');
    expect(course.value.workouts[0].blocks[0].items[0].exerciseId).toBe('air_squat');
    expect(course.value.name).toEqual({ ru: 'Старт', en: 'Start' });
    expect(course.value.tagline).toEqual({ ru: "It's a 'quoted' one", en: 'en' });
    expect(course.value.weeks).toEqual({ raw: 'WEEKS' });
    expect(course.value.accent).toEqual({ raw: "pickAccent('start', 2)" });
    const courses = lits.find((x) => x.name === 'COURSES');
    expect(courses.value).toEqual([{ raw: 'COURSE' }]);
  });
  it('collects only objects with ids (courses and workouts, not items)', () => {
    const course = parseTsLiterals(src).find((x) => x.name === 'COURSE');
    const ids = collectObjectsWithId(course.value).map((o) => o.id);
    expect(ids).toEqual(['start', 'w1', 'b1']);
  });
});

function makeIndex() {
  const exercises = new Map([
    ['air_squat', { id: 'air_squat', slug: { ru: 'prisedaniya', en: 'air-squat' }, name: { ru: 'Приседания', en: 'Air squat' }, file: 'content/exercises/a.ts' }],
    ['burpee', { id: 'burpee', slug: { ru: 'berpi', en: 'burpee' }, name: { ru: 'Бёрпи', en: 'Burpee' }, file: 'content/exercises/a.ts' }],
  ]);
  const courses = new Map([
    ['start', { id: 'start', slug: { ru: 'start', en: 'start' }, name: { ru: 'Старт', en: 'Start' }, file: 'content/courses/start.ts' }],
  ]);
  return { exercises, courses, issues: [] };
}

describe('resolveContentLink / localizedHref', () => {
  const index = makeIndex();
  const guides = [
    { locale: 'ru', slug: 'kak-delat-berpi', data: { translationKey: 'how-to-burpee' } },
    { locale: 'en', slug: 'how-to-do-a-burpee', data: { translationKey: 'how-to-burpee' } },
    { locale: 'ru', slug: 'tolko-ru', data: { translationKey: 'ru-only' } },
  ];
  const ctx = { ...index, guides };
  it('resolves exercises, courses and guides per locale', () => {
    expect(resolveContentLink('exercise:air_squat', 'ru', ctx)).toEqual({ kind: 'exercise', id: 'air_squat', sitePath: '/exercises/prisedaniya/' });
    expect(resolveContentLink('exercise:air_squat', 'en', ctx)).toEqual({ kind: 'exercise', id: 'air_squat', sitePath: '/exercises/air-squat/' });
    expect(resolveContentLink('course:start', 'en', ctx)).toEqual({ kind: 'course', id: 'start', sitePath: '/courses/start/' });
    expect(resolveContentLink('guide:how-to-burpee', 'en', ctx)).toEqual({ kind: 'guide', id: 'how-to-burpee', sitePath: '/guides/how-to-do-a-burpee/' });
  });
  it('reports unknown ids and missing locale versions; ignores normal hrefs', () => {
    expect(resolveContentLink('exercise:nope', 'ru', ctx)).toMatchObject({ error: 'unknown exercise "nope"' });
    expect(resolveContentLink('guide:ru-only', 'en', ctx)).toMatchObject({ error: 'guide "ru-only" has no en version' });
    expect(resolveContentLink('guide:missing', 'ru', ctx)).toMatchObject({ error: 'unknown guide "missing"' });
    expect(resolveContentLink('https://example.com', 'ru', ctx)).toBeNull();
    expect(resolveContentLink('/courses/', 'ru', ctx)).toBeNull();
  });
  it('builds locale-prefixed, base-prefixed hrefs', () => {
    expect(localizedHref('ru', '/exercises/prisedaniya/')).toBe('/exercises/prisedaniya/');
    expect(localizedHref('en', '/exercises/air-squat/')).toBe('/en/exercises/air-squat/');
    expect(localizedHref('en', '/courses/start/', '/forma/')).toBe('/forma/en/courses/start/');
    expect(localizedHref('ru', '/guides/x', 'forma')).toBe('/forma/guides/x/');
  });
});

describe('checkLength', () => {
  const limits = { min: 120, max: 160, hardMin: 60, hardMax: 170 };
  it('grades by soft and hard limits (counting code points)', () => {
    expect(checkLength('x'.repeat(140), limits, 'description')).toBeNull();
    expect(checkLength('x'.repeat(100), limits, 'description')).toMatchObject({ level: 'warning' });
    expect(checkLength('x'.repeat(165), limits, 'description')).toMatchObject({ level: 'warning' });
    expect(checkLength('x'.repeat(50), limits, 'description')).toMatchObject({ level: 'error' });
    expect(checkLength('x'.repeat(171), limits, 'description')).toMatchObject({ level: 'error' });
    expect(checkLength('ё'.repeat(140), limits, 'd')).toBeNull();
  });
});

/**
 * Guide fixture whose body has exactly `opts.words` words (the intro, headings and closing
 * sections count too, so the filler is sized to hit the total).
 */
function guideMarkdown(opts = {}) {
  const words = opts.words ?? 950;
  const scaffold = wordCount(guideMarkdownWith('', opts).split(/^---$/m)[2] ?? '');
  const filler = Array.from({ length: Math.max(0, words - scaffold) }, (_, i) => `word${i % 37}`).join(' ');
  return guideMarkdownWith(filler, opts);
}

function guideMarkdownWith(filler, opts = {}) {
  const keyword = opts.keyword ?? 'crossfit at home for beginners';
  const fm = {
    title: opts.title ?? 'CrossFit at home for beginners: first 4 weeks',
    description:
      opts.description ??
      'CrossFit at home for beginners: how to start safely, what to do in the first four weeks and how to progress. Read the plan and begin today.',
    h1: opts.h1 ?? 'CrossFit at home for beginners',
    targetKeyword: keyword,
    cluster: opts.cluster ?? 'beginners',
    translationKey: opts.translationKey ?? 'crossfit-home-beginners',
    publishedAt: '2026-09-02',
    updatedAt: '2026-09-02',
    draft: opts.draft ?? false,
  };
  const faq = opts.faq ?? [
    { q: 'How often?', a: 'Three times a week is plenty at the start.' },
    { q: 'Do I need gear?', a: 'No — the first weeks are bodyweight only.' },
    { q: 'What if it hurts?', a: 'Stop and talk to a doctor if pain persists.' },
  ];
  const links = opts.links ?? '[air squats](exercise:air_squat), [burpees](exercise:burpee) and [the Start course](course:start)';
  return `---
title: "${fm.title}"
description: "${fm.description}"
h1: "${fm.h1}"
targetKeyword: "${fm.targetKeyword}"
cluster: ${fm.cluster}
translationKey: ${fm.translationKey}
publishedAt: ${fm.publishedAt}
updatedAt: ${fm.updatedAt}
faq:
${faq.map((f) => `  - q: "${f.q}"\n    a: "${f.a}"`).join('\n')}
relatedExercises: [${(opts.relatedExercises ?? ['air_squat']).join(', ')}]
relatedCourses: [${(opts.relatedCourses ?? ['start']).join(', ')}]
cta:
  courseId: ${opts.ctaCourse ?? 'start'}
draft: ${fm.draft}
---

Starting ${keyword} is simpler than it looks: ${links}.

## ${opts.h2 ?? 'CrossFit at home for beginners: the plan'}

${filler}

## Common mistakes

Some text.

## How to progress

More text.
`;
}

describe('auditGuides', () => {
  const index = makeIndex();
  it('passes a well-formed pair without errors', () => {
    const ru = readGuideFile(
      guideMarkdown({ keyword: 'кроссфит дома для начинающих', title: 'Кроссфит дома для начинающих: первые 4 недели', h1: 'Кроссфит дома для начинающих', h2: 'Кроссфит дома для начинающих: план', description: 'Кроссфит дома для начинающих: как начать безопасно, что делать в первые четыре недели и как прогрессировать. Читай план и начинай сегодня.' }),
      'ru',
      'crossfit-doma-dlya-nachinayushchih.md',
    );
    const en = readGuideFile(guideMarkdown(), 'en', 'crossfit-at-home-for-beginners.md');
    const issues = auditGuides([ru, en], index);
    expect(issues.filter((i) => i.level === 'error')).toEqual([]);
    expect(issues.filter((i) => i.level === 'warning')).toEqual([]);
  });

  it('flags short bodies, unknown links, missing translations, duplicate titles and cluster-slug collisions', () => {
    const short = readGuideFile(
      guideMarkdown({ words: 200, links: '[nope](exercise:nope) and [course](course:missing)', relatedExercises: ['ghost'], translationKey: 'a' }),
      'en',
      'a.md',
    );
    const dupTitle = readGuideFile(guideMarkdown({ translationKey: 'b' }), 'en', 'no-equipment.md');
    const issues = auditGuides([short, dupTitle], index);
    const msgs = issues.map((i) => `${i.level}:${i.message}`);
    expect(msgs).toContain('error:200 words (min 800)');
    expect(msgs).toContain('error:link "exercise:nope": unknown exercise "nope"');
    expect(msgs).toContain('error:link "course:missing": unknown course "missing"');
    expect(msgs).toContain('error:relatedExercises "ghost": unknown exercise "ghost"');
    expect(msgs.some((m) => m.startsWith('warning:no ru translation'))).toBe(true);
    expect(msgs.some((m) => m.startsWith('error:title duplicates'))).toBe(true);
    expect(msgs).toContain('error:slug "no-equipment" collides with a cluster hub URL');
  });

  it('skips drafts and warns on soft limits', () => {
    const draft = readGuideFile(guideMarkdown({ draft: true, words: 10 }), 'en', 'draft.md');
    const soft = readGuideFile(guideMarkdown({ words: 850, faq: [], translationKey: 'soft' }), 'en', 'soft.md');
    const issues = auditGuides([draft, soft], index);
    expect(issues.filter((i) => i.file.endsWith('draft.md'))).toEqual([{ level: 'info', file: 'content/guides/en/draft.md', message: 'draft — skipped' }]);
    const softMsgs = issues.filter((i) => i.file.endsWith('soft.md')).map((i) => `${i.level}:${i.message}`);
    expect(softMsgs).toContain('warning:850 words (aim ≥ 900)');
    expect(softMsgs).toContain('warning:0 FAQ items (aim 3–5)');
    expect(softMsgs.some((m) => m.startsWith('error:'))).toBe(false);
  });
});

describe('auditContentIndex', () => {
  it('requires both locales and unique kebab-case slugs', () => {
    const index = makeIndex();
    index.exercises.set('dup', { id: 'dup', slug: { ru: 'prisedaniya', en: 'Bad Slug' }, name: { ru: 'X' }, file: 'content/exercises/b.ts' });
    const msgs = auditContentIndex(index).map((i) => i.message);
    expect(msgs).toContain('exercise "dup" duplicates ru slug "prisedaniya" of "air_squat"');
    expect(msgs).toContain('exercise "dup" en slug "Bad Slug" is not kebab-case');
    expect(msgs).toContain('exercise "dup" has no en name');
    expect(auditContentIndex(makeIndex())).toEqual([]);
  });
});

describe('auditHtml / parseSitemap', () => {
  const good = `<!doctype html><html lang="ru"><head><title>Приседания: техника, ошибки, варианты — Forma</title>
<meta name="description" content="${'Описание '.repeat(14).trim()}">
<link rel="canonical" href="https://example.com/exercises/prisedaniya/">
<link rel="alternate" hreflang="ru" href="https://example.com/exercises/prisedaniya/">
<link rel="alternate" hreflang="en" href="https://example.com/en/exercises/air-squat/">
<link rel="alternate" hreflang="x-default" href="https://example.com/exercises/prisedaniya/">
<meta name="robots" content="index, follow"></head><body><h1>Приседания</h1></body></html>`;
  it('accepts a complete page', () => {
    const r = auditHtml(good, 'dist/exercises/prisedaniya/index.html');
    expect(r.issues).toEqual([]);
    expect(r.title).toBe('Приседания: техника, ошибки, варианты — Forma');
    expect(r.canonical).toBe('https://example.com/exercises/prisedaniya/');
    expect(r.alternates).toEqual([
      { hreflang: 'ru', href: 'https://example.com/exercises/prisedaniya/' },
      { hreflang: 'en', href: 'https://example.com/en/exercises/air-squat/' },
      { hreflang: 'x-default', href: 'https://example.com/exercises/prisedaniya/' },
    ]);
  });
  it('reads canonical/alternate links regardless of attribute order and entities', () => {
    const html = `<link href="https://a.b/x/?q=1&amp;r=2" rel="canonical"><link hreflang="en" href="https://a.b/en/x/" rel="alternate">`;
    expect(extractCanonical(html)).toBe('https://a.b/x/?q=1&r=2');
    expect(extractAlternates(html)).toEqual([{ hreflang: 'en', href: 'https://a.b/en/x/' }]);
    expect(extractCanonical('<link rel="stylesheet" href="x.css">')).toBeNull();
  });
  it('flags a self-hreflang that disagrees with the canonical', () => {
    const html = good.replace(
      'hreflang="ru" href="https://example.com/exercises/prisedaniya/"',
      'hreflang="ru" href="https://example.com/exercises/other/"',
    );
    const msgs = auditHtml(html, 'x').issues.map((i) => `${i.level}:${i.message}`);
    expect(msgs).toContain(
      'error:hreflang="ru" (https://example.com/exercises/other/) differs from the canonical (https://example.com/exercises/prisedaniya/)',
    );
  });
  it('maps URLs to dist files with and without a base path', () => {
    expect(urlToDistFile('https://a.b/exercises/x/', '/d', '/')).toBe('/d/exercises/x/index.html');
    expect(urlToDistFile('https://a.b/', '/d', '/')).toBe('/d/index.html');
    expect(urlToDistFile('https://a.b/forma/en/x/', '/d', '/forma/')).toBe('/d/en/x/index.html');
    expect(urlToDistFile('https://a.b/forma/', '/d', '/forma/')).toBe('/d/index.html');
    expect(urlToDistFile('https://a.b/forma/sitemap.xml', '/d', '/forma/')).toBe('/d/sitemap.xml');
    expect(urlToDistFile('https://a.b/en/x/', '/d', '/forma/')).toBe('/d/__outside-base__/en/x/');
    expect(urlToDistFile('not a url', '/d', '/')).toBeNull();
  });
  it('flags missing tags and noindex', () => {
    const bad = `<html><head><title>A</title><title>B</title><meta name="robots" content="noindex"></head><body></body></html>`;
    const msgs = auditHtml(bad, 'x').issues.map((i) => `${i.level}:${i.message}`);
    expect(msgs).toContain('error:2 <title> tags');
    expect(msgs).toContain('error:no <h1>');
    expect(msgs).toContain('error:no canonical link');
    expect(msgs).toContain('error:noindex on a public page');
    expect(msgs).toContain('error:no meta description');
    expect(msgs).toContain('error:no lang attribute on <html>');
    expect(auditHtml(bad, 'x', { allowNoindex: true }).issues.map((i) => i.message)).not.toContain('noindex on a public page');
  });
  it('parses sitemap entries', () => {
    const xml = `<?xml version="1.0"?><urlset><url><loc>https://a.b/x/</loc><lastmod>2026-09-01</lastmod></url><url><loc>https://a.b/y/?q=1&amp;r=2</loc></url></urlset>`;
    expect(parseSitemap(xml)).toEqual([
      { loc: 'https://a.b/x/', lastmod: '2026-09-01' },
      { loc: 'https://a.b/y/?q=1&r=2', lastmod: undefined },
    ]);
  });
});
