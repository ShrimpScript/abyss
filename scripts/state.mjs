import puppeteer from 'puppeteer-core'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome-stable', headless: 'new',
  args: ['--no-sandbox','--disable-gpu-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1000, height: 640 })
page.on('console', m => m.type()==='error' && console.log('ERR', m.text()))
page.on('pageerror', e => console.log('PAGEERROR', e.message, e.stack?.split('\n')[1]))
await page.goto('http://localhost:4180/?probe', { waitUntil: 'networkidle2' })
await wait(2200)
console.log('GATE ', await page.evaluate(() => window.__abyss))
await page.evaluate(() => [...document.querySelectorAll('.gate__btn')].find(b=>b.textContent.includes('silence')).click())
await wait(2200)
console.log('ENTER', await page.evaluate(() => window.__abyss))
await page.evaluate(() => { window.location.hash = 'd=340' })
await wait(2600)
console.log('340m ', await page.evaluate(() => window.__abyss))
await browser.close()
