#!/usr/bin/env node
// Scans the git STAGING AREA (not the working tree) for live secrets.
//   node scripts/scan-staged-secrets.mjs
//
// Why staged content and not files on disk: what gets committed is the index,
// and .gitignore rules do not apply to files already tracked. Reading `git show
// :path` checks the exact bytes that would land in the commit.
//
// Reads as BYTES — binary blobs (gzip, images) must not crash the scan.
// Exit 1 on any finding, so it works as a pre-commit hook.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = path.resolve(import.meta.dirname, '..')
const git = (args) => execFileSync('git', args, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 })

// --- live secret values, sourced from .env.local ----------------------------
function loadEnv(file) {
  if (!fs.existsSync(file)) return {}
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (m && !line.trim().startsWith('#')) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return out
}
const env = loadEnv(path.join(ROOT, '.env.local'))

const SECRET_KEYS = [
  'VERCEL_TOKEN', 'SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
  'GITHUB_TOKEN', 'GH_TOKEN', 'GITHUB_PAT', 'DATABASE_URL', 'DB_PASSWORD',
]
const secrets = SECRET_KEYS
  .map((k) => [k, env[k]])
  .filter(([, v]) => v && v.length >= 12)

// --- generic credential shapes ---------------------------------------------
const PATTERNS = [
  ['GitHub classic PAT', /ghp_[A-Za-z0-9]{36}/g],
  ['GitHub fine-grained PAT', /github_pat_[A-Za-z0-9_]{20,}/g],
  ['GitHub OAuth token', /gho_[A-Za-z0-9]{36}/g],
  ['Vercel token', /vc[p]?_[A-Za-z0-9]{20,}/g],
  ['Supabase secret key', /sb_secret_[A-Za-z0-9_-]{10,}/g],
  ['Supabase service key', /sb_service_[A-Za-z0-9_-]{10,}/g],
  ['AWS access key id', /AKIA[0-9A-Z]{16}/g],
  ['Slack token', /xox[baprs]-[A-Za-z0-9-]{10,}/g],
  ['private key block', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['postgres connection string', /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/g],
]
const PLACEHOLDER = ['your_', 'your-', 'xxxx', 'placeholder', 'example', 'changeme', '<', 'redacted']

const staged = git(['diff', '--cached', '--name-only', '--diff-filter=ACMR'])
  .toString().split('\n').filter(Boolean)

const findings = []

// Hard block: env files must never be committed, gitignore rules notwithstanding.
for (const f of staged) {
  if (/^\.env(\..+)?$/.test(f) && f !== '.env.example')
    findings.push(`BLOCKED  ${f} is staged — env files must never be committed`)
}

for (const f of staged) {
  let blob
  try { blob = git(['show', `:${f}`]) } catch { continue }

  for (const [name, val] of secrets) {
    const vb = Buffer.from(val)
    if (blob.includes(vb)) findings.push(`LEAK  ${f} contains the literal ${name} value`)
    else if (vb.length >= 20 && blob.includes(vb.subarray(0, 20)))
      findings.push(`LEAK  ${f} contains a 20-char fragment of ${name}`)
  }

  const text = blob.toString('utf8')
  for (const [label, re] of PATTERNS) {
    for (const m of text.match(re) ?? []) {
      if (PLACEHOLDER.some((p) => m.toLowerCase().includes(p))) continue
      findings.push(`LEAK  ${f} contains a real-looking ${label}: ${m.slice(0, 14)}…`)
    }
  }
}

console.log(`\n\x1b[1mstaged secret scan\x1b[0m`)
console.log(`  staged files : ${staged.length}`)
console.log(`  live secrets : ${secrets.map(([n]) => n).join(', ') || '(none found in .env.local)'}`)
console.log(`  patterns     : ${PATTERNS.length}`)

if (findings.length) {
  console.log(`\n  \x1b[31m${findings.length} PROBLEM(S) — COMMIT BLOCKED\x1b[0m`)
  for (const f of [...new Set(findings)]) console.log(`   • ${f}`)
  console.log(`\n  Unstage with:  git restore --staged <file>`)
  console.log(`  If a real key already reached a remote, ROTATE it — deleting the`)
  console.log(`  file is not enough, it stays in history.\n`)
  process.exit(1)
}
console.log(`\n  \x1b[32m✓\x1b[0m clean — no secrets in the staged bytes\n`)
process.exit(0)
