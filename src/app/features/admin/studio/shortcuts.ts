/**
 * The cutter's keyboard on a computer: I and O mark the start and the end, space plays and pauses,
 * ← → step one frame (one second with Shift).
 *
 * A key typed into a field (the source's title, the exercise search) is the field's, never a
 * command; neither is a key with Ctrl, Cmd or Alt, which belong to the browser. Pure, so the table
 * is tested without a DOM.
 */

export type CutterAction =
  | 'mark_in'
  | 'mark_out'
  | 'toggle_play'
  | 'frame_back'
  | 'frame_forward'
  | 'second_back'
  | 'second_forward';

export interface KeyInput {
  key: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  /** The focused element's tag (`INPUT`, `TEXTAREA`, …), and whether it is content-editable. */
  targetTag?: string | null;
  targetEditable?: boolean;
}

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/** The action a key press asks for, or null when it is not the cutter's. */
export function cutterActionForKey(e: KeyInput): CutterAction | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  if (e.targetEditable) return null;
  if (e.targetTag && TYPING_TAGS.has(e.targetTag.toUpperCase())) return null;
  switch (e.key) {
    case 'i':
    case 'I':
    case 'ш': // the same key on a Russian layout
    case 'Ш':
      return 'mark_in';
    case 'o':
    case 'O':
    case 'щ':
    case 'Щ':
      return 'mark_out';
    case ' ':
    case 'Spacebar':
      return 'toggle_play';
    case 'ArrowLeft':
      return e.shiftKey ? 'second_back' : 'frame_back';
    case 'ArrowRight':
      return e.shiftKey ? 'second_forward' : 'frame_forward';
    default:
      return null;
  }
}
