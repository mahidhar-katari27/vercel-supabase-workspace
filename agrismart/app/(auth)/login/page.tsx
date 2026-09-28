'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AuthShell, Field, GoogleButton, AuthNotice } from '@/components/auth/AuthShell'
import { useAuth } from '@/lib/auth'
import { spring } from '@/components/ui'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function LoginPage() {
  const { signIn, googleSignIn, configured, ready } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState<null | 'email' | 'google'>(null)
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [fieldErr, setFieldErr] = useState<{ email?: string; pw?: string }>({})

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null); setOk(null)
    const fe: { email?: string; pw?: string } = {}
    if (!EMAIL_RE.test(email.trim())) fe.email = 'Enter a valid email address'
    if (pw.length < 6) fe.pw = 'Password must be at least 6 characters'
    setFieldErr(fe)
    if (Object.keys(fe).length) return
    setBusy('email')
    const res = await signIn(email.trim(), pw)
    setBusy(null)
    if (res.error) return setErr(res.error)
    if (res.needsConfirm) return setOk('Account created — check your inbox to confirm your email, then sign in.')
    router.push('/dashboard')
  }

  const google = async () => {
    setErr(null); setBusy('google')
    const res = await googleSignIn()
    setBusy(null)
    if (res.error) setErr(res.error)
  }

  return (
    <AuthShell
      title={<>Welcome back <span aria-hidden>👋</span></>}
      sub="Sign in to continue to your farm."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field
          label="Email" type="email" inputMode="email" autoComplete="email"
          value={email} onChange={setEmail} placeholder="you@farm.in" error={fieldErr.email}
        />
        <Field
          label="Password" type="password" autoComplete="current-password"
          value={pw} onChange={setPw} placeholder="••••••••" error={fieldErr.pw}
        />

        {err && <AuthNotice tone="error">{err}</AuthNotice>}
        {ok && <AuthNotice tone="success">{ok}</AuthNotice>}
        {!configured && ready && (
          <AuthNotice tone="info">
            Supabase auth is not configured in this environment — use{' '}
            <Link className="underline underline-offset-2" href="/dashboard">Explore mode</Link>{' '}
            to continue with the labelled demo dataset.
          </AuthNotice>
        )}

        <motion.div whileTap={{ scale: 0.985 }}>
          <button type="submit" disabled={busy !== null} className="btn btn-primary btn-lg w-full justify-center">
            {busy === 'email' ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
                Signing in…
              </span>
            ) : 'Sign In'}
          </button>
        </motion.div>

        <div className="flex items-center gap-3 py-1" aria-hidden>
          <span className="hairline flex-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-faint">or</span>
          <span className="hairline flex-1" />
        </div>

        <GoogleButton onClick={google} busy={busy !== null} />

        <div className="flex items-center justify-between pt-2 text-xs font-semibold">
          <Link href="/forgot-password" className="inline-block -my-1 py-2 text-muted underline-offset-4 transition-colors hover:text-ink hover:underline">
            Forgot password?
          </Link>
          <Link href="/signup" className="inline-block -my-1 py-2 text-leaf-700 underline-offset-4 transition-colors hover:underline dark:text-leaf-300">
            Don&rsquo;t have an account? Create one
          </Link>
        </div>
      </form>
    </AuthShell>
  )
}
