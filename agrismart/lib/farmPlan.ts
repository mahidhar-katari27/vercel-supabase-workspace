/**
 * Farm Plan — the single source of truth for the Start Farming flow.
 * Saved locally so the plan syncs across dashboard, My Farm lands,
 * crop doctor, market, schemes and the AI assistant.
 * All money/yield numbers are ESTIMATES — see DISCLAIMER below.
 */
import type { CropEco, CropInfo, CropStage } from './cropDb'
import type { CropKey } from './crops'
import { cropDb, cropInfo, ecoTotal } from './cropDb'
import { marketRows } from './data'
import type { Land } from './data'
import { farmer } from './data'

export const PLAN_KEY = 'agrismart-farm-plan'
export const TASKS_KEY = 'agrismart-farm-tasks'
export const PLAN_EVENT = 'agrismart:plan-change'

export const DISCLAIMER =
  'Estimates only — for planning and demonstration. Actual results vary with soil, weather, inputs and market conditions. AgriSmart does not guarantee outcomes.'

export type Plot = { acres: number; cents: number; note?: string }

export type SoilTest = { ph?: string; nitrogen?: string; phosphorus?: string; potassium?: string; organicCarbon?: string }

export type FarmPlan = {
  createdAt: string
  location: { state: string; district: string; village: string; lat?: number; lng?: number; label?: string }
  plots: Plot[]
  soil: string            // SoilKey id
  soilTest?: SoilTest
  waterSource: string
  waterReliable: 'yes' | 'no' | 'unknown'
  budget: { amount: number; perAcre: boolean }
  goals: string[]
  start: string           // ISO date
  startMode: 'this-month' | 'next-month' | 'custom'
  chosenCrop: string      // CropKey — '' until selected
  recommendedCrop?: string
  scenario?: { yieldPct: number; pricePct: number; costPct: number }
  compare: string[]       // crop keys kept in the comparison table
}

export const totalAcres = (p: FarmPlan): number =>
  Math.round(p.plots.reduce((a, pl) => a + pl.acres + pl.cents / 100, 0) * 100) / 100

export const budgetPerAcre = (p: FarmPlan): number => {
  const acres = totalAcres(p)
  if (p.budget.perAcre) return p.budget.amount
  return acres > 0 ? p.budget.amount / acres : p.budget.amount
}

/* ------------------------------------------------------------------ */
/* persistence                                                          */
/* ------------------------------------------------------------------ */
export function loadPlan(): FarmPlan | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(PLAN_KEY)
    if (!raw) return null
    const plan = JSON.parse(raw) as FarmPlan
    if (!plan.plots?.length || !plan.chosenCrop === undefined) return plan
    return plan
  } catch { return null }
}

export function savePlan(plan: FarmPlan): void {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(PLAN_KEY, JSON.stringify(plan)); window.dispatchEvent(new Event(PLAN_EVENT)) } catch { /* private mode */ }
}

export function clearPlan(): void {
  if (typeof window === 'undefined') return
  try { window.localStorage.removeItem(PLAN_KEY); window.localStorage.removeItem(TASKS_KEY); window.dispatchEvent(new Event(PLAN_EVENT)) } catch { /* ignore */ }
}

export function onPlanChange(fn: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(PLAN_EVENT, fn)
  window.addEventListener('storage', fn)
  return () => { window.removeEventListener(PLAN_EVENT, fn); window.removeEventListener('storage', fn) }
}

/* ------------------------------------------------------------------ */
/* suitability engine                                                   */
/* ------------------------------------------------------------------ */
export type FitNote = { ok: boolean; text: string }
export type Suitability = { crop: CropKey; score: number; reasons: FitNote[]; considerations: FitNote[] }

const GOALS: Record<string, string> = {
  income: 'Good income',
  beginner: 'Beginner friendly',
  family: 'Family food',
  lowwater: 'Low water use',
  lowcost: 'Low investment',
  short: 'Short duration',
}
export const goalOptions = Object.entries(GOALS).map(([id, label]) => ({ id, label }))

