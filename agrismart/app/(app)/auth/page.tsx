'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Avatar, Card, Chip, Reveal, spring } from '@/components/ui'
import { farmer, roles } from '@/lib/data'
import { cn } from '@/lib/utils'

const ROLE_KEY = 'agrismart-role'

/** Where each role lands after signing in. */
const landing: Record<string, string> = {
  farmer: '/dashboard', buyer: '/marketplace', expert: '/community',
  provider: '/agrirent', admin: '/admin',
}

export default function AuthPage() {
  const router = useRouter()
  const [role, setRole] = useState('farmer')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [stage, setStage] = useState<'form' | 'otp'>('form')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const selected = roles.find((r) => r.id === role)!

  const finish = (asDemo: boolean) => {
    try {
      sessionStorage.setItem(ROLE_KEY, asDemo ? 'farmer' : role)
    } catch { /* private mode — the app still works, it just will not remember */ }
    router.push(asDemo ? '/dashboard' : landing[role] ?? '/dashboard')
  }

  const sendOtp = () => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) return setErr('Enter a 10-digit mobile number')
    setErr(null); setStage('otp')
  }

  const verify = () => {
    if (otp.replace(/\D/g, '').length < 4) return setErr('Enter the 4-digit code')
    setErr(null); setBusy(true)
    setTimeout(() => finish(false), 900)
  }

  const demoSignIn = () => {
    setBusy(true)
    setTimeout(() => finish(true), 900)
  }

  return (
    <div className="section">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="mb-6 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-leaf-gradient text-2xl shadow-glow" aria-hidden>
              🌾
            </span>
            <h1 className="mt-4 font-display text-3xl font-black tracking-tight sm:text-4xl">
              {mode === 'signin' ? 'Welcome back' : 'Join AgriSmart'}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted sm:text-base">
              Pick the role that describes you. Each one opens a different view of the platform.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
          {/* -------------------------------------------------------- roles */}
          <div className="space-y-3">
            {roles.map((r, i) => {
              const on = role === r.id
              return (
                <Reveal key={r.id} delay={i * 0.06}>
                  <button onClick={() => { setRole(r.id); setStage('form'); setErr(null) }}
                    aria-pressed={on}
                    className={cn('card w-full text-left transition-all duration-300',
                      on ? 'border-leaf-400/70 shadow-glow' : 'card-hover')}>
                    <div className="flex items-start gap-3.5">
                      <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl transition-colors',
                        on ? 'bg-leaf-gradient text-white' : 'bg-leaf-400/10')} aria-hidden>
                        {r.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-display font-black leading-tight">{r.label}</h2>
                          {on && <Chip tone="live">Selected</Chip>}
                          {r.id === 'farmer' && <Chip tone="demo">Demo account ready</Chip>}
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-muted">{r.blurb}</p>
                        <p className="mt-1.5 text-[11px] font-semibold text-faint">
                          Lands on {landing[r.id]}
                        </p>
                      </div>
                    </div>
                  </button>
                </Reveal>
              )
            })}
          </div>

          {/* ------------------------------------------------------- sign in */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal delay={0.1}>
              <Card>
                <div className="mb-4 flex gap-1.5 rounded-2xl bg-line/30 p-1">
                  {(['signin', 'signup'] as const).map((m) => (
                    <button key={m} onClick={() => setMode(m)}
                      className={cn('flex-1 rounded-xl px-3 py-2 text-xs font-bold transition-all',
                        mode === m ? 'bg-surface shadow-soft' : 'text-muted hover:text-ink')}>
                      {m === 'signin' ? 'Sign in' : 'Create account'}
                    </button>
                  ))}
                </div>

                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-line/60 bg-surface/50 p-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-leaf-gradient text-lg text-white" aria-hidden>
                    {selected.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{selected.label}</p>
                    <p className="truncate text-[11px] text-muted">{selected.blurb}</p>
                  </div>
                </div>

                {stage === 'form' ? (
                  <div className="space-y-3.5">
                    <label className="block">
                      <span className="label">Mobile number</span>
                      <div className="flex">
                        <span className="grid shrink-0 place-items-center rounded-l-2xl border border-r-0 border-line/70 bg-line/20 px-3 text-sm font-bold text-muted">
                          +91
                        </span>
                        <input className="input !rounded-l-none" type="tel" inputMode="numeric"
                          value={phone} onChange={(e) => setPhone(e.target.value)}
                          placeholder="98xxx xx210" aria-label="Mobile number" />
                      </div>
                    </label>

                    {mode === 'signup' && (
                      <label className="block">
                        <span className="label">Full name</span>
                        <input className="input" placeholder={farmer.name} />
                        <span className="mt-1 block text-[11px] text-faint">Optional in the demo.</span>
                      </label>
                    )}

                    <button onClick={sendOtp} disabled={busy} className="btn btn-primary w-full disabled:opacity-60">
                      {busy ? 'Please wait…' : 'Send OTP'}
                    </button>

                    <div className="relative my-1 text-center">
                      <span className="hairline absolute left-0 top-1/2 w-full" aria-hidden />
                      <span className="relative bg-[hsl(var(--surface))] px-2 text-[11px] font-bold uppercase tracking-wider text-faint">or</span>
                    </div>

                    <button onClick={demoSignIn} disabled={busy}
                      className="btn btn-ghost w-full disabled:opacity-60">
                      ⚡ Continue with the demo farmer account
                    </button>
                    <p className="text-center text-[11px] leading-snug text-faint">
                      Skips verification and opens {farmer.name}&rsquo;s dashboard with all sample data loaded.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <p className="text-sm text-muted">
                      Enter the code sent to <span className="font-bold text-ink">+91 {phone}</span>.
                    </p>
                    <label className="block">
                      <span className="label">4-digit OTP</span>
                      <input className="input text-center font-display text-2xl font-black tracking-[0.5em]"
                        type="text" inputMode="numeric" maxLength={6} value={otp}
                        onChange={(e) => setOtp(e.target.value)} placeholder="••••" aria-label="OTP" />
                      <span className="mt-1 block text-[11px] text-faint">
                        Any 4 digits work — no message is actually sent.
                      </span>
                    </label>

                    <button onClick={verify} disabled={busy} className="btn btn-primary w-full disabled:opacity-60">
                      {busy ? 'Verifying…' : `Verify & continue as ${selected.label}`}
                    </button>
                    <button onClick={() => { setStage('form'); setErr(null) }} className="btn btn-quiet w-full">
                      ← Change number
                    </button>
                  </div>
                )}

                {err && (
                  <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-3 rounded-2xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-500">
                    {err}
                  </motion.p>
                )}

                <div className="mt-5 rounded-2xl border border-gold-400/35 bg-gold-400/10 p-3.5 text-xs leading-relaxed text-muted">
                  <p className="mb-1 font-bold text-gold-600 dark:text-gold-400">◆ No real authentication</p>
                  This is a UI prototype. No OTP is sent, no password is checked, no session is created on
                  a server and nothing you type is stored or transmitted. The role you pick is kept in this
                  browser tab so navigation feels right during the demo.
                </div>
              </Card>
            </Reveal>

            <Reveal delay={0.18}>
              <Card className="mt-4">
                <h2 className="text-sm font-bold">Just exploring?</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Every page is reachable without signing in — this screen exists to show how role-based
                  access would work, not to gate the demo.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/dashboard" className="btn btn-ghost btn-sm">Go to dashboard</Link>
                  <Link href="/demo" className="btn btn-quiet btn-sm">Guided tour</Link>
                </div>
              </Card>
            </Reveal>
          </div>
        </div>

        {busy && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-[hsl(var(--bg))]/80 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="status" aria-live="polite">
            <div className="text-center">
              <div className="mx-auto flex items-end justify-center gap-1.5" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <motion.span key={i} className="h-3 w-3 rounded-full bg-leaf-500"
                    animate={{ y: [0, -12, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.12 }} />
                ))}
              </div>
              <p className="mt-4 text-sm font-bold">Signing you in as {role === 'farmer' ? farmer.name : selected.label}…</p>
              <div className="mx-auto mt-3 flex items-center justify-center gap-2">
                <Avatar seed={farmer.avatarSeed} size={28} />
                <span className="text-xs text-muted">{selected.label} · demo session</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
