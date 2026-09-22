// Real frame-time measurement. Headless Chrome on ANGLE/Vulkan reaches actual hardware,
// so these numbers mean something, unlike the SwiftShader path used for screenshots.
import puppeteer from 'puppeteer-core'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome-stable',
  headless: 'new',
  args: [
    '--no-sandbox',
    '--use-angle=vulkan',
    '--enable-features=Vulkan',
    '--use-gl=angle',
    '--ignore-gpu-blocklist',
    '--enable-webgl-draft-extensions',
    '--hide-scrollbars',
    '--blink-settings=primaryPointerType=4,availablePointerTypes=4,primaryHoverType=2,availableHoverTypes=2',
  ],
})
const page = await browser.newPage()
await page.setViewport({ width: 1600, height: 900 })
await page.goto('http://localhost:4180/', { waitUntil: 'networkidle2' })
await wait(2500)

console.log('gpu:', await page.evaluate(() => {
  const gl = document.createElement('canvas').getContext('webgl2')
  const i = gl?.getExtension('WEBGL_debug_renderer_info')
  return i ? gl.getParameter(i.UNMASKED_RENDERER_WEBGL) : 'unknown'
}))

await page.evaluate(() => [...document.querySelectorAll('.gate .btn')].find(b=>b.textContent.includes('silence')).click())
await wait(2200)
console.log('canvas:', await page.evaluate(() => {
  const c = document.querySelector('canvas')
  return `${c.width}x${c.height} @dpr ${devicePixelRatio}`
}))

const run = async (label, depth) => {
  await page.evaluate((d) => { window.location.hash = `d=${d}` }, depth)
  await wait(2600)
  const sample = page.evaluate(() => new Promise((resolve) => {
    const d = []
    let last = performance.now()
    const tick = (now) => {
      d.push(now - last)
      last = now
      if (d.length < 200) requestAnimationFrame(tick)
      else resolve(d.slice(12).sort((a, b) => a - b))
    }
    requestAnimationFrame(tick)
  }))
  // Sweep the lamp while sampling — that is the expensive case.
  for (let i = 0; i < 22; i++) {
    await page.mouse.move(800 + Math.sin(i / 3) * 460, 450 + Math.cos(i / 4) * 280)
    await wait(60)
  }
  const d = await sample
  const at = (q) => d[Math.floor(d.length * q)]
  console.log(
    `${label.padEnd(10)} p50 ${at(0.5).toFixed(1)}ms ${String(Math.round(1000 / at(0.5))).padStart(3)}fps` +
    `   p95 ${at(0.95).toFixed(1)}ms ${String(Math.round(1000 / at(0.95))).padStart(3)}fps`,
  )
}

await run('surface', 70)
await run('twilight', 760)
await run('midnight', 2700)
await run('abyss', 5400)
await run('lectern', 9800)
await browser.close()
