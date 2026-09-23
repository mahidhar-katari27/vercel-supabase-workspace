'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Chip, DemoTag, SectionHeading } from '@/components/ui'
import { cn } from '@/lib/utils'
import { directionsUrl, formatKm } from '@/lib/geo'
import { farmer } from '@/lib/data'
import { nearbyPlaces, categoryMeta, type PlaceCategory } from '@/lib/places'
import type { LatLng } from '@/lib/geo'

/**
 * "Nearby" result cards reused across Home, Market, Schemes, livestock and
 * service pages (spec §10–§12, §20). Distances are computed from the farmer's
 * location with haversine over the sample dataset — labelled demo data, never
 * presented as live availability.
 */
export default function NearbyServices({
  categories = 'all',
  origin = farmer.coords,
  originLabel,
  title = 'Find Nearby',
  icon = '📍',
  subtitle,
  limit = 6,
  layout = 'scroll',
  sort = 'distance',
  className,
}: {
  categories?: PlaceCategory[] | 'all'
  origin?: LatLng
  originLabel?: string
  title?: string
  icon?: string
  subtitle?: string
  limit?: number
  layout?: 'scroll' | 'grid'
  sort?: 'distance' | 'relevance'
  className?: string
}) {
  const places = useMemo(() => {
    const list = nearbyPlaces(origin, categories, 40)
    if (sort === 'relevance') {
      return list
        .map((p) => ({ p, score: (p.rating ?? 4) / (1 + p.km / 12) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((x) => x.p)
    }
    return list.slice(0, limit)
  }, [origin.lat, origin.lng, categories, limit, sort])

  if (!places.length) return null

  return (
    <section className={cn('space-y-3', className)}>
      <SectionHeading
        eyebrow={`${icon} Maps`}
        title={title}
        sub={subtitle ?? `Within easy reach of ${originLabel ?? 'your farm'} · sorted by ${sort}`}
        right={<DemoTag />}
      />

      <div className={cn(
        layout === 'scroll'
          ? 'no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1'
          : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3',
      )}>
        {places.map((p) => {
          const meta = categoryMeta(p.category)
          return (
            <article
              key={p.id}
              className={cn(
                'flex shrink-0 flex-col justify-between gap-3 rounded-3xl border border-line/70 bg-surface p-4 shadow-sm',
                layout === 'scroll' ? 'w-[248px]' : 'w-full',
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-leaf-50 text-lg">{meta.icon}</span>
                  <Chip tone="info" icon="📍">{formatKm(p.km)}</Chip>
                </div>
                <h4 className="mt-2 line-clamp-1 text-sm font-bold text-ink">{p.name}</h4>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">
                  {p.address.city}{p.address.district !== p.address.city ? `, ${p.address.district}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {typeof p.rating === 'number' && <Chip tone="ok">⭐ {p.rating.toFixed(1)}</Chip>}
                  {p.open === true && <Chip tone="live">Open</Chip>}
                  {p.open === false && <Chip tone="danger">Closed</Chip>}
                  {p.priceNote && <Chip tone="default">{p.priceNote}</Chip>}
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/map?focus=${encodeURIComponent(p.id)}&route=1`}
                  className="flex-1 rounded-xl bg-leaf-600 px-2.5 py-2 text-center text-[11px] font-bold text-white hover:bg-leaf-500"
                >
                  🧭 Directions
                </Link>
                <Link
                  href={`/map?focus=${encodeURIComponent(p.id)}`}
                  className="flex-1 rounded-xl border border-line/70 px-2.5 py-2 text-center text-[11px] font-bold text-ink hover:border-leaf-500 hover:text-leaf-700"
                >
                  View on Map
                </Link>
                <a
                  href={directionsUrl(origin, p.coords)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${p.name} in Google Maps`}
                  className="rounded-xl border border-line/70 px-2.5 py-2 text-[11px] font-bold text-ink hover:border-leaf-500"
                >
                  ↗
                </a>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
