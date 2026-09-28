'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AuthShell, Field, AuthNotice } from '@/components/auth/AuthShell'
import { useAuth } from '@/lib/auth'

export default function ResetPasswordPage() {
  const { changePassword, ready, user } = useAuth()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [fe, setFe] = useState<Record<string, string>>({})

  // The recovery link from email lands here with a session already attached
  // (Supabase exchanges the token in the URL fragment automatically).
  const [hasSession, setHasSession] = useState(false)
  useEffect(() => { if (ready) setHasSession(!!user) }, [ready, user])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    const nfe: Record<string, string> = {}
    if (pw.length < 6) nfe.pw = 'At least 6 characters'
    if (pw2 !== pw) nfe.pw2 = 'Passwords do not match'
    setFe(nfe)
    if (Object.keys(nfe).length) return
    setBusy(true)
    const res = await changePassword(pw)
    setBusy(false)
    if (res.error) return setErr(res.error)
    setDone(true)
  }

  if (done) {
    return (
      <AuthShell title="Password updated ✅" sub="Your new password is active on every device.">
        <div className="space-y-4">
          <AuthNotice tone="success">You can now sign in with your new password.</AuthNotice>
          <Link href="/login" className="btn btn-primary btn-lg w-full justify-center">Continue to sign in</Link>
        </div>
      </AuthShell>
    )
  }

  if (ready && !hasSession) {
    return (
      <AuthShell title="Set a new password" sub="Use the secure link from your reset email.">
        <div className="space-y-4">
          <AuthNotice tone="info">
            This page opens from the reset link we email you. Request one below and tap the
            link in your inbox — it brings you back here with a verified session.
          </AuthNotice>
          <Link href="/forgot-password" className="btn btn-primary btn-lg w-full justify-center">
            Request a reset link
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Choose a new password" sub="Make it strong — this protects your farm data.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="New password" type="password" autoComplete="new-password" value={pw} onChange={setPw} placeholder="••••••••" error={fe.pw} hint="6+ chars" />
        <Field label="Confirm new password" type="password" autoComplete="new-password" value={pw2} onChange={setPw2} placeholder="••••••••" error={fe.pw2} />
        {err && <AuthNotice tone="error">{err}</AuthNotice>}
        <motion.div whileTap={{ scale: 0.985 }}>
          <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full justify-center">
            {busy ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
                Updating…
              </span>
            ) : 'Update password'}
          </button>
        </motion.div>
      </form>
    </AuthShell>
  )
}
