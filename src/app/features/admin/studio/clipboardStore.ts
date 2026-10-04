/**
 * The studio clipboard as app state, mirrored to `localStorage` (see `clipboard.ts` for why it is
 * the app's own, and why there is one). A storage that throws — a private window, a WebView with
 * storage off — keeps the copy for this launch only.
 */
import { create } from 'zustand';
import {
  CLIPBOARD_KEY,
  LEGACY_CLIPBOARD_KEY,
  readStoredClipboard,
  serializeClipboard,
  type StudioClipboard,
} from './clipboard';

interface ClipboardState {
  clipboard: StudioClipboard | null;
  copy: (cb: StudioClipboard) => void;
  clear: () => void;
}

function write(cb: StudioClipboard | null): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (cb) localStorage.setItem(CLIPBOARD_KEY, serializeClipboard(cb));
    else localStorage.removeItem(CLIPBOARD_KEY);
    // One clipboard: whatever the old grader left is either moved here already or superseded.
    localStorage.removeItem(LEGACY_CLIPBOARD_KEY);
  } catch {
    /* Kept in memory for this launch. */
  }
}

function read(): StudioClipboard | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const cb = readStoredClipboard(localStorage);
    // Move a copy found under an old key or in an old shape to the one key, once.
    write(cb);
    return cb;
  } catch {
    return null;
  }
}

export const useStudioClipboard = create<ClipboardState>()((set) => ({
  clipboard: read(),
  copy: (cb) => {
    write(cb);
    set({ clipboard: cb });
  },
  clear: () => {
    write(null);
    set({ clipboard: null });
  },
}));
