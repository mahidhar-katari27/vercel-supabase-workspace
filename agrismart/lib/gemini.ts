/**
 * Server-side Gemini caller with a model fallback chain.
 * Google occasionally overloads a single model (HTTP 503) — we transparently
 * walk the chain so the assistant/vision features stay available.
 * The API key is read from process.env only; it never reaches the browser.
 */
export const GEMINI_CHAIN = [
  process.env.GOOGLE_AI_MODEL || 'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
]

export type GeminiResult =
  | { ok: true; json: any; model: string }
  | { ok: false; status: number }

export async function callGemini(body: unknown, timeoutMs = 20000): Promise<GeminiResult> {
  const key = process.env.GOOGLE_AI_API_KEY
  if (!key) return { ok: false, status: 0 }
  for (const model of GEMINI_CHAIN) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: ctrl.signal,
          body: JSON.stringify(body),
        },
      )
      if (res.ok) {
        const json = await res.json()
        return { ok: true, json, model }
      }
      if (res.status === 429 || res.status === 500 || res.status === 503) {
        // overloaded / rate-limited → breathe, then next model in chain
        await new Promise((r) => setTimeout(r, 350))
        continue
      }
      return { ok: false, status: res.status }
    } catch {
      await new Promise((r) => setTimeout(r, 250))
      continue // timeout / network → next model
    } finally {
      clearTimeout(timer)
    }
  }
  // Quota windows rotate — one patient last attempt on the primary model.
  await new Promise((r) => setTimeout(r, 1200))
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_CHAIN[0]}:generateContent?key=${encodeURIComponent(key)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal, body: JSON.stringify(body) },
    )
    if (res.ok) return { ok: true, json: await res.json(), model: GEMINI_CHAIN[0]! }
    return { ok: false, status: res.status }
  } catch {
    return { ok: false, status: 503 }
  } finally {
    clearTimeout(timer)
  }
}

export const geminiText = (json: any): string =>
  ((json?.candidates?.[0]?.content?.parts ?? []) as Array<{ text?: string }>)
    .map((p) => p.text ?? '')
    .join('')
    .trim()
