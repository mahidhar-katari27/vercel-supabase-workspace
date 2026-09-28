import { NextResponse } from 'next/server'
import { supabaseServer, supabaseConfigured, supabaseUrl } from '@/lib/supabase'
import { isMissingTable } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Live connection probe — server-side, so it can safely use the service key.
 * Powers the "Supabase connection" card on /admin.
 */
export async function GET(req: Request) {
  // ?only=bookings — lightweight probe used by the client store so the
  // browser never has to hit PostgREST directly (and never logs its 404s).
  const only = new URL(req.url).searchParams.get('only')
  const at = new Date().toISOString()
  if (!supabaseConfigured() && !process.env.SUPABASE_SECRET_KEY) {
    return NextResponse.json({ configured: false, at })
  }
  const sb = supabaseServer()
  if (!sb) return NextResponse.json({ configured: false, at })

  const out: Record<string, unknown> = { configured: true, at, host: new URL(supabaseUrl()!).host }

  const t0 = Date.now()
  const { error: restErr } = await sb.from('bookings').select('id').limit(1)
  out.restMs = Date.now() - t0
  out.bookingsTable = !restErr || !isMissingTable(restErr)
  if (restErr && !out.bookingsTable) out.bookingsNote = 'migration 0001 not applied yet'
  if (only === 'bookings') return NextResponse.json(out)

  const { data: buckets, error: bucketErr } = await sb.storage.listBuckets()
  out.storage = bucketErr ? `error: ${bucketErr.message}` : (buckets ?? []).map((b) => b.id)

  const { data: auth, error: authErr } = await sb.auth.admin.listUsers({ page: 1, perPage: 1 })
  out.authUsers = authErr ? `error: ${authErr.message}` : (auth?.users?.length ?? 0)

  return NextResponse.json(out)
}
