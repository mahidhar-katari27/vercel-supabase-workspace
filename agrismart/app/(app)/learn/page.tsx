'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, Chip, DemoTag, Modal, PageHeader, Progress, Reveal } from '@/components/ui'
import { learningCategories, lessons } from '@/lib/data'
import { cn, num } from '@/lib/utils'

type Lesson = (typeof lessons)[number]

/**
 * Short, genuinely useful summaries. Each is written to be directionally
 * correct agronomy without pretending to replace a local advisory.
 */
const bodies: Record<string, { summary: string; points: string[]; caution: string }> = {
  ln1: {
    summary: 'Alternate Wetting and Drying (AWD) lets a paddy field drop below standing water for a few days at a time instead of keeping it continuously flooded. Paddy needs saturated soil, not a permanent water layer.',
    points: [
      'Install a perforated PVC pipe 40 cm deep with holes below the soil surface to read the water table.',
      'Irrigate again when the water level falls 15 cm below the surface — not before.',
      'Never let the field dry during flowering; that stage is the most sensitive to water stress.',
      'Cutting one or two irrigations per cycle typically saves 20–30% water and reduces pumping cost.',
    ],
    caution: 'AWD increases methane loss pathways but can raise nitrous oxide slightly. The net effect depends on your soil — trial it on one field before switching everything.',
  },
  ln2: {
    summary: 'Stem borer damage shows up as dead heart in the vegetative stage and white ear at flowering. Both are caused by the larva feeding inside the stem, so by the time you see it the damage is done.',
    points: [
      'Dead heart: the central shoot dries and pulls out easily with a hollowed base.',
      'White ear: the panicle emerges bleached and empty because the stem was cut inside.',
      'Look for egg masses on the underside of leaves near the water line — scraping them out is free control.',
      'Pheromone traps at 8–10 per acre tell you when the moth flight peaks, which is when intervention matters.',
    ],
    caution: 'Spraying after white ear appears does nothing. The window is the egg-laying flight, not the symptom.',
  },
  ln3: {
    summary: 'A soil health card reports pH, electrical conductivity, organic carbon and the macro and micronutrient levels your soil actually has. Reading it correctly stops you buying fertilizer you do not need.',
    points: [
      'pH below 6.5 locks up phosphorus; above 8.5 locks up micronutrients like zinc and iron.',
      'Organic carbon below 0.5% is low — it is the single number most worth improving over time.',
      'EC above 4 dS/m indicates salinity; more fertilizer makes it worse, not better.',
      'The card lists crop-wise recommendations — follow those before a dealer suggestion.',
    ],
    caution: 'A card is only as good as its sample. Take 10–15 sub-samples across the field in a zig-zag, mix them, and send about 500 g.',
  },
  ln4: {
    summary: 'Most Vannamei losses are traceable to poor pond preparation rather than bad seed. Getting the pond right before stocking is the cheapest insurance in aqua.',
    points: [
      'Dry the pond bed until it cracks — this oxidises the black sludge layer that carries pathogens.',
      'Remove sludge fully; leaving even 2 cm reintroduces the previous cycle&rsquo;s problems.',
      'Lime to correct pH, then fertilise to build the plankton bloom before stocking.',
      'Stock PL only after they pass a stress test in a formalin or low-salinity challenge.',
    ],
    caution: 'A green pond on day one is not a good sign — you want a stable bloom built gradually, not an algae spike.',
  },
  ln5: {
    summary: 'Feed is 65–75% of layer production cost, so small efficiency gains there matter more than anything else on the farm.',
    points: [
      'Weigh feed rather than scooping it — a 5 g overfeed per bird per day is significant across a flock.',
      'Match the ration to the lay phase; pre-lay, peak and post-peak birds need different calcium and protein.',
      'Check for spillage and rodent loss at the trough — this is often 3–5% of feed walked away.',
      'Buy maize and soya in bulk at harvest if you have dry storage; moisture above 12% invites aflatoxin.',
    ],
    caution: 'Never cut protein to save money during peak lay. Egg numbers drop faster than the feed bill saves.',
  },
  ln6: {
    summary: 'Ration balancing means feeding to the animal&rsquo;s actual requirement — maintenance plus production — rather than a fixed daily scoop.',
    points: [
      'Maintenance requirement is roughly 2 kg dry matter per 100 kg body weight for a buffalo.',
      'Add about 1.5 kg dry matter per litre of milk produced above a baseline.',
      'Green fodder alone is short on protein and minerals in most Indian conditions — supplement it.',
      'A mineral mixture at 50 g per day is cheap and prevents a long list of subclinical problems.',
    ],
    caution: 'Change any ration gradually over 7–10 days. A sudden switch upsets the rumen and drops yield immediately.',
  },
  ln7: {
    summary: 'Working capital covers the gap between spending on inputs and receiving payment for produce. Getting it at the right rate matters more than most farmers expect.',
    points: [
      'Kisan Credit Card gives short-term crop credit at a subsidised effective rate with prompt repayment.',
      'Compare the effective annual rate, not the advertised one — processing fees and insurance add up.',
      'Match the tenure to your crop cycle. A 12-month loan on a 5-month crop costs more than needed.',
      'Keep records of input purchases; lenders price documented borrowers better than undocumented ones.',
    ],
    caution: 'Avoid borrowing against the next crop from informal lenders to repay a bank instalment — that is how a manageable loan becomes unmanageable.',
  },
  ln8: {
    summary: 'PM Fasal Bima Yojana pays out when yields in an insured area fall below a threshold, or for localised losses. Filing a claim correctly and on time is where most farmers lose out.',
    points: [
      'Enrol before the cut-off — usually 31 July for Kharif and 31 December for Rabi.',
      'Premium is 2% of sum insured for Kharif food crops, 1.5% for Rabi, 5% for commercial.',
      'Report a localised loss to the bank or insurer within 48–72 hours; late reports are commonly rejected.',
      'Keep sowing certificates, land records and photographs of the damage with dates.',
    ],
    caution: 'The scheme is area-yield based for most crops — you can have genuine loss on your field and still not qualify if the notified area yield held up.',
  },
}

