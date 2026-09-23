'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { Card, Chip, DemoTag, PageHeader, Reveal, spring } from '@/components/ui'
import { alerts, notifications } from '@/lib/data'
import { cn, timeAgo } from '@/lib/utils'

type Tone = (typeof notifications)[number]['tone']
type Row = { id: string; icon: string; title: string; body: string; time: number; tone: Tone; read: boolean }

const toneMap: Record<Tone, { chip: 'live' | 'demo' | 'info' | 'danger'; bg: string; label: string }> = {
  warn: { chip: 'demo', bg: 'bg-gold-400/10', label: 'Warning' },
  danger: { chip: 'danger', bg: 'bg-red-500/10', label: 'Urgent' },
  info: { chip: 'info', bg: 'bg-sky-400/10', label: 'Update' },
  ok: { chip: 'live', bg: 'bg-leaf-400/10', label: 'Good news' },
}

/** Where each notification leads inside the app. */
const links: Record<string, string> = {
  n1: '/weather', n2: '/bookings', n3: '/market', n4: '/schemes',
  n5: '/crop-doctor', n6: '/bookings', n7: '/community',
}

const FILTERS = ['All', 'Unread', 'Urgent', 'Updates'] as const

export default function NotificationsPage() {
  const [rows, setRows] = useState<Row[]>(notifications)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')

  const list = useMemo(() => {
    const f = rows.filter((n) => {
      if (filter === 'Unread') return !n.read
      if (filter === 'Urgent') return n.tone === 'danger' || n.tone === 'warn'
      if (filter === 'Updates') return n.tone === 'info' || n.tone === 'ok'
      return true
    })
    return [...f].sort((a, b) => b.time - a.time)
  }, [rows, filter])

  const unread = rows.filter((n) => !n.read).length
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const inToday = (t: number) => t >= today.getTime()
  const grouped = { today: list.filter((n) => inToday(n.time)), earlier: list.filter((n) => !inToday(n.time)) }

  const markRead = (id: string) => setRows((r) => r.map((n) => n.id === id ? { ...n, read: true } : n))
  const toggleRead = (id: string) => setRows((r) => r.map((n) => n.id === id ? { ...n, read: !n.read } : n))
  const markAll = () => setRows((r) => r.map((n) => ({ ...n, read: true })))
  const remove = (id: string) => setRows((r) => r.filter((n) => n.id !== id))

  return (
    <div className="section">
      <PageHeader
        icon="🔔"
        title="Notification Center"
        sub="Weather, bookings, prices, schemes and crop health — all in one place."
        tag={<DemoTag />}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={markAll} disabled={unread === 0}
            className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40">
            ✓ Mark all read
          </button>
          <div className="flex gap-1.5">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('rounded-full px-3 py-1.5 text-xs font-bold transition-all',
                  filter === f ? 'bg-ink text-bg' : 'bg-line/40 text-muted hover:bg-line/70')}>
                {f}{f === 'Unread' && unread > 0 ? ` (${unread})` : ''}
              </button>
            ))}
          </div>
        </div>
      </PageHeader>

      <div className="mb-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          {(['today', 'earlier'] as const).map((bucket) => {
            const items = grouped[bucket]
            if (items.length === 0) return null
            return (
              <div key={bucket}>
                <h2 className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-faint">
                  {bucket === 'today' ? 'Today' : 'Earlier'}
                  <span className="h-px flex-1 bg-line" aria-hidden />
                  <span className="tabular-nums">{items.length}</span>
                </h2>

                <div className="space-y-2.5">
                  <AnimatePresence mode="popLayout">
                    {items.map((n, i) => {
                      const t = toneMap[n.tone]
                      const href = links[n.id]
                      return (
                        <motion.div key={n.id} layout
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -24, transition: { duration: 0.18 } }}
                          transition={{ ...spring, delay: Math.min(i * 0.04, 0.2) }}>
                          <Card className={cn('relative !py-4 transition-colors', !n.read && 'border-leaf-400/35')}>
                            {!n.read && (
                              <span className="absolute -left-px top-5 h-6 w-1 rounded-r-full bg-leaf-500" aria-hidden />
                            )}
                            <div className="flex items-start gap-3">
                              <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-lg', t.bg)} aria-hidden>
                                {n.icon}
                              </span>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <h3 className={cn('text-sm leading-tight', n.read ? 'font-semibold text-muted' : 'font-bold')}>
                                    {n.title}
                                  </h3>
                                  <Chip tone={t.chip}>{t.label}</Chip>
                                  <span className="ml-auto shrink-0 text-[11px] text-faint">{timeAgo(n.time)}</span>
                                </div>
                                <p className={cn('mt-1 text-sm leading-relaxed', n.read ? 'text-faint' : 'text-muted')}>
                                  {n.body}
                                </p>

                                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                  {href && (
                                    <Link href={href} onClick={() => markRead(n.id)} className="btn btn-quiet btn-sm">
                                      Open →
                                    </Link>
                                  )}
                                  <button onClick={() => toggleRead(n.id)} className="btn btn-quiet btn-sm">
                                    {n.read ? 'Mark unread' : 'Mark read'}
                                  </button>
                                  <button onClick={() => remove(n.id)}
                                    className="btn btn-quiet btn-sm ml-auto text-red-500" aria-label={`Dismiss ${n.title}`}>
                                    ✕ Dismiss
                                  </button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}

          {list.length === 0 && (
            <Card className="grid place-items-center py-16 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-line/40 text-2xl" aria-hidden>🔕</span>
              <p className="mt-3 text-sm font-semibold">
                {filter === 'Unread' ? 'Nothing unread — you are all caught up.' : 'No notifications in this view.'}
              </p>
              <button onClick={() => setFilter('All')} className="btn btn-ghost btn-sm mt-3">Show all</button>
            </Card>
          )}
        </div>

        {/* ----------------------------------------------------- sidebar */}
        <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <Reveal delay={0.08}>
            <Card>
              <h2 className="mb-3 text-sm font-bold">Active farm alerts</h2>
              <ul className="space-y-2">
                {alerts.map((a) => (
                  <li key={a.id}>
                    <Link href="/weather" className="flex items-start gap-2.5 rounded-2xl border border-line/60 p-3 transition-colors hover:border-line">
                      <span className="text-lg" aria-hidden>{a.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold leading-snug">{a.title}</span>
                        <span className="mt-0.5 block text-[11px] text-faint">⏱ {a.when}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/weather" className="btn btn-ghost btn-sm mt-3 w-full">Open Weather &amp; Alerts →</Link>
            </Card>
          </Reveal>

          <Reveal delay={0.14}>
            <Card>
              <h2 className="mb-3 text-sm font-bold">Notification preferences</h2>
              <ul className="space-y-2.5">
                {[
                  ['🌧️', 'Weather alerts', true],
                  ['🐛', 'Crop health warnings', true],
                  ['📈', 'Price changes on my crops', true],
                  ['📅', 'Booking reminders', true],
                  ['🏛️', 'Scheme deadlines', true],
                  ['📣', 'Community mentions', false],
                ].map(([i, k, on]) => (
                  <li key={k as string} className="flex items-center gap-2.5 text-sm">
                    <span aria-hidden>{i as string}</span>
                    <span className="flex-1 text-muted">{k as string}</span>
                    <span className={cn('relative h-5 w-9 shrink-0 rounded-full transition-colors',
                      on ? 'bg-leaf-600' : 'bg-line')}>
                      <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all',
                        on ? 'left-[18px]' : 'left-0.5')} aria-hidden />
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] leading-snug text-faint">
                ◆ Static display — preferences are not saved in this prototype. A real build would store
                them per account and drive push notifications from here.
              </p>
            </Card>
          </Reveal>

          <Reveal delay={0.2}>
            <Card className="!bg-gradient-to-br !from-leaf-400/10 !via-surface !to-surface">
              <h2 className="font-display text-base font-black">Never miss a spray window</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Weather alerts and crop health warnings are the two notifications worth acting on the same
                day. Everything else can wait until evening.
              </p>
              <Link href="/weather" className="btn btn-primary btn-sm mt-3 w-full">Check weather now</Link>
            </Card>
          </Reveal>
        </div>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-faint">
        ◆ All notifications are sample content generated for the demo. Dismissing or marking them read only
        changes this page for the current session.
      </p>
    </div>
  )
}
