# Forma — notes for Claude

- `docs/SPEC.md` is the contract; read it before touching code. `docs/CONTENT.md` explains how
  content is authored, `docs/TRAINING_SCIENCE.md` every rule of the adaptive engine.
- **Before authoring or editing any workout, warm-up or cool-down in the beginner course, read
  `docs/COACH_RULES.md`** — the coach's own rules (joint-mobility warm-up top to bottom, no
  max-effort tests, his workout template, loading rules). `docs/COACH_SOURCE.md` is his verbatim
  channel export.
- Quality gates before a commit: `npm run check`, `npm run lint`, `npm run format:check`,
  `npm run test`, `npm run build`, `npm run seo:audit`. Do not run a dev or preview server.
- **Visual rules live in `design/`** — the vendored design system. `design/SKILL.md` is the
  one-paragraph law, `design/CHANGELOG.md` says what changed from the first brandbook, and
  `design/tokens/*.css` are the values; `src/styles/global.css` is their implementation and
  documents every deliberate deviation. The ground is charcoal `#1a1a1a` and nothing else; light
  blue `#afe9fd` is the brand and interface accent; one electric-blue `#2038e2` hero field per
  screen (white type, light-blue key word); neon `#f4ff3f` for the one main action; the crossroads
  gradient belongs to the club only; section colours are tags (beginners orange `#ff5a00`,
  dumbbells neon, yoga beige `#ffe6d0`, coach bleu ciel `#007bff`); ink on a fill is chosen by
  measured contrast (`src/lib/ui/tile.ts`); no outlined text. Each colour carries one meaning —
  the semantic map in `design/CHANGELOG.md` §15 and `src/lib/ui/semantic.ts` (orange = effort,
  light blue = selection/progress, neon = «now»); the course colour is identity only, and no emoji
  sits on a saturated fill (`contrast-usage.test.ts`). Concentric radii, Unbounded in
  sentence case for display, Onest for text, glyphs instead of icons. Check a new screen against
  `design/ui_kits`-style references before inventing a pattern.
- Code, comments, commit messages and docs in English; product copy is Russian with an English
  value on every `L10n` field.
- After changing a course, render the review page for the coach:
  `npm run content:review -- --course start` (output is gitignored under `review/`).
