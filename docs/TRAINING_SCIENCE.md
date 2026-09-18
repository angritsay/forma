# Forma training-science engine

This document explains every rule and constant in `src/lib/training/*` — what it does, why it is
set the way it is, and where the number comes from. Values marked **expert anchor** are coaching
judgement calls, not published norms; they are deliberately conservative and easy to tune in
`constants.ts`. Everything else is traced to a named guideline or paper in the [Sources](#sources)
section. The engine is pure TypeScript: no I/O, no clock (timestamps are passed in), and every
function is unit-tested (`*.test.ts` next to each module). Numbers that come back from storage — a
course scale, a persisted prescription, a player step — are guarded: a missing or non-finite value
falls back to its documented default instead of spreading `NaN` through targets, points and
calories.

## 1. Principles

1. **Progressive overload in small steps.** Volume is expressed as a single _scale_ (0.5–1.5) that
   multiplies the authored reps/seconds/meters/calories of a course. The scale moves by ±2–5% per
   session, in line with the ACSM recommendation to increase load by 2–10% once the athlete can
   exceed the target repetitions (ACSM Position Stand 2009; Kraemer & Ratamess 2004).
2. **Autoregulation with RPE.** After each session the athlete reports a Borg CR10 rating (1–10)
   and a completion ratio is computed from the recorded work. The RPE/RIR literature (Zourdos et al.
   2016; Helms et al. 2016) shows that perceived exertion tracks proximity to failure well enough to
   steer load week to week; Forma uses it to steer volume.
3. **Planned recovery.** Deload nodes cut volume to 65% and lengthen rest by 20%; a pre-workout
   recommendation nudges the athlete to "easier" after a maximal session, an incomplete session,
   short recovery (< 24 h) or an unusually heavy walking day (Bell et al. 2022 survey of deloading
   practice; NSCA _Essentials of Strength Training and Conditioning_ on recovery between sessions).
4. **Safety first.** Limitations (knees, lower back, shoulders, wrists, hypertension, pregnancy)
   change what is prescribed, not only how much; pain always reduces load and surfaces a "see a
   professional" note.
5. **Consistency is counted, not chained.** There was a streak here, and before that a streak a
   walk could keep alive at ≥ 7 000 steps, on the cohort evidence that 7 000 is where mortality
   risk drops most steeply (Paluch et al. 2021, JAMA Network Open; Paluch et al. 2022, Lancet
   Public Health). Both are gone and for different reasons.

   Steps failed on **measurement**: a Mini App cannot read a phone's step counter — Apple HealthKit
   has no browser API, Google Fit's REST API is closed to new applicants and shuts down at the end
   of 2026, Health Connect is on-device Android — so the figure was typed in by hand, and the
   owner's rule is that a number you keep in two apps is a number you keep in neither.

   The streak failed on **the training itself**. Principle 3 above prescribes 48 hours of recovery
   between hard sessions and the beginner course schedules five sessions a week; a metric that
   breaks on the first day off was therefore at war with the programme it sat on top of, and the
   athlete who followed the plan exactly saw it reset every weekend. It is replaced by
   `countTraining()` (§8): workouts done, workouts this week, best week, weeks active. Every one of
   those can only go up, and none of them is damaged by a rest day.

   The WHO 2020 «every move counts» guidance still argues for the walks and the rest the courses
   prescribe; it is simply no longer scored.

## 2. Fitness index, level and initial scale (`assessment.ts`)

`computeFitnessIndex(profile)` returns an index 0–100, a level (1–3) and per-component scores.

| Component  | Weight | Input                        | Scoring                                                |
| ---------- | -----: | ---------------------------- | ------------------------------------------------------ |
| pushups    |    30% | push-ups in 60 s             | CSEP/ACSM norms, age & sex (below)                     |
| squats     |    25% | air squats in 60 s           | expert anchors, age-shifted (below)                    |
| plank      |    20% | plank hold, seconds          | expert anchors informed by averages                    |
| activity   |    15% | self-reported activity level | sedentary 10 · light 40 · moderate 70 · active 100     |
| experience |    10% | self-reported experience     | none 10 · beginner 35 · intermediate 70 · advanced 100 |

The weights are a design choice: the two movement tests that best predict what the courses ask for
(upper-body push endurance and lower-body endurance) dominate; trunk endurance follows; self-reported
inputs are kept light because they are the least reliable.

**Where the numbers come from now.** The onboarding no longer runs three separate tests. It asks one
question — «хочешь адаптировать тренировки под себя?» — and, if the answer is yes, runs five
movements of one minute each at a _comfortable_ pace (`content/site/assessment.ts`), because the
coach's own first rule is that day one carries no maximum efforts (docs/COACH_RULES.md). Two of the
five land in the table above, the other three are stored as personal records.

That changes what the push-up input means, and the change is deliberate: it is now reps in 60 s
rather than reps to failure. For anyone the beginner course is written for the two numbers are the
same — technical failure arrives well inside the minute — and for a stronger athlete the clock
truncates the count, which lowers the starting load. Under-reporting is the safe direction, and it
is the one the coach asks for. The scoring tables are unchanged.

The plank is no longer asked for at onboarding at all: a plank is measured in seconds rather than
counts, and a _maximum_ hold is exactly the kind of effort the rule above rules out. Its component
is imputed from the rest by the mechanism in §2.4, which is what that mechanism is for. The scoring
curve stays documented below because the engine still scores a plank wherever one is measured — a
benchmark node inside a course, a retest.

### 2.1 Push-ups — CSEP / ACSM norms

Anchors are the category minimums of the Canadian Society for Exercise Physiology push-up test
(_Canadian Physical Activity, Fitness & Lifestyle Approach_, CPAFLA), the table reproduced in
_ACSM's Guidelines for Exercise Testing and Prescription_. Men perform full push-ups, women the
modified (knee) push-up — that is how the norms were collected.

Minimum reps for **fair / good / very good / excellent**:

| Age   | Men (full)        | Women (modified)  |
| ----- | ----------------- | ----------------- |
| 20–29 | 17 / 22 / 29 / 36 | 10 / 15 / 21 / 30 |
| 30–39 | 12 / 17 / 22 / 30 | 8 / 13 / 20 / 27  |
| 40–49 | 10 / 13 / 17 / 25 | 5 / 11 / 15 / 24  |
| 50–59 | 7 / 10 / 13 / 21  | 2 / 7 / 11 / 21   |
| 60–69 | 5 / 8 / 11 / 18   | 2 / 5 / 12 / 17   |

Scoring: 0 reps → 0, fair → 25, good → 50, very good → 75, excellent → 100, linear in between,
100 above excellent. Forma's age bands (18–24, 25–34, …) straddle the norm bands, so the anchors
used are the **mean of the two overlapping norm bands** (18–24 uses 20–29; 65+ uses 60–69).

Modality conversion (**expert anchor**): a knee push-up counts as **0.6** of a full push-up. Kinetic
studies put the load of a knee push-up at roughly 75–80% of a full push-up as a share of body weight
(Ebben et al. 2011, J Strength Cond Res); because rep capacity falls steeply as relative load rises,
a rep-equivalence of 0.6 is the conservative choice. A man testing on his knees is scored on the
men's table at `reps × 0.6`; a woman doing full push-ups is scored on the women's table at
`reps / 0.6`. Sex `na` is the mean of the male and female scores.

### 2.2 Air squats in 60 s — expert anchors

No standardized norm exists for a 60-second air-squat test, so the anchors are coaching judgement
(**expert anchor**), for the 25–34 band: 15 reps → 10, 30 → 50, 45 → 80, 55+ → 100, linear in
between. Each older band shifts the rep anchors down 5% (35–44: −5%, 45–54: −10%, 55–64: −15%,
65+: −20%); 18–24 uses the 25–34 anchors.

### 2.3 Plank — expert anchors informed by published averages

15 s → 10, 30 s → 30, 60 s → 55, 90 s → 75, 120 s → 90, 180 s+ → 100 (**expert anchor**). The
curve is placed so that a healthy adult holding ~1–2 minutes scores in the middle, consistent with
college-age isometric-endurance norms (Strand et al. 2014, J Hum Kinet) and coaching practice; it
is intentionally not sex- or age-normalized because the evidence base is thin.

### 2.4 Missing tests, index cap, level, initial scale

- A missing test (the assessment was postponed, or it does not measure that component at all) is
  excluded from the weighted mean (the other weights are renormalized) and its
  `components` value is imputed from the mean; the skipped components are listed in `missing`.
- When **no** self-test was done the index is **capped at 60**: activity and experience are
  self-reported and must not place someone in level 3 on their own.
- Level: index < 35 → 1, 35–65 → 2, ≥ 66 → 3 (`LEVEL_TIER`).
- `initialScale(index) = 0.6 + 0.7 × index / 100` (0.6–1.3, two decimals): a beginner starts at
  60% of the authored volume, an excellent athlete at 130%.

## 3. Prescription (`prescribe.ts`)

`prescribeWorkout(workout, opts, exerciseLookup?)` turns an authored workout into concrete numbers.

Two profile fields are deliberately **not** inputs here: `timePerSessionMin` and `goal`. Session
length follows from the authored workout and the scale, and the goal from the course the athlete
bought; both are collected for choosing and presenting courses, not for scaling a session. Nothing
in the engine reads them — do not assume otherwise when wiring the app.

### 3.1 Effective scale and difficulty choice

```
effectiveScale = clamp(scale × CHOICE_VOLUME[choice] × (deload ? 0.65 : 1), 0.3, 2)
```

| Choice | Volume | Volume (for-time) | Sets (up to 2 blocks) | Window / rounds | Rest | Points |
| ------ | -----: | ----------------: | --------------------: | --------------: | ---: | -----: |
| easier |  ×0.90 |             ×0.80 |                    −1 |           ×0.80 | ×1.0 |   ×0.8 |
| normal |  ×1.00 |             ×1.00 |                     0 |           ×1.00 | ×1.0 |   ×1.0 |
| harder |  ×1.10 |             ×1.20 |                    +1 |           ×1.20 | ×1.0 |  ×1.25 |

**The choice has to be felt, and what an athlete feels is the clock.** The target is 5–10 minutes
between one option and the next; measured across the 75 published workouts the average step is
5.6 min, and 103 of 150 steps land in a 4–11 min band.

The lever is therefore _structural_ — a set added or removed, a window lengthened or shortened —
rather than a few percent on the reps:

- **Sets** are the main lever, applied to at most `MAX_CHOICE_SET_BLOCKS` (2) blocks, ranked by
  authored set count. Capped because trimming a set from every block of a five-block workout halves
  it, at which point it is a different session rather than the same one taken easier.
- **Self-clocked formats** (EMOM, Tabata, interval, AMRAP, for-time cap) have no sets to add, so
  the window itself moves. "As usual" returns the authored number untouched — no rounding.
- **For-time volume** moves further (±20%) because a for-time piece has nothing else to give: no
  rest to trade, and often a single round. Cutting a 21-15-9 to 15-12-9 is how a coach scales one.
- **Rest does not move with the choice at all.** How long you need between sets is a property of
  the movement, not of how ambitious you feel. It is also what broke the previous design: volume
  fell as rest rose, the two cancelled, and all three options finished within ~1.4 min of each
  other — in five workouts "easier" ran _longer_ than "harder". Rest remains a deload lever only.

Points reward the harder choice more than proportionally (×1.25) to make it attractive, and pay 80%
for the easier choice so it is never punished. **Deload:** volume ×0.65 and rest ×1.2, points as
normal — a one-third volume reduction is the common deload magnitude reported by strength coaches
(Bell et al. 2022). Pregnancy forces the whole prescription to `easier` (see 3.6).

Set counts key off the athlete's own `scale` **without** the choice folded in (`structuralScale`);
the choice contributes through `CHOICE_SETS_DELTA` instead, so it is never counted twice.

### 3.2 Targets

Blocks authored with `scalable: false` (warm-ups, cool-downs, tests) keep their numbers, and their
rest is left exactly as authored. For scalable blocks:

- reps → `max(1, round(reps × es))`
- seconds → `max(10, round to 5 s)`
- meters → round to 5 m (min 5)
- calories → `max(1, round)`
- AMRAP windows and EMOM / Tabata / interval / for-time rounds follow the difficulty choice
  (§3.1); the work/rest inside a Tabata or interval stays at its authored, canonical value.
- Hypertension: isometric holds are capped at 30 s (see 3.6).

### 3.3 Sets

For `sets` / `circuit`: the athlete's own scale ≥ 1.3 adds one set and ≤ 0.7 removes one (never
below 2, unless authored with fewer), and the difficulty choice adds or removes one more on up to
two blocks (floor of 1 set when the athlete chose `easier` — one honest set beats skipping the
session). The two together may never add more than `MAX_SETS_ADDED` (2) on top of what was
authored. This keeps per-set reps in the authored range instead of stretching one set to absurd
lengths. EMOM minutes and Tabata / interval / for-time rounds move with the choice instead.

