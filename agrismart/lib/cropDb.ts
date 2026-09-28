/**
 * Crop agronomy database for the Start Farming wizard.
 *
 * Numbers are regional (Andhra Pradesh / Krishna–Guntur belt) planning
 * figures compiled from typical cost-of-cultivation structures. Every value
 * is surfaced in the UI as an ESTIMATE — see DISCLAIMER in lib/farmPlan.ts.
 * Market prices reference the Market Intelligence table where a row exists.
 */
import type { CropKey } from './crops'
import { cropOf } from './crops'

export type WaterNeed = 'Low' | 'Medium' | 'High'
export type SoilKey = 'black' | 'red' | 'alluvial' | 'sandy' | 'clay' | 'loamy' | 'unknown'

export const soilOptions: Array<{ id: SoilKey; label: string; hint: string }> = [
  { id: 'black', label: 'Black Soil', hint: 'Retains moisture; suits cotton, paddy' },
  { id: 'red', label: 'Red Soil', hint: 'Drains fast; suits chilli, groundnut' },
  { id: 'alluvial', label: 'Alluvial Soil', hint: 'River-deposited; very fertile' },
  { id: 'sandy', label: 'Sandy Soil', hint: 'Drains very fast; low retention' },
  { id: 'clay', label: 'Clay Soil', hint: 'Heavy; holds water long' },
  { id: 'loamy', label: 'Loamy Soil', hint: 'Balanced; most vegetables' },
  { id: 'unknown', label: "I Don't Know", hint: 'Totally fine — continue and test later' },
]

export const waterSources = [
  { id: 'borewell', icon: '💧', label: 'Borewell' },
  { id: 'canal', icon: '💧', label: 'Canal' },
  { id: 'rainfed', icon: '💧', label: 'Rain-fed' },
  { id: 'river', icon: '💧', label: 'River' },
  { id: 'tank', icon: '💧', label: 'Tank' },
  { id: 'limited', icon: '💧', label: 'Limited Water' },
  { id: 'unknown', icon: '💧', label: "Don't Know" },
] as const

export type CropEco = {
  seeds: number; fertilizer: number; pest: number; labour: number
  machinery: number; irrigation: number; transport: number; other: number
}

export type CropStage = { icon: string; name: string; share: number; detail: string }

export type CropInfo = {
  key: CropKey
  climate: string
  tempC: [number, number]
  water: WaterNeed
  durationDays: [number, number]
  sowingMonths: number[]
  seasonLabel: string
  soils: SoilKey[]
  eco: CropEco
  yieldQ: number          // quintals per acre (estimated)
  pricePerQ: number       // ₹ per quintal (estimated / mandi reference)
  marketRef?: string      // matching Market Intelligence crop row
  risks: { water: string; pest: string; market: string; weather: string }
  stages: CropStage[]
  machinery: string[]
  beginnerFriendly: number  // 1–5
  familyFood: boolean
  commercial: boolean
}

const stdStages = (extras: Partial<Record<string, string>> = {}): CropStage[] => [
  { icon: '🌱', name: 'Land Preparation', share: 0.12, detail: extras.prep ?? 'Ploughing, levelling and basal fertilizer' },
  { icon: '🌾', name: 'Sowing', share: 0.06, detail: extras.sow ?? 'Seed treatment and sowing/transplanting' },
  { icon: '💧', name: 'Irrigation', share: 0.12, detail: extras.irr ?? 'Schedule by crop stage and soil moisture' },
  { icon: '🧪', name: 'Nutrient Management', share: 0.12, detail: 'Top dressing per soil test / recommendation' },
  { icon: '🐛', name: 'Crop Monitoring', share: 0.20, detail: 'Scout for pests and disease weekly' },
  { icon: '🌿', name: 'Growth Stage', share: 0.18, detail: extras.grow ?? 'Vegetative to flowering transition' },
  { icon: '🌾', name: 'Harvest Preparation', share: 0.06, detail: 'Labour/machinery booking and storage plan' },
  { icon: '🚜', name: 'Harvest', share: 0.08, detail: 'Harvest at correct moisture/maturity' },
  { icon: '🏪', name: 'Sell Crop', share: 0.06, detail: 'Compare mandi prices before selling' },
]

