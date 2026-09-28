'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Counter, DemoTag, Reveal, SectionHeading, StatCard, spring } from '@/components/ui'
import MapCanvas from '@/components/maps/MapCanvas'
import { categoryColor } from '@/lib/googleMaps'
import { categoryMeta, geoPlaces } from '@/lib/places'
import { LineChart, Donut, Gauge } from '@/components/charts'
import { allSections } from '@/lib/nav'
import {
  alerts, expenseCategories, financeSummary, incomeBreakdown, lands,
  marketRows, priceHistory, weather, farmer,
} from '@/lib/data'
import { inr } from '@/lib/utils'

const FEATURES = [
  { href: '/start', icon: '🌱', title: 'Start Farming', body: 'Guided wizard for new farmers — the right crop for your land, water and budget, with full economics and a day-by-day plan.' },
  { href: '/farm', icon: '🌾', title: 'My Farm', body: 'Land profiles, soil, irrigation, crop stage and a live field map.' },
  { href: '/crop-doctor', icon: '🤖', title: 'AI Crop Doctor', body: 'Upload a leaf photo for an AI-assisted assessment with next steps.' },
  { href: '/planner', icon: '🗓️', title: 'Smart Crop Planner', body: 'Compare crops on cost, water, duration and indicative margin.' },
  { href: '/weather', icon: '🌦️', title: 'Weather & Alerts', body: 'Seven-day outlook with irrigation and spray-window advice.' },
  { href: '/finance', icon: '💰', title: 'Farm Finance', body: 'Investment, expense split and estimated profit per acre.' },
  { href: '/market', icon: '📈', title: 'Market Intelligence', body: 'Prices across markets, MSP comparison and 12-week history.' },
  { href: '/marketplace', icon: '🛒', title: 'Farmer Marketplace', body: 'Buy and sell crops, seed, inputs, fish, milk and eggs.' },
  { href: '/agrirent', icon: '🚜', title: 'AgriRent', body: 'Hire tractors, harvesters and drones by the hour, with drivers.' },
  { href: '/schemes', icon: '🏛️', title: 'Scheme Centre', body: 'Check eligibility and track applications through to approval.' },
  { href: '/aqua', icon: '🐟', title: 'Aqua Farming', body: 'Pond tracking, DOC, FCR, feed and cost per harvest.' },
  { href: '/community', icon: '👥', title: 'Community', body: 'Ask questions, share results and get answers from experts.' },
  { href: '/learn', icon: '📚', title: 'Learning Hub', body: 'Guides, articles and videos by topic and skill level.' },
  { href: '/map', icon: '📍', title: 'Smart Map', body: 'Markets, machinery, vets, offices and buyers on one live Google Map.' },
]

