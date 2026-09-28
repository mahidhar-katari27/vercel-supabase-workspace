'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, Chip, Counter, DemoTag, Modal, PageHeader, Progress, Reveal, spring } from '@/components/ui'
import { BarChart, Donut } from '@/components/charts'
import { cropPlans, irrigationTypes, lands, soilTypes, type PlanOption } from '@/lib/data'
import { cn, inr } from '@/lib/utils'

const seasons = ['Kharif', 'Rabi', 'Summer']

/**
 * Base suitability comes from the demo dataset; these weights nudge it for the
 * user's own inputs. It ranks options — it does not predict yield or profit,
 * and every figure on screen is labelled as an estimate.
 */
const waterScore: Record<PlanOption['water'], number> = { Low: 0, Medium: -4, High: -10 }
const waterFit: Record<string, PlanOption['water'][]> = {
  Borewell: ['Low', 'Medium', 'High'],
  Canal: ['Medium', 'High'],
  Drip: ['Low', 'Medium'],
  Sprinkler: ['Low', 'Medium'],
  Rainfed: ['Low'],
  'River lift': ['Medium', 'High'],
}
const seasonFit: Record<string, string[]> = {
  Kharif: ['Paddy (Sona Masoori)', 'Cotton (Bt Hybrid)', 'Maize', 'Green Gram'],
  Rabi: ['Chilli (Byadgi)', 'Maize', 'Green Gram', 'Paddy (Sona Masoori)'],
  Summer: ['Green Gram', 'Maize', 'Chilli (Byadgi)'],
}

type Ranked = PlanOption & { score: number; affordable: boolean }

