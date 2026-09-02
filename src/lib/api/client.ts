/**
 * Single Supabase client for the browser app.
 * Public URL + anon key are safe to ship; Row Level Security protects the data.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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
      },
    });
  }
  return client;
}
