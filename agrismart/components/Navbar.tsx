'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useTheme } from './ThemeProvider'
import { navItems, mobileNav, allSections } from '@/lib/nav'
import { notifications, farmer } from '@/lib/data'
import { cn, timeAgo } from '@/lib/utils'
import { Avatar, spring } from './ui'

export default function Navbar() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [bell, setBell] = useState(false)
  const [profile, setProfile] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setSheet(false); setBell(false); setProfile(false) }, [pathname])

  const unread = notifications.filter((n) => !n.read).length

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-xl focus:bg-leaf-600 focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>

      {/* ------------------------------------------------------- top bar */}
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-500',
          scrolled ? 'py-1.5' : 'py-3',
        )}
      >
        <div className="section">
          <nav
            aria-label="Main"
            className={cn(
              'flex items-center gap-2 rounded-3xl px-3 py-2 transition-all duration-500 sm:px-4',
              scrolled ? 'glass-strong shadow-lift' : 'glass',
            )}
          >
            {/* Brand */}
            <Link href="/" className="group flex shrink-0 items-center gap-2.5 rounded-2xl p-1 pr-2">
              <span className="relative grid h-9 w-9 place-items-center rounded-2xl bg-leaf-gradient text-lg shadow-glow transition-transform duration-500 group-hover:scale-105 group-hover:rotate-6">
                <span aria-hidden>🌾</span>
              </span>
              <span className="hidden leading-none sm:block">
                <span className="block font-display text-[15px] font-black tracking-tight">AgriSmart</span>
                <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-muted">2.0 · AI Farming</span>
              </span>
            </Link>

            {/* Desktop links */}
            <div className="mx-auto hidden items-center gap-0.5 lg:flex">
              {navItems.map((item) => {
                const on = pathname === item.href
                return (
                  <Link
                    key={item.href} href={item.href}
                    className={cn(
                      'relative whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors duration-200',
                      on ? 'text-white' : 'text-muted hover:text-ink',
                    )}
                  >
                    {on && (
                      <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-xl bg-leaf-gradient shadow-glow" transition={spring} />
                    )}
                    {item.short ? (
                      <>
                        <span className="xl:hidden">{item.short}</span>
                        <span className="hidden xl:inline">{item.label}</span>
                      </>
                    ) : item.label}
                  </Link>
                )
              })}
            </div>

            {/* Right cluster */}
            <div className="ml-auto flex items-center gap-1 lg:ml-0">
              <ThemeToggle theme={theme} toggle={toggle} />

              <div className="relative">
                <button
                  onClick={() => { setBell((v) => !v); setProfile(false) }}
                  aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
                  aria-expanded={bell}
                  className="tap-lg relative grid h-10 w-10 place-items-center rounded-xl text-lg transition-colors hover:bg-line/40"
                >
                  <span aria-hidden>🔔</span>
                  {unread > 0 && (
                    <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-bg">
                      {unread}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {bell && (
                    <Dropdown onClose={() => setBell(false)} align="right" title="Notifications" wide>
                      <ul className="divide-y divide-line/60">
                        {notifications.slice(0, 5).map((n) => (
                          <li key={n.id} className="flex gap-3 py-2.5">
                            <span className="text-lg" aria-hidden>{n.icon}</span>
                            <div className="min-w-0">
                              <p className={cn('truncate text-sm font-semibold', !n.read && 'text-ink')}>{n.title}</p>
                              <p className="line-clamp-2 text-xs text-muted">{n.body}</p>
                              <p className="mt-0.5 text-[11px] text-faint">{timeAgo(n.time)}</p>
                            </div>
                            {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-leaf-400" aria-label="unread" />}
                          </li>
                        ))}
                      </ul>
                      <Link href="/notifications" className="btn btn-ghost btn-sm mt-2 w-full">View all</Link>
                    </Dropdown>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => { setProfile((v) => !v); setBell(false) }}
                  aria-label="Profile menu" aria-expanded={profile}
                  className="tap-lg flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-line/40"
                >
                  <Avatar seed={farmer.avatarSeed} size={30} />
                  <span className="hidden text-sm font-semibold xl:block">{farmer.name.split(' ')[0]}</span>
                  <span className="hidden text-[10px] text-faint xl:block" aria-hidden>▾</span>
                </button>
                <AnimatePresence>
                  {profile && (
                    <Dropdown onClose={() => setProfile(false)} align="right" title={farmer.name}>
                      <div className="mb-2 flex items-center gap-2 text-xs text-muted">
                        <span className="chip chip-live">👨‍🌾 {farmer.role}</span>
                        <span>{farmer.location.split(',')[0]}</span>
                      </div>
                      <Link href="/profile" className="menu-link">👤 My profile</Link>
                      <Link href="/bookings" className="menu-link">📅 My bookings</Link>
                      <Link href="/notifications" className="menu-link">🔔 Notifications</Link>
                      <Link href="/admin" className="menu-link">🏢 Admin dashboard</Link>
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('agrismart:replay-intro'))}
                        className="menu-link w-full text-left"
                      >
                        🎬 Replay opening animation
                      </button>
                      <div className="my-1.5 hairline" />
                      <Link href="/auth" className="menu-link">↩︎ Switch user / sign out</Link>
                    </Dropdown>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setSheet(true)}
                aria-label="Open menu"
                className="tap-lg grid h-10 w-10 place-items-center rounded-xl transition-colors hover:bg-line/40 lg:hidden"
              >
                <span className="flex flex-col gap-[5px]" aria-hidden>
                  <span className="block h-0.5 w-5 rounded bg-ink" />
                  <span className="block h-0.5 w-5 rounded bg-ink" />
                  <span className="block h-0.5 w-3.5 rounded bg-ink" />
                </span>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* ------------------------------------------- mobile "More" sheet */}
      <AnimatePresence>
        {sheet && (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <motion.div className="absolute inset-0 bg-black/55 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSheet(false)} />
            <motion.div
              className="glass-strong absolute inset-x-0 top-0 max-h-[86vh] overflow-y-auto rounded-b-4xl p-5 safe-bottom"
              initial={{ y: '-100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }}
              transition={spring}
              role="dialog" aria-label="All sections"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-lg font-black">All sections</span>
                <button onClick={() => setSheet(false)} aria-label="Close menu"
                  className="tap-lg grid h-10 w-10 place-items-center rounded-xl hover:bg-line/40">✕</button>
              </div>
              {allSections.map((g) => (
                <div key={g.title} className="mb-4">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">{g.title}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {g.items.map((it) => {
                      const on = pathname === it.href
                      return (
                        <Link key={it.href} href={it.href}
                          className={cn(
                            'flex items-center gap-2.5 rounded-2xl border p-3 text-sm font-semibold transition-all active:scale-[0.97]',
                            on ? 'border-leaf-400/50 bg-leaf-400/10 text-ink' : 'border-line/70 text-muted',
                          )}>
                          <span className="text-lg" aria-hidden>{it.icon}</span>
                          <span className="truncate">{it.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------- mobile bottom nav */}
      <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <div className="mx-auto max-w-md px-3 pb-3 safe-bottom">
          <div className="glass-strong flex items-stretch justify-between gap-1 rounded-3xl p-1.5">
            {mobileNav.map((it) => {
              const on = pathname === it.href
              return (
                <Link key={it.href} href={it.href}
                  aria-current={on ? 'page' : undefined}
                  className={cn(
                    'relative flex min-h-[54px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-bold transition-colors',
                    on ? 'text-white' : 'text-muted',
                  )}>
                  {on && <motion.span layoutId="mb-pill" className="absolute inset-0 -z-10 rounded-2xl bg-leaf-gradient shadow-glow" transition={spring} />}
                  <span className="text-lg leading-none" aria-hidden>{it.icon}</span>
                  {it.label}
                </Link>
              )
            })}
            <button onClick={() => setSheet(true)}
              className="flex min-h-[54px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-bold text-muted">
              <span className="text-lg leading-none" aria-hidden>☰</span>
              More
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}

/* ------------------------------------------------------------------ pieces */

function ThemeToggle({ theme, toggle }: { theme: string; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="tap-lg relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl transition-colors hover:bg-line/40"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          className="text-lg"
          initial={{ y: 14, opacity: 0, rotate: -30 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -14, opacity: 0, rotate: 30 }}
          transition={{ duration: 0.24 }}
          aria-hidden
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

function Dropdown({
  children, onClose, align = 'left', title, wide = false,
}: {
  children: React.ReactNode; onClose: () => void; align?: 'left' | 'right'
  title?: string; wide?: boolean
}) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} aria-hidden />
      <motion.div
        className={cn(
          'glass-strong absolute z-20 mt-2 overflow-hidden rounded-3xl p-3',
          wide ? 'w-[min(22rem,calc(100vw-2rem))]' : 'w-60',
          align === 'right' ? 'right-0' : 'left-0',
        )}
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        role="menu"
      >
        {title && <p className="mb-1.5 px-1 font-display text-sm font-bold">{title}</p>}
        {children}
      </motion.div>
    </>
  )
}
