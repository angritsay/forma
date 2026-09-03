/** Version and build mode shown at the bottom of the Profile screen. */
import { version } from '../../../../package.json';

export const APP_VERSION: string = version;
/** Vite mode ("production" on GitHub Pages, "development" locally). */
export const BUILD_MODE: string = import.meta.env.MODE;
