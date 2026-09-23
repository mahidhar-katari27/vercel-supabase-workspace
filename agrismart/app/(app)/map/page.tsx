'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Card, Chip, DemoTag, PageHeader, spring } from '@/components/ui'
import MapCanvas from '@/components/maps/MapCanvas'
import PlaceSearch, { type PlaceSelection } from '@/components/maps/PlaceSearch'
import PlaceInfoCard from '@/components/maps/PlaceInfoCard'
import DirectionsPanel from '@/components/maps/DirectionsPanel'
import MapConfigureModal from '@/components/maps/MapConfigureModal'
import type { MapMarker, MapRoute } from '@/components/maps/types'
import { categoryColor, isMapsConfigured } from '@/lib/googleMaps'
import { farmer, lands } from '@/lib/data'
import {
  categoryMeta, geoPlaces, placeCategories, placesIn, placeForRef,
  type GeoPlace, type PlaceCategory,
} from '@/lib/places'
import { addressLine, formatKm, haversineKm, type LatLng } from '@/lib/geo'
import { cn } from '@/lib/utils'

const NEARBY: Array<{ cat: PlaceCategory; icon: string; label: string }> = [
  { cat: 'machinery', icon: '🚜', label: 'Tractor' },
  { cat: 'market', icon: '🌾', label: 'Market' },
  { cat: 'vet', icon: '🏥', label: 'Vet' },
  { cat: 'office', icon: '🧪', label: 'Soil Testing' },
  { cat: 'office', icon: '🏢', label: 'Agriculture Office' },
  { cat: 'storage', icon: '📦', label: 'Warehouse' },
  { cat: 'expert', icon: '👨‍', label: 'Expert' },
]

export default function MapPage() {
  return (
    <Suspense fallback={<div className="section animate-pulse space-y-4"><div className="h-24 rounded-3xl bg-line/30" /><div className="h-[420px] rounded-3xl bg-line/30" /></div>}>
      <SmartMap />
    </Suspense>
  )
}

