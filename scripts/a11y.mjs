// Checks the two paths that are easy to break: reduced motion, and keyboard only.
import puppeteer from 'puppeteer-core'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome-stable', headless: 'new',
  args: ['--no-sandbox','--disable-gpu-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars',
    '--blink-settings=primaryPointerType=4,availablePointerTypes=4,primaryHoverType=2,availableHoverTypes=2'],
})

// --- reduced motion ---
{
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  page.on('pageerror', (e) => console.log('REDUCED pageerror:', e.message))
  await page.goto('http://localhost:4180/?probe', { waitUntil: 'networkidle2' })
  await wait(2000)
  await page.evaluate(() => [...document.querySelectorAll('.gate__btn')].find(b=>b.textContent.includes('silence')).click())
  await wait(1800)
  await page.evaluate(() => { window.location.hash = 'd=5400' })
  await wait(2000)
  console.log('reduced motion:', await page.evaluate(() => ({
    depth: document.querySelector('.hud__depth-value')?.textContent,
    allLit: document.querySelectorAll('.plate').length === document.querySelectorAll('.plate.is-lit').length,
    beam: getComputedStyle(document.documentElement).getPropertyValue('--beam').trim(),
    cursorHidden: getComputedStyle(document.body).cursor,
  })))
  await page.screenshot({ path: '.shots/a11y-reduced.png' })
  await page.close()
}

// --- keyboard only ---
{
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  page.on('pageerror', (e) => console.log('KEYS pageerror:', e.message))
  await page.goto('http://localhost:4180/?probe', { waitUntil: 'networkidle2' })
  await wait(2000)
  console.log('gate focus starts on:', await page.evaluate(() => document.activeElement?.textContent?.trim()))
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')  // descend in silence
  await wait(2200)

  const reached = []
  for (let i = 0; i < 26; i++) {
    await page.keyboard.press('Tab')
    reached.push(await page.evaluate(() => {
      const a = document.activeElement
      return a?.className?.toString().split(' ')[0] + (a?.id ? '#' + a.id : '')
    }))
  }
  console.log('tab reaches plates:', reached.filter((r) => r.startsWith('plate#')).length)
  console.log('focus ring visible:', await page.evaluate(() => {
    const s = getComputedStyle(document.activeElement)
    return s.outlineStyle !== 'none' && s.outlineWidth !== '0px'
  }))

  // Typing a project name should warp to it.
  await page.keyboard.type('lectern', { delay: 45 })
  await wait(3400)
  console.log('typed warp ->', await page.evaluate(() => document.querySelector('.hud__depth-value')?.textContent))
  await page.keyboard.press('Escape')
  await wait(3600)
  console.log('escape surfaces ->', await page.evaluate(() => document.querySelector('.hud__depth-value')?.textContent))
  await page.close()
}
await browser.close()
