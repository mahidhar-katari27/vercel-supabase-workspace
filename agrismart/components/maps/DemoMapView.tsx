'use client'

import { motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { formatKm } from '@/lib/geo'
import type { MapViewProps } from './types'

/**
 * Clearly-labelled interactive fallback map, used when no Google Maps key is
 * configured (or the script is blocked). It is a real, pannable/zoomable
 * vector map that plots true lat/lng — not a static picture — and it carries
 * a permanent "DEMO MAP" badge so nobody mistakes it for Google tiles.
 */
export default function DemoMapView({
  center, markers, selectedId, onSelect, onMapClick, route, zoomKm = 24, className, onConfigure,
}: MapViewProps) {
  const [view, setView] = useState({ lat: center.lat, lng: center.lng, spanKm: zoomKm })
  const target = useRef({ lat: center.lat, lng: center.lng })
  const drag = useRef<{ x: number; y: number; lat: number; lng: number } | null>(null)
  const boxRef = useRef<HTMLDivElement | null>(null)
  const [box, setBox] = useState({ w: 800, h: 420 })

  /* follow prop centre with a smooth camera move */
  useEffect(() => {
    target.current = { lat: center.lat, lng: center.lng }
    let raf = 0
    const tick = () => {
      setView((v) => {
        const dLat = target.current.lat - v.lat
        const dLng = target.current.lng - v.lng
        if (Math.abs(dLat) < 1e-5 && Math.abs(dLng) < 1e-5) return v
        raf = requestAnimationFrame(tick)
        return { ...v, lat: v.lat + dLat * 0.16, lng: v.lng + dLng * 0.16 }
      })
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [center.lat, center.lng])

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }))
    setBox({ w: el.clientWidth, h: el.clientHeight })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const degLat = view.spanKm / 111
  const degLng = view.spanKm / (111 * Math.cos((view.lat * Math.PI) / 180))
  const px = (lng: number) => ((lng - view.lng) / degLng + 0.5) * 100
  const py = (lat: number) => (0.5 - (lat - view.lat) / degLat) * 100

  const zoomBy = useCallback((f: number) => {
    setView((v) => ({ ...v, spanKm: Math.min(220, Math.max(3, v.spanKm * f)) }))
  }, [])

  /* wheel zoom (non-passive so we can prevent page scroll) */
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => { e.preventDefault(); zoomBy(e.deltaY > 0 ? 1.18 : 0.85) }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomBy])

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, lat: view.lat, lng: view.lng }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    setView((v) => ({
      ...v,
      lng: drag.current!.lng - (dx / box.w) * degLng,
      lat: drag.current!.lat + (dy / box.h) * degLat,
    }))
  }
  const onPointerUp = () => { drag.current = null }

  const clickToPlace = (e: React.MouseEvent) => {
    if (!onMapClick || drag.current) return
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const fx = (e.clientX - r.left) / r.width - 0.5
    const fy = 0.5 - (e.clientY - r.top) / r.height
    onMapClick({ lat: view.lat + fy * degLat, lng: view.lng + fx * degLng })
  }

  const patternScale = Math.max(6, Math.min(40, view.spanKm * 0.55))

  return (
    <div
      ref={boxRef}
      className={cn('absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing', className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onClick={clickToPlace}
      role="application"
      aria-label="Demo map (Google Maps not configured)"
    >
      {/* stylised terrain ------------------------------------------------ */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="dm-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--leaf-50))" />
            <stop offset="55%" stopColor="hsl(var(--bg))" />
            <stop offset="100%" stopColor="hsl(var(--leaf-50))" />
          </linearGradient>
          <pattern id="dm-f" width={patternScale} height={patternScale} patternUnits="userSpaceOnUse">
            <path d={`M0 0 H${patternScale} M0 ${patternScale / 2} H${patternScale}`} stroke="hsl(var(--line))" strokeWidth="0.35" opacity="0.55" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#dm-g)" />
        <rect width="100" height="100" fill="url(#dm-f)" />
        {/* Krishna river + canals, fixed geography so panning reads as a map */}
        <path d="M-5 62 C 18 58, 34 70, 52 64 S 84 52, 105 58" stroke="hsl(var(--sky-400, 200 70% 55%))" strokeWidth="2.4" fill="none" opacity="0.5" />
        <path d="M22 -5 C 26 22, 18 46, 26 105" stroke="hsl(var(--sky-400, 200 70% 55%))" strokeWidth="1.1" fill="none" opacity="0.35" />
        <path d="M-5 30 H 105 M 60 -5 V 105" stroke="hsl(var(--line))" strokeWidth="0.9" opacity="0.7" />
      </svg>

      {/* route ------------------------------------------------------------- */}
      {route && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <line
            x1={px(route.origin.lng)} y1={py(route.origin.lat)}
            x2={px(route.dest.lng)} y2={py(route.dest.lat)}
            stroke="hsl(var(--leaf-500))" strokeWidth="1.1" strokeDasharray="3 2"
            className="dm-dash" vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}

      {/* markers ----------------------------------------------------------- */}
      {markers.map((m, i) => {
        const x = px(m.lng), y = py(m.lat)
        if (x < -8 || x > 108 || y < -8 || y > 108) return null
        const active = m.id === selectedId
        if (m.variant === 'user') {
          return (
            <span key={m.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
              <span className="relative block h-4 w-4">
                <span className="absolute inset-0 animate-ping rounded-full bg-leaf-500/50" />
                <span className="absolute inset-0 rounded-full border-2 border-white bg-leaf-600 shadow" />
              </span>
            </span>
          )
        }
        return (
          <motion.button
            key={m.id}
            type="button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: active ? 1.18 : 1, opacity: 1 }}
            transition={{ delay: Math.min(i * 0.03, 0.4), type: 'spring', stiffness: 320, damping: 20 }}
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${x}%`, top: `${y}%`, zIndex: active ? 30 : 10 }}
            onClick={(e) => { e.stopPropagation(); onSelect?.(m.id) }}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label={m.label}
            title={m.label}
          >
            <svg width={active ? 40 : 32} height={active ? 50 : 40} viewBox="0 0 40 50" className="drop-shadow-md">
              <path d="M20 49 C20 49 4 30 4 18 A16 16 0 0 1 36 18 C36 30 20 49 20 49Z" fill={m.color} stroke="rgba(255,255,255,0.95)" strokeWidth="2" />
              <circle cx="20" cy="18" r="12.5" fill="rgba(255,255,255,0.96)" />
              <text x="20" y="24" fontSize="15" textAnchor="middle">{m.icon}</text>
            </svg>
            {active && (
              <span className="absolute -bottom-1 left-1/2 h-1.5 w-6 -translate-x-1/2 rounded-full bg-black/25 blur-[2px]" />
            )}
          </motion.button>
        )
      })}

      {/* badge + controls --------------------------------------------------- */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-gold-400/50 bg-surface/90 px-3 py-1 text-[11px] font-semibold tracking-wide text-ink shadow-sm backdrop-blur">
          🧭 DEMO MAP — Google Maps not configured · sample locations
          {onConfigure && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onConfigure() }}
              className="ml-1 rounded-full bg-leaf-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-leaf-500">
              Configure
            </button>
          )}
        </span>
        <div className="pointer-events-auto flex flex-col overflow-hidden rounded-xl border border-line/70 bg-surface/90 shadow-sm backdrop-blur">
          <button type="button" onClick={(e) => { e.stopPropagation(); zoomBy(0.8) }} className="grid h-9 w-9 place-items-center text-sm font-bold text-ink hover:bg-leaf-50" aria-label="Zoom in">+</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); zoomBy(1.25) }} className="grid h-9 w-9 place-items-center border-t border-line/60 text-sm font-bold text-ink hover:bg-leaf-50" aria-label="Zoom out">−</button>
        </div>
      </div>

      {/* scale bar ------------------------------------------------------------ */}
      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-surface/85 px-2.5 py-1 text-[10px] font-semibold text-muted shadow-sm backdrop-blur">
        <span className="inline-block h-1.5 w-14 rounded-full border-x-2 border-b-2 border-muted" />
        {formatKm(view.spanKm / 4)}
      </div>
    </div>
  )
}