function SmartMap() {
  const params = useSearchParams()
  const focusId = params.get('focus')
  const wantRoute = params.get('route') === '1'

  const [cats, setCats] = useState<PlaceCategory[]>(placeCategories.map((c) => c.id))
  const [showFarms, setShowFarms] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchPin, setSearchPin] = useState<GeoPlace | null>(null)
  const [userLoc, setUserLoc] = useState<LatLng | null>(null)
  const [geoMsg, setGeoMsg] = useState<string | null>(null)
  const [routeOn, setRouteOn] = useState(false)
  const [center, setCenter] = useState<LatLng>(farmer.coords)
  const [zoomKm, setZoomKm] = useState(36)
  const [sort, setSort] = useState<'distance' | 'relevance'>('distance')
  const [sheet, setSheet] = useState<'filters' | 'card' | null>(null)
  const [configure, setConfigure] = useState(false)
  const [locating, setLocating] = useState(false)

  const origin: { coords: LatLng; label: string } = userLoc
    ? { coords: userLoc, label: 'Your location' }
    : { coords: farmer.coords, label: `My farm · ${farmer.location}` }

  /* deep link from other pages: /map?focus=id&route=1 or /map?lat=&lng=&label= */
  useEffect(() => {
    if (focusId) {
      const p = geoPlaces.find((x) => x.id === focusId) ??
        (focusId.startsWith('land-')
          ? (() => {
              const l = lands.find((x) => `land-${x.id}` === focusId)
              return l ? { ...placeForRef('land', l.id)!, id: focusId } : undefined
            })()
          : undefined)
      if (!p) return
      setSelectedId(p.id)
      setCenter(p.coords)
      setZoomKm(14)
      if (wantRoute) setRouteOn(true)
      return
    }
    const lat = parseFloat(params.get('lat') ?? '')
    const lng = parseFloat(params.get('lng') ?? '')
    const label = params.get('label')
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const pin: GeoPlace = {
        id: `link-${lat.toFixed(4)}-${lng.toFixed(4)}`,
        category: 'market',
        name: label ?? 'Selected location',
        coords: { lat, lng },
        address: { address: label ?? '', city: '', district: '', state: '', postalCode: '' },
        note: 'Linked location',
      }
      setSearchPin(pin)
      setSelectedId(pin.id)
      setCenter(pin.coords)
      setZoomKm(12)
      if (wantRoute) setRouteOn(true)
    }
  }, [focusId, wantRoute, params])

  const selected: GeoPlace | null = useMemo(() => {
    if (searchPin && selectedId === searchPin.id) return searchPin
    return geoPlaces.find((p) => p.id === selectedId) ?? null
  }, [selectedId, searchPin])

  const withDistance = useCallback(
    (p: GeoPlace) => ({ ...p, km: haversineKm(origin.coords, p.coords) }),
    [origin.coords.lat, origin.coords.lng],
  )

  const results = useMemo(() => {
    const list = placesIn(cats).map(withDistance)
    if (sort === 'distance') return list.sort((a, b) => a.km - b.km)
    return list
      .sort((a, b) => (b.rating ?? 4) / (1 + b.km / 12) - (a.rating ?? 4) / (1 + a.km / 12))
  }, [cats, sort, withDistance])

  const markers: MapMarker[] = useMemo(() => {
    const pins: MapMarker[] = placesIn(cats).map((p) => ({
      id: p.id, lat: p.coords.lat, lng: p.coords.lng,
      icon: categoryMeta(p.category).icon,
      color: categoryColor[p.category] ?? '#166534',
      label: p.name, sub: categoryMeta(p.category).label,
      active: p.id === selectedId,
    }))
    if (showFarms) {
      for (const l of lands) {
        pins.push({ id: `land-${l.id}`, lat: l.coords.lat, lng: l.coords.lng, icon: '🌾', color: categoryColor.farm, label: `${l.name} · ${l.crop}`, sub: `${l.acres} acres`, active: selectedId === `land-${l.id}` })
      }
    }
    if (searchPin) pins.push({ id: searchPin.id, lat: searchPin.coords.lat, lng: searchPin.coords.lng, icon: '🔎', color: categoryColor.search, label: searchPin.name, active: true })
    if (userLoc) pins.push({ id: 'user', lat: userLoc.lat, lng: userLoc.lng, icon: '📍', color: categoryColor.user, label: 'Your location', variant: 'user' })
    return pins
  }, [cats, showFarms, searchPin, userLoc, selectedId])

  const toggleCat = (c: PlaceCategory) =>
    setCats((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]))

  const onSearch = (s: PlaceSelection) => {
    const pin: GeoPlace = s.place ?? {
      id: `search-${s.lat.toFixed(4)}-${s.lng.toFixed(4)}`,
      category: 'market',
      name: s.label,
      coords: { lat: s.lat, lng: s.lng },
      address: { address: s.address ?? s.label, city: '', district: '', state: '', postalCode: '' },
      note: 'Searched location',
    }
    setSearchPin(pin)
    setSelectedId(pin.id)
    setCenter(pin.coords)
    setZoomKm(12)
  }

  const useMyLocation = () => {
    setGeoMsg(null)
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoMsg('Location access is disabled. Search for your location manually.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLoc(p)
        setCenter(p)
        setZoomKm(14)
        setLocating(false)
        // spec §4: after locating, surface nearby services immediately
        setCats(placeCategories.map((c) => c.id))
        setSort('distance')
      },
      () => {
        setLocating(false)
        setGeoMsg('Location access is disabled. Search for your location manually.')
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  const route: MapRoute = routeOn && selected
    ? { origin: origin.coords, dest: selected.coords }
    : null

  const detailHref = selected?.ref?.kind === 'machine' ? '/agrirent'
    : selected?.ref?.kind === 'expert' ? '/experts'
    : selected?.ref?.kind === 'listing' ? '/marketplace'
    : selected?.ref?.kind === 'land' ? '/farm'
    : null

  const infoCard = selected && (
    <PlaceInfoCard
      place={selected}
      km={haversineKm(origin.coords, selected.coords)}
      onClose={() => { setSelectedId(null); setSheet(null) }}
      onDirections={() => setRouteOn(true)}
      onView={detailHref ? undefined : undefined}
      onBook={selected.category === 'machinery' ? () => { window.location.href = '/bookings' } : undefined}
      className={detailHref ? '' : ''}
    />
  )

  return (
    <div className="section">
      <PageHeader
        icon="🗺️"
        title="Smart Map"
        sub="Markets, machinery, vets, offices, experts, buyers and storage near your farm — on one live map."
        tag={
          <span className="flex flex-wrap gap-1.5">
            <Chip tone={isMapsConfigured() ? 'live' : 'demo'} icon={isMapsConfigured() ? '🛰️' : '◆'}>
              {isMapsConfigured() ? 'Google Maps live' : 'Demo map mode'}
            </Chip>
            <button type="button" onClick={() => setConfigure(true)}
              className="chip hover:border-leaf-500 hover:text-leaf-700">
              ⚙️ Configure Maps
            </button>
          </span>
        }
      />

      {/* search + locate -------------------------------------------------- */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <PlaceSearch className="flex-1" placeholder="Search location… e.g. Vijayawada, veterinary hospital, markets near me" onSelect={onSearch} />
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="shrink-0 rounded-2xl bg-leaf-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-leaf-500 disabled:opacity-60"
        >
          {locating ? 'Locating…' : '📍 My Location'}
        </button>
        <button
          type="button"
          onClick={() => setSheet('filters')}
          className="shrink-0 rounded-2xl border border-line/70 bg-surface px-5 py-3 text-sm font-bold text-ink shadow-sm lg:hidden"
        >
          ⚙️ Filters ({cats.length})
        </button>
      </div>

      {geoMsg && (
        <p className="mb-3 rounded-2xl border border-gold-400/40 bg-gold-400/10 px-4 py-2.5 text-xs font-semibold text-ink">{geoMsg}</p>
      )}

      {/* find nearby chooser (spec §12) ----------------------------------- */}
      <div className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        <span className="shrink-0 self-center text-[11px] font-bold uppercase tracking-wide text-faint">Find nearby</span>
        {NEARBY.map((n, i) => (
          <button
            key={`${n.cat}-${i}`}
            type="button"
            onClick={() => { setCats([n.cat]); setSort('distance'); }}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition',
              cats.length === 1 && cats[0] === n.cat
                ? 'border-leaf-600 bg-leaf-600 text-white shadow-sm'
                : 'border-line/70 bg-surface text-ink hover:border-leaf-500',
            )}
          >
            {n.icon} {n.label}
          </button>
        ))}
        <button type="button" onClick={() => setCats(placeCategories.map((c) => c.id))}
          className="shrink-0 rounded-full border border-dashed border-line/70 px-3.5 py-1.5 text-xs font-bold text-muted hover:text-ink">
          Show all
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[276px_minmax(0,1fr)]">
        {/* filters + results (desktop sidebar) ----------------------------- */}
        <aside className="hidden space-y-3 lg:block">
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold">Filters</h3>
              <button type="button" onClick={() => setShowFarms((v) => !v)}
                className={cn('chip', showFarms && 'border-leaf-600 bg-leaf-600 text-white')}>
                🌾 My farms
              </button>
            </div>
            <div className="space-y-1.5">
              {placeCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCat(c.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-2xl border px-3 py-2 text-left text-xs font-bold transition',
                    cats.includes(c.id)
                      ? 'border-leaf-500/60 bg-leaf-50 text-ink'
                      : 'border-line/60 bg-surface text-muted hover:border-leaf-400',
                  )}
                >
                  <span className="text-base">{c.icon}</span>
                  <span className="flex-1">{c.label}</span>
                  <span className={cn('h-4 w-4 rounded-full border-2', cats.includes(c.id) ? 'border-leaf-600 bg-leaf-600' : 'border-line')} />
                </button>
              ))}
            </div>
          </Card>

          <Card className="max-h-[420px] overflow-y-auto p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-sm font-bold">{results.length} places</h3>
              <button type="button" onClick={() => setSort(sort === 'distance' ? 'relevance' : 'distance')}
                className="chip hover:border-leaf-500">
                {sort === 'distance' ? '↕ Distance' : '↕ Relevance'}
              </button>
            </div>
            <div className="space-y-2">
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setSelectedId(p.id); setCenter(p.coords); setZoomKm(12); }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition',
                    selectedId === p.id ? 'border-leaf-600 bg-leaf-50' : 'border-line/60 hover:border-leaf-400',
                  )}
                >
                  <span className="text-lg">{categoryMeta(p.category).icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-ink">{p.name}</span>
                    <span className="block truncate text-[10px] text-muted">{p.address.city} · {categoryMeta(p.category).label}</span>
                  </span>
                  <span className="shrink-0 text-[10px] font-bold text-leaf-700">{formatKm(p.km)}</span>
                </button>
              ))}
            </div>
          </Card>
        </aside>

        {/* the map ---------------------------------------------------------- */}
        {/* self-start: keep this column exactly as tall as the canvas, so the
            floating panels anchor to the map, not to the sidebar's height. */}
        <div className="relative self-start">
          <MapCanvas
            height="min(62vh, 560px)"
            center={center}
            zoomKm={zoomKm}
            markers={markers}
            selectedId={selectedId}
            onSelect={(id) => { setSelectedId(id); setSheet('card') }}
            route={route}
            onConfigure={() => setConfigure(true)}
          />

          {/* floating info card — desktop */}
          <AnimatePresence>
            {selected && (
              <div className="pointer-events-none absolute right-3 top-3 z-30 hidden w-[340px] lg:block">
                <div className="pointer-events-auto">{infoCard}</div>
              </div>
            )}
          </AnimatePresence>

          {/* floating directions — desktop */}
          {routeOn && selected && (
            <div className="absolute bottom-3 left-3 z-30 hidden w-[300px] lg:block">
              <DirectionsPanel origin={origin} dest={{ coords: selected.coords, label: selected.name, icon: categoryMeta(selected.category).icon }} onRoute={() => {}} />
              <button type="button" onClick={() => setRouteOn(false)} className="mt-2 w-full rounded-xl border border-line/70 bg-surface px-3 py-1.5 text-[11px] font-bold text-muted hover:text-ink">
                Clear route
              </button>
            </div>
          )}
        </div>
      </div>

      {/* mobile: scrollable result cards under the map (spec §16) ---------- */}
      <div className="no-scrollbar -mx-1 mt-4 flex gap-3 overflow-x-auto px-1 pb-2 lg:hidden">
        {results.slice(0, 12).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => { setSelectedId(p.id); setCenter(p.coords); setZoomKm(12); setSheet('card'); }}
            className="w-[236px] shrink-0 rounded-3xl border border-line/70 bg-surface p-3.5 text-left shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-lg">{categoryMeta(p.category).icon}</span>
              <Chip tone="info">{formatKm(p.km)}</Chip>
            </div>
            <h4 className="mt-1.5 line-clamp-1 text-xs font-bold text-ink">{p.name}</h4>
            <p className="mt-0.5 line-clamp-1 text-[10px] text-muted">{p.address.city} · {categoryMeta(p.category).label}</p>
            <div className="mt-2 flex gap-1.5">
              <span className="flex-1 rounded-lg bg-leaf-600 px-2 py-1.5 text-center text-[10px] font-bold text-white">Details</span>
              <span className="flex-1 rounded-lg border border-line/70 px-2 py-1.5 text-center text-[10px] font-bold text-ink">Directions</span>
            </div>
          </button>
        ))}
      </div>

      {/* mobile bottom sheets ------------------------------------------------ */}
      <AnimatePresence>
        {sheet === 'filters' && (
          <motion.div className="fixed inset-0 z-[95] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSheet(null)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={spring}
              className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-4xl border-t border-line/70 bg-surface p-5"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line" />
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-bold">Filters</h3>
                <button type="button" onClick={() => setShowFarms((v) => !v)} className={cn('chip', showFarms && 'border-leaf-600 bg-leaf-600 text-white')}>🌾 My farms</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {placeCategories.map((c) => (
                  <button key={c.id} type="button" onClick={() => toggleCat(c.id)}
                    className={cn('flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-xs font-bold',
                      cats.includes(c.id) ? 'border-leaf-500/60 bg-leaf-50 text-ink' : 'border-line/60 text-muted')}>
                    <span className="text-base">{c.icon}</span>{c.label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setSheet(null)} className="mt-4 w-full rounded-2xl bg-leaf-600 px-4 py-3 text-sm font-bold text-white">
                Show {results.length} places
              </button>
            </motion.div>
          </motion.div>
        )}

        {sheet === 'card' && selected && (
          <motion.div className="fixed inset-0 z-[95] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setSheet(null)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={spring}
              className="absolute inset-x-0 bottom-0 rounded-t-4xl border-t border-line/70 bg-bg p-4 pb-6">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line" />
              {infoCard}
              {routeOn && (
                <DirectionsPanel className="mt-3" origin={origin} dest={{ coords: selected.coords, label: selected.name, icon: categoryMeta(selected.category).icon }} onRoute={() => {}} />
              )}
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => setRouteOn((v) => !v)} className="flex-1 rounded-xl border border-line/70 px-3 py-2.5 text-xs font-bold text-ink">
                  {routeOn ? 'Clear route' : '🧭 Route here'}
                </button>
                {detailHref && (
                  <Link href={detailHref} className="flex-1 rounded-xl bg-leaf-600 px-3 py-2.5 text-center text-xs font-bold text-white">View Details</Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted">
        <DemoTag />
        <span>Sample locations around Krishna &amp; Guntur districts. {isMapsConfigured() ? 'Live Google Places results replace these when configured.' : 'Configure a Google Maps key for live Places, Geocoding and Directions.'}</span>
        <button type="button" onClick={() => setConfigure(true)} className="font-bold text-leaf-700 underline underline-offset-2">How?</button>
      </div>

      <MapConfigureModal open={configure} onClose={() => setConfigure(false)} />
    </div>
  )
}
