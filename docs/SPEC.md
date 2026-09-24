# Forma — product & engineering specification

This document is the contract every contributor (human or agent) builds against.
Read it fully before touching code. When the spec and the code disagree, the spec wins
unless the spec is provably wrong — in that case fix the spec in the same change.

## 1. What we are building

**Forma** is a web product for a CrossFit coach who sells home-training courses.

- **Landing site** (SEO-first, static): sells 5 home CrossFit-style courses, some with light home
  equipment (dumbbells, kettlebell, pull-up bar, jump rope), some without. A visitor picks a course,
  enters an email; we record `email ↔ course` in the database (lifetime access). Optionally we
  redirect to an external payment link configured per course.
- **Web app** (`/app/`): the user enters the email, receives a one-time code by email, confirms it,
  and gets the fitness app: all courses (owned / locked), a Duolingo-style path per course, a
  leaderboard, a workout count, adaptive difficulty, a workout player with the coach's clip of each movement,
  progress statistics. Russian throughout — copy, descriptions and videos.
- **Backend**: Supabase (Postgres + Auth email OTP + Storage). Frontend is fully static and is
  deployed to GitHub Pages by GitHub Actions.

Nothing is mocked. If a feature needs a service the owner must provision (Supabase project, payment
links, video files), the code integrates with the real service and `docs/SETUP.md` explains how to
provision it. Values only the owner knows (coach name, prices, domain, analytics ids) live in
`content/site/*.ts` and `.env` and are listed in the SETUP "fill-in checklist". Never invent
reviews, statistics, testimonials or "trusted by" claims.

## 2. Tech stack (pinned in package.json — do not add dependencies)

| Area           | Choice                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Site framework | Astro 5, static output, i18n routing (`ru` default without prefix, `en` prefixed)                     |
| App            | React 19 island (`client:only`) mounted at `/app/`, `react-router` HashRouter                         |
| Styling        | Tailwind CSS v4 (`@tailwindcss/vite`) + design tokens in `src/styles/global.css`                      |
| Fonts          | `@fontsource-variable/onest` (UI/body), `@fontsource-variable/manrope` (display) — both have Cyrillic |
| State          | zustand (persisted where noted)                                                                       |
| Backend SDK    | `@supabase/supabase-js` v2                                                                            |
| Validation     | zod (content schemas, forms)                                                                          |
| Tests          | vitest (pure modules: training engine, seo scripts, content validation)                               |
| Lint/format    | eslint (flat config) + prettier                                                                       |
| OG images      | `@resvg/resvg-js` (SVG → PNG at build time)                                                           |

Quality gates (all must pass before a commit): `npm run check` (astro check + tsc), `npm run lint`,
`npm run test`, `npm run build`, `npm run seo:audit`.

Do **not** run a dev server or preview server (owner preference). Verify with builds, tests and
static rendering (e.g. resvg for SVG frames).

## 3. Repository layout

```
astro.config.mjs, tsconfig.json, vitest.config.ts, eslint.config.js, .prettierrc, .env.example
content/                    # editable product content (TypeScript / Markdown), validated by zod
  site/                     # brand.ts, coach.ts, pricing.ts, links.ts  (owner-editable config)
  exercises/                # exercise library: one file per group, index.ts exports EXERCISES
  courses/                  # one file per course (5), index.ts exports COURSES
  guides/{ru,en}/*.md       # SEO articles (Astro content collection "guides")
  seo/                      # keywords.json (clusters), redirects, seo config
src/
  content.config.ts         # Astro content collections (guides)
  content/schema.ts         # zod schemas + TS types for exercises/workouts/courses (CONTRACT)
  content/registry.ts       # validated, indexed access to content
  i18n/                     # index.ts (t(), locale helpers) + ru/*.ts en/*.ts per namespace
  styles/global.css         # tokens + tailwind theme
  lib/training/             # training-science engine (pure TS, tested)
  lib/api/                  # Supabase client + typed data access (auth, profiles, sessions...)
  lib/seo/                  # JSON-LD builders, url/hreflang helpers, sitemap registry
  lib/util/                 # l10n helpers, paths (withBase), dates
  layouts/                  # Base.astro (html shell, SeoHead, fonts), Landing.astro (nav/footer)
  components/seo/           # SeoHead.astro, JsonLd.astro, Analytics.astro
  components/landing/       # landing sections (Astro)
  components/media/         # ExerciseStill: one frame of a movement's clip (used by app AND landing)
  components/ui/            # React UI kit used by the app (Button, Card, Chip, Sheet, ...)
  app/                      # React SPA: main.tsx, router.tsx, store/, screens/, hooks/
  pages/                    # Astro routes (see §9)
supabase/
  migrations/*.sql          # schema, RLS, functions, views, triggers (idempotent where possible)
  templates/*.html          # auth email templates (OTP code)
scripts/
  seo/                      # audit.mjs, indexnow.mjs, new-guide.mjs, og.mjs
  content/                  # validate.mjs (runs zod over content)
docs/                       # SPEC.md (this), SETUP.md, SEO.md, TRAINING_SCIENCE.md, CONTENT.md
.github/workflows/          # ci.yml (checks), deploy.yml (GitHub Pages)
public/                     # favicon.svg, icons, manifest
```

## 4. Conventions

- Code, comments, commit messages, docs: **English**. Product copy: **both languages**. `LOCALES`
  in `src/content/schema.ts` is `['ru', 'en']` — Russian keeps the bare paths, English lives under
  `/en/`, both get hreflang and a switch in the site header. Every dictionary key and every content
  field carries both values by construction (the RU dictionary is typed against the EN one, and
  `L10nSchema` requires both), so the languages cannot drift apart silently. What the coach types
  in the admin has both halves too — see §4a for how, and §4b for the little that stays Russian.
  - The app asks which language on its **first screen**, before sign-in, and keeps the answer in
    `localStorage` until there is an account and in `profiles.locale` after. It can be changed in
    the account, and the bot writes in whatever it says.
- TypeScript strict. No `any` unless interfacing with untyped JSON (then narrow immediately).
- Every user-visible string goes through i18n (`t()`) or an `L10n` content field. No hardcoded
  strings in components.
- File ownership: each area owns its folders (see §3). Shared contracts (`src/content/schema.ts`,
  `src/i18n/index.ts`, `src/styles/global.css`, `src/lib/training/index.ts` exports) change only with
  care and a note in the result.
- i18n namespaces: `common`, `landing`, `app`, `training`, `seo`. Each namespace is a file in
  `src/i18n/ru/<ns>.ts` and `src/i18n/en/<ns>.ts` with identical key sets (a test enforces parity).
- Tailwind utilities + tokens; no inline hex colors in components. A course's tile colour comes
  from content (`course.tile`) and is applied via the `--course-tile` CSS variable.
- Accessibility: interactive elements are `<button>`/`<a>`, images have `alt`, overlays close on
  Esc, focus visible, color contrast ≥ 4.5:1 for text on dark surfaces.
- Mobile-first, with one breakpoint. The app is designed for a phone (390px), and that is what it
  is **below `md` (768)**: a 480px column with the bottom tab bar. **From `md` up it uses the
  screen** — the frame releases its cap, the tab bar hides and `TopNav` takes over as a row across
  the top, with `AdminNav` as a second column inside `/admin`. This reverses the rule that stood
  here («centered max-width 480px app frame on large screens»), and the reversal is the owner's:
  she builds courses from a laptop, and a 480px strip in the middle of one is a phone stranded in a
  grey field. Content is capped at 760px for reading screens, 1040px for the screen that splits
  in two (the club) and 1280px for the admin; a sheet becomes a centred dialog at the same
  breakpoint. Landing is responsive 360px → 1440px.
- `AdminNav` is the one component that waits for `lg` (1024) instead. Its rail is 264px, which is a
  third of a tablet: at `md` it left the purchases 504px — less than a phone gives them — so a
  tablet takes the phone's route into the admin and spends the whole width on the work.
