/**
 * Pure geography helpers. No network, no Google dependency — these power the
 * demo/fallback mode and double-check the real Directions API results.
 */

export type LatLng = { lat: number; lng: number }

/** Structured address, mirrors the location columns in the Supabase schema. */
export type GeoAddress = {
  address: string
  city: string
  district: string
  state: string
  postalCode: string
}

/** Everything a location-enabled record carries (spec §17). */
export type GeoFields = GeoAddress & LatLng

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la = (a.lat * Math.PI) / 180
  const lb = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`
}

/**
 * Driving-time ESTIMATE for rural Andhra Pradesh roads (mixed village +
 * highway, ~26 km/h effective). Clearly an estimate, never a promise — the
 * real figure comes from the Directions API when a key is configured.
 */
export function estimateDriveMinutes(km: number): number {
  return Math.max(4, Math.round((km / 26) * 60 + 6))
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} hr ${m} min` : `${h} hr`
}

/** Keyless Google Maps URLs — these work without any API key at all. */
export function directionsUrl(origin: LatLng | string, dest: LatLng | string): string {
  const o = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`
  const d = typeof dest === 'string' ? dest : `${dest.lat},${dest.lng}`
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(o)}&destination=${encodeURIComponent(d)}&travelmode=driving`
}

export function placeUrl(p: LatLng | string): string {
  const q = typeof p === 'string' ? p : `${p.lat},${p.lng}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

/** One-line address for cards. */
export function addressLine(g: GeoAddress): string {
  return [g.address, g.city, g.district, g.state, g.postalCode].filter(Boolean).join(', ')
}

/** Bounding box of a set of points, padded so markers never sit on the edge. */
export function boundsOf(points: LatLng[], padRatio = 0.18) {
  if (!points.length) return { north: 16.6, south: 16.4, east: 80.8, west: 80.5 }
  let north = -90, south = 90, east = -180, west = 180
  for (const p of points) {
    north = Math.max(north, p.lat)
    south = Math.min(south, p.lat)
    east = Math.max(east, p.lng)
    west = Math.min(west, p.lng)
  }
  const dLat = Math.max(north - south, 0.02)
  const dLng = Math.max(east - west, 0.02)
  return {
    north: north + dLat * padRatio,
    south: south - dLat * padRatio,
    east: east + dLng * padRatio,
    west: west - dLng * padRatio,
  }
}

export type Bounds = ReturnType<typeof boundsOf>

export function centerOf(b: Bounds): LatLng {
  return { lat: (b.north + b.south) / 2, lng: (b.east + b.west) / 2 }
}
