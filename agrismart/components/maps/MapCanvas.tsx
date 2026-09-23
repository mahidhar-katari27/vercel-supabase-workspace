'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useGoogleMaps } from './useGoogleMaps'
import GoogleMapView from './GoogleMapView'
import DemoMapView from './DemoMapView'
import type { MapViewProps } from './types'

/**
 * The single map surface every page uses.
 *
 *  • key configured + script loaded  → real Google Maps JavaScript API
 *  • key missing / script blocked    → clearly-labelled interactive demo map
 *
 * The container is rounded, softly shadowed and fades in; UI chrome is kept
 * OUT of the canvas (spec §14) — cards and panels float beside or below it.
 */
export default function MapCanvas(props: MapViewProps & { height?: number | string }) {
  const { status, google, error } = useGoogleMaps()
  const { height = 420, className, ...view } = props

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'relative w-full overflow-hidden rounded-3xl border border-line/70 shadow-lg shadow-black/10 ring-1 ring-black/5',
        className,
      )}
      style={{ height }}
    >
      {status === 'ready' && google ? (
        <GoogleMapView google={google} {...view} />
      ) : (
        <DemoMapView {...view} />
      )}

      {status === 'loading' && (
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-2 bg-surface/90 px-4 py-1.5 text-[11px] font-semibold text-muted backdrop-blur">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-leaf-500 border-t-transparent" />
          Loading Google Maps…
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gold-400/15 px-4 py-1.5 text-[11px] font-semibold text-ink backdrop-blur">
          ⚠️ Google Maps could not load ({error ?? 'network'}). Showing the labelled demo map — everything else still works.
        </div>
      )}
    </motion.div>
  )
}
