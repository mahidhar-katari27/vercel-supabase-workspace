# Workspace credentials — Vercel + Supabase

Both services are authenticated and **verified live on 2026-09-23**.
There is no application code here yet — only the wiring.

## Connection status

| Service | Identity | Status |
|---|---|---|
| **GitHub** | `mahidhar-katari27` · free | ✅ verified · 🔒 rotate token |
| **Vercel** | `mahidharkatari2709-7801` · Hobby | ✅ verified |
| **Supabase** · anon | project `zhnroiztfzocjfiegssa` | ✅ verified |
| **Supabase** · secret | same project, RLS-bypassing | ✅ verified · 🔒 rotate |

### GitHub

| | |
|---|---|
| Account | `mahidhar-katari27` (created 2026-08-31) |
| Plan | free · 2FA **disabled** |
| Repository | https://github.com/mahidhar-katari27/vercel-supabase-workspace |
| Visibility | **private** |
| Branch | `main` |
| Token scopes | `repo`, `user`, `workflow`, `delete_repo`, `admin:org`, `admin:enterprise`, … |

> 🔒 **This token is effectively unrestricted.** The scopes include
> `admin:enterprise`, `admin:org` and `delete_repo`, so it can delete
> repositories, read your email address, and act across any organisation you
> belong to. Creating one repo needed only `repo`. **Rotate it** and reissue
> with the minimum scope you actually need. 2FA is also off on this account,
> which is worth fixing independently of the token.

The token is **not** stored in `.git/config`. Pushes read it from `$GIT_TOKEN`
via `scripts/git-credential-env.sh`, so it never lands on disk or in process
args. Because `.git/config` is not persisted between sessions, run
`bash scripts/git-setup.sh` after a fresh session to restore the remote,
identity and hook path.

```bash
export GIT_TOKEN=ghp_...
bash scripts/git-push.sh          # scans staged bytes, then pushes
```

### Secret-scan pre-commit hook

`scripts/githooks/pre-commit` runs `scripts/scan-staged-secrets.mjs` on every
commit. It reads the **staged bytes** via `git show :path`, not the working
tree — because `.gitignore` does not apply to files already tracked, which is
how secrets usually escape. It blocks:

- any `.env*` file being staged (except `.env.example`)
- the literal value of any secret found in `.env.local`
- real-looking credentials matching 10 known shapes (GitHub PATs, Vercel,
  Supabase secret keys, AWS, Slack, private key blocks, Postgres URIs)

Placeholders such as `sb_secret_your_secret_key` are ignored, so the guard does
not cry wolf. Verified with positive controls: it refuses a commit containing
`.env.local` or a planted `ghp_` token (exit 1) and allows a clean one (exit 0).
Bypass only with `git commit --no-verify`.

### Vercel

| | |
|---|---|
| Account | `mahidharkatari2709-7801` · mahidharkatari2709@gmail.com |
| Team / org id | `team_wjZnWlktTnwHlFIRQYHOWZF3` |
| Token | `Arena`, full access |
| **Token expires** | **2026-09-30** (~6 days) |
| CLI | 59.25.4, at `./node_modules/.bin/vercel` |
| Checks passing | `whoami`, `projects ls`, `deployments ls` |

Existing projects:

| Project | Production URL | Node |
|---|---|---|
| `campus-bus-tracker-vercel` | https://campus-bus-tracker-vercel.vercel.app | 24.x |
| `charan-porfolio-editor` | https://charan-cinema-portfolio.vercel.app | 24.x |
| `agrismart` | https://agrismart-two-neon.vercel.app | 24.x |

> None of the three have any env vars set, so none of them currently point at
> this Supabase project.

### Supabase

| | |
|---|---|
| Project URL | https://zhnroiztfzocjfiegssa.supabase.co |
| Project ref | `zhnroiztfzocjfiegssa` (20 chars — valid) |
| Postgres | **14.5** |
| Tables / views | **0 — the database is empty** |
| RPC functions | 1 (`rls_auto_enable`) |
| Auth users | 0 |
| Storage buckets | 0 |
| GoTrue | v2.197.0 — HTTP 200 |
| Realtime | websocket **subscribed** |
| SDK | `@supabase/supabase-js` 2.109.0 |

Two keys are wired up:

| Key | Var | Role | Status |
|---|---|---|---|
| anon (JWT) | `SUPABASE_ANON_KEY` | `anon`, RLS enforced | ✅ verified · expires 2036 |
| secret (`sb_secret_`) | `SUPABASE_SECRET_KEY` | **bypasses RLS** | ✅ verified · no expiry, revoke via dashboard |