The set change **compounds** with the scaled targets — it does not redistribute them. At the far
ends the total volume therefore moves further than the scale alone: a three-set block at effective
scale 1.5 becomes 4 × 1.5 = 2.0 of the authored volume, and at 0.65 it becomes 2 × 0.65 = 0.43. A
deload at a course scale near 1.0 lands in that lower band on purpose: a deload week is meant to be
noticeably lighter, and going under the 65% headline figure costs nothing but a little stimulus.

### 3.4 Rest

`restBetweenSetsSec`, `restBetweenRoundsSec` and item `restAfterSec` are multiplied by
`(deload ? 1.2 : 1)` and rounded to 5 s (a non-zero rest never rounds down to 0) — that is, they
follow the deload and nothing else. Interval and Tabata `restSec` are never scaled: 20/10 is the
format, not a suggestion.

### 3.5 Substitutions

An exercise is replaced by walking `scaling.easier` (up to 2 steps) when:

- the athlete lacks its equipment (`none` and `mat` are always available; an exercise listing
  several equipment options needs only one of them);
- the athlete is level 1 and the exercise is level 3, or level 2 with the `easier` choice;
- the exercise conflicts with a limitation (3.6).

Candidates are ranked: (1) first variant with no issues; (2) first that is doable and safe but above
the athlete's level; (3) first **easier** variant the athlete can do although it still touches the
limitation — prescribed with a caution note (the wrist rule, for example, steps a push-up down to a
knee/incline variant which reduces, but does not remove, wrist load); (4) otherwise the original
with an "equipment needed" note. Level-3 athletes choosing `harder` get `scaling.harder` for
bodyweight exercises when the harder variant is itself doable and safe — but **never in a block
that is not scaled** (warm-ups, cool-downs) or in a `test` block: a warm-up is authored as it is,
and a benchmark is only comparable when it is the same movement at the start and at the end of the
course. `substituted` and `originalExerciseId` are always set so the UI can say "instead of X".

