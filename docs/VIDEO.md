# Sergey's exercise videos

The app was always built to play real video and fall back to the SVG figure when there is none.
`PlayerScreen` renders a `<video>` whenever `exercise.video[locale]` resolves, and the drawn figure
only when it does not. That code is finished and has been since the app was built.

What is missing is the content: **none of the 83 exercises has a `video` set**, so the fallback runs
every time. That is why the app still shows animations.

## What the export actually contains

The owner exported the `‼️НОВИЧКИ‼️` Telegram channel. It holds:

|                                                    |                                            |
| -------------------------------------------------- | ------------------------------------------ |
| Video posts                                        | 215                                        |
| Unique clips (same clip re-posted across workouts) | 145                                        |
| Written workouts, in Sergey's own words            | 38 — see `docs/COACH_SOURCE.md`            |
| Total video                                        | ~1 GB (`.MOV` from an iPhone, plus `.MP4`) |

**The clips have no captions.** Not one. The channel is a bare dump of 215 videos, with the workout
descriptions posted afterwards as separate messages. Nothing in the export says which clip shows
which exercise.

Telegram's thumbnails do not help either: the first frame of each clip is Sergey standing still,
introducing the movement to camera. He performs it several seconds in. So identification means
watching each clip — `prepare-videos.mjs` writes a four-frame contact sheet per clip to make that
quick, but a person or a model still has to look.

## Pipeline

```bash
# 1. Transcode to web-playable MP4 (iPhone HEVC .MOV will not play in Chrome or Firefox),
#    dedupe re-posts, and write one contact sheet per clip.
node scripts/media/prepare-videos.mjs ~/ChatExport_НОВИЧКИ --out media/clips

# 2. Look at media/clips/frames/<key>.jpg and fill in `exerciseId` in media/clips/manifest.json.
#    Re-running step 1 never overwrites an identification you have already made.

# 3. Apply the manifest to the exercise library (writes `video:` onto each matched exercise).
node scripts/media/apply-manifest.mjs --dir media
node scripts/media/apply-manifest.mjs --dir media --check   # CI: fails if content has drifted

# 4. Push the clips into the private bucket. Service role key, never the anon key, and never
#    committed — it bypasses RLS because the insert policy is admin-only.
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… \
  node scripts/media/upload-videos.mjs --dir media/clips
```

## Progress

|              |                               |
| ------------ | ----------------------------- |
| Unique clips | 145                           |
| Identified   | 4 — see `media/manifest.json` |

Identification is the slow part and it does not parallelise: four frames are often not enough. The
clip that looked like a shoulder press turned out to be a thruster — a front squat driving into an
overhead press — which only became clear from a denser frame strip. Every entry in the manifest
carries a note saying what was actually seen.

## Where the files live: private, in Supabase

Decided by the owner: the clips are paid content and go in the private `videos` bucket, not into
the repository. The plumbing already exists — `supabase/migrations/0003_storage.sql` creates the
bucket and the policies, and `resolveMediaUrl()` turns a `storage:` reference into a short-lived
signed URL.

Exercise demos go to `shared/`, not under a course id. The same movement appears in several
courses, so gating a demo behind one of them would hide it from someone who bought a different
one; `shared/` still requires a signed-in session, and the bucket is private either way.

    videos/shared/<exercise_id>.ru.mp4

**Nothing plays until a Supabase project exists** (`docs/SETUP.md`). Until then the app runs in
demo mode, where `resolveMediaUrl` returns `undefined` for every `storage:` reference.

That is safe rather than broken, and it is why the `video:` references can be committed ahead of
the upload: `useMediaUrl` swallows the failure and `ArtLayer` keeps drawing the animated figure.
An exercise starts playing real video the moment its object appears in the bucket — no code
change, no redeploy.

## Known constraint on fetching

The Google Drive connector refuses files over 10 MB, and 29 of the clips exceed it. Those cannot be
pulled through that route at all — they need to reach the machine some other way (a local clone of
the export, or the files attached directly).