- Which screens re-lay out rather than stretch, from `md`: Today (workout left, the rest right),
  Programmes (tickets two across), the club (day left, week's board right), the profile
  (identity left, settings right), the player (clip left, counter and «дальше» right), the course
  day in the admin (list of days left, editor right), and the progress details (figures two across).
  Everything else keeps one column and gains air.
- The type scale does not change with the screen (`design/` calls it «мобайл-первая, 390px»). What
  grows on a wide screen is the gutter, the column count and the air between sections.
- Dates: store ISO strings; "today" is computed in the user's local timezone for the training count;
  server timestamps are `timestamptz`.
- Errors: never crash to a blank screen; show a localized error state with retry.

## 4a. Translating what the coach types

Everything authored in the admin has both halves: the course and its days, the workout builder's
title, description and per-exercise notes, the club's daily task, an admin-authored exercise.

**One switch per screen, not a second field per field.** A course has fifteen text fields; an
English box under each would double the form, and it is filled one language at a time anyway —
Russian to ship, English whenever. «Пишем на» sits above the form, the fields show that half, and
the **placeholder is the other half**. That is the whole translation interface: flip to English
and every field holds the Russian text greyed out — what to translate, and the fact that this one
is still empty, in the place you are already looking. The choice is one setting for the whole
admin (`src/app/features/admin/adminLocale.ts`), remembered between sessions: translating a course
is an evening, not a form.

**Russian is the source.** A record being created locks to Russian and shows «Сначала по-русски»
instead of the switch — otherwise a switch left on English from last time meets a coach typing an
English name into a form whose required field is the Russian one, and a Save button that will not
press with nothing to say why.

**Nothing is required.** An empty English half means "not translated", and the app substitutes the
Russian (`l10n()` in `src/lib/courses/draft.ts`, and the same rule by hand in `TaskCard`): a title
in the wrong language can still be navigated by, an empty one cannot. So an empty field **erases**
its half rather than storing `''`, which would read as written text and defeat the substitution —
`put()` in `adminLocale.ts`, and the test that pins it.

Nothing is ever copied from the Russian column into the English one, either. Russian text sitting
in an English field is indistinguishable from a translation, and after that "what is still
untranslated" can never be answered.

## 4b. What stays Russian

**The payment page.** Prodamus is Russian, in roubles, and it only takes Russian cards — so the
English reader is not sent there. There is a second till, lava.top, which takes foreign cards and
sends a webhook, and `payRoute()` in `src/lib/util/payment.ts` picks between the two by the
reader's language. All four places that take money go through it: the landing's order form, the
course unlock sheet, the club's join button and the coach's booking.

The rouble till's link is checked first and in every language, because it is what says the thing is
on sale at all; when lava has no product for it the route is null and the button falls back to the
support address, never to the rouble till — that would restore the wall the second till exists to
remove.

`supabase/functions/lava-webhook` opens the access. Two doors, the token and the HMAC signature, as
with Prodamus; then `product.id` says what was bought, which Prodamus cannot do. **Its contract is
reconstructed from lava.top's public SDK rather than from their documentation**, and a mismatch is a
403 with nothing written — so a wrong contract reads as "payments do not arrive", never as access
granted to somebody who did not pay. `docs/SETUP.md` §7.9 has the whole setup and says that the
first real payment is the test.

Prodamus keeps the rouble buyers because it issues the receipts Russian retail requires; moving
those over is a decision with accounting inside it.

The sign-in e-mail lives here too (`supabase/templates/otp.html`, deployed by **Actions → Supabase
apply → `email-templates`**), and it says everything twice: Russian first, English under it in a
quieter colour. Supabase keeps one template per email type and there is no account yet to read a
language from — per-language letters need the Send Email Hook and an email provider of our own. The
legal documents remain the owner's: the Russian text is the binding one, and the English half is a
translation for reading, not a second contract.

## 5. Brand & design system

- Name: **Forma** (`content/site/brand.ts`). Tagline RU "Кроссфит дома. Под тебя." EN "Home CrossFit
  that adapts to you."
- Look: a graphite ground (`#121212`, darkened from charcoal in `design/CHANGELOG.md` §16) throughout — the only background there is, structured by hairline rules and editorial numerals rather
  than by a card around every object; where an object does get a plate, the plate is frosted glass
  over the ground (`.glass-card`, §16). Composition is asymmetric — a 7/5 grid, not a balanced
  split; headings sit low against their column; photographs bleed past the page gutter. Large
  radii where an object is genuinely discrete (24px cards, 20px tiles) and 16px on everything
  interactive — buttons, inputs and chips alike, with **sentence-case labels** (`design/CHANGELOG.md`
  §13.1: the capitals came off the whole product, app and site, and the tracking came off with
  them). A _fact_ that is not a control — «12 баллов», the prize, a trial's days left — is a fully
  rounded pill (`Pill`), and a person or a rank is a circle (`Avatar`, the board's numerals): the
  owner's prototype (`design/ui_kits/app-v2`) draws them so, and `design/CHANGELOG.md` §10 records
  the reversal of the earlier «no pills, no circles» rule. **A button may be a pill too, and the
  ground decides which** (§13.2): a control laid on a photograph is a pill, a control on a flat
  ground is a rounded rectangle at `--r-control`. That replaces §10's pressed-versus-read line,
  which the owner's two mockups broke by disagreeing — «Продолжить» on the course photograph is a
  full pill and «Вступить за 666 ₽ / мес» on the page ground is a 16px rectangle, and both get
  pressed. `Button`/`LinkButton` carry it as `shape="pill"`. **Glass** (`design/CHANGELOG.md` §8
  for the material, §16 for where it goes): chrome with content moving under it — a screen header,
  a sheet, a modal, the player — and, since §16, plates and cards over the ground or a photograph
  (`.glass-card`, denser `.glass-card-2/-3`), the tab-bar capsule (`.glass-capsule`) and neutral
  tags and badges (`.glass-tag`). Every glass is a gradient of three alphas over `--surface-rgb`
  (the capsule over `--bg-rgb`) with a hairline, and falls back to the solid surface under
  `@supports not (backdrop-filter)` and `prefers-reduced-transparency`. List rows, table rows and
  text blocks stay solid (no blur per row of a long list), and coloured tags stay solid because
  their colour is their meaning (§15). **The app's tab bar (Курсы / Клуб / Тренер, plus Админка as
  a fourth seat for whoever has the panel — the profile is a sheet behind a person glyph, not a
  tab) is an iOS segmented control**: one dark glass capsule floating over the bottom of the
  screen, inset from both sides, holding equal segments of sentence-case words with a lighter
  capsule on the current one. No icons — that is the owner's mockup. (Its sentence case is no
  longer a departure: §13.1 took the capitals off every control in the product, and this bar
  simply got there first.) It was opaque for a reason §8 gives — a flat alpha lets running text
  read through it, and with the leaderboard scrolled underneath, the row «13 Настя 105» was
  legible inside the capsule — and §16 answers that with density rather than opacity: the
  capsule is .96 of the ground where the labels sit and sheer only at the edge the list arrives
  from, so the material shows without the row reading through the words. The
  lighter capsule is a share of however many seats the bar has, never a hard-coded quarter,
  because the same bar is three seats for most people and four for an admin; the current seat's
  word is `--text` on it and never `--muted`, which measures 3.6:1 there against the 4.5 §4 sets.
  A screen arrives the way the capsule went (`screenMotion`). Generous spacing, 1px borders
  (`--border`).
- **Palette — one job per colour** (`design/CHANGELOG.md` §14; the owner's pick of «style A, and
  the gradient for the club»). The ground is graphite and may not be another colour; white lives
  in elements (plates, badges), never as a screen. **Light blue `#AFE9FD`** (`--accent`) is the
  brand and the interface accent: links, focus rings, the active state, accent words, the
  wordmark's dot (14.18 on the ground). **The blue field `#2038E2`** (`--field`) is one hero card per screen — white bold
  type (7.71), its key word in light blue (5.8), a hand-drawn swoosh; electric blue is never type
  on graphite (2.43). **Neon `#F4FF3F`** (`--action`) is action: the one main button of a screen
  and the tags «новое», «задание дня», «лидер», «сегодня», with `#111111` ink. **The crossroads
  gradient** (`--grad-crossroads`, light blue → beige → orange → blue) belongs to the club alone —
  streak ring, day dots, glow, key words (`.text-gradient`, only its warm half `--grad-warm` as
  type). Section colours are tags, not fields: beginners orange `#FF5A00`, dumbbells neon
  `#F4FF3F`, yoga beige `#FFE6D0`, club `#2038E2`, coach bleu ciel `#007BFF` (4.71 on the graphite
  ground since §16 — it reads as small type now, where on charcoal it was large-only at 4.37). No
  text is ever drawn as an outline. **Three card treatments** (`design/CHANGELOG.md` §17, the
  owner's «для курсов — картинки и стекло, для тренировок от тренера — яркие цвета; в клубе —
  градиент»): a course card is its photograph, and the hero of «Курсы» is that photograph with a
  plate of dense glass tinted from the ground pinned to its bottom (`.glass-card-on-art`) — no
  blue field on that screen; a coach's assigned workout is a bright field, ciel first and then
  orange and neon by index only to tell several apart, ink on all three, where neon is identity
  and not «now» (`coachCardFill()`); and **the club has no neon at all** — its buttons, its prize
  pill and its leader's circle are the warm half of the crossroads gradient under ink (`Button`
  `gradient`, `Pill` `warm`, `.bg-warm`; the electric-blue end can never carry a label), today's
  streak dot is orange. So: neon is the main action everywhere except the club; the club's main
  action is the warm gradient (`club-no-neon.test.ts`).
