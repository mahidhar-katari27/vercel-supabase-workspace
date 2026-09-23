'use client'

import { useCallback, useEffect, useState } from 'react'
import CinematicIntro from './CinematicIntro'

const KEY = 'agrismart-intro-seen'
const ATTR = 'data-intro'

function seenBefore(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(KEY, '1')
  } catch {
    /* private mode — the intro just replays next load */
  }
  document.documentElement.setAttribute(ATTR, 'seen')
}

function clearSeen() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  document.documentElement.removeAttribute(ATTR)
}

/**
 * Plays the cinematic intro once per session over a true fullscreen overlay.
 *
 * `show` starts **true** so the overlay is present in the server-rendered HTML
 * and paints on the very first frame — the website never appears before it.
 * Returning users are handled by a blocking script in the root layout that
 * marks <html data-intro="seen"> before paint, which CSS turns into
 * `display: none`; the effect below then unmounts it. So neither direction
 * flashes.
 *
 * The real app stays rendered underneath, which lets scene 5 reveal a live
 * dashboard instead of a blank page.
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
      {children}
      {show && <CinematicIntro onDone={done} />}
    </>
  )
}
