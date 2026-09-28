import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const BUCKET = 'crop-photos'

/**
 * Uploads a crop/farm photo to Supabase Storage using the service key, so no
 * storage policy SQL is required for the demo. Bucket is created on first
 * use (public read, writes only through this route).
 *
 * POST { dataUrl: "data:image/jpeg;base64,…", landId: "land-01" }
 * → { publicUrl }
 */
export async function POST(req: Request) {
  const sb = supabaseServer()
  if (!sb) return NextResponse.json({ error: 'supabase not configured' }, { status: 503 })

  let body: { dataUrl?: string; landId?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }) }
  const { dataUrl, landId = 'land' } = body
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return NextResponse.json({ error: 'dataUrl must be a data:image/… URI' }, { status: 400 })
  }
  const mime = /^data:(image\/[a-z0-9.+-]+);/i.exec(dataUrl)?.[1] ?? 'image/jpeg'
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  const buf = Buffer.from(base64, 'base64')
  if (buf.length > 4 * 1024 * 1024) {
    return NextResponse.json({ error: 'photo too large (4 MB max)' }, { status: 413 })
  }

  // idempotent bucket creation — no DDL, pure Storage API
  const { error: mk } = await sb.storage.createBucket(BUCKET, { public: true })
  if (mk && !/already exists/i.test(mk.message)) {
    return NextResponse.json({ error: mk.message }, { status: 500 })
  }

  const path = `${landId}-${Date.now()}.${mime.includes('png') ? 'png' : 'jpg'}`
  const { error: up } = await sb.storage.from(BUCKET).upload(path, buf, {
    contentType: mime, upsert: false,
  })
  if (up) return NextResponse.json({ error: up.message }, { status: 500 })

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ publicUrl: data.publicUrl, path })
}