- **Ink on a coloured fill is chosen by measured contrast**, not by lightness: `tileInk()`
  (`src/lib/ui/tile.ts`) measures `#111111` and white against the fill and takes the better one;
  `tileAccent()` gives a section's colour as type on graphite (the fill when it clears 4.5 — bleu
  ciel included now, light blue for electric blue, plain text for a neutral surface).
  `tile.test.ts` is the AA gate.
- Tokens (`src/styles/global.css`, whose header comment is the reference): `--bg #121212`
  (`--bg-rgb 18,18,18`), `--surface #1C1C1C` (`--surface-rgb 28,28,28`), `--surface-2 #262626`,
  `--surface-3 #303030` — the hidden courses' tiles `#2E2E2E` / `#383838` are identity colours
  stored in content and the database and did not move with the surfaces —
  `--border rgba(255,255,255,.10)`, `--text #F6F6F7`, `--muted #B9B9C0` (9.60), `--muted-2 #A6A6AE`
  (7.75; 5.46 on surface-3),
  `--primary #FFFFFF` (on-primary `#121212`), `--accent #AFE9FD` (on-accent `#111111`),
  `--action #F4FF3F`, `--field #2038E2`, `--orange`, `--ciel`, `--beige`, `--ink #111111`,
  `--course-beginners/-dumbbells/-yoga/-marathon` with darker `-ink` variants for type on white,
  `--success #7CE0B0`, `--warning #FFD166`, `--danger #FF6B6B` (not recoloured — neon must not
  read as «warning»), course tiles `--tile-1…5`, radii `--r-card 24px`, `--r-tile 20px`,
  `--r-inner 12px`, `--r-control 16px`, `--r-pill 999px`.
- Typography: display = Manrope variable 600 (`font-display`; 800 for the wordmark), body/UI =
  Onest variable (`font-sans`). Both are chosen for Cyrillic first: an earlier pair drew и, п and
  т as composite glyphs pointing at the Latin u, n and m outlines, so every Russian heading
  rendered as pseudo-Latin. Display leading is 1.18 and tracking -0.02em — measured floors, not
  taste: Й reaches 0.926em above the baseline and у drops to -0.240em in Manrope, so lines collide
  below 1.166em. Numbers in timers use `font-sans` with tabular figures — both faces expose
  `tnum`.
- Kickers (`.eyebrow`) are **13px sentence case at 0.01em**, `--muted`. They used to be 11px
  capitals at 0.18em, and the note this spec carried against that — Cyrillic capitals are
  near-uniform rectangles, so a Russian label in caps loses its word silhouette and roughly
  doubles its set width — is the argument the owner has now applied to the whole product
  (`design/CHANGELOG.md` §13.1). The escape hatch it prescribed, `.eyebrow-sentence`, is deleted:
  `.eyebrow` is that class now, to the pixel, and two names for one treatment is how a product
  ends up with two of everything.
  A kicker is still a **label, not a sentence** — two or three words. `src/i18n/eyebrow.test.ts`
  fails the build on a string over 29 characters inside an `.eyebrow`, which is the same ~210px
  budget as before, re-measured against the face that renders now (7.03px per character at 13px
  sentence case, where capitals at 11px/.18em averaged 9.5px). A string too long to be a kicker is
  not a kicker: set it as body text at the same size and colour, one step lighter.
- Photography is the main visual surface: full-bleed, monochrome, grained, white text over a
  protection gradient (`.photo-mono` / `.photo-grain` / `.photo-scrim`, and the landing's
  `PhotoBlock.astro`). **The current photographs are placeholders** — see `src/lib/media/photos.ts`: they
  are remote Unsplash URLs rather than vendored files, and the pictures themselves are wrong for a
  product about training at home.
- A still from the coach's clip (`components/media/ExerciseStill`) is the second illustration
  system: `images/exercises/<id>.jpg` in the public bucket, drawn on the flat course tile. It
  carries a course's identity wherever a photograph does not exist — catalogue rows, the top of a
  workout, the movement grid. Where a movement has no clip the tile is left flat; nothing is drawn
  to stand in for footage that has not been shot.

## 5a. Sound

Eight cues, synthesised in `src/app/features/player/sound.ts` — no audio files anywhere. Two
oscillators per note (a sine and a quiet octave above it), a fast attack and an exponential decay,
which is what stops a short beep sounding like a kitchen timer.

**One transition, one sound.** Moving to the next exercise announces itself once, however it
happened: a countdown running out, «Готово» after a set, a skip, the → key. That is why a step
that advances by itself stays silent at zero (`useCountdownCues(..., null)`) — the advance is
already the announcement, and a cue on both would be the same event said twice a fifth of a second
apart, forty times a session. Only a step that runs out and _stays_ — an AMRAP waiting for its
score, a for-time piece hitting its cap — says `end` for itself.

| cue                    | when                                                               | shape                                                                                              |
| ---------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `tick` / `tickLast`    | the last three seconds                                             | one note; the final second is higher, so the row is heard as an approach rather than as background |
| `next`                 | the next exercise, by any route                                    | a short rising pair — the most frequent sound in the product and therefore the quietest            |
| `go` · `round` · `end` | a test starts · a round is counted · time is up with nowhere to go | as before                                                                                          |
| `finish`               | the workout is over                                                | an arpeggio with the notes overlapping; the one cue allowed half a second                          |
| `award`                | an achievement opened                                              | a spark upward over a soft held note; once per save, however many unlocked                         |
| `horn`                 | the end of an assessment window                                    | a single long low tone                                                                             |

Loudness is part of the meaning: the cues that repeat all session are quieter than the ones that
happen once, and a test holds that rule so the next person to edit the table does not "turn it up
a bit". Everything is in a C pentatonic, so two cues that overlap cannot clash.

**There is an off switch, in the account** — not over the clip, because it is a preference rather
than something reached for mid-set. It has to exist: a sound that cannot be turned off gets the
whole phone muted instead, which takes the one cue worth hearing down with the rest.

## 6. Content model (contract: `src/content/schema.ts`)

`L10n = { ru: string; en: string }`. All content is TypeScript validated by zod at test time and
by `scripts/content/validate.mjs`.

**Exercise** — id (`snake_case`), `slug: L10n` (latin, kebab-case; RU slug is a transliteration or a
recognizable latin term), `name`, `description` (2–4 sentences), `howTo[]` (≥3 steps), `cues[]`
(≥2), `mistakes[]` (≥1), `breathing?`, `muscles[]`, `pattern`, `equipment[]` (`['none']` for
bodyweight), `level 1|2|3`, `unit` (`reps|seconds|meters|calories`), `secondsPerRep` (required for
reps), `met` (metabolic equivalent), `loadable`, `scaling {easier?, harder?}` (exercise ids),
`video? {ru?, en?}` (URL or `storage:<bucket>/<path>`), `tags[]`, `isTest?`.

