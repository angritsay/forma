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
import { cat_cow } from './cat_cow';
import { child_pose } from './child_pose';
import { dead_bug } from './dead_bug';
import { flutter_kick } from './flutter_kick';
import { high_knees } from './high_knees';
import { hollow_hold } from './hollow_hold';
import { jog_in_place } from './jog_in_place';
import { leg_raise } from './leg_raise';
import { leg_swing } from './leg_swing';
import { mountain_climber } from './mountain_climber';
import { plank } from './plank';
import { russian_twist } from './russian_twist';
import { side_plank } from './side_plank';
import { sit_up } from './sit_up';
import { superman } from './superman';
import { v_up } from './v_up';

export const POSES: Record<string, PoseSet> = {
  air_squat,
  band_row,
  bear_crawl,
  bird_dog,
  cat_cow,
  child_pose,
  dead_bug,
  flutter_kick,
  high_knees,
  hollow_hold,
  jog_in_place,
  leg_raise,
  leg_swing,
  mountain_climber,
  plank,
  russian_twist,
  side_plank,
  sit_up,
  superman,
  v_up,
};

/** Registered animation ids, sorted. */
export const ANIMATION_IDS: readonly string[] = Object.keys(POSES).sort();

export type { Ease, Keyframe, Pose, PoseKey, PoseSet, Prop, View } from './types';
