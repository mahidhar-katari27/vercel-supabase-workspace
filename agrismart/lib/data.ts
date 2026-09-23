/**
 * AgriSmart 2.0 demo dataset.
 *
 * EVERY value here is illustrative sample data built for the hackathon
 * prototype. No live market feed, weather API or government scheme database is
 * connected. Surfaces rendered from this module are labelled "Demo data" in the
 * UI so estimates are never mistaken for real prices, real yields or advice.
 *
 * The shape of each record mirrors what a Supabase-backed version would return,
 * so swapping demo data for live queries is a drop-in change.
 */

import type { CropKey } from './crops'

export type LatLng = { lat: number; lng: number }

/* ------------------------------------------------------------------ farmer */

export const farmer = {
  name: 'Ramesh Naidu',
  handle: '@ramesh_naidu',
  role: 'Farmer' as const,
  phone: '+91 98xxx xx210',
  location: 'Vijayawada, Andhra Pradesh',
  coords: { lat: 16.5062, lng: 80.648 } as LatLng,
  season: 'Kharif 2026',
  memberSince: '2024',
  totalAcres: 9.3,
  activeCrops: 4,
  languages: ['English', 'తెలుగు', 'Tenglish'],
  avatarSeed: 'RN',
}

export const roles = [
  { id: 'farmer', icon: '👨‍🌾', label: 'Farmer', blurb: 'Manage land, crops, finance, market and bookings' },
  { id: 'buyer', icon: '🛒', label: 'Buyer', blurb: 'Browse produce, contact farmers, place orders' },
  { id: 'expert', icon: '👨‍🔬', label: 'Expert', blurb: 'Answer questions and consult farmers' },
  { id: 'provider', icon: '🚜', label: 'Service Provider', blurb: 'List machinery, drivers and availability' },
  { id: 'admin', icon: '🏢', label: 'Admin', blurb: 'Manage the platform, users and data' },
]

/* -------------------------------------------------------------------- land */

export type Land = {
  id: string
  name: string
  location: string
  acres: number
  soil: string
  irrigation: string
  crop: string
  planted: string
  harvest: string
  stage: string
  progress: number
  health: number
  coords: LatLng
  /** Catalogue key driving the crop photograph — see lib/crops.ts */
  cropKey: CropKey
  harvestDays: number
  investment: number
  revenue: number
  profit: number
}

export const lands: Land[] = [
  {
    id: 'land-01',
    name: 'Land 01',
    location: 'Vijayawada',
    acres: 2.5,
    soil: 'Black cotton soil',
    irrigation: 'Borewell',
    crop: 'Paddy',
    planted: '2026-06-18',
    harvest: '2026-11-04',
    stage: 'Vegetative',
    progress: 58,
    health: 92,
    coords: { lat: 16.5062, lng: 80.648 },
    cropKey: 'paddy',
    harvestDays: 42,
    investment: 42000,
    revenue: 78000,
    profit: 36000,
  },
  {
    id: 'land-02',
    name: 'Land 02',
    location: 'Guntur',
    acres: 1.8,
    soil: 'Red loamy',
    irrigation: 'Drip',
    crop: 'Chilli',
    planted: '2026-07-05',
    harvest: '2026-12-08',
    stage: 'Flowering',
    progress: 44,
    health: 87,
    coords: { lat: 16.3067, lng: 80.4365 },
    cropKey: 'chilli',
    harvestDays: 76,
    investment: 55000,
    revenue: 118000,
    profit: 63000,
  },
  {
    id: 'land-03',
    name: 'Land 03',
    location: 'Prakasam',
    acres: 3,
    soil: 'Black cotton soil',
    irrigation: 'Rainfed',
    crop: 'Cotton',
    planted: '2026-07-12',
    harvest: '2026-11-30',
    stage: 'Vegetative',
    progress: 40,
    health: 94,
    coords: { lat: 15.8781, lng: 79.4122 },
    cropKey: 'cotton',
    harvestDays: 68,
    investment: 48000,
    revenue: 96000,
    profit: 48000,
  },
  {
    id: 'land-04',
    name: 'Land 04',
    location: 'Krishna District',
    acres: 2,
    soil: 'Alluvial',
    irrigation: 'Canal',
    crop: 'Maize',
    planted: '2026-07-20',
    harvest: '2026-11-13',
    stage: 'Growing',
    progress: 49,
    health: 90,
    coords: { lat: 16.787, lng: 80.846 },
    cropKey: 'maize',
    harvestDays: 51,
    investment: 30000,
    revenue: 62000,
    profit: 32000,
  },
]
export const soilTypes = ['Black cotton soil', 'Red loamy', 'Alluvial', 'Sandy loam', 'Clay', 'Laterite']
export const irrigationTypes = ['Borewell', 'Canal', 'Drip', 'Sprinkler', 'Rainfed', 'River lift']

/* ----------------------------------------------------------------- weather */

export const weather = {
  now: { temp: 32, feels: 36, condition: 'Partly cloudy', icon: '⛅', humidity: 68, wind: 14, rain: 25, uv: 8 },
  advice: 'Ideal window for spraying today — low wind after 5 PM.',
  forecast: [
    { day: 'Tue', hi: 33, lo: 25, rain: 20, icon: '⛅' },
    { day: 'Wed', hi: 34, lo: 26, rain: 15, icon: '☀️' },
    { day: 'Thu', hi: 31, lo: 25, rain: 65, icon: '🌧️' },
    { day: 'Fri', hi: 29, lo: 24, rain: 80, icon: '⛈️' },
    { day: 'Sat', hi: 30, lo: 24, rain: 45, icon: '🌦️' },
    { day: 'Sun', hi: 32, lo: 25, rain: 20, icon: '⛅' },
    { day: 'Mon', hi: 33, lo: 26, rain: 10, icon: '☀️' },
  ],
}

export type Alert = {
  id: string
  icon: string
  title: string
  body: string
  tone: 'warn' | 'danger' | 'info' | 'ok'
  when: string
}

