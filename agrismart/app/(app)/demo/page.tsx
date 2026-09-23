'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, Chip, DemoTag, PageHeader, Progress, Reveal, spring } from '@/components/ui'
import { farmer } from '@/lib/data'
import { cn } from '@/lib/utils'

/**
 * The pitch walkthrough. Each step carries what to click and what to say, so
 * the demo runs the same way every time instead of being improvised.
 */
const steps = [
  {
    n: 1, href: '/', icon: '🎬', title: 'Cinematic opening',
    click: 'Reload the site, or press “Replay intro” below.',
    say: 'A seed germinates, grows into a crop, the field fills in, and the logo resolves into the dashboard. It runs once per session and is skippable — it never delays a returning user.',
    accent: 'from-leaf-400/25',
  },
  {
    n: 2, href: '/dashboard', icon: '📊', title: 'Farmer Dashboard',
    click: 'Point at the four counters, then the weather card and the alerts list.',
    say: `${farmer.name} farms ${farmer.totalAcres} acres around Vijayawada. Land, estimated profit, crop health and market position animate in on load. Everything below is one tap away — weather, alerts, finance, market.`,
    accent: 'from-sky-400/25',
  },
  {
    n: 3, href: '/farm', icon: '🌾', title: 'My Farm',
    click: 'Select each land card, then open “Add New Land” and fill the form.',
    say: 'Three land profiles with soil, irrigation, crop, planting and harvest dates, plus a growth-stage bar. The map on the right plots them against the Krishna. Adding a fourth land updates the map immediately.',
    accent: 'from-leaf-400/25',
  },
  {
    n: 4, href: '/crop-doctor', icon: '🤖', title: 'AI Crop Doctor',
    click: 'Drag in a photo — or tap a sample leaf — and watch the staged analysis.',
    say: 'The analysis runs through visible stages so the farmer can see what is happening rather than staring at a spinner. It returns symptoms, likely cause, a confidence figure and next steps.',
    accent: 'from-gold-300/25',
    important: 'Say this out loud: the result is assistance only, not a diagnosis. The confidence percentage and the disclaimer are on screen deliberately. A farmer should still talk to an agronomist before spraying.',
  },
  {
    n: 5, href: '/finance', icon: '💰', title: 'Farm Finance',
    click: 'Show the expense donut, then add a live expense and watch the totals recalculate.',
    say: 'Investment, expected revenue, estimated profit and profit per acre. The expense breakdown shows labour is the largest head. Adding a real expense instantly updates every number on the page.',
    accent: 'from-gold-300/25',
    important: 'Every figure is labelled an estimate. The banner says so, and the per-land table repeats it. Nothing here is presented as a guaranteed profit.',
  },
  {
    n: 6, href: '/market', icon: '📈', title: 'Market Intelligence',
    click: 'Sort by biggest move, open “Compare Markets”, then a price history.',
    say: 'Prices across nearby market yards with MSP comparison — you can see immediately which crops are trading above support price. Compare Markets shows the same crop at different yards, because transport cost often decides the better sale.',
    accent: 'from-sky-400/25',
    important: 'The banner states plainly that no live mandi feed is connected. This is the honest way to demo price data.',
  },
  {
    n: 7, href: '/schemes', icon: '🏛️', title: 'Government Scheme Center',
    click: 'Set sector to Crop, tick the documents you have, press “Check Eligibility”.',
    say: 'It shortlists schemes that match, and separately shows the ones you missed with the exact reason — wrong sector, land size out of range, not available in this state. Schemes you match but lack paperwork for are flagged with what is still missing.',
    accent: 'from-leaf-400/25',
    important: 'This is eligibility guidance, not an official decision. The tracker is demo state and submits nothing to any government body.',
  },
  {
    n: 8, href: '/agrirent', icon: '🚜', title: 'AgriRent booking flow',
    click: 'Walk all six steps: machine → date → time → location → operator → confirm.',
    say: 'The full rental flow, including an operator matched to the machine type and an itemised quote with transport and GST. Land selection feeds the location step, so the operator gets a real field.',
    accent: 'from-earth-300/25',
    important: 'The confirmation screen says explicitly that no vendor was notified and no payment was taken.',
  },
  {
    n: 9, href: '/dashboard', icon: '💬', title: 'AI Farm Assistant',
    click: 'Tap the floating assistant bubble in the corner. Try “నా పంట ఆరోగ్యం ఎలా ఉంది?” and the voice button.',
    say: 'It answers in English, Telugu or Tenglish — the way farmers actually type. Ask about weather, prices, schemes or a sick crop. Speech-to-text works for hands-free use in the field.',
    accent: 'from-sky-400/25',
    important: 'It is rule-based intent matching over the demo data, not a live model call. It is framed as assistance, and it does not invent facts that are not in the dataset.',
  },
  {
    n: 10, href: '/', icon: '🌱', title: 'The close',
    click: 'Scroll to the bottom of the landing page.',
    say: 'One platform for land, crops, weather, money, market, machinery, schemes, livestock and community — in the farmer&rsquo;s own language.',
    accent: 'from-leaf-400/25',
    finale: true,
  },
]

