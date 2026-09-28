/**
 * Live probe for the Google AI (Gemini) connection — powers the admin card and
 * the assistant's status chip. Read-only: lists models (no generation).
 */
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const key = process.env.GOOGLE_AI_API_KEY
  const model = process.env.GOOGLE_AI_MODEL || 'gemini-3.8-flash'
  if (!key) {
    return NextResponse.json({ configured: false, model, ok: false, note: 'GOOGLE_AI_API_KEY not set — assistant & crop doctor run on deterministic demo logic' })
  }
  const t0 = Date.now()
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`, { signal: ctrl.signal, cache: 'no-store' })
    clearTimeout(timer)
    const ms = Date.now() - t0
    if (!res.ok) return NextResponse.json({ configured: true, model, ok: false, ms, note: `HTTP ${res.status} from Google AI` })
    const j = await res.json()
    const names: string[] = (j.models ?? []).map((m: { name?: string }) => m.name ?? '')
    return NextResponse.json({
      configured: true, model, ok: true, ms,
      modelAvailable: names.includes(`models/${model}`),
      models: names.length,
    })
  } catch (e) {
    return NextResponse.json({ configured: true, model, ok: false, ms: Date.now() - t0, note: String(e) })
  }
}
