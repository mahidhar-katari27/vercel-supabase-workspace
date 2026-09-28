'use client'

import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, Chip, DemoTag, Modal, PageHeader, Reveal, spring, Stepper } from '@/components/ui'
import { categories, listings, type Listing } from '@/lib/data'
import { cn, inr } from '@/lib/utils'
import LocationPickerModal from '@/components/maps/LocationPickerModal'
import { geoForListing, getListingLocation, setListingLocation } from '@/lib/places'
import { directionsUrl, formatKm, haversineKm } from '@/lib/geo'
import { farmer } from '@/lib/data'

const sorts = [
  { id: 'popular', label: 'Most trusted' },
  { id: 'low', label: 'Price: low → high' },
  { id: 'high', label: 'Price: high → low' },
  { id: 'rating', label: 'Top rated' },
] as const

const units = ['Quintal', 'Kg', 'Bag', 'Litre', 'Piece', 'Tonne']

/** User-created listings reuse the Listing shape; `mine` flags them as yours. */
type Row = Listing & { mine?: boolean; description?: string }

const emptyListing = {
  name: '', category: categories[0]!.id, price: '', unit: 'Quintal', qty: '',
  location: 'Vijayawada', contact: '', description: '',
}

export default function MarketplacePage() {
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<(typeof sorts)[number]['id']>('popular')
  const [sell, setSell] = useState(false)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(emptyListing)
  const [mine, setMine] = useState<Row[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [contact, setContact] = useState<Row | null>(null)
  const [draftLoc, setDraftLoc] = useState<{ lat: number; lng: number; address: string } | null>(null)
  const [pickLoc, setPickLoc] = useState(false)
  const [storedLocs, setStoredLocs] = useState<Record<string, { lat: number; lng: number; address: string }>>({})

  useEffect(() => {
    const next: Record<string, { lat: number; lng: number; address: string }> = {}
    for (const l of listings) {
      const got = getListingLocation(l.id)
      if (got) next[l.id] = got
    }
    setStoredLocs(next)
  }, [])

  const catLabel = (id: string) => categories.find((c) => c.id === id)?.label ?? id
  const catIcon = (id: string) => categories.find((c) => c.id === id)?.icon ?? '🛍️'

  const items = useMemo(() => {
    const all: Row[] = [...mine, ...listings]
    return all
      .filter((p) => cat === 'all' || p.category === cat)
      .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.seller.toLowerCase().includes(q.toLowerCase()) || p.location.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => {
        if (sort === 'low') return a.price - b.price
        if (sort === 'high') return b.price - a.price
        if (sort === 'rating') return b.rating - a.rating
        return Number(b.verified) - Number(a.verified) || b.rating - a.rating
      })
  }, [cat, q, sort, mine])

  const set = (k: keyof typeof emptyListing, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const nextStep = () => {
    if (step === 0 && !form.name.trim()) return setErr('Give your listing a title')
    if (step === 1) {
      const p = parseFloat(form.price)
      if (!p || p <= 0) return setErr('Enter a price above zero')
      if (!form.qty.trim()) return setErr('Enter the quantity available')
    }
    if (step === 2 && form.contact.trim().length < 6) return setErr('Enter a contact number or email')
    setErr(null)
    if (step < 2) return setStep(step + 1)

    const newId = `user-${Date.now()}`
    if (draftLoc) {
      setListingLocation(newId, { ...draftLoc, savedAt: new Date().toISOString() })
      setStoredLocs((m) => ({ ...m, [newId]: draftLoc }))
    }
    setMine((l) => [
      {
        id: newId,
        name: form.name.trim(),
        category: form.category,
        price: parseFloat(form.price),
        unit: form.unit,
        qty: form.qty.trim(),
        location: form.location.trim(),
        seller: 'You',
        rating: 0,
        hue: 140,
        verified: false,
        mine: true,
        description: form.description.trim(),
      },
      ...l,
    ])
    setSell(false); setStep(0); setForm(emptyListing); setDraftLoc(null)
  }

  return (
    <div className="section">
      <PageHeader
        icon="🛒"
        title="Farmer Marketplace"
        sub={`${categories.length} categories · buy inputs, sell produce.`}
        tag={<DemoTag />}
      >
        <div className="flex flex-wrap gap-2.5">
          <button onClick={() => setSell(true)} className="btn btn-primary">+ Sell on Marketplace</button>
          <Link href="/market" className="btn btn-ghost">📈 Today&rsquo;s prices</Link>
        </div>
      </PageHeader>

      <div className="mb-5 rounded-3xl border border-gold-400/35 bg-gold-400/10 p-4 text-sm leading-relaxed text-muted">
        <p className="mb-1 font-bold text-gold-600 dark:text-gold-400">◆ Sample listings — no real sellers</p>
        Every product, price and seller below is invented for the demo. Nothing is ordered, no payment
        is taken and no seller is contacted when you click through.
      </div>

      {/* ------------------------------------------------------- categories */}
      <div className="mb-5 flex gap-2.5 overflow-x-auto pb-1.5">
        {[{ id: 'all', icon: '🛍️', label: 'All' }, ...categories].map((c, i) => {
          const count = c.id === 'all' ? listings.length : listings.filter((p) => p.category === c.id).length
          const on = cat === c.id
          return (
            <motion.button key={c.id} onClick={() => setCat(c.id)}
              className={cn('shrink-0 rounded-2xl border px-3.5 py-2.5 text-center transition-all',
                on ? 'border-leaf-400/70 bg-leaf-gradient text-white shadow-glow' : 'border-line/70 hover:border-line')}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: i * 0.025 }}
              aria-pressed={on}>
              <span className="block text-lg leading-none" aria-hidden>{c.icon}</span>
              <span className="mt-1 block text-xs font-bold">{c.label}</span>
              <span className={cn('text-[10px] font-semibold', on ? 'opacity-80' : 'text-faint')}>{count}</span>
            </motion.button>
          )
        })}
      </div>

      {/* --------------------------------------------------------- controls */}
      <Card className="mb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input className="input sm:max-w-xs" placeholder="Search products, sellers, towns…"
            value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search marketplace" />
          <div className="flex flex-wrap gap-1.5 sm:ml-auto">
            {sorts.map((s) => (
              <button key={s.id} onClick={() => setSort(s.id)}
                className={cn('rounded-full px-3 py-1.5 text-xs font-bold transition-all',
                  sort === s.id ? 'bg-ink text-bg' : 'bg-line/40 text-muted hover:bg-line/70')}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ----------------------------------------------------------- grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {items.map((p, i) => (
          <Reveal key={p.id} delay={Math.min(i * 0.03, 0.25)}>
            <motion.article className="card card-hover flex h-full flex-col !p-0" whileHover={{ y: -3 }}>
              <div className="relative h-28 overflow-hidden rounded-t-[26px]">
                <ProduceArt hue={p.hue} icon={catIcon(p.category)} />
                {p.mine ? (
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-sky-400 px-2 py-0.5 text-[10px] font-black text-white shadow-soft">
                    Your listing
                  </span>
                ) : p.verified ? (
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-leaf-gradient px-2 py-0.5 text-[10px] font-black text-white shadow-soft">
                    ✓ Verified
                  </span>
                ) : null}
                <span className="absolute right-2.5 top-2.5 rounded-full bg-surface/90 px-2 py-0.5 text-[10px] font-bold text-muted backdrop-blur-sm">
                  {catLabel(p.category)}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-display font-bold leading-tight">{p.name}</h3>
                {p.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{p.description}</p>}
                <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-xs text-faint">
                  <span>🧑‍🌾 {p.seller}</span>
                  <span aria-hidden>·</span>
                  <span>📍 {p.location}</span>
                </p>
                {(() => {
                  const g = storedLocs[p.id]
                    ? { coords: { lat: storedLocs[p.id]!.lat, lng: storedLocs[p.id]!.lng }, address: storedLocs[p.id]!.address }
                    : geoForListing(p.id, p.location)
                  const km = haversineKm(farmer.coords, g.coords)
                  return (
                    <div className="mt-2 rounded-xl bg-leaf-50 px-2.5 py-2">
                      <p className="truncate text-[11px] font-semibold text-ink">
                        📍 Seller location · {formatKm(km)} away
                      </p>
                      <div className="mt-1.5 flex gap-1.5">
                        <Link href={`/map?lat=${g.coords.lat}&lng=${g.coords.lng}&label=${encodeURIComponent(p.seller + ' — ' + p.name)}`}
                          className="flex min-h-[34px] flex-1 items-center justify-center rounded-lg border border-line/70 bg-surface px-2 text-center text-[10px] font-bold text-ink hover:border-leaf-500 hover:text-leaf-700">
                          View on Map
                        </Link>
                        <Link href={`/map?lat=${g.coords.lat}&lng=${g.coords.lng}&label=${encodeURIComponent(p.name)}&route=1`}
                          className="flex min-h-[34px] flex-1 items-center justify-center rounded-lg border border-line/70 bg-surface px-2 text-center text-[10px] font-bold text-ink hover:border-leaf-500 hover:text-leaf-700">
                          🧭 Directions
                        </Link>
                        <a href={directionsUrl(farmer.coords, g.coords)} target="_blank" rel="noopener noreferrer"
                          aria-label={`Open ${p.name} seller location in Google Maps`}
                          className="rounded-lg border border-line/70 bg-surface px-2 py-1 text-[10px] font-bold text-ink hover:border-leaf-500">↗</a>
                      </div>
                    </div>
                  )
                })()}

                <div className="mt-3 flex items-end justify-between gap-2">
                  <div>
                    <p className="font-display text-xl font-black leading-none tabular-nums">{inr(p.price)}</p>
                    <p className="text-[11px] text-muted">per {p.unit.toLowerCase()}</p>
                  </div>
                  <div className="text-right text-[11px]">
                    {p.rating > 0 ? (
                      <><span className="font-black text-gold-500">{p.rating}★</span>
                        <span className="mt-0.5 block text-faint">{p.qty} available</span></>
                    ) : (
                      <><span className="font-bold text-sky-500">New</span>
                        <span className="mt-0.5 block text-faint">{p.qty}</span></>
                    )}
                  </div>
                </div>

                <div className="mt-3.5 flex gap-2 pt-1">
                  <button onClick={() => setContact(p)} className="btn btn-primary btn-sm flex-1">Contact Seller</button>
                  <Link href="/community" className="btn btn-quiet btn-sm" aria-label={`Ask about ${p.name}`}>Ask</Link>
                </div>
              </div>
            </motion.article>
          </Reveal>
        ))}
      </div>

      {items.length === 0 && (
        <Card className="grid place-items-center py-16 text-center">
          <p className="text-sm text-muted">Nothing matches that search in this category.</p>
          <button onClick={() => { setQ(''); setCat('all') }} className="btn btn-ghost btn-sm mt-3">Clear filters</button>
        </Card>
      )}

      {/* --------------------------------------------------------- contact */}
      <Modal open={!!contact} onClose={() => setContact(null)} title={contact?.name ?? ''}>
        {contact && (
          <>
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-line/60 bg-surface/50 p-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl">
                <ProduceArt hue={contact.hue} icon={catIcon(contact.category)} small />
              </span>
              <div className="min-w-0">
                <p className="font-display text-lg font-black leading-none">
                  {inr(contact.price)} <span className="text-xs font-semibold text-muted">per {contact.unit.toLowerCase()}</span>
                </p>
                <p className="mt-1 truncate text-xs text-muted">{contact.seller} · {contact.location}</p>
                <p className="text-xs text-faint">{contact.qty} available</p>
              </div>
            </div>

            {contact.description && <p className="text-sm leading-relaxed text-muted">{contact.description}</p>}

            {contact.rating > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="font-black text-gold-500">{contact.rating}★</span>
                <span className="text-muted">seller rating</span>
                {contact.verified && <Chip tone="live">Verified</Chip>}
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-gold-400/35 bg-gold-400/10 p-3.5 text-xs leading-relaxed text-muted">
              ◆ Contact details are hidden in the demo. A live marketplace would show the seller&rsquo;s
              verified phone number here, plus in-app chat, transport quotes and a payment escrow option.
            </div>

            <div className="mt-5 flex gap-2.5">
              <button onClick={() => setContact(null)} className="btn btn-primary flex-1">Got it</button>
              <Link href="/market" onClick={() => setContact(null)} className="btn btn-ghost">Compare prices</Link>
            </div>
          </>
        )}
      </Modal>

      {/* ------------------------------------------------------------ sell */}
      <Modal open={sell} onClose={() => setSell(false)} title="Sell on Marketplace" wide>
        <Stepper steps={['Product', 'Price', 'Contact']} current={step} onStep={(i) => i < step && setStep(i)} />

        <div className="mt-5">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="label">What are you selling? *</span>
                <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)}
                  placeholder="Sona Masoori paddy — cleaned and bagged" />
              </label>
              <label className="block">
                <span className="label">Category *</span>
                <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="label">Location *</span>
                <input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} />
              </label>
              <div className="block sm:col-span-2">
                <span className="label">Product location (pin on map)</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setPickLoc(true)} className="btn btn-ghost btn-sm">
                    📍 {draftLoc ? 'Change pin' : 'Pick product location'}
                  </button>
                  {draftLoc ? (
                    <span className="rounded-xl bg-leaf-50 px-3 py-1.5 text-[11px] font-semibold text-ink">
                      {draftLoc.address} <span className="font-mono text-faint">({draftLoc.lat.toFixed(4)}, {draftLoc.lng.toFixed(4)})</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-faint">Optional — buyers see “View on Map” and “Directions” when pinned.</span>
                  )}
                </div>
              </div>
              <label className="block sm:col-span-2">
                <span className="label">Description</span>
                <textarea className="input min-h-[90px]" value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Variety, grade, moisture level, harvest date, whether cleaned and bagged…" />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="label">Price (₹) *</span>
                <input className="input" type="number" min="0" value={form.price}
                  onChange={(e) => set('price', e.target.value)} placeholder="2380" />
              </label>
              <label className="block">
                <span className="label">Per</span>
                <select className="input" value={form.unit} onChange={(e) => set('unit', e.target.value)}>
                  {units.map((u) => <option key={u}>{u}</option>)}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="label">Quantity available *</span>
                <input className="input" value={form.qty} onChange={(e) => set('qty', e.target.value)}
                  placeholder="40 Quintal" />
              </label>
              <div className="rounded-2xl border border-line/60 bg-surface/50 p-3.5 text-xs leading-relaxed text-muted sm:col-span-2">
                <p className="mb-1 font-bold">💡 Pricing tip</p>
                Check the Market Intelligence page first — a rate close to the prevailing local price
                sells faster than an optimistic one, and holding grain hoping for a rise costs storage
                and moisture loss.
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <label className="block">
                <span className="label">Contact number or email *</span>
                <input className="input" value={form.contact} onChange={(e) => set('contact', e.target.value)}
                  placeholder="+91 …" />
                <span className="mt-1 block text-[11px] text-faint">
                  Kept in this browser session only — never transmitted anywhere.
                </span>
              </label>
              <div className="rounded-2xl border border-line/60 bg-surface/50 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-faint">Preview</p>
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl">
                    <ProduceArt hue={140} icon={catIcon(form.category)} small />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-black">{form.name || 'Untitled listing'}</p>
                    <p className="text-xs text-muted">{catLabel(form.category)} · {form.location}</p>
                    <p className="mt-0.5 font-display text-lg font-black">
                      {form.price ? inr(parseFloat(form.price)) : '₹—'}
                      <span className="text-xs font-semibold text-muted"> per {form.unit.toLowerCase()}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {err && <p className="mt-3 rounded-2xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-500">{err}</p>}

        <div className="mt-5 flex gap-2.5">
          {step > 0 && <button onClick={() => setStep(step - 1)} className="btn btn-ghost">← Back</button>}
          <button onClick={nextStep} className="btn btn-primary flex-1">
            {step === 2 ? 'Publish demo listing' : 'Continue →'}
          </button>
        </div>
      </Modal>

      <LocationPickerModal
        open={pickLoc}
        onClose={() => setPickLoc(false)}
        title="📍 Product location"
        onConfirm={(loc) => { setDraftLoc(loc); setPickLoc(false) }}
      />
    </div>
  )
}