export const alerts: Alert[] = [
  {
    id: 'a1', icon: '🌧️', tone: 'warn', when: 'In 2 days',
    title: 'Heavy rainfall expected Thursday–Friday',
    body: '65–80% chance of 40–70 mm. Delay any fertilizer application and clear field drainage channels.',
  },
  {
    id: 'a2', icon: '🌡️', tone: 'danger', when: 'Tomorrow',
    title: 'High temperature expected — 34 °C',
    body: 'Heat stress risk for flowering chilli. Irrigate early morning or late evening to reduce loss.',
  },
  {
    id: 'a3', icon: '💧', tone: 'info', when: 'Today',
    title: 'Irrigation reminder — Land 01',
    body: 'Paddy at tillering stage. Field has gone 4 days without irrigation; soil moisture is trending down.',
  },
  {
    id: 'a4', icon: '🐛', tone: 'warn', when: 'This week',
    title: 'Stem borer activity reported nearby',
    body: '3 farmers within 12 km reported stem borer in paddy. Install pheromone traps as a precaution.',
  },
]

/* ------------------------------------------------------------------ market */

export type MarketRow = {
  crop: string
  market: string
  price: number
  prev: number
  unit: string
  date: string
  msp: number
}

export const marketRows: MarketRow[] = [
  { crop: 'Paddy (Common)', market: 'Vijayawada Market', price: 2350, prev: 2255, unit: 'Quintal', date: '23 Sep', msp: 2300 },
  { crop: 'Paddy (Grade A)', market: 'Gudivada Market', price: 2480, prev: 2410, unit: 'Quintal', date: '23 Sep', msp: 2300 },
  { crop: 'Cotton (Medium)', market: 'Nandyal Market', price: 7100, prev: 7240, unit: 'Quintal', date: '23 Sep', msp: 7121 },
  { crop: 'Chilli (Dry)', market: 'Guntur Market', price: 13500, prev: 12980, unit: 'Quintal', date: '23 Sep', msp: 0 },
  { crop: 'Maize', market: 'Kurnool Market', price: 2140, prev: 2160, unit: 'Quintal', date: '23 Sep', msp: 2225 },
  { crop: 'Turmeric (Finger)', market: 'Nizamabad Market', price: 14200, prev: 13600, unit: 'Quintal', date: '22 Sep', msp: 0 },
  { crop: 'Groundnut', market: 'Anantapur Market', price: 6450, prev: 6380, unit: 'Quintal', date: '22 Sep', msp: 6783 },
  { crop: 'Tomato', market: 'Vijayawada Market', price: 1850, prev: 2240, unit: 'Quintal', date: '23 Sep', msp: 0 },
]

/** 12-week price history for the trend chart. */
export const priceHistory = {
  labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'],
  series: [
    { name: 'Paddy', color: '#22965c', data: [2080, 2110, 2095, 2140, 2180, 2165, 2200, 2230, 2210, 2255, 2290, 2350] },
    { name: 'Cotton', color: '#d4a537', data: [6900, 6980, 7050, 7120, 7180, 7240, 7300, 7260, 7190, 7150, 7240, 7100] },
    { name: 'Chilli', color: '#c0553f', data: [11200, 11480, 11750, 12100, 12400, 12350, 12600, 12800, 12950, 12980, 13200, 13500] },
  ],
}

/* --------------------------------------------------------------- schemes */

export type Scheme = {
  id: string
  name: string
  body: string
  category: string
  benefit: string
  states: string[]
  minAcres: number
  maxAcres: number
  sectors: string[]
  docs: string[]
  deadline: string
  match?: { state: boolean; land: boolean; sector: boolean; docs: boolean }
}

export const schemes: Scheme[] = [
  {
    id: 's1', name: 'PM-KISAN Samman Nidhi', body: 'Government of India',
    category: 'Income support', benefit: '₹6,000 per year in three instalments',
    states: ['All states'], minAcres: 0, maxAcres: 99, sectors: ['Crop', 'Aqua', 'Poultry', 'Dairy'],
    docs: ['Aadhaar', 'Land document', 'Bank details'], deadline: 'Rolling — no deadline',
  },
  {
    id: 's2', name: 'PM Fasal Bima Yojana', body: 'Ministry of Agriculture',
    category: 'Crop insurance', benefit: 'Premium subsidy, claim on crop loss',
    states: ['All states'], minAcres: 0, maxAcres: 99, sectors: ['Crop'],
    docs: ['Aadhaar', 'Land document', 'Bank details', 'Sowing certificate'], deadline: '31 Jul (Kharif)',
  },
  {
    id: 's3', name: 'Per Drop More Crop (Micro Irrigation)', body: 'State Horticulture Dept.',
    category: 'Irrigation', benefit: 'Up to 55% subsidy on drip / sprinkler',
    states: ['Andhra Pradesh', 'Telangana', 'Karnataka'], minAcres: 0.5, maxAcres: 10, sectors: ['Crop'],
    docs: ['Aadhaar', 'Land document', 'Water source proof', 'Quotation'], deadline: '30 Nov 2026',
  },
  {
    id: 's4', name: 'AP Aqua — Pond Development Support', body: 'AP Fisheries Dept.',
    category: 'Aqua farming', benefit: 'Subsidised pond excavation and aeration',
    states: ['Andhra Pradesh'], minAcres: 1, maxAcres: 20, sectors: ['Aqua'],
    docs: ['Aadhaar', 'Land document', 'Fisheries registration'], deadline: '15 Oct 2026',
  },
  {
    id: 's5', name: 'Dairy Entrepreneurship Development', body: 'NABARD',
    category: 'Dairy', benefit: 'Capital subsidy on cattle purchase',
    states: ['All states'], minAcres: 0, maxAcres: 99, sectors: ['Dairy'],
    docs: ['Aadhaar', 'Bank details', 'Project report'], deadline: 'Rolling — no deadline',
  },
  {
    id: 's6', name: 'Poultry Infrastructure Development', body: 'State Animal Husbandry',
    category: 'Poultry', benefit: 'Subsidy on sheds and equipment',
    states: ['Andhra Pradesh', 'Telangana'], minAcres: 0, maxAcres: 5, sectors: ['Poultry'],
    docs: ['Aadhaar', 'Land document', 'Veterinary certificate'], deadline: '31 Dec 2026',
  },
  {
    id: 's7', name: 'Soil Health Card Scheme', body: 'Ministry of Agriculture',
    category: 'Soil', benefit: 'Free soil testing and nutrient recommendation',
    states: ['All states'], minAcres: 0, maxAcres: 99, sectors: ['Crop'],
    docs: ['Aadhaar', 'Land document'], deadline: 'Rolling — no deadline',
  },
  {
    id: 's8', name: 'Agri Mechanization — Custom Hiring Centre', body: 'State Agriculture Dept.',
    category: 'Machinery', benefit: '40–50% subsidy on farm machinery',
    states: ['Andhra Pradesh', 'Maharashtra'], minAcres: 2, maxAcres: 25, sectors: ['Crop'],
    docs: ['Aadhaar', 'Land document', 'Bank details', 'Machinery quotation'], deadline: '28 Feb 2027',
  },
]

