'use client'

/**
 * My Farm land store with per-user isolation.
 *
 *   signed-in  → lands live in the user's scoped namespace (lib/userScope),
 *                created during onboarding or via "+ Add My Farm"
 *   demo/explore → the labelled sample lands from lib/data.ts
 *
 * Nothing is ever mixed: a fresh account starts with an empty farm and the
 * honest empty state, never another user's fields.
 */
import { lands as demoLands, type Land } from './data'
import { cropKeyForName } from './crops'
import { cropInfo } from './cropDb'
import { readJSON, writeJSON, removeKey, isScoped } from './userScope'

const BASE = 'my-lands'

export type LandsSource = 'mine' | 'demo'

export function loadLands(): { list: Land[]; source: LandsSource } {
  const custom = readJSON<Land[] | null>(BASE, null)
  if (Array.isArray(custom)) return { list: custom, source: 'mine' }
  return { list: demoLands, source: 'demo' }
}

export function saveLands(list: Land[]) {
  writeJSON(BASE, list)
}

/** Drop the personal list and fall back to the labelled demo portfolio. */
export function clearMyLands() {
  removeKey(BASE)
}

export function hasMyLands(): boolean {
  return Array.isArray(readJSON<Land[] | null>(BASE, null))
}

let seq = 0
export function makeLand(input: {
  name?: string
  location: string
  acres: number
  crop: string
  soil: string
  irrigation: string
  planted?: string
}): Land {
  const key = cropKeyForName(input.crop)
  const info = cropInfo(key)
  const planted = input.planted ?? new Date().toISOString().slice(0, 10)
  const days = Math.round((info.durationDays[0] + info.durationDays[1]) / 2)
  const harvest = new Date(Date.parse(planted) + days * 86400000).toISOString().slice(0, 10)
  seq += 1
  return {
    id: `my-land-${Date.now().toString(36)}-${seq}`,
    name: input.name ?? `Land ${String(seq).padStart(2, '0')}`,
    location: input.location,
    acres: input.acres,
    soil: input.soil,
    irrigation: input.irrigation,
    crop: input.crop,
    planted,
    harvest,
    stage: 'Establishing',
    progress: 6,
    health: 88,
    // Slight per-land jitter around the district centre keeps map markers
    // from stacking exactly on top of each other.
    coords: { lat: 16.51 + (Math.random() - 0.5) * 0.08, lng: 80.65 + (Math.random() - 0.5) * 0.08 },
    cropKey: key,
    harvestDays: days,
    investment: 0,
    revenue: 0,
    profit: 0,
  }
}

export { isScoped }
