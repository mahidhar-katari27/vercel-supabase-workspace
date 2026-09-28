/* Full UI/UX/responsive/a11y audit — every route at 320/375/768/1024/1440,
 * dark-mode pass at 375/1440, contrast sampling, internal link crawl,
 * console errors, failed requests, tap targets, h1 hygiene.
 * Run: node scripts/ux-audit.js [url]   → prints grouped report, exit 1 on critical.
 */
const { chromium } = require('playwright')
const fs = require('fs')

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')
const ROUTES = ['/', '/dashboard', '/farm', '/start', '/crop-doctor', '/market', '/vehicles',
  '/schemes', '/community', '/planner', '/weather', '/finance', '/agrirent', '/bookings',
  '/map', '/aqua', '/poultry', '/dairy', '/marketplace', '/experts', '/learn',
  '/notifications', '/profile', '/admin', '/demo', '/auth', '/login', '/signup',
  '/forgot-password', '/onboarding']
const WIDTHS = [320, 375, 768, 1024, 1440]
const issues = { critical: [], overflow: [], clipped: [], contrast: [], a11y: [], links: [], tap: [], console: [], requests: [], h1: [] }
const seenErr = new Set()
function push(bucket, key, line) { if (!seenErr.has(bucket + key)) { seenErr.add(bucket + key); issues[bucket].push(line) } }

