import puppeteer from 'puppeteer-core'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome-stable',
  headless: 'new',
  args: ['--no-sandbox','--disable-gpu-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
page.on('console', m => console.log('CONSOLE', m.type(), m.text()))
page.on('pageerror', e => console.log('PAGEERROR', e.message))
page.on('requestfailed', r => console.log('REQFAIL', r.url(), r.failure()?.errorText))
page.on('response', r => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()) })

await page.goto('http://localhost:4180', { waitUntil: 'networkidle2' })
await wait(2500)
console.log('BEFORE', await page.evaluate(() => ({
  phase: document.body.dataset.phase,
  scrollH: document.documentElement.scrollHeight,
  bodyH: document.body.scrollHeight,
  colH: document.querySelector('.column')?.getBoundingClientRect().height,
})))

await page.evaluate(() => [...document.querySelectorAll('.gate__btn')].find(b=>b.textContent.includes('silence')).click())
await wait(2500)
console.log('AFTER ENTER', await page.evaluate(() => ({
  phase: document.body.dataset.phase,
  scrollH: document.documentElement.scrollHeight,
  scrollY: window.scrollY,
  overflow: getComputedStyle(document.body).overflow,
  bodyHeight: getComputedStyle(document.body).height,
})))

await page.evaluate(() => { window.location.hash = 'd=4000' })
await wait(3000)
console.log('AFTER HASH', await page.evaluate(() => ({
  hash: location.hash,
  scrollY: window.scrollY,
  depthVar: getComputedStyle(document.documentElement).getPropertyValue('--depth'),
  hudDepth: document.querySelector('.hud__depth-value')?.textContent,
})))

await page.evaluate(() => window.scrollTo(0, 5000))
await wait(1500)
console.log('AFTER NATIVE SCROLL', await page.evaluate(() => ({
  scrollY: window.scrollY,
  depthVar: getComputedStyle(document.documentElement).getPropertyValue('--depth'),
})))
await browser.close()
