// Opt-in visual regression tooling for the fullscreen intro.
// Not a project dependency: install ad-hoc with
//   npm i -D playwright && npx playwright install chromium
// then `node scripts/intro-audit.js [url]`.
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { sessionStorage.clear(); } catch (e) {}
    window.__t = { overlay: null, firstEl: null };
    const watch = () => {
      const root = document.documentElement || document;
      try {
        new MutationObserver((muts) => {
          for (const m of muts) for (const n of m.addedNodes) {
            if (n.nodeType !== 1) continue;
            if (window.__t.firstEl === null) window.__t.firstEl = performance.now();
            if (n.classList && n.classList.contains('intro-overlay') && window.__t.overlay === null)
              window.__t.overlay = performance.now();
          }
        }).observe(root, { childList: true, subtree: true });
      } catch (e) {}
    };
    if (document.documentElement) watch();
    else document.addEventListener('readystatechange', watch, { once: true });
  });
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'load' });
  await page.waitForTimeout(600);
  const t = await page.evaluate(() => {
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    return { ...window.__t, fcp: fcp ? fcp.startTime : null };
  });
  console.log('ms since navigation start:');
  console.log('  first element parsed     :', t.firstEl && t.firstEl.toFixed(1));
  console.log('  first contentful paint   :', t.fcp && t.fcp.toFixed(1));
  console.log('  .intro-overlay in DOM    :', t.overlay && t.overlay.toFixed(1));
  console.log();
  if (t.overlay == null) console.log('  overlay never seen (sessionStorage said "seen"? or wrong class)');
  else if (t.fcp != null && t.overlay > t.fcp) {
    console.log(`  => overlay landed ${(t.overlay - t.fcp).toFixed(1)}ms AFTER first contentful paint.`);
    console.log('     The website can paint before the intro. THIS is the flash to fix.');
  } else if (t.fcp != null) {
    console.log(`  => overlay in DOM ${(t.fcp - t.overlay).toFixed(1)}ms before first paint. No website flash.`);
  }
  await browser.close();
})();
