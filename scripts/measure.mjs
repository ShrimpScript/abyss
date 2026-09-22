import puppeteer from 'puppeteer-core'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome-stable', headless: 'new',
  args: ['--no-sandbox','--disable-gpu-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars'],
})
for (const vp of [{width:390,height:844,n:'phone'},{width:768,height:1024,n:'tablet'}]) {
  const page = await browser.newPage()
  await page.setViewport(vp)
  await page.goto('http://localhost:4180/?probe', { waitUntil: 'networkidle2' })
  await wait(2000)
  await page.evaluate(() => [...document.querySelectorAll('.gate__btn')].find(b=>b.textContent.includes('silence')).click())
  await wait(2200)
  await page.evaluate(() => { window.location.hash = 'd=2700' })
  await wait(2400)
  const m = await page.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); if (!e) return null
      const b = e.getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top), b: Math.round(b.bottom), w: Math.round(b.width), h: Math.round(b.height) } }
    return {
      vw: window.innerWidth,
      docScrollW: document.documentElement.scrollWidth,
      plate: r('#foreman'),
      frame: r('#foreman .plate__frame'),
      body: r('#foreman .plate__body'),
      rail: r('.rail'),
      zone: r('.hud__zone'),
      gauge: r('.hud__gauge'),
      top: r('.hud__top'),
    }
  })
  console.log(vp.n, JSON.stringify(m, null, 1))
  await page.close()
}
await browser.close()