> ⚠️ **The ref is easy to mistype.** It is `zhnroiztfzocjfiegssa` —
> *not* `zhnroitztfzocjfiegsssa`. Both look plausible; only the first exists.
> `npm run check:supabase` compares the URL against the ref embedded in the JWT
> and fails loudly on a mismatch.

> 🔒 **`SUPABASE_SECRET_KEY` is a master password.** It grants unrestricted
> read/write on every table, user and bucket. Server-side only. It was pasted
> into a chat conversation — **rotate it** at Project Settings → API Keys.

> ❓ **`rls_auto_enable` is an unfamiliar RPC function** and its signature is
> opaque in the OpenAPI spec (`body: object`, no parameter detail). It was
> **not executed** by any script here. Inspect its definition in the dashboard
> (Database → Functions) before anything calls it — a function with that name
> plausibly alters RLS policies across the schema.


## Verify everything

```bash
npm run check                  # everything: Vercel + anon REST + SDK + admin
npm run check:vercel           # Vercel only
npm run check:supabase         # anon key: decode, ref format, URL match, endpoints
npm run check:supabase-sdk     # anon via supabase-js: auth, PostgREST, GoTrue, Realtime
npm run check:supabase-admin   # secret key: privileges, schema, users, buckets
npm run guard:secrets          # pre-deploy scan for leaked secrets
```

`check:supabase-sdk` uses deliberate canary probes — it queries a table that
cannot exist and attempts a login with bogus credentials. A *specific* error
back proves the request was evaluated server-side. `check:supabase-admin` is
read-only: it enumerates the schema and counts users/buckets but **prints no
user data and executes no RPC functions**. Nothing is written by any of them.

## Using Supabase in code

**Anon (browser-safe, RLS enforced):**

```js
// Browser, or Node >= 22:
import { getSupabase } from './lib/supabase.mjs'
const supabase = getSupabase()

// Node 20 (this workspace) — must use the async factory:
import { getSupabaseAsync } from './lib/supabase.mjs'
const supabase = await getSupabaseAsync()

const { data, error } = await supabase.from('your_table').select('*')
```

**Admin (SERVER-SIDE ONLY, bypasses RLS):**

```js
// API routes, server actions, server components, cron, seed scripts ONLY.
import { getSupabaseAdmin } from './lib/supabase-admin.mjs'
const admin = await getSupabaseAdmin()

const { data } = await admin.auth.admin.listUsers()
const { rows } = await admin.from('any_table').select('*')   // no RLS check
```

`getSupabaseAdmin()` **throws if called in a browser context**, as a safety net.
That guard is not a substitute for keeping the import server-side — if it ever
fires, assume the key is already in the shipped bundle and rotate it.

Run plain Node scripts with the env loaded:

```bash
node --env-file=.env.local your-script.mjs
```

## Deploying to Vercel

```bash
./deploy.sh                    # preview deploy of the current directory
./deploy.sh --prod             # production deploy
./deploy.sh --prod ./my-app    # production deploy of a subdirectory
./deploy.sh whoami             # check the token
./deploy.sh projects           # list projects
./deploy.sh deploys            # list recent deployments
./deploy.sh link my-project    # link cwd to a project (creates it if new)
./deploy.sh logs <url>         # tail logs of a deployment
./deploy.sh remove <url>       # delete a deployment
./deploy.sh raw <any args>     # anything else, straight to the CLI
./deploy.sh help
```

**Before deploying**, push the Supabase vars to the project so the runtime can
see them — `.env.local` is gitignored and never uploaded:

```bash
# Safe for the browser — NEXT_PUBLIC_ vars are inlined into client JS.
./deploy.sh raw env add NEXT_PUBLIC_SUPABASE_URL https://zhnroiztfzocjfiegssa.supabase.co
./deploy.sh raw env add NEXT_PUBLIC_SUPABASE_ANON_KEY "$SUPABASE_ANON_KEY"

# Server-side only. Vercel marks these "Sensitive": write-once, never readable
# back via API or dashboard. Use --sensitive so nobody can exfiltrate them later.
./deploy.sh raw env add SUPABASE_URL https://zhnroiztfzocjfiegssa.supabase.co
./deploy.sh raw env add SUPABASE_SECRET_KEY "$SUPABASE_SECRET_KEY" --sensitive
```

> 🔒 **Never prefix the secret key with `NEXT_PUBLIC_`.** That inlines it into
> the shipped JavaScript bundle, where every visitor can read it — and it
> bypasses RLS. Run `npm run guard:secrets` before deploying; it is also wired
> up as a `predeploy` hook.

