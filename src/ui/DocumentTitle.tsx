import { useEffect } from 'react'
import { ZONES } from '../lib/depth'
import { useStore } from '../lib/store'

const BASE = 'ShrimpScript — a descent'

/** Makes the tab findable once the page has scrolled out of sight. */
export function DocumentTitle() {
  const phase = useStore((s) => s.phase)
  const zoneId = useStore((s) => s.zoneId)
  const active = useStore((s) => s.active)

  useEffect(() => {
    if (phase === 'gate') {
      document.title = BASE
      return
    }
    const zone = ZONES.find((z) => z.id === zoneId)
    document.title = active
      ? `${active.name} — ${BASE}`
      : zone
        ? `${zone.name} — ${BASE}`
        : BASE
  }, [phase, zoneId, active])

  return null
}
