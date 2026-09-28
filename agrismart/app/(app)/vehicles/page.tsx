'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, Chip, DemoTag, Modal, PageHeader, Reveal, spring, Tabs } from '@/components/ui'
import { driverPool, equipmentCategories, farmer, vehicles, type Vehicle } from '@/lib/data'
import { addBooking } from '@/lib/liveStore'
import SmartImage from '@/components/SmartImage'
import { cn, inr, num } from '@/lib/utils'

const TABS = [
  { id: 'buy', label: 'Buy', icon: '🛒' },
  { id: 'rent', label: 'Rent', icon: '🔑' },
  { id: 'driver', label: 'Book a Driver', icon: '🧑‍🔧' },
]

/** Indicative loan maths — flat, illustrative, and clearly labelled as such. */
function emi(principal: number, annualRate: number, months: number) {
  const r = annualRate / 12 / 100
  if (r === 0) return principal / months
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
}

export default function VehiclesPage() {
  const [tab, setTab] = useState('buy')
  const [detail, setDetail] = useState<(typeof vehicles)[number] | null>(null)
  const [down, setDown] = useState('20')
  const [tenure, setTenure] = useState(60)
  const [rate, setRate] = useState(9.5)
  const [bookDriver, setBookDriver] = useState<(typeof driverPool)[number] | null>(null)
  const [days, setDays] = useState(1)
  const [toast, setToast] = useState<string | null>(null)
  const [cat, setCat] = useState('All')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'price-asc' | 'price-desc' | 'name'>('price-asc')

  const list = vehicles
    .filter((v) => (tab === 'rent' ? v.mode === 'Rent' : v.mode === 'Buy'))
    .filter((v) => cat === 'All' || v.category === cat)
    .filter((v) => !q.trim() || (v.name + v.type + v.location + v.owner).toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'price-desc' ? b.price - a.price : a.price - b.price)

  const bookNow = async (v: Vehicle) => {
    const src = await addBooking({
      id: `bk-${Date.now().toString(36)}`, service: `${v.mode} — ${v.name}`, icon: v.icon || '🚜',
      provider: v.owner, date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      time: '09:00', status: 'Pending', amount: v.price, driver: false,
    })
    say(src === 'live' ? `Booking request sent to Supabase — ${v.name}` : `Booking request saved locally (demo) — ${v.name}. View it under Bookings.`)
  }

  const contactOwner = async (v: Vehicle) => {
    const src = await addBooking({
      id: `bk-${Date.now().toString(36)}`, service: `Contact request — ${v.name}`, icon: '📞',
      provider: v.owner, date: new Date().toISOString().slice(0, 10),
      time: '10:00', status: 'Pending', amount: 0, driver: false,
    })
    say(src === 'live' ? `We logged your call-back request for ${v.owner}` : `Call-back request logged (demo) — ${v.owner} will be shown under Bookings.`)
  }

  const price = detail?.price ?? 0
  const downPct = parseFloat(down) || 0
  const loan = Math.max(0, price - (price * downPct) / 100)
  const monthly = emi(loan, rate, tenure)
  const totalPayable = monthly * tenure + (price * downPct) / 100

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(null), 4000) }

  return (
    <div className="section">
      <PageHeader
        icon="🚜"
        title="Farming Equipment"
        sub="Tractors, harvesting, tillage, irrigation, transport and more — rent by the day or buy with illustrative EMI maths."
        tag={<DemoTag />}
      >
        <Tabs tabs={TABS} active={tab} onChange={setTab} className="max-w-md" />
      </PageHeader>

      <div className="mb-5 rounded-3xl border border-gold-400/35 bg-gold-400/10 p-4 text-sm leading-relaxed text-muted">
        <p className="mb-1 font-bold text-gold-600 dark:text-gold-400">◆ Sample inventory, illustrative finance</p>
        No dealer feed is connected. Prices, EMI figures and driver rates are demo values. A real purchase
        needs a dealer quotation, on-road cost, insurance and a lender&rsquo;s sanction letter.
      </div>

      {/* --------------------------------------------------- filter bar */}
      {tab !== 'driver' && (
        <div className="mb-6 space-y-3">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {['All', ...equipmentCategories.map((c) => c.id)].map((c) => (
              <button
                key={c} onClick={() => setCat(c)} aria-pressed={cat === c}
                className={cn(
                  'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all',
                  cat === c ? 'border-ink bg-ink text-bg' : 'border-line/80 bg-surface text-muted hover:border-line',
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search machine, provider or town…"
              aria-label="Search equipment"
              className="flex-1 rounded-2xl border border-line/80 bg-surface px-4 py-2.5 text-sm outline-none transition-all focus:border-leaf-500/60 focus:ring-4 focus:ring-leaf-500/10"
            />
            <select
              value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort equipment"
              className="rounded-2xl border border-line/80 bg-surface px-4 py-2.5 text-sm outline-none focus:border-leaf-500/60"
            >
              <option value="price-asc">Price · low → high</option>
              <option value="price-desc">Price · high → low</option>
              <option value="name">Name · A → Z</option>
            </select>
          </div>
        </div>
      )}

      {/* --------------------------------------------------- buy / rent grid */}
      {tab !== 'driver' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((v, i) => (
            <Reveal key={v.id} delay={Math.min(i, 8) * 0.05}>
              <motion.article className="group card card-hover flex h-full flex-col !p-0 overflow-hidden" whileHover={{ y: -4 }}>
                <div className="relative h-40 overflow-hidden">
                  <SmartImage
                    src={v.image} alt={v.name} ratio="aspect-auto h-40"
                    imgClassName="transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" aria-hidden />
                  <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-sm">
                    {v.category}
                  </span>
                  <Chip tone={v.available ? 'live' : 'demo'} className="absolute right-3 top-3">
                    {v.available ? 'Available' : 'On order'}
                  </Chip>
                  <span className="absolute bottom-3 left-3 text-[11px] font-semibold text-white/85">
                    {v.mode === 'Rent' ? 'Rent / day' : 'Buy'} · {v.type}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display font-bold leading-tight">{v.name}</h3>
                  <p className="mt-1 text-xs text-muted">
                    {v.owner} · 📍 {v.location} · {v.year}
                  </p>

                  <div className="mt-3 flex items-end justify-between gap-2">
                    <div>
                      <p className="font-display text-2xl font-black leading-none tabular-nums">{inr(v.price)}</p>
                      <p className="text-[11px] text-muted">
                        {v.mode === 'Rent' ? 'per day' : 'ex-showroom (demo)'}
                      </p>
                    </div>
                    {v.mode === 'Buy' && (
                      <p className="text-right text-[11px] text-muted">
                        from<br /><span className="font-black text-leaf-600 dark:text-leaf-400">
                          {inr(emi(v.price * 0.8, 9.5, 60))}/mo
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={() => setDetail(v)} className="btn btn-ghost btn-sm">View Details</button>
                    <button onClick={() => bookNow(v)} className="btn btn-primary btn-sm" disabled={!v.available}>
                      {v.available ? 'Book Now' : 'Unavailable'}
                    </button>
                    <button onClick={() => contactOwner(v)} className="btn btn-quiet btn-sm col-span-2">📞 Contact Owner</button>
                  </div>
                </div>
              </motion.article>
            </Reveal>
          ))}
        </div>
      )}

      {tab !== 'driver' && list.length === 0 && (
        <Card className="grid place-items-center py-16 text-center">
          <p className="text-sm text-muted">No {tab === 'rent' ? 'rental' : 'sale'} listings in the demo inventory.</p>
        </Card>
      )}

      {/* ------------------------------------------------------- driver pool */}
      {tab === 'driver' && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {driverPool.map((d, i) => (
              <Reveal key={d.id} delay={i * 0.06}>
                <Card className="h-full">
                  <div className="flex items-start gap-3.5">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-leaf-400/10 font-display text-lg font-black text-leaf-700 dark:text-leaf-300" aria-hidden>
                      {d.name.split(' ').map((w) => w[0]).join('')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-display font-bold">{d.name}</h3>
                        <span className="font-black text-gold-500">{d.rating}★</span>
                      </div>
                      <p className="text-xs text-muted">{d.exp} years experience · 📍 {d.location}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {d.machines.map((m) => <Chip key={m}>{m}</Chip>)}
                      </div>
                      <div className="mt-3 flex items-end justify-between gap-2">
                        <div>
                          <p className="font-display text-xl font-black tabular-nums">{inr(d.dayRate)}</p>
                          <p className="text-[11px] text-muted">per day · {inr(Math.round(d.dayRate / 8))}/hr equivalent</p>
                        </div>
                        <button onClick={() => setBookDriver(d)} className="btn btn-primary btn-sm">Book driver</button>
                      </div>
                    </div>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15}>
            <Card className="mt-4">
              <h3 className="mb-2 text-sm font-bold">Before you hire an operator</h3>
              <ul className="space-y-1.5 text-sm leading-relaxed text-muted">
                <li>• Check the licence class matches the machine — a tractor licence does not cover a combine.</li>
                <li>• Agree who pays for fuel, and what happens if the machine breaks down mid-job.</li>
                <li>• Confirm whether the day rate includes travel to and from your field.</li>
                <li>• Written rates avoid arguments at the end of a long harvest day.</li>
              </ul>
            </Card>
          </Reveal>
        </>
      )}

      {/* -------------------------------------------------- buy / EMI modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ''} wide>
        {detail && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Chip tone="info">{detail.type}</Chip>
              <Chip>{detail.year}</Chip>
              <Chip>{detail.owner}</Chip>
              <Chip tone={detail.available ? 'live' : 'demo'}>{detail.available ? 'Available' : 'On order'}</Chip>
            </div>

            {detail.mode === 'Buy' ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-3 text-sm font-bold">Loan assumptions</h3>
                    <div className="space-y-4">
                      <label className="block">
                        <span className="label">Down payment — {downPct}% ({inr((price * downPct) / 100)})</span>
                        <input type="range" min={10} max={60} step={5} value={downPct}
                          onChange={(e) => setDown(e.target.value)} className="w-full accent-[hsl(150_60%_38%)]" />
                      </label>
                      <label className="block">
                        <span className="label">Tenure — {tenure} months ({(tenure / 12).toFixed(1)} yrs)</span>
                        <input type="range" min={12} max={84} step={12} value={tenure}
                          onChange={(e) => setTenure(Number(e.target.value))} className="w-full accent-[hsl(150_60%_38%)]" />
                      </label>
                      <label className="block">
                        <span className="label">Interest rate — {rate}% p.a.</span>
                        <input type="range" min={7} max={15} step={0.5} value={rate}
                          onChange={(e) => setRate(Number(e.target.value))} className="w-full accent-[hsl(150_60%_38%)]" />
                      </label>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-line/60 bg-surface/50 p-4">
                    <h3 className="mb-3 text-sm font-bold">Indicative numbers</h3>
                    <dl className="space-y-2 text-sm">
                      {[
                        ['Vehicle price', inr(price)],
                        ['Down payment', inr((price * downPct) / 100)],
                        ['Loan amount', inr(Math.round(loan))],
                        ['Monthly instalment', inr(Math.round(monthly))],
                        ['Total you pay', inr(Math.round(totalPayable))],
                        ['Interest over tenure', inr(Math.round(totalPayable - price))],
                      ].map(([k, v], i) => (
                        <div key={k} className={cn('flex items-center justify-between gap-3',
                          i === 3 && 'rounded-xl bg-leaf-400/10 px-2 py-1.5')}>
                          <dt className="text-muted">{k}</dt>
                          <dd className={cn('font-bold tabular-nums', i === 3 && 'font-display text-lg text-leaf-600 dark:text-leaf-400')}>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>

                <p className="mt-4 rounded-2xl border border-gold-400/35 bg-gold-400/10 p-3.5 text-xs leading-relaxed text-muted">
                  ◆ Flat EMI maths on demo inputs. Real loans are usually reducing-balance, and on-road cost
                  adds registration, insurance and dealer charges. Agri-machinery loans may qualify for an
                  interest subvention — check the <Link href="/schemes" className="font-bold underline">Scheme Center</Link>.
                </p>

                <div className="mt-5 flex flex-wrap gap-2.5">
                  <button onClick={() => { say(`Enquiry noted for ${detail.name}. Demo only — no dealer was contacted.`); setDetail(null) }}
                    className="btn btn-primary flex-1">Send demo enquiry</button>
                  <Link href="/agrirent" onClick={() => setDetail(null)} className="btn btn-ghost">Rent instead</Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-muted">
                  This machine is listed for rent at {inr(detail.price)} per day from {detail.owner} in {detail.location}.
                </p>
                <div className="mt-4 rounded-2xl border border-line/60 bg-surface/50 p-4 text-sm">
                  <div className="flex justify-between"><span className="text-muted">Daily rate</span><span className="font-bold">{inr(detail.price)}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Weekly (6 days)</span><span className="font-bold">{inr(detail.price * 6)}</span></div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Link href="/agrirent" onClick={() => setDetail(null)} className="btn btn-primary flex-1">
                    Book through AgriRent →
                  </Link>
                  <button onClick={() => setDetail(null)} className="btn btn-ghost">Close</button>
                </div>
              </>
            )}
          </>
        )}
      </Modal>

      {/* ---------------------------------------------------- driver modal */}
      <Modal open={!!bookDriver} onClose={() => setBookDriver(null)} title={`Book ${bookDriver?.name ?? ''}`}>
        {bookDriver && (
          <>
            <p className="text-sm text-muted">
              {bookDriver.exp} years experience · {bookDriver.rating}★ · operates {bookDriver.machines.join(', ')}.
            </p>
            <label className="mt-4 block">
              <span className="label">Number of days</span>
              <input className="input" type="number" min={1} max={30} value={days}
                onChange={(e) => setDays(Math.max(1, Number(e.target.value)))} />
            </label>
            <div className="mt-3 rounded-2xl border border-line/60 bg-surface/50 p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted">Day rate</span><span className="font-bold">{inr(bookDriver.dayRate)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Days</span><span className="font-bold">{num(days)}</span></div>
              <div className="hairline !my-2" />
              <div className="flex justify-between">
                <span className="font-bold">Estimated total</span>
                <span className="font-display text-xl font-black tabular-nums text-leaf-600 dark:text-leaf-400">
                  {inr(bookDriver.dayRate * days)}
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-faint">
              ◆ Estimate only. Fuel, travel and any machine damage are usually settled separately — agree
              those terms before the job starts.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button onClick={() => { say(`Demo request sent to ${bookDriver.name}. No real message was delivered.`); setBookDriver(null) }}
                className="btn btn-primary flex-1">Send demo request</button>
              <button onClick={() => setBookDriver(null)} className="btn btn-ghost">Cancel</button>
            </div>
          </>
        )}
      </Modal>

      <motion.div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 sm:bottom-8"
        initial={false} animate={{ opacity: toast ? 1 : 0, y: toast ? 0 : 16 }} transition={spring} aria-live="polite">
        {toast && (
          <div className="pointer-events-auto max-w-md rounded-2xl border border-leaf-400/40 bg-surface/95 px-4 py-3 text-sm font-semibold shadow-lift backdrop-blur-xl">
            ✓ {toast}
          </div>
        )}
      </motion.div>

      <div className="mt-6 flex flex-wrap gap-2.5">
        <Link href="/agrirent" className="btn btn-ghost">🚜 Rent equipment</Link>
        <Link href="/finance" className="btn btn-ghost">💰 Can I afford it?</Link>
        <span className="btn btn-quiet cursor-default">📍 Near {farmer.location}</span>
      </div>
    </div>
  )
}

/** Procedural vehicle silhouette tinted by type — no image assets needed. */
function VehicleArt({ type }: { type: string }) {
  const hue = type === 'Tractor' ? 32 : type === 'Trailer' ? 45 : type === 'Mini truck' ? 210 : 150
  return (
    <span className="absolute inset-0" aria-hidden>
      <svg viewBox="0 0 200 90" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <defs>
          <linearGradient id={`va-${hue}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`hsl(${hue} 55% 90%)`} />
            <stop offset="100%" stopColor={`hsl(${hue} 40% 74%)`} />
          </linearGradient>
        </defs>
        <rect width="200" height="90" fill={`url(#va-${hue})`} />
        <ellipse cx="100" cy="82" rx="92" ry="14" fill={`hsl(${hue} 35% 32%)`} opacity="0.18" />
        {type === 'Tractor' ? (
          <g fill={`hsl(${hue} 45% 38%)`}>
            <rect x="52" y="34" width="52" height="26" rx="5" />
            <rect x="104" y="42" width="44" height="18" rx="4" />
            <circle cx="70" cy="66" r="18" fill="none" stroke={`hsl(${hue} 45% 32%)`} strokeWidth="7" />
            <circle cx="134" cy="68" r="11" fill="none" stroke={`hsl(${hue} 45% 32%)`} strokeWidth="5" />
            <rect x="60" y="24" width="20" height="12" rx="3" opacity="0.75" />
          </g>
        ) : type === 'Trailer' ? (
          <g fill={`hsl(${hue} 40% 36%)`}>
            <rect x="40" y="34" width="120" height="28" rx="4" />
            <circle cx="70" cy="68" r="11" fill="none" stroke={`hsl(${hue} 40% 30%)`} strokeWidth="5" />
            <circle cx="130" cy="68" r="11" fill="none" stroke={`hsl(${hue} 40% 30%)`} strokeWidth="5" />
          </g>
        ) : (
          <g fill={`hsl(${hue} 45% 38%)`}>
            <rect x="38" y="36" width="76" height="26" rx="4" />
            <path d="M114 40 h34 l16 14 v8 h-50 z" />
            <circle cx="62" cy="68" r="10" fill="none" stroke={`hsl(${hue} 45% 30%)`} strokeWidth="5" />
            <circle cx="142" cy="68" r="10" fill="none" stroke={`hsl(${hue} 45% 30%)`} strokeWidth="5" />
            <rect x="120" y="43" width="18" height="10" rx="2" opacity="0.7" />
          </g>
        )}
      </svg>
    </span>
  )
}
