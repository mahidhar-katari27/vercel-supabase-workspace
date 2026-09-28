/* Render the AgriSmart intro deterministically: 180 PNG frames → H.264 MP4 */
const { chromium } = require('playwright')
const fs = require('fs'), path = require('path')
const FF = require('ffmpeg-static')
const { execSync } = require('child_process')

const OUT = process.argv[2] || '/home/user/intro/agrismart-logo-intro.mp4'
const FR = '/tmp/frames'

;(async () => {
  fs.rmSync(FR, { recursive: true, force: true })
  fs.mkdirSync(FR, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  page.on('pageerror', (e) => { console.error('PAGE ERROR:', e); process.exit(1) })
  page.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE:', m.text()) })
  await page.goto('file:///home/user/intro/agrismart-intro.html')
  await page.evaluate(() => document.fonts.ready)
  const N = 180
  const t0 = Date.now()
  for (let i = 0; i < N; i++) {
    const d = await page.evaluate((i) => { renderFrame(i); return cv.toDataURL('image/png') }, i)
    fs.writeFileSync(path.join(FR, String(i).padStart(4, '0') + '.png'), Buffer.from(d.split(',')[1], 'base64'))
    if (i % 45 === 0) console.log(`frame ${i}/${N}`)
  }
  console.log(`frames done in ${((Date.now() - t0) / 1000).toFixed(1)}s — encoding…`)
  await browser.close()
  execSync(`${FF} -y -framerate 30 -i ${FR}/%04d.png -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -movflags +faststart ${OUT}`, { stdio: 'inherit' })
  console.log('encoded →', OUT)
})().catch((e) => { console.error(e); process.exit(1) })
