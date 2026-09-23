import { describe, expect, it } from 'vitest'
import { sunlightAt } from '../depth'

describe('sunlightAt', () => {
  it('is full at the surface', () => {
    expect(sunlightAt(0)).toBe(1)
    expect(sunlightAt(-5)).toBe(1)
  })

  it('is effectively gone past the photic zone', () => {
    expect(sunlightAt(200)).toBeLessThan(0.12)
    expect(sunlightAt(1000)).toBeLessThan(0.0001)
  })

  it('only ever decreases', () => {
    let prev = Infinity
    for (let d = 0; d <= 2000; d += 25) {
      const v = sunlightAt(d)
      expect(v).toBeLessThanOrEqual(prev)
      prev = v
    }
  })

  it('never reaches zero or goes negative', () => {
    expect(sunlightAt(10935)).toBeGreaterThan(0)
  })
})
