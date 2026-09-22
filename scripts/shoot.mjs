// Drives the built site in headless Chrome and captures the states DESIGN.md calls proof.
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const BASE = process.env.BASE || 'http://localhost:4180'
const OUT = process.env.OUT || '.shots'
mkdirSync(OUT, { recursive: true })

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  phone: { width: 390, height: 844 },
}

// depth in metres, or null for the surface gate
const STOPS = [
  ['01-gate', null],
  ['02-sunlight', 70],
  ['03-vantage', 340],
  ['04-handover', 880],
  ['05-glaze', 1580],
  ['06-foreman', 2700],
  ['07-whereabouts', 3950],
  ['08-sightline', 5400],
  ['09-porthole', 7300],
  ['10-lectern', 9800],
  ['11-floor', 10935],
]

const only = process.argv[2]
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// Only the desktop pass pretends to have a hovering pointer; the narrow passes must
// behave like real touch devices, where content is simply visible.
const FINE = !only || only === 'desktop'

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome-stable',
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-gpu-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--hide-scrollbars',
    ...(FINE ? ['--blink-settings=primaryPointerType=4,availablePointerTypes=4,primaryHoverType=2,availableHoverTypes=2'] : []),
    '--force-device-scale-factor=1',
    ...(FINE ? ['--blink-settings=primaryPointerType=4,availablePointerTypes=4,primaryHoverType=2,availableHoverTypes=2'] : []),
  ],
})

const problems = []

for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
  if (only && only !== vpName) continue
  const page = await browser.newPage()
  await page.setViewport(vp)

  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`[${vpName}] console: ${m.text()}`)
  })
  page.on('pageerror', (e) => problems.push(`[${vpName}] pageerror: ${e.message}`))
  page.on('requestfailed', (r) =>
    problems.push(`[${vpName}] request failed: ${r.url()} ${r.failure()?.errorText}`),
  )

  await page.goto(`${BASE}/?probe`, { waitUntil: 'networkidle2', timeout: 60000 })
  await page.evaluate(() => document.fonts.ready)
  await wait(2500)

  for (const [name, depth] of STOPS) {
    if (depth === null) {
      await page.screenshot({ path: `${OUT}/${vpName}-${name}.png` })
      // Go under.
      const clicked = await page.evaluate(() => {
        const btns = [...document.querySelectorAll('.gate .btn')]
        const quiet = btns.find((b) => b.textContent?.includes('silence'))
        if (!quiet) return false
        quiet.click()
        return true
      })
      if (!clicked) problems.push(`[${vpName}] could not find the silent entry button`)
      await wait(2200)
      continue
    }

    await page.evaluate((d) => {
      window.location.hash = `d=${d}`
    }, depth)
    await wait(1900)

    // Sweep the lamp over whatever content is on screen, the way a visitor would.
    const target = await page.evaluate(() => {
      const el = [...document.querySelectorAll('.plate, .marker, .floor, .intro, .notice')].find(
        (n) => {
          const r = n.getBoundingClientRect()
          return r.top < window.innerHeight * 0.8 && r.bottom > window.innerHeight * 0.2
        },
      )
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    })
    const cx = target?.x ?? vp.width / 2
    const cy = target?.y ?? vp.height / 2
    await page.mouse.move(vp.width * 0.8, vp.height * 0.8)
    await page.mouse.move(cx, cy, { steps: 16 })
    await page.mouse.move(cx + 60, cy - 40, { steps: 6 })
    await wait(1500)

    const readout = await page.evaluate(() => ({
      depth: document.querySelector('.hud__depth-value')?.textContent,
      zone: document.querySelector('.hud__zone-name')?.textContent,
      pressure: document.querySelector('.hud__readouts dd span')?.textContent,
      lit: document.querySelectorAll('.is-lit').length,
    }))
    console.log(`${vpName} ${name.padEnd(16)} depth=${readout.depth} zone=${readout.zone} lit=${readout.lit}`)

    await page.screenshot({ path: `${OUT}/${vpName}-${name}.png` })
  }

  await page.close()
}

await browser.close()

if (problems.length) {
  console.log('\n--- PROBLEMS ---')
  for (const p of [...new Set(problems)]) console.log(p)
  process.exitCode = 1
} else {
  console.log('\nno console errors, no failed requests')
}
