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

A session in the app is therefore 14–23 minutes at "as usual"; the work inside it is his 5–15.

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
- 2 and 6 live in the shared warm-up and cool-down blocks.

## Loading rules

- **No max-effort test on day one.** «Никаких максимумов»: no 2-minute push-up test, no max
  squats, no 5-minute plank. Day one is workout 1. The onboarding self-tests set the starting
  load; the only test in the course is the retest at the end (still open whether he wants it).
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
- **Jumps:** jumping jacks appear from week 3 and always carry the "step out to the sides"
  option; a rope is never required (jumping jacks replace it 1:1 by time). Burpees appear in
  workout 13 (week 5), stepped if the jump is not there.
- **One main piece per session.** His sessions are one format: rounds with a minute of rest,
  rounds for time, AMRAP, EMOM, "every N minutes", a ladder, a chipper. Two blocks only where he
  wrote two (workouts 3, 15, 19).
- **Rest is generous early.** A full minute after every movement in weeks 1–2; "minimal rest"
  in his text means 15–30 s in content, never zero for a beginner.
- **No deload week** — his programme has none. Add one only if he asks, on the week he names.
- **Only movements he has on video** in the main work (`media/manifest.json`), so nothing needs
  to be re-shot. The single exception is the glute bridge (his workout 4).

## Cadence and the path

- 8 weeks, 3 sessions a week on days 1, 3 and 5; rest nodes between them with a 7 000-step goal
  and a note that a walk is the fallback for a day without training.
- 24 workouts in his posting order (his labels had two "13"s and two "18"s and no 19/20; the app
  renumbers 1–24 and keeps his label on the review page).
- Workout 5 is repeated as workout 21 (same workout id, `benchmark` node both times) so the app
  can show the time difference — his «сравните ощущения с 5-й тренировкой».
- The burpee ladder (workout 20) is his reference point «через месяц-два»; keep it an EMOM so
  the app shows the target per minute.

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

Tracked on the review page and in the PR; update here when he answers.

- Keep the end-of-course retest, or drop it too?
- Glute bridge: film it, or allow the existing clip by someone else?
- His three warm-up videos — send them to replace the animations.
- Toe reaches shown as sit-ups; 100 sit-ups (his workout 7) in week 3; workout 22 as two rounds;
  "4 minutes of squats" as its own short day; rope as optional equipment.
