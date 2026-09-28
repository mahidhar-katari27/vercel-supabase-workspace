'use client'
/**
 * Start Farming wizard (spec §3–4): seven ultra-simple steps for a farmer with
 * ZERO farming knowledge, then an animated "analysing" checklist.
 */
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { soilOptions, waterSources } from '@/lib/cropDb'
import type { FarmPlan, Plot } from '@/lib/farmPlan'
import { fmt, goalOptions, totalAcres } from '@/lib/farmPlan'
import { cn } from '@/lib/utils'
import LocationPickerModal from '@/components/maps/LocationPickerModal'
import type { PickedLocation } from '@/components/maps/LocationPickerModal'
import { Card, Chip, Progress, Stepper, spring } from '@/components/ui'

const STEPS = ['Location', 'Land', 'Soil', 'Water', 'Budget', 'Goals', 'Start']

const inputCls =
  'w-full rounded-2xl border border-line/70 bg-surface-2/60 px-4 py-3 text-sm text-ink outline-none transition focus:border-leaf-400/70 focus:ring-2 focus:ring-leaf-400/20 dark:bg-black/20'

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-faint">{hint}</span>}
    </label>
  )
}

function Choice({ on, onClick, children, sub }: { on: boolean; onClick: () => void; children: React.ReactNode; sub?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        'rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-all',
        on
          ? 'border-leaf-400/70 bg-leaf-400/10 text-leaf-700 shadow-glow dark:text-leaf-300'
          : 'border-line/70 text-ink hover:border-leaf-400/40 hover:bg-leaf-400/5',
      )}
    >
      {children}
      {sub && <span className="mt-0.5 block text-[11px] font-medium text-muted">{sub}</span>}
    </button>
  )
}

export function emptyPlan(): FarmPlan {
  const now = new Date()
  return {
    createdAt: now.toISOString(),
    location: { state: 'Andhra Pradesh', district: '', village: '' },
    plots: [{ acres: 1, cents: 0 }],
    soil: 'unknown',
    waterSource: 'borewell',
    waterReliable: 'unknown',
    budget: { amount: 100000, perAcre: false },
    goals: ['beginner'],
    start: now.toISOString().slice(0, 10),
    startMode: 'this-month',
    chosenCrop: '',
    compare: [],
  }
}