export function suitabilityFor(plan: FarmPlan, crop: CropInfo): Suitability {
  const reasons: FitNote[] = []
  const considerations: FitNote[] = []
  let score = 55
  const acres = totalAcres(plan)
  const bpa = budgetPerAcre(plan)
  const cost = ecoTotal(crop.eco)

  // soil
  if (plan.soil === 'unknown') {
    reasons.push({ ok: true, text: 'Soil type unknown — this crop suits many soils; do a soil test before sowing' })
    score += 5
  } else if (crop.soils.includes(plan.soil as CropInfo['soils'][number])) {
    score += 15; reasons.push({ ok: true, text: `${cap(plan.soil)} soil is well suited for ${crop.key}` })
  } else {
    score -= 12; considerations.push({ ok: false, text: `${cap(plan.soil)} soil is not ideal — ${crop.key} prefers ${crop.soils.map(cap).join(', ')}` })
  }

  // water
  const wetSources = ['canal', 'river', 'tank', 'borewell']
  if (crop.water === 'High') {
    if (wetSources.includes(plan.waterSource) && plan.waterReliable === 'yes') {
      score += 12; reasons.push({ ok: true, text: `${cap(plan.waterSource)} water can meet the high water demand` })
    } else {
      score -= 15; considerations.push({ ok: false, text: 'Needs a lot of water — limited/unreliable water is risky' })
    }
  } else if (crop.water === 'Low') {
    score += plan.waterSource === 'limited' || plan.waterSource === 'rainfed' ? 12 : 6
    reasons.push({ ok: true, text: 'Low water requirement — works even with limited water' })
  } else if (plan.waterSource === 'rainfed' || plan.waterSource === 'limited') {
    score -= 6; considerations.push({ ok: false, text: 'Needs dependable moisture at key stages — protect with irrigation' })
  } else {
    score += 8; reasons.push({ ok: true, text: `${cap(plan.waterSource)} covers the medium water need` })
  }

  // budget
  if (bpa >= cost * 1.2) { score += 10; reasons.push({ ok: true, text: `Budget ₹${fmt(bpa)}/acre comfortably covers the ≈₹${fmt(cost)} cost` }) }
  else if (bpa >= cost) { score += 5; reasons.push({ ok: true, text: `Budget just covers the ≈₹${fmt(cost)}/acre cost — keep a buffer` }) }
  else { score -= 14; considerations.push({ ok: false, text: `Estimated cost ≈₹${fmt(cost)}/acre is above your ₹${fmt(bpa)}/acre budget` }) }

  // timing
  const month = new Date(plan.start || Date.now()).getMonth() + 1
  if (crop.sowingMonths.includes(month)) {
    score += 12; reasons.push({ ok: true, text: `Your start month matches the ${crop.seasonLabel} window` })
  } else {
    score -= 8; considerations.push({ ok: false, text: `Best sown ${crop.seasonLabel} — starting in month ${month} is off-window` })
  }

  // goals
  const g = plan.goals
  if (g.includes('beginner')) { crop.beginnerFriendly >= 4 ? (score += 8, reasons.push({ ok: true, text: 'Easy to manage for a first-time farmer' })) : (score -= 6, considerations.push({ ok: false, text: 'Needs close attention — not the easiest first crop' })) }
  if (g.includes('income')) {
    const margin = crop.yieldQ * crop.pricePerQ - cost
    margin >= 35000 ? (score += 8, reasons.push({ ok: true, text: `Higher margin potential (≈₹${fmt(margin)}/acre est.)` })) : (score -= 3, considerations.push({ ok: false, text: `Margin ≈₹${fmt(margin)}/acre (est.) — moderate income potential` }))
  }
  if (g.includes('lowcost')) { cost <= 30000 ? (score += 8, reasons.push({ ok: true, text: `Low input cost (≈₹${fmt(cost)}/acre est.)` })) : (score -= 6, considerations.push({ ok: false, text: `Input cost ≈₹${fmt(cost)}/acre (est.) is on the higher side` })) }
  if (g.includes('lowwater')) { crop.water === 'Low' ? (score += 8, reasons.push({ ok: true, text: 'One of the lowest water users in this set' })) : (score -= 5, considerations.push({ ok: false, text: `${crop.water} water requirement` })) }
  if (g.includes('short')) { crop.durationDays[1] <= 110 ? (score += 7, reasons.push({ ok: true, text: `Short cycle — ${crop.durationDays[0]}–${crop.durationDays[1]} days to harvest` })) : (score -= 4, considerations.push({ ok: false, text: `Long cycle (${crop.durationDays[0]}–${crop.durationDays[1]} days)` })) }
  if (g.includes('family') && crop.familyFood) { score += 6; reasons.push({ ok: true, text: 'Useful for family consumption too' }) }

  // scale
  if (acres > 3 && labourHeavy(crop)) {
    score -= 3; considerations.push({ ok: false, text: `On ${fmt(acres)} acres the labour load is heavy — plan workers early` })
  }

  return { crop: crop.key, score: Math.max(20, Math.min(96, Math.round(score))), reasons, considerations }
}

const labourHeavy = (crop: CropInfo): boolean => crop.eco.labour >= 10000

export function rankCrops(plan: FarmPlan): Suitability[] {
  return cropDb.map((c) => suitabilityFor(plan, c)).sort((a, b) => b.score - a.score)
}

