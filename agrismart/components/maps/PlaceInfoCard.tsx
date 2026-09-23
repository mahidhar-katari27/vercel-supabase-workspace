'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Chip } from '@/components/ui'
import { categoryMeta, type GeoPlace } from '@/lib/places'
import { addressLine, formatKm } from '@/lib/geo'

/**
 * The modern information card shown when a marker is selected (spec §6).
 * Positioned by the parent: floating panel on desktop, sheet card on mobile.
 */
export default function PlaceInfoCard({
  place, km, onClose, onDirections, onView, onBook, className, float = false,
}: {
  place: GeoPlace
  km?: number
  onClose?: () => void
  onDirections?: () => void
  onView?: () => void
  onBook?: () => void
  className?: string
  float?: boolean
}) {
  const meta = categoryMeta(place.category)
  return (
    <motion.div
      initial={float ? { opacity: 0, y: 14, scale: 0.97 } : { opacity: 0, x: 18 }}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className={cn(
        'w-full overflow-hidden rounded-3xl border border-line/70 bg-surface shadow-xl shadow-black/15',
        float && 'max-w-sm backdrop-blur',
        className,
      )}
      role="dialog"
      aria-label={`Details for ${place.name}`}
    >
      <div className="flex items-start gap-3 p-4 pb-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl" style={{ background: `${placeColor(place.category)}1a` }}>
          {meta.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-bold text-ink">{place.name}</h3>
            {onClose && (
              <button type="button" onClick={onClose} aria-label="Close details"
                className="-mr-1 -mt-1 rounded-full p-1 text-faint hover:bg-leaf-50 hover:text-ink">✕</button>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">{addressLine(place.address)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Chip tone="info">{meta.label}</Chip>
            {typeof place.rating === 'number' && <Chip tone="ok">⭐ {place.rating.toFixed(1)}</Chip>}
            {typeof km === 'number' && <Chip tone="default">📍 {formatKm(km)}</Chip>}
            {place.open === true && <Chip tone="live">Open now</Chip>}
            {place.open === false && <Chip tone="danger">Closed</Chip>}
          </div>
        </div>
      </div>

      {(place.priceNote || place.hours || place.serviceRadiusKm || place.note) && (
        <div className="mx-4 rounded-2xl bg-leaf-50 px-3 py-2 text-[11px] font-medium text-ink">
          {place.priceNote && <span className="mr-3 font-bold text-leaf-700">{place.priceNote}</span>}
          {place.hours && <span className="mr-3 text-muted">🕒 {place.hours}</span>}
          {place.serviceRadiusKm && <span className="mr-3 text-muted">↔ serves {place.serviceRadiusKm} km radius</span>}
          {place.note && <span className="text-muted">· {place.note}</span>}
        </div>
      )}

      <div className="flex flex-wrap gap-2 p-4">
        {onView && (
          <button type="button" onClick={onView}
            className="flex-1 rounded-xl border border-line/70 bg-surface px-3 py-2 text-xs font-bold text-ink hover:border-leaf-500 hover:text-leaf-700">
            View Details
          </button>
        )}
        {onDirections && (
          <button type="button" onClick={onDirections}
            className="flex-1 rounded-xl bg-leaf-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-leaf-500">
            🧭 Get Directions
          </button>
        )}
        {onBook && (
          <button type="button" onClick={onBook}
            className="flex-1 rounded-xl bg-gold-400 px-3 py-2 text-xs font-bold text-ink shadow-sm hover:brightness-105">
            Book
          </button>
        )}
        {place.phone && (
          <a href={`tel:${place.phone.replace(/\s|x/g, '')}`}
            className="rounded-xl border border-line/70 px-3 py-2 text-xs font-bold text-ink hover:border-leaf-500">
            📞
          </a>
        )}
      </div>
    </motion.div>
  )
}

const COLORS: Record<string, string> = {
  market: '#b45309', machinery: '#15803d', vet: '#b91c1c', office: '#1d4ed8',
  expert: '#7c3aed', buyer: '#0f766e', inputs: '#4d7c0f', aqua: '#0369a1',
  poultry: '#c2410c', dairy: '#0e7490', storage: '#57534e',
}
function placeColor(c: string) { return COLORS[c] ?? '#166534' }
