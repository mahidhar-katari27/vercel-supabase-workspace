'use client'
/**
 * 🌱 Start Farming — hero, beginner wizard, animated analysis, suitability-ranked
 * crop recommendations and the complete Farm Plan (economics, live weather,
 * calendar, machinery, schemes, market, today's tasks, comparison).
 * One connected ecosystem: the saved plan feeds My Farm lands, the dashboard,
 * Crop Doctor, Market, Schemes and the AI assistant.
 */
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { cropDb, cropInfo, cropVisual } from '@/lib/cropDb'
import type { FarmPlan } from '@/lib/farmPlan'
import {
  budgetPerAcre, clearPlan, DISCLAIMER, economics, fmt, inr, loadDoneTasks, loadPlan,
  onPlanChange, rankCrops, saveDoneTasks, savePlan, stageAt, tasksForToday, todayKey, totalAcres,
} from '@/lib/farmPlan'
import { schemes } from '@/lib/data'
import { fetchLiveWeather } from '@/lib/weather'
import { cn, inr as inrCompact } from '@/lib/utils'
import { Card, Chip, PageHeader, Reveal, SectionHeading, StatCard, spring } from '@/components/ui'
import Wizard, { Analyzing, emptyPlan } from '@/components/start/Wizard'
import { CalendarPanel, CompareTable, CropCard, Disclaimer, EconomicsPanel, WeatherPanel } from '@/components/start/PlanViews'

type View = 'hero' | 'wizard' | 'analyzing' | 'results' | 'plan'

