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
watching each clip — `prepare-videos.mjs` writes an eight-frame contact sheet per clip to make that
quick, but a person or a model still has to look.

The frames are sampled **by time**, not at fixed frame numbers. Fixed indices assume a length and
a frame rate: on an eleven-second clip the later ones land past the end and the strip comes out
short.

Two things decide how many frames are useful, and neither is obvious:

- **Skip the intro.** Every clip opens with Sergey facing the camera explaining the movement; he
  performs it several seconds in. Sampling the full duration spent a quarter of the frames on a man
  standing still, which is why a dumbbell clean, a snatch and a push press all reduced to the same
  three usable frames. Sampling starts at 30% of the clip.
- **Two rows, not one.** Anything viewed is scaled to fit a fixed width, so twelve frames in a
  single row are each _smaller_ than eight. A 6×2 grid stays under that ceiling: twelve frames at
  full tile size.

## Pipeline

All of these run **from inside the repository**, after `npm install`.

```bash
# 1. Transcode to web-playable MP4 (iPhone HEVC .MOV will not play in Chrome or Firefox),
#    dedupe re-posts, and write one contact sheet per clip. With no argument it looks for a
#    ChatExport* folder in the current directory, ~, ~/Downloads and ~/Desktop — the export is
#    named after the channel, so the real folder is `ChatExport_‼️НОВИЧКИ‼️` and typing that by
#    hand is not worth anyone's time.
npm run media:prepare
npm run media:prepare -- ~/Downloads/ChatExport_… --out media/clips   # or point it yourself
npm run media:prepare -- --frames-only    # rebuild the contact sheets, skip re-encoding

# 2. Look at media/clips/frames/<key>.jpg and fill in `exerciseId` in media/manifest.json.
#    Re-running step 1 merges into that file: an identification is never overwritten, and the
#    `note` recording what was seen travels with it.

# 3. Apply the manifest to the exercise library (writes `video:` onto each matched exercise).
npm run media:apply
npm run media:apply -- --check      # CI: fails instead of writing, if content has drifted

# 4. Push the clips into the private bucket. Service role key, never the anon key, and never
#    committed — it bypasses RLS because the insert policy is admin-only.
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run media:upload
```

Transcoding takes roughly 1 GB down to 178 MB across 145 clips, the largest 3.1 MB.

### The manifest is not in the clips folder

`media/clips/` is gitignored — it is paid content and 178 MB of it. The manifest is not: it lives
at `media/manifest.json`, under version control, because identification is the expensive part of
this job and losing it to a fresh clone would mean watching 145 clips again. All three scripts read
and write that path. An earlier version wrote it inside `media/clips/`, which meant a run on
another machine reported `identified: 0/145` while four identifications sat in the repository.

## Progress

All 145 clips have been reviewed against the 83-exercise library. The headline number is not
145 demonstrations — it is 36.

|                               |     |                                                       |
| ----------------------------- | --: | ----------------------------------------------------- |
| Identified                    |  36 | mapped to an exercise and referenced in `content/`    |
| Second takes                  |  64 | the same movement filmed again on another day         |
| No counterpart in the library |  13 | a real exercise, but not one of the 83                |
| Not exercises at all          |   8 | seven talking-head clips and one about drinking water |
| Still undecidable             |  24 | dumbbell lifts that 8 frames cannot separate          |

Two findings matter more than the count.

**The export is one beginner session filmed five or six times.** `IMG_016x`, `IMG_024x`,
`IMG_029x-030x`, `IMG_03xx`, `IMG_41xx`, `IMG_98xx` and `IMG_99xx` all cover the same dozen
movements — air squat, knee push-up, reverse lunge, bench dip, mountain climber, jumping jack,
sit-up, dead bug, V-up. Sergey appears to have re-recorded the set for each new intake. Where a
movement has several takes, there is a choice about which to ship; right now the id sits on
whichever take was seen first, which is arbitrary and worth revisiting.

**Eight clips are not exercise footage.** Seven are talking-head videos filmed at home by someone
who is not Sergey; one is Sergey with a water bottle. They sit in `video_files/` with the same
naming as everything else and are distinguishable only by watching them. Any process that filled
this manifest in without looking would have served a personal video message to a paying customer
as an exercise demonstration.

One clip, `IMG_0308`, is a correct glute bridge filmed in a different venue by someone in
different clothing. It is left unassigned: whether a demo that is visibly not the coach belongs in
his course is the owner's call, and a blank id means it does not ship by default.

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

## Moving the work between machines

The video never needs to travel. Identification is done from the contact sheets, and all 145 of
them together are about 6 MB — one zip, comfortably under the 10 MB ceiling the Google Drive
connector imposes, where the clips themselves are 178 MB and 29 of them individually exceed it.

    cd media/clips && zip -r ~/Downloads/frames.zip frames

The clips stay where they were transcoded and go straight from there into Supabase with
`npm run media:upload`. What comes back is `media/manifest.json` with the `exerciseId` fields
filled in — a few kilobytes of text, which is the whole point of keeping it out of `media/clips/`.