export const schemeStages = ['Not Started', 'Documents Pending', 'Applied', 'Under Review', 'Approved']

export const schemeApplications = [
  { scheme: 'PM-KISAN Samman Nidhi', stage: 'Approved', updated: '12 Aug 2026', ref: 'AP/PMK/2026/4471' },
  { scheme: 'PM Fasal Bima Yojana', stage: 'Under Review', updated: '02 Sep 2026', ref: 'AP/FCBY/2026/1180' },
  { scheme: 'Per Drop More Crop', stage: 'Documents Pending', updated: '19 Sep 2026', ref: 'AP/PDMC/2026/0923' },
]

/* ------------------------------------------------------------ marketplace */

export type Listing = {
  id: string
  name: string
  category: string
  qty: string
  price: number
  unit: string
  location: string
  seller: string
  rating: number
  hue: number
  verified: boolean
}

export const categories = [
  { id: 'crops', icon: '🌾', label: 'Crops' },
  { id: 'vegetables', icon: '🥬', label: 'Vegetables' },
  { id: 'fruits', icon: '🍎', label: 'Fruits' },
  { id: 'seeds', icon: '🌱', label: 'Seeds' },
  { id: 'fertilizers', icon: '🧪', label: 'Fertilizers' },
  { id: 'inputs', icon: '🌿', label: 'Agri Inputs' },
  { id: 'fish', icon: '🐟', label: 'Fish' },
  { id: 'prawns', icon: '🦐', label: 'Prawns' },
  { id: 'dairy', icon: '🥛', label: 'Dairy' },
  { id: 'poultry', icon: '🐔', label: 'Poultry' },
]

export const listings: Listing[] = [
  { id: 'l1', name: 'Paddy (Sona Masoori)', category: 'crops', qty: '120 Quintal', price: 2380, unit: 'Quintal', location: 'Vijayawada', seller: 'Ramesh Naidu', rating: 4.8, hue: 45, verified: true },
  { id: 'l2', name: 'Fresh Tomatoes — Grade A', category: 'vegetables', qty: '40 Quintal', price: 1850, unit: 'Quintal', location: 'Gudivada', seller: 'Lakshmi Devi', rating: 4.6, hue: 8, verified: true },
  { id: 'l3', name: 'Organic Mango (Banginapalli)', category: 'fruits', qty: '25 Quintal', price: 6400, unit: 'Quintal', location: 'Nuzvid', seller: 'Srinivas Rao', rating: 4.9, hue: 40, verified: true },
  { id: 'l4', name: 'Hybrid Paddy Seed B-450', category: 'seeds', qty: '800 Kg', price: 320, unit: 'Kg', location: 'Guntur', seller: 'AgroSeeds Pvt Ltd', rating: 4.4, hue: 120, verified: true },
  { id: 'l5', name: 'Urea (Neem Coated)', category: 'fertilizers', qty: '200 Bags', price: 268, unit: 'Bag', location: 'Vijayawada', seller: 'Krishna Agri Depot', rating: 4.2, hue: 200, verified: false },
  { id: 'l6', name: 'Bio Pesticide — Neem Extract', category: 'inputs', qty: '150 Litre', price: 480, unit: 'Litre', location: 'Machilipatnam', seller: 'GreenShield Inputs', rating: 4.7, hue: 95, verified: true },
  { id: 'l7', name: 'Vannamei Prawns (Harvest)', category: 'prawns', qty: '3 Ton', price: 340, unit: 'Kg', location: 'Bhimavaram', seller: 'Surya Aqua Farms', rating: 4.8, hue: 18, verified: true },
  { id: 'l8', name: 'Rohu Fish — Table Size', category: 'fish', qty: '800 Kg', price: 195, unit: 'Kg', location: 'Kakinada', seller: 'Godavari Fisheries', rating: 4.5, hue: 190, verified: true },
  { id: 'l9', name: 'A2 Buffalo Milk (Daily)', category: 'dairy', qty: '200 Litre/day', price: 62, unit: 'Litre', location: 'Vijayawada', seller: 'Sri Lakshmi Dairy', rating: 4.9, hue: 210, verified: true },
  { id: 'l10', name: 'Country Eggs (Farm Fresh)', category: 'poultry', qty: '5000 Eggs', price: 7, unit: 'Egg', location: 'Tenali', seller: 'Sai Poultry Farm', rating: 4.3, hue: 35, verified: false },
  { id: 'l11', name: 'Dry Red Chilli (Byadgi)', category: 'crops', qty: '60 Quintal', price: 13500, unit: 'Quintal', location: 'Guntur', seller: 'Venkatesh Chilli Traders', rating: 4.7, hue: 2, verified: true },
  { id: 'l12', name: 'Aqua Feed (Starter Crumble)', category: 'fish', qty: '300 Bags', price: 1150, unit: 'Bag', location: 'Bhimavaram', seller: 'AquaGrow Feeds', rating: 4.4, hue: 160, verified: true },
]

/* ------------------------------------------------------------- machinery */

export type Machine = {
  id: string
  name: string
  icon: string
  hourly: number
  daily: number
  location: string
  distanceKm: number
  owner: string
  available: boolean
  rating: number
  jobs: number
  driverOption: boolean
  specs: string[]
}

