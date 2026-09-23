import type { LatLng } from '@/lib/geo'

/** One pin on either map implementation (Google or demo fallback). */
export type MapMarker = {
  id: string
  lat: number
  lng: number
  icon: string
  color: string
  label: string
  sub?: string
  active?: boolean
  /** 'user' renders the pulsing current-location dot instead of a pin. */
  variant?: 'pin' | 'user'
}

export type MapRoute = { origin: LatLng; dest: LatLng } | null

export type MapViewProps = {
  center: LatLng
  markers: MapMarker[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  onMapClick?: (p: LatLng) => void
  route?: MapRoute
  fit?: boolean
  zoomKm?: number
  className?: string
  onConfigure?: () => void
}
