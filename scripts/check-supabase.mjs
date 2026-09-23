#!/usr/bin/env node
// Live Supabase connectivity check.
//   node scripts/check-supabase.mjs
// Exits 0 only if the project is reachable and the anon key is accepted.
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')

// --- load .env.local (no dependency on --env-file) -------------------------
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
const key = env.SUPABASE_ANON_KEY || ''

const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`)
const bad = (m) => console.log(`  \x1b[31m✗\x1b[0m ${m}`)
const warn = (m) => console.log(`  \x1b[33m!\x1b[0m ${m}`)
const head = (m) => console.log(`\n\x1b[1m${m}\x1b[0m`)

let failures = 0
const fail = (m) => { bad(m); failures++ }

// --- 1. decode the anon key ------------------------------------------------
head('1 · anon key contents')
if (!key) fail('SUPABASE_ANON_KEY is empty')
else {
  try {
    const parts = key.split('.')
    if (parts.length !== 3) throw new Error('not a JWT (expected 3 dot-separated parts)')
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    )
    const ref = payload.ref
    console.log(`  role      : ${payload.role}`)
    console.log(`  project   : ${ref}`)
    console.log(`  issued    : ${new Date(payload.iat * 1000).toISOString().slice(0, 10)}`)
    console.log(`  expires   : ${new Date(payload.exp * 1000).toISOString().slice(0, 10)}`)
    if (payload.role !== 'anon') warn(`role is "${payload.role}", expected "anon"`)

    head('2 · project ref format')
    if (typeof ref !== 'string' || ref.length !== 20)
      fail(`ref is ${ref?.length} chars — Supabase refs are exactly 20 (got "${ref}")`)
    else ok(`ref length is 20`)
    if (!/^[a-z0-9]+$/.test(ref || '')) fail('ref must be lowercase a-z / 0-9 only')
    else ok('ref charset valid (lowercase alphanumeric)')
  } catch (e) {
    fail(`could not decode key: ${e.message}`)
  }
}

// --- 3. SUPABASE_URL consistency -------------------------------------------
head('3 · SUPABASE_URL')
if (!url) fail('SUPABASE_URL is empty')
else {
  console.log(`  ${url}`)
  const refInKey = (() => { try { return JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString()).ref } catch { return null } })()
  const refInUrl = url.match(/^https:\/\/([^.]+)\./)?.[1]
  if (refInKey && refInUrl && refInKey !== refInUrl)
    fail(`URL ref "${refInUrl}" does not match key ref "${refInKey}"`)
  else if (refInKey) ok('URL and key agree on the project ref')
}

// --- 4. reachability -------------------------------------------------------
head('4 · reachability (anon role)')
if (url) {
  const H = { apikey: key, Authorization: `Bearer ${key}` }

  const probe = async (label, u, headers = {}) => {
    try {
      const r = await fetch(u, { headers, signal: AbortSignal.timeout(15000) })
      const body = await r.text()
      return { status: r.status, body }
    } catch (e) {
      fail(`${label}: ${e.cause?.code || e.name} — ${e.message}`)
      if (/ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(String(e.cause?.code) + e.message))
        warn('host does not resolve → wrong project ref, or the project was deleted/paused')
      return null
    }
  }

  // 4a. GoTrue health — needs the apikey header, returns version info.
  const health = await probe('health', `${url}/auth/v1/health`, H)
  if (!health) { /* already reported */ }
  else if (health.status === 200) {
    let v = ''
    try { v = JSON.parse(health.body).version } catch {}
    ok(`auth/v1/health  HTTP 200${v ? `  (GoTrue ${v})` : ''}`)
  } else if (health.status === 401 || health.status === 403)
    fail(`auth/v1/health  HTTP ${health.status} — anon key rejected\n      ${health.body.slice(0, 200)}`)
  else fail(`auth/v1/health  HTTP ${health.status}\n      ${health.body.slice(0, 200)}`)

  // 4b. Auth settings — public config, proves the key is accepted by GoTrue.
  const settings = await probe('settings', `${url}/auth/v1/settings`, H)
  if (settings) {
    if (settings.status === 200) {
      let s = {}
      try { s = JSON.parse(settings.body) } catch {}
      const flags = ['external', 'disable_signup', 'mailer_autoconfirm', 'mfa_totp_enroll_enabled']
        .filter((k) => k in s)
      ok(`auth/v1/settings HTTP 200${flags.length ? `  (${flags.join(', ')})` : ''}`)
    } else fail(`auth/v1/settings HTTP ${settings.status} — ${settings.body.slice(0, 160)}`)
  }

  // 4c. KEY VALIDITY TEST. PostgREST's OpenAPI root requires service_role, so a
  // 401 there is EXPECTED for anon and proves nothing. Instead we query a table
  // that cannot exist and read the error code:
  //   401 / PGRST301  -> the anon key itself is invalid or expired
  //   404 / PGRST205  -> key ACCEPTED, table just missing  (this is success)
  const canary = await probe(
    'canary',
    `${url}/rest/v1/__anon_key_probe_should_not_exist__?select=*&limit=1`,
    H
  )
  if (canary) {
    if (canary.status === 401 || canary.status === 403)
      fail(`PostgREST rejected the anon key (HTTP ${canary.status})\n      ${canary.body.slice(0, 200)}`)
    else if (canary.status === 404 || /PGRST205|could not find the table|does not exist/i.test(canary.body))
      ok('PostgREST accepts the anon key (404 on a non-existent table = auth OK)')
    else if (canary.status === 200) ok('PostgREST responded 200')
    else warn(`PostgREST canary returned HTTP ${canary.status}: ${canary.body.slice(0, 160)}`)
  }

  // 4d. Storage — lists public buckets; 200 or empty is fine, 401 means key bad.
  const buckets = await probe('buckets', `${url}/storage/v1/bucket`, H)
  if (buckets) {
    if (buckets.status === 200) {
      let list = []
      try { list = JSON.parse(buckets.body) } catch {}
      ok(`storage/v1/bucket HTTP 200  (${list.length} bucket(s)${list.length ? ': ' + list.map((b) => b.name).join(', ') : ''})`)
    } else if (buckets.status === 401 || buckets.status === 403)
      warn(`storage/v1/bucket HTTP ${buckets.status} — Storage may be disabled or RLS blocks listing`)
    else warn(`storage/v1/bucket HTTP ${buckets.status}`)
  }

  head('5 · schema visible to the anon role')
  warn('the OpenAPI schema root requires service_role, so table names cannot be')
  warn('enumerated with an anon key. Tell me your table names, or supply a')
  warn('service_role key (server-side only) and I will map the schema for you.')
}

head('result')
if (failures) {
  console.log(`  \x1b[31mNOT CONNECTED\x1b[0m — ${failures} problem(s) above`)
  process.exit(1)
}
ok('Supabase is reachable and the anon key is accepted')
process.exit(0)