export default function StartFarmingPage() {
  const [plan, setPlan] = useState<FarmPlan | null>(null)
  const [view, setView] = useState<View>('hero')
  const [explore, setExplore] = useState(false)
  const [whyKey, setWhyKey] = useState<string | null>(null)
  const [compareSet, setCompareSet] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = loadPlan()
    setPlan(saved)
    if (saved) { setView(saved.chosenCrop ? 'plan' : 'results'); setCompareSet(saved.compare?.length ? saved.compare : []) }
    return onPlanChange(() => {
      const s = loadPlan()
      setPlan(s)
    })
  }, [])

  const persist = useCallback((p: FarmPlan) => { setPlan(p); savePlan(p) }, [])

  const onWizardDone = (p: FarmPlan) => {
    const ranked = rankCrops(p)
    const keepCrop = p.chosenCrop || ranked[0]!.crop
    const next: FarmPlan = {
      ...p,
      chosenCrop: keepCrop,
      recommendedCrop: ranked[0]!.crop,
      compare: p.compare?.length ? p.compare : ranked.slice(0, 3).map((r) => r.crop),
    }
    persist(next)
    setView('analyzing')
  }

  const selectCrop = (key: string) => {
    if (!plan) return
    const next = { ...plan, chosenCrop: key, compare: plan.compare?.length ? plan.compare : [key] }
    if (!next.compare.includes(key)) next.compare = [...next.compare, key].slice(0, 4)
    persist(next)
    setView('plan')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const ranked = useMemo(() => (plan ? rankCrops(plan) : []), [plan])

  if (!mounted) return <div className="section min-h-[60vh]" aria-hidden />

  return (
    <div className="section">
      <AnimatePresence mode="wait">
        {view === 'hero' && <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Hero plan={plan} onStart={() => { setExplore(false); setView('wizard') }} onExplore={() => { setExplore(true); setView('results') }} onOpenPlan={() => setView(plan?.chosenCrop ? 'plan' : 'results')} />
        </motion.div>}
        {view === 'wizard' && <motion.div key="wizard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={spring}>
          <Wizard initial={explore ? null : plan} onComplete={onWizardDone} onCancel={() => setView(plan ? (plan.chosenCrop ? 'plan' : 'results') : 'hero')} />
        </motion.div>}
        {view === 'analyzing' && <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Analyzing place={plan ? `${plan.location.village}, ${plan.location.district}` : undefined} onDone={() => setView('results')} />
        </motion.div>}
        {view === 'results' && <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={spring}>
          <Results plan={explore ? null : plan} ranked={explore ? [] : ranked} whyKey={whyKey} setWhyKey={setWhyKey}
            compareSet={compareSet} setCompareSet={setCompareSet} onSelect={selectCrop}
            onWizard={() => { setExplore(false); setView('wizard') }} onBackToPlan={() => setView('plan')} hasPlan={!!plan?.chosenCrop} />
        </motion.div>}
        {view === 'plan' && plan?.chosenCrop && <motion.div key="plan" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={spring}>
          <PlanView plan={plan} ranked={ranked} onEdit={() => { setExplore(false); setView('wizard') }}
            onRecalculate={() => setView('results')} onReset={() => { clearPlan(); setPlan(null); setCompareSet([]); setView('hero') }}
            whyKey={whyKey} setWhyKey={setWhyKey} compareSet={compareSet} setCompareSet={setCompareSet} />
        </motion.div>}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------- hero */

const FLOW = ['📍 Location', '🌾 Land size', '🧪 Soil', '💧 Water', '💰 Budget', '🎯 Goals', '🗓️ Start date', '🌱 Your Farm Plan']

function Hero({ plan, onStart, onExplore, onOpenPlan }: { plan: FarmPlan | null; onStart: () => void; onExplore: () => void; onOpenPlan: () => void }) {
  const [wx, setWx] = useState<{ temp: number; live: boolean } | null>(null)
  useEffect(() => {
    let alive = true
    fetchLiveWeather(16.5062, 80.648, 'Vijayawada').then((w) => { if (alive) setWx({ temp: w.tempC, live: w.source === 'live' }) })
    return () => { alive = false }
  }, [])
  const vis = cropVisual('paddy')
  return (
    <div>
      <section className="relative mb-14 overflow-hidden rounded-[2rem] border border-line/60 shadow-lift">
        <div className="absolute inset-0">
          <Image src="/start/hero.jpg" alt="Farmer at sunrise on a prepared field" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" aria-hidden />
        </div>
        <div className="relative grid gap-10 p-7 sm:p-12 lg:grid-cols-[1.15fr_0.85fr] lg:p-16">
          <div className="max-w-xl">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
              <Chip tone="live" icon="🌱" className="mb-4">New · Start Farming</Chip>
              <h1 className="font-display text-4xl font-black leading-[1.05] text-white sm:text-5xl lg:text-[3.4rem]">
                Not sure<br />what to grow?
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
                Tell us about your land. We&rsquo;ll help you plan your first crop — answer 7 simple
                questions (location, land, soil, water, budget, goals, season) and AgriSmart checks live
                weather, sowing windows, costs and mandi prices, then builds your complete farm plan:
                which crop, why, what it costs, what you could earn, and what to do every day.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button type="button" className="btn-primary" onClick={onStart}>🌱 Create My Farm Plan</button>
                <button type="button" className="btn-ghost !text-white" onClick={onExplore}>🔎 Explore Crops</button>
                {plan?.chosenCrop && <button type="button" className="btn-gold" onClick={onOpenPlan}>📋 Open My Plan</button>}
              </div>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-white/70">
                <span>📡 Real weather API</span><span>🗺️ Google Maps</span><span>🏪 Mandi prices with source &amp; date</span><span>🏷️ Honest Demo/Estimate labels</span>
              </div>
            </motion.div>
          </div>

          {/* floating cards */}
          <div className="relative hidden min-h-[340px] lg:block" aria-hidden>
            <FloatCard className="left-2 top-0" delay={0.2}>
              <div className="flex items-center gap-3">
                <Image src={vis.image} alt="" width={52} height={52} className="rounded-xl object-cover" />
                <div>
                  <p className="text-xs font-bold">🌾 Paddy · 1 acre</p>
                  <p className="text-[11px] text-leaf-600 dark:text-leaf-400">≈ ₹{fmt(economics(emptyPlan(), 'paddy').profit)} est. profit</p>
                </div>
              </div>
            </FloatCard>
            <FloatCard className="right-0 top-16" delay={0.5}>
              <p className="text-xs font-bold">🌦️ {wx ? `${wx.temp}°C · Vijayawada` : 'Loading weather…'}</p>
              <p className="text-[11px] text-muted">{wx?.live ? 'Live · Open-Meteo' : 'Sample forecast'}</p>
            </FloatCard>
            <FloatCard className="left-8 top-40" delay={0.8}>
              <p className="text-xs font-bold">💰 Budget ₹1,00,000</p>
              <p className="text-[11px] text-muted">→ crops you can actually afford</p>
            </FloatCard>
            <FloatCard className="right-6 top-60" delay={1.1}>
              <p className="text-xs font-bold">🚜 Machinery on rent</p>
              <p className="text-[11px] text-muted">Tractor · Sprayer · Harvester</p>
            </FloatCard>
          </div>
        </div>
      </section>

      {/* flow */}
      <SectionHeading center eyebrow="How it works" title="From zero knowledge to a full farm plan"
        sub="Every answer changes the recommendations — nothing is guessed, nothing is guaranteed." />
      <div className="mb-12 flex flex-wrap items-center justify-center gap-2">
        {FLOW.map((f, i) => (
          <Reveal key={f} delay={i * 0.06}>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-line/70 bg-surface-2/60 px-3.5 py-1.5 text-xs font-semibold dark:bg-black/15">{f}</span>
              {i < FLOW.length - 1 && <span className="text-faint" aria-hidden>→</span>}
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mb-14 grid gap-5 md:grid-cols-3">
        {[
          { icon: '🧠', t: 'Built for absolute beginners', d: 'Plain language, no jargon. Not sure about your soil? That’s a valid answer — we plan around it and remind you to get a ₹300–700 soil test.' },
          { icon: '🔗', t: 'One connected ecosystem', d: 'Your plan flows into My Farm lands, dashboard tasks, Crop Doctor, Market prices, AgriRent machinery, Schemes and the AI assistant — answer once, synced everywhere.' },
          { icon: '🏷️', t: 'Radically honest data', d: 'Weather is a live API, prices show market + date, and every rupee figure is labelled as an estimate. We never promise outcomes.' },
        ].map((c, i) => (
          <Reveal key={c.t} delay={i * 0.1}><Card hover className="h-full"><span className="text-2xl" aria-hidden>{c.icon}</span>
            <h3 className="mt-3 font-bold">{c.t}</h3><p className="mt-1.5 text-sm leading-relaxed text-muted">{c.d}</p></Card></Reveal>
        ))}
      </div>

      <Reveal>
        <Card glow className="flex flex-wrap items-center justify-between gap-4 border-leaf-400/40 bg-leaf-400/5">
          <div>
            <h3 className="text-lg font-bold">Ready when you are 🌱</h3>
            <p className="text-sm text-muted">Takes about 2 minutes. No account, no fees, no farming knowledge required.</p>
          </div>
          <button type="button" className="btn-primary" onClick={onStart}>Start the wizard →</button>
        </Card>
      </Reveal>
    </div>
  )
}

function FloatCard({ children, className, delay }: { children: React.ReactNode; className?: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay }}
      className={cn('absolute w-56 rounded-2xl border border-line/60 bg-surface/95 p-3.5 shadow-lift backdrop-blur dark:bg-surface-2/95', className)}>
      <motion.div animate={{ y: [0, -7, 0] }} transition={{ repeat: Infinity, duration: 5, delay, ease: 'easeInOut' }}>
        {children}
      </motion.div>
    </motion.div>
  )
}

/* ---------------------------------------------------------------- results */

function Results({
  plan, ranked, whyKey, setWhyKey, compareSet, setCompareSet, onSelect, onWizard, onBackToPlan, hasPlan,
}: {
  plan: FarmPlan | null; ranked: ReturnType<typeof rankCrops>
  whyKey: string | null; setWhyKey: (k: string | null) => void
  compareSet: string[]; setCompareSet: (k: string[]) => void
  onSelect: (key: string) => void; onWizard: () => void; onBackToPlan: () => void; hasPlan: boolean
}) {
  const order = plan ? ranked : cropDb.map((c) => ({ crop: c.key, score: 0, reasons: [], considerations: [] }))
  const sample = plan ?? emptyPlan()
  const toggleCompare = (key: string) =>
    setCompareSet(compareSet.includes(key) ? compareSet.filter((k) => k !== key) : [...compareSet, key].slice(0, 4))
  return (
    <div className="pb-16">
      <PageHeader icon="🏆" title={plan ? 'Recommended crops for YOUR farm' : 'Explore crops'}
        sub={plan
          ? 'Ranked by how well each crop fits your location, land, soil, water, budget, goals and start month. Fit % is indicative — never a guarantee.'
          : 'Browse what grows well in this region, then run the 2-minute wizard to rank crops for your exact land and budget.'}
        tag={plan ? <Chip tone="live" icon="🧮">Based on your answers</Chip> : <Chip tone="demo" icon="◆">Sample economics</Chip>}>
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" className="btn-ghost text-xs" onClick={onWizard}>✏️ {plan ? 'Edit my answers' : '🌱 Run the wizard'}</button>
          {hasPlan && <button type="button" className="btn-quiet text-xs" onClick={onBackToPlan}>← Back to my plan</button>}
        </div>
      </PageHeader>

      {plan && (
        <Card className="mb-6 border-leaf-400/30 bg-leaf-400/5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold">Your inputs:</span>
            <Chip icon="📍">{plan.location.village}, {plan.location.district}</Chip>
            <Chip icon="🌾">{Math.round(totalAcres(plan) * 100) / 100} acres · {plan.plots.length} plot{plan.plots.length > 1 ? 's' : ''}</Chip>
            <Chip icon="🧪">{plan.soil === 'unknown' ? 'Soil: will test' : `${plan.soil} soil`}</Chip>
            <Chip icon="💧">{plan.waterSource} water</Chip>
            <Chip icon="💰">{inr(budgetPerAcre(plan))}/acre budget</Chip>
            <Chip icon="🗓️">Starts {new Date(plan.start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Chip>
          </div>
        </Card>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {order.map((r, i) => {
          const crop = cropInfo(r.crop)
          return (
            <CropCard key={crop.key} crop={crop} plan={sample} fit={plan ? r : undefined} delay={i * 0.07} isTop={i === 0}
              selected={plan?.chosenCrop === crop.key}
              onSelect={plan ? () => onSelect(crop.key) : onWizard}
              onWhy={() => setWhyKey(whyKey === crop.key ? null : crop.key)}
              whyOpen={whyKey === crop.key}
              onCompare={() => toggleCompare(crop.key)}
              compareOn={compareSet.includes(crop.key)} />
          )
        })}
      </div>

      {compareSet.length >= 2 && plan && (
        <div className="mt-8">
          <CompareTable plan={plan} keys={compareSet} onRemove={(k) => setCompareSet(compareSet.filter((x) => x !== k))} />
        </div>
      )}
      {compareSet.length === 1 && <p className="mt-4 text-center text-xs text-muted">Add one more crop with ⚖️ Compare to see the side-by-side table.</p>}
    </div>
  )
}

/* -------------------------------------------------------------- plan view */

function PlanView({
  plan, ranked, onEdit, onRecalculate, onReset, whyKey, setWhyKey, compareSet, setCompareSet,
}: {
  plan: FarmPlan; ranked: ReturnType<typeof rankCrops>
  onEdit: () => void; onRecalculate: () => void; onReset: () => void
  whyKey: string | null; setWhyKey: (k: string | null) => void
  compareSet: string[]; setCompareSet: (k: string[]) => void
}) {
  const crop = cropInfo(plan.chosenCrop)
  const vis = cropVisual(plan.chosenCrop)
  const fit = ranked.find((r) => r.crop === plan.chosenCrop)
  const eco = economics(plan, plan.chosenCrop)
  const { stage, day, total } = stageAt(plan, plan.chosenCrop)
  const harvest = new Date(new Date(plan.start).getTime() + total * 86400000)
  const acres = totalAcres(plan)
  const relevantSchemes = schemes.filter((s) =>
    (s.states.includes('All states') || s.states.some((st) => st.toLowerCase().includes(plan.location.state.toLowerCase().split(' ')[0]!))) &&
    acres >= s.minAcres && acres <= s.maxAcres && s.sectors.includes('Crop')).slice(0, 3)
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="space-y-8 pb-16">
      <PageHeader icon="📋" title="Your Farm Plan" sub={`${vis.icon} ${vis.label} · ${plan.location.village}, ${plan.location.district} · ${Math.round(acres * 100) / 100} acres`}
        tag={<div className="flex flex-wrap gap-2"><Chip tone="live" icon="🌱">Plan saved &amp; synced</Chip><Chip tone="demo" icon="◆">Financials are estimates</Chip></div>}>
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" className="btn-ghost text-xs" onClick={onEdit}>✏️ Edit answers</button>
          <button type="button" className="btn-ghost text-xs" onClick={onRecalculate}>🔁 Recalculate crops</button>
          <Link href="/farm" className="btn-quiet text-xs">🌍 View in My Farm</Link>
          {confirmReset
            ? <button type="button" className="btn-quiet text-xs !text-red-500" onClick={onReset}>Sure? Tap again to delete</button>
            : <button type="button" className="btn-quiet text-xs" onClick={() => setConfirmReset(true)}>🗑️ Reset plan</button>}
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={vis.icon} label="Chosen crop" value={vis.label} sub={`${fit ? `${fit.score}% indicative fit` : 'From your wizard answers'}`} tone="leaf" />
        <StatCard icon={stage.icon} label="Current stage" value={stage.name} sub={`Day ${day} of ~${total} · harvest ≈ ${harvest.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`} tone="sky" />
        <StatCard icon="💰" label="Est. investment" value={inrCompact(eco.total.cost, { compact: true })} sub={`for ${Math.round(acres * 100) / 100} acres`} tone="earth" />
        <StatCard icon="🏆" label="Est. profit" value={inrCompact(eco.total.profit, { compact: true })} sub={eco.total.profit >= 0 ? 'expected, not guaranteed' : 'loss in this estimate'} tone={eco.total.profit >= 0 ? 'leaf' : 'gold'} />
      </div>

      <TaskCard plan={plan} />

      <div className="grid gap-5 lg:grid-cols-2">
        <WeatherPanel plan={plan} cropKey={plan.chosenCrop} />
        <CalendarPanel plan={plan} cropKey={plan.chosenCrop} />
      </div>

      <EconomicsPanel plan={plan} cropKey={plan.chosenCrop} />

      {/* why + risks for the chosen crop */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-lg font-bold">🔎 Why {vis.label} for you</h3>
          <div className="space-y-1.5 text-sm text-muted">
            {(fit?.reasons ?? []).map((r) => <p key={r.text}>✅ {r.text}</p>)}
          </div>
          <h4 className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">Things to consider</h4>
          <div className="space-y-1.5 text-sm text-muted">
            {(fit?.considerations ?? []).length === 0 && <p>• Nothing major flagged from your answers.</p>}
            {(fit?.considerations ?? []).map((r) => <p key={r.text}>⚠️ {r.text}</p>)}
          </div>
          <button type="button" className="btn-ghost mt-4 text-xs" onClick={() => setWhyKey(whyKey === crop.key ? null : crop.key)}>
            {whyKey === crop.key ? '▾ Hide full risk list' : '🛡️ See full risk list'}
          </button>
          <AnimatePresence>
            {whyKey === crop.key && (
              <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-1.5 overflow-hidden text-sm text-muted">
                <li>💧 {crop.risks.water}</li><li>🐛 {crop.risks.pest}</li><li>📈 {crop.risks.market}</li><li>🌦️ {crop.risks.weather}</li>
              </motion.ul>
            )}
          </AnimatePresence>
        </Card>

        <div className="space-y-5">
          <Card>
            <h3 className="mb-3 text-lg font-bold">🚜 Machinery you’ll need</h3>
            <div className="flex flex-wrap gap-2">
              {crop.machinery.map((m) => <Chip key={m} icon="🚜">{m}</Chip>)}
            </div>
            <p className="mt-3 text-xs text-muted">Buying isn’t the only option — rent from verified providers near {plan.location.district || 'you'}.</p>
            <Link href="/agrirent" className="btn-primary mt-3 inline-flex text-xs">Find machinery on AgriRent →</Link>
          </Card>
          <Card>
            <h3 className="mb-3 text-lg font-bold">🏪 Your crop in the market</h3>
            {eco.priceRef ? (
              <div className="rounded-2xl border border-line/60 bg-surface-2/40 p-4 text-sm dark:bg-black/10">
                <p className="font-bold">{eco.priceRef.crop}: {inr(eco.priceRef.price)}/quintal</p>
                <p className="mt-1 text-xs text-muted">Source: {eco.priceRef.market} · {eco.priceRef.date}{eco.priceRef.msp ? ` · MSP ${inr(eco.priceRef.msp)}` : ''} (demo dataset)</p>
              </div>
            ) : <p className="text-sm text-muted">No mandi row for {vis.label} in the demo dataset — economics use an illustrative rate.</p>}
            <Link href="/market" className="btn-ghost mt-3 inline-flex text-xs">Open Market Intelligence →</Link>
          </Card>
        </div>
      </div>

      {/* schemes */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold">🏛️ Schemes relevant to your plan</h3>
          <Link href="/schemes" className="btn-quiet text-xs">All schemes →</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {relevantSchemes.map((s) => (
            <div key={s.id} className="rounded-2xl border border-line/60 bg-surface-2/40 p-4 dark:bg-black/10">
              <p className="text-sm font-bold">{s.name}</p>
              <p className="mt-0.5 text-[11px] text-faint">{s.body}</p>
              <p className="mt-2 text-xs text-muted">{s.benefit}</p>
              <Chip tone="ok" className="mt-2" icon="✓">Matches {Math.round(acres * 100) / 100} acres · {plan.location.state}</Chip>
              <div className="mt-2"><Link href="/schemes" className="btn-ghost text-[11px]">Check eligibility →</Link></div>
            </div>
          ))}
          {relevantSchemes.length === 0 && <p className="text-sm text-muted">No scheme in the demo list matches your state/acreage — check the full Schemes page.</p>}
        </div>
        <p className="mt-3 text-[11px] text-faint">Scheme data is a labelled demo list; always verify on official government sources before applying.</p>
      </Card>

      {compareSet.length >= 2 && <CompareTable plan={plan} keys={compareSet} onRemove={(k) => setCompareSet(compareSet.filter((x) => x !== k))} />}
      {compareSet.length < 2 && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Still deciding? Compare {vis.label} against other ranked crops side-by-side.</p>
          <button type="button" className="btn-ghost text-xs" onClick={onRecalculate}>⚖️ Open comparison</button>
        </Card>
      )}

      <Disclaimer />
    </div>
  )
}

/* -------------------------------------------------------------- tasks */

function TaskCard({ plan }: { plan: FarmPlan }) {
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [wx, setWx] = useState<{ tempC?: number; rainPct?: number; humidity?: number }>({})
  const key = todayKey()
  useEffect(() => {
    const all = loadDoneTasks()
    setDone(all[key] ?? {})
    let alive = true
    fetchLiveWeather(plan.location.lat ?? 16.5062, plan.location.lng ?? 80.648).then((w) => {
      if (alive) setWx({ tempC: w.tempC, rainPct: w.rainPct, humidity: w.humidity })
    })
    return () => { alive = false }
  }, [key, plan.location.lat, plan.location.lng])

  const tasks = useMemo(() => tasksForToday(plan, wx), [plan, wx])
  const doneCount = tasks.filter((t) => done[t.id]).length

  const toggle = (id: string) => {
    const next = { ...done, [id]: !done[id] }
    setDone(next)
    const all = loadDoneTasks()
    all[key] = next
    saveDoneTasks(all)
  }

  return (
    <div id="tasks"><Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold">✅ Today’s Farm Tasks</h3>
        <div className="flex items-center gap-2">
          <Chip tone={doneCount === tasks.length ? 'live' : 'info'}>{doneCount}/{tasks.length} done</Chip>
          <Link href="/dashboard" className="btn-quiet text-xs">Also on dashboard →</Link>
        </div>
      </div>
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li key={t.id}>
            <button type="button" onClick={() => toggle(t.id)} aria-pressed={!!done[t.id]}
              className={cn('flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-all',
                done[t.id] ? 'border-leaf-400/40 bg-leaf-400/5 text-muted line-through' : 'border-line/60 hover:border-leaf-400/50 hover:bg-leaf-400/5')}>
              <span className={cn('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[10px]',
                done[t.id] ? 'border-leaf-500 bg-leaf-500 text-white' : 'border-line')} aria-hidden>
                {done[t.id] ? '✓' : ''}
              </span>
              <span aria-hidden>{t.icon}</span>
              <span className="flex-1">{t.text}</span>
              {t.tag === 'weather' && <Chip tone="info" className="shrink-0">weather</Chip>}
              {t.tag === 'stage' && <Chip className="shrink-0">stage</Chip>}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-faint">Generated from your plan’s stage, weather and crop risks. {DISCLAIMER}</p>
    </Card></div>
  )
}