## Supabase — live connection

Project `zhnroiztfzocjfiegssa` is wired into the app, not just the scripts:

- `agrismart/lib/supabase.ts` — browser client (anon key) + server client
  (service key, route handlers only). Missing vars ⇒ every caller falls back
  to the labelled demo dataset.
- `agrismart/lib/liveStore.ts` — bookings persist to the Postgres `bookings`
  table when it exists, otherwise to localStorage; the UI chips show
  "Supabase live" / "Browser-saved" honestly.
- `POST /api/farm/photo` — crop photos upload to the `crop-photos` Storage
  bucket with the service key (bucket auto-created; verified writing objects).
- `GET /api/system/supabase` + the card on `/admin` — live probe (REST latency,
  tables, buckets, auth users).

**One step remains to make Postgres the source of truth:** apply
`agrismart/supabase/migrations/0001_core.sql` (bookings + RLS) and
`0002_location_fields.sql` (location columns) in Supabase Dashboard → SQL
Editor, or hand the agent the DB password to apply them. Until then bookings
stay browser-local and the UI says so.

## Google Maps

AgriSmart 2.0 ships a full Google Maps Platform integration — Smart Map,
Places Autocomplete search, geocoding, directions, farm & product pin pickers
and "nearby" services on ten-plus pages.

```bash
# agrismart/.env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...   # empty = labelled demo map
```

- **Setup, API list, key restrictions:** [`agrismart/docs/google-maps.md`](agrismart/docs/google-maps.md)
  (also reachable in-app via any **Configure Maps** button).
- **Schema for location-enabled records:** `agrismart/supabase/migrations/0002_location_fields.sql`
- **No key? No problem:** every map falls back to an interactive, clearly
  badged **DEMO MAP** with sample locations; distances become labelled
  estimates and "Open in Google Maps" links still work keyless.

## Start Farming (🌱 /start)

A guided, zero-knowledge onboarding flow inside AgriSmart 2.0:

1. **Wizard (7 steps)** — location (Google Maps picker / GPS), land size in
   acres + cents with multi-plot support, soil (including an honest
   "I don't know" path with a soil-test nudge), water source + reliability,
   budget (total or per-acre), goals, and start date.
2. **Animated analysis** → **suitability-ranked crop cards** with transparent
   "Why this crop" reasons, "Things to consider", risk lists and a comparison
   table (no universal "best crop").
3. **Complete Farm Plan** — 1-acre economics with clickable cost breakdown and
   donut, total-land recalculation, What-If scenarios (conservative / expected
   / optimistic + custom sliders), live crop weather (Open-Meteo API, labelled
   sample fallback), stage calendar generated from the start date, machinery
   needs → AgriRent, relevant schemes → Schemes, and daily tasks that sync to
   the dashboard.

The plan is the single source of truth: it merges into **My Farm lands**,
prefills **Schemes eligibility**, links **Crop Doctor** diagnoses to a land,
adds market context on **Market**, and answers questions in the **AI
assistant** (English / Telugu / Tenglish) with the 1-acre → total-land maths.
Every financial figure carries the estimate disclaimer; live data sources are
labelled (Open-Meteo, Google Maps, mandi source + date).

```bash
npm run audit:start            # end-to-end playwright audit (61 checks)
node agrismart/scripts/start-audit.js https://agrismart-two-neon.vercel.app
```

## Files

| File | Purpose |
|---|---|
| `.env.local` | All credentials, mode `600`, **gitignored** |
| `.env.example` | Committable template |
| `.gitignore` | Excludes `.env*`, `.vercel/`, `node_modules/`, build dirs |
| `deploy.sh` | Vercel wrapper; injects the token into every CLI call |
| `lib/supabase.mjs` | Anon client factory (sync + async variants) |
| `lib/supabase-admin.mjs` | **Privileged** client factory, server-side only |
| `scripts/check-supabase.mjs` | Anon key: REST-level connectivity diagnostics |
| `scripts/sdk-smoke.mjs` | Anon key: end-to-end `supabase-js` test |
| `scripts/check-supabase-admin.mjs` | Secret key: privileges, schema, inventory |
| `scripts/guard-secrets.mjs` | Scan the working tree for leaked secrets |
| `scripts/scan-staged-secrets.mjs` | Scan the git **index** for leaked secrets |
| `scripts/githooks/pre-commit` | Runs the staged scan on every commit |
| `scripts/git-setup.sh` | Restores remote / identity / hooks path after a new session |
| `scripts/git-credential-env.sh` | Credential helper reading `$GIT_TOKEN` (never persists it) |
| `scripts/git-push.sh` | Scan-then-push |
| `package.json` | npm scripts + dependencies |

