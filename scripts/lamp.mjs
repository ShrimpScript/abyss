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

await page.mouse.move(605, 562)
await page.mouse.click(834, 562)   // descend in silence
await wait(2400)
await page.evaluate(() => { window.location.hash = 'd=7300' })
await wait(2800)

// Park the pointer far from the plate.
await page.mouse.move(1380, 860)
await wait(1200)
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
