'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, Chip, Counter, DemoTag, PageHeader, Progress, Reveal, StatCard, spring } from '@/components/ui'
import NearbyServices from '@/components/maps/NearbyServices'
import { BarChart, Gauge, LineChart, Sparkline } from '@/components/charts'
import {
  alerts, bookings, farmer, financeSummary, lands, marketRows,
  monthlyFinance, notifications, priceHistory, weather,
} from '@/lib/data'
import { greeting, inr, timeAgo, todayLabel } from '@/lib/utils'

const QUICK = [
  { href: '/crop-doctor', icon: '🤖', label: 'AI Crop Doctor' },
  { href: '/finance', icon: '💰', label: 'Farm Finance' },
  { href: '/agrirent', icon: '🚜', label: 'Rent Machinery' },
  { href: '/schemes', icon: '🏛️', label: 'Check Schemes' },
  { href: '/market', icon: '📈', label: 'Market Prices' },
  { href: '/community', icon: '👥', label: 'Ask Community' },
]

export default function DashboardPage() {
  const nextBooking = bookings.find((b) => b.status === 'Confirmed' || b.status === 'Pending')

  return (
    <div className="section">
      {/* ---------------------------------------------------------- header */}
      <PageHeader
        icon="👋"
        title={`${greeting()}, ${farmer.name.split(' ')[0]} 👋`}
        sub={todayLabel()}
        tag={<DemoTag />}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Chip icon="📍">{farmer.location}</Chip>
          <Chip icon="🗓️">{farmer.season}</Chip>
          <Chip icon={weather.now.icon}>
            {weather.now.temp}°C · {weather.now.condition}
          </Chip>
          <Chip icon="🌾">{farmer.activeCrops} active crops</Chip>
        </div>
      </PageHeader>

      {/* ------------------------------------------------------- key stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Reveal delay={0}><StatCard icon="🌾" label="My Land" value={`${farmer.totalAcres} Acres`} sub={`${farmer.activeCrops} active crops`} tone="leaf" /></Reveal>
        <Reveal delay={0.06}><StatCard icon="💰" label="Farm Profit" to={financeSummary.estimatedProfit} prefix="₹" sub="Estimated this season" delta={12.4} tone="gold" /></Reveal>
        <Reveal delay={0.12}>
          <Card hover className="relative overflow-hidden">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-sky-400/20 to-transparent blur-2xl" aria-hidden />
            <div className="relative flex items-start justify-between gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-sky-400/20 to-transparent text-lg text-sky-500" aria-hidden>🌱</span>
              <Chip tone="live">Healthy</Chip>
            </div>
            <div className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">Crop Health</div>
            <div className="stat-value mt-1"><Counter to={92} suffix="%" /></div>
            <Progress value={92} tone="leaf" className="mt-2" />
          </Card>
        </Reveal>
        <Reveal delay={0.18}>
          <Card hover className="relative overflow-hidden">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-earth-300/20 to-transparent blur-2xl" aria-hidden />
            <div className="relative flex items-start justify-between gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-earth-300/20 to-transparent text-lg text-earth-600 dark:text-earth-300" aria-hidden>📈</span>
              <Sparkline data={priceHistory.series[0]!.data.slice(-8)} color="#22965c" width={70} height={26} />
            </div>
            <div className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">Market · Paddy</div>
            <div className="stat-value mt-1">₹2,350<span className="text-base font-bold text-faint">/Qtl</span></div>
            <div className="mt-1 text-sm font-bold text-leaf-600 dark:text-leaf-400">↑ 4.2% this week</div>
          </Card>
        </Reveal>
      </div>

      {/* ---------------------------------------------------- quick actions */}
      <Reveal delay={0.1}>
        <div className="mt-6">
          <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
            {QUICK.map((q) => (
              <Link key={q.href} href={q.href}
                className="glass card-hover flex min-w-[132px] shrink-0 flex-col items-center gap-2 rounded-3xl px-4 py-4 text-center sm:min-w-0">
                <span className="text-2xl transition-transform duration-500 group-hover:scale-110" aria-hidden>{q.icon}</span>
                <span className="text-xs font-bold leading-tight">{q.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      {/* -------------------------------------------------- weather + alerts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-1">
          <Card className="h-full">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-bold">Today&rsquo;s weather</h2>
                <p className="text-xs text-muted">{farmer.location.split(',')[0]}</p>
              </div>
              <DemoTag />
            </div>
            <div className="flex items-center gap-4">
              <motion.span className="text-6xl" aria-hidden
                animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                {weather.now.icon}
              </motion.span>
              <div>
                <p className="font-display text-4xl font-black tabular-nums">{weather.now.temp}°</p>
                <p className="text-sm text-muted">{weather.now.condition} · feels {weather.now.feels}°</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                ['💧', 'Humidity', `${weather.now.humidity}%`],
                ['🌬️', 'Wind', `${weather.now.wind} km/h`],
                ['🌧️', 'Rain', `${weather.now.rain}%`],
              ].map(([i, l, v]) => (
                <div key={l} className="rounded-2xl border border-line/60 bg-surface/40 p-2.5 text-center">
                  <span className="text-base" aria-hidden>{i}</span>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-faint">{l}</p>
                  <p className="text-sm font-bold tabular-nums">{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
              {weather.forecast.map((d) => (
                <div key={d.day} className="min-w-[62px] shrink-0 rounded-2xl border border-line/60 bg-surface/40 p-2 text-center">
                  <p className="text-[10px] font-bold uppercase text-faint">{d.day}</p>
                  <p className="my-1 text-lg" aria-hidden>{d.icon}</p>
                  <p className="text-xs font-bold tabular-nums">{d.hi}°</p>
                  <p className="text-[10px] tabular-nums text-sky-500">{d.rain}%</p>
                </div>
              ))}
            </div>
            <Link href="/weather" className="btn btn-ghost btn-sm mt-4 w-full">Full forecast & alerts</Link>
          </Card>
        </Reveal>

        <Reveal className="lg:col-span-2" delay={0.08}>
          <Card className="h-full">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">Smart farm alerts</h2>
              <Chip tone="demo">{alerts.length} active</Chip>
            </div>
            <ul className="space-y-2.5">
              {alerts.map((a, i) => (
                <motion.li key={a.id}
                  initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  transition={{ ...spring, delay: i * 0.07 }}>
                  <div className={alertClass(a.tone)}>
                    <span className="text-xl" aria-hidden>{a.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold">{a.title}</p>
                        <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider dark:bg-white/10">{a.when}</span>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">{a.body}</p>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </Card>
        </Reveal>
      </div>

      {/* --------------------------------------------------------- my lands */}
      <div className="mt-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold sm:text-xl">My lands</h2>
            <p className="text-sm text-muted">{lands.length} profiles · {farmer.totalAcres} acres total</p>
          </div>
          <Link href="/farm" className="btn btn-ghost btn-sm">Manage farm <span aria-hidden>→</span></Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {lands.map((l, i) => (
            <Reveal key={l.id} delay={i * 0.07}>
              <Link href="/farm" className="card card-hover block h-full">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-base font-black">{l.name}</p>
                    <p className="text-xs text-muted">📍 {l.location}</p>
                  </div>
                  <Chip tone={l.health >= 85 ? 'live' : 'demo'}>{l.health}% healthy</Chip>
                </div>
                {/* Crop stage visual */}
                <div className="relative mt-4 h-24 overflow-hidden rounded-2xl border border-line/60 bg-gradient-to-b from-leaf-400/10 to-earth-300/10">
                  <FieldArt progress={l.progress} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <Row k="Area" v={`${l.acres} Acres`} />
                  <Row k="Crop" v={l.crop} />
                  <Row k="Soil" v={l.soil} />
                  <Row k="Irrigation" v={l.irrigation} />
                </dl>
                <div className="mt-4">
                  <Progress value={l.progress} label={`${l.stage} · harvest ${l.harvest}`} showValue />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ----------------------------------------------------- finance + mkt */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">Investment vs revenue</h2>
              <DemoTag />
            </div>
            <BarChart
              labels={monthlyFinance.labels}
              stacked={[
                { name: 'Investment', color: '#c0553f', data: monthlyFinance.investment },
                { name: 'Revenue', color: '#22965c', data: monthlyFinance.revenue },
              ]}
              height={210}
              formatValue={(v) => inr(v, { compact: true })}
            />
            <p className="mt-3 text-xs leading-relaxed text-faint">{financeSummary.note}</p>
            <Link href="/finance" className="btn btn-ghost btn-sm mt-3 w-full">Open Farm Finance</Link>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card className="h-full">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">Market snapshot</h2>
              <DemoTag />
            </div>
            <ul className="divide-y divide-line/60">
              {marketRows.slice(0, 5).map((r) => {
                const up = r.price >= r.prev
                const ch = ((r.price - r.prev) / r.prev) * 100
                return (
                  <li key={r.crop + r.market} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{r.crop}</p>
                      <p className="truncate text-xs text-muted">{r.market}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums">{inr(r.price)}<span className="text-xs font-medium text-faint">/{r.unit.slice(0, 3)}</span></p>
                      <p className={up ? 'text-xs font-bold text-leaf-600 dark:text-leaf-400' : 'text-xs font-bold text-red-500'}>
                        {up ? '↑' : '↓'} {Math.abs(ch).toFixed(1)}%
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
            <Link href="/market" className="btn btn-ghost btn-sm mt-3 w-full">Market intelligence</Link>
          </Card>
        </Reveal>
      </div>

      {/* ------------------------------------------- bookings + notifications */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">Upcoming bookings</h2>
              <Link href="/bookings" className="text-xs font-bold text-leaf-600 dark:text-leaf-400">View all →</Link>
            </div>
            {nextBooking ? (
              <div className="rounded-3xl border border-leaf-400/30 bg-leaf-400/10 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-leaf-gradient text-lg" aria-hidden>{nextBooking.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{nextBooking.service}</p>
                    <p className="truncate text-xs text-muted">{nextBooking.provider}</p>
                  </div>
                  <Chip tone="live">{nextBooking.status}</Chip>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Mini k="Date" v={nextBooking.date.slice(5)} />
                  <Mini k="Time" v={nextBooking.time.split(' ')[0]!} />
                  <Mini k="Amount" v={inr(nextBooking.amount)} />
                </div>
              </div>
            ) : <p className="text-sm text-muted">No upcoming bookings.</p>}
            <ul className="mt-3 space-y-2">
              {bookings.filter((b) => b.id !== nextBooking?.id).slice(0, 3).map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line/60 px-3 py-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span aria-hidden>{b.icon}</span>
                    <span className="truncate text-xs font-semibold">{b.service}</span>
                  </span>
                  <span className="shrink-0 text-[11px] font-bold text-muted">{b.date.slice(5)}</span>
                </li>
              ))}
            </ul>
            <Link href="/agrirent" className="btn btn-primary btn-sm mt-4 w-full">🚜 Book machinery</Link>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card className="h-full">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">Recent notifications</h2>
              <Link href="/notifications" className="text-xs font-bold text-leaf-600 dark:text-leaf-400">View all →</Link>
            </div>
            <ul className="space-y-2">
              {notifications.slice(0, 5).map((n) => (
                <li key={n.id} className="flex items-start gap-3 rounded-2xl border border-line/60 px-3 py-2.5 transition-colors hover:border-leaf-400/40">
                  <span className="text-lg" aria-hidden>{n.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{n.title}</p>
                    <p className="line-clamp-1 text-xs text-muted">{n.body}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-faint">{timeAgo(n.time)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      </div>

      {/* -------------------------------------------------------- crop health */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <Card className="h-full">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">Price trend — 12 weeks</h2>
              <DemoTag />
            </div>
            <LineChart series={priceHistory.series} labels={priceHistory.labels} height={240} />
          </Card>
        </Reveal>
        <Reveal delay={0.08}>
          <Card className="flex h-full flex-col items-center justify-center text-center">
            <h2 className="mb-1 text-base font-bold">Overall crop health</h2>
            <p className="mb-4 text-xs text-muted">Weighted across {lands.length} lands</p>
            <Gauge value={86} size={190} label="Healthy" />
            <ul className="mt-5 w-full space-y-2">
              {lands.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-muted">{l.crop}</span>
                  <span className="font-bold tabular-nums">{l.health}%</span>
                </li>
              ))}
            </ul>
            <Link href="/crop-doctor" className="btn btn-primary btn-sm mt-5 w-full">🤖 Run AI Crop Doctor</Link>
          </Card>
        </Reveal>
      </div>

      <div className="mt-10">
        <NearbyServices
          categories={['machinery', 'market', 'vet', 'office', 'expert']}
          title="Nearby for you"
          icon="📍"
          subtitle="Machinery, markets, vets, offices and experts around your farm — one tap from the Smart Map"
          limit={6}
        />
      </div>

    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-faint">{k}</dt>
      <dd className="truncate text-sm font-semibold">{v}</dd>
    </div>
  )
}

function Mini({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-surface/60 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{k}</p>
      <p className="text-sm font-bold tabular-nums">{v}</p>
    </div>
  )
}

function alertClass(tone: string) {
  const map: Record<string, string> = {
    warn: 'border-gold-400/35 bg-gold-400/10',
    danger: 'border-red-400/35 bg-red-500/10',
    info: 'border-sky-400/35 bg-sky-400/10',
    ok: 'border-leaf-400/35 bg-leaf-400/10',
  }
  return `flex items-start gap-3 rounded-3xl border p-3.5 ${map[tone] ?? map.info}`
}

/** Tiny procedural field illustration — no image requests. */
function FieldArt({ progress }: { progress: number }) {
  const cols = 11
  const h = 6 + (progress / 100) * 34
  return (
    <svg viewBox="0 0 220 96" className="absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="none">
      <defs>
        <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8d6a45" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#553e29" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect x="0" y="62" width="220" height="34" fill="url(#soil)" />
      {Array.from({ length: cols }, (_, i) => {
        const x = 10 + i * 20
        return (
          <g key={i} style={{ animation: `sway ${4 + (i % 3)}s ease-in-out ${i * 0.15}s infinite`, transformOrigin: `${x}px 64px` }}>
            <line x1={x} y1={64} x2={x} y2={64 - h} stroke="#22965c" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx={x - 4} cy={64 - h * 0.6} rx="4" ry="2" fill="#4bb37c" transform={`rotate(-30 ${x - 4} ${64 - h * 0.6})`} />
            <ellipse cx={x + 4} cy={64 - h * 0.8} rx="4" ry="2" fill="#7fcfa4" transform={`rotate(30 ${x + 4} ${64 - h * 0.8})`} />
            {progress > 70 && <circle cx={x} cy={64 - h} r="2.6" fill="#d4a537" />}
          </g>
        )
      })}
    </svg>
  )
}