**Units.** Scaling chains cross units (a 30 s `hollow_hold` steps down to `dead_bug`, measured in
reps). A substitute measured in another unit keeps the **work time**, not the number: the scaled
target is converted through the estimate of §3.8 (20 m of bear crawl ≈ 13 s ≈ 4 dead bugs at 3 s per
rep) and re-rounded with the §3.2 rules. Same-unit substitutions keep the authored number.

### 3.6 Limitations

| Limitation   | Rule                                                                                                                                  | Rationale                                                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| knees        | no `jump` pattern; no jumping lunge, tuck jump, jump squat, broad jump, skater → easier                                               | impact loading is the common aggravator of anterior knee pain; squats/lunges stay                                                                                                                 |
| lower_back   | no `hinge` with medium/heavy load; no superman, Russian twist → easier                                                                | loaded hip hinges and loaded/ballistic spinal extension or rotation are the usual triggers; bodyweight hinges (bridges) stay                                                                      |
| shoulders    | no `push_vertical`, `pull_vertical`, loaded overhead moves → easier                                                                   | overhead loading is the main provocation for impingement-type pain; horizontal pushing/pulling stays                                                                                              |
| wrists       | floor work on the hands (push-up family, planks, crawls, burpees) → easier variant, with caution                                      | wrist extension under body weight; knee/incline variants reduce the load                                                                                                                          |
| hypertension | isometric holds capped at 30 s; `heavy` loads become `medium`                                                                         | ACSM guidance for hypertension: moderate resistance, avoid Valsalva and sustained straining; short holds keep the pressor response low                                                            |
| pregnancy    | no `core_flexion` (supine crunch/sit-up family), no `jump`, no `heavy`; whole session treated as `easier`; never recommended `harder` | ACOG Committee Opinion 804 (2020) and the 2019 Canadian Guideline (Mottola et al. 2018): avoid supine work after the first trimester, high-impact and fall-risk activity; keep intensity moderate |

