'use client'

/**
 * AgriSmart 2.0 — "Premium Agriculture Cinema" opening. 6.0s, skippable.
 *
 *   0.0–0.8  black · a breath of natural dust motes
 *   0.8–2.0  cinematic aerial farmland reveals · camera travels forward ·
 *            sunlight rakes across the fields
 *   2.0–3.2  four minimal intelligence overlays pin onto the land
 *            (weather · water · crop · market) — "this is a smart farm"
 *   3.2–4.5  overlays converge to one point · landscape settles into the
 *            AgriSmart identity field
 *   4.5–5.8  AGRISMART + "From Land to Better Decisions." — soft light,
 *            opacity, a whisper of scale. No spin.
 *   5.8–6.0  dissolve into the homepage. No hard cut.
 *
 * REAL FARM → SMART FARM → AGRISMART.
 * Reduced-motion users skip straight to the app. Session-gated by IntroGate
 * (sessionStorage) so returning users never re-watch; Skip Intro always works.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'

const TOTAL = 6000
const CINE = [0.22, 1, 0.36, 1] as const

type Phase = 'dark' | 'fly' | 'smart' | 'converge' | 'brand' | 'out'

const PINS = [
  { icon: '🌦', label: 'Weather', value: '28°C · rain Thu', x: 26, y: 38, d: 0.0 },
  { icon: '💧', label: 'Water', value: 'soil 64%', x: 62, y: 30, d: 0.22 },
  { icon: '🌱', label: 'Crop', value: 'paddy · day 68', x: 44, y: 58, d: 0.44 },
  { icon: '📈', label: 'Market', value: '₹2,350/q', x: 74, y: 56, d: 0.66 },
]

export default function CinematicIntro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>('dark')
  const [small, setSmall] = useState(false)
  useEffect(() => { setSmall(window.innerWidth < 640) }, [])
  const timers = useRef<number[]>([])
  const doneRef = useRef(false)

  // a handful of natural dust motes — deterministic, never "particle soup"
  const motes = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      x: (i * 61) % 100,
      y: 20 + ((i * 37) % 60),
      s: 1 + (i % 3) * 0.6,
      d: (i % 7) * 0.35,
      o: 0.10 + (i % 4) * 0.05,
    })), [])

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const finish = () => {
      if (doneRef.current) return
      doneRef.current = true
      setPhase('out')
      timers.current.push(window.setTimeout(onDone, 420))
    }
    if (reduce) { finish(); return }
    const at = (ms: number, p: Phase) => timers.current.push(window.setTimeout(() => setPhase(p), ms))
    at(0, 'dark'); at(800, 'fly'); at(2000, 'smart'); at(3200, 'converge'); at(4500, 'brand')
    timers.current.push(window.setTimeout(finish, 5800))
    return () => timers.current.forEach(clearTimeout)
  }, [onDone])

  const skip = () => {
    timers.current.forEach(clearTimeout)
    if (!doneRef.current) { doneRef.current = true; setPhase('out'); window.setTimeout(onDone, 220) }
  }

  const flying = phase === 'fly' || phase === 'smart' || phase === 'converge'
  const landscapeVisible = flying || phase === 'brand'

  return (
    <AnimatePresence>
      {phase !== 'out' ? (
        <motion.div
          key="intro"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="intro-overlay fixed inset-0 z-[100] overflow-hidden bg-black"
          role="presentation"
        >
          {/* ------------------------------------ aerial farmland + camera */}
          <div className="absolute inset-0" aria-hidden>
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{
                opacity: landscapeVisible ? (phase === 'brand' ? 0.35 : 1) : 0,
                // slow forward travel over the fields
                scale: phase === 'dark' ? 1.02 : phase === 'fly' ? 1.10 : phase === 'smart' ? 1.16 : phase === 'converge' ? 1.22 : 1.26,
                y: phase === 'dark' ? '2%' : '-2%',
              }}
              transition={{ duration: 5.2, ease: 'linear' }}
            >
              <Image
                src="/intro/aerial.jpg" alt="" fill priority sizes="100vw"
                className="object-cover"
              />
            </motion.div>

            {/* sunlight raking across the landscape */}
            <motion.div
              className="absolute inset-0 mix-blend-screen"
              style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,214,150,0.28) 46%, rgba(255,236,200,0.16) 52%, transparent 68%)' }}
              initial={{ x: small ? '0%' : '-60%' }}
              animate={{ x: small ? '0%' : phase === 'dark' ? '-60%' : '60%' }}
              transition={{ duration: small ? 0 : 4.6, ease: 'easeInOut', delay: 0.8 }}
            />

            {/* cinematic grade: letterbox breathing + bottom weight */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/40" />
          </div>

          {/* ------------------------------------ dust motes (0.0–0.8+) */}
          {motes.slice(0, small ? 6 : motes.length).map((m, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-[#f4e9d8]"
              style={{ width: m.s, height: m.s, left: `${m.x}%`, top: `${m.y}%` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'dark' ? m.o : m.o * 0.6, y: [0, -14, -26] }}
              transition={{ duration: 5.5, delay: m.d, ease: 'linear' }}
              aria-hidden
            />
          ))}

          {/* ------------------------------------ smart-farm overlays */}
          <AnimatePresence>
            {(phase === 'smart' || phase === 'converge') && (
              <motion.div key="pins" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0">
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
                  {PINS.map((p, i) => (
                    <motion.line
                      key={i}
                      x1={phase === 'converge' ? 50 : p.x} y1={phase === 'converge' ? 50 : p.y + 6}
                      x2={p.x} y2={p.y + 6}
                      stroke="rgba(246,245,241,0.5)" strokeWidth="0.12"
                      initial={{ opacity: 0 }} animate={{ opacity: phase === 'converge' ? 0 : 0.7 }}
                      transition={{ delay: 0.3 + p.d, duration: 0.6 }}
                    />
                  ))}
                </svg>
                {PINS.map((p) => (
                  <motion.div
                    key={p.label}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    initial={{ opacity: 0, y: 10, scale: 0.92 }}
                    animate={phase === 'converge'
                      ? { opacity: 0, x: (50 - p.x) * 6, y: (50 - p.y) * 4, scale: 0.7 }
                      : { opacity: 1, y: 0, scale: 1, x: 0 }}
                    transition={{ duration: phase === 'converge' ? 1.1 : 0.7, delay: phase === 'converge' ? 0 : p.d, ease: CINE }}
                  >
                    <div className="flex items-center gap-2.5 rounded-full border border-white/20 bg-black/35 px-3.5 py-2 backdrop-blur-md">
                      <span className="text-sm" aria-hidden>{p.icon}</span>
                      <span>
                        <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-white/60">{p.label}</span>
                        <span className="block text-xs font-semibold text-white/95">{p.value}</span>
                      </span>
                    </div>
                    <span className="mx-auto mt-1.5 block h-1.5 w-1.5 rounded-full bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.7)]" aria-hidden />
                  </motion.div>
                ))}
                {/* convergence glow */}
                {phase === 'converge' && (
                  <motion.span
                    className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e9d8b0]/25 blur-2xl"
                    initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1.7, opacity: 1 }} transition={{ duration: 1.2, ease: CINE }}
                    aria-hidden
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ------------------------------------ brand reveal */}
          <AnimatePresence>
            {phase === 'brand' && (
              <motion.div
                key="brand"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                className="absolute inset-0 grid place-items-center px-6 text-center"
              >
                <div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.9, ease: CINE }}
                    className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-[22px] border border-white/15 bg-white/8 text-3xl backdrop-blur-sm"
                    aria-hidden
                  >
                    🌾
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0, y: 10, letterSpacing: '0.34em' }}
                    animate={{ opacity: 1, y: 0, letterSpacing: '0.2em' }}
                    transition={{ duration: 1.0, ease: CINE }}
                    className="font-display text-5xl font-semibold text-[#F6F5F1] sm:text-7xl"
                  >
                    AGRISMART
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.35, ease: CINE }}
                    className="mt-4 text-sm font-medium tracking-wide text-[#cfd3c4] sm:text-base"
                  >
                    From Land to Better Decisions.
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ------------------------------------ skip */}
          <button
            onClick={skip}
            className="intro-skip group absolute bottom-6 right-6 flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/70 backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            Skip Intro
            <span className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden>→</span>
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
