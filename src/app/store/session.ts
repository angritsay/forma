/**
 * Session store: auth state + profile + entitlements (docs/SPEC.md §8, ui-shell brief §3).
 *
 * `boot()` reads the persisted Supabase session, loads the profile and entitlements and wires
 * the auth listener + locale sync exactly once. RouteGuards read `status`/`profile` from here.
 */
import { create } from 'zustand';
import {
  getSession,
  onAuthChange,
  signOut as apiSignOut,
  toAuthError,
  type AuthError,
} from '@/lib/api/auth';
import { getProfile, updateProfile, type Profile, type ProfilePatch } from '@/lib/api/profiles';
import { listEntitlements } from '@/lib/api/entitlements';
import { newestActivation } from '@/app/features/marathon/gameAccess';
import { getMySubscription } from '@/lib/api/subscriptions';
import type { Subscription } from '@/lib/api/types';
import { clearDraft } from '@/app/screens/onboarding/draft';
import { useFlags } from './flags';
import { useLocale } from './locale';

export type { Profile, ProfilePatch };

export type SessionStatus = 'booting' | 'signed_out' | 'signed_in';

export interface SessionUser {
  id: string;
  email: string;
}

export interface SessionState {
  status: SessionStatus;
  user: SessionUser | null;
  profile: Profile | null;
  /** Ids of courses the user owns (active purchases). */
  entitlements: string[];
  /**
   * When the newest owned course was activated, ISO — the clock the club's free week runs on
   * (src/app/features/marathon/gameAccess.ts). Kept here rather than recomputed per screen
   * because `entitlements` throws the dates away and both screens that gate the club need them.
   */
  newestPurchaseAt: string | null;
  /** The user's subscription, or null when they never subscribed; access itself is in `entitlements`. */
  subscription: Subscription | null;
  /** Last error from boot / profile load; RouteGuards show a retry state when profile is null. */
  error?: AuthError;
  boot: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  refreshEntitlements: () => Promise<string[]>;
  setProfile: (profile: Profile | null) => void;
  /** Persists a patch through the API and stores the returned profile. */
  saveProfile: (patch: ProfilePatch) => Promise<Profile>;
  signOut: () => Promise<void>;
}

interface SessionLike {
  user: { id: string; email?: string | null };
}

function toUser(session: SessionLike): SessionUser {
  return { id: session.user.id, email: session.user.email ?? '' };
}

let wired = false;
let inflight: { userId: string; promise: Promise<void> } | null = null;
/**
 * Bumped whenever the session ends. A `loadUser` that started before the sign-out must not write
 * `signed_in` back into the store when its requests finally resolve.
 */
let epoch = 0;

const SIGNED_OUT = {
  status: 'signed_out' as const,
  user: null,
  profile: null,
  entitlements: [] as string[],
  newestPurchaseAt: null as string | null,
  subscription: null as Subscription | null,
};

/** Drop the signed-in state and invalidate any in-flight profile load. */
function endSession(): void {
  epoch += 1;
  inflight = null;
  // The feature flags (0049) were somebody's; they go with the session.
  useFlags.getState().clear();
}

