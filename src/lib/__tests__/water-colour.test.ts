import { describe, expect, it } from 'vitest'
import { MAX_DEPTH, waterColourAt } from '../depth'

const lum = ([r, g, b]: [number, number, number]) => 0.2126 * r + 0.7152 * g + 0.0722 * b

describe('waterColourAt', () => {
  it('stays inside the unit range everywhere', () => {
    for (let d = 0; d <= MAX_DEPTH; d += 250) {
      for (const c of waterColourAt(d)) {
        expect(c).toBeGreaterThanOrEqual(0)
        expect(c).toBeLessThanOrEqual(1)
      }
    }
  })

  it('only ever gets darker', () => {
    let prev = Infinity
    for (let d = 0; d <= MAX_DEPTH; d += 100) {
      const l = lum(waterColourAt(d))
      expect(l).toBeLessThanOrEqual(prev + 1e-9)
      prev = l
    }
  })

  it('loses red faster than blue, as water does', () => {
    const shallow = waterColourAt(50)
    const deep = waterColourAt(3000)
    expect(shallow[0] / shallow[2]).toBeGreaterThan(deep[0] / deep[2])
  })

  it('is blue-green dominant at every depth', () => {
    for (let d = 0; d <= MAX_DEPTH; d += 500) {
      const [r, g, b] = waterColourAt(d)
      expect(b).toBeGreaterThan(r)
      expect(g).toBeGreaterThan(r)
    }
  })
})