export const machines: Machine[] = [
  { id: 'm1', name: 'Mahindra 575 DI Tractor', icon: '🚜', hourly: 850, daily: 6400, location: 'Vijayawada', distanceKm: 3.2, owner: 'Krishna Agro Services', available: true, rating: 4.8, jobs: 214, driverOption: true, specs: ['45 HP', '4 cylinders', 'Hydraulics included'] },
  { id: 'm2', name: 'Combine Harvester (Paddy)', icon: '🌾', hourly: 2400, daily: 18000, location: 'Gudivada', distanceKm: 8.7, owner: 'HarvestPro', available: true, rating: 4.7, jobs: 96, driverOption: true, specs: ['Self-propelled', '3.2 m header', 'Grain tank 2 t'] },
  { id: 'm3', name: 'Rotavator — 6 ft', icon: '⚙️', hourly: 620, daily: 4800, location: 'Nuzvid', distanceKm: 12.1, owner: 'Srinivas Rao', available: true, rating: 4.5, jobs: 143, driverOption: false, specs: ['6 ft width', '540 rpm PTO', 'Tractor-mounted'] },
  { id: 'm4', name: 'Seed Drill (9 Tyn)', icon: '🌱', hourly: 480, daily: 3600, location: 'Tenali', distanceKm: 15.4, owner: 'Rythu Machinery Hub', available: false, rating: 4.3, jobs: 61, driverOption: false, specs: ['9 tynes', 'Seed + fertilizer', 'Row spacing adjustable'] },
  { id: 'm5', name: 'Power Cultivator', icon: '🧑‍🌾', hourly: 380, daily: 2800, location: 'Machilipatnam', distanceKm: 18.9, owner: 'Delta Farm Works', available: true, rating: 4.4, jobs: 88, driverOption: false, specs: ['7 HP', 'Inter-cultivation', 'Weeding blade'] },
  { id: 'm6', name: 'Battery Sprayer Drone', icon: '💦', hourly: 1100, daily: 8200, location: 'Vijayawada', distanceKm: 5.6, owner: 'AgroDrone India', available: true, rating: 4.9, jobs: 172, driverOption: true, specs: ['10 L tank', '4 acres/hour', 'GPS guided'] },
  { id: 'm7', name: 'Power Tiller', icon: '🚜', hourly: 340, daily: 2500, location: 'Nandigama', distanceKm: 21.3, owner: 'Bharath Tiller Hire', available: true, rating: 4.1, jobs: 44, driverOption: false, specs: ['8 HP', 'Wet & dry land', 'Ridger attachment'] },
  { id: 'm8', name: 'Knapsack Sprayer (Electric)', icon: '💦', hourly: 120, daily: 700, location: 'Gudivada', distanceKm: 9.2, owner: 'Local Provider', available: true, rating: 4.0, jobs: 29, driverOption: false, specs: ['16 L tank', 'Battery operated', 'Adjustable nozzle'] },
]

/* -------------------------------------------------------------- vehicles */

export const vehicles = [
  { id: 'v1', name: 'Mahindra 575 DI Tractor', type: 'Tractor', mode: 'Buy', price: 845000, location: 'Vijayawada', available: true, owner: 'Krishna Tractors', year: 2023, icon: '🚜' },
  { id: 'v2', name: 'Sonalika 42 DI Tractor', type: 'Tractor', mode: 'Rent', price: 750, location: 'Gudivada', available: true, owner: 'Delta Agro', year: 2022, icon: '🚜' },
  { id: 'v3', name: 'Ashok Leyland Dost Mini Truck', type: 'Mini truck', mode: 'Buy', price: 1180000, location: 'Vijayawada', available: true, owner: 'Leyland Dealers', year: 2024, icon: '🚚' },
  { id: 'v4', name: 'Tractor Trailer (7 t)', type: 'Trailer', mode: 'Rent', price: 420, location: 'Nuzvid', available: false, owner: 'Srinivas Rao', year: 2021, icon: '🛞' },
  { id: 'v5', name: 'Eicher Pro 2049 Farm Transport', type: 'Farm transport', mode: 'Buy', price: 2340000, location: 'Guntur', available: true, owner: 'Eicher Motors', year: 2025, icon: '🚛' },
  { id: 'v6', name: 'Swaraj 855 XM Tractor', type: 'Tractor', mode: 'Buy', price: 920000, location: 'Tenali', available: true, owner: 'Swaraj Sales', year: 2024, icon: '🚜' },
]

export const driverPool = [
  { id: 'd1', name: 'Ravi Kumar', exp: 8, rating: 4.8, dayRate: 900, location: 'Vijayawada', machines: ['Tractor', 'Rotavator'] },
  { id: 'd2', name: 'Naresh Babu', exp: 12, rating: 4.9, dayRate: 1100, location: 'Gudivada', machines: ['Harvester', 'Tractor'] },
  { id: 'd3', name: 'Suresh Yadav', exp: 5, rating: 4.5, dayRate: 800, location: 'Nuzvid', machines: ['Tractor', 'Tiller'] },
  { id: 'd4', name: 'Mahesh Reddy', exp: 15, rating: 4.7, dayRate: 1250, location: 'Machilipatnam', machines: ['Harvester', 'Truck'] },
]

/* ----------------------------------------------------------------- finance */

export const expenseCategories = [
  { id: 'seeds', label: 'Seeds', icon: '🌱', amount: 18500, color: '#22965c' },
  { id: 'fertilizer', label: 'Fertilizer', icon: '🧪', amount: 32400, color: '#4bb37c' },
  { id: 'pesticides', label: 'Pesticides', icon: '🐛', amount: 14200, color: '#c0553f' },
  { id: 'labour', label: 'Labour', icon: '🧑‍🌾', amount: 46800, color: '#d4a537' },
  { id: 'machinery', label: 'Machinery', icon: '🚜', amount: 28600, color: '#8d6a45' },
  { id: 'irrigation', label: 'Irrigation', icon: '💧', amount: 12900, color: '#3b8fd4' },
  { id: 'transport', label: 'Transportation', icon: '🚚', amount: 9400, color: '#7fcfa4' },
  { id: 'other', label: 'Other', icon: '📦', amount: 6300, color: '#93a79b' },
]

export const monthlyFinance = {
  labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
  investment: [22000, 31000, 28500, 24000, 26500, 37100],
  revenue: [0, 0, 12000, 18500, 42000, 94000],
}

