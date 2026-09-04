/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_ANON_KEY?: string;
  /** 'true' builds the app in demo mode (browser-local backend). Never set in production. */
  readonly PUBLIC_DEMO_MODE?: string;
  readonly PUBLIC_YANDEX_METRIKA_ID?: string;
  readonly PUBLIC_GA_ID?: string;
  readonly PUBLIC_YANDEX_VERIFICATION?: string;
  readonly PUBLIC_GOOGLE_VERIFICATION?: string;
  readonly INDEXNOW_KEY?: string;
  readonly SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
