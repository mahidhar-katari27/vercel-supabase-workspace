#!/usr/bin/env node
// Diagnostics for the PRIVILEGED Supabase key (sb_secret_ / service_role).
//   npm run check:supabase-admin
//
// Read-only. Enumerates the schema, counts users, lists storage buckets.
// Writes nothing, executes no RPC functions, prints no user data.
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')

function loadEnv(file) {
  if (!fs.existsSync(file)) return {}
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (m && !line.trim().startsWith('#')) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return out
}
const env = { ...loadEnv(path.join(ROOT, '.env.local')), ...process.env }

const url = (env.SUPABASE_URL || '').replace(/\/$/, '')
const anon = env.SUPABASE_ANON_KEY || ''
const secret = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || ''

const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`)
const bad = (m) => console.log(`  \x1b[31m✗\x1b[0m ${m}`)
const warn = (m) => console.log(`  \x1b[33m!\x1b[0m ${m}`)
const head = (m) => console.log(`\n\x1b[1m${m}\x1b[0m`)
let failures = 0
const fail = (m) => { bad(m); failures++ }

const H = { apikey: secret, Authorization: `Bearer ${secret}` }
const get = async (p, headers = H) => {
  try {
    const r = await fetch(url + p, { headers, signal: AbortSignal.timeout(20000) })
    const body = await r.text()
    let json = null
    try { json = JSON.parse(body) } catch {}
    return { status: r.status, body, json }
  } catch (e) {
    return { status: 0, body: '', error: e.cause?.code || e.message }
  }
}

console.log(`\n\x1b[1mSupabase ADMIN key diagnostics\x1b[0m\n  project: ${url}`)

// --- 1. key shape -----------------------------------------------------------
head('1 · key shape')
if (!secret) fail('SUPABASE_SECRET_KEY is empty')
else {
  const isLegacyJwt = secret.split('.').length === 3
  if (secret.startsWith('sb_secret_')) ok(`modern secret key (sb_secret_), ${secret.length} chars`)
  else if (isLegacyJwt) {
    try {
      const p = JSON.parse(Buffer.from(secret.split('.')[1], 'base64').toString())
      warn(`legacy JWT service key, role="${p.role}", expires ${new Date(p.exp * 1000).toISOString().slice(0, 10)}`)
      if (p.role !== 'service_role') fail(`expected role service_role, got "${p.role}"`)
    } catch { fail('could not decode legacy JWT') }
  } else fail('unrecognised key format — expected sb_secret_... or a service_role JWT')

  if (secret.startsWith('sb_publishable_'))
    fail('this is a PUBLISHABLE key, not a secret one — it cannot bypass RLS')
}

// --- 2. privilege proof -----------------------------------------------------
head('2 · privilege proof')
// The OpenAPI root is the cleanest discriminator: anon gets 401, secret gets 200.
const spec = await get('/rest/v1/')
if (spec.status === 200) ok('GET /rest/v1/ → HTTP 200 (this endpoint rejects anon keys)')
else if (spec.status === 401 || spec.status === 403)
  fail(`GET /rest/v1/ → HTTP ${spec.status} — key NOT privileged\n      ${spec.body.slice(0, 200)}`)
else if (spec.status === 0) fail(`GET /rest/v1/ → ${spec.error} (unreachable)`)
else fail(`GET /rest/v1/ → HTTP ${spec.status}\n      ${spec.body.slice(0, 200)}`)

const adminUsers = await get('/auth/v1/admin/users?per_page=1')
if (adminUsers.status === 200) ok('GET /auth/v1/admin/users → HTTP 200 (GoTrue admin API unlocked)')
else if (adminUsers.status === 401 || adminUsers.status === 403)
  fail(`GET /auth/v1/admin/users → HTTP ${adminUsers.status} — no admin rights`)
else warn(`GET /auth/v1/admin/users → HTTP ${adminUsers.status}`)

// --- 3. schema --------------------------------------------------------------
head('3 · schema exposed via PostgREST')
let tables = []
if (spec.json) {
  const info = spec.json.info || {}
  console.log(`  Postgres : ${info.version ?? '?'}`)
  console.log(`  schema   : ${info.title ?? '?'}`)
  tables = Object.keys(spec.json.definitions || {})
  const rpcs = Object.keys(spec.json.paths || {})
    .filter((p) => p.startsWith('/rpc/'))
    .map((p) => p.replace('/rpc/', ''))

  if (!tables.length)
    warn('NO tables or views exist in the public schema — the database is empty')
  else {
    ok(`${tables.length} table(s)/view(s):`)
    for (const t of tables.sort()) {
      const cols = Object.keys(spec.json.definitions[t].properties || {})
      console.log(`       • ${t} (${cols.length} cols): ${cols.join(', ')}`)
    }
  }
  if (rpcs.length) {
    warn(`${rpcs.length} RPC function(s): ${rpcs.join(', ')}`)
    warn('  not executed by this script — inspect before calling anything unfamiliar')
  }
}

// --- 4. auth + storage inventory -------------------------------------------
head('4 · project inventory')
const allUsers = await get('/auth/v1/admin/users?per_page=1000')
if (allUsers.json?.users) ok(`auth users        : ${allUsers.json.users.length}`)
else warn(`auth users        : unavailable (HTTP ${allUsers.status})`)

const buckets = await get('/storage/v1/bucket')
if (buckets.status === 200) {
  const b = Array.isArray(buckets.json) ? buckets.json : []
  ok(`storage buckets   : ${b.length}${b.length ? ' → ' + b.map((x) => x.name).join(', ') : ''}`)
} else warn(`storage buckets   : unavailable (HTTP ${buckets.status})`)

// --- 5. anon vs admin delta -------------------------------------------------
head('5 · what RLS is hiding from the anon key')
if (anon && tables.length) {
  let hidden = 0
  for (const t of tables) {
    const a = await get(`/rest/v1/${t}?select=*&limit=1`, { apikey: anon, Authorization: `Bearer ${anon}` })
    const rowsA = Array.isArray(a.json) ? a.json.length : -1
    const s = await get(`/rest/v1/${t}?select=*&limit=1`)
    const rowsS = Array.isArray(s.json) ? s.json.length : -1
    if (rowsS > rowsA) { console.log(`  • ${t}: anon sees ${rowsA} row(s), admin sees ${rowsS}`); hidden++ }
    else console.log(`  • ${t}: anon and admin see the same (RLS likely permissive or table empty)`)
  }
  if (!hidden) ok('no RLS divergence detected on a 1-row sample')
} else if (!tables.length) {
  warn('nothing to compare — create tables first, then re-run this script')
  warn('until then you cannot verify that RLS is enabled on anything')
} else warn('SUPABASE_ANON_KEY missing — cannot compare roles')

head('result')
if (failures) { console.log(`  \x1b[31mADMIN KEY NOT WORKING\x1b[0m — ${failures} problem(s)\n`); process.exit(1) }
ok('privileged key accepted — full RLS-bypassing access confirmed')
warn('treat this key as a master password. Rotate it after any exposure.')
console.log()
process.exit(0)
