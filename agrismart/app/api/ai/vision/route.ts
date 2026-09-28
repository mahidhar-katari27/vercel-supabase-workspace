/**
 * Crop Doctor vision assist — Gemini multimodal analysis of an uploaded leaf
 * photo. Server-side only (key never reaches the browser). Returns structured
 * JSON; the UI labels it clearly as AI assistance and keeps the deterministic
 * demo assessment as the fallback when the key/model is unavailable.
 */
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

import { callGemini, geminiText } from '@/lib/gemini'

const PROMPT = `You are an agricultural crop-health assistant. Look at this crop/leaf photo from a farm in Andhra Pradesh, India.
Return ONLY valid JSON with exactly this shape:
{"issue": string, "risk": "LOW"|"MEDIUM"|"HIGH", "confidence": number(0-100), "symptoms": string[3-5], "steps": string[3-5], "cropGuess": string}
Rules: symptoms must describe what is VISIBLE in the image; steps must be practical field actions; keep each string under 120 characters; confidence is your visual pattern-match confidence, not a certainty. If the image is not a plant/crop, set issue to "Not a crop image" and risk "LOW".`

export async function POST(req: Request) {
  const key = process.env.GOOGLE_AI_API_KEY
  if (!key) return NextResponse.json({ source: 'rules' })

  let body: { image?: string; context?: string } = {}
  try { body = await req.json() } catch { return NextResponse.json({ source: 'rules' }) }
  const m = /^data:(image\/[a-z+.-]+);base64,(.+)$/s.exec(body.image ?? '')
  if (!m || !m[1] || !m[2]) return NextResponse.json({ source: 'rules', error: 'bad image' }, { status: 400 })
  if (m[2].length > 5_500_000) return NextResponse.json({ source: 'rules', error: 'too large' }, { status: 413 })

  try {
    const result = await callGemini({
      contents: [{
        role: 'user',
        parts: [
          { text: `${PROMPT}\nContext: ${body.context ?? 'no additional context'}` },
          { inlineData: { mimeType: m[1], data: m[2] } },
        ],
      }],
      generationConfig: { temperature: 0.35, maxOutputTokens: 900, responseMimeType: 'application/json' },
    }, 28000)
    if (!result.ok) throw new Error(`gemini http ${result.status}`)
    const raw: string = geminiText(result.json)
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned) as {
      issue?: string; risk?: string; confidence?: number; symptoms?: string[]; steps?: string[]; cropGuess?: string
    }
    if (!parsed.issue || !Array.isArray(parsed.symptoms) || !Array.isArray(parsed.steps)) throw new Error('bad shape')
    return NextResponse.json({
      source: 'gemini', model: result.model,
      issue: String(parsed.issue).slice(0, 160),
      risk: ['LOW', 'MEDIUM', 'HIGH'].includes(String(parsed.risk).toUpperCase()) ? String(parsed.risk).toUpperCase() : 'MEDIUM',
      confidence: Math.max(30, Math.min(95, Math.round(Number(parsed.confidence) || 70))),
      symptoms: parsed.symptoms.slice(0, 5).map((s) => String(s).slice(0, 160)),
      steps: parsed.steps.slice(0, 5).map((s) => String(s).slice(0, 200)),
      cropGuess: parsed.cropGuess ? String(parsed.cropGuess).slice(0, 60) : undefined,
    })
  } catch {
    return NextResponse.json({ source: 'rules' })
  }
}
