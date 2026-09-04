# Deployment

The whole product is a static site: the landing pages and the app are built by Astro into `dist/`
and served by any static host. The backend is Supabase (see `docs/SETUP.md`).

One workflow (`.github/workflows/deploy.yml`) builds once and publishes to one host, chosen by the
`DEPLOY_TARGET` repository variable:

| `DEPLOY_TARGET`           | Host             | URL                         | Setup required                                |
| ------------------------- | ---------------- | --------------------------- | --------------------------------------------- |
| unset / `gh-pages-branch` | GitHub Pages     | `<owner>.github.io/<repo>/` | **None** — public repository is enough        |
| `github-pages-actions`    | GitHub Pages     | `<owner>.github.io/<repo>/` | Pages → Source: "GitHub Actions", by an admin |
| `cloudflare`              | Cloudflare Pages | `<project>.pages.dev`       | Two Cloudflare secrets; repo may stay private |

The canonical origin is baked into the build (canonical tags, sitemap, hreflang, JSON-LD), so
switching hosts means a rebuild — which the workflow does anyway on every run.

## Option A — GitHub Pages via the `gh-pages` branch (default, zero setup)

This is the only route that needs nothing configured by a human, which is why it is the default.
Pushing a branch named `gh-pages` to a public repository creates the Pages site by itself, and
`GITHUB_TOKEN` is allowed to push branches — unlike creating a Pages site, which needs an admin.

Nothing to do: push to `main` and the workflow publishes. The site appears at
`https://<owner>.github.io/<repo>/` a minute or two later, and a "pages build and deployment" run
shows up in the Actions tab next to the "Deploy site" one.

The branch holds only the generated build. It is rebuilt from scratch and force-pushed on every
deploy, so its history stays one commit deep and the 500+ built files never accumulate in the
repository. Never edit it by hand — the next deploy overwrites it.

Its one drawback is the `/<repo>/` path prefix: `robots.txt` at a subpath is not read by crawlers
(see `docs/SEO.md`). A custom domain or Cloudflare fixes that.

## Option B — Cloudflare Pages

Free, unlimited bandwidth, serves at the domain root (better for SEO than a `/repo/` subpath), and
does not care whether the repository is public.

1. Create a free account at [dash.cloudflare.com](https://dash.cloudflare.com).
2. **Account ID** — Workers & Pages → the ID in the right sidebar (it is also the hex segment in the
   dashboard URL).
3. **API token** — My Profile → API Tokens → Create Token → Custom token, with the single permission
   _Account → Cloudflare Pages → Edit_.
4. In the GitHub repository, Settings → Secrets and variables → Actions:
   - _Secrets_: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
   - _Variables_: `DEPLOY_TARGET` = `cloudflare`.
   - Optional variable `CLOUDFLARE_PROJECT` — the project name, which is globally unique and decides
     the URL. Defaults to the repository name; set it if `<repo>.pages.dev` is already taken.
5. Run the _Deploy site_ workflow. The first run creates the Pages project itself; nothing needs to
   be clicked in the Cloudflare dashboard.

Custom domain: add it under the project → Custom domains (Cloudflare issues the certificate), and
set the `SITE_URL` variable to the same origin so canonical URLs follow.

Note that every deployment also gets a throwaway `https://<hash>.<project>.pages.dev` alias. That is
normal; only `SITE_URL` is ever advertised to search engines.

## Option C — GitHub Pages via actions/deploy-pages

Set `DEPLOY_TARGET` to `github-pages-actions`. Cleaner than Option A (no build committed to a
branch), but it needs the one admin step that a workflow token cannot perform.

0. **The repository must be public** — unless the account is on GitHub Pro, Team or Enterprise
   Cloud. GitHub Pages can only publish a _private_ repository on a paid plan; on the free plan the
   Pages "Source" control stays unavailable and `actions/deploy-pages` fails with
   `Failed to create deployment (status: 404)`. Make it public under
   Settings → General → Danger Zone → Change repository visibility → Public. Nothing secret lives in
   the repo: `.env.example` holds placeholders only, and the Supabase URL and anon key are public
   values by design (RLS is what protects the data), injected at build time from repository
   variables — they are never committed.
1. **Repository → Settings → Pages → Build and deployment → Source: "GitHub Actions".**
   This one is unavoidable: creating a Pages site needs repository-admin rights, which a workflow
   token does not have. The workflow tries anyway and carries on if it cannot, so the first deploy
   after you flip this switch succeeds without any other change.
2. **Variables** (Settings → Secrets and variables → Actions → _Variables_):
   - `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` — from the Supabase project settings (API).
   - Optional: `SITE_URL` (custom domain origin, e.g. `https://forma.example.com`), `BASE_PATH`
     (auto-detected: `/<repo>/` on github.io, `/` on a custom domain), `CUSTOM_DOMAIN`
     (writes `CNAME`), analytics/verification ids (`PUBLIC_YANDEX_METRIKA_ID`, `PUBLIC_GA_ID`,
     `PUBLIC_YANDEX_VERIFICATION`, `PUBLIC_GOOGLE_VERIFICATION`).
3. **Secrets**: optional `INDEXNOW_KEY` (any 8–128 char hex/alphanumeric string) — enables the
   IndexNow submission step (Yandex + Bing) after every deploy.
4. Push to `main` (or run the _Deploy site_ workflow manually). The site appears at
   `https://<owner>.github.io/<repo>/` within a minute or two.

### Custom domain on GitHub Pages

Set `CUSTOM_DOMAIN=forma.example.com` and `SITE_URL=https://forma.example.com`, add the DNS records
GitHub Pages asks for (CNAME to `<owner>.github.io`), enable "Enforce HTTPS" in the Pages settings.
Canonical URLs, sitemap, robots and hreflang all follow `SITE_URL`.

## Moving this code to its own repository

This project was built on a branch of an existing repository. To move it into a fresh repository
(recommended before launch):

```bash
git clone --branch claude/crossfit-coach-app-m3u8su https://github.com/angritsay/gallery_mcp forma
cd forma
git remote remove origin
git remote add origin https://github.com/<owner>/forma.git   # create the empty repo on GitHub first
git branch -M main
git push -u origin main
```

Then do the one-time setup above in the new repository. Because the base path is derived from the
repository name, nothing in the code needs to change.

## Local build

```bash
cp .env.example .env            # fill in Supabase values
npm ci
npm run seo:og                  # OG images (optional locally)
npm run build                   # → dist/
npm run seo:audit               # SEO checks against content and dist/
```

The CI workflow (`.github/workflows/ci.yml`) runs type checks, lint, format check, unit tests, the
build and the SEO audit on every pull request.
