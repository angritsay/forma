/** Keep the screen on while a workout is playing (Screen Wake Lock API, when supported). */
import { useEffect } from 'react';

export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let disposed = false;

    const request = async () => {
      if (disposed || document.visibilityState !== 'visible') return;
      try {
        const s = await navigator.wakeLock.request('screen');
        if (disposed) await s.release();
        else sentinel = s;
      } catch {
        /* Denied (battery saver, unsupported) — the workout still works. */
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void request();
    };

    void request();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void sentinel?.release().catch(() => undefined);
      sentinel = null;
    };
  }, [active]);
}