const alsoWorth = [
  ['/planner', '🗓️', 'Crop Planner', 'Ranks crops against soil, water, season and budget.'],
  ['/weather', '🌦️', 'Weather & Alerts', 'Forecast plus what it means for spraying and irrigation.'],
  ['/marketplace', '🛒', 'Marketplace', 'Ten categories, with a three-step sell flow.'],
  ['/vehicles', '🚜', 'Farm Vehicles', 'Buy with an EMI calculator, rent, or hire an operator.'],
  ['/aqua', '🐟', 'Aqua Farming', 'Ponds, DOC, survival, FCR and cost split.'],
  ['/poultry', '🐔', 'Poultry', 'Layer economics down to cost per egg.'],
  ['/dairy', '🐄', 'Dairy', 'Herd yield, cost per litre, margin per animal.'],
  ['/community', '🧑‍🌾', 'Community', 'Groups, posts, likes, comments, expert answers.'],
  ['/experts', '👨‍🔬', 'Expert Connect', 'Book by call, video or farm visit.'],
  ['/learn', '📚', 'Learning Hub', 'Eight guides with real agronomy content.'],
  ['/map', '🗺️', 'Smart Map', 'Markets, vets, offices and buyers around your farms.'],
  ['/admin', '🏢', 'Admin Console', 'Platform stats, moderation queue, honest gap list.'],
] as const

