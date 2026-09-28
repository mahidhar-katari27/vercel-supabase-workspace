'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, Chip, DemoTag, PageHeader, Reveal, spring } from '@/components/ui'
import { LineChart } from '@/components/charts'
import { alerts, farmer, weather, type Alert } from '@/lib/data'
import type { LiveWeather } from '@/lib/weather'
import { fetchLiveWeather, weatherAdvice } from '@/lib/weather'
import type { FarmPlan } from '@/lib/farmPlan'
import { loadPlan, stageAt } from '@/lib/farmPlan'
import { cropInfo } from '@/lib/cropDb'
import { cn } from '@/lib/utils'

const toneStyle: Record<Alert['tone'], { bar: string; chip: 'danger' | 'demo' | 'info' | 'live'; bg: string }> = {
  danger: { bar: '!border-l-red-500', chip: 'danger', bg: 'bg-red-500/10' },
  warn: { bar: '!border-l-gold-400', chip: 'demo', bg: 'bg-gold-400/10' },
  info: { bar: '!border-l-sky-400', chip: 'info', bg: 'bg-sky-400/10' },
  ok: { bar: '!border-l-leaf-500', chip: 'live', bg: 'bg-leaf-400/10' },
}

const adviceCards = [
  { icon: '💧', title: 'Hold irrigation for two days', body: 'Rain is forecast Thursday and Friday at 65–80%. Running the pump now risks waterlogging paddy roots.', tone: 'info' as const },
  { icon: '🧪', title: 'Do not spray until Saturday', body: 'Foliar spray within 48 hours of rain washes off the leaf. Wait for a clear window and spray after 5 PM when wind drops.', tone: 'danger' as const },
  { icon: '🌱', title: 'Good window for basal dressing', body: 'Moist soil helps urea dissolve and move into the root zone. Apply before the rain starts, not after it stops.', tone: 'ok' as const },
  { icon: '🚜', title: 'Delay the harvest booking', body: 'Grain above 20% moisture stores badly and fetches less at the yard. Let it field-dry through the wet spell.', tone: 'warn' as const },
]