export default function PlannerPage() {
  const [landId, setLandId] = useState(lands[0]!.id)
  const [season, setSeason] = useState('Kharif')
  const [soil, setSoil] = useState(lands[0]!.soil)
  const [water, setWater] = useState(lands[0]!.irrigation)
  const [budget, setBudget] = useState('150000')
  const [results, setResults] = useState<Ranked[] | null>(null)
  const [detail, setDetail] = useState<Ranked | null>(null)
  const [thinking, setThinking] = useState(false)

  const land = lands.find((l) => l.id === landId) ?? lands[0]!
  const budgetN = parseFloat(budget) || 0
  const acres = land.acres

  const run = () => {
    setThinking(true)
    setResults(null)
    setTimeout(() => {
      const fitWater = waterFit[water] ?? []
      const fitSeason = seasonFit[season] ?? []

      const ranked: Ranked[] = cropPlans.map((p) => {
        let score = p.suitability
        // Irrigation match matters most — a water-hungry crop on rainfed land fails.
        score += fitWater.includes(p.water) ? 6 : waterScore[p.water]
        if (fitSeason.includes(p.crop)) score += 8
        else score -= 10

        const needed = p.investment * acres
        const affordable = budgetN >= needed
        if (!affordable) score -= Math.min(30, ((needed - budgetN) / needed) * 55)

        // Black cotton soil suits paddy/cotton; red loamy suits chilli/maize.
        if (soil === 'Black cotton soil' && ['Paddy (Sona Masoori)', 'Cotton (Bt Hybrid)'].includes(p.crop)) score += 5
        if (soil === 'Red loamy' && ['Chilli (Byadgi)', 'Maize'].includes(p.crop)) score += 5
        if (soil === 'Sandy loamy' && p.water === 'High') score -= 6

        score = Math.max(8, Math.min(97, Math.round(score)))
        return { ...p, score, affordable }
      }).sort((a, b) => b.score - a.score)

      setResults(ranked)
      setThinking(false)
    }, 1300)
  }

  const top = results?.[0]

  return (
    <div className="section">
      <PageHeader
        icon="🗓️"
        title="Crop Planner"
        sub="Tell us about the land and we&rsquo;ll rank the crops that fit it."
        tag={<DemoTag />}
      >
        <div className="rounded-3xl border border-gold-400/35 bg-gold-400/10 p-4 text-sm leading-relaxed text-muted">
          <p className="mb-1 font-bold text-gold-600 dark:text-gold-400">◆ Estimated crops only — never guaranteed profits</p>
          Costs, yields and revenue below are illustrative averages for the demo. Actual results depend on
          seed variety, weather, pest pressure, input prices and the grade your produce fetches at sale.
        </div>
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        {/* ---------------------------------------------------------- inputs */}
        <Reveal>
          <Card className="lg:sticky lg:top-28">
            <h2 className="mb-4 text-base font-bold">Your inputs</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="label">Land</span>
                <select className="input" value={landId} onChange={(e) => {
                  const l = lands.find((x) => x.id === e.target.value)!
                  setLandId(l.id); setSoil(l.soil); setWater(l.irrigation)
                }}>
                  {lands.map((l) => <option key={l.id} value={l.id}>{l.name} — {l.acres} ac, {l.location}</option>)}
                </select>
              </label>

              <div>
                <span className="label">Season</span>
                <div className="flex gap-1.5">
                  {seasons.map((s) => (
                    <button key={s} onClick={() => setSeason(s)}
                      className={cn('flex-1 rounded-2xl border px-2 py-2 text-sm font-bold transition-all',
                        season === s ? 'border-leaf-400/70 bg-leaf-gradient text-white shadow-glow' : 'border-line/70 text-muted hover:text-ink')}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="label">Soil type</span>
                <select className="input" value={soil} onChange={(e) => setSoil(e.target.value)}>
                  {soilTypes.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="label">Water source</span>
                <select className="input" value={water} onChange={(e) => setWater(e.target.value)}>
                  {irrigationTypes.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="label">Budget available (₹)</span>
                <input className="input" type="number" min="0" step="5000" value={budget}
                  onChange={(e) => setBudget(e.target.value)} />
                <span className="mt-1 block text-[11px] text-faint">
                  ≈ {inr(budgetN / acres)} per acre on {acres} acres
                </span>
              </label>

              <button onClick={run} disabled={thinking} className="btn btn-primary w-full disabled:opacity-60">
                {thinking ? 'Ranking crops…' : '✨ Get crop suggestions'}
              </button>
              <p className="text-center text-[11px] text-faint">Calculated in your browser. Nothing is sent anywhere.</p>
            </div>
          </Card>
        </Reveal>

        {/* --------------------------------------------------------- results */}
        <div>
          {thinking && (
            <Card className="grid place-items-center py-20">
              <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="mx-auto h-12 w-12 rounded-full border-4 border-line border-t-leaf-500"
                  style={{ animation: 'spin 0.9s linear infinite' }} aria-hidden />
                <p className="mt-4 text-sm font-semibold text-muted">
                  Comparing {cropPlans.length} crops against your land…
                </p>
              </motion.div>
            </Card>
          )}

          {!thinking && !results && (
            <Card className="grid place-items-center py-20 text-center">
              <div>
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-leaf-400/10 text-3xl" aria-hidden>🌱</span>
                <h2 className="mt-4 font-display text-xl font-black">Ready when you are</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
                  Fill in the land, season, soil and water details on the left, then hit
                  <span className="font-bold text-ink"> Get crop suggestions</span>. You&rsquo;ll get a
                  ranked list with cost and yield estimates for each option.
                </p>
              </div>
            </Card>
          )}

          {!thinking && results && (
            <>
              {top && (
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
                  <Card className="relative overflow-hidden !bg-gradient-to-br !from-leaf-400/10 !via-surface !to-surface">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted">Best fit for {land.name}</p>
                        <h2 className="mt-1 flex items-center gap-2 font-display text-3xl font-black">
                          <span aria-hidden>{top.icon}</span>{top.crop}
                        </h2>
                        <p className="mt-1 text-sm text-muted">
                          {season} · {soil} · {water} · {acres} acres
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted">Suitability</p>
                        <p className="font-display text-5xl font-black leading-none text-leaf-600 dark:text-leaf-400">
                          <Counter to={top.score} /><span className="text-2xl">%</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                      {[
                        ['Cycle', top.duration],
                        ['Est. cost', inr(top.investment * acres, { compact: true })],
                        ['Est. revenue', inr(top.revenue * acres, { compact: true })],
                        ['Water need', top.water],
                      ].map(([k, v]) => (
                        <div key={k} className="rounded-2xl border border-line/60 bg-surface/70 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{k}</p>
                          <p className="font-display text-base font-black">{v}</p>
                        </div>
                      ))}
                    </div>

                    {!top.affordable && (
                      <p className="mt-3 rounded-2xl border border-red-400/40 bg-red-500/10 p-3 text-xs font-semibold leading-relaxed text-red-500">
                        ⚠ Your budget of {inr(budgetN)} is below the estimated {inr(top.investment * acres)} needed
                        for this crop on {acres} acres. Consider fewer acres or a lower-input crop.
                      </p>
                    )}

                    <button onClick={() => setDetail(top)} className="btn btn-primary mt-4">
                      See the full estimate for {top.crop} →
                    </button>
                  </Card>
                </motion.div>
              )}

              <div className="mt-4 space-y-3">
                {results.slice(1).map((r, i) => (
                  <Reveal key={r.id} delay={i * 0.05}>
                    <Card hover className="!p-0" onClick={() => setDetail(r)}>
                      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display font-bold">
                              <span className="mr-1.5" aria-hidden>{r.icon}</span>{r.crop}
                            </h3>
                            {!r.affordable && <Chip tone="danger">Over budget</Chip>}
                            <Chip tone={r.water === 'Low' ? 'live' : r.water === 'Medium' ? 'info' : 'demo'}>
                              {r.water} water
                            </Chip>
                          </div>
                          <p className="mt-0.5 text-xs text-muted">{r.duration} · {r.yieldPerAcre} · margin ≈ {r.margin}%</p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-4">
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-faint">Est. cost</p>
                            <p className="text-sm font-bold tabular-nums">{inr(r.investment * acres, { compact: true })}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-faint">Est. revenue</p>
                            <p className="text-sm font-bold tabular-nums text-leaf-600 dark:text-leaf-400">{inr(r.revenue * acres, { compact: true })}</p>
                          </div>
                          <div className="w-16 text-right">
                            <p className="font-display text-xl font-black tabular-nums">{r.score}%</p>
                            <Progress value={r.score} tone={r.score >= 75 ? 'leaf' : r.score >= 55 ? 'gold' : 'sky'} />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Reveal>
                ))}
              </div>

              <Reveal delay={0.2}>
                <Card className="mt-4">
                  <h3 className="mb-3 text-sm font-bold">Estimated cost vs revenue per acre</h3>
                  <BarChart
                    labels={results.map((r) => r.crop.split(' (')[0]!)}
                    stacked={[
                      { name: 'Est. cost / acre', color: '#C0562A', data: results.map((r) => r.investment) },
                      { name: 'Est. revenue / acre', color: '#354A29', data: results.map((r) => r.revenue) },
                    ]}
                    height={220}
                    formatValue={(v) => inr(v, { compact: true })}
                  />
                </Card>
              </Reveal>

              <p className="mt-4 rounded-2xl border border-gold-400/35 bg-gold-400/10 p-3.5 text-xs leading-relaxed text-muted">
                ◆ Ranking is a weighted match of your inputs against general agronomic preferences — not a
                prediction. Revenue assumes average market prices and a normal season; a single pest outbreak
                or a late monsoon break can move the outcome a long way.
              </p>
            </>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------- detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`${detail?.crop ?? ''} — estimated plan`} wide>
        {detail && (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-bold">Cycle &amp; inputs</h3>
                <dl className="divide-y divide-line/60 text-sm">
                  {[
                    ['Growth cycle', detail.duration],
                    ['Expected yield', detail.yieldPerAcre],
                    ['Water need', detail.water],
                    ['Suitability score', `${detail.score}%`],
                    ['Est. margin', `${detail.margin}%`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-3 py-2">
                      <dt className="text-muted">{k}</dt>
                      <dd className="font-bold">{v}</dd>
                    </div>
                  ))}
                </dl>

                <h3 className="mb-2 mt-5 text-sm font-bold">Key risks</h3>
                <ul className="space-y-1.5">
                  {detail.risks.map((r) => (
                    <li key={r} className="flex gap-2 rounded-xl bg-surface/60 px-3 py-2 text-sm text-muted">
                      <span className="shrink-0 text-red-500" aria-hidden>⚠</span>{r}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-bold">On {acres} acres</h3>
                <Donut
                  data={[
                    { label: 'Est. cost', value: detail.investment * acres, color: '#C0562A' },
                    { label: 'Est. margin', value: Math.max(0, (detail.revenue - detail.investment) * acres), color: '#354A29' },
                  ]}
                  centerValue={inr(detail.revenue * acres, { compact: true })}
                  centerLabel="Est. revenue"
                />
                <div className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-3"><span className="text-muted">Est. cost</span><span className="font-bold tabular-nums">{inr(detail.investment * acres)}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted">Est. revenue</span><span className="font-bold tabular-nums">{inr(detail.revenue * acres)}</span></div>
                  <div className="hairline !my-1.5" />
                  <div className="flex justify-between gap-3">
                    <span className="font-bold">Est. margin</span>
                    <span className="font-display text-lg font-black tabular-nums text-leaf-600 dark:text-leaf-400">
                      {inr((detail.revenue - detail.investment) * acres)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-gold-400/35 bg-gold-400/10 p-3.5 text-xs leading-relaxed text-muted">
              ◆ All figures are estimates built from sample per-acre averages. They are not a quotation, a
              yield forecast or a profit guarantee. Get a soil test and talk to your local agriculture
              officer before committing.
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link href="/market" className="btn btn-primary">Check today&rsquo;s prices</Link>
              <Link href="/finance" className="btn btn-ghost">See my finances</Link>
              <Link href="/learn" className="btn btn-ghost">Growing guides</Link>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
