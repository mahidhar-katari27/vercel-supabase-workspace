/**
 * Supabase clients for AgriSmart 2.0 — project zhnroiztfzocjfiegssa.
 *
 *   browser : anon key (NEXT_PUBLIC_*) — safe for the client, RLS-enforced
 *   server  : service key (SUPABASE_SECRET_KEY) — route handlers only, never
 *             imported by client components; bypasses RLS, treated as secret
 *
 * If the variables are missing the helpers return null and every caller
 * falls back to the labelled demo dataset, so the app never breaks.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function supabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function supabaseUrl(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? null
}

let browserClient: SupabaseClient | null = null

/** Client-side singleton. Returns null when unconfigured or on the server. */
export function supabaseBrowser(): SupabaseClient | null {
  if (typeof window === 'undefined') return null
  if (!supabaseConfigured()) return null
  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: true, autoRefreshToken: true } },
    )
  }
  return browserClient
}

/**
 * Server-side (route handlers) client with the service key.
 * Created per call — route handlers are short-lived and must not share auth
 * state across requests.
 */
export function supabaseServer(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** True when a PostgREST error means "table does not exist". */
export function isMissingTable(e: { code?: string; message?: string } | null): boolean {
  if (!e) return false
  return e.code === '42P01' || e.code === 'PGRST205' || /does not exist/i.test(e.message ?? '')
}
