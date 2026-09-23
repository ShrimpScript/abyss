import { describe, expect, it } from 'vitest'
import { MAX_DEPTH, TOTAL_SCROLL_PX, depthToScroll, scrollToDepth } from '../depth'

describe('depth and scroll mapping', () => {
  it('round trips depth through scroll', () => {
    for (let d = 0; d <= MAX_DEPTH; d += 137) {
      expect(scrollToDepth(depthToScroll(d))).toBeCloseTo(d, 4)
    }
  })

  it('round trips scroll through depth', () => {
    for (let s = 0; s <= TOTAL_SCROLL_PX; s += 311) {
      expect(depthToScroll(scrollToDepth(s))).toBeCloseTo(s, 4)
    }
  })

  it('pins both endpoints', () => {
    expect(depthToScroll(0)).toBe(0)
    expect(scrollToDepth(0)).toBe(0)
    expect(depthToScroll(MAX_DEPTH)).toBeCloseTo(TOTAL_SCROLL_PX, 4)
  })

  it('is monotonic, so the readout never runs backwards', () => {
    let prev = -1
    for (let s = 0; s <= TOTAL_SCROLL_PX; s += 97) {
      const d = scrollToDepth(s)
      expect(d).toBeGreaterThanOrEqual(prev)
      prev = d
    }
  })

  it('clamps outside the column', () => {
    expect(scrollToDepth(-500)).toBe(0)
    expect(scrollToDepth(TOTAL_SCROLL_PX + 5000)).toBeCloseTo(MAX_DEPTH, 4)
    expect(depthToScroll(MAX_DEPTH + 1000)).toBeCloseTo(TOTAL_SCROLL_PX, 4)
  })
})
