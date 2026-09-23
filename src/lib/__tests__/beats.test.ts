import { describe, expect, it } from 'vitest'
import { BEATS, beatScroll } from '../depth'
import { PROJECTS } from '../../data/projects'

/** Must stay at or below MIN_GAP in depth.ts, and above the tallest content block. */
const MIN_GAP = 860

describe('scroll stations', () => {
  it('keeps every consecutive pair at least one block apart', () => {
    for (let i = 1; i < BEATS.length; i++) {
      const gap = BEATS[i].scroll - BEATS[i - 1].scroll
      expect(gap).toBeGreaterThanOrEqual(MIN_GAP)
    }
  })

  it('orders beats by depth', () => {
    for (let i = 1; i < BEATS.length; i++) {
      expect(BEATS[i].depth).toBeGreaterThanOrEqual(BEATS[i - 1].depth)
    }
  })

  it('gives every project a station', () => {
    for (const p of PROJECTS) {
      expect(beatScroll(p.id)).toBeGreaterThan(0)
    }
  })

  it('returns 0 for an unknown id rather than throwing', () => {
    expect(beatScroll('not-a-beat')).toBe(0)
  })
})
