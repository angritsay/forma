# The coach's programming rules for beginners

Read this before authoring or editing any workout in the beginner course (`content/courses/start.ts`)
or any warm-up / cool-down block. It is what Sergey said and wrote when he reviewed the app's
version of his programme; the sources are the channel export (`docs/COACH_SOURCE.md`) and his
rewritten "ideal" first workout. When these rules and the engine's defaults disagree, the rules win
and the content is authored around them.

## The one sentence

> «Первая тренировка не должна вас уничтожить. Она должна помочь вам захотеть прийти на вторую.»
> The first session must not destroy you; it should make you want to come to the second.

Everything below follows from that.

## Anatomy of a session

| Part      | What it is                                                | Length   | Counted as training? |
| --------- | --------------------------------------------------------- | -------- | -------------------- |
| Warm-up   | Joint mobility («суставная гимнастика») from the top down | ~5 min   | No                   |
| Main work | One piece (two only when he wrote two)                    | 5–15 min | Yes                  |
| Cool-down | Stretch («заминка / растяжка / динамическая растяжка»)    | ~5 min   | No                   |
| Record    | Write down how it felt, 2–3 minutes                       | after    | —                    |
| Fallback  | Did not feel like training? Walk, up to 10 000 steps      | any day  | —                    |

A session in the app is therefore 13–20 minutes at "as usual" (about 17 on average); the work inside
it is 3–10 minutes.

### Warm-up: joint mobility, top to bottom

Mandatory before every session. Never running or jumping — «бег на месте 45 секунд — сразу нет».
Easy pace, the range of motion grows gradually, no jerks. One round:

| #   | Movement                                        | Dose          | Cue                                       |
| --- | ----------------------------------------------- | ------------- | ----------------------------------------- |
| 1   | Neck circles (`neck_circles`)                   | 20 s          | half-circles across the front, never back |
| 2   | Arm circles (`arm_circles`)                     | 20 s          | half forward, half backward               |
| 3   | Elbow and wrist circles (`elbow_wrist_circles`) | 20 s          | elbows at shoulder height                 |
| 4   | Side bends (`side_bend`)                        | 20 s          | hips stay put, bend straight to the side  |
| 5   | Hip circles (`hip_circles`)                     | 20 s          | both directions, feet glued to the floor  |
| 6   | Leg swings (`leg_swing`)                        | 6 per side    | hold a wall or chair                      |
| 7   | Knee circles (`knee_circles`)                   | 20 s          | small circles, heels down                 |
| 8   | Ankle circles (`ankle_circles`)                 | 15 s per side | only the foot moves                       |
| 9   | Squat-to-stand (`squat_to_stand`)               | 5 reps        | slowly, to a comfortable depth            |

In content this is the `warmup()` block in `content/courses/start.ts` (`scalable: false`, so the
engine never shrinks or grows it). His own three warm-up videos are not in the export; if he sends
them, they attach to these exercises as `video:` references — no course change needed.

### Cool-down: stretch, then write it down

Never skipped. Breathe slowly, stretch to a pleasant pull, never into pain. One round:

| #   | Movement                                  | Dose          |
| --- | ----------------------------------------- | ------------- |
| 1   | Cat-cow (`cat_cow`)                       | 6 reps        |
| 2   | Standing quad stretch (`quad_stretch`)    | 30 s per side |
| 3   | Hamstring stretch (`hamstring_stretch`)   | 25 s per side |
| 4   | Hip-flexor stretch (`hip_flexor_stretch`) | 20 s per side |
| 5   | Child pose (`child_pose`)                 | 45 s          |

Then the record. He asks for five things, and the app's post-session feedback (RPE, feeling,
notes) is where they go:

- how hard it felt;
- which movement was easiest;
- which was hardest;
- what the body feels like afterwards;
- anything uncomfortable or unexpectedly hard.

In content this is the `cooldown()` block; its description carries the "write it down" prompt.

## The workout template

Every workout description and every item note follow the shape of his ideal first workout:

