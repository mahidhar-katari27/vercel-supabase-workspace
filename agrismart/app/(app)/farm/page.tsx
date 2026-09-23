'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Card, Chip, DemoTag, Modal, PageHeader, Progress, Reveal, spring } from '@/components/ui'
import MapCanvas from '@/components/maps/MapCanvas'
import LocationPickerModal from '@/components/maps/LocationPickerModal'
import NearbyServices from '@/components/maps/NearbyServices'
import type { MapMarker } from '@/components/maps/types'
import { categoryColor } from '@/lib/googleMaps'
import { directionsUrl } from '@/lib/geo'
import { getFarmLocation, setFarmLocation, type StoredLocation } from '@/lib/places'
import { farmer, irrigationTypes, lands, soilTypes, type Land } from '@/lib/data'
import { cn } from '@/lib/utils'

const empty = {
  name: '', location: '', acres: '', soil: soilTypes[0]!, irrigation: irrigationTypes[0]!,
  crop: '', planted: '', harvest: '',
}

export default function FarmPage() {
  const [list, setList] = useState<Land[]>(lands)
  const [selected, setSelected] = useState<string>(lands[0]!.id)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [err, setErr] = useState<string | null>(null)
  const [pins, setPins] = useState<Record<string, StoredLocation>>({})
  const [picker, setPicker] = useState(false)

  // Stored farm pins survive reloads (demo persistence until Supabase tables exist).
  useEffect(() => {
    const next: Record<string, StoredLocation> = {}
    for (const l of list) {
      const got = getFarmLocation(l.id)
      if (got) next[l.id] = got
    }
    setPins(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const active = list.find((l) => l.id === selected) ?? list[0]!
  const totalAcres = list.reduce((a, l) => a + l.acres, 0)

  const set = (k: keyof typeof empty, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = () => {
    if (!form.name.trim()) return setErr('Land name is required')
    const acres = parseFloat(form.acres)
    if (!acres || acres <= 0) return setErr('Enter a land size greater than 0')
    if (!form.location.trim()) return setErr('Location is required')
    if (!form.crop.trim()) return setErr('Crop is required')
    setErr(null)
    const id = `land-${String(list.length + 1).padStart(2, '0')}`
    setList((prev) => [
      ...prev,
      {
        id, name: form.name.trim(), location: form.location.trim(), acres,
        soil: form.soil, irrigation: form.irrigation, crop: form.crop.trim(),
        planted: form.planted || '2026-09-23', harvest: form.harvest || '2027-01-20',
        stage: 'Sowing', progress: 6, health: 90,
        coords: { lat: farmer.coords.lat + (list.length * 0.06) - 0.06, lng: farmer.coords.lng + (list.length * 0.05) },
      },
    ])
    setSelected(id)
    setForm(empty)
    setOpen(false)
  }

  const farmMarkers: MapMarker[] = [
    ...list.map((l) => ({
      id: l.id,
      lat: pins[l.id]?.lat ?? l.coords.lat,
      lng: pins[l.id]?.lng ?? l.coords.lng,
      icon: '🌾', color: categoryColor.farm,
      label: `${l.name} · ${l.crop}`, sub: `${l.acres} acres`,
      active: l.id === selected,
    })),
    ...(pins[selected]
      ? [{ id: 'pin', lat: pins[selected]!.lat, lng: pins[selected]!.lng, icon: '📍', color: categoryColor.user, label: 'Farm pin', variant: 'user' as const }]
      : []),
  ]

  return (
    <div className="section">
      <PageHeader
        icon="🌾"
        title="My Farm"
        sub={`${list.length} land profiles · ${totalAcres.toFixed(1)} acres · ${farmer.season}`}
        tag={<DemoTag />}
      >
        <div className="flex flex-wrap gap-2.5">
          <button onClick={() => setOpen(true)} className="btn btn-primary">+ Add New Land</button>
          <button onClick={() => setPicker(true)} className="btn btn-ghost">📍 Select Farm Location</button>
          <Link href="/planner" className="btn btn-ghost">🗓️ Crop Planner</Link>
          <Link href="/finance" className="btn btn-ghost">💰 Farm Finance</Link>
        </div>
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        {/* ------------------------------------------------------- land list */}
        <div className="space-y-4">
          {list.map((l, i) => {
            const on = l.id === selected
            return (
              <Reveal key={l.id} delay={i * 0.06}>
                <button
                  onClick={() => setSelected(l.id)}
                  aria-pressed={on}
                  className={cn(
                    'card w-full p-0 text-left transition-all duration-300',
                    on ? 'border-leaf-400/60 shadow-glow' : 'card-hover',
                  )}
                >
                  <div className="flex flex-col gap-4 p-5 sm:flex-row">
                    {/* crop stage art */}
                    <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-2xl border border-line/60 bg-gradient-to-b from-leaf-400/10 to-earth-300/10 sm:h-auto sm:w-28">
                      <StageArt progress={l.progress} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h2 className="font-display text-lg font-black leading-tight">{l.name}</h2>
                          <p className="text-xs text-muted">📍 {l.location}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Chip tone={l.health >= 85 ? 'live' : 'demo'}>{l.health}% healthy</Chip>
                          {pins[l.id] && <Chip tone="ok" icon="📍">Pinned</Chip>}
                          {on && <Chip tone="info">Selected</Chip>}
                        </div>
                      </div>

                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                        <Field k="Area" v={`${l.acres} Acres`} />
                        <Field k="Crop" v={l.crop} />
                        <Field k="Soil" v={l.soil} />
                        <Field k="Irrigation" v={l.irrigation} />
                        <Field k="Planted" v={fmt(l.planted)} />
                        <Field k="Expected harvest" v={fmt(l.harvest)} />
                      </dl>

                      <div className="mt-3">
                        <Progress value={l.progress} label={`${l.stage} · growth cycle`} showValue />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link href={`/map?focus=land-${l.id}`} onClick={(e) => e.stopPropagation()} className="btn btn-ghost btn-sm">📍 View Location</Link>
                        <a href={directionsUrl(pins[l.id] ?? l.coords, pins[l.id] ?? l.coords)} onClick={(e) => e.stopPropagation()} target="_blank" rel="noopener noreferrer" className="btn btn-quiet btn-sm">🧭 Directions</a>
                        <Link href="/crop-doctor" onClick={(e) => e.stopPropagation()} className="btn btn-ghost btn-sm">🤖 Check crop health</Link>
                        <Link href="/weather" onClick={(e) => e.stopPropagation()} className="btn btn-quiet btn-sm">🌦️ Weather here</Link>
                        <Link href="/finance" onClick={(e) => e.stopPropagation()} className="btn btn-quiet btn-sm">💰 Costs</Link>
                      </div>
                    </div>
                  </div>
                </button>
              </Reveal>
            )
          })}

          <Reveal delay={0.2}>
            <button onClick={() => setOpen(true)}
              className="card card-hover flex w-full items-center justify-center gap-2 border-2 border-dashed !border-line p-6 text-sm font-bold text-muted transition-colors hover:text-ink">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-leaf-400/10" aria-hidden>+</span>
              Add New Land
            </button>
          </Reveal>
        </div>

        {/* ----------------------------------------------------------- map */}
        <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <Reveal delay={0.1}>
            <Card>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold">Farm locations</h2>
                <Link href="/map" className="text-xs font-bold text-leaf-600 dark:text-leaf-400">Smart Map →</Link>
              </div>
              <MapCanvas
                center={pins[selected]?.lat != null ? { lat: pins[selected]!.lat, lng: pins[selected]!.lng } : active.coords}
                zoomKm={26}
                height={300}
                selectedId={selected}
                onSelect={(id) => setSelected(id)}
                markers={farmMarkers}
              />
              {pins[selected] && (
                <p className="mt-2 rounded-xl bg-leaf-50 px-3 py-2 text-[11px] font-semibold text-ink">
                  📍 {pins[selected]!.address}{' '}
                  <span className="font-mono text-faint">({pins[selected]!.lat.toFixed(4)}, {pins[selected]!.lng.toFixed(4)})</span>
                </p>
              )}
              <ul className="mt-3 space-y-1.5">
                {list.map((l) => (
                  <li key={l.id}>
                    <button onClick={() => setSelected(l.id)}
                      className={cn('flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs transition-colors',
                        selected === l.id ? 'bg-leaf-400/10 font-bold text-ink' : 'text-muted hover:bg-line/30')}>
                      <span className="truncate">🌾 {l.name} — {l.crop}</span>
                      <span className="shrink-0 tabular-nums">{l.acres} ac</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>

          <Reveal delay={0.16}>
            <Card>
              <h2 className="mb-3 text-sm font-bold">Soil &amp; irrigation summary</h2>
              <div className="space-y-3">
                {['Soil types in use', 'Irrigation methods'].map((label, li) => {
                  const key = li === 0 ? 'soil' : 'irrigation'
                  const counts = list.reduce<Record<string, number>>((acc, l) => {
                    const v = l[key]
                    acc[v] = (acc[v] ?? 0) + 1
                    return acc
                  }, {})
                  return (
                    <div key={label}>
                      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-faint">{label}</p>
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
      </div>

      <div className="mt-8">
        <NearbyServices
          categories={['machinery', 'market', 'vet', 'office', 'storage']}
          origin={pins[selected] ? { lat: pins[selected]!.lat, lng: pins[selected]!.lng } : active.coords}
          originLabel={active.name}
          icon="🧭"
          title="Services near this farm"
          subtitle="Machinery, markets, vets, offices and storage within reach of the selected land"
          limit={6}
        />
      </div>

      <LocationPickerModal
        open={picker}
        onClose={() => setPicker(false)}
        title={`📍 Farm location — ${active.name}`}
        initial={pins[selected] ? { lat: pins[selected]!.lat, lng: pins[selected]!.lng } : active.coords}
        onConfirm={(loc) => {
          const stored: StoredLocation = { lat: loc.lat, lng: loc.lng, address: loc.address, savedAt: new Date().toISOString() }
          setFarmLocation(selected, stored)
          setPins((p) => ({ ...p, [selected]: stored }))
          setPicker(false)
        }}
      />

      {/* ------------------------------------------------- add land modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add new land" wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <L label="Land name *" hint="e.g. Land 04">
            <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Land 04" />
          </L>
          <L label="Location *" hint="Village, mandal or town">
            <input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Vijayawada" />
          </L>
          <L label="Land size (acres) *">
            <input className="input" type="number" min="0.1" step="0.1" value={form.acres}
              onChange={(e) => set('acres', e.target.value)} placeholder="2.5" />
          </L>
          <L label="Soil type">
            <select className="input" value={form.soil} onChange={(e) => set('soil', e.target.value)}>
              {soilTypes.map((s) => <option key={s}>{s}</option>)}
            </select>
          </L>
          <L label="Irrigation type">
            <select className="input" value={form.irrigation} onChange={(e) => set('irrigation', e.target.value)}>
              {irrigationTypes.map((s) => <option key={s}>{s}</option>)}
            </select>
          </L>
          <L label="Crop *">
            <input className="input" value={form.crop} onChange={(e) => set('crop', e.target.value)} placeholder="Paddy" />
          </L>
          <L label="Planting date">
            <input className="input" type="date" value={form.planted} onChange={(e) => set('planted', e.target.value)} />
          </L>
          <L label="Expected harvest date">
            <input className="input" type="date" value={form.harvest} onChange={(e) => set('harvest', e.target.value)} />
          </L>
        </div>

        <AnimatePresence>
          {err && (
            <motion.p className="mt-3 rounded-2xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-500"
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {err}
            </motion.p>
          )}
        </AnimatePresence>

        <p className="mt-3 text-xs leading-relaxed text-faint">
          Saved to this browser session only — the prototype has no database write path yet, so
          new lands disappear on refresh.
        </p>

        <div className="mt-5 flex gap-2.5">
          <button onClick={submit} className="btn btn-primary flex-1">Save land</button>
          <button onClick={() => setOpen(false)} className="btn btn-ghost">Cancel</button>
        </div>
      </Modal>
    </div>
  )
}

function L({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-faint">{hint}</span>}
    </label>
  )
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-faint">{k}</dt>
      <dd className="truncate text-sm font-semibold">{v}</dd>
    </div>
  )
}

function fmt(d: string) {
  const date = new Date(d)
  return Number.isNaN(date.getTime()) ? d : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StageArt({ progress }: { progress: number }) {
  const h = 8 + (progress / 100) * 40
  return (
    <svg viewBox="0 0 110 96" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
      <rect x="0" y="62" width="110" height="34" fill="#6f5235" opacity="0.4" />
      {Array.from({ length: 5 }, (_, i) => {
        const x = 14 + i * 21
        return (
          <g key={i} style={{ animation: `sway ${4 + i}s ease-in-out ${i * 0.2}s infinite`, transformOrigin: `${x}px 64px` }}>
            <line x1={x} y1={64} x2={x} y2={64 - h} stroke="#22965c" strokeWidth="2.4" strokeLinecap="round" />
            <ellipse cx={x - 5} cy={64 - h * 0.55} rx="5" ry="2.4" fill="#4bb37c" transform={`rotate(-30 ${x - 5} ${64 - h * 0.55})`} />
            <ellipse cx={x + 5} cy={64 - h * 0.78} rx="5" ry="2.4" fill="#7fcfa4" transform={`rotate(30 ${x + 5} ${64 - h * 0.78})`} />
            {progress > 65 && <circle cx={x} cy={64 - h} r="3" fill="#d4a537" />}
          </g>
        )
      })}
    </svg>
  )
}
