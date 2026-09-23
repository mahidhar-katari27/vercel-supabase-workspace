/** Small shared helpers. No dependencies — keeps the bundle lean. */

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** ₹ formatting used everywhere money appears. */
export function inr(n: number, opts: { compact?: boolean; decimals?: number } = {}): string {
  const { compact = false, decimals = 0 } = opts
  if (compact) {
    if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`
    if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`
    if (Math.abs(n) >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`
  }
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

export function pct(n: number, decimals = 1): string {
  return `${n > 0 ? '+' : ''}${n.toFixed(decimals)}%`
}

export function num(n: number, decimals = 0): string {
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/** "Good Morning" / "Good Afternoon" / "Good Evening" for the dashboard header. */
export function greeting(d = new Date()): string {
  const h = d.getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export function todayLabel(d = new Date()): string {
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Relative time for notifications and community posts. */
export function timeAgo(input: Date | string | number): string {
  const then = new Date(input).getTime()
  const secs = Math.max(1, Math.round((Date.now() - then) / 1000))
  const steps: Array<[number, string]> = [
    [60, 's'], [3600, 'm'], [86400, 'h'], [604800, 'd'],
  ]
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`
  return new Date(then).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/** Deterministic pseudo-random so demo charts are stable across renders/SSR. */
export function seeded(seed: number): () => number {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i)
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}

/**
 * Every number in this app is illustrative. This label is attached to data
 * surfaces so estimates are never mistaken for guarantees.
 */
export const DEMO_NOTE =
  'Sample demo data for the AgriSmart 2.0 prototype. Figures are illustrative only and are not real market prices, yields or financial advice.'
