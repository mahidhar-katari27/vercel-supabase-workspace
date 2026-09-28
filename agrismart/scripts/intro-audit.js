// Opt-in visual regression tooling for the fullscreen intro.
// Not a project dependency: install ad-hoc with
//   npm i -D playwright && npx playwright install chromium
// then `node scripts/intro-audit.js [url]`.
const { chromium } = require('playwright');

const VIEWPORTS = [
  { name: 'desktop-16:9',   width: 1920, height: 1080 },
  { name: 'laptop-16:10',   width: 1440, height: 900 },
  { name: 'macbook',        width: 1512, height: 982 },
  { name: 'tablet-4:3',     width: 1024, height: 768 },
  { name: 'mobile-portrait', width: 390,  height: 844, mobile: true },
  { name: 'mobile-landscape', width: 844, height: 390, mobile: true },
];

const URL = process.argv[2] || 'http://127.0.0.1:3000/';

(async () => {
  const browser = await chromium.launch();
  const results = [];

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: !!vp.mobile,
      hasTouch: !!vp.mobile,
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();

    // Fresh session every time so the intro always plays.
    await page.addInitScript(() => { try { sessionStorage.clear(); } catch (e) {} });

    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));

    await page.goto(URL, { waitUntil: 'commit' });

    // ---- FIRST FRAME: is the overlay already covering, before any effect? ----
    const first = await page.evaluate(() => {
      const el = document.querySelector('.intro-overlay');
      if (!el) return { present: false };
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        present: true,
        rect: { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
        vw: window.innerWidth, vh: window.innerHeight,
        position: cs.position, zIndex: cs.zIndex, overflow: cs.overflow,
        display: cs.display, opacity: cs.opacity, bg: cs.backgroundColor,
        htmlSeen: document.documentElement.getAttribute('data-intro'),
      };
    });

    await page.screenshot({ path: `/tmp/shot-${vp.name}-1first.png` }).catch(() => {});

    // ---- MID INTRO (scene 3, the field) ----
    await page.waitForTimeout(3600);
    const mid = await page.evaluate(() => {
      const el = document.querySelector('.intro-overlay');
      if (!el) return { present: false };
      const r = el.getBoundingClientRect();
      const svg = el.querySelector('svg[preserveAspectRatio]');
      const sr = svg ? svg.getBoundingClientRect() : null;
      const skip = el.querySelector('.intro-skip');
      const skr = skip ? skip.getBoundingClientRect() : null;
      return {
        present: true,
        rect: { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
        svg: sr ? { x: +sr.x.toFixed(1), y: +sr.y.toFixed(1), w: +sr.width.toFixed(1), h: +sr.height.toFixed(1),
                    par: svg.getAttribute('preserveAspectRatio') } : null,
        skip: skr ? { right: +(window.innerWidth - skr.right).toFixed(1), bottom: +(window.innerHeight - skr.bottom).toFixed(1) } : null,
        scrollable: document.documentElement.scrollHeight > window.innerHeight + 1,
        bodyOverflow: getComputedStyle(document.body).overflow,
        bodyClass: document.body.className,
      };
    });

    await page.screenshot({ path: `/tmp/shot-${vp.name}-2mid.png` }).catch(() => {});

    // ---- LOGO SCENE ----
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `/tmp/shot-${vp.name}-3logo.png` });

    // ---- AFTER: overlay gone, scroll restored ----
    await page.waitForTimeout(1600);
    const after = await page.evaluate(() => ({
      overlayInDom: !!document.querySelector('.intro-overlay'),
      overlayDisplay: (() => { const e = document.querySelector('.intro-overlay'); return e ? getComputedStyle(e).display : 'removed'; })(),
      htmlSeen: document.documentElement.getAttribute('data-intro'),
      bodyOverflow: getComputedStyle(document.body).overflow,
      bodyHasIntroActive: document.body.classList.contains('intro-active'),
      scrollable: document.documentElement.scrollHeight > window.innerHeight + 1,
    }));
    await page.screenshot({ path: `/tmp/shot-${vp.name}-4after.png` });

    results.push({ vp: vp.name, size: `${vp.width}x${vp.height}`, first, mid, after, errors });
    await ctx.close();
  }

  await browser.close();

  // ---------------- report ----------------
  console.log('URL:', URL, '\n');
  for (const r of results) {
    const f = r.first, m = r.mid, a = r.after;
    const coverFirst = f.present && f.rect.w >= r.size.split('x')[0] - 0.5 && f.rect.x <= 0.5 && f.rect.y <= 0.5;
    const coverMid = m.present && Math.abs(m.rect.w - +r.size.split('x')[0]) < 1 && m.rect.x <= 0.5 && m.rect.y <= 0.5;
    console.log(`── ${r.vp.padEnd(19)} ${r.size}`);
    console.log(`   first frame : overlay present=${f.present} rect=${JSON.stringify(f.rect)} viewport=${f.vw}x${f.vh}`);
    console.log(`                 covers width=${coverFirst ? 'YES' : 'NO'}  pos=${f.position} z=${f.zIndex} bg=${f.bg} data-intro=${f.htmlSeen}`);
    console.log(`   mid (scene3): rect=${JSON.stringify(m.rect)} covers=${coverMid ? 'YES' : 'NO'}`);
    console.log(`                 svg=${JSON.stringify(m.svg)}`);
    console.log(`                 skip offset=${JSON.stringify(m.skip)}  scrollLocked=${m.bodyOverflow}  pageScrollable=${m.scrollable}`);
    console.log(`   after       : inDom=${a.overlayInDom} display=${a.overlayDisplay} data-intro=${a.htmlSeen} bodyOverflow=${a.bodyOverflow} introActive=${a.bodyHasIntroActive} scrollable=${a.scrollable}`);
    if (r.errors.length) console.log(`   JS ERRORS   : ${r.errors.join(' | ')}`);
    console.log('');
  }
})();
