'use client'

/**
 * Atmospheric weather layer — subtle, GPU-friendly, never cartoonish.
 *
 *   sunny      → slow breathing sunlight glow
 *   cloudy     → two blurred cloud banks drifting at different speeds
 *   rain       → thin rain streaks falling (calm)
 *   heavy rain → denser, faster streaks
 *   heat       → faint rising heat-shimmer bands
 *
 * Purely decorative: pointer-events none, hidden from assistive tech,
 * disabled entirely under prefers-reduced-motion.
 */
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

export type AtmosphereKind = 'sunny' | 'cloudy' | 'rain' | 'heavy-rain' | 'heat'

export function atmosphereFor(condition: string, tempC?: number): AtmosphereKind {
  const c = condition.toLowerCase()
  if (/thunder|storm|heavy/.test(c)) return 'heavy-rain'
  if (/rain|shower|drizzle/.test(c)) return 'rain'
  if (/cloud|overcast|fog|mist/.test(c)) return 'cloudy'
  if ((tempC ?? 0) >= 38 || /heat|hot/.test(c)) return 'heat'
  return 'sunny'
}

export default function WeatherAtmosphere({
  kind, className,
}: { kind: AtmosphereKind; className?: string }) {
  const drops = useMemo(
    () => Array.from({ length: kind === 'heavy-rain' ? 26 : 14 }, (_, i) => ({
      left: (i * 37) % 100,
      delay: (i % 7) * 0.28,
      dur: kind === 'heavy-rain' ? 0.9 + (i % 5) * 0.12 : 1.6 + (i % 5) * 0.25,
      op: kind === 'heavy-rain' ? 0.5 : 0.32,
    })),
    [kind],
  )

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] motion-reduce:hidden', className)} aria-hidden>
      {kind === 'sunny' && (
        <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-gold-400/25 blur-3xl animate-[atmo-glow_6s_ease-in-out_infinite_alternate]" />
      )}

      {kind === 'cloudy' && (
        <>
          <div className="absolute -left-16 top-3 h-14 w-44 rounded-full bg-white/25 blur-2xl animate-[atmo-drift_26s_linear_infinite]" />
          <div className="absolute -left-24 top-12 h-10 w-36 rounded-full bg-white/15 blur-2xl animate-[atmo-drift_38s_linear_infinite]" />
        </>
      )}

      {(kind === 'rain' || kind === 'heavy-rain') && (
        <>
          {drops.map((d, i) => (
            <span
              key={i}
              className="absolute top-0 w-px rounded-full bg-sky-300/70"
              style={{
                left: `${d.left}%`,
                height: kind === 'heavy-rain' ? 16 : 11,
                opacity: d.op,
                animation: `atmo-fall ${d.dur}s linear ${d.delay}s infinite`,
              }}
            />
          ))}
          <div className="absolute inset-x-0 bottom-0 h-8 bg-sky-400/10 blur-md" />
        </>
      )}

      {kind === 'heat' && (
        <>
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-gold-400/15 to-transparent animate-[atmo-shimmer_3.4s_ease-in-out_infinite_alternate]" />
          <div className="absolute inset-x-6 bottom-2 h-6 rounded-full bg-gold-400/10 blur-xl animate-[atmo-shimmer_2.6s_ease-in-out_infinite_alternate-reverse]" />
        </>
      )}
    </div>
  )
}
