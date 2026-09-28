'use client'

/**
 * Farm onboarding — five calm questions, 01/05 → 05/05, then "Create My Farm".
 * Writes the first land into the signed-in user's private namespace
 * (lib/myFarm → lib/userScope) and hands over to My Farm.
 */
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '@/lib/auth'
import { loadLands, makeLand, saveLands } from '@/lib/myFarm'
import { cropDb } from '@/lib/cropDb'
import { cropOf } from '@/lib/crops'
import { cn } from '@/lib/utils'
import { spring } from '@/components/ui'
import { AuthNotice } from '@/components/auth/AuthShell'

const STEPS = ['Where is your farm?', 'How much land do you have?', 'What do you grow?', 'What is your main water source?', 'What is your farming goal?'] as const

const LOCATIONS = ['Vijayawada', 'Guntur', 'Krishna district', 'West Godavari', 'East Godavari', 'Visakhapatnam', 'Kurnool', 'Nellore', 'Tirupati', 'Anantapur']
const WATER = ['Rainfed', 'Borewell', 'Canal', 'River', 'Other']
const GOALS = [
  { id: 'profit', label: 'Profit', icon: '💰', hint: 'Maximise income per acre' },
  { id: 'food', label: 'Food', icon: '🍚', hint: 'Grow for the family first' },
  { id: 'commercial', label: 'Commercial Farming', icon: '🏭', hint: 'Scale into a business' },
  { id: 'learning', label: 'Learning / Starting Farming', icon: '🎓', hint: 'First season, guided' },
]