The engine does not diagnose; the limitation list comes from the athlete, and the "pain" feeling
after a session always triggers the safety note (§7.3).

### 3.7 Loads

For `loadable` exercises the label (`light` / `medium` / `heavy`, default `medium`) is mapped to
the athlete's dumbbells or kettlebells (by the exercise's equipment): light = lightest, medium =
middle (lower median for an even count), heavy = heaviest; one weight is used for every label; no
weights → `loadKg` is undefined and the label is kept for display.

### 3.8 Estimated seconds per item

reps × `secondsPerRep` (×2 for `perSide`); seconds as given; meters ÷ 1.5 m/s (easy run /
shuttle pace, **expert anchor**); calories × 4 s (a moderate rower/bike pace of ~15 cal/min,
**expert anchor**). Unknown exercises fall back to 3 s per rep and MET 5.

## 3.9 How hard a published session is allowed to be

The first version of the programs was reviewed by the coach whose name is on them, and his verdict
was that a client would not come back after a session like that. He was right, and the numbers show
why: sessions ran up to 48 minutes and routinely stacked three main pieces — a strength block, a
metcon _and_ a core finisher — with core circuits set at 30 s between rounds on already-tired legs.

The programs now hold to these rules, enforced by `src/content/course-load.test.ts` so new content
cannot quietly regress:

| Rule                                              | Value                         |
| ------------------------------------------------- | ----------------------------- |
| Longest session at "as usual" (level 2, scale 1)  | 40 min                        |
| Longest session in the beginner course (`start`)  | 30 min                        |
| Rest between rounds of a multi-round core circuit | ≥ 45 s                        |
| Difficulty step, where a block's sets can move    | 3–14 min                      |
| Tests and benchmarks                              | identical at every difficulty |

What changed in the content: the trailing core circuit was removed from the eight sessions that
already had both a strength block and a conditioning piece; five-set strength blocks were cut to
four; the one strength block carrying five separate movements dropped from four sets to three; and
every multi-round core circuit went from 30 s to 45 s between rounds.

The result, per course (session at "as usual", minutes):

| Course       | Before (min / avg / max) | After                           |
| ------------ | ------------------------ | ------------------------------- |
| `start`      | 18.3 / 23.0 / 26.2       | unchanged — it was already sane |
| `start` (v2) | —                        | 13.7 / 18.2 / 23.2 (see below)  |
| `engine`     | 20.0 / 29.0 / 36.9       | 20.0 / 28.8 / 36.9              |
| `dumbbells`  | 17.6 / 28.1 / 40.0       | 17.6 / 28.1 / 38.7              |
| `kettlebell` | 17.6 / 29.0 / 38.5       | 17.6 / 29.0 / 38.0              |
| `athlete`    | 20.5 / 33.5 / 48.3       | 20.5 / 30.8 / 38.2              |

Core work was not deleted from the product — it survives in the warm-ups, in the sessions built
around it (`w_hinge_core_*`), and in every session that does not already ask for two main pieces.

**The beginner course was later rebuilt around the coach's own programme** (`start` v2): the 24
workouts he posted for his beginner group (`docs/COACH_SOURCE.md`), transcribed one to one, over 8
weeks. Every session is one warm-up, one piece of main work (two only where he wrote two) and a
cool-down; the main work runs 4–12 minutes and a session 14–23 minutes at "as usual". The warm-up
is top-to-bottom joint mobility (about 5 minutes) without running, and the cool-down a stretch of
the same length, since the coach counts both outside the session. There is no
max-effort test on day one — his rule is that the first session must not destroy anyone — only a
retest at the end against the onboarding self-tests. The numbers
are authored at his "confident beginner" figure, so a real beginner at scale 0.6–0.8 lands on his
"start from the minimum" advice. `npm run content:review` renders the course day by day with these
estimates for the coach to check.

## 4. Duration (`estimate.ts`)

Per block, plus 20 s block intro (`BLOCK_INTRO_SEC`) and 8 s transition between items
(`TRANSITION_SEC`) — both **expert anchors** measured on the app's own player flow.

The estimate counts **only the rests the player actually plays** (§6), so the two never disagree:
there is no rest after the last set, the last Tabata round or the last interval.

