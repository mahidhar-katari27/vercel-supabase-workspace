'use client'

import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, Chip, DemoTag, PageHeader, Progress, Reveal, spring } from '@/components/ui'
import { Gauge } from '@/components/charts'
import { analysisSteps, lands, type Diagnosis } from '@/lib/data'
import { loadPlan, onPlanChange, planLands } from '@/lib/farmPlan'
import { analyseCrop, doctorDisclaimer, doctorSuggestions } from '@/lib/ai'
import { sampleLeaves } from '@/lib/samples'
import { cn } from '@/lib/utils'

type Stage = 'idle' | 'analysing' | 'done'

export default function CropDoctorPage() {
  const [stage, setStage] = useState<Stage>('idle')
  const [step, setStep] = useState(0)
  const [img, setImg] = useState<{ src: string; name: string; bytes: number; caption?: string } | null>(null)
  const [result, setResult] = useState<Diagnosis | null>(null)
  const [dragging, setDragging] = useState(false)
  const [followUp, setFollowUp] = useState<string | null>(null)

  // Land context — links each diagnosis to a land (from the Start Farming plan
  // or your saved lands) and keeps a small per-land history locally.
  const [landOpts, setLandOpts] = useState<Array<{ id: string; label: string; plan: boolean }>>([])
  const [landId, setLandId] = useState('')
  const [dxHistory, setDxHistory] = useState<Array<{ id: string; landId: string; date: string; issue: string; risk: string; confidence: number }>>([])
  const loggedRef = useRef<string | null>(null)

  useEffect(() => {
    const sync = () => {
      const p = loadPlan()
      const pl = p?.chosenCrop ? planLands(p) : []
      const opts = [
        ...pl.map((l) => ({ id: l.id, label: `${l.name} · ${l.crop} · plan`, plan: true })),
        ...lands.map((l) => ({ id: l.id, label: `${l.name} · ${l.crop}`, plan: false })),
      ]
      setLandOpts(opts)
      setLandId((cur) => cur || window.localStorage.getItem('agrismart-doctor-land') || opts[0]?.id || '')
      try { setDxHistory(JSON.parse(window.localStorage.getItem('agrismart-doctor-history') ?? '[]')) } catch { /* ignore */ }
    }
    sync()
    return onPlanChange(sync)
  }, [])

  useEffect(() => {
    if (stage !== 'done' || !result || !landId) return
    const key = `${landId}:${result.issue}:${img?.name ?? ''}`
    if (loggedRef.current === key) return
    loggedRef.current = key
    const entry = { id: `dx-${Date.now()}`, landId, date: new Date().toISOString(), issue: result.issue, risk: result.risk, confidence: result.confidence }
    setDxHistory((h) => {
      const next = [entry, ...h].slice(0, 20)
      try { window.localStorage.setItem('agrismart-doctor-history', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [stage, result, landId, img])
  const fileRef = useRef<HTMLInputElement>(null)
  const timers = useRef<number[]>([])

  const run = useCallback((file: { src: string; name: string; bytes: number; caption?: string }) => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setImg(file)
    setResult(null)
    setFollowUp(null)
    setStage('analysing')
    setStep(0)

    // ~2.6s of staged progress: long enough to read, short enough to demo.
    const per = 2600 / analysisSteps.length
    analysisSteps.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setStep(i + 1), per * (i + 1)))
    })
    timers.current.push(
      window.setTimeout(() => {
        setResult(analyseCrop(file.name, file.bytes))
        setStage('done')
      }, 2750),
    )
  }, [])

  const reset = useCallback(() => {
    timers.current.forEach(clearTimeout)
    setStage('idle'); setStep(0); setResult(null); setImg(null); setFollowUp(null)
    if (fileRef.current) fileRef.current.value = ''
  }, [])

  const onFiles = (files: FileList | null) => {
    const f = files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) return
    const url = URL.createObjectURL(f)
    run({ src: url, name: f.name, bytes: f.size, caption: 'Your upload' })
  }

  const riskTone = result?.risk === 'HIGH' ? 'danger' : result?.risk === 'MEDIUM' ? 'demo' : 'live'

  return (
    <div className="section">
      <PageHeader
        icon="🤖"
        title="Meet Your Crop Doctor"
        sub="Upload a crop image and get an AI-assisted assessment."
        tag={<DemoTag />}
      >
        <div className="rounded-3xl border border-gold-400/35 bg-gold-400/10 p-4 text-sm leading-relaxed text-muted">
          <p className="mb-1 font-bold text-gold-600 dark:text-gold-400">◆ Assistance only</p>
          {doctorDisclaimer}
        </div>
      </PageHeader>

      <Reveal>
        <Card className="mb-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">🌍 Diagnosing land</span>
            <select
              value={landId}
              onChange={(e) => { setLandId(e.target.value); try { window.localStorage.setItem('agrismart-doctor-land', e.target.value) } catch { /* ignore */ } }}
              className="rounded-xl border border-line/70 bg-surface-2/60 px-3 py-2 text-sm font-semibold outline-none focus:border-leaf-400/70 dark:bg-black/20"
              aria-label="Select the land this diagnosis is for"
            >
              {landOpts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            {landOpts.find((o) => o.id === landId)?.plan && <Chip tone="live" icon="🌱">Linked to your Start Farming plan</Chip>}
            <Link href="/start" className="btn-quiet ml-auto text-xs">
              {landOpts.some((o) => o.plan) ? 'Open farm plan →' : '🌱 Create a farm plan →'}
            </Link>
          </div>
          {dxHistory.filter((h) => h.landId === landId).length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line/50 pt-3">
              <span className="text-[11px] font-semibold text-faint">Recent checks for this land:</span>
              {dxHistory.filter((h) => h.landId === landId).slice(0, 3).map((h) => (
                <Chip key={h.id} tone={h.risk === 'HIGH' ? 'danger' : h.risk === 'MEDIUM' ? 'demo' : 'ok'}>
                  {h.issue} · {h.risk} · {new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Chip>
              ))}
            </div>
          )}
        </Card>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.05fr]">
        {/* ------------------------------------------------------ upload side */}
        <div className="space-y-5">
          <Reveal>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files) }}
              className={cn(
                'card relative overflow-hidden border-2 border-dashed p-6 text-center transition-all duration-300 sm:p-10',
                dragging ? 'border-leaf-400 bg-leaf-400/10 scale-[1.01]' : 'border-line',
              )}
            >
              {/* scanning beam while analysing */}
              {stage === 'analysing' && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                  <div className="absolute inset-x-0 h-24 animate-scanline bg-gradient-to-b from-transparent via-leaf-400/25 to-transparent" />
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(hsl(var(--leaf-400)/0.12) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--leaf-400)/0.12) 1px, transparent 1px)',
                    backgroundSize: '26px 26px',
                  }} />
                </div>
              )}

              <input
                ref={fileRef} type="file" accept="image/*" className="sr-only"
                onChange={(e) => onFiles(e.target.files)} id="crop-upload"
              />

              <div className="relative">
                {!img ? (
                  <>
                    <motion.span
                      className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-leaf-gradient text-4xl shadow-glow"
                      animate={{ y: [0, -7, 0] }} transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
                      aria-hidden
                    >📷</motion.span>
                    <h2 className="mt-5 text-xl font-bold sm:text-2xl">Upload Crop Image</h2>
                    <p className="mt-1.5 text-sm text-muted">Drag &amp; drop or choose an image</p>
                    <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                      <label htmlFor="crop-upload" className="btn btn-primary btn-lg cursor-pointer">
                        Choose image
                      </label>
                      <span className="text-xs text-faint">JPG or PNG · stays on your device</span>
                    </div>
                  </>
                ) : (
                  <div className="mx-auto max-w-sm">
                    <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-3xl border border-line/70 shadow-lift">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.src} alt={`Uploaded crop sample: ${img.caption ?? img.name}`}
                        className="h-full w-full object-cover" />
                      {stage === 'analysing' && (
                        <motion.div className="absolute inset-0 rounded-3xl border-2 border-leaf-400/70"
                          animate={{ opacity: [0.35, 1, 0.35] }} transition={{ duration: 1.2, repeat: Infinity }} />
                      )}
                      {stage === 'done' && result && (
                        <motion.div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3"
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                          <p className="text-xs font-bold text-white">{result.issue}</p>
                          <p className="text-[11px] text-white/75">{result.confidence}% pattern match</p>
                        </motion.div>
                      )}
                    </div>
                    <p className="mt-3 truncate text-xs font-semibold text-muted">{img.name}</p>
                    <p className="text-[11px] text-faint">{(img.bytes / 1024).toFixed(0)} KB {img.caption ? `· ${img.caption}` : ''}</p>
                    <div className="mt-4 flex gap-2">
                      <label htmlFor="crop-upload" className="btn btn-ghost btn-sm flex-1 cursor-pointer">Replace</label>
                      <button onClick={reset} className="btn btn-quiet btn-sm">Clear</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Reveal>

          {/* Samples so the demo never depends on having a photo handy */}
          <Reveal delay={0.08}>
            <Card>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold">Or use a sample image</h2>
                <Chip tone="demo">Demo samples</Chip>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {sampleLeaves.map((s) => (
                  <button key={s.id} onClick={() => run({ src: s.src, name: s.name, bytes: s.bytes, caption: s.caption })}
                    className={cn(
                      'group overflow-hidden rounded-2xl border p-1.5 text-left transition-all duration-300 hover:-translate-y-1',
                      img?.name === s.name ? 'border-leaf-400/70 bg-leaf-400/10 shadow-glow' : 'border-line/70 hover:border-leaf-400/50',
                    )}>
                    <span className="block aspect-square w-full overflow-hidden rounded-xl bg-earth-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.src} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </span>
                    <span className="mt-1.5 block px-0.5 text-[10px] font-bold leading-tight">{s.caption}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-snug text-faint">
                Samples are drawn as SVG in the browser. The assessment is chosen deterministically from
                the file name and size — no image analysis actually runs.
              </p>
            </Card>
          </Reveal>
        </div>

        {/* ----------------------------------------------------- result side */}
        <div className="space-y-5">
          <AnimatePresence mode="wait">
            {stage === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <Card className="h-full min-h-[22rem]">
                  <h2 className="text-base font-bold">How the assessment works</h2>
                  <ol className="mt-4 space-y-3">
                    {[
                      ['📷', 'Upload or pick a sample', 'A clear, daylight photo of one affected leaf works best.'],
                      ['🔍', 'Pattern comparison', 'The image is compared against a small set of known symptom patterns.'],
                      ['🌿', 'Assessment + next steps', 'You get a possible issue, a risk level and practical next steps.'],
                      ['👨‍🔬', 'Escalate to an expert', 'One tap connects you to a qualified agricultural expert.'],
                    ].map(([i, t, b], n) => (
                      <li key={t} className="flex gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-leaf-400/10 text-base" aria-hidden>{i}</span>
                        <div>
                          <p className="text-sm font-bold">{n + 1}. {t}</p>
                          <p className="text-xs leading-relaxed text-muted">{b}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-5 rounded-2xl border border-line/70 bg-surface/50 p-3 text-xs leading-relaxed text-muted">
                    This demo does not run a trained vision model. It returns one of three illustrative
                    assessments so the interface can be evaluated end to end.
                  </div>
                </Card>
              </motion.div>
            )}

            {stage === 'analysing' && (
              <motion.div key="run" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <Card className="min-h-[22rem]">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-leaf-gradient text-lg">
                      <span className="absolute inset-0 rounded-2xl bg-leaf-400/50" style={{ animation: 'pulseRing 1.8s ease-out infinite' }} aria-hidden />
                      <span className="relative" aria-hidden>🧠</span>
                    </span>
                    <div>
                      <h2 className="text-base font-bold">Analysing your crop image</h2>
                      <p className="text-xs text-muted">AI-assisted · usually a few seconds</p>
                    </div>
                  </div>

                  <Progress value={(step / analysisSteps.length) * 100} tone="leaf" className="mb-5" />

                  <ul className="space-y-2">
                    {analysisSteps.map((s, i) => {
                      const done = i < step, on = i === step
                      return (
                        <li key={s} className={cn(
                          'flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-sm transition-all duration-300',
                          done && 'border-leaf-400/40 bg-leaf-400/10 text-ink',
                          on && 'border-leaf-400/70 bg-leaf-400/15 font-semibold text-ink',
                          !done && !on && 'border-line/50 text-faint',
                        )}>
                          <span className="grid h-5 w-5 shrink-0 place-items-center text-xs" aria-hidden>
                            {done ? '✓' : on ? (
                              <motion.span className="h-2 w-2 rounded-full bg-leaf-400"
                                animate={{ scale: [1, 1.7, 1], opacity: [1, 0.4, 1] }}
                                transition={{ duration: 1, repeat: Infinity }} />
                            ) : '○'}
                          </span>
                          {s}
                        </li>
                      )
                    })}
                  </ul>

                  <div className="mt-5 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-4 w-1/2" />
                  </div>
                </Card>
              </motion.div>
            )}

            {stage === 'done' && result && (
              <motion.div key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
                <Card className="overflow-hidden !p-0">
                  <div className="bg-leaf-gradient p-5 text-white sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">🌿 AI Crop Assessment</p>
                        <h2 className="mt-2 font-display text-2xl font-black sm:text-3xl">{result.issue}</h2>
                      </div>
                      <span className={cn(
                        'rounded-2xl px-3.5 py-2 text-xs font-black uppercase tracking-wider ring-2',
                        result.risk === 'HIGH' && 'bg-red-500/25 ring-red-200/60 text-white',
                        result.risk === 'MEDIUM' && 'bg-gold-400/25 ring-gold-300/60 text-white',
                        result.risk === 'LOW' && 'bg-white/20 ring-white/50 text-white',
                      )}>
                        {result.risk} risk
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="mb-1 flex justify-between text-[11px] font-bold uppercase tracking-wider text-white/75">
                          <span>Pattern match</span><span>{result.confidence}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/25">
                          <motion.div className="h-full rounded-full bg-white"
                            initial={{ width: 0 }} animate={{ width: `${result.confidence}%` }}
                            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 p-5 sm:p-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoTile icon="⏱️" k="Act within" v={result.window} />
                      <InfoTile icon="🌬️" k="Spread risk" v={result.spreadRisk} />
                    </div>

                    <div>
                      <h3 className="mb-2 text-sm font-bold">Visible symptoms</h3>
                      <ul className="space-y-1.5">
                        {result.symptoms.map((s, i) => (
                          <motion.li key={s} className="flex items-start gap-2 text-sm text-muted"
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + i * 0.08 }}>
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-400" aria-hidden />
                            {s}
                          </motion.li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="mb-2 text-sm font-bold">Suggested next steps</h3>
                      <ol className="space-y-2">
                        {result.steps.map((s, i) => (
                          <motion.li key={s} className="flex gap-3 rounded-2xl border border-line/60 bg-surface/50 p-3"
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.08 }}>
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-leaf-400/10 text-xs font-black text-leaf-700 dark:text-leaf-300">
                              {i + 1}
                            </span>
                            <span className="text-sm leading-relaxed text-muted">{s}</span>
                          </motion.li>
                        ))}
                      </ol>
                    </div>

                    <div className="rounded-3xl border border-gold-400/35 bg-gold-400/10 p-4 text-xs leading-relaxed text-muted">
                      <p className="mb-1 font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">◆ Not a diagnosis</p>
                      {doctorDisclaimer}
                    </div>

                    <div className="flex flex-col gap-2.5 sm:flex-row">
                      <Link href="/experts" className="btn btn-primary btn-lg flex-1">👨‍🔬 Talk to Expert</Link>
                      <button onClick={reset} className="btn btn-ghost btn-lg">Analyse another</button>
                    </div>
                  </div>
                </Card>

                {/* Follow-ups */}
                <Card className="mt-5">
                  <h3 className="mb-3 text-sm font-bold">Ask a follow-up</h3>
                  <div className="flex flex-wrap gap-2">
                    {doctorSuggestions.map((q) => (
                      <button key={q} onClick={() => setFollowUp(q)}
                        className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5',
                          followUp === q ? 'border-leaf-400/70 bg-leaf-400/10 text-ink' : 'border-line/70 text-muted hover:text-ink')}>
                        {q}
                      </button>
                    ))}
                  </div>
                  <AnimatePresence>
                    {followUp && (
                      <motion.div key={followUp} className="mt-3 rounded-2xl border border-line/70 bg-surface/60 p-3.5 text-sm leading-relaxed text-muted"
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        {followUpAnswer(followUp, result)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confidence context — always visible so the limits are never hidden */}
          {stage === 'done' && (
            <Reveal>
              <Card>
                <div className="flex items-center gap-5">
                  <Gauge value={result?.confidence ?? 0} size={120} label="Pattern match" tone="#d4a537" />
                  <div className="text-sm leading-relaxed text-muted">
                    <p className="font-bold text-ink">What this number means</p>
                    <p className="mt-1">
                      A pattern-match score reflects how closely the sample resembles a known symptom
                      description. It is <strong>not</strong> a probability that the crop has this
                      problem, and it does not account for your soil, weather history or spray record.
                    </p>
                  </div>
                </div>
              </Card>
            </Reveal>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoTile({ icon, k, v }: { icon: string; k: string; v: string }) {
  return (
    <div className="rounded-2xl border border-line/60 bg-surface/50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{icon} {k}</p>
      <p className="mt-0.5 text-sm font-semibold">{v}</p>
    </div>
  )
}

function followUpAnswer(q: string, r: Diagnosis): string {
  if (q.includes('fungal'))
    return `Spots with darker margins and a yellow halo lean fungal; uniform pale yellowing across older leaves first leans nutritional. In this sample the pattern is closer to ${r.issue.toLowerCase()}, but lighting and leaf age change how symptoms read. A lab test or an expert visit is the only way to be sure.`
  if (q.includes('spray'))
    return `Do not spray on the strength of an image assessment alone. Identify first, then check the label for the correct molecule, dose and pre-harvest interval. Repeating the same molecule encourages resistance. An expert or your local agriculture officer can confirm what is appropriate here.`
  if (q.includes('spread'))
    return `${r.spreadRisk}. Remove severely affected plant material from the field rather than composting it in place, keep the canopy dry, and check neighbouring rows every 2–3 days. ${r.window}.`
  return `Connecting you to a qualified expert is the right next step for anything that is spreading or affecting yield. Agriculture experts on AgriSmart can review your photo, ask about your spray history and advise on treatment.`
}