export default function OnboardingPage() {
  const { user, ready, meta } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [location, setLocation] = useState(meta.location && LOCATIONS.includes(meta.location) ? meta.location : LOCATIONS[0]!)
  const [acres, setAcres] = useState('2.0')
  const [crop, setCrop] = useState('paddy')
  const [water, setWater] = useState('Borewell')
  const [goal, setGoal] = useState('profit')
  const [busy, setBusy] = useState(false)
  const [explore, setExplore] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const acreNum = parseFloat(acres)
  const canNext = useMemo(() => {
    if (step === 1) return !!acreNum && acreNum > 0 && acreNum <= 500
    return true
  }, [step, acreNum])

  const finish = () => {
    setBusy(true)
    const info = cropOf(crop)
    const db = cropDb.find((c) => c.key === crop)!
    const land = makeLand({
      name: 'Land 01',
      location,
      acres: acreNum || 1,
      crop: info.label,
      soil: db.soils[0] === 'black' ? 'Black cotton soil' : db.soils[0] === 'red' ? 'Red soil' : 'Alluvial soil',
      irrigation: water,
    })
    const existing = loadLands()
    saveLands(existing.source === 'mine' ? [...existing.list, land] : [land])
    window.dispatchEvent(new Event('agrismart:plan-change'))
    setBusy(false)
    router.push('/farm')
  }

  const signedOut = ready && !user && !explore

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-hero-glow" aria-hidden />
      <div className="vlines pointer-events-none absolute inset-0 -z-10 opacity-40" aria-hidden />

      <div className="w-full max-w-lg">
        {/* progress */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-leaf-gradient text-base shadow-glow" aria-hidden>🌾</span>
            <span className="font-display text-sm font-black tracking-tight">AgriSmart</span>
          </Link>
          <p className="font-display text-sm font-semibold tabular-nums text-muted">
            {String(step + 1).padStart(2, '0')} <span className="text-faint">/ 05</span>
          </p>
        </div>
        <div className="mb-10 flex gap-1.5" aria-hidden>
          {STEPS.map((_, i) => (
            <span key={i} className={cn('h-1 flex-1 rounded-full transition-all duration-500', i <= step ? 'bg-leaf-500' : 'bg-line/70')} />
          ))}
        </div>

        {signedOut ? (
          <div className="space-y-4">
            <h1 className="font-display text-3xl font-semibold tracking-[-0.02em]">Set up your farm</h1>
            <AuthNotice tone="info">
              Onboarding saves your farm to your private account. Sign in (or create an account)
              to continue — or try the flow in Explore mode, where nothing is tied to an account
              and data stays in this browser as labelled demo data.
            </AuthNotice>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="btn btn-primary btn-lg flex-1 justify-center">Sign in</Link>
              <Link href="/signup" className="btn btn-ghost btn-lg flex-1 justify-center">Create account</Link>
            </div>
            <button onClick={() => setExplore(true)} className="btn btn-quiet w-full justify-center">
              Continue in Explore mode
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}
              transition={spring}
            >
              <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{STEPS[step]}</h1>
              <p className="mt-2 text-sm text-muted">
                {step === 0 && 'We use this for weather, mandi prices and scheme eligibility.'}
                {step === 1 && 'You can add more lands later — this is just the first one.'}
                {step === 2 && 'Pick what you already grow, or what you are curious about.'}
                {step === 3 && 'This shapes irrigation costs and crop fit.'}
                {step === 4 && 'AgriSmart tunes recommendations to this goal.'}
              </p>

              <div className="mt-8">
                {step === 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {LOCATIONS.map((l) => (
                      <button key={l} onClick={() => setLocation(l)} aria-pressed={location === l}
                        className={cn('rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-all',
                          location === l ? 'border-leaf-500/60 bg-leaf-500/10 ring-4 ring-leaf-500/10' : 'border-line/80 bg-surface hover:border-line')}>
                        📍 {l}
                      </button>
                    ))}
                  </div>
                )}
                {step === 1 && (
                  <div>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-faint">Land size (acres)</span>
                      <input
                        type="number" min={0.1} max={500} step={0.1} value={acres}
                        onChange={(e) => setAcres(e.target.value)}
                        className="w-full rounded-2xl border border-line/80 bg-surface px-4 py-3 font-display text-2xl font-semibold tabular-nums outline-none transition-all focus:border-leaf-500/60 focus:ring-4 focus:ring-leaf-500/10"
                      />
                    </label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {['0.5', '1', '2.5', '5', '10'].map((v) => (
                        <button key={v} onClick={() => setAcres(v)} className="rounded-full border border-line/80 bg-surface px-3.5 py-1.5 text-xs font-bold transition-colors hover:border-leaf-500/50">
                          {v} ac
                        </button>
                      ))}
                    </div>
                    {(!acreNum || acreNum <= 0) && <p className="mt-2 text-xs font-semibold text-red-500">Enter a size greater than zero</p>}
                  </div>
                )}
                {step === 2 && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {cropDb.slice(0, 9).map((k) => {
                    const c = cropOf(k.key)
                    return (
                      <button key={c.key} onClick={() => setCrop(c.key)} aria-pressed={crop === c.key}
                        className={cn('rounded-2xl border px-3 py-3 text-left transition-all',
                          crop === c.key ? 'border-leaf-500/60 bg-leaf-500/10 ring-4 ring-leaf-500/10' : 'border-line/80 bg-surface hover:border-line')}>
                        <span className="block text-lg" aria-hidden>{c.icon}</span>
                        <span className="mt-1 block text-sm font-bold">{c.label}</span>
                        <span className="block text-[10px] text-muted">{k.seasonLabel}</span>
                      </button>
                    )
                  })}
                  </div>
                )}
                {step === 3 && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {WATER.map((w) => (
                      <button key={w} onClick={() => setWater(w)} aria-pressed={water === w}
                        className={cn('rounded-2xl border px-4 py-3 text-sm font-semibold transition-all',
                          water === w ? 'border-leaf-500/60 bg-leaf-500/10 ring-4 ring-leaf-500/10' : 'border-line/80 bg-surface hover:border-line')}>
                        {w === 'Rainfed' ? '🌧' : w === 'Borewell' ? '🕳' : w === 'Canal' ? '🛶' : w === 'River' ? '🏞' : '💧'} {w}
                      </button>
                    ))}
                  </div>
                )}
                {step === 4 && (
                  <div className="grid grid-cols-2 gap-2">
                    {GOALS.map((g) => (
                      <button key={g.id} onClick={() => setGoal(g.id)} aria-pressed={goal === g.id}
                        className={cn('rounded-2xl border px-4 py-3.5 text-left transition-all',
                          goal === g.id ? 'border-leaf-500/60 bg-leaf-500/10 ring-4 ring-leaf-500/10' : 'border-line/80 bg-surface hover:border-line')}>
                        <span className="block text-sm font-bold"><span aria-hidden>{g.icon}</span> {g.label}</span>
                        <span className="mt-0.5 block text-[11px] text-muted">{g.hint}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {err && <div className="mt-4"><AuthNotice tone="error">{err}</AuthNotice></div>}

              <div className="mt-10 flex items-center justify-between gap-3">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="btn btn-ghost disabled:opacity-40"
                >
                  ← Back
                </button>
                {step < 4 ? (
                  <button onClick={() => canNext && setStep((s) => s + 1)} disabled={!canNext} className="btn btn-primary btn-lg disabled:opacity-40">
                    Continue →
                  </button>
                ) : (
                  <button onClick={finish} disabled={busy} className="btn btn-primary btn-lg">
                    {busy ? 'Creating…' : '🌱 Create My Farm'}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
