'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useTheme } from '@/components/ThemeProvider'
import { Avatar, Card, Chip, Counter, DemoTag, PageHeader, Progress, Reveal, spring } from '@/components/ui'
import { bookings, farmer, financeSummary, lands } from '@/lib/data'
import { cn, inr, num } from '@/lib/utils'

const langs = ['English', 'తెలుగు', 'Tenglish']
const units = ['Acres', 'Hectares']

export default function ProfilePage() {
  const { theme, setTheme } = useTheme()
  const [name, setName] = useState(farmer.name)
  const [phone, setPhone] = useState(farmer.phone)
  const [location, setLocation] = useState(farmer.location)
  const [lang, setLang] = useState('Tenglish')
  const [unit, setUnit] = useState('Acres')
  const [saved, setSaved] = useState(false)
  const [prefs, setPrefs] = useState({
    weatherAlerts: true, priceAlerts: true, bookingReminders: true,
    schemeDeadlines: true, communityMentions: false, voiceAssistant: true,
  })

  const acres = unit === 'Acres' ? farmer.totalAcres : farmer.totalAcres * 0.4047
  const upcoming = bookings.filter((b) => b.status === 'Confirmed' || b.status === 'Pending').length

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="section">
      <PageHeader
        icon="👤"
        title="My Profile"
        sub="Account details, preferences and how you want to be reached."
        tag={<DemoTag />}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.25fr]">
        {/* ------------------------------------------------- identity card */}
        <div className="space-y-4">
          <Reveal>
            <Card className="overflow-hidden" pad={false}>
              <div className="relative h-24 bg-leaf-gradient">
                <div className="absolute inset-0 opacity-25" aria-hidden>
                  <svg viewBox="0 0 300 90" preserveAspectRatio="none" className="h-full w-full">
                    {Array.from({ length: 26 }, (_, i) => (
                      <g key={i} transform={`translate(${i * 12} 90)`}>
                        <path d="M0 0 C-4 -18 4 -30 0 -46" fill="none" stroke="white" strokeWidth="1.6" />
                        <ellipse cx="-5" cy="-26" rx="5" ry="2.4" fill="white" transform="rotate(-32 -5 -26)" />
                        <ellipse cx="5" cy="-36" rx="5" ry="2.4" fill="white" transform="rotate(32 5 -36)" />
                      </g>
                    ))}
                  </svg>
                </div>
              </div>
              <div className="px-5 pb-5">
                <div className="-mt-9 flex items-end justify-between gap-3">
                  <Avatar seed={farmer.avatarSeed} size={76} />
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    <Chip tone="live">{farmer.role}</Chip>
                    <Chip>Member since {farmer.memberSince}</Chip>
                  </div>
                </div>
                <h2 className="mt-3 font-display text-2xl font-black leading-tight">{name || farmer.name}</h2>
                <p className="text-sm text-muted">{farmer.handle} · 📍 {location || farmer.location}</p>
                <p className="mt-1 text-sm text-muted">📱 {phone || farmer.phone}</p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    ['Land', `${num(acres, 1)} ${unit === 'Acres' ? 'ac' : 'ha'}`],
                    ['Crops', String(farmer.activeCrops)],
                    ['Bookings', String(upcoming)],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-2xl border border-line/60 bg-surface/50 p-2.5 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{k}</p>
                      <p className="font-display text-base font-black">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.08}>
            <Card>
              <h2 className="mb-3 text-sm font-bold">Season at a glance</h2>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">{farmer.season} progress</span>
                    <span className="font-bold">68%</span>
                  </div>
                  <Progress value={68} className="mt-1.5" showValue={false} />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface/60 px-3 py-2.5">
                  <span className="text-sm text-muted">Estimated profit this season</span>
                  <span className="font-display text-lg font-black tabular-nums text-leaf-600 dark:text-leaf-400">
                    <Counter to={financeSummary.estimatedProfit} prefix="₹" compact />
                  </span>
                </div>
                <p className="text-[11px] leading-snug text-faint">
                  ◆ Estimate from sample assumptions — see Farm Finance for the breakdown.
                </p>
              </div>
              <Link href="/finance" className="btn btn-ghost btn-sm mt-3 w-full">Open Farm Finance →</Link>
            </Card>
          </Reveal>

          <Reveal delay={0.14}>
            <Card>
              <h2 className="mb-3 text-sm font-bold">My lands</h2>
              <ul className="space-y-1.5">
                {lands.map((l) => (
                  <li key={l.id}>
                    <Link href="/farm" className="flex items-center gap-2.5 rounded-2xl border border-line/60 p-2.5 transition-colors hover:border-line">
                      <span className="text-lg" aria-hidden>🌾</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{l.name}</span>
                        <span className="block text-[11px] text-muted">{l.crop} · {l.acres} ac</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className={cn('block text-xs font-black', l.health >= 85 ? 'text-leaf-600 dark:text-leaf-400' : 'text-gold-600 dark:text-gold-400')}>
                          {l.health}%
                        </span>
                        <span className="block text-[10px] text-faint">health</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </div>

        {/* ------------------------------------------------------- settings */}
        <div className="space-y-4">
          <Reveal delay={0.06}>
            <Card>
              <h2 className="mb-1 text-base font-bold">Account details</h2>
              <p className="mb-4 text-xs text-muted">Edits stay in this browser session — there is no account backend.</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="label">Full name</span>
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className="block">
                  <span className="label">Phone number</span>
                  <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="label">Location</span>
                  <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} />
                </label>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="label">Preferred language</span>
                  <div className="flex gap-1.5">
                    {langs.map((l) => (
                      <button key={l} onClick={() => setLang(l)}
                        className={cn('flex-1 rounded-2xl border px-2 py-2 text-xs font-bold transition-all',
                          lang === l ? 'border-leaf-400/70 bg-leaf-gradient text-white' : 'border-line/70 text-muted hover:text-ink')}>
                        {l}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] text-faint">Used by the AI assistant for replies.</p>
                </div>
                <div>
                  <span className="label">Land measurement unit</span>
                  <div className="flex gap-1.5">
                    {units.map((u) => (
                      <button key={u} onClick={() => setUnit(u)}
                        className={cn('flex-1 rounded-2xl border px-2 py-2 text-xs font-bold transition-all',
                          unit === u ? 'border-leaf-400/70 bg-leaf-gradient text-white' : 'border-line/70 text-muted hover:text-ink')}>
                        {u}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] text-faint">
                    {unit === 'Acres' ? '1 acre = 0.4047 hectares' : `${num(farmer.totalAcres * 0.4047, 2)} ha across your lands`}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <button onClick={save} className="btn btn-primary">Save changes</button>
                <motion.span initial={false} animate={{ opacity: saved ? 1 : 0 }} className="text-xs font-bold text-leaf-600 dark:text-leaf-400">
                  ✓ Saved to this session
                </motion.span>
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.12}>
            <Card>
              <h2 className="mb-1 text-base font-bold">Appearance</h2>
              <p className="mb-4 text-xs text-muted">Theme is stored in this browser and applies everywhere.</p>
              <div className="grid grid-cols-2 gap-2.5">
                {(['light', 'dark'] as const).map((t) => (
                  <button key={t} onClick={() => setTheme(t)}
                    className={cn('rounded-2xl border p-4 text-left transition-all',
                      theme === t ? 'border-leaf-400/70 bg-leaf-400/10 shadow-glow' : 'border-line/70 hover:border-line')}
                    aria-pressed={theme === t}>
                    <span className="text-2xl" aria-hidden>{t === 'light' ? '☀️' : '🌙'}</span>
                    <span className="mt-2 block font-bold capitalize">{t} mode</span>
                    <span className="block text-[11px] text-muted">{t === 'light' ? 'Bright, high contrast' : 'Easy on the eyes at night'}</span>
                  </button>
                ))}
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.18}>
            <Card>
              <h2 className="mb-1 text-base font-bold">Notifications</h2>
              <p className="mb-4 text-xs text-muted">Choose what is worth interrupting you for.</p>
              <ul className="space-y-2.5">
                {([
                  ['weatherAlerts', '🌧️', 'Weather & farm alerts', 'Rain, heat and pest warnings for your area'],
                  ['priceAlerts', '📈', 'Price changes', 'When a crop you grow moves significantly'],
                  ['bookingReminders', '📅', 'Booking reminders', 'Before a machine or expert is due'],
                  ['schemeDeadlines', '🏛️', 'Scheme deadlines', 'Applications and closing dates'],
                  ['communityMentions', '💬', 'Community mentions', 'Replies and tags in the forum'],
                  ['voiceAssistant', '🎙️', 'Voice assistant', 'Speak to the AI assistant hands-free'],
                ] as const).map(([key, icon, label, hint]) => (
                  <li key={key} className="flex items-start gap-3">
                    <span className="mt-0.5 text-lg" aria-hidden>{icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{label}</p>
                      <p className="text-[11px] leading-snug text-faint">{hint}</p>
                    </div>
                    <button
                      onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))}
                      role="switch" aria-checked={prefs[key]} aria-label={label}
                      className={cn('relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors',
                        prefs[key] ? 'bg-leaf-600' : 'bg-line')}>
                      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition-all',
                        prefs[key] ? 'left-[22px]' : 'left-0.5')} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] leading-snug text-faint">
                ◆ Toggles update this page only — nothing is persisted in the prototype.
              </p>
            </Card>
          </Reveal>

          <Reveal delay={0.24}>
            <Card>
              <h2 className="mb-3 text-base font-bold">Account</h2>
              <div className="flex flex-wrap gap-2.5">
                <Link href="/auth" className="btn btn-ghost">Switch role</Link>
                <Link href="/bookings" className="btn btn-quiet">My bookings</Link>
                <Link href="/notifications" className="btn btn-quiet">Notifications</Link>
              </div>
              <div className="hairline my-4" />
              <p className="text-xs leading-relaxed text-muted">
                This prototype has no real account. There is nothing to delete, and no personal data is
                stored anywhere — everything you type stays in this browser tab.
              </p>
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
