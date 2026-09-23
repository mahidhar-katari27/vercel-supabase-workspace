/**
 * Location dataset + geo queries for the whole app.
 *
 * Every record carries the full location block required by the spec:
 * latitude, longitude, address, city, district, state, postal_code.
 *
 * These are clearly-labelled SAMPLE locations for the hackathon demo (the
 * Supabase database is empty). When NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set,
 * the same shapes are filled live by Places/Geocoding instead — see
 * components/maps/PlaceSearch.tsx and lib/googleMaps.ts.
 */

import { farmer, lands, machines, experts, listings } from './data'
import { haversineKm, type GeoAddress, type LatLng } from './geo'

export type PlaceCategory =
  | 'market' | 'machinery' | 'vet' | 'office' | 'expert' | 'buyer'
  | 'inputs' | 'aqua' | 'poultry' | 'dairy' | 'storage'

export const placeCategories: Array<{
  id: PlaceCategory; icon: string; label: string; nearby: string
}> = [
  { id: 'market',    icon: '🌾', label: 'Farm Markets',              nearby: 'Market' },
  { id: 'machinery', icon: '🚜', label: 'Agri Machinery',            nearby: 'Tractor' },
  { id: 'vet',       icon: '🏥', label: 'Veterinary',                nearby: 'Vet' },
  { id: 'office',    icon: '🏢', label: 'Agriculture Offices',       nearby: 'Agriculture Office' },
  { id: 'expert',    icon: '👨‍🔬', label: 'Agriculture Experts',       nearby: 'Expert' },
  { id: 'buyer',     icon: '🛒', label: 'Buyers',                    nearby: 'Buyer' },
  { id: 'inputs',    icon: '🏪', label: 'Agricultural Input Stores', nearby: 'Input Store' },
  { id: 'aqua',      icon: '🐟', label: 'Aqua Services',             nearby: 'Aqua Service' },
  { id: 'poultry',   icon: '🐔', label: 'Poultry Services',          nearby: 'Poultry Service' },
  { id: 'dairy',     icon: '🐄', label: 'Dairy Services',            nearby: 'Dairy Service' },
  { id: 'storage',   icon: '📦', label: 'Storage / Warehouses',      nearby: 'Warehouse' },
]

export const categoryMeta = (id: string) =>
  placeCategories.find((c) => c.id === id) ?? { id: id as PlaceCategory, icon: '📍', label: id, nearby: id }

export type GeoPlace = {
  id: string
  category: PlaceCategory
  name: string
  coords: LatLng
  address: GeoAddress
  phone?: string
  open?: boolean
  hours?: string
  rating?: number
  priceNote?: string
  note?: string
  serviceRadiusKm?: number
  /** Links a map place back to a demo record (machine m1, expert e1, …). */
  ref?: { kind: 'machine' | 'expert' | 'listing' | 'land'; id: string }
}

const ap = 'Andhra Pradesh'

