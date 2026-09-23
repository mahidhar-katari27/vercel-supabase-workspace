'use client'

import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { cn, inr, num, pct } from '@/lib/utils'

/* ------------------------------------------------------------------ motion */

export const spring = { type: 'spring' as const, stiffness: 260, damping: 26, mass: 0.7 }

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { ...spring, delay: Math.min(i * 0.05, 0.4) },
  }),
}

/** Reveal-on-scroll wrapper. Falls back to a plain div under reduced motion. */
export function Reveal({
  children, className, delay = 0, y = 18, as = 'div',
}: {
  children: React.ReactNode; className?: string; delay?: number; y?: number; as?: 'div' | 'section' | 'li'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const Tag = motion[as] as typeof motion.div
  return (
    <Tag
      ref={ref as never}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ ...spring, delay }}
    >
      {children}
    </Tag>
  )
}

/* -------------------------------------------------------------------- card */

export function Card({
  children, className, hover = false, glow = false, onClick, pad = true,
}: {
  children: React.ReactNode; className?: string; hover?: boolean; glow?: boolean
  onClick?: () => void; pad?: boolean
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'card', hover && 'card-hover', pad && 'p-5 sm:p-6', glow && 'shadow-glow',
        onClick && 'cursor-pointer', className,
      )}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------- chips */

export function Chip({
  children, tone = 'default', className, icon,
}: {
  children: React.ReactNode; tone?: 'default' | 'demo' | 'live' | 'info' | 'danger' | 'ok'
  className?: string; icon?: string
}) {
  const tones: Record<string, string> = {
    default: 'chip',
    demo: 'chip chip-demo',
    live: 'chip chip-live',
    info: 'chip chip-info',
    danger: 'chip border-red-400/40 text-red-500 bg-red-500/10',
    ok: 'chip chip-live',
  }
  return (
    <span className={cn(tones[tone], className)}>
      {icon && <span aria-hidden>{icon}</span>}
      {children}
    </span>
  )
}

/** Marks any surface whose numbers are illustrative rather than live. */
export function DemoTag({ className }: { className?: string }) {
  return (
    <Chip tone="demo" className={className} icon="◆">
      Demo data
    </Chip>
  )
}

/* --------------------------------------------------------------- counters */

/** Animated count-up that only runs once the element scrolls into view. */
export function Counter({
  to, prefix = '', suffix = '', decimals = 0, duration = 1.4, className, compact = false,
}: {
  to: number; prefix?: string; suffix?: string; decimals?: number
  duration?: number; className?: string; compact?: boolean
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [val, setVal] = useState(0)

  useEffect(() => {
    if (!inView) return
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setVal(to); return }

    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / (duration * 1000))
      // easeOutExpo — fast start, gentle settle
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
      setVal(to * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration])

  const text = compact ? inr(val, { compact: true }) : prefix + num(val, decimals) + suffix
  return <span ref={ref} className={className}>{text}</span>
}

/* --------------------------------------------------------------- progress */

export function Progress({
  value, tone = 'leaf', className, label, showValue = false,
}: {
  value: number; tone?: 'leaf' | 'gold' | 'sky' | 'danger'; className?: string
  label?: string; showValue?: boolean
}) {
  const bar: Record<string, string> = {
    leaf: 'from-leaf-400 to-leaf-600',
    gold: 'from-gold-300 to-gold-600',
    sky: 'from-sky-400 to-sky-500',
    danger: 'from-red-400 to-red-600',
  }
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-baseline justify-between text-xs">
          {label && <span className="font-medium text-muted">{label}</span>}
          {showValue && <span className="font-semibold tabular-nums text-ink">{Math.round(value)}%</span>}
        </div>
      )}
      <div ref={ref} className="h-2 w-full overflow-hidden rounded-full bg-line/50">
        <motion.div
          className={cn('h-full rounded-full bg-gradient-to-r', bar[tone])}
          initial={{ width: 0 }}
          animate={inView ? { width: `${Math.min(100, Math.max(0, value))}%` } : undefined}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- headings */

export function SectionHeading({
  eyebrow, title, sub, right, center = false,
}: {
  eyebrow?: string; title: string; sub?: string; right?: React.ReactNode; center?: boolean
}) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:mb-8', !center && 'sm:flex-row sm:items-end sm:justify-between')}>
      <div className={cn(center && 'mx-auto max-w-2xl text-center')}>
        {eyebrow && (
          <div className={cn('mb-2 text-xs font-bold uppercase tracking-[0.18em] text-leaf-600 dark:text-leaf-400', center && 'flex justify-center')}>
            {eyebrow}
          </div>
        )}
        <h2 className="text-2xl font-bold sm:text-3xl lg:text-[2.1rem]">{title}</h2>
        {sub && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{sub}</p>}
      </div>
      {right && <div className={cn('shrink-0', center && 'mx-auto')}>{right}</div>}
    </div>
  )
}

