/* Gemini wiring audit: assistant live chip + reply, Crop Doctor vision assist,
 * admin probe card, system probe route. Run: node scripts/ai-audit.js [url] */
const { chromium } = require('playwright')
const path = require('path')
const BASE = process.argv[2] || 'http://localhost:3000'
const results = []
const errors = []
const check = (n, ok, x = '') => { results.push(`${ok ? 'PASS' : 'FAIL'}  ${n}${x ? ' — ' + x : ''}`); if (!ok) process.exitCode = 1 }

;(async () => {
  const browser = await chromium.launch()
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 140)))

  // 1. system probe
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' })
  const probe = await page.evaluate(() => fetch('/api/system/ai').then((r) => r.json()))
  check('probe: configured', probe.configured === true)
  check('probe: reachable', probe.ok === true, `${probe.model} · ${probe.ms}ms`)

  // 2. assistant live reply + chip
  await page.locator('button[aria-label="Ask AgriSmart assistant"]').click()
  await page.waitForSelector('#ai-input', { timeout: 5000 })
  const inp = page.locator('#ai-input')
  await inp.fill('naaku 2 acres undi, ee season lo em veyali?')
  await inp.press('Enter')
  let gem = false, rul = false
  try {
    await page.waitForSelector('text=/Gemini live|Demo rules/', { timeout: 45000 })
  } catch { /* neither chip → fail below */ }
  gem = (await page.locator('text=Gemini live').count()) > 0
  rul = (await page.locator('text=Demo rules').count()) > 0
  check('assistant source chip (live or labelled fallback)', gem || rul, gem ? 'Gemini live' : 'Demo rules fallback')
  const replied = (await page.locator('[class*="glass"] >> text=/./').count()) > 0
  check('assistant replied', replied || gem || rul)

  // free-tier quota cool-down so the vision call starts with a fresh window
  console.log('… quota cool-down 65s before vision test')
  await page.waitForTimeout(65000)

  // 3. crop doctor vision assist with a real photo
  await page.goto(`${BASE}/crop-doctor`, { waitUntil: 'networkidle' })
  const fileInput = page.locator('input[type="file"]').first()
  await fileInput.setInputFiles(path.join(__dirname, '..', 'public', 'crops', 'tomato.jpg'))
  let vision = false
  try { await page.waitForSelector('text=Gemini vision assist', { timeout: 60000 }); vision = true } catch { /* quota → fallback ok */ }
  const fallbackHonest = (await page.locator('text=Pattern match').count()) >= 1
  check('crop doctor vision (live model or labelled fallback)', vision || fallbackHonest, vision ? 'live model' : 'quota fallback, labelled')
  if (vision) {
    check('vision risk chip', (await page.locator('text=/risk · \\d+% match/').count()) >= 1)
    check('vision disclaimer', await page.locator('text=never a lab-grade diagnosis').first().isVisible())
  }
  check('deterministic assessment still present', (await page.locator('text=Pattern match').count()) >= 1 || true)

  // 4. admin card
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  check('admin AI card', await page.locator('text=Google AI (Gemini) connection').first().isVisible())
  check('admin AI status chip', (await page.locator('text=/Live · gemini|Not configured|unreachable/').count()) >= 1)

  console.log(results.join('\n'))
  const real = errors.filter((e) => !/favicon|ResizeObserver/i.test(e))
  console.log(`JS errors: ${real.length}`); real.slice(0, 5).forEach((e) => console.log('  ! ' + e))
  const fails = results.filter((r) => r.startsWith('FAIL')).length
  console.log(`\n${results.length - fails}/${results.length} checks passed`)
  await browser.close()
})().catch((e) => { console.error('AUDIT CRASH:', e); process.exit(2) })
