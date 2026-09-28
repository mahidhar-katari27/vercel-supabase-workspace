'use client'

import { useCallback, useEffect, useState } from 'react'
import CinematicIntro from './CinematicIntro'

const KEY = 'agrismart-intro-seen'
const ATTR = 'data-intro'

function seenBefore(): boolean {
  // localStorage makes the skip state persist across browser sessions, so
  // returning users never rewatch (product requirement). sessionStorage is
  // kept as a private-mode fallback.
  try {
    return localStorage.getItem(KEY) === '1' || sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

function markSeen() {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    /* private mode — fall through to session memory */
  }
  try {
    sessionStorage.setItem(KEY, '1')
  } catch {
    /* private mode — the intro just replays next load */
  }
  const html = document.documentElement
  html.setAttribute(ATTR, 'seen')
  // The root layout paints <html> the intro colour inline so the first frame is
  // dark with no JS. The intro is over now, so hand the background back to the
  // theme. <body> is opaque either way — this only matters for overscroll.
  html.style.background = ''
}

function clearSeen() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  // Back to the "first visit" state so a replay also gets the dark first frame.
  document.documentElement.setAttribute(ATTR, 'playing')
}

/**
 * Plays the cinematic intro once per session over a true fullscreen overlay.
 *
 * The overlay is rendered as the FIRST child of <body>, ahead of the app
 * markup. That ordering matters for slow connections: HTML streams, and the
 * browser paints whatever it has parsed. If the app markup came first, a rural
 * 3G user would see the navbar and hero for a moment before the intro bytes
 * arrived. Putting the overlay first means the first body element parsed —
 * and therefore the first thing painted — is the intro.
 *
 * `show` starts true so the overlay is in the server-rendered HTML. Returning
 * users are handled by a blocking script in the root layout that sets
 * <html data-intro="seen"> before paint; CSS turns that into display:none.
 * Neither direction flashes.
 *
 * The real app still renders underneath (later in the document), which lets
 * scene 5 reveal a live dashboard instead of a blank page.
 */
export default function IntroGate({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(true)

  // Returning user: drop the overlay as soon as we can read storage.
  useEffect(() => {
    if (seenBefore()) setShow(false)
  }, [])

  // Lock page scroll for exactly as long as the intro is on screen.
  useEffect(() => {
    if (!show) return
    const { documentElement: html, body } = document
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.classList.add('intro-active')
    body.classList.add('intro-active')
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    // Restore the previous scroll position context after unlock.
    const y = window.scrollY
    return () => {
      html.classList.remove('intro-active')
      body.classList.remove('intro-active')
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
      window.scrollTo(0, y)
    }
  }, [show])

  // Let other components (profile menu, /demo) request a replay.
  useEffect(() => {
    const onReplay = () => {
      clearSeen()
      setShow(true)
    }
    window.addEventListener('agrismart:replay-intro', onReplay)
    return () => window.removeEventListener('agrismart:replay-intro', onReplay)
  }, [])

  const done = useCallback(() => {
    markSeen()
    setShow(false)
  }, [])

  return (
    <>
      {/* Deliberately first: the intro must be the first body node parsed so it
          wins the first paint even when the document arrives in chunks. */}
      {show && <CinematicIntro onDone={done} />}
      {children}
    </>
  )
}
