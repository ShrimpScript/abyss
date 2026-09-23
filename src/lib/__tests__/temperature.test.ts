import { describe, expect, it } from 'vitest'
import { MAX_DEPTH, temperatureAt } from '../depth'

describe('temperatureAt', () => {
  it('hits its anchor points', () => {
    expect(temperatureAt(0)).toBeCloseTo(19.4, 6)
    expect(temperatureAt(1000)).toBeCloseTo(4.4, 6)
    expect(temperatureAt(4000)).toBeCloseTo(1.8, 6)
  })

  it('interpolates between anchors', () => {
    const mid = temperatureAt(50)
    expect(mid).toBeLessThan(19.4)
    expect(mid).toBeGreaterThan(17.8)
  })

  it('falls steeply through the thermocline', () => {
    expect(temperatureAt(300) - temperatureAt(700)).toBeGreaterThan(4)
  })

  it('warms again in the trench, as compression makes it', () => {
    expect(temperatureAt(MAX_DEPTH)).toBeGreaterThan(temperatureAt(6000))
  })
})