export const cropDb: CropInfo[] = [
  {
    key: 'paddy',
    climate: 'Warm & humid, standing water',
    tempC: [20, 35],
    water: 'High',
    durationDays: [105, 135],
    sowingMonths: [6, 7, 11, 12],
    seasonLabel: 'Kharif (Jun–Jul) & Rabi (Nov–Dec)',
    soils: ['black', 'alluvial', 'clay', 'loamy'],
    eco: { seeds: 3500, fertilizer: 9000, pest: 3500, labour: 9000, machinery: 6000, irrigation: 7000, transport: 2000, other: 2000 },
    yieldQ: 25, pricePerQ: 2350, marketRef: 'Paddy (Common)',
    risks: {
      water: 'Needs reliable standing water; borewell/canal essential in dry spells',
      pest: 'Stem borer, planthoppers and blast in humid weather',
      market: 'MSP support exists, but grade and moisture affect price',
      weather: 'Cyclonic rain at harvest can cause lodging and sprouting',
    },
    stages: stdStages({ sow: 'Nursery raising then transplanting', grow: 'Tillering → panicle initiation' }),
    machinery: ['Tractor', 'Rotavator', 'Paddy transplanter', 'Combine harvester', 'Sprayer'],
    beginnerFriendly: 4, familyFood: true, commercial: true,
  },
  {
    key: 'maize',
    climate: 'Warm, well-drained fields',
    tempC: [18, 32],
    water: 'Medium',
    durationDays: [90, 110],
    sowingMonths: [6, 7, 9, 10],
    seasonLabel: 'Kharif (Jun–Jul) & post-monsoon (Sep–Oct)',
    soils: ['alluvial', 'loamy', 'red', 'sandy'],
    eco: { seeds: 2500, fertilizer: 7000, pest: 2500, labour: 6000, machinery: 5000, irrigation: 4000, transport: 1500, other: 1500 },
    yieldQ: 32, pricePerQ: 2100, marketRef: 'Maize',
    risks: {
      water: 'Sensitive at tasselling; dry spells cut yield sharply',
      pest: 'Fall armyworm is the major threat — scout weekly',
      market: 'Price tracks poultry/feed demand; volatile across seasons',
      weather: 'Waterlogging in heavy rain damages young plants',
    },
    stages: stdStages({ sow: 'Direct seeding with seed drill', grow: 'Knee-high → tasselling → silking' }),
    machinery: ['Tractor', 'Seed drill', 'Sprayer', 'Combine harvester'],
    beginnerFriendly: 5, familyFood: true, commercial: true,
  },
  {
    key: 'chilli',
    climate: 'Warm, dry ripening period',
    tempC: [20, 35],
    water: 'Medium',
    durationDays: [150, 180],
    sowingMonths: [9, 10, 11],
    seasonLabel: 'Rabi (Sep–Nov nursery, Oct–Dec field)',
    soils: ['red', 'loamy', 'sandy'],
    eco: { seeds: 6000, fertilizer: 12000, pest: 8000, labour: 12000, machinery: 4000, irrigation: 8000, transport: 2500, other: 2500 },
    yieldQ: 8, pricePerQ: 13500, marketRef: 'Chilli (Dry)',
    risks: {
      water: 'Needs steady drip-style moisture; hates waterlogging',
      pest: 'Thrips, mites and leaf curl — the biggest cost driver',
      market: 'Guntur yard prices swing hard with arrival volumes',
      weather: 'Rain at picking ruins colour and grade',
    },
    stages: stdStages({ sow: 'Nursery first, transplant 35–40 day seedlings', grow: 'Flowering → fruit set → ripening picks' }),
    machinery: ['Tractor', 'Rotavator', 'Sprayer', 'Drip system', 'Transport'],
    beginnerFriendly: 2, familyFood: false, commercial: true,
  },
  {
    key: 'groundnut',
    climate: 'Warm, moderate rainfall',
    tempC: [25, 35],
    water: 'Low',
    durationDays: [100, 120],
    sowingMonths: [6, 7, 10, 11],
    seasonLabel: 'Kharif (Jun–Jul) & Rabi (Oct–Nov)',
    soils: ['sandy', 'red', 'loamy'],
    eco: { seeds: 6000, fertilizer: 5000, pest: 2500, labour: 5000, machinery: 3500, irrigation: 3000, transport: 1500, other: 1500 },
    yieldQ: 10, pricePerQ: 6100, marketRef: 'Groundnut',
    risks: {
      water: 'Pegging stage needs moisture; otherwise rain-fed works',
      pest: 'Leaf miner and white grub; seed treatment is key',
      market: 'Oil-mill demand drives price; quality (aflatoxin) matters',
      weather: 'Excess rain at harvest spoils pods in soil',
    },
    stages: stdStages({ grow: 'Flowering → pegging → pod fill' }),
    machinery: ['Tractor', 'Seed drill', 'Sprayer', 'Groundnut digger'],
    beginnerFriendly: 4, familyFood: true, commercial: true,
  },
  {
    key: 'cotton',
    climate: 'Hot, long growing season',
    tempC: [21, 37],
    water: 'Medium',
    durationDays: [160, 180],
    sowingMonths: [5, 6, 7],
    seasonLabel: 'Kharif (May–Jul)',
    soils: ['black', 'clay', 'loamy'],
    eco: { seeds: 4000, fertilizer: 10000, pest: 9000, labour: 10000, machinery: 5000, irrigation: 6000, transport: 2000, other: 2000 },
    yieldQ: 12, pricePerQ: 7200, marketRef: 'Cotton (Medium)',
    risks: {
      water: 'Boll stage stress reduces fibre quality',
      pest: 'Pink bollworm — strict IPM and refuge rows needed',
      market: 'Global fibre prices move the local rate',
      weather: 'Untimely rain stains lint and cuts grade',
    },
    stages: stdStages({ grow: 'Squaring → flowering → boll development' }),
    machinery: ['Tractor', 'Rotavator', 'Sprayer', 'Cotton picker / labour'],
    beginnerFriendly: 2, familyFood: false, commercial: true,
  },
  {
    key: 'tomato',
    climate: 'Mild, cool nights preferred',
    tempC: [18, 30],
    water: 'Medium',
    durationDays: [90, 120],
    sowingMonths: [9, 10, 11, 12],
    seasonLabel: 'Rabi / winter (Sep–Dec)',
    soils: ['loamy', 'red', 'sandy'],
    eco: { seeds: 4000, fertilizer: 12000, pest: 8000, labour: 14000, machinery: 4000, irrigation: 9000, transport: 4000, other: 5000 },
    yieldQ: 150, pricePerQ: 1200, marketRef: 'Tomato',
    risks: {
      water: 'Daily moisture needed; drip + mulch strongly advised',
      pest: 'Leaf miner, fruit borer and blight in humidity',
      market: 'Prices crash in glut weeks — stagger sowing',
      weather: 'Heat above 35°C causes flower drop',
    },
    stages: stdStages({ sow: 'Nursery then transplant on ridges', grow: 'Flowering → fruit set → 8–10 picks' }),
    machinery: ['Tractor', 'Rotavator', 'Sprayer', 'Drip system', 'Crates/transport'],
    beginnerFriendly: 3, familyFood: true, commercial: true,
  },
  {
    key: 'pulses',
    climate: 'Warm, dry finish ideal',
    tempC: [25, 40],
    water: 'Low',
    durationDays: [60, 75],
    sowingMonths: [6, 7, 10],
    seasonLabel: 'Kharif (Jun–Jul) or Rabi (Oct)',
    soils: ['red', 'sandy', 'loamy', 'black'],
    eco: { seeds: 2500, fertilizer: 3000, pest: 1500, labour: 3500, machinery: 2500, irrigation: 2000, transport: 1000, other: 2000 },
    yieldQ: 6, pricePerQ: 6800,
    risks: {
      water: 'Mostly rain-fed; one protective irrigation helps',
      pest: 'Pod borer and mosaic virus; use resistant seed',
      market: 'MSP announcements move local prices',
      weather: 'Late rains cause pod sprouting',
    },
    stages: stdStages({ grow: 'Flowering → pod fill; fixes own nitrogen' }),
    machinery: ['Tractor', 'Seed drill', 'Sprayer'],
    beginnerFriendly: 5, familyFood: true, commercial: false,
  },
]

