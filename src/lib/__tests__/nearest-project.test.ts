import { describe, expect, it } from 'vitest'
import { beatScroll, nearestProject } from '../depth'
import { PROJECTS } from '../../data/projects'

describe('nearestProject', () => {
  it('finds each project at its own station', () => {
    for (const p of PROJECTS) {
      expect(nearestProject(beatScroll(p.id))?.id).toBe(p.id)
    }
  })

  it('returns nothing in open water', () => {
    expect(nearestProject(0)).toBeNull()
    const between = (beatScroll('tumble') + beatScroll('glaze')) / 2
    expect(nearestProject(between)).toBeNull()
  })

  it('respects the range argument', () => {
    const s = beatScroll('glaze')
    expect(nearestProject(s + 400, 500)?.id).toBe('glaze')
    expect(nearestProject(s + 400, 100)).toBeNull()
  })

  it('picks the closer of two neighbours', () => {
    const a = beatScroll('vantage')
    const b = beatScroll('tumble')
    expect(nearestProject(a + (b - a) * 0.1)?.id).toBe('vantage')
    expect(nearestProject(a + (b - a) * 0.9)?.id).toBe('tumble')
  })
})
