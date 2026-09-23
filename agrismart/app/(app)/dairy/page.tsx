'use client'

import Link from 'next/link'
import { Card, Chip, Counter, DemoTag, PageHeader, Progress, Reveal } from '@/components/ui'
import NearbyServices from '@/components/maps/NearbyServices'
import { BarChart, LineChart } from '@/components/charts'
import { dairySummary as d, dairyWeek } from '@/lib/data'
import { inr, num } from '@/lib/utils'

export default function DairyPage() {
  const monthlyLitres = d.milkPerDay * 30
  const monthlyRevenue = monthlyLitres * d.milkPrice
  const monthlyCost = d.feedCost + d.vetCost + d.labour
  const monthlyProfit = monthlyRevenue - monthlyCost
  const costPerLitre = monthlyCost / monthlyLitres
  const perAnimal = monthlyRevenue / d.cattle

  return (
    <div className="section">
      <PageHeader
        icon="🐄"
        title="Dairy Farming"
        sub={`${d.cattle} ${d.breed} · ${d.milkPerDay} litres a day`}
        tag={<DemoTag />}
      >
        <div className="rounded-3xl border border-gold-400/35 bg-gold-400/10 p-4 text-sm leading-relaxed text-muted">
          <p className="mb-1 font-bold text-gold-600 dark:text-gold-400">◆ Sample herd data</p>
          Yield, feed cost and milk rate are demo figures. Procurement rates vary by fat and SNF content —
          your cooperative&rsquo;s daily slip is the only number that matters for real income.
        </div>
      </PageHeader>

      {/* ---------------------------------------------------------- summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: '🥛', label: 'Milk / Day', to: d.milkPerDay, sub: `${d.morningLitres} L morning · ${d.eveningLitres} L evening`, suffix: ' L' },
          { icon: '🐄', label: 'Yield per Animal', to: d.milkPerDay / d.cattle, sub: `Across ${d.cattle} in milk`, dec: 1, suffix: ' L' },
          { icon: '💸', label: 'Monthly Cost', to: monthlyCost, sub: `Feed is ${((d.feedCost / monthlyCost) * 100).toFixed(0)}% of it`, prefix: '₹' },
          { icon: '💰', label: 'Est. Monthly Profit', to: monthlyProfit, sub: `at ${inr(d.milkPrice)}/litre`, prefix: '₹' },
        ].map((s, i) => (
          <Reveal key={s.label} delay={i * 0.06}>
            <Card hover className="h-full">
              <div className="flex items-start justify-between gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-leaf-400/10 text-lg" aria-hidden>{s.icon}</span>
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
        {/* ------------------------------------------------- weekly yield */}
        <Reveal>
          <Card className="h-full">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold">This week&rsquo;s milking</h2>
              <Chip tone="demo">Sample</Chip>
            </div>
            <BarChart
              labels={dairyWeek.labels}
              stacked={[
                { name: 'Morning', color: '#22965c', data: dairyWeek.morning },
                { name: 'Evening', color: '#7fcfa4', data: dairyWeek.evening },
              ]}
              height={230}
              formatValue={(v) => `${Math.round(v)} L`}
            />
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                ['Week total', `${num(dairyWeek.morning.reduce((a, b) => a + b, 0) + dairyWeek.evening.reduce((a, b) => a + b, 0), 0)} L`],
                ['Best day', dairyWeek.labels[dairyWeek.morning.indexOf(Math.max(...dairyWeek.morning))] ?? '—'],
                ['Morning share', `${((dairyWeek.morning.reduce((a, b) => a + b, 0) / (dairyWeek.morning.reduce((a, b) => a + b, 0) + dairyWeek.evening.reduce((a, b) => a + b, 0))) * 100).toFixed(0)}%`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl border border-line/60 bg-surface/50 p-2.5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{k}</p>
                  <p className="font-display text-base font-black">{v}</p>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>

        {/* ----------------------------------------------------- economics */}
        <Reveal delay={0.08}>
          <Card className="h-full">
            <h2 className="mb-4 text-base font-bold">Herd economics</h2>
            <div className="space-y-2 text-sm">
              {[
                ['Monthly milk', `${num(monthlyLitres)} L`],
                ['Rate', `${inr(d.milkPrice)} / litre`],
                ['Revenue', inr(monthlyRevenue)],
                ['Feed cost', `− ${inr(d.feedCost)}`],
                ['Labour', `− ${inr(d.labour)}`],
                ['Veterinary', `− ${inr(d.vetCost)}`],
              ].map(([k, v], i) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <span className="text-muted">{k}</span>
                  <span className={i === 2 ? 'font-bold tabular-nums' : 'font-semibold tabular-nums'}>{v}</span>
                </div>
              ))}
              <div className="hairline !my-2" />
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold">Net per month</span>
                <span className="font-display text-2xl font-black tabular-nums text-leaf-600 dark:text-leaf-400">
                  {inr(monthlyProfit)}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <p className="label mb-1.5">Cost per litre</p>
                <div className="flex items-center gap-3">
                  <Progress value={(costPerLitre / d.milkPrice) * 100} tone={costPerLitre < d.milkPrice ? 'leaf' : 'danger'} className="flex-1" />
                  <span className="shrink-0 text-sm font-black tabular-nums">₹{costPerLitre.toFixed(2)}</span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Selling at {inr(d.milkPrice)} — margin ₹{(d.milkPrice - costPerLitre).toFixed(2)} per litre
                </p>
              </div>
              <div>
                <p className="label mb-1.5">Revenue per animal</p>
                <div className="flex items-center gap-3">
                  <Progress value={Math.min(100, (perAnimal / 5000) * 100)} tone="gold" className="flex-1" />
                  <span className="shrink-0 text-sm font-black tabular-nums">{inr(perAnimal, { compact: true })}</span>
                </div>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>

      {/* ------------------------------------------------- yield vs rate */}
      <Reveal delay={0.1}>
        <Card className="mt-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-bold">Yield trend &amp; what moves your rate</h2>
            <Chip tone="demo">Sample</Chip>
          </div>
          <LineChart
            series={[
              { name: 'Morning L', color: '#22965c', data: dairyWeek.morning },
              { name: 'Evening L', color: '#7fcfa4', data: dairyWeek.evening },
              { name: 'Total L', color: '#d4a537', data: dairyWeek.labels.map((_, i) => dairyWeek.morning[i]! + dairyWeek.evening[i]!) },
            ]}
            labels={dairyWeek.labels}
            height={200}
            formatValue={(v) => `${Math.round(v)} L`}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ['🌿', 'Ration balance', 'Green fodder plus a balanced concentrate moves yield further than extra concentrate alone.'],
              ['🧂', 'Minerals', 'A deficiency shows up as a slow yield drop over weeks, not a sudden one. Mineral mixtures are cheap insurance.'],
              ['🩺', 'Mastitis', 'Check the first few squirts every milking. One untreated quarter can cost a whole lactation.'],
            ].map(([i, k, v]) => (
              <div key={k} className="rounded-2xl border border-line/60 bg-surface/50 p-3.5">
                <p className="text-sm font-bold"><span className="mr-1" aria-hidden>{i}</span>{k}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{v}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-faint">
            ◆ General husbandry reminders for the demo, not veterinary advice.
          </p>
        </Card>
      </Reveal>

      <div className="mt-6 flex flex-wrap gap-2.5">
        <Link href="/experts" className="btn btn-ghost">👨‍🔬 Talk to a vet</Link>
        <Link href="/learn" className="btn btn-ghost">📚 Ration balancing guide</Link>
        <Link href="/schemes" className="btn btn-quiet">🏛️ Dairy subsidy schemes</Link>
      </div>

      <div className="mt-10">
        <NearbyServices
          categories={['dairy', 'vet']}
          title="Dairy & veterinary services near you"
          icon="🐄"
          subtitle="Chilling centres, co-op societies and livestock vets around your farm"
          limit={6}
        />
      </div>

    </div>
  )
}
