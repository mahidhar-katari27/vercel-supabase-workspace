'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, Chip, DemoTag, Modal, PageHeader, Progress, Reveal, spring } from '@/components/ui'
import MapCanvas from '@/components/maps/MapCanvas'
import LocationPickerModal from '@/components/maps/LocationPickerModal'
import NearbyServices from '@/components/maps/NearbyServices'
import type { MapMarker } from '@/components/maps/types'
import { categoryColor } from '@/lib/googleMaps'
import { directionsUrl, formatKm, haversineKm } from '@/lib/geo'
import { getFarmLocation, setFarmLocation, type StoredLocation } from '@/lib/places'
import { cropCatalog, cropKeyForName, cropOf, healthIndicator, type CropKey } from '@/lib/crops'
import {
  farmer, irrigationTypes, lands, marketRows, schemes, soilTypes, weather, type Land,
} from '@/lib/data'
import { cn, inr } from '@/lib/utils'

const PHOTO_KEY = 'agrismart-land-photos'

const emptyForm = {
  name: '', location: '', acres: '', soil: soilTypes[0]!, irrigation: irrigationTypes[0]!,
  crop: '', planted: '', harvest: '',
}

export default function FarmPage() {
  const [list, setList] = useState<Land[]>(lands)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formCrop, setFormCrop] = useState<CropKey>('paddy')
  const [formPhoto, setFormPhoto] = useState<string | null>(null)
  const [formLoc, setFormLoc] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [pins, setPins] = useState<Record<string, StoredLocation>>({})
  const [photos, setPhotos] = useState<Record<string, string>>({})
  const [picker, setPicker] = useState<null | { kind: 'form' } | { kind: 'land'; id: string }>(null)
  const [dashboard, setDashboard] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const totalAcres = list.reduce((a, l) => a + l.acres, 0)
  const active = list.find((l) => l.id === dashboard) ?? list[0]!
  const set = (k: keyof typeof emptyForm, v: string) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    const p: Record<string, StoredLocation> = {}
    for (const l of list) { const got = getFarmLocation(l.id); if (got) p[l.id] = got }
    setPins(p)
    try { setPhotos(JSON.parse(window.localStorage.getItem(PHOTO_KEY) ?? '{}')) } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const persistPhoto = (id: string, dataUrl: string) => {
    setPhotos((prev) => {
      const next = { ...prev, [id]: dataUrl }
      try { window.localStorage.setItem(PHOTO_KEY, JSON.stringify(next)) } catch {
        /* quota — keep in memory for this session only */
      }
      return next
    })
  }

  const onUpload = (file: File | undefined, target: 'form' | string) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = String(reader.result)
      if (target === 'form') setFormPhoto(url)
      else persistPhoto(target, url)
    }
    reader.readAsDataURL(file)
  }

  const submit = () => {
    if (!form.name.trim()) return setErr('Land name is required')
    const acres = parseFloat(form.acres)
    if (!acres || acres <= 0) return setErr('Enter a land size greater than zero')
    if (!form.location.trim()) return setErr('Location is required')
    if (!form.crop.trim()) return setErr('Crop is required')
    setErr(null)
    const id = `land-${String(list.length + 1).padStart(2, '0')}`
    const cropKey = cropKeyForName(form.crop)
    const base = formLoc ? { lat: formLoc.lat, lng: formLoc.lng } : farmer.coords
    setList((prev) => [
      ...prev,
      {
        id, name: form.name.trim(), location: form.location.trim(), acres,
        soil: form.soil, irrigation: form.irrigation, crop: form.crop.trim(),
        planted: form.planted || '2026-09-23', harvest: form.harvest || '2027-01-20',
        stage: 'Sowing', progress: 6, health: 90,
        coords: base,
        cropKey, harvestDays: 120, investment: 0, revenue: 0, profit: 0,
      },
    ])
    if (formPhoto) persistPhoto(id, formPhoto)
    if (formLoc) setFarmLocation(id, { ...formLoc, savedAt: new Date().toISOString() })
    setForm(emptyForm); setFormPhoto(null); setFormLoc(null); setOpen(false)
  }

  const farmMarkers: MapMarker[] = list.map((l) => ({
    id: l.id,
    lat: pins[l.id]?.lat ?? l.coords.lat,
    lng: pins[l.id]?.lng ?? l.coords.lng,
    icon: cropOf(l.cropKey).icon,
    color: categoryColor.farm,
    label: `${l.name} — ${l.crop}`,
    sub: `${l.acres} acres · ${l.location}`,
    active: l.id === dashboard,
  }))

  return (
    <div className="section">
      <PageHeader
        icon="🌾"
        title="My Farm"
        sub={`${list.length} lands · ${totalAcres.toFixed(1)} acres · ${farmer.season} — your digital farm portfolio`}
        tag={<DemoTag />}
      >
        <div className="flex flex-wrap gap-2.5">
          <button onClick={() => setOpen(true)} className="btn btn-primary">+ Add New Land</button>
          <button onClick={() => setPicker({ kind: 'land', id: active.id })} className="btn btn-ghost">
            📍 Select Farm Location
          </button>
          <Link href="/planner" className="btn btn-ghost">🗓️ Crop Planner</Link>
          <Link href="/finance" className="btn btn-quiet">💰 Farm Finance</Link>
        </div>
      </PageHeader>

      {/* ------------------------------------------------------- my lands */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold sm:text-2xl">My Lands</h2>
        <span className="text-xs text-muted">Photo · crop · health · finance · location — at a glance</span>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((l, i) => (
          <LandCard
            key={l.id}
            land={l}
            index={i}
            photo={photos[l.id]}
            pinned={!!pins[l.id]}
            onView={() => setDashboard(l.id)}
            onMap={() => { window.location.href = `/map?focus=land-${l.id}` }}
          />
        ))}

        <Reveal delay={0.18}>
          <button
            onClick={() => setOpen(true)}
            className="flex h-full min-h-[280px] w-full flex-col items-center justify-center gap-3 rounded-4xl border-2 border-dashed border-line/80 bg-surface/40 p-6 text-sm font-bold text-muted transition-all duration-300 hover:-translate-y-1 hover:border-leaf-500 hover:text-ink hover:shadow-lift"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-leaf-400/10 text-xl" aria-hidden>+</span>
            Add New Land
            <span className="max-w-[220px] text-center text-[11px] font-medium text-faint">
              With crop photo upload and Google Maps pin
            </span>
          </button>
        </Reveal>
      </div>

      {/* --------------------------------------------- map + soil summary */}
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <Card className="h-full p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold">Farm locations</h2>
              <Link href="/map" className="text-xs font-bold text-leaf-600 dark:text-leaf-400">Smart Map →</Link>
            </div>
            <MapCanvas
              center={pins[active.id] ? { lat: pins[active.id]!.lat, lng: pins[active.id]!.lng } : active.coords}
              zoomKm={40}
              height={320}
              selectedId={dashboard}
              onSelect={(id) => setDashboard(id)}
              markers={farmMarkers}
            />
            <ul className="mt-3 space-y-1.5">
              {list.map((l) => (
                <li key={l.id}>
                  <button
                    onClick={() => setDashboard(l.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs transition-colors hover:bg-line/30"
                  >
                    <span className="truncate">{cropOf(l.cropKey).icon} {l.name} — {l.crop} · {l.location}</span>
                    <span className="shrink-0 tabular-nums text-muted">{l.acres} ac</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card className="h-full p-4">
            <h2 className="mb-3 text-sm font-bold">Soil &amp; irrigation summary</h2>
            <div className="space-y-3">
              {(['soil', 'irrigation'] as const).map((key) => {
                const counts = list.reduce<Record<string, number>>((acc, l) => {
                  acc[l[key]] = (acc[l[key]] ?? 0) + 1
                  return acc
                }, {})
                return (
                  <div key={key}>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-faint">
                      {key === 'soil' ? 'Soil types in use' : 'Irrigation methods'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(counts).map(([v, n]) => (
                        <Chip key={v}>{v} <span className="font-black">×{n}</span></Chip>
                      ))}
                    </div>
                  </div>
                )
              })}
              <div className="hairline my-3" />
              <p className="text-xs leading-relaxed text-muted">
                Black cotton soil holds moisture well but drains slowly — it suits paddy and cotton.
                Red loamy soil drains faster, so chilli on it needs more frequent, lighter irrigation.
              </p>
              <Link href="/learn" className="btn btn-ghost btn-sm w-full">📚 Read soil guides</Link>
            </div>
          </Card>
        </Reveal>
      </div>

      <div className="mt-10">
        <NearbyServices
          categories={['machinery', 'market', 'vet', 'office', 'storage']}
          origin={pins[active.id] ? { lat: pins[active.id]!.lat, lng: pins[active.id]!.lng } : active.coords}
          originLabel={active.name}
          icon="🧭"
          title="Services near this farm"
          subtitle="Machinery, markets, vets, offices and storage within reach of the selected land"
          limit={6}
        />
      </div>

      {/* ------------------------------------------------- land dashboard */}
      <LandDashboard
        land={list.find((l) => l.id === dashboard) ?? null}
        photo={dashboard ? photos[dashboard] : undefined}
        pin={dashboard ? pins[dashboard] : undefined}
        onClose={() => setDashboard(null)}
        onChangePin={(id) => setPicker({ kind: 'land', id })}
      />

      {/* ------------------------------------------------------ add land */}
      <Modal open={open} onClose={() => setOpen(false)} title="+ Add New Land" wide>
        <div className="space-y-4">
          <div>
            <span className="label">Crop — pick to set the card photo</span>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {cropCatalog.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => { setFormCrop(c.key); set('crop', c.label) }}
                  className={cn(
                    'group overflow-hidden rounded-2xl border-2 text-left transition-all duration-200',
                    formCrop === c.key ? 'border-leaf-600 shadow-glow' : 'border-transparent hover:border-leaf-400',
                  )}
                  aria-pressed={formCrop === c.key}
                >
                  <span className="relative block h-14 overflow-hidden">
                    <img src={c.image} alt={`${c.label} crop`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  </span>
                  <span className="block bg-surface px-1.5 py-1 text-center text-[10px] font-bold text-ink">
                    {c.icon} {c.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="label">Land name *</span>
              <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Land 05" />
            </label>
            <label className="block">
              <span className="label">Location *</span>
              <input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Vijayawada" />
            </label>
            <label className="block">
              <span className="label">Area (acres) *</span>
              <input className="input" type="number" min="0" step="0.1" value={form.acres} onChange={(e) => set('acres', e.target.value)} placeholder="2.5" />
            </label>
            <label className="block">
              <span className="label">Crop *</span>
              <input className="input" value={form.crop} onChange={(e) => { set('crop', e.target.value); setFormCrop(cropKeyForName(e.target.value)) }} placeholder="Paddy" />
            </label>
            <label className="block">
              <span className="label">Soil type</span>
              <select className="input" value={form.soil} onChange={(e) => set('soil', e.target.value)}>
                {soilTypes.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="label">Irrigation</span>
              <select className="input" value={form.irrigation} onChange={(e) => set('irrigation', e.target.value)}>
                {irrigationTypes.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="label">Planting date</span>
              <input className="input" type="date" value={form.planted} onChange={(e) => set('planted', e.target.value)} />
            </label>
            <label className="block">
              <span className="label">Expected harvest</span>
              <input className="input" type="date" value={form.harvest} onChange={(e) => set('harvest', e.target.value)} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="label">📷 Crop / farm photo</span>
              <div className="mt-1 flex items-center gap-3">
                <span className="relative block h-20 w-28 shrink-0 overflow-hidden rounded-2xl border border-line/70">
                  <img
                    src={formPhoto ?? cropOf(formCrop).image}
                    alt="Crop preview"
                    className="h-full w-full object-cover"
                  />
                  {formPhoto && (
                    <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[9px] font-bold text-white">Your upload</span>
                  )}
                </span>
                <div className="space-y-1.5">
                  <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-ghost btn-sm">
                    📷 Upload photo
                  </button>
                  <p className="text-[10px] leading-snug text-faint">
                    Stored in this browser only. Without an upload the crop's own photograph is used.
                  </p>
                </div>
                <input
                  ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => onUpload(e.target.files?.[0], 'form')}
                />
              </div>
            </div>

            <div>
              <span className="label">📍 Location on Google Maps</span>
              <div className="mt-1 space-y-1.5">
                <button type="button" onClick={() => setPicker({ kind: 'form' })} className="btn btn-ghost btn-sm">
                  📍 {formLoc ? 'Change pin' : 'Select location on map'}
                </button>
                {formLoc ? (
                  <p className="rounded-xl bg-leaf-50 px-3 py-2 text-[11px] font-semibold text-ink">
                    {formLoc.address} <span className="font-mono text-faint">({formLoc.lat.toFixed(4)}, {formLoc.lng.toFixed(4)})</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-faint">Optional — falls back to your profile location.</p>
                )}
              </div>
            </div>
          </div>

          {err && <p className="rounded-2xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-500">{err}</p>}

          <div className="flex gap-2.5">
            <button onClick={() => setOpen(false)} className="btn btn-ghost">Cancel</button>
            <button onClick={submit} className="btn btn-primary flex-1">Save land</button>
          </div>
        </div>
      </Modal>

      {/* ------------------------------------------------------- pickers */}
      <LocationPickerModal
        open={picker !== null}
        onClose={() => setPicker(null)}
        title={picker?.kind === 'land' ? `📍 Farm location — ${list.find((l) => l.id === picker.id)?.name ?? ''}` : '📍 New land location'}
        initial={
          picker?.kind === 'land'
            ? (pins[picker.id] ? { lat: pins[picker.id]!.lat, lng: pins[picker.id]!.lng } : list.find((l) => l.id === picker.id)?.coords ?? null)
            : formLoc ? { lat: formLoc.lat, lng: formLoc.lng } : null
        }
        onConfirm={(loc) => {
          if (picker?.kind === 'form') setFormLoc(loc)
          else if (picker?.kind === 'land') {
            setFarmLocation(picker.id, { ...loc, savedAt: new Date().toISOString() })
            setPins((p) => ({ ...p, [picker.id]: { ...loc, savedAt: new Date().toISOString() } }))
          }
          setPicker(null)
        }}
      />
    </div>
  )
}

/* ================================================================ land card */

function LandCard({
  land, index, photo, pinned, onView, onMap,
}: {
  land: Land
  index: number
  photo?: string
  pinned: boolean
  onView: () => void
  onMap: () => void
}) {
  const crop = cropOf(land.cropKey)
  const health = healthIndicator(land.health)
  return (
    <Reveal delay={Math.min(index * 0.07, 0.28)}>
      <motion.article
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="group flex h-full flex-col overflow-hidden rounded-4xl border border-line/70 bg-surface shadow-soft transition-shadow duration-300 hover:shadow-lift"
      >
        {/* photo — ~45% of the card */}
        <div className="relative h-44 overflow-hidden sm:h-48">
          <img
            src={photo ?? crop.image}
            alt={`${crop.label} crop growing at ${land.name}, ${land.location}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
          />
          {/* readability gradient */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

          {/* crop badge */}
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-white backdrop-blur-sm">
            {crop.icon} {crop.label}
          </span>
          {/* health indicator */}
          <span className={cn('absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm', health.cls)}>
            {health.icon} {health.label}
          </span>

          {/* hover-revealed crop info */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-3.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="text-[11px] font-semibold text-white/95">
              {land.stage} · {land.health}% healthy · {crop.blurb}
            </p>
          </div>

          {/* name over gradient */}
          <div className="absolute inset-x-0 bottom-0 p-3.5">
            <h3 className="font-display text-lg font-black leading-tight text-white drop-shadow">{land.name}</h3>
            <p className="text-[11px] font-semibold text-white/85">{crop.icon} {land.crop}</p>
          </div>
          {photo && (
            <span className="absolute bottom-3 right-3 rounded-full bg-black/45 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
              📷 Your photo
            </span>
          )}
        </div>

        {/* body */}
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-muted">
            <span className="truncate">📍 {land.location}</span>
            <span className="shrink-0 tabular-nums">{land.acres} Acres</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl bg-leaf-50 px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-faint">Crop health</div>
              <div className="mt-0.5 font-extrabold text-ink">🌱 {land.health}%</div>
            </div>
            <div className="rounded-2xl bg-leaf-50 px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wide text-faint">Harvest</div>
              <div className="mt-0.5 font-extrabold text-ink">📅 {land.harvestDays} days</div>
            </div>
          </div>

          <Progress value={land.progress} label={`${land.stage} · growth cycle`} showValue />

          <div className="rounded-2xl border border-gold-400/35 bg-gold-400/10 px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Estimated profit</div>
            <div className="font-display text-lg font-black text-ink">💰 {inr(land.profit)}</div>
            <div className="text-[10px] text-muted">
              {inr(land.investment)} invested → {inr(land.revenue)} expected · estimate, not a guarantee
            </div>
          </div>

          <div className="mt-auto flex gap-2 pt-1">
            <button onClick={onView} className="btn btn-primary btn-sm flex-1">View Land</button>
            <button onClick={onMap} className="btn btn-ghost btn-sm flex-1" aria-label={`View ${land.name} on map`}>
              📍 Map {pinned && <span className="text-leaf-600">•</span>}
            </button>
          </div>
        </div>
      </motion.article>
    </Reveal>
  )
}

/* ============================================================ land dashboard */

function LandDashboard({
  land, photo, pin, onClose, onChangePin,
}: {
  land: Land | null
  photo?: string
  pin?: StoredLocation
  onClose: () => void
  onChangePin: (id: string) => void
}) {
  const activities = useMemo(() => (land ? activitiesFor(land) : []), [land])
  if (!land) return null
  const crop = cropOf(land.cropKey)
  const health = healthIndicator(land.health)
  const market = marketRows.find((m) => m.crop === crop.market)
  const relevant = schemes.filter((s) => s.sectors.includes('Crop')).slice(0, 3)
  const coords = pin ? { lat: pin.lat, lng: pin.lng } : land.coords

  return (
    <Modal open={!!land} onClose={onClose} title={`${land.name} — Land Dashboard`} wide>
      <div className="space-y-4">
        {/* hero photo */}
        <div className="relative h-52 overflow-hidden rounded-3xl sm:h-60">
          <img src={photo ?? crop.image} alt={`${crop.label} field at ${land.name}`} className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-xs font-black uppercase tracking-wide text-white backdrop-blur-sm">
            {crop.icon} {crop.label}
          </span>
          <span className={cn('absolute right-4 top-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold backdrop-blur-sm', health.cls)}>
            {health.icon} {health.label} · {land.health}%
          </span>
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="font-display text-2xl font-black text-white drop-shadow">{land.name}</h3>
            <p className="text-sm font-semibold text-white/90">
              {land.crop} · 📍 {pin ? pin.address : land.location} · {land.acres} acres
            </p>
          </div>
        </div>

        {/* key facts */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Tile k="Planting date" v={fmt(land.planted)} />
          <Tile k="Expected harvest" v={`${fmt(land.harvest)} · ${land.harvestDays}d`} />
          <Tile k="Soil" v={land.soil} />
          <Tile k="Irrigation" v={land.irrigation} />
        </div>

        <Progress value={land.progress} label={`${land.stage} · growth cycle`} showValue />

        {/* finance + weather */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-line/70 bg-surface p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-faint">Finance (estimated)</h4>
            <div className="mt-2 space-y-1.5 text-sm">
              <Row k="Investment" v={inr(land.investment)} />
              <Row k="Expected revenue" v={inr(land.revenue)} />
              <div className="flex items-center justify-between border-t border-line/60 pt-1.5 font-black">
                <span>Profit / Loss</span>
                <span className={land.profit >= 0 ? 'text-leaf-600' : 'text-red-500'}>
                  {land.profit >= 0 ? '+' : '−'}{inr(Math.abs(land.profit))}
                </span>
              </div>
            </div>
            <p className="mt-2 text-[10px] leading-snug text-faint">
              ◆ Demo estimates for the hackathon — not guaranteed returns.
            </p>
          </div>

          <div className="rounded-3xl border border-line/70 bg-surface p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-faint">Weather here</h4>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-3xl" aria-hidden>{weather.now.icon}</span>
              <div>
                <div className="font-display text-xl font-black">{weather.now.temp}°C</div>
                <div className="text-[11px] text-muted">{weather.now.condition} · {weather.now.humidity}% humidity · rain {weather.now.rain}%</div>
              </div>
            </div>
            <p className="mt-2 rounded-xl bg-leaf-50 px-3 py-2 text-[11px] font-semibold text-ink">💡 {weather.advice}</p>
            <div className="mt-2 flex gap-1.5">
              {weather.forecast.slice(0, 4).map((f) => (
                <span key={f.day} className="flex-1 rounded-xl bg-line/25 px-1 py-1.5 text-center text-[10px] font-bold text-muted">
                  {f.icon}<br />{f.day} {f.rain}%
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* market + schemes + AI */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-line/70 bg-surface p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-faint">Market price</h4>
            {market ? (
              <>
                <div className="mt-1.5 font-display text-lg font-black">{inr(market.price)}<span className="text-xs font-semibold text-muted"> / {market.unit}</span></div>
                <p className="text-[11px] text-muted">{market.crop} · {market.market}</p>
                <Link href="/market" className="btn btn-quiet btn-sm mt-2 w-full">📈 Market Intelligence</Link>
              </>
            ) : (
              <p className="mt-2 text-[11px] text-muted">No mandi row tracked for {crop.label} yet.</p>
            )}
          </div>

          <div className="rounded-3xl border border-line/70 bg-surface p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-faint">Government schemes</h4>
            <ul className="mt-1.5 space-y-1">
              {relevant.map((s) => (
                <li key={s.id} className="truncate text-[11px] font-semibold text-ink">• {s.name}</li>
              ))}
            </ul>
            <Link href="/schemes" className="btn btn-quiet btn-sm mt-2 w-full">🏛️ See schemes</Link>
          </div>

          <div className="rounded-3xl border border-line/70 bg-surface p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-faint">AI Crop Doctor</h4>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
              Upload a leaf photo from this land for an AI-assisted health check.
            </p>
            <Link href="/crop-doctor" className="btn btn-primary btn-sm mt-2 w-full">🤖 Run check</Link>
          </div>
        </div>

        {/* activities */}
        <div className="rounded-3xl border border-line/70 bg-surface p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-faint">Recent activities</h4>
          <ul className="mt-2 space-y-2">
            {activities.map((a) => (
              <li key={a.when} className="flex items-start gap-2.5 text-xs">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-leaf-50" aria-hidden>{a.icon}</span>
                <span className="flex-1">
                  <span className="font-semibold text-ink">{a.what}</span>
                  <span className="block text-[10px] text-faint">{a.when}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* actions */}
        <div className="flex flex-wrap gap-2">
          <Link href={`/map?focus=land-${land.id}`} className="btn btn-primary btn-sm">📍 View on Map</Link>
          <a href={directionsUrl(farmer.coords, coords)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">🧭 Directions ({formatKm(haversineKm(farmer.coords, coords))})</a>
          <button onClick={() => onChangePin(land.id)} className="btn btn-ghost btn-sm">📍 Change pin</button>
          <Link href="/finance" className="btn btn-quiet btn-sm">💰 Costs</Link>
          <Link href="/weather" className="btn btn-quiet btn-sm">🌦️ Weather</Link>
        </div>
      </div>
    </Modal>
  )
}

function Tile({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-2xl bg-leaf-50 px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-wide text-faint">{k}</div>
      <div className="mt-0.5 truncate text-xs font-extrabold text-ink">{v}</div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{k}</span>
      <span className="font-bold tabular-nums">{v}</span>
    </div>
  )
}

function fmt(d: string) {
  const date = new Date(d)
  return Number.isNaN(date.getTime()) ? d : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function activitiesFor(l: Land) {
  return [
    { icon: '💧', what: `Irrigation cycle completed (${l.irrigation.toLowerCase()})`, when: '2 days ago' },
    { icon: '🧪', what: 'Urea top dressing — 40 kg/acre', when: '6 days ago' },
    { icon: '🛰️', what: 'Field scout: no pest pressure observed', when: '9 days ago' },
    { icon: '📷', what: 'Crop photo updated from the field', when: '12 days ago' },
  ]
}