/** Sample locations around Krishna / Guntur districts. Demo-labelled in UI. */
export const geoPlaces: GeoPlace[] = [
  /* ------------------------------------------------------------ markets */
  { id: 'g-mk1', category: 'market', name: 'Vijayawada Agri Market Yard', coords: { lat: 16.5062, lng: 80.6480 }, address: { address: 'Market Yard Road, One Town', city: 'Vijayawada', district: 'Krishna', state: ap, postalCode: '520001' }, phone: '+91 866 2xx xxxx', open: true, hours: '6 am – 8 pm', rating: 4.4, note: 'Paddy, chilli, vegetables' },
  { id: 'g-mk2', category: 'market', name: 'Gudivada Market Yard', coords: { lat: 16.4315, lng: 80.9963 }, address: { address: 'Station Road', city: 'Gudivada', district: 'Krishna', state: ap, postalCode: '521301' }, phone: '+91 8674 2x xxxx', open: true, hours: '6 am – 7 pm', rating: 4.2 },
  { id: 'g-mk3', category: 'market', name: 'Tenali Rythu Market', coords: { lat: 16.2455, lng: 80.6440 }, address: { address: 'Bapu Rao Pet', city: 'Tenali', district: 'Guntur', state: ap, postalCode: '522201' }, open: true, hours: '6 am – 6 pm', rating: 4.1 },
  { id: 'g-mk4', category: 'market', name: 'Nuzvid Vegetable Market', coords: { lat: 16.7870, lng: 80.8460 }, address: { address: 'Main Bazaar', city: 'Nuzvid', district: 'Krishna', state: ap, postalCode: '521201' }, open: true, hours: '5 am – 1 pm', rating: 4.0 },
  /* ---------------------------------------------------------- machinery */
  { id: 'g-mc1', category: 'machinery', name: 'Krishna Agro Services', coords: { lat: 16.5193, lng: 80.6245 }, address: { address: 'Patamata Ring Road', city: 'Vijayawada', district: 'Krishna', state: ap, postalCode: '520010' }, phone: '+91 98xx xxx210', open: true, rating: 4.8, priceNote: '₹850 / hour', serviceRadiusKm: 15, ref: { kind: 'machine', id: 'm1' } },
  { id: 'g-mc2', category: 'machinery', name: 'HarvestPro Combine Unit', coords: { lat: 16.4350, lng: 80.9880 }, address: { address: 'NH-65, Ward 7', city: 'Gudivada', district: 'Krishna', state: ap, postalCode: '521301' }, open: true, rating: 4.7, priceNote: '₹2,400 / hour', serviceRadiusKm: 25, ref: { kind: 'machine', id: 'm2' } },
  { id: 'g-mc3', category: 'machinery', name: 'Srinivas Farm Works', coords: { lat: 16.7835, lng: 80.8430 }, address: { address: 'Bus Stand Road', city: 'Nuzvid', district: 'Krishna', state: ap, postalCode: '521201' }, open: true, rating: 4.5, priceNote: '₹620 / hour', serviceRadiusKm: 12, ref: { kind: 'machine', id: 'm3' } },
  { id: 'g-mc4', category: 'machinery', name: 'Rythu Machinery Hub', coords: { lat: 16.2408, lng: 80.6483 }, address: { address: 'Guntur Road', city: 'Tenali', district: 'Guntur', state: ap, postalCode: '522201' }, phone: '+91 8644 2x xxxx', open: false, rating: 4.3, priceNote: '₹480 / hour', serviceRadiusKm: 20, ref: { kind: 'machine', id: 'm4' } },
  { id: 'g-mc5', category: 'machinery', name: 'Delta Farm Works', coords: { lat: 16.1875, lng: 81.1389 }, address: { address: 'Bunder Road', city: 'Machilipatnam', district: 'Krishna', state: ap, postalCode: '521001' }, open: true, rating: 4.4, priceNote: '₹380 / hour', serviceRadiusKm: 18, ref: { kind: 'machine', id: 'm5' } },
  { id: 'g-mc6', category: 'machinery', name: 'AgroDrone India', coords: { lat: 16.5260, lng: 80.6550 }, address: { address: 'MG Road, Benz Circle', city: 'Vijayawada', district: 'Krishna', state: ap, postalCode: '520008' }, open: true, rating: 4.9, priceNote: '₹1,100 / hour', serviceRadiusKm: 30, ref: { kind: 'machine', id: 'm6' } },
  { id: 'g-mc7', category: 'machinery', name: 'Bharath Tiller Hire', coords: { lat: 16.7440, lng: 80.4990 }, address: { address: 'Highway Colony', city: 'Nandigama', district: 'Krishna', state: ap, postalCode: '521185' }, open: true, rating: 4.1, priceNote: '₹340 / hour', serviceRadiusKm: 10, ref: { kind: 'machine', id: 'm7' } },
  { id: 'g-mc8', category: 'machinery', name: 'Local Sprayer Provider', coords: { lat: 16.4280, lng: 80.9920 }, address: { address: 'Ward 12', city: 'Gudivada', district: 'Krishna', state: ap, postalCode: '521301' }, open: true, rating: 4.0, priceNote: '₹120 / hour', serviceRadiusKm: 8, ref: { kind: 'machine', id: 'm8' } },
  /* -------------------------------------------------------- veterinary */
  { id: 'g-vt1', category: 'vet', name: 'Government Veterinary Hospital', coords: { lat: 16.5108, lng: 80.6323 }, address: { address: 'Moghalrajpuram', city: 'Vijayawada', district: 'Krishna', state: ap, postalCode: '520010' }, phone: '+91 866 2xx xxxx', open: true, hours: '9 am – 6 pm', rating: 4.3 },
  { id: 'g-vt2', category: 'vet', name: 'Sri Lakshmi Veterinary Clinic', coords: { lat: 16.4351, lng: 80.9902 }, address: { address: 'Market Street', city: 'Gudivada', district: 'Krishna', state: ap, postalCode: '521301' }, open: true, hours: '8 am – 9 pm', rating: 4.6 },
  { id: 'g-vt3', category: 'vet', name: 'Pashu Health Centre', coords: { lat: 16.2470, lng: 80.6410 }, address: { address: 'Canal Road', city: 'Tenali', district: 'Guntur', state: ap, postalCode: '522201' }, open: true, hours: '9 am – 5 pm', rating: 4.2 },
  { id: 'g-vt4', category: 'vet', name: 'Nuzvid Veterinary Dispensary', coords: { lat: 16.7890, lng: 80.8410 }, address: { address: 'Taluk Office Road', city: 'Nuzvid', district: 'Krishna', state: ap, postalCode: '521201' }, open: false, hours: '10 am – 4 pm', rating: 4.0 },
  /* ----------------------------------------------------------- offices */
  { id: 'g-of1', category: 'office', name: 'Agriculture Officer — Mandal', coords: { lat: 16.4982, lng: 80.6624 }, address: { address: 'Rythu Bharosa Kendra, Rural Mandal', city: 'Vijayawada', district: 'Krishna', state: ap, postalCode: '520007' }, phone: '+91 866 2xx xxxx', open: true, hours: '10 am – 5 pm' },
  { id: 'g-of2', category: 'office', name: 'Rythu Bharosa Kendra', coords: { lat: 16.7850, lng: 80.8465 }, address: { address: 'Panchayat Road', city: 'Nuzvid', district: 'Krishna', state: ap, postalCode: '521201' }, open: true, hours: '10 am – 5 pm' },
  { id: 'g-of3', category: 'office', name: 'Soil Testing Laboratory', coords: { lat: 16.5140, lng: 80.6560 }, address: { address: 'Agriculture College Campus', city: 'Vijayawada', district: 'Krishna', state: ap, postalCode: '520003' }, open: true, hours: '9 am – 4 pm', note: 'Soil & water testing' },
  { id: 'g-of4', category: 'office', name: 'Horticulture Department Office', coords: { lat: 16.3067, lng: 80.4365 }, address: { address: 'Collectorate Complex', city: 'Guntur', district: 'Guntur', state: ap, postalCode: '522001' }, open: true, hours: '10 am – 5 pm' },
  { id: 'g-of5', category: 'office', name: 'RBK Tenali — Agri Services', coords: { lat: 16.2430, lng: 80.6520 }, address: { address: 'Municipal Office Road', city: 'Tenali', district: 'Guntur', state: ap, postalCode: '522201' }, open: true, hours: '10 am – 5 pm' },
  /* ----------------------------------------------------------- experts */
  { id: 'g-ex1', category: 'expert', name: 'Dr. Anitha Reddy — Plant Clinic', coords: { lat: 16.5155, lng: 80.6418 }, address: { address: 'Benz Circle', city: 'Vijayawada', district: 'Krishna', state: ap, postalCode: '520008' }, phone: '+91 98xx xxx114', open: true, rating: 4.9, priceNote: '₹400 consult', ref: { kind: 'expert', id: 'e1' } },
  { id: 'g-ex2', category: 'expert', name: 'Kiran Kumar — Aqua Consultancy', coords: { lat: 16.5408, lng: 81.5232 }, address: { address: 'Coast Road', city: 'Bhimavaram', district: 'West Godavari', state: ap, postalCode: '534201' }, open: true, rating: 4.8, priceNote: '₹550 consult', ref: { kind: 'expert', id: 'e2' } },
  { id: 'g-ex3', category: 'expert', name: 'Dr. S. Prasad — Livestock', coords: { lat: 16.5090, lng: 80.6350 }, address: { address: 'Veterinary Colony', city: 'Vijayawada', district: 'Krishna', state: ap, postalCode: '520010' }, open: false, rating: 4.9, priceNote: '₹350 consult', ref: { kind: 'expert', id: 'e3' } },
  { id: 'g-ex4', category: 'expert', name: 'Meena Krishnan — Dairy Nutrition', coords: { lat: 16.3100, lng: 80.4400 }, address: { address: 'Inner Ring Road', city: 'Guntur', district: 'Guntur', state: ap, postalCode: '522005' }, open: true, rating: 4.7, priceNote: '₹300 consult', ref: { kind: 'expert', id: 'e4' } },
  { id: 'g-ex5', category: 'expert', name: 'Prof. R. Venkat — Soil Science', coords: { lat: 16.5130, lng: 80.6570 }, address: { address: 'Agriculture College', city: 'Vijayawada', district: 'Krishna', state: ap, postalCode: '520003' }, open: true, rating: 4.8, priceNote: '₹600 consult', ref: { kind: 'expert', id: 'e5' } },
  { id: 'g-ex6', category: 'expert', name: 'Dr. Farhan Ali — Poultry Health', coords: { lat: 16.4330, lng: 80.9940 }, address: { address: 'Poultry Market Lane', city: 'Gudivada', district: 'Krishna', state: ap, postalCode: '521301' }, open: false, rating: 4.6, priceNote: '₹380 consult', ref: { kind: 'expert', id: 'e6' } },
  /* ------------------------------------------------------------ buyers */
  { id: 'g-by1', category: 'buyer', name: 'Surya Aqua Exports', coords: { lat: 16.5440, lng: 81.5200 }, address: { address: 'Export Park', city: 'Bhimavaram', district: 'West Godavari', state: ap, postalCode: '534201' }, phone: '+91 8814 2x xxxx', open: true, rating: 4.5 },
  { id: 'g-by2', category: 'buyer', name: 'Venkatesh Chilli Traders', coords: { lat: 16.3030, lng: 80.4400 }, address: { address: 'Chilli Yard, Mirchi Market', city: 'Guntur', district: 'Guntur', state: ap, postalCode: '522001' }, open: false, rating: 4.4 },
  { id: 'g-by3', category: 'buyer', name: 'Krishna Vegetable Buyers Co-op', coords: { lat: 16.4300, lng: 80.9950 }, address: { address: 'Market Yard Annexe', city: 'Gudivada', district: 'Krishna', state: ap, postalCode: '521301' }, open: true, rating: 4.2 },
  { id: 'g-by4', category: 'buyer', name: 'Vijayawada Dairy Buyers Union', coords: { lat: 16.5210, lng: 80.6610 }, address: { address: 'Co-op Colony', city: 'Vijayawada', district: 'Krishna', state: ap, postalCode: '520007' }, open: true, rating: 4.6 },
  /* ------------------------------------------------------------ inputs */
  { id: 'g-in1', category: 'inputs', name: 'Krishna Agri Depot', coords: { lat: 16.5080, lng: 80.6440 }, address: { address: 'Seeds & Fertilizer Market', city: 'Vijayawada', district: 'Krishna', state: ap, postalCode: '520001' }, open: true, hours: '8 am – 8 pm', rating: 4.2 },
  { id: 'g-in2', category: 'inputs', name: 'GreenShield Inputs', coords: { lat: 16.1860, lng: 81.1350 }, address: { address: 'Port Road', city: 'Machilipatnam', district: 'Krishna', state: ap, postalCode: '521001' }, open: true, hours: '9 am – 7 pm', rating: 4.7 },
  { id: 'g-in3', category: 'inputs', name: 'AgroSeeds Pvt Ltd', coords: { lat: 16.3090, lng: 80.4430 }, address: { address: 'Seed Trade Centre', city: 'Guntur', district: 'Guntur', state: ap, postalCode: '522001' }, open: true, hours: '9 am – 6 pm', rating: 4.4 },
  { id: 'g-in4', category: 'inputs', name: 'Rythu Input Store', coords: { lat: 16.2445, lng: 80.6460 }, address: { address: 'Bazaar Street', city: 'Tenali', district: 'Guntur', state: ap, postalCode: '522201' }, open: true, hours: '7 am – 8 pm', rating: 4.1 },
  /* -------------------------------------------------------------- aqua */
  { id: 'g-aq1', category: 'aqua', name: 'AquaGrow Feeds & Seed', coords: { lat: 16.5420, lng: 81.5260 }, address: { address: 'Aqua Cluster Road', city: 'Bhimavaram', district: 'West Godavari', state: ap, postalCode: '534201' }, open: true, hours: '8 am – 7 pm', rating: 4.4 },
  { id: 'g-aq2', category: 'aqua', name: 'Godavari Fisheries Advisory', coords: { lat: 16.4370, lng: 80.9990 }, address: { address: 'Canal Bundle Road', city: 'Gudivada', district: 'Krishna', state: ap, postalCode: '521301' }, open: true, hours: '9 am – 6 pm', rating: 4.3 },
  { id: 'g-aq3', category: 'aqua', name: 'Shrimp Hatchery & Lab', coords: { lat: 16.5460, lng: 81.5180 }, address: { address: 'Coastal Cluster', city: 'Bhimavaram', district: 'West Godavari', state: ap, postalCode: '534201' }, open: true, hours: '8 am – 5 pm', rating: 4.5 },
  /* ----------------------------------------------------------- poultry */
  { id: 'g-po1', category: 'poultry', name: 'Sai Poultry Farm & Store', coords: { lat: 16.2420, lng: 80.6500 }, address: { address: 'Poultry Colony', city: 'Tenali', district: 'Guntur', state: ap, postalCode: '522201' }, open: true, hours: '6 am – 8 pm', rating: 4.3 },
  { id: 'g-po2', category: 'poultry', name: 'Nuzvid Feed Depot', coords: { lat: 16.7860, lng: 80.8440 }, address: { address: 'Godown Road', city: 'Nuzvid', district: 'Krishna', state: ap, postalCode: '521201' }, open: true, hours: '8 am – 6 pm', rating: 4.1 },
  { id: 'g-po3', category: 'poultry', name: 'Poultry Health Services', coords: { lat: 16.4340, lng: 80.9930 }, address: { address: 'Vet Market Lane', city: 'Gudivada', district: 'Krishna', state: ap, postalCode: '521301' }, open: true, hours: '9 am – 6 pm', rating: 4.4 },
  /* ------------------------------------------------------------- dairy */
  { id: 'g-da1', category: 'dairy', name: 'Sri Lakshmi Dairy', coords: { lat: 16.5230, lng: 80.6590 }, address: { address: 'Dairy Colony', city: 'Vijayawada', district: 'Krishna', state: ap, postalCode: '520007' }, open: true, hours: '5 am – 9 pm', rating: 4.9 },
  { id: 'g-da2', category: 'dairy', name: 'Milk Chilling Centre', coords: { lat: 16.4360, lng: 80.9970 }, address: { address: 'Co-op Society Road', city: 'Gudivada', district: 'Krishna', state: ap, postalCode: '521301' }, open: true, hours: '5 am – 10 am, 4 – 8 pm', rating: 4.5 },
  { id: 'g-da3', category: 'dairy', name: 'Dairy Co-op Society Tenali', coords: { lat: 16.2460, lng: 80.6470 }, address: { address: 'Milk Society Building', city: 'Tenali', district: 'Guntur', state: ap, postalCode: '522201' }, open: true, hours: '6 am – 9 pm', rating: 4.4 },
  /* ----------------------------------------------------------- storage */
  { id: 'g-st1', category: 'storage', name: 'Central Cold Storage', coords: { lat: 16.5231, lng: 80.6712 }, address: { address: 'Autonagar Industrial Estate', city: 'Vijayawada', district: 'Krishna', state: ap, postalCode: '520007' }, phone: '+91 866 2xx xxxx', open: true, hours: '24 × 7', rating: 4.3 },
  { id: 'g-st2', category: 'storage', name: 'Godavari Warehouse (Paddy)', coords: { lat: 16.4402, lng: 81.0031 }, address: { address: 'Warehouse Row', city: 'Gudivada', district: 'Krishna', state: ap, postalCode: '521301' }, open: true, hours: '8 am – 8 pm', rating: 4.2 },
  { id: 'g-st3', category: 'storage', name: 'Tenali Paddy Godown', coords: { lat: 16.2400, lng: 80.6520 }, address: { address: 'Yard Road', city: 'Tenali', district: 'Guntur', state: ap, postalCode: '522201' }, open: true, hours: '8 am – 6 pm', rating: 4.0 },
  { id: 'g-st4', category: 'storage', name: 'Guntur Cold Chain Hub', coords: { lat: 16.3050, lng: 80.4380 }, address: { address: 'Logistics Park', city: 'Guntur', district: 'Guntur', state: ap, postalCode: '522001' }, open: true, hours: '24 × 7', rating: 4.4 },
]

