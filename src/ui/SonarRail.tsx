import { useEffect, useRef } from 'react'
import { PROJECTS } from '../data/projects'
import { MAX_DEPTH, ZONES, clamp, formatDepth } from '../lib/depth'
import { warpTo } from '../lib/descent'
import { frame, useStore } from '../lib/store'
import { onFrame } from '../lib/frameBus'
import { tick } from '../lib/audio'

/** The water column as an instrument. Also the way out of a long scroll. */
export function SonarRail() {
  const phase = useStore((s) => s.phase)
  const activeId = useStore((s) => s.active?.id)
  const sound = useStore((s) => s.sound)
  const marker = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return onFrame(() => {
      if (marker.current) {
        const p = clamp(frame.depth / MAX_DEPTH, 0, 1)
        marker.current.style.setProperty('--p', p.toFixed(5))
      }
    })
  }, [])

  if (phase === 'gate') return null

  const jump = (depth: number) => {
    if (sound) tick(1180)
    warpTo(depth)
  }

  return (
    <nav className="rail" aria-label="Water column">
      <span className="mono rail__cap">0</span>

      <div className="rail__track">
        {ZONES.slice(1).map((z) => (
          <span
            key={z.id}
            className="rail__zone"
            style={{ top: `${(z.from / MAX_DEPTH) * 100}%` }}
          >
            <i className="rail__zone-tick" />
            <span className="mono rail__zone-label">{z.latin}</span>
          </span>
        ))}

        {PROJECTS.map((p) => (
          <button
            key={p.id}
            className={`rail__blip${activeId === p.id ? ' is-active' : ''}`}
            style={
              { top: `${(p.depth / MAX_DEPTH) * 100}%`, '--c': p.color } as React.CSSProperties
            }
            onClick={() => jump(p.depth)}
            aria-label={`${p.name}, ${formatDepth(p.depth)} metres`}
          >
            <i />
            <span className="rail__blip-label mono">
              {p.name}
              <em>{formatDepth(p.depth)} m</em>
            </span>
          </button>
        ))}

        <div className="rail__marker" ref={marker} aria-hidden="true">
          <i />
        </div>
      </div>

      <span className="mono rail__cap">10,935</span>
    </nav>
  )
}