1. **Goal** in one or two sentences («познакомить тело с тренировками, включить основные группы
   мышц и просто начать»). Then the anti-goal: not fast, not max reps — technique and a comfortable
   load.
2. **Warm-up is mandatory** — stated, not assumed.
3. **Per movement:** a rep range with the low end named as the starting point for complete
   beginners; a technique reminder («корпус ровно, живот слегка напряжён, таз не проваливаем, локти
   не разводим»); the easier alternative if even the minimum is too hard; the rest after it.
4. **Rounds** spelled out.
5. **Important:** do not chase the maximum; pick a count where the last reps are felt but the
   technique stays good; if it gets too hard, reduce reps or take the easier variant; sharp pain
   is not normal — stop.
6. **Cool-down**, the record, and the walking fallback.

Where that lives in content:

- The workout `description` carries 1, 4 and 5 in his voice.
- Every main-work item carries 3 as its `note`. `CUES` in `start.ts` holds his cue per movement and
  `withCues()` applies it to any item that has no note of its own, so no movement is ever shown as
  a bare number.
- 2 and 6 live in the shared warm-up and cool-down blocks: the warm-up description ends with «резкая
  боль — не норма, остановись», and the cool-down description carries the record and the walking
  fallback («не получилось потренироваться — прогулка»).
- Numbers the difficulty choice moves (reps, AMRAP windows, caps, EMOM minutes, circuit rounds) stay
  out of titles, node subtitles and descriptions — the player shows the prescribed numbers. Texts
  quote numbers only for `scalable: false` blocks (the ladders of workouts 12 and 13 and the
  reference points 19 and 20) and for workout 4's 5-minute window, which a one-item AMRAP never
  moves.

## Loading rules

- **No max-effort test on day one.** «Никаких максимумов»: no 2-minute push-up test, no max
  squats, no 5-minute plank. Day one is workout 1. The onboarding sets the starting load and the
  assessment the app offers after the second workout fine-tunes it; there is no test inside the
  course. His own reference points are workouts 19 (the inchworm ladder) and 20 (the finale he
  compares with workout 1).
- **First-week reps:** knee push-ups 5–10 (start at 5; from a high surface if 5 is too hard), dead
  bug 6–10 per side, sit-ups 8–15, squats 8–15 (start at 8). A beginner "does not know how strong
  they are", so the range starts low.
- **Author at his "confident beginner" number** (the upper-middle of the range) at scale 1.0. The
  engine gives a fresh beginner scale 0.6–0.8 after onboarding, which lands on his "start from the
  minimum" without a separate beginner column. Check both numbers on the review page.
- **Dead bug is the main core option for beginners**; sit-ups only for those who do them
  confidently and without discomfort. Diastasis: sit-ups, Russian twists and toe reaches are out —
  dead bugs instead, twice the reps. `sit_up.scaling.easier = dead_bug` so the pregnancy
  limitation swaps automatically.
