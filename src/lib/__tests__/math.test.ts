import { describe, expect, it } from 'vitest'
import { clamp, lerp, smoothstep } from '../depth'

describe('clamp', () => {
  it('passes values inside the range through', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('pins values outside it', () => {
    expect(clamp(-3, 0, 10)).toBe(0)
    expect(clamp(99, 0, 10)).toBe(10)
  })

  it('handles the degenerate range', () => {
    expect(clamp(5, 2, 2)).toBe(2)
  })
})

describe('lerp', () => {
  it('returns the endpoints', () => {
    expect(lerp(10, 20, 0)).toBe(10)
    expect(lerp(10, 20, 1)).toBe(20)
  })

  it('interpolates linearly', () => {
    expect(lerp(0, 100, 0.25)).toBeCloseTo(25, 10)
  })

  it('extrapolates rather than clamping', () => {
    expect(lerp(0, 10, 2)).toBeCloseTo(20, 10)
  })
})

describe('smoothstep', () => {
  it('pins outside the edges', () => {
    expect(smoothstep(0, 1, -5)).toBe(0)
    expect(smoothstep(0, 1, 5)).toBe(1)
  })

  it('is symmetric about the midpoint', () => {
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5, 10)
    expect(smoothstep(0, 1, 0.25) + smoothstep(0, 1, 0.75)).toBeCloseTo(1, 10)
  })

  it('has zero slope at both edges, which is the point of it', () => {
    const e = 1e-4
    expect(smoothstep(0, 1, e) / e).toBeLessThan(0.01)
    expect((1 - smoothstep(0, 1, 1 - e)) / e).toBeLessThan(0.01)
  })
})
