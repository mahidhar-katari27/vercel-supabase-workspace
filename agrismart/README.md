# AgriSmart 2.0

An all-in-one farming platform for Indian farmers — land and crop management, AI-assisted
crop health checks, weather, market prices, government schemes, equipment rental, livestock
dashboards, finance, community and an AI assistant that speaks English, Telugu and Tenglish.

**Live:** <https://agrismart-two-neon.vercel.app>

Built as a hackathon prototype: every screen is designed and every flow is walkable, and the
whole thing runs offline with no external API to fail mid-demo.

---

## Stack

| Layer      | Choice                                              |
| ---------- | --------------------------------------------------- |
| Framework  | Next.js 15 (App Router, static prerender)           |
| UI         | React 19, Tailwind CSS 3, Framer Motion 13          |
| Charts     | Hand-written animated SVG — no charting dependency  |
| Imagery    | Procedural inline SVG / data URIs — no image assets |
| Language   | TypeScript (strict)                                 |
| Deploy     | Vercel                                              |

No database, no auth provider and no third-party runtime API. All content comes from
`lib/data.ts` and is generated in the browser.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

## Routes

| Route              | What it is                                                        |
| ------------------ | ----------------------------------------------------------------- |
| `/`                | Landing — hero, features, demo journey, sitemap                   |
| `/dashboard`       | Farmer dashboard with animated counters, weather, alerts, finance |
| `/farm`            | Land profiles, growth stages, schematic map, add-new-land form    |
| `/crop-doctor`     | AI crop health check — upload or pick a sample leaf               |
| `/planner`         | Crop planner — ranks crops against soil, water, season, budget    |
| `/weather`         | Forecast, farm alerts, and what they mean for field operations    |
| `/market`          | Prices across market yards, MSP comparison, 12-week history       |
| `/marketplace`     | Ten categories, product cards, three-step sell flow               |
| `/agrirent`        | Equipment rental — six-step booking with itemised quote           |
| `/vehicles`        | Buy (with EMI calculator), rent, or hire an operator              |
| `/schemes`         | Eligibility checker and application tracking                      |
| `/aqua`            | Ponds, days of culture, survival, FCR, cost split                 |
| `/poultry`         | Layer economics down to cost per egg                              |
| `/dairy`           | Herd yield, cost per litre, margin per animal                     |
| `/finance`         | Investment, revenue, estimated profit, profit per acre            |
| `/community`       | Groups, posts, likes, comments, expert answers                    |
| `/experts`         | Book a consultation by call, video or farm visit                  |
| `/learn`           | Eight guides with real agronomy content                           |
| `/bookings`        | Every booking, filterable by status                               |
| `/map`             | Markets, machinery, vets, offices, buyers and storage nearby      |
| `/notifications`   | Notification center with filters and alert feed                   |
| `/admin`           | Platform stats, moderation queue, data-quality view               |
| `/profile`         | Account details, appearance, notification preferences             |
| `/auth`            | Role selection (Farmer / Buyer / Expert / Provider / Admin)       |
| `/demo`            | **Guided ten-step pitch walkthrough with speaker notes**          |

Start at **`/demo`** — it is the presenter script for the whole product.

## Architecture notes

```
app/
  layout.tsx            root: metadata, ThemeProvider, IntroGate
  (app)/
    layout.tsx          shell: Navbar, AIAssistant, footer, ambient washes
    page.tsx            landing
    <route>/page.tsx    one folder per screen
components/
  ui.tsx                Reveal, Card, Chip, DemoTag, Counter, Progress,
                        PageHeader, Avatar, Modal, Tabs, Stepper, Delta
  charts.tsx            LineChart, BarChart, Donut, Sparkline, Gauge
  CinematicIntro.tsx    five-scene opening animation
  IntroGate.tsx         runs the intro once per session, skippable
  MiniMap.tsx           dependency-free schematic map
  AIAssistant.tsx       floating assistant with voice input
lib/
  data.ts               every type and all demo content
  ai.ts                 rule-based assistant replies and crop analysis
  samples.ts            procedural leaf images as data URIs
  nav.ts                navigation model
  utils.ts              cn, inr, pct, num, timeAgo, seeded
```

**The intro never slows down a returning user.** `IntroGate` writes
`agrismart-intro-seen` to `sessionStorage` and skips straight to the app on
later loads. Dispatch `agrismart:replay-intro` (or use the button on `/demo`)
to see it again.

**Everything is static.** All 25 routes prerender at build time; first-load JS
is ~173 kB shared. Charts and maps are SVG drawn from data, so there is no
network dependency and nothing to time out during a pitch.

## Honesty constraints

These are deliberate product decisions, not limitations discovered late:

- Estimates are labelled **estimates** — crop planner and finance never promise profit.
- Crop Doctor states it is **assistance only**, always shows a confidence figure, and
  routes to a human expert. It is rule-based, not a trained model.
- Demo data carries a visible **`DEMO`** tag (`<DemoTag />`) wherever it appears.
- Market prices state plainly that **no live mandi feed is connected**.
- Bookings, sign-in and consultations confirm on screen that **nothing was charged,
  reserved or sent**.
- `/admin` publishes a **"What this prototype is not"** list rather than hiding the gaps.

## Tailwind gotcha

Opacity modifiers must be multiples of 5 (`/5`, `/10`, `/15`, …). Anything else —
`bg-leaf-400/12` — throws inside `@apply` and, worse, **silently generates no CSS**
in a class string. Scan for it before shipping:

```bash
grep -rEn '(bg|text|border|from|via|to|ring|fill|stroke)-[a-z0-9-]+/([0-9]{1,3})' app components \
  | grep -vE '/(0|5|10|15|20|25|30|35|40|45|50|55|60|65|70|75|80|85|90|95|100)\b'
```
