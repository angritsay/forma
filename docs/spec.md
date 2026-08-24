# Rolls — Spec v0.1

*Working title: "Rolls" (as in film rolls — one roll = one shooting session). Rename freely.*

Personal pipeline: an iPhone app that groups the photo library into shooting sessions and lets me tag them → a tiny VPS that mirrors metadata + thumbnails and exposes them to Claude via MCP → montage in DaVinci Resolve driven by Claude on the Mac.

Owner: Anastasia. Builder: Claude Code. This spec is the source of truth; build in the phase order of §7.

---

## 1. Product goals

1. Open the app → see my library as **sessions** ("took the phone out once", "everything I shot at the park"), newest first.
2. Name and tag sessions **inside the app only** — the Photos library is never polluted with albums.
3. Mark sessions/assets to **delete** (free space) or **hide** (declutter without deleting).
4. Everything I tag becomes **automatically visible to Claude** — continuously, not as a one-off export. New footage appears as new groups, I tag, Claude sees the update on next conversation.
5. From any Claude surface (chat / Cowork / Claude Code) I can say *"cut a reel from the Bali sunset group"* and Claude assembles a rough cut in DaVinci Resolve on my Mac.

Non-goals (v1): multi-user, Android, editing originals, uploading originals to the server, auto-posting to Instagram.

---

## 2. Architecture

```
┌─ iPhone ─────────────────────────────┐
│ Rolls.app (SwiftUI + SwiftData)      │
│  • PhotoKit read/write               │
│  • session clustering (local)        │
│  • tags, delete/hide, export         │
└──────┬───────────────────────────────┘
       │ HTTPS, Bearer token
       │ manifest.json + thumbs/keyframes (never originals)
       ▼
┌─ VPS ────────────────────────────────┐
│ one Node/TS service behind Caddy     │
│  • REST sync API   /api/*            │
│  • MCP server      /mcp/{secret}     │
│  • storage: filesystem, no DB        │
└──────┬───────────────────────────────┘
       │ MCP (Streamable HTTP) — claude.ai custom connector
       ▼
┌─ Claude surfaces ────────────────────┐        ┌─ Mac ──────────────────────┐
│ claude.ai chat / Cowork / Claude Code │ ─────► │ DaVinci Resolve            │
│ (library connector + Resolve MCP     │  MCP   │ via davinci-resolve-mcp    │
│  active in the same session)         │        │ (samuelgursky)             │
└──────────────────────────────────────┘        └────────────▲───────────────┘
                                                             │
   originals: app "Export originals" → iCloud Drive/Rolls/{groupId}/ → Mac folder
```

Design principles:

- **Originals never leave the phone** except via explicit per-group export to iCloud Drive.
- **Photos app stays untouched** — no albums, no metadata writes. Only two mutations exist: batch delete and hide, both user-initiated.
- **Closed groups are immutable** — stable IDs forever, so tags never detach and the server/Claude can reference groups reliably.
- **Server is disposable** — it holds only thumbnails + a manifest regenerated from the phone. Wipe it, re-sync, nothing lost.

---

## 3. iOS app

Stack: SwiftUI, SwiftData, PhotoKit, AVFoundation (keyframes), CoreLocation (reverse geocoding only — coordinates come from asset EXIF, no location permission needed). Min iOS 17.

### 3.1 Permissions

- Request `PHPhotoLibrary` **read/write** (write needed for delete/hide).
- If the user grants **Limited** access: work with what's visible, show a one-line banner suggesting full access ("Rolls can only group the photos you selected").

### 3.2 Data model (SwiftData)

```swift
@Model final class SessionGroup {
    var id: UUID                 // stable forever, generated at creation
    var status: GroupStatus      // .open | .closed
    var name: String?            // user-given title
    var tags: [String]           // free-form, lowercase-normalized
    var startedAt: Date
    var endedAt: Date
    var latitude: Double?        // centroid of assets with GPS
    var longitude: Double?
    var placeName: String?       // reverse-geocoded once, cached
    var assets: [AssetRef]       // cascade delete
}

@Model final class AssetRef {
    var localId: String          // PHAsset.localIdentifier
    var cloudId: String?         // via PHPhotoLibrary.cloudIdentifierMappings
                                 // (survives device swap / restore)
    var mediaType: MediaKind     // .photo | .video
    var creationDate: Date
    var duration: Double         // 0 for photos
    var pixelWidth: Int
    var pixelHeight: Int
    var isFavoriteInPhotos: Bool
    // user flags
    var markedForDeletion: Bool
    var markedHidden: Bool
    var claudePick: Bool         // v2, written back from server
    // sync bookkeeping
    var thumbUploaded: Bool
    var keyframesUploaded: Bool
}
```

