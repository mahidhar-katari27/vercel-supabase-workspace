'use client'

import { useCallback, useState } from 'react'
import { Modal, Chip } from '@/components/ui'
import MapCanvas from './MapCanvas'
import PlaceSearch, { type PlaceSelection } from './PlaceSearch'
import type { MapMarker } from './types'
import { reverseGeocode } from '@/lib/googleMaps'
import { nearestTownLabel } from '@/lib/places'
import type { LatLng } from '@/lib/geo'

export type PickedLocation = LatLng & { address: string }

/**
 * "Select Farm Location" / "Product Location" picker (spec §9, §13).
 * Search, tap-the-map or use device GPS; the pin reverse-geocodes through the
 * Geocoding API when configured, otherwise it is labelled from the nearest
 * sample town so the demo flow still produces a readable address.
 */
export default function LocationPickerModal({
  open, onClose, onConfirm, title = '📍 Select location', initial,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (loc: PickedLocation) => void
  title?: string
  initial?: LatLng | null
}) {
  const [pin, setPin] = useState<LatLng | null>(initial ?? null)
  const [address, setAddress] = useState<string>('')
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  const setPicked = useCallback(async (p: LatLng, label?: string) => {
    setPin(p)
    const addr = label ?? (await reverseGeocode(p.lat, p.lng)) ?? nearestTownLabel(p)
    setAddress(addr)
  }, [])

  const useMyLocation = () => {
    setGeoError(null)
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoError('Location access is disabled. Search for your location manually.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        void setPicked({ lat: pos.coords.latitude, lng: pos.coords.longitude }, 'My current location')
      },
      () => {
        setLocating(false)
        setGeoError('Location access is disabled. Search for your location manually.')
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  const markers: MapMarker[] = pin
    ? [{ id: 'pick', lat: pin.lat, lng: pin.lng, icon: '📍', color: '#166534', label: address || 'Selected location', active: true }]
    : []

  return (
    <Modal open={open} onClose={onClose} title={title} wide>
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <PlaceSearch
            className="flex-1"
            placeholder="Search a village, town or landmark…"
            onSelect={(s: PlaceSelection) => void setPicked({ lat: s.lat, lng: s.lng }, s.address ?? s.label)}
          />
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="shrink-0 rounded-2xl border border-line/70 bg-surface px-4 py-3 text-xs font-bold text-ink shadow-sm hover:border-leaf-500 hover:text-leaf-700 disabled:opacity-60"
          >
            {locating ? 'Locating…' : '📍 Use My Location'}
          </button>
        </div>

        {geoError && (
          <p className="rounded-2xl border border-gold-400/40 bg-gold-400/10 px-3 py-2 text-[11px] font-semibold text-ink">
            {geoError}
          </p>
        )}

        <MapCanvas
          height={300}
          center={pin ?? { lat: 16.5062, lng: 80.648 }}
          zoomKm={pin ? 12 : 40}
          markers={markers}
          onMapClick={(p) => void setPicked(p)}
        />
        <p className="text-[11px] text-muted">Tap the map to drop the pin, or search above. Drag to pan, scroll or use +/− to zoom.</p>

        <div className="rounded-2xl bg-leaf-50 px-4 py-3">
          {pin ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Chip tone="ok" icon="📍">Pinned</Chip>
                <span className="font-mono text-[11px] text-muted">{pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-ink">{address || 'Resolving address…'}</p>
            </>
          ) : (
            <p className="text-sm font-semibold text-muted">No location selected yet.</p>
          )}
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-xl border border-line/70 px-4 py-2.5 text-sm font-bold text-ink hover:bg-leaf-50">
            Cancel
          </button>
          <button
            type="button"
            disabled={!pin}
            onClick={() => pin && onConfirm({ ...pin, address })}
            className="flex-1 rounded-xl bg-leaf-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-leaf-500 disabled:opacity-50"
          >
            Confirm location
          </button>
        </div>
      </div>
    </Modal>
  )
}
