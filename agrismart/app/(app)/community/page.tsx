'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { Avatar, Card, Chip, DemoTag, PageHeader, Reveal, spring } from '@/components/ui'
import { farmer, groups, posts, type Post } from '@/lib/data'
import { cn, num } from '@/lib/utils'

type Row = Post & { mine?: boolean; liked?: boolean; commentList?: Array<{ id: string; author: string; body: string; time: string }> }

const seedComments: Record<string, Row['commentList']> = {
  p1: [
    { id: 'c1', author: 'Srinivas Rao', body: 'Same problem last Rabi. Turned out to be leaf curl virus spread by thrips. Removed the worst plants and it stopped spreading.', time: '1h ago' },
    { id: 'c2', author: 'Lakshmi Devi', body: 'Which spray did you use before it started? Some combinations burn the leaf edges and it looks like curl later.', time: '45m ago' },
  ],
  p3: [
    { id: 'c3', author: 'Naresh Babu', body: 'Aerator timing matters more than count. We run 4 hours at night and 2 in the early afternoon.', time: '3h ago' },
  ],
}

export default function CommunityPage() {
  const [group, setGroup] = useState('all')
  const [sort, setSort] = useState<'recent' | 'top'>('recent')
  const [rows, setRows] = useState<Row[]>(posts.map((p) => ({ ...p, commentList: seedComments[p.id] ?? [] })))
  const [draft, setDraft] = useState('')
  const [draftGroup, setDraftGroup] = useState(groups[0]!.id)
  const [open, setOpen] = useState<string | null>(null)
  const [reply, setReply] = useState('')

  const list = useMemo(() => {
    const f = rows.filter((p) => group === 'all' || p.group === group)
    return sort === 'top' ? [...f].sort((a, b) => b.likes - a.likes) : f
  }, [rows, group, sort])

  const label = (id: string) => groups.find((g) => g.id === id)?.label ?? id
  const icon = (id: string) => groups.find((g) => g.id === id)?.icon ?? '🌾'

  const like = (id: string) =>
    setRows((rs) => rs.map((p) => p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p))

  const publish = () => {
    const body = draft.trim()
    if (body.length < 8) return
    setRows((rs) => [
      {
        id: `u-${Date.now()}`, author: farmer.name, role: farmer.role, group: draftGroup,
        time: 'just now', body, likes: 0, comments: 0, hasImage: false, hue: 145,
        solved: false, mine: true, commentList: [],
      },
      ...rs,
    ])
    setDraft('')
  }

  const addComment = (id: string) => {
    const body = reply.trim()
    if (!body) return
    setRows((rs) => rs.map((p) => p.id === id
      ? { ...p, comments: p.comments + 1, commentList: [...(p.commentList ?? []), { id: `c-${Date.now()}`, author: farmer.name, body, time: 'just now' }] }
      : p))
    setReply('')
  }

  return (
    <div className="section">
      <PageHeader
        icon="🧑‍🌾"
        title="Farmer Community"
        sub="Ask questions, share what worked, and learn from farmers on the same crop."
        tag={<DemoTag />}
      >
        <div className="rounded-3xl border border-line/70 bg-surface/60 p-4 text-sm leading-relaxed text-muted">
          <p className="mb-1 font-bold text-ink">◆ Demo community</p>
          Every post, comment and profile below is sample content written for this prototype. Nothing you
          type here is sent to anyone or stored beyond this browser session.
        </div>
      </PageHeader>

      {/* ------------------------------------------------------------ groups */}
      <div className="mb-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {groups.map((g, i) => {
          const on = group === g.id
          return (
            <Reveal key={g.id} delay={i * 0.05}>
              <button onClick={() => setGroup(on ? 'all' : g.id)} aria-pressed={on}
                className={cn('card w-full text-left transition-all duration-300',
                  on ? 'border-leaf-400/70 shadow-glow' : 'card-hover')}>
                <div className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-leaf-400/10 text-lg" aria-hidden>{g.icon}</span>
                  <div className="min-w-0">
                    <p className="truncate font-bold leading-tight">{g.label}</p>
                    <p className="text-[11px] text-muted">{num(g.members)} members</p>
                  </div>
                </div>
                <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-leaf-600 dark:text-leaf-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf-400 opacity-75" aria-hidden />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-leaf-500" aria-hidden />
                  </span>
                  {g.active} active now
                </p>
              </button>
            </Reveal>
          )
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          {/* ----------------------------------------------------- composer */}
          <Reveal>
            <Card>
              <div className="flex gap-3">
                <Avatar seed={farmer.avatarSeed} size={40} />
                <div className="min-w-0 flex-1">
                  <textarea
                    className="input min-h-[84px] resize-y"
                    placeholder="Ask a question or share what worked on your farm…"
                    value={draft} onChange={(e) => setDraft(e.target.value)}
                  />
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <select className="input !w-auto !py-1.5 text-xs" value={draftGroup}
                      onChange={(e) => setDraftGroup(e.target.value)} aria-label="Post to group">
                      {groups.map((g) => <option key={g.id} value={g.id}>{g.icon} {g.label}</option>)}
                    </select>
                    <span className="text-[11px] text-faint">{draft.length}/600</span>
                    <button onClick={publish} disabled={draft.trim().length < 8}
                      className="btn btn-primary btn-sm ml-auto disabled:cursor-not-allowed disabled:opacity-40">
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </Reveal>

          {/* ------------------------------------------------------- filter */}
          <div className="mt-4 mb-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">{list.length} post{list.length === 1 ? '' : 's'}</span>
            {group !== 'all' && (
              <button onClick={() => setGroup('all')} className="chip chip-info">
                {icon(group)} {label(group)} <span aria-hidden>✕</span>
              </button>
            )}
            <div className="ml-auto flex gap-1.5">
              {(['recent', 'top'] as const).map((s) => (
                <button key={s} onClick={() => setSort(s)}
                  className={cn('rounded-full px-3 py-1.5 text-xs font-bold transition-all',
                    sort === s ? 'bg-ink text-bg' : 'bg-line/40 text-muted hover:bg-line/70')}>
                  {s === 'recent' ? 'Most recent' : 'Most liked'}
                </button>
              ))}
            </div>
          </div>

          {/* --------------------------------------------------------- feed */}
          <div className="space-y-4">
            {list.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i * 0.05, 0.25)}>
                <Card className={cn(p.mine && 'border-leaf-400/40')}>
                  <div className="flex gap-3">
                    <Avatar seed={p.author.split(' ').map((w) => w[0]).join('')} size={42} hue={p.hue} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-bold">{p.author}</span>
                        <Chip tone={p.role === 'Expert' ? 'info' : 'default'}>{p.role}</Chip>
                        <span className="text-[11px] text-faint">· {p.time}</span>
                        {p.solved && <Chip tone="live" className="ml-auto">✓ Solved</Chip>}
                        {p.mine && <Chip tone="info" className={p.solved ? '' : 'ml-auto'}>Your post</Chip>}
                      </div>

                      <p className="mt-1 text-[11px] font-semibold text-muted">{icon(p.group)} {label(p.group)}</p>
                      <p className="mt-2.5 text-sm leading-relaxed">{p.body}</p>

                      {p.hasImage && (
                        <div className="mt-3 h-32 overflow-hidden rounded-2xl border border-line/60">
                          <LeafPhoto hue={p.hue} />
                        </div>
                      )}

                      {p.expertAnswer && (
                        <div className="mt-3 rounded-2xl border border-sky-400/35 bg-sky-400/10 p-3.5">
                          <p className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400">
                            <span aria-hidden>👨‍🔬</span> Expert answer · {p.expertAnswer.author}
                          </p>
                          <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.expertAnswer.body}</p>
                        </div>
                      )}

                      <div className="mt-3.5 flex flex-wrap items-center gap-2">
                        <button onClick={() => like(p.id)}
                          className={cn('rounded-full px-3 py-1.5 text-xs font-bold transition-all',
                            p.liked ? 'bg-red-500/10 text-red-500' : 'bg-line/40 text-muted hover:bg-line/70')}
                          aria-pressed={!!p.liked}>
                          {p.liked ? '❤️' : '🤍'} {p.likes}
                        </button>
                        <button onClick={() => setOpen(open === p.id ? null : p.id)}
                          className="rounded-full bg-line/40 px-3 py-1.5 text-xs font-bold text-muted transition-colors hover:bg-line/70"
                          aria-expanded={open === p.id}>
                          💬 {p.comments + (p.commentList?.length ?? 0)}
                        </button>
                        {!p.solved && (
                          <Link href="/experts" className="ml-auto text-xs font-bold text-leaf-600 dark:text-leaf-400">
                            Ask an expert →
                          </Link>
                        )}
                      </div>

                      <AnimatePresence>
                        {open === p.id && (
                          <motion.div className="mt-3.5 border-t border-line/60 pt-3.5"
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }} transition={spring}>
                            <ul className="space-y-2.5">
                              {(p.commentList ?? []).map((c) => (
                                <li key={c.id} className="flex gap-2.5">
                                  <Avatar seed={c.author.split(' ').map((w) => w[0]).join('')} size={30} hue={90} />
                                  <div className="min-w-0 flex-1 rounded-2xl bg-surface/70 px-3 py-2">
                                    <p className="flex flex-wrap items-center gap-x-2 text-xs">
                                      <span className="font-bold">{c.author}</span>
                                      <span className="text-faint">{c.time}</span>
                                    </p>
                                    <p className="mt-1 text-sm leading-relaxed text-muted">{c.body}</p>
                                  </div>
                                </li>
                              ))}
                              {(p.commentList ?? []).length === 0 && (
                                <li className="text-xs text-faint">No comments yet — be the first to reply.</li>
                              )}
                            </ul>
                            <div className="mt-3 flex gap-2">
                              <input className="input flex-1" placeholder="Write a reply…"
                                value={open === p.id ? reply : ''} onChange={(e) => setReply(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addComment(p.id)} />
                              <button onClick={() => addComment(p.id)} className="btn btn-primary btn-sm">Reply</button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </Card>
              </Reveal>
            ))}

            {list.length === 0 && (
              <Card className="grid place-items-center py-16 text-center">
                <p className="text-sm text-muted">No posts in this group yet in the demo data.</p>
                <button onClick={() => setGroup('all')} className="btn btn-ghost btn-sm mt-3">Show all groups</button>
              </Card>
            )}
          </div>
        </div>

        {/* -------------------------------------------------------- sidebar */}
        <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <Reveal delay={0.08}>
            <Card>
              <h2 className="mb-3 text-sm font-bold">Community guidelines</h2>
              <ul className="space-y-2 text-xs leading-relaxed text-muted">
                <li>• Say which crop, variety and stage you are asking about — it changes the answer.</li>
                <li>• A photo of the affected leaf or animal beats three paragraphs of description.</li>
                <li>• Don&rsquo;t recommend pesticide doses unless you are qualified to.</li>
                <li>• Mark a question solved so the next farmer finds the answer faster.</li>
              </ul>
            </Card>
          </Reveal>

          <Reveal delay={0.14}>
            <Card>
              <h2 className="mb-3 text-sm font-bold">Most asked this week</h2>
              <ol className="space-y-2.5">
                {['Leaf curl in chilli after spraying', 'When to top-dress urea in paddy', 'Aerator hours for Vannamei at DOC 60',
                  'Best time to sell paddy after harvest'].map((q, i) => (
                  <li key={q} className="flex gap-2.5 text-sm">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-line/50 text-[10px] font-black text-muted">{i + 1}</span>
                    <span className="leading-snug text-muted">{q}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-[11px] text-faint">◆ Sample questions written for the demo.</p>
            </Card>
          </Reveal>

          <Reveal delay={0.2}>
            <Card className="!bg-gradient-to-br !from-leaf-400/10 !via-surface !to-surface">
              <h2 className="font-display text-base font-black">Need a real answer?</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Community replies are helpful but not a substitute for a qualified opinion. Verified
                agronomists and vets are one tap away.
              </p>
              <Link href="/experts" className="btn btn-primary btn-sm mt-3 w-full">👨‍🔬 Connect with an Expert</Link>
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  )
}

/** Procedural stand-in for an uploaded field photo — keeps the feed offline. */
function LeafPhoto({ hue }: { hue: number }) {
  return (
    <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="h-full w-full" aria-label="Sample field photo">
      <defs>
        <linearGradient id={`lp-${hue}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`hsl(${hue} 45% 74%)`} />
          <stop offset="100%" stopColor={`hsl(${(hue + 40) % 360} 38% 52%)`} />
        </linearGradient>
      </defs>
      <rect width="200" height="100" fill={`url(#lp-${hue})`} />
      {Array.from({ length: 7 }, (_, i) => (
        <ellipse key={i} cx={20 + i * 27} cy={50 + (i % 3) * 8} rx="16" ry="9"
          fill={`hsl(${hue + 20} 50% 40%)`} opacity="0.35"
          transform={`rotate(${-25 + i * 9} ${20 + i * 27} ${50 + (i % 3) * 8})`} />
      ))}
      <text x="100" y="94" textAnchor="middle" fontSize="8" fill="white" opacity="0.85" fontFamily="sans-serif">
        sample photo
      </text>
    </svg>
  )
}