const INJECT = `(() => {
  const lum = (c) => { const [r,g,b] = c.map(v => { v/=255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4) })
    return 0.2126*r + 0.7152*g + 0.0722*b }
  const parse = (s) => { const m = s.match(/[\\d.]+/g); return m ? m.slice(0,4).map(Number) : null }
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05) }
  const path = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id
    const c = [...el.classList].filter(x => !x.startsWith('_')).slice(0,2).join('.')
    if (c) s += '.' + c
    let p = el.parentElement, d = 0
    while (p && p.tagName !== 'BODY' && d < 2) { s = p.tagName.toLowerCase() + (p.id ? '#'+p.id : '') + ' > ' + s; p = p.parentElement; d++ }
    return s }
  const out = { overflow: [], clipped: [], contrast: [], a11y: { noAlt: [], noName: [], noLabel: [], iconLink: [] }, tap: [], h1: document.querySelectorAll('h1').length, imgs: 0, lazy: 0 }
  const vw = window.innerWidth, vh = window.innerHeight
  const vis = (el) => { const r = el.getBoundingClientRect(); const st = getComputedStyle(el)
    return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none' && parseFloat(st.opacity) > 0.05 }
  const clips = (el) => { let p = el.parentElement
    while (p && p !== document.documentElement) { const ox = getComputedStyle(p).overflowX
      if (ox === 'hidden' || ox === 'auto' || ox === 'scroll' || ox === 'clip') return p
      p = p.parentElement }
    return null }
  const inScroller = (el) => { let p = el.parentElement
    while (p && p.tagName !== 'HTML') { const ox = getComputedStyle(p).overflowX
      if (ox === 'auto' || ox === 'scroll') return true
      p = p.parentElement } return false }
  const flagged = []
  for (const el of document.querySelectorAll('body *')) {
    if (!vis(el)) continue
    const st0 = getComputedStyle(el)
    if (st0.pointerEvents === 'none' || el.classList.contains('sr-only')) continue
    if (el.closest('.intro-overlay')) continue
    const r = el.getBoundingClientRect()
    if (r.top > vh * 3) continue
    if (r.right <= vw + 2 && r.left >= -2) continue
    if (inScroller(el)) continue
    if (flagged.some(f => f.contains(el))) continue
    flagged.push(el)
    const c = clips(el)
    const txt = (el.textContent || '').trim().slice(0, 40)
    if (c && c !== document.body) {
      if (!txt && el.tagName !== 'IMG') continue
      out.clipped.push(path(el) + ' [clipped by ' + path(c) + ']' + (txt ? ' "' + txt + '"' : ''))
    } else out.overflow.push(path(el) + (txt ? ' "' + txt + '"' : ''))
  }
  // contrast — direct-text leaf elements in viewport-ish area
  let n = 0
  for (const el of document.querySelectorAll('body *')) {
    if (n >= 60) break
    if (!vis(el) || el.getAttribute('aria-hidden') === 'true' || el.classList.contains('sr-only')) continue
    if (document.body.classList.contains('intro-active')) break
    const direct = [...el.childNodes].some(nd => nd.nodeType === 3 && nd.textContent.trim().length > 2)
    if (!direct) continue
    const r = el.getBoundingClientRect()
    if (r.top > vh * 2 || r.bottom < 0) continue
    const st = getComputedStyle(el)
    if (parseFloat(st.opacity) < 0.85) continue
    const fg = parse(st.color); if (!fg) continue
    let bg = null, node = el, imgBehind = false
    while (node && node !== document.documentElement) {
      const cs = getComputedStyle(node)
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && !bg) imgBehind = true
      const b = parse(cs.backgroundColor)
      if (b && (b[3] === undefined || b[3] > 0.5)) { bg = b.slice(0,3); break }
      node = node.parentElement
    }
    if (!bg) { const bb = parse(getComputedStyle(document.body).backgroundColor); bg = bb ? bb.slice(0,3) : [255,255,255] }
    if (imgBehind) continue
    const cr = ratio(fg.slice(0,3), bg)
    const size = parseFloat(st.fontSize), bold = parseInt(st.fontWeight) >= 700
    const large = size >= 24 || (size >= 18.66 && bold)
    if (cr < (large ? 3 : 4.5)) { out.contrast.push(cr.toFixed(2) + ':1 ' + path(el) + ' "' + (el.textContent||'').trim().slice(0,30) + '"'); n++ }
    n++
  }
  // a11y
  for (const im of document.querySelectorAll('img')) {
    out.imgs++
    if (im.loading === 'lazy') out.lazy++
    if (!im.hasAttribute('alt')) out.a11y.noAlt.push(path(im) + ' src=' + (im.getAttribute('src')||'').slice(0,50))
  }
  for (const b of document.querySelectorAll('button, [role="button"], input[type="submit"]')) {
    if (!vis(b)) continue
    const name = (b.getAttribute('aria-label') || b.textContent || b.getAttribute('title') || b.value || '').trim()
    if (!name) out.a11y.noName.push(path(b))
  }
  for (const i of document.querySelectorAll('input:not([type="hidden"]), select, textarea')) {
    if (!vis(i)) continue
    const id = i.id
    const hasLabel = id && document.querySelector('label[for="' + id + '"]')
    const wrapped = i.closest('label')
    if (!hasLabel && !wrapped && !i.getAttribute('aria-label') && !i.getAttribute('placeholder') && !i.getAttribute('title'))
      out.a11y.noLabel.push(path(i) + ' type=' + (i.type || i.tagName))
  }
  for (const a of document.querySelectorAll('a[href]')) {
    if (!vis(a)) continue
    const name = (a.getAttribute('aria-label') || a.textContent || '').trim()
    if (!name && !a.querySelector('img[alt]:not([alt=""])')) out.a11y.iconLink.push(path(a) + ' href=' + a.getAttribute('href'))
  }
  // tap targets (only meaningful at narrow widths)
  if (vw <= 430) {
    for (const el of document.querySelectorAll('button, a[href]')) {
      if (!vis(el) || el.classList.contains('sr-only')) continue
      const r = el.getBoundingClientRect()
      if (r.top > vh * 2) continue
      if (r.height < 30 || r.width < 30) out.tap.push(Math.round(r.width) + 'x' + Math.round(r.height) + ' ' + path(el) + ' "' + (el.textContent||'').trim().slice(0,20) + '"')
      if (out.tap.length > 10) break
    }
  }
  return out
})()`

