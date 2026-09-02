#!/usr/bin/env node
/**
 * Scaffold a guide article that follows the writing checklist in docs/SEO.md.
 *
 * Usage:
 *   npm run seo:new-guide -- --lang ru --slug kak-delat-berpi --key how-to-burpee \
 *     --cluster no_equipment --keyword "как делать бёрпи" [--title "…"] [--description "…"] [--h1 "…"]
 *
 * Creates content/guides/<lang>/<slug>.md with `draft: true`, the frontmatter fields the collection
 * schema requires and a section skeleton with authoring notes as HTML comments (not rendered,
 * not counted by the audit). Run `npm run seo:audit` after writing; set `draft: false` to publish.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGuideClusters } from './lib.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** @param {string[]} argv */
function parseArgs(argv) {
  /** @type {Record<string, string>} */
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--') && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) {
      out[a.slice(2)] = argv[++i];
    }
  }
  return out;
}

/** @param {string} s */
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** @param {string} s */
function yamlString(s) {
  return `'${s.replace(/'/g, "''")}'`;
}

const args = parseArgs(process.argv.slice(2));
const lang = args.lang ?? '';
const slug = args.slug ?? '';
const key = args.key ?? '';
const cluster = args.cluster ?? '';
const keyword = (args.keyword ?? '').trim();
const clusters = loadGuideClusters(ROOT);
const today = new Date().toISOString().slice(0, 10);

/** @type {string[]} */
const problems = [];
if (lang !== 'ru' && lang !== 'en') problems.push('--lang must be ru or en');
if (!SLUG_RE.test(slug)) problems.push('--slug must be kebab-case (a-z, 0-9, hyphens)');
if (!SLUG_RE.test(key)) problems.push('--key (translationKey) must be kebab-case');
if (!clusters.includes(cluster)) problems.push(`--cluster must be one of: ${clusters.join(', ')}`);
if (keyword.length < 2) problems.push('--keyword is required');
if (clusters.map((c) => c.replace(/_/g, '-')).includes(slug))
  problems.push(`--slug "${slug}" collides with a cluster hub URL`);
if (problems.length) {
  console.error('[new-guide] cannot scaffold:');
  for (const p of problems) console.error(`  - ${p}`);
  console.error(
    '\nExample: npm run seo:new-guide -- --lang ru --slug kak-delat-berpi --key how-to-burpee --cluster no_equipment --keyword "как делать бёрпи"',
  );
  process.exit(1);
}

const file = join(ROOT, 'content', 'guides', lang, `${slug}.md`);
if (existsSync(file)) {
  console.error(`[new-guide] ${file} already exists — refusing to overwrite`);
  process.exit(1);
}

const ru = lang === 'ru';
const kw = capitalize(keyword);
const title = args.title ?? (ru ? `${kw}: гайд тренера` : `${kw}: a coach's guide`);
const h1 = args.h1 ?? kw;
const description =
  args.description ??
  (ru
    ? `${kw}: что делать, какие ошибки встречаются чаще всего и как прогрессировать дома. Разбор от тренера Forma — читай и начинай тренироваться.`
    : `${kw}: what to do, the most common mistakes and how to progress at home. A Forma coach's breakdown — read it and start training.`);

const frontmatter = [
  '---',
  `title: ${yamlString(title)}`,
  `description: ${yamlString(description)}`,
  `h1: ${yamlString(h1)}`,
  `targetKeyword: ${yamlString(keyword)}`,
  'secondaryKeywords: []',
  `cluster: ${cluster}`,
  `translationKey: ${key}`,
  `publishedAt: '${today}'`,
  `updatedAt: '${today}'`,
  'faq: []',
  'relatedExercises: []',
  'relatedCourses: []',
  'relatedGuides: []',
  'cta:',
  '  courseId: start',
  'priority: 0.7',
  'draft: true',
  '---',
].join('\n');

const body = ru
  ? `
<!--
Чек-лист (docs/SEO.md → «Чек-лист статьи»):
- title ≤ 60 символов, description 120–160 с мягким CTA, ключ «${keyword}» в title, h1, первом абзаце, одном H2 и description
- ≥ 900 слов, 4–7 разделов H2 (H3 где нужно), ≥ 3 внутренних ссылки на контент + ≥ 1 на курс
- ссылки на контент: [приседания](exercise:air_squat), [курс «Старт»](course:start), [гайд](guide:workout-formats)
- FAQ 3–5 вопросов, ответы 1–3 предложения; заполни relatedExercises / relatedCourses / relatedGuides
- без выдуманных историй, цифр и отзывов; «ты», без восклицаний; одна страница = один интент
- готово → draft: false → npm run seo:audit
-->

<!-- Хук: 2–3 предложения с ключевым запросом в первых 100 словах и тем, что читатель получит. -->

## Что ты получишь из этой статьи

<!-- 3–5 пунктов. -->

## ${kw}: с чего начать

<!-- Базовые принципы, безопасность, «проконсультируйся с врачом, если…». -->

## Пример тренировки

<!-- Формат, упражнения из библиотеки со ссылками exercise:<id>, повторы, отдых, как приложение масштабирует нагрузку. -->

## Типичные ошибки

<!-- 3–5 ошибок, каждая с исправлением. -->

## Как прогрессировать

<!-- Недели 1–4+, признаки, что пора усложнять. -->

## Итог

<!-- 2–3 предложения и одна ссылка на курс: [курс «Старт»](course:start). -->
`
  : `
<!--
Checklist (docs/SEO.md → "Article checklist"):
- title ≤ 60 chars, description 120–160 with a soft CTA, keyword "${keyword}" in title, h1, first paragraph, one H2 and the description
- ≥ 900 words, 4–7 H2 sections (H3 where useful), ≥ 3 internal content links + ≥ 1 course link
- content links: [air squats](exercise:air_squat), [the Start course](course:start), [the formats guide](guide:workout-formats)
- FAQ 3–5 questions, 1–3 sentence answers; fill relatedExercises / relatedCourses / relatedGuides
- no invented stories, numbers or testimonials; second person, plain; one page = one intent
- done → draft: false → npm run seo:audit
-->

<!-- Hook: 2–3 sentences with the target keyword in the first 100 words and what the reader gets. -->

## What you will get from this guide

<!-- 3–5 bullet points. -->

## ${kw}: where to start

<!-- Core principles, safety, "talk to a doctor if…". -->

## Sample workout

<!-- Format, library exercises linked as exercise:<id>, reps, rest, how the app scales it. -->

## Common mistakes

<!-- 3–5 mistakes, each with the fix. -->

## How to progress

<!-- Weeks 1–4+, signs it is time to make it harder. -->

## Wrap-up

<!-- 2–3 sentences and one course link: [the Start course](course:start). -->
`;

mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, `${frontmatter}\n${body.replace(/^\n/, '')}`);
console.log(`[new-guide] created content/guides/${lang}/${slug}.md (draft: true)`);
console.log('[new-guide] next: write the article, set draft: false, run npm run seo:audit');
