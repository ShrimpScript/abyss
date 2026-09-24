import { describe, expect, it } from 'vitest'
import { TOTAL_SCROLL_PX, WORLD_PER_PX, worldYFromScroll } from '../depth'

describe('worldYFromScroll', () => {
  it('starts at the origin', () => {
    // Negative zero, so compare by value rather than by Object.is.
    expect(worldYFromScroll(0)).toBeCloseTo(0, 10)
  })

  it('descends, so deeper is further down', () => {
    expect(worldYFromScroll(1000)).toBeLessThan(0)
    expect(worldYFromScroll(2000)).toBeLessThan(worldYFromScroll(1000))
  })

  it('is exactly linear, so the fall rate never changes', () => {
    const a = worldYFromScroll(1000) - worldYFromScroll(0)
    const b = worldYFromScroll(9000) - worldYFromScroll(8000)
    expect(a).toBeCloseTo(b, 10)
  })

  it('uses the declared scale', () => {
    expect(worldYFromScroll(100)).toBeCloseTo(-100 * WORLD_PER_PX, 10)
  })

  it('keeps the whole column inside a sane world extent', () => {
    expect(Math.abs(worldYFromScroll(TOTAL_SCROLL_PX))).toBeLessThan(1000)
  })
})
