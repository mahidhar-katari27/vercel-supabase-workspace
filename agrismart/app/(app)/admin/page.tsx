'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, Chip, Counter, Delta, DemoTag, PageHeader, Progress, Reveal, Tabs } from '@/components/ui'
import { BarChart, Donut, LineChart } from '@/components/charts'
import { adminQueue, adminStats } from '@/lib/data'
import { cn, inr, num } from '@/lib/utils'

const growthMonths = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
const growthSeries = {
  farmers: [31200, 34100, 37800, 41200, 44900, 48210],
  listings: [3800, 4300, 4900, 5500, 6200, 6840],
  bookings: [1800, 2100, 2450, 2900, 3200, 3410],
}

const userSample = [
  { id: 'u1', name: 'Ramesh Naidu', role: 'Farmer', place: 'Vijayawada', joined: 'Mar 2024', status: 'Active', acres: 4.5 },
  { id: 'u2', name: 'Dr. Anitha Reddy', role: 'Expert', place: 'Hyderabad', joined: 'Jan 2025', status: 'Verified', acres: 0 },
  { id: 'u3', name: 'Krishna Agro Services', role: 'Provider', place: 'Vijayawada', joined: 'Jun 2024', status: 'Verified', acres: 0 },
  { id: 'u4', name: 'Surya Aqua Exports', role: 'Buyer', place: 'Bhimavaram', joined: 'Nov 2024', status: 'Active', acres: 0 },
  { id: 'u5', name: 'Venkatesh Rao', role: 'Farmer', place: 'Guntur', joined: 'Aug 2026', status: 'Pending KYC', acres: 2.0 },
  { id: 'u6', name: 'Lakshmi Devi', role: 'Farmer', place: 'Gudivada', joined: 'Feb 2025', status: 'Active', acres: 3.2 },
]

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'queue', label: `Moderation (${adminQueue.length})`, icon: '🚩' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'data', label: 'Data quality', icon: '🧪' },
]

