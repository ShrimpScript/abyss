import Lenis from 'lenis'
import { PROJECTS } from '../data/projects'
import {
  MAX_DEPTH,
  TOTAL_SCROLL_PX,
  clamp,
  depthToScroll,
  lampAuthorityAt,
  nearestProject,
  scrollToDepth,
  zoneAt,
} from './depth'
import { frame, getState, input, setState } from './store'

let lenis: Lenis | null = null
let detach: (() => void) | null = null

export function initDescent() {
  const reduced = getState().reduced

  lenis = new Lenis({
    lerp: reduced ? 1 : 0.075,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.6,
    smoothWheel: !reduced,
    autoRaf: false,
  })

  const onPointer = (e: PointerEvent) => {
    input.moved = true
    frame.cx = e.clientX
    frame.cy = e.clientY
    frame.px = (e.clientX / window.innerWidth) * 2 - 1
    frame.py = -((e.clientY / window.innerHeight) * 2 - 1)
  }
  const onDown = () => {
    holding = true
  }
  const onUp = () => {
    holding = false
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      warpTo(0)
      setState({ typed: '' })
      return
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
      const typed = (getState().typed + e.key.toLowerCase()).slice(-14)
      setState({ typed })
      const hit = PROJECTS.find((p) => typed.endsWith(p.id))
      if (hit) {
        warpTo(hit.depth)
        setState({ typed: '' })
      }
    } else if (e.key === 'Backspace') {
      setState({ typed: getState().typed.slice(0, -1) })
    }
  }

  window.addEventListener('pointermove', onPointer, { passive: true })
  window.addEventListener('pointerdown', onDown, { passive: true })
  window.addEventListener('pointerup', onUp, { passive: true })
  window.addEventListener('pointercancel', onUp, { passive: true })
  window.addEventListener('keydown', onKey)

  detach = () => {
    window.removeEventListener('pointermove', onPointer)
    window.removeEventListener('pointerdown', onDown)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
    window.removeEventListener('keydown', onKey)
    lenis?.destroy()
    lenis = null
  }
}

export function teardownDescent() {
  detach?.()
  detach = null
}

let holding = false
let lastScroll = 0
let warpUntil = 0

export function warpTo(depth: number, instant = false) {
  if (!lenis) return
  const target = clamp(depth, 0, MAX_DEPTH)
  if (instant) {
    const s = depthToScroll(target)
    lenis.scrollTo(s, { immediate: true, force: true })
    frame.scroll = s
    frame.depth = target
    return
  }
  const distance = Math.abs(target - frame.depth)
  const duration = clamp(0.9 + distance / 2600, 0.9, 3.1)
  warpUntil = performance.now() + duration * 1000
  setState({ warping: true })
  lenis.scrollTo(depthToScroll(target), {
    duration,
    easing: (t: number) => 1 - Math.pow(1 - t, 3),
  })
}

/**
 * Deep links. `#lectern` opens on that structure, `#d=4200` on a depth.
 * Anyone can share a link straight to a project instead of making people scroll for it.
 */
export function applyHash(instant: boolean) {
  const hash = window.location.hash.slice(1)
  if (!hash) return false
  const depthMatch = /^d=(\d+(?:\.\d+)?)$/.exec(hash)
  if (depthMatch) {
    warpTo(Number(depthMatch[1]), instant)
    return true
  }
  const hit = PROJECTS.find((p) => p.id === hash.toLowerCase())
  if (hit) {
    warpTo(hit.depth, instant)
    return true
  }
  return false
}

export function isLocked() {
  return getState().phase === 'gate'
}

let originMs = 0

/** Single clock. Called once per rendered frame from inside the Canvas. */
export function tickDescent(_elapsed: number, delta: number) {
  // Lenis animates against real rAF timestamps, so it gets performance.now() rather than
  // the renderer's clock. Everything else reads the same origin so the scene stays in step.
  const now = performance.now()
  if (originMs === 0) originMs = now
  frame.time = (now - originMs) / 1000

  if (!lenis) return
  lenis.raf(now)

  // Scroll leads; depth follows it. Nothing is smoothed a second time here, so the
  // structures in the water can never drift out of line with their panels.
  frame.scroll = clamp(lenis.scroll, 0, TOTAL_SCROLL_PX)
  frame.depth = scrollToDepth(frame.scroll)

  const dt = Math.max(delta, 1 / 240)
  frame.velocity = (frame.scroll - lastScroll) / dt
  lastScroll = frame.scroll

  const boostTarget = holding ? 1 : 0
  frame.boost += (boostTarget - frame.boost) * (1 - Math.pow(0.002, delta))

  frame.lamp = lampAuthorityAt(frame.depth)

  const zone = zoneAt(frame.depth)
  const active = nearestProject(frame.scroll)
  const s = getState()
  if (s.zoneId !== zone.id || s.active?.id !== active?.id) {
    setState({ zoneId: zone.id, active })
  }
  if (s.warping && performance.now() > warpUntil) setState({ warping: false })
}

export function getLenis() {
  return lenis
}
