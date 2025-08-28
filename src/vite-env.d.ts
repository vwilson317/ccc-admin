/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SUPABASE_URL_DEV: string
  readonly VITE_SUPABASE_ANON_KEY_DEV: string
  readonly VITE_SUPABASE_URL_QA: string
  readonly VITE_SUPABASE_ANON_KEY_QA: string
  readonly VITE_SUPABASE_URL_UAT: string
  readonly VITE_SUPABASE_ANON_KEY_UAT: string
  readonly VITE_SUPABASE_URL_PROD: string
  readonly VITE_SUPABASE_ANON_KEY_PROD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
