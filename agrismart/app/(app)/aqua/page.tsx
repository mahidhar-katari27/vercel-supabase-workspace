'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, Chip, Counter, DemoTag, PageHeader, Progress, Reveal } from '@/components/ui'
import NearbyServices from '@/components/maps/NearbyServices'
import { Donut, LineChart } from '@/components/charts'
import { aquaCosts, aquaMarket, aquaPonds, aquaSummary } from '@/lib/data'
import { cn, inr, num } from '@/lib/utils'

/**
 * Days of culture elapsed for a pond — DOC drives feeding rate and survival
 * expectations, so it is the number an aqua farmer checks first.
 */
function doc(pond: (typeof aquaPonds)[number]): number {
  if (pond.status === 'Harvested') return pond.doc
  const start = new Date(pond.stocked).getTime()
  if (Number.isNaN(start)) return pond.doc
  return Math.max(0, Math.round((Date.now() - start) / 86400000))
}

export default function AquaPage() {
  const [sel, setSel] = useState(aquaPonds[0]!.id)
  const pond = aquaPonds.find((p) => p.id === sel) ?? aquaPonds[0]!
  const totalCost = aquaCosts.reduce((a, c) => a + c.amount, 0)

  return (
    <div className="section">
      <PageHeader
        icon="🐟"
        title="Aqua Farming"
        sub={`${aquaPonds.length} ponds · ${num(aquaPonds.reduce((a, p) => a + p.acres, 0), 1)} acres under culture`}
        tag={<DemoTag />}
      >
        <div className="rounded-3xl border border-gold-400/35 bg-gold-400/10 p-4 text-sm leading-relaxed text-muted">
          <p className="mb-1 font-bold text-gold-600 dark:text-gold-400">◆ Sample pond data</p>
          Survival, DOC and prices are demo figures. Shrimp culture is high-risk — a single disease outbreak
          or an oxygen crash can wipe out a pond. Track your own counts daily; do not plan on these numbers.
        </div>
      </PageHeader>

      {/* -------------------------------------------------------- summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: '💸', label: 'Total Investment', to: aquaSummary.investment, sub: `${aquaCosts.length} cost heads`, tone: 'earth' },
          { icon: '💰', label: 'Revenue to date', to: aquaSummary.revenue, sub: 'Includes Pond C harvest', tone: 'leaf' },
          { icon: '📊', label: 'Profit / Loss', to: aquaSummary.profit, sub: `ROI ${((aquaSummary.profit / aquaSummary.investment) * 100).toFixed(1)}%`, tone: 'gold' },
          { icon: '🍤', label: 'Avg FCR', to: aquaSummary.fcr, sub: 'Feed conversion ratio', tone: 'sky', dec: 2 },
        ].map((s, i) => (
          <Reveal key={s.label} delay={i * 0.06}>
            <Card hover className="h-full">
              <div className="flex items-start justify-between gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-leaf-400/10 text-lg" aria-hidden>{s.icon}</span>
                <Chip tone={s.label === 'Profit / Loss' ? (aquaSummary.profit >= 0 ? 'live' : 'danger') : 'demo'}>
                  {s.label === 'Profit / Loss' ? (aquaSummary.profit >= 0 ? 'In profit' : 'At a loss') : 'Sample'}
                </Chip>
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">{s.label}</p>
              <p className="stat-value mt-1">
                <Counter to={s.to} prefix={s.tone === 'sky' ? '' : '₹'} decimals={s.dec ?? 0} />
              </p>
              <p className="mt-1 text-sm text-muted">{s.sub}</p>
            </Card>
          </Reveal>
        ))}
      </div>

      {/* ------------------------------------------------------------ ponds */}
      <h2 className="section-title">Pond status</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {aquaPonds.map((p, i) => {
          const on = p.id === sel
          const d = doc(p)
          return (
            <Reveal key={p.id} delay={i * 0.06}>
              <button onClick={() => setSel(p.id)} aria-pressed={on}
                className={cn('card w-full text-left transition-all duration-300',
                  on ? 'border-leaf-400/60 shadow-glow' : 'card-hover')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display font-bold leading-tight">{p.name}</h3>
                    <p className="text-xs text-muted">{p.acres} acres · stocked {fmtDate(p.stocked)}</p>
                  </div>
                  <Chip tone={p.status === 'Active' ? 'live' : 'demo'}>{p.status}</Chip>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <Cell k="DOC" v={`${d} days`} />
                  <Cell k="Seed stocked" v={num(p.seed)} />
                  <Cell k="Survival" v={`${p.survival}%`} />
                  <Cell k="Avg body wt" v={p.doc > 0 ? `${p.doc} g` : '—'} />
                </dl>

                <div className="mt-3">
                  <Progress
                    value={Math.min(100, (d / 120) * 100)}
                    tone={p.survival >= 80 ? 'leaf' : p.survival >= 72 ? 'gold' : 'danger'}
                    label={p.status === 'Harvested' ? 'Harvested' : 'Culture progress (≈120 day cycle)'}
                    showValue
                  />
                </div>

                <p className="mt-2.5 text-xs font-semibold text-muted">
                  {p.status === 'Harvested' ? '✓ Pond closed for the season' : `🎯 Harvest ETA ${fmtDate(p.harvestEta)}`}
                </p>
              </button>
            </Reveal>
          )
        })}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* ------------------------------------------------------- cost split */}
        <Reveal>
          <Card className="h-full">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">Where the money goes</h2>
              <Chip tone="demo">Estimated</Chip>
            </div>
            <Donut
              data={aquaCosts.map((c) => ({ label: c.label, value: c.amount, color: c.color }))}
              centerValue={inr(totalCost, { compact: true })}
              centerLabel="Total cost"
            />
            <ul className="mt-5 space-y-2">
              {aquaCosts.slice().sort((a, b) => b.amount - a.amount).map((c) => (
                <li key={c.id} className="flex items-center gap-3 text-sm">
                  <span className="w-6 text-center" aria-hidden>{c.icon}</span>
                  <span className="w-24 shrink-0 truncate font-semibold">{c.label}</span>
                  <Progress value={(c.amount / totalCost) * 100} className="flex-1" />
                  <span className="w-20 shrink-0 text-right font-bold tabular-nums">{inr(c.amount, { compact: true })}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-2xl bg-surface/60 p-3 text-xs leading-relaxed text-muted">
              Feed is {((aquaCosts[0]!.amount / totalCost) * 100).toFixed(0)}% of your running cost, so FCR is the
              single most important number to watch. Every 0.1 improvement in FCR on a pond this size saves
              roughly {inr(Math.round(totalCost * 0.07), { compact: true })} a cycle.
            </p>
          </Card>
        </Reveal>

        {/* ------------------------------------------------- selected pond detail */}
        <Reveal delay={0.08}>
          <Card className="h-full">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">{pond.name}</h2>
              <Chip tone={pond.status === 'Active' ? 'live' : 'demo'}>{pond.status}</Chip>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                ['Species', pond.species],
                ['Water area', `${pond.acres} acres`],
                ['Days of culture', `${doc(pond)} days`],
                ['Seed stocked', `${num(pond.seed)} PL`],
                ['Survival', `${pond.survival}%`],
                ['Est. standing stock', `${num(Math.round((pond.seed * pond.survival) / 100 * (pond.doc / 1000)), 1)} kg`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl border border-line/60 bg-surface/50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{k}</p>
                  <p className="mt-0.5 font-display text-base font-black">{v}</p>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <p className="label mb-2">Projected growth curve (avg body weight, grams)</p>
              <LineChart
                series={[{ name: 'ABW', color: '#3b8fd4', data: growthCurve(pond.doc) }]}
                labels={growthLabels(pond.doc)}
                height={190}
                formatValue={(v) => `${Math.round(v)} g`}
              />
            </div>

            <p className="mt-3 text-xs leading-relaxed text-faint">
              ◆ A smooth textbook curve drawn from the current DOC — real growth is lumpy and depends on
              feed quality, water temperature and stocking density. Weigh a sample every week instead.
            </p>
          </Card>
        </Reveal>
      </div>

      {/* --------------------------------------------------------- market */}
      <Reveal delay={0.1}>
        <Card className="mt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold">Aqua market snapshot</h2>
            <Link href="/market" className="text-xs font-bold text-leaf-600 dark:text-leaf-400">Full market page →</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {aquaMarket.map((m) => (
              <div key={m.id} className="rounded-2xl border border-line/60 bg-surface/50 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 text-sm font-semibold leading-tight">
                    <span className="mr-1" aria-hidden>{m.icon}</span>{m.name}
                  </p>
                  <span className={cn('shrink-0 text-xs font-black tabular-nums',
                    m.trend >= 0 ? 'text-leaf-600 dark:text-leaf-400' : 'text-red-500')}>
                    {m.trend >= 0 ? '↑' : '↓'} {Math.abs(m.trend)}%
                  </span>
                </div>
                <p className="mt-2 font-display text-xl font-black tabular-nums">
                  {inr(m.price)}<span className="text-xs font-semibold text-muted"> / {m.unit.toLowerCase()}</span>
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-faint">◆ Sample prices. Count size (30/50/70) changes the rate sharply — always quote the count.</p>
        </Card>
      </Reveal>

      <div className="mt-6 flex flex-wrap gap-2.5">
        <Link href="/learn" className="btn btn-ghost">📚 Pond preparation guide</Link>
        <Link href="/experts" className="btn btn-ghost">👨‍🔬 Talk to an aqua expert</Link>
        <Link href="/finance" className="btn btn-quiet">💰 Overall finances</Link>
      </div>

      <div className="mt-10">
        <NearbyServices
          categories={['aqua', 'vet']}
          title="Aqua services near you"
          icon="🐟"
          subtitle="Feed, hatcheries and advisory services for ponds and tanks"
          limit={6}
        />
      </div>

    </div>
  )
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-faint">{k}</dt>
      <dd className="font-semibold tabular-nums">{v}</dd>
    </div>
  )
}

/** Textbook Vannamei weight curve normalised to the pond's current DOC. */
function growthCurve(currentDoc: number): number[] {
  if (currentDoc <= 0) return [1, 1, 1, 2, 2, 3]
  const out: number[] = []
  for (let i = 0; i < 6; i++) {
    const d = Math.max(1, Math.round((currentDoc / 5) * (i + 1)))
    // Sigmoid-ish: slow start, fast middle, tapering toward harvest size.
    out.push(Math.round(0.9 + 24 / (1 + Math.exp(-(d - 70) / 22))))
  }
  return out
}

function growthLabels(currentDoc: number): string[] {
  return Array.from({ length: 6 }, (_, i) => `DOC ${Math.max(1, Math.round((currentDoc / 5) * (i + 1)))}`)
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
