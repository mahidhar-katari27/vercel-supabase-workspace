'use client'

import { useEffect, useState } from 'react'
import { isMapsConfigured, loadGoogleMaps, type GoogleNS, type MapsStatus } from '@/lib/googleMaps'

/**
 * Resolves the Google Maps JS API once per page. Components render the demo
 * map until this says 'ready', so a missing/slow/blocked key never blocks UI.
 */
export function useGoogleMaps(): { status: MapsStatus; google: GoogleNS | null; error: string | null } {
  const [status, setStatus] = useState<MapsStatus>(() => (isMapsConfigured() ? 'loading' : 'unconfigured'))
  const [google, setGoogle] = useState<GoogleNS | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    if (!isMapsConfigured()) return
    loadGoogleMaps()
      .then((g) => { if (alive) { setGoogle(g); setStatus('ready') } })
      .catch((e) => { if (alive) { setError(String(e?.message ?? e)); setStatus('error') } })
    return () => { alive = false }
  }, [])

  return { status, google, error }
}