export const cropInfo = (key: string): CropInfo => cropDb.find((c) => c.key === key) ?? cropDb[0]!

export const ecoTotal = (e: CropEco): number =>
  e.seeds + e.fertilizer + e.pest + e.labour + e.machinery + e.irrigation + e.transport + e.other

export const ECO_LABELS: Array<{ id: keyof CropEco; icon: string; label: string; detail: string }> = [
  { id: 'seeds', icon: '🌱', label: 'Seeds', detail: 'Certified seed / nursery cost per acre' },
  { id: 'fertilizer', icon: '🧪', label: 'Fertilizer', detail: 'Basal + top dressing (NPK, micronutrients)' },
  { id: 'pest', icon: '🐛', label: 'Pest management', detail: 'Plant-protection chemicals + IPM traps' },
  { id: 'labour', icon: '👨🌾', label: 'Labour', detail: 'Sowing, weeding, picking, harvest wages' },
  { id: 'machinery', icon: '🚜', label: 'Machinery', detail: 'Tractor, implements, harvester hire (AgriRent)' },
  { id: 'irrigation', icon: '💧', label: 'Irrigation', detail: 'Power/fuel, water charges, drip runtime' },
  { id: 'transport', icon: '🚚', label: 'Transport', detail: 'Input delivery + produce haul to yard' },
  { id: 'other', icon: '📦', label: 'Other', detail: 'Bags, storage, contingencies' },
]

/** Crop image/icon come from the shared catalogue so cards match My Lands. */
export const cropVisual = (key: string) => cropOf(key)