/* ------------------------------------------------------------------ */
/* economics                                                            */
/* ------------------------------------------------------------------ */
export type Scenario = { id: 'conservative' | 'expected' | 'high'; label: string; hint: string; yieldPct: number; pricePct: number; costPct: number }
export const SCENARIOS: Scenario[] = [
  { id: 'conservative', label: 'Conservative', hint: 'Yield −20%, price −10%', yieldPct: -20, pricePct: -10, costPct: 5 },
  { id: 'expected', label: 'Expected', hint: 'Base estimate from wizard inputs', yieldPct: 0, pricePct: 0, costPct: 0 },
  { id: 'high', label: 'Optimistic', hint: 'Yield +15%, price +5%', yieldPct: 15, pricePct: 5, costPct: 0 },
]

export type PriceRef = { crop: string; market: string; price: number; date: string; msp: number }

export type Economics = {
  cost: number; costRows: Array<{ icon: string; label: string; detail: string; value: number }>
  yieldQ: number; pricePerQ: number; revenue: number; profit: number
  priceRef?: PriceRef
  total: { acres: number; cost: number; revenue: number; profit: number }
}

/** Live Market Intelligence price for a crop, when a row exists (source + date). */
export function marketPriceRef(cropKey: string): PriceRef | undefined {
  const ref = cropInfo(cropKey).marketRef
  const row = ref ? marketRows.find((r) => r.crop === ref) : undefined
  return row ? { crop: row.crop, market: row.market, price: row.price, date: row.date, msp: row.msp } : undefined
}

export function economics(plan: FarmPlan, cropKey: string, opts?: { yieldPct?: number; pricePct?: number; costPct?: number; acres?: number }): Economics {
  const crop = cropInfo(cropKey)
  const yp = opts?.yieldPct ?? 0, pp = opts?.pricePct ?? 0, cp = opts?.costPct ?? 0
  const acres = opts?.acres ?? (totalAcres(plan) || 1)
  const costRows = [
    { icon: '🌱', label: 'Seeds', detail: 'Certified seed / nursery per acre', value: crop.eco.seeds },
    { icon: '🧪', label: 'Fertilizer', detail: 'Basal + top dressing per acre', value: crop.eco.fertilizer },
    { icon: '🐛', label: 'Pest management', detail: 'Plant protection + IPM per acre', value: crop.eco.pest },
    { icon: '👨🌾', label: 'Labour', detail: 'All field operations per acre', value: crop.eco.labour },
    { icon: '🚜', label: 'Machinery', detail: 'Hired equipment per acre (see AgriRent)', value: crop.eco.machinery },
    { icon: '💧', label: 'Irrigation', detail: 'Power, fuel, water charges per acre', value: crop.eco.irrigation },
    { icon: '🚚', label: 'Transport', detail: 'Inputs in + produce out', value: crop.eco.transport },
    { icon: '📦', label: 'Other', detail: 'Bags, storage, contingency', value: crop.eco.other },
  ].map((r) => ({ ...r, value: Math.round((r.value * (100 + cp)) / 100) }))
  const cost = costRows.reduce((a, r) => a + r.value, 0)
  const yieldQ = Math.round(((crop.yieldQ * (100 + yp)) / 100) * 10) / 10
  const priceRef = marketPriceRef(cropKey)
  const basePrice = priceRef?.price ?? crop.pricePerQ
  const pricePerQ = Math.round((basePrice * (100 + pp)) / 100)
  const revenue = Math.round(yieldQ * pricePerQ)
  return {
    cost, costRows, yieldQ, pricePerQ, revenue, profit: revenue - cost, priceRef,
    total: { acres, cost: Math.round(cost * acres), revenue: Math.round(revenue * acres), profit: Math.round((revenue - cost) * acres) },
  }
}

/* ------------------------------------------------------------------ */
/* calendar + tasks                                                     */
/* ------------------------------------------------------------------ */
export function stageAt(plan: FarmPlan, cropKey: string, when = new Date()): { stage: CropStage; index: number; day: number; total: number; start: Date; end: Date } {
  const crop = cropInfo(cropKey)
  const total = Math.round((crop.durationDays[0] + crop.durationDays[1]) / 2)
  const start = new Date(plan.start || Date.now())
  let day = Math.floor((when.getTime() - start.getTime()) / 86400000)
  day = Math.max(0, Math.min(total, day))
  let acc = 0
  for (let i = 0; i < crop.stages.length; i++) {
    const s = crop.stages[i]!
    const from = Math.round(acc * total), to = Math.round((acc + s.share) * total)
    acc += s.share
    if (day < to || i === crop.stages.length - 1) {
      return { stage: s, index: i, day, total, start: addDays(start, from), end: addDays(start, to) }
    }
  }
  return { stage: crop.stages[0]!, index: 0, day, total, start, end: addDays(start, total) }
}

export const addDays = (d: Date, n: number): Date => new Date(d.getTime() + n * 86400000)

