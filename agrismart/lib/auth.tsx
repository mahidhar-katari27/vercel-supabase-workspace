'use client'

/**
 * Real Supabase Authentication for AgriSmart.
 *
 *   • email + password sign-in / sign-up (metadata: name, mobile, role, location)
 *   • Google OAuth (surfaces an honest error until the provider is enabled
 *     in the Supabase dashboard — never a fake button)
 *   • password reset via email link → /reset-password
 *   • session persistence + auto refresh (handled by supabase-js)
 *   • on session change the per-user data scope is switched (lib/userScope),
 *     so every signed-in user only ever sees their own private farm data
 *
 * When Supabase is not configured the provider still works — `configured`
 * is false and pages fall back to the labelled demo/explore experience.
 */
import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabaseBrowser, supabaseConfigured } from './supabase'
import { setUserScope } from './userScope'

export type AuthResult = { error?: string; needsConfirm?: boolean }

type AuthCtx = {
  ready: boolean
  configured: boolean
  user: User | null
  uid: string | null
  meta: Record<string, string>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (input: {
    name: string; email: string; mobile: string; role: string; location: string; password: string
  }) => Promise<AuthResult>
  googleSignIn: () => Promise<AuthResult>
  sendResetEmail: (email: string) => Promise<AuthResult>
  changePassword: (password: string) => Promise<AuthResult>
  updateMeta: (patch: Record<string, string>) => Promise<AuthResult>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const configured = typeof window !== 'undefined' && supabaseConfigured()

  useEffect(() => {
    const sb = supabaseBrowser()
    if (!sb) { setReady(true); return }
    let alive = true
    sb.auth.getSession().then(({ data }) => {
      if (!alive) return
      setUser(data.session?.user ?? null)
      setUserScope(data.session?.user?.id ?? null)
      setReady(true)
    })
    const { data: sub } = sb.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user ?? null)
      setUserScope(session?.user?.id ?? null)
    })
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const sb = supabaseBrowser()
    if (!sb) return { error: 'Supabase is not configured — use Explore mode to continue.' }
    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error) {
      if (/confirm/i.test(error.message)) return { error: 'Please confirm your email address first (check your inbox).' }
      if (/invalid login/i.test(error.message)) return { error: 'Incorrect email or password.' }
      return { error: error.message }
    }
    if (!data.session) return { needsConfirm: true }
    return {}
  }, [])

  const signUp = useCallback(async (input: {
    name: string; email: string; mobile: string; role: string; location: string; password: string
  }): Promise<AuthResult> => {
    const sb = supabaseBrowser()
    if (!sb) return { error: 'Supabase is not configured — use Explore mode to continue.' }
    const { data, error } = await sb.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.name, mobile: input.mobile, role: input.role, location: input.location,
        },
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    })
    if (error) return { error: error.message }
    if (!data.session) return { needsConfirm: true }
    return {}
  }, [])

  const googleSignIn = useCallback(async (): Promise<AuthResult> => {
    const sb = supabaseBrowser()
    if (!sb) return { error: 'Supabase is not configured — use Explore mode to continue.' }
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/onboarding` },
    })
    if (error) {
      if (/provider|enabled|disabled/i.test(error.message)) {
        return { error: 'Google sign-in is not enabled on this Supabase project yet — please use email & password.' }
      }
      return { error: error.message }
    }
    return {}
  }, [])

  const sendResetEmail = useCallback(async (email: string): Promise<AuthResult> => {
    const sb = supabaseBrowser()
    if (!sb) return { error: 'Supabase is not configured.' }
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) return { error: error.message }
    return {}
  }, [])

  const changePassword = useCallback(async (password: string): Promise<AuthResult> => {
    const sb = supabaseBrowser()
    if (!sb) return { error: 'Supabase is not configured.' }
    const { error } = await sb.auth.updateUser({ password })
    if (error) return { error: error.message }
    return {}
  }, [])

  const updateMeta = useCallback(async (patch: Record<string, string>): Promise<AuthResult> => {
    const sb = supabaseBrowser()
    if (!sb) return { error: 'Not signed in.' }
    const { data, error } = await sb.auth.updateUser({ data: patch })
    if (error) return { error: error.message }
    setUser(data.user ?? null)
    return {}
  }, [])

  const signOut = useCallback(async () => {
    const sb = supabaseBrowser()
    if (sb) await sb.auth.signOut()
    setUser(null)
    setUserScope(null)
  }, [])

  const meta = useMemo(() => {
    const raw = (user?.user_metadata ?? {}) as Record<string, unknown>
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(raw)) if (typeof v === 'string') out[k] = v
    return out
  }, [user])

  const value = useMemo<AuthCtx>(() => ({
    ready, configured, user, uid: user?.id ?? null, meta,
    signIn, signUp, googleSignIn, sendResetEmail, changePassword, updateMeta, signOut,
  }), [ready, configured, user, meta, signIn, signUp, googleSignIn, sendResetEmail, changePassword, updateMeta, signOut])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