| Format         | Duration                                                                                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sets / circuit | sets × (Σ item work + 8 s × items) + sets × Σ restAfter (all items but the last) + (sets − 1) × (rest between sets/rounds, or the last item's restAfter when there is none) |
| amrap          | `durationSec` (70% work / 30% rest)                                                                                                                                         |
| emom           | minutes × 60 (70% / 30%)                                                                                                                                                    |
| tabata         | rounds × work × items + items × (rounds − 1) × rest + (items − 1) × max(rest between rounds, rest) — each item gets its own Tabata                                          |
| interval       | rounds × work × items + (rounds × items − 1) × rest — items alternate every round                                                                                           |
| fortime        | min(cap, rounds × Σ item work × 1.15 + (rounds − 1) × rest between rounds)                                                                                                  |

A tabata or interval block that omits `workSec` / `restSec` (the content schema requires them, so
this only happens for hand-built blocks) falls back to `FORMAT_DEFAULT_WORK_REST` — 20/10 for
tabata, 30/30 for interval — in both the estimate and the player.

The 1.15 For-time pacing factor and the 70/30 AMRAP split are **expert anchors**: athletes slow down
under the clock, and observed AMRAP work density sits around two thirds to three quarters.
`estimateDuration` reports the work/rest split and a per-block breakdown; `PrescribedWorkout.estimatedSec`
is the sum of the block estimates.

## 5. Calories (`estimateCalories`)

`kcal = MET × kg × hours` — the Compendium of Physical Activities convention (1 MET ≈ 1 kcal/kg/h;
Ainsworth et al. 2011). Work seconds use each exercise's `met`; rest, transitions and intros use
`REST_MET = 1.5` (standing / light activity in the Compendium). Body weight defaults to 70 kg when
unknown. The result is an estimate for motivation and trend, not a measurement.

## 6. Player steps (`player.ts`)

`buildPlayerSteps` is deterministic and index-addressable (the app persists `stepIndex`):

- `block_intro` per block, then
- **sets / circuit:** per set → per item: `explain` (only the first time the exercise appears in
  the whole workout), `work` (`timer` for seconds, `reps` otherwise), `rest` after the item
  (`restAfterSec`) or between sets/rounds; no rest after the last set;
- **emom:** one 60 s `timer` step per minute, items round-robin, `target` = reps of that item;
- **tabata:** per item, rounds × (work + rest) without the trailing rest; a rest between items;
- **interval:** items alternate every round, trailing rest skipped;
- **amrap:** one `amrap` step with `expectedRounds = floor(duration / (Σ item seconds + 8 s × items))`, min 1
  (min 1 as well when the item estimates are missing, so a lost number can never inflate the target);
- **fortime:** one `fortime` step (rounds = authored sets or 1, cap = `durationSec`);
- test blocks are authored as timed items (e.g. 60 s max push-ups), so they become `timer` steps
  that carry `isTest: true`. The UI runs the window and then records the **measurement** (reps done
  or seconds held) as the benchmark value; completion ignores that number and counts the step as
  done or skipped (§7.1), because a max effort has no target to fall short of. Then `done`.

## 7. After the session (`session.ts`)

### 7.1 Completion

Each work-type step is weighted by its estimated seconds.

- `work`: `min(1, achieved / target)`. **`achieved` is measured the way the step is run**: seconds
  for a timer step (a seconds item, an EMOM minute, a Tabata or interval round — the clock is what
  the player can observe), reps for a reps step. A step marked completed without a number counts
  as 1.
- `work` in a **test** block (`isTest`): the athlete works the whole window for a max score, so the
  recorded number is the result, not a share of a target — the step counts 1 when completed and 0
  when skipped, whatever the client sends. Without this rule a client that records the score
  ("30 push-ups in a 120 s window") would report 25% completion and quietly cut both the points and
  the course scale.
- `amrap`: `min(1, (rounds + extraReps / Σ reps per round) / expectedRounds)`.
- `fortime`: finished → 1, timed out → `min(1, time / cap) × 0.5`.
- Skipped or missing → 0; a step whose stored numbers are unusable is dropped from the weighting
  instead of poisoning the ratio. Completion is rounded to two decimals.

### 7.2 Points, duration, calories

Points are paid in full at completion ≥ 0.95 (a couple of missed reps should not cost points),
otherwise proportionally. Duration is the real `startedAt → completedAt` interval when known,
otherwise the estimate × completion. Calories = `estimateCalories` × completion.

### 7.3 Adaptation (`adaptScale`)

Borg CR10 RPE (Borg 1982; 1998) and completion drive the scale, in order of precedence:

| Condition                         | Delta | Note                        |
| --------------------------------- | ----: | --------------------------- |
| feeling = pain                    | −0.10 | safety note shown           |
| RPE ≥ 9 **or** completion < 0.80  | −0.05 |                             |
| completion ≥ 0.95 **and** RPE ≤ 6 | +0.05 | ≈ 4 reps in reserve or more |
| RPE 7–8 **and** completion ≥ 0.90 | +0.02 | 2–3 reps in reserve         |
| otherwise                         |     0 | hold                        |

The scale is clamped to 0.5–1.5 and rounded to two decimals; when the clamp swallows the delta the
reason says so. The step sizes follow the "2–10% when the target is exceeded" rule of the ACSM
Position Stand (2009), at the small end because the athlete trains at home without a coach's eye,
and the RIR mapping follows Zourdos et al. (2016): RPE 10 = 0 RIR, 9 = 1, 8 = 2, 7 = 3.

### 7.4 Pre-workout recommendation (`recommendDifficulty`)

1. Pregnancy → `easier`.
2. No history → `normal` ("first session").
3. `easier` when the last session had pain, RPE ≥ 9, completion < 0.8, or was < 24 h ago. (A fifth
   clause — yesterday's steps ≥ 15 000, a heavy leg day — went with the step feature: there is no
   step count to read.)
4. `harder` when the last two sessions had RPE ≤ 6, completion ≥ 0.95 and **no pain**, and ≥ 48 h
   passed — the 48–72 h between sessions for the same muscle groups recommended for novices in the
   ACSM Position Stand (2009). Pain anywhere in that window blocks the upgrade: principle 4 above
   says pain reduces load, so it must never help earn one.
5. Otherwise `normal`.

History is sorted by instant (`Date.parse`), not by string, so sessions stored with different UTC
offsets still order correctly; an unparsable timestamp falls back to a string comparison and never
counts as "≥ 48 h of rest".

Each recommendation carries a one-sentence bilingual reason.

## 8. Counting the training (`consistency.ts`)

A day is active when a workout was completed on it. `countTraining(days, todayIso)` returns

| field         | meaning                                      |
| ------------- | -------------------------------------------- |
| `total`       | days trained, ever                           |
| `thisWeek`    | days trained since Monday                    |
| `bestWeek`    | the most days trained in any one ISO week    |
| `activeWeeks` | how many ISO weeks hold at least one workout |
| `todayDone`   | whether today is one of them                 |

Input may be unsorted, sparse and contain duplicates; a date appearing twice is one day, and dates
in the future are ignored so a fast clock cannot invent a workout. The unit is therefore **days
trained**, not sessions saved — two workouts in one evening is one day here and two on the reports
tab, because this figure answers "how often do you show up".

**What this section used to hold: streaks.** `computeStreak()` returned `current`, `longest` and an
`atRisk` flag, and a day was also active at ≥ 7 000 steps. Both are gone — §1.5 has the argument,
and the short version is that a streak breaks on a rest day and this product prescribes rest days.

Keep the step citations in §1.5: they are the argument for the walks the courses prescribe, and
they are what to re-read if Forma ever ships a native app that _can_ read HealthKit or Health
Connect.

## 9. Points, levels, achievements (`levels.ts`)

`points = round(basePoints × CHOICE_POINTS × (repeat ? 0.5 : 1))`. Repeats pay half so the
leaderboard rewards progressing through a course over farming one node.

There was a fourth factor, `× (1 + streakBonus)` — +10% at ≥ 7 consecutive days, +20% at ≥ 30. It
went with the streak (§8): a course that schedules two rest days a week cannot be followed and earn
it at the same time, so the bonus priced obedience to the programme as a loss.

Level thresholds (cumulative points): 0, 300, 800, 1 500, 2 500, 4 000, 6 000, 8 500, 12 000,
16 000 — roughly 2–3 workouts for level 2, a full 6-week course for level 4, a year of consistent
training for level 10. Titles (RU/EN): Новичок/Rookie, Стажёр/Trainee, Атлет/Athlete,
Боец/Competitor, Ветеран/Veteran, Мастер/Master, Элита/Elite, Чемпион/Champion, Титан/Titan,
Легенда/Legend.

Twelve achievements: first workout; 5 / 10 / 25 / 100 workouts; three workouts in one week; eight
active weeks; first benchmark; course completed; 1 000 / 10 000 points; 600 minutes trained. (A
thirteenth, «10 days at the steps goal», went with the step feature.) Each reports `unlocked` and a
0–1 `progress`.

Three of them used to ask for 3, 7 and 30 **consecutive** days. The seven-day one was unreachable
by anyone following a five-day-a-week course and the thirty-day one by anyone at all, so the tiers
were not modest, they were impossible. What replaced them keeps the thing habit-formation research
actually supports — repetition over weeks rather than an unbroken chain (Lally et al. 2010, where
automaticity plateaus after ~66 days on average and missing a single day had no measurable effect
on the curve) — and makes the gap between sessions free.

## 10. Constants reference (`constants.ts`)

| Constant                                                                  | Value                   | Kind                       |
| ------------------------------------------------------------------------- | ----------------------- | -------------------------- |
| `CHOICE_VOLUME` / `CHOICE_SETS_DELTA` / `CHOICE_WINDOW` / `CHOICE_POINTS` | see §3.1                | expert anchor              |
| `REPEAT_POINTS`                                                           | 0.5                     | design                     |
| `DELOAD_VOLUME` / `DELOAD_REST`                                           | 0.65 / 1.2              | Bell et al. 2022           |
| `SCALE_MIN..MAX`, `SCALE_INITIAL_MIN..MAX`, `EFFECTIVE_SCALE_MIN..MAX`    | 0.5–1.5, 0.6–1.3, 0.3–2 | design                     |
| `SETS_ADD_AT` / `SETS_REMOVE_AT` / `MIN_SETS_AFTER_REMOVE`                | 1.3 / 0.7 / 2           | expert anchor              |
| `MIN_SECONDS_TARGET`                                                      | 10 s                    | expert anchor              |
| `TRANSITION_SEC` / `BLOCK_INTRO_SEC`                                      | 8 s / 20 s              | expert anchor              |
| `REST_MET` / `DEFAULT_MET` / `DEFAULT_WEIGHT_KG`                          | 1.5 / 5 / 70            | Compendium                 |
| `METERS_PER_SEC` / `SEC_PER_CALORIE` / `DEFAULT_SECONDS_PER_REP`          | 1.5 m/s / 4 s / 3 s     | expert anchor              |
| `AMRAP_WORK_SHARE` / `FORTIME_PACE_FACTOR`                                | 0.7 / 1.15              | expert anchor              |
| `TABATA_DEFAULT_ROUNDS` / `FORMAT_DEFAULT_WORK_REST`                      | 8; 20/10 s, 30/30 s     | expert anchor              |
| `LEVEL_THRESHOLDS`, `LEVEL_TIER`                                          | §9; 35 / 66             | design                     |
| `ADAPTATION`                                                              | §7.3                    | ACSM 2009; Zourdos 2016    |
| `RECOMMENDATION`                                                          | 48 h / 24 h             | ACSM 2009; expert anchor   |
| `FITNESS_WEIGHTS`, `NO_TEST_INDEX_CAP`, `KNEE_PUSHUP_FACTOR`              | §2; 60; 0.6             | design; expert anchor      |
| `PUSHUP_NORMS`, `AGE_BAND_NORM_BANDS`                                     | §2.1                    | CSEP / ACSM                |
| `SQUAT_ANCHORS`, `SQUAT_AGE_SHIFT_PER_BAND`, `PLANK_ANCHORS`              | §2.2–2.3                | expert anchor              |
| `ACTIVITY_SCORE`, `EXPERIENCE_SCORE`                                      | §2                      | design                     |
| `HYPERTENSION_MAX_HOLD_SEC`, `*_RISKY_IDS`, `*_ID_PATTERN`                | §3.6                    | ACSM / ACOG; expert anchor |

## Sources

- American College of Sports Medicine. _ACSM's Guidelines for Exercise Testing and Prescription_
  (push-up test norms by age and sex, reproduced from CSEP; FITT-VP prescription principles;
  exercise considerations for hypertension).
- Canadian Society for Exercise Physiology. _Canadian Physical Activity, Fitness & Lifestyle
  Approach_ (CPAFLA), 3rd ed., 2003 — push-up (men full / women modified) fitness categories.
- American College of Sports Medicine. Position Stand: Progression models in resistance training
  for healthy adults. _Medicine & Science in Sports & Exercise_ 41(3), 2009 — 2–10% load
  progression; 48–72 h between sessions for novices.
- Kraemer WJ, Ratamess NA. Fundamentals of resistance training: progression and exercise
  prescription. _Medicine & Science in Sports & Exercise_ 36(4), 2004.
- Zourdos MC et al. Novel resistance training-specific rating of perceived exertion scale measuring
  repetitions in reserve. _Journal of Strength and Conditioning Research_ 30(1), 2016.
- Helms ER et al. Application of the repetitions in reserve-based rating of perceived exertion scale
  for resistance training. _Strength and Conditioning Journal_ 38(4), 2016.
- Borg G. Psychophysical bases of perceived exertion. _Medicine & Science in Sports & Exercise_
  14(5), 1982; Borg G. _Borg's Perceived Exertion and Pain Scales_, Human Kinetics, 1998 (CR10).
- Bell L et al. "Deloading" practices in strength and physique sports: a cross-sectional survey.
  _Sports Medicine – Open_, 2022.
- Haff GG, Triplett NT (eds). _Essentials of Strength Training and Conditioning_, 4th ed., National
  Strength and Conditioning Association / Human Kinetics, 2016 — periodization and recovery.
- Ainsworth BE et al. 2011 Compendium of Physical Activities: a second update of codes and MET
  values. _Medicine & Science in Sports & Exercise_ 43(8), 2011.
- World Health Organization. _WHO guidelines on physical activity and sedentary behaviour_, 2020.
- Paluch AE et al. Steps per day and all-cause mortality in middle-aged adults in the Coronary Artery
  Risk Development in Young Adults study. _JAMA Network Open_ 4(9), 2021.
- Paluch AE et al. Daily steps and all-cause mortality: a meta-analysis of 15 international cohorts.
  _The Lancet Public Health_ 7(3), 2022.
- Ebben WP et al. Kinetic analysis of several variations of push-ups. _Journal of Strength and
  Conditioning Research_ 25(10), 2011.
- Strand SL et al. Norms for an isometric muscle endurance test. _Journal of Human Kinetics_ 40, 2014.
- American College of Obstetricians and Gynecologists. Physical activity and exercise during
  pregnancy and the postpartum period. Committee Opinion No. 804, 2020.
- Mottola MF et al. 2019 Canadian guideline for physical activity throughout pregnancy. _British
  Journal of Sports Medicine_ 52(21), 2018.
- Lally P et al. How are habits formed: modelling habit formation in the real world. _European
  Journal of Social Psychology_ 40(6), 2010.

---

## 12. Comfort, and the levers (`comfort.ts`, `levers.ts`)

This section describes the per-movement model. It runs alongside the course `scale` of §2 and §7.3
rather than replacing it: an exercise with no comfort recorded falls through to the old path, which
is what makes it safe to ship in pieces.

### 12.1 Why comfort and not a maximum

The obvious model stores repetitions to failure and prescribes a fraction of it. It was the first
draft, and it was rejected for a practical reason: to fill it in you must ask people to max out, and
a programme built from maxima comes out too hard. The stored quantity is instead the one a person
can answer without a stopwatch and a grudge — **what they comfortably do** — and the three modes are
arithmetic on top of it:

| Mode      | Target         | ≈ reps in reserve |
| --------- | -------------- | ----------------- |
| полегче   | comfort        | 4–5               |
| нормально | comfort + 20 % | 2–3               |
| посложнее | comfort + 40 % | 1–2               |

The 20 % step lands in the range the RIR literature identifies as productive without training to
failure (Zourdos et al. 2016; Helms et al. 2016). `COMFORT_MODE` expresses these relative to
«нормально», because «нормально» is what the coach authors: **0.83 / 1.00 / 1.17**.

Nothing in this model ever asks for a maximal effort. An earlier draft inserted a "last set, as many
as you can" probe every fourth session to break the censoring of §12.4; it was removed because it
contradicted the rule it existed to serve.

### 12.2 One number per movement, not per course

`comfortFor(exerciseId, map, level, lookup)` reads down a hierarchy:

```
the exercise's own observations  →  its movement pattern  →  the reference athlete
```

A pattern-level fallback is shrunk toward average by `COMFORT_SHRINK.samePattern` (0.7) and a
cross-pattern one by `crossPattern` (0.4) — **expert anchors**. A plank is an anti-extension hold and
a sit-up is trunk flexion; three minutes of one earns some confidence about the other and nowhere
near all of it. Borrowed ratios are clamped to 0.5–1.8 and observed ones to 0.4–2.5, and each
contributing movement is weighted by its own observation count, so one hesitant early reading never
outvotes a movement done eight times.

`Exercise.comfortRef` holds what a standard person at each course level comfortably does. It is
authored **once per exercise**, never inferred from a workout's number: sit-ups are authored at 8 in
workout 3 of «Старт» and 10 in workout 6 because the coach intends different things in a for-time
triplet and in an eight-minute AMRAP, and reading a reference off each made the standard beginner's
comfort flap between 11 and 18.

### 12.3 The invariant

```
ratio  = comfort(user, exercise) / comfortRef(exercise, courseLevel)
target = clamp( round(authored × ratio × COMFORT_MODE[choice]), item.min, item.max )
```

**At ratio 1 the coach's number comes back untouched.** His programme is honoured exactly for the
person he wrote it for and bends only for people who differ from that person. There is a test for it
and it should never be allowed to fail.

`WorkoutItem.min` / `.max` are the coach's own range — the «Тренер: 10–20» he already writes in the
note, as data — and they are **hard**. Unbounded, the model walks away from the programme: the worked
example that proved it asked a strong athlete for 50 dead bugs against an authored 30 and a written
ceiling of 40. The content schema additionally refuses an authored number outside its own range,
because one of the two is then a typo.

### 12.4 Learning without asking anything

The rep stepper opens **on the target**, so the path of least resistance is to tap «Готово» and a
target of 12 comes back as 12. That is a **right-censored observation**: it says comfort ≥ 12 and
nothing more, and a model that reads it as comfort = 12 ratchets everyone down to its first guess.

| What came back     | Meaning                   | What moves                               |
| ------------------ | ------------------------- | ---------------------------------------- |
| fewer than asked   | comfort is **below** this | pulled to what happened                  |
| more than asked    | comfort is **above** this | exponential update                       |
| a real measurement | uncensored                | exponential update                       |
| exactly as asked   | a lower bound only        | **nothing**, except the two-for-two rule |

```
observed = achieved / COMFORT_MODE[choice]
α        = clamp(1 / (observations + 2), 0.05, 0.35)
comfort ← comfort + α × (observed − comfort)
```

**The step clamp is deliberately asymmetric**: `COMFORT_SESSION_MAX_UP` 10 %,
`COMFORT_SESSION_MAX_DOWN` 25 %. Up follows the 2–10 % band of the ACSM Position Stand (2009). Down
is larger because the two errors do not cost the same — prescribing too little slows progress,
prescribing too much makes people fail, and people who fail a workout do not come back to it. A
symmetric clamp was the first version: an athlete asked for 12 who managed 7 would have been asked
for 11 next time, then 10, then 9, failing four sessions on the way to a number the engine already
had the evidence for.

Hitting the target exactly feeds `twoForTwo` instead: two consecutive sessions at target with
session RPE ≤ 6 raise comfort by `TWO_FOR_TWO_GAIN` (4 %). This is the standard coaching answer to
exactly this censoring problem (Haff & Triplett, _Essentials_ — the two-for-two rule): when you
cannot see past the target, use repetition of the target as the evidence.

Session RPE and feeling stay the global term they already were in §7.3. They may lower every comfort
a session touched and may never raise one — a painful session must not earn an increase.

### 12.5 The lever is a property of the piece, not of the engine

Reps are not always the right thing to move, and the twenty sessions of «Старт» make it plain:

| Workout | Shape                          | Honest lever                              |
| ------- | ------------------------------ | ----------------------------------------- |
| 1, 2    | EMOM, a movement each minute   | reps — in an EMOM the reps _are_ the rest |
| 3       | three pairs, start every 2 min | the rest between pairs                    |
| 4       | max glute bridges in 5 min     | the window                                |
| 5       | three rounds, 10-minute cap    | the number of rounds                      |
| 6       | AMRAP 8                        | the window                                |
| 17      | buy-in every 3 minutes         | the interval                              |
| 19      | the inchworm ladder            | **nothing** — it is the benchmark         |

So `Block.adapt` declares, in order, which levers move and by how much, authored by the person who
wrote the piece. `DEFAULT_ADAPT` gives every format the honest answer for its shape, so courses
already written need no hand-tuning.

`rest` is the one lever that **grows** to make a session easier. It still does not move by default —
the finding of §3.1 stands, and rest that rises as volume falls cancels its own effect — but a block
may declare it, which is exactly the case where it is the honest lever.

`swap` changes the movement rather than the number, through `Exercise.scaling.easier` / `.harder`.
It exists because of a case the worked example produced: for someone comfortable with 12 full
push-ups, all three modes of workout 3 pin knee push-ups at the coach's ceiling of 15 and become
indistinguishable. The right coaching answer there is not a bigger number but a harder movement.

`temper(ratio, factor)` damps the mode's move for an athlete already far from average
(`LEVER_RCENTRE`, **expert anchor**). The ratio has already done most of the adjusting; letting the
mode compound on top produces a «посложнее» the strong cannot finish and a «полегче» with nothing in
it for the weak.
