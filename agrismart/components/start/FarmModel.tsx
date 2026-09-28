'use client'

/**
 * The living farm model (motion spec §8).
 *
 * Every wizard answer adds a layer to one visual farm the user is literally
 * constructing:
 *
 *   Location → a pin lands on the map
 *   Land size → the farm boundary expands with acreage
 *   Soil     → a soil stratum appears under the field
 *   Water    → an irrigation flow runs into the plot
 *   Budget   → a financial indicator rises
 *   Season   → the whole model takes the season's light
 *
 * Calm cubic-bezier motion only; layers leave as gracefully as they arrive.
 */
import { motion, AnimatePresence } from 'framer-motion'
import type { FarmPlan } from '@/lib/farmPlan'
import { inr } from '@/lib/utils'

const CINE = [0.22, 1, 0.36, 1] as const

const SOIL_COLOR: Record<string, string> = {
  black: '#2b2118', red: '#8a4b2f', alluvial: '#b98a4f', sandy: '#d3b98a', clay: '#6b5648', loamy: '#7a5c3e', unknown: '#8a8f98',
}

function seasonOf(iso: string): { id: 'kharif' | 'rabi' | 'summer'; tint: string; glyph: string; label: string } {
  const m = new Date(iso).getMonth() + 1
  if (m >= 6 && m <= 9) return { id: 'kharif', tint: 'rgba(53,74,41,0.28)', glyph: '🌧', label: 'Kharif · monsoon' }
  if (m >= 10 || m <= 1) return { id: 'rabi', tint: 'rgba(95,125,149,0.25)', glyph: '❄', label: 'Rabi · winter' }
  return { id: 'summer', tint: 'rgba(185,138,47,0.25)', glyph: '☀', label: 'Summer · warm' }
}

export default function FarmModel({ p, acres, startDate }: { p: FarmPlan; acres: number; startDate: string }) {
  const hasLoc = !!p.location.village.trim() || !!p.location.district.trim() || p.location.lat != null
  const hasLand = acres > 0
  const hasSoil = !!p.soil
  const hasWater = !!p.waterSource
  const hasBudget = p.budget.amount > 0
  const season = seasonOf(startDate)

  // boundary width grows with acreage (sqrt so 50ac doesn't dwarf 0.5ac)
  const bw = hasLand ? 120 + Math.min(1, Math.sqrt(acres) / 8) * 300 : 0
  const budgetW = hasBudget ? 40 + Math.min(1, Math.log10(Math.max(10, p.budget.amount)) / 6) * 140 : 0

  return (
    <div className="relative mb-5 overflow-hidden rounded-2xl border border-line/60 bg-surface-2/50 dark:bg-black/20" aria-hidden>
      <svg viewBox="0 0 600 170" className="h-40 w-full sm:h-44">
        {/* ground */}
        <rect x="0" y="0" width="600" height="170" fill="transparent" />
        <motion.rect x="0" y="120" width="600" height="50" fill="hsl(var(--leaf-500) / 0.08)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />

        {/* season light */}
        <AnimatePresence>
          {hasLoc && (
            <motion.rect key="season" x="0" y="0" width="600" height="170" fill={season.tint}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.0, ease: CINE }} />
          )}
        </AnimatePresence>

        {/* location pin */}
        <AnimatePresence>
          {hasLoc && (
            <motion.g key="pin" initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: CINE }}>
              <circle cx="300" cy="78" r="4" fill="hsl(var(--leaf-500))" />
              <motion.circle cx="300" cy="78" r="4" fill="none" stroke="hsl(var(--leaf-500))" strokeWidth="1"
                initial={{ r: 4, opacity: 0.8 }} animate={{ r: 22, opacity: 0 }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }} />
              <text x="312" y="74" fontSize="10" fill="currentColor" opacity="0.65">
                {p.location.village || p.location.district || 'your village'}
              </text>
            </motion.g>
          )}
        </AnimatePresence>

        {/* farm boundary — expands with acreage */}
        <AnimatePresence>
          {hasLand && (
            <motion.rect
              key="boundary"
              x={300 - bw / 2} y={58} width={bw} height={64} rx={10}
              fill="hsl(var(--leaf-400) / 0.10)" stroke="hsl(var(--leaf-500))" strokeWidth="1.6"
              initial={{ opacity: 0, width: 60, x: 270 }}
              animate={{ opacity: 1, width: bw, x: 300 - bw / 2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: CINE }}
            />
          )}
        </AnimatePresence>
        {hasLand && (
          <text x={300 - bw / 2 + 8} y={74} fontSize="10" fontWeight="700" fill="currentColor" opacity="0.7">
            {acres} ac
          </text>
        )}

        {/* soil stratum */}
        <AnimatePresence>
          {hasSoil && (
            <motion.rect key="soil" x={300 - bw / 2 + 6} y={104} width={Math.max(0, bw - 12)} height={14} rx={4}
              fill={SOIL_COLOR[p.soil] ?? SOIL_COLOR.unknown}
              initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 0.9, scaleY: 1 }} exit={{ opacity: 0, scaleY: 0 }}
              style={{ originY: 0 }} transition={{ duration: 0.7, ease: CINE }} />
          )}
        </AnimatePresence>

        {/* irrigation flow */}
        <AnimatePresence>
          {hasWater && bw > 0 && (
            <motion.path key="water"
              d={`M${300 - bw / 2 - 60} 96 C ${300 - bw / 2 - 20} 96, ${300 - bw / 2 - 10} 92, ${300 - bw / 2 + 10} 92 L ${300 + bw / 2 - 14} 92`}
              fill="none" stroke="#5F7D95" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 8"
              initial={{ opacity: 0 }} animate={{ opacity: 0.85, strokeDashoffset: [0, -56] }} exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 0.6 }, strokeDashoffset: { duration: 2.4, repeat: Infinity, ease: 'linear' } }} />
          )}
        </AnimatePresence>
        {hasWater && (
          <text x={300 - bw / 2 - 58} y={88} fontSize="9" fill="currentColor" opacity="0.6">💧 {p.waterSource}</text>
        )}

        {/* budget indicator */}
        <AnimatePresence>
          {hasBudget && (
            <motion.g key="budget" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, ease: CINE }}>
              <rect x="452" y="30" width="120" height="26" rx="13" fill="hsl(var(--ink) / 0.06)" />
              <motion.rect x="452" y="30" height="26" rx="13" fill="hsl(var(--leaf-500) / 0.25)"
                initial={{ width: 0 }} animate={{ width: budgetW * 0.8 }} transition={{ duration: 0.9, ease: CINE }} />
              <text x="462" y="47" fontSize="10" fontWeight="700" fill="currentColor" opacity="0.8">
                💰 {inr(p.budget.amount)}{p.budget.perAcre ? '/ac' : ''}
              </text>
            </motion.g>
          )}
        </AnimatePresence>

        {/* season chip */}
        <AnimatePresence>
          {hasLoc && (
            <motion.g key="season-chip" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, delay: 0.15, ease: CINE }}>
              <rect x="28" y="26" width="118" height="24" rx="12" fill="hsl(var(--ink) / 0.06)" />
              <text x="40" y="42" fontSize="10" fontWeight="600" fill="currentColor" opacity="0.75">
                {season.glyph} {season.label}
              </text>
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
      <p className="border-t border-line/50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-faint">
        Your farm model — building as you answer
      </p>
    </div>
  )
}
