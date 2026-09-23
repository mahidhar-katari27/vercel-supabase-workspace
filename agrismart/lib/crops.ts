/**
 * Crop catalogue — the visual identity of every land card.
 *
 * Photographs are local assets in /public/crops (rights-clean, generated
 * field photography), so cards never show a broken link and work offline.
 * Swap any path for a licensed photo URL later without touching the UI.
 */

export type CropKey =
  | 'paddy' | 'chilli' | 'cotton' | 'maize'
  | 'groundnut' | 'tomato' | 'mango' | 'pulses'

export type Crop = {
  key: CropKey
  label: string
  icon: string
  image: string
  blurb: string
  /** Matching crop name in the Market Intelligence table, if tracked. */
  market?: string
}

export const cropCatalog: Crop[] = [
  { key: 'paddy',      label: 'Paddy',      icon: '🌾', image: '/crops/paddy.jpg',      blurb: 'Transplanted rice in flooded beds', market: 'Paddy (Common)' },
  { key: 'chilli',     label: 'Chilli',     icon: '🌶️', image: '/crops/chilli.jpg',     blurb: 'Guntur chilli, ridged rows',        market: 'Chilli (Dry)' },
  { key: 'cotton',     label: 'Cotton',     icon: '🌱', image: '/crops/cotton.jpg',     blurb: 'Boll-split cotton on black soil',   market: 'Cotton (Medium)' },
  { key: 'maize',      label: 'Maize',      icon: '🌽', image: '/crops/maize.jpg',      blurb: 'Hybrid maize for grain',            market: 'Maize' },
  { key: 'groundnut',  label: 'Groundnut',  icon: '🥜', image: '/crops/groundnut.jpg',  blurb: 'Peanut on sandy loam beds',         market: 'Groundnut' },
  { key: 'tomato',     label: 'Tomato',     icon: '🍅', image: '/crops/tomato.jpg',     blurb: 'Staked tomato with drip lines',     market: 'Tomato' },
  { key: 'mango',      label: 'Mango',      icon: '🥭', image: '/crops/mango.jpg',      blurb: 'Banginapalli orchard blocks' },
  { key: 'pulses',     label: 'Pulses',     icon: '🫘', image: '/crops/pulses.jpg',     blurb: 'Green gram / pigeon pea' },
]

export const cropOf = (key: string): Crop =>
  cropCatalog.find((c) => c.key === key) ?? cropCatalog[0]!

/** Map a free-text crop name ("Paddy", "Sona Masoori Paddy") to a catalogue key. */
export function cropKeyForName(crop: string): CropKey {
  const s = crop.toLowerCase()
  if (s.includes('paddy') || s.includes('rice')) return 'paddy'
  if (s.includes('chilli') || s.includes('chili') || s.includes('mirchi')) return 'chilli'
  if (s.includes('cotton')) return 'cotton'
  if (s.includes('maize') || s.includes('corn') || s.includes('jonna')) return 'maize'
  if (s.includes('groundnut') || s.includes('peanut')) return 'groundnut'
  if (s.includes('tomato')) return 'tomato'
  if (s.includes('mango')) return 'mango'
  if (s.includes('pulse') || s.includes('gram') || s.includes('dal')) return 'pulses'
  return 'paddy'
}

/** 🟢 / 🟡 / 🔴 health indicator (spec §5). */
export function healthIndicator(health: number): { icon: string; label: string; cls: string } {
  if (health >= 85) return { icon: '🟢', label: 'Healthy', cls: 'bg-leaf-600/90 text-white' }
  if (health >= 70) return { icon: '🟡', label: 'Attention', cls: 'bg-gold-500/95 text-ink' }
  return { icon: '🔴', label: 'Critical', cls: 'bg-red-600/90 text-white' }
}
