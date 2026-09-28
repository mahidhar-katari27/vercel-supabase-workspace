'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { Card, Chip, DemoTag, PageHeader, Reveal, spring, Stepper } from '@/components/ui'
import { driverPool, farmer, lands, machines, type Machine } from '@/lib/data'
import type { FarmPlan } from '@/lib/farmPlan'
import { loadPlan, onPlanChange } from '@/lib/farmPlan'
import { cropInfo, cropVisual } from '@/lib/cropDb'
import { cn, inr } from '@/lib/utils'
import { placeForRef } from '@/lib/places'
import { directionsUrl, formatKm, haversineKm } from '@/lib/geo'
import NearbyServices from '@/components/maps/NearbyServices'
import { addBooking, type BookingSource } from '@/lib/liveStore'

const STEPS = ['Machine', 'Date', 'Time', 'Location', 'Operator', 'Confirm']

const timeSlots = [
  { id: '06:00 – 08:00', label: 'Early morning', hint: 'Cooler, less heat stress', blocked: false },
  { id: '08:00 – 10:00', label: 'Morning', hint: 'Most popular window', blocked: false },
  { id: '10:00 – 12:00', label: 'Late morning', hint: '', blocked: false },
  { id: '12:00 – 14:00', label: 'Midday', hint: 'Hottest part of the day', blocked: true },
  { id: '14:00 – 16:00', label: 'Afternoon', hint: '', blocked: false },
  { id: '16:00 – 18:00', label: 'Evening', hint: 'Good light, cooler', blocked: false },
]

type DriverMode = 'none' | 'with'

