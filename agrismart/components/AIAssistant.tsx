'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { assistantReply, assistantDisclaimer, type Reply } from '@/lib/ai'
import { loadPlan } from '@/lib/farmPlan'
import { cn } from '@/lib/utils'
import { Avatar, spring } from './ui'

type Msg = { id: number; from: 'user' | 'ai'; text: string; reply?: Reply; src?: 'gemini' | 'rules' }

const STARTERS = [
  '3 acres paddy ki entha investment?',
  'Nearby tractor kavali',
  'Naaku available schemes enti?',
  'Paddy market price cheppu',
]

const LANGS = [
  { id: 'en-IN', label: 'English' },
  { id: 'te-IN', label: 'తెలుగు' },
  { id: 'en-IN-t', label: 'Tenglish' },
]

export default function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [listening, setListening] = useState(false)
  const [lang, setLang] = useState('en-IN')
  const [voiceState, setVoiceState] = useState<'idle' | 'unsupported' | 'error'>('idle')
  const [transcript, setTranscript] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const recRef = useRef<any>(null)
  const idRef = useRef(1)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, thinking, open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const send = useCallback((text: string) => {
    const clean = text.trim()
    if (!clean) return
    const uid = idRef.current++
    setMsgs((m) => [...m, { id: uid, from: 'user', text: clean }])
    setInput('')
    setThinking(true)
    // Live Gemini when configured; deterministic demo rules as honest fallback.
    window.setTimeout(async () => {
      let payload: (Reply & { source?: 'gemini' | 'rules' }) | null = null
      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: clean, plan: loadPlan() }),
        })
        if (res.ok) payload = (await res.json()) as Reply & { source?: 'gemini' | 'rules' }
      } catch { /* offline / route missing → rules below */ }
      if (!payload?.text) payload = { ...assistantReply(clean), source: 'rules' }
      // One quiet retry when the live model was rate-limited — spaced calls
      // usually get through; otherwise the labelled demo reply stands.
      if (payload.source !== 'gemini') {
        await new Promise((r) => setTimeout(r, 1500))
        try {
          const res2 = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: clean, plan: loadPlan() }),
          })
          if (res2.ok) {
            const p2 = (await res2.json()) as Reply & { source?: 'gemini' | 'rules' }
            if (p2?.text && p2.source === 'gemini') payload = p2
          }
        } catch { /* keep first payload */ }
      }
      const src = payload.source === 'gemini' ? 'gemini' : 'rules'
      setMsgs((m) => [...m, { id: idRef.current++, from: 'ai', text: payload!.text!, reply: payload as Reply, src }])
      setThinking(false)
    }, 420)
  }, [])

  /* --------------------------------------------------------- voice input */
  const startVoice = useCallback(() => {
    const SR =
      (typeof window !== 'undefined') &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    if (!SR) {
      setVoiceState('unsupported')
      setListening(false)
      return
    }
    try {
      const rec = new SR()
      // Tenglish is romanised Telugu, so it is recognised as English speech.
      rec.lang = lang === 'en-IN-t' ? 'en-IN' : lang
      rec.interimResults = true
      rec.continuous = false
      rec.maxAlternatives = 1

      rec.onresult = (e: any) => {
        let final = '', interim = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript
          if (e.results[i].isFinal) final += t
          else interim += t
        }
        setTranscript(final || interim)
        if (final) setInput(final)
      }
      rec.onerror = () => { setVoiceState('error'); setListening(false) }
      rec.onend = () => {
        setListening(false)
        setTranscript('')
        setMsgs((m) => {
          const last = input.trim()
          return last ? m : m
        })
      }
      recRef.current = rec
      setVoiceState('idle')
      setListening(true)
      rec.start()
    } catch {
      setVoiceState('error')
      setListening(false)
    }
  }, [lang, input])

  const stopVoice = useCallback(() => {
    try { recRef.current?.stop() } catch {}
    setListening(false)
  }, [])

  useEffect(() => () => { try { recRef.current?.abort() } catch {} }, [])

  const first = msgs.length === 0

  return (
    <>
      {/* ------------------------------------------------------- launcher */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close AgriSmart assistant' : 'Ask AgriSmart assistant'}
        aria-expanded={open}
        className={cn(
          'fixed z-[60] flex items-center gap-2 rounded-full pl-4 pr-5 text-sm font-bold text-white shadow-glow',
          'bottom-24 right-4 h-14 sm:bottom-6 sm:right-6',
        )}
        style={{ backgroundImage: 'linear-gradient(135deg,#2aa468 0%,#157a48 58%,#0e4b30 100%)' }}
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        initial={{ opacity: 0, scale: 0.6, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ ...spring, delay: 0.4 }}
      >
        <span className="relative grid h-7 w-7 place-items-center">
          <span className="absolute inset-0 rounded-full bg-white/30" style={{ animation: 'pulseRing 2.6s ease-out infinite' }} aria-hidden />
          <span className="relative text-base" aria-hidden>🤖</span>
        </span>
        <span className="hidden sm:inline">Ask AgriSmart</span>
        <span className="sm:hidden">Ask</span>
      </motion.button>

      {/* ---------------------------------------------------------- panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-[61] bg-black/35 backdrop-blur-[2px] sm:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)} />
            <motion.div
              role="dialog" aria-label="AgriSmart AI assistant"
              className={cn(
                'glass-strong fixed z-[62] flex flex-col overflow-hidden',
                'inset-x-0 bottom-0 top-0 rounded-none sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[min(38rem,calc(100vh-9rem))] sm:w-[26rem] sm:rounded-4xl',
              )}
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={spring}
            >
              {/* header */}
              <div className="flex items-center gap-3 border-b border-line/70 px-4 py-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-leaf-gradient text-lg shadow-glow" aria-hidden>🤖</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-bold">AgriSmart Assistant</p>
                  <p className="flex items-center gap-1.5 text-[11px] text-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-leaf-400" aria-hidden />
                    Online · English / తెలుగు / Tenglish
                  </p>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Close assistant"
                  className="tap-lg grid h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-line/40 hover:text-ink">✕</button>
              </div>

              {/* messages */}
              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {first && (
                  <div className="space-y-3">
                    <div className="flex gap-2.5">
                      <Avatar seed="AI" size={30} hue={145} />
                      <div className="glass rounded-3xl rounded-tl-lg px-3.5 py-3 text-sm">
                        <p className="font-semibold">Namaskaram 🌾</p>
                        <p className="mt-1 text-muted">
                          Ask me in English, Telugu or Tenglish — investment estimates, market prices,
                          nearby machinery, schemes, weather or crop problems.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {STARTERS.map((s) => (
                        <button key={s} onClick={() => send(s)}
                          className="rounded-full border border-line/80 px-3 py-1.5 text-xs font-medium text-muted transition-all hover:-translate-y-0.5 hover:border-leaf-400/50 hover:text-ink">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {msgs.map((m) => (
                    <motion.div key={m.id} className={cn('flex gap-2.5', m.from === 'user' && 'justify-end')}
                      initial={{ opacity: 0, y: 12, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                      {m.from === 'ai' && <Avatar seed="AI" size={30} hue={145} />}
                      <div className={cn(
                        'max-w-[80%] whitespace-pre-line rounded-3xl px-3.5 py-3 text-sm leading-relaxed',
                        m.from === 'user'
                          ? 'rounded-tr-lg bg-leaf-gradient text-white shadow-glow'
                          : 'glass rounded-tl-lg',
                      )}>
                        {m.from === 'ai' && (
                          <span className={cn('mb-1.5 block w-fit rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                            m.src === 'gemini' ? 'bg-leaf-400/15 text-leaf-600 dark:text-leaf-300' : 'bg-gold-400/15 text-gold-600 dark:text-gold-400')}>
                            {m.src === 'gemini' ? '⚡ Gemini live' : '◆ Demo rules'}
                          </span>
                        )}
                        {m.text}
                        {m.reply?.navigate && (
                          <Link href={m.reply.navigate.href}
                            className="btn btn-primary btn-sm mt-3 w-full"
                            onClick={() => setOpen(false)}>
                            {m.reply.navigate.label} <span aria-hidden>→</span>
                          </Link>
                        )}
                        {m.reply?.chips && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {m.reply.chips.map((c) => (
                              <button key={c} onClick={() => send(c)}
                                className="rounded-full border border-line/80 px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:border-leaf-400/50 hover:text-ink">
                                {c}
                              </button>
                            ))}
                          </div>
                        )}
                        {m.reply?.tone === 'caution' && (
                          <p className="mt-2.5 border-t border-line/60 pt-2 text-[11px] leading-snug text-faint">
                            ◆ Illustrative demo data — not professional advice.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {thinking && (
                  <div className="flex gap-2.5">
                    <Avatar seed="AI" size={30} hue={145} />
                    <div className="glass flex items-center gap-1.5 rounded-3xl rounded-tl-lg px-4 py-3.5">
                      {[0, 1, 2].map((i) => (
                        <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-leaf-400"
                          animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.16 }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* composer */}
              <div className="border-t border-line/70 px-3 py-3">
                {listening && (
                  <div className="mb-2 flex items-center gap-2 rounded-2xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500">
                    <motion.span className="h-2 w-2 rounded-full bg-red-500"
                      animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.1, repeat: Infinity }} />
                    Listening… {transcript && <span className="truncate font-normal text-muted">“{transcript}”</span>}
                  </div>
                )}
                {voiceState === 'unsupported' && (
                  <p className="mb-2 rounded-2xl border border-gold-400/40 bg-gold-400/10 px-3 py-2 text-xs text-gold-600 dark:text-gold-400">
                    Voice input is not supported in this browser. Try Chrome on desktop or Android — you can still type.
                  </p>
                )}
                {voiceState === 'error' && (
                  <p className="mb-2 rounded-2xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                    Microphone unavailable or permission denied. Check browser settings, or type your question.
                  </p>
                )}

                <div className="mb-2 flex gap-1.5">
                  {LANGS.map((l) => (
                    <button key={l.id} onClick={() => setLang(l.id)}
                      className={cn(
                        'flex-1 rounded-xl border px-2 py-1.5 text-[11px] font-bold transition-all',
                        lang === l.id
                          ? 'border-leaf-400/60 bg-leaf-400/10 text-leaf-700 dark:text-leaf-300'
                          : 'border-line/70 text-faint hover:text-muted',
                      )}>
                      {l.label}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={(e) => { e.preventDefault(); send(input) }}
                  className="flex items-center gap-2"
                >
                  <label className="sr-only" htmlFor="ai-input">Ask AgriSmart</label>
                  <input
                    id="ai-input" value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={lang === 'te-IN' ? 'ప్రశ్న అడగండి…' : 'Ask in English or Tenglish…'}
                    className="input min-w-0 flex-1 !py-3" autoComplete="off"
                  />
                  <button type="button" onClick={listening ? stopVoice : startVoice}
                    aria-label={listening ? 'Stop listening' : 'Speak your question'}
                    className={cn(
                      'tap-lg grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-lg transition-all active:scale-95',
                      listening
                        ? 'bg-red-500 text-white shadow-lift'
                        : 'glass hover:border-leaf-400/50',
                    )}>
                    <span aria-hidden>🎙️</span>
                  </button>
                  <button type="submit" disabled={!input.trim()}
                    aria-label="Send"
                    className="btn btn-primary h-12 w-12 shrink-0 !px-0 rounded-2xl">
                    <span aria-hidden>↑</span>
                  </button>
                </form>

                <p className="mt-2 px-1 text-[10px] leading-snug text-faint">{assistantDisclaimer}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
