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
node scripts/media/apply-manifest.mjs        # TODO: write once the manifest is filled in
```

## The open question: where do the files live?

This is the decision that has to be made before any of it ships, and it is a business decision, not
a technical one.

**Option A — public, in the repo.** Transcoded to 720p at CRF 28 the clips come to roughly 1–2 MB
each, so ~200–300 MB for all 145. That fits GitHub Pages (1 GB soft limit) and ships immediately
with no backend. The cost: the demos are freely viewable by anyone, bought or not.

**Option B — private, in Supabase Storage.** What the app was designed for, and the plumbing is
already written: a private `videos` bucket, RLS policies that check the viewer's entitlement, and
`resolveMediaUrl()` handing back short-lived signed URLs. Requires a Supabase project to exist
(`docs/SETUP.md`); until then the app runs in demo mode and there is nowhere to put a file.

Worth weighing: the exercise encyclopedia on the landing is already public SEO content, and what a
buyer actually pays for is the programme, the adaptation and the tracking — not the demo clip. Most
fitness products keep demos public for exactly that reason. But it is the owner's call.

## Known constraint on fetching

The Google Drive connector refuses files over 10 MB, and 29 of the clips exceed it. Those cannot be
pulled through that route at all — they need to reach the machine some other way (a local clone of
the export, or the files attached directly).