### 3.3 Clustering algorithm

Deterministic, incremental, local.

Rules:
1. Fetch assets sorted by `creationDate` ascending (photos + videos; screenshots excluded by default — Settings toggle).
2. Walk the sequence. Start a **new group** when either:
   - time gap to previous asset > `gapWindow` (default **45 min**, Settings: 15–120), or
   - GPS distance to previous asset > `distanceThreshold` (default **3 km**) — only evaluated when *both* assets have coordinates. No-GPS assets cluster by time alone.
3. The most recent group is **open**: new assets whose gap ≤ `gapWindow` extend it. It becomes **closed** once `now − lastAssetDate > gapWindow`.
4. Closed groups are immutable in ID and membership. Name/tags remain editable forever.
5. Incremental runs process only assets with `creationDate > lastProcessedDate` (persisted). Triggered on: app launch, foreground, and `PHPhotoLibraryChangeObserver` events.
6. Assets deleted in Photos → prune the `AssetRef`, keep the group (a group may end up empty; show it greyed with "assets removed", allow dismissing).
7. Changing `gapWindow` in Settings does **not** re-cluster history (IDs must stay stable). Offer an explicit destructive "Re-cluster everything" action with a confirmation that names/tags on regrouped sessions may be lost.

### 3.4 UI

One core screen + detail. Design language: my own — this spec only fixes structure.

**Groups list** (home)
- Newest first. Row: 4-thumbnail strip, asset count + type glyphs (▸ for video), date/time range, `placeName`, name (or italic "Untitled"), tag chips. Untagged groups get a subtle dot so I can find them fast.
- Filter bar: All / Untagged / Marked for cleanup.
- Sync pill in the nav bar: last sync time + pending upload count; tap = sync now.

**Group detail**
- Editable name, tag editor with autocomplete from all existing tags.
- Asset grid; tap → fullscreen pager. Per-asset toggles: delete-mark, hide-mark. (v2: Claude-pick badge.)
- Group actions: mark all for deletion · hide all · export originals · clear marks.

**Cleanup flow**
- A "Cleanup" button (home, visible when marks exist) shows a summary: "Delete 143 items (2.1 GB), hide 12".
- Delete executes as **one** `PHAssetChangeRequest.deleteAssets` batch → single system confirmation → items land in Recently Deleted (30-day recovery). Hide sets `isHidden = true` in the same `performChanges` block.
- After success: prune refs, recount, sync.

**Settings**
- Server URL, sync token (paste once).
- Gap window, distance threshold, include-screenshots toggle.
- Upload: Wi-Fi only (default on), thumbnail long side (default 1024 px), keyframes per video (default: poster + 1 per 3 s, cap 8).
- Export folder info + "Re-cluster everything" (destructive).

### 3.5 Media derivatives (generated on device)

- Photo thumb: `PHImageManager.requestImage`, target 1024 px long side, JPEG q≈0.8.
- Video: poster frame + keyframes via `AVAssetImageGenerator` at 1-per-3 s (cap 8), same sizing. Filenames: `thumb.jpg`, `kf01.jpg`…`kf08.jpg`.

---

## 4. Sync protocol (one-way: phone → server)

Triggers: app becomes active, manual tap, `BGAppRefreshTask` (best-effort; iOS decides — never rely on it).

All requests: `Authorization: Bearer <SYNC_TOKEN>`.

| Endpoint | Purpose |
|---|---|
| `PUT /api/manifest` | Full regenerated manifest JSON. Idempotent replace. Server diffs against previous manifest and deletes media folders for assets that disappeared. |
| `PUT /api/media/{assetId}/{filename}` | Binary upload (`thumb.jpg`, `kfNN.jpg`). App tracks `thumbUploaded`/`keyframesUploaded`; duplicate uploads are harmless overwrites. |
| `GET /api/selects` | v2: pull Claude's picks (`selects.json`) and mirror into `claudePick` flags. |
| `GET /api/health` | Token + reachability check for Settings. |