/* ------------------------------------------------------------- queries */

export type PlaceWithDistance = GeoPlace & { km: number }

export function placesIn(categories: PlaceCategory[] | 'all'): GeoPlace[] {
  if (categories === 'all') return geoPlaces
  return geoPlaces.filter((p) => categories.includes(p.category))
}

export function nearbyPlaces(
  origin: LatLng,
  categories: PlaceCategory[] | 'all' = 'all',
  limit = 8,
): PlaceWithDistance[] {
  return placesIn(categories)
    .map((p) => ({ ...p, km: haversineKm(origin, p.coords) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit)
}

/** Offline suggestion source for the search box when Places API is absent. */
export function searchPlacesLocal(q: string, limit = 6): GeoPlace[] {
  const s = q.trim().toLowerCase()
  if (!s) return []
  const hits = geoPlaces.filter((p) =>
    p.name.toLowerCase().includes(s) ||
    p.address.city.toLowerCase().includes(s) ||
    p.address.district.toLowerCase().includes(s) ||
    categoryMeta(p.category).label.toLowerCase().includes(s),
  )
  const townHits = towns
    .filter((t) => t.name.toLowerCase().includes(s))
    .map((t) => ({
      id: `town-${t.name}`, category: 'market' as PlaceCategory, name: t.name,
      coords: t.coords, address: { address: '', city: t.name, district: t.district, state: ap, postalCode: '' },
      note: 'Town / locality',
    }))
  return [...hits, ...townHits].slice(0, limit)
}

export const towns = [
  { name: 'Vijayawada', district: 'Krishna', coords: { lat: 16.5062, lng: 80.6480 } },
  { name: 'Gudivada', district: 'Krishna', coords: { lat: 16.4315, lng: 80.9963 } },
  { name: 'Tenali', district: 'Guntur', coords: { lat: 16.2455, lng: 80.6440 } },
  { name: 'Nuzvid', district: 'Krishna', coords: { lat: 16.7870, lng: 80.8460 } },
  { name: 'Nandigama', district: 'Krishna', coords: { lat: 16.7440, lng: 80.4990 } },
  { name: 'Machilipatnam', district: 'Krishna', coords: { lat: 16.1875, lng: 81.1389 } },
  { name: 'Guntur', district: 'Guntur', coords: { lat: 16.3067, lng: 80.4365 } },
  { name: 'Bhimavaram', district: 'West Godavari', coords: { lat: 16.5408, lng: 81.5232 } },
  { name: 'Amaravati', district: 'Guntur', coords: { lat: 16.5128, lng: 80.5198 } },
]

/** Coordinates + address for a marketplace listing (stored pin wins, else town). */
export function geoForListing(id: string, locationName: string): { coords: LatLng; address: GeoAddress } {
  const stored = getListingLocation(id)
  if (stored) {
    return {
      coords: { lat: stored.lat, lng: stored.lng },
      address: { address: stored.address, city: locationName, district: '', state: 'Andhra Pradesh', postalCode: '' },
    }
  }
  const t = towns.find((x) => locationName.toLowerCase().includes(x.name.toLowerCase())) ?? towns[0]!
  return {
    coords: t.coords,
    address: { address: '', city: t.name, district: t.district, state: 'Andhra Pradesh', postalCode: '' },
  }
}

/** Map place linked to a demo record, if one exists. */
export function placeForRef(kind: 'machine' | 'expert' | 'listing' | 'land', id: string): GeoPlace | undefined {
  if (kind === 'land') {
    const l = lands.find((x) => x.id === id)
    if (!l) return undefined
    return {
      id: `land-${l.id}`, category: 'market', name: l.name, coords: l.coords,
      address: { address: l.location, city: l.location, district: 'Krishna', state: ap, postalCode: '' },
      note: `${l.crop} · ${l.acres} acres`, ref: { kind: 'land', id: l.id },
    }
  }
  return geoPlaces.find((p) => p.ref?.kind === kind && p.ref.id === id)
}

/* ------------------------------------------- user-stored locations (demo) */

export type StoredLocation = { lat: number; lng: number; address: string; savedAt: string }

const FARM_KEY = 'agrismart-farm-locations'
const LISTING_KEY = 'agrismart-listing-locations'

function readStore(key: string): Record<string, StoredLocation> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(window.localStorage.getItem(key) ?? '{}') } catch { return {} }
}
function writeStore(key: string, v: Record<string, StoredLocation>) {
  try { window.localStorage.setItem(key, JSON.stringify(v)) } catch { /* private mode */ }
}

