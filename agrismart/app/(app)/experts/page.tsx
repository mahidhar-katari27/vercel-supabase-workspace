'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { Avatar, Card, Chip, DemoTag, Modal, PageHeader, Reveal, spring } from '@/components/ui'
import NearbyServices from '@/components/maps/NearbyServices'
import { experts } from '@/lib/data'
import { cn, inr, num } from '@/lib/utils'

type Expert = (typeof experts)[number]

const fields = ['All', ...Array.from(new Set(experts.map((e) => e.field)))]
const modes = [
  { id: 'call', icon: '📞', label: 'Phone call', hint: '15–20 minutes, quickest for a clear symptom' },
  { id: 'video', icon: '🎥', label: 'Video call', hint: 'Show the leaf, the pond or the animal live' },
  { id: 'visit', icon: '🚜', label: 'Farm visit', hint: 'Best for a whole-field problem; travel charged separately' },
]
const slots = ['07:00', '09:30', '11:00', '14:00', '16:30', '18:00', '19:30']

export default function ExpertsPage() {
  const [field, setField] = useState('All')
  const [q, setQ] = useState('')
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [sel, setSel] = useState<Expert | null>(null)
  const [mode, setMode] = useState('call')
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState<string | null>(null)
  const [issue, setIssue] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [placed, setPlaced] = useState<string | null>(null)

  const list = experts
    .filter((e) => field === 'All' || e.field === field)
    .filter((e) => !onlineOnly || e.online)
    .filter((e) =>
      !q.trim() ||
      e.name.toLowerCase().includes(q.toLowerCase()) ||
      e.speciality.toLowerCase().includes(q.toLowerCase()) ||
      e.field.toLowerCase().includes(q.toLowerCase()),
    )
    .sort((a, b) => Number(b.online) - Number(a.online) || b.rating - a.rating)

  const minDate = new Date().toISOString().slice(0, 10)

  const openBooking = (e: Expert) => {
    setSel(e); setMode('call'); setDate(''); setSlot(null); setIssue(''); setErr(null); setPlaced(null)
  }

  const confirm = () => {
    if (!sel) return
    if (!date) return setErr('Pick a date')
    if (!slot) return setErr('Pick a time slot')
    if (issue.trim().length < 12) return setErr('Describe the problem in a sentence or two — it helps the expert prepare')
    setErr(null)
    setPlaced(`EXP-${Date.now().toString().slice(-6)}`)
  }

  return (
    <div className="section">
      <PageHeader
        icon="👨‍🔬"
        title="Expert Connect"
        sub="Book a consultation with a qualified agronomist, vet or aqua specialist."
        tag={<DemoTag />}
      >
        <div className="rounded-3xl border border-gold-400/35 bg-gold-400/10 p-4 text-sm leading-relaxed text-muted">
          <p className="mb-1 font-bold text-gold-600 dark:text-gold-400">◆ Sample profiles — no real experts</p>
          The people below are invented for the demo. No consultation is actually booked, no call happens
          and no payment is taken. In production these would be verified professionals with credentials
          checked before listing.
        </div>
      </PageHeader>

      {/* ---------------------------------------------------------- filters */}
      <Card className="mb-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <input className="input lg:max-w-xs" placeholder="Search name or speciality…"
            value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search experts" />
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {fields.map((f) => (
              <button key={f} onClick={() => setField(f)}
                className={cn('shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all',
                  field === f ? 'bg-ink text-bg' : 'bg-line/40 text-muted hover:bg-line/70')}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => setOnlineOnly((v) => !v)}
            className={cn('shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all lg:ml-auto',
              onlineOnly ? 'bg-leaf-600 text-white' : 'bg-line/40 text-muted hover:bg-line/70')}
            aria-pressed={onlineOnly}>
            🟢 Available now
          </button>
        </div>
      </Card>

      {/* ------------------------------------------------------------ cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((e, i) => (
          <Reveal key={e.id} delay={i * 0.06}>
            <Card hover className="flex h-full flex-col" pad={false}>
              <div className="relative p-5 pb-4" style={{ background: `linear-gradient(140deg, hsl(${e.hue} 55% 50% / 0.12), transparent 65%)` }}>
                <div className="flex items-start gap-3">
                  <span className="relative shrink-0">
                    <Avatar seed={e.name.split(' ').map((w) => w[0]).join('')} size={56} hue={e.hue} />
                    {e.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[hsl(var(--surface))] bg-leaf-500"
                        title="Available now" aria-label="Available now" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display font-black leading-tight">{e.name}</h2>
                    <p className="text-xs font-semibold text-muted">{e.speciality}</p>
                    <p className="mt-0.5 text-[11px] text-faint">{e.field} · {e.exp} years experience</p>
                  </div>
                </div>

                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  <Chip tone={e.online ? 'live' : 'default'}>{e.online ? 'Online now' : 'Offline'}</Chip>
                  <Chip tone="info">{e.rating}★ rating</Chip>
                  <Chip>{num(e.consults)} consults</Chip>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-end gap-3 border-t border-line/60 p-4">
                <div className="flex flex-wrap gap-1.5">
                  {e.langs.map((l) => (
                    <span key={l} className="rounded-lg bg-line/40 px-2 py-0.5 text-[11px] font-semibold text-muted">{l}</span>
                  ))}
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="font-display text-xl font-black leading-none tabular-nums">{inr(e.fee)}</p>
                    <p className="text-[11px] text-muted">per consultation</p>
                  </div>
                  <button onClick={() => openBooking(e)} className="btn btn-primary btn-sm">Book</button>
                </div>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>

      {list.length === 0 && (
        <Card className="grid place-items-center py-16 text-center">
          <p className="text-sm text-muted">No expert in the demo pool matches those filters.</p>
          <button onClick={() => { setField('All'); setQ(''); setOnlineOnly(false) }} className="btn btn-ghost btn-sm mt-3">
            Clear filters
          </button>
        </Card>
      )}

      {/* ------------------------------------------------------ how it works */}
      <h2 className="section-title">How a consultation works</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['📝', 'Describe the problem', 'Crop, stage, when it started, what you already tried.'],
          ['📸', 'Attach a photo', 'A clear picture of the affected leaf or animal speeds things up a lot.'],
          ['📞', 'Talk it through', '15–20 minutes is usually enough for a focused question.'],
          ['📋', 'Get it in writing', 'The expert sends a summary so you do not have to rely on memory.'],
        ].map(([i, k, v], n) => (
          <Reveal key={k} delay={n * 0.06}>
            <Card className="h-full">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-leaf-400/10 text-lg" aria-hidden>{i}</span>
              <h3 className="mt-3 font-bold leading-tight">
                <span className="mr-1.5 text-xs font-black text-faint">{n + 1}</span>{k}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">{v}</p>
            </Card>
          </Reveal>
        ))}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-faint">
        An expert consultation is guidance, not a prescription. Pesticide and veterinary medicines should
        only be used at a dose recommended by a qualified professional who has seen your specific situation.
      </p>

      {/* ------------------------------------------------------- booking modal */}
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel ? `Book ${sel.name}` : ''} wide>
        <AnimatePresence mode="wait">
          {sel && !placed && (
            <motion.div key="form" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={spring}>
              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-line/60 bg-surface/50 p-3">
                <Avatar seed={sel.name.split(' ').map((w) => w[0]).join('')} size={44} hue={sel.hue} />
                <div className="min-w-0">
                  <p className="truncate font-bold">{sel.name}</p>
                  <p className="text-xs text-muted">{sel.speciality} · {sel.exp} yrs · {sel.rating}★</p>
                </div>
                <span className="ml-auto shrink-0 text-right">
                  <span className="block font-display text-lg font-black">{inr(sel.fee)}</span>
                  <span className="block text-[10px] text-faint">consultation</span>
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="label">Consultation type</span>
                  <div className="space-y-1.5">
                    {modes.map((m) => (
                      <button key={m.id} onClick={() => setMode(m.id)}
                        className={cn('w-full rounded-2xl border p-3 text-left transition-all',
                          mode === m.id ? 'border-leaf-400/70 bg-leaf-400/10' : 'border-line/70 hover:border-line')}>
                        <p className="text-sm font-bold">{m.icon} {m.label}</p>
                        <p className="mt-0.5 text-xs text-muted">{m.hint}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="label">Date</span>
                    <input className="input" type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} />
                  </label>
                  <div>
                    <span className="label">Time slot</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {slots.map((s) => (
                        <button key={s} onClick={() => setSlot(s)}
                          className={cn('rounded-xl border px-2 py-2 text-xs font-bold tabular-nums transition-all',
                            slot === s ? 'border-leaf-400/70 bg-leaf-gradient text-white' : 'border-line/70 text-muted hover:text-ink')}
                          aria-pressed={slot === s}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <label className="mt-4 block">
                <span className="label">What do you need help with?</span>
                <textarea className="input min-h-[96px]" value={issue} onChange={(e) => setIssue(e.target.value)}
                  placeholder="e.g. Chilli leaves curling on Land 02, started about a week after the last spray. Lower leaves first, spreading upward. No visible insects." />
                <span className="mt-1 block text-[11px] text-faint">
                  Mention the crop or animal, the stage, when it started and what you have already tried.
                </span>
              </label>

              {err && (
                <p className="mt-3 rounded-2xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-500">{err}</p>
              )}

              <div className="mt-4 rounded-2xl border border-gold-400/35 bg-gold-400/10 p-3.5 text-xs leading-relaxed text-muted">
                ◆ Demonstration booking. No expert is notified, no call is scheduled and no payment is taken.
                Farm visits would normally carry an additional travel charge agreed with the expert.
              </div>

              <div className="mt-5 flex gap-2.5">
                <button onClick={confirm} className="btn btn-primary flex-1">Confirm demo booking</button>
                <button onClick={() => setSel(null)} className="btn btn-ghost">Cancel</button>
              </div>
            </motion.div>
          )}

          {sel && placed && (
            <motion.div key="done" className="text-center"
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={spring}>
              <motion.div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-leaf-gradient text-3xl text-white shadow-glow"
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring, delay: 0.08 }}>
                ✓
              </motion.div>
              <h3 className="mt-4 font-display text-xl font-black">Demo consultation booked</h3>
              <p className="mt-1 text-sm text-muted">Reference <span className="font-mono font-bold text-ink">{placed}</span></p>

              <dl className="mx-auto mt-4 max-w-sm space-y-2 text-left">
                {[
                  ['Expert', sel.name],
                  ['Speciality', sel.speciality],
                  ['Type', modes.find((m) => m.id === mode)?.label ?? mode],
                  ['When', `${fmtDate(date)} at ${slot}`],
                  ['Fee', inr(sel.fee)],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between gap-3 rounded-xl bg-surface/60 px-3 py-2 text-sm">
                    <dt className="shrink-0 text-muted">{k}</dt>
                    <dd className="text-right font-bold">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mx-auto mt-4 max-w-sm rounded-2xl border border-gold-400/35 bg-gold-400/10 p-3 text-xs leading-relaxed text-muted">
                ◆ Nothing has been scheduled with a real person. This is what the confirmation would look like
                once expert accounts and a scheduling backend are connected.
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                <Link href="/bookings" onClick={() => setSel(null)} className="btn btn-primary">View my bookings</Link>
                <button onClick={() => setSel(null)} className="btn btn-ghost">Done</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>

      <div className="mt-6 flex flex-wrap gap-2.5">
        <Link href="/community" className="btn btn-ghost">🧑‍🌾 Ask the community first</Link>
        <Link href="/crop-doctor" className="btn btn-ghost">🤖 Run AI Crop Doctor</Link>
        <Link href="/learn" className="btn btn-quiet">📚 Browse guides</Link>
      </div>

      <div className="mt-10">
        <NearbyServices
          categories={['expert']}
          title="Expert clinics near you"
          icon="👨‍🔬"
          subtitle="Consult in person or online — clinic locations from the sample dataset"
          limit={6}
        />
      </div>

    </div>
  )
}

function fmtDate(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}