export const financeSummary = {
  totalInvestment: 169100,
  expectedRevenue: 285000,
  estimatedProfit: 115900,
  profitPerAcre: 25756,
  roi: 68.5,
  note: 'Estimated values based on sample assumptions for the demo farm. Actual results depend on local input prices, labour rates, weather and farming practices.',
}

export const incomeBreakdown = [
  { label: 'Paddy sales', value: 168000, color: '#22965c' },
  { label: 'Chilli sales', value: 74000, color: '#c0553f' },
  { label: 'Cotton sales', value: 31000, color: '#d4a537' },
  { label: 'Dairy', value: 12000, color: '#3b8fd4' },
]

/* -------------------------------------------------------------------- aqua */

export const aquaPonds = [
  { id: 'p1', name: 'Pond A — Vannamei', acres: 1.5, stocked: '2026-07-10', species: 'Vannamei Prawn', seed: 180000, survival: 78, doc: 74, harvestEta: '2026-11-05', status: 'Active' },
  { id: 'p2', name: 'Pond B — Rohu', acres: 1.0, stocked: '2026-06-22', species: 'Rohu Fish', seed: 42000, survival: 84, doc: 116, harvestEta: '2027-01-20', status: 'Active' },
  { id: 'p3', name: 'Pond C — Vannamei', acres: 0.8, stocked: '2026-04-18', species: 'Vannamei Prawn', seed: 96000, survival: 71, doc: 0, harvestEta: 'Harvested', status: 'Harvested' },
]

export const aquaCosts = [
  { id: 'feed', label: 'Feed', icon: '🍤', amount: 214000, color: '#3b8fd4' },
  { id: 'medicine', label: 'Medicine', icon: '🧪', amount: 18600, color: '#22965c' },
  { id: 'labour', label: 'Labour', icon: '🧑‍🌾', amount: 62000, color: '#d4a537' },
  { id: 'electricity', label: 'Electricity', icon: '⚡', amount: 88500, color: '#8d6a45' },
  { id: 'seed', label: 'Seed', icon: '🌱', amount: 54000, color: '#7fcfa4' },
  { id: 'other', label: 'Other', icon: '📦', amount: 12400, color: '#93a79b' },
]

export const aquaSummary = { investment: 449500, revenue: 612000, profit: 162500, fcr: 1.42, survival: 78, doc: 74 }

export const aquaMarket = [
  { id: 'am1', name: 'Vannamei Prawns (30 count)', icon: '🦐', price: 340, unit: 'Kg', trend: 4.2 },
  { id: 'am2', name: 'Vannamei Prawns (50 count)', icon: '🦐', price: 285, unit: 'Kg', trend: -1.8 },
  { id: 'am3', name: 'Rohu Fish', icon: '🐟', price: 195, unit: 'Kg', trend: 2.6 },
  { id: 'am4', name: 'Aqua Feed (Grower)', icon: '🍤', price: 1150, unit: 'Bag', trend: 0.9 },
  { id: 'am5', name: 'Probiotic Water Treatment', icon: '🧪', price: 640, unit: 'Litre', trend: -0.4 },
]

/* ----------------------------------------------------------------- poultry */

export const poultrySummary = {
  birds: 2400, breed: 'White Leghorn', ageWeeks: 34, eggRate: 82,
  feedKgPerDay: 240, medicine: 4200, labour: 18000, electricity: 7400,
  feedCost: 62000, eggsPerDay: 1968, eggPrice: 6.8, birdPrice: 145,
}
export const poultryMonthly = {
  labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
  eggRevenue: [168000, 172000, 165000, 178000, 184000, 191000],
  birdRevenue: [0, 22000, 0, 0, 28000, 0],
  expenses: [142000, 148000, 151000, 146000, 155000, 158000],
}

/* -------------------------------------------------------------------- dairy */

export const dairySummary = {
  cattle: 12, breed: 'Murrah Buffalo', milkPerDay: 78, feedCost: 24000,
  vetCost: 3600, labour: 15000, milkPrice: 58, morningLitres: 44, eveningLitres: 34,
}
export const dairyWeek = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  morning: [43, 44, 45, 44, 46, 44, 44],
  evening: [33, 34, 35, 34, 36, 35, 34],
}

/* ---------------------------------------------------------------- planner */

export type PlanOption = {
  id: string
  crop: string
  icon: string
  duration: string
  water: 'Low' | 'Medium' | 'High'
  investment: number
  yieldPerAcre: string
  revenue: number
  margin: number
  risks: string[]
  suitability: number
}

export const cropPlans: PlanOption[] = [
  {
    id: 'cp1', crop: 'Paddy (Sona Masoori)', icon: '🌾', duration: '120–135 days', water: 'High',
    investment: 34000, yieldPerAcre: '22–26 Quintal', revenue: 58000, margin: 41, suitability: 88,
    risks: ['Needs assured irrigation', 'Stem borer risk in Kharif', 'Price sensitive to arrivals'],
  },
  {
    id: 'cp2', crop: 'Cotton (Bt Hybrid)', icon: '☁️', duration: '160–180 days', water: 'Medium',
    investment: 41000, yieldPerAcre: '9–12 Quintal', revenue: 72000, margin: 43, suitability: 79,
    risks: ['Pink bollworm pressure', 'Long crop cycle ties up capital', 'Rain at harvest lowers grade'],
  },
  {
    id: 'cp3', crop: 'Chilli (Byadgi)', icon: '🌶️', duration: '150–170 days', water: 'Medium',
    investment: 58000, yieldPerAcre: '7–9 Quintal (dry)', revenue: 108000, margin: 46, suitability: 74,
    risks: ['High input cost', 'Leaf curl virus', 'Needs careful drying to hold grade'],
  },
  {
    id: 'cp4', crop: 'Maize', icon: '🌽', duration: '95–110 days', water: 'Low',
    investment: 24000, yieldPerAcre: '28–34 Quintal', revenue: 62000, margin: 61, suitability: 71,
    risks: ['Below MSP in some seasons', 'Fall armyworm', 'Needs prompt drying'],
  },
  {
    id: 'cp5', crop: 'Green Gram', icon: '🫘', duration: '60–70 days', water: 'Low',
    investment: 16000, yieldPerAcre: '4–5 Quintal', revenue: 38000, margin: 58, suitability: 66,
    risks: ['Short window suits intercrop only', 'Pod borer', 'Price volatility'],
  },
]