export default function LandingPage() {
  return (
    <>
      {/* ------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden pt-6 sm:pt-10">
        <div className="vlines pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <span className="spark absolute left-[11%] top-24 text-2xl" aria-hidden>✦</span>
        <span className="spark absolute right-[13%] top-40 text-sm" aria-hidden>✦</span>
        <span className="spark absolute left-[27%] top-80 text-sm" aria-hidden>＋</span>
        <span className="spark absolute right-[25%] top-96 text-lg" aria-hidden>✦</span>

        <div className="section relative text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={spring}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-line/70 bg-surface/70 px-4 py-1.5 text-[11px] font-bold tracking-wide text-muted"
          >
            <span className="relative flex h-1.5 w-1.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-leaf-500" />
            </span>
            Top-Notch Agri Intelligence Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.06 }}
            className="mx-auto max-w-4xl font-display text-[2.9rem] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-6xl lg:text-[4.6rem]"
          >
            Agriculture,
            <br />
            Made Smarter.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.14 }}
            className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted sm:text-base"
          >
            Plan your farm, understand your crops, track your money,
            and make better farming decisions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.22 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/start" className="btn btn-primary btn-lg group">
              <span aria-hidden>🌱</span> Start Farming
              <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>→</span>
            </Link>
            <Link href="/dashboard" className="btn btn-ghost btn-lg">Explore AgriSmart</Link>
            <Link href="/crop-doctor" className="btn btn-quiet btn-lg"><span aria-hidden>🤖</span> AI Crop Doctor</Link>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.7 }}
            className="mt-4 text-[11px] text-faint"
          >
            25+ modules · 3 languages · 5 user roles · demo data clearly labelled
          </motion.p>
        </div>

        {/* full-bleed photo band */}
        <motion.div
          initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.18 }}
          className="relative mt-12 h-[380px] w-full sm:h-[460px]"
        >
          <Image src="/start/hero.jpg" alt="Farmer walking a young field at sunrise" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" aria-hidden />
          {/* progressive live-looking data rail — WEATHER → CROP → WATER → MARKET */}
          <div className="absolute left-5 top-1/2 hidden -translate-y-1/2 sm:block" aria-hidden={false}>
            <div className="relative flex flex-col gap-3">
              <span className="absolute bottom-4 left-[13px] top-4 w-px bg-white/25" aria-hidden />
              {[
                ['WEATHER', '🌦', '28°C', 'Partly cloudy · Vijayawada'],
                ['CROP', '🌾', 'Paddy', 'Vegetative stage · day 68'],
                ['WATER', '💧', 'Soil moisture 64%', 'Borewell + rainfed'],
                ['MARKET', '₹', '₹48,500 est. return', 'Sample estimate only'],
              ].map(([tag, icon, val, sub], i) => (
                <motion.div
                  key={tag}
                  initial={{ opacity: 0, x: -14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ ...spring, delay: 0.25 + i * 0.35 }}
                  className="relative flex items-center gap-3 rounded-2xl border border-white/15 bg-black/35 px-3.5 py-2.5 backdrop-blur-md"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/12 text-sm" aria-hidden>{icon}</span>
                  <span>
                    <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-white/60">{tag}</span>
                    <span className="block text-sm font-bold leading-tight text-white">{val}</span>
                    <span className="block text-[10px] text-white/60">{sub}</span>
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-6 sm:p-10">
            <p className="max-w-sm font-display text-2xl font-semibold leading-tight text-white sm:text-3xl">
              The journey from soil to sale — in one picture.
            </p>
            <Link href="/demo" className="text-xs font-semibold text-white/85 underline-offset-4 hover:underline">
              Book a free demo experience
            </Link>
          </div>
        </motion.div>
      </section>

      {/* -------------------------------------------------------- stats bar */}
      <section className="section">
        <div className="grid grid-cols-2 gap-y-8 border-b border-line/60 py-9 md:grid-cols-4 md:divide-x md:divide-line/60">
          {[
            ['50+', 'Years of field experience'],
            ['200+', 'Acres under management'],
            ['120,000+', 'Farmers reached statewide'],
            ['₹15 Billion', 'Agricultural produce tracked'],
          ].map(([v, l], i) => (
            <Reveal key={l} delay={i * 0.06}>
              <div className="px-6 text-center md:text-left">
                <p className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{v}</p>
                <p className="mt-1 text-xs text-muted">{l}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="flex items-center justify-end gap-2 pt-2 text-[10px] text-faint">
          Illustrative brand figures — demo dataset <DemoTag />
        </p>
      </section>

      {/* ------------------------------------------------- editorial statement */}
      <section className="section mt-16 sm:mt-24">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.6fr]">
          <div className="flex flex-col justify-between gap-12">
            <p className="text-sm text-muted">2026</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span className="font-semibold text-ink">Crop farming</span>
              <span className="text-faint">Aqua & livestock</span>
              <span className="text-faint">Agri services</span>
            </div>
          </div>
          <div>
            <Reveal>
              <h2 className="max-w-2xl font-display text-3xl font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[2.6rem]">
                Despite advances in agri-tech, labour-intensive farming still runs on
                guesswork — scattered prices, weather surprises and paper records.
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              <p className="text-sm font-semibold">Grounded in the field.</p>
              <p className="text-sm font-semibold">Built for what&rsquo;s next.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- live strip */}
      <section className="section mt-16 sm:mt-24">
        <Reveal>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {marketRows.slice(0, 6).map((r, i) => {
              const up = r.price >= r.prev
              const change = ((r.price - r.prev) / r.prev) * 100
              return (
                <motion.div key={r.crop}
                  initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ ...spring, delay: i * 0.05 }}
                  className="glass flex min-w-[190px] shrink-0 items-center justify-between gap-4 rounded-2xl px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-muted">{r.crop}</p>
                    <p className="font-display text-base font-bold tabular-nums">{inr(r.price)}<span className="text-xs font-medium text-faint">/{r.unit.slice(0, 3)}</span></p>
                  </div>
                  <span className={cnUpDown(up)}>{up ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%</span>
                </motion.div>
              )
            })}
            <div className="flex shrink-0 items-center px-2"><DemoTag /></div>
          </div>
        </Reveal>
      </section>

      {/* --------------------------------------------------------- features */}
      <section className="section mt-16 sm:mt-24">
        <SectionHeading
          eyebrow="Everything in one place"
          title="The whole farm, on one screen"
          sub="AgriSmart brings crop management, money, markets, machinery, schemes and community together — so a farmer is not switching between eight different apps and offices."
          right={<Link href="/dashboard" className="btn btn-ghost">Open dashboard <span aria-hidden>→</span></Link>}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.href} delay={i * 0.04}>
              <Link href={f.href} className="card card-hover group block h-full p-5">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-leaf-400/10 text-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" aria-hidden>
                  {f.icon}
                </span>
                <h3 className="mt-4 text-base font-bold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-leaf-600 opacity-0 transition-all duration-300 group-hover:opacity-100 dark:text-leaf-400">
                  Open <span aria-hidden>→</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------- start farming */}
      <section className="section mt-16 sm:mt-24">
        <div className="card relative overflow-hidden border-leaf-400/30 bg-gradient-to-br from-leaf-400/5 to-transparent p-6 sm:p-10">
          <div className="relative grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-leaf-600 dark:text-leaf-400">New · Zero experience needed</div>
              <h2 className="text-2xl font-bold sm:text-3xl">Don&rsquo;t know what to grow? <span className="text-leaf-600 dark:text-leaf-400">Start here.</span></h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
                The guided Start Farming wizard turns 7 simple answers — location, land, soil, water, budget, goals and
                start date — into a complete farm plan: suitability-ranked crops with transparent reasons, per-acre
                economics, live weather, a stage-by-stage calendar and daily tasks that sync to your dashboard and My Farm.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs font-semibold">
                {['📍 Location', '🌾 Land', '🧪 Soil', '💧 Water', '💰 Budget', '🎯 Goals', '🗓️ Start'].map((f, i) => (
                  <span key={f} className="flex items-center gap-2">
                    <span className="rounded-full border border-line/70 bg-surface-2/60 px-3 py-1.5 dark:bg-black/15">{f}</span>
                    {i < 6 && <span className="text-faint" aria-hidden>→</span>}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/start" className="btn-primary">🌱 Create My Farm Plan</Link>
                <Link href="/start" className="btn-ghost">🔎 Explore crops first</Link>
              </div>
              <p className="mt-3 text-[11px] text-faint">Live weather via Open-Meteo · mandi prices show market + date · every money figure is a clearly-labelled estimate.</p>
            </div>
            <div className="relative self-start">
              <div className="relative overflow-hidden rounded-3xl border border-line/60 shadow-lift">
                <Image src="/start/hero.jpg" alt="A farmer inspecting a young field at sunrise" width={720} height={480} className="h-auto w-full object-cover" />
              </div>
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                className="absolute -bottom-5 -left-3 w-52 rounded-2xl border border-line/60 bg-surface/95 p-3.5 shadow-lift backdrop-blur dark:bg-surface-2/95">
                <p className="text-xs font-bold">🌾 Paddy · 88% fit</p>
                <p className="mt-0.5 text-[11px] text-muted">Black soil + canal water + June start</p>
                <p className="mt-1 text-[10px] text-faint">Indicative suitability · not a guarantee</p>
              </motion.div>
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                className="absolute -top-4 right-2 w-44 rounded-2xl border border-line/60 bg-surface/95 p-3 text-center shadow-lift backdrop-blur dark:bg-surface-2/95">
                <p className="text-[10px] font-bold uppercase tracking-wider text-faint">Est. profit / acre</p>
                <p className="text-lg font-bold text-leaf-600 dark:text-leaf-400">₹16,750</p>
                <p className="text-[9px] text-faint">Sample estimate only</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- AI */}
      <section className="section mt-16 sm:mt-24">
        <div className="card relative overflow-hidden p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-leaf-400/10 blur-3xl" aria-hidden />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <SectionHeading
                eyebrow="AI + Agriculture"
                title="Ask in English, Telugu or Tenglish"
                sub="The AgriSmart assistant answers the way farmers actually type and speak — with a microphone for hands-free use in the field."
              />
              <div className="space-y-2.5">
                {[
                  '“Naaku 3 acres land undhi, paddy ki entha investment avtundi?”',
                  '“Nearby tractor kavali.”',
                  '“Naaku available schemes enti?”',
                ].map((q, i) => (
                  <Reveal key={q} delay={i * 0.08}>
                    <div className="glass rounded-2xl px-4 py-3 text-sm text-muted">{q}</div>
                  </Reveal>
                ))}
                <Reveal delay={0.3}>
                  <div className="rounded-2xl bg-leaf-gradient px-4 py-3 text-sm text-white shadow-glow">
                    3 acres paddy ki sample assumptions prakaram estimated investment ₹91,800 – ₹117,300
                    range lo undochu. Actual cost local input prices batti marutundi.
                  </div>
                </Reveal>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/crop-doctor" className="btn btn-primary"><span aria-hidden>🤖</span> Try Crop Doctor</Link>
                <Link href="/dashboard" className="btn btn-ghost">Open assistant</Link>
              </div>
            </div>

            <div className="space-y-4">
              <Card2 title="Crop health" icon="🌱" right={<DemoTag />}>
                <div className="flex items-center gap-6">
                  <Gauge value={92} label="Healthy" size={130} />
                  <ul className="flex-1 space-y-2 text-sm">
                    {lands.map((l) => (
                      <li key={l.id} className="flex items-center justify-between gap-2">
                        <span className="truncate text-muted">{l.crop} · {l.name}</span>
                        <span className={cnUpDown(l.health >= 85)}>{l.health}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card2>
              <Card2 title="Where the money goes" icon="💰" right={<DemoTag />}>
                <Donut
                  data={expenseCategories.slice(0, 5).map((e) => ({ label: e.label, value: e.amount, color: e.color }))}
                  centerValue={inr(financeSummary.totalInvestment, { compact: true })}
                  centerLabel="Invested"
                  size={150} thickness={18}
                />
              </Card2>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- demo journey */}
      <section className="section mt-16 sm:mt-24">
        <SectionHeading
          eyebrow="Guided tour"
          title="See AgriSmart in one flow"
          sub="The hackathon demo walks from a land profile through crop diagnosis, finance, market, schemes, machinery booking and the AI assistant."
          center
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DEMO_STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.05}>
              <Link href={s.href} className="card card-hover group flex h-full items-start gap-3 p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-leaf-400/10 text-xs font-black text-leaf-700 dark:text-leaf-300">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{s.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted">{s.body}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.2}>
          <div className="mt-6 text-center">
            <Link href="/demo" className="btn btn-gold btn-lg">
              <span aria-hidden>▶</span> Run the guided demo
            </Link>
          </div>
        </Reveal>
      </section>

      {/* --------------------------------------------------------- sectors */}
      <section className="section mt-16 sm:mt-24">
        <SectionHeading eyebrow="Beyond crops" title="Livestock, aqua and dairy too" />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { href: '/aqua', icon: '🐟', title: 'Aqua Farming', stat: 'FCR 1.42', sub: 'Pond-level cost, survival and harvest tracking', hue: 195 },
            { href: '/poultry', icon: '🐔', title: 'Poultry', stat: '2,400 birds', sub: 'Feed, egg rate and automatic profit calculation', hue: 30 },
            { href: '/dairy', icon: '🐄', title: 'Dairy', stat: '78 L / day', sub: 'Morning and evening yield with expense split', hue: 210 },
          ].map((s, i) => (
            <Reveal key={s.href} delay={i * 0.07}>
              <Link href={s.href} className="card card-hover group relative block h-full overflow-hidden p-6">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl transition-opacity duration-500 group-hover:opacity-90"
                  style={{ background: `hsl(${s.hue} 60% 50% / 0.2)` }} aria-hidden />
                <div className="relative">
                  <span className="text-3xl" aria-hidden>{s.icon}</span>
                  <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted">{s.sub}</p>
                  <p className="mt-4 font-display text-2xl font-black">{s.stat}</p>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Demo figure</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ final CTA */}
      <section className="section mt-16 sm:mt-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-4xl bg-leaf-gradient px-6 py-14 text-center shadow-glow sm:px-12 sm:py-20">
            <div className="bg-noise pointer-events-none absolute inset-0 opacity-30" aria-hidden />
            {[...Array(9)].map((_, i) => (
              <span key={i} className="pointer-events-none absolute text-2xl opacity-20"
                style={{
                  left: `${8 + i * 10.5}%`, top: `${12 + (i % 3) * 28}%`,
                  animation: `float ${6 + (i % 4)}s ease-in-out ${i * 0.4}s infinite`,
                }} aria-hidden>🌾</span>
            ))}
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/70">AgriSmart 2.0</p>
              <h2 className="mt-4 font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
                SMARTER FARMING
                <br />STARTS HERE.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
                AI + Agriculture · Finance + Markets · Services + Community
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/dashboard" className="btn btn-gold btn-lg">
                  Start Your Farm Journey <span aria-hidden>→</span>
                </Link>
                <Link href="/demo" className="btn btn-lg !bg-white/10 !text-white hover:!bg-white/20">
                  Run the demo flow
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ------------------------------------------------------ all routes */}
      {/* ------------------------------------------------------- smart map */}
      <section className="section mt-16 sm:mt-24">
        <SectionHeading
          eyebrow="Google Maps Platform"
          title="One map, woven through the whole app"
          sub="Markets, machinery, veterinary care, agriculture offices, experts, buyers and storage — plotted around your farm with distances and one-tap directions. Runs on the live Google Maps JavaScript API when a key is configured, and on a clearly labelled demo map when it is not."
          right={<Link href="/map" className="btn btn-primary">Open Smart Map <span aria-hidden>→</span></Link>}
        />
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <Reveal>
            <MapCanvas
              height={380}
              center={{ lat: 16.5062, lng: 80.648 }}
              zoomKm={42}
              markers={geoPlaces.slice(0, 18).map((p) => ({
                id: p.id, lat: p.coords.lat, lng: p.coords.lng,
                icon: categoryMeta(p.category).icon,
                color: categoryColor[p.category] ?? '#166534',
                label: p.name, sub: categoryMeta(p.category).label,
              }))}
            />
          </Reveal>
          <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {[
              { href: '/farm', icon: '🌾', t: 'My Farm', b: 'Pin the exact farm location; every nearby service measures from it.' },
              { href: '/agrirent', icon: '🚜', t: 'AgriRent', b: 'Each machine shows distance, service radius, map and directions.' },
              { href: '/market', icon: '📈', t: 'Market Intelligence', b: 'Nearby market yards with distance and a route before you haul.' },
              { href: '/schemes', icon: '🏛️', t: 'Government Services', b: 'Offices, RBKs, testing labs and storage with opening info.' },
            ].map((x, i) => (
              <Reveal key={x.href} delay={i * 0.06}>
                <Link href={x.href} className="card card-hover block p-4">
                  <span className="text-xl" aria-hidden>{x.icon}</span>
                  <h3 className="mt-1.5 text-sm font-bold">{x.t}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{x.b}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section mt-16 sm:mt-20">
        <SectionHeading eyebrow="Sitemap" title="Every module" center />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {allSections.map((g) => (
            <div key={g.title}>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">{g.title}</p>
              <ul className="space-y-1.5">
                {g.items.map((it) => (
                  <li key={it.href}>
                    <Link href={it.href} className="footer-link flex items-center gap-2 text-sm text-muted">
                      <span aria-hidden>{it.icon}</span>{it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

/* ------------------------------------------------------------ demo steps */

const DEMO_STEPS = [
  { href: '/dashboard', title: 'Farmer dashboard', body: 'Land, profit, crop health and market at a glance' },
  { href: '/farm', title: 'Select Land 01', body: '2.5-acre paddy farm in Vijayawada' },
  { href: '/crop-doctor', title: 'AI Crop Doctor', body: 'Upload a sample leaf image and see the assessment' },
  { href: '/finance', title: 'Farm Finance', body: 'Expenses by category and estimated profit' },
  { href: '/market', title: 'Market Intelligence', body: 'Sample mandi prices and 12-week history' },
  { href: '/schemes', title: 'Check my eligibility', body: 'Potentially relevant schemes with documents' },
  { href: '/agrirent', title: 'Book a tractor', body: 'Machine, date, time, driver, confirm' },
  { href: '/community', title: 'Ask the community', body: 'Questions answered by farmers and experts' },
]

/* ------------------------------------------------------------- card + misc */

function Card2({ title, icon, right, children }: { title: string; icon: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass rounded-3xl p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-bold">
          <span aria-hidden>{icon}</span>{title}
        </p>
        {right}
      </div>
      {children}
    </div>
  )
}

function cnUpDown(up: boolean, extra = '') {
  return `${extra} ${up ? 'text-leaf-600 dark:text-leaf-400' : 'text-red-500'} font-bold tabular-nums`
}
