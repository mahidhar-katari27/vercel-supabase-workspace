/**
 * AI assistant proxy — Gemini (Google AI) with an honest, deterministic
 * fallback. The API key lives ONLY in server env (GOOGLE_AI_API_KEY); the
 * browser never sees it. If the key is missing or the call fails we fall back
 * to the rule-based demo responder and label the reply source accordingly.
 */
import { NextResponse } from 'next/server'
import { assistantReply } from '@/lib/ai'

export const runtime = 'nodejs'
export const maxDuration = 30

import { callGemini, geminiText } from '@/lib/gemini'

const SYSTEM = `You are the AgriSmart farm assistant helping farmers in Andhra Pradesh, India.
Style rules:
- Reply in the same register the farmer writes in: English, Telugu (Telugu script), or Tenglish (Telugu words in Latin script). Mirror their language.
- Be practical and brief: under 120 words, plain language, numbered steps when actionable.
- Every money, yield or profit figure you mention is an ESTIMATE. End any message containing figures with: "Estimates only — for planning, not guaranteed."
- You provide assistance, never a definitive diagnosis or professional advice; suggest confirming with a local extension officer or expert for treatment decisions.
- Use the FARM PLAN context (location, acres, soil, water, budget, chosen crop, stage) when present. If the question needs information the plan lacks, ask for the missing piece in one short line.
- Never invent mandi prices with fake dates; if price context is provided, cite its market and date; otherwise say prices should be confirmed at the market yard.`

export async function POST(req: Request) {
  let body: { message?: string; plan?: unknown } = {}
  try { body = await req.json() } catch { /* malformed → rules */ }
  const message = String(body.message ?? '').trim().slice(0, 2000)
  if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 })

  const key = process.env.GOOGLE_AI_API_KEY
  if (!key) {
    return NextResponse.json({ ...assistantReply(message), source: 'rules' })
  }

  const result = await callGemini({
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{
      role: 'user',
      parts: [{ text: `FARM PLAN (saved by the farmer in the app; single source of truth):\n${JSON.stringify(body.plan ?? null)}\n\nFARMER'S QUESTION:\n${message}` }],
    }],
    generationConfig: { temperature: 0.6, maxOutputTokens: 700 },
  }, 9000)
  const text = result.ok ? geminiText(result.json) : ''
  if (result.ok && text) {
    // Reuse the rule engine's chips / navigation so UI affordances stay consistent.
    const rules = assistantReply(message)
    return NextResponse.json({ text, source: 'gemini', model: result.model, chips: rules.chips, navigate: rules.navigate })
  }
  return NextResponse.json({ ...assistantReply(message), source: 'rules' })
}
