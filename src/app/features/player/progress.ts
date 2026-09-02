/**
 * Ask the home area's progress store (`src/app/store/progress.ts`, built concurrently) to reload
 * after a session is saved. The module is discovered with `import.meta.glob`, like the screen
 * registry, so this area builds even before the store lands; once it exists the call goes through.
 */
interface ProgressStoreLike {
  getState: () => { refresh?: () => unknown };
}

interface ProgressModule {
  useProgressStore?: ProgressStoreLike;
}

const PROGRESS_PATH = '../../store/progress.ts';
const modules = import.meta.glob<ProgressModule>('../../store/progress.ts');

export async function refreshProgress(): Promise<void> {
  const loader = modules[PROGRESS_PATH];
  if (!loader) return;
  try {
    const mod = await loader();
    await mod.useProgressStore?.getState().refresh?.();
  } catch (e) {
    console.warn('[player] progress refresh failed', e);
  }
}
