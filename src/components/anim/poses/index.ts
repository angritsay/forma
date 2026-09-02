/**
 * Pose-set registry. To add an animation: create `poses/<id>.ts` exporting `const <id>: PoseSet`,
 * add one import line below and one entry in `POSES` — keep both lists sorted alphabetically,
 * one per line, so parallel additions merge cleanly.
 */
import type { PoseSet } from './types';
import { air_squat } from './air_squat';
import { band_row } from './band_row';
import { bear_crawl } from './bear_crawl';
import { bird_dog } from './bird_dog';
import { broad_jump } from './broad_jump';
import { burpee } from './burpee';
import { cat_cow } from './cat_cow';
import { chair_dip } from './chair_dip';
import { child_pose } from './child_pose';
import { dead_bug } from './dead_bug';
import { dead_hang } from './dead_hang';
import { diamond_push_up } from './diamond_push_up';
import { flutter_kick } from './flutter_kick';
import { glute_bridge } from './glute_bridge';
import { half_burpee } from './half_burpee';
import { hamstring_stretch } from './hamstring_stretch';
import { hanging_knee_raise } from './hanging_knee_raise';
import { high_knees } from './high_knees';
import { hip_flexor_stretch } from './hip_flexor_stretch';
import { hollow_hold } from './hollow_hold';
import { inchworm } from './inchworm';
import { incline_push_up } from './incline_push_up';
import { jog_in_place } from './jog_in_place';
import { jump_squat } from './jump_squat';
import { jumping_lunge } from './jumping_lunge';
import { knee_push_up } from './knee_push_up';
import { leg_raise } from './leg_raise';
import { leg_swing } from './leg_swing';
import { mountain_climber } from './mountain_climber';
import { negative_pull_up } from './negative_pull_up';
import { pike_push_up } from './pike_push_up';
import { plank } from './plank';
import { plank_shoulder_tap } from './plank_shoulder_tap';
import { pull_up } from './pull_up';
import { push_up } from './push_up';
import { reverse_lunge } from './reverse_lunge';
import { russian_twist } from './russian_twist';
import { side_plank } from './side_plank';
import { single_leg_glute_bridge } from './single_leg_glute_bridge';
import { single_leg_rdl } from './single_leg_rdl';
import { sit_up } from './sit_up';
import { squat_hold } from './squat_hold';
import { squat_to_stand } from './squat_to_stand';
import { step_up } from './step_up';
import { superman } from './superman';
import { tuck_jump } from './tuck_jump';
import { up_down_plank } from './up_down_plank';
import { v_up } from './v_up';
import { wall_sit } from './wall_sit';
import { worlds_greatest_stretch } from './worlds_greatest_stretch';

export const POSES: Record<string, PoseSet> = {
  air_squat,
  band_row,
  bear_crawl,
  bird_dog,
  broad_jump,
  burpee,
  cat_cow,
  chair_dip,
  child_pose,
  dead_bug,
  dead_hang,
  diamond_push_up,
  flutter_kick,
  glute_bridge,
  half_burpee,
  hamstring_stretch,
  hanging_knee_raise,
  high_knees,
  hip_flexor_stretch,
  hollow_hold,
  inchworm,
  incline_push_up,
  jog_in_place,
  jump_squat,
  jumping_lunge,
  knee_push_up,
  leg_raise,
  leg_swing,
  mountain_climber,
  negative_pull_up,
  pike_push_up,
  plank,
  plank_shoulder_tap,
  pull_up,
  push_up,
  reverse_lunge,
  russian_twist,
  side_plank,
  single_leg_glute_bridge,
  single_leg_rdl,
  sit_up,
  squat_hold,
  squat_to_stand,
  step_up,
  superman,
  tuck_jump,
  up_down_plank,
  v_up,
  wall_sit,
  worlds_greatest_stretch,
};

/** Registered animation ids, sorted. */
export const ANIMATION_IDS: readonly string[] = Object.keys(POSES).sort();

export type { Ease, Keyframe, Pose, PoseKey, PoseSet, Prop, View } from './types';
