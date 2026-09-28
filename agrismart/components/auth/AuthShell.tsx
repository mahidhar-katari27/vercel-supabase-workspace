'use client'

/**
 * Shared premium shell for /login /signup /forgot-password /reset-password.
 * Left: cinematic agriculture visual with slow drift + product data chips.
 * Right: the form panel — bone surface, hairline fields, pill actions.
 */
import Link from 'next/link'
import { motion } from 'framer-motion'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { spring } from '@/components/ui'

export function AuthShell({
  title, sub, children, wide,
}: { title: ReactNode; sub: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ------------------------------------------------ left visual */}
      <div className="relative hidden overflow-hidden bg-ink lg:block" aria-hidden>
        <div className="absolute inset-0 animate-[kenburns_28s_ease-in-out_infinite_alternate]">
          <Image
            src="/start/hero.jpg" alt="" fill priority sizes="50vw"
            className="object-cover opacity-80"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-ink/40" />
        <div className="vlines absolute inset-0 opacity-30" />
        <div className="absolute inset-x-0 bottom-0 p-10">
          <p className="font-display text-3xl font-semibold leading-tight tracking-[-0.02em] text-bg">
            Agriculture,
            <br />
            made smarter.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-bg/70">
            Plan your farm, understand your crops, track your money, and make
            better farming decisions — one connected platform.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {['🌦 28°C', '💧 Soil moisture 64%', '🌾 Paddy', '₹48,500 est. return'].map((chip, i) => (
              <motion.span
                key={chip}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.5 + i * 0.18 }}
                className="rounded-full border border-bg/25 bg-bg/10 px-3 py-1 text-[11px] font-semibold text-bg/90 backdrop-blur-sm"
              >
                {chip}
              </motion.span>
            ))}
          </div>
        </div>
        <span className="spark absolute right-[12%] top-[14%] text-xl text-bg/70">✦</span>
        <span className="spark absolute right-[28%] top-[38%] text-sm text-bg/50">✦</span>
      </div>

      {/* ------------------------------------------------ right panel */}
      <div className="relative flex min-h-screen flex-col justify-center px-5 py-10 sm:px-10 lg:px-14">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-hero-glow" aria-hidden />
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-leaf-gradient text-lg shadow-glow" aria-hidden>🌾</span>
            <span className="leading-none">
              <span className="block font-display text-base font-black tracking-tight">AgriSmart</span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-muted">2.0 · AI Farming</span>
            </span>
          </Link>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
            <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">{sub}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.08 }}
            className={cn('mt-8', wide && 'max-w-none')}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------- form atoms */

import { useState } from 'react'

export function Field({
  label, type = 'text', value, onChange, placeholder, autoComplete, error, hint, inputMode,
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  error?: string | null
  hint?: string
  inputMode?: 'text' | 'email' | 'tel' | 'numeric'
}) {
  const [show, setShow] = useState(false)
  const isPw = type === 'password'
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-xs font-bold uppercase tracking-wider text-faint">
        {label}
        {hint && <span className="font-medium normal-case tracking-normal text-faint">{hint}</span>}
      </span>
      <span className="relative block">
        <input
          type={isPw && show ? 'text' : type}
          value={value}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          className={cn(
            'w-full rounded-2xl border bg-surface px-4 py-3 text-sm outline-none transition-all',
            'placeholder:text-faint/70 focus:border-leaf-500/60 focus:ring-4 focus:ring-leaf-500/10',
            error ? 'border-red-400/70' : 'border-line/80',
            isPw && 'pr-12',
          )}
        />
        {isPw && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-1.5 py-1 text-xs font-bold text-faint transition-colors hover:text-ink"
          >
            {show ? '🙈' : '👁'}
          </button>
        )}
      </span>
      {error && <span className="mt-1.5 block text-xs font-semibold text-red-500">{error}</span>}
    </label>
  )
}

export function GoogleButton({ onClick, busy }: { onClick: () => void; busy?: boolean }) {
  return (
    <button
      type="button" onClick={onClick} disabled={busy}
      className="btn btn-ghost w-full justify-center gap-2.5"
    >
      <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
      Continue with Google
    </button>
  )
}

export function AuthNotice({ tone, children }: { tone: 'error' | 'success' | 'info'; children: ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      role="status"
      className={cn(
        'rounded-2xl border px-4 py-3 text-xs font-semibold leading-relaxed',
        tone === 'error' && 'border-red-400/50 bg-red-400/10 text-red-600 dark:text-red-400',
        tone === 'success' && 'border-leaf-500/40 bg-leaf-500/10 text-leaf-700 dark:text-leaf-300',
        tone === 'info' && 'border-line/80 bg-surface text-muted',
      )}
    >
      {children}
    </motion.p>
  )
}
