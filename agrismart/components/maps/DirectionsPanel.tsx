'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { directionsUrl, estimateDriveMinutes, formatKm, formatMinutes, haversineKm, type LatLng } from '@/lib/geo'
import { isMapsConfigured, loadGoogleMaps } from '@/lib/googleMaps'
import type { MapRoute } from './types'

export type RouteEnd = { coords: LatLng; label: string; icon?: string }

/**
 * Current location → destination route summary (spec §8).
 *
 * With a key: real distance + duration from the Directions API and the route
 * drawn on the map. Without one: straight-line distance plus a clearly
 * labelled driving-time estimate, and a keyless "Open in Google Maps" link
 * that hands the turn-by-turn navigation to Google's own app/site.
 */
export default function DirectionsPanel({
  origin, dest, onRoute, className,
}: {
  origin: RouteEnd
  dest: RouteEnd
  onRoute?: (r: MapRoute) => void
  className?: string
}) {
  const [api, setApi] = useState<{ km: number; min: number } | null>(null)
  const configured = isMapsConfigured()
  const straight = haversineKm(origin.coords, dest.coords)
  const roadKm = api?.km ?? straight * 1.25
  const minutes = api?.min ?? estimateDriveMinutes(roadKm)

  useEffect(() => {
    onRoute?.({ origin: origin.coords, dest: dest.coords })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin.coords.lat, origin.coords.lng, dest.coords.lat, dest.coords.lng])

  useEffect(() => {
    let alive = true
    setApi(null)
    if (!configured) return
    loadGoogleMaps()
      .then((g) => {
        const svc = new g.maps.DirectionsService()
        svc.route(
          {
            origin: { lat: origin.coords.lat, lng: origin.coords.lng },
            destination: { lat: dest.coords.lat, lng: dest.coords.lng },
            travelMode: g.maps.TravelMode.DRIVING,
          },
          (res: any, status: string) => {
            if (!alive || status !== 'OK') return
            const leg = res?.routes?.[0]?.legs?.[0]
            if (!leg) return
            setApi({ km: leg.distance.value / 1000, min: Math.round(leg.duration.value / 60) })
          },
        )
      })
      .catch(() => { /* keep the estimate */ })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin.coords.lat, origin.coords.lng, dest.coords.lat, dest.coords.lng, configured])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-3xl border border-line/70 bg-surface p-4 shadow-sm', className)}
    >
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-faint">
        🧭 Route
      </div>
      <div className="mt-2 space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-ink">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-leaf-100 text-[11px]">📍</span>
          <span className="truncate font-semibold">{origin.label}</span>
        </div>
        <div className="ml-3 h-4 w-px bg-line" />
        <div className="flex items-center gap-2 text-ink">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-gold-400/20 text-[11px]">{dest.icon ?? '🏁'}</span>
          <span className="truncate font-semibold">{dest.label}</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-leaf-50 px-3 py-2">
          <div className="text-[10px] font-bold uppercase tracking-wide text-faint">Distance</div>
          <div className="text-base font-extrabold text-ink">{formatKm(roadKm)}</div>
        </div>
        <div className="rounded-2xl bg-leaf-50 px-3 py-2">
          <div className="text-[10px] font-bold uppercase tracking-wide text-faint">Est. time</div>
          <div className="text-base font-extrabold text-ink">{formatMinutes(minutes)}</div>
        </div>
      </div>

      <p className="mt-2 text-[10px] leading-snug text-faint">
        {api
          ? 'Distance and time from the Google Directions API for current traffic-free routing.'
          : 'Estimated from straight-line distance (×1.25 road factor) — demo mode. Live turn-by-turn comes from the Directions API once a key is configured.'}
      </p>

      <a
        href={directionsUrl(origin.coords, dest.coords)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block rounded-xl bg-leaf-600 px-3 py-2 text-center text-xs font-bold text-white shadow-sm hover:bg-leaf-500"
      >
        Open route in Google Maps ↗
      </a>
    </motion.div>
  )
}
