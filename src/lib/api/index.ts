/**
 * Typed data access over one Supabase client. Every function throws AppError.
 * See docs/SPEC.md §8 and supabase/migrations for the server side.
 */
export { isConfigured, supabase } from './client';
export * from './mode';
export * from './types';
export * from './errors';
export * from './profiles';
export * from './entitlements';
export * from './courseState';
export * from './sessions';
export * from './dailyLogs';
export * from './benchmarks';
export * from './leaderboard';
export * from './stats';
export * from './orders';
export * from './admin';
export * from './storage';
// auth.ts is written by the app shell (requestCode / verifyCode / signOut / onAuthChange).
export * from './auth';

// Explicit re-exports win over star-export ambiguity:
// - auth.ts declares its own (identical) AppErrorCode; the canonical one lives in errors.ts.
// - auth.getSession() (auth session) and sessions.getSession(id) (workout) share a name;
//   the barrel keeps the auth one and exposes the workout one as getWorkoutSession.
//   Import from './sessions' directly when you want the original name.
export type { AppErrorCode } from './errors';
export { getSession } from './auth';
export { getSession as getWorkoutSession } from './sessions';