/* -------------------------------------------------------------- community */

export type Post = {
  id: string
  author: string
  role: string
  group: string
  time: string
  body: string
  likes: number
  comments: number
  hasImage: boolean
  hue: number
  expertAnswer?: { author: string; body: string }
  solved: boolean
}

export const groups = [
  { id: 'paddy', icon: '🌾', label: 'Paddy Farmers', members: 12480, active: 342 },
  { id: 'chilli', icon: '🌶️', label: 'Chilli Farmers', members: 6210, active: 188 },
  { id: 'aqua', icon: '🐟', label: 'Aqua Farmers', members: 8940, active: 265 },
  { id: 'poultry', icon: '🐔', label: 'Poultry Farmers', members: 5130, active: 121 },
  { id: 'dairy', icon: '🐄', label: 'Dairy Farmers', members: 7620, active: 203 },
]

export const posts: Post[] = [
  {
    id: 'p1', author: 'Venkatesh Rao', role: 'Farmer', group: 'chilli', time: '2h ago',
    body: 'My chilli leaves are curling. Has anyone experienced this? Started about a week after the last spray.',
    likes: 34, comments: 12, hasImage: true, hue: 100, solved: true,
    expertAnswer: {
      author: 'Dr. Anitha Reddy · Plant Pathologist',
      body: 'Curling with yellowing at leaf edges usually points to leaf curl virus spread by whitefly. Check the underside of leaves for whitefly. Remove severely affected plants, use yellow sticky traps, and avoid consecutive sprays of the same molecule.',
    },
  },
  {
    id: 'p2', author: 'Suresh Babu', role: 'Farmer', group: 'aqua', time: '5h ago',
    body: 'DOC 45 in my vannamei pond and DO dropped to 4.1 this morning. How many aerators should I run at night?',
    likes: 21, comments: 8, hasImage: false, hue: 200, solved: false,
    expertAnswer: {
      author: 'Kiran Kumar · Aqua Consultant',
      body: 'At DOC 45 with DO near 4 ppm, run at least 4 HP per acre from 10 PM to 6 AM. Check for feed residue on the bottom — overfeeding is the usual cause of a night-time DO crash.',
    },
  },
  {
    id: 'p3', author: 'Lakshmi Devi', role: 'Farmer', group: 'paddy', time: '1d ago',
    body: 'Sharing my results from switching to alternate wetting and drying on 2 acres. Water use down noticeably and yield held up. Happy to explain the schedule to anyone interested.',
    likes: 87, comments: 23, hasImage: true, hue: 145, solved: false,
  },
  {
    id: 'p4', author: 'Ravi Teja', role: 'Service Provider', group: 'paddy', time: '1d ago',
    body: 'Harvester available in Gudivada belt from 5 October. Book at least a week ahead this season — demand is high after the delayed monsoon.',
    likes: 45, comments: 17, hasImage: false, hue: 40, solved: false,
  },
  {
    id: 'p5', author: 'Dr. Anitha Reddy', role: 'Expert', group: 'paddy', time: '2d ago',
    body: 'Stem borer cases are rising around Krishna district. If you see dead hearts in tillering stage, do not spray immediately — install pheromone traps first and count damage. Threshold matters more than calendar spraying.',
    likes: 156, comments: 41, hasImage: false, hue: 90, solved: false,
  },
]

/* ----------------------------------------------------------------- experts */

export const experts = [
  { id: 'e1', name: 'Dr. Anitha Reddy', field: 'Agriculture', speciality: 'Plant Pathology', exp: 14, rating: 4.9, consults: 812, fee: 400, langs: ['English', 'తెలుగు'], online: true, hue: 145 },
  { id: 'e2', name: 'Kiran Kumar', field: 'Aqua', speciality: 'Shrimp Culture', exp: 11, rating: 4.8, consults: 534, fee: 550, langs: ['English', 'తెలుగు'], online: true, hue: 195 },
  { id: 'e3', name: 'Dr. S. Prasad', field: 'Veterinary', speciality: 'Livestock Health', exp: 18, rating: 4.9, consults: 1204, fee: 350, langs: ['English', 'తెలుగు', 'हिन्दी'], online: false, hue: 30 },
  { id: 'e4', name: 'Meena Krishnan', field: 'Dairy', speciality: 'Herd Nutrition', exp: 9, rating: 4.7, consults: 388, fee: 300, langs: ['English', 'தமிழ்'], online: true, hue: 210 },
  { id: 'e5', name: 'Prof. R. Venkat', field: 'Agriculture', speciality: 'Soil Science', exp: 22, rating: 4.8, consults: 641, fee: 600, langs: ['English', 'తెలుగు'], online: true, hue: 90 },
  { id: 'e6', name: 'Dr. Farhan Ali', field: 'Veterinary', speciality: 'Poultry Health', exp: 12, rating: 4.6, consults: 447, fee: 380, langs: ['English', 'हिन्दी', 'اردو'], online: false, hue: 15 },
]

/* ------------------------------------------------------------ learning hub */

export const learningCategories = ['Crop Farming', 'Irrigation', 'Soil', 'Aqua', 'Poultry', 'Dairy', 'Finance', 'Government Schemes']

export const lessons = [
  { id: 'ln1', title: 'Alternate Wetting and Drying in Paddy', cat: 'Irrigation', type: 'Guide', mins: 8, level: 'Beginner', reads: 12400, icon: '💧' },
  { id: 'ln2', title: 'Identifying Stem Borer Damage Early', cat: 'Crop Farming', type: 'Article', mins: 6, level: 'Beginner', reads: 9800, icon: '🐛' },
  { id: 'ln3', title: 'Soil Health Card: Reading Your Report', cat: 'Soil', type: 'Infographic', mins: 4, level: 'Beginner', reads: 15200, icon: '🧪' },
  { id: 'ln4', title: 'Vannamei Pond Preparation Checklist', cat: 'Aqua', type: 'Guide', mins: 12, level: 'Intermediate', reads: 7400, icon: '🦐' },
  { id: 'ln5', title: 'Reducing Feed Cost in Layer Poultry', cat: 'Poultry', type: 'Video', mins: 15, level: 'Intermediate', reads: 6100, icon: '🐔' },
  { id: 'ln6', title: 'Buffalo Ration Balancing Basics', cat: 'Dairy', type: 'Video', mins: 18, level: 'Intermediate', reads: 5300, icon: '🐄' },
  { id: 'ln7', title: 'Working Capital Loans for Farmers', cat: 'Finance', type: 'Article', mins: 10, level: 'Intermediate', reads: 8800, icon: '💰' },
  { id: 'ln8', title: 'PM Fasal Bima: Claim Process Step by Step', cat: 'Government Schemes', type: 'Guide', mins: 14, level: 'Beginner', reads: 21000, icon: '🏛️' },
]

