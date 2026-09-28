'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'
import { Card, Chip, Counter, DemoTag, PageHeader, Progress, Reveal, spring } from '@/components/ui'
import { BarChart, Donut, LineChart } from '@/components/charts'
import { expenseCategories, farmer, financeSummary, incomeBreakdown, lands, monthlyFinance } from '@/lib/data'
import { inr, num } from '@/lib/utils'

export default function FinancePage() {
  const [extra, setExtra] = useState<Array<{ id: number; cat: string; amount: number; note: string }>>([])
  const [cat, setCat] = useState(expenseCategories[0]!.id)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const extraTotal = extra.reduce((a, e) => a + e.amount, 0)
  const investment = financeSummary.totalInvestment + extraTotal
  const profit = financeSummary.expectedRevenue - investment
  const perAcre = profit / farmer.totalAcres

  const catData = expenseCategories.map((c) => ({
    ...c,
    amount: c.amount + extra.filter((e) => e.cat === c.id).reduce((a, e) => a + e.amount, 0),
  }))

  const add = () => {
    const n = parseFloat(amount)
    if (!n || n <= 0) return
    setExtra((e) => [...e, { id: Date.now(), cat, amount: n, note: note.trim() }])
    setAmount(''); setNote('')
  }

  return (
    <div className="section">
      <PageHeader
        icon="💰"
        title="Smart Farm Finance"
        sub={`Estimated position across ${farmer.totalAcres} acres · ${farmer.season}`}
        tag={<DemoTag />}
      >
        <div className="rounded-3xl border border-gold-400/35 bg-gold-400/10 p-4 text-sm leading-relaxed text-muted">
          <p className="mb-1 font-bold text-gold-600 dark:text-gold-400">◆ Estimates, not guarantees</p>
          {financeSummary.note}
        </div>
      </PageHeader>

      {/* ---------------------------------------------------------- summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: '📉', label: 'Total Investment', to: investment, tone: 'earth' as const, sub: `${catData.length} expense categories` },
          { icon: '📈', label: 'Expected Revenue', to: financeSummary.expectedRevenue, tone: 'leaf' as const, sub: 'Projected from sample yields' },
          { icon: '💵', label: 'Estimated Profit', to: profit, tone: 'gold' as const, sub: `ROI ≈ ${((profit / investment) * 100).toFixed(1)}%`, delta: 12.4 },
          { icon: '🌾', label: 'Profit per Acre', to: perAcre, tone: 'sky' as const, sub: `Across ${farmer.totalAcres} acres` },
        ].map((s, i) => (
          <Reveal key={s.label} delay={i * 0.06}>
            <Card hover className="relative h-full overflow-hidden">
              <div className={cnGlow(s.tone)} aria-hidden />
              <div className="relative">
                <div className="flex items-start justify-between gap-2">
                  <span className={cnBadge(s.tone)} aria-hidden>{s.icon}</span>
                  {s.delta && <span className="text-xs font-bold text-leaf-600 dark:text-leaf-400">↑ {s.delta}%</span>}
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">{s.label}</p>
                <p className="stat-value mt-1"><Counter to={s.to} prefix="₹" /></p>
                <p className="mt-1 text-sm text-muted">{s.sub}</p>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* --------------------------------------------------- expense split */}
        <Reveal>
          <Card className="h-full">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">Where the money goes</h2>
              <Chip tone="demo">Estimated</Chip>
            </div>
            <Donut
              data={catData.map((c) => ({ label: c.label, value: c.amount, color: c.color }))}
              centerValue={inr(investment, { compact: true })}
              centerLabel="Total spend"
            />
            <ul className="mt-5 space-y-2">
              {catData.sort((a, b) => b.amount - a.amount).map((c, i) => (
                <li key={c.id} className="flex items-center gap-3 text-sm">
                  <span className="w-6 text-center" aria-hidden>{c.icon}</span>
                  <span className="w-28 shrink-0 truncate font-semibold">{c.label}</span>
                  <Progress value={(c.amount / investment) * 100} className="flex-1" tone={i < 3 ? 'leaf' : 'gold'} />
                  <span className="w-20 shrink-0 text-right font-bold tabular-nums">{inr(c.amount)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>

        {/* ------------------------------------------------- monthly trend */}
        <Reveal delay={0.08}>
          <Card className="h-full">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">Investment vs revenue</h2>
              <Chip tone="demo">Sample</Chip>
            </div>
            <BarChart
              labels={monthlyFinance.labels}
              stacked={[
                { name: 'Investment', color: '#C0562A', data: monthlyFinance.investment },
                { name: 'Revenue', color: '#354A29', data: monthlyFinance.revenue },
              ]}
              height={240}
              formatValue={(v) => inr(v, { compact: true })}
            />
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                ['Best month', 'Sep', inr(94000, { compact: true })],
                ['Heaviest spend', 'Sep', inr(37100, { compact: true })],
                ['Net so far', '6 mo', inr(profit, { compact: true })],
              ].map(([k, a, v]) => (
                <div key={k} className="rounded-2xl border border-line/60 bg-surface/50 p-2.5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{k}</p>
                  <p className="text-xs font-semibold text-muted">{a}</p>
                  <p className="text-sm font-black tabular-nums">{v}</p>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        {/* ------------------------------------------------------ add expense */}
        <Reveal>
          <Card className="h-full">
            <h2 className="mb-1 text-base font-bold">Add an expense</h2>
            <p className="mb-4 text-xs text-muted">Recalculates every figure on this page instantly.</p>
            <div className="space-y-3">
              <label className="block">
                <span className="label">Category</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {expenseCategories.map((c) => (
                    <button key={c.id} onClick={() => setCat(c.id)}
                      className={cat === c.id
                        ? 'rounded-xl border border-leaf-400/60 bg-leaf-400/10 px-1 py-2 text-center text-[10px] font-bold'
                        : 'rounded-xl border border-line/70 px-1 py-2 text-center text-[10px] font-semibold text-muted transition-colors hover:text-ink'}>
                      <span className="block text-base" aria-hidden>{c.icon}</span>
                      <span className="mt-0.5 block truncate">{c.label}</span>
                    </button>
                  ))}
                </div>
              </label>
              <label className="block">
                <span className="label">Amount (₹)</span>
                <input className="input" type="number" min="0" value={amount}
                  onChange={(e) => setAmount(e.target.value)} placeholder="4500" />
              </label>
              <label className="block">
                <span className="label">Note (optional)</span>
                <input className="input" value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="Urea — 6 bags, Land 01" />
              </label>
              <button onClick={add} className="btn btn-primary w-full">Add expense</button>
            </div>

            {extra.length > 0 && (
              <>
                <div className="hairline my-4" />
                <ul className="space-y-1.5">
                  {extra.map((e) => (
                    <motion.li key={e.id} className="flex items-center justify-between gap-2 rounded-xl border border-line/60 px-3 py-2 text-xs"
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                      <span className="min-w-0 truncate">
                        <span className="font-bold">{expenseCategories.find((c) => c.id === e.cat)?.icon} {expenseCategories.find((c) => c.id === e.cat)?.label}</span>
                        {e.note && <span className="text-faint"> · {e.note}</span>}
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="font-bold tabular-nums">{inr(e.amount)}</span>
                        <button onClick={() => setExtra((p) => p.filter((x) => x.id !== e.id))}
                          aria-label="Remove" className="text-faint transition-colors hover:text-red-500">✕</button>
                      </span>
                    </motion.li>
                  ))}
                </ul>
                <p className="mt-2 text-right text-xs font-bold">Added: {inr(extraTotal)}</p>
              </>
            )}
            <p className="mt-4 text-[11px] leading-snug text-faint">
              Stored in this session only — refreshing clears your entries.
            </p>
          </Card>
        </Reveal>

        {/* ------------------------------------------------- income by crop */}
        <Reveal delay={0.08}>
          <Card className="h-full">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">Income by source</h2>
              <Chip tone="demo">Estimated</Chip>
            </div>
            <LineChart
              series={incomeBreakdown.map((b) => ({
                name: b.label, color: b.color,
                data: b.label === 'Paddy sales'
                  ? [0, 0, 12000, 38000, 62000, 56000]
                  : b.label === 'Chilli sales'
                    ? [0, 0, 0, 14000, 28000, 32000]
                    : b.label === 'Cotton sales'
                      ? [0, 0, 0, 0, 18000, 13000]
                      : [3800, 4100, 3900, 4300, 4200, 4400],
              }))}
              labels={monthlyFinance.labels}
              height={220}
              formatValue={(v) => inr(v, { compact: true })}
            />
            <ul className="mt-4 divide-y divide-line/60">
              {incomeBreakdown.map((b) => (
                <li key={b.label} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} aria-hidden />
                    <span className="font-semibold">{b.label}</span>
                  </span>
                  <span className="text-sm font-bold tabular-nums">{inr(b.value)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      </div>

      {/* ------------------------------------------------------- per-land P&L */}
      <Reveal delay={0.1}>
        <Card className="mt-6 overflow-x-auto">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold">Per-land estimate</h2>
            <Chip tone="demo">Sample assumptions</Chip>
          </div>
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line/70 text-left text-[11px] font-bold uppercase tracking-wider text-faint">
                <th className="py-2.5 pr-3">Land</th>
                <th className="py-2.5 pr-3">Crop</th>
                <th className="py-2.5 pr-3 text-right">Acres</th>
                <th className="py-2.5 pr-3 text-right">Est. cost</th>
                <th className="py-2.5 pr-3 text-right">Est. revenue</th>
                <th className="py-2.5 text-right">Est. margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {lands.map((l) => {
                const cost = Math.round(l.acres * (l.crop === 'Chilli' ? 58000 : l.crop === 'Cotton' ? 41000 : 34000))
                const rev = Math.round(l.acres * (l.crop === 'Chilli' ? 108000 : l.crop === 'Cotton' ? 72000 : 58000))
                const margin = ((rev - cost) / rev) * 100
                return (
                  <tr key={l.id} className="transition-colors hover:bg-line/20">
                    <td className="py-3 pr-3 font-semibold">{l.name}<span className="block text-xs font-normal text-faint">{l.location}</span></td>
                    <td className="py-3 pr-3 text-muted">{l.crop}</td>
                    <td className="py-3 pr-3 text-right tabular-nums">{num(l.acres, 1)}</td>
                    <td className="py-3 pr-3 text-right tabular-nums text-muted">{inr(cost)}</td>
                    <td className="py-3 pr-3 text-right tabular-nums font-semibold">{inr(rev)}</td>
                    <td className="py-3 text-right">
                      <span className={margin > 45 ? 'font-bold text-leaf-600 dark:text-leaf-400' : 'font-bold text-gold-600 dark:text-gold-400'}>
                        {margin.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="mt-4 text-xs leading-relaxed text-faint">
            Cost and revenue per acre are illustrative averages for the demo. Real figures vary widely
            with variety, input prices, labour availability, weather and how the produce is graded at sale.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link href="/planner" className="btn btn-ghost btn-sm">🗓️ Compare crops in the planner</Link>
            <Link href="/market" className="btn btn-ghost btn-sm">📈 Check current prices</Link>
          </div>
        </Card>
      </Reveal>
    </div>
  )
}

function cnGlow(t: string) {
  const m: Record<string, string> = {
    leaf: 'pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-leaf-400/20 to-transparent blur-2xl',
    gold: 'pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-gold-300/20 to-transparent blur-2xl',
    sky: 'pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-sky-400/20 to-transparent blur-2xl',
    earth: 'pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-earth-300/20 to-transparent blur-2xl',
  }
  return m[t]!
}
function cnBadge(t: string) {
  const m: Record<string, string> = {
    leaf: 'grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-leaf-400/20 to-transparent text-lg text-leaf-600 dark:text-leaf-400',
    gold: 'grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-gold-300/20 to-transparent text-lg text-gold-600 dark:text-gold-400',
    sky: 'grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-sky-400/20 to-transparent text-lg text-sky-500',
    earth: 'grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-earth-300/20 to-transparent text-lg text-earth-600 dark:text-earth-300',
  }
  return m[t]!
}
