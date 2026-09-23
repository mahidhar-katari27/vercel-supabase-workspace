/**
 * Google Maps Platform loader + configuration state.
 *
 * The API key lives ONLY in the environment variable
 *   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
 * Next inlines NEXT_PUBLIC_* values at build time; nothing is ever written
 * into source. See docs/google-maps.md for key creation + restriction steps.
 *
 * APIs actually used (enable exactly these in Google Cloud Console):
 *   • Maps JavaScript API   — the interactive map, markers, directions render
 *   • Places API            — autocomplete in the search box
 *   • Geocoding API         — reverse-geocode a picked farm/listing pin
 * Directions are drawn by the JavaScript API's DirectionsService; the
 * keyless "Open in Google Maps" link needs no API at all.
 */

export type MapsStatus = 'unconfigured' | 'loading' | 'ready' | 'error'

const ENV_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

export function mapsApiKey(): string {
  return ENV_KEY.trim()
}

export function isMapsConfigured(): boolean {
  const k = mapsApiKey()
  // Reject placeholders so a half-finished .env still falls back cleanly.
  return k.length > 20 && !/^(your|xxx|placeholder|changeme)/i.test(k)
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export type GoogleNS = any

let loaderPromise: Promise<GoogleNS> | null = null

function inject(libraries: string): Promise<GoogleNS> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google Maps can only load in the browser'))
      return
    }
    const w = window as any
    if (w.google?.maps) { resolve(w.google); return }
    const cbName = '__AGRISMART_GM_CB__'
    w[cbName] = () => {
      delete w[cbName]
      resolve(w.google)
    }
    const s = document.createElement('script')
    s.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(mapsApiKey())}` +
      `&libraries=${encodeURIComponent(libraries)}&loading=async&callback=${cbName}&v=weekly`
    s.async = true
    s.onerror = () => reject(new Error('Google Maps script failed to load'))
    document.head.appendChild(s)
    setTimeout(() => {
      if (!w.google?.maps) reject(new Error('Google Maps load timed out'))
    }, 15000)
  })
}

/** Loads the JS API once, with Places + Geometry. Safe to call from many components. */
export function loadGoogleMaps(): Promise<GoogleNS> {
  if (!isMapsConfigured()) return Promise.reject(new Error('unconfigured'))
  if (!loaderPromise) loaderPromise = inject('places,geometry')
  return loaderPromise
}

/** Emoji marker as an SVG data-URI — custom markers without any image asset. */
export function emojiMarkerIcon(emoji: string, bg: string, active = false): { url: string; scaledSize: { width: number; height: number }; anchor: { x: number; y: number } } {
  const size = active ? 46 : 38
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 10}" viewBox="0 0 40 50">` +
    `<path d="M20 49 C20 49 4 30 4 18 A16 16 0 0 1 36 18 C36 30 20 49 20 49Z" fill="${bg}" stroke="rgba(255,255,255,0.92)" stroke-width="2"/>` +
    `<circle cx="20" cy="18" r="12.5" fill="rgba(255,255,255,0.95)"/>` +
    `<text x="20" y="24" font-size="15" text-anchor="middle">${emoji}</text>` +
    `</svg>`
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: { width: size, height: size + 10 },
    anchor: { x: size / 2, y: size + 10 },
  }
}

/** Category colour used for the marker pin + card accents. */
export const categoryColor: Record<string, string> = {
  market: '#b45309',
  machinery: '#15803d',
  vet: '#b91c1c',
  office: '#1d4ed8',
  expert: '#7c3aed',
  buyer: '#0f766e',
  inputs: '#4d7c0f',
  aqua: '#0369a1',
  poultry: '#c2410c',
  dairy: '#0e7490',
  storage: '#57534e',
  farm: '#166534',
  user: '#111827',
  search: '#065f46',
}

/** Reverse-geocode via the Geocoding API (only when a key is configured). */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!isMapsConfigured()) return null
  try {
    const g = await loadGoogleMaps()
    const geocoder = new g.maps.Geocoder()
    const res: any = await geocoder.geocode({ location: { lat, lng } })
    const first = res?.results?.[0]
    return first?.formatted_address ?? null
  } catch {
    return null
  }
}

/** Forward-geocode a typed address (used by the search box fallback chain). */
export async function geocodeQuery(q: string): Promise<{ lat: number; lng: number; address: string } | null> {
  if (!isMapsConfigured()) return null
  try {
    const g = await loadGoogleMaps()
    const geocoder = new g.maps.Geocoder()
    const res: any = await geocoder.geocode({ address: q })
    const first = res?.results?.[0]
    if (!first?.geometry?.location) return null
    return {
      lat: first.geometry.location.lat(),
      lng: first.geometry.location.lng(),
      address: first.formatted_address,
    }
  } catch {
    return null
  }
}
