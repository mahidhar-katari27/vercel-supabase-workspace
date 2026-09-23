#!/usr/bin/env node
// Pre-deploy leak guard. Fails (exit 1) if a secret appears where it must not.
//   npm run guard:secrets
//
// Checks:
//   1. literal secret values do not appear in any tracked source file
//   2. no client-side file imports lib/supabase-admin.mjs
//   3. files that could be served or bundled do not contain the secret key
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
const env = loadEnv(path.join(ROOT, '.env.local'))

// Anything that must never be committed or bundled.
const SECRETS = [
  ['VERCEL_TOKEN', env.VERCEL_TOKEN],
  ['SUPABASE_SECRET_KEY', env.SUPABASE_SECRET_KEY],
  ['SUPABASE_SERVICE_ROLE_KEY', env.SUPABASE_SERVICE_ROLE_KEY],
  ['GITHUB_TOKEN', env.GITHUB_TOKEN],
  ['GIT_TOKEN', env.GIT_TOKEN],
].filter(([, v]) => v && v.length >= 12)

// The anon key is public by design, so it is deliberately NOT in that list.

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', '.vercel', 'dist', 'build', 'out',
  '.turbo', '.cache', '.npm', '.local', 'coverage', '.svelte-kit',
])
// Files allowed to contain secrets (they are gitignored / never bundled).
const ALLOWED = new Set(['.env.local', '.env'])

// Templates hold obvious placeholders. They are still scanned for *literal*
// secret values, but exempt from the "looks like a key" pattern check —
// otherwise `sb_secret_your_secret_key` trips the alarm on every run and the
// guard gets ignored.
const TEMPLATE = new Set(['.env.example', '.env.template', '.env.sample'])

// Substrings that mark a value as a placeholder rather than a real credential.
const PLACEHOLDER_HINTS = ['your_', 'your-', 'xxxx', 'placeholder', 'example', 'changeme', '<', 'todo']
const looksLikePlaceholder = (s) => {
  const l = s.toLowerCase()
  return PLACEHOLDER_HINTS.some((h) => l.includes(h))
}

const findings = []
const filesScanned = { n: 0 }

function walk(dir) {
  let entries
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    const full = path.join(dir, e.name)
    const rel = path.relative(ROOT, full)
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue
      walk(full)
    } else if (e.isFile()) {
      if (ALLOWED.has(e.name)) continue
      filesScanned.n++
      let text
      try { text = fs.readFileSync(full, 'utf8') } catch { continue }
      if (text.includes('\0')) continue // binary

      for (const [name, value] of SECRETS) {
        if (text.includes(value))
          findings.push(`LEAK  ${rel} contains the literal ${name} value`)
      }

      // Client-side files must not import the privileged client.
      const isClientish =
        /\.(jsx|tsx|vue|svelte)$/.test(e.name) ||
        /(^|\/)(app|pages|components|client|src\/client)(\/|$)/.test(rel) ||
        /['"]use client['"]/.test(text)
      if (isClientish && /supabase-admin/.test(text))
        findings.push(`LEAK  ${rel} is client-side but references supabase-admin`)

      // A hardcoded secret-looking string anywhere in source.
      // Skipped for template files and obvious placeholders.
      if (!TEMPLATE.has(e.name)) {
        const hard = text.match(/sb_secret_[A-Za-z0-9_-]{8,}|sb_service_[A-Za-z0-9_-]{8,}|eyJhbGciOi[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g)
        if (hard) {
          for (const h of hard) {
            if (looksLikePlaceholder(h)) continue
            if (/^sb_(secret|service)_/.test(h))
              findings.push(`LEAK  ${rel} hardcodes a privileged key: ${h.slice(0, 18)}…`)
          }
        }
      }
    }
  }
}

console.log(`\n\x1b[1msecret leak guard\x1b[0m`)
console.log(`  root      : ${ROOT}`)
console.log(`  watching  : ${SECRETS.map(([n]) => n).join(', ') || '(no secrets configured)'}`)

walk(ROOT)
console.log(`  scanned   : ${filesScanned.n} file(s)`)
console.log(`  allowed   : ${[...ALLOWED].join(', ')} (gitignored, never bundled)`)

if (!SECRETS.length) {
  console.log(`\n  \x1b[33m!\x1b[0m no secret values found in .env.local — nothing to guard\n`)
  process.exit(0)
}

if (findings.length) {
  console.log(`\n  \x1b[31m${findings.length} PROBLEM(S):\x1b[0m`)
  for (const f of findings) console.log(`   • ${f}`)
  console.log(`\n  Fix before deploying. Rotate any key that already leaked.\n`)
  process.exit(1)
}

console.log(`\n  \x1b[32m✓\x1b[0m clean — no secret values in scanned source files\n`)
process.exit(0)
