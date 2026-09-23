'use client'

import { useEffect, useRef, useState } from 'react'
import { emojiMarkerIcon, categoryColor, type GoogleNS } from '@/lib/googleMaps'
import { boundsOf } from '@/lib/geo'
import { cn } from '@/lib/utils'
import type { MapViewProps } from './types'

/**
 * The real Google Maps JavaScript API view.
 *
 * Custom emoji markers (SVG data-URIs), smooth camera moves, an animated
 * DirectionsService route and click-to-place support. Everything degrades
 * through MapCanvas: if this component never mounts, the demo map is shown.
 */
export default function GoogleMapView({
  google, center, markers, selectedId, onSelect, onMapClick, route, fit, zoomKm = 24, className,
}: MapViewProps & { google: GoogleNS }) {
  const divRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markerRefs = useRef<Map<string, any>>(new Map())
  const rendererRef = useRef<any>(null)
  const [ready, setReady] = useState(false)

  /* create ------------------------------------------------------------- */
  useEffect(() => {
    if (!divRef.current || mapRef.current) return
    const map = new google.maps.Map(divRef.current, {
      center: { lat: center.lat, lng: center.lng },
      zoom: 12,
      mapId: undefined,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      clickableIcons: false,
      backgroundColor: '#eef4ea',
      styles: [
        { featureType: 'poi.business', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
    })
    mapRef.current = map
    map.addListener('idle', () => setReady(true), { once: true })
    map.addListener('click', (e: any) => {
      if (!onMapClickRef.current) return
      const p = e.latLng
      if (p) onMapClickRef.current({ lat: p.lat(), lng: p.lng() })
    })
    return () => {
      markerRefs.current.forEach((m) => m.setMap(null))
      markerRefs.current.clear()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [google])

  // Keep latest callbacks without re-creating the map.
  const onMapClickRef = useRef(onMapClick)
  onMapClickRef.current = onMapClick
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  /* markers ------------------------------------------------------------ */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const seen = new Set<string>()
    for (const mk of markers) {
      seen.add(mk.id)
      let m = markerRefs.current.get(mk.id)
      const icon = mk.variant === 'user'
        ? { url: userDotSvg(mk.color), scaledSize: new google.maps.Size(26, 26), anchor: new google.maps.Point(13, 13) }
        : (() => { const i = emojiMarkerIcon(mk.icon, mk.color, !!mk.active); return { url: i.url, scaledSize: new google.maps.Size(i.scaledSize.width, i.scaledSize.height), anchor: new google.maps.Point(i.anchor.x, i.anchor.y) } })()
      if (!m) {
        m = new google.maps.Marker({
          position: { lat: mk.lat, lng: mk.lng },
          icon,
          title: mk.label,
          zIndex: mk.active ? 999 : 10,
          animation: google.maps.Animation.DROP,
        })
        m.addListener('click', () => onSelectRef.current?.(mk.id))
        m.setMap(map)
        markerRefs.current.set(mk.id, m)
      } else {
        m.setPosition({ lat: mk.lat, lng: mk.lng })
        m.setIcon(icon)
        m.setZIndex(mk.active ? 999 : 10)
        m.setTitle(mk.label)
      }
    }
    markerRefs.current.forEach((m, id) => {
      if (!seen.has(id)) { m.setMap(null); markerRefs.current.delete(id) }
    })
  }, [markers, google])

  /* camera ------------------------------------------------------------- */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    if (fit && markers.length) {
      const b = boundsOf(markers.map((m) => ({ lat: m.lat, lng: m.lng })))
      map.fitBounds({ north: b.north, south: b.south, east: b.east, west: b.west })
    } else {
      map.panTo({ lat: center.lat, lng: center.lng })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, fit, markers.length, ready])

  /* selected marker gets a gentle pan + bounce ------------------------- */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const m = markerRefs.current.get(selectedId)
    const mk = markers.find((x) => x.id === selectedId)
    if (!m || !mk) return
    map.panTo({ lat: mk.lat, lng: mk.lng })
    m.setAnimation(google.maps.Animation.BOUNCE)
    const t = setTimeout(() => m.setAnimation(null), 900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  /* directions ---------------------------------------------------------- */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (rendererRef.current) { rendererRef.current.setMap(null); rendererRef.current = null }
    if (!route) return
    const renderer = new google.maps.DirectionsRenderer({
      map,
      polylineOptions: { strokeColor: categoryColor.machinery, strokeOpacity: 0.9, strokeWeight: 5 },
      preserveViewport: false,
      suppressMarkers: false,
    })
    const service = new google.maps.DirectionsService()
    service.route(
      {
        origin: { lat: route.origin.lat, lng: route.origin.lng },
        destination: { lat: route.dest.lat, lng: route.dest.lng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (res: any, status: string) => { if (status === 'OK') renderer.setDirections(res) },
    )
    rendererRef.current = renderer
    return () => { renderer.setMap(null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.origin.lat, route?.origin.lng, route?.dest.lat, route?.dest.lng])

  return (
    <div
      className={cn('absolute inset-0 transition-opacity duration-700', ready ? 'opacity-100' : 'opacity-0', className)}
    >
      <div ref={divRef} className="h-full w-full" aria-label="Google Map" />
      {!ready && <div className="absolute inset-0 animate-pulse bg-leaf-50" />}
    </div>
  )
}

function userDotSvg(color: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26">` +
    `<circle cx="13" cy="13" r="11" fill="${color}" opacity="0.22"/>` +
    `<circle cx="13" cy="13" r="6.5" fill="${color}" stroke="#fff" stroke-width="2.5"/>` +
    `</svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}