export default function DemoPage() {
  const [done, setDone] = useState<number[]>([])
  const [open, setOpen] = useState<number | null>(1)

  // Follow along automatically: mark a step done when the user navigates to it.
  useEffect(() => {
    const mark = () => {
      const path = window.location.pathname.replace(/\/$/, '') || '/'
      const hit = steps.find((s) => s.href === path)
      if (hit && !done.includes(hit.n)) setDone((d) => [...d, hit.n])
    }
    mark()
    window.addEventListener('popstate', mark)
    return () => window.removeEventListener('popstate', mark)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const replay = () => {
    try { sessionStorage.removeItem('agrismart-intro-seen') } catch {}
    window.dispatchEvent(new CustomEvent('agrismart:replay-intro'))
  }

  const pctDone = (done.length / steps.length) * 100

  return (
    <div className="section">
      <PageHeader
        icon="🎬"
        title="Guided Demo"
        sub="Ten steps, in order, with what to click and what to say."
        tag={<DemoTag />}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={replay} className="btn btn-primary">▶ Replay Intro Animation</button>
          <Link href="/dashboard" className="btn btn-ghost">Start from Dashboard</Link>
          <button onClick={() => setDone([])} className="btn btn-quiet">Reset checklist</button>
        </div>
      </PageHeader>

      <Reveal>
        <Card className="mb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">Demo progress</h2>
              <p className="text-xs text-muted">
                {done.length} of {steps.length} steps visited this session
              </p>
            </div>
            <p className="font-display text-2xl font-black tabular-nums">{Math.round(pctDone)}%</p>
          </div>
          <Progress value={pctDone} className="mt-2.5" tone={pctDone === 100 ? 'leaf' : 'gold'} />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {steps.map((s) => (
              <button key={s.n} onClick={() => setOpen(s.n)}
                className={cn('grid h-8 w-8 place-items-center rounded-xl text-xs font-black transition-all',
                  done.includes(s.n) ? 'bg-leaf-600 text-white'
                    : open === s.n ? 'bg-ink text-bg' : 'bg-line/40 text-muted hover:bg-line/70')}
                aria-label={`Step ${s.n}: ${s.title}`}>
                {done.includes(s.n) ? '✓' : s.n}
              </button>
            ))}
          </div>
        </Card>
      </Reveal>

      {/* ---------------------------------------------------------- steps */}
      <div className="space-y-3">
        {steps.map((s, i) => {
          const on = open === s.n
          const isDone = done.includes(s.n)
          return (
            <Reveal key={s.n} delay={Math.min(i * 0.04, 0.25)}>
              <Card className={cn('overflow-hidden transition-all', on && 'shadow-glow', s.finale && 'border-leaf-400/40')} pad={false}>
                <button onClick={() => setOpen(on ? null : s.n)} aria-expanded={on}
                  className="flex w-full items-center gap-3.5 p-4 text-left sm:p-5">
                  <span className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-xl', s.accent)} aria-hidden>
                    {s.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-black text-faint">STEP {s.n}</span>
                      {isDone && <Chip tone="live">Visited</Chip>}
                      {s.important && <Chip tone="demo">Say the disclaimer</Chip>}
                    </span>
                    <span className="mt-0.5 block font-display text-base font-black leading-tight sm:text-lg">{s.title}</span>
                  </span>
                  <motion.span className="shrink-0 text-faint" animate={{ rotate: on ? 180 : 0 }} aria-hidden>▾</motion.span>
                </button>

                {on && (
                  <motion.div className="border-t border-line/60 p-4 sm:p-5"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={spring}>
                    <div className="grid gap-3.5">
                      <div className="flex gap-2.5">
                        <span className="shrink-0 text-sm" aria-hidden>👆</span>
                        <p className="text-sm leading-relaxed text-muted"><span className="font-bold text-ink">Do this: </span>{s.click}</p>
                      </div>
                      <div className="flex gap-2.5">
                        <span className="shrink-0 text-sm" aria-hidden>🎤</span>
                        <p className="text-sm leading-relaxed text-muted" dangerouslySetInnerHTML={{ __html: `<span class="font-bold text-ink">Say this: </span>${s.say}` }} />
                      </div>
                      {s.important && (
                        <div className="flex gap-2.5 rounded-2xl border border-gold-400/35 bg-gold-400/10 p-3.5">
                          <span className="shrink-0 text-sm" aria-hidden>◆</span>
                          <p className="text-sm leading-relaxed text-muted"><span className="font-bold text-gold-600 dark:text-gold-400">Be explicit: </span>{s.important}</p>
                        </div>
                      )}
                      {s.finale && (
                        <div className="rounded-3xl bg-leaf-gradient p-6 text-center text-white shadow-glow">
                          <p className="font-display text-xl font-black tracking-tight sm:text-2xl">SMARTER FARMING STARTS HERE</p>
                          <p className="mt-1.5 text-sm opacity-90">One platform. The farmer&rsquo;s own language.</p>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2.5">
                        <Link href={s.href} className="btn btn-primary btn-sm">Open {s.title} →</Link>
                        {!isDone && (
                          <button onClick={() => setDone((d) => [...d, s.n])} className="btn btn-ghost btn-sm">Mark visited</button>
                        )}
                        {isDone && (
                          <button onClick={() => setDone((d) => d.filter((x) => x !== s.n))} className="btn btn-quiet btn-sm">Undo</button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </Card>
            </Reveal>
          )
        })}
      </div>

      {/* ----------------------------------------------------- also worth */}
      <h2 className="section-title">If you have more time</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {alsoWorth.map(([href, icon, title, blurb], i) => (
          <Reveal key={href} delay={Math.min(i * 0.03, 0.2)}>
            <Link href={href} className="card card-hover flex h-full items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-leaf-400/10 text-lg" aria-hidden>{icon}</span>
              <span className="min-w-0">
                <span className="block font-display font-bold leading-tight">{title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">{blurb}</span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>

      {/* -------------------------------------------------- honesty notes */}
      <Reveal delay={0.1}>
        <Card className="mt-6">
          <h2 className="text-base font-bold">What this prototype is not</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Worth stating before anyone asks. These limits are surfaced in the UI too, not hidden.
          </p>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {[
              ['No live data', 'Weather, mandi prices and market listings are static sample values.'],
              ['No AI model', 'Crop Doctor and the assistant are rule-based over the demo dataset.'],
              ['No accounts', 'Sign-in is a UI mock. No OTP is sent and no session is created on a server.'],
              ['No persistence', 'Anything you add lives in the browser tab and clears on refresh.'],
              ['No payments', 'Bookings and consultations are demonstrations only.'],
              ['Illustrative maps', 'Schematic views, not real tiles, routing or GPS.'],
            ].map(([k, v]) => (
              <li key={k} className="rounded-2xl border border-line/60 bg-surface/50 p-3.5">
                <p className="text-sm font-bold">{k}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{v}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-2xl border border-leaf-400/35 bg-leaf-400/10 p-3.5 text-sm leading-relaxed text-muted">
            What it <span className="font-bold text-ink">is</span>: a complete, coherent product surface —
            every screen designed, every flow walkable, every number labelled honestly, and all of it
            running offline with no external API to fail mid-pitch.
          </p>
        </Card>
      </Reveal>
    </div>
  )
}
