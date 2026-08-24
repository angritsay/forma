# Rolls — sync server

The VPS half of **Rolls**, a personal photo pipeline: an iPhone app groups the photo library into shooting sessions, tags them, and mirrors metadata + thumbnails (never originals) to this server. A future phase adds an MCP endpoint so Claude can browse the library. Full contract: [docs/spec.md](docs/spec.md).

**Phase status:** P3 (REST sync API + storage + deploy) — done. P5 (MCP server at `/mcp/{secret}`) — planned; the mount point and `MCP_SECRET` env var are reserved.

## Quick start (Docker Compose)

```sh
git clone <this repo> && cd gallery_mcp
cp .env.example .env
# edit .env: set SYNC_TOKEN (openssl rand -hex 32) and ROLLS_DOMAIN
mkdir -p data && sudo chown 1000:1000 data   # app container runs as uid 1000
docker compose up -d --build
```

`ROLLS_DOMAIN` modes:

| Value | Behavior |
|---|---|
| `rolls.example.com` | Automatic public HTTPS via Let's Encrypt (DNS must point at this host) |
| `localhost` | HTTPS with Caddy's internal CA (local testing) |
| `:80` | Plain HTTP — only for testing before a domain is decided |

Caddy is the only exposed service (80/443); the app container has no published ports. The Caddy image is a custom build with [caddy-ratelimit](https://github.com/mholt/caddy-ratelimit) (120 req/min per client IP), and its access log replaces request URIs with `REDACTED` so the future `/mcp/{secret}` path never lands in a log line.

## API

All `/api/*` routes require `Authorization: Bearer <SYNC_TOKEN>`; anything else → `401`.

| Endpoint | Purpose |
|---|---|
| `PUT /api/manifest` | Full manifest replace (JSON, schema v1, default limit 20 MB). Atomic write, then **prune**: any `data/media/<assetId>/` folder not referenced by the new manifest is deleted. Response: `{ok, groups, assets, pruned:[...]}`. |
| `PUT /api/media/{assetId}/{filename}` | Raw binary upload (`thumb.jpg`, `kfNN.jpg`; default limit 10 MB). Idempotent overwrite. |
| `GET /api/selects` | Claude's picks (v2). Returns `{"version":2,"updatedAt":null,"selects":[]}` until the file exists. |
| `GET /api/health` | Token + reachability check for the app's Settings screen; includes manifest stats. |
| `GET /healthz` | Unauthenticated liveness probe (used by the Docker healthcheck). |

Client ordering: upload media first, manifest last — a manifest PUT prunes any media folder it doesn't mention, so a manifest referencing new assets should land in the same sync pass as their thumbnails. Extra files *inside* a kept asset folder are not pruned (deliberate P3 simplification; duplicate uploads are harmless overwrites).

`assetId` is the PhotoKit `localIdentifier` with `/` replaced by `_`, and must match `[A-Za-z0-9_-]{1,128}`; filenames must match `[A-Za-z0-9_-]{1,64}.jpg|.jpeg`. Anything else → `400`.

Storage is plain files under `DATA_DIR` (no database):

```
data/manifest.json
data/selects.json            # v2
data/media/{assetId}/thumb.jpg
data/media/{assetId}/kf01.jpg …
```

## Smoke tests (acceptance criteria)

```sh
export TOKEN=<your SYNC_TOKEN> BASE=http://localhost   # or https://rolls.example.com

# health with token → 200
curl -fsS -H "Authorization: Bearer $TOKEN" $BASE/api/health

# wrong token → 401
curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer wrong" $BASE/api/health

# upload media, then a manifest referencing it
curl -fsS -X PUT -H "Authorization: Bearer $TOKEN" \
  --data-binary @thumb.jpg $BASE/api/media/TEST-1234_L0_001/thumb.jpg
curl -fsS -X PUT -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  --data @manifest.json $BASE/api/manifest

# PUT a manifest without that asset → response lists it under "pruned"
# and data/media/TEST-1234_L0_001/ is gone
```

## systemd alternative

No Docker: build the app (`npm ci && npm run build`), deploy to `/opt/rolls`, and use [deploy/systemd/rolls.service](deploy/systemd/rolls.service) (install steps in the file's header). Run Caddy from the distro package with [caddy/Caddyfile](caddy/Caddyfile); note the stock package lacks the rate-limit plugin — use `xcaddy build --with github.com/mholt/caddy-ratelimit` or drop the `rate_limit` block.

## Development

```sh
npm install
SYNC_TOKEN=dev-token-0123456789abcdef DATA_DIR=./data npm run dev
npm test         # vitest; no Docker needed
npm run typecheck
```

## Backup

`tar` the `data/` directory — that is the entire server state. The server is disposable by design: wipe it, re-sync from the phone, nothing is lost.