const typeIcons: Record<string, string> = {
  Guide: '📘', Article: '📄', Video: '🎬', Infographic: '📊',
}

export default function LearnPage() {
  const [cat, setCat] = useState('All')
  const [q, setQ] = useState('')
  const [level, setLevel] = useState('All')
  const [open, setOpen] = useState<Lesson | null>(null)
  const [read, setRead] = useState<string[]>(['ln3'])

  const cats = ['All', ...learningCategories]
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced']

  const list = lessons
    .filter((l) => cat === 'All' || l.cat === cat)
    .filter((l) => level === 'All' || l.level === level)
    .filter((l) => !q.trim() || l.title.toLowerCase().includes(q.toLowerCase()) || l.cat.toLowerCase().includes(q.toLowerCase()))

  const progress = (read.length / lessons.length) * 100

  return (
    <div className="section">
      <PageHeader
        icon="📚"
        title="Learning Hub"
        sub="Practical guides on crops, water, soil, livestock, money and schemes."
        tag={<DemoTag />}
      >
        <div className="w-full max-w-md rounded-3xl border border-line/70 bg-surface/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold">Your reading progress</p>
            <p className="text-sm font-black tabular-nums">{read.length}/{lessons.length}</p>
          </div>
          <Progress value={progress} className="mt-2" showValue />
          <p className="mt-1.5 text-[11px] text-faint">Tracked in this browser session only.</p>
        </div>
      </PageHeader>

      <div className="mb-5 rounded-3xl border border-gold-400/35 bg-gold-400/10 p-4 text-sm leading-relaxed text-muted">
        <p className="mb-1 font-bold text-gold-600 dark:text-gold-400">◆ Educational content, not advisory</p>
        These summaries are written for the demo and describe general practice. Doses, timings and
        thresholds vary by region, variety and season — confirm with your local agriculture officer or a
        qualified agronomist before acting.
      </div>

      {/* ---------------------------------------------------------- filters */}
      <Card className="mb-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <input className="input lg:max-w-xs" placeholder="Search guides…"
            value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search learning content" />
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto lg:flex-1">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={cn('shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all',
                  cat === c ? 'bg-ink text-bg' : 'bg-line/40 text-muted hover:bg-line/70')}>
                {c}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 gap-1.5">
            {levels.map((l) => (
              <button key={l} onClick={() => setLevel(l)}
                className={cn('rounded-full px-2.5 py-1.5 text-xs font-bold transition-all',
                  level === l ? 'bg-leaf-600 text-white' : 'bg-line/40 text-muted hover:bg-line/70')}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* ----------------------------------------------------------- cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((l, i) => {
          const done = read.includes(l.id)
          const body = bodies[l.id]
          return (
            <Reveal key={l.id} delay={Math.min(i * 0.05, 0.3)}>
              <motion.button onClick={() => setOpen(l)}
                className="card card-hover flex h-full w-full flex-col text-left"
                whileHover={{ y: -3 }}>
                <div className="flex items-start justify-between gap-2">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-leaf-400/15 to-transparent text-xl" aria-hidden>
                    {l.icon}
                  </span>
                  {done ? <Chip tone="live">✓ Read</Chip> : <Chip tone="default">{typeIcons[l.type] ?? '📄'} {l.type}</Chip>}
                </div>

                <h2 className="mt-3 font-display text-base font-black leading-tight">{l.title}</h2>
                {body && <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">{body.summary}</p>}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Chip tone="info">{l.cat}</Chip>
                  <Chip>{l.level}</Chip>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 pt-3.5 text-[11px] text-faint">
                  <span>⏱ {l.mins} min read</span>
                  <span>{num(l.reads)} farmers read this</span>
                </div>
              </motion.button>
            </Reveal>
          )
        })}
      </div>

      {list.length === 0 && (
        <Card className="grid place-items-center py-16 text-center">
          <p className="text-sm text-muted">No guides match those filters.</p>
          <button onClick={() => { setCat('All'); setLevel('All'); setQ('') }} className="btn btn-ghost btn-sm mt-3">Clear filters</button>
        </Card>
      )}

      {/* --------------------------------------------------------- reader */}
      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ''} wide>
        {open && bodies[open.id] && (
          <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="mb-4 flex flex-wrap gap-2">
              <Chip tone="info">{open.cat}</Chip>
              <Chip>{open.level}</Chip>
              <Chip>{typeIcons[open.type]} {open.type}</Chip>
              <Chip>⏱ {open.mins} min</Chip>
              <Chip>{num(open.reads)} reads</Chip>
            </div>

            <p className="text-sm leading-relaxed">{bodies[open.id]!.summary}</p>

            <h3 className="mt-5 text-sm font-bold">Key points</h3>
            <ul className="mt-2 space-y-2">
              {bodies[open.id]!.points.map((p, i) => (
                <li key={i} className="flex gap-2.5 rounded-2xl bg-surface/60 p-3 text-sm leading-relaxed text-muted">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-leaf-400/15 text-[10px] font-black text-leaf-700 dark:text-leaf-300">
                    {i + 1}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: p }} />
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-2xl border border-gold-400/35 bg-gold-400/10 p-3.5 text-xs leading-relaxed text-muted">
              <p className="mb-1 font-bold text-gold-600 dark:text-gold-400">⚠ Important</p>
              {bodies[open.id]!.caution}
            </div>

            <div className="mt-4 rounded-2xl border border-line/70 bg-surface/60 p-3.5 text-xs leading-relaxed text-faint">
              ◆ Educational summary written for this prototype. It is not advice from a qualified agronomist
              and does not account for your soil test, variety or local conditions.
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <button
                onClick={() => {
                  setRead((r) => r.includes(open.id) ? r.filter((x) => x !== open.id) : [...r, open.id])
                }}
                className="btn btn-primary">
                {read.includes(open.id) ? '✓ Marked as read' : 'Mark as read'}
              </button>
              <Link href="/experts" onClick={() => setOpen(null)} className="btn btn-ghost">Ask an expert</Link>
              <button onClick={() => setOpen(null)} className="btn btn-ghost">Close</button>
            </div>
          </motion.article>
        )}
      </Modal>
    </div>
  )
}
