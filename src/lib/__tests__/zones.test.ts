import { describe, expect, it } from 'vitest'
import { MAX_DEPTH, ZONES, zoneAt } from '../depth'

describe('zoneAt', () => {
  it('starts at the surface', () => {
    expect(zoneAt(0).id).toBe('surface')
  })

  it('picks the zone whose range contains the depth', () => {
    expect(zoneAt(100).id).toBe('epipelagic')
    expect(zoneAt(500).id).toBe('mesopelagic')
    expect(zoneAt(2000).id).toBe('bathypelagic')
    expect(zoneAt(5000).id).toBe('abyssopelagic')
    expect(zoneAt(9000).id).toBe('hadal')
  })

  it('treats each boundary as the start of the deeper zone', () => {
    for (const z of ZONES.slice(1)) {
      expect(zoneAt(z.from).id).toBe(z.id)
      expect(zoneAt(z.from - 1).id).not.toBe(z.id)
    }
  })

  it('holds at the deepest zone all the way to the floor', () => {
    expect(zoneAt(MAX_DEPTH).id).toBe('hadal')
  })

  it('covers the column without gaps', () => {
    for (let i = 1; i < ZONES.length; i++) {
      expect(ZONES[i].from).toBe(ZONES[i - 1].to)
    }
  })
})