export function getFarmLocation(landId: string): StoredLocation | undefined {
  return readStore(FARM_KEY)[landId]
}
export function setFarmLocation(landId: string, loc: StoredLocation) {
  const all = readStore(FARM_KEY); all[landId] = loc; writeStore(FARM_KEY, all)
}
export function getListingLocation(listingId: string): StoredLocation | undefined {
  return readStore(LISTING_KEY)[listingId]
}
export function setListingLocation(listingId: string, loc: StoredLocation) {
  const all = readStore(LISTING_KEY); all[listingId] = loc; writeStore(LISTING_KEY, all)
}

/** Where "my location" falls back to when geolocation is unavailable/denied. */
export const demoOrigin = {
  coords: farmer.coords,
  label: farmer.location,
}

/** Reverse-geocode a coordinate to a readable label without any API. */
export function nearestTownLabel(p: LatLng): string {
  let best = towns[0]!
  let bestKm = Infinity
  for (const t of towns) {
    const km = haversineKm(p, t.coords)
    if (km < bestKm) { bestKm = km; best = t }
  }
  return bestKm < 12 ? `${best.name}, ${best.district}` : `Near ${best.name} (${Math.round(bestKm)} km)`
}

/** Convenience re-exports so pages import geo from one place. */
export { machines as machinesData, experts as expertsData, listings as listingsData, lands as landsData }
