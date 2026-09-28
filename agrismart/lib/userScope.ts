/**
 * Per-user data scoping.
 *
 * Every private AgriSmart dataset (farm plan, tasks, land photos, bookings,
 * doctor history…) lives in localStorage under a legacy `agrismart-<base>`
 * key so the demo/explore experience works with zero accounts.
 *
 * The moment a real Supabase session exists, the AuthProvider calls
 * `setUserScope(uid)` and every key transparently becomes
 * `agrismart:u:<uid8>:<base>` — one isolated namespace per signed-in user,
 * so user A can never read user B's private farm data on a shared device.
 *
 * When the Postgres migration (supabase/migrations/0001_core.sql) is applied
 * in the Supabase dashboard, the same call-sites already prefer the live
 * tables (see lib/liveStore.ts); this module only governs the local tier.
 */

let uid: string | null = null

export function setUserScope(id: string | null) {
  uid = id
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('agrismart:scope-change', { detail: { uid: id } }))
  }
}

export function currentUid(): string | null {
  return uid
}

/** True when a real account session is active (data is private-scoped). */
export function isScoped(): boolean {
  return !!uid
}

/** Resolve a dataset key against the current scope. */
export function sk(base: string): string {
  return uid ? `agrismart:u:${uid.slice(0, 8)}:${base}` : `agrismart-${base}`
}

export function readJSON<T>(base: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(sk(base))
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeJSON(base: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(sk(base), JSON.stringify(value))
  } catch {
    /* private mode — non-fatal */
  }
}

export function removeKey(base: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(sk(base))
  } catch {
    /* ignore */
  }
}
