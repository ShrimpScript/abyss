// Proves the lamp mechanic: with a real hovering pointer, deep content stays hidden
// until the beam sweeps it.
import puppeteer from 'puppeteer-core'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome-stable', headless: 'new',
  args: ['--no-sandbox','--disable-gpu-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars',
    '--blink-settings=primaryPointerType=4,availablePointerTypes=4,primaryHoverType=2,availableHoverTypes=2',],
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
const cdp = await page.createCDPSession()
await cdp.send('Emulation.setEmulatedMedia', {
  features: [{ name: 'hover', value: 'hover' }, { name: 'pointer', value: 'fine' }],
})
await page.goto('http://localhost:4180/?probe', { waitUntil: 'networkidle2' })
await wait(2200)
console.log('fine pointer seen by page:', await page.evaluate(
  () => matchMedia('(hover: hover) and (pointer: fine)').matches))

// Find the entry button rather than assuming where it sits — the hero layout moves.
const btn = await page.evaluate(() => {
  const b = [...document.querySelectorAll('.gate .btn')].find((x) =>
    x.textContent.includes('silence'),
  )
  if (!b) return null
  const r = b.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
})
if (!btn) throw new Error('no silent entry button on the gate')
await page.mouse.move(btn.x - 80, btn.y - 40)
await page.mouse.move(btn.x, btn.y, { steps: 8 })
await page.mouse.click(btn.x, btn.y)
await wait(2400)

// Park the beam in a far corner BEFORE travelling, or the plate is revealed in passing
// on its way up through the pointer.
await page.mouse.move(1400, 870, { steps: 10 })
await wait(400)
await page.evaluate(() => { window.location.hash = 'd=7300' })
await wait(3000)
const before = await page.evaluate(() => ({
  lit: document.querySelectorAll('.plate.is-lit').length,
  porthole: document.querySelector('#porthole')?.classList.contains('is-lit'),
}))
await page.screenshot({ path: '.shots/lamp-1-dark.png' })

// Sweep the beam across the plate.
for (const [x, y] of [[1000, 700], [700, 560], [420, 450], [330, 430]]) {
  await page.mouse.move(x, y, { steps: 10 })
  await wait(260)
}
await wait(1400)
const after = await page.evaluate(() => ({
  lit: document.querySelectorAll('.plate.is-lit').length,
  porthole: document.querySelector('#porthole')?.classList.contains('is-lit'),
}))
await page.screenshot({ path: '.shots/lamp-2-found.png' })
console.log('before sweep:', before)
console.log('after sweep :', after)
await browser.close()
