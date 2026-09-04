/**
 * Pose-set registry. To add an animation: create `poses/<id>.ts` exporting `const <id>: PoseSet`,
 * add one import line below and one entry in `POSES` — keep both lists sorted alphabetically,
 * one per line, so parallel additions merge cleanly.
 */
import type { PoseSet } from './types';
import { air_squat } from './air_squat';
import { arm_circles } from './arm_circles';
import { band_pull_apart } from './band_pull_apart';
import { band_row } from './band_row';
import { bear_crawl } from './bear_crawl';
import { bell_clean } from './bell_clean';
import { bell_deadlift } from './bell_deadlift';
import { bell_lunge } from './bell_lunge';
import { bell_snatch } from './bell_snatch';
import { bird_dog } from './bird_dog';
import { broad_jump } from './broad_jump';
import { burpee } from './burpee';
import { cat_cow } from './cat_cow';
import { chair_dip } from './chair_dip';
import { child_pose } from './child_pose';
import { db_floor_press } from './db_floor_press';
import { db_front_squat } from './db_front_squat';
import { db_push_press } from './db_push_press';
import { db_rdl } from './db_rdl';
import { db_row } from './db_row';
import { db_thruster } from './db_thruster';
import { dead_bug } from './dead_bug';
import { dead_hang } from './dead_hang';
import { devil_press } from './devil_press';
import { diamond_push_up } from './diamond_push_up';
import { double_under } from './double_under';
import { farmer_carry } from './farmer_carry';
import { flutter_kick } from './flutter_kick';
import { glute_bridge } from './glute_bridge';
import { goblet_squat } from './goblet_squat';
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
import { jumping_jack } from './jumping_jack';
import { jumping_lunge } from './jumping_lunge';
import { kb_halo } from './kb_halo';
import { kb_swing } from './kb_swing';
import { knee_push_up } from './knee_push_up';
import { lateral_lunge } from './lateral_lunge';
import { leg_raise } from './leg_raise';
import { leg_swing } from './leg_swing';
import { mountain_climber } from './mountain_climber';
import { negative_pull_up } from './negative_pull_up';
import { overhead_press } from './overhead_press';
import { pike_push_up } from './pike_push_up';
import { plank } from './plank';
import { plank_shoulder_tap } from './plank_shoulder_tap';
import { pull_up } from './pull_up';
import { push_up } from './push_up';
import { renegade_row } from './renegade_row';
import { reverse_lunge } from './reverse_lunge';
import { russian_twist } from './russian_twist';
import { side_plank } from './side_plank';
import { single_leg_glute_bridge } from './single_leg_glute_bridge';
import { single_leg_rdl } from './single_leg_rdl';
import { single_under } from './single_under';
import { sit_up } from './sit_up';
import { skater } from './skater';
import { squat_hold } from './squat_hold';
import { squat_to_stand } from './squat_to_stand';
import { step_up } from './step_up';
import { suitcase_carry } from './suitcase_carry';
import { sumo_high_pull } from './sumo_high_pull';
import { superman } from './superman';
import { tuck_jump } from './tuck_jump';
import { turkish_get_up } from './turkish_get_up';
import { up_down_plank } from './up_down_plank';
import { v_up } from './v_up';
import { wall_sit } from './wall_sit';
import { worlds_greatest_stretch } from './worlds_greatest_stretch';

export const POSES: Record<string, PoseSet> = {
  air_squat,
  arm_circles,
  band_pull_apart,
  band_row,
  bear_crawl,
  bell_clean,
  bell_deadlift,
  bell_lunge,
  bell_snatch,
  bird_dog,
  broad_jump,
  burpee,
  cat_cow,
  chair_dip,
  child_pose,
  db_floor_press,
  db_front_squat,
  db_push_press,
  db_rdl,
  db_row,
  db_thruster,
  dead_bug,
  dead_hang,
  devil_press,
  diamond_push_up,
  double_under,
  farmer_carry,
  flutter_kick,
  glute_bridge,
  goblet_squat,
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
  jumping_jack,
  jumping_lunge,
  kb_halo,
  kb_swing,
  knee_push_up,
  lateral_lunge,
  leg_raise,
  leg_swing,
  mountain_climber,
  negative_pull_up,
  overhead_press,
  pike_push_up,
  plank,
  plank_shoulder_tap,
  pull_up,
  push_up,
  renegade_row,
  reverse_lunge,
  russian_twist,
  side_plank,
  single_leg_glute_bridge,
  single_leg_rdl,
  single_under,
  sit_up,
  skater,
  squat_hold,
  squat_to_stand,
  step_up,
  suitcase_carry,
  sumo_high_pull,
  superman,
  tuck_jump,
  turkish_get_up,
  up_down_plank,
  v_up,
  wall_sit,
  worlds_greatest_stretch,
};

/** Registered animation ids, sorted. */
export const ANIMATION_IDS: readonly string[] = Object.keys(POSES).sort();

export type { Ease, Keyframe, Pose, PoseKey, PoseSet, Prop, View } from './types';
