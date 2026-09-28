'use client'
/**
 * Start Farming — crop results, economics, calendar, live weather and
 * comparison views (spec §6–§14). Every figure carries the estimate
 * disclaimer; nothing is ever presented as a guaranteed outcome.
 */
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { cropInfo, cropVisual } from '@/lib/cropDb'
import type { CropInfo } from '@/lib/cropDb'
import type { FarmPlan, Suitability } from '@/lib/farmPlan'
import {
  DISCLAIMER, economics, fmt, inr, SCENARIOS, stageAt, suitabilityFor, totalAcres,
} from '@/lib/farmPlan'
import type { LiveWeather } from '@/lib/weather'
import { fetchLiveWeather, weatherAdvice } from '@/lib/weather'
import { farmer } from '@/lib/data'
import { cn } from '@/lib/utils'
import { Card, Chip, Counter, Progress } from '@/components/ui'
import { Donut, Gauge } from '@/components/charts'

const DONUT = ['#354A29', '#818B54', '#C0562A', '#B98A2F', '#5F7D95', '#A3B18A', '#646B64', '#8d6a45']

export function Disclaimer({ className }: { className?: string }) {
  return <p className={cn('text-[11px] leading-relaxed text-faint', className)}>⚠️ {DISCLAIMER}</p>
}

export function riskLevel(crop: CropInfo, fit?: Suitability): { label: string; tone: 'ok' | 'demo' | 'danger' } {
  const hard = (fit?.considerations.length ?? 0) >= 3
  if (crop.beginnerFriendly >= 4 && !hard) return { label: 'Low', tone: 'ok' }
  if (crop.beginnerFriendly <= 2 || hard) return { label: 'High', tone: 'danger' }
  return { label: 'Medium', tone: 'demo' }
}

/* ------------------------------------------------------------ crop card */