export default function Wizard({
  onComplete, onCancel, initial,
}: {
  onComplete: (plan: FarmPlan) => void
  onCancel: () => void
  initial?: FarmPlan | null
}) {
  const [step, setStep] = useState(0)
  const [p, setP] = useState<FarmPlan>(initial ?? emptyPlan())
  const [pickerOpen, setPickerOpen] = useState(false)
  const [showTest, setShowTest] = useState(!!initial?.soilTest)
  const set = <K extends keyof FarmPlan>(k: K, v: FarmPlan[K]) => setP((s) => ({ ...s, [k]: v }))

  const acres = totalAcres(p)
  const bpa = p.budget.perAcre ? p.budget.amount : acres > 0 ? p.budget.amount / acres : 0

  const startDate = useMemo(() => {
    const now = new Date()
    if (p.startMode === 'custom') return p.start
    const d = new Date(now.getFullYear(), now.getMonth() + (p.startMode === 'next-month' ? 1 : 0), 1)
    return d.toISOString().slice(0, 10)
  }, [p.startMode, p.start])

  const valid = useMemo(() => {
    switch (step) {
      case 0: return !!p.location.village.trim() && !!p.location.district.trim()
      case 1: return acres > 0
      case 2: return !!p.soil
      case 3: return !!p.waterSource
      case 4: return p.budget.amount > 0
      case 5: return p.goals.length > 0
      default: return !!startDate
    }
  }, [step, p, acres, startDate])

  const onPicked = (loc: PickedLocation) => {
    setPickerOpen(false)
    const parts = loc.address.split(',').map((s) => s.trim()).filter(Boolean)
    setP((s) => ({
      ...s,
      location: {
        ...s.location,
        lat: loc.lat, lng: loc.lng, label: loc.address,
        village: s.location.village || parts[0] || '',
        district: s.location.district || parts[1] || parts[0] || '',
      },
    }))
  }

  const finish = () => onComplete({ ...p, start: startDate })

  return (
    <div className="mx-auto max-w-3xl pb-16 pt-2">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Stepper steps={STEPS} current={step} onStep={(i) => setStep(i)} />
        <button type="button" onClick={onCancel} className="btn-quiet text-xs">✕ Cancel</button>
      </div>

      <Card className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={spring}
          >
            {step === 0 && (
              <div className="space-y-4">
                <StepHead icon="📍" title="Where is your land?" sub="Type it, or pick the exact spot on the map — no farming knowledge needed." />
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Village / Town"><input className={inputCls} value={p.location.village} onChange={(e) => set('location', { ...p.location, village: e.target.value })} placeholder="e.g. Penamaluru" /></Field>
                  <Field label="District"><input className={inputCls} value={p.location.district} onChange={(e) => set('location', { ...p.location, district: e.target.value })} placeholder="e.g. Krishna" /></Field>
                  <Field label="State"><input className={inputCls} value={p.location.state} onChange={(e) => set('location', { ...p.location, state: e.target.value })} /></Field>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" className="btn-primary text-sm" onClick={() => setPickerOpen(true)}>🗺️ Pick on map / use my location</button>
                  {p.location.label && <Chip tone="live" icon="📍">Map point set · {p.location.label}</Chip>}
                </div>
                <p className="text-[11px] text-faint">Maps use Google Maps when configured; otherwise a clearly-labelled demo map helps you continue.</p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <StepHead icon="🌾" title="How much land do you have?" sub="Add each plot separately if your land is in pieces. 1 acre = 100 cents." />
                <div className="space-y-3">
                  {p.plots.map((plot, i) => (
                    <div key={i} className="flex flex-wrap items-end gap-3 rounded-2xl border border-line/60 bg-surface-2/40 p-3 dark:bg-black/10">
                      <Field label={`Plot ${i + 1} · acres`}>
                        <input type="number" min={0} step={0.25} className={cn(inputCls, 'w-28')} value={plot.acres}
                          onChange={(e) => updatePlot(i, { acres: Math.max(0, Number(e.target.value)) })} />
                      </Field>
                      <Field label="cents">
                        <input type="number" min={0} max={99} step={1} className={cn(inputCls, 'w-24')} value={plot.cents}
                          onChange={(e) => updatePlot(i, { cents: Math.min(99, Math.max(0, Number(e.target.value))) })} />
                      </Field>
                      <Field label="Name (optional)">
                        <input className={cn(inputCls, 'w-44')} placeholder="e.g. Riverside plot" value={plot.note ?? ''}
                          onChange={(e) => updatePlot(i, { note: e.target.value })} />
                      </Field>
                      {p.plots.length > 1 && (
                        <button type="button" className="btn-quiet mb-1 text-xs" onClick={() => set('plots', p.plots.filter((_, j) => j !== i))}>Remove</button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button type="button" className="btn-ghost text-sm" onClick={() => set('plots', [...p.plots, { acres: 1, cents: 0 } as Plot])}>＋ Add another plot</button>
                  <Chip tone="info" icon="📐">Total: {Math.round(acres * 100) / 100} acres ({Math.round(acres * 100)} cents)</Chip>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <StepHead icon="🧪" title="What is your soil like?" sub="Rough idea is enough — dark & sticky, red & sandy, river-side… Not sure? Choose “I Don’t Know”." />
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {soilOptions.map((s) => (
                    <Choice key={s.id} on={p.soil === s.id} sub={s.hint} onClick={() => set('soil', s.id)}>
                      {s.id === 'unknown' ? '🤷 ' : '🪨 '}{s.label}
                    </Choice>
                  ))}
                </div>
                {p.soil === 'unknown' && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-leaf-400/30 bg-leaf-400/5 p-4 text-sm text-ink">
                    <p className="font-semibold text-leaf-700 dark:text-leaf-300">No problem at all — most farmers start here 🙂</p>
                    <p className="mt-1 text-muted">We’ll recommend crops that suit many soil types, and your plan includes a soil-test reminder (₹300–700 at a government lab). A photo of soil can never tell its chemistry — only a lab test can.</p>
                  </motion.div>
                )}
                <div>
                  <button type="button" className="btn-quiet text-xs" onClick={() => setShowTest((v) => !v)}>
                    {showTest ? '▾' : '▸'} Have a soil test report? Enter values (optional)
                  </button>
                  <AnimatePresence>
                    {showTest && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="mt-3 grid gap-3 overflow-hidden sm:grid-cols-5">
                        {([['ph', 'pH'], ['nitrogen', 'N'], ['phosphorus', 'P'], ['potassium', 'K'], ['organicCarbon', 'Org. C']] as const).map(([k, label]) => (
                          <Field key={k} label={label}>
                            <input className={inputCls} value={p.soilTest?.[k] ?? ''} placeholder="—"
                              onChange={(e) => set('soilTest', { ...p.soilTest, [k]: e.target.value })} />
                          </Field>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <StepHead icon="💧" title="Where does your water come from?" sub="Water decides everything in farming — pick the closest option." />
                <div className="grid gap-2.5 sm:grid-cols-4">
                  {waterSources.map((w) => (
                    <Choice key={w.id} on={p.waterSource === w.id} onClick={() => set('waterSource', w.id)}>{w.icon} {w.label}</Choice>
                  ))}
                </div>
                <Field label="Is water available year-round?">
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {([['yes', '✅ Yes, reliable'], ['no', '⚠️ Often short'], ['unknown', '🤷 Not sure']] as const).map(([v, label]) => (
                      <Choice key={v} on={p.waterReliable === v} onClick={() => set('waterReliable', v)}>{label}</Choice>
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <StepHead icon="💰" title="What can you invest this season?" sub="Be honest — the plan only recommends crops you can actually afford. Loans? Schemes? We’ll flag options later." />
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {[50000, 100000, 200000, 500000].map((v) => (
                    <Choice key={v} on={!p.budget.perAcre && p.budget.amount === v} onClick={() => set('budget', { amount: v, perAcre: false })}>
                      {v >= 100000 ? `₹${v / 100000} Lakh${v > 100000 ? 's' : ''}` : `₹${v / 1000}K`}
                    </Choice>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Custom total budget (₹)">
                    <input type="number" min={0} step={5000} className={inputCls} value={p.budget.perAcre ? '' : p.budget.amount}
                      placeholder="e.g. 150000" onChange={(e) => set('budget', { amount: Math.max(0, Number(e.target.value)), perAcre: false })} />
                  </Field>
                  <Field label="Or budget per acre (₹)">
                    <input type="number" min={0} step={1000} className={inputCls} value={p.budget.perAcre ? p.budget.amount : ''}
                      placeholder="e.g. 40000" onChange={(e) => set('budget', { amount: Math.max(0, Number(e.target.value)), perAcre: true })} />
                  </Field>
                </div>
                <Chip tone="info" icon="🧮">≈ ₹{fmt(Math.round(bpa))} per acre · ₹{fmt(p.budget.perAcre ? p.budget.amount * acres : p.budget.amount)} total for {Math.round(acres * 100) / 100} acres</Chip>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <StepHead icon="🎯" title="What matters most to you?" sub="Pick all that apply — this shapes the crop ranking." />
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {goalOptions.map((g) => (
                    <Choice key={g.id} on={p.goals.includes(g.id)}
                      onClick={() => set('goals', p.goals.includes(g.id) ? p.goals.filter((x) => x !== g.id) : [...p.goals, g.id])}>
                      {p.goals.includes(g.id) ? '✓ ' : ''}{g.label}
                    </Choice>
                  ))}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <StepHead icon="🗓️" title="When do you want to start?" sub="Sowing windows matter — we’ll match crops to your month." />
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {([['this-month', '⚡ This month'], ['next-month', '📅 Next month'], ['custom', '🗓️ Custom date']] as const).map(([v, label]) => (
                    <Choice key={v} on={p.startMode === v} onClick={() => set('startMode', v)}>{label}</Choice>
                  ))}
                </div>
                {p.startMode === 'custom' && (
                  <Field label="Start date">
                    <input type="date" className={inputCls} value={p.start} onChange={(e) => set('start', e.target.value)} />
                  </Field>
                )}
                <Card className="border-leaf-400/30 bg-leaf-400/5">
                  <p className="text-sm font-semibold text-leaf-700 dark:text-leaf-300">Starting {new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="mt-1 text-xs text-muted">Your crop calendar, daily tasks and dashboard will all follow this date.</p>
                </Card>
                <div className="rounded-2xl border border-line/60 bg-surface-2/40 p-4 text-xs leading-relaxed text-muted dark:bg-black/10">
                  <strong className="text-ink">Your answers:</strong> {p.location.village || '—'}, {p.location.district || '—'} · {Math.round(acres * 100) / 100} acres ({p.plots.length} plot{p.plots.length > 1 ? 's' : ''}) · {soilOptions.find((s) => s.id === p.soil)?.label} · {waterSources.find((w) => w.id === p.waterSource)?.label} water · ₹{fmt(p.budget.perAcre ? p.budget.amount * acres : p.budget.amount)} budget · {p.goals.map((g) => goalOptions.find((o) => o.id === g)?.label).join(', ')}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-line/50 pt-4">
          <button type="button" className="btn-ghost text-sm" disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}>← Back</button>
          <div className="hidden flex-1 px-4 sm:block"><Progress value={((step + 1) / STEPS.length) * 100} tone="leaf" /></div>
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn-primary text-sm" disabled={!valid} onClick={() => setStep((s) => s + 1)}>Next →</button>
          ) : (
            <button type="button" className="btn-primary text-sm" disabled={!valid} onClick={finish}>🌱 Create My Farm Plan</button>
          )}
        </div>
      </Card>

      <LocationPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onConfirm={onPicked}
        title="📍 Select your farm location"
        initial={p.location.lat && p.location.lng ? { lat: p.location.lat, lng: p.location.lng } : null} />
    </div>
  )

  function updatePlot(i: number, patch: Partial<Plot>) {
    set('plots', p.plots.map((pl, j) => (j === i ? { ...pl, ...patch } : pl)))
  }
}

function StepHead({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="mb-1">
      <h3 className="text-lg font-bold sm:text-xl"><span aria-hidden className="mr-2">{icon}</span>{title}</h3>
      <p className="mt-1 text-sm text-muted">{sub}</p>
    </div>
  )
}

/* ---------------------------------------------------------------- analysis */

const CHECKS = [
  { icon: '📍', text: 'Mapping your location & climate zone' },
  { icon: '🌾', text: 'Checking land size & plots' },
  { icon: '🧪', text: 'Analysing soil type' },
  { icon: '💧', text: 'Checking water availability' },
  { icon: '🌦️', text: 'Pulling live weather forecast' },
  { icon: '💰', text: 'Matching budget with crop costs' },
  { icon: '📅', text: 'Checking sowing windows for your start date' },
  { icon: '🏆', text: 'Ranking crops by suitability' },
]

export function Analyzing({ onDone, place }: { onDone: () => void; place?: string }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (n >= CHECKS.length) {
      const t = setTimeout(onDone, 700)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setN((v) => v + 1), n === 0 ? 250 : 480 + Math.random() * 220)
    return () => clearTimeout(t)
  }, [n, onDone])

  return (
    <div className="mx-auto max-w-xl pb-20 pt-10 text-center">
      <motion.div animate={{ rotate: [0, 6, -6, 0] }} transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }} className="mb-4 text-6xl" aria-hidden>
        🌱
      </motion.div>
      <h2 className="text-2xl font-bold">Building your farm plan…</h2>
      <p className="mt-1 text-sm text-muted">{place ? `Analysing conditions around ${place}` : 'Analysing your inputs'}</p>
      <div className="mx-auto mt-6 max-w-md space-y-2 text-left">
        {CHECKS.map((c, i) => (
          <motion.div key={c.text} initial={{ opacity: 0.35 }} animate={{ opacity: i < n ? 1 : 0.35 }}
            className="flex items-center gap-3 rounded-2xl border border-line/50 bg-surface-2/40 px-4 py-2.5 text-sm dark:bg-black/10">
            <span aria-hidden>{i < n ? '✅' : c.icon}</span>
            <span className={cn('flex-1', i < n && 'font-semibold')}>{c.text}</span>
            {i === n && <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="text-xs text-leaf-600">working…</motion.span>}
          </motion.div>
        ))}
      </div>
      <Progress className="mx-auto mt-6 max-w-md" value={(n / CHECKS.length) * 100} tone="leaf" showValue />
    </div>
  )
}
