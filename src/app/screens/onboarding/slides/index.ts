/**
 * The slides by id, and the colour of the chrome each one wants over its ground — the player
 * (`Story.tsx`) draws the progress segments and the × in that colour.
 */
import type { ComponentType } from 'react';
import type { StoryId } from '../stories';
import { AdaptSlide } from './Adapt';
import { CareSlide } from './Care';
import { ClubSlide } from './Club';
import { CoachSlide } from './Coach';
import { PathSlide } from './Path';
import { PlayerSlide } from './Player';
import type { Chrome } from './SlideFrame';

export type { Chrome } from './SlideFrame';

export const SLIDES: Record<StoryId, ComponentType> = {
  care: CareSlide,
  adapt: AdaptSlide,
  path: PathSlide,
  player: PlayerSlide,
  club: ClubSlide,
  coach: CoachSlide,
};

export const SLIDE_CHROME: Record<StoryId, Chrome> = {
  care: 'light',
  adapt: 'light',
  path: 'light',
  player: 'light',
  club: 'ink',
  coach: 'light',
};