export function CropCard({
  crop, fit, plan, selected, onSelect, onWhy, whyOpen, onCompare, compareOn, delay = 0, isTop = false,
}: {
  crop: CropInfo; fit?: Suitability; plan?: FarmPlan
  selected?: boolean; onSelect?: () => void; onWhy?: () => void; whyOpen?: boolean
  onCompare?: () => void; compareOn?: boolean; delay?: number; isTop?: boolean
}) {
  const vis = cropVisual(crop.key)
  const eco = useMemo(() => (plan ? economics(plan, crop.key) : null), [plan, crop.key])
  const risk = riskLevel(crop, fit)
  return (
    <motion.div
      initial={isTop ? { opacity: 0, y: 26, scale: 0.965 } : { opacity: 0, x: 30 }}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: isTop ? delay : 0.55 + delay }}
    >
      <Card hover className={cn('flex h-full flex-col overflow-hidden', selected && 'ring-2 ring-leaf-400/70')}>
        <div className="relative mb-4 h-36 overflow-hidden rounded-2xl">
          <Image src={vis.image} alt={`${vis.label} field`} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-3">
            <span className="text-base font-bold text-white">{vis.icon} {vis.label}</span>
            {fit && (
              <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-leaf-700">
                {fit.score}% fit
              </span>
            )}
          </div>
          {fit && isTop && (
            <span className="absolute left-3 top-3 rounded-full bg-leaf-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lift">
              Top match
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-muted">
          <Fact icon="🌤️" k="Climate" v={crop.climate} />
          <Fact icon="🌡️" k="Temp" v={`${crop.tempC[0]}–${crop.tempC[1]}°C`} />
          <Fact icon="💧" k="Water" v={crop.water} />
          <Fact icon="⏳" k="Duration" v={`${crop.durationDays[0]}–${crop.durationDays[1]} days`} />
          {isTop && eco ? (
            <>
              <CountFact icon="💰" k="Investment" to={eco.cost} suffix="/acre" />
              <CountFact icon="📈" k="Est. revenue" to={eco.revenue} suffix="/acre" />
              <CountFact icon="🏆" k="Est. profit" to={eco.profit} suffix="/acre" tone="ok" />
            </>
          ) : (
            <>
              <Fact icon="💰" k="Investment" v={`${inr(eco?.cost ?? cropTotal(crop))}/acre`} />
              <Fact icon="📈" k="Est. revenue" v={`${inr(eco?.revenue ?? 0)}/acre`} />
              <Fact icon="🏆" k="Est. profit" v={`${inr(eco?.profit ?? 0)}/acre`} tone="ok" />
            </>
          )}
          <Fact icon="⚠️" k="Risk level" v={risk.label} tone={risk.tone === 'ok' ? 'ok' : risk.tone === 'danger' ? 'bad' : undefined} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-line/50 pt-4">
          {onWhy && (
            <button type="button" className="btn-ghost flex-1 text-xs" onClick={onWhy} aria-expanded={whyOpen}>
              {whyOpen ? '▾ Hide why' : '🔎 Why this crop?'}
            </button>
          )}
          {onCompare && (
            <button type="button" className={cn('btn-ghost text-xs', compareOn && 'border-gold-400/60 text-gold-600 dark:text-gold-400')} onClick={onCompare} aria-pressed={compareOn}>
              {compareOn ? '✓ Comparing' : '⚖️ Compare'}
            </button>
          )}
          {onSelect && (
            <button type="button" className={cn('btn-primary flex-1 text-xs', selected && 'btn-gold')} onClick={onSelect}>
              {selected ? '✓ Selected' : '🌱 Select crop'}
            </button>
          )}
        </div>

        <AnimatePresence>
          {whyOpen && fit && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-4 space-y-3 rounded-2xl border border-line/60 bg-surface-2/50 p-4 dark:bg-black/15">
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-leaf-600 dark:text-leaf-400">✅ Why this crop fits you</p>
                  <ul className="space-y-1 text-xs leading-relaxed text-muted">
                    {fit.reasons.map((r) => <li key={r.text}>• {r.text}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">⚠️ Things to consider</p>
                  <ul className="space-y-1 text-xs leading-relaxed text-muted">
                    {fit.considerations.length === 0 && <li>• Nothing major — still monitor water, pests and price</li>}
                    {fit.considerations.map((r) => <li key={r.text}>• {r.text}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-red-500">🛡️ Key risks</p>
                  <ul className="space-y-1 text-xs leading-relaxed text-muted">
                    <li>💧 {crop.risks.water}</li>
                    <li>🐛 {crop.risks.pest}</li>
                    <li>📈 {crop.risks.market}</li>
                    <li>🌦️ {crop.risks.weather}</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {plan && <Disclaimer className="mt-3" />}
        {fit && <p className="mt-1 text-[10px] text-faint">“Fit” is an indicative suitability score from your wizard answers — not a promise of success.</p>}
      </Card>
    </motion.div>
  )
}

const cropTotal = (c: CropInfo) => Object.values(c.eco).reduce((a, b) => a + b, 0)

function CountFact({ icon, k, to, suffix = '', tone }: { icon: string; k: string; to: number; suffix?: string; tone?: 'ok' }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-faint"><span aria-hidden>{icon}</span> {k}</span>
      <span className={cn('font-bold tabular-nums', tone === 'ok' && 'text-leaf-700 dark:text-leaf-300')}>
        <Counter to={to} compact suffix={suffix} />
      </span>
    </div>
  )
}

function Fact({ icon, k, v, tone }: { icon: string; k: string; v: string; tone?: 'ok' | 'bad' }) {
  return (
    <div className="flex items-start gap-1.5">
      <span aria-hidden>{icon}</span>
      <span><span className="block text-[10px] uppercase tracking-wide text-faint">{k}</span>
        <span className={cn('font-semibold text-ink', tone === 'ok' && 'text-leaf-600 dark:text-leaf-400', tone === 'bad' && 'text-red-500')}>{v}</span></span>
    </div>
  )
}

/* ------------------------------------------------------------- economics */

export function EconomicsPanel({ plan, cropKey }: { plan: FarmPlan; cropKey: string }) {
  const crop = cropInfo(cropKey)
  const vis = cropVisual(cropKey)
  const [acres, setAcres] = useState(totalAcres(plan) || 1)
  const [openRow, setOpenRow] = useState<string | null>(null)
  const [adj, setAdj] = useState({ yieldPct: 0, pricePct: 0, costPct: 0 })
  const eco = useMemo(() => economics(plan, cropKey, { ...adj, acres }), [plan, cropKey, adj, acres])

  const whatIf = SCENARIOS.map((s) => {
    const e = economics(plan, cropKey, { yieldPct: s.yieldPct, pricePct: s.pricePct, costPct: s.costPct, acres })
    return { ...s, eco: e }
  })

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      {/* 1-acre breakdown */}
      <Card className="lg:col-span-3">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold">💰 1-Acre Economics — {vis.icon} {vis.label}</h3>
          <Chip tone="demo" icon="◆">Estimates</Chip>
        </div>
        <div className="space-y-1.5">
          {eco.costRows.map((r, i) => (
            <div key={r.label}>
              <button type="button" onClick={() => setOpenRow(openRow === r.label ? null : r.label)}
                className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-left text-sm transition hover:border-line/60 hover:bg-surface-2/50 dark:hover:bg-black/10"
                aria-expanded={openRow === r.label}>
                <span aria-hidden>{r.icon}</span>
                <span className="flex-1 font-medium">{r.label}</span>
                <span className="tabular-nums text-faint">{Math.round((r.value / (eco.cost || 1)) * 100)}%</span>
                <span className="w-20 text-right font-bold tabular-nums">{inr(r.value)}</span>
                <span className="text-faint" aria-hidden>{openRow === r.label ? '▾' : '▸'}</span>
              </button>
              <AnimatePresence>
                {openRow === r.label && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden px-3 pb-2 text-xs text-muted" style={{ transitionDelay: `${i * 10}ms` }}>
                    {r.detail}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between rounded-xl bg-surface-2/70 px-4 py-3 text-sm font-bold dark:bg-black/20">
            <span>Total cost / acre</span><span className="tabular-nums">{inr(eco.cost)}</span>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MiniStat icon="🌾" label={`Est. yield (${crop.durationDays[0]}–${crop.durationDays[1]}d)`} value={`${eco.yieldQ} q/acre`} />
          <MiniStat icon="🏪" label="Price used" value={`${inr(eco.pricePerQ)}/qtl`}
            sub={eco.priceRef ? `${eco.priceRef.market} · ${eco.priceRef.date}${eco.priceRef.msp ? ` · MSP ${inr(eco.priceRef.msp)}` : ''}` : 'Illustrative mandi rate'} />
          <MiniStat icon="📈" label="Est. revenue / acre" value={inr(eco.revenue)} tone="gold" />
        </div>
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-leaf-400/40 bg-leaf-400/5 px-4 py-3">
          <span className="text-sm font-bold">Est. profit / acre</span>
          <span className={cn('text-lg font-bold tabular-nums', eco.profit >= 0 ? 'text-leaf-600 dark:text-leaf-400' : 'text-red-500')}>{inr(eco.profit)}</span>
        </div>
        <Disclaimer className="mt-3" />
      </Card>

      {/* donut + total land */}
      <div className="space-y-5 lg:col-span-2">
        <Card className="flex flex-col items-center">
          <h3 className="mb-2 self-start text-sm font-bold uppercase tracking-wider text-muted">Cost breakdown (per acre)</h3>
          <Donut
            data={eco.costRows.map((r, i) => ({ label: r.label, value: r.value, color: DONUT[i % DONUT.length]! }))}
            centerLabel="Total / acre" centerValue={inr(eco.cost)}
          />
          <div className="mt-3 grid w-full grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
            {eco.costRows.map((r, i) => (
              <button key={r.label} type="button" onClick={() => setOpenRow(openRow === r.label ? null : r.label)}
                className="flex items-center gap-1.5 text-left text-muted hover:text-ink">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: DONUT[i % DONUT.length] }} aria-hidden />
                <span className="truncate">{r.label}</span>
                <span className="ml-auto tabular-nums text-faint">{inr(r.value)}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">🌍 Your total land</h3>
          <div className="mb-3 flex items-center gap-3">
            <input type="number" min={0.25} step={0.25} value={acres}
              onChange={(e) => setAcres(Math.max(0.25, Number(e.target.value)))}
              className="w-24 rounded-xl border border-line/70 bg-surface-2/60 px-3 py-2 text-center text-lg font-bold tabular-nums outline-none focus:border-leaf-400/70 dark:bg-black/20"
              aria-label="Acres" />
            <span className="text-sm text-muted">acres — edit to recalculate everything below</span>
          </div>
          <div className="space-y-2 text-sm">
            <Row k="Total investment" v={inr(eco.total.cost)} />
            <Row k="Expected revenue" v={inr(eco.total.revenue)} />
            <Row k="Expected profit" v={inr(eco.total.profit)} strong tone={eco.total.profit >= 0 ? 'ok' : 'bad'} />
          </div>
          <Disclaimer className="mt-3" />
        </Card>
      </div>

      {/* what-if */}
      <Card className="lg:col-span-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold">🔮 What-If Scenarios</h3>
          <Chip tone="info" icon="ℹ️">Scenarios — not predictions</Chip>
        </div>
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          {([
            ['yieldPct', '🌾 Yield change', adj.yieldPct],
            ['pricePct', '🏪 Market price change', adj.pricePct],
            ['costPct', '💰 Input cost change', adj.costPct],
          ] as const).map(([k, label, v]) => (
            <div key={k}>
              <div className="mb-1 flex justify-between text-xs font-semibold text-muted">
                <span>{label}</span><span className={cn('tabular-nums', v === 0 ? 'text-faint' : v > 0 ? 'text-leaf-600' : 'text-red-500')}>{v > 0 ? '+' : ''}{v}%</span>
              </div>
              <input type="range" min={-30} max={30} step={5} value={v}
                onChange={(e) => setAdj((a) => ({ ...a, [k]: Number(e.target.value) }))}
                className="w-full accent-leaf-600" aria-label={label} />
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {whatIf.map((s) => (
            <div key={s.id} className={cn('rounded-2xl border p-4',
              s.id === 'expected' ? 'border-leaf-400/50 bg-leaf-400/5' : 'border-line/60 bg-surface-2/40 dark:bg-black/10')}>
              <p className="text-sm font-bold">{s.label}</p>
              <p className="mb-3 text-[11px] text-muted">{s.hint}</p>
              <div className="space-y-1.5 text-xs">
                <Row k={`Profit / acre (${Math.round(acres * 100) / 100} ac total)`} v={inr(s.eco.profit)} />
                <Row k="Total investment" v={inr(s.eco.total.cost)} />
                <Row k="Total revenue" v={inr(s.eco.total.revenue)} />
                <Row k="Total profit" v={inr(s.eco.total.profit)} strong tone={s.eco.total.profit >= 0 ? 'ok' : 'bad'} />
              </div>
            </div>
          ))}
        </div>
        {adj.yieldPct !== 0 || adj.pricePct !== 0 || adj.costPct !== 0 ? (
          <div className="mt-4 rounded-2xl border border-gold-400/40 bg-gold-400/5 p-4 text-sm">
            <p className="font-bold">Your custom mix: {inr(eco.profit)} profit/acre · {inr(eco.total.profit)} on {Math.round(acres * 100) / 100} acres</p>
            <button type="button" className="btn-quiet mt-1 text-xs" onClick={() => setAdj({ yieldPct: 0, pricePct: 0, costPct: 0 })}>Reset sliders</button>
          </div>
        ) : null}
        <Disclaimer className="mt-4" />
      </Card>
    </div>
  )
}

function Row({ k, v, strong, tone }: { k: string; v: string; strong?: boolean; tone?: 'ok' | 'bad' }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={cn('text-muted', strong && 'font-bold text-ink')}>{k}</span>
      <span className={cn('tabular-nums font-semibold', strong && 'text-base', tone === 'ok' && 'text-leaf-600 dark:text-leaf-400', tone === 'bad' && 'text-red-500')}>{v}</span>
    </div>
  )
}

function MiniStat({ icon, label, value, sub, tone }: { icon: string; label: string; value: string; sub?: string; tone?: 'gold' }) {
  return (
    <div className={cn('rounded-2xl border p-3', tone === 'gold' ? 'border-gold-400/40 bg-gold-400/5' : 'border-line/60 bg-surface-2/40 dark:bg-black/10')}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{icon} {label}</p>
      <p className="mt-0.5 text-sm font-bold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-muted">{sub}</p>}
    </div>
  )
}

/* -------------------------------------------------------------- calendar */

export function CalendarPanel({ plan, cropKey }: { plan: FarmPlan; cropKey: string }) {
  const crop = cropInfo(cropKey)
  const start = new Date(plan.start)
  const current = stageAt(plan, cropKey)
  let acc = 0
  const rows = crop.stages.map((s, i) => {
    const from = Math.round(acc * current.total)
    acc += s.share
    const to = Math.round(acc * current.total)
    return { ...s, i, from: addD(start, from), to: addD(start, to), isNow: i === current.index, done: i < current.index }
  })
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold">🗓️ Crop Calendar — {cropVisual(cropKey).icon} {cropVisual(cropKey).label}</h3>
        <Chip tone="info" icon="📅">From {start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Chip>
      </div>
      <div className="mb-4">
        <Progress value={(current.day / current.total) * 100} tone="leaf" label={`Day ${current.day} of ~${current.total}`} showValue />
      </div>
      <ol className="relative space-y-3 border-l-2 border-line/60 pl-5">
        {rows.map((r) => (
          <li key={r.name} className="relative">
            <span className={cn('absolute -left-[27px] top-1 grid h-4 w-4 place-items-center rounded-full border-2 bg-surface text-[8px]',
              r.done ? 'border-leaf-500 bg-leaf-500 text-white' : r.isNow ? 'border-leaf-500' : 'border-line')} aria-hidden>
              {r.done ? '✓' : ''}
            </span>
            <div className={cn('rounded-2xl border p-3', r.isNow ? 'border-leaf-400/60 bg-leaf-400/5 shadow-glow' : 'border-line/50 bg-surface-2/30 dark:bg-black/10')}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold">{r.icon} {r.name} {r.isNow && <Chip tone="live" className="ml-1">Now</Chip>}</p>
                <p className="text-[11px] tabular-nums text-muted">
                  {r.from.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → {r.to.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <p className="mt-1 text-xs text-muted">{r.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[11px] text-faint">Dates are estimated from a ~{current.total}-day cycle for {cropVisual(cropKey).label}; actual timing shifts with weather and variety.</p>
    </Card>
  )
}

const addD = (d: Date, n: number) => new Date(d.getTime() + n * 86400000)

/* --------------------------------------------------------------- weather */

export function WeatherPanel({ plan, cropKey }: { plan: FarmPlan; cropKey: string }) {
  const crop = cropInfo(cropKey)
  const { stage } = stageAt(plan, cropKey)
  const [w, setW] = useState<LiveWeather | null>(null)
  const lat = plan.location.lat ?? farmer.coords.lat
  const lng = plan.location.lng ?? farmer.coords.lng
  const place = plan.location.label || `${plan.location.village}, ${plan.location.district}`

  useEffect(() => {
    let alive = true
    setW(null)
    fetchLiveWeather(lat, lng, place).then((r) => { if (alive) setW(r) })
    return () => { alive = false }
  }, [lat, lng, place])

  const advice = useMemo(() => (w ? weatherAdvice(crop, stage.name, w) : []), [w, crop, stage.name])

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold">🌦️ Weather for your crop & location</h3>
        {w ? (
          w.source === 'live'
            ? <Chip tone="live" icon="📡">Live · {w.provider} · {place}</Chip>
            : <Chip tone="demo" icon="◆">Sample forecast — live API unavailable</Chip>
        ) : <Chip>Fetching…</Chip>}
      </div>

      {w && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="text-4xl font-bold tabular-nums">{w.tempC}°C</div>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <MiniStat icon="💧" label="Humidity" value={`${w.humidity}%`} />
              <MiniStat icon="🌧️" label="Rain today" value={`${w.rainPct}%`} />
              <MiniStat icon="🍃" label="Wind" value={`${w.windKph} km/h`} />
            </div>
          </div>
          <div className="mb-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
            {w.days.map((d) => (
              <div key={d.date} className="rounded-xl border border-line/50 bg-surface-2/40 p-2 text-center dark:bg-black/10">
                <p className="text-[10px] font-bold text-faint">{d.label}</p>
                <p className="text-sm font-bold tabular-nums">{d.hi}°</p>
                <p className="text-[10px] tabular-nums text-muted">{d.lo}°</p>
                <p className={cn('text-[10px] font-semibold', d.rain >= 60 ? 'text-sky-500' : 'text-faint')}>🌧 {d.rain}%</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Advice for {cropVisual(cropKey).label} · {stage.name} stage</p>
            {advice.map((a) => (
              <div key={a.text} className={cn('flex items-start gap-2.5 rounded-xl border p-3 text-xs leading-relaxed',
                a.level === 'alert' ? 'border-red-400/40 bg-red-500/5 text-red-600 dark:text-red-400'
                  : a.level === 'warn' ? 'border-gold-400/40 bg-gold-400/5'
                  : 'border-leaf-400/30 bg-leaf-400/5')}>
                <span aria-hidden>{a.icon}</span><span className="text-ink">{a.text}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-faint">
            {w.source === 'live'
              ? `Forecast: Open-Meteo (open weather API), fetched ${new Date(w.fetchedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} for ${place || 'your location'}.`
              : 'Live weather could not be reached — showing clearly-labelled sample values so the demo still works offline.'}
          </p>
        </>
      )}
      {!w && <div className="h-40 animate-pulse rounded-2xl bg-surface-2/60 dark:bg-black/10" aria-hidden />}
    </Card>
  )
}

/* ------------------------------------------------------- compare + summary */

export function CompareTable({ plan, keys, onRemove }: { plan: FarmPlan; keys: string[]; onRemove: (k: string) => void }) {
  const crops = keys.map(cropInfo)
  return (
    <Card pad={false} className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 p-5 pb-3">
        <h3 className="text-lg font-bold">⚖️ Compare crops for YOUR farm</h3>
        <Chip tone="info" icon="ℹ️">No single “best crop” — the right choice depends on your land</Chip>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead>
            <tr className="border-y border-line/60 bg-surface-2/50 text-[10px] uppercase tracking-wider text-muted dark:bg-black/15">
              <th className="px-4 py-2.5">Crop</th>
              <th className="px-3 py-2.5">Duration</th>
              <th className="px-3 py-2.5">Water</th>
              <th className="px-3 py-2.5">Cost/acre</th>
              <th className="px-3 py-2.5">Est. revenue/acre</th>
              <th className="px-3 py-2.5">Est. profit/acre</th>
              <th className="px-3 py-2.5">Risk</th>
              <th className="px-3 py-2.5">Fit for you</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {crops.map((c, i) => {
              const e = economics(plan, c.key)
              return (
                <tr key={c.key} className={cn('border-b border-line/40 last:border-0', i % 2 ? 'bg-surface-2/20 dark:bg-black/5' : '')}>
                  <td className="px-4 py-3 font-bold">{cropVisual(c.key).icon} {cropVisual(c.key).label}</td>
                  <td className="px-3 py-3 tabular-nums">{c.durationDays[0]}–{c.durationDays[1]} d</td>
                  <td className="px-3 py-3">{c.water}</td>
                  <td className="px-3 py-3 tabular-nums">{inr(e.cost)}</td>
                  <td className="px-3 py-3 tabular-nums">{inr(e.revenue)}</td>
                  <td className={cn('px-3 py-3 font-bold tabular-nums', e.profit >= 0 ? 'text-leaf-600 dark:text-leaf-400' : 'text-red-500')}>{inr(e.profit)}</td>
                  <td className="px-3 py-3"><Chip tone={riskLevel(c).tone === 'ok' ? 'ok' : riskLevel(c).tone === 'danger' ? 'danger' : 'demo'}>{riskLevel(c).label}</Chip></td>
                  <td className="px-3 py-3"><Gauge value={fitScore(plan, c)} size={54} label={`${fitScore(plan, c)}%`} /></td>
                  <td className="px-3 py-3"><button type="button" className="btn-quiet text-[11px]" onClick={() => onRemove(c.key)}>✕</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="p-4"><Disclaimer /></div>
    </Card>
  )
}

const fitScore = (plan: FarmPlan, c: CropInfo) => suitabilityFor(plan, c).score

export function FitRing({ value }: { value: number }) {
  return <Gauge value={value} size={110} label={`${value}% fit`} tone={value >= 80 ? '#354A29' : value >= 60 ? '#B98A2F' : '#C0562A'} />
}