**Workout** — `id`, `name`, `focus`, `description`, `blocks[]`, `basePoints` (60–250), `tags[]`.
**Block** — `id`, `type` (`warmup|skill|strength|metcon|core|cooldown|test`), `format`
(`sets|circuit|amrap|emom|fortime|tabata|interval`), `title?`, `description?`, `sets?`, `rounds?`,
`durationSec?` (AMRAP length / For-time cap), `workSec?`/`restSec?` (tabata/interval),
`restBetweenSetsSec?`, `restBetweenRoundsSec?`, `items[]`, `scalable` (default true; warmup and
cooldown are not scaled).
**WorkoutItem** — `exerciseId`, exactly one of `reps|seconds|meters|calories`, `load?`
(`light|medium|heavy`), `perSide?`, `note?`, `restAfterSec?`.
**CourseNode** — `id`, `week`, `day`, `kind` (`workout|rest|test|benchmark|milestone`),
`workoutId?` (required for workout/test/benchmark), `title`, `subtitle?`, `deload?`
(rest nodes, default 7000).
**Course** — `id`, `order`, `slug: L10n`, `name`, `tagline`, `description`, `longDescription[]`,
`forWhom[]`, `outcomes[]`, `equipment[]`, `level`, `weeks`, `sessionsPerWeek`, `avgSessionMin`,
`tile` (hex — a programme colour `#FF5A00` / `#F4FF3F` / `#FFE6D0` or a neutral `#2E2E2E` /
`#383838`; the blues are the club's and the coach's, never a course's), `price {rub, usd}`, `paymentUrl? {ru?, en?}`,
`introVideo? {ru?, en?}`, `workouts[]`, `nodes[]`, `faq[]`.

Content rules: exercises referenced by workouts must exist; every exercise used by a course must be
doable with the course equipment (or `none`); every course has ≥1 test node at start
(baseline; a level-1 course may open with its first workout, since the onboarding self-tests set the
starting load) and end; rest nodes between consecutive workout days; week 4 (and 8) are deload weeks in
6–8-week courses (the beginner course `start` follows the coach's own programme and has none).

## 7. Training-science engine (contract: `src/lib/training/index.ts`)

Pure TypeScript, no I/O, fully unit-tested, documented in `docs/TRAINING_SCIENCE.md` with the
sources behind each rule (ACSM guidelines, progressive overload, RPE/RIR autoregulation, deloads,
MET-based energy expenditure, WHO physical activity guidance).

Public API (types in `types.ts`):

```ts
computeFitnessIndex(profile: UserTrainingProfile): { index: number /*0..100*/; level: 1|2|3; components: Record<string, number> }
initialScale(index: number): number              // maps 0..100 → 0.6..1.3 (volume multiplier)
recommendDifficulty(state: CourseState, profile: UserTrainingProfile, nowIso: string): { choice: DifficultyChoice; reason: L10n }
prescribeWorkout(workout: Workout, opts: PrescribeOptions, lookup?: ExerciseLookup): PrescribedWorkout   // concrete reps/seconds/loads, substitutions, rest
estimateDuration(p: PrescribedWorkout): DurationEstimate                        // seconds, per block
estimatePoints(workout: Workout, choice: DifficultyChoice, opts?: { repeat?: boolean }): number
estimateCalories(p: PrescribedWorkout, weightKg?: number, lookup?: ExerciseLookup): number
buildPlayerSteps(p: PrescribedWorkout): PlayerStep[]                            // block_intro → work → rest … → done
warmupSkipIndex(steps: readonly PlayerStep[], p: PrescribedWorkout): number | null  // where "skip the warm-up" lands
summarizeSession(p: PrescribedWorkout, results: ExerciseResult[], feedback: SessionFeedback, opts): SessionSummary
adaptScale(state: CourseState, summary: SessionSummary): { scale: number; delta: number; reason: L10n }
countTraining(days: DayActivity[], todayIso: string): TrainingCount   // total, thisWeek, bestWeek, activeWeeks
levelForPoints(points: number): LevelInfo
```

Rules (defaults; constants live in `constants.ts`):

- Difficulty choice multipliers: easier ×0.85 volume / ×1.15 rest, normal ×1.0, harder ×1.15 volume
  / ×0.9 rest. Points factor: easier 0.8, normal 1.0, harder 1.25. Repeating a completed node yields
  50% points. **No streak bonus** — it was +10% at ≥7 consecutive days and +20% at ≥30, and a
  course with two rest days a week could not be followed and earn it.
- Adaptation after a session (Borg CR10 RPE + completion ratio): completion ≥0.95 and RPE ≤6 →
  scale +0.05; RPE 7–8 and completion ≥0.9 → +0.02; RPE ≥9 or completion <0.8 → −0.05;
  feeling `pain` → −0.10 and a "see a professional / reduce load" note. Scale clamped to 0.5..1.5.
- Recommendation before a workout: `harder` if the last two sessions had RPE ≤6, completion ≥0.95
  and no pain, and ≥48h passed since the last session; `easier` if the last session reported pain or
  RPE ≥9, or completion <0.8, or <24h since the last session; otherwise `normal`. History is ordered chronologically (instants, not strings).
- Deload nodes: volume ×0.65, rest ×1.2, points as normal.
- Duration: reps × `secondsPerRep` (× scale), seconds as given, plus rest, plus 8s transition per
  item, plus 20s per block intro; AMRAP/EMOM/Tabata durations are fixed by format; For-time uses the
  estimated work time capped by `durationSec`. Only the rests the player actually plays are counted
  (no rest after the last set, round or interval), so the estimate matches the player timeline.
- Completion: each work step is weighted by its estimated seconds; `achieved` is read the way the
  step is run — seconds for a timer step (seconds item, EMOM minute, Tabata/interval round), reps
  for a reps step. A `test` block's step (`isTest`) is a max effort against the clock: the client
  records the measurement for the benchmark and the step counts as done or skipped.
- Calories: MET × weightKg × hours per work interval (rest at 1.5 MET), default weight 70 kg.
- Substitutions: level 1 users or limitations map exercises to `scaling.easier` (recursively up to 2
  steps); `harder` choice at level 3 may use `scaling.harder` for bodyweight items, never inside a
  non-scalable block (warm-up, cool-down) or a `test` block — a benchmark must stay the same
  movement. A substitute measured in another unit keeps the work time, not the number.
- Training count: a day counts if a workout session was completed on it. `countTraining` returns
  the total, the count since Monday, the best single week and how many weeks hold a workout.
  Duplicates merge, future dates are ignored, and nothing decays — **gaps cost nothing**, which is
  the whole difference from the streak this replaced.
- Fitness index: weighted components — push-ups (30%), squats/60s (25%), plank (20%), activity
  (15%), experience (10%), using age/sex-normalized reference tables documented in
  TRAINING_SCIENCE.md; level 1 <35, level 2 35–65, level 3 >65.

## 8. Backend (Supabase) — contract: `supabase/migrations`, `src/lib/api`

Auth: email OTP. Client calls `auth.signInWithOtp({ email, options: { shouldCreateUser: true } })`,
then `auth.verifyOtp({ email, token, type: 'email' })`. The Supabase email template must include
`{{ .Token }}` (template in `supabase/templates/otp.html`, RU+EN in one email).

Tables (all with RLS enabled):

- `profiles` (`id uuid pk → auth.users`, `email text`, `display_name text`, `avatar_seed text`,
  `locale text default 'ru'`, `training_profile jsonb` (UserTrainingProfile), `fitness_index int`,
  `fitness_level int`, `onboarded_at timestamptz`, timestamps). Own row read/write. Created by trigger
  on `auth.users` insert.
- `purchases` (`id uuid`, `email citext`, `course_id text`, `status text` in
  `pending|active|refunded`, `source text`, `locale text`, `note text`, `created_at`,
  `activated_at`). Unique `(email, course_id)`. Anonymous inserts only through RPC
  `create_order(p_email, p_course_id, p_locale, p_source)` (security definer, validates email and
  course id, upserts pending). Users read their own via view `my_entitlements` (`course_id`,
  `activated_at`) filtered by `lower(email) = lower(auth.email())` and `status = 'active'`.
  Admins (`admins(email)` table + `is_admin()`) read/update all.
- **Free first workout (0019).** `workout_sessions` accepts an insert for a course the caller does
  not own while `can_try_course(course_id)` holds — that is, while they have no _completed_ session
  in it. One free workout per course, spent by finishing it rather than by starting it. The client
  is stricter than the policy: only the **first trainable node** is offered, because the database
  does not know the order of nodes (`src/app/features/courses/courseAccess.ts`).
  `my_trained_courses()` is how the app knows which trials are spent — `recentSessions` is a window
  of twenty and cannot answer it.
- **Course activation is automatic (0019).** `apply_course_payment(email, provider_ref, paid_at,
course_id?)` is called by `prodamus-webhook` for any amount that is not a plan. It resolves the
  course from the caller's single `pending` purchase rather than from the amount — short Prodamus
  links drop query parameters, so the course id cannot travel with the payment — and answers null
  when that is ambiguous, leaving the row for the coach. `purchases.provider_ref` makes a
  re-delivered notification idempotent. `content/site/plans.test.ts` guards that no course price
  equals a plan price, which would otherwise route a course payment to the subscription branch.
- `user_course_state` (`user_id`, `course_id`, `scale numeric`, `current_node_index int`,
  `completed_node_ids text[]`, `updated_at`), pk `(user_id, course_id)`. Own rows.
- `workout_sessions` (`id uuid`, `user_id`, `course_id`, `node_id`, `workout_id`, `difficulty text`,
  `scale numeric`, `prescribed jsonb`, `results jsonb`, `rpe int`, `feeling text`, `completion
numeric`, `points int`, `duration_sec int`, `calories int`, `started_at`, `completed_at`,
  `local_date date`). Own rows.
- `benchmarks` (`user_id`, `key text`, `value numeric`, `unit text`, `recorded_at`) — personal
  records from test nodes. Own rows.
- Leaderboard: security-definer function `get_leaderboard(p_period text /*week|all*/, p_course_id
text default null, p_limit int default 100)` returning `(user_id, display_name, avatar_seed,
points, rank, is_me)`. Never exposes emails. `points` = sum of `workout_sessions.points` (+
  `daily_logs.points` for global). Week = current ISO week (UTC).
- Storage bucket `videos` (private): read policy for authenticated users with an active purchase of
  the course encoded as the first path segment (`<course_id>/…`) or under `shared/`.
- Admin RPC: `admin_set_purchase_status(p_id uuid, p_status text)`.

`src/lib/api/` exposes typed functions (`auth.ts`, `profiles.ts`, `entitlements.ts`,
`courseState.ts`, `sessions.ts`, `dailyLogs.ts`, `leaderboard.ts`, `orders.ts`, `admin.ts`,
`storage.ts`) over a single client (`client.ts`) configured from `PUBLIC_SUPABASE_URL` and
`PUBLIC_SUPABASE_ANON_KEY`. `isConfigured()` returns false when env is missing; the app shows a
localized "backend not configured" screen instead of crashing.

**Demo mode** (`src/lib/api/mode.ts`, `src/lib/api/demo/*`, runbook in docs/SETUP.md §10) is a
deliberate, clearly-labelled testing feature: a browser-local backend implementing the same API
surface over `localStorage` (namespace `forma.demo.*`, versioned), so the whole product — sign-in,
onboarding, the player, stats, leaderboard, admin, the landing order form — can be walked through
before Supabase exists. Rows are stored in the shapes `mappers.ts` converts from, so the domain
types keep one definition; errors keep the `AppError`/`AuthError` contract; every call is delayed
~120 ms so loading states stay visible. Auth uses a locally generated 6-digit code shown on the
auth screen in a demo hint. A new demo account is seeded with the `start` and `engine` courses
active, no history, two weeks of step logs, twelve invented leaderboard athletes and admin
rights. Activation is exactly two paths: `PUBLIC_DEMO_MODE=true` at build time, or — only when
Supabase is **not** configured — a visitor flag (`forma.demo`) set by the button on the setup
screen. With Supabase configured and the build flag absent, `isDemo()` returns false without
reading storage and the demo implementation (a dynamically imported chunk) is never fetched, so
production behaviour is unchanged. A persistent badge in the app chrome states on every screen
that the data lives only in this browser; demo content never reaches the marketing site.

## 9. Routes

Landing (Astro, static, RU default / EN under `/en/`):

```
/                          home
/courses/                  courses hub
/courses/<slug>/           course page + order form (5 pages per locale)
/exercises/                exercise library hub (programmatic; filmed movements only)
/exercises/<slug>/         exercise page: clip, how-to, cues, mistakes, scaling, related
/guides/                   guides hub (clusters)
/guides/<slug>/            SEO article (content collection)
/subscribe/               every course by subscription (monthly / annual), plan choice + order form
/about/  /privacy/  /terms/  /refund/  /contact/
/app/                      React app (noindex; also the Telegram Mini App surface)
/sitemap.xml  /robots.txt  /llms.txt  /rss.xml  /<indexnow-key>.txt  /manifest.webmanifest  /404
```

App (HashRouter under `/app/#/`). **Three tabs — «Курсы», «Клуб», «Тренер» — and «Админка» as a
fourth seat for whoever has the panel.** The words changed and the paths did not, so nothing that
was ever linked or bookmarked broke:

```
/auth  /onboarding  /assessment   (outside the tabbed shell — the test is full-screen)
/                          «Курсы» — the main screen: progress across every course there is
/courses                   → redirect to `/` (the path this screen had while it was the second tab)
/courses/:id               the course's path
/courses/:id/nodes/:nodeId preview + difficulty
/play                      active session          /summary/:sessionId
/achievements              the catalogue of achievements, from the 🏅 in the header of «Курсы»
/marathon  /marathon/board «Клуб»
/book                      «Тренер» — one-to-one session with the coach
/leaderboard
/assigned/:id  /shared/:token
/admin  /admin/workouts  /admin/exercises  /admin/courses[/:id]  /admin/marathons[/:id]
/admin/stats               «Аналитика» — воронка по когортам недели входа + прогресс людей
```

Gone with the four-tab shell: `/` as «Сегодня», `/stats` («Прогресс»), `/profile` (a sheet behind
the avatar now) and `/marathon/points` («Мои баллы»).

**The first workout of every course is free** — once per course, and spent by finishing it. It is
not part of the offer (terms §2): no contract exists until the course is paid for. The unlock lives
where the person is, on the summary screen of that workout, and pays through the same
`create_order()` → Prodamus path the site form uses; the purchase then activates itself.

Products: a **course** is bought once and kept forever (`purchases`); a **subscription**
(`subscriptions`, monthly or annual) lists every course through `my_entitlements` while its paid
period runs, and is activated by the coach or by the Prodamus webhook; an **hour with the coach**
(`content/site/booking.ts`) is the only product that uses his time.

`/book` is the **«Тренер»** tab, and it carries four things in this order. **Who he is**: his
photograph, his name as one display line, and above it «Основатель и тренер Forma»
(`COACH.formaRole`) — the founder half is what makes an hour with him different from an hour with a
coach. Then the format and «можно за 15 минут до начала» (`BOOKING.leadTimeMin`) as pills.
**His regalia**: `COACH.credentials`, six checkable facts off his profi.ru profile, of which the two
that are numbers are lifted into figures by `COACH.figures` and dropped from the list below, so no
fact appears twice. **What it gives**: `BOOKING.outcomes`, three numbered lines, each a restatement
of a promise the offer already makes — nothing about anybody's results. **The price**: the lengths
as a switch (the two durations on one line, defaulting to the cheaper), over one block with the
chosen length's price as a display figure and one button. The two used to be stacked as two blocks;
on a phone the second started below the fold, so the comparison the stacking was for never happened.

On the longer length the block shows the **delta and only the delta** — «Всё из 30 минут» once, then
`option.adds` and the price difference — because the owner's brief is «обязательно посветить что
тренировка за 60 минут даст по сравнению с 30», and a second list containing the first makes the
reader do the diffing. `HOUR.includes` is still the whole list for any other surface; it is composed
from the half's promises plus `adds`, so the two cannot drift.

After the button comes the step the offer used to be missing. With `BOOKING.scheduleUrl` set it is
the slot page («оплатил → выбрал время»); with it empty — today's state — it says outright that the
coach sets the time in a message, rather than ending the screen on a paid button. Opening payment
from the screen sharpens that block instead of leaving the person to find it.

The same `/app/` build runs inside Telegram as a Mini App (`src/lib/telegram/webapp.ts`): the SDK
is loaded only when Telegram opened the page, Telegram's back button follows the route, and links
that leave the app open outside it. Everything Telegram-specific is a no-op on the open web.

## 10. App flows (must match exactly)

1. **Auth**: the coach's black-and-white montage full-bleed and looping
   (`content/site/media.ts`; the coach's photograph stands in until it is cut), the wordmark fading
   up and away over it, and then the form: email field → "Send code" → 6-digit code field
   (paste-friendly, resend timer 60s) → session. No heading, no lead, no field label, no spam hint —
   the errors, the resend and the way back to the address are all that stand with the two fields.
   `prefers-reduced-motion` and any tap skip the title card. Errors localized.
2. **Onboarding** (first login, resumable): **five questions and nothing else** — name → age band
   → sex → limitations → level → home. The owner's instruction: «В первую очередь нужно убрать всё
   лишнее в онбординге и особенно оттуда убрать тестирование. Мы тестирование через пару
   тренировок будем спрашивать.» So the minutes per session, the goal, the activity level, the
   experience, the equipment, the optional weight field, the self-test and the «60 — средний»
   result screen are all gone from the wizard. `STEP_IDS` in `src/app/screens/onboarding/draft.ts`
   is the list, and the header's counter is drawn from its length — so «01/05» follows the code.

   **Each step is one question and its answers, and nothing else** (design/CHANGELOG.md §10): the
   question in the display face — «ТВОЁ имя», «СКОЛЬКО тебе лет?», «ЧТО беречь?» — and under it
   plates (`OptionTile`), a field, or the slider. No lead under the question, no kicker over a
   group whose plates already say what they are, no description under an answer. A picked plate
   inverts and a check lands on it on the spring (`.pop-in`). **Questions do not hyphenate**:
   `.display` turns `hyphens: auto` on for the landing's hero, and the wizard opts back out
   (`Question.tsx`) — «ОГРАНИ- / ЧЕНИЯ» reads as an accident on a form somebody is filling in. The
   primary button is **«Далее»**, not «Продолжить»; on the last step it says «Начать тренироваться».

   The header is one row and the three things in it are aligned, which they were not: the row sits
   on the content's own 24px gutter, the back chevron is pulled out by exactly its own padding so
   the mark lands on that gutter, the «01/05» pair ends on it, and `h-14` with `items-center` puts
   the 4px rule on the same centre line as the numerals.

   **The level question is a 1–10 slider with the answer in words under it.** It replaces the two
   plate questions that used to ask the same thing from opposite sides («Насколько активны твои
   будни?» and «Сколько уже тренируешься?»). The figure is set the brand's way — the value at 800
   against «/10» at 200 — and under the track a sentence that changes on every notch, «Давно не
   тренировался» at 1 through «Тренируюсь много лет» at 10 (`LEVEL_SLIDER_LABEL`,
   `screens/onboarding/labels.ts`). A bare number is never the answer; the slider carries the
   sentence as `aria-valuetext` as well.

   **What the saved profile claims.** `draftToTrainingProfile` derives `activityLevel` and
   `experience` from the slider — that is the fact the slider asks for — and leaves
   `timePerSessionMin` and `goal` unset (both optional on `UserTrainingProfile`; nothing in the
   engine reads either). `equipment` is `['none']`, which is what an unticked equipment step always
   produced and the conservative reading of silence: `prescribe` treats `none` and `mat` as always
   available and scales anything heavier down, and the profile's equipment sheet is where the
   answer is corrected. **No fitness index is computed or stored by the wizard** — five answers and
   no measurement is not a result. Every reader of the index already copes with its absence by
   recomputing from the training profile, which for a profile with no self-tests is capped
   (`NO_TEST_INDEX_CAP`, docs/TRAINING_SCIENCE.md §2).

   **The assessment is a screen of its own, offered after the second completed workout.** Route
   `/assessment`. The rule is `shouldOfferAssessment` (`src/app/features/assessment/model.ts`):
   two or more completed sessions, not already taken — the counts in the training profile _are_ the
   record of that, so it survives a reinstall — and not dismissed on this device. The offer is
   `AssessmentBanner`, which reads the rule itself and renders nothing until it holds, so mounting
   it is one line. Its register is a calibration's, not an exam's: «Подстроить тренировки под
   тебя» over «5 упражнений, 3 минуты — просто ответить».

   The screen opens as a modal — a «×», not a back chevron — and never back into the wizard. It
   shows which five movements (`AssessmentList`, the coach's own stills), then the one instruction
   everything here depends on, in the owner's words and nothing more («Максимум не выжимаем»), then
   the movements one at a time as a full-screen surface drawn like the player: the clip full-bleed
   and filling the width by geometry, the movement's name in the display face on a pane of glass at
   the foot, one short line and one field. **Nothing is timed and nothing is performed on the
   screen** — «убери таймер в онбординге совсем… просто чтобы они лайтово прошли и поделились
   примерно сколько раз они могут сделать не умирая». The athlete watches the clip and says roughly
   how many they could do without going to failure. Three of the five numbers feed the fitness
   index — which is computed and stored _here_, because here something was measured — and the other
   two are written to `benchmarks`.

   What that does to the index is written down in `content/site/assessment.ts` rather than left to
   be found: two of the three components get closer to what their tables expect (`pushups` is
   defined as max consecutive and the minute was a proxy; `PLANK_ANCHORS` run to 180 s and the
   minute capped every answer at 60), and `squats60s` loosens — its anchors were built for reps in
   sixty seconds and now read a self-reported comfortable set. The field keeps its name because
   renaming it migrates stored profiles for no reader's benefit. Task #41, the coach's own ranges as
   data, is where the borrowed tables stop mattering.

3. **«Курсы»** (the first tab, and the screen the app opens on): «Курсы это прогресс по всем
   курсам которые есть». A progress screen that happens to list courses, not a catalogue. It
   replaced «Сегодня» and absorbed the «Программы» tab, which were two screens answering one
   question between them.

   **The head** is two lines on the left and two controls on the right («Профиль и все ачивки
   убирай. Они должны быть на главном экране в виде маленьких энтри поинтов»). Left: the greeting
   small and regular over the athlete's **name**, large in the display face, with a small outline
   **person glyph** beside it that opens the **account sheet** (flow 11). There is no avatar — the
   product has no uploaded pictures, so the circle was a generated monogram standing in for a
   photograph that does not exist. Right, on a dark grey fill: the **workout count as a pill**
   holding 💪 and the figure, which opens the training calendar as a sheet, and the **achievements
   as a circle** holding a monochrome rosette, which opens their **catalogue** (flow 8). That 💪 is
   the only emoji in the app outside the achievements; every other mark is drawn in `Icon.tsx`. It
   was 🔥 and a streak until the owner struck the mechanic — a flame is a thing that goes out,
   which is the wrong promise for a tally that cannot.

   Then the courses, one card each, in the shape the owner drew — **the photograph _is_ the card**,
   nearly square, with no panel under it. On it: a hairline **progress rule** across the top, the
   **share completed as one large figure** under it, the course's **name**, and **one pill button**
   at the bottom right with a dark circle at its right end holding the arrow. The rule, the figure,
   the name and the button all take the course's colour; the picture stays a photograph. The figure
   is the prototype's device — the number larger than the word — because on a progress screen the
   number is the content.

   **The first card is the hero, and it is photograph + glass** (`design/CHANGELOG.md` §17): the
   course being walked is taller (347×400) with a pane of dense glass pinned to its bottom
   (`.glass-card-on-art`, tinted from the ground at the level-3 alphas — measured so white reads
   7.5 and the light-blue key word 5.7 over a white sky), holding the light-blue % pill or the
   tilted neon «Первая тренировка бесплатно» sticker, the title with its key word (`KeyTitle`),
   the progress rule and **the screen's one neon button** with the arrow's circle. It was the
   blue field for one iteration; nothing on «Курсы» is the field now. A course without a
   photograph shows the plate over the plain glass card. Above the deck, the coach's assigned
   workouts (`AssignedWorkoutsCard`) are the screen's bright fields — ciel, orange, neon by index,
   a single one always ciel, ink on all, the «Тренер» tag as dense glass with a white word.

   **Colour on type needs a scrim, and the scrim is measured.** A programme colour is far less
   luminous than white (Portland orange `#FF5A00` is 0.286), so 4.5:1 against it needs the ground
   at luminance 0.0247 or below, about sRGB 44; `.photo-scrim-top` is tuned to that and
   re-measured on the composited pixels whenever it changes, never eyeballed. The type takes
   `--course-accent`, which `courseTileVars()` sets from the tile: a course whose tile is one of
   the neutral dark surfaces gets plain white, because near-black type on a near-black card is no
   type at all.

   **A photograph, never lettered artwork.** The card does not read `course.cover`: the one cover
   in the catalogue has «ФОРМА // С НУЛЯ» baked into it, and a lettered cover under a coloured
   course name is two titles fighting. The cover still leads the course's page on the site.

   A course the athlete does not own shows **«Подробнее»** and leaves for that course's page on the
   site; it used to say «Прийти» or «Курс закрыт», neither of which says what happens next. The
   button is only ever offered where there is a page behind it (`LIVE_COURSES`), and a course that
   is neither owned nor on sale is not listed at all.

   **One workout button.** «Не может быть такого состояния что и продолжить тренировку и начать
   курс. На главном экране всегда должна быть только одна кнопка тренировки.» When a session is
   open, `resumeCard()` (`features/home/resumeModel.ts`) says so, the course it belongs to carries
   the resume button, and every other course offers its path instead of a start. One module decides
   it; the screen never re-derives it.

   The club is not on this screen at all any more — it is its own tab.

   **The name.** The format is the «Клуб маленьких шагов» — «Клуб» where a label has one slot (the
   tab, the top row, the deck card), the full name where there is room (the screen's own head, the
   invitation, the locked and trial copy). It was the «Челлендж» until the owner renamed it: a
   challenge promises a test, and the people this is for are coming back after a break, for whom a
   test is a reason not to start; a club promises belonging, which is what the format actually
   gives — a partner, a board with names, a day everybody is having at once. The prize is still
   real and still an hour with the coach, but it is the last clause of the invitation rather than
   its point, because a club whose first sentence is about winning is a competition in a club's
   name. Code and database keep `marathon*` throughout: renaming them buys the reader nothing and
   costs a migration. `src/i18n/*/app.ts` is the one place that reconciles the two.

4. **Course path**: the days as a winding column of circles — four columns, wave order, the day's
   name and one short line set in the space each stop leaves beside it, its stars under the name —
   grouped under a band per week in the programme colour («НЕДЕЛЯ 1 · 3/7»). A finished day is
   filled in that colour and ticked, today is filled in paper and lands on the spring, an open day
   is outlined, a locked one is dimmed; rest and milestone days open a sheet. The head is the
   course's name on a band of its colour, then a ring with the share inside and one display line
   beside it — «ДЕНЬ 4 из 28», 800 + 200 — then three figures on one ruled line: days done, minutes
   trained, the load multiplier (a button, opening the sheet that explains it). The leaderboard is
   a kicker opposite the way back.
5. **Node preview**: the picture (a still from the movement's clip, else the drawn figure), the
   workout's name, the programme and day, and three pills — how long, how much work, what it
   costs. Everything else — focus,
   description, the movement grid, the plan block by block — is folded behind "What's inside".
   Pressing Start opens the difficulty sheet: Easier / As usual / Harder, **each with its own
   emoji** (🌿 / 👟 / 🔥), the estimated **minutes** as a large numeral, a bar of the work it
   prescribes and the reps under it. The three sit on hairlines, not in boxes, and the recommended
   one is marked the way the club's board marks its leader — its emoji in a circle filled with the
   programme colour, its minutes and its bar in that colour — rather than by fencing the row in
   paper. The reason is stated under all three. Picking one starts the session immediately: no
   second preview, no confirm button. Calories are not on the rows (31 / 31 / 34 decided nothing).
   **No points anywhere in training**: points are the club's currency (§10 flow 12), and a workout
   is time you spend, not a score you earn.

   **The minutes are the whole session and the reps are only the training.** «13 мин» is how long
   you will be busy, warm-up and cool-down included, which is what the site promises («15–20 минут
   вместе с разминкой и заминкой»). The rep count leaves both out — «не надо считать разминку и
   заминку в плане тренировки и в количестве повторений», and it is also `docs/COACH_RULES.md`,
   which marks both «Counted as training? No». On «Форма с нуля» workout 1 that is 87 / 96 / 144
   instead of 110 / 119 / 167, and the difference between the three choices is what the figure is
   for. `workoutVolume` is the one place that decides it.

   **Nothing in the product auto-hyphenates.** `.display` and `.font-display` set
   `hyphens: manual`. They were `auto`, and it broke this sheet's own title as «Насколько тяжело
   се-/годня?» — the browser hyphenates to fill a line even when moving the whole word down reads
   perfectly. A word wider than its line is a job for that heading's size, not for a hyphen in
   every heading.

6. **Player**: one card the size of the screen, with two sides. Front: the clip (or the drawn
   figure), auto-playing, **as wide as the screen** — `w-full h-auto` on a phone, with the stage
   cropping whatever the frame's own height runs past, so no shape of clip can put a bar down the
   side; contained and letterboxed from `md`, where filling the width would crop half a movement
   away. This is geometry, not a measurement of the clip: it used to read `videoWidth`/`videoHeight`
   and choose, and the choice could fail to arrive, which is exactly how black bars reached the
   owner's phone. With a back arrow and pause at the top and, at the bottom, the movement's
   name and its one number — a countdown for timed work, an adjustable rep count with "Done" for
   reps. Nothing else: no elapsed clock, no sound control, no step counter, no next-up line — the
   sound is heard, not operated (§5a), and its switch is in the account. Back:
   the coach's words as tabs (technique + breathing, cues + mistakes, contraindications + muscles),
   reached by swiping right to left or the "How to do it" handle — never by scrolling over the
   clip — and put away by swiping left to right. Vertical on the front walks the workout: up is the
   next movement, down the one before, both meaning exactly what the → and ← keys mean. The axes
   are that way round because the owner asked for a feed of short video: the thumb walks the
   column of clips, and the words arrive from the side. A session
   that opens with a warm-up starts inside it, with no gate and no intro. **Tapping the picture
   pauses** — the picture only, never the panel, and a press that travels or is held is left to
   the swipe handlers. «Пропустить разминку» is offered twice: as a chip on the panel that fades
   out after about six seconds, and, for the whole warm-up, behind Pause, where skipping or
   restarting a step, stepping back and ending the session also live. Timed work carries a line
   under the countdown showing how far through the movement it is, with the elapsed and the whole
   under it — white, because the clock is not one of the places colour may land.
   Leaving asks for confirmation; an unfinished session persists locally and resumes **where it
   stopped** — same step, same countdown. The step's clock is derived from the session clock
   (`stepStartedMs` in the store), so pausing, walking out and closing the app all freeze it the
   same way, and Home offers a **Продолжить** strip naming the movement it will pick up on.
7. **Summary + feedback**: «Готово!» at the size of the screen, under a kicker naming the day and
   the programme; **one warm line computed from the real count** and never invented — «Четвёртая
   тренировка. Так и растёт форма.», the ordinal in words to the tenth and «Тренировка №11» after
   it, and no line at all when there is nothing to report or the session is being re-read from
   the server; the stars; then three numerals on a rule — minutes, repetitions, kcal, with how much
   of the plan was done standing in for repetitions on a day that counts none. «Как зашло?» under
   it: RPE as **one row of ten circles** filled up to the choice, with the Borg descriptor under
   them, feeling chips (great / ok / hard / pain) and a note. «Save» → the achievements just
   unlocked, the adaptation message («next time +5%»), «К пути →» and «Поделиться». The whole
   session block by block, the test results and the benchmark are behind «Подробности».
8. **«Достижения»** (`/achievements`, from the 🏅 in the header of «Курсы»): every achievement the
   product has, **including the ones not yet earned, each with the rule that earns it**. That rule
   is the reason the screen exists — «Достижения открывают каталог достижений» — and a grid of grey
   circles with no rule attached is what it replaces. One row each: the figure on the left (white
   with a ✓ when it is taken, a hairline ring filling with its progress when it is not, the same
   figure «Готово!» draws the moment one is earned), the name, and the rule under it. The count
   sits in the header, because it is the one number the catalogue is about.

   This is what is left of **«Прогресс»**, which was the fourth tab and is gone with it. The count
   went to the header of «Курсы» and the training calendar to the sheet behind it; the achievements became
   this screen; the week's table is the club's own (flow 6) and the full leaderboard is flow 9. The
   charts, the personal records and the level card had no reader: «МИНИМУМ текста, максимум
   визуала» does not survive six figures stacked behind a «Подробности» nobody opened. The level
   is in the account sheet, where it is one line and a rule for reaching the next one.

9. **Leaderboard**: tabs week / all-time, course filter, top-100 with own row pinned. A rank is a
   **circle**, drawn exactly as the club's `BoardRow` draws it — the leader filled, your own
   row a white ring, the podium a stronger hairline — but filled in white, never the club's
   orange: this table belongs to no programme. No avatar on the row (a rank is a circle and a
   person is a circle; two per row read as a pair of controls) and no «оч.» after the points.
10. **Steps are gone, and the reason is worth keeping.** There was a «Шаги» screen: a number typed
    in by hand into a goal ring, fourteen days of circles behind it, an optional screenshot of the
    phone's own step counter as evidence, and points that fed the leaderboard. The
    owner's rule ended it — «он либо стекается либо его нет вообще, потому что пользователь не
    будет заниматься трекингом одних и тех же шагов в разных приложениях» — and it cannot sync:
    Apple HealthKit has no browser API at all, Google Fit's REST API closed to new applicants in
    2024 and shuts down at the end of 2026, and Health Connect is an on-device Android API. A Mini
    App is a WebView; there is no route to the number that does not go through a native app.

    What went with it: the screen and its route, the manual entry and the screenshot, step points,
    the `steps_10_days` achievement, the rest day's step goal, the «heavy walking day» rule in
    `recommendDifficulty`, the calendar's steps-day cell, the club's «Шаги» task, and `daily_logs`
    (migration `0015_drop_steps.sql`). A day now counts when a workout was finished, and points come
    from training alone. **Do not reinstate any of it without a native app.**

11. **The account** — a **sheet**, opened by the person glyph beside the name in the head of
    «Курсы» and by the same glyph in the top row from `md`. Not a screen and not a tab: «Профиль и
    все ачивки убирай».
    Five things and no navigation — the avatar, the name with the address the sign-out will leave,
    the level, **one line saying how to reach the next one**, and «Выйти» behind a confirmation.
    The 417-line profile screen it replaces was a settings page nobody opened twice.

    What that screen also carried and this does not: the inventory and the limitations sheets, the
    subscription row, «Пройти тесты заново», the link to the coach's hour and the link to the
    admin. The last two are tabs now. **The first three have no home in the app at present and the
    owner has to say where they should go** — the likeliest answer is the assessment flow, which is
    being rebuilt to run after the second workout rather than during onboarding.

12. **Admin**: three tabs. **Покупки** — the ledger (search by email, filter status), activate /
    refund, add by hand. **Подписки** — the same for plans. **Люди** — everybody who has confirmed a
    sign-in code (`admin_people()`, admin-only), newest first, with what they already hold and one
    button each to give a course or a subscription. That tab exists so a grant is a choice rather
    than an address typed from memory: `admin_add_purchase` accepts any well-formed address on
    purpose — a pre-sale grant to somebody who has not signed up yet is a real case — so a typo
    cannot be caught there and is designed out here instead. The manual path stays on the other two
    tabs, where it is the only way in.
13. **«Клуб»** (the tab): **the task, its button, and the leaderboard.** The owner's instruction
    is one sentence — «Только задание, кнопка и лидерборд» — and it is a subtraction, applied
    twice: the screen had accumulated sections, they were cut to two, and it accumulated furniture
    again. The head is the day as a ring with the club's name beside it; then one `TaskCard`; then
    the week — the prize as the one filled pill (the warm gradient under ink, as is every button
    on the club's screens and the leader's circle: no neon in the club, §17), three rows of
    circled ranks and the member's own
    under them, the full table one tap further (`/marathon/board`, this week and last). From `md`
    the two sit side by side: on a phone the task has to win, on a laptop the board beside the task
    is the race made visible while the task is being done.

    **What the second subtraction took:** the «Задания дня» kicker and the «1/3» counter beside it
    (over a list of one it reads «0/1», a worse way of saying «не сделано» than the card says it);
    the «Пробная неделя · осталось 3 дня» pill, a sales line on a screen that is not for selling;
    the «Неделя 1» kicker over the table; and «Ты ещё без баллов» / «Тебя пока нет в таблице» —
    the row draws a dash where the place would be, and the dash says it.

    **Каждый сам за себя.** «Никакого напарника в клубе быть не должно» — the club is
    `team_size = 1`. No teams, no pairs, no `PartnerLine` on the card, no «Напарник: Марина» in the
    head, no rule line («Только если сделают оба», «На команду не больше N»): both are team
    sentences and neither can be true here. `all_members` and `capped` stay in the schema for a
    marathon that does run in teams; the admin already hides pairing when `team_size <= 1`.

    **Одно задание в день, and its name is the whole of it.** The seeded week is seven tasks, one
    per day, with no `body` — «не надо доп текст писать». The card still renders a body when a
    coach writes one, and the screen still maps over a list, because the table allows two and a
    screen that silently dropped the second would be worse than one that shows it.

    **Проверка — это раунд, а не приговор.** Proof scores the moment it is sent — nobody approves
    anything — and the coach reads the feed afterwards: «Серёжа заходит в админку, видит
    доказательство, просматривает его и принимает решение: оставить результат как есть или он может
    наложить reject на это конкретное выполнение и оставить свой комментарий». A rejection takes the
    points off the board and lands on the athlete's card **as a message from him** — a level-2 card
    with «Сергей посмотрел» over his own words — and not as the line of `--danger` it used to be,
    which read as the app refusing something rather than a person answering. Under it the control is
    open again with «Отправить заново» on it: a rejected proof rendered no control at all, so «Не
    засчитано» was a dead end with an instruction to fix it and no way to. Sending again is a new
    attempt — the rejection lifts, the points come back, `attempt` goes up, and the row appears in
    the coach's **«Ждут проверки»**, the club's only queue. That queue holds nothing but proof he
    rejected himself and somebody has redone; a queue of everything would be an approval step, and a
    club that needs him to clear one stops the first week he is busy. `submitted_at` never moves, so
    a redo keeps the hour the task was first delivered — he rejected the evidence, not the day — and
    his comment outlives the rejection, because after a redo it is the only record of why the proof
    was sent twice. The rules are in `supabase/migrations/0027_proof_review.sql`, stated once for
    the app in `src/lib/marathon/review.ts`.

    **«Мои баллы» is deleted** — screen, route and copy. A running total the member cannot act on
    is a number for its own sake, and the table above it already answers the only question it was
    asked. `marathon_my_points` stays in the database for the coach's own use; nothing in the app
    reads it.

    **The prize is «час с тренером и создателем Forma».** He is sold as both, everywhere, from
    here on. The words live once, in `app.marathonPrizeDefault`; `marathons.prize` overrides them
    for a round that is played for something else, and is empty in almost every round.

    **The tab's second state is a screen, not a closed door, and the owner drew it.** She sent a
    375×812 render and said «Сделай под него», so `ClubPitch` is that picture: a small muted label,
    a row of three tight monochrome crops running nearly the full width, the club's name composited
    over the bottom of them on three lines («Клуб» 200 · «маленьких» 800 in the club's colour ·
    «шагов» 200), one orange pill — «Вступить за 666 ₽ / мес» — and her two paragraphs with one
    phrase in orange. No head, no sticky footer and no explanatory rows: none of them is in the
    drawing. The type is **sentence case throughout**; no tracked capital label appears on it.

    Three rules bind that screen:

    - **The photo row renders from data and the label follows the data.** `CLUB_PHOTOS` in
      `content/site/club.ts` is the club's own photographs and is empty; while it is, the row falls
      back to the consented before/after files in `content/site/results.ts` and the label reads
      **«Результаты учеников Сергея»**, not «Результаты участников». Those are Sergey's one-to-one
      clients, and the owner's own label over them beside a price would say the club produced them.
      «Результаты участников» appears by itself the day a club member is photographed and consents.
      The frames are cropped to one panel and go out unlabelled, with one true sentence on the row,
      because their source's alt text describes the pair and a panel is not the pair.
    - **No invented member, quote, percentage or duration.** `CLUB_RESULTS` is empty and stays
      empty until somebody real is quoted with a recorded consent date. The rule against invented
      reviews applies hardest on the screen that asks for money, and a placeholder — even an
      obviously fake one — is a sentence that gets forgotten and shipped.
    - **The figure is read from `PLANS` and never typed on the button.** The owner settled it as
      «666 в месяц это доступ на год разделенный на двенадцать месяцев», so the club is sold with
      the **existing annual plan**: `planMonthlyPrice()` divides 7 990 ₽ by twelve and the button
      shows the result. There is no second 7 992 ₽ product — it would sell the same year twice and
      break the webhook's match-by-amount. Under the pill, one line says what is actually charged,
      because a button quoting a month for an annual payment is a chargeback. The link is the
      plan's Prodamus product with the signed-in email appended and nothing else, falling back to
      `/subscribe/` when there is no usable link and always for a demo account. Never a payment URL
      with an amount in it — the site is static and public, and `&price=…` in a query string is a
      price the payer can edit (docs/SETUP.md §7.1).

    Somebody who already pays and is simply not in a running round gets the same screen without the
    price: the coach forms the rounds and the pairs by hand, so there is nothing for them to press.

    **The club's colour is the crossroads gradient**, and its solid stand-in is electric blue
    `#2038E2` (`GAME_TILE`, `--course-marathon`) — what the tile machinery, the ink and the `-ink`
    variant need, since a gradient cannot be a tile. White ink on it (7.71); as type on the ground it
    hands over to light blue (`tileAccent()`). The gradient paints the streak ring, the day dots,
    the glow behind the screen and its key words (`design/CHANGELOG.md` §14).
    `src/lib/ui/tile.test.ts` holds the contrast promises.

## 11. SEO conveyor (docs/SEO.md is the runbook)

Mirrors the moba-trainer pipeline: structured page documents → templated pages → JSON-LD →
sitemap/robots/llms → internal linking → hubs → IndexNow.

- Every page has: unique `<title>` (≤60 chars), meta description (80–160), canonical, hreflang
  (`ru`, `en`, `x-default`), OpenGraph/Twitter, JSON-LD graph (`WebSite`+`Organization` on home,
  `Course` on course pages, `Article`/`HowTo` + `BreadcrumbList` + `FAQPage` where applicable,
  `VideoObject` when a video exists, `ExercisePlan`/`HowTo` for exercises), `lang` attribute.
- Programmatic families: exercises (from the library), courses, guides (Markdown collection with
  clusters), hubs per cluster. Internal links: every article links to ≥3 related pages; exercise
  pages link to courses using them.
- **Only filmed movements get a page.** The library was written ahead of the camera — 90 movements
  described, 26 shot — and an exercise page with no clip on it is a page failing at its only job,
  ninety times over. `FILMED_EXERCISES` (`src/content/registry.ts`) is the boundary and it works
  exactly like `LIVE_COURSES`: the entries stay in `content/`, and adding `video` to one is the whole
  of putting its page back. The hub, the pages, the sitemap, the «Проще»/«Сложнее» links, the related
  lists and the guides' `exercise:` links all read it. A guide that names an unfilmed movement keeps
  its sentence and loses the link, and `seo:audit` prints one note per such reference — that list is
  the filming queue. Nothing on sale is affected: «Форма с нуля» prescribes 26 movements and every
  one is filmed (guarded by `src/content/filmed.test.ts`); the courses that use the rest are all
  `published: false`.
- `scripts/seo/audit.mjs`: title/description lengths, duplicates, hreflang pairs, broken internal
  links, minimum word count for guides (≥800 words), every exercise/course has both locales, sitemap
  coverage. Fails CI on errors.
- `scripts/seo/indexnow.mjs`: submits changed URLs to IndexNow (Yandex, Bing) after deploy when
  `INDEXNOW_KEY` is set. Key file served at `/<key>.txt`.
- Analytics/verification from env: `PUBLIC_YANDEX_METRIKA_ID`, `PUBLIC_GA_ID`,
  `PUBLIC_YANDEX_VERIFICATION`, `PUBLIC_GOOGLE_VERIFICATION` — rendered only when set.
- OG images generated per page at build (`scripts/seo/og.mjs` → `public/og/*.png`).

## 12. Deployment

- `deploy.yml`: on push to the deploy branch, `npm ci && npm run build` with `SITE_URL`,
  `BASE_PATH` (derived from the repository name unless a custom domain is configured),
  `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` from repository variables; uploads `dist/` with
  `actions/upload-pages-artifact` and deploys with `actions/deploy-pages`. Then runs IndexNow when
  the secret exists.
- `ci.yml`: check, lint, test, build, seo audit on pull requests.
- The app uses `import.meta.env.BASE_URL` everywhere (`withBase()` helper) so it works both at
  `https://<user>.github.io/<repo>/` and on a custom domain.
