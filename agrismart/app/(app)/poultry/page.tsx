'use client'

import Link from 'next/link'
import { Card, Chip, Counter, DemoTag, PageHeader, Progress, Reveal } from '@/components/ui'
import { BarChart, Donut, LineChart } from '@/components/charts'
import { poultryMonthly, poultrySummary as p } from '@/lib/data'
import { inr, num } from '@/lib/utils'

export default function PoultryPage() {
  const monthlyCost = p.feedCost + p.medicine + p.labour + p.electricity
  const eggRevenueMonth = p.eggsPerDay * p.eggPrice * 30
  const monthlyProfit = eggRevenueMonth - monthlyCost
  const costPerEgg = monthlyCost / (p.eggsPerDay * 30)
  const feedPerBird = p.feedKgPerDay / p.birds

  const costs = [
    { label: 'Feed', value: p.feedCost, color: '#d4a537' },
    { label: 'Labour', value: p.labour, color: '#8d6a45' },
    { label: 'Electricity', value: p.electricity, color: '#3b8fd4' },
    { label: 'Medicine', value: p.medicine, color: '#22965c' },
  ]

  return (
    <div className="section">
      <PageHeader
        icon="🐔"
        title="Poultry Farming"
        sub={`${num(p.birds)} ${p.breed} layers · week ${p.ageWeeks} of lay`}
        tag={<DemoTag />}
      >
        <div className="rounded-3xl border border-gold-400/35 bg-gold-400/10 p-4 text-sm leading-relaxed text-muted">
          <p className="mb-1 font-bold text-gold-600 dark:text-gold-400">◆ Sample flock data</p>
          Egg rate, feed cost and prices are demo figures for illustration. Layer economics move fast with
          maize and soya prices — recalculate your own cost per egg every month.
        </div>
      </PageHeader>

      {/* ---------------------------------------------------------- summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: '🥚', label: 'Eggs / Day', to: p.eggsPerDay, sub: `From ${num(p.birds)} birds`, dec: 0 },
          { icon: '📈', label: 'Lay Rate', to: p.eggRate, sub: 'Target for this age is 85–90%', suffix: '%' },
          { icon: '💸', label: 'Monthly Cost', to: monthlyCost, sub: `Feed is ${((p.feedCost / monthlyCost) * 100).toFixed(0)}% of it`, prefix: '₹' },
          { icon: '💰', label: 'Est. Monthly Profit', to: monthlyProfit, sub: 'Egg sales minus running cost', prefix: '₹' },
        ].map((s, i) => (
          <Reveal key={s.label} delay={i * 0.06}>
            <Card hover className="h-full">
              <div className="flex items-start justify-between gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gold-400/10 text-lg" aria-hidden>{s.icon}</span>
                {s.label === 'Est. Monthly Profit' && (
                  <Chip tone={monthlyProfit >= 0 ? 'live' : 'danger'}>{monthlyProfit >= 0 ? 'In profit' : 'At a loss'}</Chip>
                )}
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">{s.label}</p>
              <p className="stat-value mt-1">
                <Counter to={s.to} prefix={s.prefix ?? ''} suffix={s.suffix ?? ''} decimals={s.dec ?? 0} />
              </p>
              <p className="mt-1 text-sm text-muted">{s.sub}</p>
            </Card>
          </Reveal>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* ---------------------------------------------- monthly P&L chart */}
        <Reveal>
          <Card className="h-full">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">Revenue vs expenses</h2>
              <Chip tone="demo">Sample</Chip>
            </div>
            <BarChart
              labels={poultryMonthly.labels}
              stacked={[
                { name: 'Egg revenue', color: '#22965c', data: poultryMonthly.eggRevenue },
                { name: 'Bird sales', color: '#7fcfa4', data: poultryMonthly.birdRevenue },
                { name: 'Expenses', color: '#c0553f', data: poultryMonthly.expenses },
              ]}
              height={250}
              formatValue={(v) => inr(v, { compact: true })}
            />
            <div className="mt-4">
              <p className="label mb-2">Net position by month</p>
              <LineChart
                series={[{
                  name: 'Net',
                  color: '#d4a537',
                  data: poultryMonthly.labels.map((_, i) =>
                    (poultryMonthly.eggRevenue[i] ?? 0) + (poultryMonthly.birdRevenue[i] ?? 0) - (poultryMonthly.expenses[i] ?? 0)),
                }]}
                labels={poultryMonthly.labels}
                height={160}
                formatValue={(v) => inr(Math.round(v), { compact: true })}
              />
            </div>
          </Card>
        </Reveal>

        {/* ----------------------------------------------------- cost donut */}
        <Reveal delay={0.08}>
          <Card className="h-full">
            <h2 className="mb-4 text-base font-bold">Running cost split</h2>
            <Donut data={costs} centerValue={inr(monthlyCost, { compact: true })} centerLabel="Per month" />
            <ul className="mt-5 space-y-2">
              {costs.sort((a, b) => b.value - a.value).map((c) => (
                <li key={c.label} className="flex items-center gap-3 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden />
                  <span className="w-20 shrink-0 font-semibold">{c.label}</span>
                  <Progress value={(c.value / monthlyCost) * 100} className="flex-1" tone="gold" />
                  <span className="w-16 shrink-0 text-right font-bold tabular-nums">{inr(c.value, { compact: true })}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      </div>

      {/* ------------------------------------------------------- unit economics */}
      <h2 className="section-title">Unit economics</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { k: 'Cost per egg', v: `₹${costPerEgg.toFixed(2)}`, note: `Selling at ₹${p.eggPrice} — margin ₹${(p.eggPrice - costPerEgg).toFixed(2)}`, good: p.eggPrice > costPerEgg },
          { k: 'Feed per bird / day', v: `${(feedPerBird * 1000).toFixed(0)} g`, note: 'Healthy layers eat 105–115 g', good: feedPerBird * 1000 >= 100 && feedPerBird * 1000 <= 120 },
          { k: 'Feed conversion', v: `${(feedPerBird / (p.eggsPerDay / p.birds * 0.055)).toFixed(2)} kg/dozen`, note: 'Lower is better', good: true },
          { k: 'Cull bird value', v: inr(p.birdPrice), note: `${num(p.birds)} birds ≈ ${inr(p.birdPrice * p.birds, { compact: true })} at end of lay`, good: true },
        ].map((m, i) => (
          <Reveal key={m.k} delay={i * 0.06}>
            <Card className="h-full">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{m.k}</p>
              <p className="mt-1.5 font-display text-2xl font-black tabular-nums">{m.v}</p>
              <p className={m.good ? 'mt-1 text-xs text-muted' : 'mt-1 text-xs font-semibold text-red-500'}>{m.note}</p>
            </Card>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <Card className="mt-5">
          <h2 className="mb-3 text-base font-bold">Flock health checklist</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['💧', 'Water', 'Cleaners run twice daily; birds stop laying before they stop drinking.'],
              ['🌡️', 'Temperature', `Above 32 °C drops egg weight and shell quality. Run foggers in the afternoon.`],
              ['💡', 'Light hours', 'Layers need 16 hours of light. A drop below that shows up in egg rate within days.'],
              ['🩺', 'Vaccination', 'Ranikhet and IBD boosters on schedule; a single outbreak costs more than a year of medicine.'],
            ].map(([i, k, v]) => (
              <div key={k} className="flex gap-3 rounded-2xl border border-line/60 bg-surface/50 p-3.5">
                <span className="text-xl" aria-hidden>{i}</span>
                <div>
                  <p className="text-sm font-bold">{k}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{v}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-faint">
            ◆ General management reminders written for the demo, not veterinary advice. For illness in the
            flock, get a post-mortem and a vet&rsquo;s diagnosis rather than treating on symptoms.
          </p>
        </Card>
      </Reveal>

      <div className="mt-6 flex flex-wrap gap-2.5">
        <Link href="/experts" className="btn btn-ghost">👨‍🔬 Talk to a poultry vet</Link>
        <Link href="/learn" className="btn btn-ghost">📚 Reduce feed cost guide</Link>
        <Link href="/finance" className="btn btn-quiet">💰 Overall finances</Link>
      </div>
    </div>
  )
}