export default function WeatherPage() {
  const [place, setPlace] = useState(farmer.location)
  const [loading, setLoading] = useState(false)
  const [shown, setShown] = useState(true)

  const check = () => {
    setLoading(true); setShown(false)
    setTimeout(() => { setLoading(false); setShown(true) }, 1100)
  }

  const now = weather.now
  const f = weather.forecast

  return (
    <div className="section">
      <PageHeader
        icon="🌦️"
        title="Weather & Farm Alerts"
        sub="Local forecast plus the field decisions that follow from it."
        tag={<DemoTag />}
      >
        <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:min-w-[360px]">
          <input className="input flex-1" value={place} onChange={(e) => setPlace(e.target.value)}
            placeholder="Village, mandal or town" aria-label="Location" />
          <button onClick={check} disabled={loading} className="btn btn-primary shrink-0">
            {loading ? 'Loading…' : '🔍 Check Weather'}
          </button>
        </div>
      </PageHeader>

      {/* ------------------------------------------------- live forecast */}
      <LiveWeatherCard />

      <div className="mb-5 rounded-3xl border border-gold-400/35 bg-gold-400/10 p-4 text-sm leading-relaxed text-muted">
        <p className="mb-1 font-bold text-gold-600 dark:text-gold-400">◆ Sample forecast — no weather API connected</p>
        This page works fully offline, which means the numbers are illustrative and never change with real
        conditions. Searching a different town does not change the forecast. Do not use them for spray,
        irrigation or harvest decisions — check IMD or your local agromet advisory.
      </div>

      {loading ? (
        <Card className="grid place-items-center py-20">
          <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sky-400/10 text-3xl"
              animate={{ rotate: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 1.4 }}>
              ☁️
            </motion.div>
            <p className="mt-4 text-sm font-semibold text-muted">Fetching forecast for {place}…</p>
          </motion.div>
        </Card>
      ) : shown ? (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
          {/* -------------------------------------------------------- current */}
          <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
            <Reveal>
              <Card className="h-full overflow-hidden !bg-gradient-to-br !from-sky-400/10 !via-surface !to-surface">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted">Now · {place}</p>
                    <div className="mt-1 flex items-end gap-3">
                      <span className="font-display text-7xl font-black leading-none tracking-tighter">{now.temp}°</span>
                      <span className="pb-2 text-4xl" aria-hidden>{now.icon}</span>
                    </div>
                    <p className="mt-2 font-semibold">{now.condition}</p>
                    <p className="text-sm text-muted">Feels like {now.feels}°C</p>
                    <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">{weather.advice}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      ['💧', 'Humidity', `${now.humidity}%`],
                      ['💨', 'Wind', `${now.wind} km/h`],
                      ['🌧️', 'Rain chance', `${now.rain}%`],
                      ['☀️', 'UV index', String(now.uv)],
                    ].map(([i, k, v]) => (
                      <div key={k} className="rounded-2xl border border-line/60 bg-surface/70 px-3 py-2.5 backdrop-blur-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{i} {k}</p>
                        <p className="font-display text-lg font-black tabular-nums">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Chip tone={now.uv >= 8 ? 'danger' : 'info'}>UV {now.uv} — {now.uv >= 8 ? 'very high' : 'moderate'}</Chip>
                  <Chip tone={now.wind >= 15 ? 'demo' : 'live'}>Wind {now.wind} km/h — {now.wind >= 15 ? 'poor spray conditions' : 'spray OK after 5 PM'}</Chip>
                  <Chip tone={now.humidity >= 70 ? 'demo' : 'info'}>Humidity {now.humidity}% — {now.humidity >= 70 ? 'fungal risk' : 'normal'}</Chip>
                </div>
              </Card>
            </Reveal>

            {/* --------------------------------------------------- 7-day strip */}
            <Reveal delay={0.08}>
              <Card className="h-full">
                <h2 className="mb-3 text-sm font-bold">7-day outlook</h2>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {f.map((d, i) => (
                    <motion.div key={d.day}
                      className={cn('min-w-[62px] flex-1 rounded-2xl border p-2.5 text-center transition-colors',
                        i === 0 ? 'border-leaf-400/50 bg-leaf-400/10' : 'border-line/60 hover:border-line')}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ ...spring, delay: 0.05 * i }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{d.day}</p>
                      <p className="my-1 text-2xl" aria-hidden>{d.icon}</p>
                      <p className="font-display text-sm font-black tabular-nums">{d.hi}°</p>
                      <p className="text-[11px] text-muted tabular-nums">{d.lo}°</p>
                      <p className={cn('mt-1 text-[10px] font-bold tabular-nums', d.rain >= 60 ? 'text-sky-500' : d.rain >= 40 ? 'text-gold-600 dark:text-gold-400' : 'text-faint')}>
                        {d.rain}%
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4">
                  <p className="label mb-2">Temperature range &amp; rain probability</p>
                  <LineChart
                    series={[
                      { name: 'High °C', color: '#d97a5e', data: f.map((d) => d.hi) },
                      { name: 'Low °C', color: '#354A29', data: f.map((d) => d.lo) },
                      { name: 'Rain %', color: '#5F7D95', data: f.map((d) => d.rain) },
                    ]}
                    labels={f.map((d) => d.day)}
                    height={170}
                  />
                </div>
              </Card>
            </Reveal>
          </div>

          {/* ---------------------------------------------------------- alerts */}
          <h2 className="section-title">Active farm alerts</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {alerts.map((a, i) => {
              const t = toneStyle[a.tone]
              return (
                <Reveal key={a.id} delay={i * 0.06}>
                  <Card className={cn('h-full border-l-4', t.bar)}>
                    <div className="flex items-start gap-3">
                      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-lg', t.bg)} aria-hidden>
                        {a.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold leading-tight">{a.title}</h3>
                          <Chip tone={t.chip}>{a.tone}</Chip>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-muted">{a.body}</p>
                        <p className="mt-1.5 text-[11px] font-semibold text-faint">⏱ {a.when}</p>
                      </div>
                    </div>
                  </Card>
                </Reveal>
              )
            })}
          </div>

          {/* ---------------------------------------------------------- advice */}
          <h2 className="section-title">What this means for your fields</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {adviceCards.map((a, i) => (
              <Reveal key={a.title} delay={i * 0.06}>
                <Card className="h-full">
                  <div className="flex items-start gap-3">
                    <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-lg', toneStyle[a.tone].bg)} aria-hidden>
                      {a.icon}
                    </span>
                    <div>
                      <h3 className="font-bold leading-tight">{a.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{a.body}</p>
                    </div>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-faint">
            These suggestions are general agronomy rules written for the demo and derived from the sample
            forecast above. They are not advice from an agronomist and do not account for your specific
            variety, soil test results or pest history.
          </p>
        </motion.div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2.5">
        <Link href="/farm" className="btn btn-ghost">🌾 Back to My Farm</Link>
        <Link href="/planner" className="btn btn-ghost">🗓️ Plan the next crop</Link>
        <Link href="/notifications" className="btn btn-quiet">🔔 All notifications</Link>
      </div>
    </div>
  )
}

/* ------------------------------------------------------ live weather card */

function LiveWeatherCard() {
  const [w, setW] = useState<LiveWeather | null>(null)
  const [place, setPlace] = useState(farmer.location)
  const [plan, setPlan] = useState<FarmPlan | null>(null)

  useEffect(() => {
    let alive = true
    const plan = loadPlan()
    setPlan(plan)
    const lat = plan?.location.lat ?? farmer.coords.lat
    const lng = plan?.location.lng ?? farmer.coords.lng
    const label = plan?.chosenCrop
      ? `${plan.location.village || plan.location.district || farmer.location}`
      : farmer.location
    setPlace(label)
    fetchLiveWeather(lat, lng, label).then((r) => { if (alive) setW(r) })
    return () => { alive = false }
  }, [])

  const advice = w && plan?.chosenCrop
    ? weatherAdvice(cropInfo(plan.chosenCrop), stageAt(plan, plan.chosenCrop).stage.name, w)
    : []

  return (
    <Reveal>
      <Card className="mb-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">📡 Live forecast — {place}</h2>
          {w
            ? (w.source === 'live'
              ? <Chip tone="live" icon="📡">Live · {w.provider}</Chip>
              : <Chip tone="demo" icon="◆">Sample — live API unreachable</Chip>)
            : <Chip>Fetching…</Chip>}
        </div>
        {w && (
          <>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {w.days.map((d, i) => (
                <div key={d.date} className={cn('rounded-2xl border p-3 text-center',
                  i === 0 ? 'border-leaf-400/50 bg-leaf-400/5' : 'border-line/50 bg-surface-2/40 dark:bg-black/10')}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{i === 0 ? 'Today' : d.label}</p>
                  <p className="mt-1 text-base font-bold tabular-nums">{d.hi}°</p>
                  <p className="text-[10px] tabular-nums text-muted">{d.lo}° · 🌧{d.rain}%</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Chip icon="🌡️">Now {w.tempC}°C</Chip>
              <Chip icon="💧">Humidity {w.humidity}%</Chip>
              <Chip icon="🍃">Wind {w.windKph} km/h</Chip>
              <Chip icon="🕒">Fetched {new Date(w.fetchedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Chip>
            </div>
            {advice.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-line/50 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  🌱 For your plan crop{plan?.chosenCrop ? ` (${cropInfo(plan.chosenCrop).key})` : ''}
                </p>
                {advice.slice(0, 4).map((a) => (
                  <p key={a.text} className={cn('flex items-start gap-2 text-xs leading-relaxed',
                    a.level === 'alert' ? 'text-red-500' : 'text-muted')}>
                    <span aria-hidden>{a.icon}</span>{a.text}
                  </p>
                ))}
                <Link href="/start" className="btn-quiet text-[11px]">Open farm plan →</Link>
              </div>
            )}
            <p className="mt-3 text-[11px] text-faint">
              {w.source === 'live'
                ? 'Forecast data: Open-Meteo (free, open weather API) for your plan/farm coordinates. The sections below use the labelled demo dataset.'
                : 'Live weather could not be reached — showing clearly-labelled sample values. Sections below use the labelled demo dataset.'}
            </p>
          </>
        )}
        {!w && <div className="h-28 animate-pulse rounded-2xl bg-surface-2/60 dark:bg-black/10" aria-hidden />}
      </Card>
    </Reveal>
  )
}
