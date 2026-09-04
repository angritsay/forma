/**
 * The demo backend, loaded as a lazy chunk (see `load.ts`) so a configured build never
 * downloads or evaluates any of it. Names match the functions in `src/lib/api/*`.
 */
export * from './api';
export {
  getSession,
  getUser,
  onAuthChange,
  pendingCode,
  requestCode,
  signOut,
  verifyCode,
} from './auth';
export { clearDemoStore } from './store';
