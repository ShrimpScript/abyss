import { describe, expect, it } from 'vitest'
import { MAX_DEPTH, pressureAt } from '../depth'

describe('pressureAt', () => {
  it('is one atmosphere of air at the surface', () => {
    expect(pressureAt(0)).toBe(1)
  })

  it('adds one atmosphere per 10.06 m of seawater', () => {
    expect(pressureAt(10.06)).toBeCloseTo(2, 6)
    expect(pressureAt(1006)).toBeCloseTo(101, 6)
  })

  it('reaches roughly 1,088 atm at the bottom of the trench', () => {
    expect(Math.round(pressureAt(MAX_DEPTH))).toBe(1088)
  })

  it('increases without a ceiling', () => {
    expect(pressureAt(5000)).toBeGreaterThan(pressureAt(4999))
  })
})