- **No jumps.** His 20-workout programme has no jumping jacks, rope or burpees; do not add them.
- **One main piece per session.** His sessions are one format: work by the minute, rounds for
  time, AMRAP, EMOM, "every N minutes", a ladder, a chipper, buy-in intervals. Two blocks only where
  he wrote two (workout 14's round of 20 and round of 40); workout 18's two buy-in intervals are
  each a one-round for-time buy-in plus a one-minute AMRAP of the "max" movement, so the AMRAP never
  loops back to the buy-in.
- **"Start every N minutes" is a circuit with the rest authored.** The app has no "every N minutes"
  clock, so the rest is written as what is left of the window at the authored numbers: workout 3
  (three pairs, `restAfterSec` after each pair) and workout 10 (`restBetweenRoundsSec`). A for-time
  block never plays per-item rests — do not use one where a rest has to play.
- **Rest is generous early.** Workouts 1–2 rest until the minute is up; "minimal rest" in his text
  means 15–30 s in content, never zero for a beginner.
- **Ladders and benchmarks are `scalable: false`.** Scaling each rung would bend a ladder out of
  shape (12, 13), and a reference point is only comparable if it is the same every time (19, 20).
- **Workout 4 is a max-reps block.** A one-item AMRAP: the item's reps are the total target
  (100 at scale 1, scaled to the person) and the 5-minute window never moves.
- **No deload week** — his programme has none. Add one only if he asks, on the week he names.
- **Only movements he has on video** in the main work (`media/manifest.json`), so nothing needs
  to be re-shot. The glute bridge (workout 4), once the exception, he filmed for the app.

## Cadence and the path

- His spec of 10 September: **20 workouts in a row, four blocks of five**, no rest days on the path,
  no deload, no test at the start or the end. `week` on a node is the block (1–4) and `day` the
  position inside it (1–5), not a day of the week. He suggests five a week; the athlete keeps their
  own pace and a missed day breaks nothing.
- Workout and node ids are stable (`w_s01_emom` … `w_s20_finisher`, `w1_d1_s01` … `w4_d5_s20`);
  change the content of a workout, never its id, or progress and the seed break.
- Workouts 19 and 20 are `benchmark` nodes: the inchworm ladder is his «через месяц-два повторите»
  reference (an EMOM, one rung per minute, so the app shows the target per minute), and the finale
  mirrors workout 1 so the athlete compares how it feels.

History: the first app version of his programme was the 24 workouts from the channel in posting
order, over 8 weeks, three sessions a week on days 1, 3 and 5 with «Отдых и прогулка» nodes and a
7 000-step goal between them, jumping jacks from week 3, burpees in week 5 and a retest at the end.
He replaced it with the 20-workout spec above; the channel messages stay in `docs/COACH_SOURCE.md`
and the review page pairs each current workout with the nearest one.

## Session length guardrails

`src/content/course-load.test.ts` enforces the beginner cap: 30 minutes at "as usual", a felt
step of 3–14 minutes between difficulty choices where a block's sets can move, and identical
tests at every difficulty. Keep sessions well under the cap; his target is 5–15 minutes of work.

## Workflow

1. Edit `content/courses/start.ts` (and the exercise library only for movements he actually uses).
2. `npm run test` — content, load and engine tests.
3. `npm run content:review -- --course start` — renders `review/start.html` day by day with the
   authored and beginner numbers, the engine's minutes at each difficulty, his verbatim message
   beside each workout, the clip behind each movement and the open questions. Publish it for him;
   his answers come back as changes to this file and to the course.
4. If workout ids or `basePoints` changed: `node scripts/content/gen-seed.mjs` and re-apply the
   migration.

## Open questions for the coach

Tracked on the review page (`scripts/content/review-course.mjs`, `ANNOTATIONS.start`) and in the
PR; update both when he answers.

- Workouts 1–2: how many 4-minute EMOM cycles? The app plays one (his timer picture is not in the
  export).
- Workout 3: the core pair's volume (sit-ups authored at 8 against his 10–20, then 30 dead bugs);
  the 2-minute rest after each pair standing in for "start every 2 minutes"; «Посложнее» adding a
  second pass of all three pairs.
- Workout 4: 100 bridges in 5 minutes (his 10 September spec) against the channel's 200 with a
  10 / 8-minute cap — confirm.
- Workout 7: sit-ups swap for dead bugs one-for-one inside the minute (his «12 ситапов / 12 жуков»).
- Workout 9: is an 8-minute cap enough for two rounds (about 8 minutes of work at his numbers)?
- Workout 10: "every 2 minutes" as the round plus 70 s of rest.
- Workouts 12–13: the ladders are the same numbers for everyone, beginners included.
- Push-ups three workouts in a row (13, 14 — 60 knee push-ups — and 15); inchworms four in a row
  (16–19).
- Workouts 17–18: how the "max in the time left" windows are played (buy-in + a fixed count, then
  3 minutes of rest; buy-in with a one-minute cap + a one-minute AMRAP).
- His three warm-up videos — send them; the warm-up has no picture until they arrive.
