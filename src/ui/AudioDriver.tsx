import { useEffect, useRef } from 'react'
import { frame, useStore } from '../lib/store'
import { onFrame } from '../lib/frameBus'
import { creak, ping, updateAudio } from '../lib/audio'
import { smoothstep } from '../lib/depth'

/** Drives the synthesised bed from depth, and fires the one-shots at the right moments. */
export function AudioDriver() {
  const sound = useStore((s) => s.sound)
  const active = useStore((s) => s.active)
  const lastPinged = useRef<string | null>(null)

  useEffect(() => {
    if (!sound) return
    if (active && active.id !== lastPinged.current) {
      lastPinged.current = active.id
      ping(520 + (1 - active.depth / 11000) * 420)
    } else if (!active) {
      lastPinged.current = null
    }
  }, [active, sound])

  useEffect(() => {
    if (!sound) return
    let untilCreak = 6 + Math.random() * 8
    return onFrame((delta) => {
      updateAudio(frame.depth, Math.abs(frame.velocity))
      // The hull complains more as the pressure climbs.
      const stress = smoothstep(900, 10000, frame.depth)
      if (stress <= 0.02) return
      untilCreak -= delta * (0.4 + stress * 2.1)
      if (untilCreak <= 0) {
        creak(0.4 + stress)
        untilCreak = 5 + Math.random() * 11
      }
    })
  }, [sound])

  return null
}