export const useSession = create<SessionState>((set, get) => {
  /**
   * Reconcile the profile's language with the one this device is showing, on every profile load.
   *
   * Two directions, because either side can be the newer one:
   *
   * * nobody picked on this device — the profile decides, and everyone who existed before the
   *   language screen shipped carries `'ru'`, so they are settled without ever being asked;
   * * somebody picked here and the profile disagrees — the pick is the newer fact (it happened on
   *   the screen just before sign-in), so it goes up. Without this, choosing English and *then*
   *   signing in to an older account would leave the app English and the bot Russian: the
   *   subscription below only fires on a change, and there is none.
   */
  function syncLocale(profile: Profile): void {
    const { locale, chosen, adopt } = useLocale.getState();
    if (!chosen) {
      adopt(profile.locale);
      return;
    }
    if (profile.locale === locale) return;
    updateProfile({ locale })
      .then((p) => set({ profile: p }))
      .catch(() => {
        /* The next profile save carries it; the app already speaks the right language. */
      });
  }

  /** Load profile + entitlements for a user; concurrent calls for the same user share one request. */
  function loadUser(user: SessionUser): Promise<void> {
    if (inflight && inflight.userId === user.id) return inflight.promise;
    const startedAt = epoch;
    const promise = (async () => {
      set({ user, error: undefined });
      // Feature flags (0049) load beside the profile and never hold it up: `load` cannot reject,
      // and every flag reads off until it lands.
      void useFlags.getState().load();
      const [profileRes, entRes, subRes] = await Promise.allSettled([
        getProfile(),
        listEntitlements(),
        getMySubscription(),
      ]);
      // The user signed out (or a new session started) while the requests were in flight.
      if (startedAt !== epoch) return;
      const profile = profileRes.status === 'fulfilled' ? profileRes.value : null;
      const entitlements =
        entRes.status === 'fulfilled' ? entRes.value.map((e) => e.courseId) : get().entitlements;
      const newestPurchaseAt =
        entRes.status === 'fulfilled' ? newestActivation(entRes.value) : get().newestPurchaseAt;
      const subscription = subRes.status === 'fulfilled' ? subRes.value : get().subscription;
      const error = profileRes.status === 'rejected' ? toAuthError(profileRes.reason) : undefined;
      set({
        status: 'signed_in',
        user,
        profile,
        entitlements,
        newestPurchaseAt,
        subscription,
        error,
      });
      if (profile) syncLocale(profile);
    })().finally(() => {
      if (inflight?.promise === promise) inflight = null;
    });
    inflight = { userId: user.id, promise };
    return promise;
  }

  function wire() {
    if (wired) return;
    wired = true;
    onAuthChange((event, session) => {
      // Supabase asks not to call the SDK synchronously inside this callback (auth lock).
      setTimeout(() => {
        const s = get();
        if (event === 'INITIAL_SESSION') return; // boot() handles the initial session
        if (event === 'SIGNED_OUT' || !session) {
          endSession();
          if (s.status !== 'signed_out') set({ ...SIGNED_OUT, error: undefined });
          return;
        }
        const user = toUser(session);
        if (s.status !== 'signed_in' || s.user?.id !== user.id) {
          void loadUser(user);
        } else if (s.user && s.user.email !== user.email) {
          set({ user });
        }
      }, 0);
    });
    useLocale.subscribe((cur, prev) => {
      if (cur.locale === prev.locale) return;
      const s = get();
      if (s.status !== 'signed_in' || !s.profile || s.profile.locale === cur.locale) return;
      updateProfile({ locale: cur.locale })
        .then((p) => get().setProfile(p))
        .catch(() => {
          /* Local choice wins; the next profile save carries the locale. */
        });
    });
  }

  return {
    ...SIGNED_OUT,
    status: 'booting',

    boot: async () => {
      wire();
      set({ status: 'booting', error: undefined });
      try {
        const session = await getSession();
        if (!session) {
          endSession();
          set({ ...SIGNED_OUT, error: undefined });
          return;
        }
        await loadUser(toUser(session));
      } catch (e) {
        endSession();
        set({ ...SIGNED_OUT, error: toAuthError(e) });
      }
    },

    refreshProfile: async () => {
      try {
        const profile = await getProfile();
        set({ profile, error: undefined });
        if (profile) syncLocale(profile);
        return profile;
      } catch (e) {
        set({ error: toAuthError(e) });
        return null;
      }
    },

    refreshEntitlements: async () => {
      // A flag switched on in the admin shows up on the next return to the app, like a purchase.
      void useFlags.getState().load();
      const [rows, subscription] = await Promise.all([listEntitlements(), getMySubscription()]);
      const entitlements = rows.map((r) => r.courseId);
      set({ entitlements, newestPurchaseAt: newestActivation(rows), subscription });
      return entitlements;
    },

    setProfile: (profile) => set({ profile }),

    saveProfile: async (patch) => {
      const profile = await updateProfile(patch);
      set({ profile, error: undefined });
      if (patch.locale) useLocale.getState().setLocale(patch.locale);
      return profile;
    },

    signOut: async () => {
      clearDraft();
      // Invalidate before the request: a profile load already in flight must not sign the user
      // back in when it resolves.
      endSession();
      try {
        await apiSignOut();
      } finally {
        endSession();
        set({ ...SIGNED_OUT, error: undefined });
      }
    },
  };
});
