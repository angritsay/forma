# Forma — notes for Claude

- `docs/SPEC.md` is the contract; read it before touching code. `docs/CONTENT.md` explains how
  content is authored, `docs/TRAINING_SCIENCE.md` every rule of the adaptive engine.
- **Before authoring or editing any workout, warm-up or cool-down in the beginner course, read
  `docs/COACH_RULES.md`** — the coach's own rules (joint-mobility warm-up top to bottom, no
  max-effort tests, his workout template, loading rules). `docs/COACH_SOURCE.md` is his verbatim
  channel export.
- Quality gates before a commit: `npm run check`, `npm run lint`, `npm run format:check`,
  `npm run test`, `npm run build`, `npm run seo:audit`. Do not run a dev or preview server.
- Code, comments, commit messages and docs in English; product copy is Russian with an English
  value on every `L10n` field.
- After changing a course, render the review page for the coach:
  `npm run content:review -- --course start` (output is gitignored under `review/`).