export default function AdminPage() {
  const [tab, setTab] = useState('overview')
  const [queue, setQueue] = useState(adminQueue)
  const [resolved, setResolved] = useState<Array<{ id: string; action: string }>>([])
  const [metric, setMetric] = useState<'farmers' | 'listings' | 'bookings'>('farmers')

  const act = (id: string, action: string) => {
    setQueue((q) => q.filter((x) => x.id !== id))
    setResolved((r) => [...r, { id, action }])
  }

  return (
    <div className="section">
      <PageHeader
        icon="🏢"
        title="Admin Dashboard"
        sub="Platform health, moderation queue and user management."
        tag={<DemoTag />}
      >
        <div className="rounded-3xl border border-gold-400/35 bg-gold-400/10 p-4 text-sm leading-relaxed text-muted">
          <p className="mb-1 font-bold text-gold-600 dark:text-gold-400">◆ Demo console — no real data</p>
          Every figure here is invented for the prototype. This page is not behind authentication, and
          actions taken on it affect only this browser session. A production admin console must sit behind
          role-based access control with an audit log.
        </div>
      </PageHeader>

      {/* ------------------------------------------------------------ stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {adminStats.map((s, i) => (
          <Reveal key={s.id} delay={i * 0.05}>
            <Card hover className="h-full">
              <div className="flex items-start justify-between gap-2">
                <span className={cn('grid h-10 w-10 place-items-center rounded-2xl text-lg',
                  s.tone === 'danger' ? 'bg-red-500/10' : s.tone === 'warn' ? 'bg-gold-400/10' : 'bg-leaf-400/10')} aria-hidden>
                  {s.icon}
                </span>
                <Delta value={s.delta} />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">{s.label}</p>
              <p className="stat-value mt-1"><Counter to={s.value} /></p>
              <p className="mt-1 text-[11px] text-faint">vs previous 30 days</p>
            </Card>
          </Reveal>
        ))}
      </div>

      <div className="mt-5">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {/* --------------------------------------------------------- overview */}
      {tab === 'overview' && (
        <motion.div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold">Growth over 6 months</h2>
              <div className="flex gap-1.5">
                {(['farmers', 'listings', 'bookings'] as const).map((m) => (
                  <button key={m} onClick={() => setMetric(m)}
                    className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold capitalize transition-all',
                      metric === m ? 'bg-ink text-bg' : 'bg-line/40 text-muted hover:bg-line/70')}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <LineChart
              series={[{ name: metric, color: '#22965c', data: growthSeries[metric] }]}
              labels={growthMonths} height={250}
              formatValue={(v) => num(Math.round(v))}
            />
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                ['6-month growth', `${(((growthSeries[metric][5]! - growthSeries[metric][0]!) / growthSeries[metric][0]!) * 100).toFixed(1)}%`],
                ['Best month', growthMonths[growthSeries[metric].reduce((best, v, i, a) => (i > 0 && v - a[i - 1]! > a[best]! - a[best - 1]!) ? i : best, 1)]!],
                ['Current', num(growthSeries[metric][5]!)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl border border-line/60 bg-surface/50 p-2.5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{k}</p>
                  <p className="font-display text-base font-black">{v}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-4">
            <Card>
              <h2 className="mb-4 text-base font-bold">Users by role</h2>
              <Donut
                data={[
                  { label: 'Farmers', value: 48210, color: '#22965c' },
                  { label: 'Buyers', value: 4180, color: '#3b8fd4' },
                  { label: 'Providers', value: 1290, color: '#d4a537' },
                  { label: 'Experts', value: 318, color: '#c0553f' },
                ]}
                centerValue="53,998"
                centerLabel="Total accounts"
              />
            </Card>

            <Card>
              <h2 className="mb-3 text-base font-bold">Bookings by service</h2>
              <BarChart
                labels={['Tractor', 'Harvester', 'Drone', 'Expert', 'Driver']}
                values={[1240, 620, 880, 410, 260]}
                height={190}
                formatValue={(v) => num(v)}
              />
            </Card>
          </div>
        </motion.div>
      )}

      {/* ------------------------------------------------------------ queue */}
      {tab === 'queue' && (
        <motion.div className="mt-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4 flex flex-wrap items-center gap-2.5">
            <span className="text-sm font-bold">{queue.length} item{queue.length === 1 ? '' : 's'} awaiting action</span>
            {resolved.length > 0 && <Chip tone="live">{resolved.length} handled this session</Chip>}
            <Chip tone="demo">Demo queue</Chip>
          </div>

          <div className="space-y-3">
            {queue.map((q, i) => (
              <Reveal key={q.id} delay={i * 0.05}>
                <Card className="!py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Chip tone={q.type === 'Report' ? 'danger' : q.type.includes('verification') ? 'info' : 'demo'}>
                          {q.type}
                        </Chip>
                        <span className="text-[11px] text-faint">raised {q.age} ago · by {q.by}</span>
                      </div>
                      <p className="mt-1.5 text-sm font-semibold leading-snug">{q.item}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button onClick={() => act(q.id, q.action)} className="btn btn-primary btn-sm">{q.action}</button>
                      <button onClick={() => act(q.id, 'Dismissed')} className="btn btn-ghost btn-sm">Dismiss</button>
                    </div>
                  </div>
                </Card>
              </Reveal>
            ))}

            {queue.length === 0 && (
              <Card className="grid place-items-center py-16 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-leaf-400/10 text-2xl" aria-hidden>✅</span>
                <p className="mt-3 text-sm font-semibold">Queue is clear.</p>
                <p className="mt-1 text-xs text-muted">{resolved.length} item{resolved.length === 1 ? '' : 's'} handled this session.</p>
              </Card>
            )}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-faint">
            ◆ Actions here only update this page for the current session. Nothing is written anywhere and
            no real content is moderated.
          </p>
        </motion.div>
      )}

      {/* ------------------------------------------------------------ users */}
      {tab === 'users' && (
        <motion.div className="mt-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card pad={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-line/70 bg-surface/50 text-left text-[11px] font-bold uppercase tracking-wider text-faint">
                    <th className="px-5 py-3">User</th>
                    <th className="px-3 py-3">Role</th>
                    <th className="px-3 py-3">Location</th>
                    <th className="px-3 py-3">Joined</th>
                    <th className="px-3 py-3 text-right">Land</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  {userSample.map((u) => (
                    <tr key={u.id} className="transition-colors hover:bg-line/20">
                      <td className="px-5 py-3 font-semibold">{u.name}</td>
                      <td className="px-3 py-3"><Chip tone={u.role === 'Expert' ? 'info' : 'default'}>{u.role}</Chip></td>
                      <td className="px-3 py-3 text-muted">{u.place}</td>
                      <td className="px-3 py-3 text-muted">{u.joined}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-muted">{u.acres > 0 ? `${u.acres} ac` : '—'}</td>
                      <td className="px-5 py-3">
                        <Chip tone={u.status === 'Active' ? 'live' : u.status === 'Verified' ? 'info' : 'demo'}>
                          {u.status}
                        </Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="mt-3 text-xs leading-relaxed text-faint">
            ◆ Six sample rows out of a stated {num(48210)} accounts. A real console would paginate, search
            and log every admin action against an audit trail.
          </p>
        </motion.div>
      )}

      {/* ------------------------------------------------------------- data */}
      {tab === 'data' && (
        <motion.div className="mt-5 grid gap-4 lg:grid-cols-2"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <h2 className="mb-4 text-base font-bold">Content freshness</h2>
            <ul className="space-y-3">
              {[
                ['Market prices', 62, 'demo', '8 rows, 2 markets stale by 2+ days'],
                ['Scheme deadlines', 78, 'demo', '3 AP schemes need a deadline refresh'],
                ['Expert verification', 91, 'live', '2 submissions pending'],
                ['Listing moderation', 84, 'live', '1 listing awaiting approval'],
                ['Weather source', 0, 'danger', 'No weather API connected'],
              ].map(([label, pctv, tone, note]) => (
                <li key={label as string}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{label as string}</span>
                    <span className="text-xs font-bold tabular-nums text-muted">{pctv as number}%</span>
                  </div>
                  <Progress value={pctv as number} tone={tone as 'leaf' | 'gold' | 'danger'} className="mt-1.5" />
                  <p className="mt-1 text-[11px] text-faint">{note as string}</p>
                </li>
              ))}
            </ul>
          </Card>

          <div className="space-y-4">
            <Card>
              <h2 className="mb-3 text-base font-bold">Known gaps in this prototype</h2>
              <ul className="space-y-2 text-sm leading-relaxed text-muted">
                {[
                  'No authentication — every page is publicly reachable.',
                  'No database writes; state resets on refresh.',
                  'Market and weather data are static sample values.',
                  'AI Crop Doctor is a rule-based demo, not a trained model.',
                  'Maps are illustrative schematics with no routing.',
                ].map((g) => (
                  <li key={g} className="flex gap-2">
                    <span className="shrink-0 text-red-500" aria-hidden>✕</span>{g}
                  </li>
                ))}
              </ul>
              <p className="mt-3 rounded-2xl bg-surface/60 p-3 text-xs leading-relaxed text-muted">
                Listing these honestly is deliberate — the point of the demo is the experience and the
                thinking, not a claim that the backend exists.
              </p>
            </Card>

            <Card>
              <h2 className="mb-3 text-base font-bold">If this went live</h2>
              <ol className="space-y-2 text-sm leading-relaxed text-muted">
                {[
                  ['Role-based auth with an audit log for every admin action.'],
                  ['A verified data pipeline for mandi prices, with a visible source and timestamp.'],
                  ['A trained crop-disease model with a documented accuracy range — and the disclaimer kept.'],
                  ['Real map tiles and routing, with consent before storing field coordinates.'],
                  ['Payments held in escrow until a booking is completed.'],
                ].map(([t], i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-leaf-400/15 text-[10px] font-black text-leaf-700 dark:text-leaf-300">
                      {i + 1}
                    </span>
                    <span>{t}</span>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </motion.div>
      )}

      <div className="mt-6 flex flex-wrap gap-2.5">
        <Link href="/dashboard" className="btn btn-ghost">👨‍🌾 Back to farmer view</Link>
        <Link href="/notifications" className="btn btn-quiet">🔔 Notifications</Link>
      </div>
    </div>
  )
}
