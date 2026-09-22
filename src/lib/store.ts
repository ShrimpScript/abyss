import { useSyncExternalStore } from 'react'
import type { Project } from '../data/projects'

/**
 * Per-frame values. Mutated by input handlers, read inside useFrame.
 * Deliberately outside React: nothing here should ever cause a re-render.
 */
export const frame = {
  /** Scroll position in pixels. The single source of truth for where we are. */
  scroll: 0,
  /** Depth in metres, derived from scroll. What every readout shows. */
  depth: 0,
  /** Pixels of scroll per second, signed. Drives particle streaking. */
  velocity: 0,
  /** Pointer in normalised device coords, -1..1. */
  px: 0,
  py: 0,
  /** Pointer in CSS pixels, for the DOM lamp mask. */
  cx: 0,
  cy: 0,
  /** 0..1, rises while the pointer is held down. Widens and brightens the beam. */
  boost: 0,
  /** 0..1, how much of the lighting the lamp is responsible for. */
  lamp: 0,
  /** Seconds since the scene started. */
  time: 0,
}

export type Phase = 'gate' | 'diving'

type Discrete = {
  phase: Phase
  sound: boolean
  zoneId: string
  /** The project currently in range, if any. */
  active: Project | null
  /** Set while a warp is in flight so the HUD can show it. */
  warping: boolean
  /** Typed characters buffered for the warp-by-name easter egg. */
  typed: string
  reduced: boolean
  /** Asset/scene readiness, 0..1. */
  loaded: number
}

let state: Discrete = {
  phase: 'gate',
  sound: false,
  zoneId: 'surface',
  active: null,
  warping: false,
  typed: '',
  reduced:
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  loaded: 0,
}

/** True on devices with a real hovering pointer. The lamp mechanic depends on one. */
export const FINE_POINTER =
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches

/** Set the first time the visitor actually moves a pointer. */
export const input = { moved: false }

const listeners = new Set<() => void>()

export function setState(patch: Partial<Discrete>) {
  let changed = false
  for (const k of Object.keys(patch) as (keyof Discrete)[]) {
    if (state[k] !== patch[k]) {
      changed = true
      break
    }
  }
  if (!changed) return
  state = { ...state, ...patch }
  for (const l of listeners) l()
}

export function getState(): Discrete {
  return state
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useStore<T>(select: (s: Discrete) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(state),
  )
}