/* --------------------------------------------------------------- bookings */

export type Booking = {
  id: string
  service: string
  icon: string
  provider: string
  date: string
  time: string
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled'
  amount: number
  land?: string
  driver?: boolean
}

export const bookings: Booking[] = [
  { id: 'b1', service: 'Mahindra 575 DI Tractor', icon: '🚜', provider: 'Krishna Agro Services', date: '2026-09-24', time: '07:00 – 11:00', status: 'Confirmed', amount: 3400, land: 'Land 01', driver: true },
  { id: 'b2', service: 'Battery Sprayer Drone', icon: '💦', provider: 'AgroDrone India', date: '2026-09-27', time: '06:30 – 08:30', status: 'Pending', amount: 2200, land: 'Land 02' },
  { id: 'b3', service: 'Expert Consultation', icon: '👨‍🔬', provider: 'Dr. Anitha Reddy', date: '2026-09-25', time: '18:00', status: 'Confirmed', amount: 400, land: 'Land 02' },
  { id: 'b4', service: 'Combine Harvester', icon: '🌾', provider: 'HarvestPro', date: '2026-10-05', time: 'Full day', status: 'Pending', amount: 18000, land: 'Land 01', driver: true },
  { id: 'b5', service: 'Rotavator — 6 ft', icon: '⚙️', provider: 'Srinivas Rao', date: '2026-09-12', time: '09:00 – 13:00', status: 'Completed', amount: 2480, land: 'Land 03' },
  { id: 'b6', service: 'Veterinary Visit', icon: '🐄', provider: 'Dr. S. Prasad', date: '2026-09-08', time: '11:00', status: 'Completed', amount: 350 },
]

/* -------------------------------------------------------------------- map */

export type MapPlace = {
  id: string
  kind: 'market' | 'machinery' | 'vet' | 'office' | 'expert' | 'buyer' | 'storage'
  name: string
  area: string
  km: number
  phone: string
  open: boolean
  coords: LatLng
}

export const mapPlaces: MapPlace[] = [
  { id: 'mp1', kind: 'market', name: 'Vijayawada Agri Market Yard', area: 'One Town', km: 3.2, phone: '+91 866 2xx xxxx', open: true, coords: { lat: 16.5062, lng: 80.648 } },
  { id: 'mp2', kind: 'market', name: 'Gudivada Market Yard', area: 'Gudivada', km: 8.7, phone: '+91 8674 2x xxxx', open: true, coords: { lat: 16.4315, lng: 80.9963 } },
  { id: 'mp3', kind: 'machinery', name: 'Krishna Agro Services', area: 'Patamata', km: 4.1, phone: '+91 98xx xxx210', open: true, coords: { lat: 16.5193, lng: 80.6245 } },
  { id: 'mp4', kind: 'machinery', name: 'Rythu Machinery Hub', area: 'Tenali', km: 15.4, phone: '+91 8644 2x xxxx', open: false, coords: { lat: 16.2408, lng: 80.6483 } },
  { id: 'mp5', kind: 'vet', name: 'Government Veterinary Hospital', area: 'Moghalrajpuram', km: 2.8, phone: '+91 866 2xx xxxx', open: true, coords: { lat: 16.5108, lng: 80.6323 } },
  { id: 'mp6', kind: 'vet', name: 'Sri Lakshmi Veterinary Clinic', area: 'Gudivada', km: 9.2, phone: '+91 8674 2x xxxx', open: true, coords: { lat: 16.4351, lng: 80.9902 } },
  { id: 'mp7', kind: 'office', name: 'Agriculture Officer — Mandal', area: 'Vijayawada Rural', km: 5.6, phone: '+91 866 2xx xxxx', open: true, coords: { lat: 16.4982, lng: 80.6624 } },
  { id: 'mp8', kind: 'office', name: 'Rythu Bharosa Kendra', area: 'Nuzvid', km: 12.1, phone: '+91 8656 2x xxxx', open: true, coords: { lat: 16.785, lng: 80.8465 } },
  { id: 'mp9', kind: 'expert', name: 'Dr. Anitha Reddy — Clinic', area: 'Benz Circle', km: 3.9, phone: '+91 98xx xxx114', open: true, coords: { lat: 16.5155, lng: 80.6418 } },
  { id: 'mp10', kind: 'buyer', name: 'Surya Aqua Exports', area: 'Bhimavaram', km: 28.4, phone: '+91 8814 2x xxxx', open: true, coords: { lat: 16.5408, lng: 81.5232 } },
  { id: 'mp11', kind: 'buyer', name: 'Venkatesh Chilli Traders', area: 'Guntur', km: 34.2, phone: '+91 863 2xx xxxx', open: false, coords: { lat: 16.3067, lng: 80.4365 } },
  { id: 'mp12', kind: 'storage', name: 'Central Cold Storage', area: 'Autonagar', km: 6.3, phone: '+91 866 2xx xxxx', open: true, coords: { lat: 16.5231, lng: 80.6712 } },
  { id: 'mp13', kind: 'storage', name: 'Godavari Warehouse (Paddy)', area: 'Gudivada', km: 9.8, phone: '+91 8674 2x xxxx', open: true, coords: { lat: 16.4402, lng: 81.0031 } },
]

export const mapLegend = [
  { kind: 'market', icon: '🏪', label: 'Markets' },
  { kind: 'machinery', icon: '🚜', label: 'Machinery' },
  { kind: 'vet', icon: '🏥', label: 'Veterinary' },
  { kind: 'office', icon: '🏛️', label: 'Agri offices' },
  { kind: 'expert', icon: '👨‍🔬', label: 'Experts' },
  { kind: 'buyer', icon: '🤝', label: 'Buyers' },
  { kind: 'storage', icon: '🏬', label: 'Storage' },
] as const