export function PageHeader({
  icon, title, sub, children, tag,
}: {
  icon?: string; title: string; sub?: string; children?: React.ReactNode; tag?: React.ReactNode
}) {
  return (
    <header className="mb-6 sm:mb-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
        <div className="flex flex-wrap items-center gap-3">
          {icon && (
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-leaf-gradient text-xl shadow-glow" aria-hidden>
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
              {tag}
            </div>
            {sub && <p className="mt-1 text-sm text-muted sm:text-base">{sub}</p>}
          </div>
        </div>
        {children && <div className="mt-4">{children}</div>}
      </motion.div>
    </header>
  )
}

/* ------------------------------------------------------------------ avatar */

export function Avatar({ seed, size = 40, hue = 145 }: { seed: string; size?: number; hue?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-display font-bold text-white ring-2 ring-white/25"
      style={{
        width: size, height: size, fontSize: size * 0.36,
        background: `linear-gradient(135deg, hsl(${hue} 55% 46%), hsl(${(hue + 40) % 360} 52% 32%))`,
      }}
      aria-hidden
    >
      {seed.slice(0, 2).toUpperCase()}
    </span>
  )
}

/* ------------------------------------------------------------------- modal */

export function Modal({
  open, onClose, title, children, wide = false,
}: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div
            role="dialog" aria-modal="true" aria-label={title}
            className={cn(
              'glass-strong relative w-full overflow-hidden rounded-t-4xl sm:rounded-4xl',
              wide ? 'max-w-3xl' : 'max-w-lg',
            )}
            initial={{ y: 60, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={spring}
          >
            <div className="flex items-center justify-between gap-4 border-b border-line/70 px-5 py-4 sm:px-6">
              <h3 className="text-lg font-bold">{title}</h3>
              <button
                onClick={onClose} aria-label="Close"
                className="tap-lg grid h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-line/40 hover:text-ink"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[72vh] overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* -------------------------------------------------------------------- tabs */

export function Tabs({
  tabs, active, onChange, className,
}: {
  tabs: Array<{ id: string; label: string; icon?: string }>
  active: string; onChange: (id: string) => void; className?: string
}) {
  return (
    <div className={cn('no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-1', className)} role="tablist">
      {tabs.map((t) => {
        const on = t.id === active
        return (
          <button
            key={t.id} role="tab" aria-selected={on} onClick={() => onChange(t.id)}
            className={cn(
              'relative shrink-0 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200',
              on ? 'text-white' : 'text-muted hover:text-ink',
            )}
          >
            {on && (
              <motion.span
                layoutId={`tab-${tabs.map((x) => x.id).join('')}`}
                className="absolute inset-0 -z-10 rounded-2xl bg-leaf-gradient shadow-glow"
                transition={spring}
              />
            )}
            <span className="flex items-center gap-1.5">
              {t.icon && <span aria-hidden>{t.icon}</span>}{t.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ----------------------------------------------------------------- stepper */

export function Stepper({
  steps, current, onStep,
}: {
  steps: string[]; current: number
  /** Optional: lets the user jump back to an already-completed step. */
  onStep?: (index: number) => void
}) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2" aria-label="Progress">
      {steps.map((s, i) => {
        const done = i < current, on = i === current
        const clickable = onStep && done
        const inner = (
          <span
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all',
              on && 'border-leaf-400/60 bg-leaf-400/10 text-leaf-700 dark:text-leaf-300',
              done && 'border-transparent bg-leaf-600/90 text-white',
              !on && !done && 'border-line/70 text-faint',
              clickable && 'cursor-pointer hover:bg-leaf-500',
            )}
            aria-current={on ? 'step' : undefined}
          >
            <span className="tabular-nums">{done ? '✓' : i + 1}</span>
            <span className="hidden sm:inline">{s}</span>
          </span>
        )
        return (
          <li key={s} className="flex items-center gap-2">
            {clickable
              ? <button type="button" onClick={() => onStep!(i)} aria-label={`Back to step ${i + 1}: ${s}`}>{inner}</button>
              : inner}
            {i < steps.length - 1 && <span className="h-px w-4 bg-line" aria-hidden />}
          </li>
        )
      })}
    </ol>
  )
}

/* --------------------------------------------------------------- empty stat */

export function Delta({ value, className }: { value: number; className?: string }) {
  const up = value >= 0
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-bold tabular-nums',
      up ? 'text-leaf-600 dark:text-leaf-400' : 'text-red-500', className)}>
      <span aria-hidden>{up ? '↑' : '↓'}</span>{pct(value)}
    </span>
  )
}

export function StatCard({
  icon, label, value, sub, delta, tone = 'leaf', to, prefix, suffix, decimals,
}: {
  icon: string; label: string; value?: string; sub?: string; delta?: number
  tone?: 'leaf' | 'gold' | 'sky' | 'earth'; to?: number; prefix?: string
  suffix?: string; decimals?: number
}) {
  const tones: Record<string, string> = {
    leaf: 'from-leaf-400/20 to-leaf-600/5 text-leaf-600 dark:text-leaf-400',
    gold: 'from-gold-300/20 to-gold-600/5 text-gold-600 dark:text-gold-400',
    sky: 'from-sky-400/20 to-sky-500/5 text-sky-500',
    earth: 'from-earth-300/20 to-earth-600/5 text-earth-600 dark:text-earth-300',
  }
  return (
    <Card hover className="relative overflow-hidden">
      <div className={cn('pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br blur-2xl', tones[tone])} aria-hidden />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <span className={cn('grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br text-lg', tones[tone])} aria-hidden>
            {icon}
          </span>
          {delta !== undefined && <Delta value={delta} />}
        </div>
        <div className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">{label}</div>
        <div className="stat-value mt-1">
          {to !== undefined
            ? <Counter to={to} prefix={prefix} suffix={suffix} decimals={decimals} />
            : value}
        </div>
        {sub && <div className="mt-1 text-sm text-muted">{sub}</div>}
      </div>
    </Card>
  )
}