export type TaskItem = { id: string; icon: string; text: string; tag: 'stage' | 'weather' | 'routine' }

export function tasksForToday(plan: FarmPlan, opts?: { tempC?: number; rainPct?: number; humidity?: number }): TaskItem[] {
  const crop = cropInfo(plan.chosenCrop)
  const { stage, day } = stageAt(plan, plan.chosenCrop)
  const acres = totalAcres(plan) || 1
  const tasks: TaskItem[] = [
    { id: 'scout', icon: '🔍', text: `Walk the field — scout ${crop.risks.pest.split('—')[0]?.trim().toLowerCase() ?? 'pests'} (${stage.name}, day ${day})`, tag: 'stage' },
    { id: 'stage', icon: stage.icon, text: `${stage.name}: ${stage.detail}${acres > 1 ? ` across ${fmt(acres)} acres` : ''}`, tag: 'stage' },
    { id: 'water', icon: '💧', text: crop.water === 'High' ? 'Check standing water / irrigate today if soil is dry' : 'Check soil moisture; irrigate if the top 2 inches are dry', tag: 'routine' },
    { id: 'records', icon: '📓', text: 'Log today’s spend and observations (used by your farm plan)', tag: 'routine' },
    { id: 'market', icon: '📈', text: `Check ${crop.marketRef ?? crop.key} mandi price trend before any sale`, tag: 'routine' },
  ]
  const t = opts?.tempC, r = opts?.rainPct, h = opts?.humidity
  if (r !== undefined && r >= 60) tasks.push({ id: 'rain', icon: '🌧️', text: `Rain likely (${Math.round(r)}%) — clear drainage channels, postpone spraying`, tag: 'weather' })
  if (t !== undefined && t >= 36) tasks.push({ id: 'heat', icon: '🌡️', text: `Heat ${Math.round(t)}°C — irrigate early morning/evening to avoid stress`, tag: 'weather' })
  if (h !== undefined && h >= 85) tasks.push({ id: 'humid', icon: '🍄', text: 'High humidity — watch for fungal spots; improve airflow', tag: 'weather' })
  if (day === 0) tasks.unshift({ id: 'soil', icon: '🧪', text: 'Get a soil test done (₹300–700) — the single best first investment', tag: 'routine' })
  return tasks
}

export type DoneMap = Record<string, Record<string, boolean>>

export function loadDoneTasks(): DoneMap {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(window.localStorage.getItem(TASKS_KEY) ?? '{}') as DoneMap } catch { return {} }
}
export function saveDoneTasks(done: DoneMap): void {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(TASKS_KEY, JSON.stringify(done)) } catch { /* ignore */ }
}
export const todayKey = (): string => new Date().toISOString().slice(0, 10)

/* ------------------------------------------------------------------ */
/* plan → My Farm lands (single source of truth)                        */
/* ------------------------------------------------------------------ */
export function planLands(plan: FarmPlan): Land[] {
  if (!plan?.chosenCrop) return []
  const crop = cropInfo(plan.chosenCrop)
  const eco = economics(plan, plan.chosenCrop)
  const { stage, day, total } = stageAt(plan, plan.chosenCrop)
  const harvest = addDays(new Date(plan.start || Date.now()), total)
  const progress = Math.max(5, Math.min(100, Math.round((day / total) * 100)))
  const health = 82 + Math.round((crop.beginnerFriendly / 5) * 10)
  return plan.plots.map((plot, i) => {
    const a = Math.round((plot.acres + plot.cents / 100) * 100) / 100 || 1
    return {
      id: `plan-${i}`,
      name: plot.note || `New Land ${i + 1}`,
      location: `${plan.location.village}, ${plan.location.district}`,
      acres: a,
      crop: crop.marketRef ?? crop.key,
      cropKey: crop.key,
      health,
      stage: stage.name,
      progress,
      planted: new Date(plan.start || Date.now()).toISOString().slice(0, 10),
      harvest: harvest.toISOString().slice(0, 10),
      harvestDays: Math.max(0, Math.round((harvest.getTime() - Date.now()) / 86400000)),
      investment: Math.round(eco.cost * a),
      revenue: Math.round(eco.revenue * a),
      profit: Math.round(eco.profit * a),
      coords: plan.location.lat && plan.location.lng
        ? { lat: plan.location.lat, lng: plan.location.lng }
        : { ...farmer.coords },
      soil: cap(plan.soil === 'unknown' ? 'loamy' : plan.soil),
      irrigation: cap(plan.waterSource === 'unknown' ? 'borewell' : plan.waterSource),
    } satisfies Land
  })
}

/* ------------------------------------------------------------------ */
export const fmt = (n: number): string => Math.round(n).toLocaleString('en-IN')
export const inr = (n: number): string => `₹${fmt(n)}`
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)
export { cap }