Sync order: upload missing media first, manifest last (so the manifest never references media the server doesn't have).

### 4.1 `manifest.json` schema

```json
{
  "version": 1,
  "generatedAt": "2026-08-24T14:02:11Z",
  "device": "Anastasia-iPhone",
  "settings": { "gapMinutes": 45, "distanceKm": 3 },
  "groups": [
    {
      "id": "7C9E6679-7425-40DE-944B-E07FC1F90AE7",
      "status": "closed",
      "name": "Bali sunset",
      "tags": ["reel-candidate", "beach", "golden-hour"],
      "startedAt": "2026-08-20T17:31:04Z",
      "endedAt": "2026-08-20T18:12:40Z",
      "location": { "lat": -8.7185, "lon": 115.1686, "place": "Jimbaran, Bali" },
      "assets": [
        {
          "id": "A1B2C3D4-...-0001",
          "cloudId": "…",
          "type": "video",
          "creationDate": "2026-08-20T17:31:04Z",
          "duration": 14.2,
          "width": 1080, "height": 1920,
          "favorite": true,
          "flags": { "delete": false, "hidden": false, "claudePick": false },
          "files": ["thumb.jpg", "kf01.jpg", "kf02.jpg", "kf03.jpg", "kf04.jpg"]
        }
      ]
    }
  ]
}
```

`assets[].id` is the PhotoKit `localIdentifier` sanitized for filesystem/URL use (replace `/` with `_`). The same value names the media folder on the server **and the exported original file** — this is the join key across the whole system.

---

## 5. VPS service

Stack: Node 20 + TypeScript, Express, `@modelcontextprotocol/sdk` (Streamable HTTP server transport). Behind **Caddy** (automatic HTTPS). Deliver as Docker Compose (`app` + `caddy`) with a `systemd` unit alternative documented in the README.

Storage layout (no database):

```
/data/manifest.json
/data/selects.json            # v2
/data/media/{assetId}/thumb.jpg
/data/media/{assetId}/kfNN.jpg
```

### 5.1 Auth model

- `/api/*` → `Bearer SYNC_TOKEN` (env var).
- `/mcp/{MCP_SECRET}` → secret path segment (env var). Rationale: claude.ai custom connectors authenticate via OAuth or not at all — no custom headers. Full OAuth is overkill for a single-user server; a long random path over HTTPS is the pragmatic trade-off given the server only ever holds thumbnails and titles. Rotating the secret = change one env var, re-add the connector.
- Caddy: rate-limit `/mcp/*`, disable access-logging of full URLs (the secret is in the path).

### 5.2 MCP tools

Register at `/mcp/{MCP_SECRET}` via Streamable HTTP. Tools (names are the contract — Claude Code may extend, not rename):

| Tool | Input | Returns |
|---|---|---|
| `list_groups` | `{ status?, tagged?, since?, query?, limit=50 }` | Compact rows: id, name, tags, date range, place, photo/video counts. Default sort: newest first. |
| `get_group` | `{ id }` | Full group incl. per-asset metadata, flags, available files. |
| `get_media` | `{ assetId, file }` | The image itself as MCP **image content** (base64 JPEG) — so keyframes render inline in chat. |
| `search` | `{ query }` | Substring/fuzzy match over names, tags, placeName → compact rows. |
| `get_stats` | `{}` | Totals, untagged count, marked-for-cleanup count, lastSyncAt. |
| `set_selects` | `{ groupId, assetIds[], note? }` | v2 write-back → appends to `selects.json`. |

Tool descriptions must state that timestamps are UTC and that `assetId` equals the exported original's filename stem (see §6).

### 5.3 Connector setup (document in README)

- claude.ai → Settings → Connectors → **Add custom connector** → `https://photos.<domain>/mcp/{MCP_SECRET}`. Custom connectors run from Anthropic's cloud, so the endpoint must be publicly reachable over HTTPS. Once added it's available in chat, Cowork, and Claude Desktop. (Reference: support.claude.com, article "Custom connectors using remote MCP" — verify current steps there.)
- Claude Code: `claude mcp add --transport http rolls https://photos.<domain>/mcp/{MCP_SECRET}` (confirm flag syntax against current `claude mcp --help`).

### 5.4 Acceptance

- Fresh chat, connector on: "what did I shoot last week?" → correct groups from live data, no re-upload.
- "show me the best keyframe from the Bali sunset group" → image renders inline via `get_media`.
- Deleting an asset on the phone + sync → asset gone from `get_group` and its media folder pruned.

---

## 6. Montage workflow (Mac + DaVinci Resolve)

### 6.1 One-time setup

1. DaVinci Resolve on the Mac. Free edition works via the bundled in-app bridge (`Workspace ▸ Scripts` is not license-gated); Studio (~$295 one-time) enables direct external scripting. Start free, upgrade if the workflow sticks.
2. Install `samuelgursky/davinci-resolve-mcp` — its installer auto-configures Claude Desktop and Claude Code. For the free edition, run its `install_resolve_bridge.py` and launch the bridge from `Workspace ▸ Scripts` once per Resolve session.
3. Library connector already added (§5.3). Both MCPs can be active in one Cowork / Claude Desktop session.

### 6.2 Originals path

Server has thumbnails only, so originals reach the Mac via the app's **Export originals** (per group): writes full-quality files to `iCloud Drive/Rolls/{groupId}/{assetId}.{ext}` using `PHAssetResource`. iCloud syncs the folder to the Mac automatically. Because filenames = manifest asset IDs, Claude can map *tag → keyframe → original file* deterministically with zero guessing.

### 6.3 Runbook (repeatable session)

1. On the phone: tag the group, tap Export originals, wait for iCloud.
2. In Cowork / Claude Desktop (both connectors on), prompt e.g.:

   > Take the group "Bali sunset" from Rolls. Review its keyframes and tags, pick the strongest vertical moments, then in Resolve: create a 1080×1920 30 fps timeline, import the originals from `~/Library/Mobile Documents/com~apple~CloudDocs/Rolls/{groupId}/`, assemble a ~20 s rough cut, put markers wherever you were unsure between takes.

3. Claude: `get_group` → inspects keyframes → imports to media pool → builds timeline → trims → markers.
4. I do color, music, and final trims by hand; render with a saved IG preset (1080×1920, H.265, high bitrate).

v1 success = steps 2–3 complete without me touching Resolve before the polish stage.

---

## 7. Build phases (Claude Code — one phase per session/PR)

| # | Deliverable | Key acceptance criteria |
|---|---|---|
| P1 | iOS core: permissions, asset fetch, clustering, groups list + detail, names/tags persisted | Bursts at 10:00–10:05 and 11:30 → exactly 2 groups. Group IDs stable across relaunch and re-run. Tags survive restart. |
| P2 | Actions: cleanup (delete/hide), export originals to iCloud Drive | Delete removes only marked assets in one system dialog; hidden items vanish from the Photos main grid; export writes `{assetId}.{ext}` files. |
| P3 | VPS service: REST sync API + storage + Caddy + Docker Compose deploy | `curl` with token can PUT manifest + media; wrong token → 401; manifest diff prunes removed assets' folders. |
| P4 | iOS sync client + background refresh | Fresh install → full sync; subsequent syncs upload only new media; airplane-mode sync fails gracefully and retries. |
| P5 | MCP server + connector smoke test | §5.4 all pass from a real claude.ai chat. |
| P6 | End-to-end Resolve run + v2 `set_selects` → `claudePick` badges in app | §6.3 runbook succeeds; a select written by Claude appears in the app after next sync. |

Rules of engagement: keep phases independent; no albums, ever; never upload originals; don't rename MCP tools once P5 ships (the prompts in my muscle memory depend on them).

---

## 8. Open decisions (answer before P1 / P3)

1. App name — keep "Rolls"?
2. Defaults ok? 45 min gap · 3 km · screenshots excluded.
3. Keyframe density: poster + 1 per 3 s (cap 8) — enough for Claude to judge takes?
4. VPS domain + host for Caddy (existing server or fresh droplet?).
5. v2 priority after P6: richer Claude write-back (picks + notes) vs. beat-synced auto-cut experiments.
