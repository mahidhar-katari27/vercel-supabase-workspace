'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { Card, Chip, Counter, DemoTag, Modal, PageHeader, Reveal, spring, Tabs } from '@/components/ui'
import { bookings, type Booking } from '@/lib/data'
import { cn, inr, num } from '@/lib/utils'

const STATUSES = ['Confirmed', 'Pending', 'Completed', 'Cancelled'] as const
const statusTone: Record<Booking['status'], 'live' | 'demo' | 'info' | 'danger'> = {
  Confirmed: 'live', Pending: 'demo', Completed: 'info', Cancelled: 'danger',
}

export default function BookingsPage() {
  const [tab, setTab] = useState('all')
  const [list, setList] = useState<Booking[]>(bookings)
  const [cancel, setCancel] = useState<Booking | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const f = tab === 'all' ? list : list.filter((b) => b.status === tab)
    return [...f].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [list, tab])

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = list.filter((b) => (b.status === 'Confirmed' || b.status === 'Pending') && b.date >= today)
  const past = list.filter((b) => b.status === 'Completed')
  const pendingSpend = upcoming.reduce((a, b) => a + b.amount, 0)
  const totalSpent = past.reduce((a, b) => a + b.amount, 0)

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(null), 4000) }

  const doCancel = () => {
    if (!cancel) return
    setList((l) => l.map((b) => b.id === cancel.id ? { ...b, status: 'Cancelled' } : b))
    say(`${cancel.service} cancelled. Demo only — no provider was notified.`)
    setCancel(null)
  }

  return (
    <div className="section">
      <PageHeader
        icon="📅"
        title="Smart Booking"
        sub="Every machine, service and consultation you have booked."
        tag={<DemoTag />}
      >
        <div className="flex flex-wrap gap-2.5">
          <Link href="/agrirent" className="btn btn-primary">🚜 Book Equipment</Link>
          <Link href="/experts" className="btn btn-ghost">👨‍🔬 Book an Expert</Link>
          <Link href="/vehicles" className="btn btn-quiet">🧑‍🔧 Hire a Driver</Link>
        </div>
      </PageHeader>

      {/* ----------------------------------------------------------- stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: '🗓️', label: 'Upcoming', to: upcoming.length, sub: 'Confirmed or awaiting approval', suffix: '' },
          { icon: '💸', label: 'Committed spend', to: pendingSpend, sub: 'Across upcoming bookings', prefix: '₹' },
          { icon: '✅', label: 'Completed', to: past.length, sub: `${inr(totalSpent)} paid in total`, suffix: '' },
          { icon: '⏳', label: 'Pending approval', to: list.filter((b) => b.status === 'Pending').length, sub: 'Waiting on the provider', suffix: '' },
        ].map((s, i) => (
          <Reveal key={s.label} delay={i * 0.06}>
            <Card hover className="h-full">
              <div className="flex items-start justify-between gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-leaf-400/10 text-lg" aria-hidden>{s.icon}</span>
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">{s.label}</p>
              <p className="stat-value mt-1">
                <Counter to={s.to} prefix={s.prefix ?? ''} suffix={s.suffix ?? ''} />
              </p>
              <p className="mt-1 text-sm text-muted">{s.sub}</p>
            </Card>
          </Reveal>
        ))}
      </div>

      {/* ----------------------------------------------------------- tabs */}
      <div className="mt-5 mb-4">
        <Tabs
          tabs={[
            { id: 'all', label: `All (${list.length})` },
            ...STATUSES.map((s) => ({ id: s, label: `${s} (${list.filter((b) => b.status === s).length})` })),
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {/* ------------------------------------------------------- timeline */}
      {upcoming.length > 0 && tab === 'all' && (
        <>
          <h2 className="section-title">Coming up</h2>
          <div className="mb-6 grid gap-3 md:grid-cols-2">
            {upcoming.slice(0, 2).map((b, i) => (
              <Reveal key={b.id} delay={i * 0.06}>
                <BookingCard b={b} featured onCancel={() => setCancel(b)} onToast={say} />
              </Reveal>
            ))}
          </div>
        </>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((b, i) => (
            <motion.div key={b.id} layout
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ ...spring, delay: Math.min(i * 0.04, 0.2) }}>
              <BookingCard b={b} onCancel={() => setCancel(b)} onToast={say} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <Card className="grid place-items-center py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-line/40 text-2xl" aria-hidden>📭</span>
          <p className="mt-3 text-sm font-semibold">No {tab === 'all' ? '' : tab.toLowerCase()} bookings.</p>
          <Link href="/agrirent" className="btn btn-ghost btn-sm mt-3">Book equipment →</Link>
        </Card>
      )}

      {/* ---------------------------------------------------------- cancel */}
      <Modal open={!!cancel} onClose={() => setCancel(null)} title="Cancel this booking?">
        {cancel && (
          <>
            <div className="rounded-2xl border border-line/60 bg-surface/50 p-4">
              <p className="font-display font-bold">{cancel.icon} {cancel.service}</p>
              <p className="mt-1 text-sm text-muted">{cancel.provider}</p>
              <p className="text-sm text-muted">{fmtDate(cancel.date)} · {cancel.time}</p>
              <p className="mt-2 font-display text-lg font-black">{inr(cancel.amount)}</p>
            </div>

            <div className="mt-4 rounded-2xl border border-gold-400/35 bg-gold-400/10 p-3.5 text-xs leading-relaxed text-muted">
              ◆ In a live system this would notify the provider and apply their cancellation policy —
              often free up to 24 hours before, charged after. Here it only updates this page for the demo.
            </div>

            <div className="mt-5 flex gap-2.5">
              <button onClick={doCancel} className="btn btn-danger flex-1">Yes, cancel it</button>
              <button onClick={() => setCancel(null)} className="btn btn-ghost">Keep booking</button>
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
    </div>
  )
}

function BookingCard({
  b, featured = false, onCancel, onToast,
}: {
  b: Booking; featured?: boolean; onCancel: () => void; onToast: (m: string) => void
}) {
  const days = Math.round((new Date(b.date).getTime() - Date.now()) / 86400000)
  const live = b.status === 'Confirmed' || b.status === 'Pending'
  const when = live && days >= 0 ? (days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${num(days)} days`) : fmtDate(b.date)

  return (
    <Card className={cn('h-full', featured && 'border-leaf-400/40')}>
      <div className="flex items-start gap-3">
        <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl',
          b.status === 'Cancelled' ? 'bg-line/40 opacity-60' : 'bg-leaf-400/10')} aria-hidden>
          {b.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className={cn('font-display font-bold leading-tight', b.status === 'Cancelled' && 'line-through opacity-60')}>
              {b.service}
            </h3>
            <Chip tone={statusTone[b.status]}>{b.status}</Chip>
          </div>
          <p className="mt-0.5 text-xs text-muted">{b.provider}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <Cell k="Date" v={fmtDate(b.date)} />
        <Cell k="Time" v={b.time} />
        {b.land && <Cell k="Land" v={b.land} />}
        <Cell k="Operator" v={b.driver ? 'Included' : 'Self-driven'} />
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-line/60 pt-3">
        <div>
          <p className="font-display text-lg font-black leading-none tabular-nums">{inr(b.amount)}</p>
          <p className="mt-0.5 text-[11px] font-semibold text-muted">
            {live ? `⏰ ${when}` : b.status === 'Completed' ? '✓ Completed' : '✕ Cancelled'}
          </p>
        </div>
        {live ? (
          <div className="flex shrink-0 gap-1.5">
            <button onClick={() => onToast(`Reschedule is a demo action — ${b.service} was not moved.`)}
              className="btn btn-quiet btn-sm">Reschedule</button>
            <button onClick={onCancel} className="btn btn-ghost btn-sm text-red-500">Cancel</button>
          </div>
        ) : (
          <Link href="/agrirent" className="btn btn-quiet btn-sm shrink-0">Book again</Link>
        )}
      </div>
    </Card>
  )
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{k}</p>
      <p className="truncate font-semibold">{v}</p>
    </div>
  )
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
