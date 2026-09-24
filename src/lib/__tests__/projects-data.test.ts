import { describe, expect, it } from 'vitest'
import { PROJECTS, PROJECT_BY_ID } from '../../data/projects'
import { MAX_DEPTH } from '../depth'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']

describe('project data', () => {
  it('has unique ids', () => {
    expect(new Set(PROJECTS.map((p) => p.id)).size).toBe(PROJECTS.length)
  })

  it('numbers specimens in order, with no gaps', () => {
    expect(PROJECTS.map((p) => p.specimen)).toEqual(ROMAN.slice(0, PROJECTS.length))
  })

  it('is ordered by depth, and inside the column', () => {
    for (let i = 0; i < PROJECTS.length; i++) {
      expect(PROJECTS[i].depth).toBeGreaterThan(0)
      expect(PROJECTS[i].depth).toBeLessThanOrEqual(MAX_DEPTH)
      if (i > 0) expect(PROJECTS[i].depth).toBeGreaterThan(PROJECTS[i - 1].depth)
    }
  })

  it('gives every project a distinct six-digit colour', () => {
    for (const p of PROJECTS) expect(p.color).toMatch(/^#[0-9a-f]{6}$/i)
    expect(new Set(PROJECTS.map((p) => p.color)).size).toBe(PROJECTS.length)
  })

  it('places each structure on one side or the other', () => {
    for (const p of PROJECTS) expect([-1, 1]).toContain(p.side)
  })

  it('gives every project its own set-piece', () => {
    expect(new Set(PROJECTS.map((p) => p.form)).size).toBe(PROJECTS.length)
  })

  it('only links over https', () => {
    for (const p of PROJECTS) {
      for (const l of p.links) {
        expect(l.href.startsWith('https://')).toBe(true)
        expect(l.label.length).toBeGreaterThan(0)
      }
    }
  })

  it('has real prose in every field', () => {
    for (const p of PROJECTS) {
      expect(p.tagline.length).toBeGreaterThan(20)
      expect(p.body.length).toBeGreaterThan(60)
      expect(p.hard.length).toBeGreaterThan(40)
      expect(p.stack.length).toBeGreaterThan(0)
    }
  })

  it('indexes every project by id', () => {
    for (const p of PROJECTS) expect(PROJECT_BY_ID[p.id]).toBe(p)
  })
})
