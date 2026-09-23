// Opt-in visual regression tooling for the fullscreen intro.
// Not a project dependency: install ad-hoc with
//   npm i -D playwright && npx playwright install chromium
// then `node scripts/intro-audit.js [url]`.
const { chromium } = require('playwright');
// Slow-3G-ish: high latency + low throughput so the HTML genuinely streams.
const NET = { latency: 400, downloadThroughput: 50 * 1024 / 8, uploadThroughput: 50 * 1024 / 8, offline: false };
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { sessionStorage.clear(); } catch (e) {} });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', NET);

  await page.goto('http://127.0.0.1:3100/', { waitUntil: 'commit' });

  // Poll fast; screenshot the moment ANYTHING has painted, then again shortly after.
  for (const [label, ms] of [['a-earliest', 250], ['b-600ms', 350], ['c-1200ms', 600]]) {
    await page.waitForTimeout(ms);
    const state = await page.evaluate(() => ({
      overlay: !!document.querySelector('.intro-overlay'),
      navbar: !!document.querySelector('nav'),
      htmlBg: getComputedStyle(document.documentElement).backgroundColor,
      seen: document.documentElement.getAttribute('data-intro'),
    }));
    await page.screenshot({ path: `/tmp/slow-${label}.png` });
    console.log(`${label.padEnd(11)} overlay=${String(state.overlay).padEnd(5)} navbarInDom=${String(state.navbar).padEnd(5)} htmlBg=${state.htmlBg} data-intro=${state.seen}`);
  }
  await browser.close();
})();
