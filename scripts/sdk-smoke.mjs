#!/usr/bin/env node
// Proves the supabase-js SDK layer works end-to-end (not just raw HTTP).
//   npm run check:supabase-sdk
//
// Uses deliberate canary probes: we query a table that cannot exist and attempt
// a login with bogus credentials. A *specific* error back means auth worked and
// the request was actually evaluated server-side. No writes occur.
import { getSupabaseAsync, supabaseConfig } from '../lib/supabase.mjs'

const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`)
const bad = (m) => console.log(`  \x1b[31m✗\x1b[0m ${m}`)
let failures = 0
const fail = (m) => { bad(m); failures++ }

const { url } = supabaseConfig()
console.log(`\n\x1b[1msupabase-js SDK smoke test\x1b[0m\n  url: ${url}`)

const s = await getSupabaseAsync()
console.log(`  websocket: ${typeof globalThis.WebSocket !== 'undefined' ? 'native' : 'ws polyfill (Node < 22)'}`)

// 1 · client construction + session read
const { data, error } = await s.auth.getSession()
if (error) fail(`getSession threw: ${error.message}`)
else ok(`auth.getSession() ok (session=${data.session})`)

// 2 · PostgREST round-trip. PGRST205 / 42P01 == key accepted, table absent.
const q = await s.from('__sdk_probe_missing__').select('*').limit(1)
if (q.error && ['PGRST205', '42P01', 'PGRST116'].includes(q.error.code))
  ok(`PostgREST round-trip ok (${q.error.code}: table not found = auth accepted)`)
else if (q.error && ['PGRST301', '401', 'invalid_key'].includes(String(q.error.code ?? q.error.status)))
  fail(`PostgREST rejected the key: ${q.error.code} — ${q.error.message}`)
else if (q.error) fail(`PostgREST unexpected error: ${q.error.code} — ${q.error.message}`)
else fail('canary table unexpectedly exists — rename the probe table')

// 3 · GoTrue round-trip. Expect a credential error, NOT a key error.
const b = await s.auth.signInWithPassword({
  email: 'probe@example.invalid',
  password: 'canary-not-a-real-password',
})
if (b.error && /invalid|credentials|Invalid login/i.test(b.error.message))
  ok(`GoTrue round-trip ok (rejected bogus login: ${b.error.name ?? b.error.status})`)
else if (b.error && /api key|apikey|JWT|token/i.test(b.error.message))
  fail(`GoTrue rejected the anon key: ${b.error.message}`)
else if (b.error) fail(`GoTrue unexpected error: ${b.error.message}`)
else fail('bogus login SUCCEEDED — check your auth settings!')

// 4 · Realtime websocket handshake
try {
  const rt = s.channel('__smoke_probe__')
  const status = await new Promise((resolve) => {
    const t = setTimeout(() => resolve('timeout'), 12000)
    rt.on('system', (m) => { if (m.action === 'joined') { clearTimeout(t); resolve('joined') } })
       .subscribe((st) => {
         if (st === 'SUBSCRIBED') { clearTimeout(t); resolve('subscribed') }
         else if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') { clearTimeout(t); resolve(st) }
       })
  })
  if (status === 'subscribed' || status === 'joined') ok(`Realtime websocket connected (${status})`)
  else if (status === 'CHANNEL_ERROR') fail('Realtime CHANNEL_ERROR — key rejected by realtime service')
  else bad(`Realtime did not connect within 12s (${status}) — may be disabled on this project`)
  await rt.unsubscribe()
} catch (e) {
  bad(`Realtime probe inconclusive: ${e.message}`)
}

console.log(failures
  ? `\n  \x1b[31mSDK NOT WORKING\x1b[0m — ${failures} failure(s)\n`
  : `\n  \x1b[32mSDK WORKING\x1b[0m — auth, REST and client all verified\n`)
process.exit(failures ? 1 : 0)
