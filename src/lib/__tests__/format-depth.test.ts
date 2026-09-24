import { describe, expect, it } from 'vitest'
import { formatDepth } from '../depth'

describe('formatDepth', () => {
  it('groups thousands', () => {
    expect(formatDepth(10935)).toBe('10,935')
    expect(formatDepth(1000)).toBe('1,000')
    expect(formatDepth(999)).toBe('999')
  })

  it('rounds to whole metres', () => {
    expect(formatDepth(1234.4)).toBe('1,234')
    expect(formatDepth(1234.6)).toBe('1,235')
  })

  it('never shows a negative depth', () => {
    expect(formatDepth(-1)).toBe('0')
    expect(formatDepth(-9999)).toBe('0')
  })

  it('shows zero at the surface', () => {
    expect(formatDepth(0)).toBe('0')
  })
})
