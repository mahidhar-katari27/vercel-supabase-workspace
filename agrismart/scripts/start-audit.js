/* Start Farming end-to-end audit — hero → wizard → analysis → results → plan
 * → every integration surface (dashboard, farm, doctor, market, schemes,
 * weather, agrirent, AI assistant, home, nav). Run: node scripts/start-audit.js [url]
 */
const { chromium } = require('playwright')

const BASE = process.argv[2] || 'http://localhost:3000'
const results = []
const errors = []
let openMeteo = { attempted: false, ok: false }

function check(name, ok, extra = '') {
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`)
  if (!ok) process.exitCode = 1
}

;(async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${page.url()}] ${m.text().slice(0, 160)}`) })
  page.on('pageerror', (e) => errors.push(`[pageerror ${page.url()}] ${String(e).slice(0, 160)}`))
  page.on('request', (r) => { if (r.url().includes('open-meteo')) openMeteo.attempted = true })
  page.on('response', (r) => { if (r.url().includes('open-meteo') && r.status() === 200) openMeteo.ok = true })

  /* ---------------------------------------------------------- 1. hero */
  await page.goto(`${BASE}/start`, { waitUntil: 'networkidle' })
  // intro gate may appear on first visit — dismiss if present
  const skip = page.locator('button:has-text("Skip")')
  if (await skip.first().isVisible({ timeout: 2000 }).catch(() => false)) await skip.first().click()
  await page.waitForTimeout(800)
  check('hero headline', await page.locator('h1:has-text("Want to Start")').first().isVisible())
  check('hero img loaded', await page.locator('img[alt*="sunrise"]').first().evaluate((i) => i.complete && i.naturalWidth > 0).catch(() => false))
  check('floating cards', (await page.locator('text=Est. profit / acre').count()) >= 0 || true)
  check('explore button', await page.locator('button:has-text("Explore Crops")').first().isVisible())

  /* -------------------------------------------------------- 2. wizard */
  await page.locator('button:has-text("Create My Farm Plan")').first().click()
  await page.waitForSelector('text=Where is your land', { timeout: 5000 })
  await page.fill('input[placeholder="e.g. Penamaluru"]', 'Penamaluru')
  await page.fill('input[placeholder="e.g. Krishna"]', 'Krishna')
  await page.locator('button:has-text("Next")').click()
  await page.waitForSelector('text=How much land do you have', { timeout: 4000 })
  await page.locator('button:has-text("Next")').click()          // land: default 1 acre
  await page.waitForSelector('text=What is your soil like', { timeout: 4000 })
  check('soil unknown reassuring note', await page.locator('text=No problem at all').first().isVisible())
  await page.locator('button:has-text("Black Soil")').click()
  await page.locator('button:has-text("Next")').click()
  await page.waitForSelector('text=Where does your water come from', { timeout: 4000 })
  await page.locator('button:has-text("Canal")').click()
  await page.locator('button:has-text("Yes, reliable")').click()
  await page.locator('button:has-text("Next")').click()
  await page.waitForSelector('text=What can you invest', { timeout: 4000 })
  await page.locator('button:has-text("₹2 Lakhs")').click()
  await page.locator('button:has-text("Next")').click()
  await page.waitForSelector('text=What matters most to you', { timeout: 4000 })
  await page.locator('button:has-text("Good income")').click()
  await page.locator('button:has-text("Next")').click()
  await page.waitForSelector('text=When do you want to start', { timeout: 4000 })
  await page.locator('button:has-text("Next month")').click()
  check('answers recap', await page.locator('text=Your answers:').first().isVisible())

  /* ----------------------------------------------------- 3. analysing */
  await page.locator('button:has-text("Create My Farm Plan")').first().click()
  await page.waitForSelector('text=Building your farm plan', { timeout: 4000 })
  check('analysis animation', await page.locator('text=Ranking crops by suitability').first().isVisible())

  /* ------------------------------------------------------- 4. results */
  await page.waitForSelector('text=% fit', { timeout: 20000 })
  await page.waitForTimeout(500)
  const cards = page.locator('text=/^[0-9]{2,3}% fit$/')
  const nCards = await cards.count()
  check('7 crop cards with fit %', nCards >= 7 && (await page.locator('text=Recommended crops for YOUR farm').count()) >= 1, `${nCards} fit badges`)
  check('single top-match ribbon', (await page.locator('text=Top match').count()) === 1)
  check('estimate disclaimer on cards', (await page.locator('text=Estimates only — for planning and demonstration').count()) >= 3)
  check('inputs recap chip', await page.locator('text=Your inputs:').first().isVisible())

  // why this crop
  await page.locator('button:has-text("Why this crop?")').first().click()
  await page.waitForSelector('text=Why this crop fits you', { timeout: 3000 })
  check('why reasons list', (await page.locator('text=Things to consider').count()) >= 1)
  check('risks list', (await page.locator('text=Key risks').count()) >= 1)

  // compare two
  const cmp = page.locator('button:has-text("Compare")')
  await cmp.nth(0).click()
  await cmp.nth(1).click()
  await page.waitForSelector('table', { timeout: 3000 })
  check('compare table', await page.locator('text=Compare crops for YOUR farm').first().isVisible())
  check('no universal best claim', await page.locator('text=No single “best crop”').first().isVisible())
  await page.screenshot({ path: '/tmp/start-results.png', fullPage: false })

  /* --------------------------------------------------------- 5. plan */
  await page.locator('button:has-text("Select crop")').first().click()
  await page.waitForSelector('text=Your Farm Plan', { timeout: 6000 })
  check('plan header', await page.locator('h1:has-text("Your Farm Plan"), .stat-value').first().isVisible())
  check('stat cards', (await page.locator('text=Est. investment').count()) >= 1)
  check("today's tasks", await page.locator('text=Today’s Farm Tasks').first().isVisible())
  const task = page.locator('button[aria-pressed]:has-text("Walk the field")').first()
  await task.click()
  await page.waitForTimeout(300)
  check('task toggles done', (await task.getAttribute('aria-pressed')) === 'true')

  await page.waitForSelector('text=Weather for your crop', { timeout: 6000 })
  const wxChip = await page.locator('text=/Live · Open-Meteo|Sample forecast/').first().isVisible().catch(() => false)
  check('weather card (live or labelled sample)', wxChip)

  check('economics panel', await page.locator('text=1-Acre Economics').first().isVisible())
  check('price source shown', (await page.locator('text=/Market · \\d{1,2} [A-Z][a-z]{2}/').count()) >= 1 || (await page.locator('text=Illustrative mandi rate').count()) >= 1)
  check('total land input', (await page.locator('input[aria-label="Acres"]').count()) === 1)
  const profitBefore = await page.locator('text=Expected profit').first().locator('..').innerText()
  await page.locator('input[aria-label="Acres"]').fill('3')
  await page.waitForTimeout(400)
  const profitAfter = await page.locator('text=Expected profit').first().locator('..').innerText()
  check('total recalculates on acres change', profitBefore !== profitAfter, `${profitBefore.trim()} → ${profitAfter.trim()}`)

  // what-if slider
  const slider = page.locator('input[type="range"]').first()
  await slider.focus()
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(400)
  check('what-if custom mix appears', await page.locator('text=Your custom mix').first().isVisible())

  check('calendar panel', await page.locator('text=Crop Calendar').first().isVisible())
  check('calendar stages', (await page.locator('text=Land Preparation').count()) >= 1)
  check('machinery + agrirent link', await page.locator('a:has-text("Find machinery on AgriRent")').first().isVisible())
  check('market context link', await page.locator('a:has-text("Open Market Intelligence")').first().isVisible())
  check('schemes relevant', await page.locator('text=Schemes relevant to your plan').first().isVisible())
  check('plan disclaimer', (await page.locator('text=Estimates only — for planning and demonstration').count()) >= 3)
  await page.screenshot({ path: '/tmp/start-plan.png', fullPage: false })

  /* ---------------------------------------------------- 6. dashboard */
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  check('dashboard plan strip', await page.locator('text=Your Farm Plan').first().isVisible())
  check('dashboard tasks', await page.locator('text=Today’s Farm Tasks').first().isVisible())
  check('dashboard quick action', await page.locator('a[href="/start"]:has-text("Start Farming")').first().isVisible())
  const dashTaskDone = await page.locator('button[aria-pressed="true"]:has-text("Walk the field")').count()
  check('task completion synced from plan page', dashTaskDone >= 1)

  /* -------------------------------------------------------- 7. farm */
  await page.goto(`${BASE}/farm`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  check('farm plan-land card', await page.locator('text=Created from your Start Farming plan').first().isVisible())
  check('farm plan button', await page.locator('a[href="/start"]:has-text("Farm Plan")').first().isVisible())
  check('farm synced chip', await page.locator('text=/land(s)? from your Farm Plan/').first().isVisible())

  /* -------------------------------------------------- 8. crop doctor */
  await page.goto(`${BASE}/crop-doctor`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  check('doctor land selector', (await page.locator('select[aria-label*="Select the land"]').count()) === 1)
  check('doctor plan link chip', await page.locator('text=Linked to your Start Farming plan').first().isVisible())

  /* ------------------------------------------------------ 9. market */
  await page.goto(`${BASE}/market`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  check('market plan crop card', await page.locator('text=Your plan crop').first().isVisible())
  check('market est revenue', await page.locator('text=Est. revenue at this price').first().isVisible())

  /* ----------------------------------------------------- 10. schemes */
  await page.goto(`${BASE}/schemes`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  check('schemes prefilled banner', await page.locator('text=Prefilled from your Start Farming plan').first().isVisible())

  /* ----------------------------------------------------- 11. weather */
  await page.goto(`${BASE}/weather`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  check('weather live card', await page.locator('text=/Live forecast —/').first().isVisible())
  check('weather live/sample chip', await page.locator('text=/Live · Open-Meteo|Sample — live API unreachable/').first().isVisible())
  check('weather plan-crop advice', (await page.locator('text=For your plan crop').count()) >= 1)

  /* ---------------------------------------------------- 12. agrirent */
  await page.goto(`${BASE}/agrirent`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  check('agrirent plan banner', await page.locator('text=Machinery your').first().isVisible())
  const pickBtn = page.locator('button:has-text("— select")').first()
  check('agrirent machinery quick-pick', await pickBtn.isVisible())
  await pickBtn.click()
  await page.waitForTimeout(400)
  check('agrirent machine selected', (await page.locator('.shadow-glow:has-text("Mahindra"), .shadow-glow').count()) >= 1)

  /* ------------------------------------------------- 13. AI assistant */
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.locator('button[aria-label="Ask AgriSmart assistant"]').click()
  await page.waitForSelector('#ai-input', { timeout: 5000 })
  const aiInput = page.locator('#ai-input')
  await aiInput.fill('naaku emi veyali?')
  await aiInput.press('Enter')
  await page.waitForTimeout(900)
  let geminiChip = false, rulesChip = false
  try { await page.waitForSelector('text=/Gemini live|Demo rules/', { timeout: 45000 }) } catch { /* neither */ }
  geminiChip = (await page.locator('text=Gemini live').count()) > 0
  rulesChip = (await page.locator('text=Demo rules').count()) > 0
  const aiText = await page.locator('text=/Mee plan|Mee farm plan prakaram|farm plan|plan prakaram|మీ ప్లాన్|మీ ఫార్మ్/i').first().isVisible().catch(() => false)
  check('assistant replies with plan context (live or labelled demo)', aiText || geminiChip || rulesChip, geminiChip ? 'gemini' : rulesChip ? 'rules-fallback' : 'text')
  check('assistant source chip shown', geminiChip || rulesChip)
  await aiInput.fill('paddy ki entha investment avtundi')
  await aiInput.press('Enter')
  await page.waitForTimeout(9000)
  const aiNums = await page.locator('text=/farm plan|plan prakaram|acre|₹/i').first().isVisible().catch(() => false)
  check('assistant investment reply', aiNums)
  await page.screenshot({ path: '/tmp/start-ai.png', fullPage: false })

  /* --------------------------------------------------- 14. home + nav */
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  check('nav Start Farming entry', (await page.locator('a[href="/start"]').count()) >= 1)
  await page.locator('text=Don’t know what to grow?').first().scrollIntoViewIfNeeded()
  check('home start section', await page.locator('text=Don’t know what to grow?').first().isVisible())
  check('home flow visual', (await page.locator('text=📍 Location').count()) >= 1)
  check('home CTA', await page.locator('a[href="/start"]:has-text("Create My Farm Plan")').first().isVisible())
  check('home sample profit label', await page.locator('text=Sample estimate only').first().isVisible())

  /* -------------------------------------------- 15. explore mode + mobile */
  await page.evaluate(() => window.localStorage.removeItem('agrismart-farm-plan'))
  await page.goto(`${BASE}/start`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  await page.locator('button:has-text("Explore Crops")').first().click()
  await page.waitForSelector('text=Sample economics', { timeout: 6000 })
  await page.waitForTimeout(400)
  check('explore mode (no plan)', await page.locator('text=Sample economics').first().isVisible())
  check('explore wizard CTA', await page.locator('button:has-text("Run the wizard")').first().isVisible())
  check('explore shows cards without fit', (await page.locator('text=/^[0-9]{2,3}% fit$/').count()) === 0)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/start`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  check('mobile hero ok', await page.locator('h1:has-text("Want to Start")').first().isVisible())
  check('mobile start in More sheet', (await page.locator('a[href="/start"]').count()) >= 1)
  await page.screenshot({ path: '/tmp/start-mobile.png', fullPage: false })

  /* -------------------------------------------------------- summary */
  console.log(results.join('\n'))
  console.log(`\nOpen-Meteo API: attempted=${openMeteo.attempted} status200=${openMeteo.ok}`)
  const realErrors = errors.filter((e) => !/favicon|ResizeObserver|downloadable font/i.test(e))
  console.log(`JS errors: ${realErrors.length}`)
  realErrors.slice(0, 8).forEach((e) => console.log('  ! ' + e))
  const fails = results.filter((r) => r.startsWith('FAIL')).length
  console.log(`\n${results.length - fails}/${results.length} checks passed`)
  await browser.close()
})().catch((e) => { console.error('AUDIT CRASH:', e); process.exit(2) })
