'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, Chip, Delta, DemoTag, Modal, PageHeader, Reveal, Tabs } from '@/components/ui'
import NearbyServices from '@/components/maps/NearbyServices'
import { LineChart, Sparkline } from '@/components/charts'
import { marketRows, priceHistory } from '@/lib/data'
import type { FarmPlan } from '@/lib/farmPlan'
import { economics, loadPlan, marketPriceRef, onPlanChange, totalAcres } from '@/lib/farmPlan'
import { cropVisual } from '@/lib/cropDb'
import { cn, inr } from '@/lib/utils'

const MARKETS = ['All markets', ...Array.from(new Set(marketRows.map((r) => r.market)))]

export default function MarketPage() {
  const [market, setMarket] = useState('All markets')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'crop' | 'change'>('change')
  const [compare, setCompare] = useState(false)
  const [history, setHistory] = useState<string | null>(null)
  const [visible, setVisible] = useState<string[]>(priceHistory.series.map((s) => s.name))

  const rows = marketRows
    .filter((r) => market === 'All markets' || r.market === market)
    .filter((r) => r.crop.toLowerCase().includes(q.toLowerCase()))
    .map((r) => ({ ...r, change: ((r.price - r.prev) / r.prev) * 100 }))
    .sort((a, b) => (sort === 'change' ? b.change - a.change : a.crop.localeCompare(b.crop)))

  const hist = history ? marketRows.find((r) => r.crop === history) : null

  return (
    <div className="section">
      <PageHeader
        icon="📈"
        title="Market Intelligence"
        sub="Prices across nearby markets, MSP comparison and 12-week history."
        tag={<DemoTag />}
      >
        <div className="rounded-3xl border border-gold-400/35 bg-gold-400/10 p-4 text-sm leading-relaxed text-muted">
          <p className="mb-1 font-bold text-gold-600 dark:text-gold-400">◆ Sample data — not a live mandi feed</p>
          No real-time price API is connected in this prototype. Always confirm today&rsquo;s rate at your
          market yard before deciding when and where to sell.
        </div>
      </PageHeader>

      {/* --------------------------------------------- your crop (farm plan) */}
      <PlanMarketCard />

      {/* -------------------------------------------------------- controls */}
      <Card className="mb-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <input className="input lg:max-w-xs" placeholder="Search crop…" value={q}
            onChange={(e) => setQ(e.target.value)} aria-label="Search crops" />
          <Tabs
            className="lg:flex-1"
            tabs={MARKETS.map((m) => ({ id: m, label: m.replace(' Market', '') }))}
            active={market} onChange={setMarket}
          />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCompare(true)} className="btn btn-ghost btn-sm">⚖️ Compare Markets</button>
            <button onClick={() => setSort(sort === 'change' ? 'crop' : 'change')} className="btn btn-quiet btn-sm">
              Sort: {sort === 'change' ? 'Biggest move' : 'A–Z'}
            </button>
          </div>
        </div>
      </Card>

      {/* ----------------------------------------------------------- table */}
      <Reveal>
        <Card className="overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-line/70 bg-surface/50 text-left text-[11px] font-bold uppercase tracking-wider text-faint">
                  <th className="px-5 py-3">Crop</th>
                  <th className="px-3 py-3">Market</th>
                  <th className="px-3 py-3 text-right">Current Price</th>
                  <th className="px-3 py-3 text-right">Previous</th>
                  <th className="px-3 py-3 text-right">Change</th>
                  <th className="px-3 py-3 text-right">MSP</th>
                  <th className="px-3 py-3 text-center">Trend</th>
                  <th className="px-5 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/50">
                {rows.map((r, i) => {
                  const up = r.change >= 0
                  const aboveMsp = r.msp > 0 && r.price >= r.msp
                  return (
                    <tr key={r.crop + r.market}
                      className={cn('transition-colors hover:bg-line/20', i === 0 && sort === 'change' && 'bg-leaf-400/5')}>
                      <td className="px-5 py-3.5">
                        <p className="font-bold">{r.crop}</p>
                        {r.msp > 0 && (
                          <p className={cn('text-[11px] font-semibold', aboveMsp ? 'text-leaf-600 dark:text-leaf-400' : 'text-red-500')}>
                            {aboveMsp ? '▲ above MSP' : '▼ below MSP'}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-muted">{r.market}</td>
                      <td className="px-3 py-3.5 text-right font-black tabular-nums">
                        {inr(r.price)}<span className="block text-[11px] font-medium text-faint">per {r.unit}</span>
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums text-muted">{inr(r.prev)}</td>
                      <td className="px-3 py-3.5 text-right">
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-black tabular-nums',
                          up ? 'bg-leaf-400/10 text-leaf-600 dark:text-leaf-400' : 'bg-red-500/10 text-red-500')}>
                          {up ? '↑' : '↓'} {Math.abs(r.change).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums text-muted">
                        {r.msp > 0 ? inr(r.msp) : <span className="text-faint">—</span>}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex justify-center">
                          <Sparkline
                            data={priceHistory.series.find((s) => r.crop.toLowerCase().startsWith(s.name.toLowerCase()))?.data
                              ?? [r.prev * 0.96, r.prev * 0.98, r.prev, r.price * 0.99, r.price]}
                            color={up ? '#22965c' : '#c0553f'} width={80} height={26}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => setHistory(r.crop)}
                          className="text-xs font-bold text-leaf-600 transition-opacity hover:opacity-70 dark:text-leaf-400">
                          {r.date} · History →
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-muted">No crops match that search.</p>
          )}
        </Card>
      </Reveal>

      {/* ---------------------------------------------------------- trends */}
      <Reveal delay={0.08}>
        <Card className="mt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold">12-week price history</h2>
            <div className="flex flex-wrap gap-1.5">
              {priceHistory.series.map((s) => {
                const on = visible.includes(s.name)
                return (
                  <button key={s.name}
                    onClick={() => setVisible((v) => on ? v.filter((x) => x !== s.name) : [...v, s.name])}
                    className={cn('rounded-full border px-3 py-1 text-xs font-bold transition-all',
                      on ? 'border-transparent text-white' : 'border-line/70 text-faint hover:text-muted')}
                    style={on ? { background: s.color } : undefined}>
                    {s.name}
                  </button>
                )
              })}
            </div>
          </div>
          <LineChart
            series={priceHistory.series.filter((s) => visible.includes(s.name))}
            labels={priceHistory.labels} height={280}
            formatValue={(v) => inr(Math.round(v))}
          />
          {visible.length === 0 && <p className="py-8 text-center text-sm text-muted">Select a crop above to plot its trend.</p>}
        </Card>
      </Reveal>

      {/* -------------------------------------------------- compare modal */}
      <Modal open={compare} onClose={() => setCompare(false)} title="Compare markets" wide>
        <p className="mb-4 text-sm text-muted">
          Same crop across different market yards. Travel and loading cost usually decide whether the
          higher rate is actually worth it.
        </p>
        {Array.from(new Set(marketRows.map((r) => r.crop.split(' (')[0]!)))
          .filter((c) => marketRows.filter((r) => r.crop.startsWith(c)).length > 1)
          .map((crop) => {
            const rs = marketRows.filter((r) => r.crop.startsWith(crop)).sort((a, b) => b.price - a.price)
            const best = rs[0]!
            return (
              <div key={crop} className="mb-4">
                <p className="mb-2 text-sm font-bold">{crop}</p>
                <div className="space-y-1.5">
                  {rs.map((r) => {
                    const gap = ((r.price - best.price) / best.price) * 100
                    return (
                      <div key={r.market} className="flex items-center gap-3 rounded-2xl border border-line/60 px-3 py-2">
                        <span className="w-40 shrink-0 truncate text-xs font-semibold">{r.market}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line/40">
                          <div className="h-full rounded-full bg-leaf-gradient" style={{ width: `${(r.price / best.price) * 100}%` }} />
                        </div>
                        <span className="w-20 shrink-0 text-right text-sm font-black tabular-nums">{inr(r.price)}</span>
                        <span className={cn('w-16 shrink-0 text-right text-[11px] font-bold tabular-nums',
                          gap === 0 ? 'text-leaf-600 dark:text-leaf-400' : 'text-red-500')}>
                          {gap === 0 ? 'Best' : `${gap.toFixed(1)}%`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        <p className="mt-2 rounded-2xl border border-gold-400/35 bg-gold-400/10 p-3 text-xs leading-relaxed text-muted">
          ◆ Sample comparison. Transport, loading, market fee and moisture-based deductions can outweigh
          a small price difference — compare net realisation, not just the quoted rate.
        </p>
      </Modal>

      {/* ------------------------------------------------- history modal */}
      <Modal open={!!history} onClose={() => setHistory(null)} title={`Price history — ${history ?? ''}`} wide>
        {hist && (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Current', inr(hist.price)],
                ['Previous', inr(hist.prev)],
                ['Change', `${(((hist.price - hist.prev) / hist.prev) * 100).toFixed(1)}%`],
                ['MSP', hist.msp > 0 ? inr(hist.msp) : 'Not notified'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl border border-line/60 bg-surface/50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{k}</p>
                  <p className="mt-0.5 font-display text-lg font-black tabular-nums">{v}</p>
                </div>
              ))}
            </div>
            <LineChart
              series={[{
                name: hist.crop,
                color: seriesFor(hist).color,
                data: seriesFor(hist).data,
              }]}
              labels={priceHistory.labels} height={240}
              formatValue={(v) => inr(Math.round(v))}
            />
            <p className="mt-3 text-xs leading-relaxed text-faint">
              ◆ Illustrative 12-week series generated for the demo, not historical mandi data.
            </p>
          </>
        )}
      </Modal>

      <div className="mt-6 flex flex-wrap gap-2.5">
        <Chip tone="demo">{rows.length} crop–market rows</Chip>
        <Chip>Updated 23 Sep · demo</Chip>
        <Chip tone="info">MSP figures are illustrative</Chip>
      </div>

      <div className="mt-10">
        <NearbyServices
          categories={['market', 'buyer', 'storage']}
          title="Nearby markets & buyers"
          icon="🌾"
          subtitle="Market yards, buyers and storage within reach — distances are sample-data estimates"
          limit={6}
        />
      </div>

    </div>
  )
}

/**
 * Crops with an explicit history entry use it; everything else gets a
 * deterministic series that converges on the current price. Kept as a plain
 * function — never hang helpers off Object.prototype, it breaks React.
 */
function seriesFor(row: { crop: string; price: number; prev: number }): { color: string; data: number[] } {
  const known = priceHistory.series.find((s) => row.crop.toLowerCase().startsWith(s.name.toLowerCase()))
  if (known) return { color: known.color, data: known.data }

  const data: number[] = []
  let v = row.prev * 0.95
  for (let i = 0; i < 12; i++) {
    v += (row.price - v) * 0.22
    data.push(Math.round(v))
  }
  data[11] = row.price
  // Stable colour per crop name so the chart legend does not flicker.
  let h = 0
  for (let i = 0; i < row.crop.length; i++) h = (h * 31 + row.crop.charCodeAt(i)) % 360
  return { color: `hsl(${h} 55% 45%)`, data }
}

/* ------------------------------------------- plan-linked market context */

function PlanMarketCard() {
  const [plan, setPlan] = useState<FarmPlan | null>(null)
  useEffect(() => {
    setPlan(loadPlan())
    return onPlanChange(() => setPlan(loadPlan()))
  }, [])
  if (!plan?.chosenCrop) return null
  const ref = marketPriceRef(plan.chosenCrop)
  const eco = economics(plan, plan.chosenCrop)
  const vis = cropVisual(plan.chosenCrop)
  const acres = Math.round(totalAcres(plan) * 100) / 100
  const prev = marketRows.find((r) => r.crop === ref?.crop)?.prev
  const chg = ref && prev ? ((ref.price - prev) / prev) * 100 : 0
  return (
    <Reveal>
      <Card className="mb-5 border-leaf-400/35 bg-leaf-400/5">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-leaf-400/10 text-xl" aria-hidden>{vis.icon}</span>
          <div className="min-w-[200px] flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-leaf-600 dark:text-leaf-400">🌱 Your plan crop</p>
            <p className="text-base font-bold">{vis.label} · {acres} acres in your farm plan</p>
            {ref ? (
              <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                {ref.crop}: {inr(ref.price)}/quintal at {ref.market} · {ref.date}
                {ref.msp ? ` · MSP ${inr(ref.msp)}` : ''}
                {prev ? <Delta value={chg} /> : null}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-muted">No mandi row for this crop in the sample dataset yet.</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-faint">Est. revenue at this price</p>
            <p className="text-lg font-bold text-leaf-600 dark:text-leaf-400">{inr(eco.total.revenue)}</p>
            <p className="text-[9px] text-faint">Estimate — not guaranteed</p>
          </div>
          <Link href="/start" className="btn-primary text-xs">Open farm plan →</Link>
        </div>
      </Card>
    </Reveal>
  )
}
