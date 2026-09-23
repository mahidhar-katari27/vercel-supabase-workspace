'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * A stylised, dependency-free map.
 *
 * Real tiles would need a network request and an API key; in a hackathon demo
 * that is a failure point. Instead this plots real lat/lng into a local
 * viewport over a hand-drawn field-and-river backdrop, so markers land in the
 * correct relative positions and it works fully offline.
 */

export type Marker = {
  id: string
  lat: number
  lng: number
  label: string
  sub?: string
  icon?: string
  kind?: string
  active?: boolean
}

export default function MiniMap({
  markers, center, zoomKm = 60, height = 320, onSelect, selectedId, className,
}: {
  markers: Marker[]
  center: { lat: number; lng: number }
  zoomKm?: number
  height?: number
  onSelect?: (m: Marker) => void
  selectedId?: string | null | undefined
  className?: string
}) {
  const [hover, setHover] = useState<string | null>(null)

  // Rough degrees-per-km at this latitude, so the frame is geographically sane.
  const degLat = zoomKm / 111
  const degLng = zoomKm / (111 * Math.cos((center.lat * Math.PI) / 180))
  const x = (lng: number) => ((lng - center.lng) / degLng + 0.5) * 100
  const y = (lat: number) => (0.5 - (lat - center.lat) / degLat) * 100

  return (
    <div className={cn('relative overflow-hidden rounded-3xl border border-line/70', className)}
      style={{ height }} role="img" aria-label={`Map showing ${markers.length} location(s)`}>
      {/* backdrop */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="mm-ground" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--leaf-50))" />
            <stop offset="100%" stopColor="hsl(var(--bg))" />
          </linearGradient>
          <pattern id="mm-fields" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M0 0 H14 M0 7 H14" stroke="hsl(var(--line))" strokeWidth="0.25" opacity="0.7" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#mm-ground)" />
        <rect width="100" height="100" fill="url(#mm-fields)" />
        {/* Krishna river — the defining feature of this belt */}
        <path d="M-5 62 C18 56 30 70 46 66 C62 62 74 74 105 66" fill="none"
          stroke="hsl(205 65% 60%)" strokeOpacity="0.5" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M-5 62 C18 56 30 70 46 66 C62 62 74 74 105 66" fill="none"
          stroke="hsl(205 80% 78%)" strokeOpacity="0.55" strokeWidth="1.1" strokeLinecap="round" />
        {/* roads */}
        <path d="M12 -5 L28 105" stroke="hsl(var(--line))" strokeWidth="1.5" opacity="0.85" />
        <path d="M-5 34 L105 26" stroke="hsl(var(--line))" strokeWidth="1.2" opacity="0.7" />
        <path d="M64 -5 L58 105" stroke="hsl(var(--line))" strokeWidth="1" opacity="0.6" />
        {/* field blocks */}
        {[
          [8, 12, 16, 12], [34, 8, 14, 10], [70, 14, 18, 12],
          [10, 74, 18, 14], [40, 78, 16, 12], [72, 76, 16, 14],
        ].map(([rx, ry, w, h], i) => (
          <rect key={i} x={rx} y={ry} width={w} height={h} rx="1.5"
            fill="hsl(var(--leaf-400))" opacity={0.08 + (i % 3) * 0.04} />
        ))}
      </svg>

      {/* markers */}
      {markers.map((m, i) => {
        const left = x(m.lng), top = y(m.lat)
        if (left < -4 || left > 104 || top < -4 || top > 104) return null
        const on = selectedId === m.id
        return (
          <motion.button
            key={m.id}
            type="button"
            onClick={() => onSelect?.(m)}
            onMouseEnter={() => setHover(m.id)}
            onMouseLeave={() => setHover(null)}
            className={cn(
              'absolute z-10 -translate-x-1/2 -translate-y-full transition-transform duration-300',
              onSelect && 'cursor-pointer hover:scale-110',
            )}
            style={{ left: `${left}%`, top: `${top}%` }}
            initial={{ opacity: 0, scale: 0.3, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05, type: 'spring', stiffness: 320, damping: 20 }}
            aria-label={m.sub ? `${m.label}, ${m.sub}` : m.label}
          >
            {on && (
              <span className="absolute left-1/2 top-full h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-leaf-400/40"
                style={{ animation: 'pulseRing 2s ease-out infinite' }} aria-hidden />
            )}
            <span className={cn(
              'relative grid place-items-center rounded-full border-2 shadow-lift transition-all duration-300',
              on ? 'h-9 w-9 border-white bg-leaf-gradient text-base'
                : 'h-7 w-7 border-white/90 bg-surface text-sm',
            )}>
              <span aria-hidden>{m.icon ?? '📍'}</span>
            </span>
            <span className={cn(
              'absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-lg px-1.5 py-0.5 text-[9px] font-bold shadow-soft transition-opacity duration-200',
              hover === m.id || on ? 'bg-ink text-bg opacity-100' : 'opacity-0',
            )}>
              {m.label}
            </span>
          </motion.button>
        )
      })}

      {/* scale + attribution-ish caption */}
      <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-lg bg-surface/85 px-2 py-1 text-[10px] font-semibold text-muted backdrop-blur-sm">
        <span className="inline-block h-px w-8 bg-muted" aria-hidden />
        ~{Math.round(zoomKm / 3)} km
      </div>
      <div className="absolute bottom-2 right-2 rounded-lg bg-surface/85 px-2 py-1 text-[10px] font-semibold text-faint backdrop-blur-sm">
        Illustrative map · not to scale
      </div>
    </div>
  )
}
