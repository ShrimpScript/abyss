import { describe, expect, it } from 'vitest'
import { lampAuthorityAt } from '../depth'
import { PROJECTS } from '../../data/projects'

describe('lampAuthorityAt', () => {
  it('gives the sun full credit near the surface', () => {
    expect(lampAuthorityAt(0)).toBe(0)
    expect(lampAuthorityAt(700)).toBe(0)
  })

  it('hands over completely by the midnight zone', () => {
    expect(lampAuthorityAt(1400)).toBe(1)
    expect(lampAuthorityAt(4000)).toBe(1)
  })

  it('ramps smoothly rather than snapping', () => {
    const mid = lampAuthorityAt(1080)
    expect(mid).toBeGreaterThan(0.3)
    expect(mid).toBeLessThan(0.7)
  })

  it('never decreases', () => {
    let prev = -1
    for (let d = 0; d <= 2000; d += 20) {
      const v = lampAuthorityAt(d)
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
  })

  it('is fully handed over before the first structure in the dark', () => {
    const firstDark = PROJECTS.find((p) => p.depth > 1400)
    expect(firstDark).toBeDefined()
    expect(lampAuthorityAt(firstDark!.depth)).toBe(1)
  })
})