/* ------------------------------------------------------------ notifications */

export const notifications = [
  { id: 'n1', icon: '🌧️', title: 'Weather alert — heavy rain Thursday', body: '65–80% chance of 40–70 mm around Vijayawada.', time: Date.now() - 1000 * 60 * 12, tone: 'warn' as const, read: false },
  { id: 'n2', icon: '🚜', title: 'Tractor booking tomorrow 07:00', body: 'Mahindra 575 DI with driver, Land 01.', time: Date.now() - 1000 * 60 * 48, tone: 'info' as const, read: false },
  { id: 'n3', icon: '📈', title: 'Paddy price updated', body: 'Vijayawada Market now ₹2,350/Qtl, up 4.2% this week.', time: Date.now() - 1000 * 60 * 60 * 3, tone: 'ok' as const, read: false },
  { id: 'n4', icon: '🏛️', title: 'Scheme deadline approaching', body: 'Per Drop More Crop closes 30 Nov 2026. One document pending.', time: Date.now() - 1000 * 60 * 60 * 9, tone: 'danger' as const, read: true },
  { id: 'n5', icon: '🌱', title: 'Crop health alert — Land 02', body: 'Chilli health dropped to 78%. Leaf curl symptoms reported nearby.', time: Date.now() - 1000 * 60 * 60 * 26, tone: 'warn' as const, read: true },
  { id: 'n6', icon: '📅', title: 'Payment reminder', body: 'Sprayer drone booking of ₹2,200 is due before 27 Sep.', time: Date.now() - 1000 * 60 * 60 * 30, tone: 'info' as const, read: true },
  { id: 'n7', icon: '👨‍🔬', title: 'Expert replied to your question', body: 'Dr. Anitha Reddy answered your chilli leaf curl query.', time: Date.now() - 1000 * 60 * 60 * 52, tone: 'ok' as const, read: true },
]

/* -------------------------------------------------------------------- admin */

export const adminStats = [
  { id: 'farmers', icon: '👨‍🌾', label: 'Farmers', value: 48210, delta: 12.4, tone: 'ok' as const },
  { id: 'listings', icon: '🛒', label: 'Active listings', value: 6840, delta: 8.1, tone: 'ok' as const },
  { id: 'providers', icon: '🚜', label: 'Machinery providers', value: 1290, delta: 4.6, tone: 'ok' as const },
  { id: 'bookings', icon: '📅', label: 'Bookings (30d)', value: 3410, delta: -2.3, tone: 'warn' as const },
  { id: 'experts', icon: '👨‍🔬', label: 'Verified experts', value: 318, delta: 6.9, tone: 'ok' as const },
  { id: 'reports', icon: '🚩', label: 'Open reports', value: 27, delta: 18.0, tone: 'danger' as const },
]

export const adminQueue = [
  { id: 'q1', type: 'Listing review', item: 'Organic Mango (Banginapalli)', by: 'Srinivas Rao', age: '2h', action: 'Approve' },
  { id: 'q2', type: 'Expert verification', item: 'Dr. Farhan Ali — Poultry Health', by: 'Self-submitted', age: '5h', action: 'Verify' },
  { id: 'q3', type: 'Report', item: 'Post flagged for pricing misinformation', by: '4 users', age: '1d', action: 'Review' },
  { id: 'q4', type: 'Market data', item: 'Guntur chilli price not updated in 6 days', by: 'System', age: '1d', action: 'Update' },
  { id: 'q5', type: 'Scheme sync', item: '3 AP schemes need deadline refresh', by: 'System', age: '2d', action: 'Sync' },
]

/* ---------------------------------------------------------- crop doctor */

export const leafSamples = ['Leaf spot sample', 'Yellowing sample', 'Healthy control']

export const analysisSteps = [
  'Preparing image for analysis…',
  'Detecting leaf boundaries…',
  'Analysing leaf structure…',
  'Checking visible symptoms…',
  'Comparing against known patterns…',
  'Estimating severity…',
  'Preparing assessment…',
]

export type Diagnosis = {
  issue: string
  confidence: number
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  symptoms: string[]
  steps: string[]
  spreadRisk: string
  window: string
}

/**
 * Rule-based illustrative assessments. This is NOT a trained model and is not
 * an agricultural diagnosis — the UI states that explicitly on every result.
 */
export const diagnoses: Diagnosis[] = [
  {
    issue: 'Leaf Spot', confidence: 78, risk: 'MEDIUM',
    symptoms: ['Brown spots with darker margins', 'Yellowing around lesions', 'Lower leaves affected first'],
    steps: [
      'Remove severely affected leaves and clear them from the field',
      'Avoid overhead irrigation — wet foliage spreads fungal spores',
      'Monitor nearby plants every 2–3 days for new lesions',
      'Consult an agricultural expert before applying any fungicide',
    ],
    spreadRisk: 'Moderate — spreads in humid conditions',
    window: 'Act within 5–7 days',
  },
  {
    issue: 'Nitrogen Deficiency', confidence: 71, risk: 'LOW',
    symptoms: ['Uniform pale green to yellow leaves', 'Older leaves affected before new growth', 'Stunted overall growth'],
    steps: [
      'Review recent fertilizer records before adding nitrogen',
      'Consider a soil test to confirm the deficiency',
      'Split applications reduce leaching loss after heavy rain',
      'Consult an expert on the right dose for your soil type',
    ],
    spreadRisk: 'Low — nutritional, not infectious',
    window: 'Improvement usually visible in 10–14 days',
  },
  {
    issue: 'Leaf Curl (possible viral)', confidence: 66, risk: 'HIGH',
    symptoms: ['Upward or downward curling of leaf margins', 'Thickened, leathery leaves', 'Stunted new shoots'],
    steps: [
      'Inspect leaf undersides for whitefly, the usual vector',
      'Remove and destroy severely infected plants',
      'Install yellow sticky traps around the field edge',
      'Avoid repeating the same insecticide molecule consecutively',
      'Talk to an expert — viral spread is hard to reverse',
    ],
    spreadRisk: 'High — insect-vectored and can move quickly',
    window: 'Act within 2–3 days',
  },
]
