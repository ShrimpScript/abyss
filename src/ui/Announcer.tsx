import { ZONES, formatDepth } from '../lib/depth'
import { useStore } from '../lib/store'

/**
 * One polite live region for the whole descent. Depth is deliberately not announced —
 * it changes every frame and would never stop talking.
 */
export function Announcer() {
  const phase = useStore((s) => s.phase)
  const zoneId = useStore((s) => s.zoneId)
  const active = useStore((s) => s.active)

  if (phase === 'gate') return null

  const zone = ZONES.find((z) => z.id === zoneId)
  const message = active
    ? `${active.name}, ${formatDepth(active.depth)} metres. ${active.tagline}`
    : zone
      ? `${zone.name}, ${zone.latin}`
      : ''

  return (
    <p className="visually-hidden" role="status" aria-live="polite">
      {message}
    </p>
  )
}
