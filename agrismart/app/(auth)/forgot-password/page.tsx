'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AuthShell, Field, AuthNotice } from '@/components/auth/AuthShell'
import { useAuth } from '@/lib/auth'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function ForgotPasswordPage() {
  const { sendResetEmail, configured, ready } = useAuth()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [fe, setFe] = useState<string | undefined>()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    if (!EMAIL_RE.test(email.trim())) return setFe('Enter a valid email address')
    setFe(undefined)
    setBusy(true)
    const res = await sendResetEmail(email.trim())
    setBusy(false)
    if (res.error) return setErr(res.error)
    setSent(true)
  }

  return (
    <AuthShell
      title="Forgot your password?"
      sub="No stress — we'll email you a secure link to set a new one."
    >
      {sent ? (
        <div className="space-y-4">
          <AuthNotice tone="success">
            Reset link sent to <strong>{email.trim()}</strong>. Open it on this device —
            it takes you straight to a new-password form.
          </AuthNotice>
          <p className="text-xs text-muted">
            Wrong address?{' '}
            <button className="font-bold text-leaf-700 underline-offset-4 hover:underline dark:text-leaf-300" onClick={() => setSent(false)}>
              Try another
            </button>
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field
            label="Email" type="email" inputMode="email" autoComplete="email"
            value={email} onChange={setEmail} placeholder="you@farm.in" error={fe}
          />
          {err && <AuthNotice tone="error">{err}</AuthNotice>}
          {!configured && ready && <AuthNotice tone="info">Supabase auth is not configured in this environment.</AuthNotice>}
          <motion.div whileTap={{ scale: 0.985 }}>
            <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full justify-center">
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
                  Sending…
                </span>
              ) : 'Email me a reset link'}
            </button>
          </motion.div>
          <p className="text-center text-xs font-semibold text-muted">
            Remembered it?{' '}
            <Link href="/login" className="text-leaf-700 underline-offset-4 hover:underline dark:text-leaf-300">Back to sign in</Link>
          </p>
        </form>
      )}
    </AuthShell>
  )
}
