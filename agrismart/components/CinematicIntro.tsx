'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { seeded } from '@/lib/utils'

/*
 * AgriSmart 2.0 — cinematic opening (~5.8s, skippable).
 *
 * SCENE 1  dark earth, drifting soil dust, a glowing seed, the four-line poem
 * SCENE 2  the seed drops, roots reach down, a plant grows
 * SCENE 3  the camera pulls back — one plant becomes a field, with sun,
 *          irrigation lines, wind-swayed crops and a farmer silhouette
 * SCENE 4  the AgriSmart logo emerges out of the field
 * SCENE 5  the logo settles upward as the app fades in behind it
 *
 * Scenes 2 and 3 share ONE evolving SVG stage instead of cutting, so the
 * pull-back reads as a single continuous camera move.
 *
 * Performance: ~26 particles, transform/opacity-only animation, no canvas, no
 * per-frame React state. The whole overlay unmounts when finished.
 */

const TIMELINE = [
  { at: 0, phase: 0 },      // scene 1 — seed + poem
  { at: 2000, phase: 1 },   // scene 2 — seed falls, plant grows
  { at: 3200, phase: 2 },   // scene 3 — pull back to field
  { at: 4400, phase: 3 },   // scene 4 — logo emerges
  { at: 5200, phase: 4 },   // scene 5 — logo lifts, app reveals
]
const TOTAL = 5800

const POEM = ['A SEED', 'BECOMES A CROP', 'A CROP BECOMES', 'LIFE']

