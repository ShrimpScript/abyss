type FrameFn = (delta: number) => void

const subs = new Set<FrameFn>()

/** Subscribe to the single render clock. Used by DOM that must stay locked to the 3D. */
export function onFrame(fn: FrameFn): () => void {
  subs.add(fn)
  return () => {
    subs.delete(fn)
  }
}

export function emitFrame(delta: number) {
  for (const fn of subs) fn(delta)
}
