/**
 * The studio clipboard as app state, mirrored to `localStorage` (see `clipboard.ts` for why it is
 * the app's own). A storage that throws — a private window, a WebView with storage off — keeps the
 * copy for this launch only.
 */
import { create } from 'zustand';
import {
  CLIPBOARD_KEY,
  parseClipboard,
  serializeClipboard,
  type StudioClipboard,
} from './clipboard';

interface ClipboardState {
  clipboard: StudioClipboard | null;
  copy: (cb: StudioClipboard) => void;
  clear: () => void;
}

function read(): StudioClipboard | null {
  try {
    return typeof localStorage !== 'undefined'
      ? parseClipboard(localStorage.getItem(CLIPBOARD_KEY))
      : null;
  } catch {
    return null;
  }
}

function write(cb: StudioClipboard | null): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (cb) localStorage.setItem(CLIPBOARD_KEY, serializeClipboard(cb));
    else localStorage.removeItem(CLIPBOARD_KEY);
  } catch {
    /* Kept in memory for this launch. */
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
