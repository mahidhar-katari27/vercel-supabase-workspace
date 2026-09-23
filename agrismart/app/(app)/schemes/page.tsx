'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { Card, Chip, DemoTag, Modal, PageHeader, Reveal, spring } from '@/components/ui'
import { farmer, schemeApplications, schemes, schemeStages, type Scheme } from '@/lib/data'
import { cn } from '@/lib/utils'

const states = ['Andhra Pradesh', 'Telangana', 'Karnataka', 'Maharashtra', 'Tamil Nadu', 'All states']
const sectors = ['Crop', 'Aqua', 'Poultry', 'Dairy']
const commonDocs = ['Aadhaar', 'Land document', 'Bank details', 'Sowing certificate', 'Water source proof',
  'Quotation', 'Fisheries registration', 'Project report', 'Veterinary certificate', 'Machinery quotation']

export default function SchemesPage() {
  const [sector, setSector] = useState('Crop')
  const [state, setState] = useState('Andhra Pradesh')
  const [acres, setAcres] = useState(String(farmer.totalAcres))
  const [have, setHave] = useState<string[]>(['Aadhaar', 'Land document', 'Bank details'])
  const [checked, setChecked] = useState(false)
  const [detail, setDetail] = useState<Scheme | null>(null)
  const [apps, setApps] = useState(schemeApplications)
  const [toast, setToast] = useState<string | null>(null)

  const area = parseFloat(acres) || 0
  const stageIndex = (s: string) => schemeStages.indexOf(s)

  const scored = schemes.map((s) => {
    const stateOk = s.states.includes('All states') || s.states.includes(state)
    const landOk = area >= s.minAcres && area <= s.maxAcres
    const sectorOk = s.sectors.includes(sector)
    const missing = s.docs.filter((d) => !have.includes(d))
    const docsOk = missing.length === 0
    const passes = stateOk && landOk && sectorOk
    return { s, stateOk, landOk, sectorOk, docsOk, missing, passes, score: [stateOk, landOk, sectorOk, docsOk].filter(Boolean).length }
  })

  const matches = checked ? scored.filter((x) => x.passes).sort((a, b) => b.score - a.score) : []
  const missed = checked ? scored.filter((x) => !x.passes) : []

  const toggleDoc = (d: string) => setHave((h) => h.includes(d) ? h.filter((x) => x !== d) : [...h, d])

  const apply = (s: Scheme) => {
    const ref = `AP/${s.id.toUpperCase()}/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 9000) + 1000)}`
    setApps((a) => {
      const existing = a.find((x) => x.scheme === s.name)
      if (existing) return a.map((x) => x.scheme === s.name ? { ...x, stage: 'Documents Pending', updated: 'Just now', ref } : x)
      return [...a, { scheme: s.name, stage: 'Documents Pending', updated: 'Just now', ref }]
    })
    setToast(`Demo application started for ${s.name}. Reference ${ref}.`)
    setDetail(null)
    setTimeout(() => setToast(null), 5000)
  }

  return (
    <div className="section">
      <PageHeader
        icon="🏛️"
        title="Government Scheme Center"
        sub="Check eligibility, understand benefits and track applications in one place."
        tag={<DemoTag />}
      >
        <div className="rounded-3xl border border-gold-400/35 bg-gold-400/10 p-4 text-sm leading-relaxed text-muted">
          <p className="mb-1 font-bold text-gold-600 dark:text-gold-400">◆ Eligibility guidance, not an official decision</p>
          Rules change every season and differ by state and category. Always confirm on the official scheme
          portal or with your agriculture officer before applying. Nothing here is an application to any
          government body, and no form is submitted anywhere.
        </div>
      </PageHeader>

      {/* --------------------------------------------------- eligibility form */}
      <Reveal>
        <Card>
          <h2 className="mb-1 text-base font-bold">Eligibility checker</h2>
          <p className="mb-4 text-sm text-muted">Fill these in and we&rsquo;ll shortlist schemes you may qualify for.</p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <span className="label">Sector</span>
              <div className="flex flex-wrap gap-1.5">
                {sectors.map((s) => (
                  <button key={s} onClick={() => setSector(s)}
                    className={cn('rounded-full border px-3 py-1.5 text-xs font-bold transition-all',
                      sector === s ? 'border-leaf-400/70 bg-leaf-gradient text-white' : 'border-line/70 text-muted hover:text-ink')}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="label">State</span>
              <select className="input" value={state} onChange={(e) => setState(e.target.value)}>
                {states.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="label">Land holding (acres)</span>
              <input className="input" type="number" min="0" step="0.1" value={acres}
                onChange={(e) => setAcres(e.target.value)} />
            </label>
          </div>

          <div className="mt-5">
            <span className="label">Documents you already have</span>
            <div className="flex flex-wrap gap-1.5">
              {commonDocs.map((d) => {
                const on = have.includes(d)
                return (
                  <button key={d} onClick={() => toggleDoc(d)}
                    className={cn('rounded-full border px-3 py-1.5 text-xs font-bold transition-all',
                      on ? 'border-transparent bg-leaf-400/15 text-leaf-700 dark:text-leaf-300' : 'border-line/70 text-faint hover:text-muted')}>
                    {on ? '✓ ' : ''}{d}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-[11px] text-faint">
              Schemes you match but are missing paperwork for are still shown — with exactly what is outstanding.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button onClick={() => setChecked(true)} className="btn btn-primary">✓ Check Eligibility</button>
            <button onClick={() => setChecked(false)} className="btn btn-ghost">Reset</button>
            <p className="text-xs text-faint">Runs entirely in your browser — nothing is submitted anywhere.</p>
          </div>
        </Card>
      </Reveal>

      {/* ---------------------------------------------------------- results */}
      {checked && (
        <motion.div className="mt-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
          <div className="mb-4 flex flex-wrap items-center gap-2.5">
            <span className="text-sm font-bold">
              {matches.length} of {schemes.length} schemes may apply
            </span>
            <Chip tone="demo">Estimate</Chip>
            <Chip>{sector} · {area} acres · {state}</Chip>
            <Chip tone={matches.every((m) => m.docsOk) ? 'live' : 'info'}>
              {matches.filter((m) => m.docsOk).length} ready to apply
            </Chip>
          </div>

          {matches.length === 0 ? (
            <Card>
              <p className="text-sm leading-relaxed text-muted">
                No schemes in this catalogue matched those inputs. Try a different sector or land size —
                this list is a small sample of {schemes.length} schemes, not the full set that exists.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {matches.map(({ s, missing, docsOk }, i) => (
                <Reveal key={s.id} delay={i * 0.06}>
                  <SchemeCard s={s} missing={missing} docsOk={docsOk} onOpen={() => setDetail(s)} />
                </Reveal>
              ))}
            </div>
          )}

          {missed.length > 0 && (
            <>
              <h2 className="section-title">Not eligible on these inputs</h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {missed.map(({ s, stateOk, landOk, sectorOk }, i) => (
                  <Reveal key={s.id} delay={i * 0.04}>
                    <Card className="h-full opacity-75">
                      <h3 className="font-bold leading-tight">{s.name}</h3>
                      <p className="mt-1 text-xs text-muted">{s.body} · {s.category}</p>
                      <ul className="mt-2.5 space-y-1 text-xs">
                        {!sectorOk && <Reason>Does not cover the {sector} sector</Reason>}
                        {!stateOk && <Reason>Not available in {state}</Reason>}
                        {!landOk && (
                          <Reason>
                            Land must be {s.minAcres}–{s.maxAcres === 99 ? 'any size' : `${s.maxAcres} acres`}; you entered {area}
                          </Reason>
                        )}
                      </ul>
                    </Card>
                  </Reveal>
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* ------------------------------------------------- browse catalogue */}
      {!checked && (
        <>
          <h2 className="section-title">All schemes in the catalogue</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {schemes.map((s, i) => (
              <Reveal key={s.id} delay={i * 0.05}>
                <SchemeCard s={s} onOpen={() => setDetail(s)} />
              </Reveal>
            ))}
          </div>
        </>
      )}

      {/* --------------------------------------------------------- tracking */}
      <h2 className="section-title">Application Tracking</h2>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {apps.length === 0 && (
          <Card><p className="text-sm text-muted">No applications started yet.</p></Card>
        )}
        {apps.map((a, i) => {
          const si = stageIndex(a.stage)
          return (
            <Reveal key={a.ref} delay={i * 0.06}>
              <Card className="h-full">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display font-bold leading-tight">{a.scheme}</h3>
                    <p className="mt-0.5 font-mono text-[11px] text-faint">{a.ref}</p>
                    <p className="text-[11px] text-faint">Updated {a.updated}</p>
                  </div>
                  <Chip tone={a.stage === 'Approved' ? 'live' : a.stage === 'Under Review' ? 'info' : 'demo'}>
                    {a.stage}
                  </Chip>
                </div>

                <ol className="mt-4">
                  {schemeStages.filter((s) => s !== 'Not Started').map((st, k) => {
                    const done = k <= si - 1
                    const current = k === si - 1
                    return (
                      <li key={st} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 text-[9px] font-black transition-colors',
                            done ? 'border-leaf-600 bg-leaf-600 text-white' : 'border-line text-faint')}
                            style={current ? { boxShadow: '0 0 0 4px hsl(150 60% 50% / 0.15)' } : undefined}>
                            {done ? '✓' : k + 1}
                          </span>
                          {k < 3 && (
                            <span className={cn('my-0.5 w-0.5 flex-1 rounded-full', k < si - 1 ? 'bg-leaf-600' : 'bg-line')}
                              style={{ minHeight: 16 }} aria-hidden />
                          )}
                        </div>
                        <p className={cn('pb-2.5 text-xs', done ? 'font-semibold' : 'text-faint')}>
                          {st}
                          {current && <span className="ml-1.5 text-[10px] font-bold text-leaf-600 dark:text-leaf-400">current</span>}
                        </p>
                      </li>
                    )
                  })}
                </ol>

                <p className="mt-1 text-[11px] leading-snug text-faint">
                  ◆ Demo tracking state — not connected to any government application system.
                </p>
              </Card>
            </Reveal>
          )
        })}
      </div>

      {/* ------------------------------------------------------ detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ''} wide>
        {detail && (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              <Chip tone="info">{detail.category}</Chip>
              <Chip>{detail.body}</Chip>
              <Chip tone="demo">Deadline: {detail.deadline}</Chip>
            </div>

            <h3 className="text-sm font-bold">Benefit</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{detail.benefit}</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-bold">Eligibility</h3>
                <ul className="mt-1.5 space-y-1.5 text-sm text-muted">
                  <li className="flex gap-2"><span aria-hidden>•</span>Land between {detail.minAcres} and {detail.maxAcres === 99 ? 'no upper limit' : detail.maxAcres} acres</li>
                  <li className="flex gap-2"><span aria-hidden>•</span>Covers: {detail.sectors.join(', ')}</li>
                  <li className="flex gap-2"><span aria-hidden>•</span>States: {detail.states.join(', ')}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold">Documents needed</h3>
                <ul className="mt-1.5 space-y-1.5 text-sm text-muted">
                  {detail.docs.map((d) => (
                    <li key={d} className="flex gap-2">
                      <span className={have.includes(d) ? 'text-leaf-500' : 'text-red-500'} aria-hidden>
                        {have.includes(d) ? '✓' : '✕'}
                      </span>
                      <span className={have.includes(d) ? '' : 'font-semibold'}>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-gold-400/35 bg-gold-400/10 p-3.5 text-xs leading-relaxed text-muted">
              ◆ Benefit amounts and rules shown here are simplified for the demo and may be out of date.
              Verify on the official scheme portal before applying — this prototype does not link to or
              submit anything to a government system.
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <button onClick={() => apply(detail)} className="btn btn-primary flex-1">Start demo application</button>
              <Link href="/learn" onClick={() => setDetail(null)} className="btn btn-ghost">Read the guides</Link>
              <button onClick={() => setDetail(null)} className="btn btn-ghost">Close</button>
            </div>
          </>
        )}
      </Modal>

      <AnimatePresence>
        {toast && (
          <motion.div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 sm:bottom-8"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={spring}
            role="status" aria-live="polite">
            <div className="pointer-events-auto max-w-md rounded-2xl border border-leaf-400/40 bg-surface/95 px-4 py-3 text-sm font-semibold shadow-lift backdrop-blur-xl">
              ✓ {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Reason({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-1.5 text-red-500">
      <span aria-hidden>✕</span><span className="text-muted">{children}</span>
    </li>
  )
}

function SchemeCard({
  s, missing, docsOk, onOpen,
}: { s: Scheme; missing?: string[]; docsOk?: boolean; onOpen: () => void }) {
  return (
    <Card hover className="flex h-full flex-col" pad={false}>
      <button onClick={onOpen} className="flex-1 p-5 text-left">
        <div className="flex items-start justify-between gap-2">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-leaf-400/15 to-transparent text-xl" aria-hidden>
            {s.category === 'Crop insurance' ? '🛡️'
              : s.category === 'Irrigation' ? '💧'
              : s.category === 'Aqua farming' ? '🐟'
              : s.category === 'Dairy' ? '🐄'
              : s.category === 'Poultry' ? '🐔'
              : s.category === 'Soil' ? '🧪'
              : s.category === 'Machinery' ? '🚜'
              : '🏛️'}
          </span>
          {docsOk === undefined ? (
            <Chip tone="info">{s.category}</Chip>
          ) : docsOk ? (
            <Chip tone="live">Ready to apply</Chip>
          ) : (
            <Chip tone="demo">{missing!.length} doc{missing!.length > 1 ? 's' : ''} missing</Chip>
          )}
        </div>

        <h3 className="mt-3 font-display text-lg font-black leading-tight">{s.name}</h3>
        <p className="text-xs text-faint">{s.body}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{s.benefit}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip>{s.states.includes('All states') ? 'All India' : s.states.slice(0, 2).join(', ')}</Chip>
          <Chip>{s.minAcres}–{s.maxAcres === 99 ? '∞' : s.maxAcres} ac</Chip>
          <Chip tone="demo">{s.deadline}</Chip>
        </div>

        {missing && missing.length > 0 && (
          <p className="mt-3 rounded-xl bg-surface/60 px-3 py-2 text-[11px] font-semibold leading-snug text-muted">
            Still needed: {missing.join(', ')}
          </p>
        )}
      </button>
      <div className="border-t border-line/60 p-3">
        <button onClick={onOpen} className="btn btn-ghost btn-sm w-full">View details &amp; documents</button>
      </div>
    </Card>
  )
}
