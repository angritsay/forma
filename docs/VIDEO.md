# Sergey's exercise videos

The app plays the coach's own clip of a movement and nothing else. `PlayerScreen` renders a
`<video>` whenever `exercise.video[locale]` resolves, with a still from the same clip as its poster;
where a movement has not been filmed there is the still alone, and where there is no still either,
the flat tile. There used to be a drawn stick figure in that place. It is gone: a drawing of a
movement we film is a worse picture of it, and a drawing of one we do not film is a promise the app
cannot keep.

So a movement that is used by a course and has no clip is a gap in the course, and the review page
(`npm run content:review`) marks it «не снято».

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

## Pipeline A — a folder of clips named after the movements

This is the short one, and the one to use for anything shot deliberately from now on. Each movement
is filmed once and the file is named after it («Ягодичный мост.mov»), so there is nothing to
identify: `media/names.json` says which exercise id each Russian name means, and that file is the
only thing to edit.

```bash
# 1. Encode, cut a still from each clip and write the manifest. Idempotent: an mp4 that is already
#    there is left alone, so a re-shoot of two movements costs two encodes, not forty-four.
npm run media:prepare-named -- ~/Downloads/Упражнения

# A clip whose name has no id in media/names.json is listed and skipped, never guessed — the wrong
# clip on the right exercise is worse than no clip. Fill in the id and run it again.

# 2. Write `video:` onto the matched exercises, the same step as below.
npm run media:apply -- --manifest media/clips/manifest.json

# 3. Upload. Service role key, never the anon key, never committed.
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… \
  node scripts/media/upload-videos.mjs --dir media/clips --manifest media/clips/manifest.json
```

Add `--dry-run` to step 3 to see which clips and which stills would go where, and upload nothing.
Both halves are reported: a movement with a clip but no still is a blank tile in the app, because
there is no drawn figure behind it any more.

## Pipeline B — the Telegram export

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

