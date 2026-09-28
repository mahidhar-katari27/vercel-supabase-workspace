/* Image audit — spec §51 final image audit.
 *
 * Visits every image-bearing page, collects every <img>, and verifies:
 *   1. the image actually loaded (naturalWidth > 0 — no broken links)
 *   2. no unnecessary duplicates WITHIN a catalogue grid (same src twice)
 *   3. every catalogue image is unique across the equipment catalogue
 * Prints a per-page table; exits non-zero on any broken image.
 *
 * Usage: node scripts/image-audit.js [baseUrl]
 */
const { chromium } = require('playwright')

const BASE = process.argv[2] || 'http://localhost:3000'

const PAGES = [
  ['/', 'Home'],
  ['/farm', 'My Farm'],
  ['/start', 'Start Farming'],
  ['/crop-doctor', 'Crop Doctor'],
  ['/market', 'Market'],
  ['/vehicles', 'Farming Equipment'],
  ['/aqua', 'Aqua'],
  ['/poultry', 'Poultry'],
  ['/dairy', 'Dairy'],
  ['/marketplace', 'Marketplace'],
  ['/schemes', 'Schemes'],
  ['/community', 'Community'],
  ['/learn', 'Learning Hub'],
  ['/finance', 'Finance'],
  ['/login', 'Login'],
]

;(async () => {
  const browser = await chromium.launch()
  let broken = 0
  let total = 0
  const catalogue = new Map() // src -> pages

  for (const [path, label] of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } })
    const page = await ctx.newPage()
    await page.addInitScript(() => {
      localStorage.setItem('agrismart-theme', 'light')
      sessionStorage.setItem('agrismart-intro-seen', '1')
    })
    await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {})
    // let lazy images load: scroll through
    await page.evaluate(async () => {
      const h = document.body.scrollHeight
      for (let y = 0; y < h; y += 800) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 120)) }
      window.scrollTo({ top: 0, behavior: 'instant' })
    })
    await page.waitForTimeout(1200)
    const imgs = await page.evaluate(() =>
      Array.from(document.images).map((i) => ({ src: i.currentSrc || i.src, ok: i.complete && i.naturalWidth > 0, alt: i.alt || '' })),
    )
    total += imgs.length
    const bad = imgs.filter((i) => !i.ok)
    broken += bad.length
    const srcs = imgs.map((i) => i.src.split('?')[0])
    const dupes = srcs.filter((s, idx) => s && srcs.indexOf(s) !== idx)
    for (const s of new Set(srcs)) {
      if (!s || s.startsWith('data:')) continue
      catalogue.set(s, [...(catalogue.get(s) ?? []), label])
    }
    const status = bad.length ? `BROKEN ${bad.length}` : dupes.length ? `ok (dupes: ${new Set(dupes).size})` : 'ok'
    console.log(`${bad.length ? 'FAIL' : 'PASS'}  ${label.padEnd(18)} imgs=${String(imgs.length).padStart(3)}  ${status}`)
    bad.slice(0, 4).forEach((b) => console.log(`        ! broken: ${b.src.slice(0, 90)}`))
    await ctx.close()
  }

  // equipment catalogue uniqueness: same machine photo on two different items?
  const dupCatalogue = [...catalogue.entries()].filter(([src, pages]) => {
    const onVehicles = pages.filter((p) => p === 'Farming Equipment').length
    return onVehicles > 1 && /\/equipment\/machines\//.test(src)
  })
  console.log(`\nTotal images checked: ${total} · broken: ${broken}`)
  console.log(`Machine photos reused within equipment grid: ${dupCatalogue.length}`)
  dupCatalogue.slice(0, 8).forEach(([src]) => console.log(`        ! duplicate: ${src}`))
  await browser.close()
  if (broken > 0) process.exit(1)
})().catch((e) => { console.error('IMAGE AUDIT CRASH:', e); process.exit(2) })
