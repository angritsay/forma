/**
 * Single Supabase client for the browser app.
 * Public URL + anon key are safe to ship; Row Level Security protects the data.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { sessionStorageAdapter } from '@/lib/auth/sessionStorage';

const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;

/** True when the backend env is present. The app shows a setup screen otherwise. */
export function isConfigured(): boolean {
  return Boolean(url && anonKey && /^https?:\/\//.test(url));
}

export function supabase(): SupabaseClient {
  if (!client) {
    if (!isConfigured()) {
      throw new Error(
        'Supabase is not configured: set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY',
      );
    }
    client = createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'forma.auth',
        /*
         * Not plain localStorage: inside the Telegram Mini App that is cleared often enough that
         * the session never survived to the next launch, and the app asked for an emailed code
         * every time. The adapter mirrors the session into Telegram's own per-user CloudStorage,
         * which outlives the webview. See src/lib/auth/sessionStorage.ts.
         */
        storage: sessionStorageAdapter(),
      },
    });
  }
  return client;
}
