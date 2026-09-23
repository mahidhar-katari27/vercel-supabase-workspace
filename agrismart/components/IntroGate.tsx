'use client'

import { useEffect, useState } from 'react'
import CinematicIntro from './CinematicIntro'

/**
 * Plays the cinematic intro once per session, with the real app already
 * rendered underneath so scene 5 reveals a live dashboard rather than a
 * blank page. Replaying is available from the profile menu for the demo.
 */
const KEY = 'agrismart-intro-seen'

export default function IntroGate({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let seen = false
    try { seen = sessionStorage.getItem(KEY) === '1' } catch {}
    if (!seen) setShow(true)
  }, [])

  // Let other components (profile menu) request a replay.
  useEffect(() => {
    const onReplay = () => setShow(true)
    window.addEventListener('agrismart:replay-intro', onReplay)
    return () => window.removeEventListener('agrismart:replay-intro', onReplay)
  }, [])

  const done = () => {
    try { sessionStorage.setItem(KEY, '1') } catch {}
    setShow(false)
  }

  return (
    <>
      {children}
      {show && <CinematicIntro onDone={done} />}
    </>
  )
}
