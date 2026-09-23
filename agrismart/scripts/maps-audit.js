// Opt-in visual regression tooling for the Google Maps integration.
// Not a project dependency: install ad-hoc with
//   npm i --no-save playwright && npx playwright install chromium
// then `node scripts/maps-audit.js [url]`.
const { chromium } = require('playwright');

const URL = process.argv[2] || 'http://127.0.0.1:3000';

(async () => {
  const browser = await chromium.launch();
  const errors = [];

  async function newPage(vp) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    // skip the cinematic intro so audits land straight on the page
    await page.addInitScript(() => { try { sessionStorage.setItem('agrismart-intro-seen', '1'); } catch (e) {} });
    page.on('pageerror', (e) => errors.push(`${page.url()} :: ${String(e).slice(0, 140)}`));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console ${page.url()} :: ${m.text().slice(0, 140)}`); });
    return { ctx, page };
  }

  /* ---------------------------------------------------- desktop Smart Map */
  {
    const { ctx, page } = await newPage({ width: 1440, height: 900 });
    await page.goto(`${URL}/map`, { waitUntil: 'load' });
    await page.waitForTimeout(1800);
    const badge = await page.locator('text=DEMO MAP').count();
    const filters = await page.locator('aside button:has-text("Farm Markets")').count();
    await page.screenshot({ path: '/tmp/maps-desktop-1.png' });

    // select a category-only view
    await page.click('aside button:has-text("Agri Machinery")').catch(() => {});
    // pick first result row
    await page.locator('aside .space-y-2 > button').first().click().catch(() => {});
    await page.waitForTimeout(900);
    const card = await page.locator('text=Get Directions').count();
    await page.locator('button:has-text("Get Directions")').first().click().catch(() => {});
    await page.waitForTimeout(1200);
    const route = await page.locator('text=Open route in Google Maps').count();
    await page.screenshot({ path: '/tmp/maps-desktop-2.png' });
    console.log(`desktop /map      badge=${badge} filters=${filters} infoCard=${card} directionsPanel=${route}`);

    // deep link with route
    await page.goto(`${URL}/map?focus=g-mc1&route=1`, { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const deep = await page.locator('text=Krishna Agro Services').count();
    const deepRoute = await page.locator('text=Est. time').count();
    console.log(`deep link         place=${deep} routePanel=${deepRoute}`);
    await page.screenshot({ path: '/tmp/maps-desktop-3.png' });
    await ctx.close();
  }

  /* ----------------------------------------------------- mobile Smart Map */
  {
    const { ctx, page } = await newPage({ width: 390, height: 844 });
    await page.goto(`${URL}/map`, { waitUntil: 'load' });
    await page.waitForTimeout(1600);
    await page.screenshot({ path: '/tmp/maps-mobile-1.png' });
    await page.click('button:has-text("Filters (")').catch(() => {});
    await page.waitForTimeout(700);
    const sheet = await page.locator('button', { hasText: /Show \d+ places/ }).count();
    await page.screenshot({ path: '/tmp/maps-mobile-2.png' });
    await page.locator('button', { hasText: /Show \d+ places/ }).click().catch(() => {});
    await page.waitForTimeout(400);
    // open a result card sheet
    await page.locator('div.no-scrollbar.mt-4 button, .no-scrollbar.-mx-1.mt-4 button').first().click().catch(() => {});
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/maps-mobile-3.png' });
    console.log(`mobile /map       filterSheet=${sheet}`);
    await ctx.close();
  }

  /* ------------------------------------------------- farm location picker */
  {
    const { ctx, page } = await newPage({ width: 1440, height: 900 });
    await page.goto(`${URL}/farm`, { waitUntil: 'load' });
    await page.waitForTimeout(1400);
    await page.click('button:has-text("Select Farm Location")');
    await page.waitForTimeout(900);
    await page.screenshot({ path: '/tmp/maps-farm-picker.png' });
    // tap the map to drop a pin
    const canvas = page.locator('[role="application"]').first();
    const box = await canvas.boundingBox();
    if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(700);
    const pinned = await page.locator('text=Pinned').count();
    await page.click('button:has-text("Confirm location")').catch(() => {});
    await page.waitForTimeout(900);
    const savedChip = await page.locator('span:has-text("Pinned")').count();
    await page.screenshot({ path: '/tmp/maps-farm-saved.png' });
    console.log(`farm picker       pinnedInModal=${pinned} savedChip=${savedChip}`);
    await ctx.close();
  }

  /* ------------------------------------------- agrirent + marketplace geo */
  {
    const { ctx, page } = await newPage({ width: 1440, height: 900 });
    await page.goto(`${URL}/agrirent`, { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const viewMap = await page.locator('a:has-text("View on Map")').count();
    const dirs = await page.locator('a:has-text("Get Directions")').count();
    console.log(`agrirent          viewOnMap=${viewMap} directions=${dirs}`);
    await page.screenshot({ path: '/tmp/maps-agrirent.png' });

    await page.goto(`${URL}/marketplace`, { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const seller = await page.locator('text=Seller location').count();
    console.log(`marketplace       sellerLocationBlocks=${seller}`);
    await ctx.close();
  }

  /* ------------------------------------------------- a few other surfaces */
  for (const r of ['/dashboard', '/market', '/schemes', '/dairy', '/aqua']) {
    const { ctx, page } = await newPage({ width: 1280, height: 800 });
    await page.goto(`${URL}${r}`, { waitUntil: 'load' });
    await page.waitForTimeout(1100);
    const nearby = await page.locator('text=Find Nearby, text=near you').count().catch(() => 0);
    const cards = await page.locator('a:has-text("View on Map")').count();
    console.log(`${r.padEnd(12)} nearbyCards=${cards}`);
    await ctx.close();
  }

  await browser.close();
  const real = errors.filter((e) => !/favicon|Download the React DevTools|net::ERR_BLOCKED_BY_CLIENT/i.test(e));
  console.log(real.length ? `JS ERRORS:\n${real.slice(0, 8).join('\n')}` : 'no JS errors');
})();
