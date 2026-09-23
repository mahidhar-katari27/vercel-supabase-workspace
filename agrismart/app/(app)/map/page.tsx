'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, Chip, DemoTag, PageHeader, Reveal, spring } from '@/components/ui'
import MiniMap, { type Marker } from '@/components/MiniMap'
import { farmer, lands, mapLegend, mapPlaces, type MapPlace } from '@/lib/data'
import { cn, num } from '@/lib/utils'

export default function MapPage() {
  const [kinds, setKinds] = useState<string[]>(mapLegend.map((l) => l.kind))
  const [showFarms, setShowFarms] = useState(true)
  const [selected, setSelected] = useState<string | null>(mapPlaces[0]!.id)
  const [q, setQ] = useState('')
  const [byDistance, setByDistance] = useState(true)

  const legendOf = (k: string) => mapLegend.find((l) => l.kind === k)
  const place = mapPlaces.find((p) => p.id === selected)

  const markers: Marker[] = useMemo(() => {
    const places: Marker[] = mapPlaces
      .filter((p) => kinds.includes(p.kind))
      .map((p) => ({
        id: p.id, lat: p.coords.lat, lng: p.coords.lng,
        label: p.name, sub: `${legendOf(p.kind)?.label ?? p.kind} · ${p.km} km`,
        icon: legendOf(p.kind)?.icon ?? '📍', kind: p.kind,
      }))
    const farms: Marker[] = showFarms
      ? lands.map((l) => ({
          id: l.id, lat: l.coords.lat, lng: l.coords.lng,
          label: l.name, sub: `${l.crop} · ${l.acres} ac`, icon: '🌾', kind: 'farm',
        }))
      : []
    return [...farms, ...places]
  }, [kinds, showFarms])

  const list = mapPlaces
    .filter((p) => kinds.includes(p.kind))
    .filter((p) => !q.trim() || p.name.toLowerCase().includes(q.toLowerCase()) || p.area.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (byDistance ? a.km - b.km : a.name.localeCompare(b.name)))

  const toggleKind = (k: string) =>
    setKinds((ks) => ks.includes(k) ? ks.filter((x) => x !== k) : [...ks, k])

  return (
    <div className="section">
      <PageHeader
        icon="🗺️"
        title="Smart Map"
        sub="Markets, machinery providers, vets, offices and buyers around your farms."
        tag={<DemoTag />}
      >
        <div className="rounded-3xl border border-gold-400/35 bg-gold-400/10 p-4 text-sm leading-relaxed text-muted">
          <p className="mb-1 font-bold text-gold-600 dark:text-gold-400">◆ Illustrative map, sample places</p>
          This is a hand-drawn schematic, not a real map service — no tiles, no routing and no live GPS.
          Phone numbers are masked and distances are demo values. Nothing here should be used for
          navigation.
        </div>
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* ----------------------------------------------------------- map */}
        <Reveal>
          <div className="space-y-4">
            <MiniMap
              center={farmer.coords}
              zoomKm={90}
              height={460}
              selectedId={selected}
              onSelect={(m) => setSelected(m.id)}
              markers={markers}
            />

            {/* legend / filters */}
            <Card>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold">Layers</h2>
                <div className="flex gap-1.5">
                  <button onClick={() => setKinds(mapLegend.map((l) => l.kind))} className="btn btn-quiet btn-sm">All on</button>
                  <button onClick={() => setKinds([])} className="btn btn-quiet btn-sm">All off</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowFarms((v) => !v)}
                  className={cn('rounded-full border px-3 py-1.5 text-xs font-bold transition-all',
                    showFarms ? 'border-leaf-400/60 bg-leaf-400/10 text-leaf-700 dark:text-leaf-300' : 'border-line/70 text-faint')}
                  aria-pressed={showFarms}>
                  🌾 My farms ({lands.length})
                </button>
                {mapLegend.map((l) => {
                  const on = kinds.includes(l.kind)
                  const count = mapPlaces.filter((p) => p.kind === l.kind).length
                  return (
                    <button key={l.kind} onClick={() => toggleKind(l.kind)}
                      className={cn('rounded-full border px-3 py-1.5 text-xs font-bold transition-all',
                        on ? 'border-leaf-400/60 bg-leaf-400/10 text-leaf-700 dark:text-leaf-300' : 'border-line/70 text-faint')}
                      aria-pressed={on}>
                      {l.icon} {l.label} ({count})
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-[11px] text-faint">
                Showing {markers.length} of {mapPlaces.length + lands.length} points. Tap a marker or a row to focus it.
              </p>
            </Card>
          </div>
        </Reveal>

        {/* -------------------------------------------------------- sidebar */}
        <div className="space-y-4">
          {/* selected detail */}
          <AnimateOnce key={selected}>
            {place ? (
              <Card className="border-leaf-400/40">
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-leaf-400/10 text-xl" aria-hidden>
                    {legendOf(place.kind)?.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display font-black leading-tight">{place.name}</h2>
                    <p className="text-xs text-muted">{legendOf(place.kind)?.label} · {place.area}</p>
                  </div>
                  <Chip tone={place.open ? 'live' : 'danger'}>{place.open ? 'Open' : 'Closed'}</Chip>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl border border-line/60 bg-surface/50 p-3">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-faint">Distance</dt>
                    <dd className="font-display text-lg font-black">{num(place.km, 1)} km</dd>
                  </div>
                  <div className="rounded-2xl border border-line/60 bg-surface/50 p-3">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-faint">Phone</dt>
                    <dd className="font-mono text-xs font-bold">{place.phone}</dd>
                  </div>
                </dl>

                <p className="mt-3 rounded-2xl bg-surface/60 p-3 text-xs leading-relaxed text-muted">
                  Coords {place.coords.lat.toFixed(4)}, {place.coords.lng.toFixed(4)} — masked number, demo record.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {place.kind === 'market' && <Link href="/market" className="btn btn-primary btn-sm flex-1">Check prices here</Link>}
                  {place.kind === 'machinery' && <Link href="/agrirent" className="btn btn-primary btn-sm flex-1">Book from here</Link>}
                  {place.kind === 'expert' && <Link href="/experts" className="btn btn-primary btn-sm flex-1">Book consultation</Link>}
                  {place.kind === 'office' && <Link href="/schemes" className="btn btn-primary btn-sm flex-1">Scheme help</Link>}
                  {place.kind === 'storage' && <Link href="/market" className="btn btn-primary btn-sm flex-1">Compare markets</Link>}
                  {(place.kind === 'vet' || place.kind === 'buyer') && (
                    <Link href="/community" className="btn btn-primary btn-sm flex-1">Ask the community</Link>
                  )}
                  <button onClick={() => setSelected(null)} className="btn btn-quiet btn-sm">Clear</button>
                </div>
              </Card>
            ) : (
              <Card className="grid place-items-center py-10 text-center">
                <p className="text-sm text-muted">Select a marker on the map to see its details.</p>
              </Card>
            )}
          </AnimateOnce>

          {/* directory list */}
          <Card>
            <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <input className="input flex-1" placeholder="Search places…" value={q}
                onChange={(e) => setQ(e.target.value)} aria-label="Search map places" />
              <button onClick={() => setByDistance((v) => !v)} className="btn btn-quiet btn-sm shrink-0">
                {byDistance ? '↕ Nearest first' : '↕ A–Z'}
              </button>
            </div>

            <ul className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
              {list.map((p) => {
                const on = selected === p.id
                return (
                  <li key={p.id}>
                    <button onClick={() => setSelected(p.id)}
                      className={cn('flex w-full items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-all',
                        on ? 'border-leaf-400/60 bg-leaf-400/10' : 'border-transparent hover:bg-line/30')}
                      aria-pressed={on}>
                      <span className="text-lg" aria-hidden>{legendOf(p.kind)?.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{p.name}</span>
                        <span className="block text-[11px] text-muted">{p.area}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-xs font-black tabular-nums">{num(p.km, 1)} km</span>
                        <span className={cn('block text-[10px] font-bold', p.open ? 'text-leaf-600 dark:text-leaf-400' : 'text-red-500')}>
                          {p.open ? 'Open' : 'Closed'}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
              {list.length === 0 && <li className="py-6 text-center text-sm text-muted">No places match.</li>}
            </ul>
          </Card>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2.5">
        <Link href="/farm" className="btn btn-ghost">🌾 My Farm</Link>
        <Link href="/marketplace" className="btn btn-ghost">🛒 Marketplace</Link>
        <Link href="/weather" className="btn btn-quiet">🌦️ Weather</Link>
      </div>
    </div>
  )
}

/**
 * Re-mounts the detail card so switching selection replays the entrance —
 * the caller passes a `key`, which React consumes for reconciliation.
 */
function AnimateOnce({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
      {children}
    </motion.div>
  )
}