;(async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 800 } })
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('agrismart-intro-seen', '1')
      sessionStorage.setItem('agrismart-intro-seen', '1')
    } catch {}
  })
  const page = await ctx.newPage()
  const collect = (pg, tag) => {
    pg.on('console', (m) => {
      if (m.type() === 'error') push('console', tag + m.text(), `[console] ${tag} ${m.text().slice(0, 150)}`)
    })
    pg.on('pageerror', (e) => { push('critical', tag + String(e), `[pageerror] ${tag} ${String(e).slice(0, 180)}`) })
    pg.on('response', (r) => {
      if (r.status() >= 400 && !r.url().includes('sockjs')) push('requests', r.url(), `[${r.status()}] ${tag} ${r.url().slice(0, 130)}`)
    })
    pg.on('requestfailed', (r) => {
      const u = r.url()
      if (!u.includes('open-meteo') && !u.includes('supabase')) push('requests', 'fail' + u, `[netfail] ${tag} ${u.slice(0, 130)}`)
    })
  }
  collect(page, '')

  const internalLinks = new Set()
  async function pass(route, width, theme) {
    const tag = `${route}@${width}${theme === 'dark' ? '/dark' : ''}`
    await page.setViewportSize({ width, height: 800 })
    if (theme) await page.evaluate((t) => { try { localStorage.setItem('agrismart-theme', t) } catch {} }, theme)
      .catch(() => {})
    let status = 0
    try {
      const resp = await page.goto(BASE + route, { waitUntil: 'load', timeout: 25000 })
      status = resp ? resp.status() : 0
    } catch (e) { push('critical', 'goto' + tag, `[goto] ${tag} ${String(e).slice(0, 120)}`); return }
    await page.waitForTimeout(700)
    // fire every whileInView animation, then re-measure from the top so
    // pre-animation offsets are not mistaken for layout overflow
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)) }
      window.scrollTo(0, 0)
    }).catch(() => {})
    await page.waitForTimeout(800)
    if (status >= 400) push('critical', 'status' + tag, `[${status}] ${tag}`)
    // gather links on the 1440 light pass only
    if (width === 1440 && !theme) {
      const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href'))).catch(() => [])
      for (const h of hrefs || []) {
        if (!h || h.startsWith('#') || h.startsWith('mailto') || h.startsWith('tel') || h.startsWith('javascript')) continue
        let u = h
        if (u.startsWith(BASE)) u = u.slice(BASE.length)
        if (!u.startsWith('/')) continue
        internalLinks.add(u.split('#')[0].split('?')[0] || '/')
      }
    }
    let res
    try { res = await page.evaluate(INJECT) } catch (e) { push('critical', 'eval' + tag, `[eval] ${tag} ${String(e).slice(0, 100)}`); return }
    if (!theme && width === 1440) {
      if (res.h1 === 0) push('h1', route, `no <h1> on ${route}`)
      else if (res.h1 > 1) push('h1', route, `${res.h1} <h1> elements on ${route}`)
    }
    for (const o of res.overflow) push('overflow', tag + o, `[overflow] ${tag} ${o}`)
    for (const c of res.clipped.slice(0, 4)) push('clipped', tag + c, `[clipped] ${tag} ${c}`)
    for (const c of res.contrast.slice(0, 6)) push('contrast', tag + c, `[contrast ${theme || 'light'}] ${tag} ${c}`)
    if (width === 375 && !theme) for (const t of res.tap.slice(0, 6)) push('tap', route + t, `[tap] ${route} ${t}`)
    if (!theme) {
      for (const x of res.a11y.noAlt.slice(0, 3)) push('a11y', route + x, `[no-alt] ${route} ${x}`)
      for (const x of res.a11y.noName.slice(0, 3)) push('a11y', route + x, `[no-name] ${route} ${x}`)
      for (const x of res.a11y.noLabel.slice(0, 3)) push('a11y', route + x, `[no-label] ${route} ${x}`)
      for (const x of res.a11y.iconLink.slice(0, 3)) push('a11y', route + x, `[icon-link] ${route} ${x}`)
    }
  }

  for (const r of ROUTES) {
    for (const w of WIDTHS) await pass(r, w, null)
    await pass(r, 375, 'dark')
    await pass(r, 1440, 'dark')
    process.stdout.write(`. ${r}\n`)
  }
  // reset theme for link crawl
  await page.evaluate(() => { try { localStorage.setItem('agrismart-theme', 'light') } catch {} }).catch(() => {})

  /* link crawl */
  const known = new Set(ROUTES.concat(['/reset-password']))
  for (const href of [...internalLinks].sort()) {
    if (known.has(href)) continue
    let status = 0
    try {
      const resp = await page.goto(BASE + href, { waitUntil: 'domcontentloaded', timeout: 15000 })
      status = resp ? resp.status() : 0
      await page.waitForTimeout(300)
    } catch { status = -1 }
    if (status !== 200) push('links', href, `[link ${status}] ${href}`)
    else known.add(href)
  }
  // also verify known routes were 200 (captured in pass via status>=400)

  await browser.close()
  const order = ['critical', 'links', 'console', 'requests', 'overflow', 'clipped', 'contrast', 'a11y', 'tap', 'h1']
  let total = 0
  const lines = []
  for (const k of order) {
    lines.push(`\n=== ${k.toUpperCase()} (${issues[k].length}) ===`)
    for (const l of issues[k].slice(0, 60)) lines.push('  ' + l)
    if (issues[k].length > 60) lines.push(`  ... +${issues[k].length - 60} more`)
    total += issues[k].length
  }
  const report = lines.join('\n')
  fs.writeFileSync('/tmp/ux-audit-report.txt', report)
  console.log(report)
  console.log(`\nTOTAL issues: ${total}`)
  if (issues.critical.length) process.exitCode = 1
})()
