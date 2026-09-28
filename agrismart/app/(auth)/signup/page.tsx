'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AuthShell, Field, GoogleButton, AuthNotice } from '@/components/auth/AuthShell'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { spring } from '@/components/ui'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const ROLES = [
  { id: 'farmer', label: 'Farmer', icon: '🌾', hint: 'I grow crops or raise livestock' },
  { id: 'student', label: 'Student / Beginner', icon: '🎓', hint: 'Learning or starting out' },
  { id: 'business', label: 'Agriculture Business', icon: '🏢', hint: 'Trader, provider or FPO' },
]

const LOCATIONS = [
  'Vijayawada', 'Guntur', 'Krishna district', 'West Godavari', 'East Godavari',
  'Visakhapatnam', 'Kurnool', 'Nellore', 'Tirupati', 'Anantapur', 'Other Andhra Pradesh',
]

export default function SignupPage() {
  const { signUp, googleSignIn, configured, ready } = useAuth()
  const router = useRouter()
  const [f, setF] = useState({ name: '', email: '', mobile: '', pw: '', pw2: '', location: LOCATIONS[0]! })
  const [role, setRole] = useState('farmer')
  const [busy, setBusy] = useState<null | 'email' | 'google'>(null)
  const [err, setErr] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [fe, setFe] = useState<Record<string, string>>({})
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    const nfe: Record<string, string> = {}
    if (f.name.trim().length < 2) nfe.name = 'Enter your full name'
    if (!EMAIL_RE.test(f.email.trim())) nfe.email = 'Enter a valid email address'
    if (f.mobile.replace(/\D/g, '').length !== 10) nfe.mobile = 'Enter a 10-digit mobile number'
    if (f.pw.length < 6) nfe.pw = 'At least 6 characters'
    if (f.pw2 !== f.pw) nfe.pw2 = 'Passwords do not match'
    setFe(nfe)
    if (Object.keys(nfe).length) return
    setBusy('email')
    const res = await signUp({
      name: f.name.trim(), email: f.email.trim(), mobile: f.mobile.replace(/\D/g, ''),
      role, location: f.location, password: f.pw,
    })
    setBusy(null)
    if (res.error) return setErr(res.error)
    if (res.needsConfirm) return setConfirm(true)
    router.push('/onboarding')
  }

  if (confirm) {
    return (
      <AuthShell title="Check your inbox 📬" sub="One last step before your farm comes online.">
        <div className="space-y-4">
          <AuthNotice tone="success">
            We sent a confirmation link to <strong>{f.email.trim()}</strong>. Open it on this device
            and you&rsquo;ll land straight in farm onboarding.
          </AuthNotice>
          <p className="text-xs leading-relaxed text-muted">
            Already confirmed?{' '}
            <Link href="/login" className="inline-block -my-1.5 py-1.5 font-bold text-leaf-700 underline-offset-4 hover:underline dark:text-leaf-300">Sign in</Link>.
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Let&rsquo;s get your farm started."
      sub="Create your AgriSmart account — then a two-minute onboarding sets up your first farm."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name" autoComplete="name" value={f.name} onChange={(v) => set('name', v)} placeholder="Ramesh Kumar" error={fe.name} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" type="email" inputMode="email" autoComplete="email" value={f.email} onChange={(v) => set('email', v)} placeholder="you@farm.in" error={fe.email} />
          <Field label="Mobile number" type="tel" inputMode="tel" autoComplete="tel" value={f.mobile} onChange={(v) => set('mobile', v)} placeholder="98765 43210" error={fe.mobile} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" type="password" autoComplete="new-password" value={f.pw} onChange={(v) => set('pw', v)} placeholder="••••••••" error={fe.pw} hint="6+ chars" />
          <Field label="Confirm password" type="password" autoComplete="new-password" value={f.pw2} onChange={(v) => set('pw2', v)} placeholder="••••••••" error={fe.pw2} />
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-faint">I am a…</span>
          <div className="grid gap-2 sm:grid-cols-3">
            {ROLES.map((r) => (
              <button
                key={r.id} type="button" onClick={() => setRole(r.id)}
                aria-pressed={role === r.id}
                className={cn(
                  'rounded-2xl border px-3 py-2.5 text-left transition-all',
                  role === r.id
                    ? 'border-leaf-500/60 bg-leaf-500/10 ring-4 ring-leaf-500/10'
                    : 'border-line/80 bg-surface hover:border-line',
                )}
              >
                <span className="block text-sm font-bold"><span aria-hidden>{r.icon}</span> {r.label}</span>
                <span className="mt-0.5 block text-[10px] leading-snug text-muted">{r.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-faint">Location</span>
          <select
            value={f.location} onChange={(e) => set('location', e.target.value)}
            className="w-full rounded-2xl border border-line/80 bg-surface px-4 py-3 text-sm outline-none transition-all focus:border-leaf-500/60 focus:ring-4 focus:ring-leaf-500/10"
          >
            {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>

        {err && <AuthNotice tone="error">{err}</AuthNotice>}
        {!configured && ready && (
          <AuthNotice tone="info">
            Supabase auth is not configured here —{' '}
            <Link className="underline underline-offset-2" href="/onboarding">try onboarding in Explore mode</Link>.
          </AuthNotice>
        )}

        <motion.div whileTap={{ scale: 0.985 }}>
          <button type="submit" disabled={busy !== null} className="btn btn-primary btn-lg w-full justify-center">
            {busy === 'email' ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
                Creating account…
              </span>
            ) : 'Create Account'}
          </button>
        </motion.div>

        <div className="flex items-center gap-3 py-1" aria-hidden>
          <span className="hairline flex-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-faint">or</span>
          <span className="hairline flex-1" />
        </div>

        <GoogleButton onClick={async () => { setBusy('google'); const r = await googleSignIn(); setBusy(null); if (r.error) setErr(r.error) }} busy={busy !== null} />

        <p className="pt-1 text-center text-xs font-semibold text-muted">
          Already have an account?{' '}
          <Link href="/login" className="inline-block -my-1.5 py-1.5 text-leaf-700 underline-offset-4 hover:underline dark:text-leaf-300">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  )
}