## Gotchas found the hard way

**Vercel**

- `VERCEL_ORG_ID` is a reserved CLI env var. Setting it without
  `VERCEL_PROJECT_ID` makes *every* command fail. Hence `VERCEL_TEAM_ID`.
- Global flags must follow the subcommand: `vercel --yes whoami` is parsed as
  "deploy a folder called `whoami`". `deploy.sh` handles the ordering.
- `npm i -g vercel` **silently fails** here — the npm prefix `/usr` is
  root-owned. The local install is the working path.
- `node_modules/` is not persisted between sessions; `deploy.sh` reinstalls
  the CLI automatically if it is missing.

**Supabase**

- **Node < 22 has no native `WebSocket`.** `createClient()` builds its Realtime
  client eagerly and throws `Node.js 20 detected without native WebSocket
  support` *before any network call*. `getSupabaseAsync()` injects the `ws`
  polyfill. On Vercel, pin Node 22+ in project settings to avoid this entirely.
- `GET /rest/v1/` (the OpenAPI root) **requires a privileged key**. A 401 there
  is correct behaviour for an anon key and does **not** mean the key is bad —
  this is a common false negative when testing Supabase connectivity. It is
  also the cleanest way to *prove* a secret key works: anon → 401, secret → 200.
- `/auth/v1/health` requires the `apikey` header; without it you get
  401 `No API key found in request`.
- **An anon key cannot enumerate table names.** PostgREST hides the schema from
  non-privileged roles. The secret key can, which is how the empty database
  here was confirmed rather than guessed.
- **`sb_secret_` keys are opaque, not JWTs.** There is no `exp` claim to decode,
  so no way to tell from the key itself when it stops working — it is valid
  until revoked in the dashboard. Do not expect a 10-year expiry like the anon
  JWT has.
- **A 200 with zero rows is not the same as a 401.** When a database is empty,
  every query "succeeds" with nothing back, which is easy to misread as a
  permissions problem. Check the OpenAPI `definitions` to tell them apart.

## Security

Three credentials live in `.env.local` (mode `600`, gitignored). **All four
were pasted into this chat conversation** and should be treated as exposed.

| Credential | Sensitivity | Action |
|---|---|---|
| `SUPABASE_SECRET_KEY` | 🔴🔴 **master password** — bypasses RLS on every table, user and bucket | **rotate as soon as you are done** |
| `GITHUB_TOKEN` | 🔴🔴 `admin:org`, `admin:enterprise`, `delete_repo` — near-unrestricted | **rotate and reissue with only `repo`** |
| `VERCEL_TOKEN` | 🔴 can deploy, delete, and read env vars | rotate; also expires **2026-09-30** |
| `SUPABASE_ANON_KEY` | 🟢 public by design | safe *only while RLS is on* |

**The secret key is the one that matters.** Unlike the Vercel token or the anon
key, it has no expiry and no scope limits — anyone holding it can silently read
or rewrite your entire database. Because it was pasted into chat:

1. Dashboard → Project Settings → API Keys → rotate the secret key
2. Paste the new value into `.env.local`
3. `npm run check:supabase-admin` to confirm

**RLS cannot be verified right now.** The database has **zero tables**, so there
is nothing for Row Level Security to protect yet. That is a latent risk rather
than a current one: the moment you create tables, any table left without RLS is
world-writable through the public anon key. Supabase does *not* enable RLS
automatically on new tables. The `rls_auto_enable` RPC function on this project
may exist for exactly that purpose — but it is unfamiliar, its signature is
opaque, and **it was not executed**. Read its definition in
Database → Functions before letting anything call it.

**Guard rails in place:** `npm run guard:secrets` scans every source file for
the literal `VERCEL_TOKEN` and `SUPABASE_SECRET_KEY` values, flags any
client-side file importing `supabase-admin`, and catches hardcoded
`sb_secret_` strings. It is wired to `predeploy`. `lib/supabase-admin.mjs`
additionally throws at runtime if instantiated in a browser context.

## Next step

The workspace has credentials but **no application code**, and the Supabase
database has **no tables**. Nothing has been deployed.

Give me any one of:

- **what to build** — I'll scaffold it against this project and deploy to Vercel
- **the schema you want** — I'll write the migrations, enable RLS on every
  table as they are created, and add typed helpers
- **a GitHub repo URL** — I'll set up push-to-deploy
- **an existing Vercel project name** — I'll wire the Supabase env vars into it
  (none of the three currently have any env vars set)

