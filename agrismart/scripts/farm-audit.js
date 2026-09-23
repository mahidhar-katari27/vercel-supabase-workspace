// Opt-in visual check for the My Lands photo cards.
//   npm i --no-save playwright && npx playwright install chromium
//   node scripts/farm-audit.js [url]
const { chromium } = require('playwright');
const URL = process.argv[2] || 'http://127.0.0.1:3000';
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const mk = async (vp) => {
    const ctx = await browser.newContext({ viewport: vp });
    const p = await ctx.newPage();
    await p.addInitScript(() => sessionStorage.setItem('agrismart-intro-seen', '1'));
    p.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
    return { ctx, p };
  };
  {
    const { ctx, p } = await mk({ width: 1440, height: 900 });
    await p.goto(`${URL}/farm`, { waitUntil: 'load' });
    await p.waitForTimeout(1800);
    const imgs = await p.evaluate(() => [...document.querySelectorAll('img')].map(i => ({ ok: i.complete && i.naturalWidth > 0, src: i.getAttribute('src') })).filter(x => x.src?.includes('/crops/')));
    console.log('crop images loaded:', imgs.filter(i => i.ok).length, '/', imgs.length);
    await p.screenshot({ path: '/tmp/farm-grid.png', fullPage: false });
    // hover first card
    await p.hover('article >> nth=0');
    await p.waitForTimeout(700);
    await p.screenshot({ path: '/tmp/farm-hover.png' });
    // dashboard
    await p.click('article >> nth=0 >> text=View Land');
    await p.waitForTimeout(900);
    await p.screenshot({ path: '/tmp/farm-dashboard.png' });
    await p.keyboard.press('Escape');
    await p.waitForTimeout(500);
    // add land
    await p.click('button:has-text("+ Add New Land")');
    await p.waitForTimeout(800);
    await p.screenshot({ path: '/tmp/farm-add.png' });
    await ctx.close();
  }
  {
    const { ctx, p } = await mk({ width: 390, height: 844 });
    await p.goto(`${URL}/farm`, { waitUntil: 'load' });
    await p.waitForTimeout(1500);
    await p.screenshot({ path: '/tmp/farm-mobile.png' });
    await ctx.close();
  }
  await browser.close();
  console.log(errors.length ? `JS ERRORS: ${errors.slice(0,5).join(' | ')}` : 'no JS errors');
})();