export default function CinematicIntro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const timers = useRef<number[]>([])
  const done = useRef(false)

  const finish = useCallback(() => {
    if (done.current) return
    done.current = true
    timers.current.forEach(clearTimeout)
    setLeaving(true)
    // Let the logo settle before handing over to the app.
    window.setTimeout(onDone, 520)
  }, [onDone])

  useEffect(() => {
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { finish(); return }

    TIMELINE.forEach(({ at, phase: p }) => {
      timers.current.push(window.setTimeout(() => setPhase(p), at))
    })
    timers.current.push(window.setTimeout(finish, TOTAL))
    return () => timers.current.forEach(clearTimeout)
  }, [finish])

  // Soil dust — deterministic so SSR markup matches the client.
  const dust = useMemo(() => {
    const rnd = seeded(20260923)
    return Array.from({ length: 26 }, (_, i) => ({
      id: i,
      left: rnd() * 100,
      bottom: -8 + rnd() * 30,
      size: 1.5 + rnd() * 3,
      delay: rnd() * 9,
      dur: 8 + rnd() * 7,
      opacity: 0.18 + rnd() * 0.42,
    }))
  }, [])

  // Field rows for the pull-back shot.
  const rows = useMemo(() => {
    const rnd = seeded(77)
    return Array.from({ length: 34 }, (_, i) => ({
      id: i,
      x: 8 + (i % 17) * 23 + (i > 16 ? 11 : 0),
      y: i > 16 ? 236 : 214,
      s: i > 16 ? 0.62 : 0.48,
      delay: rnd() * 1.6,
      sway: 4 + rnd() * 2.6,
    }))
  }, [])

  return (
    <AnimatePresence>
      {!leaving && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[100] overflow-hidden bg-[#060f0a]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          role="status"
          aria-label="AgriSmart opening animation"
        >
          {/* Earthy depth: two radial glows + noise, no images */}
          <div className="absolute inset-0" aria-hidden
            style={{
              background:
                'radial-gradient(70% 55% at 50% 62%, #123122 0%, #0a1a12 45%, #050d09 100%)',
            }}
          />
          <div className="bg-noise absolute inset-0 opacity-60" aria-hidden />
          <motion.div className="absolute inset-0" aria-hidden
            animate={{ opacity: phase >= 2 ? 0.85 : 0.25 }}
            transition={{ duration: 1.6 }}
            style={{
              background:
                'radial-gradient(45% 40% at 78% 18%, rgba(226,190,110,0.28) 0%, transparent 62%)',
            }}
          />

          {/* Drifting soil dust */}
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {dust.map((d) => (
              <span
                key={d.id}
                className="absolute rounded-full bg-earth-200"
                style={{
                  left: `${d.left}%`, bottom: `${d.bottom}%`,
                  width: d.size, height: d.size, opacity: d.opacity,
                  animation: `driftUp ${d.dur}s linear ${d.delay}s infinite`,
                }}
              />
            ))}
          </div>

          {/* ---------------- SCENE 1: the poem ---------------- */}
          <div className="absolute inset-0 grid place-items-center px-6">
            <div className="relative h-40 w-full max-w-md">
              <AnimatePresence>
                {phase === 0 &&
                  POEM.map((line, i) => (
                    <motion.div
                      key={line}
                      className="absolute inset-0 grid place-items-center"
                      initial={{ opacity: 0, y: 16, filter: 'blur(7px)' }}
                      animate={{
                        opacity: [0, 1, 1, 0],
                        y: [16, 0, 0, -12],
                        filter: ['blur(7px)', 'blur(0px)', 'blur(0px)', 'blur(7px)'],
                      }}
                      transition={{ duration: 0.98, times: [0, 0.22, 0.66, 1], delay: i * 0.3, ease: 'easeInOut' }}
                    >
                      <span
                        className={cnPoem(i)}
                        style={{ letterSpacing: i === 3 ? '0.22em' : '0.16em' }}
                      >
                        {line}
                      </span>
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          </div>

          {/* ---------------- SCENES 2–3: one evolving stage ---------------- */}
          <motion.div
            className="absolute inset-0 grid place-items-center"
            animate={{
              opacity: phase === 0 ? 0 : 1,
              scale: phase <= 1 ? 1.55 : 1,
              y: phase >= 3 ? -6 : 0,
            }}
            transition={{ duration: phase === 2 ? 1.5 : 1, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden
          >
            <svg viewBox="0 0 400 300" className="h-full w-full max-w-3xl" preserveAspectRatio="xMidYMid meet">
              <defs>
                <radialGradient id="seedGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f2d68a" stopOpacity="0.95" />
                  <stop offset="45%" stopColor="#d4a537" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#d4a537" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="stemG" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#157a48" />
                  <stop offset="100%" stopColor="#4bb37c" />
                </linearGradient>
                <linearGradient id="soilG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4a3524" />
                  <stop offset="100%" stopColor="#241a12" />
                </linearGradient>
                <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e6bf5c" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#e6bf5c" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Sun wash — only reads once we pull back */}
              <motion.rect x="0" y="0" width="400" height="215" fill="url(#skyG)"
                animate={{ opacity: phase >= 2 ? 1 : 0 }} transition={{ duration: 1.2 }} />

              {/* Soil bed */}
              <motion.g animate={{ opacity: phase >= 1 ? 1 : 0 }} transition={{ duration: 0.7 }}>
                <path d="M0 232 Q200 214 400 232 L400 300 L0 300 Z" fill="url(#soilG)" opacity="0.92" />
                <path d="M0 232 Q200 214 400 232" stroke="#6f5235" strokeWidth="1.6" fill="none" opacity="0.8" />
              </motion.g>

              {/* Irrigation channels — appear with the field */}
              <motion.g animate={{ opacity: phase >= 2 ? 0.55 : 0 }} transition={{ duration: 1 }}>
                {[248, 266, 284].map((y) => (
                  <motion.line key={y} x1="0" x2="400" y1={y} y2={y}
                    stroke="#3b8fd4" strokeWidth="1" strokeDasharray="6 8" opacity="0.5"
                    initial={{ pathLength: 0 }} animate={phase >= 2 ? { pathLength: 1 } : {}}
                    transition={{ duration: 1.6, delay: 0.2 }} />
                ))}
              </motion.g>

              {/* Field rows — the "one plant becomes many" moment */}
              {rows.map((r) => (
                <motion.g key={r.id}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
                  transition={{ duration: 0.8, delay: r.delay * 0.35, ease: [0.22, 1, 0.36, 1] }}
                  style={{ originX: `${r.x}px`, originY: `${r.y}px` }}
                >
                  <g style={{ animation: `sway ${r.sway}s ease-in-out ${r.delay}s infinite`, transformOrigin: `${r.x}px ${r.y}px` }}>
                    <line x1={r.x} y1={r.y} x2={r.x} y2={r.y - 16 * r.s * 2} stroke="#2aa468" strokeWidth={1.6 * r.s * 2} strokeLinecap="round" />
                    <ellipse cx={r.x - 4 * r.s * 2} cy={r.y - 12 * r.s * 2} rx={4.5 * r.s * 2} ry={2.4 * r.s * 2} fill="#4bb37c" transform={`rotate(-28 ${r.x - 4 * r.s * 2} ${r.y - 12 * r.s * 2})`} />
                    <ellipse cx={r.x + 4 * r.s * 2} cy={r.y - 14 * r.s * 2} rx={4.5 * r.s * 2} ry={2.4 * r.s * 2} fill="#22965c" transform={`rotate(28 ${r.x + 4 * r.s * 2} ${r.y - 14 * r.s * 2})`} />
                  </g>
                </motion.g>
              ))}

              {/* Farmer silhouette — small, far, unhurried */}
              <motion.g
                initial={{ opacity: 0, x: 18 }}
                animate={phase >= 2 ? { opacity: 0.85, x: 0 } : { opacity: 0, x: 18 }}
                transition={{ duration: 1.3, delay: 0.5 }}
              >
                <g fill="#0a1a12" stroke="#0a1a12" strokeWidth="2.4" strokeLinecap="round">
                  <circle cx="322" cy="196" r="5.4" stroke="none" />
                  <path d="M322 201 L322 216" fill="none" />
                  <path d="M322 205 L314 212 M322 205 L331 200" fill="none" />
                  <path d="M322 216 L317 228 M322 216 L327 228" fill="none" />
                  <path d="M313 190 Q322 185 331 190" fill="none" strokeWidth="2" />
                  <line x1="331" y1="200" x2="337" y2="186" strokeWidth="1.8" />
                </g>
              </motion.g>

              {/* THE SEED — glows, then drops */}
              <motion.g
                animate={{
                  y: phase >= 1 ? 44 : 0,
                  opacity: phase >= 1 ? 0 : 1,
                  scale: phase >= 1 ? 0.6 : 1,
                }}
                transition={{ duration: phase >= 1 ? 0.85 : 1, ease: phase >= 1 ? [0.5, 0, 0.75, 0.4] : 'easeOut' }}
                style={{ originX: '200px', originY: '176px' }}
              >
                <circle cx="200" cy="176" r="46" fill="url(#seedGlow)">
                  <animate attributeName="r" values="40;52;40" dur="3.2s" repeatCount="indefinite" />
                </circle>
                <ellipse cx="200" cy="176" rx="9" ry="12.5" fill="#e6bf5c" transform="rotate(-18 200 176)" />
                <ellipse cx="198" cy="173" rx="3.4" ry="5" fill="#fff4d6" opacity="0.75" transform="rotate(-18 198 173)" />
              </motion.g>

              {/* Impact ripple where the seed lands */}
              {phase >= 1 && (
                <motion.circle cx="200" cy="232" r="10" fill="none" stroke="#d4a537" strokeWidth="2"
                  initial={{ opacity: 0.8, scale: 0.3 }}
                  animate={{ opacity: 0, scale: 4 }}
                  transition={{ duration: 1.1, ease: 'easeOut' }}
                  style={{ originX: '200px', originY: '232px' }}
                />
              )}

              {/* ROOTS — reach down after the seed lands */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={phase >= 1 ? { opacity: 0.75 } : { opacity: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                stroke="#6f5235" strokeWidth="1.8" fill="none" strokeLinecap="round"
              >
                {[
                  'M200 234 C198 250 190 262 182 274',
                  'M200 234 C202 252 210 264 218 276',
                  'M200 234 C200 254 200 268 200 282',
                  'M200 244 C194 252 188 256 180 258',
                  'M200 248 C207 256 213 259 221 261',
                ].map((d, i) => (
                  <motion.path key={i} d={d}
                    initial={{ pathLength: 0 }}
                    animate={phase >= 1 ? { pathLength: 1 } : { pathLength: 0 }}
                    transition={{ duration: 1.1, delay: 0.55 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  />
                ))}
              </motion.g>

              {/* THE PLANT — grows up out of the soil */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.35, delay: 0.35 }}
              >
                <motion.path d="M200 232 C200 210 198 194 200 168" stroke="url(#stemG)" strokeWidth="4.2"
                  fill="none" strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={phase >= 1 ? { pathLength: 1 } : { pathLength: 0 }}
                  transition={{ duration: 1.05, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
                {/* Leaves unfurl in pairs */}
                {[
                  { d: 'M200 210 C186 206 176 196 172 184 C186 184 197 194 200 210', delay: 1.0, fill: '#22965c' },
                  { d: 'M200 202 C214 198 224 188 228 176 C214 176 203 186 200 202', delay: 1.14, fill: '#4bb37c' },
                  { d: 'M200 188 C188 184 180 176 177 166 C188 166 197 174 200 188', delay: 1.3, fill: '#2aa468' },
                  { d: 'M200 180 C212 176 220 168 223 158 C212 158 203 166 200 180', delay: 1.44, fill: '#7fcfa4' },
                ].map((l, i) => (
                  <motion.path key={i} d={l.d} fill={l.fill}
                    initial={{ opacity: 0, scale: 0.2 }}
                    animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.2 }}
                    transition={{ duration: 0.75, delay: l.delay, ease: [0.22, 1, 0.36, 1] }}
                    style={{ originX: '200px', originY: `${200 - i * 8}px` }}
                  />
                ))}
                {/* Grain head at the tip */}
                <motion.g
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.3 }}
                  transition={{ duration: 0.7, delay: 1.7, ease: [0.22, 1, 0.36, 1] }}
                  style={{ originX: '200px', originY: '166px' }}
                >
                  {[0, 1, 2, 3].map((i) => (
                    <ellipse key={i} cx={200} cy={162 - i * 5} rx={4.6 - i * 0.7} ry={3}
                      fill={i % 2 ? '#d4a537' : '#e6bf5c'} />
                  ))}
                </motion.g>
              </motion.g>
            </svg>
          </motion.div>

          {/* ---------------- SCENE 4–5: the logo ---------------- */}
          <motion.div
            className="absolute inset-0 grid place-items-center px-6"
            animate={{
              opacity: phase >= 3 ? 1 : 0,
              scale: phase >= 4 ? 0.42 : 1,
              y: phase >= 4 ? '-30vh' : '0vh',
            }}
            transition={{ duration: phase >= 4 ? 0.75 : 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-col items-center text-center">
              <motion.div
                className="relative mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-leaf-gradient shadow-glow sm:h-24 sm:w-24"
                initial={{ opacity: 0, scale: 0.5, rotate: -12 }}
                animate={phase >= 3 ? { opacity: 1, scale: 1, rotate: 0 } : {}}
                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="absolute inset-0 rounded-3xl bg-leaf-400/40" style={{ animation: 'pulseRing 2.4s ease-out infinite' }} aria-hidden />
                <span className="relative text-4xl sm:text-5xl" aria-hidden>🌾</span>
              </motion.div>

              <motion.h1
                className="font-display text-4xl font-black tracking-tight text-white sm:text-6xl"
                initial={{ opacity: 0, y: 22, filter: 'blur(10px)' }}
                animate={phase >= 3 ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
                transition={{ duration: 0.9, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
              >
                AGRISMART
              </motion.h1>

              <motion.div
                className="mt-3 flex items-center gap-3"
                initial={{ opacity: 0, scaleX: 0.3 }}
                animate={phase >= 3 ? { opacity: 1, scaleX: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <span className="h-px w-8 bg-gold-400/70" aria-hidden />
                <span className="text-[11px] font-bold uppercase tracking-[0.34em] text-gold-300 sm:text-xs">
                  AI-Powered Farming
                </span>
                <span className="h-px w-8 bg-gold-400/70" aria-hidden />
              </motion.div>
            </div>
          </motion.div>

          {/* Skip — bottom-right, always reachable */}
          <button
            onClick={finish}
            className="group absolute bottom-5 right-5 z-10 flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white/75 backdrop-blur-md transition-all duration-300 hover:border-white/35 hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-gold-400"
          >
            Skip intro
            <span className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden>→</span>
          </button>

          {/* Timeline progress */}
          <div className="absolute bottom-0 left-0 h-[3px] w-full bg-white/10" aria-hidden>
            <motion.div
              className="h-full bg-gradient-to-r from-leaf-400 via-leaf-300 to-gold-400"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: TOTAL / 1000, ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function cnPoem(i: number): string {
  const base = 'font-display text-center font-black uppercase'
  if (i === 3)
    return `${base} text-4xl text-gradient-gold sm:text-6xl`
  return `${base} text-xl text-white/90 sm:text-3xl`
}
