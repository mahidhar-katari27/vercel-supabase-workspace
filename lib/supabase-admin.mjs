// SERVER-SIDE ONLY privileged Supabase client.
//
//   import { getSupabaseAdmin } from './lib/supabase-admin.mjs'
//
// 🔒 This client uses SUPABASE_SECRET_KEY (an `sb_secret_...` key), which
//    BYPASSES ROW LEVEL SECURITY. It can read and write every row in every
//    table, list and modify every user, and access every storage bucket.
//
//    NEVER import this file from:
//      - a React/Vue/Svelte component
//      - anything under `app/`, `pages/`, or `src/` that runs in the browser
//      - any code path reachable from a client bundle
//
//    Safe places: API routes, server actions, server components, cron jobs,
//    queue workers, migration/seed scripts.
//
//    `npm run guard:secrets` scans the tree for accidental leaks. Run it before
//    every deploy.
import {
  createSupabaseClient,
  resolveRealtimeTransport,
  supabaseConfig,
} from './supabase.mjs'

export function adminConfig() {
  const { url } = supabaseConfig()
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return { url, secretKey }
}

function assertAdminConfig() {
  const { url, secretKey } = adminConfig()
  if (!url) throw new Error('SUPABASE_URL is empty')
  if (!secretKey)
    throw new Error(
      'SUPABASE_SECRET_KEY is empty. Set it in .env.local. ' +
        'This client is server-side only.'
    )
  return { url, secretKey }
}

/**
 * Hard runtime guard. Refuses to hand out an admin client in a browser.
 * This is a safety net, not a substitute for keeping the import server-side —
 * if this fires in production, the key may already be in the shipped bundle.
 */
function assertNotBrowser(caller) {
  const browserLike =
    (typeof globalThis.window !== 'undefined' &&
      typeof globalThis.document !== 'undefined') ||
    typeof globalThis.navigator?.userAgent === 'string' &&
      typeof globalThis.process === 'undefined'

  if (browserLike) {
    throw new Error(
      `[supabase-admin] REFUSED to create a privileged client in a browser ` +
        `context (called from ${caller}).\n` +
        `The sb_secret_ key bypasses Row Level Security and must never reach ` +
        `the client.\n` +
        `Use getSupabase() from lib/supabase.mjs instead, and move this call ` +
        `into an API route or server action.`
    )
  }
}

/** Async — works on Node < 22 as well (auto-polyfills WebSocket). */
export async function getSupabaseAdmin(options = {}) {
  assertNotBrowser('getSupabaseAdmin')
  const { url, secretKey } = assertAdminConfig()
  return createSupabaseClient(
    url,
    secretKey,
    { auth: { autoRefreshToken: false, persistSession: false, ...options.auth }, ...options },
    await resolveRealtimeTransport()
  )
}

/** Sync — Node >= 22 or environments with a native WebSocket. */
export function getSupabaseAdminSync(options = {}) {
  assertNotBrowser('getSupabaseAdminSync')
  const { url, secretKey } = assertAdminConfig()
  return createSupabaseClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false, ...options.auth },
    ...options,
  })
}

export default getSupabaseAdmin
