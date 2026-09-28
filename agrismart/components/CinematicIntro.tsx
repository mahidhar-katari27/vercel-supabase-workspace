'use client'

/**
 * AgriSmart 2.0 — cinematic opening, EXACTLY 6.0 seconds, skippable.
 *
 * Timeline (product spec §43):
 *   0.0–1.0  particles form a digital agricultural grid
 *   1.0–2.2  camera moves through the grid → it becomes field boundaries
 *   2.2–3.4  kinetic typography WEATHER / CROP / WATER / MARKET → data viz
 *   3.4–4.7  data streams converge toward the centre
 *   4.7–6.0  AGRISMART reveal + "From Land to Better Decisions."
 *
 * Everything is transform/opacity only (GPU-friendly), honours
 * prefers-reduced-motion by skipping straight to the app, and paints over a
 * true fullscreen fixed overlay rendered first in <body> (see IntroGate).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const TOTAL = 6000

type Phase = 'grid' | 'fields' | 'words' | 'converge' | 'reveal' | 'out'

const WORDS = [
  { w: 'WEATHER', icon: '🌦', viz: [3, 6, 4, 8, 6, 9] },
  { w: 'CROP', icon: '🌾', viz: [4, 5, 7, 6, 8, 9] },
  { w: 'WATER', icon: '💧', viz: [8, 6, 7, 5, 6, 4] },
  { w: 'MARKET', icon: '📈', viz: [3, 4, 6, 5, 8, 10] },
]

export default function CinematicIntro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>('grid')
  const timers = useRef<number[]>([])
  const doneRef = useRef(false)

  // deterministic particle field (no re-random on rerender)
  const dots = useMemo(() =>
    Array.from({ length: 64 }, (_, i) => {
      const gx = (i % 8) * 12.5 + 6.25
      const gy = Math.floor(i / 8) * 12.5 + 6.25
      const sx = (Math.sin(i * 12.9898) * 43758.5453) % 100
      const sy = (Math.sin(i * 78.233) * 12345.678) % 100
      return { gx, gy, sx: Math.abs(sx), sy: Math.abs(sy), d: (i % 10) * 0.05 }
    }), [])

  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const finish = () => {
      if (doneRef.current) return
      doneRef.current = true
      setPhase('out')
      timers.current.push(window.setTimeout(onDone, 520))
    }
    if (reduce) { finish(); return }
    const at = (ms: number, p: Phase) => timers.current.push(window.setTimeout(() => setPhase(p), ms))
    at(0, 'grid'); at(1000, 'fields'); at(2200, 'words'); at(3400, 'converge'); at(4700, 'reveal')
    timers.current.push(window.setTimeout(finish, TOTAL))
    return () => timers.current.forEach(clearTimeout)
  }, [onDone])

  const skip = () => {
    timers.current.forEach(clearTimeout)
    if (!doneRef.current) { doneRef.current = true; setPhase('out'); window.setTimeout(onDone, 260) }
  }

  return (
    <AnimatePresence>
      {phase !== 'out' ? (
        <motion.div
          key="intro"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] overflow-hidden bg-[#10160a]"
          role="presentation"
        >
          {/* ------------------------------------------ P0/P1 grid + camera */}
          <motion.div
            className="absolute inset-0"
            animate={{
              scale: phase === 'grid' ? 1 : phase === 'fields' ? 1.55 : 1.8,
              y: phase === 'grid' ? 0 : phase === 'fields' ? '-6%' : '-10%',
              opacity: phase === 'words' || phase === 'converge' ? 0.35 : phase === 'reveal' ? 0.15 : 1,
            }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* faint digital grid lines */}
            <motion.svg
              viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full"
              initial={{ opacity: 0 }} animate={{ opacity: phase === 'grid' ? 0.5 : 0.25 }} transition={{ duration: 0.8 }}
            >
              {Array.from({ length: 7 }, (_, i) => (
                <g key={i} stroke="#818B54" strokeWidth="0.08">
                  <line x1={(i + 1) * 12.5} y1="0" x2={(i + 1) * 12.5} y2="100" />
                  <line x1="0" y1={(i + 1) * 12.5} x2="100" y2={(i + 1) * 12.5} />
                </g>
              ))}
            </motion.svg>

            {/* particles flying to grid intersections */}
            {dots.map((p, i) => (
              <motion.span
                key={i}
                className="absolute h-[3px] w-[3px] rounded-full bg-[#A3B18A]"
                initial={{ left: `${p.sx}%`, top: `${p.sy}%`, opacity: 0 }}
                animate={{ left: `${p.gx}%`, top: `${p.gy}%`, opacity: phase === 'reveal' ? 0 : 0.85 }}
                transition={{ duration: 0.9, delay: p.d, ease: [0.22, 1, 0.36, 1] }}
              />
            ))}

            {/* field boundaries drawing themselves (P1) */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              {[
                'M12 78 L34 26 L58 34 L48 82 Z',
                'M58 34 L82 22 L92 60 L66 74 L48 82',
                'M12 78 L48 82 L66 74',
              ].map((d, i) => (
                <motion.path
                  key={i} d={d} fill="none"
                  stroke={i === 0 ? '#818B54' : i === 1 ? '#354A29' : '#C0562A'}
                  strokeWidth="0.35"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: phase === 'grid' ? 0 : 1, opacity: phase === 'grid' ? 0 : 0.9 }}
                  transition={{ duration: 1.1, delay: i * 0.18, ease: 'easeInOut' }}
                />
              ))}
            </svg>
          </motion.div>

          {/* ------------------------------------------ P2 kinetic words */}
          <div className="absolute inset-0 grid place-items-center">
            <AnimatePresence>
              {(phase === 'words' || phase === 'converge') && (
                <motion.div
                  key="words" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center gap-5"
                >
                  {WORDS.map((item, i) => (
                    <motion.div
                      key={item.w}
                      initial={{ opacity: 0, y: 18, letterSpacing: '0.4em' }}
                      animate={{ opacity: phase === 'converge' ? 0.4 : 1, y: 0, letterSpacing: '0.14em' }}
                      transition={{ delay: i * 0.28, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-center gap-4"
                    >
                      <span className="font-display text-2xl font-semibold text-[#F6F5F1] sm:text-3xl">{item.w}</span>
                      {/* word morphs into its tiny data viz */}
                      <motion.svg
                        width="72" height="22" viewBox="0 0 72 22"
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.28 + 0.22, duration: 0.4 }}
                      >
                        <polyline
                          points={item.viz.map((v, x) => `${x * 13 + 4},${20 - v * 1.7}`).join(' ')}
                          fill="none" stroke={i === 3 ? '#C0562A' : '#818B54'} strokeWidth="1.6" strokeLinecap="round"
                        />
                      </motion.svg>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ------------------------------------------ P3 converging streams */}
          {(phase === 'converge' || phase === 'reveal') && (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
              {[[-4, 18], [104, 26], [-4, 82], [104, 74], [40, -4], [62, 104]].map(([x, y], i) => (
                <motion.line
                  key={i} x1={x} y1={y} x2={50} y2={50}
                  stroke={i % 2 ? '#C0562A' : '#818B54'} strokeWidth="0.16" strokeDasharray="1.6 2.2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: phase === 'reveal' ? 0 : [0, 0.9, 0.35] }}
                  transition={{ duration: 1.2, delay: i * 0.08 }}
                />
              ))}
            </svg>
          )}
          {phase === 'converge' && (
            <motion.span
              className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#818B54]/25 blur-2xl"
              initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1.6, opacity: 1 }} transition={{ duration: 1.2 }}
              aria-hidden
            />
          )}

          {/* ------------------------------------------ P4 brand reveal */}
          <AnimatePresence>
            {phase === 'reveal' && (
              <motion.div
                key="reveal"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.55 }}
                className="absolute inset-0 grid place-items-center px-6 text-center"
              >
                <div>
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0, rotate: -12 }} animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                    className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br from-[#354A29] to-[#10160a] text-2xl shadow-[0_0_60px_rgba(129,139,84,0.35)]"
                    aria-hidden
                  >
                    🌾
                  </motion.span>
                  <motion.h1
                    initial={{ opacity: 0, letterSpacing: '0.5em', y: 14 }}
                    animate={{ opacity: 1, letterSpacing: '0.18em', y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="font-display text-4xl font-semibold text-[#F6F5F1] sm:text-6xl"
                  >
                    AGRISMART
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.6 }}
                    className="mt-4 text-sm font-medium tracking-wide text-[#A3B18A] sm:text-base"
                  >
                    From Land to Better Decisions.
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ------------------------------------------------------ skip */}
          <button
            onClick={skip}
            className="intro-skip group absolute bottom-6 right-6 flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/75 backdrop-blur-md transition-all duration-300 hover:border-white/35 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0562A]"
          >
            Skip Intro
            <span className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden>→</span>
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