# 4. Push the clips into the private bucket, and each clip's still into the public one. Service
#    role key, never the anon key, and never committed — it bypasses RLS because the insert
#    policy is admin-only.
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npm run media:upload
```

Transcoding takes roughly 1 GB down to 178 MB across 145 clips, the largest 3.1 MB.

### The still, and why it is a different picture from the contact sheet

Step 1 writes two things per clip. `frames/<key>.jpg` is the twelve-thumbnail contact sheet you
identify the clip from; it never leaves your machine. `posters/<key>.jpg` is a single readable
frame taken 45% in, and step 4 uploads it to `images/exercises/<exercise_id>.jpg` in the **public**
bucket. That is what the workout preview draws for every movement in a session («За тренировку»).

45% rather than the midpoint because several clips end with the coach standing back up to talk,
and the exact middle is then a man facing the camera rather than the movement.

Nothing references it by name: `exerciseStillUrl()` derives that path from the exercise id, so a
clip uploaded today shows up on the preview with no content edit and no deploy. A movement with no
still yet is not a gap either — the app draws its blueprint figure, which is what the whole app is
drawn in.

### The manifest is not in the clips folder

`media/clips/` is gitignored — it is paid content and 178 MB of it. The manifest is not: it lives
at `media/manifest.json`, under version control, because identification is the expensive part of
this job and losing it to a fresh clone would mean watching 145 clips again. All three scripts read
and write that path. An earlier version wrote it inside `media/clips/`, which meant a run on
another machine reported `identified: 0/145` while four identifications sat in the repository.

## The coach's own clips replace the export

On 11 September 2026 the coach filmed the movements deliberately: one file per exercise, trimmed
to the movement, **named after the exercise in Russian**. That makes identification a filename
lookup — no contact sheets, no watching, none of the guesswork the export demanded.

Twelve exercises are covered:

| File (Drive)           | Exercise           |
| ---------------------- | ------------------ |
| приседания.mov         | `air_squat`        |
| отжимания.mov          | `push_up`          |
| отжимания с колен.mov  | `knee_push_up`     |
| обратные отжимания.mov | `chair_dip`        |
| выпады.mov             | `reverse_lunge`    |
| зашагивания.mov        | `step_up`          |
| ягодичный мост.mov     | `glute_bridge`     |
| скалолаз.mov           | `mountain_climber` |
| русский твист.mov      | `russian_twist`    |
| сетапы.mov             | `sit_up`           |
| жук.mov                | `dead_bug`         |
| червяк.mov             | `inchworm`         |

**The Telegram export is retired wholesale**, on the owner's instruction: all 36 of its
identifications were dropped. Its clips are still listed in the manifest, with a note recording
what each one was, but no clip in it carries an `exerciseId` any more. An exercise without one of
the twelve new clips shows the drawn figure, which is the honest fallback — better than a talking
intro, a second take, or the one clip that turned out to be filmed by somebody who is not the
coach.

The clips are encoded with **no audio track at all** (`-an`). The coach talks through each
movement while filming; that is worth watching once and wrong to start up by itself in the middle
of a set. Muting in the player was the old answer, but a muted `<video>` still carries the track
and still showed an unmute button implying there was something to hear — so that button is gone
too. The app's own cues are a different thing and stay — they are synthesised, not recorded
(`src/app/features/player/sound.ts`), and their switch lives in the account rather than over the
clip, because it is a preference and not a control you reach for mid-set.

## Progress

All 145 clips were reviewed against the exercise library when the export was the only footage
there was. The table below is kept as the record of what that review found — it is why the
export was retired rather than trimmed.

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

## Uploading from CI (no laptop, no key on disk)

The upload needs the **service-role** key, which must never live on a personal machine or in the
repo. The `Upload videos` GitHub Action (`.github/workflows/upload-videos.yml`) keeps it in a
GitHub secret instead and runs the same two scripts on a runner.

One-time: add the secret `SUPABASE_SERVICE_ROLE_KEY` (Settings -> Secrets and variables ->
Actions); `PUBLIC_SUPABASE_URL` is already a variable and is reused.

The 36 identified source clips are fetched straight from the owner's Google Drive by file id.
`media/drive-files.json` maps each `exerciseId`/camera `key` to its Drive file id (generated from
the export with the Drive listing); the Action `gdown`s exactly those, transcodes and uploads. So
there is nothing to zip: the export's `video_files/` folder only needs to be shared "anyone with
the link" once, so the runner can read each file.

Keep **dry_run** on for the first pass — it downloads, transcodes and lists what it would upload
without writing anything or needing the secret — then run again with it off. `prepare` merges into
`media/manifest.json` and never clears an identification, so a re-run only fills in what is missing.

If clips are re-identified later, regenerate `media/drive-files.json` from the export (each entry
is `{ exerciseId, key, id }`, one per identified clip) and the next run picks them up.

## Аудио

Since 0048 an exercise can carry sound as well as a clip, in a second private bucket, **`audio`**,
with the same access rules as `videos` (`shared/…` for anyone signed in, `<course_id>/…` by
entitlement, admins write). Two kinds of recording:

- **The name, spoken.** The player says the exercise's name at the start of the step, so a person
  holding a pose does not have to read it off the screen. One file per language.
- **An explanation.** Shown before the exercise: the full one the first time, the brief one the
  next two times, then nothing. Each tier is any subset of text, one clip (the same for both
  languages) and a recording per language.

Encode every recording as **AAC in `.m4a`, mono, 64 kbps** — a spoken name is under a second and a
two-sentence explanation a few hundred kilobytes; keep each file **≤ 1 MB** (the editor refuses
anything over 5 MB). The paths are fixed by the exercise id, so a re-upload replaces the file:

    audio/shared/<exercise_id>.<lang>.m4a                 the name, spoken
    audio/shared/<exercise_id>.intro-<tier>.<lang>.m4a    an explanation's recording, tier = full | brief
    videos/shared/<exercise_id>.intro-<tier>.<ext>        an explanation's clip

Everything here is uploaded from the exercise editor (`/app/#/admin/exercises`, the «Название
голосом» and «Объяснения» sections) — no script, no dashboard. The media library
(`/app/#/admin/media`) lists what is in each bucket by folder, with the size and the exercises that
reference each file, and removes what nothing references.

The clip's mode lives next to it: `loop` repeats the clip while the step lasts; `fit`, for a pose
entered once and held, slows the clip to the step's duration (no slower than 0.5×) and holds its
last frame.