export default function AgriRentPage() {
  const [step, setStep] = useState(0)
  const [machineId, setMachineId] = useState<string | null>(null)
  const [rate, setRate] = useState<'hourly' | 'daily'>('hourly')
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState<string | null>(null)
  const [location, setLocation] = useState(farmer.location)
  const [units, setUnits] = useState(4)
  const [mode, setMode] = useState<DriverMode>('with')
  const [driverId, setDriverId] = useState<string | null>(null)
  const [placed, setPlaced] = useState<string | null>(null)
  const [saveNote, setSaveNote] = useState<BookingSource | null>(null)

  const machine: Machine | undefined = machines.find((m) => m.id === machineId)
  const driver = driverPool.find((d) => d.id === driverId)
  const unitLabel = rate === 'hourly' ? 'hour' : 'day'

  // Only operators whose skill list mentions this machine type are offered.
  const eligibleDrivers = useMemo(() => {
    if (!machine) return driverPool
    const key = machine.name.toLowerCase()
    return driverPool.filter((d) =>
      d.machines.some((m) => key.includes(m.toLowerCase()) || m.toLowerCase().includes('tractor')),
    )
  }, [machine])

  const quote = useMemo(() => {
    if (!machine) return null
    const base = (rate === 'hourly' ? machine.hourly : machine.daily) * units
    const driverFee = mode === 'with' && driver ? driver.dayRate * (rate === 'daily' ? units : Math.max(1, units / 8)) : 0
    const transport = Math.round(300 + machine.distanceKm * 22)
    const sub = base + driverFee + transport
    const gst = Math.round(sub * 0.05)
    return { base, driverFee, transport, sub, gst, total: sub + gst }
  }, [machine, rate, units, mode, driver])

  const canNext = [
    !!machine && machine.available, !!date, !!slot, !!location.trim(),
    mode === 'none' || !!driver, true,
  ][step]

  const reset = () => {
    setStep(0); setMachineId(null); setDate(''); setSlot(null)
    setLocation(farmer.location); setUnits(4); setMode('with')
    setDriverId(null); setPlaced(null); setRate('hourly')
  }

  const minDate = new Date().toISOString().slice(0, 10)

  return (
    <div className="section">
      <PageHeader
        icon="🚜"
        title="AgriRent — Equipment Rental"
        sub="Book machinery by the hour or the day, with or without an operator."
        tag={<DemoTag />}
      >
        <div className="rounded-3xl border border-gold-400/35 bg-gold-400/10 p-4 text-sm leading-relaxed text-muted">
          <p className="mb-1 font-bold text-gold-600 dark:text-gold-400">◆ Sample catalogue, illustrative pricing</p>
          No real rental inventory is connected. Rates, availability and operator fees shown here are demo
          values — an actual quote depends on the vendor, the season and how far the machine has to travel.
        </div>
      </PageHeader>

      {/* ------------------------------------------- plan machinery needs */}
      <PlanNeedsBanner onPick={(m) => { setMachineId(m.id); setStep(0); window.scrollTo({ top: 260, behavior: 'smooth' }) }} />

      {!placed && (
        <Reveal>
          <Card className="mb-5">
            <Stepper steps={STEPS} current={step} onStep={(i) => setStep(i)} />
          </Card>
        </Reveal>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <AnimatePresence mode="wait">
            {/* ------------------------------------------------- STEP 1 machine */}
            {step === 0 && !placed && (
              <Panel key="s0" title="Choose a machine" sub={`${machines.filter((m) => m.available).length} of ${machines.length} available near you`}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {machines.map((m, i) => (
                    <motion.div key={m.id} role="button" tabIndex={0}
                      onClick={() => m.available && setMachineId(m.id)}
                      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && m.available) { e.preventDefault(); setMachineId(m.id) } }}
                      className={cn('card cursor-pointer text-left transition-all duration-300',
                        machineId === m.id ? 'border-leaf-400/70 shadow-glow' : m.available ? 'card-hover' : 'opacity-55')}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: m.available ? 1 : 0.55, y: 0 }}
                      transition={{ ...spring, delay: i * 0.04 }} aria-pressed={machineId === m.id}>
                      <div className="flex items-start gap-3">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-leaf-400/15 to-transparent text-2xl" aria-hidden>
                          {m.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-display font-bold leading-tight">{m.name}</h3>
                            <Chip tone={m.available ? 'live' : 'demo'}>{m.available ? 'Available' : 'Booked out'}</Chip>
                          </div>
                          <p className="mt-1 text-xs text-muted">
                            📍 {m.location} · {m.distanceKm} km away · {m.owner}
                          </p>
                          <p className="mt-2 font-black text-leaf-600 dark:text-leaf-400">
                            {inr(m.hourly)}<span className="text-xs font-semibold text-faint">/hr</span>
                            <span className="mx-1.5 text-faint">·</span>
                            {inr(m.daily)}<span className="text-xs font-semibold text-faint">/day</span>
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {m.specs.map((s) => <Chip key={s}>{s}</Chip>)}
                            <Chip tone="info">{m.rating}★ · {m.jobs} jobs</Chip>
                          </div>
                        </div>
                      </div>

                      {/* geo block (spec §7): distance, map, directions, book */}
                      {(() => {
                        const geo = placeForRef('machine', m.id)
                        if (!geo) return null
                        const km = haversineKm(farmer.coords, geo.coords)
                        return (
                          <div className="mt-3 rounded-2xl bg-leaf-50 px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-ink">
                              <span>📍 {geo.address.city}</span>
                              <span className="text-leaf-700">{formatKm(km)} away</span>
                              {geo.serviceRadiusKm && <span className="text-muted">↔ {geo.serviceRadiusKm} km service radius</span>}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <Link href={`/map?focus=${geo.id}`} className="inline-flex min-h-[34px] items-center rounded-lg border border-line/70 bg-surface px-2.5 text-[10px] font-bold text-ink hover:border-leaf-500 hover:text-leaf-700">📍 View on Map</Link>
                              <Link href={`/map?focus=${geo.id}&route=1`} className="inline-flex min-h-[34px] items-center rounded-lg border border-line/70 bg-surface px-2.5 text-[10px] font-bold text-ink hover:border-leaf-500 hover:text-leaf-700">🧭 Get Directions</Link>
                              <a href={directionsUrl(farmer.coords, geo.coords)} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-line/70 bg-surface px-2.5 py-1.5 text-[10px] font-bold text-ink hover:border-leaf-500">Open in Google Maps ↗</a>
                              <button type="button" disabled={!m.available} onClick={() => m.available && setMachineId(m.id)}
                                className="rounded-lg bg-gold-400 px-2.5 py-1.5 text-[10px] font-bold text-ink hover:brightness-105 disabled:opacity-50">
                                Book {m.icon}
                              </button>
                            </div>
                          </div>
                        )
                      })()}
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4">
                  <NearbyServices categories={['machinery']} title="Machinery providers near you" icon="🚜" limit={6} />
                </div>
              </Panel>
            )}

            {/* ----------------------------------------------------- STEP 2 date */}
            {step === 1 && !placed && (
              <Panel key="s1" title="Pick a date" sub="Machines are usually booked a day or two ahead">
                <label className="block">
                  <span className="label">Rental date</span>
                  <input className="input text-base" type="date" min={minDate} value={date}
                    onChange={(e) => setDate(e.target.value)} />
                </label>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 5, 7].map((d) => {
                    const dt = new Date(); dt.setDate(dt.getDate() + d)
                    const iso = dt.toISOString().slice(0, 10)
                    return (
                      <button key={d} onClick={() => setDate(iso)}
                        className={cn('rounded-2xl border px-3 py-2 text-center transition-all',
                          date === iso ? 'border-leaf-400/70 bg-leaf-400/10' : 'border-line/70 hover:border-line')}>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-faint">
                          {d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : dt.toLocaleDateString('en-IN', { weekday: 'short' })}
                        </span>
                        <span className="block text-sm font-black">{dt.getDate()} {dt.toLocaleDateString('en-IN', { month: 'short' })}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-5">
                  <span className="label">Rate basis</span>
                  <div className="flex gap-2">
                    {(['hourly', 'daily'] as const).map((r) => (
                      <button key={r} onClick={() => { setRate(r); setUnits(r === 'hourly' ? 4 : 1) }}
                        className={cn('flex-1 rounded-2xl border px-3 py-2.5 text-sm font-bold transition-all',
                          rate === r ? 'border-leaf-400/70 bg-leaf-gradient text-white' : 'border-line/70 text-muted hover:text-ink')}>
                        {r === 'hourly' ? `Hourly · ${inr(machine?.hourly ?? 0)}/hr` : `Daily · ${inr(machine?.daily ?? 0)}/day`}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="mt-5 block">
                  <span className="label">How many {unitLabel}s?</span>
                  <input type="range" min={1} max={rate === 'hourly' ? 12 : 7} value={units}
                    onChange={(e) => setUnits(Number(e.target.value))}
                    className="w-full accent-[hsl(150_60%_38%)]" />
                  <span className="mt-1 block text-sm font-bold">
                    {units} {unitLabel}{units > 1 ? 's' : ''}
                    {quote && <span className="ml-2 font-normal text-muted">≈ {inr(quote.base)}</span>}
                  </span>
                </label>
              </Panel>
            )}

            {/* ----------------------------------------------------- STEP 3 time */}
            {step === 2 && !placed && (
              <Panel key="s2" title="Select a time slot" sub="Two-hour windows; longer jobs are split across slots">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {timeSlots.map((t, i) => (
                    <motion.button key={t.id} onClick={() => !t.blocked && setSlot(t.id)} disabled={t.blocked}
                      className={cn('rounded-2xl border px-3.5 py-3 text-left transition-all',
                        slot === t.id ? 'border-leaf-400/70 bg-leaf-gradient text-white shadow-glow'
                          : t.blocked ? 'border-line/40 text-faint' : 'border-line/70 hover:border-line')}
                      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ ...spring, delay: i * 0.03 }} aria-pressed={slot === t.id}>
                      <span className="block font-display font-black tabular-nums">{t.id}</span>
                      <span className={cn('mt-0.5 block text-xs font-semibold', slot === t.id ? 'opacity-85' : 'text-muted')}>
                        {t.blocked ? 'Not available — machine servicing' : t.label}
                      </span>
                      {t.hint && !t.blocked && <span className="mt-0.5 block text-[11px] opacity-70">{t.hint}</span>}
                    </motion.button>
                  ))}
                </div>
              </Panel>
            )}

            {/* ------------------------------------------------- STEP 4 location */}
            {step === 3 && !placed && (
              <Panel key="s3" title="Where should it come?" sub="The operator needs an exact field location">
                <div className="space-y-3">
                  {lands.map((l) => (
                    <button key={l.id} onClick={() => setLocation(l.location)}
                      className={cn('card w-full p-4 text-left transition-all',
                        location === l.location ? 'border-leaf-400/70 shadow-glow' : 'card-hover')}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold">🌾 {l.name}</p>
                          <p className="truncate text-xs text-muted">📍 {l.location} · {l.acres} acres · {l.crop}</p>
                        </div>
                        {location === l.location && <span className="shrink-0 text-lg text-leaf-500" aria-hidden>✓</span>}
                      </div>
                    </button>
                  ))}

                  <label className="block">
                    <span className="label">Or type an address / landmark</span>
                    <input className="input" value={location} onChange={(e) => setLocation(e.target.value)}
                      placeholder="Near canal bridge, Peddapuram" />
                  </label>

                  <div className="rounded-2xl border border-line/60 bg-surface/50 p-3.5 text-xs leading-relaxed text-muted">
                    <p className="mb-1 font-bold">📱 Location sharing</p>
                    Real vendors expect a pin, not a village name — {machine?.distanceKm ?? 0} km of travel
                    is a lot of guesswork. In production this would open a WhatsApp deep link with your field
                    coordinates pre-filled. That needs a connected backend, so it is not wired up in the demo.
                  </div>
                </div>
              </Panel>
            )}

            {/* -------------------------------------------------- STEP 5 operator */}
            {step === 4 && !placed && (
              <Panel key="s4" title="Operator" sub="Drive it yourself, or book someone trained on this machine">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <button onClick={() => setMode('with')}
                    className={cn('card p-4 text-left transition-all',
                      mode === 'with' ? 'border-leaf-400/70 shadow-glow' : 'card-hover')}>
                    <p className="font-bold">🧑‍🔧 With operator</p>
                    <p className="mt-1 text-xs text-muted">
                      {machine?.driverOption
                        ? 'The provider supplies a trained operator.'
                        : 'This machine is normally self-driven, but we can still match an operator.'}
                    </p>
                  </button>
                  <button onClick={() => setMode('none')}
                    className={cn('card p-4 text-left transition-all',
                      mode === 'none' ? 'border-leaf-400/70 shadow-glow' : 'card-hover')}>
                    <p className="font-bold">🔑 Self-driven</p>
                    <p className="mt-1 text-xs text-muted">You hold a valid licence and will operate it yourself.</p>
                  </button>
                </div>

                {mode === 'with' && (
                  <motion.div className="mt-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
                    <p className="label mb-2">Operators trained on {machine?.name ?? 'this machine'}</p>
                    {eligibleDrivers.length === 0 && (
                      <p className="text-sm text-muted">No operator in the demo pool matches this machine.</p>
                    )}
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {eligibleDrivers.map((d) => (
                        <button key={d.id} onClick={() => setDriverId(d.id)}
                          className={cn('card flex items-center gap-3 p-3.5 text-left transition-all',
                            driverId === d.id ? 'border-leaf-400/70 shadow-glow' : 'card-hover')}>
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-leaf-400/10 font-display text-sm font-black text-leaf-700 dark:text-leaf-300" aria-hidden>
                            {d.name.split(' ').map((w) => w[0]).join('')}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-bold">{d.name}</span>
                            <span className="block text-xs text-muted">{d.exp} yrs · {d.rating}★ · {d.location}</span>
                            <span className="mt-0.5 block text-[11px] text-faint">{d.machines.join(', ')}</span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block text-sm font-black">{inr(d.dayRate)}</span>
                            <span className="block text-[10px] text-faint">per day</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </Panel>
            )}

            {/* ---------------------------------------------------- STEP 6 confirm */}
            {step === 5 && !placed && quote && machine && (
              <Panel key="s5" title="Confirm booking" sub="Check everything before placing this demo order">
                <dl className="divide-y divide-line/60">
                  {[
                    ['Machine', `${machine.icon} ${machine.name}`],
                    ['Provider', machine.owner],
                    ['Specification', machine.specs.join(' · ')],
                    ['Date', fmtDate(date)],
                    ['Time slot', slot ?? '—'],
                    ['Duration', `${units} ${unitLabel}${units > 1 ? 's' : ''}`],
                    ['Location', location],
                    ['Operator', mode === 'none' ? 'Self-driven' : driver ? `${driver.name} (${driver.exp} yrs, ${driver.rating}★)` : 'Not chosen'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-4 py-2.5">
                      <dt className="shrink-0 text-sm text-muted">{k}</dt>
                      <dd className="max-w-[62%] text-right text-sm font-bold">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 space-y-1.5 rounded-2xl border border-line/60 bg-surface/50 p-4 text-sm">
                  <Row k={`Machine · ${units} ${unitLabel}${units > 1 ? 's' : ''} × ${inr(rate === 'hourly' ? machine.hourly : machine.daily)}`} v={quote.base} />
                  {quote.driverFee > 0 && <Row k={`Operator · ${driver?.name ?? ''}`} v={quote.driverFee} />}
                  <Row k={`Transport (${machine.distanceKm} km)`} v={quote.transport} />
                  <Row k="GST (5%)" v={quote.gst} />
                  <div className="hairline !my-2" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Estimated total</span>
                    <span className="font-display text-2xl font-black tabular-nums text-leaf-600 dark:text-leaf-400">{inr(quote.total)}</span>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-faint">
                  ◆ Demonstration booking. Nothing is charged, nothing is reserved with a real vendor and no
                  payment is processed. The total is assembled from sample rates in this prototype&rsquo;s data.
                </p>

                <button onClick={() => {
                  const id = `AGR-${Date.now().toString().slice(-6)}`
                  setPlaced(id)
                  if (machine && quote) {
                    void addBooking({
                      id, service: machine.name, icon: machine.icon, provider: machine.owner,
                      date, time: slot ?? '—', status: 'Pending', amount: quote.total,
                      land: location.trim() || undefined, driver: mode === 'with' && !!driver,
                    }).then(setSaveNote)
                  }
                }} className="btn btn-primary mt-5 w-full">
                  Place demo booking
                </button>
              </Panel>
            )}
          </AnimatePresence>

          {/* ------------------------------------------------------ confirmation */}
          {placed && machine && (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={spring}>
              <Card className="text-center">
                <motion.div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-leaf-gradient text-4xl text-white shadow-glow"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring, delay: 0.1 }}>
                  ✓
                </motion.div>
                <h2 className="mt-5 font-display text-2xl font-black">Demo booking placed</h2>
                {saveNote === 'live' && (
                  <p className="mt-2 rounded-2xl border border-leaf-500/40 bg-leaf-50 px-3 py-2 text-xs font-bold text-leaf-700">
                    🔌 Saved to your Supabase project (bookings table)
                  </p>
                )}
                {saveNote === 'local' && (
                  <p className="mt-2 rounded-2xl border border-line/60 bg-line/20 px-3 py-2 text-xs font-semibold text-muted">
                    💾 Saved in this browser — the Supabase bookings table doesn't exist yet (migration 0001 pending)
                  </p>
                )}
                <p className="mt-1 text-sm text-muted">
                  Reference <span className="font-mono font-bold text-ink">{placed}</span>
                </p>

                <dl className="mx-auto mt-5 max-w-md space-y-2 text-left">
                  {[
                    ['Machine', `${machine.icon} ${machine.name}`],
                    ['Provider', machine.owner],
                    ['When', `${fmtDate(date)} · ${slot}`],
                    ['Where', location],
                    ['Operator', mode === 'none' ? 'Self-driven' : driver?.name ?? '—'],
                    ['Estimated total', quote ? inr(quote.total) : '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-3 rounded-xl bg-surface/60 px-3 py-2 text-sm">
                      <dt className="shrink-0 text-muted">{k}</dt>
                      <dd className="text-right font-bold">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mx-auto mt-4 max-w-md rounded-2xl border border-gold-400/35 bg-gold-400/10 p-3.5 text-xs leading-relaxed text-muted">
                  ◆ No vendor has been notified and no payment was taken. This shows what the confirmation
                  screen would look like once a real booking backend is connected.
                </div>

                <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                  <Link href="/bookings" className="btn btn-primary">View my bookings</Link>
                  <button onClick={reset} className="btn btn-ghost">Book another</button>
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* ---------------------------------------------------------- summary */}
        <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <Reveal delay={0.08}>
            <Card>
              <h2 className="mb-3 text-sm font-bold">Your booking</h2>
              {machine ? (
                <>
                  <div className="flex items-center gap-3 rounded-2xl border border-line/60 bg-surface/50 p-3">
                    <span className="text-2xl" aria-hidden>{machine.icon}</span>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{machine.name}</p>
                      <p className="text-xs text-muted">
                        {inr(rate === 'hourly' ? machine.hourly : machine.daily)}/{unitLabel} · {machine.location}
                      </p>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm">
                    <SumRow done={!!date} k="Date" v={date ? fmtDate(date) : 'Not chosen'} />
                    <SumRow done={!!slot} k="Time" v={slot ?? 'Not chosen'} />
                    <SumRow done={!!location.trim()} k="Location" v={location || 'Not set'} />
                    <SumRow done={mode === 'none' || !!driver} k="Operator"
                      v={mode === 'none' ? 'Self-driven' : driver?.name ?? 'Not chosen'} />
                  </ul>
                  {quote && (
                    <div className="mt-4 rounded-2xl border border-leaf-400/35 bg-leaf-400/10 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Estimated total</p>
                      <p className="font-display text-2xl font-black tabular-nums text-leaf-600 dark:text-leaf-400">{inr(quote.total)}</p>
                      <p className="text-[11px] text-muted">
                        {units} {unitLabel}{units > 1 ? 's' : ''}{mode === 'with' && driver ? ` · ${driver.name}` : mode === 'none' ? ' · self-driven' : ''}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted">Pick a machine to start building your booking.</p>
              )}
            </Card>
          </Reveal>

          {!placed && (
            <Reveal delay={0.14}>
              <Card>
                <div className="flex gap-2.5">
                  <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
                    className="btn btn-ghost disabled:opacity-40">← Back</button>
                  <button onClick={() => canNext && setStep((s) => Math.min(5, s + 1))} disabled={!canNext}
                    className="btn btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-40">
                    {step === 5 ? 'Review details' : `Continue → ${STEPS[step + 1]}`}
                  </button>
                </div>
                {!canNext && (
                  <p className="mt-2.5 text-center text-xs font-semibold text-faint">Complete this step to continue.</p>
                )}
              </Card>
            </Reveal>
          )}

          <Reveal delay={0.2}>
            <Card>
              <h3 className="mb-2 text-sm font-bold">Why rent instead of buy?</h3>
              <ul className="space-y-1.5 text-xs leading-relaxed text-muted">
                <li>A harvester is used for a few weeks a year — renting avoids idle capital.</li>
                <li>Newer machines waste less grain and burn less fuel per acre.</li>
                <li>Operators who run the same machine daily make fewer mistakes.</li>
              </ul>
              <Link href="/vehicles" className="btn btn-quiet btn-sm mt-3 w-full">Compare buying options →</Link>
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  )
}

function Panel({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={spring}>
      <Card>
        <h2 className="font-display text-xl font-black">{title}</h2>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
        <div className="mt-5">{children}</div>
      </Card>
    </motion.div>
  )
}

function Row({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted">{k}</span>
      <span className="shrink-0 font-bold tabular-nums">{inr(v)}</span>
    </div>
  )
}

function SumRow({ k, v, done }: { k: string; v: string; done: boolean }) {
  return (
    <li className="flex items-start justify-between gap-3">
      <span className={cn('flex shrink-0 items-center gap-2', done ? 'text-muted' : 'text-faint')}>
        <span className={cn('grid h-4 w-4 place-items-center rounded-full text-[9px] font-black',
          done ? 'bg-leaf-600 text-white' : 'border border-line')} aria-hidden>
          {done ? '✓' : ''}
        </span>
        {k}
      </span>
      <span className={cn('max-w-[58%] truncate text-right font-semibold', done ? '' : 'text-faint')}>{v}</span>
    </li>
  )
}

function fmtDate(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

/* ------------------------------------------- plan-linked machinery needs */

function PlanNeedsBanner({ onPick }: { onPick: (m: Machine) => void }) {
  const [plan, setPlan] = useState<FarmPlan | null>(null)
  useEffect(() => {
    setPlan(loadPlan())
    return onPlanChange(() => setPlan(loadPlan()))
  }, [])
  if (!plan?.chosenCrop) return null
  const crop = cropInfo(plan.chosenCrop)
  const vis = cropVisual(plan.chosenCrop)
  const match = (need: string): Machine | undefined => {
    const words = need.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3)
    return machines.find((m) => {
      const n = m.name.toLowerCase()
      return words.some((w) => n.includes(w)) && m.available
    }) ?? machines.find((m) => words.some((w) => m.name.toLowerCase().includes(w)))
  }
  return (
    <Reveal>
      <Card className="mb-5 border-leaf-400/35 bg-leaf-400/5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-leaf-400/10 text-xl" aria-hidden>{vis.icon}</span>
          <div className="min-w-[200px] flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-leaf-600 dark:text-leaf-400">🌱 From your Start Farming plan</p>
            <p className="text-sm font-bold">Machinery your {vis.label} crop needs near {plan.location.district || 'you'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {crop.machinery.map((need) => {
              const m = match(need)
              return m ? (
                <button key={need} type="button" className="btn-ghost text-xs" onClick={() => onPick(m)}>
                  {m.icon} {need} — select {m.name.split('(')[0]!.trim()}
                </button>
              ) : (
                <Chip key={need} icon="🚜">{need} — not in sample catalogue</Chip>
              )
            })}
          </div>
          <Link href="/start" className="btn-quiet text-xs">Farm plan →</Link>
        </div>
      </Card>
    </Reveal>
  )
}
