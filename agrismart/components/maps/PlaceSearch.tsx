'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { isMapsConfigured, loadGoogleMaps } from '@/lib/googleMaps'
import { searchPlacesLocal, categoryMeta, type GeoPlace } from '@/lib/places'
import { addressLine, type LatLng } from '@/lib/geo'

export type PlaceSelection = LatLng & { label: string; address?: string; place?: GeoPlace }

/**
 * Location search box.
 *
 * With NEXT_PUBLIC_GOOGLE_MAPS_API_KEY set this is a real Google Places
 * Autocomplete widget ("Vijayawada", "veterinary hospital near me", …).
 * Without a key it falls back to offline suggestions over the sample
 * dataset, so the flow never breaks in demo mode.
 */
export default function PlaceSearch({
  onSelect, placeholder = 'Search location…', className, compact = false,
}: {
  onSelect: (sel: PlaceSelection) => void
  placeholder?: string
  className?: string
  compact?: boolean
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [hits, setHits] = useState<GeoPlace[]>([])
  const configured = isMapsConfigured()

  /* real Places Autocomplete when a key exists */
  useEffect(() => {
    if (!configured || !inputRef.current) return
    let ac: any = null
    let alive = true
    loadGoogleMaps()
      .then((g) => {
        if (!alive || !inputRef.current) return
        ac = new g.maps.places.Autocomplete(inputRef.current, {
          fields: ['geometry', 'name', 'formatted_address'],
          types: ['geocode', 'establishment'],
        })
        // Bias to Andhra Pradesh without hard-locking (farmers may search anywhere).
        ac.setBounds({ north: 19.5, south: 12.5, east: 84.5, west: 76.5 })
        ac.addListener('place_changed', () => {
          const p = ac.getPlace()
          const loc = p?.geometry?.location
          if (!loc) return
          onSelect({
            lat: loc.lat(), lng: loc.lng(),
            label: p.name ?? p.formatted_address ?? 'Selected place',
            address: p.formatted_address,
          })
          setQ('')
          setOpen(false)
        })
      })
      .catch(() => { /* demo fallback below stays active */ })
    return () => { alive = false; if (ac) try { g_unbind(ac) } catch { /* noop */ } }
  }, [configured, onSelect])

  const suggestions = !configured && open ? hits : []

  return (
    <div className={cn('relative', className)}>
      <div className={cn(
        'flex items-center gap-2 rounded-2xl border border-line/70 bg-surface shadow-sm focus-within:border-leaf-500 focus-within:ring-2 focus-within:ring-leaf-500/25',
        compact ? 'px-3 py-2' : 'px-4 py-3',
      )}>
        <span aria-hidden className="text-base">🔎</span>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setHits(searchPlacesLocal(e.target.value))
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          placeholder={placeholder}
          aria-label="Search location"
          className="w-full bg-transparent text-sm font-medium text-ink outline-none placeholder:text-faint"
        />
        {q && !configured && (
          <button type="button" onClick={() => { setQ(''); setHits([]) }} className="text-faint hover:text-ink" aria-label="Clear search">✕</button>
        )}
      </div>

      {suggestions.length > 0 && (
        <ul className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-line/70 bg-surface shadow-xl">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-leaf-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect({ lat: s.coords.lat, lng: s.coords.lng, label: s.name, address: addressLine(s.address), place: s })
                  setQ(''); setOpen(false)
                }}
              >
                <span className="text-lg">{s.note === 'Town / locality' ? '📍' : categoryMeta(s.category).icon}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{s.name}</span>
                  <span className="block truncate text-[11px] text-muted">
                    {s.note === 'Town / locality' ? `${s.address.city}, ${s.address.district}` : `${categoryMeta(s.category).label} · ${s.address.city}`}
                  </span>
                </span>
              </button>
            </li>
          ))}
          <li className="border-t border-line/60 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-faint">
            Demo suggestions — configure Google Places for live results
          </li>
        </ul>
      )}
    </div>
  )
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function g_unbind(ac: any) {
  // google.maps.event.clearInstanceListeners
  const w = window as any
  w?.google?.maps?.event?.clearInstanceListeners?.(ac)
}
