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
import { clearAssessmentDraft } from '@/app/features/assessment/draft';
import { clearSummaryDraft } from '@/app/features/player/summary/saveDraft';
import { forgetMyRef } from '@/lib/referral/mine';
import { useActiveWorkoutStore } from './activeWorkout';
import { useFlags } from './flags';
import { useLocale } from './locale';

export type { Profile, ProfilePatch };

/**
 * `offline`: boot could not reach the auth server to learn who is signed in. It is not
 * `signed_out` — sending somebody with a perfectly good session to the sign-in form because the
 * lift has no signal is how a workout in progress got lost — so the guards show «Нет соединения»
 * with a retry, and let a workout already on the device go on (RouteGuards).
 */
export type SessionStatus = 'booting' | 'offline' | 'signed_out' | 'signed_in';

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
   * Whether `entitlements` and `subscription` were ever read for this user. False after a failed
   * first read: then the empty list means «unknown», not «owns nothing», and no screen may show a
   * paywall or the club's pitch on it (`purchasesUnknown`, `PurchasesUnknown`).
   */
  entitlementsLoaded: boolean;
  /** The last failed entitlements read; cleared by the next one that succeeds. */
  entitlementsError?: AuthError;
  /**
   * The signed-in session ended without the athlete asking (a refresh token revoked or expired).
   * The sign-in screen says so instead of greeting them like a stranger; cleared on sign-in.
   */
  sessionEnded: boolean;
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
/** Set while the athlete signs out on purpose, so the auth event is not read as a dropped session. */
let signingOut = false;

/**
 * The workout on the device belongs to whoever started it. Another account signing in on the same
 * phone must not resume — or save into its own history — somebody else's session.
 */
function dropForeignWorkout(userId: string): void {
  const active = useActiveWorkoutStore.getState().session;
  if (active?.userId && active.userId !== userId) {
    useActiveWorkoutStore.getState().abandon();
    clearSummaryDraft();
  }
}

const SIGNED_OUT = {
  status: 'signed_out' as const,
  user: null,
  profile: null,
  entitlements: [] as string[],
  entitlementsLoaded: false,
  entitlementsError: undefined as AuthError | undefined,
  newestPurchaseAt: null as string | null,
  subscription: null as Subscription | null,
};

/** Drop the signed-in state and invalidate any in-flight profile load. */
function endSession(): void {
  epoch += 1;
  inflight = null;
  // The feature flags (0049) were somebody's; they go with the session.
  useFlags.getState().clear();
  // So is the referral code cached for the site (`forma.myRef` / `forma.myName`): a link made
  // personal after sign-out would pay the reward to whoever used this device last.
  forgetMyRef();
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
    const { locale, chosen, hinted, adopt, setLocale } = useLocale.getState();
    if (!chosen) {
      /*
       * A link's `?lang=` (hinted) only speaks for a brand-new account, whose profile carries the
       * column default rather than anybody's answer; an onboarded profile's language was chosen,
       * and a link opened on a new phone must not rewrite it (or the bot's language with it).
       */
      if (!hinted || profile.onboardedAt) {
        adopt(profile.locale);
        return;
      }
      setLocale(locale);
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
    // Another account on the same device: the previous one's cached code is not this one's.
    const previous = get().user;
    if (previous && previous.id !== user.id) forgetMyRef();
    const promise = (async () => {
      set({ user, error: undefined });
      dropForeignWorkout(user.id);
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
      // Another user's list is not this one's: a failed read for a new user starts from unknown.
      const sameUser = previous?.id === user.id;
      const entitlements =
        entRes.status === 'fulfilled'
          ? entRes.value.map((e) => e.courseId)
          : sameUser
            ? get().entitlements
            : [];
      const newestPurchaseAt =
        entRes.status === 'fulfilled'
          ? newestActivation(entRes.value)
          : sameUser
            ? get().newestPurchaseAt
            : null;
      // Both halves of «what do they own»: the courses and the subscription the club runs on.
      const purchases = [entRes, subRes];
      const failedPurchase = purchases.find((r) => r.status === 'rejected');
      const entitlementsLoaded = !failedPurchase || (sameUser && get().entitlementsLoaded);
      const entitlementsError = failedPurchase ? toAuthError(failedPurchase.reason) : undefined;
      const subscription = subRes.status === 'fulfilled' ? subRes.value : get().subscription;
      const error = profileRes.status === 'rejected' ? toAuthError(profileRes.reason) : undefined;
      set({
        status: 'signed_in',
        user,
        profile,
        entitlements,
        entitlementsLoaded,
        entitlementsError,
        newestPurchaseAt,
        subscription,
        error,
        sessionEnded: false,
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
          // Nobody pressed «Выйти»: the session was dropped under a signed-in athlete.
          const dropped = s.status === 'signed_in' && !signingOut;
          if (s.status !== 'signed_out') {
            set({ ...SIGNED_OUT, error: undefined, sessionEnded: dropped || s.sessionEnded });
          }
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
    // Back online after a boot that could not reach the server: ask again without a tap.
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (get().status === 'offline') void get().boot();
      });
    }
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
    sessionEnded: false,

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
        const error = toAuthError(e);
        if (error.code === 'network') {
          // Not signed out — unknown. The stored session stays; «Повторить» asks again.
          set({ status: 'offline', error });
          return;
        }
        endSession();
        set({ ...SIGNED_OUT, error });
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
      let rows: Awaited<ReturnType<typeof listEntitlements>>;
      let subscription: Subscription | null;
      try {
        [rows, subscription] = await Promise.all([listEntitlements(), getMySubscription()]);
      } catch (e) {
        set({ entitlementsError: toAuthError(e) });
        throw e;
      }
      const entitlements = rows.map((r) => r.courseId);
      set({
        entitlements,
        entitlementsLoaded: true,
        entitlementsError: undefined,
        newestPurchaseAt: newestActivation(rows),
        subscription,
      });
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
      /*
       * What this device holds for the account goes with it: the workout in progress (it would
       * otherwise open, or be saved, under whoever signs in next), and the unsaved summary and
       * self-test drafts. Only on a sign-out asked for — a dropped session keeps them for the
       * same athlete coming back.
       */
      useActiveWorkoutStore.getState().abandon();
      clearSummaryDraft();
      clearAssessmentDraft();
      signingOut = true;
      // Invalidate before the request: a profile load already in flight must not sign the user
      // back in when it resolves.
      endSession();
      try {
        await apiSignOut();
      } finally {
        endSession();
        set({ ...SIGNED_OUT, error: undefined, sessionEnded: false });
        // The auth event is delivered on a timer (see `wire`); let it land before clearing.
        setTimeout(() => {
          signingOut = false;
        }, 0);
      }
    },
  };
});

/**
 * What the account owns could not be read yet. Screens that would otherwise sell — the unlock
 * sheet, the club's pitch, a course card with a price — show `PurchasesUnknown` instead: a paywall
 * in front of somebody who has paid is the worst thing a blip can produce.
 */
export function purchasesUnknown(
  s: Pick<SessionState, 'status' | 'entitlementsLoaded'> = useSession.getState(),
): boolean {
  return s.status === 'signed_in' && !s.entitlementsLoaded;
}