/** Procedural produce tile — tinted by the listing's hue, works with no assets. */
function ProduceArt({ hue, icon, small }: { hue: number; icon: string; small?: boolean }) {
  return (
    <span className="absolute inset-0 grid place-items-center" aria-hidden>
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id={`pa-${hue}-${small ? 's' : 'l'}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`hsl(${hue} 62% 88%)`} />
            <stop offset="55%" stopColor={`hsl(${hue} 48% 76%)`} />
            <stop offset="100%" stopColor={`hsl(${(hue + 30) % 360} 42% 66%)`} />
          </linearGradient>
        </defs>
        <rect width="100" height="60" fill={`url(#pa-${hue}-${small ? 's' : 'l'})`} />
        {/* burlap weave */}
        <g opacity="0.18" stroke={`hsl(${hue} 40% 30%)`} strokeWidth="0.6">
          {Array.from({ length: 9 }, (_, i) => <line key={`h${i}`} x1="0" y1={i * 7} x2="100" y2={i * 7} />)}
          {Array.from({ length: 15 }, (_, i) => <line key={`v${i}`} x1={i * 7} y1="0" x2={i * 7} y2="60" />)}
        </g>
        <ellipse cx="50" cy="52" rx="46" ry="10" fill={`hsl(${hue} 40% 32%)`} opacity="0.18" />
      </svg>
      <span className={cn('relative drop-shadow-sm', small ? 'text-xl' : 'text-4xl')}>{icon}</span>
    </span>
  )
}
