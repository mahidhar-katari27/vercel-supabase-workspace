// Framework-agnostic Supabase client factory (ANON role — safe for browsers).
//
//   import { getSupabaseAsync } from './lib/supabase.mjs'
//
// For the privileged server-side client see ./lib/supabase-admin.mjs.
//
// NODE <22 GOTCHA: createClient() eagerly builds a Realtime client, which needs
// a WebSocket implementation. Browsers and Node >=22 provide globalThis.WebSocket;
// Node 20 does not, and createClient() throws:
//     "Error: Node.js 20 detected without native WebSocket support."
// Use the *Async factory to have the `ws` polyfill wired in automatically.

import { createClient } from '@supabase/supabase-js'

export function supabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const anonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  return { url: url.replace(/\/$/, ''), anonKey }
}

export function assertSupabaseConfig() {
  const { url, anonKey } = supabaseConfig()
  const problems = []
  if (!url) problems.push('SUPABASE_URL is empty')
  else if (!/^https:\/\/[a-z0-9.-]+$/i.test(url))
    problems.push(`SUPABASE_URL looks malformed: ${url}`)
  if (!anonKey) problems.push('SUPABASE_ANON_KEY is empty')
  else if (anonKey.split('.').length !== 3)
    problems.push('SUPABASE_ANON_KEY is not a JWT (expected 3 dot-separated parts)')
  if (problems.length) throw new Error(problems.join('; '))
  return { url, anonKey }
}

/**
 * Shared low-level builder. Accepts an explicit key so the admin client can
 * reuse the same WebSocket-polyfill logic without duplicating it.
 */
export function createSupabaseClient(url, key, options = {}, realtime) {
  return createClient(url, key, {
    ...(realtime ? { realtime } : {}),
    auth: { persistSession: true, autoRefreshToken: true, ...(options.auth ?? {}) },
    ...options,
  })
}

/**
 * Resolves a WebSocket transport for Node < 22.
 * Returns undefined when a native WebSocket exists (browsers, Node >= 22).
 * The ignore comments keep bundlers from resolving `ws` into browser builds.
 */
export async function resolveRealtimeTransport() {
  if (typeof globalThis.WebSocket !== 'undefined') return undefined
  try {
    const ws = (await import(/* @vite-ignore */ /* webpackIgnore: true */ 'ws')).default
    return { transport: ws }
  } catch {
    throw new Error(
      'Node < 22 needs the "ws" package for Supabase Realtime. Run: npm install ws'
    )
  }
}

/** True when running in a browser-like environment. */
export function isBrowser() {
  return (
    typeof globalThis.window !== 'undefined' &&
    typeof globalThis.document !== 'undefined'
  )
}

/** Sync factory. Browsers and Node >= 22 only (needs native WebSocket). */
export function getSupabase(options = {}) {
  const { url, anonKey } = assertSupabaseConfig()
  return createSupabaseClient(url, anonKey, options)
}

/** Async factory. Works everywhere, including Node < 22. */
export async function getSupabaseAsync(options = {}) {
  const { url, anonKey } = assertSupabaseConfig()
  return createSupabaseClient(url, anonKey, options, await resolveRealtimeTransport())
}

export default getSupabaseAsync
