// Opt-in visual regression tooling for the fullscreen intro.
// Not a project dependency: install ad-hoc with
//   npm i -D playwright && npx playwright install chromium
// then `node scripts/flash-check.js [url]`.
//
// Answers the real question the spec cares about: "is the website EVER visible
// before or during the intro?" It samples document.elementFromPoint() over a
// grid of points at many moments in time and reports how many points expose
// anything that is NOT inside .intro-overlay. 0% exposure = intro owns the screen.
const { chromium } = require('playwright');

const SLOW = { latency: 400, downloadThroughput: 50 * 1024 / 8, uploadThroughput: 50 * 1024 / 8, offline: false };
const URL = process.argv[2] || 'http://127.0.0.1:3000/';
const SAMPLES = [80, 120, 200, 300, 450, 600, 900, 1200, 1800, 2500, 3200, 4000, 4800, 5600, 6400, 7200];

const probe = () => {
  const ov = document.querySelector('.intro-overlay');
  const w = innerWidth, h = innerHeight;
  let covered = 0, exposed = 0, none = 0, blank = 0;
  const offenders = [];
  for (let gx = 0; gx <= 10; gx++) {
    for (let gy = 0; gy <= 10; gy++) {
      const x = Math.round((gx / 10) * (w - 1));
      const y = Math.round((gy / 10) * (h - 1));
      const el = document.elementFromPoint(x, y);
      if (!el) { none++; continue; }
      if (ov && (el === ov || ov.contains(el))) covered++;
      else {
        exposed++;
        // A bare <html>/<body> with nothing in it yet is a blank document, not
        // the website. Track it separately - its background colour is what the
        // user would actually see in that window.
        const bare = el === document.documentElement || (el === document.body && !document.body.firstElementChild);
        if (bare) blank++;
        else if (offenders.length < 3) offenders.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`);
      }
    }
  }
  const total = covered + exposed + none;
  const r = ov ? ov.getBoundingClientRect() : null;
  return {
    overlay: !!ov,
    exposurePct: +((exposed / total) * 100).toFixed(1),
    siteExposurePct: +(((exposed - blank) / total) * 100).toFixed(1),
    offenders,
    coversViewport: !!r && r.x <= 0 && r.y <= 0 && r.width >= w && r.height >= h,
    dataIntro: document.documentElement.getAttribute('data-intro'),
    htmlBg: getComputedStyle(document.documentElement).backgroundColor,
    bodyOverflow: getComputedStyle(document.body).overflow,
    scrollY: Math.round(scrollY),
    scrollable: document.documentElement.scrollHeight > innerHeight + 1 && getComputedStyle(document.body).overflowY !== 'hidden',
  };
};

async function run(label, throttle) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => { try { sessionStorage.clear(); localStorage.clear(); } catch (e) {} });
  if (throttle) {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', SLOW);
  }
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));

  let prev = 0;
  const rows = [];
  await page.goto(URL, { waitUntil: 'commit' });
  for (const t of SAMPLES) {
    await page.waitForTimeout(t - prev);
    prev = t;
    let s;
    try { s = await page.evaluate(probe); } catch { s = null; }
    rows.push([t, s]);
  }
  await browser.close();

  console.log(`\n=== ${label} (${throttle ? 'throttled 400ms/50kbps' : 'unthrottled'}) ===`);
  console.log('  t(ms)  overlay  exposure%  coversViewport  data-intro  scrollY  scrollable  offenders');
  let worst = 0;
  let bgSeen = new Set();
  for (const [t, s] of rows) {
    if (!s) { console.log(`  ${String(t).padEnd(6)} (not parsed yet)`); continue; }
    // Intro is still owed the screen until it marks itself seen.
    const introOwesScreen = s.dataIntro !== 'seen';
    if (introOwesScreen) { worst = Math.max(worst, s.siteExposurePct); bgSeen.add(s.htmlBg); }
    console.log(
      `  ${String(t).padEnd(6)} ${String(s.overlay).padEnd(8)} site=${String(s.siteExposurePct).padStart(5)}% blank=${String(s.exposurePct).padStart(5)}%  ` +
      `covers=${String(s.coversViewport).padEnd(6)} ${String(s.dataIntro).padEnd(8)} bg=${s.htmlBg.padEnd(22)} ` +
      `scrollY=${s.scrollY} ${introOwesScreen ? '' : '(intro finished - exposure expected) '}${s.offenders.join(', ')}`
    );
  }
  console.log(`  -> max WEBSITE exposure while intro should own the screen: ${worst}%   html backgrounds seen: ${[...bgSeen].join(' | ')}`);
  if (errs.length) console.log('  JS ERRORS:', errs);
  return worst;
}

(async () => {
  const a = await run('UNTHROTTLED', false);
  const b = await run('SLOW-3G', true);
  console.log(`\nVERDICT: website exposure peaked at ${Math.max(a, b)}% -> ${Math.max(a, b) === 0 ? 'PASS: intro is the only thing ever visible' : 'FAIL: website showed through'}`);
})();
