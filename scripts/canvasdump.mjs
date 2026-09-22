import puppeteer from 'puppeteer-core'
import { writeFileSync } from 'node:fs'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome-stable', headless: 'new',
  args: ['--no-sandbox','--disable-gpu-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars'],
})
const page = await browser.newPage()
await page.setViewport({ width: 900, height: 600 })
page.on('pageerror', e => console.log('PAGEERROR', e.message))
await page.goto('http://localhost:4180/?probe', { waitUntil: 'networkidle2' })
await wait(2500)

console.log('webgl support:', await page.evaluate(() => {
  const c = document.querySelector('canvas')
  const gl = c?.getContext('webgl2') || c?.getContext('webgl')
  return { has: !!c, ctx: !!gl, w: c?.width, h: c?.height,
           renderer: gl?.getParameter(gl.getExtension('WEBGL_debug_renderer_info')?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER),
           style: c ? getComputedStyle(c).opacity + ' z' + getComputedStyle(c).zIndex : null }
}))

await page.evaluate(() => [...document.querySelectorAll('.gate__btn')].find(b=>b.textContent.includes('silence')).click())
await wait(2500)

const data = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/png'))
writeFileSync('.shots/canvas-only.png', Buffer.from(data.split(',')[1], 'base64'))
console.log('canvas dumped, bytes:', data.length)

// Sample the middle of the canvas straight out of the framebuffer.
console.log('centre pixel:', await page.evaluate(() => {
  const c = document.querySelector('canvas')
  const gl = c.getContext('webgl2')
  const px = new Uint8Array(4)
  gl.readPixels(Math.floor(c.width/2), Math.floor(c.height/2), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px)
  return [...px]
}))
await browser.close()
